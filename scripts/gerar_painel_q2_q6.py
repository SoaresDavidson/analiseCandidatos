"""Gera docs/q2-painel/index.html e docs/q6-painel/index.html, as páginas das perguntas
Q2 (patrimônio declarado × sucesso eleitoral) e Q6 (idade do município, dos eleitos e
alternância de poder).

Lê as views de sql/18_q2_patrimonio.sql (Enrico) e sql/20_q6_idade.sql (Eduardo) e embute
os dados no modelo.html de cada pergunta no lugar de __DADOS__ (abre direto no navegador).
O mapa da Q6 reaproveita as malhas da Q4.

Pré-requisitos (da raiz do repositório):
    uv run python -m scripts.coleta.coleta_ibge idade
    uv run python -m scripts.coleta.coleta_tse recorte_remoto --uf AM,GO,MA,MT,RS,SE
    uv run python scripts/carregar_staging.py 13_ficha 14_q10 18_q2 19_faixa 20_q6

Uso:
    uv run python -m scripts.gerar_painel_q2_q6
"""

from __future__ import annotations

import os

import duckdb

from scripts.gerar_painel_q3_q7 import BANCO, RAIZ, UFS, gerar, num
from scripts.gerar_painel_q4 import CAPITAIS, mapa

CARGOS_Q2 = ["VEREADOR", "PREFEITO", "DEPUTADO ESTADUAL", "DEPUTADO FEDERAL", "GOVERNADOR", "SENADOR"]
GRUPOS_BEM = ["IMOVEIS", "VEICULOS", "DINHEIRO", "APLICACOES", "EMPRESAS", "OUTROS"]


def flag(x: object) -> int | None:
    return None if x is None else int(bool(x))


def dados_q2(con: duckdb.DuckDBPyConnection) -> dict:
    # uma linha por ano × UF × cargo × faixa: a página soma para o filtro (não soma taxas)
    faixas = [
        [ano, UFS.index(uf), CARGOS_Q2.index(cargo), faixa, int(cand), int(eleitos)]
        for ano, uf, cargo, faixa, cand, eleitos in con.execute(
            """SELECT ano, sg_uf, ds_cargo, nr_faixa, qt_candidatos, qt_eleitos FROM q2_faixa
               ORDER BY ano, sg_uf, ds_cargo, nr_faixa"""
        ).fetchall()
    ]
    # limite de cada quinto em reais de 2024: chave "cargo|ano" → [[mín, máx, mediana] × 5]
    limites: dict[str, list] = {}
    for ano, cargo, faixa, vmin, vmax, vmed in con.execute(
        """SELECT ano, ds_cargo, nr_faixa, vr_min_2024, vr_max_2024, vr_mediana_2024 FROM q2_limite
           WHERE nr_faixa BETWEEN 1 AND 5 ORDER BY ano, ds_cargo, nr_faixa"""
    ).fetchall():
        limites.setdefault(f"{CARGOS_Q2.index(cargo)}|{ano}", [None] * 5)[faixa - 1] = [
            num(vmin, 0),
            num(vmax, 0),
            num(vmed, 0),
        ]
    # o teste dos 6 estados como a view calcula (a página refaz para o filtro e confere)
    qui = {
        f"{CARGOS_Q2.index(cargo)}|{ano}": [num(chi, 3), gl, 1 if valido else 0]
        for ano, cargo, chi, gl, valido in con.execute(
            "SELECT ano, ds_cargo, vl_qui_quadrado, nr_graus_liberdade, fl_teste_valido FROM q2_quiquadrado"
        ).fetchall()
    }
    # composição: "cargo|ano" → {grupo: [% com o bem eleitos, não eleitos, % do patrimônio eleitos, não eleitos]}
    composicao: dict[str, dict] = {}
    for ano, cargo, eleito, grupo, pc_do, pc_com in con.execute(
        """SELECT ano, ds_cargo, fl_eleito, ds_grupo, pc_do_patrimonio, pc_candidatos_com_bem
           FROM q2_composicao"""
    ).fetchall():
        par = composicao.setdefault(f"{CARGOS_Q2.index(cargo)}|{ano}", {}).setdefault(grupo, [None] * 4)
        par[0 if eleito else 1], par[2 if eleito else 3] = num(pc_com, 1), num(pc_do, 1)
    suspeitos, base = con.execute("SELECT count(*) FILTER (WHERE fl_suspeito), count(*) FROM q2_candidatura").fetchone()
    return {
        "ufs": UFS,
        "cargos": CARGOS_Q2,
        "grupos": GRUPOS_BEM,
        "faixas": faixas,
        "limites": limites,
        "qui": qui,
        "composicao": composicao,
        "suspeitos": [int(suspeitos), int(base)],
    }


