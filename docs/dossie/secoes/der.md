## 3. Diagrama entidade-relacionamento (DER)

**Fonte do diagrama:** `docs/dossie/der.mmd` (sintaxe Mermaid `erDiagram`). A página HTML carrega esse arquivo em tempo de execução, e o PDF apresenta o diagrama renderizado a partir do mesmo arquivo. Ele consolida o rascunho `docs/der.md` com as correções registradas em `docs/estrategia.md`, seção 4.1. É um modelo proposto para o trabalho; a validação completa de chaves e cardinalidades depende da carga.

Eixos do modelo: `CANDIDATURA` conecta pessoa, eleição, partido, votos e finanças; `MUNICIPIO` conecta os códigos TSE e IBGE aos resultados e indicadores. A federação é opcional a partir de 2022. Para `CANDIDATURA`, o município é resolvido a partir de `SG_UE` somente em pleitos municipais.
