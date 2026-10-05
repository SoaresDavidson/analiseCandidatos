## 1. Introdução

### Do que se trata

O projeto investiga candidaturas e resultados eleitorais brasileiros, com atenção ao Piauí, cruzando dados do Tribunal Superior Eleitoral (TSE) com indicadores municipais do Instituto Brasileiro de Geografia e Estatística (IBGE). O banco analítico planejado organiza candidaturas, votos, financiamento, perfil do eleitorado e contexto socioeconômico para responder a 12 perguntas. O projeto usa DuckDB e notebooks para preparação e análise. Os resultados das perguntas ainda dependem da carga e das consultas; este dossiê documenta o desenho do banco, não resultados calculados.

### Objetivo

Estruturar uma base relacional rastreável que permita comparar eleições, municípios, partidos e candidatos, preservando a granularidade e a procedência de cada informação. Cada pergunta indica o resultado que uma consulta futura deverá entregar.

### Período de análise

O período padrão são as eleições ordinárias de **2016 a 2024**: três municipais (2016, 2020 e 2024) e duas gerais (2018 e 2022). Todos os temas foram coletados nesse período (candidaturas, resultados, eleitorado, comparecimento, contas e propostas), e ele cobre a maioria das perguntas. A série termina em 2024 porque é a última eleição com resultado: a de 2026 ainda não foi totalizada.

Quatro perguntas usam outro período, porque o dado que pedem está fora dele:

| Pergunta | Período | Motivo |
|---|---|---|
| Q8 | 2014 e 2016 | 2014 é a última eleição com doação de pessoa jurídica, que o STF proibiu em setembro de 2015 (ADI 4650). 2016 é o marco zero, a primeira eleição depois da proibição. |
| Q10, Q11 | 2014–2024 | A prestação de contas foi coletada desde 2014 por causa da Q8, e as análises de receitas (Q10) e de despesas de propaganda (Q11) já usam esse ano. Na Q10, 2014 é o contraponto: o financiamento ainda era quase todo privado (2,4% público no PI). |
| Q12 | 2002–2024 | A trajetória de um político pede a série mais longa possível. O cadastro de candidatos existe desde 2002 e a mesma pessoa é ligada entre eleições pelo título de eleitor. |

O período de cada pergunta está na tabela da seção 2.

### APIs e fontes

| Fonte | Acesso planejado | Uso no projeto |
|---|---|---|
| TSE — Portal de Dados Abertos | Arquivos públicos ZIP/CSV; o catálogo CKAN aponta para os recursos, não há API de consulta tabular para estas bases. | Candidaturas, votação, vagas, comparecimento, contas e propostas. |
| IBGE — API SIDRA | Respostas JSON por tabela, variável, período e nível geográfico. | População (6579), escolaridade (10061) e idade (9514/9606). |
| IBGE — PIB dos Municípios | Planilha XLSX do FTP do IBGE. | PIB per capita e hierarquia geográfica municipal. |
| IBGE — API de malhas | GeoJSON municipal. | Visualização espacial do Piauí e do país. |
| PNUD / Atlas Brasil | Fonte complementar de IDHM municipal histórico. | Contexto comparativo; o IDHM municipal não é anual nem substitui o PIB per capita. |

A ponte oficial `municipio_tse_ibge` relaciona os códigos municipais. `cod_tse` deve ser texto de cinco caracteres para preservar zeros à esquerda. As fontes e os procedimentos de coleta estão em `docs/fontes-de-dados.md`, `docs/esquemas.md` e `scripts/coleta_*.py`.
