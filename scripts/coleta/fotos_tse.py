"""Fotos dos candidatos, dos dados abertos do TSE (um zip por eleição e estado).

Só as fotos pedidas são buscadas, sem baixar o zip inteiro (zip_remoto), reduzidas
a 81×113 px (~2 KB) e gravadas como <pasta>/<ano>/<sq_candidato>.jpg. Quem já está
no disco não é buscado de novo.
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from pathlib import Path

import pymupdf

from scripts.coleta import zip_remoto
from scripts.coleta.coleta_comum import log

URL_FOTOS = "https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes{ano}/fotos/foto_cand{ano}_{uf}_div.zip"


def reduzir(jpg: bytes) -> bytes:
    """Metade do tamanho (161×225 → 81×113), JPEG qualidade 50."""
    pix = pymupdf.Pixmap(jpg)
    if pix.n - pix.alpha != 3:  # foto em tons de cinza ou CMYK: converte para RGB
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    if pix.alpha:
        pix = pymupdf.Pixmap(pix, 0)
    pix.shrink(1)
    return pix.tobytes("jpg", jpg_quality=50)


def garantir(pedidos: Iterable[tuple[int, str, int]], pasta: Path) -> int:
    """Grava as fotos de (ano, UF, sq_candidato) que ainda faltam. Devolve quantas existem."""
    pedidos = set(pedidos)
    for ano, uf in sorted({(a, u) for a, u, _ in pedidos}):
        destino = pasta / str(ano)
        destino.mkdir(parents=True, exist_ok=True)
        sqs = {sq for a, u, sq in pedidos if a == ano and u == uf}
        faltam = {sq for sq in sqs if not (destino / f"{sq}.jpg").exists()}
        if not faltam:
            continue
        url = URL_FOTOS.format(ano=ano, uf=uf)
        # o nome é F<UF><sq>_div.jpg ou .jpeg; o número é o que importa
        infos = {
            int(m.group(1)): i for i in zip_remoto.abrir(url).infolist() if (m := re.search(r"(\d{6,})", i.filename))
        }
        pedir = [infos[sq] for sq in faltam if sq in infos]
        log(f"  fotos {ano} {uf}: buscando {len(pedir)} de {len(sqs)}")
        for nome, dados in zip_remoto.ler_varios(url, pedir):
            sq = int(re.search(r"(\d{6,})", nome).group(1))
            try:
                (destino / f"{sq}.jpg").write_bytes(reduzir(dados))
            except Exception as e:  # foto corrompida no TSE: segue sem ela
                log(f"  foto ilegível {nome}: {e}")
    return sum(1 for a, _, sq in pedidos if (pasta / str(a) / f"{sq}.jpg").exists())
