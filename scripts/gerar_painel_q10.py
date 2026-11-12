"""Gera os dados da Q10 (carreira do político) para o app React, com o país inteiro.

Lê as views de sql/07_q10_carreira.sql no banco (dados/processed/tse.duckdb) e grava em
web/public/dados/:

    q10.json                  o que vale para o país: reeleição, curvas, tipos de bem, IPCA
    q10/<UF>.json             as pessoas de cada estado (quem já disputou ali)
    q10/BR.json               quem já se elegeu governador, senador ou deputado, no país inteiro
    q10-financas/<UF>-NN.json patrimônio e campanha (pessoa i do arquivo do estado em i % 16)

Quem entra na busca: quem se elegeu pelo menos uma vez de 2002 a 2026. Entram todas as
participações dessas pessoas, inclusive derrotas. As contas de reeleição e as curvas vão só
até 2024 (fl_divulgado, #15); a linha do tempo de cada pessoa já mostra 2026, com o resultado
que estava no arquivo do TSE na coleta (1º turno).

Pré-requisitos (da raiz do repositório):
    uv run python -m scripts.coleta.coleta_tse candidatos historico recorte_remoto --uf <as 27>
    uv run python -m scripts.coleta.coleta_ibge ipca
    uv run python scripts/carregar_staging.py 00_limpeza 04_politico 07_q10 13_ficha 14_q10

Uso:
    uv run python -m scripts.gerar_painel_q10
"""

from __future__ import annotations

import os
from pathlib import Path

import duckdb

from scripts.painel_web import DADOS_WEB, UFS_BR, gravar

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"
PARTES = 16
# cargos de estado e federais: quem já venceu um deles entra na busca do país (q10/BR.json)
CARGOS_DO_PAIS = {3, 5, 6, 7, 8}
# grupos de bem de q10_bem_tipo, na ordem do gráfico (de baixo para cima)
GRUPOS = ["IMOVEIS", "EMPRESAS", "APLICACOES", "DINHEIRO", "VEICULOS", "OUTROS", "SEM TIPO"]

RESULTADO = {"ELEITO": 0, "NAO ELEITO": 1, "SEM RESULTADO": 2, "AGUARDANDO 2º TURNO": 3}

# Nome de urna mais recente de cada título: é como o eleitor conhece o político.
# Não está nas views (fica fora do DER), então vem do consulta_cand.
SQL_URNA = """
SELECT
    lpad(nr_titulo_eleitoral_candidato, 12, '0') AS nr_titulo_eleitoral,
    arg_max(nm_urna_candidato, ano_eleicao::INTEGER) AS nm_urna
FROM read_csv(
    'dados/raw/candidatos/*/candidatos_[0-9]*/consulta_cand_[0-9]*_??.csv',
    delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
    all_varchar = TRUE, union_by_name = TRUE
)
WHERE regexp_matches(nr_titulo_eleitoral_candidato, '^[0-9]{1,12}$')
GROUP BY 1
"""

SQL_LINHA = """
WITH eleitos AS (
    SELECT DISTINCT nr_titulo_eleitoral
    FROM q10_linha_do_tempo
    WHERE fl_eleito
)
SELECT
    t.nr_titulo_eleitoral, t.nm_candidato, t.ano, t.sg_uf, t.nm_ue, t.cd_cargo, t.ds_cargo,
    t.sg_partido, t.resultado, t.fl_reeleito, t.fl_tentou_reeleicao
FROM q10_linha_do_tempo AS t
INNER JOIN eleitos USING (nr_titulo_eleitoral)
ORDER BY t.nr_titulo_eleitoral, t.ano
"""


def ler_financas(con: duckdb.DuckDBPyConnection, titulos: list[str]) -> tuple[dict[str, list], list[list]]:
    """Por pessoa (título de eleitor): [ano - 2000, receita, público, despesa, bens] de cada eleição.

    bens = [tipo, valor, tipo, valor, ...] (tipo indexa a lista de tipos); None quando
    não declarou nenhum bem. Receita e despesa: None antes de 2018.
    """
    con.execute("CREATE OR REPLACE TEMP TABLE pessoa_q10 (nr_titulo_eleitoral VARCHAR, i INTEGER)")
    con.executemany("INSERT INTO pessoa_q10 VALUES (?, ?)", [(t, i) for i, t in enumerate(titulos)])
    tipos: list[list] = []
    idx_tipo: dict[tuple[str, str], int] = {}
    bens: dict[int, list] = {}
    for cand, tipo, grupo, valor in con.execute(
        """SELECT id_candidatura, coalesce(ds_tipo_bem, ''), ds_grupo, vr_bem FROM q10_bem_tipo
           WHERE nr_titulo_eleitoral IN (SELECT nr_titulo_eleitoral FROM pessoa_q10)
           ORDER BY id_candidatura, vr_bem DESC"""
    ).fetchall():
        if (tipo, grupo) not in idx_tipo:
            idx_tipo[(tipo, grupo)] = len(tipos)
            tipos.append([tipo, GRUPOS.index(grupo)])
        bens.setdefault(cand, []).extend([idx_tipo[(tipo, grupo)], round(float(valor))])

    def reais(x: object) -> int | None:
        return None if x is None else round(float(x))

    financas: dict[str, list] = {}
    for titulo, ano, cand, receita, publico, despesa in con.execute(
        """SELECT p.nr_titulo_eleitoral, f.ano, f.id_candidatura, f.vr_receita, f.vr_publico, f.vr_despesa
           FROM q10_financas AS f INNER JOIN pessoa_q10 AS p USING (nr_titulo_eleitoral)
           WHERE f.ano <= 2024 AND (f.vr_patrimonio IS NOT NULL OR f.vr_receita IS NOT NULL)
           ORDER BY p.i, f.ano"""
    ).fetchall():
        financas.setdefault(titulo, []).append(
            [ano - 2000, reais(receita), reais(publico), reais(despesa), bens.get(cand)]
        )
    return financas, tipos


