## 1. Introdução

### Do que se trata

O projeto investiga candidaturas e resultados eleitorais de seis estados brasileiros (Amazonas, Goiás, Maranhão, Mato Grosso, Rio Grande do Sul e Sergipe), cruzando dados do Tribunal Superior Eleitoral (TSE) com indicadores municipais do Instituto Brasileiro de Geografia e Estatística (IBGE). O banco analítico planejado organiza candidaturas, votos, financiamento, perfil do eleitorado e contexto socioeconômico para responder a 10 perguntas. O projeto usa DuckDB e notebooks para preparação e análise. Os resultados das perguntas ainda dependem da carga e das consultas; este dossiê documenta o desenho do banco, não resultados calculados.

### Objetivo

Estruturar uma base relacional rastreável que permita comparar eleições, municípios, partidos e candidatos, preservando a granularidade e a procedência de cada informação. Cada pergunta indica o resultado que uma consulta futura deverá entregar.

### Recorte geográfico

O projeto trabalha com seis unidades da federação: **AM, GO, MA, MT, RS e SE**. O recorte não foi escolha do grupo: os estados foram sorteados pelo professor. O Piauí aparece só nos primeiros testes de coleta, feitos antes do sorteio, e não faz parte da análise.

Todas as perguntas usam o mesmo recorte. Os temas do TSE que o portal divide por estado (candidaturas, resultados, eleitorado, comparecimento por perfil e prestação de contas) são extraídos só dessas seis UFs, e a malha municipal do IBGE é baixada por estado.

### Período de análise

O período padrão (E.P.) são as eleições ordinárias de **2018, 2020, 2022 e 2024**: duas gerais (2018 e 2022) e duas municipais (2020 e 2024). Sete das dez perguntas usam esse período.

Três perguntas usam outro período, porque o dado que pedem está fora dele:

| Pergunta | Período | Motivo |
|---|---|---|
| Q3 | 2008–2012 | O IDHM municipal só existe para os anos de Censo, e o mais recente é 2010. As municipais de 2008 e 2012 são as que cercam esse Censo. O período depende da quantidade de dado disponível: os resultados por município (votos e comparecimento) ainda só foram coletados de 2016 em diante. |
| Q4 | 2022, 2024 | A escolaridade da população vem do Censo 2022. As eleições de 2022 e 2024 são as mais próximas dele. |
| Q10 | 2002–2026 | A carreira de um político pede a série mais longa possível. O cadastro de candidatos existe desde 2002, e a mesma pessoa é ligada entre eleições pelo título de eleitor. |

**2026.** A eleição de 2026 entra no escopo, mas fica fora da visualização até o TSE publicar os dados finais. Na data deste dossiê, o 2º turno ainda não tem resultado e a prestação de contas só tem entregas parciais. Os dados de 2026 são coletados e carregados como os dos outros anos, e basta coletar de novo quando o resultado e a prestação final saírem. Nas consultas, a coluna `fl_divulgado` marca os anos que podem aparecer, e o ano de corte fica num lugar só, a macro `ano_divulgado`.

O período de cada pergunta está na tabela da seção 2.

### APIs e fontes

| Fonte | Acesso planejado | Uso no projeto |
|---|---|---|
| TSE — Portal de Dados Abertos | Arquivos públicos ZIP/CSV; o catálogo CKAN aponta para os recursos, não há API de consulta tabular para estas bases. | Candidaturas, votação, vagas, comparecimento, contas e propostas. |
| IBGE — API SIDRA | Respostas JSON por tabela, variável, período e nível geográfico. | População (6579), escolaridade (10061) e idade (9514/9606). |
| IBGE — PIB dos Municípios | Planilha XLSX do FTP do IBGE. | PIB per capita e hierarquia geográfica municipal. |
| IBGE — API de malhas | GeoJSON municipal, um arquivo por UF. | Visualização espacial dos municípios das seis UFs. |
| PNUD / Atlas Brasil | Fonte complementar de IDHM municipal histórico. | Contexto comparativo; o IDHM municipal não é anual nem substitui o PIB per capita. |

A ponte oficial `municipio_tse_ibge` relaciona os códigos municipais. `cod_tse` deve ser texto de cinco caracteres para preservar zeros à esquerda. As fontes e os procedimentos de coleta estão em `docs/fontes-de-dados.md`, `docs/esquemas.md` e `scripts/coleta_*.py`.
