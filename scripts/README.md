# scripts/

Código Python do projeto. Cobre o caminho todo dos dados: baixa as fontes para
`dados/raw/`, carrega o banco `dados/processed/tse.duckdb` com os scripts de `sql/` e
grava os JSON que o app React (`web/`) lê.

Rode tudo da raiz do repositório, com `uv run`. Cada arquivo tem no topo uma docstring com
os pré-requisitos e as opções.

## Fluxo

```
coleta/  ──>  dados/raw/  ──>  carregar_staging.py (sql/*.sql)  ──>  tse.duckdb  ──>  gerar_painel_*.py  ──>  web/public/dados/
```

## Coleta (`coleta/`)

| arquivo | o que faz |
| --- | --- |
| `coletar_dados.py` | Roda todos os coletores de uma vez (`tse`, `ibge`, `pnud`). Aceita `--uf`, `--force` e o nome dos domínios. |
| `coleta/coleta_tse.py` | Baixa os dados abertos do TSE (candidatos, resultados, prestação de contas, eleitorado, propostas...) para `dados/raw/<tema>/<ano>/`. |
| `coleta/coleta_ibge.py` | Baixa do IBGE as tabelas do SIDRA, o PIB dos municípios e as malhas. |
| `coleta/coleta_pnud.py` | Baixa o painel IDHM do PNUD. Ele só traz Brasil e UF, sem município. |
| `coleta/coleta_comum.py` | Código comum aos coletores: download retomável e extração de zip. Usa `curl_cffi` porque o Akamai do TSE recusa o `requests`. |
| `coleta/zip_remoto.py` | Lê arquivos de dentro de um zip do TSE por faixa de bytes (HTTP Range), sem baixar o zip inteiro. |
| `coleta/fotos_tse.py` | Busca as fotos dos candidatos pedidos via `zip_remoto` e as reduz para 81×113 px. |

## Carga do banco

| arquivo | o que faz |
| --- | --- |
| `carregar_staging.py` | Aplica os `sql/*.sql` em ordem sobre `tse.duckdb`. Com argumentos, roda só os arquivos cujo nome contém algum deles (`carregar_staging.py 04_politico 05`). Ver `sql/README.md` para as dependências. |
| `carregar_propostas.py` | Extrai o texto dos PDFs de proposta de governo e carrega `PROPOSTA_GOVERNO` e `TERMO_PROPOSTA`. |
| `convert_csv_parquet_candidatos.py` | Junta os `consulta_cand_*_BRASIL.csv` de todos os anos em `dados/processed/candidatos.parquet`. |

## Painel (dados para `web/`)

Cada gerador lê as views de um ou mais `sql/*.sql` e grava os JSON em `web/public/dados/`
por meio de `painel_web.py`.

| arquivo | grava | lê |
| --- | --- | --- |
| `gerar_painel_q2_q6.py` | `q2.json`, `q6.json` | `18_q2_patrimonio`, `20_q6_idade` |
| `gerar_painel_q3_q7.py` | `q3.json`, `q7.json` | `17_q7_vies`, `21_q3_indices` |
| `gerar_painel_q4.py` | `q4.json` | `10_q4_escolaridade` e as malhas do IBGE |
| `gerar_painel_q8_q9.py` | `q8.json`, `q9.json` | `11_q8_publico`, `12_q9_propaganda` |
| `gerar_painel_q10.py` | `q10.json`, `q10-financas/NN.json` | `07_q10_carreira`, `14_q10_patrimonio` |
| `gerar_painel_candidatos.py` | `candidatos-eleitos.json` e as fotos | `13_ficha_candidato`, `07_q10_carreira` |
| `gerar_painel_municipios.py` | `municipios-cidades.json` | `15_espectro` |
| `painel_web.py` | (código comum) | `gravar()`, usado por todos os geradores |
| `baixar_fotos_web.py` | `web/public/fotos/<ano>/<sq>.jpg` | `candidatos-eleitos.json` (não precisa do banco). Também roda com `npm run fotos` em `web/`. |

## Consulta e documentação

| arquivo | o que faz |
| --- | --- |
| `consultar.py` | Roda um arquivo de `sql/consultas/` com o banco aberto só para leitura e imprime cada resultado. O comentário acima de cada `SELECT` vira o título. |
| `inspecionar_esquemas.py` | Lê o que está em `dados/raw/` e gera `docs/esquemas.md` com as colunas, o número de linhas e um exemplo de cada arquivo. É a base do DER. |
| `export_dossie_der.py` | Exporta as páginas do DER do dossiê como SVG editável. |
| `servir_painel.py` | Serve o painel antigo em HTML (`docs/`) em `localhost:8000`. Foi substituído pelo app em `web/`. |
