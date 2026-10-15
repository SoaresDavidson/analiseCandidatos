"""Gera docs/q10-painel/index.html, o painel interativo da Q10 (carreira do político).

Lê as views de sql/07_q10_carreira.sql no banco (dados/processed/tse.duckdb) e embute
os dados em docs/q10-painel/modelo.html no lugar de __DADOS__.

Quem entra na busca: quem se elegeu pelo menos uma vez entre 2002 e 2024 nas 6 UFs.
Entram todas as participações dessas pessoas, inclusive derrotas. 2026 fica de fora
(fl_divulgado, #15).

Patrimônio e campanha de cada pessoa (sql/14_q10_patrimonio.sql) vão em 64 arquivos
pequenos, docs/q10-painel/financas/NN.json (pessoa i no arquivo i % 64): a página só
busca o da pessoa aberta. Por isso essa parte precisa do site local
(uv run python -m scripts.servir_painel).

Pré-requisitos (da raiz do repositório):
    uv run python -m scripts.coleta.coleta_tse candidatos historico recorte_remoto --uf AM,GO,MA,MT,RS,SE
    uv run python -m scripts.coleta.coleta_ibge ipca
    uv run python scripts/carregar_staging.py 00_limpeza 04_politico 07_q10 13_ficha 14_q10

Uso:
    uv run python scripts/gerar_painel_q10.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import duckdb

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"
MODELO = RAIZ / "docs" / "q10-painel" / "modelo.html"
SAIDA = RAIZ / "docs" / "q10-painel" / "index.html"
FINANCAS = RAIZ / "docs" / "q10-painel" / "financas"
PARTES = 64
# grupos de bem de q10_bem_tipo, na ordem do gráfico (de baixo para cima)
GRUPOS = ["IMOVEIS", "EMPRESAS", "APLICACOES", "DINHEIRO", "VEICULOS", "OUTROS", "SEM TIPO"]

RESULTADO = {"ELEITO": 0, "NAO ELEITO": 1, "SEM RESULTADO": 2}

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
    WHERE fl_divulgado AND fl_eleito
)
SELECT
    t.nr_titulo_eleitoral, t.nm_candidato, t.ano, t.sg_uf, t.nm_ue, t.cd_cargo, t.ds_cargo,
    t.sg_partido, t.resultado, t.fl_reeleito, t.fl_tentou_reeleicao
FROM q10_linha_do_tempo AS t
INNER JOIN eleitos USING (nr_titulo_eleitoral)
WHERE t.fl_divulgado
ORDER BY t.nr_titulo_eleitoral, t.ano
"""


def ler_financas(con: duckdb.DuckDBPyConnection, titulos: list[str]) -> tuple[dict[int, list], list[list]]:
    """Por pessoa (índice em titulos): [ano - 2000, receita, público, despesa, bens] de cada eleição.

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

    financas: dict[int, list] = {}
    for i, ano, cand, receita, publico, despesa in con.execute(
        """SELECT p.i, f.ano, f.id_candidatura, f.vr_receita, f.vr_publico, f.vr_despesa
           FROM q10_financas AS f INNER JOIN pessoa_q10 AS p USING (nr_titulo_eleitoral)
           WHERE f.ano <= 2024 AND (f.vr_patrimonio IS NOT NULL OR f.vr_receita IS NOT NULL)
           ORDER BY p.i, f.ano"""
    ).fetchall():
        financas.setdefault(i, []).append([ano - 2000, reais(receita), reais(publico), reais(despesa), bens.get(cand)])
    return financas, tipos


def main() -> None:
    os.chdir(RAIZ)  # os caminhos do read_csv são relativos à raiz
    con = duckdb.connect(str(BANCO), read_only=True)
    con.execute("INSTALL encodings; LOAD encodings;")
    urna = dict(con.execute(SQL_URNA).fetchall())

    cargos: dict[int, str] = {}
    partidos: list[str] = []
    ues: list[str] = []
    idx_partido: dict[str, int] = {}
    idx_ue: dict[str, int] = {}

    def indice(valor: str | None, lista: list[str], mapa: dict[str, int]) -> int:
        valor = valor or ""
        if valor not in mapa:
            mapa[valor] = len(lista)
            lista.append(valor)
        return mapa[valor]

    pessoas: dict[str, list] = {}
    for titulo, nome, ano, uf, nm_ue, cargo, ds_cargo, partido, res, reeleito, tentou in con.execute(
        SQL_LINHA
    ).fetchall():
        cargos[cargo] = ds_cargo
        if titulo not in pessoas:
            civil = nome or ""
            nm = urna.get(titulo) or civil
            pessoas[titulo] = [nm, civil if civil != nm else "", []]
        # [ano - 2000, cargo, ue, partido, resultado, reeleito (1) / tentou e perdeu (2) / 0]
        flag = 1 if reeleito else (2 if tentou else 0)
        local = nm_ue if nm_ue and nm_ue.upper() != uf else uf
        pessoas[titulo][2].extend(
            [
                ano - 2000,
                cargo,
                indice(f"{local}|{uf}", ues, idx_ue),
                indice(partido, partidos, idx_partido),
                RESULTADO[res],
                flag,
            ]
        )

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

    FINANCAS.mkdir(exist_ok=True)
    for parte in range(PARTES):
        bloco = {i: financas[i] for i in range(parte, len(pessoas), PARTES) if i in financas}
        (FINANCAS / f"{parte:02d}.json").write_text(
            json.dumps(bloco, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )

    dados = {
        "pessoas": list(pessoas.values()),
        "cargos": cargos,
        "partidos": partidos,
        "ues": ues,
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
    texto = json.dumps(dados, ensure_ascii=False, separators=(",", ":"))
    assert "</script" not in texto
    corpo = MODELO.read_text(encoding="utf-8").replace("__DADOS__", texto)
    html = (
        '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        "</head>\n<body>\n" + corpo + "\n</body>\n</html>\n"
    )
    SAIDA.write_text(html, encoding="utf-8")
    print(f"{SAIDA.relative_to(RAIZ)}: {len(html) // 1024} KB, {len(pessoas)} políticos eleitos ao menos uma vez")


if __name__ == "__main__":
    main()
