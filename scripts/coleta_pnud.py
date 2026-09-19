"""Coleta o Painel IDHM do PNUD (planilhas linkadas na página) para dados/raw/pnud/idhm/.

Uso:
    uv run scripts/coleta_pnud.py [--force]
"""

from __future__ import annotations

import re
import sys

from coleta_comum import RAW, baixar, executar, log, session

PAGINA = "https://www.undp.org/pt/node/379901"


def coletar_idhm(force: bool) -> None:
    log("[pnud/idhm]")
    html = session.get(PAGINA, timeout=120).text
    links = sorted(set(re.findall(r'href="([^"]+\.xlsx)"', html)))
    if not links:
        log(f"  nenhum .xlsx encontrado em {PAGINA}")
    for url in links:
        baixar(url, RAW / "pnud" / "idhm" / url.rsplit("/", 1)[-1], force)


COLETORES = {"idhm": coletar_idhm}


def coletar(force: bool = False) -> None:
    for c in COLETORES.values():
        c(force)


if __name__ == "__main__":
    sys.exit(executar(COLETORES, __doc__))
