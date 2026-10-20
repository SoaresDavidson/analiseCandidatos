"""Gera docs/q4-painel/index.html, o painel interativo da pergunta de escolaridade.

Lê o banco (dados/processed/tse.duckdb) e as malhas do IBGE, e embute tudo em
docs/q4-painel/modelo.html no lugar de __DADOS__. O resultado é um HTML único que
abre direto no navegador, sem servidor.

Pré-requisitos (da raiz do repositório):
    uv run python -m scripts.coleta.coleta_tse candidatos municipio_tse_ibge --uf AM,GO,MA,MT,RS,SE
    uv run python -m scripts.coleta.coleta_ibge sidra malha --uf AM,GO,MA,MT,RS,SE
    uv run python scripts/carregar_staging.py 00_modelo 06_carga_nucleo 10_q4

Uso:
    uv run python scripts/gerar_painel_q4.py
"""

from __future__ import annotations

import json
import math
import os
from pathlib import Path

import duckdb

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"
MALHAS = RAIZ / "dados" / "raw" / "territorio"
MODELO = RAIZ / "docs" / "q4-painel" / "modelo.html"
SAIDA = RAIZ / "docs" / "q4-painel" / "index.html"

UFS = ["AM", "GO", "MA", "MT", "RS", "SE"]
GRUPO = {"População 18+ (Censo 2022)": 0, "Candidatos": 1, "Eleitos": 2}
CAPITAIS = {
    1302603: "Manaus",
    5208707: "Goiânia",
    2111300: "São Luís",
    5103403: "Cuiabá",
    4314902: "Porto Alegre",
    2800308: "Aracaju",
}

# Nome de urna: fora do DER (o dicionário o deixa de fora), então vem do arquivo do
# TSE pela chave da candidatura. O nome civil vem de POLITICO, no modelo.
SQL_ELEITOS = """
WITH urna AS (
    SELECT
        ano_eleicao::INTEGER AS ano,
        sg_ue,
        cd_cargo::INTEGER AS cd_cargo,
        sq_candidato::BIGINT AS sq_candidato,
        any_value(nm_urna_candidato) AS nm_urna
    FROM read_csv(
        'dados/raw/candidatos/*/candidatos_[0-9]*/consulta_cand_[0-9]*_??.csv',
        delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
        all_varchar = TRUE, union_by_name = TRUE
    )
    WHERE cd_tipo_eleicao = '2'
    GROUP BY ALL
)
SELECT
    q.ano,
    q.sg_uf,
    coalesce(q.cod_ibge, 0),
    q.cd_cargo,
    q.cd_grau_instrucao,
    coalesce(u.nm_urna, p.nm_candidato),
    pa.sg_partido,
    p.nm_candidato,
    c.sq_candidato  -- abre a ficha do eleito na aba Candidatos
FROM q4_candidatura AS q
INNER JOIN modelo.candidatura AS c ON q.id_candidatura = c.id_candidatura
LEFT JOIN modelo.politico AS p ON c.nr_titulo_eleitoral = p.nr_titulo_eleitoral
LEFT JOIN modelo.partido AS pa ON c.ano = pa.ano AND c.nr_partido = pa.nr_partido
LEFT JOIN urna AS u
    ON c.ano = u.ano AND c.sg_ue = u.sg_ue AND c.cd_cargo = u.cd_cargo AND c.sq_candidato = u.sq_candidato
WHERE q.fl_eleito
ORDER BY 1, 2, 4, 5 DESC, 6
"""


def municipios(con: duckdb.DuckDBPyConnection) -> dict[int, dict]:
    mun = {}
    for cod, nome, uf, ver, empate in con.execute(
        "SELECT cod_ibge, nm_municipio, sg_uf, qt_vereadores_eleitos, fl_empate_eleitos FROM q4_municipio"
    ).fetchall():
        mun[cod] = {"n": nome, "u": uf, "ver": ver, "pop": [0] * 4, "el": [0] * 4, "g": [0] * 8, "pref": None}
        mun[cod]["emp"] = bool(empate)
    for cod, nivel, qt_pop, qt_el in con.execute(
        "SELECT cod_ibge, cd_nivel, qt_populacao, qt_eleitos FROM q4_municipio_nivel"
    ).fetchall():
        mun[cod]["pop"][nivel - 1] = int(qt_pop)
        mun[cod]["el"][nivel - 1] = int(qt_el)
    for cod, grau, cargo, qt in con.execute(
        """SELECT cod_ibge, cd_grau_instrucao, cd_cargo, count(*) FROM q4_candidatura
           WHERE ano = 2024 AND fl_eleito AND cd_cargo IN (11, 13) GROUP BY ALL"""
    ).fetchall():
        mun[cod]["g"][grau - 1] += qt
        if cargo == 11:
            mun[cod]["pref"] = grau
    for m in mun.values():
        if sum(m["pop"]) == 0:  # sem Censo (criado depois de 2022)
            m["pop"] = None
    for cod in CAPITAIS:
        mun[cod]["cap"] = 1
    return mun


