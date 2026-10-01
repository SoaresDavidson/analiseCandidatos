"""Carrega PROPOSTA_GOVERNO e TERMO_PROPOSTA a partir dos PDFs de dados/raw/proposta_governo/.

Rodar a partir da RAIZ do repositório, depois de 00_modelo e 06_carga (precisa de
modelo.candidatura para achar a candidatura de cada PDF):

    uv run scripts/carregar_propostas.py
    uv run scripts/carregar_propostas.py --limite 20     # só 20 PDFs, para testar

O nome do arquivo traz a chave: `{ano}{UF}{SQ_CANDIDATO}[_{seq}].pdf`. O sufixo
`_01`, `_02` só existe em 2024 e 2026 (um candidato pode ter mais de um PDF); nos
outros anos o sequencial é 1. A candidatura vem de modelo.candidatura por
(ano, sq_candidato), que é único de 2014 em diante. PDFs de candidatura que não está
no modelo são contados e ignorados: medido em 30/09/2026, são 42 de 1.622 — 11 de
eleições suplementares (R1) e 31 cujo SQ_CANDIDATO não existe no consulta_cand
(registro indeferido ou substituído depois do envio do plano).

Medido na mesma data: 1.580 PDFs carregados em 14 min; sem texto (escaneados) 27%
em 2016, 13% em 2020 e 8% em 2024.

Texto: pypdf, página a página. `fl_texto_extraido` é falso quando o PDF rende menos
de LIMIAR_TEXTO caracteres — um PDF escaneado com cabeçalho em texto não conta como
extraído (achado pr3-dudu-06 da revisão). Idempotente: apaga e recarrega as duas
tabelas.

TERMO_PROPOSTA: tokens de 3+ letras, em minúsculas, sem stopwords, com a frequência
por PDF. É o insumo da nuvem de palavras da Q6; a nuvem agrega por cargo/ano no SQL.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import time
import unicodedata
from collections import Counter
from pathlib import Path

import duckdb

RAIZ = Path(__file__).resolve().parent.parent
LIMIAR_TEXTO = 500  # caracteres; abaixo disso o PDF é tratado como escaneado

NOME_PDF = re.compile(r"^(\d{4})([A-Z]{2})(\d+)(?:_(\d+))?\.pdf$", re.IGNORECASE)
TOKEN = re.compile(r"[a-záéíóúâêôãõçà]{3,}", re.IGNORECASE)

# stopwords do português: artigos, preposições, pronomes, conjunções e o
# vocabulário de forma dos próprios programas ("proposta", "candidato"...).
STOPWORDS = set("""
a o os as um uma uns umas de da do das dos em na no nas nos por para com sem sob sobre
entre até ante após desde contra perante e ou mas nem que se não sim como quando onde
porque pois porém todavia contudo também já ainda mais menos muito muitos muita muitas
pouco poucos pouca poucas todo toda todos todas cada qual quais qualquer quaisquer
este esta estes estas esse essa esses essas aquele aquela aqueles aquelas isto isso
aquilo seu sua seus suas meu minha meus minhas nosso nossa nossos nossas dele dela
deles delas lhe lhes ele ela eles elas nós vós você vocês eu tu me te nos vos
ser é são era eram foi foram será serão seja sejam sendo sido estar está estão
estava estavam esteve estiveram esteja estejam estando ter tem têm tinha tinham teve
tiveram tenha tenham tendo haver há havia houve hão fazer faz fazem fez fizeram
ao aos à às pelo pela pelos pelas num numa nuns numas dum duma neste nesta nestes
nestas nesse nessa nesses nessas naquele naquela deste desta desse dessa daquele
daquela então assim bem mal aqui ali lá cá agora hoje sempre nunca através além
dentro fora antes depois durante mediante conforme segundo sob
proposta propostas plano planos governo programa programas candidato candidata
candidatura candidatos partido coligação eleição eleições município municipal
municipais prefeito prefeita prefeitura vice vereador vereadores gestão
""".split())


def sem_acento(s: str) -> str:
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()


def extrair_texto(pdf: Path) -> str:
    import logging

    from pypdf import PdfReader

    # fontes com codificação exótica geram um aviso por página; não muda o resultado
    logging.getLogger("pypdf").setLevel(logging.ERROR)
    try:
        leitor = PdfReader(str(pdf))
        return "\n".join((p.extract_text() or "") for p in leitor.pages)
    except Exception as e:  # PDF corrompido ou criptografado: entra como sem texto
        print(f"  [aviso] {pdf.name}: {str(e)[:80]}", file=sys.stderr)
        return ""


def termos(texto: str) -> Counter:
    c: Counter = Counter()
    for t in TOKEN.findall(texto.lower()):
        if t in STOPWORDS or sem_acento(t) in STOPWORDS:
            continue
        c[t[:60]] += 1
    return c


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--banco", default=str(RAIZ / "dados" / "processed" / "tse.duckdb"))
    ap.add_argument("--raiz", default=str(RAIZ), help="pasta que contém dados/raw")
    ap.add_argument("--limite", type=int, default=0, help="processa só os N primeiros PDFs")
    args = ap.parse_args()

    raiz = Path(args.raiz)
    pdfs = sorted(p for p in (raiz / "dados" / "raw" / "proposta_governo").rglob("*.pdf")
                  if p.name.lower() != "leiame.pdf")
    if args.limite:
        pdfs = pdfs[: args.limite]
    print(f"{len(pdfs)} PDFs encontrados")

    con = duckdb.connect(args.banco)
    cand = {(ano, sq): idc for idc, ano, sq in con.sql(
        "SELECT id_candidatura, ano, sq_candidato FROM modelo.candidatura WHERE ano >= 2014").fetchall()}
    if not cand:
        print("modelo.candidatura está vazia: rode 00_modelo e 06_carga antes", file=sys.stderr)
        return 1

    saida = raiz / "dados" / "processed"
    saida.mkdir(parents=True, exist_ok=True)
    arq_termo = saida / "_termos.tsv"
    propostas: list[tuple] = []
    stats = Counter()
    t0 = time.time()
    # termos vão por TSV (podem ser milhões de linhas); propostas, por executemany
    # (poucas centenas), para preservar as quebras de linha do texto.
    with open(arq_termo, "w", newline="", encoding="utf-8") as ft:
        wt = csv.writer(ft, delimiter="\t", lineterminator="\n")
        for i, pdf in enumerate(pdfs, 1):
            m = NOME_PDF.match(pdf.name)
            if not m:
                stats["nome fora do padrão"] += 1
                continue
            ano, uf, sq, seq = int(m[1]), m[2], int(m[3]), int(m[4] or 1)
            idc = cand.get((ano, sq))
            if idc is None:
                stats["sem candidatura no modelo"] += 1
                continue
            texto = extrair_texto(pdf)
            qt = len(texto.strip())
            extraido = qt >= LIMIAR_TEXTO
            stats[f"{ano} com texto" if extraido else f"{ano} SEM texto"] += 1
            propostas.append((idc, seq, f"{ano}/{uf}/{pdf.name}"[:60], qt, extraido, texto if extraido else None))
            if extraido:
                for termo, n in termos(texto).items():
                    wt.writerow([idc, seq, termo, n])
            if i % 100 == 0:
                print(f"  {i}/{len(pdfs)} ({time.time() - t0:.0f}s)", flush=True)

    con.execute("DELETE FROM modelo.termo_proposta")
    con.execute("DELETE FROM modelo.proposta_governo")
    con.executemany("INSERT INTO modelo.proposta_governo VALUES (?, ?, ?, ?, ?, ?)", propostas)
    con.execute(f"""
        INSERT INTO modelo.termo_proposta
        SELECT * FROM read_csv('{arq_termo.as_posix()}', delim='\t', header=false, quote='', escape='',
            columns={{'id_candidatura':'BIGINT','nr_sequencial':'INTEGER','termo':'VARCHAR','qt_frequencia':'INTEGER'}})""")
    n_prop = con.sql("SELECT count(*) FROM modelo.proposta_governo").fetchone()[0]
    n_termo = con.sql("SELECT count(*) FROM modelo.termo_proposta").fetchone()[0]
    con.close()
    arq_termo.unlink()

    print(f"\nproposta_governo: {n_prop:,} linhas | termo_proposta: {n_termo:,} linhas | {time.time() - t0:.0f}s".replace(",", "."))
    for k in sorted(stats):
        print(f"  {k}: {stats[k]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
