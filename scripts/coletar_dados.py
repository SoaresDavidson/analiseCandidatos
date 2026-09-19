"""Coleta todas as fontes listadas em APIs.md para dados/raw/.

Uso:
    uv run scripts/coletar_dados.py            # todas as fontes
    uv run scripts/coletar_dados.py tse ibge   # só alguns domínios
    uv run scripts/coletar_dados.py --force    # rebaixa mesmo se já existir

Cada domínio tem seu próprio script, que também roda sozinho e aceita
filtros mais finos: coleta_tse.py, coleta_ibge.py, coleta_pnud.py.
"""

from __future__ import annotations

import sys

import coleta_ibge
import coleta_pnud
import coleta_tse
from coleta_comum import executar

DOMINIOS = {
    "tse": coleta_tse.coletar,
    "ibge": coleta_ibge.coletar,
    "pnud": coleta_pnud.coletar,
}

if __name__ == "__main__":
    sys.exit(executar(DOMINIOS, __doc__))
