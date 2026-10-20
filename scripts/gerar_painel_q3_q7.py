"""Gera os dados das perguntas Q3 (índices do município × quem vence, 2024) e Q7 (viés
político na linha do tempo) para o app React: web/public/dados/q3.json e q7.json.

Lê as views de sql/17_q7_vies.sql e sql/21_q3_indices.sql. As duas perguntas são sobre o município, por isso saem do mesmo script; o mapa da Q7
reaproveita as malhas da Q4.

Pré-requisitos (da raiz do repositório):
    uv run python scripts/carregar_staging.py 13_ficha 15_espectro 16_indicadores 17_q7 21_q3

Uso:
    uv run python -m scripts.gerar_painel_q3_q7
"""

from __future__ import annotations

import csv
import os
from functools import cache
from pathlib import Path

import duckdb

from scripts.gerar_painel_q4 import CAPITAIS, mapa
from scripts.painel_web import gravar

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"

UFS = ["AM", "GO", "MA", "MT", "RS", "SE"]
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
    regua = con.execute("SELECT vl_mais_esquerda, vl_mais_direita, vl_meio FROM espectro_regua").fetchone()
    regioes: dict[int, list] = {}
    for uf, cd, nome, ano, n, vr, vf in con.execute(
        """SELECT sg_uf, cd_regiao_imediata, nm_regiao_imediata, ano, qt_municipios, vl_rodada, vl_fixa_2018
           FROM q7_vies_regiao ORDER BY sg_uf, nm_regiao_imediata, ano"""
    ).fetchall():
        r = regioes.setdefault(cd, [cd, nome, UFS.index(uf), n, [None] * 4, [None] * 4])
        r[4][ANOS.index(ano)], r[5][ANOS.index(ano)] = num(vr), num(vf)
    idx_regiao = {cd: i for i, cd in enumerate(regioes)}

    municipios: dict[int, list] = {}
    for cod, nome, uf, cd_reg, ano, vr, vf in con.execute(
        """SELECT cod_ibge, nm_municipio, sg_uf, cd_regiao_imediata, ano, vl_rodada, vl_fixa_2018
           FROM q7_vies_municipio ORDER BY sg_uf, nm_municipio, ano"""
    ).fetchall():
        m = municipios.setdefault(
            cod,
            [
                cod,
                nome,
                UFS.index(uf),
                idx_regiao.get(cd_reg, -1),
                1 if cod in CAPITAIS else 0,
                [None] * 4,
                [None] * 4,
                [],
            ],
        )
        m[5][ANOS.index(ano)], m[6][ANOS.index(ano)] = num(vr), num(vf)
    # prefeito eleito em 2020 e 2024: [sigla 2020, nota fixa, sigla 2024, nota fixa, mesmo partido (com fusões)]
    pref: dict[int, dict] = {}
    for cod, ano, sg, vr, vf in con.execute(
        "SELECT cod_ibge, ano, sg_partido, vl_rodada, vl_fixa_2018 FROM q7_prefeito"
    ).fetchall():
        pref.setdefault(cod, {})[ano] = (sg, num(vr, 2), num(vf, 2))
    for cod, m in municipios.items():
        p20, p24 = pref.get(cod, {}).get(2020), pref.get(cod, {}).get(2024)
        m[7] = [p20[0] if p20 else "", p20[2] if p20 else None, p24[0] if p24 else "", p24[2] if p24 else None]
        m[7].append(1 if p20 and p24 and sucessor_2024(p20[0]) == p24[0] else 0)

    # médias dos 6 estados e de cada UF, pesadas pelos votos (não a média das cidades)
    media: dict[str, list] = {}
    for uf, ano, vr, vf in con.execute(
        """SELECT coalesce(m.sg_uf, 'TODAS'), v.ano,
                  sum(v.qt_votos * v.vl_rodada) / sum(v.qt_votos) FILTER (WHERE v.vl_rodada IS NOT NULL),
                  sum(v.qt_votos * v.vl_fixa_2018) / sum(v.qt_votos) FILTER (WHERE v.vl_fixa_2018 IS NOT NULL)
           FROM q7_voto_partido AS v INNER JOIN modelo.municipio AS m USING (cod_ibge)
           WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
           GROUP BY GROUPING SETS ((m.sg_uf, v.ano), (v.ano))"""
    ).fetchall():
        par = media.setdefault(uf, [[None] * 4, [None] * 4])
        par[0][ANOS.index(ano)], par[1][ANOS.index(ano)] = num(vr), num(vf)

    # fatia de votos de cada família de partido, por UF e ano (o que puxou o movimento)
    familias: dict[str, dict[str, list]] = {}
    for uf, fam, ano, qt in con.execute(
        """SELECT coalesce(m.sg_uf, 'TODAS'), f.ds_familia, f.ano, sum(f.qt_votos)
           FROM q7_voto_familia AS f INNER JOIN modelo.municipio AS m USING (cod_ibge)
           WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
           GROUP BY GROUPING SETS ((m.sg_uf, f.ds_familia, f.ano), (f.ds_familia, f.ano))"""
    ).fetchall():
        familias.setdefault(uf, {}).setdefault(fam, [0] * 4)[ANOS.index(ano)] = int(qt)

    return {
        "ufs": UFS,
        "anos": ANOS,
        "regua": [num(regua[0], 2), num(regua[1], 2), num(regua[2])],
        "municipios": list(municipios.values()),
        "regioes": list(regioes.values()),
        "media": media,
        "familias": familias,
        "mapas": {uf: mapa(uf) for uf in UFS},
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
            cod, nome, UFS.index(uf), 1 if cod in CAPITAIS else 0,
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
        "ufs": UFS,
        "perfis": PERFIS,
        "regua": [num(r, 3) for r in regua],
        "partidos": partidos,
        "municipios": municipios,
    }


def main() -> None:
    os.chdir(RAIZ)
    con = duckdb.connect(str(BANCO), read_only=True)
    q7, q3 = dados_q7(con), dados_q3(con)
    con.close()
    gravar("q7.json", q7)
    gravar("q3.json", q3)


if __name__ == "__main__":
    main()
