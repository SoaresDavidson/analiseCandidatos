# Dossiê do projeto — Análise de Candidatos

Universidade Federal do Piauí — Disciplina de Banco de Dados Relacionais

Professor: Luiz Claudio Demes da Mata Sousa

Discentes: Eduardo Melo de Carvalho; Enrico da Rocha Santos Teixeira; Maria Eduarda Farias Gomes; Davi Sousa Soares.

Teresina — PI, 2026.

## Sumário

1. Capa
2. Sumário
3. Introdução
4. Perguntas de pesquisa
5. Diagrama entidade-relacionamento (DER)
6. Modelo relacional
7. Dicionário de dados
8. Sobre: ferramentas e metodologia
9. Visualização: `DESCRIBE` no DuckDB
10. Fontes dos dados e leia-me

## 3. Introdução

### Do que se trata

O projeto investiga candidaturas e resultados eleitorais brasileiros, com atenção ao Piauí, cruzando dados do Tribunal Superior Eleitoral (TSE) com indicadores municipais do Instituto Brasileiro de Geografia e Estatística (IBGE). O banco analítico planejado organiza candidaturas, votos, financiamento, perfil do eleitorado e contexto socioeconômico para responder a 12 perguntas. O projeto usa DuckDB e notebooks para preparação e análise. Os resultados das perguntas ainda dependem da carga e das consultas; este dossiê documenta o desenho do banco, não resultados calculados.

### Objetivo

Estruturar uma base relacional rastreável que permita comparar eleições, municípios, partidos e candidatos, preservando a granularidade e a procedência de cada informação. Cada pergunta indica o resultado que uma consulta futura deverá entregar.

### APIs e fontes

| Fonte | Acesso planejado | Uso no projeto |
|---|---|---|
| TSE — Portal de Dados Abertos | Arquivos públicos ZIP/CSV; o catálogo CKAN aponta para os recursos, não há API de consulta tabular para estas bases. | Candidaturas, votação, vagas, comparecimento, contas e propostas. |
| IBGE — API SIDRA | Respostas JSON por tabela, variável, período e nível geográfico. | População (6579), escolaridade (10061) e idade (9514/9606). |
| IBGE — PIB dos Municípios | Planilha XLSX do FTP do IBGE. | PIB per capita e hierarquia geográfica municipal. |
| IBGE — API de malhas | GeoJSON municipal. | Visualização espacial do Piauí e do país. |
| PNUD / Atlas Brasil | Fonte complementar de IDHM municipal histórico. | Contexto comparativo; o IDHM municipal não é anual nem substitui o PIB per capita. |

A ponte oficial `municipio_tse_ibge` relaciona os códigos municipais. `cod_tse` deve ser texto de cinco caracteres para preservar zeros à esquerda. As fontes e os procedimentos de coleta estão em `docs/fontes-de-dados.md`, `docs/esquemas.md` e `scripts/coleta_*.py`.

## 4. Perguntas — o que cada consulta deverá responder

| # | Pergunta | Resposta esperada | Dados centrais |
|---|---|---|---|
| Q1 | Quanto custa disputar uma cadeira? | Despesa total de campanha por vaga em disputa, comparando território, cargo e eleição. | Despesas, candidaturas, vagas. |
| Q2 | Gastar mais aumenta a taxa de sucesso? | Relação entre gasto por candidatura e proporção de eleitos, com recortes comparáveis. | Despesas, candidaturas, situação de totalização. |
| Q3 | Como o perfil municipal se relaciona com partidos, eleitos e abstenção? | Indicadores municipais, votação e participação lado a lado por município e eleição. | Município-ano, votos, partidos, comparecimento. |
| Q4 | A instrução do candidato acompanha a escolaridade da população? | Distribuição de escolaridade de candidatos em comparação com o Censo 2022 no território. | Candidaturas, Censo de instrução. |
| Q5 | Como se distribuem os votos de legenda? | Votos de legenda por partido e, quando aplicável, por federação, município e eleição. | Votação de legenda, partido, federação. |
| Q6 | Quais temas aparecem nas propostas de governo? | Termos recorrentes e sua frequência em textos de propostas, com recorte por candidatura. | PDFs de propostas, termos extraídos. |
| Q7 | Jovens e não jovens diferem no comportamento eleitoral? | Perfis etários de candidaturas e eleitorado associados a votos e comparecimento. | Político, candidatura, eleitorado, comparecimento por perfil. |
| Q8 | Como doações de pessoas jurídicas se distribuíam politicamente? | Valores e doadores empresariais por candidatura/partido no período em que eram permitidos, com 2016 como marco posterior. | Receitas antigas, agente financeiro, partido. |
| Q9 | Como evolui o viés político de um município? | Série de votação por classificação de espectro partidário e território, sem presumir sucessão entre siglas. | Votos, partido, eleição, município. |
| Q10 | Eleitos e não eleitos têm composições de recursos diferentes? | Proporção de financiamento público, privado e próprio por situação eleitoral. | Receitas, classificação de fonte, candidatura. |
| Q11 | Onde candidatos concentram gastos de propaganda? | Valores, tipos e descrições das despesas de propaganda por candidatura e fornecedor. | Despesas, tipo de despesa, agente financeiro. |
| Q12 | Como se desenha a trajetória eleitoral de um político? | Linha do tempo de candidaturas, partidos, cargos e resultados da mesma pessoa. | Político, candidatura, eleição, partido. |

