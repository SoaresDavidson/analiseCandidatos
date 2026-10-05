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

As fontes estão em `scripts/coleta/coleta_*.py`, um script por domínio. Todos são idempotentes:
arquivo que já existe em `dados/raw/` é pulado; `--force` rebaixa. Zips são extraídos
numa pasta de mesmo nome ao lado. Download interrompido retoma de onde parou.

```bash
# tudo de uma vez (TSE + IBGE + PNUD)
uv run python -m scripts.coletar_dados

# só alguns domínios
uv run python -m scripts.coletar_dados ibge pnud

# cada domínio roda sozinho e aceita filtro mais fino
uv run python -m scripts.coleta.coleta_tse                        # tudo do TSE
uv run python -m scripts.coleta.coleta_tse candidatos resultados  # só esses temas
uv run python -m scripts.coleta.coleta_ibge sidra malha
uv run python -m scripts.coleta.coleta_pnud
uv run python -m scripts.coleta.coleta_tse --force                # rebaixa mesmo se já existir
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

### 🚨 Espaço em disco e OneDrive

A coleta completa ocupa **~28 GB**, dos quais ~9,5 GB são os `.zip` originais (podem
ser apagados depois de extrair). Distribuição medida:

| Tema | Tamanho |
|---|---|
| `resultados` | 11 GB |
| `prestacao_contas` | 5,1 GB |
| `eleitorado` | 5,1 GB |
| `candidatos` | 4,0 GB |
| `proposta_governo` | 2,0 GB |
| `abstencao` | 1,1 GB |
| `ibge` + `territorio` + `extras` | ~112 MB |

**Se o repositório estiver dentro de uma pasta do OneDrive, Google Drive ou Dropbox,
tire `dados/` de lá antes de rodar.** O `.gitignore` impede o git de versionar, mas
não impede o serviço de sincronização de subir os 28 GB para a nuvem. Duas saídas:

- excluir a pasta `dados/` da sincronização nas configurações do cliente; ou
- manter `dados/` fora da árvore sincronizada e apontar para lá com um link
  simbólico (`mklink /D dados C:\dados-analisecandidatos` no Windows).

Para recuperar espaço depois da extração:

```bash
find dados/raw -name "*.zip" -delete
```

> TSE e PNUD ficam atrás de um CDN que rejeita `curl`/`requests` (HTTP 403).
> Os scripts usam `curl_cffi` impersonando o Chrome, já incluído nas dependências.

## Esquemas dos arquivos

Antes de modelar qualquer coisa, gere o inventário do que existe de verdade:

```bash
uv run python -m scripts.inspecionar_esquemas
```

Ele lê `dados/raw/` e escreve `docs/esquemas.md` com as colunas, a contagem de
linhas e uma linha de exemplo de cada arquivo. Os blocos são agrupados por
**esquema distinto**, não por arquivo — então as duas gerações de leiaute do TSE
aparecem separadas, cada uma dizendo em que anos vale.

Modele o DER por esse arquivo, não pela documentação do TSE: as colunas mudam de
ano para ano, e às vezes o conteúdo também (o CPF, por exemplo, foi suprimido em
2024 — ver `docs/estrategia.md`).

## Conversão para Parquet

Consolida os CSVs de candidatos de todos os anos em um único Parquet e registra a view
`candidatos_raw` em `dados/processed/tse.duckdb`:

```bash
uv run scripts/convert_csv_parquet_candidatos.py
```

Precisa dos dados de `coleta_tse.py candidatos` já baixados.

## Staging da prestação de contas

As duas views canônicas que as Q1, Q2, Q8, Q10 e Q11 consomem. Elas escondem as
duas gerações de leiaute (`.txt` em português até 2016, `.csv` `SNAKE_CASE` de
2018 em diante) atrás de um nome de coluna só:

```bash
uv run scripts/carregar_staging.py       # aplica sql/*.sql em dados/processed/tse.duckdb
uv run scripts/carregar_staging.py 01    # só um script
```

| Objeto | Grão | Para quê |
|---|---|---|
| `stg_receita` | uma receita | `sq_candidato, ano, dt, vr_receita, cpf_cnpj_doador, tp_pessoa, cd_cnae_doador, ds_fonte, ds_origem, ds_natureza` |
| `stg_despesa` | uma despesa contratada | `sq_candidato, ano, dt, vr_despesa, cpf_cnpj_fornecedor, cd_cnae_fornecedor, ds_despesa, ds_tipo_despesa` |
| `stg_receita_classificada` | uma receita | + `tp_origem` — público × privado da Q10 |
| `stg_despesa_classificada` | uma despesa | + `ds_canal_propaganda` — canal da Q11 |
| `fonte_recurso`, `tipo_despesa` | um de-para | as entidades de classificação do DER |
| `candidatura`, `politico` | uma candidatura / uma pessoa | `consulta_cand` de 2002 a 2026, chaveado por título |
| `mart_q10`, `mart_q11`, `mart_q11_texto`, `mart_q12` | — | uma view por pergunta; a camada visual lê só daqui |

**Não escreva staging próprio da prestação de contas** — consuma estas views. Se
faltar uma coluna, peça: o ponto é os quatro chegarem ao mesmo número para
"quanto o candidato gastou".

Precisa de `coleta_tse.py prestacao_contas candidatos historico` já baixado.
Validado contra os arquivos crus: contagem e soma batem linha a linha em 2014 e
2016, os `sq_candidato` casam com `consulta_cand` sem nenhum órfão, e a Q12
reproduz os 599.547 reincidentes (32,3%) do `estrategia.md`.

Critérios e armadilhas: [`docs/der/der-enrico.md`](docs/der/der-enrico.md) (o modelo),
[`docs/der/q10-publico-privado.md`](docs/der/q10-publico-privado.md),
[`docs/der/q11-propaganda.md`](docs/der/q11-propaganda.md),
[`docs/der/q12-linha-do-tempo.md`](docs/der/q12-linha-do-tempo.md).

> 🚨 **`sq_candidato` não é chave antes de 2010.** Em 2004 são 402.157
> candidaturas em 1.506 valores distintos. Deduplicar por ele funde 400 mil
> pessoas sem erro nenhum. Detalhe na nota 2 do
> [`docs/der/der-enrico.md`](docs/der/der-enrico.md) — não afeta quem usa 2014+.
>
> 🚨 **`consulta_cand` de 2008 e 2016 quebra com `encoding='latin-1'`.** Use
> `INSTALL encodings; LOAD encodings;` com `encoding='cp1252'` e
> `ignore_errors=true`, como fazem `04_politico.sql` e
> `convert_csv_parquet_candidatos.py`.

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
