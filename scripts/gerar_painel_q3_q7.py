"""Gera os dados das perguntas Q3 (índices do município × quem vence, 2024) e Q7 (viés
político na linha do tempo) para o app React: web/public/dados/q3.json e q7-brasil.json,
os dois com o país inteiro (27 UFs).

Lê as views de sql/17_q7_vies.sql e sql/21_q3_indices.sql. As duas perguntas são sobre o
município, por isso saem do mesmo script; os mapas vêm de scripts/gerar_malhas_web.py.
O q7.json antigo (6 estados) não é mais gerado: só o jogo da candidatura ainda o lê.

Pré-requisitos (da raiz do repositório):
    uv run python scripts/carregar_staging.py 13_ficha 15_espectro 16_indicadores 17_q7 21_q3

Uso:
    uv run python -m scripts.gerar_painel_q3_q7
"""

from __future__ import annotations

import csv
import os
import sys
from functools import cache
from pathlib import Path

import duckdb

from scripts.painel_web import CAPITAIS_BR, UFS_BR, gravar

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"

ANOS = [2018, 2020, 2022, 2024]
PERFIS = ["AGROPECUARIA", "ADMINISTRACAO PUBLICA", "SERVICOS E COMERCIO", "INDUSTRIA E OUTROS"]


def num(x: object, casas: int = 3) -> float | None:
    return None if x is None else round(float(x), casas)


@cache
def sucessoes_2021_2024() -> dict[str, str]:
    with open(RAIZ / "dados" / "referencia" / "partido_sucessao.csv", encoding="utf-8") as f:
        linhas = list(csv.DictReader(f, delimiter=";"))
    return {r["sg_partido"]: r["sg_sucessor"] for r in linhas if 2020 < int(r["ano_mudanca"]) <= 2024}


def sucessor_2024(sigla: str) -> str:
    """Sigla de 2024 do partido de 2020, seguindo as fusões e renomeações de 2021 a 2024
    (dados/referencia/partido_sucessao.csv, a mesma regra da Q6): PSL → UNIÃO não é troca."""
    regras = sucessoes_2021_2024()
    while sigla in regras:
        sigla = regras[sigla]
    return sigla


def dados_q7(con: duckdb.DuckDBPyConnection) -> dict:
    """Viés de cada cidade, região imediata, estado e do país nas quatro eleições, com a mesma
    régua em todas (rodada de 2018): o que muda de um ano para o outro é só o voto."""
    regua = con.execute("SELECT vl_mais_esquerda, vl_mais_direita, vl_meio FROM espectro_regua").fetchone()
    # as duas notas que servem de marco no chão do painel: o PT de Lula e o PL de Bolsonaro
    marcos = dict(
        con.execute(
            "SELECT sg_partido_tse, round(vl_ideologia, 2) FROM q7_nota_rodada2018 WHERE sg_partido_tse IN ('PT', 'PL')"
        ).fetchall()
    )
    regioes: dict[int, list] = {}
    for uf, cd, nome, ano, n, vf in con.execute(
        """SELECT sg_uf, cd_regiao_imediata, nm_regiao_imediata, ano, qt_municipios, vl_fixa_2018
           FROM q7_vies_regiao ORDER BY sg_uf, nm_regiao_imediata, ano"""
    ).fetchall():
        r = regioes.setdefault(cd, [cd, nome, UFS_BR.index(uf), n, [None] * 4])
        r[4][ANOS.index(ano)] = num(vf, 2)
    idx_regiao = {cd: i for i, cd in enumerate(regioes)}

    municipios: dict[int, list] = {}
    for cod, nome, uf, cd_reg, ano, vf in con.execute(
        """SELECT cod_ibge, nm_municipio, sg_uf, cd_regiao_imediata, ano, vl_fixa_2018
           FROM q7_vies_municipio ORDER BY sg_uf, nm_municipio, ano"""
    ).fetchall():
        m = municipios.setdefault(
            cod,
            [cod, nome, UFS_BR.index(uf), idx_regiao.get(cd_reg, -1), 1 if cod in CAPITAIS_BR else 0, [None] * 4, []],
        )
        m[5][ANOS.index(ano)] = num(vf, 2)
    # prefeito eleito em 2020 e 2024: [sigla 2020, nota, sigla 2024, nota, mesmo partido (com fusões)]
    pref: dict[int, dict] = {}
    for cod, ano, sg, vf in con.execute("SELECT cod_ibge, ano, sg_partido, vl_fixa_2018 FROM q7_prefeito").fetchall():
        pref.setdefault(cod, {})[ano] = (sg, num(vf, 2))
    for cod, m in municipios.items():
        p20, p24 = pref.get(cod, {}).get(2020), pref.get(cod, {}).get(2024)
        m[6] = [p20[0] if p20 else "", p20[1] if p20 else None, p24[0] if p24 else "", p24[1] if p24 else None]
        m[6].append(1 if p20 and p24 and sucessor_2024(p20[0]) == p24[0] else 0)

    # médias do país e de cada UF, pesadas pelos votos (não a média das cidades)
    media: dict[str, list] = {}
    for uf, ano, vf in con.execute(
        """SELECT coalesce(m.sg_uf, 'BR'), v.ano,
                  sum(v.qt_votos * v.vl_fixa_2018) / sum(v.qt_votos) FILTER (WHERE v.vl_fixa_2018 IS NOT NULL)
           FROM q7_voto_partido AS v INNER JOIN modelo.municipio AS m USING (cod_ibge)
           GROUP BY GROUPING SETS ((m.sg_uf, v.ano), (v.ano))"""
    ).fetchall():
        media.setdefault(uf, [None] * 4)[ANOS.index(ano)] = num(vf, 2)

    # fatia de votos de cada família de partido, por UF e ano (o que puxou o movimento)
    familias: dict[str, dict[str, list]] = {}
    for uf, fam, ano, qt in con.execute(
        """SELECT coalesce(m.sg_uf, 'BR'), f.ds_familia, f.ano, sum(f.qt_votos)
           FROM q7_voto_familia AS f INNER JOIN modelo.municipio AS m USING (cod_ibge)
           GROUP BY GROUPING SETS ((m.sg_uf, f.ds_familia, f.ano), (f.ds_familia, f.ano))"""
    ).fetchall():
        familias.setdefault(uf, {}).setdefault(fam, [0] * 4)[ANOS.index(ano)] = int(qt)

    return {
        "ufs": UFS_BR,
        "anos": ANOS,
        "regua": [num(regua[0], 2), num(regua[1], 2), num(regua[2])],
        "marcos": {"pt": float(marcos["PT"]), "pl": float(marcos["PL"])},
        "municipios": list(municipios.values()),
        "regioes": list(regioes.values()),
        "media": media,
        "familias": familias,
    }


