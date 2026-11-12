"""Gera os dados das perguntas Q8 (dinheiro público) e Q9 (propaganda) para o app
React: web/public/dados/q8.json e q9.json.

Lê só o banco (dados/processed/tse.duckdb): as views q8_* e q9_* de
sql/11_q8_publico.sql e sql/12_q9_propaganda.sql. As duas perguntas vêm da
prestação de contas, por isso saem do mesmo script; cada página recebe só os
dados dela.

Pré-requisitos (da raiz do repositório):
    uv run scripts/carregar_staging.py            # 00 a 05, 11_q8 e 12_q9

Atenção: os q8.json e q9.json do repositório guardam os números publicados por
Enrico. O banco atual já tem as atualizações posteriores do TSE, e rodar este script
troca os números publicados pelos do banco (1 ou 2 candidatos por linha).

A Q8 usa o país inteiro (27 UFs). A Q9 segue nos 6 estados até ser migrada: as consultas
dela filtram esses estados, porque as views já têm o país.

Uso:
    uv run python -m scripts.gerar_painel_q8_q9        # as duas
    uv run python -m scripts.gerar_painel_q8_q9 q8     # só a Q8 (não toca no q9.json)
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import duckdb

from scripts.painel_web import UFS_BR, gravar

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"

# a Q9 ainda está nos 6 estados
UFS = ["AM", "GO", "MA", "MT", "RS", "SE"]
SO_6_UFS = "sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')"
CARGOS = ["VEREADOR", "PREFEITO", "DEPUTADO ESTADUAL", "DEPUTADO FEDERAL", "SENADOR", "GOVERNADOR"]
# do maior ao menor valor no período (ordem fixa: a cor e a posição seguem o canal)
CANAIS = ["IMPRESSO", "RUA", "RADIO E TV", "ADESIVO", "DIGITAL", "JINGLE", "CARRO DE SOM", "JORNAL E REVISTA"]
# nuvem: quantas palavras guardar por combinação de filtros
TOP_TERMOS = 40

# Índices "todos" nas chaves da nuvem: UF 6, eleito 2, canal 8.
SQL_TERMOS = f"""
WITH g AS (
    SELECT
        ano,
        ds_cargo,
        coalesce(sg_uf, 'TODAS') AS sg_uf,
        CASE WHEN fl_eleito IS NULL THEN 2 ELSE fl_eleito::INTEGER END AS eleito,
        coalesce(ds_canal, 'TODOS') AS ds_canal,
        ds_termo,
        sum(qt_despesas) AS qt,
        sum(vr_despesa) AS vr
    FROM q9_termo
    WHERE {SO_6_UFS}
    GROUP BY GROUPING SETS (
        (ano, ds_cargo, ds_termo, sg_uf, fl_eleito, ds_canal),
        (ano, ds_cargo, ds_termo, sg_uf, fl_eleito),
        (ano, ds_cargo, ds_termo, sg_uf, ds_canal),
        (ano, ds_cargo, ds_termo, sg_uf),
        (ano, ds_cargo, ds_termo, fl_eleito, ds_canal),
        (ano, ds_cargo, ds_termo, fl_eleito),
        (ano, ds_cargo, ds_termo, ds_canal),
        (ano, ds_cargo, ds_termo)
    )
)
SELECT *
FROM g
QUALIFY row_number() OVER (
    PARTITION BY ano, ds_cargo, sg_uf, eleito, ds_canal ORDER BY qt DESC, ds_termo
) <= {TOP_TERMOS}
ORDER BY ano, ds_cargo, sg_uf, eleito, ds_canal, qt DESC, ds_termo
"""

# total de despesas com descrição em cada combinação (o denominador do "% das despesas")
SQL_TOTAIS = f"""
SELECT
    ano,
    ds_cargo,
    coalesce(sg_uf, 'TODAS') AS sg_uf,
    CASE WHEN fl_eleito IS NULL THEN 2 ELSE fl_eleito::INTEGER END AS eleito,
    coalesce(ds_canal, 'TODOS') AS ds_canal,
    count(*) AS qt
FROM q9_despesa
WHERE {SO_6_UFS}
GROUP BY GROUPING SETS (
    (ano, ds_cargo, sg_uf, fl_eleito, ds_canal),
    (ano, ds_cargo, sg_uf, fl_eleito),
    (ano, ds_cargo, sg_uf, ds_canal),
    (ano, ds_cargo, sg_uf),
    (ano, ds_cargo, fl_eleito, ds_canal),
    (ano, ds_cargo, fl_eleito),
    (ano, ds_cargo, ds_canal),
    (ano, ds_cargo)
)
"""


def chave(ano: int, cargo: str, uf: str, eleito: int, canal: str) -> str:
    u = 6 if uf == "TODAS" else UFS.index(uf)
    c = 8 if canal == "TODOS" else CANAIS.index(canal)
    return f"{ano}|{CARGOS.index(cargo)}|{u}|{eleito}|{c}"


def dados_q8(con: duckdb.DuckDBPyConnection) -> dict:
    q8 = [
        [ano, UFS_BR.index(uf), CARGOS.index(cargo), faixa, int(n), int(e)]
        for ano, uf, cargo, faixa, n, e in con.execute(
            """SELECT ano, sg_uf, ds_cargo, nr_faixa, qt_candidatos, qt_eleitos
               FROM q8_faixa ORDER BY 1, 2, 3, 4"""
        ).fetchall()
    ]
    return {"ufs": UFS_BR, "cargos": CARGOS, "q8": q8}


def dados_q9(con: duckdb.DuckDBPyConnection) -> dict:
    q9c = [
        [ano, UFS.index(uf), CARGOS.index(cargo), int(el), CANAIS.index(canal), int(nc), int(nd), round(float(vr))]
        for ano, uf, cargo, el, canal, nc, nd, vr in con.execute(
            f"""SELECT ano, sg_uf, ds_cargo, fl_eleito, ds_canal, qt_candidatos, qt_despesas, vr_despesa
               FROM q9_canal WHERE {SO_6_UFS} ORDER BY 1, 2, 3, 4, 5"""
        ).fetchall()
    ]

    termos: list[str] = []
    indice: dict[str, int] = {}
    q9t: dict[str, list[list[int]]] = {}
    for ano, cargo, uf, eleito, canal, termo, qt, vr in con.execute(SQL_TERMOS).fetchall():
        if termo not in indice:
            indice[termo] = len(termos)
            termos.append(termo)
        grupo = q9t.setdefault(chave(ano, cargo, uf, eleito, canal), [[], [], []])
        grupo[0].append(indice[termo])
        grupo[1].append(int(qt))
        grupo[2].append(round(float(vr)))

    q9tot = {
        chave(ano, cargo, uf, eleito, canal): int(qt)
        for ano, cargo, uf, eleito, canal, qt in con.execute(SQL_TOTAIS).fetchall()
    }
    print(f"nuvem: {len(termos)} termos, {len(q9t)} grupos")
    return {
        "ufs": UFS,
        "cargos": CARGOS,
        "canais": CANAIS,
        "q9c": q9c,
        "termos": termos,
        "q9t": q9t,
        "q9tot": q9tot,
        "top": TOP_TERMOS,
    }


def main() -> None:
    os.chdir(RAIZ)  # o staging lê os CSV por caminho relativo à raiz
    con = duckdb.connect(str(BANCO), read_only=True)
    quais = set(sys.argv[1:]) or {"q8", "q9"}
    if "q8" in quais:
        gravar("q8.json", dados_q8(con))
    if "q9" in quais:
        gravar("q9.json", dados_q9(con))
    con.close()


if __name__ == "__main__":
    main()
