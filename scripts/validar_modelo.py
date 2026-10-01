"""Confere o schema `modelo` carregado contra contagens feitas direto nos arquivos crus.

    uv run scripts/validar_modelo.py                     # dados/processed/tse.duckdb
    uv run scripts/validar_modelo.py --banco outro.duckdb

Rodar da raiz do repositório, depois de 06_carga (e de carregar_propostas, se
quiser ver as propostas). Cada linha `OK`/`!!` compara um número do modelo com o
mesmo número calculado só com os arquivos de dados/raw/. Os valores de referência
citados nos comentários foram medidos em 23–30/09/2026.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import duckdb

RAIZ = Path(__file__).resolve().parent.parent
O = "delim=';', quote='\"', header=true, encoding='cp1252', all_varchar=true, union_by_name=true"


def fmt(n: float) -> str:
    return f"{n:,}".replace(",", ".")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--banco", default=str(RAIZ / "dados" / "processed" / "tse.duckdb"))
    ap.add_argument("--raiz", default=str(RAIZ), help="pasta que contém dados/raw")
    args = ap.parse_args()
    banco = str(Path(args.banco).resolve())
    os.chdir(args.raiz)

    con = duckdb.connect(banco, read_only=True)
    con.execute("INSTALL encodings; LOAD encodings;")
    q = lambda sql: con.sql(sql).fetchone()[0]
    falhas = 0

    def linha(rot: str, modelo: int, cru: int) -> None:
        nonlocal falhas
        ok = modelo == cru
        falhas += not ok
        print(f"{'OK ' if ok else '!! '} {rot:<52} modelo={fmt(modelo):>14}  cru={fmt(cru):>14}", flush=True)

    print("== contagem por tabela ==")
    for (t,) in con.sql("SELECT table_name FROM duckdb_tables() WHERE schema_name='modelo' ORDER BY 1").fetchall():
        print(f"   {t:<30} {fmt(q(f'SELECT count(*) FROM modelo.{t}')):>12}")

    print("\n== integridade referencial (órfãos devem ser 0) ==")
    for rot, sql in [
        ("candidatura -> partido (ano, nr_partido)", "SELECT count(*) FROM modelo.candidatura c LEFT JOIN modelo.partido p USING (ano, nr_partido) WHERE p.nr_partido IS NULL"),
        ("candidatura -> eleicao", "SELECT count(*) FROM modelo.candidatura c LEFT JOIN modelo.eleicao e USING (cd_eleicao) WHERE e.cd_eleicao IS NULL"),
        ("candidatura -> politico (quando não nulo)", "SELECT count(*) FROM modelo.candidatura c LEFT JOIN modelo.politico p USING (nr_titulo_eleitoral) WHERE c.nr_titulo_eleitoral IS NOT NULL AND p.nr_titulo_eleitoral IS NULL"),
        ("votacao_candidato -> candidatura", "SELECT count(*) FROM modelo.votacao_candidato_municipio v LEFT JOIN modelo.candidatura c USING (id_candidatura) WHERE c.id_candidatura IS NULL"),
        ("receita: exatamente um de candidatura/órgão", "SELECT count(*) FROM modelo.receita_campanha WHERE (id_candidatura IS NULL) = (id_orgao IS NULL)"),
        ("despesa -> tipo_despesa", "SELECT count(*) FROM modelo.despesa_campanha d LEFT JOIN modelo.tipo_despesa t USING (id_tipo_despesa) WHERE t.id_tipo_despesa IS NULL"),
        ("proposta -> candidatura", "SELECT count(*) FROM modelo.proposta_governo p LEFT JOIN modelo.candidatura c USING (id_candidatura) WHERE c.id_candidatura IS NULL"),
    ]:
        n = q(sql); falhas += n > 0
        print(f"   {'OK ' if n == 0 else '!! '}{rot:<46} {fmt(n):>10}")

    print("\n== candidaturas ordinárias por ano: modelo × consulta_cand (R1, R4) ==")
    cru = con.sql(f"""
        SELECT ANO_ELEICAO::INT, count(DISTINCT (SG_UE, CD_CARGO, SQ_CANDIDATO))
        FROM read_csv('dados/raw/candidatos/*/candidatos_[0-9]*/consulta_cand_[0-9]*_BRASIL.csv', {O})
        WHERE CD_TIPO_ELEICAO = '2' OR (CD_TIPO_ELEICAO = '0' AND ANO_ELEICAO = '2006')
        GROUP BY 1""").fetchall()
    mod = dict(con.sql("SELECT ano, count(*) FROM modelo.candidatura GROUP BY 1").fetchall())
    for ano, n in sorted(cru):
        linha(f"candidatura {ano}", mod.get(ano, 0), n)

    print("\n== votos nominais para presidente em 2022, sem o exterior (R7) ==")
    linha("votos presidente 2022",
          q("""SELECT coalesce(sum(qt_votos_nominais), 0) FROM modelo.votacao_candidato_municipio v
               JOIN modelo.candidatura c USING (id_candidatura) WHERE c.ano = 2022 AND c.cd_cargo = 1"""),
          q(f"""SELECT coalesce(sum(QT_VOTOS_NOMINAIS::BIGINT), 0)
                FROM read_csv('dados/raw/resultados/2022/votacao_candidato_munzona_2022/votacao_candidato_munzona_2022_BRASIL.csv', {O})
                WHERE CD_CARGO = '1' AND SG_UF <> 'ZZ' AND CD_TIPO_ELEICAO = '2'"""))

    print("\n== receitas de candidatos em 2014: arquivo (depois de sanear_raw.py) × modelo ==")
    arq = "dados/raw/prestacao_contas/2014/prestacao_contas_final_2014/receitas_candidatos_2014_brasil.txt"
    cand14 = "dados/raw/candidatos/2014/candidatos_2014/consulta_cand_2014_BRASIL.csv"
    if Path(arq).exists():
        fisicas = sum(1 for _ in open(arq, "rb")) - 1
        # a mesma regra da carga: só receitas de candidatura ordinária que existe no
        # consulta_cand. As 72 restantes (R$ 0,46 mi) são de registros indeferidos,
        # que prestaram contas mas não constam do arquivo final de candidatos.
        cru = q(f"""SELECT count(*) FROM read_csv('{arq}', {O}, escape='"', strict_mode=false, ignore_errors=true)
                    WHERE "Sequencial Candidato" IN (SELECT SQ_CANDIDATO FROM read_csv('{cand14}', {O}) WHERE CD_TIPO_ELEICAO = '2')
                      AND TRY_CAST(replace(replace("Valor receita", '.', ''), ',', '.') AS DECIMAL(15, 2)) IS NOT NULL""")
        m = con.sql("""SELECT count(*), round(sum(vr_receita) / 1e6, 1) FROM modelo.receita_campanha r
                       JOIN modelo.candidatura c USING (id_candidatura) WHERE c.ano = 2014""").fetchone()
        print(f"    linhas físicas: {fmt(fisicas)} (427.489 depois do saneamento; 11.734 a menos sem ele)")
        linha("receitas de candidatos ordinários 2014", m[0], cru)
        print(f"    soma no modelo: R$ {m[1]} mi (referência: 4.391,1 mi)")
    else:
        print("    arquivo nacional de 2014 ausente — coleta extraiu só o PI?")

    print("\n== doação direta de EMPRESA a candidatos (R9): deve despencar de 2014 para 2016 ==")
    for ano in (2014, 2016):
        v = q(f"""SELECT coalesce(round(sum(r.vr_receita) / 1e6, 1), 0) FROM modelo.receita_campanha r
                  JOIN modelo.candidatura c USING (id_candidatura)
                  JOIN modelo.agente_financeiro a ON a.id_agente = r.id_agente_doador
                  WHERE c.ano = {ano} AND a.tp_agente = 'EMPRESA'""")
        print(f"    {ano}: R$ {v} mi")

    print("\n== população carregada por ano (F2) ==")
    print("   ", con.sql("SELECT ano, count(qt_populacao) FROM modelo.municipio_ano WHERE qt_populacao IS NOT NULL GROUP BY 1 ORDER BY 1").fetchall())
    print("\n== propostas: PDFs sem texto por ano ==")
    for r in con.sql("""SELECT c.ano, count(*), count(*) FILTER (WHERE NOT p.fl_texto_extraido)
                        FROM modelo.proposta_governo p JOIN modelo.candidatura c USING (id_candidatura) GROUP BY 1 ORDER BY 1""").fetchall():
        print(f"    {r[0]}: {r[1]} PDFs, {r[2]} sem texto")

    print(f"\n{'TUDO OK' if falhas == 0 else f'{falhas} verificação(ões) falharam'}")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
