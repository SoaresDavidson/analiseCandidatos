"""Gera os mapas do app React: web/public/dados/malhas/brasil.json (os 27 estados),
malhas/<UF>.json (os municípios de cada estado) e malhas/municipios.json (os 5.570 municípios
do país num arquivo só, com o traço mais simples, para o mapa do Brasil inteiro), em caminhos SVG.

Todos os arquivos usam a MESMA projeção e o mesmo sistema de coordenadas (o Brasil com
1000 unidades de largura), para o mapa poder dar zoom do país para um estado só mudando
o viewBox. As coordenadas são arredondadas numa grade de 0,1 unidade (~420 m): como o
arredondamento não depende do sentido em que a borda é percorrida, dois vizinhos ficam
com a divisa idêntica, sem frestas.

Fonte: IBGE, API de malhas v3 (qualidade intermediária). O GeoJSON baixado fica em
dados/raw/territorio/ e só é baixado de novo com --force.

Uso (da raiz do repositório):
    uv run python -m scripts.gerar_malhas_web
"""

from __future__ import annotations

import json
import math
import sys

from scripts.coleta.coleta_comum import RAW, baixar_json, log
from scripts.painel_web import gravar

API = "https://servicodados.ibge.gov.br/api/v3/malhas"
FORMATO = "formato=application/vnd.geo+json&qualidade=intermediaria"
PASTA = RAW / "territorio"

# código do IBGE -> sigla
UF_IBGE = {
    11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
    21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA",
    31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC", 43: "RS",
    50: "MS", 51: "MT", 52: "GO", 53: "DF",
}  # fmt: skip

LARGURA = 1000.0
# caixa do Brasil em graus (com Fernando de Noronha e Trindade fora do quadro principal)
LON0, LON1, LAT0, LAT1 = -74.0, -34.75, -33.8, 5.3
K = math.cos(math.radians((LAT0 + LAT1) / 2))
ESCALA = LARGURA / ((LON1 - LON0) * K)
ALTURA = round((LAT1 - LAT0) * ESCALA)


# grade do mapa do país inteiro: 1 unidade (~4 km, menos de 1 px na tela), para as 5.570 cidades
# caberem num arquivo leve
GRADE_PAIS = 1.0


def projetar(lon: float, lat: float, grade: float = 0.1) -> tuple[float, float]:
    """Equirretangular com o cosseno da latitude média do país; arredonda na grade (0,1 por padrão)."""
    x, y = (lon - LON0) * K * ESCALA, (LAT1 - lat) * ESCALA
    return round(round(x / grade) * grade, 1), round(round(y / grade) * grade, 1)


def sem_alinhados(pts: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """Tira os pontos no meio de um trecho reto e os repetidos (não mudam o desenho). Repete até
    não sobrar nenhum: tirar um ponto de uma ponta fina pode deixar dois iguais lado a lado."""
    atual = pts
    while len(atual) >= 4:
        saida = []
        for i, (x, y) in enumerate(atual):
            (ax, ay), (bx, by) = atual[i - 1], atual[(i + 1) % len(atual)]
            if (x, y) != (ax, ay) and (x - ax) * (by - y) != (y - ay) * (bx - x):
                saida.append((x, y))
        if len(saida) < 3:
            return atual
        if len(saida) == len(atual):
            break
        atual = saida
    return atual


def caminho_curto(partes: list[list[tuple[float, float]]]) -> str:
    """Caminho SVG com passos relativos inteiros: menos caracteres que as coordenadas absolutas."""
    d = []
    for p in partes:
        x0, y0 = p[0]
        passos = "".join(f"{x - a:+g}{y - b:+g}" for (a, b), (x, y) in zip(p, p[1:], strict=False))
        d.append(f"M{x0:g},{y0:g}l{passos.lstrip('+')}z")
    return "".join(d)


def aneis(geometria: dict) -> list[list[list[float]]]:
    poligonos = geometria["coordinates"] if geometria["type"] == "MultiPolygon" else [geometria["coordinates"]]
    return [anel for poligono in poligonos for anel in poligono]


def area(pts: list[tuple[float, float]]) -> float:
    return abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1], strict=True))) / 2


def caminho(geometria: dict, area_minima: float, grade: float = 0.1) -> tuple[str, list[float], list[float]]:
    """(caminho SVG, caixa [x0, y0, x1, y1], centro do maior polígono). Ilhas menores que
    `area_minima` saem, menos a maior parte do território."""
    partes: list[list[tuple[float, float]]] = []
    for anel in aneis(geometria):
        pts: list[tuple[float, float]] = []
        for lon, lat in anel:
            p = projetar(lon, lat, grade)
            if not pts or p != pts[-1]:
                pts.append(p)
        if len(pts) > 1 and pts[0] == pts[-1]:
            pts.pop()
        if len(pts) >= 3:
            partes.append(pts)
    if not partes:  # cidade menor que a grade: um quadradinho no lugar dela
        lon, lat = aneis(geometria)[0][0]
        x, y = projetar(lon, lat, grade)
        partes.append([(x, y), (x + grade, y), (x + grade, y + grade), (x, y + grade)])
    partes.sort(key=area, reverse=True)
    partes = [p for i, p in enumerate(partes) if i == 0 or area(p) >= area_minima]
    if grade >= 1:  # o mapa do país: traço enxuto
        partes = [sem_alinhados(p) for p in partes]
        d = caminho_curto(partes)
    else:
        d = "".join("M" + "L".join(f"{x:g},{y:g}" for x, y in p) + "Z" for p in partes)
    xs = [x for p in partes for x, _ in p]
    ys = [y for p in partes for _, y in p]
    maior = partes[0]
    cx, cy = sum(x for x, _ in maior) / len(maior), sum(y for _, y in maior) / len(maior)
    return d, [min(xs), min(ys), max(xs), max(ys)], [round(cx, 1), round(cy, 1)]


def ler(nome: str, url: str, force: bool) -> dict:
    destino = PASTA / nome
    baixar_json(url, destino, force)
    return json.loads(destino.read_text(encoding="utf-8"))


def main() -> None:
    force = "--force" in sys.argv
    log("[malhas] estados")
    geo = ler("malha_ufs_BR.geojson", f"{API}/paises/BR?{FORMATO}&intrarregiao=UF", force)
    ufs = {}
    for f in geo["features"]:
        sigla = UF_IBGE[int(f["properties"]["codarea"])]
        d, caixa, centro = caminho(f["geometry"], area_minima=0.6)
        ufs[sigla] = {"d": d, "bb": caixa, "c": centro}
    gravar("malhas/brasil.json", {"w": round(LARGURA), "h": ALTURA, "ufs": dict(sorted(ufs.items()))})

    pais: dict[int, str] = {}
    for cod, sigla in sorted(UF_IBGE.items(), key=lambda t: t[1]):
        geo = ler(
            f"malha_municipios_{sigla}_intermediaria.geojson",
            f"{API}/estados/{cod}?{FORMATO}&intrarregiao=municipio",
            force,
        )
        municipios = {}
        for f in geo["features"]:
            cod = int(f["properties"]["codarea"])
            d, _, centro = caminho(f["geometry"], area_minima=0.02)
            municipios[cod] = [d, *centro]
            pais[cod] = caminho(f["geometry"], area_minima=1.0, grade=GRADE_PAIS)[0]
        gravar(f"malhas/{sigla}.json", {"uf": sigla, "bb": ufs[sigla]["bb"], "p": municipios})
    gravar("malhas/municipios.json", {"p": dict(sorted(pais.items()))})


if __name__ == "__main__":
    main()
