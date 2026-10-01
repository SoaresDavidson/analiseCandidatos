"""Corrige defeitos de sintaxe conhecidos em três arquivos do TSE, no lugar, antes da carga.

    uv run scripts/sanear_raw.py            # corrige
    uv run scripts/sanear_raw.py --conferir # só mostra o que seria corrigido

Rodar depois da coleta e antes de `carregar_staging.py 06_carga`. É idempotente:
num arquivo já corrigido não muda nada.

Nenhum valor é alterado — só a sintaxe do arquivo, que impede o DuckDB de ler
algumas linhas:

1. `consulta_cand_2016_BRASIL.csv`: duas linhas trazem o byte 0x81, que não existe
   em cp1252 (um fragmento de UTF-8 dentro de "FÁTIMA"). O DuckDB rejeita a linha
   inteira, e a candidatura de ROSARIA DE FÁTIMA RODRIGUES (vereadora, Itatiaia,
   2016) some do modelo. O byte é removido.

2. `receitas_candidatos_2014_brasil.txt` e `receitas_comites_2014_brasil.txt`:
   aspas sem escape dentro do nome do doador (`..."40" GOVERNADOR`). Cada uma
   "abre" um campo que engole as linhas seguintes. Com `ignore_errors` somem 11.734
   linhas (R$ 206 mi); com a leitura tolerante do 06_carga ainda somem 72. As aspas
   internas são dobradas, que é o escape padrão de CSV.

Como os valores nunca têm `";"` dentro, cada linha é partida pelos delimitadores
reais e o que sobrar de aspas dentro de um campo é escapado.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

ALVOS = {
    "candidatos/2016/candidatos_2016/consulta_cand_2016_BRASIL.csv": "byte_0x81",
    "prestacao_contas/2014/prestacao_contas_final_2014/receitas_candidatos_2014_brasil.txt": "aspas",
    "prestacao_contas/2014/prestacao_contas_final_2014/receitas_comites_2014_brasil.txt": "aspas",
}


_ASPA_SOLTA = re.compile(rb'(?<!")"(?!")')


def dobrar_aspas(linha: bytes) -> bytes:
    fim = linha[len(linha.rstrip(b"\r\n")):]
    corpo = linha.rstrip(b"\r\n")
    if not (corpo.startswith(b'"') and corpo.endswith(b'"')):
        return linha
    partes = corpo[1:-1].split(b'";"')
    # so aspas isoladas; uma aspa ja dobrada ("") fica como esta, o que torna a
    # correcao idempotente
    return b'"' + b'";"'.join(_ASPA_SOLTA.sub(b'""', p) for p in partes) + b'"' + fim


def sanear(arq: Path, modo: str, conferir: bool) -> int:
    alteradas = 0
    tmp = arq.with_suffix(arq.suffix + ".saneando")
    with open(arq, "rb") as i, open(tmp, "wb") as o:
        for n, linha in enumerate(i, 1):
            nova = linha.replace(b"\x81", b"") if modo == "byte_0x81" else dobrar_aspas(linha)
            if nova != linha:
                alteradas += 1
                if conferir:
                    print(f"    linha {n}: {linha[:120]!r}")
            o.write(nova)
    if conferir or alteradas == 0:
        tmp.unlink()
    else:
        tmp.replace(arq)
    return alteradas


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--raiz", default=str(RAIZ), help="pasta que contém dados/raw")
    ap.add_argument("--conferir", action="store_true", help="não altera nada, só lista as linhas")
    args = ap.parse_args()
    raw = Path(args.raiz) / "dados" / "raw"
    for rel, modo in ALVOS.items():
        arq = raw / rel
        if not arq.exists():
            print(f"  ausente: {rel}")
            continue
        n = sanear(arq, modo, args.conferir)
        print(f"  {'corrigiria' if args.conferir else 'corrigidas'} {n} linha(s): {rel}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
