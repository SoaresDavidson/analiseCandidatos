"""Tira dos CSV do TSE os bytes que não existem em cp1252 (0x81, 0x8D, 0x8F, 0x90, 0x9D).

O TSE publica os arquivos em cp1252 (Latin-1 da Microsoft), mas algumas linhas trazem um
byte solto que não é caractere nenhum nessa codificação, como em "FÁ\\x8dTIMA" (um nome de
candidata) ou "22CM\\x9d" (a descrição de uma despesa). O DuckDB recusa a linha inteira:
com `ignore_errors` ela some (perde-se o candidato ou a despesa) e, sem ele, a carga para.
Tirar só o byte solto conserva a linha e o texto fica legível.

No país inteiro são poucas linhas (2 no cadastro de candidatos de 2002 a 2024, 1 nas
despesas de 2018 a 2024); o script lista cada arquivo e quantas linhas mudou. Roda depois
da coleta e antes da carga; rodar de novo não muda nada.

Uso (da raiz do repositório):
    uv run python -m scripts.coleta.limpar_bytes
"""

from __future__ import annotations

from pathlib import Path

from scripts.coleta.coleta_comum import RAW, ROOT, log

INVALIDOS = bytes([0x81, 0x8D, 0x8F, 0x90, 0x9D])
PEDACO = 1 << 26  # 64 MB por vez: há arquivos de mais de 1 GB


def limpar(arquivo: Path) -> int:
    """Reescreve o arquivo sem os bytes inválidos. Devolve quantas linhas mudaram (0 = intacto)."""
    with arquivo.open("rb") as f:
        tem = False
        while bloco := f.read(PEDACO):
            if any(b in bloco for b in INVALIDOS):
                tem = True
                break
    if not tem:
        return 0
    linhas = 0
    parcial = arquivo.with_suffix(arquivo.suffix + ".part")
    with arquivo.open("rb") as origem, parcial.open("wb") as destino:
        for linha in origem:
            limpa = linha.translate(None, INVALIDOS)
            linhas += limpa != linha
            destino.write(limpa)
    parcial.replace(arquivo)
    return linhas


def main() -> None:
    total = 0
    arquivos = sorted(RAW.glob("*/*/*/*.csv"))
    for arquivo in arquivos:
        if n := limpar(arquivo):
            total += n
            log(f"  {arquivo.relative_to(ROOT)}: {n} linha(s)")
    log(f"[limpar_bytes] {len(arquivos)} arquivos conferidos, {total} linha(s) corrigida(s)")


if __name__ == "__main__":
    main()
