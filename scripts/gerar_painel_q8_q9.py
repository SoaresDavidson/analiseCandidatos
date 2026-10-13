"""Gera docs/q8-q9-painel/index.html, o painel interativo das perguntas Q8 e Q9.

Lê só o banco (dados/processed/tse.duckdb): as views q8_* e q9_* de
sql/11_q8_publico.sql e sql/12_q9_propaganda.sql. Embute os dados em
docs/q8-q9-painel/modelo.html no lugar de __DADOS__. O resultado é um HTML
único que abre direto no navegador, sem servidor.

Pré-requisitos (da raiz do repositório):
    uv run scripts/carregar_staging.py            # 00 a 05, 11_q8 e 12_q9

Uso:
    uv run python scripts/gerar_painel_q8_q9.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import duckdb

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"
MODELO = RAIZ / "docs" / "q8-q9-painel" / "modelo.html"
SAIDA = RAIZ / "docs" / "q8-q9-painel" / "index.html"

UFS = ["AM", "GO", "MA", "MT", "RS", "SE"]
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
SQL_TOTAIS = """
SELECT
    ano,
    ds_cargo,
    coalesce(sg_uf, 'TODAS') AS sg_uf,
    CASE WHEN fl_eleito IS NULL THEN 2 ELSE fl_eleito::INTEGER END AS eleito,
    coalesce(ds_canal, 'TODOS') AS ds_canal,
    count(*) AS qt
FROM q9_despesa
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


def main() -> None:
    os.chdir(RAIZ)  # o staging lê os CSV por caminho relativo à raiz
    con = duckdb.connect(str(BANCO), read_only=True)

    q8 = [
        [ano, UFS.index(uf), CARGOS.index(cargo), faixa, int(n), int(e)]
        for ano, uf, cargo, faixa, n, e in con.execute(
            """SELECT ano, sg_uf, ds_cargo, nr_faixa, qt_candidatos, qt_eleitos
               FROM q8_faixa ORDER BY 1, 2, 3, 4"""
        ).fetchall()
    ]

    q9c = [
        [ano, UFS.index(uf), CARGOS.index(cargo), int(el), CANAIS.index(canal), int(nc), int(nd), round(float(vr))]
        for ano, uf, cargo, el, canal, nc, nd, vr in con.execute(
            """SELECT ano, sg_uf, ds_cargo, fl_eleito, ds_canal, qt_candidatos, qt_despesas, vr_despesa
               FROM q9_canal ORDER BY 1, 2, 3, 4, 5"""
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
    con.close()

    dados = {
        "ufs": UFS,
        "cargos": CARGOS,
        "canais": CANAIS,
        "q8": q8,
        "q9c": q9c,
        "termos": termos,
        "q9t": q9t,
        "q9tot": q9tot,
        "top": TOP_TERMOS,
    }
    texto = json.dumps(dados, ensure_ascii=False, separators=(",", ":"))
    assert "</script" not in texto
    corpo = MODELO.read_text(encoding="utf-8").replace("__DADOS__", texto)
    # o modelo é o corpo da página; aqui ganha o esqueleto completo
    html = (
        '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        "</head>\n<body>\n" + corpo + "\n</body>\n</html>\n"
    )
    SAIDA.write_text(html, encoding="utf-8")
    print(f"{SAIDA.relative_to(RAIZ)}: {len(html) // 1024} KB, {len(termos)} termos, {len(q9t)} grupos na nuvem")


if __name__ == "__main__":
    main()
