"""Aplica os scripts de sql/ (em ordem) sobre dados/processed/tse.duckdb.

Uso (da raiz do repositório):
    uv run scripts/carregar_staging.py            # todos os sql/*.sql
    uv run scripts/carregar_staging.py 01_staging # só um

Os caminhos dentro dos .sql são relativos à raiz, então o script muda para lá.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import duckdb

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"


def main(filtros: list[str]) -> int:
    scripts = sorted((RAIZ / "sql").glob("*.sql"))
    if filtros:
        scripts = [s for s in scripts if any(f in s.stem for f in filtros)]
    if not scripts:
        print("nenhum script sql encontrado", file=sys.stderr)
        return 1

    BANCO.parent.mkdir(parents=True, exist_ok=True)
    os.chdir(RAIZ)
    con = duckdb.connect(str(BANCO))
    for s in scripts:
        print(f"[sql] {s.name}")
        con.execute(s.read_text(encoding="utf-8"))
    con.close()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
