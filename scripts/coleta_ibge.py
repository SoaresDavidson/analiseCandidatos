"""Coleta dados do IBGE (SIDRA, FTP do PIB, malhas) para dados/raw/ibge/ e dados/raw/territorio/.

Uso:
    uv run scripts/coleta_ibge.py               # tudo
    uv run scripts/coleta_ibge.py sidra pib malha
    uv run scripts/coleta_ibge.py --force
"""

from __future__ import annotations

import json
import re
import sys

from coleta_comum import JSON, RAW, ROOT, baixar_json, baixar_zip, executar, log, session

UF = "PI"
COD_UF = 22  # Piauí

SIDRA = "https://apisidra.ibge.gov.br/values"
AGREGADOS = "https://servicodados.ibge.gov.br/api/v3/agregados"
SIDRA_LIMITE = 50_000  # valores por requisição

# tabela 9606 (Censo 2022): faixas etárias quinquenais, classificação 287
IDADES_9606 = [
    93070, 93084, 93085, 93086, 93087, 93088, 93089, 93090, 93091, 93092, 93093,
    93094, 93095, 93096, 93097, 93098, 49108, 49109, 60040, 60041, 6653,
]


def coletar_sidra(force: bool) -> None:
    pasta = RAW / "ibge" / "sidra"
    log("[ibge/sidra]")
    for tabela in (6579, 9606, 10061, 10062, 10295):
        baixar_json(f"{AGREGADOS}/{tabela}/metadados", pasta / f"{tabela}_metadados.json", force)

    # Estimativa de população por município nos anos de eleição (F2 do der-geral.md).
    # `p/last` trazia só 2026, e MUNICIPIO_ANO ficava sem população para 2016-2024.
    # A 6579 não tem 2022 (ano de Censo: a carga usa a soma da 9606) nem 2023.
    # Limite do SIDRA: 50 mil valores por chamada; 5 anos x 5.571 municípios = 27.855.
    baixar_json(
        f"{SIDRA}/t/6579/n6/all/v/9324/p/2016,2018,2020,2024,2026",
        pasta / "6579_populacao_municipios.json",
        force,
    )

    # pessoas 18+ por nível de instrução (total de idade/sexo/cor), por município
    baixar_json(
        f"{SIDRA}/t/10061/n6/all/v/2667/p/last/c1568/all/c58/95253/c2/6794/c86/95251",
        pasta / "10061_instrucao_municipios.json",
        force,
    )

    # --- substitutos municipais e recentes para o IDHM (ver coleta_pnud.py) ---
    # O IDHM por município só existe até o Censo 2010. Duas das suas três dimensões
    # (Renda e Educação) têm equivalente direto no Censo 2022, por município:

    # Renda: rendimento domiciliar per capita, médio (13431) e mediano (13534).
    baixar_json(
        f"{SIDRA}/t/10295/n6/all/v/13431,13534/p/2022/c2/6794/c86/95251/c58/95253",
        pasta / "10295_renda_domiciliar_municipios.json",
        force,
    )

    # Educação: número médio de anos de estudo das pessoas de 11 anos ou mais.
    baixar_json(
        f"{SIDRA}/t/10062/n6/all/v/13285/p/2022/c58/95253/c2/6794/c86/95251",
        pasta / "10062_anos_estudo_municipios.json",
        force,
    )

    # população por faixa etária, por município. 21 faixas x 5570 municípios
    # estoura o limite de 50k valores, então vai em lotes de faixas.
    destino = pasta / "9606_populacao_idade_municipios.json"
    if destino.exists() and not force:
        log(f"  ok      {destino.relative_to(ROOT)}")
        return
    lote = SIDRA_LIMITE // 5600
    linhas: list[dict] = []
    for i in range(0, len(IDADES_9606), lote):
        ids = ",".join(map(str, IDADES_9606[i : i + lote]))
        r = session.get(f"{SIDRA}/t/9606/n6/all/v/93/p/last/c86/95251/c2/6794/c287/{ids}", headers=JSON, timeout=600)
        r.raise_for_status()
        parte = r.json()
        linhas.extend(parte if not linhas else parte[1:])  # cabeçalho só uma vez
    destino.write_text(json.dumps(linhas, ensure_ascii=False), encoding="utf-8")
    log(f"  baixado {destino.relative_to(ROOT)} ({len(linhas) - 1} linhas)")


def coletar_pib(force: bool) -> None:
    """PIB dos municípios: pega a última edição publicada no FTP.

    Traz PIB e PIB per capita já calculado (o SIDRA não publica o per capita em
    nenhuma das tabelas de PIB municipal) e a hierarquia geográfica completa:
    meso, micro, região imediata e intermediária, hierarquia urbana, semiárido.

    As pastas de edição nem sempre são um ano só — a mais recente é `2022_2023/`.
    Casar apenas `\\d{4}/` pulava essa pasta em silêncio e baixava a edição de 2021,
    perdendo justamente 2022 e 2023.
    """
    base = "https://ftp.ibge.gov.br/Pib_Municipios/"
    log("[ibge/pib_municipios]")
    edicoes = re.findall(r'href="(\d{4}(?:_\d{4})?)/"', session.get(base, timeout=120).text)
    edicao = max(edicoes, key=lambda e: e[-4:])  # ordena pelo ano final da edição
    log(f"  edição mais recente: {edicao}")
    listagem = session.get(f"{base}{edicao}/base/", timeout=120).text
    for arq in re.findall(r'href="(base_de_dados_\d{4}_\d{4}_xlsx\.zip)"', listagem):
        baixar_zip(f"{base}{edicao}/base/{arq}", RAW / "ibge" / "pib_municipios" / arq, force)


def coletar_malha(force: bool) -> None:
    """Malha dos municípios da UF em GeoJSON, para mapas."""
    log("[ibge/malha]")
    url = (
        f"https://servicodados.ibge.gov.br/api/v3/malhas/estados/{COD_UF}"
        "?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio"
    )
    baixar_json(url, RAW / "territorio" / f"malha_municipios_{UF}.geojson", force)


COLETORES = {
    "sidra": coletar_sidra,
    "pib": coletar_pib,
    "malha": coletar_malha,
}


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
