"""Lê o que foi baixado em dados/raw/ e gera docs/esquemas.md com o esquema real
de cada arquivo: colunas, número de linhas e uma linha de exemplo.

É o insumo do DER. A ideia é ninguém modelar pelo que a documentação do TSE diz,
e sim pelas colunas que existem de verdade no arquivo daquele ano.

Nos dados do TSE só lê os arquivos do país todo (`_BRASIL`/`_BR`, ou sem recorte
nenhum). Os arquivos por UF são fatias do nacional, com o mesmo cabeçalho: ler os
27 não acrescenta esquema e multiplica o tempo por 27. Use --todas-ufs para ler tudo.

Uso:
    uv run python -m scripts.inspecionar_esquemas
    uv run python -m scripts.inspecionar_esquemas --saida docs/esquemas.md
    uv run python -m scripts.inspecionar_esquemas --todas-ufs
"""

from __future__ import annotations

import argparse
import json
import re
import zipfile
from pathlib import Path

import duckdb
from scripts.coleta.coleta_comum import eh_nacional

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "dados" / "raw"

# CSV do TSE: ; como separador, aspas duplas, cp1252, tudo texto para não inferir
# tipo errado em CPF e número de candidato com zero à esquerda.
CSV_OPTS = (
    "delim=';', quote='\"', header=true, encoding='cp1252', "
    "all_varchar=true, union_by_name=true, ignore_errors=true"
)

# tira ano e UF do nome para agrupar arquivos da mesma família
_ANO_UF = re.compile(r"_(\d{4})(_(?:[A-Z]{2}|BRASIL|BR|ZZ|brasil))?(?=\.|$)", re.IGNORECASE)


def familia(p: Path) -> str:
    return _ANO_UF.sub("", p.stem)


def _sql_str(s: str) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def ler_cabecalho(con: duckdb.DuckDBPyConnection, arq: Path) -> tuple[str, ...]:
    """Só os nomes das colunas — barato, não varre o arquivo."""
    origem = f"read_csv({_sql_str(arq.as_posix())}, {CSV_OPTS})"
    try:
        return tuple(r[0] for r in con.sql(f"DESCRIBE SELECT * FROM {origem}").fetchall())
    except Exception:
        return ()


def inspecionar_tabular(con: duckdb.DuckDBPyConnection, arq: Path, contar: bool = False) -> dict | None:
    """Colunas e primeira linha de um CSV/TXT do TSE. `contar` varre o arquivo
    inteiro para dar o número de linhas — em arquivos de alguns GB isso leva
    minutos, e para desenhar o DER não faz falta. Por isso é opcional."""
    origem = f"read_csv({_sql_str(arq.as_posix())}, {CSV_OPTS})"
    try:
        cols = [r[0] for r in con.sql(f"DESCRIBE SELECT * FROM {origem}").fetchall()]
        n = con.sql(f"SELECT count(*) FROM {origem}").fetchone()[0] if contar else None
        amostra = con.sql(f"SELECT * FROM {origem} LIMIT 1").fetchall()
    except Exception as e:  # arquivo corrompido ou vazio
        return {"erro": str(e)[:200]}
    return {
        "colunas": cols,
        "linhas": n,
        "exemplo": dict(zip(cols, amostra[0])) if amostra else {},
    }


def _ler_texto(arq: Path) -> str:
    """Tolera arquivo gravado em cp1252 por engano (ver coleta_comum.baixar_json)."""
    b = arq.read_bytes()
    for enc in ("utf-8", "cp1252", "latin-1"):
        try:
            return b.decode(enc)
        except UnicodeDecodeError:
            continue
    return b.decode("utf-8", errors="replace")


def inspecionar_sidra(arq: Path) -> dict:
    """O primeiro registro de uma resposta do SIDRA é o dicionário de dimensões."""
    dados = json.loads(_ler_texto(arq))
    if not isinstance(dados, list) or not dados:
        return {"erro": "resposta do SIDRA vazia ou em formato inesperado"}
    cabecalho, *linhas = dados
    # o rótulo da coluna vira "D1C = Município (Código)"; o exemplo precisa da
    # mesma chave para casar na hora de montar a tabela
    rotulo = {k: f"{k} = {v}" for k, v in cabecalho.items()}
    primeira = {rotulo.get(k, k): v for k, v in (linhas[0] if linhas else {}).items()}
    return {
        "colunas": list(rotulo.values()),
        "linhas": len(linhas),
        "exemplo": primeira,
        "municipios": len({x.get("D1C") for x in linhas}) if linhas else 0,
    }


def inspecionar_geojson(arq: Path) -> dict:
    g = json.loads(_ler_texto(arq))
    feats = g.get("features", [])
    return {
        "colunas": sorted(feats[0].get("properties", {})) if feats else [],
        "linhas": len(feats),
        "exemplo": feats[0].get("properties", {}) if feats else {},
    }


def inspecionar_xlsx(arq: Path) -> dict:
    """Cabeçalho de um .xlsx sem abrir com openpyxl: lê o sharedStrings do zip."""
    with zipfile.ZipFile(arq) as z:
        ss = z.read("xl/sharedStrings.xml").decode("utf-8", errors="replace")
    vals = re.findall(r"<t[^>]*>(.*?)</t>", ss, re.S)
    if "Ano" not in vals:
        return {"colunas": vals[:40], "linhas": None, "exemplo": {}}
    i = vals.index("Ano")
    return {"colunas": vals[i : i + 45], "linhas": None, "exemplo": {}}


