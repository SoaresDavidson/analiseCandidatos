## 3. Diagrama entidade-relacionamento (DER)

**Fonte do diagrama:** `docs/dossie/der.mmd` (sintaxe Mermaid `erDiagram`).

Eixos do modelo: `CANDIDATURA` conecta pessoa, eleição, partido, votos e finanças; `MUNICIPIO` conecta os códigos TSE e IBGE aos resultados e indicadores. A federação é opcional a partir de 2022. Para `CANDIDATURA`, o município é resolvido a partir de `SG_UE` somente em pleitos municipais.
