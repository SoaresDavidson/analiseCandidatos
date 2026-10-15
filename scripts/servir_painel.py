"""Abre o painel do grupo como site local (http://localhost:8000/painel.html).

Serve a pasta docs/ só para este computador (127.0.0.1). Antes, baixa do TSE as
fotos dos eleitos que ainda não estão em docs/candidatos-painel/fotos/ (a lista
vem de dados.json, que está no git: não precisa do banco). Na primeira vez são
~14 mil fotos, uns 3 minutos; depois abre na hora.

Uso (da raiz do repositório):
    uv run python -m scripts.servir_painel              # baixa o que faltar e abre o navegador
    uv run python -m scripts.servir_painel --porta 8080
    uv run python -m scripts.servir_painel --sem-fotos  # não busca fotos (a ficha mostra a inicial)

Para parar: Ctrl+C.
"""

from __future__ import annotations

import argparse
import functools
import json
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from scripts.coleta import fotos_tse

RAIZ = Path(__file__).resolve().parent.parent
DOCS = RAIZ / "docs"
CANDIDATOS = DOCS / "candidatos-painel"


class Silencioso(SimpleHTTPRequestHandler):
    """Não imprime uma linha por arquivo pedido (são milhares de fotos)."""

    def log_message(self, formato: str, *args: object) -> None:
        pass


def baixar_fotos() -> None:
    dados = json.loads((CANDIDATOS / "dados.json").read_text(encoding="utf-8"))
    pedidos = [(2000 + e[0], dados["ufs"][e[1]], sq) for e, sq in zip(dados["eleitos"], dados["sq"], strict=True)]
    print(f"Conferindo as fotos de {len(pedidos)} eleitos…")
    try:
        n = fotos_tse.garantir(pedidos, CANDIDATOS / "fotos")
        print(f"{n} de {len(pedidos)} fotos prontas.")
    except OSError as e:  # sem internet: o painel abre assim mesmo, com as iniciais
        print(f"Não deu para buscar as fotos no TSE ({e}). O painel abre sem as que faltam.")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--porta", type=int, default=8000)
    p.add_argument("--sem-fotos", action="store_true", help="não busca as fotos que faltam")
    p.add_argument("--nao-abrir", action="store_true", help="não abre o navegador")
    args = p.parse_args()

    if not args.sem_fotos:
        baixar_fotos()

    handler = functools.partial(Silencioso, directory=str(DOCS))
    for porta in range(args.porta, args.porta + 20):  # se a porta estiver ocupada, tenta a seguinte
        try:
            servidor = ThreadingHTTPServer(("127.0.0.1", porta), handler)
            break
        except OSError:
            continue
    else:
        raise SystemExit(f"nenhuma porta livre entre {args.porta} e {args.porta + 19}")

    url = f"http://localhost:{porta}/painel.html"
    print(f"\nPainel em {url}  (Ctrl+C para parar)")
    if not args.nao_abrir:
        webbrowser.open(url)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor parado.")
    finally:
        servidor.server_close()


if __name__ == "__main__":
    main()
