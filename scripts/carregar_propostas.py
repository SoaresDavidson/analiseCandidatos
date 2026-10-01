"""Carrega PROPOSTA_GOVERNO e TERMO_PROPOSTA (Q6) a partir dos PDFs de proposta.

Uso (da raiz do repositório, depois de 00_modelo e 06_carga):
    uv run scripts/carregar_propostas.py              # extrai e grava em dados/processed/tse.duckdb
    uv run scripts/carregar_propostas.py --amostra 20 # só mede a taxa de PDF sem texto, sem banco

Lê dados/raw/proposta_governo/**/*.pdf (coleta_tse.py proposta_governo; só PI).
Regras do dicionário (docs/dossie/secoes/dicionario.md, PROPOSTA_GOVERNO e TERMO_PROPOSTA):
  * a candidatura sai do nome do arquivo, `{ano}{UF}{SQ_CANDIDATO}_{seq}.pdf`; o sufixo
    `_{seq}` só existe em 2024 e 2026, antes vale 1;
  * qt_caracteres conta só os não brancos: PDF escaneado tem de 1 a 43 caracteres de
    quebras e espaços, e contá-los o marcaria como texto;
  * fl_texto_extraido: pelo menos metade das páginas com 100 caracteres não brancos;
  * termos só das propostas com texto: minúsculas, sem stopwords, sem números.
Sem OCR: PDF escaneado entra com fl_texto_extraido = false e tx_conteudo nulo, para que a
perda do corpus seja um SELECT e não uma estimativa.

Idempotente: apaga as duas tabelas e recarrega. PDF cuja candidatura não existe em
modelo.candidatura fica de fora (FK) e é listado no fim.
"""

from __future__ import annotations

import argparse
import random
import re
import sys
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import duckdb
import pandas as pd
import pymupdf

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"
PDFS = RAIZ / "dados" / "raw" / "proposta_governo"

NOME = re.compile(r"^(?P<ano>\d{4})(?P<uf>[A-Z]{2})(?P<sq>\d+)(?:_(?P<seq>\d+))?\.pdf$", re.IGNORECASE)
MIN_CARACTERES_PAGINA = 100
TAM_MAX_TERMO = 60  # TERMO_PROPOSTA.termo é VARCHAR(60)

# Lista do NLTK para o português, mais as formas sem acento que aparecem em PDF mal gerado.
STOPWORDS = frozenset("""
a à ao aos aquela aquelas aquele aqueles aquilo as às até com como da das de dela delas
dele deles depois do dos e é ela elas ele eles em entre era eram éramos essa essas esse
esses esta está estamos estão estar estas estava estavam estávamos este esteja estejam
estejamos estes esteve estive estivemos estiver estivera estiveram estivéramos estiverem
estivermos estivesse estivessem estivéssemos estou eu foi fomos for fora foram fôramos
forem formos fosse fossem fôssemos fui há haja hajam hajamos hão havemos haver hei houve
houvemos houver houvera houverá houveram houvéramos houverão houverei houverem houveremos
houveria houveriam houveríamos houvermos houvesse houvessem houvéssemos isso isto já lhe
lhes mais mas me mesmo meu meus minha minhas muito na não nas nem no nos nós nossa nossas
nosso nossos num numa o os ou para pela pelas pelo pelos por qual quando que quem são se
seja sejam sejamos sem ser será serão serei seremos seria seriam seríamos seu seus só
somos sou sua suas também te tem tém temos tenha tenham tenhamos tenho terá terão terei
teremos teria teriam teríamos teu teus teve tinha tinham tínhamos tive tivemos tiver tivera
tiveram tivéramos tiverem tivermos tivesse tivessem tivéssemos tu tua tuas um uma umas uns
voce vocês você vos
ate entao esta estao ja nao sao tambem alem atraves cada sobre sob ainda onde assim
""".split())


def extrair(caminho: Path) -> dict:
    """Texto e métricas de um PDF. Roda em processo separado."""
    pymupdf.TOOLS.mupdf_display_errors(False)  # PDF malformado avisa no stderr mas extrai
    paginas: list[str] = []
    erro = None
    try:
        with pymupdf.open(caminho) as doc:
            paginas = [p.get_text() for p in doc]
    except Exception as e:  # PDF corrompido conta como sem texto, não derruba a carga
        erro = f"{type(e).__name__}: {e}"

    nao_brancos = [len(re.sub(r"\s", "", p)) for p in paginas]
    com_texto = sum(n >= MIN_CARACTERES_PAGINA for n in nao_brancos)
    texto = "\n".join(paginas).replace("\x00", "")
    qt = sum(nao_brancos)
    return {
        "nm_arquivo": caminho.name,
        "qt_paginas": len(paginas),
        "qt_caracteres": qt,
        "fl_texto_extraido": bool(paginas) and 2 * com_texto >= len(paginas),
        "tx_conteudo": texto if qt else None,
        "erro": erro,
    }


def termos(texto: str) -> Counter:
    # junta a hifenização de fim de linha ("educa-\nção") antes de quebrar em palavras
    texto = re.sub(r"-\s*\n\s*", "", texto.lower())
    return Counter(
        t for t in re.findall(r"[^\W\d_]+", texto)
        if 3 <= len(t) <= TAM_MAX_TERMO and t not in STOPWORDS
    )


def listar_pdfs() -> list[tuple[Path, re.Match]]:
    achados = []
    for p in sorted(PDFS.rglob("*")):
        if p.suffix.lower() == ".pdf" and (m := NOME.match(p.name)):
            achados.append((p, m))  # leiame*.pdf e afins não casam com o padrão
    return achados


