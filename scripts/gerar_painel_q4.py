"""Gera os dados da pergunta de escolaridade (Q4) para o app React, com o Brasil inteiro:

    web/public/dados/q4.json        o país: perfil e chance por estado, e o resumo das cidades
    web/public/dados/q4/<UF>.json   cada estado: os municípios e os eleitos de 2022 e 2024

Os mapas são os de web/public/dados/malhas/ (scripts/gerar_malhas_web.py).

Pré-requisitos (da raiz do repositório):
    uv run python -m scripts.coleta.coleta_tse candidatos municipio_tse_ibge
    uv run python -m scripts.coleta.coleta_ibge sidra
    uv run python scripts/carregar_staging.py 00_modelo 06_carga_nucleo 10_q4

Uso:
    uv run python -m scripts.gerar_painel_q4
"""

from __future__ import annotations

import os
import statistics
from pathlib import Path

import duckdb

from scripts.painel_web import CAPITAIS_BR, UFS_BR, gravar

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"

GRUPO = {"População 18+ (Censo 2022)": 0, "Candidatos": 1, "Eleitos": 2}

# Nome de urna: fora do DER (o dicionário o deixa de fora), então vem do arquivo do
# TSE pela chave da candidatura. O nome civil vem de POLITICO, no modelo.
SQL_ELEITOS = """
WITH urna AS (
    SELECT
        ano_eleicao::INTEGER AS ano,
        sg_ue,
        cd_cargo::INTEGER AS cd_cargo,
        sq_candidato::BIGINT AS sq_candidato,
        any_value(nm_urna_candidato) AS nm_urna
    FROM read_csv(
        'dados/raw/candidatos/*/candidatos_[0-9]*/consulta_cand_[0-9]*_??.csv',
        delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
        all_varchar = TRUE, union_by_name = TRUE
    )
    WHERE cd_tipo_eleicao = '2'
    GROUP BY ALL
)
SELECT
    q.ano,
    q.sg_uf,
    coalesce(q.cod_ibge, 0),
    q.cd_cargo,
    q.cd_grau_instrucao,
    coalesce(u.nm_urna, p.nm_candidato),
    pa.sg_partido,
    p.nm_candidato,
    c.sq_candidato  -- abre a ficha do eleito na aba Candidatos
FROM q4_candidatura AS q
INNER JOIN modelo.candidatura AS c ON q.id_candidatura = c.id_candidatura
LEFT JOIN modelo.politico AS p ON c.nr_titulo_eleitoral = p.nr_titulo_eleitoral
LEFT JOIN modelo.partido AS pa ON c.ano = pa.ano AND c.nr_partido = pa.nr_partido
LEFT JOIN urna AS u
    ON c.ano = u.ano AND c.sg_ue = u.sg_ue AND c.cd_cargo = u.cd_cargo AND c.sq_candidato = u.sq_candidato
WHERE q.fl_eleito AND q.ano IN (2022, 2024)  -- a lista de nomes fica nas eleições com resultado final
ORDER BY 1, 2, 4, 5 DESC, 6
"""


def municipios(con: duckdb.DuckDBPyConnection) -> dict[int, dict]:
    mun = {}
    for cod, nome, uf, ver, empate in con.execute(
        "SELECT cod_ibge, nm_municipio, sg_uf, qt_vereadores_eleitos, fl_empate_eleitos FROM q4_municipio"
    ).fetchall():
        mun[cod] = {"n": nome, "u": uf, "ver": ver, "pop": [0] * 4, "el": [0] * 4, "g": [0] * 8, "pref": None}
        mun[cod]["emp"] = bool(empate)
    for cod, nivel, qt_pop, qt_el in con.execute(
        "SELECT cod_ibge, cd_nivel, qt_populacao, qt_eleitos FROM q4_municipio_nivel"
    ).fetchall():
        mun[cod]["pop"][nivel - 1] = int(qt_pop)
        mun[cod]["el"][nivel - 1] = int(qt_el)
    for cod, grau, cargo, qt in con.execute(
        """SELECT cod_ibge, cd_grau_instrucao, cd_cargo, count(*) FROM q4_candidatura
           WHERE ano = 2024 AND fl_eleito AND cd_cargo IN (11, 13) GROUP BY ALL"""
    ).fetchall():
        mun[cod]["g"][grau - 1] += qt
        if cargo == 11:
            mun[cod]["pref"] = grau
    for m in mun.values():
        if sum(m["pop"]) == 0:  # sem Censo (criado depois de 2022)
            m["pop"] = None
    for cod in CAPITAIS_BR & mun.keys():
        mun[cod]["cap"] = 1
    return mun


