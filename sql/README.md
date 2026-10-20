# sql/

Scripts DuckDB que transformam `dados/raw/` no banco `dados/processed/tse.duckdb`: as
tabelas do modelo relacional e as views que respondem a cada pergunta do trabalho.

```bash
uv run scripts/carregar_staging.py                     # todos, em ordem de nome
uv run scripts/carregar_staging.py 00_limpeza 04 05    # só os que contêm esses trechos
```

Os caminhos dentro dos `.sql` são relativos à raiz do repositório, e o `carregar_staging.py`
muda para lá antes de rodar. O cabeçalho de cada arquivo diz o que ele lê, de quais outros
depende e qual comando o carrega.

## Dois schemas

- `modelo`: as tabelas do DER do dossiê (`00_modelo.sql`), com PK e FK. Quem carrega é
  `06_carga_nucleo.sql`, depois `13`, `16` e `19`.
- `main`: tabelas e views de trabalho (`stg_*`, `mart_*`, `q8_*`...). Alguns nomes se repetem
  nos dois schemas: `main.candidatura` vem do `04_politico.sql` e não é a
  `modelo.candidatura`.

## Ordem e dependências

O `carregar_staging.py` roda os arquivos em ordem de nome, e essa ordem já respeita as
dependências. Se rodar só uma parte, inclua os pré-requisitos. Por exemplo, o `05` sozinho
falha com `Table with name candidatura does not exist!` quando o `04` ainda não rodou no banco.

| arquivo | o que faz | depende de |
| --- | --- | --- |
| `00_limpeza.sql` | Macros de limpeza (`limpa`, `valor_br`, `data_br`, `documento`, `ano_divulgado`...) usadas pelos outros scripts | — |
| `00_modelo.sql` | Cria o schema `modelo` com as tabelas do DER. Idempotente: não apaga dados | — |
| `01_staging.sql` | Views `stg_receita` e `stg_despesa` da prestação de contas (2018–2026, só candidatos e eleições ordinárias) | 00_limpeza |
| `02_fonte_recurso.sql` | Classifica a receita em público × privado | 01 |
| `03_tipo_despesa.sql` | Classifica a despesa por canal de propaganda | 01 |
| `04_politico.sql` | `stg_candidatura`, `candidatura` e `politico` (em `main`) a partir do `consulta_cand`. A pessoa é identificada pelo título de eleitor, nunca pelo CPF | 00_limpeza |
| `05_marts_enrico.sql` | `mart_q8`, `mart_q9`: uma linha por candidatura com receita e despesa classificadas | 01 a 04 |
| `06_carga_nucleo.sql` | Carrega o núcleo do `modelo`: território, escolaridade, partidos, cargos, eleições, político e candidatura | 00_limpeza, 00_modelo |
| `07_q10_carreira.sql` | Q10: linha do tempo da carreira de cada político | 00_limpeza, 04 |
| `10_q4_escolaridade.sql` | Q4: escolaridade do candidato × da população (Censo 2022) | 06 |
| `11_q8_publico.sql` | Q8: sucesso de quem depende mais de dinheiro público | 05 |
| `12_q9_propaganda.sql` | Q9: onde o candidato gasta com propaganda | 05 |
| `13_ficha_candidato.sql` | Carrega bens e votos no `modelo` e cria a view da ficha dos eleitos | 01 a 05, 06 |
| `14_q10_patrimonio.sql` | Patrimônio e campanha de cada político por eleição (Q10) | 01 a 05, 13 |
| `15_espectro.sql` | Espectro ideológico (0 = esquerda, 10 = direita) de partidos, eleitos e municípios, pela escala de Bolognesi et al. (2025) | 01 a 05, 06, 13 |
| `16_indicadores_municipio.sql` | Carrega PIB, população, renda e anos de estudo dos municípios | 06 |
| `17_q7_vies.sql` | Q7: viés político do município ao longo do tempo | 13, 15, 16 |
| `18_q2_patrimonio.sql` | Q2: taxa de sucesso por faixa de patrimônio declarado | 13, 14 |
| `19_faixa_etaria.sql` | Carrega a população e o eleitorado por faixa de idade | 06 |
| `20_q6_idade.sql` | Q6: idade do município e dos eleitos, e alternância de poder | 13, 17, 19 |
| `21_q3_indices.sql` | Q3: índices do município × quem venceu em 2024 | 16, 17 |

## Subpastas

O `carregar_staging.py` só lê `sql/*.sql`, então estas pastas não entram na carga.

- `consultas/`: as consultas que respondem a uma pergunta, lidas das views. Rode com
  `uv run scripts/consultar.py sql/consultas/q10_carreira.sql`.
- `validacao/`: uma checagem por pergunta. Cada consulta deve voltar vazia, exceto nos casos
  conhecidos que o cabeçalho do arquivo lista. Rode no DuckDB ou num notebook, depois de
  carregar os scripts de que a pergunta depende.