def escrever(saida: Path, secoes: dict[str, list[tuple[Path, dict]]]) -> None:
    L = [
        "# Esquemas reais dos arquivos baixados",
        "",
        "Gerado por `scripts/inspecionar_esquemas.py` a partir de `dados/raw/`.",
        "**Não editar à mão** — rode o script de novo.",
        "",
        "Cada bloco mostra as colunas que o arquivo tem de verdade, quantas linhas,",
        "e uma linha de exemplo. Use isto para desenhar o DER, não a documentação.",
        "",
    ]
    for secao, itens in secoes.items():
        if not itens:
            continue
        L += [f"## {secao}", ""]
        for arq, info in sorted(itens, key=lambda t: str(t[0])):
            rel = arq.relative_to(ROOT).as_posix()
            anos = info.get("anos") or []
            faixa = f" ({anos[0]}–{anos[-1]})" if len(anos) > 1 else (f" ({anos[0]})" if anos else "")
            L += [f"### `{familia(arq)}`{faixa}", "", f"Fonte: `{rel}`", ""]
            if "erro" in info:
                L += [f"> ⚠️ não foi possível ler: {info['erro']}", ""]
                continue
            n = info.get("linhas")
            extra = f", {info['municipios']} municípios" if info.get("municipios") else ""
            if info.get("anos"):
                L += [f"Anos com este mesmo esquema: **{', '.join(info['anos'])}**", ""]
            L += [f"{len(info['colunas'])} colunas" + (f", {n:,} linhas".replace(",", ".") if n else "") + extra, ""]
            L += ["| # | coluna | exemplo |", "|---|---|---|"]
            for i, c in enumerate(info["colunas"], 1):
                v = str(info["exemplo"].get(c, ""))[:60].replace("|", "\\|")
                L.append(f"| {i} | `{c}` | {v} |")
            L.append("")
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text("\n".join(L), encoding="utf-8")
    print(f"escrito: {saida.relative_to(ROOT)} ({len(L)} linhas)")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--saida", default="docs/esquemas.md")
    ap.add_argument("--contar", action="store_true",
                    help="conta as linhas de cada arquivo (varre tudo; leva minutos em GBs)")
    ap.add_argument("--todas-ufs", action="store_true",
                    help="lê também os arquivos por UF, não só os do país todo")
    args = ap.parse_args()

    con = duckdb.connect()
    con.execute("INSTALL encodings; LOAD encodings;")

    secoes: dict[str, list[tuple[Path, dict]]] = {
        "TSE": [], "IBGE — SIDRA": [], "IBGE — PIB dos municípios": [],
        "IBGE — malha territorial": [],
    }

    # TSE: agrupa por ESQUEMA distinto, não por arquivo. Assim as duas gerações de
    # leiaute (ex.: prestação de contas .txt em português até 2016 vs .csv
    # SNAKE_CASE de 2018 em diante) aparecem como blocos separados, e cada bloco
    # diz em que anos aquele esquema vale.
    por_esquema: dict[tuple[str, tuple[str, ...]], list[Path]] = {}
    vistas: set[str] = set()   # toda família que existe em dados/raw
    lidas: set[str] = set()    # as que tinham arquivo nacional legível
    for arq in sorted(RAW.rglob("*.csv")) + sorted(RAW.rglob("*.txt")):
        if "ibge" in arq.parts or arq.stat().st_size == 0:
            continue
        vistas.add(familia(arq))
        if not args.todas_ufs and not eh_nacional(arq.name):
            continue
        print(f"  cabeçalho de {arq.relative_to(RAW)}", flush=True)
        cols = ler_cabecalho(con, arq)
        if cols:
            lidas.add(familia(arq))
            por_esquema.setdefault((familia(arq), cols), []).append(arq)

    # quem só existe por UF (ou só como eleição suplementar) fica fora do
    # esquemas.md — avisa em vez de sumir calado
    if fora := sorted(vistas - lidas):
        print(f"  sem arquivo nacional, fora do documento: {', '.join(fora)}", flush=True)

    for (fam, cols), arquivos in por_esquema.items():
        rep = max(arquivos, key=lambda p: p.stat().st_size)  # o maior representa
        print(f"  lendo {rep.relative_to(RAW)} ({len(cols)} colunas)", flush=True)
        info = inspecionar_tabular(con, rep, contar=args.contar)
        info["anos"] = sorted({a for p in arquivos for a in _ANO_UF.findall(p.stem) for a in [a[0]]})
        secoes["TSE"].append((rep, info))

    for arq in sorted((RAW / "ibge" / "sidra").glob("*_municipios.json")):
        print(f"  lendo {arq.relative_to(RAW)}")
        secoes["IBGE — SIDRA"].append((arq, inspecionar_sidra(arq)))

    for arq in sorted((RAW / "ibge" / "pib_municipios").rglob("*.xlsx")):
        print(f"  lendo {arq.relative_to(RAW)}")
        secoes["IBGE — PIB dos municípios"].append((arq, inspecionar_xlsx(arq)))

    for arq in sorted((RAW / "territorio").glob("*.geojson")):
        print(f"  lendo {arq.relative_to(RAW)}")
        secoes["IBGE — malha territorial"].append((arq, inspecionar_geojson(arq)))

    escrever(ROOT / args.saida, secoes)


if __name__ == "__main__":
    main()
