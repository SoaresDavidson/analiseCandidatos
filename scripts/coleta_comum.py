"""Infra compartilhada pelos coletores (coleta_tse, coleta_ibge, coleta_pnud).

TSE e UNDP ficam atrás do Akamai, que rejeita o TLS do requests/curl (HTTP 403).
curl_cffi impersonando o Chrome passa.
"""

from __future__ import annotations

import argparse
import json
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
    if r.status_code == 416:  # já estava completo
        r.close()
        parcial.rename(destino)
        return destino
    r.raise_for_status()
    modo = "ab" if r.status_code == 206 else "wb"
    with parcial.open(modo) as f:
        for chunk in r.iter_content(chunk_size=1 << 20):
            f.write(chunk)
    r.close()
    parcial.rename(destino)
    log(f"  baixado {destino.relative_to(ROOT)} ({destino.stat().st_size >> 20} MB)")
    return destino


def baixar_zip(url: str, destino: Path, force: bool = False) -> None:
    """Baixa o zip e extrai para pasta com o mesmo nome (sem .zip) ao lado."""
    pasta = destino.with_suffix("")
    if pasta.is_dir() and destino.exists() and not force:
        log(f"  ok      {pasta.relative_to(ROOT)}/")
        return
    if baixar(url, destino, force) is None:
        return
    pasta.mkdir(exist_ok=True)
    with zipfile.ZipFile(destino) as z:
        z.extractall(pasta)
    log(f"  extraído {pasta.relative_to(ROOT)}/")


def baixar_json(url: str, destino: Path, force: bool = False) -> None:
    if destino.exists() and not force:
        log(f"  ok      {destino.relative_to(ROOT)}")
        return
    destino.parent.mkdir(parents=True, exist_ok=True)
    r = session.get(url, headers=JSON, timeout=600)
    r.raise_for_status()
    destino.write_text(json.dumps(r.json(), ensure_ascii=False))
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
