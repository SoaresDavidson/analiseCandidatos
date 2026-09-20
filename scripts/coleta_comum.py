"""Infra compartilhada pelos coletores (coleta_tse, coleta_ibge, coleta_pnud).

TSE e UNDP ficam atrás do Akamai, que rejeita o TLS do requests/curl (HTTP 403).
curl_cffi impersonando o Chrome passa.
"""

from __future__ import annotations

import argparse
import json
import re
import zipfile
from collections.abc import Callable
from pathlib import Path

from curl_cffi import requests

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "dados" / "raw"

session = requests.Session(impersonate="chrome")
JSON = {"Accept": "application/json"}  # SIDRA devolve XML com o Accept padrão do Chrome


def log(*a: object) -> None:
    print(*a, flush=True)


def tamanho_remoto(url: str) -> int | None:
    """Tamanho total do arquivo, lido do Content-Range de uma requisição de 1 byte."""
    r = session.get(url, headers={"Range": "bytes=0-0"}, timeout=60)
    cr = r.headers.get("content-range", "")
    r.close()
    return int(cr.rsplit("/", 1)[-1]) if "/" in cr else None


def baixar(url: str, destino: Path, force: bool = False) -> Path | None:
    """Baixa url para destino. Retorna None se 404 (fonte inexistente para o ano)."""
    if destino.exists() and not force:
        log(f"  ok      {destino.relative_to(ROOT)}")
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".part")
    # retoma download interrompido (o CDN do TSE às vezes trava no meio)
    ja_tem = parcial.stat().st_size if parcial.exists() else 0
    headers = {"Range": f"bytes={ja_tem}-"} if ja_tem else {}
    r = session.get(url, headers=headers, stream=True, timeout=600)
    if r.status_code == 404:
        log(f"  404     {url}")
        return None
    if r.status_code == 416:
        # o servidor diz que o range passou do fim. Só aceita o .part como completo
        # se o tamanho bater: senão é download corrompido virando arquivo final.
        r.close()
        if ja_tem and ja_tem == tamanho_remoto(url):
            parcial.rename(destino)
            return destino
        log(f"  parcial inconsistente, rebaixando {destino.name}")
        parcial.unlink(missing_ok=True)
        return baixar(url, destino, force=True)
    r.raise_for_status()
    modo = "ab" if r.status_code == 206 else "wb"
    with parcial.open(modo) as f:
        for chunk in r.iter_content(chunk_size=1 << 20):
            f.write(chunk)
    r.close()
    parcial.rename(destino)
    log(f"  baixado {destino.relative_to(ROOT)} ({destino.stat().st_size >> 20} MB)")
    return destino


# Os CSVs do TSE terminam em _<UF>; _BRASIL (ou _brasil/_BR) é a concatenação de todos.
_SUFIXO_UF = re.compile(r"_(BRASIL|BR|ZZ|[A-Z]{2})\.(csv|txt)$", re.IGNORECASE)


def filtrar_uf(nomes: list[str], uf: str) -> list[str]:
    """Só os arquivos da UF pedida, mais os que não são quebrados por UF (leiautes, PDFs).

    Devolve a lista inteira se o filtro não achar nenhum dado — zip que não é
    quebrado por UF não deve ser extraído vazio.
    """
    manter = [n for n in nomes if (m := _SUFIXO_UF.search(n)) is None or m.group(1).upper() == uf.upper()]
    tem_dado = any(_SUFIXO_UF.search(n) for n in manter)
    return manter if tem_dado else nomes


def baixar_zip(url: str, destino: Path, force: bool = False, manter_uf: str | None = None) -> None:
    """Baixa o zip e extrai para pasta com o mesmo nome (sem .zip) ao lado.

    manter_uf: nos zips que o TSE quebra por UF (prestação de contas, eleitorado,
    comparecimento), extrai só os arquivos dessa UF. Como o `_BRASIL` é a
    concatenação de todas as UFs, extrair o zip inteiro dobra o volume à toa:
    prestação de contas de 2024 são ~12 GB completos contra ~92 MB só do PI.
    """
    pasta = destino.with_suffix("")
    if pasta.is_dir() and destino.exists() and not force:
        log(f"  ok      {pasta.relative_to(ROOT)}/")
        return
    if baixar(url, destino, force) is None:
        return
    pasta.mkdir(exist_ok=True)
    with zipfile.ZipFile(destino) as z:
        nomes = filtrar_uf(z.namelist(), manter_uf) if manter_uf else z.namelist()
        z.extractall(pasta, members=nomes)
    mb = sum(f.stat().st_size for f in pasta.rglob("*") if f.is_file()) >> 20
    log(f"  extraído {pasta.relative_to(ROOT)}/ ({len(nomes)} arquivo(s), {mb} MB)")


def baixar_json(url: str, destino: Path, force: bool = False) -> None:
    if destino.exists() and not force:
        log(f"  ok      {destino.relative_to(ROOT)}")
        return
    destino.parent.mkdir(parents=True, exist_ok=True)
    r = session.get(url, headers=JSON, timeout=600)
    r.raise_for_status()
    # encoding explícito: sem ele o Windows grava em cp1252 e o JSON fica ilegível
    destino.write_text(json.dumps(r.json(), ensure_ascii=False), encoding="utf-8")
    log(f"  baixado {destino.relative_to(ROOT)}")


def executar(coletores: dict[str, Callable[[bool], None]], doc: str | None) -> int:
    """CLI padrão dos coletores: `[nome ...] [--force]`. Retorna código de saída."""
    p = argparse.ArgumentParser(description=doc, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("nomes", nargs="*", metavar="nome", help=f"o que coletar: {', '.join(coletores)} (padrão: tudo)")
    p.add_argument("--force", action="store_true", help="rebaixa arquivos já existentes")
    args = p.parse_args()
    if desconhecidos := set(args.nomes) - set(coletores):
        p.error(f"desconhecido(s): {', '.join(sorted(desconhecidos))}")

    falhas = 0
    for nome in args.nomes or list(coletores):
        try:
            coletores[nome](args.force)
        except Exception as e:  # segue para o próximo; relata no fim
            falhas += 1
            log(f"  ERRO em {nome}: {e}")
    if falhas:
        log(f"\n{falhas} coletor(es) falharam")
    return 1 if falhas else 0
