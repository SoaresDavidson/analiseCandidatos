"""Gera a aba Candidatos do painel: a ficha de cada eleito de 2022 e 2024, com foto.

Lê a view ficha_eleito (sql/13_ficha_candidato.sql) e a linha do tempo da Q10
(sql/07_q10_carreira.sql) e grava, para o app React:

    web/public/dados/candidatos/<UF>.json      as fichas de cada estado, sem as fotos
    web/public/fotos/<ano>/<sq_candidato>.jpg  as fotos, do TSE (fora do git;
                 scripts/baixar_fotos_web.py baixa as que faltarem, sem precisar do banco)

Pré-requisitos (da raiz do repositório):
    uv run python -m scripts.coleta.coleta_tse candidatos historico recorte_remoto
    uv run python scripts/carregar_staging.py 00_limpeza 00_modelo 01_staging 02_fonte 03_tipo \\
        04_politico 05_marts 06_carga_nucleo 07_q10 13_ficha

Uso:
    uv run python -m scripts.gerar_painel_candidatos   # como módulo: usa scripts/coleta
"""

from __future__ import annotations

import os
from pathlib import Path

import duckdb

from scripts.coleta import fotos_tse
from scripts.painel_web import UFS_BR, gravar

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"
FOTOS = RAIZ / "web" / "public" / "fotos"

# "aguardando 2º turno": o arquivo do TSE saiu antes do desfecho; na ficha conta como sem resultado
RESULTADO = {"ELEITO": 0, "NAO ELEITO": 1, "SEM RESULTADO": 2, "AGUARDANDO 2º TURNO": 2}
# a ordem fixa dos canais de propaganda é a da Q9 (gerar_painel_q8_q9.py)
CANAIS = ["IMPRESSO", "RUA", "RADIO E TV", "ADESIVO", "DIGITAL", "JINGLE", "CARRO DE SOM", "JORNAL E REVISTA"]

SQL_FICHA = """
SELECT
    ano, sg_uf, nm_ue, cd_cargo, sq_candidato, nr_titulo_eleitoral, nm_urna, nm_candidato, sg_partido,
    nr_idade_eleicao, ds_genero, ds_cor_raca, ds_grau_instrucao, ds_ocupacao, ds_sit_tot_turno,
    qt_votos, nm_municipio_mais_votos, vr_patrimonio, qt_bens,
    vr_receita, vr_publico, vr_privado, vr_proprio, vr_partidario, vr_transferencia, qt_doadores,
    vr_propaganda, ds_canal_principal, coalesce(cod_ibge, 0) AS cod_ibge
FROM ficha_eleito
ORDER BY ano DESC, cd_cargo, sg_uf, nm_ue, qt_votos DESC NULLS LAST
"""

SQL_CARREIRA = """
SELECT nr_titulo_eleitoral, ano, sg_uf, nm_ue, cd_cargo, sg_partido, resultado
FROM q10_linha_do_tempo
WHERE fl_divulgado AND nr_titulo_eleitoral IN (SELECT nr_titulo_eleitoral FROM ficha_eleito)
ORDER BY nr_titulo_eleitoral, ano
"""