def cidades(mun: list[dict]) -> list[float | int | None]:
    """Cidades com mais gente formada elegem mais gente formada? [nº de cidades, % de eleitos com
    faculdade no quinto menos formado, no quinto mais formado, correlação, correlação sem o quinto
    mais formado]. Só entram cidades com Censo e com resultado de vereador."""
    pontos = sorted(
        (100 * m["pop"][3] / sum(m["pop"]), 100 * m["el"][3] / sum(m["el"]))
        for m in mun
        if m["pop"] and m["ver"] > 0 and sum(m["el"]) > 0
    )
    k = len(pontos) // 5

    def media(ps: list[tuple[float, float]]) -> float | None:
        return round(statistics.fmean(y for _, y in ps), 1) if ps else None

    def r(ps: list[tuple[float, float]]) -> float | None:
        if len(ps) < 3 or len({x for x, _ in ps}) < 2 or len({y for _, y in ps}) < 2:
            return None
        return round(statistics.correlation([x for x, _ in ps], [y for _, y in ps]), 3)

    return [
        len(pontos),
        media(pontos[:k]),
        media(pontos[len(pontos) - k :] if k else []),
        r(pontos),
        r(pontos[: len(pontos) - k]),
    ]


def main() -> None:
    os.chdir(RAIZ)  # os caminhos do read_csv são relativos à raiz
    con = duckdb.connect(str(BANCO), read_only=True)
    con.execute("INSTALL encodings; LOAD encodings;")
    eleitos = [list(r) for r in con.execute(SQL_ELEITOS).fetchall()]
    mun = municipios(con)
    pais = {
        "ufs": UFS_BR,
        "perfil": [
            [ano, uf, GRUPO[grupo], nivel, int(qt)]
            for ano, uf, grupo, nivel, qt in con.execute(
                "SELECT ano, sg_uf, grupo, cd_nivel, qt FROM q4_perfil_uf ORDER BY 1, 2, 3, 4"
            ).fetchall()
        ],
        "chance": [
            list(r)
            for r in con.execute(
                """SELECT ano, sg_uf, cd_cargo, cd_grau_instrucao, count(*), count(*) FILTER (WHERE fl_eleito)
                   FROM q4_candidatura GROUP BY ALL ORDER BY 1, 2, 3, 4"""
            ).fetchall()
        ],
        "cidades": {
            "BR": cidades(list(mun.values())),
            **{uf: cidades([m for m in mun.values() if m["u"] == uf]) for uf in UFS_BR},
        },
        # exceções citadas em "Notas e fontes": o DF não tem eleição municipal e fica de fora da conta
        "excecoes": {
            "semPrefeito": sum(1 for m in mun.values() if m["pref"] is None and m["u"] != "DF"),
            "semVereador": sum(1 for m in mun.values() if m["ver"] == 0 and m["u"] != "DF"),
            "semCenso": sorted(f"{m['n']} ({m['u']})" for m in mun.values() if m["pop"] is None),
        },
    }
    con.close()

    gravar("q4.json", pais)
    for uf in UFS_BR:
        gravar(
            f"q4/{uf}.json",
            {
                "uf": uf,
                "mun": {cod: m for cod, m in mun.items() if m["u"] == uf},
                "eleitos": [e for e in eleitos if e[1] == uf],
            },
        )
    print(f"{len(eleitos)} eleitos, {len(mun)} municípios; exceções: {pais['excecoes']}")


if __name__ == "__main__":
    main()
