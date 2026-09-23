## 8. Fontes dos dados e leia-me

| Instituição | Dados obtidos | Acesso e documentação |
|---|---|---|
| Tribunal Superior Eleitoral (TSE) | Candidaturas, coligações, vagas, votação, eleitorado, comparecimento, prestação de contas, propostas de governo e correspondência TSE–IBGE. | Portal de Dados Abertos e arquivos ZIP/CSV/PDF. Os pacotes de prestação de contas incluem PDFs `leiame_*.pdf`; os pacotes de propostas incluem `leiame.pdf`. |
| Instituto Brasileiro de Geografia e Estatística (IBGE) | População, escolaridade e idade, PIB municipal, hierarquia territorial e malhas. | API SIDRA, planilha do PIB dos Municípios no FTP e API de malhas; metadados dos agregados no serviço do IBGE. |
| Programa das Nações Unidas para o Desenvolvimento (PNUD) / Atlas Brasil | IDHM municipal histórico. | Fonte complementar; verificar ano de referência e evitar interpretar como indicador anual atual. |

Os endereços, tabelas, recortes e limitações constam de `docs/fontes-de-dados.md`. Os arquivos brutos são guardados em `dados/raw/`; o inventário de colunas efetivamente obtidas está em `docs/esquemas.md`.

**PDFs de leia-me:** `docs/dossie/leiames/` espelha os PDFs de `dados/raw/`, preservando a estrutura de tema, ano e pacote. A página HTML lê `docs/dossie/leiames/indice.md` e lista todos os caminhos, inclusive os de subpastas; um clique abre a prévia em uma janela sobreposta, sem seleção manual de pasta. PDFs adicionados depois só aparecem na lista após regenerar `indice.md`.