def main() -> None:
    os.chdir(RAIZ)  # os caminhos do read_csv são relativos à raiz
    con = duckdb.connect(str(BANCO), read_only=True)
    con.execute("INSTALL encodings; LOAD encodings;")
    linhas = con.execute(SQL_FICHA).fetchall()
    carreira_bruta = con.execute(SQL_CARREIRA).fetchall()
    # espectro: "ano|sigla" -> [nota de 0 a 10, categoria, observação da fonte (estimado, renomeado)]
    espectro = {
        f"{ano}|{sg}": [float(vl), cat, fonte.split(" — ", 1)[1] if " — " in fonte else ""]
        for ano, sg, vl, cat, fonte in con.execute(
            """SELECT e.ano, p.sg_partido, e.vl_ideologia, e.cd_espectro, e.ds_fonte
               FROM modelo.espectro_partido AS e INNER JOIN modelo.partido AS p USING (ano, nr_partido)"""
        ).fetchall()
    }
    regua = con.execute(
        "SELECT sg_mais_esquerda, vl_mais_esquerda, sg_mais_direita, vl_mais_direita FROM espectro_regua"
    ).fetchone()
    con.close()

    def reais(x: object) -> int | None:
        return None if x is None else round(float(x))

    # carreira de cada pessoa: (ano, UF, local, cargo, partido, resultado)
    carreira: dict[str, list[tuple]] = {}
    for titulo, ano, uf, nm_ue, cargo, partido, res in carreira_bruta:
        local = nm_ue if nm_ue and nm_ue.upper() != uf else uf
        carreira.setdefault(titulo, []).append((ano, uf, local, cargo, partido, RESULTADO[res]))

    # um arquivo por estado, cada um com as próprias listas de nomes (cidades, partidos, ocupações...)
    for sigla in UFS_BR:
        do_estado = [r for r in linhas if r[1] == sigla]
        listas: dict[str, list[str]] = {k: [] for k in ("ues", "partidos", "ocupacoes", "graus", "cores", "generos")}
        mapas: dict[str, dict[str, int]] = {k: {} for k in listas}

        def ind(tipo: str, valor: str | None, listas=listas, mapas=mapas) -> int:
            valor = valor or ""
            if valor not in mapas[tipo]:
                mapas[tipo][valor] = len(listas[tipo])
                listas[tipo].append(valor)
            return mapas[tipo][valor]

        eleitos = []
        for (
            ano, uf, nm_ue, cargo, _sq, titulo, urna, civil, partido, idade, genero, cor, grau, ocupacao, situacao,
            votos, mun_votos, patrimonio, qt_bens, receita, publico, privado, proprio, partidario, transf,
            doadores, propaganda, canal, cod_ibge,
        ) in do_estado:  # fmt: skip
            local = nm_ue if nm_ue and nm_ue.upper() != uf else uf
            # carreira: [ano - 2000, cargo, ue, partido, resultado] em linhas planas de 5 em 5
            passos = [
                x
                for a, u, lugar, c, part, res in carreira.get(titulo, [])
                for x in (a - 2000, c, ind("ues", f"{lugar}|{u}"), ind("partidos", part), res)
            ]
            eleitos.append(
                [
                    ano - 2000, UFS_BR.index(uf), cargo, ind("ues", f"{local}|{uf}"), ind("partidos", partido),
                    urna or civil or "", civil if civil and civil != urna else "",
                    idade, ind("generos", genero), ind("cores", cor), ind("graus", grau), ind("ocupacoes", ocupacao),
                    situacao, votos, ind("ues", f"{mun_votos}|{uf}") if mun_votos else -1,
                    reais(patrimonio), qt_bens or 0,
                    reais(receita), reais(publico), reais(privado), reais(proprio), reais(partidario), reais(transf),
                    doadores, reais(propaganda), CANAIS.index(canal) if canal in CANAIS else -1,
                    passos,
                    cod_ibge,
                ]
            )  # fmt: skip

        # sq_candidato do TSE, na mesma ordem: nome da foto e chave para as outras abas abrirem a ficha
        gravar(
            f"candidatos/{sigla}.json",
            {
                "ufs": UFS_BR,
                "canais": CANAIS,
                **listas,
                "eleitos": eleitos,
                "sq": [r[4] for r in do_estado],
                "espectro": espectro,
                "regua": [regua[0], float(regua[1]), regua[2], float(regua[3])],
            },
        )

    print(f"{len(linhas)} eleitos; buscando as fotos que faltam…")
    com_foto = fotos_tse.garantir([(r[0], r[1], r[4]) for r in linhas], FOTOS)
    print(f"{len(linhas)} eleitos, {com_foto} com foto em {FOTOS.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
