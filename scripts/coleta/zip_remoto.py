"""Lê arquivos de dentro de um zip do TSE sem baixar o zip inteiro.

O CDN do TSE aceita pedidos por faixa de bytes (Range). Um zip guarda no fim a
lista dos arquivos com a posição de cada um, então dá para ler essa lista e
depois buscar só os arquivos que interessam. A prestação de contas de 2024 tem
1,3 GB; os recibos e despesas dos 6 estados somam menos de 100 MB. As fotos dos
candidatos vêm em um zip por estado, e só as dos eleitos são buscadas.
"""

from __future__ import annotations

import io
import struct
import time
import zipfile
import zlib
from collections.abc import Iterable
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from scripts.coleta.coleta_comum import ROOT, log, session, tamanho_remoto


class ArquivoRemoto(io.RawIOBase):
    """Arquivo somente leitura cujo conteúdo vem do servidor, por faixa de bytes."""

    def __init__(self, url: str) -> None:
        self.url, self.tam, self.pos = url, tamanho(url), 0

    def seekable(self) -> bool:
        return True

    def readable(self) -> bool:
        return True

    def tell(self) -> int:
        return self.pos

    def seek(self, deslocamento: int, de_onde: int = 0) -> int:
        base = {0: 0, 1: self.pos, 2: self.tam}[de_onde]
        self.pos = base + deslocamento
        return self.pos

    def readinto(self, buf) -> int:  # noqa: ANN001 (buffer do io)
        if self.pos >= self.tam or not len(buf):
            return 0
        dados = faixa(self.url, self.pos, min(self.tam, self.pos + len(buf)) - 1)
        buf[: len(dados)] = dados
        self.pos += len(dados)
        return len(dados)


def tamanho(url: str, tentativas: int = 3) -> int:
    """Tamanho do arquivo remoto, pelo Content-Range de um pedido de 1 byte.

    Com o zip fora do cache, o CDN às vezes ignora o pedido e manda o arquivo
    inteiro, que pode estourar o tempo: tenta de novo, com pausa. O HEAD fica por
    último porque o CDN já respondeu Content-Length: 1 para um zip de 50 MB.
    """
    for n in range(tentativas):
        try:
            if (tam := tamanho_remoto(url)) is not None:
                return tam
        except Exception as e:  # tempo esgotado no CDN
            log(f"  tentativa {n + 1} de ler o tamanho de {url}: {e}")
        time.sleep(5 * (n + 1))
    r = session.head(url, timeout=60)
    if r.status_code == 200 and int(r.headers.get("content-length") or 0) > 22:  # 22 = zip vazio
        return int(r.headers["content-length"])
    raise OSError(f"o servidor não informou o tamanho de {url}")


def faixa(url: str, inicio: int, fim: int, tentativas: int = 3) -> bytes:
    """Bytes de inicio a fim (inclusive).

    Às vezes o CDN responde 200 com o arquivo inteiro (visto com o zip ainda fora
    do cache dele). Tenta de novo; se insistir, recorta do arquivo que já veio.
    """
    for n in range(tentativas):
        r = session.get(url, headers={"Range": f"bytes={inicio}-{fim}"}, timeout=600)
        if r.status_code == 206:
            return r.content
        if r.status_code == 200 and n == tentativas - 1:
            return r.content[inicio : fim + 1]
        if r.status_code not in (200, 429, 500, 502, 503, 504):
            break
        time.sleep(2 * (n + 1))
    raise OSError(f"HTTP {r.status_code} ao pedir faixa de {url}")


def abrir(url: str) -> zipfile.ZipFile:
    """O zip remoto, pronto para listar (namelist/infolist)."""
    return zipfile.ZipFile(io.BufferedReader(ArquivoRemoto(url), buffer_size=1 << 20))


def ler(url: str, info: zipfile.ZipInfo) -> bytes:
    """Conteúdo de um arquivo do zip com um único pedido ao servidor.

    O cabeçalho local tem 30 bytes + nome + campo extra; o tamanho do extra só se
    sabe lendo o cabeçalho, então pede-se uma folga e corta-se depois.
    """
    folga = 30 + len(info.filename.encode()) + 1024
    bruto = faixa(url, info.header_offset, info.header_offset + folga + info.compress_size - 1)
    n_nome, n_extra = struct.unpack("<HH", bruto[26:30])
    dados = bruto[30 + n_nome + n_extra : 30 + n_nome + n_extra + info.compress_size]
    if info.compress_type == zipfile.ZIP_STORED:
        return dados
    if info.compress_type == zipfile.ZIP_DEFLATED:
        return zlib.decompress(dados, -15)
    raise OSError(f"compressão {info.compress_type} não suportada em {info.filename}")


def ler_varios(url: str, infos: Iterable[zipfile.ZipInfo], workers: int = 16) -> Iterable[tuple[str, bytes]]:
    """(nome, conteúdo) de vários arquivos do zip, buscados em paralelo."""
    with ThreadPoolExecutor(workers) as ex:
        yield from ex.map(lambda i: (i.filename, ler(url, i)), infos)


def extrair(url: str, pasta: Path, nomes: list[str], force: bool = False) -> None:
    """Extrai do zip remoto só os arquivos pedidos para pasta, como o baixar_zip faria."""
    z = abrir(url)
    infos = [i for i in z.infolist() if i.filename in nomes and (force or not (pasta / i.filename).exists())]
    if not infos:
        log(f"  ok      {pasta.relative_to(ROOT)}/")
        return
    pasta.mkdir(parents=True, exist_ok=True)
    for i in infos:
        # arquivos grandes vêm em pedaços pelo zipfile, para não segurar tudo na memória;
        # o .part só vira o arquivo no fim, para uma extração interrompida não passar por pronta
        parcial = pasta / (i.filename + ".part")
        with z.open(i) as origem, open(parcial, "wb") as destino:
            while bloco := origem.read(1 << 22):
                destino.write(bloco)
        parcial.replace(pasta / i.filename)
    mb = sum(i.file_size for i in infos) >> 20
    log(f"  extraído {pasta.relative_to(ROOT)}/ ({len(infos)} arquivo(s), {mb} MB, sem baixar o zip)")