As perguntas são objetivos de consulta, não respostas já obtidas. Q3 deve considerar que gastos de eleição geral não têm granularidade municipal; Q7 requer a fonte de comparecimento por perfil para abstenção etária; Q8 depende de conciliar leiautes antigos e recentes de prestação de contas.

## 5. Diagrama entidade-relacionamento (DER)

**Fonte do diagrama:** `docs/dossie/der.mmd` (sintaxe Mermaid `erDiagram`). A página HTML carrega esse arquivo em tempo de execução, e o PDF apresenta o diagrama renderizado a partir do mesmo arquivo. Ele consolida o rascunho `docs/der.md` com as correções registradas em `docs/estrategia.md`, seção 4.1. É um modelo proposto para o trabalho; a validação completa de chaves e cardinalidades depende da carga.

Eixos do modelo: `CANDIDATURA` conecta pessoa, eleição, partido, votos e finanças; `MUNICIPIO` conecta os códigos TSE e IBGE aos resultados e indicadores. A federação é opcional a partir de 2022. Para `CANDIDATURA`, o município é resolvido a partir de `SG_UE` somente em pleitos municipais.

## 6. Modelo relacional



## 7. Dicionário de dados

Este dicionário cobre as entidades do DER em nível de tabela e campos essenciais. Tipos e restrições são propostas de modelagem e precisam de conferência na carga. O dicionário detalhado de `CANDIDATURA` já iniciado em `docs/dicionario-dados.md` complementa esta síntese.

