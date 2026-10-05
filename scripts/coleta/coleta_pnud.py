"""Coleta o Painel IDHM do PNUD (planilhas linkadas na página) para dados/raw/pnud/idhm/.

ATENÇÃO — este arquivo NÃO tem IDHM por município. A coluna `AGREGACAO` do
`base_de_dados.xlsx` só assume `BRASIL` e `UF`. É série anual de 2012 a 2024, boa
para contexto nacional/estadual, e só.

O IDHM municipal existe apenas no Atlas Brasil (atlasbrasil.org.br/consulta/planilha),
e só para os Censos de 1991, 2000 e 2010 — não há 2022. Ou seja, o IDHM por
município mais recente é de 2010, catorze anos antes da eleição de 2024. Por isso
o eixo de "município rico/pobre" da Q3 é o PIB per capita (que temos ano a ano até
2023, via coleta_ibge.py), com o IDHM entrando só como validação cruzada.

Uso:
    uv run python -m scripts.coleta.coleta_pnud [--force]
"""

from __future__ import annotations

import re
import sys

from scripts.coleta.coleta_comum import RAW, baixar, executar, log, session

PAGINA = "https://www.undp.org/pt/node/379901"


def coletar_idhm(force: bool) -> None:
    log("[pnud/idhm]")
    html = session.get(PAGINA, timeout=120).text
    links = sorted(set(re.findall(r'href="([^"]+\.xlsx)"', html)))
    if not links:
        log(f"  nenhum .xlsx encontrado em {PAGINA}")
    for url in links:
        baixar(url, RAW / "pnud" / "idhm" / url.rsplit("/", 1)[-1], force)


COLETORES = {"idhm": coletar_idhm}


def coletar(force: bool = False) -> None:
    """Um coletor que falhe nao impede os outros; o erro e relatado no fim."""
    falhas = []
    for nome, c in COLETORES.items():
        try:
            c(force)
        except Exception as e:
            falhas.append(f"{nome} ({e})")
            log(f"  ERRO em {nome}: {e}")
    if falhas:
        raise RuntimeError(", ".join(falhas))


if __name__ == "__main__":
    sys.exit(executar(COLETORES, __doc__))
