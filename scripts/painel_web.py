"""Saída comum dos geradores de painel: grava os dados de cada página para o app React.

O app (web/) lê cada arquivo de web/public/dados/ por fetch; os geradores
gerar_painel_*.py só montam os dados e chamam gravar().
"""

from __future__ import annotations

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DADOS_WEB = RAIZ / "web" / "public" / "dados"


def gravar(nome: str, dados: object) -> Path:
    """Grava `dados` como JSON compacto em web/public/dados/<nome> e devolve o caminho."""
    saida = DADOS_WEB / nome
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{saida.relative_to(RAIZ)}: {saida.stat().st_size >> 10} KB")
    return saida
