"""Roda um arquivo de consultas sobre dados/processed/tse.duckdb e imprime cada resultado.

Uso (da raiz do repositório):
    uv run scripts/consultar.py sql/consultas/q10_carreira.sql
    uv run scripts/consultar.py sql/consultas/q10_carreira.sql --linhas 50

O banco abre só para leitura: consulta não altera carga. Os comentários `--` que
vêm logo antes de cada SELECT viram o título do resultado impresso.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import duckdb

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"


def comandos(sql: str) -> list[tuple[str, str]]:
    """Separa o arquivo em (título, comando). O título é o comentário que precede o comando."""
    saida = []
    for bloco in duckdb.extract_statements(sql):
        texto = bloco.query.strip()
        linhas = texto.splitlines()
        # só os comentários depois do último separador "-- ===": o cabeçalho da
        # seção fica de fora e o título é o do próprio comando
        separadores = [i for i, linha in enumerate(linhas) if linha.startswith("-- ===")]
        inicio = separadores[-1] + 1 if separadores else 0
        titulo = [linha.lstrip("- ").rstrip() for linha in linhas[inicio:] if linha.startswith("--")]
        saida.append((" ".join(titulo), texto))
    return saida


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("arquivo", type=Path)
    p.add_argument("--linhas", type=int, default=30, help="máximo de linhas impressas por resultado")
    args = p.parse_args()

    con = duckdb.connect(str(BANCO), read_only=True)
    for titulo, comando in comandos(args.arquivo.read_text(encoding="utf-8")):
        rel = con.sql(comando)
        if rel is None:  # SET VARIABLE e afins não devolvem tabela
            continue
        print(f"\n## {titulo}" if titulo else "\n##")
        print(rel.limit(args.linhas).df().to_string(index=False))
    con.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
