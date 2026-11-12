"""Baixa do TSE as fotos dos eleitos para o app React (web/public/fotos/<ano>/<sq>.jpg).

A lista vem das fichas em web/public/dados/ (estão no git: não precisa do banco): as do país,
candidatos/<UF>.json, e as do recorte original, candidatos-eleitos.json. Só baixa as que
faltam; na primeira vez são ~65 mil fotos, uns 15 minutos.
Se já houver fotos em docs/candidatos-painel/fotos (do servir_painel), copia de lá antes.

Uso (da raiz do repositório):
    uv run python -m scripts.baixar_fotos_web
ou, de web/:
    npm run fotos
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from scripts.coleta import fotos_tse

RAIZ = Path(__file__).resolve().parent.parent
DADOS = RAIZ / "web" / "public" / "dados"
DESTINO = RAIZ / "web" / "public" / "fotos"
ANTIGAS = RAIZ / "docs" / "candidatos-painel" / "fotos"


def main() -> None:
    if ANTIGAS.is_dir() and ANTIGAS.resolve() != DESTINO.resolve():
        shutil.copytree(ANTIGAS, DESTINO, dirs_exist_ok=True)
    pedidos = set()
    for arquivo in [*sorted((DADOS / "candidatos").glob("*.json")), DADOS / "candidatos-eleitos.json"]:
        if not arquivo.exists():
            continue
        dados = json.loads(arquivo.read_text(encoding="utf-8"))
        pedidos.update(
            (2000 + e[0], dados["ufs"][e[1]], sq) for e, sq in zip(dados["eleitos"], dados["sq"], strict=True)
        )
    print(f"Conferindo as fotos de {len(pedidos)} eleitos…")
    try:
        n = fotos_tse.garantir(pedidos, DESTINO)
        print(f"{n} de {len(pedidos)} fotos prontas em {DESTINO.relative_to(RAIZ)}.")
    except OSError as e:  # sem internet: o app abre assim mesmo, com as iniciais
        raise SystemExit(f"Não deu para buscar as fotos no TSE ({e}). O app mostra as iniciais no lugar.") from e


if __name__ == "__main__":
    main()
