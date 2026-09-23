## 7. Visualização — `DESCRIBE` no DuckDB

A página HTML mostra o resultado completo de `DESCRIBE candidatos_raw` como tabela pesquisável, lendo `docs/dossie/describe-candidatos.csv`. O CSV foi exportado em 23/09/2026 por uma conexão **somente leitura** a `dados/processed/tse.duckdb`; a view `candidatos_raw` tem **77 colunas**. A visualização descreve o esquema da view bruta — nomes, tipos, nulidade e metadados retornados pelo DuckDB — e não contém resultados eleitorais. No PDF, apresentar a tabela completa em anexo ou em páginas próprias, com fonte legível.

Consulta usada: `DESCRIBE candidatos_raw`. Banco: `dados/processed/tse.duckdb`. Evidência exportada: `docs/dossie/describe-candidatos.csv`. Os tipos são `VARCHAR` nesta view bruta porque a leitura inicial usa `all_varchar=true`; a conversão para tipos analíticos pertence à etapa de carga proposta.
