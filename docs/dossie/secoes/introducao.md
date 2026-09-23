## 1. Introdução

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