def dados_q3(con: duckdb.DuckDBPyConnection) -> dict:
    regua = con.execute("SELECT vl_mais_esquerda, vl_mais_direita, vl_meio FROM espectro_regua").fetchone()
    partidos = {
        sg: [float(vl), cat]
        for sg, vl, cat in con.execute(
            """SELECT p.sg_partido, e.vl_ideologia, e.cd_espectro FROM modelo.espectro_partido AS e
               INNER JOIN modelo.partido AS p USING (ano, nr_partido) WHERE e.ano = 2024"""
        ).fetchall()
    }
    municipios = [
        [
            cod, nome, UFS_BR.index(uf), 1 if cod in CAPITAIS_BR else 0,
            num(pib, 0), PERFIS.index(perfil) if perfil in PERFIS else -1, pop, aptos,
            num(renda, 0), num(estudo, 1), sg_pref or "", sg_banc or "", qt_banc or 0, 1 if empate else 0,
            num(voto), num(eleit_hab), num(isentos, 2),
        ]
        for (
            cod, nome, uf, pib, perfil, pop, aptos, renda, estudo, sg_pref, sg_banc, qt_banc, empate, voto, eleit_hab, isentos,
        ) in con.execute(
            """SELECT cod_ibge, nm_municipio, sg_uf, vr_pib_per_capita, ds_perfil, qt_populacao, qt_aptos,
                      vr_renda_media_pc, nr_anos_estudo, sg_prefeito, sg_maior_bancada, qt_maior_bancada,
                      fl_empate_bancada, vl_voto, vl_eleitores_por_habitante, pc_isentos
               FROM q3_municipio ORDER BY sg_uf, nm_municipio"""
        ).fetchall()
    ]  # fmt: skip
    return {
        "ufs": UFS_BR,
        "perfis": PERFIS,
        "regua": [num(r, 3) for r in regua],
        "partidos": partidos,
        "municipios": municipios,
    }


def main() -> None:
    os.chdir(RAIZ)
    con = duckdb.connect(str(BANCO), read_only=True)
    # `python -m scripts.gerar_painel_q3_q7 q3` gera só a Q3 (ou só a q7)
    quais = set(sys.argv[1:]) or {"q3", "q7"}
    if "q7" in quais:
        gravar("q7-brasil.json", dados_q7(con))
    if "q3" in quais:
        gravar("q3.json", dados_q3(con))
    con.close()


if __name__ == "__main__":
    main()
