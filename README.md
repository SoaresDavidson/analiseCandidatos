# analiseCandidatos

Análise de candidaturas eleitorais no Piauí cruzando dados do TSE com indicadores
socioeconômicos do IBGE e do PNUD. Trabalho da disciplina de Banco de Dados Relacionais (UFPI).

## Requisitos

- Python 3.13+ (ver `.python-version`)
- [uv](https://docs.astral.sh/uv/) para gerenciar o ambiente

```bash
uv sync   # cria .venv e instala as dependências do pyproject.toml
```

## Estrutura

```
dados/
  raw/          # arquivos baixados, como vieram da fonte (ignorado pelo git)
  processed/    # parquet e banco DuckDB gerados pelos scripts (ignorado pelo git)
notebooks/      # análises em Jupyter
scripts/        # coleta e conversão de dados
```

## Coleta de dados

As fontes estão em `scripts/coleta_*.py`, um script por domínio. Todos são idempotentes:
arquivo que já existe em `dados/raw/` é pulado; `--force` rebaixa. Zips são extraídos
numa pasta de mesmo nome ao lado. Download interrompido retoma de onde parou.

```bash
# tudo de uma vez (TSE + IBGE + PNUD)
uv run scripts/coletar_dados.py

# só alguns domínios
uv run scripts/coletar_dados.py ibge pnud

# cada domínio roda sozinho e aceita filtro mais fino
uv run scripts/coleta_tse.py                        # tudo do TSE
uv run scripts/coleta_tse.py candidatos resultados  # só esses temas
uv run scripts/coleta_ibge.py sidra malha
uv run scripts/coleta_pnud.py
uv run scripts/coleta_tse.py --force                # rebaixa mesmo se já existir
```

| Script | O que baixa | Destino em `dados/raw/` |
|---|---|---|
| `coleta_tse.py` | candidatos, eleitorado, prestação de contas, resultados (`votacao_*_munzona`), comparecimento/abstenção, propostas de governo (PI), de-para município TSE↔IBGE — anos 2016 a 2026 | `<tema>/<ano>/`, `extras/` |
| `coleta_ibge.py` | SIDRA: população (6579), população por idade (9606), instrução (10061); PIB dos municípios (FTP); malha dos municípios do PI (GeoJSON) | `ibge/sidra/`, `ibge/pib_municipios/`, `territorio/` |
| `coleta_pnud.py` | Painel IDHM (planilhas) | `pnud/idhm/` |

Fontes que não existem para um ano (ex.: abstenção 2026) aparecem no log como `404` e
são ignoradas. A coleta completa do TSE ocupa ~100 GB.

> TSE e PNUD ficam atrás de um CDN que rejeita `curl`/`requests` (HTTP 403).
> Os scripts usam `curl_cffi` impersonando o Chrome, já incluído nas dependências.

## Conversão para Parquet

Consolida os CSVs de candidatos de todos os anos em um único Parquet e registra a view
`candidatos_raw` em `dados/processed/tse.duckdb`:

```bash
uv run scripts/convert_csv_parquet_candidatos.py
```

Precisa dos dados de `coleta_tse.py candidatos` já baixados.

## Notebooks

```bash
uv run jupyter lab
```

Abra `notebooks/analise.ipynb`. O notebook resolve a raiz do projeto sozinho, então funciona
aberto tanto pela raiz quanto pela pasta `notebooks/`. Ele lê os CSVs de `dados/raw/` direto
com DuckDB, sem carregar tudo em memória, e converte só o resultado das queries para pandas.

Se o kernel não aparecer, registre o ambiente do projeto:

```bash
uv run python -m ipykernel install --user --name analisecandidatos
```