def extrair_todos(pdfs: list[tuple[Path, re.Match]]) -> pd.DataFrame:
    linhas = []
    with ProcessPoolExecutor() as pool:
        for i, r in enumerate(pool.map(extrair, [p for p, _ in pdfs], chunksize=8), 1):
            linhas.append(r)
            if i % 100 == 0 or i == len(pdfs):
                print(f"  {i}/{len(pdfs)} PDFs", flush=True)
    df = pd.DataFrame(linhas)
    df["ano"] = [int(m["ano"]) for _, m in pdfs]
    df["sq_candidato"] = [int(m["sq"]) for _, m in pdfs]
    df["nr_sequencial"] = [int(m["seq"] or 1) for _, m in pdfs]
    return df


def relatorio(df: pd.DataFrame) -> None:
    por_ano = df.groupby("ano").agg(pdfs=("nm_arquivo", "size"),
                                    sem_texto=("fl_texto_extraido", lambda s: int((~s).sum())))
    por_ano["%"] = (100 * por_ano["sem_texto"] / por_ano["pdfs"]).round(1)
    print(por_ano.to_string())
    total = len(df)
    sem = int((~df["fl_texto_extraido"]).sum())
    print(f"total: {total} PDFs, {sem} sem texto ({100 * sem / total:.1f}%)")
    for _, r in df[df["erro"].notna()].iterrows():
        print(f"  erro ao abrir {r.nm_arquivo}: {r.erro}")


def carregar(df: pd.DataFrame) -> int:
    if not BANCO.exists():
        print(f"banco não encontrado: {BANCO.relative_to(RAIZ)} — rode 00_modelo e 06_carga antes",
              file=sys.stderr)
        return 1
    con = duckdb.connect(str(BANCO))
    if not con.execute("SELECT count(*) FROM modelo.candidatura").fetchone()[0]:
        print("modelo.candidatura está vazia — rode 06_carga antes", file=sys.stderr)
        return 1

    con.register("pdf", df.drop(columns=["erro", "qt_paginas"]))
    # O nome do arquivo só traz (ano, sq_candidato); a UK de CANDIDATURA tem também
    # sg_ue e cd_cargo, então conferimos que o par aponta para uma candidatura só.
    con.execute("""
        CREATE OR REPLACE TEMP TABLE pdf_cand AS
        SELECT p.*, c.id_candidatura,
               count(c.id_candidatura) OVER (PARTITION BY p.nm_arquivo) AS qt_match
        FROM pdf p
        LEFT JOIN modelo.candidatura c USING (ano, sq_candidato)
    """)
    orfaos = con.execute("SELECT nm_arquivo FROM pdf_cand WHERE qt_match = 0 ORDER BY 1").fetchall()
    ambiguos = con.execute(
        "SELECT DISTINCT nm_arquivo FROM pdf_cand WHERE qt_match > 1 ORDER BY 1").fetchall()

    com_texto = df[df["fl_texto_extraido"]]
    tdf = pd.DataFrame(
        [(arq, t, n) for arq, tx in zip(com_texto["nm_arquivo"], com_texto["tx_conteudo"])
         for t, n in termos(tx).items()],
        columns=["nm_arquivo", "termo", "qt_frequencia"],
    )
    con.register("termo", tdf)

    # Cada DELETE na própria transação: o DuckDB recusa apagar a mãe na mesma transação
    # em que apagou as filhas (limitação das FKs dele), como em 06_carga_modelo.sql.
    con.execute("DELETE FROM modelo.termo_proposta")
    con.execute("DELETE FROM modelo.proposta_governo")
    con.execute("BEGIN")
    con.execute("""
        INSERT INTO modelo.proposta_governo
        SELECT id_candidatura, nr_sequencial, nm_arquivo, qt_caracteres,
               fl_texto_extraido, tx_conteudo
        FROM pdf_cand WHERE qt_match = 1
    """)
    con.execute("""
        INSERT INTO modelo.termo_proposta
        SELECT p.id_candidatura, p.nr_sequencial, t.termo, t.qt_frequencia
        FROM termo t JOIN pdf_cand p USING (nm_arquivo)
        WHERE p.qt_match = 1
    """)
    con.execute("COMMIT")

    n_prop, n_termo = con.execute("""
        SELECT (SELECT count(*) FROM modelo.proposta_governo),
               (SELECT count(*) FROM modelo.termo_proposta)
    """).fetchone()
    con.close()

    print(f"proposta_governo: {n_prop} linhas; termo_proposta: {n_termo} linhas")
    print(f"sem candidatura em modelo.candidatura: {len(orfaos)} de {len(df)}")
    for (a,) in orfaos:
        print(f"  {a}")
    if ambiguos:
        print(f"(ano, sq_candidato) com mais de uma candidatura, deixados de fora: {len(ambiguos)}")
        for (a,) in ambiguos:
            print(f"  {a}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--amostra", type=int, metavar="N",
                    help="extrai N PDFs sorteados e só mede a taxa sem texto; não abre o banco")
    args = ap.parse_args()

    pdfs = listar_pdfs()
    if not pdfs:
        print(f"nenhum PDF em {PDFS.relative_to(RAIZ)} — rode coleta_tse.py proposta_governo",
              file=sys.stderr)
        return 1
    if args.amostra:
        pdfs = sorted(random.Random(0).sample(pdfs, min(args.amostra, len(pdfs))))

    print(f"[pdf] extraindo {len(pdfs)} PDFs")
    df = extrair_todos(pdfs)
    relatorio(df)
    return 0 if args.amostra else carregar(df)


if __name__ == "__main__":
    sys.exit(main())