def aneis(geometria: dict) -> list[list[list[float]]]:
    poligonos = geometria["coordinates"] if geometria["type"] == "MultiPolygon" else [geometria["coordinates"]]
    return [anel for poligono in poligonos for anel in poligono]


def mapa(uf: str, largura: float = 640.0) -> dict:
    """Malha da UF em caminhos SVG: equiretangular com correção do cosseno da latitude."""
    geo = json.loads((MALHAS / f"malha_municipios_{uf}.geojson").read_text(encoding="utf-8"))
    pontos = [p for f in geo["features"] for anel in aneis(f["geometry"]) for p in anel]
    lon0, lon1 = min(p[0] for p in pontos), max(p[0] for p in pontos)
    lat0, lat1 = min(p[1] for p in pontos), max(p[1] for p in pontos)
    k = math.cos(math.radians((lat0 + lat1) / 2))
    escala = largura / ((lon1 - lon0) * k)
    caminhos = {}
    for f in geo["features"]:
        partes = []
        for anel in aneis(f["geometry"]):
            saida, ultimo = [], None
            for lon, lat in anel:
                x, y = (lon - lon0) * k * escala, (lat1 - lat) * escala
                if ultimo is None or abs(x - ultimo[0]) + abs(y - ultimo[1]) >= 0.7:  # simplifica
                    saida.append(f"{round(x, 1):g},{round(y, 1):g}")
                    ultimo = (x, y)
            if len(saida) >= 3:
                partes.append("M" + "L".join(saida) + "Z")
        caminhos[int(f["properties"]["codarea"])] = "".join(partes)
    return {"w": round(largura), "h": round((lat1 - lat0) * escala), "p": caminhos}


def main() -> None:
    os.chdir(RAIZ)  # os caminhos do read_csv são relativos à raiz
    con = duckdb.connect(str(BANCO), read_only=True)
    con.execute("INSTALL encodings; LOAD encodings;")
    dados = {
        "eleitos": [list(r) for r in con.execute(SQL_ELEITOS).fetchall()],
        "perfil": [
            [ano, uf, GRUPO[grupo], nivel, int(qt)]
            for ano, uf, grupo, nivel, qt in con.execute(
                "SELECT ano, sg_uf, grupo, cd_nivel, qt FROM q4_perfil_uf ORDER BY 1, 2, 3, 4"
            ).fetchall()
        ],
        "chance": [
            list(r)
            for r in con.execute(
                """SELECT ano, sg_uf, cd_cargo, cd_grau_instrucao, count(*), count(*) FILTER (WHERE fl_eleito)
                   FROM q4_candidatura GROUP BY ALL ORDER BY 1, 2, 3, 4"""
            ).fetchall()
        ],
        "mun": municipios(con),
        "mapas": {uf: mapa(uf) for uf in UFS},
        "cap": CAPITAIS,
    }
    con.close()

    texto = json.dumps(dados, ensure_ascii=False, separators=(",", ":"))
    assert "</script" not in texto
    corpo = MODELO.read_text(encoding="utf-8").replace("__DADOS__", texto)
    # o modelo é o corpo da página publicada como artefato; aqui ganha o esqueleto completo
    html = (
        '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        "</head>\n<body>\n" + corpo + "\n</body>\n</html>\n"
    )
    SAIDA.write_text(html, encoding="utf-8")
    print(f"{SAIDA.relative_to(RAIZ)}: {len(html) // 1024} KB, {len(dados['eleitos'])} eleitos")


if __name__ == "__main__":
    main()