def main() -> None:
    os.chdir(RAIZ)  # os caminhos do read_csv são relativos à raiz
    con = duckdb.connect(str(BANCO), read_only=True)
    con.execute("INSTALL encodings; LOAD encodings;")
    urna = dict(con.execute(SQL_URNA).fetchall())

    cargos: dict[int, str] = {}
    # por pessoa: nome de urna, nome civil, as participações e onde ela disputou e venceu
    pessoas: dict[str, dict] = {}
    for titulo, nome, ano, uf, nm_ue, cargo, ds_cargo, partido, res, reeleito, tentou in con.execute(
        SQL_LINHA
    ).fetchall():
        cargos[cargo] = ds_cargo
        if titulo not in pessoas:
            civil = nome or ""
            nm = urna.get(titulo) or civil
            pessoas[titulo] = {"nome": nm, "civil": civil if civil != nm else "", "r": [], "ufs": set(), "pais": False}
        p = pessoas[titulo]
        flag = 1 if reeleito else (2 if tentou else 0)
        local = nm_ue if nm_ue and nm_ue.upper() != uf else uf
        p["r"].append((ano - 2000, cargo, f"{local}|{uf}", partido or "", RESULTADO[res], flag))
        p["ufs"].add(uf)
        if res == "ELEITO" and cargo in CARGOS_DO_PAIS:
            p["pais"] = True

    sobrevivencia = [
        list(r)
        for r in con.execute(
            """SELECT ano, sg_uf, cd_cargo, qt_eleitos, qt_tentaram_reeleicao, qt_reeleitos, qt_seguiram_na_politica
               FROM q10_sobrevivencia WHERE fl_divulgado ORDER BY 1, 2, 3"""
        ).fetchall()
    ]
    curva = [
        list(r)
        for r in con.execute(
            """SELECT sg_uf, cd_cargo, nr_ciclo, qt_turma, qt_ainda_eleitos, qt_ainda_disputando
               FROM q10_curva_sobrevivencia ORDER BY 1, 2, 3"""
        ).fetchall()
    ]
    totais = con.execute(
        "SELECT count(*), count(DISTINCT nr_titulo_eleitoral) FROM q10_linha_do_tempo WHERE fl_divulgado"
    ).fetchone()
    financas, tipos = ler_financas(con, list(pessoas))
    fatores = dict(con.execute("SELECT ano, fator_2024 FROM q10_ipca").fetchall())
    con.close()

    # arquivos antigos (64 partes sem estado) saem antes de gravar os novos
    for antigo in (DADOS_WEB / "q10-financas").glob("*.json"):
        antigo.unlink()

    def gravar_escopo(escopo: str, titulos: list[str]) -> None:
        """Um arquivo de pessoas e os de finanças para o país (BR) ou um estado."""
        partidos: list[str] = []
        ues: list[str] = []
        idx_partido: dict[str, int] = {}
        idx_ue: dict[str, int] = {}

        def indice(valor: str, lista: list[str], mapa: dict[str, int]) -> int:
            if valor not in mapa:
                mapa[valor] = len(lista)
                lista.append(valor)
            return mapa[valor]

        linhas = []
        for t in titulos:
            p = pessoas[t]
            plano: list[int] = []
            for ano, cargo, ue, partido, res, flag in p["r"]:
                # [ano - 2000, cargo, ue, partido, resultado, reeleito (1) / tentou e perdeu (2) / 0]
                plano.extend([ano, cargo, indice(ue, ues, idx_ue), indice(partido, partidos, idx_partido), res, flag])
            linhas.append([p["nome"], p["civil"], plano])
        gravar(f"q10/{escopo}.json", {"pessoas": linhas, "partidos": partidos, "ues": ues})
        for parte in range(PARTES):
            bloco = {i: financas[t] for i, t in enumerate(titulos) if i % PARTES == parte and t in financas}
            gravar(f"q10-financas/{escopo}-{parte:02d}.json", bloco)

    gravar_escopo("BR", [t for t, p in pessoas.items() if p["pais"]])
    for uf in UFS_BR:
        gravar_escopo(uf, [t for t, p in pessoas.items() if uf in p["ufs"]])

    dados = {
        "ufs": UFS_BR,
        "cargos": cargos,
        "sobrevivencia": sobrevivencia,
        "curva": curva,
        "totais": {"participacoes": totais[0], "pessoas": totais[1], "eleitos": len(pessoas)},
        # tipos de bem do TSE e o grupo de cada um; fator do IPCA para reais de 2024
        "fin": {
            "tipos": tipos,
            "grupos": GRUPOS,
            "partes": PARTES,
            "fator": {a: round(f, 6) for a, f in fatores.items()},
        },
    }
    gravar("q10.json", dados)
    print(f"{len(pessoas)} políticos eleitos ao menos uma vez")


if __name__ == "__main__":
    main()
