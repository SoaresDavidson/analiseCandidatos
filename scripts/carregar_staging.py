"""Aplica os scripts de sql/ (em ordem) sobre dados/processed/tse.duckdb.

Uso (da raiz do repositório):
    uv run scripts/carregar_staging.py                    # todos os sql/*.sql
    uv run scripts/carregar_staging.py 00_modelo 06_carga # só o modelo e a carga
    uv run scripts/carregar_staging.py --banco outro.duckdb 06_carga

Cada arquivo é executado comando a comando, com o tempo de cada um impresso na
tela e gravado em dados/processed/carga.log. Se um comando falhar, o script para
e mostra qual foi — o 06_carga_modelo.sql tem mais de 80 comandos e leva minutos,
então saber onde parou importa.

Os caminhos dentro dos .sql são relativos à raiz, então o script muda para lá.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

import duckdb

RAIZ = Path(__file__).resolve().parent.parent


def rotulo(sql: str) -> str:
    """Primeira linha útil do comando, sem os comentários que o precedem."""
    linhas = [l.strip() for l in sql.splitlines() if l.strip() and not l.strip().startswith("--")]
    return (linhas[0] if linhas else sql.strip())[:100]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("filtros", nargs="*", help="trechos do nome dos scripts (ex.: 00_modelo 06_carga)")
    ap.add_argument("--banco", default=str(RAIZ / "dados" / "processed" / "tse.duckdb"))
    ap.add_argument("--continuar", action="store_true", help="não para no primeiro erro")
    args = ap.parse_args()

    scripts = sorted((RAIZ / "sql").glob("*.sql"))
    if args.filtros:
        scripts = [s for s in scripts if any(f in s.stem for f in args.filtros)]
    if not scripts:
        print("nenhum script sql encontrado", file=sys.stderr)
        return 1

    banco = Path(args.banco).resolve()
    banco.parent.mkdir(parents=True, exist_ok=True)
    log = open(RAIZ / "dados" / "processed" / "carga.log", "a", encoding="utf-8")

    def escreve(msg: str) -> None:
        print(msg, flush=True)
        log.write(msg + "\n"); log.flush()

    os.chdir(RAIZ)
    con = duckdb.connect(str(banco))
    falhas = 0
    for s in scripts:
        comandos = duckdb.extract_statements(s.read_text(encoding="utf-8"))
        escreve(f"\n[sql] {s.name}: {len(comandos)} comandos — {time.strftime('%Y-%m-%d %H:%M:%S')}")
        t_arq = time.time()
        for i, cmd in enumerate(comandos, 1):
            t = time.time()
            try:
                con.execute(cmd.query)
                escreve(f"  ok   {i:3} {time.time() - t:7.1f}s  {rotulo(cmd.query)}")
            except Exception as e:
                falhas += 1
                escreve(f"  ERRO {i:3} {time.time() - t:7.1f}s  {rotulo(cmd.query)}\n       {str(e).splitlines()[0][:400]}")
                if not args.continuar:
                    con.close()
                    return 1
        escreve(f"[sql] {s.name} terminou em {time.time() - t_arq:.0f}s")
    con.close()
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
