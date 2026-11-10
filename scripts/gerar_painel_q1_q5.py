"""Gera os dados das perguntas Q1 (custo da cadeira) e Q5 (eleitos por voto de legenda) para
o app React: web/public/dados/q1.json e q5.json.

Lê as views de sql/22_q1_custo_cadeira.sql e sql/23_q5_voto_legenda.sql (Davi).

Pré-requisitos (da raiz do repositório):
    uv run python -m scripts.coleta.coleta_tse candidatos recorte_remoto --uf AM,GO,MA,MT,RS,SE
    uv run python -m scripts.coleta.coleta_ibge ipca
    uv run python scripts/carregar_staging.py

Uso:
    uv run python -m scripts.gerar_painel_q1_q5
"""

from __future__ import annotations

import os

import duckdb

from scripts.gerar_painel_q2_q6 import CARGOS_Q2
from scripts.gerar_painel_q3_q7 import BANCO, RAIZ, UFS, num
from scripts.painel_web import gravar

CARGOS_Q5 = ["VEREADOR", "DEPUTADO ESTADUAL", "DEPUTADO FEDERAL"]


def dados_q1(con: duckdb.DuckDBPyConnection) -> dict:
    # uma linha por eleição × cargo × UE: a página soma para o filtro (custo = soma do gasto ÷ soma das vagas)
    # [ano, cargo, uf, cod_ibge (0 nos cargos estaduais), nome da UE, vagas, candidatos, eleitos,
    #  despesa, despesa dos eleitos, dinheiro público], em reais da época
    ues = [
        [ano, CARGOS_Q2.index(cargo), UFS.index(uf), cod or 0, nome, vagas, cand, eleitos,
         num(desp, 0), num(desp_e, 0), num(pub, 0)]
        for ano, cargo, uf, cod, nome, vagas, cand, eleitos, desp, desp_e, pub in con.execute(
            """SELECT ano, ds_cargo, sg_uf, cod_ibge, nm_ue, qt_vaga, qt_candidatos, qt_eleitos,
                      coalesce(vr_despesa, 0), vr_despesa_eleitos, coalesce(vr_publico, 0)
               FROM q1_custo_ue
               WHERE fl_divulgado AND ds_cargo IN ('VEREADOR', 'PREFEITO', 'DEPUTADO ESTADUAL',
                     'DEPUTADO FEDERAL', 'GOVERNADOR', 'SENADOR')
               ORDER BY ano, ds_cargo, sg_uf, nm_ue"""
        ).fetchall()
    ]  # fmt: skip
    # multiplicador para reais de agosto de 2024 (IPCA), por ano
    ipca = {
        str(ano): num(fator, 6)
        for ano, fator in con.execute(
            "SELECT ano, fator_2024 FROM q10_ipca WHERE ano IN (SELECT DISTINCT ano FROM q1_custo_ue)"
        ).fetchall()
    }
    return {"ufs": UFS, "cargos": CARGOS_Q2, "ues": ues, "ipca": ipca}


def dados_q5(con: duckdb.DuckDBPyConnection) -> dict:
    # [ano, uf, cargo, partido, eleitos, eleitos pela legenda, votos nominais, votos de legenda do partido]
    partidos = [
        [ano, UFS.index(uf), CARGOS_Q5.index(cargo), partido, eleitos, legenda, int(nominais), int(vl)]
        for ano, uf, cargo, partido, eleitos, legenda, nominais, vl in con.execute(
            """SELECT ano, sg_uf, ds_cargo, sg_partido, qt_eleitos, qt_eleitos_legenda, qt_votos_nominais,
                      qt_votos_legenda
               FROM q5_partido WHERE fl_divulgado ORDER BY ano, sg_uf, ds_cargo, sg_partido"""
        ).fetchall()
    ]
    # quem a legenda pôs e quem ela tirou: [ano, uf, cargo, nome da UE, candidato, partido, lista,
    # partidos na lista, votos, 1 = eleito pela legenda / 0 = ficou fora por causa dela]
    afetados = [
        [ano, UFS.index(uf), CARGOS_Q5.index(cargo), ue, nome, partido, lista, npart, int(votos), int(efeito)]
        for ano, uf, cargo, ue, nome, partido, lista, npart, votos, efeito in con.execute(
            """SELECT ano, sg_uf, ds_cargo, nm_ue, nm_candidato, sg_partido, sg_lista, qt_partidos, qt_votos,
                      tp_efeito = 'ELEITO PELA LEGENDA'
               FROM q5_eleito_legenda WHERE fl_divulgado
               ORDER BY ano, sg_uf, ds_cargo, nm_ue, tp_efeito, qt_votos DESC"""
        ).fetchall()
    ]
    return {"ufs": UFS, "cargos": CARGOS_Q5, "partidos": partidos, "afetados": afetados}


def main() -> None:
    os.chdir(RAIZ)
    con = duckdb.connect(str(BANCO), read_only=True)
    q1, q5 = dados_q1(con), dados_q5(con)
    con.close()
    gravar("q1.json", q1)
    gravar("q5.json", q5)


if __name__ == "__main__":
    main()