| Entidade | Chave e campos essenciais | Significado e origem |
|---|---|---|
| `UF` | `sigla_uf` (PK), `nome` | Unidade da federação; TSE/IBGE. |
| `MUNICIPIO` | `cod_ibge` (PK), `cod_tse` (`VARCHAR(5)`, único), `sigla_uf`, `nome` | Ponte territorial oficial TSE–IBGE; `cod_tse` preserva zero inicial. |
| `MUNICIPIO_ANO` | (`cod_ibge`, `ano`) (PK), `qt_populacao`, `vr_pib_per_capita` | Indicadores por ano; SIDRA 6579 e planilha PIB dos Municípios. Alinhar anos disponíveis. |
| `CENSO_INSTRUCAO` | (`cod_ibge`, `ano_censo`, `cd_nivel_instrucao`) (PK), `qt_pessoas` | Escolaridade da população; SIDRA 10061. |
| `ELEITORADO_MUNICIPIO` | (`cod_ibge`, `ano`, `cd_faixa_etaria`) e outras dimensões de perfil (PK), `qt_eleitores` | Perfil do eleitorado; TSE. |
| `COMPARECIMENTO_PERFIL` | (`cod_ibge`, `ano`, `cd_faixa_etaria`) e outras dimensões de perfil (PK), `qt_comparecimento`, `qt_abstencao` | Participação por faixa etária; `perfil_comparecimento_abstencao` do TSE, com zonas agregadas. |
| `POLITICO` | `id_politico` (PK), `nr_titulo_eleitoral` (único quando válido), `nm_completo`, `dt_nascimento` | Identidade longitudinal da pessoa; `consulta_cand`. CPF não é chave histórica confiável. |
| `ELEICAO` | `id_eleicao` (PK), `ano`, `dt_eleicao` | Pleito e data; TSE. |
| `CARGO` | `cod_cargo` (PK), `ds_cargo` | Cargo disputado; TSE. |
| `PARTIDO` | `nr_partido` (PK no recorte adotado), `sg_partido`, `cd_espectro` | Agremiação e classificação analítica; verificar identificação por eleição e documentar fonte do espectro. |
| `FEDERACAO` | `nr_federacao` (PK no recorte adotado), `sg_federacao`, `nm_federacao` | Federação partidária a partir de 2022; TSE. |
| `CANDIDATURA` | `sq_candidato` (PK), `id_politico`, `id_eleicao`, `cod_cargo`, `nr_partido`, `nr_federacao`, `cod_ibge`, `cd_grau_instrucao`, `cd_sit_tot_turno` | Participação de pessoa em pleito; `consulta_cand`. `cod_ibge` só é preenchido quando `SG_UE` representa município. |
| `VOTACAO_CANDIDATO_MUNICIPIO` | (`sq_candidato`, `cod_ibge`, `nr_turno`) (PK), `qt_votos_nominais` | Votos nominais com zonas agregadas; `votacao_candidato_munzona`. |
| `VOTACAO_LEGENDA_MUNICIPIO` | `id_legenda` (PK), `id_eleicao`, `cod_cargo`, `cod_ibge`, `nr_turno`, `nr_partido`, `nr_federacao`, `qt_votos_legenda` | Votos de legenda agregados por município; `votacao_partido_munzona`. Definir regra de associação à federação na carga. |
| `COMPARECIMENTO_MUNICIPIO` | (`id_eleicao`, `cod_cargo`, `cod_ibge`, `nr_turno`) (PK), `qt_aptos`, `qt_abstencao`, `qt_votos_brancos`, `qt_votos_nulos` | Participação por cargo com zonas agregadas; `detalhe_votacao_munzona`. |
| `VAGA` | (`id_eleicao`, `cod_cargo`, `cod_ibge`) (PK), `qt_vagas` | Cadeiras em disputa; `consulta_vagas`. |
| `AGENTE_FINANCEIRO` | `id_agente` (PK), `nr_cpf_cnpj`, `tp_pessoa`, `cd_cnae` | Doador ou fornecedor; prestação de contas, com CNAE quando disponível. |
| `FONTE_RECURSO` | `id_fonte_recurso` (PK), `ds_fonte_receita`, `ds_origem_receita`, `tp_origem` | Classificação público/privado/próprio construída com fonte e origem da receita; regra do grupo. |
| `RECEITA_CAMPANHA` | `id_receita` (PK), `sq_candidato`, `id_agente`, `id_fonte_recurso`, `vr_receita` | Entrada de recursos de campanha; prestação de contas. |
| `TIPO_DESPESA` | `cd_tipo_despesa` (PK), `ds_tipo_despesa`, `fl_propaganda` | Categoria de gasto; prestação de contas. |
| `DESPESA_CAMPANHA` | `id_despesa` (PK), `sq_candidato`, `id_agente`, `cd_tipo_despesa`, `vr_despesa`, `ds_despesa` | Gasto de campanha e descrição; prestação de contas. |
| `PROPOSTA_GOVERNO` | `sq_candidato` (PK/FK), `url_pdf`, `tx_conteudo` | Documento de proposta ligado ao candidato; PDF do TSE. |
| `TERMO_PROPOSTA` | (`sq_candidato`, `termo`) (PK), `qt_frequencia` | Frequência de termo extraído da proposta. |

**Observações de qualidade:** Chaves do TSE devem ser lidas como texto antes de qualquer conversão. Valores especiais de ausência precisam de normalização explícita. A classificação ideológica e a classificação da origem de recursos exigem critérios documentados. Entidades e atributos acima descrevem o modelo pretendido, não tabelas já criadas.

## 8. Sobre — ferramentas e metodologia

O projeto usa Python para coleta e inspeção; DuckDB para ler CSV, JSON e Parquet, criar views e executar consultas; e Jupyter para exploração e visualização. As dependências são gerenciadas com `uv`. Os dados eleitorais vêm do TSE; população, escolaridade, idade, PIB e malhas vêm do IBGE; o IDHM histórico do PNUD/Atlas Brasil é complementar.

