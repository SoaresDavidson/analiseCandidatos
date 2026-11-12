"""Saída comum dos geradores de painel: grava os dados de cada página para o app React.

O app (web/) lê cada arquivo de web/public/dados/ por fetch; os geradores
gerar_painel_*.py só montam os dados e chamam gravar().
"""

from __future__ import annotations

import json
import math
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DADOS_WEB = RAIZ / "web" / "public" / "dados"
MALHAS = RAIZ / "dados" / "raw" / "territorio"

# As 27 UFs em ordem alfabética da sigla: o índice de `ufs` nos JSON das páginas com a base do país
UFS_BR = [
    "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
    "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
]  # fmt: skip


def gravar(nome: str, dados: object) -> Path:
    """Grava `dados` como JSON compacto em web/public/dados/<nome> e devolve o caminho."""
    saida = DADOS_WEB / nome
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{saida.relative_to(RAIZ)}: {saida.stat().st_size >> 10} KB")
    return saida


# Código do IBGE das 27 capitais (marca "capital" nas páginas com a base do país)
CAPITAIS_BR = {
    1200401, 2704302, 1302603, 1600303, 2927408, 2304400, 5300108, 3205309, 5208707, 2111300,
    3106200, 5002704, 5103403, 1501402, 2507507, 2611606, 2211001, 4106902, 3304557, 2408102,
    1100205, 1400100, 4314902, 4205407, 2800308, 3550308, 1721000,
}  # fmt: skip


def aneis(geometria: dict) -> list[list[list[float]]]:
    poligonos = geometria["coordinates"] if geometria["type"] == "MultiPolygon" else [geometria["coordinates"]]
    return [anel for poligono in poligonos for anel in poligono]


def mapa(uf: str, largura: float = 640.0) -> dict:
    """Malha da UF em caminhos SVG, com escala própria (equiretangular com correção do cosseno da
    latitude). É o mapa das páginas ainda nos 6 estados; as do país usam gerar_malhas_web.py."""
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
