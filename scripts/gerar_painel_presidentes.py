"""Gera os dados da página dos presidentes para o app React: web/public/dados/presidentes.json
e as fotos em web/public/img/presidentes/.

A eleição de presidente fica fora do banco (a coleta do projeto é por estado e não traz os
arquivos nacionais). Este script busca no TSE só os arquivos "_BR" de cada eleição, sem baixar
os zips inteiros (zip_remoto), e faz as contas com SQL direto nos CSV:

    votacao_candidato_munzona_<ano>_BR.csv   votos de cada candidato por município e turno
    bem_candidato_<ano>_BR.csv               bens declarados (de 2006 em diante)
    foto_cand<ano>_BR_div.zip                fotos do registro (quando o TSE publica)

Os arquivos ficam em dados/raw/presidente/<ano>/ e só são buscados de novo com --force.
O código do município no TSE vira o do IBGE pela tabela modelo.municipio do banco.

Uso (da raiz do repositório):
    uv run python -m scripts.gerar_painel_presidentes
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

import duckdb

from scripts.coleta import zip_remoto
from scripts.coleta.coleta_comum import log
from scripts.painel_web import UFS_BR, gravar

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"
BRUTO = RAIZ / "dados" / "raw" / "presidente"
FOTOS = RAIZ / "web" / "public" / "img" / "presidentes"
CDN = "https://cdn.tse.jus.br/estatistica/sead"
ANOS = [2002, 2006, 2010, 2014, 2018, 2022, 2026]
# quantos candidatos de cada eleição ganham foto e lista de bens (os mais votados do 1º turno)
DESTAQUES = 4

CSV = "delim = ';', quote = '\"', header = TRUE, encoding = 'cp1252', all_varchar = TRUE"


def buscar(ano: int, zip_: str, nome: str, force: bool) -> Path | None:
    """Extrai um arquivo do zip do TSE para dados/raw/presidente/<ano>/; None se não existir lá."""
    pasta = BRUTO / str(ano)
    destino = pasta / nome
    if destino.exists() and not force:
        return destino
    try:
        zip_remoto.extrair(f"{CDN}/odsele/{zip_}", pasta, [nome], force)
    except OSError as e:
        log(f"  {ano}: sem {zip_} no TSE ({e})")
        return None
    return destino if destino.exists() else None


def fotos(ano: int, sqs: list[int]) -> set[int]:
    """Grava as fotos pedidas (tamanho do TSE) e devolve os sq que têm foto."""
    destino = FOTOS / str(ano)
    faltam = [sq for sq in sqs if not (destino / f"{sq}.jpg").exists()]
    if faltam:
        url = f"{CDN}/eleicoes/eleicoes{ano}/fotos/foto_cand{ano}_BR_div.zip"
        try:
            infos = {
                int(m.group(1)): i
                for i in zip_remoto.abrir(url).infolist()
                if (m := re.search(r"(\d{6,})", i.filename))
            }
            pedir = [infos[sq] for sq in faltam if sq in infos]
            destino.mkdir(parents=True, exist_ok=True)
            for nome, dados in zip_remoto.ler_varios(url, pedir):
                sq = int(re.search(r"(\d{6,})", nome).group(1))
                (destino / f"{sq}.jpg").write_bytes(dados)
        except OSError as e:
            log(f"  {ano}: sem fotos no TSE ({e})")
    return {sq for sq in sqs if (destino / f"{sq}.jpg").exists()}


def eleicao(con: duckdb.DuckDBPyConnection, ano: int, cods: list[int], force: bool) -> dict | None:
    """Os candidatos e os votos de uma eleição; `cods` é a ordem dos municípios nas listas `venc` e `pct`."""
    votos = buscar(
        ano,
        f"votacao_candidato_munzona/votacao_candidato_munzona_{ano}.zip",
        f"votacao_candidato_munzona_{ano}_BR.csv",
        force,
    )
    if not votos:
        return None
    colunas = {c[0] for c in con.execute(f"DESCRIBE SELECT * FROM read_csv('{votos}', {CSV})").fetchall()}
    qt = "QT_VOTOS_NOMINAIS_VALIDOS" if "QT_VOTOS_NOMINAIS_VALIDOS" in colunas else "QT_VOTOS_NOMINAIS"
    con.execute(
        f"""CREATE OR REPLACE TEMP TABLE v AS
            SELECT NR_TURNO::INTEGER AS turno, SG_UF AS uf, lpad(CD_MUNICIPIO, 5, '0') AS cod_tse,
                   SQ_CANDIDATO::BIGINT AS sq, NR_CANDIDATO::INTEGER AS nr, NM_URNA_CANDIDATO AS urna,
                   NM_CANDIDATO AS nome, SG_PARTIDO AS partido, DS_SIT_TOT_TURNO AS situacao,
                   {qt}::BIGINT AS votos
            FROM read_csv('{votos}', {CSV})
            WHERE CD_CARGO = '1'"""
    )
    # candidatos, do mais votado no 1º turno ao menos votado
    cands = con.execute(
        """SELECT sq, any_value(nr), any_value(urna), any_value(nome), any_value(partido),
                  sum(votos) FILTER (WHERE turno = 1) AS v1,
                  bool_or(situacao = 'ELEITO') AS eleito
           FROM v GROUP BY sq HAVING sum(votos) > 0 ORDER BY v1 DESC NULLS LAST, sq"""
    ).fetchall()
    if not cands:
        return None
    idx = {c[0]: i for i, c in enumerate(cands)}

    # bens declarados (de 2006 em diante), dos mais votados
    bens: dict[int, list] = {}
    arq_bens = (
        buscar(ano, f"bem_candidato/bem_candidato_{ano}.zip", f"bem_candidato_{ano}_BR.csv", force)
        if ano >= 2006
        else None
    )
    if arq_bens:
        for sq, tipo, valor in con.execute(
            f"""SELECT SQ_CANDIDATO::BIGINT, DS_TIPO_BEM_CANDIDATO,
                       sum(replace(VR_BEM_CANDIDATO, ',', '.')::DOUBLE)
                FROM read_csv('{arq_bens}', {CSV}) GROUP BY 1, 2 ORDER BY 1, 3 DESC"""
        ).fetchall():
            if sq in idx and idx[sq] < DESTAQUES:
                bens.setdefault(sq, []).append([tipo or "", round(valor)])
    com_foto = fotos(ano, [c[0] for c in cands[:DESTAQUES]])

    turnos = []
    for turno in sorted({r[0] for r in con.execute("SELECT DISTINCT turno FROM v").fetchall()}):
        total = [0] * len(cands)
        por_uf: dict[str, list[int]] = {}
        for uf, sq, n in con.execute(
            "SELECT uf, sq, sum(votos) FROM v WHERE turno = ? GROUP BY 1, 2", [turno]
        ).fetchall():
            if sq not in idx:
                continue
            total[idx[sq]] += int(n)
            por_uf.setdefault(uf, [0] * len(cands))[idx[sq]] += int(n)
        # em cada município (na ordem de `cods`): quem venceu e com que parte dos votos válidos; -1 sem voto
        mun: dict[int, tuple[int, int]] = {}
        for cod, sq, pct in con.execute(
            """WITH m AS (
                   SELECT x.cod_ibge, v.sq, sum(v.votos) AS n
                   FROM v INNER JOIN mun_tse AS x USING (cod_tse)
                   WHERE v.turno = ? GROUP BY 1, 2
               )
               SELECT cod_ibge, arg_max(sq, n), round(100.0 * max(n) / nullif(sum(n), 0))
               FROM m GROUP BY 1 HAVING sum(n) > 0""",
            [turno],
        ).fetchall():
            if sq in idx:
                mun[int(cod)] = (idx[sq], int(pct))
        turnos.append(
            {
                "turno": turno,
                "total": total,
                # os 27 estados na ordem de `ufs`; o exterior (ZZ) vai à parte
                "uf": [por_uf.get(uf, [0] * len(cands)) for uf in UFS_BR],
                "exterior": por_uf.get("ZZ"),
                "venc": [mun[c][0] if c in mun else -1 for c in cods],
                "pct": [mun[c][1] if c in mun else -1 for c in cods],
            }
        )
    # o eleito é o mais votado do último turno (nos arquivos antigos a situação nem sempre vem preenchida)
    final = turnos[-1]["total"]
    vencedor = max(range(len(cands)), key=lambda i: final[i])
    return {
        "ano": ano,
        # [sq, número, nome de urna, nome civil, partido, eleito, tem foto, bens ([tipo, valor]...) ou null]
        "cands": [
            [sq, nr, urna, nome, partido, 1 if i == vencedor else 0, 1 if sq in com_foto else 0, bens.get(sq)]
            for i, (sq, nr, urna, nome, partido, _, _) in enumerate(cands)
        ],
        "turnos": turnos,
    }


def main() -> None:
    os.chdir(RAIZ)
    force = "--force" in sys.argv
    con = duckdb.connect()
    con.execute("INSTALL encodings; LOAD encodings;")
    con.execute(f"ATTACH '{BANCO}' AS tse (READ_ONLY)")
    con.execute(
        "CREATE TEMP TABLE mun_tse AS SELECT lpad(cod_tse::VARCHAR, 5, '0') AS cod_tse, cod_ibge FROM tse.modelo.municipio"
    )
    # os municípios, na ordem em que as listas de cada turno são gravadas: [código IBGE, nome, índice da UF]
    municipios = [
        [cod, nome, UFS_BR.index(uf)]
        for cod, nome, uf in con.execute(
            "SELECT cod_ibge, nm_municipio, sg_uf FROM tse.modelo.municipio ORDER BY sg_uf, nm_municipio"
        ).fetchall()
    ]
    cods = [m[0] for m in municipios]
    eleicoes = []
    for ano in ANOS:
        log(f"[presidentes] {ano}")
        e = eleicao(con, ano, cods, force)
        if e:
            eleicoes.append(e)
            v1 = sum(e["turnos"][0]["total"])
            log(
                f"  {len(e['cands'])} candidatos, {len(e['turnos'])} turno(s), {v1} votos válidos no 1º, {sum(1 for x in e['turnos'][-1]['venc'] if x >= 0)} municípios"
            )
    gravar("presidentes.json", {"ufs": UFS_BR, "municipios": municipios, "eleicoes": eleicoes})


if __name__ == "__main__":
    main()
