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
| `gerar_painel_q1_q5.py` | `q1.json` (país inteiro), `q5.json` | `22_q1_custo_cadeira`, `23_q5_voto_legenda` |
| `gerar_painel_q2_q6.py` | `q2.json` e as fotos de `q2-fotos/`, `q6.json` (os dois com o país inteiro) | `18_q2_patrimonio`, `20_q6_idade` |
| `gerar_painel_q3_q7.py` | `q3.json` e `q7-brasil.json` (os dois com o país inteiro) | `17_q7_vies`, `21_q3_indices` |
| `gerar_malhas_web.py` | `malhas/brasil.json`, `malhas/<UF>.json` e `malhas/municipios.json` (o país inteiro, traço leve): os mapas do `MapaBrasil` | API de malhas do IBGE (não precisa do banco) |
| `gerar_painel_q4.py` | `q4.json` (o país) e `q4/<UF>.json` (cada estado) | `10_q4_escolaridade`; os mapas são os de `gerar_malhas_web.py` |
| `gerar_painel_q8_q9.py` | `q8.json`, `q9.json` e `q9/<UF>.json` (país inteiro) | `11_q8_publico`, `12_q9_propaganda` |
| `gerar_painel_q10.py` | `q10.json`, `q10/<UF>.json`, `q10/BR.json`, `q10-financas/<UF>-NN.json` (país inteiro, com 2026 na linha do tempo) | `07_q10_carreira`, `14_q10_patrimonio` |
| `gerar_painel_2026.py` | `e2026.json`: a aba 2026, com as contas de cada pergunta para a eleição geral de 2026 ao lado de 2022 | as tabelas do modelo e as views das perguntas (`q1_custo_cargo`, `mart_q8`, `mart_q9`, `q5_partido`, `q10_sobrevivencia`…), sem o corte de `fl_divulgado` |
| `gerar_painel_presidentes.py` | `presidentes.json` e `web/public/img/presidentes/` | os arquivos nacionais do TSE (votação, bens e fotos de 2002 a 2026), buscados pelo próprio script em `dados/raw/presidente/`; do banco, só o de-para de município |
| `gerar_painel_candidatos.py` | `candidatos/<UF>.json` (as fichas do país, um arquivo por estado) e as fotos | `13_ficha_candidato`, `07_q10_carreira` |
| `gerar_painel_decisoes.py` | `candidatos-decisoes.json`: as decisões da Justiça Eleitoral de cada eleito (bola preta) | `24_motivo_cassacao` |
| `gerar_painel_municipios.py` | `municipios-cidades.json` | `15_espectro` |
| `painel_web.py` | (código comum) | `gravar()`, usado por todos os geradores; as 27 siglas e capitais; `mapa()`, o mapa das páginas ainda nos 6 estados |
| `baixar_fotos_web.py` | `web/public/fotos/<ano>/<sq>.jpg`; com `--grandes`, `web/public/fotos-grandes/` no tamanho do TSE | `candidatos/<UF>.json` e `candidatos-eleitos.json` (não precisa do banco). Também roda com `npm run fotos` em `web/`. |

## Consulta e documentação

| arquivo | o que faz |
| --- | --- |
| `consultar.py` | Roda um arquivo de `sql/consultas/` com o banco aberto só para leitura e imprime cada resultado. O comentário acima de cada `SELECT` vira o título. |
| `inspecionar_esquemas.py` | Lê o que está em `dados/raw/` e gera `docs/esquemas.md` com as colunas, o número de linhas e um exemplo de cada arquivo. É a base do DER. |
| `export_dossie_der.py` | Exporta as páginas do DER do dossiê como SVG editável. |
| `servir_painel.py` | Serve o painel antigo em HTML (`docs/`) em `localhost:8000`. Foi substituído pelo app em `web/`. |
