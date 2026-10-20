"""Gera a aba Candidatos do painel: a ficha de cada eleito de 2022 e 2024, com foto.

Lê a view ficha_eleito (sql/13_ficha_candidato.sql) e a linha do tempo da Q10
(sql/07_q10_carreira.sql) e grava, em docs/candidatos-painel/:

    index.html   a página (cópia do modelo.html)
    dados.json   as fichas, sem as fotos (~4 MB)
    fotos/       <ano>/<sq_candidato>.jpg, do TSE (fora do git: scripts/servir_painel.py
                 baixa as que faltarem, sem precisar do banco)

A página lê dados.json e as fotos por arquivo, então precisa de servidor:
    uv run python -m scripts.servir_painel

Pré-requisitos (da raiz do repositório):
    uv run python -m scripts.coleta.coleta_tse candidatos historico recorte_remoto --uf AM,GO,MA,MT,RS,SE
    uv run python scripts/carregar_staging.py 00_limpeza 00_modelo 01_staging 02_fonte 03_tipo \\
        04_politico 05_marts 06_carga_nucleo 07_q10 13_ficha

Uso:
    uv run python -m scripts.gerar_painel_candidatos   # como módulo: usa scripts/coleta
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import duckdb

from scripts.coleta import fotos_tse

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"
PASTA = RAIZ / "docs" / "candidatos-painel"
FOTOS = PASTA / "fotos"

UFS = ["AM", "GO", "MA", "MT", "RS", "SE"]
RESULTADO = {"ELEITO": 0, "NAO ELEITO": 1, "SEM RESULTADO": 2}
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
WHERE sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
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

    listas: dict[str, list[str]] = {k: [] for k in ("ues", "partidos", "ocupacoes", "graus", "cores", "generos")}
    mapas: dict[str, dict[str, int]] = {k: {} for k in listas}

    def ind(tipo: str, valor: str | None) -> int:
        valor = valor or ""
        if valor not in mapas[tipo]:
            mapas[tipo][valor] = len(listas[tipo])
            listas[tipo].append(valor)
        return mapas[tipo][valor]

    # carreira: [ano - 2000, cargo, ue, partido, resultado] em linhas planas de 5 em 5
    carreira: dict[str, list[int]] = {}
    for titulo, ano, uf, nm_ue, cargo, partido, res in carreira_bruta:
        local = nm_ue if nm_ue and nm_ue.upper() != uf else uf
        carreira.setdefault(titulo, []).extend(
            [ano - 2000, cargo, ind("ues", f"{local}|{uf}"), ind("partidos", partido), RESULTADO[res]]
        )

    def reais(x: object) -> int | None:
        return None if x is None else round(float(x))

    eleitos = []
    for (
        ano, uf, nm_ue, cargo, _sq, titulo, urna, civil, partido, idade, genero, cor, grau, ocupacao, situacao,
        votos, mun_votos, patrimonio, qt_bens, receita, publico, privado, proprio, partidario, transf,
        doadores, propaganda, canal, cod_ibge,
    ) in linhas:  # fmt: skip
        local = nm_ue if nm_ue and nm_ue.upper() != uf else uf
        eleitos.append(
            [
                ano - 2000, UFS.index(uf), cargo, ind("ues", f"{local}|{uf}"), ind("partidos", partido),
                urna or civil or "", civil if civil and civil != urna else "",
                idade, ind("generos", genero), ind("cores", cor), ind("graus", grau), ind("ocupacoes", ocupacao),
                situacao, votos, ind("ues", f"{mun_votos}|{uf}") if mun_votos else -1,
                reais(patrimonio), qt_bens or 0,
                reais(receita), reais(publico), reais(privado), reais(proprio), reais(partidario), reais(transf),
                doadores, reais(propaganda), CANAIS.index(canal) if canal in CANAIS else -1,
                carreira.get(titulo, []),
                cod_ibge,
            ]
        )  # fmt: skip

    # sq_candidato do TSE, na mesma ordem: nome da foto e chave para as outras abas abrirem a ficha
    dados = {
        "ufs": UFS,
        "canais": CANAIS,
        **listas,
        "eleitos": eleitos,
        "sq": [r[4] for r in linhas],
        "espectro": espectro,
        "regua": [regua[0], float(regua[1]), regua[2], float(regua[3])],
    }
    (PASTA / "dados.json").write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    # o modelo é o corpo da página; aqui ganha o esqueleto completo (sem doctype o navegador entra em modo quirks)
    corpo = (PASTA / "modelo.html").read_text(encoding="utf-8")
    (PASTA / "index.html").write_text(
        '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        "</head>\n<body>\n" + corpo + "\n</body>\n</html>\n",
        encoding="utf-8",
    )
    com_foto = fotos_tse.garantir([(r[0], r[1], r[4]) for r in linhas], FOTOS)
    mb = (PASTA / "dados.json").stat().st_size >> 20
    print(f"docs/candidatos-painel/dados.json: {mb} MB, {len(eleitos)} eleitos, {com_foto} com foto em fotos/")


if __name__ == "__main__":
    main()