def dados_q6(con: duckdb.DuckDBPyConnection) -> dict:
    # voto por idade, vereador 2020 e 2024: [aptos, % aptos jovem, % aptos 60+, votos, % votos jovem,
    # % votos 60+, % candidatos jovens]
    voto: dict[int, dict] = {}
    for cod, ano, aptos, aj, ai, votos, vj, vi, cj in con.execute(
        """SELECT cod_ibge, ano, qt_aptos, pc_aptos_jovem, pc_aptos_idoso, qt_votos, pc_votos_jovem,
                  pc_votos_idoso, pc_candidatos_jovem
           FROM q6_voto_idade WHERE cd_cargo = 13"""
    ).fetchall():
        voto.setdefault(cod, {})[ano] = [aptos, num(aj, 2), num(ai, 2), votos, num(vj, 2), num(vi, 2), num(cj, 1)]
    municipios = [
        [
            cod, nome, UFS.index(uf), 1 if cod in CAPITAIS else 0, pop,
            num(idade, 1), num(pj, 1), num(pi, 1), terco, terco_uf,
            aptos, num(id_el, 1), num(pj_el, 1), num(abs_j, 1), num(abs_nj, 1),
            num(id_ver, 1), num(pj_ver, 1), id_pref,
            [s16 or "", s20 or "", s24 or ""], [flag(t20), flag(t24)], [flag(c20), flag(c24)], [flag(r20), flag(r24)],
            [voto.get(cod, {}).get(2020), voto.get(cod, {}).get(2024)],
        ]
        for (
            cod, nome, uf, pop, idade, pj, pi, terco, terco_uf, aptos, id_el, pj_el, abs_j, abs_nj, id_ver, pj_ver,
            id_pref, s16, s20, s24, c20, c24, t20, t24, r20, r24,
        ) in con.execute(
            """SELECT cod_ibge, nm_municipio, sg_uf, qt_populacao, nr_idade_media_populacao, pc_populacao_jovem,
                      pc_populacao_idosa, nr_terco, nr_terco_uf, qt_aptos_2024, nr_idade_media_eleitorado_2024,
                      pc_eleitorado_jovem_2024, pc_abstencao_jovem_2024, pc_abstencao_nao_jovem_2024,
                      nr_idade_media_vereadores_2024, pc_vereadores_jovem_2024, nr_idade_prefeito_2024,
                      sg_partido_2016, sg_partido_2020, sg_partido_2024,
                      fl_prefeito_concorreu_2020, fl_prefeito_concorreu_2024,
                      fl_troca_partido_2020, fl_troca_partido_2024,
                      fl_prefeito_reeleito_2020, fl_prefeito_reeleito_2024
               FROM q6_municipio ORDER BY sg_uf, nm_municipio"""
        ).fetchall()
    ]  # fmt: skip
    # idade dos candidatos e eleitos: [ano, uf, cargo, candidatos, eleitos, idade média cand., eleitos,
    # % jovem cand., eleitos, % 60+ cand., eleitos, sucesso jovem, 30–59, 60+]
    eleitos = [
        [ano, UFS.index(uf), CARGOS_Q2.index(cargo), qc, qe, *(num(x, 2) for x in resto)]
        for ano, uf, cargo, qc, qe, *resto in con.execute(
            """SELECT ano, sg_uf, ds_cargo, qt_candidatos, qt_eleitos, nr_idade_media_candidatos,
                      nr_idade_media_eleitos, pc_jovem_candidatos, pc_jovem_eleitos, pc_idoso_candidatos,
                      pc_idoso_eleitos, pc_sucesso_jovem, pc_sucesso_30_59, pc_sucesso_idoso
               FROM q6_idade_eleitos WHERE ds_cargo IN ('VEREADOR', 'PREFEITO', 'DEPUTADO ESTADUAL',
                    'DEPUTADO FEDERAL')
               ORDER BY ano, sg_uf, ds_cargo"""
        ).fetchall()
    ]
    # correlações da view (vereador), para conferir as que a página calcula
    correlacao = {
        f"{uf}|{ano}": [num(j, 3), num(i, 3)]
        for ano, uf, j, i in con.execute(
            "SELECT ano, sg_uf, vl_corr_jovem, vl_corr_idoso FROM q6_voto_idade_correlacao WHERE cd_cargo = 13"
        ).fetchall()
    }
    return {
        "ufs": UFS,
        "cargos": CARGOS_Q2,
        "municipios": municipios,
        "eleitos": eleitos,
        "correlacao": correlacao,
        "mapas": {uf: mapa(uf) for uf in UFS},
    }


def main() -> None:
    os.chdir(RAIZ)
    con = duckdb.connect(str(BANCO), read_only=True)
    q2, q6 = dados_q2(con), dados_q6(con)
    con.close()
    gerar("q2-painel", q2)
    gerar("q6-painel", q6)


if __name__ == "__main__":
    main()