A metodologia planejada segue cinco etapas: (1) obter os arquivos originais em `dados/raw/`; (2) inspecionar e registrar esquemas reais em `docs/esquemas.md`; (3) normalizar códigos, tipos, anos e os dois leiautes de contas em views de preparação; (4) carregar o núcleo relacional proposto pelo DER; (5) executar uma consulta por pergunta e apresentar resultados e limitações. No estado atual, já existem coleta, inspeção, notebooks de exploração, Parquet e views brutas; as tabelas normalizadas e as 12 consultas finais ainda estão planejadas.

Cuidados metodológicos: preservar o código TSE do município como texto; usar a ponte oficial TSE–IBGE; agregar as zonas eleitorais explicitamente ao nível municipal quando a pergunta pedir município; distinguir ausência de dado de valor zero; registrar o ano de cada indicador e a defasagem do IDHM; classificar origem de recursos e espectro partidário com critérios publicados.

## 9. Visualização — `DESCRIBE` no DuckDB

A página HTML mostra o resultado completo de `DESCRIBE candidatos_raw` como tabela pesquisável, lendo `docs/dossie/describe-candidatos.csv`. O CSV foi exportado em 23/09/2026 por uma conexão **somente leitura** a `dados/processed/tse.duckdb`; a view `candidatos_raw` tem **77 colunas**. A visualização descreve o esquema da view bruta — nomes, tipos, nulidade e metadados retornados pelo DuckDB — e não contém resultados eleitorais. No PDF, apresentar a tabela completa em anexo ou em páginas próprias, com fonte legível.

Consulta usada: `DESCRIBE candidatos_raw`. Banco: `dados/processed/tse.duckdb`. Evidência exportada: `docs/dossie/describe-candidatos.csv`. Os tipos são `VARCHAR` nesta view bruta porque a leitura inicial usa `all_varchar=true`; a conversão para tipos analíticos pertence à etapa de carga proposta.

## 10. Fontes dos dados e leia-me

| Instituição | Dados obtidos | Acesso e documentação |
|---|---|---|
| Tribunal Superior Eleitoral (TSE) | Candidaturas, coligações, vagas, votação, eleitorado, comparecimento, prestação de contas, propostas de governo e correspondência TSE–IBGE. | Portal de Dados Abertos e arquivos ZIP/CSV/PDF. Os pacotes de prestação de contas incluem PDFs `leiame_*.pdf`; os pacotes de propostas incluem `leiame.pdf`. |
| Instituto Brasileiro de Geografia e Estatística (IBGE) | População, escolaridade e idade, PIB municipal, hierarquia territorial e malhas. | API SIDRA, planilha do PIB dos Municípios no FTP e API de malhas; metadados dos agregados no serviço do IBGE. |
| Programa das Nações Unidas para o Desenvolvimento (PNUD) / Atlas Brasil | IDHM municipal histórico. | Fonte complementar; verificar ano de referência e evitar interpretar como indicador anual atual. |

Os endereços, tabelas, recortes e limitações constam de `docs/fontes-de-dados.md`. Os arquivos brutos são guardados em `dados/raw/`; o inventário de colunas efetivamente obtidas está em `docs/esquemas.md`.

**PDFs de leia-me:** `docs/dossie/leiames/` contém 141 PDFs espelhados de `dados/raw/`, preservando a estrutura de tema, ano e pacote. O índice completo está em `docs/dossie/leiames/indice.md`. A página HTML oferece um seletor de pasta: ao escolher `leiames/`, ela lista todos os PDFs, inclusive os de subpastas, e permite visualizar cada um. Como navegadores não podem varrer pastas locais sem autorização, a seleção da pasta é uma ação explícita do leitor. PDFs adicionados depois não aparecem neste PDF estático sem nova geração.

## Documentos utilizados

- `docs/estrategia.md` — escopo, perguntas, decisões e correções do DER.
- `docs/fontes-de-dados.md` — fontes, APIs e limitações.
- `docs/der.md` e `docs/der-davi.md` — modelos de referência.
- `docs/esquemas.md` — inventário dos arquivos obtidos.
- `docs/dicionario-dados.md` — dicionário em elaboração.
