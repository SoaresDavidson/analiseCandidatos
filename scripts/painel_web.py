"""Saída comum dos geradores de painel: grava os dados de cada página para o app React.

O app (web/) lê cada arquivo de web/public/dados/ por fetch; os geradores
gerar_painel_*.py só montam os dados e chamam gravar().
"""

from __future__ import annotations

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DADOS_WEB = RAIZ / "web" / "public" / "dados"

# As 27 UFs em ordem alfabética da sigla: o índice de `ufs` nos JSON das páginas com a base do país
UFS_BR = [
    "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
    "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
]  # fmt: skip


def gravar(nome: str, dados: object) -> Path:
    """Grava `dados` como JSON compacto em web/public/dados/<nome> e devolve o caminho."""
    saida = DADOS_WEB / nome
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{saida.relative_to(RAIZ)}: {saida.stat().st_size >> 10} KB")
    return saida


# Código do IBGE das 27 capitais (marca "capital" nas páginas com a base do país)
CAPITAIS_BR = {
    1200401, 2704302, 1302603, 1600303, 2927408, 2304400, 5300108, 3205309, 5208707, 2111300,
    3106200, 5002704, 5103403, 1501402, 2507507, 2611606, 2211001, 4106902, 3304557, 2408102,
    1100205, 1400100, 4314902, 4205407, 2800308, 3550308, 1721000,
}  # fmt: skip
