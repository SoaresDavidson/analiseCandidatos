"""Gera os dados das perguntas Q2 (patrimônio declarado × sucesso eleitoral) e Q6 (idade do
município, de quem vota e de quem é eleito) para o app React: web/public/dados/q2.json e
q6.json, os dois com o Brasil inteiro.

Lê as views de sql/18_q2_patrimonio.sql (Enrico) e sql/20_q6_idade.sql (Eduardo). Os mapas
da Q6 são os de web/public/dados/malhas/ (scripts/gerar_malhas_web.py).

Pré-requisitos (da raiz do repositório):
    uv run python -m scripts.coleta.coleta_ibge idade
    uv run python -m scripts.coleta.coleta_tse recorte_remoto
    uv run python scripts/carregar_staging.py 13_ficha 14_q10 18_q2 19_faixa 20_q6

Uso:
    uv run python -m scripts.gerar_painel_q2_q6          # ou só uma: ... q2 | q6
"""

from __future__ import annotations

import os
import re
import sys

import duckdb

from scripts.coleta import zip_remoto
from scripts.coleta.coleta_comum import log
from scripts.coleta.fotos_tse import URL_FOTOS
from scripts.gerar_painel_q3_q7 import BANCO, RAIZ, num
from scripts.painel_web import CAPITAIS_BR, DADOS_WEB, UFS_BR, gravar

CARGOS_Q2 = ["VEREADOR", "PREFEITO", "DEPUTADO ESTADUAL", "DEPUTADO FEDERAL", "GOVERNADOR", "SENADOR"]
GRUPOS_BEM = ["IMOVEIS", "VEICULOS", "DINHEIRO", "APLICACOES", "EMPRESAS", "OUTROS"]


def flag(x: object) -> int | None:
    return None if x is None else int(bool(x))


def dados_q2(con: duckdb.DuckDBPyConnection) -> dict:
    # a Q2 usa a base do país inteiro (27 UFs); a Q6 segue nos 6 estados até ser migrada
    # uma linha por ano × UF × cargo × faixa: a página soma para o filtro (não soma taxas)
    faixas = [
        [ano, UFS_BR.index(uf), CARGOS_Q2.index(cargo), faixa, int(cand), int(eleitos)]
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
        "ufs": UFS_BR,
        "cargos": CARGOS_Q2,
        "grupos": GRUPOS_BEM,
        "faixas": faixas,
        "limites": limites,
        "qui": qui,
        "composicao": composicao,
        "suspeitos": [int(suspeitos), int(base)],
        "destaques": destaques_q2(con),
    }


# Quantos nomes entram em cada destaque (o 1º ganha a foto)
N_DESTAQUE = 5


