"""Gera web/public/dados/candidatos-decisoes.json: as decisões da Justiça Eleitoral (registro
negado por ilícito na campanha ou inelegibilidade, e cassação) de cada eleito da aba
Candidatos, em qualquer candidatura da mesma pessoa de 2018 a 2024.

A ficha e o card do eleito leem este arquivo ao lado de candidatos-eleitos.json; a chave é
"<ano>-<sq_candidato>" do eleito, a mesma da foto. Falha formal ou do partido (família 3 de
sql/24_motivo_cassacao.sql) fica de fora: não é cassação nem inelegibilidade.

Pré-requisitos (da raiz do repositório):
    uv run python -m scripts.coleta.coleta_tse recorte_remoto --uf AM,GO,MA,MT,RS,SE
    uv run python scripts/carregar_staging.py 24_motivo

Uso:
    uv run python -m scripts.gerar_painel_decisoes
"""

from __future__ import annotations

import os

import duckdb

from scripts.painel_web import RAIZ, gravar

BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"

# os mesmos eleitos da aba Candidatos: 2022 e 2024, cargos com ficha
SQL = """
WITH eleito AS (
    SELECT ano, sq_candidato, nr_titulo_eleitoral
    FROM modelo.candidatura
    WHERE fl_eleito AND ano IN (2022, 2024) AND cd_cargo IN (3, 5, 6, 7, 11, 13)
)

SELECT
    e.ano,
    e.sq_candidato,
    d.ano AS ano_decisao,
    d.cd_cargo,
    d.nm_ue,
    d.sg_uf,
    d.sg_partido,
    d.ds_tp_motivo,
    d.ds_motivo,
    d.nr_processo,
    d.nr_familia,
    d.ano = e.ano AND d.sq_candidato = e.sq_candidato AS fl_mesma_candidatura
FROM eleito AS e
INNER JOIN cassacao_decisao AS d
    ON
        d.fl_marca
        AND (
            (d.ano = e.ano AND d.sq_candidato = e.sq_candidato)
            OR (e.nr_titulo_eleitoral IS NOT NULL AND d.nr_titulo_eleitoral = e.nr_titulo_eleitoral)
        )
ORDER BY e.ano, e.sq_candidato, d.ano DESC, d.ds_motivo
"""


def processo(x: str | None) -> str:
    return "" if x in (None, "", "#NE", "#NULO", "-1", "-3") else x


def main() -> None:
    os.chdir(RAIZ)
    con = duckdb.connect(str(BANCO), read_only=True)
    linhas = con.execute(SQL).fetchall()
    con.close()
    eleitos: dict[str, list] = {}
    for ano, sq, ano_d, cargo, ue, uf, partido, tipo, motivo, proc, familia, mesma in linhas:
        # [ano, cargo, lugar, UF, partido, tipo do motivo, motivo, processo, família, é esta candidatura]
        item = [ano_d, cargo, ue, uf, partido or "", tipo, motivo, processo(proc), familia, 1 if mesma else 0]
        lista = eleitos.setdefault(f"{ano}-{sq}", [])
        if item not in lista:
            lista.append(item)
    gravar("candidatos-decisoes.json", {"fonte": "TSE, motivo_cassacao 2018–2024", "eleitos": eleitos})
    print(f"{len(eleitos)} eleitos com decisão")


if __name__ == "__main__":
    main()
