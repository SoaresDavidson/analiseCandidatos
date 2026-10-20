"""Gera a aba Municípios do painel: para que lado cada cidade vota e o dinheiro das campanhas.

Lê as views de sql/15_espectro.sql (espectro_regua, espectro_municipio,
dinheiro_municipio) e a composição das câmaras eleitas em 2024, e grava em
docs/municipios-painel/:

    index.html   a página (cópia do modelo.html)
    dados.json   um registro por município dos 6 estados

Os eleitos de cada cidade, com foto, vêm de docs/candidatos-painel/dados.json, que a
página também lê. Precisa do site local: uv run python -m scripts.servir_painel

Pré-requisitos (da raiz do repositório):
    uv run python scripts/carregar_staging.py 13_ficha 15_espectro

Uso:
    uv run python -m scripts.gerar_painel_municipios
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import duckdb

from scripts.gerar_painel_q4 import CAPITAIS

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"
PASTA = RAIZ / "docs" / "municipios-painel"

UFS = ["AM", "GO", "MA", "MT", "RS", "SE"]
# ordem fixa dos canais de propaganda: a da Q9 (gerar_painel_q8_q9.py)
CANAIS = ["IMPRESSO", "RUA", "RADIO E TV", "ADESIVO", "DIGITAL", "JINGLE", "CARRO DE SOM", "JORNAL E REVISTA"]

SQL_MUNICIPIOS = """
SELECT
    e.cod_ibge, e.nm_municipio, e.sg_uf,
    e.vl_voto_vereador_2024, e.pc_votos_classificados_2024, e.qt_votos_vereador_2024,
    e.qt_vereadores, e.vl_camara, e.sg_partido_prefeito, e.vl_prefeito, e.vl_voto_dep_federal_2022,
    d.qt_candidatos, d.vr_receita, d.vr_publico, d.vr_propaganda, d.ds_canal_principal
FROM espectro_municipio AS e
LEFT JOIN dinheiro_municipio AS d USING (cod_ibge)
ORDER BY e.sg_uf, e.nm_municipio
"""

# cadeiras de vereador eleitas em 2024, por partido
SQL_CADEIRAS = """
SELECT c.cod_ibge, p.sg_partido, count(*)
FROM modelo.candidatura AS c
INNER JOIN modelo.partido AS p ON c.ano = p.ano AND c.nr_partido = p.nr_partido
WHERE c.ano = 2024 AND c.cd_cargo = 13 AND c.fl_eleito
GROUP BY ALL
"""


def main() -> None:
    os.chdir(RAIZ)
    con = duckdb.connect(str(BANCO), read_only=True)
    regua = con.execute(
        "SELECT sg_mais_esquerda, vl_mais_esquerda, sg_mais_direita, vl_mais_direita, vl_meio FROM espectro_regua"
    ).fetchone()
    partidos: dict[str, list] = {
        sg: [float(vl), cat, fonte.split(" — ", 1)[1] if " — " in fonte else ""]
        for sg, vl, cat, fonte in con.execute(
            """SELECT p.sg_partido, e.vl_ideologia, e.cd_espectro, e.ds_fonte
               FROM modelo.espectro_partido AS e INNER JOIN modelo.partido AS p USING (ano, nr_partido)
               WHERE e.ano = 2024"""
        ).fetchall()
    }
    cadeiras: dict[int, list] = {}
    for cod, sg, n in con.execute(SQL_CADEIRAS).fetchall():
        cadeiras.setdefault(cod, []).extend([sg, n])
    linhas = con.execute(SQL_MUNICIPIOS).fetchall()
    con.close()

    def num(x: object, casas: int = 0) -> float | int | None:
        if x is None:
            return None
        return round(float(x), casas) if casas else round(float(x))

    municipios = []
    for (
        cod, nome, uf, voto24, pc_class, votos24, qt_ver, camara, sg_pref, vl_pref, voto22,
        qt_cand, receita, publico, propaganda, canal,
    ) in linhas:  # fmt: skip
        municipios.append(
            [
                cod, nome, UFS.index(uf), 1 if cod in CAPITAIS else 0,
                num(voto24, 3), num(pc_class, 1), votos24 or 0,
                qt_ver or 0, num(camara, 3), sg_pref or "", num(vl_pref, 2), num(voto22, 3),
                qt_cand or 0, num(receita), num(publico), num(propaganda),
                CANAIS.index(canal) if canal in CANAIS else -1,
                cadeiras.get(cod, []),
            ]
        )  # fmt: skip

    dados = {
        "ufs": UFS,
        "canais": CANAIS,
        "regua": {
            "esq": [regua[0], float(regua[1])],
            "dir": [regua[2], float(regua[3])],
            "meio": round(float(regua[4]), 3),
        },
        "partidos": partidos,
        "municipios": municipios,
    }
    PASTA.mkdir(exist_ok=True)
    (PASTA / "dados.json").write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    # o modelo é o corpo da página; aqui ganha o esqueleto completo (sem doctype o navegador entra em modo quirks)
    corpo = (PASTA / "modelo.html").read_text(encoding="utf-8")
    (PASTA / "index.html").write_text(
        '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        "</head>\n<body>\n" + corpo + "\n</body>\n</html>\n",
        encoding="utf-8",
    )
    kb = (PASTA / "dados.json").stat().st_size >> 10
    print(f"docs/municipios-painel/dados.json: {kb} KB, {len(municipios)} municípios")


if __name__ == "__main__":
    main()
