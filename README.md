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
| `coleta_tse.py` | candidatos, eleitorado, prestação de contas, resultados (`votacao_*_munzona` e `detalhe_votacao_munzona`), comparecimento/abstenção, propostas de governo (PI), de-para município TSE↔IBGE | `<tema>/<ano>/`, `extras/` |
| `coleta_ibge.py` | SIDRA: população (6579), população por idade (9606), instrução (10061); PIB dos municípios (FTP); malha dos municípios do PI (GeoJSON) | `ibge/sidra/`, `ibge/pib_municipios/`, `territorio/` |
| `coleta_pnud.py` | Painel IDHM — ⚠️ só Brasil e UF, **não tem município** (ver docstring) | `pnud/idhm/` |

### Anos coletados

| Tema | Anos | Por quê |
|---|---|---|
| geral | 2016–2026 | cobre a maioria das perguntas |
| `historico` (só `consulta_cand`) | 2002–2014 | Q12 pede o maior período possível; `NR_CPF_CANDIDATO` existe desde 2002, então dá para ligar a mesma pessoa entre eleições por CPF |
| `prestacao_contas` | 2014–2026 | Q8 precisa de 2014: o STF derrubou a doação de PJ em set/2015 (ADI 4650), logo 2016 já foi sem PJ |

### Recorte por UF

Os zips do TSE trazem um arquivo por UF **e** um `_BRASIL` que é a concatenação de
todos. Extrair tudo dobra o volume à toa. Os temas pesados são extraídos só com os
arquivos do PI (`manter_uf` em `coleta_tse.py`):

| Tema | Recorte | Motivo |
|---|---|---|
| `prestacao_contas`, `eleitorado`, `abstencao` | só PI | prestação de contas de 2024: ~12 GB completos contra ~92 MB só do PI |
| `candidatos`, `resultados` | completo | leves (`detalhe_votacao_munzona` de 2024 tem 1,4 MB) e as Q3/Q9 comparam o PI com o resto do país |

Para mudar o recorte, edite `UF` no topo do `coleta_tse.py`. Zip que não é quebrado
por UF é extraído inteiro automaticamente.

Fontes que não existem para um ano (ex.: prestação de contas de 2026, ainda em
curso) aparecem no log como `404` e são ignoradas — não é erro. Um coletor que
falhe não interrompe os outros.

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
