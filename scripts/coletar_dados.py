"""Coleta todas as fontes listadas em APIs.md para dados/raw/.

Uso:
    uv run python -m scripts.coletar_dados            # todas as fontes
    uv run python -m scripts.coletar_dados tse ibge   # só alguns domínios
    uv run python -m scripts.coletar_dados --force    # rebaixa mesmo se já existir
    uv run python -m scripts.coletar_dados --uf PI    # só o PI onde há recorte por UF

Cada domínio tem seu próprio script, que também roda sozinho e aceita
filtros mais finos: coleta_tse.py, coleta_ibge.py, coleta_pnud.py.
"""

from __future__ import annotations

import sys

from scripts.coleta.coleta_comum import executar
from scripts.coleta.coleta_ibge import coletar as coleta_ibge
from scripts.coleta.coleta_pnud import coletar as coleta_pnud
from scripts.coleta.coleta_tse import coletar as coleta_tse

DOMINIOS = {
    "tse": coleta_tse,
    "ibge": coleta_ibge,
    "pnud": coleta_pnud,
}

if __name__ == "__main__":
    sys.exit(executar(DOMINIOS, __doc__))
