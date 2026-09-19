from pathlib import Path

import duckdb

ROOT = Path.cwd() if (Path.cwd() / "dados").exists() else Path.cwd().parent
RAW = ROOT / "dados" / "raw" / "candidatos"
DB = ROOT / "dados" / "processed" / "tse.duckdb"

con = duckdb.connect(str(DB))
print("banco:", DB)
_ = con.execute("INSTALL encodings; LOAD encodings;")  # habilita encoding='cp1252'

# ignore_errors: o arquivo de 2016 tem 5 linhas com bytes inválidos em cp1252
# (mojibake UTF-8 e um 0x81 solto). Elas são descartadas (linhas 57965, 216646,
# 379610, 401622, 414822). store_rejects não funciona junto com union_by_name.
CSV_OPTS = (
    "delim=';', quote='\"', header=true, encoding='cp1252', all_varchar=true, "
    "union_by_name=true, filename=true, ignore_errors=true"
)

_ = con.execute(f"""
    CREATE OR REPLACE VIEW candidatos_raw AS
    SELECT * FROM read_csv('{RAW}/*/candidatos_[0-9]*/consulta_cand_[0-9]*_BRASIL.csv', {CSV_OPTS})
""")

_ = con.execute(f"""
      COPY (
          SELECT * FROM candidatos_raw
      )
      TO '{ROOT / "dados" / "processed" / "candidatos.parquet"}'
      (FORMAT PARQUET, COMPRESSION ZSTD)
  """)

con.close()