def destaques_q2(con: duckdb.DuckDBPyConnection) -> dict:
    """Os candidatos de maior patrimônio declarado por cargo, eleição e estado (e no país).

    Chave "cargo|ano|uf" (uf = índice em UFS_BR ou "BR") -> {"top": [[nome de urna, nome civil,
    partido, UF, lugar, sq_candidato, patrimônio em reais da época, nº de bens, 1 se eleito] × até 5],
    "fora": nº de declarações acima do 1º que ficaram de fora por suspeita de erro de digitação}.
    A regra de suspeita é a da análise (um bem de R$ 100 milhões ou mais, sql/18_q2_patrimonio.sql).
    """
    linhas = con.execute(
        f"""
        WITH r AS (
            SELECT
                q.*,
                row_number() OVER (PARTITION BY q.ano, q.ds_cargo, q.sg_uf
                                   ORDER BY q.vr_patrimonio DESC, q.id_candidatura) AS nr_uf,
                row_number() OVER (PARTITION BY q.ano, q.ds_cargo
                                   ORDER BY q.vr_patrimonio DESC, q.id_candidatura) AS nr_br
            FROM q2_candidatura AS q
            WHERE NOT q.fl_suspeito AND q.vr_patrimonio > 0
        )
        SELECT r.ano, r.ds_cargo, r.sg_uf, r.nr_uf, r.nr_br, c.sq_candidato, p.sg_partido,
               coalesce(m.nm_municipio, '') AS nm_lugar, r.vr_patrimonio, r.qt_bens, r.fl_eleito,
               pol.nm_candidato
        FROM r
        INNER JOIN modelo.candidatura AS c ON r.id_candidatura = c.id_candidatura
        LEFT JOIN modelo.partido AS p ON c.ano = p.ano AND c.nr_partido = p.nr_partido
        LEFT JOIN modelo.municipio AS m ON c.cod_ibge = m.cod_ibge
        LEFT JOIN modelo.politico AS pol ON c.nr_titulo_eleitoral = pol.nr_titulo_eleitoral
        WHERE r.nr_uf <= {N_DESTAQUE} OR r.nr_br <= {N_DESTAQUE}
        ORDER BY r.ano, r.ds_cargo, r.vr_patrimonio DESC, r.id_candidatura"""
    ).fetchall()
    # o nome de urna fica fora do DER: vem do arquivo do TSE, pela chave ano + sq_candidato
    con.execute("INSTALL encodings; LOAD encodings;")
    urna: dict[tuple[int, int], str] = {}
    for ano in sorted({r[0] for r in linhas}):
        sqs = sorted({r[5] for r in linhas if r[0] == ano})
        for sq, nome in con.execute(
            f"""SELECT sq_candidato::BIGINT, any_value(nm_urna_candidato)
                FROM read_csv('dados/raw/candidatos/{ano}/candidatos_{ano}/consulta_cand_{ano}_??.csv',
                              delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
                              all_varchar = TRUE, union_by_name = TRUE)
                WHERE sq_candidato::BIGINT IN ? GROUP BY ALL""",
            [sqs],
        ).fetchall():
            urna[(ano, sq)] = nome
    fora = {
        (ano, cargo, uf): n
        for ano, cargo, uf, n in con.execute(
            """SELECT ano, ds_cargo, coalesce(sg_uf, 'BR'), count(*)
               FROM q2_candidatura WHERE fl_suspeito
               GROUP BY GROUPING SETS ((ano, ds_cargo, sg_uf), (ano, ds_cargo))"""
        ).fetchall()
    }
    destaques: dict[str, dict] = {}
    for ano, cargo, uf, nr_uf, nr_br, sq, partido, lugar, patrimonio, bens, eleito, civil in linhas:
        item = [urna.get((ano, sq)) or civil or "", civil or "", partido or "", uf, lugar,
                sq, num(patrimonio, 0), bens, 1 if eleito else 0]  # fmt: skip
        ic = CARGOS_Q2.index(cargo)
        for chave, posicao in ((UFS_BR.index(uf), nr_uf), ("BR", nr_br)):
            if posicao <= N_DESTAQUE:
                d = destaques.setdefault(f"{ic}|{ano}|{chave}", {"top": [], "fora": 0})
                d["top"].append(item)
                d["fora"] = fora.get((ano, cargo, uf if chave != "BR" else "BR"), 0)
    return destaques


def baixar_fotos_destaque(destaques: dict) -> None:
    """A foto original do TSE (161×225, a maior que ele publica) do 1º de cada destaque, em
    web/public/dados/q2-fotos/<ano>-<sq>.jpg. Só busca as que faltam, sem baixar o zip do estado."""
    pasta = DADOS_WEB / "q2-fotos"
    pasta.mkdir(parents=True, exist_ok=True)
    pedidos: dict[tuple[int, str], set[int]] = {}
    for chave, d in destaques.items():
        ano = int(chave.split("|")[1])
        _, _, _, uf, _, sq, *_ = d["top"][0]
        if not (pasta / f"{ano}-{sq}.jpg").exists():
            pedidos.setdefault((ano, uf), set()).add(sq)
    for (ano, uf), sqs in sorted(pedidos.items()):
        url = URL_FOTOS.format(ano=ano, uf=uf)
        try:
            infos = {
                int(m.group(1)): i
                for i in zip_remoto.abrir(url).infolist()
                if (m := re.search(r"(\d{6,})", i.filename))
            }
            pedir = [infos[sq] for sq in sqs if sq in infos]
            for nome, dados in zip_remoto.ler_varios(url, pedir):
                sq = int(re.search(r"(\d{6,})", nome).group(1))
                (pasta / f"{ano}-{sq}.jpg").write_bytes(dados)
            log(f"  fotos {ano} {uf}: {len(pedir)} de {len(sqs)}")
        except Exception as e:  # noqa: BLE001 (o CDN do TSE falha às vezes: segue e avisa)
            log(f"  fotos {ano} {uf}: falhou ({e})")


def dados_q6(con: duckdb.DuckDBPyConnection) -> dict:
    # voto para vereador em 2024, por cidade: [aptos, % aptos jovens, % aptos 60+, votos, % votos em
    # jovens, % votos em 60+, % candidatos jovens, idade média de quem recebeu os votos]
    voto = {
        cod: [aptos, num(aj, 2), num(ai, 2), votos, num(vj, 2), num(vi, 2), num(cj, 1), num(idade, 1)]
        for cod, aptos, aj, ai, votos, vj, vi, cj, idade in con.execute(
            """SELECT cod_ibge, qt_aptos, pc_aptos_jovem, pc_aptos_idoso, qt_votos, pc_votos_jovem,
                      pc_votos_idoso, pc_candidatos_jovem, nr_idade_media_voto
               FROM q6_voto_idade WHERE cd_cargo = 13 AND ano = 2024"""
        ).fetchall()
    }
    # uma linha por cidade (a ordem das colunas está em LinhaMunicipio, web/src/paineis/q6/tipos.ts)
    municipios = [
        [
            cod, nome, UFS_BR.index(uf), 1 if cod in CAPITAIS_BR else 0, pop,
            num(idade, 1), terco, terco_uf, aptos, num(id_el, 1),
            num(id_ver, 1), num(pj_ver, 1), id_pref,
            [s20 or "", s24 or ""], flag(t24), flag(c24), flag(r24),
            voto.get(cod),
        ]
        for (
            cod, nome, uf, pop, idade, terco, terco_uf, aptos, id_el, id_ver, pj_ver, id_pref, s20, s24, c24, t24, r24,
        ) in con.execute(
            """SELECT cod_ibge, nm_municipio, sg_uf, qt_populacao, nr_idade_media_populacao, nr_terco, nr_terco_uf,
                      qt_aptos_2024, nr_idade_media_eleitorado_2024,
                      nr_idade_media_vereadores_2024, pc_vereadores_jovem_2024, nr_idade_prefeito_2024,
                      sg_partido_2020, sg_partido_2024,
                      fl_prefeito_concorreu_2024, fl_troca_partido_2024, fl_prefeito_reeleito_2024
               FROM q6_municipio ORDER BY sg_uf, nm_municipio"""
        ).fetchall()
    ]  # fmt: skip
    # idade dos candidatos e eleitos: [ano, uf, cargo, candidatos, eleitos, idade média cand., eleitos,
    # % jovem cand., eleitos, % 60+ cand., eleitos, sucesso jovem, 30–59, 60+]
    eleitos = [
        [ano, UFS_BR.index(uf), CARGOS_Q2.index(cargo), qc, qe, *(num(x, 2) for x in resto)]
        for ano, uf, cargo, qc, qe, *resto in con.execute(
            """SELECT ano, sg_uf, ds_cargo, qt_candidatos, qt_eleitos, nr_idade_media_candidatos,
                      nr_idade_media_eleitos, pc_jovem_candidatos, pc_jovem_eleitos, pc_idoso_candidatos,
                      pc_idoso_eleitos, pc_sucesso_jovem, pc_sucesso_30_59, pc_sucesso_idoso
               FROM q6_idade_eleitos WHERE ds_cargo IN ('VEREADOR', 'PREFEITO', 'DEPUTADO ESTADUAL',
                    'DEPUTADO FEDERAL')
               ORDER BY ano, sg_uf, ds_cargo"""
        ).fetchall()
    ]
    return {"ufs": UFS_BR, "cargos": CARGOS_Q2, "municipios": municipios, "eleitos": eleitos}


def main() -> None:
    os.chdir(RAIZ)
    con = duckdb.connect(str(BANCO), read_only=True)
    # `python -m scripts.gerar_painel_q2_q6 q2` gera só a Q2 (ou só a q6)
    quais = set(sys.argv[1:]) or {"q2", "q6"}
    if "q2" in quais:
        q2 = dados_q2(con)
        gravar("q2.json", q2)
        baixar_fotos_destaque(q2["destaques"])
    if "q6" in quais:
        gravar("q6.json", dados_q6(con))
    con.close()


if __name__ == "__main__":
    main()
