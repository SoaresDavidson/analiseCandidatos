# Revisão dos PRs #2, #3 e #4 — 23/09/2026

Revisão feita contra os **dados reais baixados**, não contra a documentação. Seis revisores independentes, um por frente; cada achado de severidade alta ou média passou por um verificador cético, instruído a tentar **refutá-lo** reproduzindo a evidência sozinho. A execução foi pausada no fim, com 10 verificações ainda pendentes — marcadas abaixo.

**100 achados.** Veredito das verificações: confirmado: 34, não verificado (baixa): 32, parcial: 18, verificação interrompida: 16.

Severidade final: alta 15, média 43, baixa 42.

Nenhum achado foi corrigido nos PRs — cada um é do dono do PR. As correções de modelagem entraram no `der-geral.md`; as de coleta estão listadas na seção 4 dele.

## Sumário

- [PR #4 (Davi) — conteúdo do dossiê e dos DERs](#pr-4-davi--contedo-do-dossi-e-dos-ders) — 19 achados
- [PR #4 (Davi) — engenharia: scripts, notebooks, repositório](#pr-4-davi--engenharia-scripts-notebooks-repositrio) — 14 achados
- [PR #2 (Enrico) — staging SQL e Q10–Q12](#pr-2-enrico--staging-sql-e-q10q12) — 13 achados
- [PR #3 (Dudu) — DER da Q4–Q6](#pr-3-dudu--der-da-q4q6) — 13 achados
- [Consistência entre os quatro DERs](#consistncia-entre-os-quatro-ders) — 23 achados
- [Dados faltantes por pergunta](#dados-faltantes-por-pergunta) — 18 achados

## PR #4 (Davi) — conteúdo do dossiê e dos DERs

Revisei o conteúdo documental do PR #4 (origin/pr/4 = e0e5bd8): der-davi.md, dicionario-dados.md, dossie/der.mmd, secoes/*.md, index.html, README.md, TODO.md, leiames/indice.md e o diff de estrategia.md. Conferi cada coluna citada com DESCRIBE/consultas no DuckDB sobre os CSVs reais: consulta_cand 2002-2026, vagas, bens, votacao/detalhe, perfil_eleitorado/comparecimento, prestação de contas PI, a nacional de 2024 lida direto do .zip, SIDRA e PIB. Também renderizei os 4 diagramas no Mermaid 11.17.2 pelo Edge headless. Os diagramas renderizam, os links e os leia-mes batem, e vários números conferem (QT_VAGAS/QT_VAGA, 3,3%/3,5% de SQ -1, 50 tipos de bem, tamanhos do _BRASIL). Os problemas graves estão nas chaves. SQ_CANDIDATO não é PK: o mesmo SQ aparece nos dois turnos e se repete entre anos de 2010 a 2016. NR_PARTIDO e NR_FEDERACAO não são estáveis entre anos. SQ_DESPESA e SQ_RECEITA continuam repetidos mesmo depois do filtro Final. Faltam dados para a Q3 como foi modelada (população só de 2026, eleitorado 2022+ só do PI, IDHM sem fonte). O der.mmd está incompleto e contradiz o der-davi.md e o dicionário em PK de MUNICIPIO, ELEICAO e ELEITORADO. Para a Duda (Q7-Q9): falta a entidade de doador originário e CENSO_FAIXA_ETARIA, e COMPARECIMENTO_PERFIL fica sem nr_turno. Arquivos temporários ficaram em C:/Users/eduar/Downloads/rv/pr4d/ (w.duckdb, q*.py, render11.html, zipcount.py).

**Conferido e correto:**

- Mermaid: docs/dossie/der.mmd e os 3 blocos de docs/der-davi.md renderizam sem erro no Mermaid 11.17.2 (Edge headless, render11.html: 'der.mmd: OK', 'der-davi bloco 1/2/3: OK'). index.html servido por HTTP com o mermaid.min.js vendorizado (contém a string '10.9.5', não é o 11) mostra o status 'DER renderizado a partir de docs/dossie/der.mmd' e '141 de 141 PDF(s)'.
- leiames/indice.md: os 141 links batem exatamente com os 141 PDFs da árvore do PR (diff vazio). As contagens por tema conferem (abstencao 5, candidatos 47, eleitorado 11, extras 1, prestacao_contas 53, proposta_governo 6, resultados 18). Todos os caminhos citados em index.html (der.mmd, leiames/indice.md, docs/der.md, docs/dicionario-dados.md, docs/esquemas.md, docs/estrategia.md, docs/fontes-de-dados.md, scripts/coleta_*.py) existem no PR.
- consulta_vagas: QT_VAGAS em 2016 e QT_VAGA de 2018 em diante (DESCRIBE), como diz o der-davi. (CD_ELEICAO, SG_UE, CD_CARGO) é único: 2016 17.082/17.082, 2020 16.955/16.955, 2024 16.795/16.795.
- SQ -1/nulo na prestação nacional de 2024, lida do zip: despesas_contratadas 159.102 de 4.452.136 (3,57%) e receitas 66.600 de 2.041.006 (3,26%). Confere com os '3,5%' e '3,3%' do der-davi.
- bem_candidato 2024: 50 CD_TIPO_BEM_CANDIDATO distintos. A PK (SQ_CANDIDATO, NR_ORDEM_BEM_CANDIDATO) é única (911.109/911.109) e NR_ORDEM tem no máximo 3 dígitos.
- votacao_candidato_munzona: (SQ_CANDIDATO, NR_TURNO, CD_MUNICIPIO, NR_ZONA) é único em 2016-2024 (ex.: 2024 717.246/717.246). detalhe_votacao_munzona: (CD_ELEICAO, NR_TURNO, CD_CARGO, CD_MUNICIPIO, NR_ZONA) é único. Os 12.630 registros e 5.568 municípios de 2020 citados no estrategia.md conferem. QT_APTOS, QT_ABSTENCOES, QT_VOTOS_BRANCOS e QT_VOTOS_NULOS existem.
- SG_UE: em 2016 e 2024 100% dos valores têm 5 dígitos. Nas eleições gerais é UF ou 'BR' (Presidente). A ponte municipio_tse_ibge cobre 5.568 SG_UE (2016/2020) e 5.569 (2024) com 0 órfãos. consulta_cand não tem CD_MUNICIPIO (confirmado).
- Domínios que conferem (2014+): CD_SIT_TOT_TURNO 1/2/3 eleito, 4, 5, 6, -1, com DS de no máximo 16 caracteres; CD_GRAU_INSTRUCAO 1-8; CD_ESTADO_CIVIL 1/3/5/7/9; CD_CARGO 1-13; NR_PARTIDO 10-90; NM_URNA com no máximo 30; CD_GENERO 2/4. CD_COR_RACA só tem valor real a partir de 2014 (2002-2012 = -3 #NE em 100%). O código 6 'NÃO INFORMADO' aparece em 2020, 2022 e 2024.
- Volume do dicionário: municipais 498.391 (2016), 558.804 (2020), 463.859 (2024); gerais 26.263 a 29.322. Confere com '~500 mil / ~30 mil'.
- CPF: 2024 com '-4' é coerente com o fato 1. O título de eleitor como chave de POLITICO é coerente. CD_ELEICAO muda por turno (ex.: SQ 150001998778 com 619 no 1º turno e 620 no 2º).
- perfil_comparecimento_abstencao PI 2024: soma de QT_APTOS = 2.698.764 = soma de QT_ELEITORES do perfil_eleitorado (fato 5). O arquivo não tem CD_ELEICAO nem CD_CARGO, coerente com COMPARECIMENTO_PERFIL do der.mmd.
- PIB dos Municípios 2010-2023 tem a coluna 'Produto Interno Bruto per capita' (anos 2010..2023). Para a eleição de 2024 a regra 'ano_referencia <= ano_eleicao' usa 2023.
- Diff do estrategia.md: tamanhos descompactados do _BRASIL dentro dos zips = 1,14 / 4,23 / 2,03 / 5,78 / 2,80 / 5,86 / 0,82 GB (2014..2026), ou ~1,06 / 3,94 / 1,89 / 5,38 / 2,61 / 5,46 / 0,76 GiB. Batem com a tabela e com o total '~21 GB'. A coluna 'extraído hoje' não foi verificada, porque a extração local atual é só do PI.
- A ressalva do estrategia.md (e do TODO) de que despesa de eleição geral não tem município confere: SG_UE = 'PI' em 100% das despesas_contratadas PI de 2018 (20.350) e de 2022 (22.110). Em 2014 o txt nem tem coluna de UE.
- Layout novo: AA_ELEICAO, SG_UE, TP_PRESTACAO_CONTAS, VR_DESPESA_CONTRATADA, SQ_PARCELAMENTO_DESPESA, VR_PAGTO_DESPESA, CD_CNAE_DOADOR, DS_FONTE_RECEITA e DS_ORIGEM_RECEITA existem. PAGAMENTO_DESPESA (SQ_DESPESA, SQ_PARCELAMENTO_DESPESA) é único no PI 2024 Final (54.966/54.966).

**Achados:**

### [alta] `pr4-dossie-01` — confirmado

- **Arquivo:** docs/dicionario-dados.md; docs/der-davi.md; docs/dossie/der.mmd
- **Problema:** CANDIDATURA usa sq_candidato sozinho como PK, e isso não se sustenta. O candidato que vai ao 2º turno tem duas linhas com o MESMO SQ_CANDIDATO. O dicionário diz o contrário ('dois SQ_CANDIDATO') e afirma que o SQ é 'Único em toda a base (o TSE não reusa entre anos)', o que é falso quando a tabela inclui 2010-2012 (histórico da Q12). O der-davi modela 'candidato de 2º turno = duas candidaturas' com PK SQ_CANDIDATO, o que é contraditório. O der.mmd tipa o campo como int, mas os valores têm 11-12 dígitos e o contrato de chaves fixa BIGINT.
- **Evidência:** DuckDB, todos os consulta_cand_<ano>_BRASIL.csv (o de 2016 foi transcodificado porque tem 2 linhas com byte inválido em cp1252): SELECT ANO_ELEICAO, count(*), count(DISTINCT SQ_CANDIDATO). Resultados: 2014 26.263/26.195; 2016 498.391/498.163; 2020 558.804/558.572; 2022 29.322/29.270; 2024 463.859/463.655. As diferenças (68+228+60+232+52+204 = 844) são exatamente os SQ com NR_TURNO 1 e 2, ex.: 150001998778 com turno 1/CD_ELEICAO 619/sit 6 e turno 2/620/sit 4. Entre anos: 392.572 SQ aparecem em 2012 e 2016; 11.819 em 2010, 2012 e 2014 (ex.: 250000001821 = ZENALIA 2010 SP, ANA MARIA 2012 66710, CREUSA 2014 SP). Entre 2014 e 2026 não há reuso entre anos (1.626.910 linhas, 1.626.066 distintos, diferença = só os 844 dos turnos). Comprimento: 349.020 SQ com 11 dígitos e 1.277.890 com 12 (o dicionário diz '11 dígitos').
- **Correção:** Separar a candidatura do turno.

1) CANDIDATURA (uma linha por candidato por eleição, que é onde RECEITA, DESPESA, BEM e PROPOSTA se ligam, porque não dependem de turno):
- PK (ano_eleicao, sq_candidato).
- Carregar só CD_TIPO_ELEICAO = 2 (ordinária). Sem esse filtro, 2012 tem 91 colisões entre eleição ordinária e suplementar.
- O cd_sit_tot_turno final vem da linha de maior NR_TURNO.
- As FKs de RECEITA, DESPESA, BEM, PROPOSTA e TERMO_PROPOSTA passam a levar o ano_eleicao.

2) CANDIDATURA_TURNO (ano_eleicao, sq_candidato, nr_turno, cd_eleicao, cd_sit_tot_turno):
- PK (ano_eleicao, sq_candidato, nr_turno), com FK para ELEICAO(cd_eleicao), que tem uma linha por turno.
- VOTACAO_CANDIDATO_MUNICIPIO referencia essa tabela.
- Se as suplementares forem mantidas, a chave do turno passa a ser (sq_candidato, cd_eleicao). Esse par é único nas 2.133.228 linhas de 2010 a 2026, e o CD_ELEICAO já identifica o ano.

3) Textos do dicionário:
- sq_candidato: "único por ano e turno a partir de 2010; em 2010–2016 o mesmo número volta em anos diferentes para outras pessoas; em 2012 também se repete entre eleição ordinária e suplementar; antes de 2010 é um contador local de 1 a 5 dígitos, que não serve de chave".
- Domínio de sq_candidato: "11 ou 12 dígitos".
- nr_turno: "o candidato que vai ao 2º turno aparece em duas linhas com o MESMO SQ_CANDIDATO e CD_ELEICAO diferente (ex.: 619 e 620 em 2024)".

4) Diagramas:
- der-davi.md: trocar a PK de CANDIDATURA e a frase "duas candidaturas" por "duas linhas de CANDIDATURA_TURNO".
- der.mmd: sq_candidato como bigint e nr_turno no ELEICAO.
- Aplicar a mesma correção em docs/der.md do main, que tem o mesmo erro e é a base do DER geral.
- **Verificação:** Refiz a medição por conta própria. Carreguei SQ_CANDIDATO, NR_TURNO, CD_ELEICAO e CD_SIT_TOT_TURNO de todos os consulta_cand_<ano>_BRASIL.csv (2002 a 2026) em DuckDB, em modo estrito e sem ignore_errors. O arquivo de 2016 derruba o DuckDB com cp1252 ("INTERNAL Error: index 17 within vector of size 10"), então transcodifiquei para UTF-8 com errors='replace' (2 bytes trocados) e li 498.391 linhas. Script e banco: C:/Users/eduar/Downloads/rv/cetico-pr4-01/sq.py, sq2.py, sq.duckdb.

1) Duplicação por turno: reproduz exatamente. Linhas / SQ distintos / diferença / SQ com turno 1 e 2:
- 2014: 26.263 / 26.195 / 68 / 68
- 2016: 498.391 / 498.163 / 228 / 228
- 2018: 29.287 / 29.227 / 60 / 60
- 2020: 558.804 / 558.572 / 232 / 232
- 2022: 29.322 / 29.270 / 52 / 52
- 2024: 463.859 / 463.655 / 204 / 204
Soma de 2014 a 2024 = 844. Em 2014–2026 não há nenhuma outra duplicata (0 SQ repetido no mesmo turno). Exemplo: 150001998778 (MARCELO ... QUEIROGA, SG_UE 20516, cargo 11) tem turno 1 com CD_ELEICAO 619 e situação 6, e turno 2 com CD_ELEICAO 620 e situação 4. O problema continua mesmo filtrando só eleição ordinária (CD_TIPO_ELEICAO=2), como o der-davi sugere: 2024 fica com 463.598 linhas para 463.394 SQ. Portanto PK = sq_candidato viola unicidade dentro do próprio recorte 2014–2026.

2) Os textos citados existem no ref origin/pr/4:
- docs/dicionario-dados.md, linha 42: "inteiro positivo, 11 dígitos" e "Único em toda a base (o TSE não reusa entre anos)".
- Mesmo arquivo, linha 51: "aparece em duas linhas (dois `SQ_CANDIDATO`)".
- Mesmo arquivo, linha 34: granularidade "candidato × eleição × turno", o que já contradiz a PK de uma coluna só.
- docs/der-davi.md, linha 169: "SQ_CANDIDATO PK"; linha 216: "candidato de 2º turno = duas candidaturas".
- docs/dossie/der.mmd, linha 95: "int sq_candidato PK".
- O contrato de chaves em docs/estrategia.md fixa candidatura.sq_candidato como BIGINT.

3) Reuso entre anos: reproduz, mas só vale se a série incluir 2010–2012.
- SQ presente em 2010, 2012 e 2014: 11.819, igual ao achado. O exemplo 250000001821 confere: ZENALIA em 2010 (cargo 7), ANA MARIA em 2012 (UE 66710, cargo 12) e CREUSA em 2014 (cargo 6), com títulos diferentes.
- SQ presente em 2012 e 2016: obtive 393.256, não 392.572. A divergência é pequena e não muda a conclusão.
- De 2014 a 2026: 1.626.910 linhas, 1.626.066 SQ distintos, zero SQ em mais de um ano.
- Ressalva: o dicionário declara o leiaute de 2014–2026 e a estrategia.md diz que "2002–2012 — fora, salvo se a Q12 ficar rasa". Mas a mesma estrategia dá a Q12 como "2002–2026" e conta 1.856.271 pessoas entre 2002 e 2026. Então o "único em toda a base" só é falso com o histórico carregado. A parte do 2º turno é falsa em qualquer recorte.

4) Número de dígitos: de 2014 a 2026 há 349.020 SQ com 11 dígitos e 1.277.890 com 12, igual ao achado. O maior valor é 280002554490, acima do limite de int32. De 2002 a 2008 o SQ tem de 1 a 5 dígitos.

5) Falha na correção proposta. A PK (ano, sq_candidato, nr_turno) não é única em 2012 sem filtro: 483.741 linhas para 483.650 combinações. São 91 SQ repetidos no mesmo turno, entre a eleição ordinária (CD_ELEICAO 47) e eleições suplementares (186, 187, 197 etc.), e são pessoas diferentes. Exemplo: 130000002190 é CESAR APARECIDO DE LIMA (cargo 11, CD_ELEICAO 187) e também JOÃO BATISTA FERNANDES PINTO (cargo 13, CD_ELEICAO 47). Com o filtro CD_TIPO_ELEICAO=2, 2012 fica 483.068 / 483.068. Já o par (SQ_CANDIDATO, CD_ELEICAO) é único nas 2.133.228 linhas de 2010 a 2026, e nenhum CD_ELEICAO aparece em mais de um ano.

6) A mesma falha fora dos arquivos citados: docs/der.md, que já está no main e não é alterado pelo PR #4, também tem "bigint sq_candidato PK" (linha 119). Além disso, o ELEICAO do der.mmd (id_eleicao, ano, dt_eleicao) não tem turno.

7) O ponto do tipo int no der.mmd procede, mas é menor. O der.mmd usa "int" para todo campo inteiro, porque no Mermaid o tipo é só um rótulo. O der-davi.md e o dicionário usam BIGINT corretamente.

### [alta] `pr4-dossie-02` — confirmado

- **Arquivo:** docs/dossie/der.mmd; docs/der-davi.md; docs/dicionario-dados.md; docs/dossie/secoes/dicionario.md
- **Problema:** PARTIDO tem PK nr_partido (der.mmd, der-davi Q3, dicionário #5 'FK → PARTIDO.nr_partido'), mas o número é reaproveitado por partidos diferentes. Com cd_espectro guardado em PARTIDO por número, o PRD herda o espectro do DEM e o UNIÃO herda o do PRP, o que quebra a Q9 (espectro) e a contagem de 'partido mais vitorioso' da Q3.
- **Evidência:** SELECT ANO_ELEICAO, NR_PARTIDO, SG_PARTIDO, count(*) FROM cand WHERE NR_PARTIDO IN ('25','44'). Resultados: 25 = DEM em 2014/2016/2018/2020 (33.308 linhas em 2020) e PRD em 2024 (17.096) e 2026 (502); 44 = PRP em 2014/2016/2018 e UNIÃO em 2020 (suplementares)/2022/2024 (36.623)/2026. Confirma o fato 3. A seção 5 do dossiê só diz 'PK no recorte adotado... verificar identificação por eleição'.
- **Correção:** 1) Trocar a identidade de PARTIDO para a eleição. Há duas opções:
- (a) PK (cd_eleicao, nr_partido), ou um id_partido surrogate com UNIQUE (cd_eleicao, nr_partido). É a única chave medida com 0 colisões usando todos os arquivos.
- (b) PK (ano_eleicao, nr_partido), desde que a carga filtre só eleições ordinárias (NM_TIPO_ELEICAO ordinária). A regra precisa ficar escrita, porque com as suplementares existem 16 colisões (ex.: 2020/25 DEM x PRD).

2) Levar o mesmo ajuste para as FKs:
- CANDIDATURA e VOTACAO_LEGENDA_MUNICIPIO passam a referenciar a chave composta: (id_eleicao ou cd_eleicao, nr_partido), ou então id_partido.

3) Guardar cd_espectro por (ano, sigla) ou pela chave nova, e não por número. Documentar a escala acadêmica usada, como já pede a decisão ③ do estrategia.md.

4) Alinhar os documentos:
- Atualizar der.mmd, a Q3 do der-davi.md, dicionario-dados.md (#5) e secoes/dicionario.md. Na seção 5 do dossiê, trocar "verificar identificação por eleição" pela regra efetivamente adotada.
- Atualizar também o "Contrato de chaves" do estrategia.md e o docs/der.md. Esses dois já estavam errados no main; o erro não foi introduzido pelo PR #4.

5) Registrar no dicionário que o problema não se limita a 25 e 44: os números 14 (PTB/MISSÃO), 18 (PST/REDE), 20 (PSC/PODE) e 30 (PGT/NOVO) também passaram para outro partido. Por isso qualquer série histórica (Q3 multi-ano, Q9) tem de juntar pela chave da eleição, nunca só por nr_partido.
- **Verificação:** Reproduzi o achado de forma independente, com scripts em C:/Users/eduar/Downloads/rv/cetico-pr4d02/q*.py (DuckDB lendo consulta_cand_*_BRASIL.csv de 2002 a 2026, cp1252, all_varchar, union_by_name, sem ignore_errors).

1) Arquivos do PR #4 (git show origin/pr/4:...):
- docs/dossie/der.mmd, linhas 84-88: `PARTIDO { int nr_partido PK / string sg_partido / string cd_espectro }`. CANDIDATURA (linha 99) e VOTACAO_LEGENDA_MUNICIPIO (linha 117) têm `int nr_partido FK`.
- docs/der-davi.md, Q3, linhas 315-318: `PARTIDO { INTEGER NR_PARTIDO PK ... }`, sem espectro. A linha 381 agrega votos "agrupado por nr_partido".
- docs/dicionario-dados.md, linha 46: `nr_partido | INTEGER | N | FK → PARTIDO.nr_partido`.
- docs/dossie/secoes/dicionario.md, linha 16: "`nr_partido` (PK no recorte adotado) ... verificar identificação por eleição".
- Esses 4 arquivos são novos no PR #4 (git diff --name-status origin/main origin/pr/4 mostra A). O docs/der.md com `nr_partido PK` e o "Contrato de chaves" do estrategia.md (`partido.nr_partido`) já estavam no main.
- Agravante: o próprio estrategia.md, decisão ③ (linhas 344-347 do PR #4, 289 do main), diz que "PARTIDO fica identificado pelo número dentro do ano" e que o cd_espectro é "classificado por eleição". O DER do PR contradiz essa decisão do próprio grupo.

2) Dados, NR_PARTIDO em ('25','44'):
- 25: PFL de 2002 a 2006, DEM de 2008 a 2020 (2020: 33.308 linhas na eleição ordinária + 23 em suplementares), PRD em 2024 (17.102) e 2026 (502).
- 44: PRP de 2002 a 2018; UNIÃO em 2020 (34 linhas, suplementares), 2022 (1.551), 2024 (36.641) e 2026 (846).
- Os números do revisor batem com o recorte só de eleição ordinária.
- No PI, o problema aparece dentro do próprio recorte: 25/DEM teve 18 eleitos em 2020 e 25/PRD teve 11 em 2024; 44/PRP teve 35 eleitos em 2016 e 44/UNIÃO teve 18 em 2024.

3) O problema é maior que o descrito:
- 19 números mudam de sigla ao longo dos anos. Além de 25 e 44, há números que passaram para outro partido: 14 = PTB (2002-2022) e MISSÃO (2026); 18 = PST (2002) e REDE (2014+); 20 = PSC (até 2022) e PODE (2020+); 30 = PGT (2002) e NOVO (2016+).

4) A correção proposta, (ano, nr_partido), também não é única nos arquivos brutos:
- Há 16 pares (ANO_ELEICAO, NR_PARTIDO) com mais de uma sigla, por causa das suplementares que vêm misturadas no arquivo anual (fato 4). Exemplos: 2020/25 = DEM na ordinária e PRD numa suplementar de 28/04/2024 (1 linha); 2020/20 = PSC e PODE (suplementar de 09/06/2024); 2024/35 = PMB e DEMOCRATA.
- Chaves testadas:
  - (CD_ELEICAO, NR_PARTIDO): 0 colisões.
  - (ANO_ELEICAO, NR_PARTIDO) só com eleição ordinária: 0 colisões.
  - (ano de DT_ELEICAO, NR_PARTIDO): 7 colisões.

5) Pontos exagerados no achado:
- Na Q3, o ranking "dentro da mesma eleição e cargo" contando por nr_partido continua correto dentro de um ano. O que quebra é a sigla vinda de PARTIDO (errada num dos anos) e qualquer agregação que atravesse anos, que junta DEM com PRD.
- "PRD herda o espectro do DEM" depende da carga: com PK real, o INSERT de valores distintos falha por chave duplicada; com dedup, um dos dois partidos fica com o espectro do outro, e não dá para saber qual. Nos dois casos a Q9 fica errada.

### [alta] `pr4-dossie-03` — confirmado

- **Arquivo:** docs/der-davi.md
- **Problema:** O der-davi afirma que 'SQ_DESPESA só funciona como PK depois de filtrar a prestação Final e remover -1' e aplica a mesma regra a SQ_RECEITA. É falso: depois desse filtro, 31% das linhas de despesa ainda repetem SQ_DESPESA. É uma linha por item da mesma nota. O der.mmd usa id_despesa/id_receita surrogate, o que contradiz o der-davi.
- **Evidência:** Prestação nacional 2024 lida do zip (zipcount.py, csv.reader): despesas_contratadas_candidatos_2024_BRASIL.csv tem 4.283.027 linhas Final com SQ válido, 2.959.042 SQ distintos e 1.323.985 repetidos. receitas_candidatos_2024_BRASIL.csv tem 1.968.018 linhas Final válidas, 1.825.536 distintos e 142.482 repetidos. PI 2024 (DuckDB): 85.427 linhas e 50.073 SQ_DESPESA distintos. (SQ_PRESTADOR_CONTAS, SQ_DESPESA) e (SQ_CANDIDATO, SQ_DESPESA) também dão 50.073, e nenhum SQ_DESPESA tem mais de um candidato. Ex.: SQ_DESPESA 66193934 tem 8 linhas de R$920 com a mesma NR_DOCUMENTO 1361 e DS_DESPESA 'SANTINHO ... <nome diferente>'. Há ainda 993 linhas 100% idênticas (85.427 - 84.434 com DISTINCT *).
- **Correção:** 1. Mantenho a correção do revisor: PK surrogate (id_despesa/id_receita), com SQ_DESPESA/SQ_RECEITA mantidos como atributos não únicos. O der.mmd/der.md atual também precisa manter sq_despesa, que hoje foi descartado; sem ele não há como ligar a despesas_pagas.

2. O modelo que os dados confirmam é cabeçalho + itens:
- DESPESA (ano, sq_despesa) PK, que reúne nota, fornecedor, prestador e candidato;
- DESPESA_ITEM (id_item PK, ano, sq_despesa FK, ds_despesa, vr_despesa_contratada);
- PAGAMENTO_DESPESA com FK para DESPESA(ano, sq_despesa). No PI 2024, SQ_PARCELAMENTO_DESPESA sozinho já é único (54.966/54.966).
- Para receitas, o análogo é RECEITA (ano, sq_receita) + itens, ou apenas o surrogate.

3. A dúvida sobre as linhas idênticas se resolve pelos dados: NÃO deduplicar. Elas são itens legítimos, já que o pagamento bate com a soma incluindo as repetições em 405 de 406 casos. O custo por cadeira deve ser SUM de todos os itens Final com SQ válido.

4. Trocar o filtro para `UPPER(TP_PRESTACAO_CONTAS) = 'FINAL'`: receitas 2024 usa 'FINAL' e despesas usa 'Final'.

5. Corrigir o texto das l.97-98 e 232-234 do der-davi, que afirmam que o filtro Final/-1 torna a PK válida.
- **Verificação:** Refiz tudo de forma independente. Os scripts estão em C:/Users/eduar/Downloads/rv/cetico03/q1..q6.py e nat.py.

1) O texto do PR confere. Em `git show origin/pr/4:docs/der-davi.md`:
- l.62: `BIGINT SQ_DESPESA PK` (Q1).
- l.97-98: "`SQ_DESPESA` só funciona como PK depois de filtrar a prestação Final e remover valores `-1`/nulos".
- l.193 e l.199: SQ_RECEITA e SQ_DESPESA como PK com o comentário "filtrar TP_PRESTACAO_CONTAS = Final".
- l.232-234: "só então a PK vale".
- l.205: PAGAMENTO_DESPESA com PK/FK em SQ_DESPESA.
No mesmo PR, docs/dossie/der.mmd (l.150 `int id_receita PK`, l.162 `int id_despesa PK`) e docs/der.md (l.263/273) usam surrogate. A contradição existe.

2) Nacional 2024: nat.py lê o zip em streaming com csv.reader e não encontrou nenhuma linha malformada.
- despesas_contratadas_candidatos_2024_BRASIL.csv: 4.452.136 linhas. Após Final e SQ válido: 4.283.027, com 2.959.042 SQ_DESPESA distintos. Sobram 1.323.985 repetidos (30,91%). Com (SQ_PRESTADOR_CONTAS, SQ_DESPESA) também dá 2.959.042.
- receitas_candidatos_2024_BRASIL.csv: 1.968.018 linhas Final válidas, 1.825.536 distintas, 142.482 repetidas (7,24%).
Os números do revisor se reproduzem exatamente.

3) PI 2024 no DuckDB, leitura estrita: 85.427 linhas Final válidas e 50.073 SQ distintos. Todas estas combinações também dão 50.073 distintos: (SQ_PRESTADOR_CONTAS, SQ_DESPESA), (SQ_CANDIDATO, SQ_DESPESA), (SQ_DESPESA, ST_TURNO) e (SQ_DESPESA, DT_PRESTACAO_CONTAS). Nenhum SQ_DESPESA aparece com mais de um candidato. SELECT DISTINCT * dá 84.434 linhas, ou seja, 993 idênticas, concentradas em 421 SQ.
O SQ 66193934 tem 8 linhas de R$920, com NR_DOCUMENTO 1361, a mesma data e DS 'SANTINHO 7X10CM <nome>'.

4) As repetições são itens da mesma nota. Nos 10.867 grupos repetidos (46.221 linhas):
- não variam: NR_DOCUMENTO, fornecedor, DT_PRESTACAO_CONTAS, turno e CD_ELEICAO (0 grupos cada);
- variam: DS_DESPESA em 10.550 grupos e VR em 10.355.
Em despesas_pagas o SQ 66193934 tem um único pagamento de R$7.360,00, que é 8×920. Cada linha é um item com valor próprio.
Em receitas PI (30.301 linhas, 29.277 distintas), os 574 grupos repetidos variam DS_RECEITA em 569 e VR_RECEITA em 573. É o mesmo fenômeno.

5) Impacto medido:
- CREATE TABLE t(sq BIGINT PRIMARY KEY) seguido de INSERT falha com "Constraint Error: PRIMARY KEY ... duplicate key 64307647".
- Forçar uma linha por SQ_DESPESA derruba o total do PI 2024 de R$122.403.898,04 para R$90.962.995,79, uma perda de R$31,4 mi (25,7%). Isso afeta diretamente o custo por cadeira da Q1.

6) As linhas idênticas NÃO são duplicatas espúrias. Dos 421 SQ afetados, 406 têm pagamento. Em 405 deles o valor pago é igual à soma COM as linhas repetidas, e em 0 é igual à soma deduplicada. O DISTINCT tiraria R$748 mil (de R$2.930.808,36 para R$2.182.322,08).

7) Achado extra, que agrava o problema: o filtro literal `TP_PRESTACAO_CONTAS = 'Final'` do der-davi não bate em receitas 2024. Lá o valor é 'FINAL' (nacional: 2.032.107 linhas; PI: 30.737). Em despesas o valor é 'Final'. Com comparação literal, a receita some inteira.

### [alta] `pr4-dossie-04` — parcial

- **Arquivo:** docs/der-davi.md; docs/dossie/der.mmd
- **Problema:** A Q3, como está modelada, não fecha com os dados coletados. (a) MUNICIPIO_ANO.QT_POPULACAO_ESTIMADA ('SIDRA 6579') só foi baixada para 2026. Assim, a regra 'numerador e denominador do mesmo ano' não se cumpre para 2016-2024. (b) ELEITORADO_MUNICIPIO sai do perfil_eleitorado, que a coleta extrai só do PI a partir de 2022 (manter_uf=UF), mas a Q3 é nacional. A coluna também muda de nome: QT_ELEITORES_PERFIL até 2020 e QT_ELEITORES de 2022 em diante (o der-davi cita só a primeira). (c) A entidade IDHM não tem arquivo nem coletor: o coleta_pnud.py avisa que o Painel só tem BRASIL/UF. O estrategia.md manda usar 'PIB per capita + renda domiciliar do Censo 2022' e não IDHM, mas a Q3 do der-davi inclui IDHM e omite a renda (SIDRA 10295, já baixada).
- **Evidência:** ibge/sidra/6579_populacao_municipios.json tem 5.571 linhas, todas com D3N='2026'. O coleta_ibge.py usa '/t/6579/n6/all/v/all/p/last'. DuckDB perfil_eleitorado: 2016 com 26 UFs e 5.568 municípios, 2020 com 26 e 5.568, 2022/2024/2026 com 1 UF e 224 municípios. DESCRIBE: QT_ELEITORES_PERFIL em 2016-2020 e QT_ELEITORES em 2022-2026. find dados/raw -iname '*idh*' não encontra nada. 10295_renda_domiciliar_municipios.json tem 11.140 linhas, 5.570 municípios e período 2022. Trecho do estrategia.md: 'O eixo "rico/pobre" é **PIB per capita + renda domiciliar do Censo 2022**, não IDHM'.
- **Correção:** (a) População. Há duas saídas, e em qualquer uma o DER deve documentar qual ano de população entra em cada eleição:
- Recoletar a SIDRA 6579 com os períodos das eleições em vez de p/last, por exemplo p/2016,2018,2020,2024. Pelos metadados a tabela vai de 2001 a 2026, mas é preciso conferir se faltam os anos de Censo.
- Derivar a população do xlsx do PIB 2010-2023: PIB (R$ mil) × 1000 / PIB per capita (colunas 38 e 39). Para 2022, dá para somar as faixas do SIDRA 9606 (Censo 2022, já baixado).

Hoje a regra ano_referencia <= ano_eleicao deixa o indicador vazio de 2016 a 2024.

(b) Eleitorado.
- Correção mais barata: mudar coletar_eleitorado para manter_uf=NACIONAL e extrair perfil_eleitorado_{2022,2024,2026}_BRASIL.csv dos zips que já estão em disco.
- No DER e no ETL: QT_ELEITORES = COALESCE(QT_ELEITORES_PERFIL, QT_ELEITORES), porque a coluna muda de nome em 2022.
- Alternativa aceitável: QT_APTOS do detalhe_votacao_munzona, com um cargo por turno. Nesse caso é preciso tratar eleições adiadas e suplementares, porque em 2020 o CD_ELEICAO principal cobre 5.567 municípios e fica 292.718 abaixo do perfil.

(c) IDHM e renda.
- Não tirar o IDHM do DER, porque a pergunta o pede. Marcar a entidade como fonte externa (Atlas Brasil, só 1991/2000/2010), ainda não coletada. Depois, ou criar o coletor, ou declarar a lacuna no dossiê.
- Adicionar a renda domiciliar per capita do Censo 2022 (SIDRA 10295, média e mediana, já baixada), numa entidade CENSO_RENDA ou como coluna de MUNICIPIO_ANO com ano 2022. É o eixo principal "rico/pobre" do estrategia.md.
- Alinhar docs/dossie/der.mmd com docs/der-davi.md: o der.mmd não tem IDHM nem renda, e o der-davi tem IDHM mas não tem renda.
- **Verificação:** Reproduzi o achado de forma independente. As partes (a) e (b) se confirmam. A parte (c) exagera.

(a) CONFIRMADO. Python lendo dados/raw/ibge/sidra/6579_populacao_municipios.json: 5.572 linhas, das quais 5.571 são de dados; D3N (Ano) = {'2026': 5571}. O arquivo origin/pr/4:scripts/coleta_ibge.py, linha 38, baixa `{SIDRA}/t/6579/n6/all/v/all/p/last`. Pelo 6579_metadados.json, a tabela cobre 2001 a 2026, então a recoleta é viável. O problema é pior do que o achado descreve. O der-davi.md manda usar "o dado mais recente cujo ano_referencia <= ano_eleicao" (linhas 402-403). Com apenas 2026 em disco, qt_populacao_estimada fica NULL em todas as eleições de 2016 a 2024. A razão eleitores/população não sai para nenhum ano. O dossie/secoes/dicionario.md, linha 9, só registra "Alinhar anos disponíveis".

(b) CONFIRMADO, com medição no DuckDB (read_csv cp1252, all_varchar, sem ignore_errors) sobre perfil_eleitorado:

| ano | linhas | UFs | municípios | soma | coluna |
|---|---|---|---|---|---|
| 2016 | 4.192.936 | 26 | 5.568 | 144.088.912 | QT_ELEITORES_PERFIL |
| 2018 | 4.181.293 | 28 | 5.741 | – | QT_ELEITORES_PERFIL |
| 2020 | 4.251.764 | 26 | 5.568 | – | QT_ELEITORES_PERFIL |
| 2022 | 129.566 | 1 | 224 | – | QT_ELEITORES (arquivo _PI) |
| 2024 | 253.638 | 1 | 224 | 2.698.764 | QT_ELEITORES (arquivo _PI) |
| 2026 | 291.504 | 1 | 224 | – | QT_ELEITORES (arquivo _PI) |

- A soma de 2024 bate com o fato 5.
- Em origin/pr/4:scripts/coleta_tse.py, linha 107, está `coletar_eleitorado ... manter_uf=UF`, com UF="PI" na linha 19.
- O der-davi.md só cita QT_ELEITORES_PERFIL (linha 301, "SUM QT_ELEITORES_PERFIL", e linha 387).
- O nacional já está em disco. Os zips perfil_eleitorado_2022, 2024 e 2026 contêm perfil_eleitorado_<ano>_BRASIL.csv (listei com zipfile). O que falta é só extrair, não baixar.

Testei a alternativa QT_APTOS proposta no achado, usando o detalhe_votacao_munzona _BRASIL, cargo prefeito, 1º turno, eleição ordinária:
- 2016 nacional: 144.088.912, igual ao perfil.
- PI 2024: 2.698.764, igual ao perfil.
- 2020, no CD_ELEICAO principal: 147.625.765 contra 147.918.483 no perfil. Aparecem 5.567 municípios contra 5.568, provavelmente por causa da eleição adiada de Macapá. A alternativa funciona, mas exige cuidado.

(c) PARCIAL.
- Confirmado: `find dados/raw -iname '*idh*'` não retorna nada e não existe a pasta pnud. A docstring do origin/pr/4:scripts/coleta_pnud.py diz que o arquivo "NÃO tem IDHM por município" e que AGREGACAO só vale BRASIL/UF.
- Confirmado: o 10295 tem 11.140 linhas de dados, 5.570 municípios, ano 2022. Nem o der-davi.md nem o dossie/der.mmd têm entidade ou coluna de renda (grep por 'renda' não acha nada no der.mmd; no der-davi, a Q3 não traz renda).
- Exagerado: o achado cita só a linha 96 do estrategia.md. As linhas 283-285 do mesmo arquivo dizem que na Q3 o eixo é PIB per capita, "com IDHM 2010 só como validação cruzada e a defasagem declarada". Além disso, a pergunta da Q3 pede IDHM explicitamente (der-davi, linha 245). O IDHM do der-davi (ANO_REFERENCIA 1991/2000/2010, com aviso de defasagem nas linhas 399-401) é coerente com a estratégia. O defeito é o dado não ter sido coletado, não a entidade existir.
- O achado não percebeu que o dossie/der.mmd nem tem IDHM. Os dois DERs do PR #4 divergem entre si.

### [media] `pr4-dossie-05` — parcial

- **Arquivo:** docs/dossie/der.mmd; docs/dicionario-dados.md; docs/dossie/secoes/dicionario.md
- **Problema:** O modelo financeiro não sustenta a Q8 (Duda). RECEITA_CAMPANHA e AGENTE_FINANCEIRO não têm doador originário. tp_pessoa não tem coluna de origem nos arquivos. Classificar por número de dígitos põe partidos e comitês (CNPJ, CNAE 9492-8) como empresa. O stg_receita do contrato também não tem doador originário (fato 10).
- **Evidência:** DESCRIBE receitas_candidatos_2024_PI.csv: há NR_CPF_CNPJ_DOADOR e CD_CNAE_DOADOR, e nenhuma coluna de tipo de pessoa. O doador originário fica em outro arquivo, receitas_candidatos_doador_originario_2024_PI.csv (NR_CPF_CNPJ_DOADOR_ORIGINARIO, TP_DOADOR_ORIGINARIO, CD_CNAE_DOADOR_ORIGINARIO, SQ_RECEITA). No layout antigo, o doador originário vem na mesma linha: o cabeçalho de receitas_candidatos_2014_PI.txt tem 'CPF/CNPJ do doador originário', 'Tipo doador originário' e 'Setor econômico do doador originário'. Exemplo da 1ª linha de 2014 PI: doador 20574446000137 com setor 9492800 'Atividades de organizações políticas' e doador originário CPF 39817806391. Fato 8: 50,3% da receita de 2014 (R$2,21 bi) vem de CNPJ com CNAE 9492-8, e R$1,77 bi passaram por partido com empresa como doador originário.
- **Correção:** No PR4 (der.mmd e secoes/dicionario.md):
(1) Adicionar a RECEITA_CAMPANHA a FK id_agente_originario → AGENTE_FINANCEIRO e o atributo tp_doador_originario (F/J). Em 2014/2016 isso vem na mesma linha ('CPF/CNPJ do doador originário', 'Tipo doador originário', 'Setor econômico do doador originário'). Registrar que em 2018+ o originário está em arquivo separado, é 1:N por SQ_RECEITA (depois de filtrar TP_PRESTACAO_CONTAS='Final') e só tem PF. Para a Q8, pode ficar opcional ou nulo a partir de 2018. Se quiserem uma entidade RECEITA_ORIGINARIA 1:N, que seja com essa ressalva.
(2) Documentar no dicionário que doação de empresa na Q8 se identifica por FONTE_RECURSO.ds_origem_receita = 'Recursos de pessoas jurídicas' (doação direta) mais o originário tipo 'J' (doação indireta). CNAE 9492-8 marca organização política. tp_pessoa não é critério de PJ empresarial.
(3) Achado separado para o PR2 (Enrico), com severidade alta: trocar tipo_pessoa por tamanho do documento (sql/01_staging.sql:44-46), que em 2014 classifica R$3,52 bi como PJ contra R$1,30 bi reais, e incluir cpf_cnpj_doador_originario, tp_doador_originario e cd_cnae_doador_originario no stg_receita. O contrato (estrategia.md:187) já está no main e deve ser atualizado lá.
- **Verificação:** Rodei tudo de novo com DuckDB (cp1252, all_varchar, sem ignore_errors). Os scripts estão em C:/Users/eduar/Downloads/rv/cetico05/{a,c,d,e}.py.

O QUE SE CONFIRMA
1) No origin/pr/4:docs/dossie/der.mmd, RECEITA_CAMPANHA tem só {id_receita, sq_candidato, id_agente, id_fonte_recurso, vr_receita} e AGENTE_FINANCEIRO tem só {id_agente, nr_cpf_cnpj, tp_pessoa, cd_cnae}. Não há doador originário. docs/dossie/secoes/dicionario.md:23-25 repete isso sem dizer de onde vem tp_pessoa. docs/dicionario-dados.md (PR4) só documenta CANDIDATURA e não tem seção financeira. `git grep -i originari origin/pr/4` só acha esquemas.md, fontes-de-dados.md, o índice de leiames e notebooks, nunca o DER ou o dicionário.
2) receitas_candidatos_2024_PI.csv tem 60 colunas, entre elas NR_CPF_CNPJ_DOADOR e CD_CNAE_DOADOR, e nenhuma de tipo de pessoa. receitas_candidatos_doador_originario_2024_PI.csv tem 23 colunas: NR_CPF_CNPJ_DOADOR_ORIGINARIO, TP_DOADOR_ORIGINARIO, CD_CNAE_DOADOR_ORIGINARIO e SQ_RECEITA. No cabeçalho de 2014 PI, as colunas 28-31 são 'CPF/CNPJ do doador originário', 'Nome…', 'Tipo doador originário' e 'Setor econômico do doador originário'. Em 2016, são as colunas 31-35. A 1ª linha de 2014 PI é a descrita no achado: doador 20574446000137, CNAE 9492800, originário CPF 39817806391, tipo F.
3) 2014 BRASIL corrigido: 427.489 linhas, R$4.391,6 mi. CNAE 9492800 soma R$2.210 mi (50,3%), o que bate com o fato 8. Doador com 14 dígitos soma cerca de R$3.520 mi, contra R$1.299 mi em 'Recursos de pessoas jurídicas'. Contar dígitos infla a PJ em cerca de 2,7 vezes. Linhas com originário 'J' somam R$1.829 mi, dos quais R$1.811 mi passaram por CNPJ 9492800 (1.170,6 via partido e 658,0 via outros candidatos/comitês). Isso é mais do que a doação direta.

ONDE O ACHADO EXAGERA OU ERRA A ATRIBUIÇÃO
a) 'Não sustenta a Q8' é exagero. FONTE_RECURSO.ds_origem_receita já está no der.mmd, e em 2014 ele vem de 'Tipo receita' (o PR2 faz categoria("Tipo receita") AS ds_origem). Esse campo separa a doação direta de empresa: 'Recursos de pessoas jurídicas' = 40.526 linhas e R$1.299 mi. Só 2.709 dessas linhas (R$12,4 mi) têm CNAE 9492800. O modelo responde a parte direta. O que falta é a parte indireta, via originário.
b) A regra de contar dígitos não está no PR4. Ela está no PR2: sql/01_staging.sql:44-46 (CASE length(documento(x)) WHEN 11 THEN 'PF' WHEN 14 THEN 'PJ') e der-enrico.md:147. O contrato stg_receita (estrategia.md:187) já existe em origin/main e o PR4 não o introduziu.
c) A parte do layout novo na correção (join por SQ_RECEITA) não serve à Q8. TP_DOADOR_ORIGINARIO só tem F ou #NULO: 2018 = 203 F e 0 J; 2022 = 359 F e 0 J; 2024 = 223 F e 0 J (PI). 2016 BRASIL também tem 0 J. Originário empresa só aparece em 2014. Além disso, SQ_RECEITA não é único. Em 2024 PI são 30.862 linhas para 29.372 valores. O arquivo de originário tem 8.605 linhas em 75 SQ_RECEITA, ou seja, é 1:N, e o join exige filtrar TP_PRESTACAO_CONTAS antes.
d) O exemplo da 1ª linha não mostra empresa via partido. O doador é CNPJ de campanha de outro candidato ('ELEICAO 2014 GUSTAVO SOUSA DE NEIVA DEPUTADO ESTADUAL', 'Recursos de outros candidatos/comitês'), e o originário é pessoa física.

A lacuna do originário é real e pesa em 2014 (R$1,83 bi invisíveis). Mas o PR4 não sustenta 'alta' sozinho, porque o erro grave de classificação (dígitos) está no PR2.

### [media] `pr4-dossie-06` — confirmado

- **Arquivo:** docs/dossie/der.mmd; docs/dossie/index.html; docs/dicionario-dados.md
- **Problema:** O index.html diz que o der.mmd 'consolida o rascunho docs/der.md', mas o der.mmd descartou 6 entidades do der.md e não inclui as 4 que o der-davi usa. O dicionário aponta FKs para entidades que não existem no der.mmd. A CANDIDATURA do der.mmd tem 9 atributos contra 18 no dicionário. A POLITICO do der.mmd não tem gênero, embora o dicionário diga que 'os fixos da pessoa (título, nascimento, gênero) ficam em POLITICO'. O próprio TODO lista 'colocar o DER completo' e 'completar dicionário', e a seção 4 (Modelo relacional) está vazia.
- **Evidência:** Entidades do der.md (origin/pr/4) que não estão no der.mmd: CENSO_FAIXA_ETARIA, COLIGACAO, GRAU_INSTRUCAO, IDHM, OCUPACAO, SITUACAO_TOTALIZACAO. Do der-davi também faltam BEM_CANDIDATO, PAGAMENTO_DESPESA, SITUACAO_TOTALIZACAO e IDHM. Os 'Relacionamentos' do dicionário citam COLIGACAO, GRAU_INSTRUCAO, OCUPACAO e SITUACAO_TOTALIZACAO. A CANDIDATURA do der.mmd não tem sigla_uf, nr_turno, sq_coligacao, nr_candidato, nm_urna, cd_situacao_candidatura, cd_ocupacao, cd_estado_civil nem cd_cor_raca, e cd_grau_instrucao/cd_sit_tot_turno aparecem sem FK. O estrategia.md lista CENSO_FAIXA_ETARIA nas entidades da Duda. docs/dossie/secoes/modelo-relacional.md tem só a linha '## 4. Modelo relacional'. O dicionario-dados.md documenta só CANDIDATURA.
- **Correção:** 1) No DER geral, incluir as entidades que alguma pergunta usa:
- SITUACAO_TOTALIZACAO com fl_eleito (Q2, Q3, Q10).
- GRAU_INSTRUCAO (Q4, módulo do Dudu).
- CENSO_FAIXA_ETARIA e FAIXA_ETARIA (Q7, módulo da Duda).
- IDHM (Q3 pede o índice; guardar ano_referencia 1991/2000/2010).
- BEM_CANDIDATO (Q2 do Davi, patrimônio).
- A entidade de doador originário (ver pr4-dossie-05).

2) Ligar por FK os campos cd_grau_instrucao e cd_sit_tot_turno de CANDIDATURA.

3) OCUPACAO, COLIGACAO e PAGAMENTO_DESPESA: nenhuma das 12 perguntas depende delas diretamente. Incluir só se o grupo quiser, e registrar a decisão.

4) Gênero: alinhar POLITICO e dicionário. Ou entra cd_genero em POLITICO, ou sai "gênero" do texto do dicionario-dados.md.

5) Completar CANDIDATURA no der.mmd com os 18 atributos do dicionário, ou tirar do dicionário o que não entrar. No mínimo nr_turno, sigla_uf, nr_candidato e sq_coligacao, se COLIGACAO ficar.

6) Trocar a primeira linha do dicionario-dados.md ("Complementa o der.md") pela referência ao der.mmd, que é o DER oficial do dossiê.

7) Texto "consolida": o secoes/der.md já não o tem. Basta regenerar o index.html com scripts/build_dossie.py, e não editar o HTML à mão. Os dois estão fora de sincronia desde o commit e0e5bd8.

8) Seção 4: o espaço em branco é de propósito no build_dossie.py. Decidir se o modelo relacional vai à mão ou em texto. Se for em texto, mudar o script para usar o corpo do modelo-relacional.md.
- **Verificação:** Reproduzi tudo lendo os arquivos direto do ref origin/pr/4 (repo C:/Users/eduar/Downloads/bdr/analiseCandidatos). Arquivos temporários ficaram em C:/Users/eduar/Downloads/rv/cetico06.

1) Entidades. Extraí os nomes das relações e dos blocos de cada arquivo e comparei com comm:
- der.md menos der.mmd = CENSO_FAIXA_ETARIA, COLIGACAO, GRAU_INSTRUCAO, IDHM, OCUPACAO, SITUACAO_TOTALIZACAO (6).
- der-davi.md menos der.mmd = BEM_CANDIDATO, IDHM, PAGAMENTO_DESPESA, SITUACAO_TOTALIZACAO (4).
- der.mmd menos der.md = COMPARECIMENTO_PERFIL, FEDERACAO.
- Os DERs de módulo também usam o que falta: docs/der-duda.md (working copy) tem CENSO_FAIXA_ETARIA e FAIXA_ETARIA; origin/pr/3:docs/der-modulo-eduardo.md tem GRAU_INSTRUCAO.
- A seção 4.1 do estrategia.md tem 7 correções. Nenhuma manda tirar essas 6 entidades nem cd_genero: só FEDERACAO, cod_tse VARCHAR, SG_UE, e a remoção de vr_despesa_max, nr_idade e cod_ibge_nascimento. A linha 135 do estrategia.md lista CENSO_FAIXA_ETARIA nas entidades da Duda.

2) O texto "consolida". A linha 152 do index.html diz "Ele consolida o rascunho docs/der.md com as correções registradas em docs/estrategia.md, seção 4.1". Confirmado.
- Porém secoes/der.md NÃO tem mais esse texto: o commit e0e5bd8 o removeu de secoes/der.md e deixou no index.html.
- O README do dossiê diz que o index.html é "gerada, não editar direto" (vem de scripts/build_dossie.py), e o script não contém "consolida". Então o index.html está desatualizado em relação às seções.
- Não consegui rodar o build: mistune não está instalado.

3) CANDIDATURA. Contei com awk e grep: 9 atributos no der.mmd contra 18 no dicionario-dados.md. Faltam no der.mmd sq_coligacao, sigla_uf, nr_turno, nr_candidato, nm_urna, cd_situacao_candidatura, cd_ocupacao, cd_estado_civil e cd_cor_raca. Os campos cd_grau_instrucao e cd_sit_tot_turno aparecem sem FK. Confirmado.

4) POLITICO no der.mmd tem id_politico, nr_titulo_eleitoral, nm_completo, dt_nascimento e sg_uf_nascimento, sem gênero. O dicionário diz "os fixos da pessoa (título, nascimento, gênero) ficam em POLITICO". Confirmado.

5) Os Relacionamentos do dicionario-dados.md citam COLIGACAO, GRAU_INSTRUCAO, OCUPACAO, SITUACAO_TOTALIZACAO e UF. O arquivo só tem o cabeçalho "## CANDIDATURA" e começa com "Complementa o der.md", ou seja, foi escrito sobre o der.md e não sobre o der.mmd. Confirmado.

6) O TODO.md tem "modificar der.mmd, colocar o DER completo" e "completar dicionário de dados". O secoes/modelo-relacional.md tem só a linha "## 4. Modelo relacional". Confirmado.

Ressalvas que não derrubam o achado:
(a) A seção 4 vazia é de propósito: o build_dossie.py ignora o corpo do arquivo e grava um div "Espaço em branco para o modelo relacional" (175mm na impressão). É conteúdo que falta, não erro.
(b) O secoes/dicionario.md (seção 5 do dossiê) resume as 23 entidades do der.mmd de forma coerente com ele. Quem diverge é o dicionario-dados.md.
(c) Parte dos cortes tem defesa. COLIGACAO não aparece em nenhuma pergunta no mapa do der.md. O próprio der.md chama o Censo de "reserva" para a Q7. BEM_CANDIDATO e PAGAMENTO_DESPESA o der-davi declara como "propostas (não estão no der.md)".
(d) Mesmo assim, o der.mmd não cobre IDHM (a Q3 pede IDHM), nem GRAU_INSTRUCAO e SITUACAO_TOTALIZACAO/fl_eleito como entidades, que os módulos usam.

A severidade média se mantém: a entrega é 24/09 e o TODO já reconhece o problema como trabalho em andamento.

### [media] `pr4-dossie-07` — confirmado

- **Arquivo:** docs/der-davi.md; docs/dossie/der.mmd; docs/dicionario-dados.md
- **Problema:** Os três documentos do PR divergem nas chaves compartilhadas. MUNICIPIO: PK cod_ibge no der.mmd e CD_MUNICIPIO (TSE) no der-davi. ELEICAO: id_eleicao + ano + dt_eleicao sem turno no der.mmd; CD_ELEICAO PK + NR_TURNO + CD_TIPO_ELEICAO no der-davi; o contrato fala em 'ano + nr_turno'. ELEITORADO_MUNICIPIO: tem cd_faixa_etaria na PK no der.mmd e é o total (CD_MUNICIPIO, ANO_ELEICAO) no der-davi. CANDIDATURA.CD_MUNICIPIO: NOT NULL na Q2 e 'NULL em eleição geral' na Q3 do mesmo arquivo. VOTACAO_CANDIDATO_MUNICIPIO: agregada sem zona no der.mmd, com NR_ZONA na Q2 e com NR_ZONA + CD_ELEICAO na Q3. Os nomes também variam (cod_cargo × CD_CARGO, qt_abstencao × QT_ABSTENCOES).
- **Evidência:** der.mmd: 'MUNICIPIO { int cod_ibge PK / string cod_tse UK }', 'ELEICAO { int id_eleicao PK / int ano / date dt_eleicao }', 'ELEITORADO_MUNICIPIO { int cod_ibge PK, FK / int ano PK / int cd_faixa_etaria PK'. der-davi Q1-Q3: 'VARCHAR(5) CD_MUNICIPIO PK "codigo TSE..." / INTEGER COD_IBGE UK'. Q2: 'MUNICIPIO – CANDIDATURA | 1:N | CD_MUNICIPIO NOT NULL'. Q3: 'VARCHAR(5) CD_MUNICIPIO FK "NULL em eleicao geral"' e 'ELEITORADO_MUNICIPIO { VARCHAR(5) CD_MUNICIPIO PK, FK / INTEGER ANO_ELEICAO PK'. O dicionário (#3) usa id_eleicao como surrogate de CD_ELEICAO.
- **Correção:** Fixar uma única versão no DER geral e corrigir os três arquivos, e também o "Contrato de chaves" do estrategia.md.

(1) MUNICIPIO: PK cod_ibge INTEGER e cod_tse VARCHAR(5) UNIQUE NOT NULL, como no contrato. O join com o TSE usa cod_tse. Documentar que os 181 municípios do exterior (SG_UF='ZZ', 2.353 linhas na votação de 2022) não têm código IBGE e ficam fora das tabelas municipais. A alternativa é PK cod_tse com cod_ibge UNIQUE e aceitando nulo.

(2) ELEICAO: PK cd_eleicao, com os atributos ano, nr_turno, cd_tipo_eleicao e dt_eleicao. A medição mostrou que cada um dos 493 códigos de 2010 a 2024 tem um único par ano/turno/tipo. Há um código por turno, por abrangência (federal e estadual separados em eleição geral: 544 e 546 em 2022) e por eleição suplementar. Com isso nr_turno sai da PK das tabelas de fato que já têm cd_eleicao; no der.mmd, COMPARECIMENTO_MUNICIPIO tem os dois na PK. No estrategia.md, trocar `eleicao.ano + nr_turno` por `eleicao.cd_eleicao`. No dicionário, escolher entre id_eleicao e cd_eleicao e ficar só com um.

(3) Grão: escolher município ou zona para VOTACAO_CANDIDATO_MUNICIPIO e COMPARECIMENTO_MUNICIPIO e usar o mesmo em todos os diagramas. Se for município, a PK (sq_candidato, cd_eleicao, cod_ibge) só vale depois de somar NR_ZONA na carga. Em 2022, 9,38 mi de linhas caem para 8,31 mi.

(4) CANDIDATURA: cod_ibge opcional, com relação o|--o{, porque em eleição geral SG_UE é UF ou BR (0 de 29.322 em 2022). A Q2 pode manter NOT NULL como filtro da análise, não como restrição do modelo.

(5) ELEITORADO_MUNICIPIO: uma única entidade no grão mais fino que alguma pergunta use (com cd_faixa_etaria). O total da Q3 sai por SUM, e não por outra tabela com o mesmo nome e outra PK.

(6) Nomes em snake_case seguindo a convenção do próprio dicionário (prefixo cd_ para código): cd_cargo em vez de cod_cargo, e um só nome para abstenção, qt_abstencao.
- **Verificação:** Li os três arquivos direto do ref com `git -C C:/Users/eduar/Downloads/bdr/analiseCandidatos show origin/pr/4:<arquivo>`. Todas as divergências apontadas aparecem nos arquivos.

1) MUNICIPIO. docs/dossie/der.mmd tem `int cod_ibge PK` e `string cod_tse UK "VARCHAR 5 preserva zero"`. docs/der-davi.md tem `VARCHAR(5) CD_MUNICIPIO PK "codigo TSE; preservar zero a esquerda"` e `INTEGER COD_IBGE UK` nas linhas 43-44 e 279-280, e `CD_MUNICIPIO PK "cod_tse - LPAD 5 zeros"` na linha 145 (Q2). Confirmado.

2) ELEICAO. der.mmd tem `int id_eleicao PK / int ano / date dt_eleicao`, sem turno. der-davi tem `CD_ELEICAO PK` + `NR_TURNO` na Q1 e na Q3, e ainda `CD_TIPO_ELEICAO` na Q2 (linhas 134-137). O "contrato" é a tabela "Contrato de chaves" em docs/estrategia.md, linha 206: `eleicao.ano` + `nr_turno`. Ela está no PR #4 e já existia no main. docs/dicionario-dados.md, linha 44, diz que "`id_eleicao` é surrogate gerado na carga". Confirmado.

3) ELEITORADO_MUNICIPIO. No der.mmd a PK é (cod_ibge, ano, cd_faixa_etaria). No der-davi, linhas 298-302, a PK é (CD_MUNICIPIO, ANO_ELEICAO), com `SUM QT_ELEITORES_PERFIL`. Confirmado. A FK também muda: cod_ibge num, CD_MUNICIPIO noutro.

4) CANDIDATURA.CD_MUNICIPIO. A linha 217 (Q2) diz "`CD_MUNICIPIO` NOT NULL (recorte é eleição municipal)" e a linha 109 diz "Todas as FKs da Q2 são NOT NULL". A linha 330 (Q3) diz `"NULL em eleicao geral"`, com a relação `o|--o{`. A contradição existe no texto, mas o achado cortou a ressalva "(recorte é eleição municipal)". É diferença de escopo entre as perguntas, que vira conflito quando os modelos forem unidos.

5) VOTACAO_CANDIDATO_MUNICIPIO. No der.mmd a PK é (sq_candidato, cod_ibge, nr_turno), e docs/dossie/secoes/dicionario.md, linha 19, diz "zonas agregadas". Na Q2 do der-davi (linha 181) a PK inclui NR_ZONA. Na Q3 (linhas 337-341) a PK inclui CD_ELEICAO e NR_ZONA. Confirmado. Medi em votacao_candidato_munzona_2022_BRASIL.csv: 9.377.845 linhas, 8.314.083 combinações distintas de (SQ_CANDIDATO, NR_TURNO, CD_MUNICIPIO) e 9.377.845 com NR_ZONA. Ou seja, a PK do der.mmd só vale depois de somar as zonas.

6) Nomes. `cod_cargo` (der.mmd e dicionário) contra `CD_CARGO` (der-davi); `qt_abstencao` (der.mmd) contra `QT_ABSTENCOES` (der-davi, linha 352). Confirmado.

Imprecisões menores do achado:
- (a) Ele diz "O dicionário (#3)", mas docs/dicionario-dados.md só existe em origin/pr/4. O `git ls-tree` de origin/pr/3 e de origin/main não o lista.
- (b) Omitiu a ressalva de escopo no item 4.

Medições extras para testar a correção proposta (DuckDB, consulta_cand 2010-2024 _BRASIL, 2.112.244 linhas):
- Há 493 valores distintos de CD_ELEICAO, e nenhum mapeia para mais de um (ANO_ELEICAO, NR_TURNO, CD_TIPO_ELEICAO): 0 linhas na checagem. Então cd_eleicao serve como PK.
- Em eleição geral há dois códigos por turno: 544 e 546 no 1º turno de 2022, 545 e 547 no 2º.
- Em 2022, nenhuma das 29.322 candidaturas tem SG_UE com 5 dígitos municipais.
- O arquivo municipio_tse_ibge.csv tem 5.571 municípios e nenhum com UF ZZ. Já a votação de 2022 tem 181 CD_MUNICIPIO do exterior (SG_UF='ZZ', 2.353 linhas), sem código IBGE.

Scripts em C:/Users/eduar/Downloads/rv/cetico07/q.py e q2.py.

### [media] `pr4-dossie-08` — confirmado

- **Arquivo:** docs/dicionario-dados.md
- **Problema:** O dicionário tem domínios e nulidade que não batem com os dados. cd_situacao_candidatura aparece como '12 Apto, 14 Inapto' e NOT NULL, mas o código de Inapto é 3 e em 2024 e 2026 a coluna vem 100% '-3' (#NE). A convenção de nulos cobre só '#NULO, #NE e -1' e ignora -4 (NÃO DIVULGÁVEL) e -3. Com isso, o título '-4' vira valor de uma UK compartilhada por 579 pessoas e SG_UF_NASCIMENTO 'Não divulgável' não cabe em CHAR(2).
- **Evidência:** SELECT CD_SITUACAO_CANDIDATURA, DS, count(*) (2014+): -3 #NE 484.843; 1 CADASTRADO 57; 12 APTO 1.072.111; 3 INAPTO 69.899. Por ano: 2024 é '-3' em 463.859 de 463.859 e 2026 em 20.984 de 20.984. CD_GENERO, CD_GRAU_INSTRUCAO e CD_ESTADO_CIVIL = -4 'NÃO DIVULGÁVEL' em 579 linhas cada. NR_TITULO_ELEITORAL_CANDIDATO = '-4' em 579 linhas (2016: 109, 2018: 108, 2020: 284, 2022: 29, 2024: 46, 2026: 3). SG_UF_NASCIMENTO 'Não divulgável' em 579 e 'ZZ' em 874. max(length(NM_CANDIDATO)) = 70 em 2018 (o der-davi usa VARCHAR(69)).
- **Correção:** 1) No docs/dicionario-dados.md, linha 54, trocar o domínio de cd_situacao_candidatura para "12 Apto, 3 Inapto, 1 Cadastrado" e mudar a coluna Nulo? para S. Nas observações, anotar "vem -3/#NE em 100% das linhas de 2024 e 2026, inclusive no consulta_cand_complementar (CD_SITUACAO_CANDIDATO_PLEITO, CD_DETALHE_SITUACAO_CAND e CD_SITUACAO_CANDIDATO_URNA também -3). Se precisar de deferido/indeferido nesses anos, usar CD_SITUACAO_JULGAMENTO ou CD_SITUACAO_CANDIDATO_TOT do complementar, onde 2 = DEFERIDO e 14 = INDEFERIDO".

2) Na linha 20, incluir -3 (#NE), -4 (NÃO DIVULGÁVEL) e o texto 'Não divulgável' na regra de conversão para NULL. Acrescentar -4 como valor que vira NULL nos domínios de cd_grau_instrucao, cd_estado_civil e cd_cor_raca, porque cada um tem 579 linhas com -4.

3) No docs/der-davi.md, linha 160, e no docs/dossie/der.mmd, linha 70, trocar a UK do título por "UNIQUE quando válido (12 dígitos)", igual ao que já diz docs/dossie/secoes/dicionario.md. Definir também a regra de carga para os títulos '-4' (579 candidaturas de 2016 a 2026, com CPF também -4): cada uma vira um POLITICO próprio, criado pela SQ_CANDIDATO e com nr_titulo NULL. Sem essa regra, as 579 candidaturas se fundem num único id_politico.

4) No der-davi.md, linha 165, anotar que SG_UF_NASCIMENTO 'Não divulgável' (579 linhas) vira NULL e que 'ZZ' (874 linhas) é exterior.

5) No der-davi.md, linha 162, NM_CANDIDATO só precisa de VARCHAR(70) ou mais (sugestão: VARCHAR(100)) se o modelo incluir eleições gerais, como no DER geral (2018 tem máximo 70). No recorte só municipal (2016/2020/2024), o máximo é 69.
- **Verificação:** Li os arquivos no ref origin/pr/4 e rodei DuckDB por conta própria sobre consulta_cand_<ano>_BRASIL.csv de 2014 a 2026. O arquivo de 2016 tem 2 bytes 0x81, que não existem em cp1252, e por isso quebra o read_csv com encoding='cp1252'. Converti os 7 arquivos para UTF-8 com errors='replace' em C:/Users/eduar/Downloads/rv/cetico08/cand_<ano>.csv; os scripts q1.py a q5.py estão na mesma pasta. Não usei ignore_errors. Contagens por ano: 2014 26.263 | 2016 498.391 | 2018 29.287 | 2020 558.804 | 2022 29.322 | 2024 463.859 | 2026 20.984.

1) docs/dicionario-dados.md, linha 54, diz: "| 13 | `cd_situacao_candidatura` | `INTEGER` | N | ... | `12` Apto, `14` Inapto, …". Nos dados, CD_SITUACAO_CANDIDATURA/DS dá: -3 #NE 484.843; 1 CADASTRADO 57; 12 APTO 1.072.111; 3 INAPTO 69.899. Os números batem exatamente com o achado. Por ano, 2024 tem -3 em 463.859 de 463.859 linhas e 2026 em 20.984 de 20.984. Fui além do achado: de 2002 a 2012 o INAPTO também é 3, e o código 14 não aparece nenhuma vez nessa coluna entre 2002 e 2026. No consulta_cand_complementar de 2024 e 2026, o 14 é 'INDEFERIDO', mas nas colunas CD_SITUACAO_JULGAMENTO e CD_SITUACAO_CANDIDATO_TOT. Essa é a provável origem da confusão.

2) Linha 20 do dicionário: a regra de nulos cita só "#NULO, #NULO#, #NE, #NE# e -1 em código", sem -3 e sem -4. Confirmado.

3) CD_GENERO, CD_GRAU_INSTRUCAO, CD_ESTADO_CIVIL e também CD_COR_RACA valem -4 'NÃO DIVULGÁVEL' em 579 linhas cada. NR_TITULO_ELEITORAL_CANDIDATO='-4' também em 579 linhas: 2016 109, 2018 108, 2020 284, 2022 29, 2024 46, 2026 3. Tirando essas, todo título tem 12 dígitos. SG_UF_NASCIMENTO vale 'Não divulgável' em 579 linhas e 'ZZ' em 874. As 579 linhas têm -4 em todos esses campos ao mesmo tempo. Todos os números batem.

4) max(length(NM_CANDIDATO)) por ano: 2014 62, 2016 65, 2018 70, 2020 65, 2022 60, 2024 69, 2026 60. max(length(NM_URNA)) é 30 em todos os anos, então o VARCHAR(30) do dicionário está certo.

Ressalvas, que não derrubam o achado:
(a) Três itens estão em outro arquivo. A UK do título, o CHAR(2) de SG_UF_NASCIMENTO e o VARCHAR(69) estão em docs/der-davi.md, linhas 160 a 165 ("VARCHAR(12) NR_TITULO_ELEITORAL_CANDIDATO UK", "VARCHAR(69) NM_CANDIDATO", "CHAR(2) SG_UF_NASCIMENTO \"NULL - ZZ exterior\""), e não no dicionario-dados.md, que só detalha CANDIDATURA. O próprio PR se contradiz: docs/dossie/secoes/dicionario.md já diz "único quando válido", mas der-davi.md e docs/dossie/der.mmd (linha 70) põem UK sem ressalva.
(b) Não são "579 pessoas", são 579 candidaturas: 579 SQ_CANDIDATO distintos e 568 nomes distintos, com CPF também -4 e DT_NASCIMENTO nula. O efeito real é pior que uma violação de UK. Como a carga resolve título → id_politico, essas 579 candidaturas de cerca de 568 pessoas diferentes seriam juntadas num único POLITICO.
(c) O VARCHAR(69) basta dentro do recorte municipal do der-davi (2016 65, 2020 65, 2024 69). Ele só falha quando se incluem eleições gerais (2018 = 70), e é o caso do DER geral.
(d) Nenhum PR usa cd_situacao_candidatura em consulta. Procurei com git grep nos PRs 2, 3 e 4, e só o sql/04_politico.sql do PR #2 carrega ds_situacao_candidatura. Por isso o impacto fica no documento e na carga, sem resultado errado nas perguntas hoje. Severidade média é adequada.

### [media] `pr4-dossie-10` — confirmado

- **Arquivo:** docs/dossie/der.mmd
- **Problema:** A PK de COMPARECIMENTO_PERFIL (cod_ibge, ano, cd_faixa_etaria) não tem nr_turno, mas o perfil_comparecimento_abstencao tem uma linha por turno. Somar sem separar o turno dobra o eleitorado das cidades com 2º turno. Isso afeta a Q7 da Duda. O dossiê também não define 'jovem', e as faixas do TSE cortam em 25-29/30-34 (fato 11).
- **Evidência:** perfil_comparecimento_abstencao_2020_PI.csv: NR_TURNO 1 com 128.542 linhas e QT_APTOS 2.456.056; NR_TURNO 2 com 5.240 linhas e QT_APTOS 558.661 (Teresina). Sem o turno, os aptos do PI em 2020 ficam 22,7% maiores. CD_FAIXA_ETARIA 2024: 1600, 1700, 1800, 1900, 2000, 2124, 2529, 3034... e -3 'Inválido'. git grep 'jovem|15 a 29' nos docs do PR só acha o título da Q7 em perguntas.md.
- **Correção:** Colocar `int nr_turno PK` em COMPARECIMENTO_PERFIL no docs/dossie/der.mmd, do mesmo jeito que COMPARECIMENTO_MUNICIPIO já faz. A outra opção seria filtrar NR_TURNO = 1 na carga e documentar isso no dicionario.md. Deixar claro no texto que, sem o turno, a soma dos aptos fica 22,7% maior em 2020 (2º turno só em Teresina) e 100% maior em 2018 e 2022 (2º turno presidencial nos 224 municípios). Também alinhar o docs/dossie/secoes/dicionario.md com o der.mmd: listar as dimensões da PK (cod_ibge, ano, nr_turno, cd_faixa_etaria e as demais dimensões, se houver) em vez de "outras dimensões de perfil". Definir no dicionário jovem = 15-29 anos (Lei 12.852/2013). No TSE isso equivale a CD_FAIXA_ETARIA em {1600, 1700, 1800, 1900, 2000, 2124, 2529}, ou seja, 16-29, já que ninguém vota com 15; o -3 'Inválido' fica de fora. No IBGE são as faixas 15-19, 20-24 e 25-29. Criar uma tabela FAIXA_ETARIA com fl_jovem para mapear as duas fontes, como no der-duda.md. Um ajuste de evidência: o grep exato "jovem|15 a 29" não retorna nada; as ocorrências de "jovens" estão em der.md:379, perguntas.md:11 e estrategia.md:126, e nenhuma delas define a faixa.
- **Verificação:** 1) Arquivo: `git show origin/pr/4:docs/dossie/der.mmd`, linhas 61-67. A entidade é `COMPARECIMENTO_PERFIL { int cod_ibge PK, FK; int ano PK; int cd_faixa_etaria PK; int qt_comparecimento; int qt_abstencao }` e não tem nr_turno. No mesmo arquivo, `COMPARECIMENTO_MUNICIPIO` (linhas 121-130) tem `nr_turno PK`, então o arquivo se contradiz. O der.mmd é novo no PR (`git diff --stat origin/main origin/pr/4`: +178 linhas, commit 975e87e). Tem outra incoerência: `docs/dossie/secoes/dicionario.md:12` diz que a PK é "(cod_ibge, ano, cd_faixa_etaria) e outras dimensões de perfil", com "zonas agregadas", e também não fala de turno.

2) Medi com DuckDB (read_csv cp1252, all_varchar, sem ignore_errors) nos arquivos perfil_comparecimento_abstencao_{ano}_PI.csv. O resultado é NR_TURNO, linhas, soma de QT_APTOS e municípios distintos:
- 2016: só o turno 1 (120.048 linhas; 2.382.701 aptos; 224 municípios).
- 2018: turno 1 com 125.767 linhas e 2.370.894 aptos; turno 2 com 125.767 linhas e 2.370.894 aptos; 224 municípios.
- 2020: turno 1 com 128.542 linhas e 2.456.056 aptos (224 municípios); turno 2 com 5.240 linhas e 558.661 aptos, só em TERESINA (CD 12190), que tem 558.661 aptos nos dois turnos.
- 2022: turno 1 com 129.922 linhas e 2.573.810 aptos; turno 2 com 129.922 linhas e 2.573.810 aptos; 224 municípios.
- 2024: só o turno 1 (253.905 linhas; 2.698.764 aptos).

Somando sem separar o turno, os aptos ficam 22,7% maiores em 2020 (3.014.717 contra 2.456.056), o que reproduz o número do revisor. Em 2018 e 2022 ficam 100% maiores (4.741.788 contra 2.370.894 e 5.147.620 contra 2.573.810), porque o 2º turno presidencial vale para os 224 municípios. O impacto é, portanto, maior que o descrito: o eleitorado dobra no estado inteiro em ano de eleição geral, não só "nas cidades com 2º turno". Verifiquei também que QT_APTOS = QT_COMPARECIMENTO + QT_ABSTENCAO em todas as linhas (0 violações), então não ter qt_aptos na entidade não é um problema.

3) Faixas: CD_FAIXA_ETARIA em 2016, 2020 e 2024 = -3 'Inválido', 1600, 1700, 1800, 1900, 2000, 2124, 2529, 3034, … 9999. Isso confere com o revisor: o corte fica entre 2529 e 3034 e não existe a faixa de 15 anos.

4) Definição de jovem: `git grep -i -E "jovem|15 a 29" origin/pr/4 -- docs/` não retorna nada, porque os textos usam "jovens" e não "jovem". O detalhe do revisor ("só acha o título da Q7") está um pouco impreciso. Um grep mais amplo por "jove" encontra 3 ocorrências: docs/der.md:379, docs/dossie/secoes/perguntas.md:11 e docs/estrategia.md:126, e nenhuma delas dá uma faixa de idade. Os greps por "29 anos|30 anos|16 a 29|18 a 29|12.852|juventude" também não encontram nenhuma definição em docs/, notebooks/ ou scripts/ (fora do esquemas.md). A conclusão se mantém: o PR não define "jovem".

5) Para comparar: o docs/der-duda.md da Duda (working copy) já tem `COMPARECIMENTO_PERFIL.nr_turno PK` (linha 136) e define jovem = 15-29 (Lei 12.852), que no TSE corresponde às faixas 1600..2529 (linhas 216-218). A correção proposta fica alinhada com o DER da Duda.

### [media] `pr4-dossie-12` — parcial

- **Arquivo:** docs/der-davi.md; docs/dossie/der.mmd
- **Problema:** DESPESA_CAMPANHA e TIPO_DESPESA usam colunas que só existem no layout de 2018 em diante. A prestação de 2014 e a de 2016 são .txt no layout antigo, sem SQ_DESPESA, VR_DESPESA_CONTRATADA, TP_PRESTACAO_CONTAS, AA_ELEICAO nem código de tipo. O estrategia.md diz que dinheiro × município vale para 2016, 2020 e 2024, então a Q1 de 2016 não se calcula com o modelo como está. cd_tipo_despesa não existe em nenhum layout: no novo o campo é CD_ORIGEM_DESPESA/DS_ORIGEM_DESPESA e no antigo só o texto 'Tipo despesa'. Os valores vêm com vírgula decimal.
- **Evidência:** Cabeçalho de despesas_candidatos_prestacao_contas_final_2016_PI.txt: 'Cód. Eleição', 'Sequencial Candidato', 'Sigla da UE', ..., 'Valor despesa', 'Tipo despesa', 'Descriçao da despesa'. Não tem SQ_DESPESA, VR_DESPESA_CONTRATADA nem TP_PRESTACAO_CONTAS. O de 2014 também não tem UE. despesas_contratadas_candidatos_2024_PI.csv tem CD_ORIGEM_DESPESA e DS_ORIGEM_DESPESA (ex.: 'Publicidade por adesivos') e não tem CD_TIPO_DESPESA. VR_DESPESA_CONTRATADA = '400,00' e VR_BEM_CANDIDATO = '35000,00'.
- **Correção:** 1) Em der-davi.md (Q1/Q2): trocar a PK SQ_DESPESA por uma surrogate id_despesa, deixando SQ_DESPESA como atributo que pode ser nulo e só existe de 2018 em diante. Renomear VR_DESPESA_CONTRATADA para vr_despesa e documentar a origem: VR_DESPESA_CONTRATADA (2018+) ou "Valor despesa" (2014/2016). Registrar que a regra "TP_PRESTACAO_CONTAS = Final" só vale de 2018 em diante; os .txt de 2014/2016 já são a prestação final (prestacao_contas_final_<ano>). Ou então declarar explicitamente que a Q1 cobre só 2020/2024 e tirar a menção a 2016 em VAGA.
2) Em der.mmd/TIPO_DESPESA: documentar que cd_tipo_despesa = CD_ORIGEM_DESPESA (41 códigos 1:1 com DS_ORIGEM_DESPESA). Para 2014/2016, obter o código por lookup textual de "Tipo despesa" sem o prefixo "Baixa de Estimaveis - " (casa 35/35 em 2016 PI). Esse ponto já vinha do docs/der.md do main, então a correção vale para os dois arquivos.
3) Criar um atributo fl_estimavel (ou equivalente) e decidir na Q1 se as "Baixas de Estimáveis" entram no custo, já que são 46,8% do valor em 2016 PI. Antes de comparar 2016 com 2020/2024, conferir no leiame se VR_DESPESA_CONTRATADA inclui estimáveis.
4) Na carga: CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2)) em todos os layouts, incluindo VR_BEM_CANDIDATO.
5) Consumir stg_despesa do Enrico e pedir que ela exponha cd_origem_despesa e fl_estimavel além de ds_tipo_despesa.
- **Verificação:** Rodei tudo por conta própria, no Python do sistema com DuckDB (read_csv com cp1252, all_varchar, sem ignore_errors), sobre dados/raw/prestacao_contas (arquivos _PI) e sobre os refs git.

1) Cabeçalhos, lidos com head -1 | iconv:
- despesas_candidatos_prestacao_contas_final_2016_PI.txt tem "Cód. Eleição", "Sequencial Candidato", "UF", "Sigla da UE", ..., "Valor despesa", "Tipo despesa", "Descriçao da despesa". Não tem SQ_DESPESA, VR_DESPESA_CONTRATADA, TP_PRESTACAO_CONTAS, AA_ELEICAO nem código de tipo. CONFIRMADO.
- despesas_candidatos_2014_PI.txt tem "UF" mas não tem "Sigla da UE". CONFIRMADO. Isso pesa pouco: 2014 é eleição geral e a UE é a própria UF.
- despesas_contratadas_candidatos_2018/2020/2024_PI.csv têm CD_ORIGEM_DESPESA/DS_ORIGEM_DESPESA (ex.: 20210000 "Encargos financeiros..."), SQ_DESPESA, TP_PRESTACAO_CONTAS e VR_DESPESA_CONTRATADA, e nenhum CD_TIPO_DESPESA. CONFIRMADO.

2) Vírgula decimal. Contei linhas com vírgula e linhas com ponto:
- 2014 PI: 5.313 de 25.391 linhas com vírgula, 0 com ponto.
- 2016 PI: 19.242 de 112.867 com vírgula, 0 com ponto.
- 2024 PI: 86.617 de 86.617 com vírgula.
- bem_candidato_2024_BRASIL VR_BEM_CANDIDATO: 911.109 de 911.109 com vírgula.
CONFIRMADO. Nos layouts antigos os valores inteiros vêm sem vírgula ("1000").

3) O que está nos DERs do PR #4 (git show origin/pr/4:...):
- der-davi.md, Q1 e Q2: DESPESA_CAMPANHA(SQ_DESPESA PK, SQ_CANDIDATO FK, VR_DESPESA_CONTRATADA), com a regra "filtrar TP_PRESTACAO_CONTAS = Final". São colunas que só existem de 2018 em diante.
- A linha 88 do der-davi.md diz "Em 2016 o campo bruto é QT_VAGAS", ou seja, a Q1 pretende cobrir 2016. estrategia.md:279-281 diz que dinheiro × município vale para 2016, 2020 e 2024. Para der-davi.md, o achado procede.

4) Onde o achado exagera:
- dossie/der.mmd usa id_despesa (chave surrogate), vr_despesa e ds_despesa, que são genéricos e servem aos dois layouts. Ali o único problema real é cd_tipo_despesa.
- TIPO_DESPESA/cd_tipo_despesa não foi criado pelo PR #4. Já está em origin/main:docs/der.md, linhas 257-259 e 276. O diff origin/main...origin/pr/4 mostra que der.mmd só copiou.
- "Q1 de 2016 não se calcula" é forte demais. "Sequencial Candidato" e "Sigla da UE" estão 100% preenchidos em 2016 (0 nulos), então a soma sai com PK surrogate e mapeamento de colunas. O que falha é o modelo como está escrito em der-davi.md, não o dado.
- estrategia.md:186-195 já reconhece os dois layouts e delega o mapeamento a stg_despesa(..., vr_despesa, ..., ds_tipo_despesa).
- A frase "cd_tipo_despesa não existe em nenhum layout" é literalmente verdadeira, mas CD_ORIGEM_DESPESA faz esse papel. Em 2020+2024 PI há 41 pares cd/ds, numa relação 1:1.

5) Medi duas coisas que o achado não cita:
- De-para dos tipos: tirando o prefixo "Baixa de Estimaveis - ", os 35 tipos distintos de 2016 PI batem 100% com DS_ORIGEM_DESPESA de 2020/2024, sem nenhuma linha sobrando. O de-para é trivial por texto.
- Estimáveis: em 2016 PI, 37.002 das 112.867 linhas são "Baixa de Estimaveis", somando R$ 36,46 mi de R$ 77,90 mi (46,8% do valor). São doações em espécie estimadas, e isso afeta diretamente o "custo da cadeira".
- Não verifiquei se VR_DESPESA_CONTRATADA de 2018+ inclui estimáveis. Isso depende do leiame, que não li.

### [baixa] `pr4-dossie-09` — parcial

- **Arquivo:** docs/dicionario-dados.md
- **Problema:** FEDERACAO tem PK nr_federacao, mas o TSE renumerou as federações entre 2022 e 2024. Além disso, o dicionário diz que nr_federacao é 'Sempre nulo antes de 2022', mas o arquivo de 2020 tem 79 candidaturas com federação (eleições suplementares de 2022-2023 gravadas no arquivo de 2020, fato 4). A mesma PK aparece em der.mmd e secoes/dicionario.md.
- **Evidência:** SELECT ANO_ELEICAO, NR_FEDERACAO, SG_FEDERACAO, count(*) WHERE NR_FEDERACAO<>'-1'. PSDB/CIDADANIA = 1 em 2020 (37) e 2022 (1.481), e 100 em 2024 (27.151) e 2026. Brasil da Esperança = 2 em 2020/2022 (1.659) e 101 em 2024 (38.166). PSOL/REDE = 3 em 2022 (1.421) e 102 em 2024 (8.451). O formato de SG_FEDERACAO também muda ('PT/PC do B/PV' e '13-PT/65-PC do B/43-PV'). As 79 linhas de 2020 são todas CD_TIPO_ELEICAO=1 (ex.: CD_ELEICAO 622 'Suplementar Dom Expedito Lopes-PI').
- **Correção:** 1) Manter nr_federacao como PK de FEDERACAO, ou trocar por um surrogate id_federacao. A PK atual é única nos dados, então não precisa virar (ano, nr_federacao) por causa de unicidade. Para as séries, criar um identificador estável: uma coluna id_federacao_canonica em FEDERACAO, ou uma tabela de-para FEDERACAO_EQUIVALENCIA com 3 linhas (1→100 PSDB/CIDADANIA, 2→101 Brasil da Esperança, 3→102 PSOL/REDE), definida por nome normalizado ou pela composição de partidos (PARTIDO_FEDERACAO do PR #3). A Q5 (Dudu) deve agrupar pela chave canônica quando comparar 2022 com 2024/2026. 2) Na carga de FEDERACAO, deduplicar por nr_federacao e normalizar NM_FEDERACAO com upper()/trim (ou escolher uma grafia por nr), porque o mesmo nr tem duas grafias que diferem só na caixa. 3) Trocar a nota do dicionário por: "-1 → NULL. Nulo em todas as eleições ordinárias anteriores a 2022. Arquivos de anos anteriores trazem eleições suplementares realizadas depois de 30/10/2022 com federação preenchida (79 linhas no arquivo de 2020). A numeração mudou na eleição de 2024: 1/2/3 viraram 100/101/102, e o arquivo de 2022 já contém 101/102 de suplementar de 2026." 4) Aplicar a mesma observação em docs/dossie/der.mmd e docs/dossie/secoes/dicionario.md.
- **Verificação:** Arquivos lidos no ref origin/pr/4: docs/dicionario-dados.md:48 diz "`nr_federacao` ... FK → `FEDERACAO.nr_federacao` ... `-1` → `NULL`. Sempre nulo antes de 2022."; docs/dossie/der.mmd:89-92 tem `FEDERACAO { int nr_federacao PK ... }`; docs/dossie/secoes/dicionario.md:17 diz "`nr_federacao` (PK no recorte adotado)". A tabela FEDERACAO não tem seção própria em dicionario-dados.md, só aparece como FK.

Scripts em C:/Users/eduar/Downloads/rv/cetico09/fed.py, fed2.py e fed3.py (DuckDB, cp1252, all_varchar, sem ignore_errors), rodados sobre consulta_cand_<ano>_BRASIL.csv de 2002 a 2026.

O que se reproduziu (todos os números do achado batem):
- 2020: 37 linhas com PSDB/CIDADANIA=1 (9 grafadas "CIDADANIA" + 28 "Cidadania"), 39 com nr=2 e 3 com nr=3, total 79. O arquivo tem 558.804 linhas e 558.725 têm -1. As 79 são todas CD_TIPO_ELEICAO=1 (ELEIÇÃO SUPLEMENTAR), com datas entre 30/10/2022 e 09/06/2024 (ex.: CD_ELEICAO 622 "Suplementar Dom Expedito Lopes-PI", 03/03/2024). Todas têm ANO_ELEICAO='2020', então "sempre nulo antes de 2022" é falso ao pé da letra.
- 2022: nr 1 = 1.481, nr 2 = 1.659, nr 3 = 1.421.
- 2024: nr 100 = 27.151 (27.140 + 11), nr 101 = 38.166 (38.132 + 34), nr 102 = 8.451 (8.446 + 5). Aparecem ainda 103 e 104.
- 2026: de 100 a 104.
- SG muda de formato: 'PT/PC do B/PV' vira '13-PT/65-PC do B/43-PV'.
- 2014, 2016 e 2018: 100% das linhas com -1. De 2002 a 2012 a coluna não existe.
- votacao_partido_munzona repete a troca: em 2022 há 1, 2, 3 (e 101 em 16 linhas); em 2024 há 100, 101, 102, 104. Então a Q5 é mesmo afetada.

O que NÃO se sustenta:
(1) "Chave errada / PK violada". Nos anos 2020-2026 somados há só 8 valores distintos de NR_FEDERACAO. Nenhum número foi reaproveitado para outra federação: cada nr tem 1 único SG e 1 único upper(NM). É diferente do NR_PARTIDO (fato 3). A PK nr_federacao continua única. O problema real é de identidade no tempo: a mesma federação tem duas chaves (PSDB/CIDADANIA 1 e 100; Brasil da Esperança 2 e 101; PSOL/REDE 3 e 102), e as séries quebram.
(2) A correção principal proposta, PK (ano, nr_federacao), não resolve isso. Ela continua separando 1 de 100 e ainda fragmenta por ano. Além disso, a numeração acompanha a data da eleição, não o ANO_ELEICAO do arquivo: suplementares de até 09/06/2024 no arquivo de 2020 ainda usam 1 e 2 (Bertópolis, CD 630), e o arquivo de 2022 já traz 101 (3 linhas) e 102 (1 linha) da "Eleição Suplementar Governador 2026" (CD_ELEICAO 6278, 21/06/2026). Com isso, o ano=2022 mistura as duas numerações. O achado não percebeu isso.

Achado extra (risco de carga): NM_FEDERACAO varia só na caixa dentro do mesmo nr. Os nr 1, 2, 100, 101 e 102 têm 2 grafias cada, o que dá 13 tuplas distintas (nr, sg, nm) para 8 chaves. Um INSERT com SELECT DISTINCT nr, sg, nm viola a PK, tanto nr_federacao quanto (ano, nr), porque em 2024 o nr 100 tem as duas grafias no mesmo ano.

Severidade rebaixada: não há violação de integridade. O efeito se limita a 3 federações na série 2022 para 2024+, e a nota do dicionário erra em 79 linhas suplementares de 558.804 (0,014%).

### [baixa] `pr4-dossie-11` — parcial

- **Arquivo:** docs/der-davi.md
- **Problema:** A Q2 do der-davi se chama 'taxa de sucesso × patrimônio declarado' e é modelada com BEM_CANDIDATO. O estrategia.md define a Q2 como 'despesa por candidatura × CD_SIT_TOT_TURNO', e a seção 2 do dossiê diz 'Gastar mais aumenta a taxa de sucesso?'. São perguntas diferentes (patrimônio ≠ gasto).
- **Evidência:** der-davi.md:106 '## Q2 — taxa de sucesso × patrimônio declarado'. estrategia.md:81 '| **Q2** taxa de sucesso × $$ | despesa por candidatura × `CD_SIT_TOT_TURNO` |'. secoes/perguntas.md: '| Q2 | Gastar mais aumenta a taxa de sucesso? | Relação entre gasto por candidatura e proporção de eleitos'.
- **Correção:** O que diverge é o título e o escopo, não a modelagem. A Q2 do der-davi.md já tem DESPESA_CAMPANHA ligada a CANDIDATURA, que carrega CD_SIT_TOT_TURNO, então a pergunta do estrategia.md/perguntas.md ('gasto × sucesso') já pode ser respondida por esse diagrama.

O Davi precisa escolher uma de duas opções:
(a) Se a Q2 é só gasto: renomear o título em der-davi.md:106 para 'taxa de sucesso × despesa por candidatura' e tirar BEM_CANDIDATO e o 'declara' do diagrama da Q2. RECEITA_CAMPANHA também sai, se não for usada.
(b) Se patrimônio entra como segunda variável: renomear para 'taxa de sucesso × gasto e patrimônio', atualizar perguntas.md:6 e index.html:84-87 (a coluna de fontes passa a incluir 'bens do candidato'), além de estrategia.md:81. Também é preciso acrescentar BEM_CANDIDATO (PK SQ_CANDIDATO + NR_ORDEM_BEM_CANDIDATO) ao docs/dossie/der.mmd, ao der.md e ao dicionario-dados.md. Hoje essa entidade não aparece em nenhum deles, e ficaria de fora do DER geral. Registrar também que bem_candidato só foi coletado de 2016 a 2026, então a análise de patrimônio não cobre 2014 nem os anos anteriores.
- **Verificação:** Li os arquivos direto do ref com `git -C C:/Users/eduar/Downloads/bdr/analiseCandidatos show origin/pr/4:<arquivo>`.

O que se reproduziu:
(1) docs/der-davi.md:106 diz exatamente '## Q2 — taxa de sucesso × patrimônio declarado'.
(2) docs/estrategia.md:81 diz exatamente '| **Q2** taxa de sucesso × $$ | despesa por candidatura × `CD_SIT_TOT_TURNO` |'. A mesma linha já está em origin/main.
(3) docs/dossie/secoes/perguntas.md:6 diz 'Gastar mais aumenta a taxa de sucesso? | Relação entre gasto por candidatura e proporção de eleitos...'. As fontes listadas ali são 'Despesas, candidaturas, situação de totalização', sem bens. O docs/dossie/index.html:84-87 repete o mesmo texto.
(4) A correção diz que bens só foi baixado de 2016 em diante, e isso confere: scripts/coleta_tse.py só coleta 'bens_candidato' dentro de CANDIDATOS, que usa ANOS (2016+). Na pasta dados/raw/candidatos, bens_candidato_<ano> existe apenas de 2016 a 2026.

O que está exagerado ou incompleto:
- O achado dá a entender que a Q2 do der-davi troca gasto por patrimônio. Não troca. O diagrama da Q2 (der-davi.md:127-131 e 185-208) modela BEM_CANDIDATO e também DESPESA_CAMPANHA (VR_DESPESA_CONTRATADA), RECEITA_CAMPANHA e PAGAMENTO_DESPESA, e liga tudo a CANDIDATURA, que tem CD_SIT_TOT_TURNO. Ou seja, a variável 'gasto' que o estrategia.md e o perguntas.md pedem já está no modelo. O que diverge é o título e o escopo: o título fala só de patrimônio, o diagrama traz patrimônio, gasto e receita, e o perguntas.md/estrategia.md falam só de gasto.

Ponto adicional relevante para o DER geral:
- BEM_CANDIDATO só existe no der-davi.md. Uma contagem com `grep -ciE 'BEM_CAND|bem_candidato'` deu 0 em docs/der.md, docs/dossie/der.mmd, docs/dicionario-dados.md e docs/dossie/secoes/dicionario.md. O próprio der-davi.md:109-110 admite isso: 'BEM_CANDIDATO e PAGAMENTO_DESPESA são entidades propostas (não estão no der.md do repositório)'.
- Os commits que alteram der-davi.md e perguntas.md nesse intervalo são de SoaresDavidson (b42d8cd, 975e87e, f5d76d3).

### [baixa] `pr4-dossie-13` — não verificado (baixa)

- **Arquivo:** docs/dicionario-dados.md
- **Problema:** O dicionário diz que vr_despesa_max_campanha e nr_idade_data_posse 'existiam só no leiaute ≤2010, não nos anos da base'. Na verdade existem em 2002-2012 e em 2016, que está na base como marco zero da Q8. Faltam só em 2014 e de 2018 em diante (fato 9). A coluna de e-mail também se chama NM_EMAIL (e não DS_EMAIL) em 2002-2012 e 2016.
- **Evidência:** Presença da coluna por ano (DESCRIBE): NR_IDADE_DATA_POSSE e VR_DESPESA_MAX_CAMPANHA em [2002, 2004, 2006, 2008, 2010, 2012, 2016]. DS_EMAIL em [2014, 2018, 2020, 2022, 2024, 2026]. Número de colunas: 2002-2012 = 63, 2014 = 50, 2016 = 75, 2018-2026 = 50.
- **Correção:** Corrigir o texto para 'existem em 2002-2012 e 2016; ausentes em 2014 e 2018+'. Ainda assim, faz sentido tirá-los do modelo, porque não cobrem a série. Citar NM_EMAIL/DS_EMAIL. O item 4 da seção 4.1 do estrategia.md tem o mesmo erro.

### [baixa] `pr4-dossie-14` — não verificado (baixa)

- **Arquivo:** docs/dicionario-dados.md; docs/der-davi.md
- **Problema:** O dicionário trata nascimento, gênero e UF de nascimento como 'fixos da pessoa' em POLITICO, mas o mesmo título tem valores divergentes entre eleições. Falta a regra de escolha. O der-davi dá regra só para o nome ('da eleição mais recente'). Isso afeta a idade usada na Q7.
- **Evidência:** Por NR_TITULO_ELEITORAL_CANDIDATO válido (12 dígitos), 2014+: 1.181.123 títulos. Destes, 6.796 têm mais de uma DT_NASCIMENTO, 428 mais de um CD_GENERO e 9.936 mais de uma SG_UF_NASCIMENTO.
- **Correção:** Documentar a regra (valor da candidatura mais recente, ou moda) e manter os valores observados na CANDIDATURA quando divergirem, ou então calcular a idade a partir da própria linha da candidatura.

### [baixa] `pr4-dossie-15` — não verificado (baixa)

- **Arquivo:** docs/der-davi.md
- **Problema:** Três detalhes da Q1/Q3. (a) O join CANDIDATURA→VAGA por CD_ELEICAO falha para as linhas de 2º turno: a VAGA só tem o CD_ELEICAO do 1º turno. (b) O filtro 'CD_TIPO_ELEICAO = 2 (ordinaria)' exclui 2006 inteiro, onde a ordinária é 0. (c) 'Isentos' usa QT_VOTOS_NULOS, que exclui os nulos técnicos (existe QT_TOTAL_VOTOS_NULOS).
- **Evidência:** consulta_vagas_2024: a eleição ordinária tem 1 CD_ELEICAO (619), e as candidaturas de 2º turno têm 620. Em 2020 há dois ordinários (426 e 445). consulta_cand 2006: CD_TIPO_ELEICAO='0' 'ORDINÁRIA' em 19.303 de 19.303 linhas. detalhe_votacao prefeito 1º turno 2020: QT_VOTOS_NULOS 7.090.079 contra QT_TOTAL_VOTOS_NULOS 7.286.825 (nulos técnicos 196.746); em 2024, 5.201.660 contra 5.339.487.
- **Correção:** Juntar VAGA pela disputa (ano, SG_UE, CD_CARGO) usando a linha de 1º turno, ou pelo CD_ELEICAO do 1º turno. Filtrar ordinária com CD_TIPO_ELEICAO IN (0, 2) ou pelo nome. Decidir e documentar se 'isentos' usa QT_TOTAL_VOTOS_NULOS.

### [baixa] `pr4-dossie-16` — não verificado (baixa)

- **Arquivo:** docs/dossie/der.mmd
- **Problema:** Nas eleições gerais há votos e comparecimento em 'municípios' do exterior (SG_UF='ZZ') que não constam da ponte TSE-IBGE. Com FK cod_ibge em VOTACAO_CANDIDATO_MUNICIPIO e COMPARECIMENTO_MUNICIPIO, esses votos (Presidente 2018/2022) são rejeitados ou somem em silêncio.
- **Evidência:** detalhe_votacao_munzona_2022_BRASIL.csv tem 5.751 CD_MUNICIPIO distintos. Destes, 181 não têm par na municipio_tse_ibge.csv (que tem 5.571 linhas), e os 181 têm SG_UF='ZZ'. Em 2018 são 5.741 CD_MUNICIPIO distintos.
- **Correção:** Guardar o código TSE (cod_tse) como chave territorial nas tabelas de fato, com cod_ibge opcional, ou criar linhas de exterior em MUNICIPIO com cod_ibge nulo, e documentar a regra.

### [baixa] `pr4-dossie-17` — não verificado (baixa)

- **Arquivo:** docs/dossie/der.mmd
- **Problema:** PROPOSTA_GOVERNO tem PK sq_candidato e url_pdf único (relação 1:0..1), mas em 2024 há candidatos com mais de um PDF (_01, _02). Em 2016 e 2020 o nome do arquivo não tem sufixo.
- **Evidência:** find proposta_governo/2024 -iname '*.pdf' ! -iname 'leiame*': 503 PDFs. Agrupando pelo nome sem '_NN.pdf', 6 candidatos têm mais de um arquivo. Em 2016, 561 PDFs e 0 repetidos (ex.: 2016PI180000000504.pdf). Em 2020, 527 PDFs e 0 repetidos.
- **Correção:** Criar ARQUIVO_PROPOSTA (ano, sq_candidato, nr_arquivo, url_pdf), ou declarar que os PDFs são concatenados em tx_conteudo. Pôr o ano na chave (ver pr4-dossie-01).

### [baixa] `pr4-dossie-18` — não verificado (baixa)

- **Arquivo:** docs/TODO.md; docs/dossie/secoes/perguntas.md
- **Problema:** Sobre o parágrafo que o TODO pede para conferir: as partes da Q3 e da Q7 estão corretas. A frase 'Q8 depende de conciliar leiautes antigos e recentes' é imprecisa: 2014 e 2016 usam o MESMO layout antigo (.txt) e só 2018+ é CSV novo. Além disso, a Q8 ('2002–2014') só tem prestação de 2014 baixada.
- **Evidência:** Comparação de cabeçalhos: receitas 2016 tem a mais apenas 'Sigla da UE', 'Nome da UE' e 'CPF do vice/suplente'; 2014 não tem nenhuma coluna ausente em 2016. As pastas de dados/raw/prestacao_contas são 2014, 2016, 2018, 2020, 2022, 2024 e 2026 (nada de 2002-2012). A parte da Q3 foi confirmada pelo SG_UE='PI' nas despesas de 2018/2022.
- **Correção:** Reescrever como: 'Q8 usa o layout antigo (2014, com 2016 como marco zero, praticamente iguais); o layout novo só entra se a comparação se estender a 2018+'. Declarar que o período efetivo é 2014.

### [baixa] `pr4-dossie-19` — não verificado (baixa)

- **Arquivo:** docs/dossie/secoes/introducao.md; docs/dossie/README.md; docs/TODO.md
- **Problema:** O texto do dossiê não bate com o que existe. A introdução cita 'idade (9514/9606)', mas a 9514 não foi coletada e a 9606 só tem 2022, embora o fontes-de-dados.md prometa 2010 e 2022. A renda (10295) e os anos de estudo (10062) foram coletados e não são citados. As malhas seriam 'do Piauí e do país', mas só existe malha_municipios_PI.geojson. O README usa o prefixo 'rtk', uma ferramenta pessoal que não está no repositório, e fala em carregar 'o DER e o CSV', embora o CSV não seja mais usado. O TODO marca como feita a seção 'Documentos utilizados', que não existe no index.html.
- **Evidência:** ls ibge/sidra: 10061, 10062, 10295, 6579 e 9606 (sem 9514). 9606_populacao_idade_municipios.json tem 116.970 linhas, todas de 2022 (coleta com p/last). Em territorio/ só há malha_municipios_PI.geojson. README: 'rtk proxy python -m http.server ...' e 'rtk uv run python scripts/build_dossie.py'. grep -c 'Documentos utilizados' index.html = 0. grep 'describe-candidatos' index.html não retorna nada.
- **Correção:** Ajustar a tabela de fontes (6579, 9606 só 2022, 10061, 10062, 10295; malha do PI). Tirar 'rtk' e a menção ao CSV do README. No TODO, apontar que a seção de documentos virou a seção 7 'Fontes'.


## PR #4 (Davi) — engenharia: scripts, notebooks, repositório

Revisei a engenharia do PR #4 (origin/pr/4, e0e5bd8). Extraí o PR em C:/Users/eduar/Downloads/rv/pr4 e rodei scripts/build_dossie.py num venv isolado com mistune 3.3.4 fixado por hash do uv.lock. Servi o dossiê e renderizei no Edge headless. Executei as células dos 15 notebooks de notebooks/visualizar contra dados/raw local. Rodei o inspecionar_esquemas.py do PR sobre a extração que o coleta_tse.py produz. Comparei os blocos de docs/esquemas.md entre main e PR, e medi tamanhos, hashes e comprimento de caminho direto no git. O dossiê HTML funciona. Os problemas estão em quatro frentes: (1) o esquemas.md regenerado não se reproduz com os scripts commitados, perdeu 9 blocos em relação ao main, e o inspetor descarta em silêncio famílias e anos que só existem por UF (eleitorado 2022-2026 e abstenção, que a Q7 da Duda usa); (2) a troca para extração nacional não migra quem já extraiu o PI; (3) 10 dos 15 notebooks de visualização falham ou leem arquivos vazios, e um deles sobrescreve o candidatos.parquet do script; (4) higiene do repositório: 141 PDFs, dos quais só 42 são distintos, um PDF de saída desatualizado, e caminhos de 139 caracteres que quebram o checkout quando o caminho-base passa de uns 120 caracteres. Observação: o patch de coleta (206f969) é idêntico ao 839cdb4 que já está no main (conferido com git range-diff). Por isso os achados de código de coleta e inspeção estão marcados como 'main'.

**Conferido e correto:**

- build_dossie.py roda: gerou index.html com 32.256 caracteres e 7 seções. O resultado é idêntico ao docs/dossie/index.html commitado, exceto por um parágrafo da seção DER (ver achado pr4-eng-10).
- O dossiê servido por http.server funciona: no Edge headless o status mostra 'DER renderizado a partir de docs/dossie/der.mmd', há 23 entidades renderizadas (as mesmas 23 definidas em der.mmd) e nenhum erro de sintaxe do Mermaid. A lista de leia-mes mostra '141 de 141 PDF(s)' e os 141 links de leiames/indice.md resolvem (0 inexistentes, relativos a leiames/).
- mermaid.min.js vendorizado é a versão 10.9.5 (3.338.725 B no git), com avisos de licença (@license MIT/DOMPurify). O index.html não carrega nada externo: só mermaid.min.js, logo-ufpi.webp, der.mmd e leiames/indice.md, então funciona offline.
- O merge do PR #4 no main é limpo (git merge-tree --write-tree origin/main origin/pr/4 retornou 0). Em scripts/, a única diferença do PR para o main é build_dossie.py.
- eh_nacional classifica corretamente os nomes reais de todos os zips locais: 111 _BRASIL, 10 _brasil, 20 sem recorte e municipio_tse_ibge contam como nacionais; 3.190 arquivos por UF e 8 _sup ficam de fora. filtrar_uf(nomes,'BRASIL') extrai só _BRASIL/_brasil e deixa o _BR de fora, então a extração não duplica.
- Os números de notebooks/hipotese_titulo_eleitoral.ipynb se reproduzem com os dados locais (arquivos de 20/09/2026): 7.972 títulos comuns, 1.227 só com diferença de acento e 39 com nascimento diferente, todos iguais. nome_igual dá 6.507 no notebook e 6.508 aqui; nome_diferente dá 238 e 237 (diferença de versão do arquivo do TSE). O resultado sustenta o fato 1 (título como chave da pessoa).
- Os blocos consulta_cand do esquemas.md do PR batem com o fato 9: 2002-2012 com 63 colunas, 2016 com 75, 2014-2026 com 50, núcleo comum de 45.
- docs/dossie/describe-candidatos.csv é coerente: 77 linhas = as 76 colunas da união de consulta_cand + 'filename'. Ficou redundante com o esquemas.md e a página não usa mais, como o próprio README diz.
- A nova tabela de volume do estrategia.md bate com a medição: 2024 tem 11,62 GB descompactados (10,8 GiB) e o _BRASIL tem 5,86 GB (5,46 GiB), contra os '10,8 GB / 5,5 GB' do texto.

**Achados:**

### [media] `pr4-eng-01` — confirmado

- **Arquivo:** scripts/inspecionar_esquemas.py
- **Problema:** Com o filtro 'só nacional', o inspetor descarta famílias e anos que só existem por UF. O controle vistas - lidas é por família, não por (família, ano). Por isso perfil_eleitorado 2022-2026 e eleitorado_local_votacao 2026 somem sem nenhum aviso, e perfil_comparecimento_abstencao some inteiro com aviso só no stdout, nada no documento. O coleta_tse.py extrai eleitorado e abstenção com manter_uf=UF (PI), então essa é a situação normal de qualquer integrante. O esquema de 2022-2026 é diferente (AA_ELEICAO, QT_ELEITORES, sem TP_OBRIGATORIEDADE_VOTO), e é dele que sai o QT_APTOS da Q7.
- **Evidência:** Rodei o inspecionar_esquemas.py do PR (C:/Users/eduar/Downloads/rv/insp, dados/raw apontando para o eleitorado/abstencao local extraído em PI). Saída: 'sem arquivo nacional, fora do documento: perfil_comparecimento_abstencao'. Blocos gerados: só 'perfil_eleitorado (2016–2020)', 'perfil_eleitorado (2018)' e 'eleitorado_local_votacao (2016–2024)'. Os blocos 'perfil_eleitorado (2022–2026)' (27 colunas) e 'perfil_comparecimento_abstencao (2016–2024)' não aparecem, e o 2026 do local_votacao sumiu sem aviso. A simulação com filtrar_uf+eh_nacional sobre todos os zips (pr4eng/sim.py) confirma: perfil_eleitorado PERDIDOS=['2022','2024','2026'] (SEM AVISO), eleitorado_local_votacao PERDIDOS=['2026'] (SEM AVISO).
- **Correção:** No scripts/inspecionar_esquemas.py:
(1) Controlar por (família, ano), não só por família. O ano sai de `_ANO_UF.findall`.
(2) Quando um (família, ano) não tiver arquivo nacional extraído, usar um representante, nesta ordem de preferência:
   (a) o cabeçalho do `_BRASIL` lido direto do .zip ao lado, com zipfile.open e só a primeira linha. É barato e não depende de qual UF foi extraída.
   (b) o arquivo de UF extraído (hoje o `_PI`). O cabeçalho é idêntico, conferido nos 5 anos de comparecimento, em perfil_eleitorado 2022/2026 e em local_votacao 2026.
   Nos dois casos, marcar no bloco "fonte: recorte PI; exemplo/contagem só do PI".
(3) Escrever no próprio esquemas.md uma seção "Não documentado" com família, ano e motivo, em vez de só dar print.
(4) Como segurança, avisar ou abortar se uma família presente no esquemas.md atual sumir na regeneração.
Enquanto isso não for corrigido, ninguém com a coleta padrão (eleitorado e abstenção com manter_uf=PI) deve commitar um esquemas.md regenerado, porque ele apagaria os blocos de perfil_comparecimento_abstencao e perfil_eleitorado 2022–2026 que hoje estão no main e no PR #4. Outra opção é alinhar o coleta_tse.py com o que o Davi tem localmente, documentando que o esquemas.md do PR #4 foi gerado com `_BRASIL` de eleitorado e abstenção.
- **Verificação:** 1) O código, em `git show origin/main:scripts/inspecionar_esquemas.py` (o PR #4 não muda o arquivo, `git diff origin/main origin/pr/4 -- scripts/inspecionar_esquemas.py` sai vazio). Os conjuntos `vistas`/`lidas` guardam só `familia(arq)`, sem ano, e o único aviso é um `print`: `if fora := sorted(vistas - lidas): print(f"  sem arquivo nacional, fora do documento: ...")`. O filtro chegou no commit 839cdb4 (Davi, "fix(coleta): usa arquivos nacionais"), que não regenerou o docs/esquemas.md.

2) A coleta, em `git show origin/main:scripts/coleta_tse.py`. Linha 107: `_coletar_tema("eleitorado", ELEITORADO, force, manter_uf=UF)`. Linha 128: `_coletar_tema("abstencao", ABSTENCAO, force, manter_uf=UF)`, com UF = "PI". O PR #4 não muda isso.

3) O que há dentro dos zips (Python/zipfile). perfil_eleitorado de 2016, 2018 e 2020 é um arquivo único sem recorte, que `eh_nacional` trata como nacional. Os de 2022, 2024 e 2026 têm 27 a 29 arquivos por UF mais `_BRASIL`. Com o filtro, só o `_PI.csv` é extraído. eleitorado_local_votacao é arquivo único de 2016 a 2024; o de 2026 vem por UF (só `_PI` extraído). comparecimento_abstencao vem por UF em todos os anos (só `_PI`).

4) Rodei o script do main de forma independente em C:/Users/eduar/Downloads/rv/cet-eng01, com junctions para eleitorado/ e abstencao/ reais. As junctions já foram removidas. Saída: `sem arquivo nacional, fora do documento: perfil_comparecimento_abstencao`. O esquemas.md gerado tem só 3 blocos: `perfil_eleitorado (2016–2020)` com 28 colunas, `perfil_eleitorado (2018)` com 21 e `eleitorado_local_votacao (2016–2024)`. A busca por comparecimento, 2026 ou "não documentado" dá 0 ocorrências. O bloco de perfil_eleitorado 2022–2026 e o ano de 2026 do local_votacao somem sem aviso nenhum.

5) Os cabeçalhos:
- perfil_eleitorado de 2022, 2024 e 2026 no PI: 27 colunas, idênticas entre si e iguais ao `_BRASIL` do zip.
- Colunas só de 2016–2020: ANO_ELEICAO, TP_OBRIGATORIEDADE_VOTO, QT_ELEITORES_PERFIL, QT_ELEITORES_INC_NM_SOCIAL.
- Colunas só de 2022+: AA_ELEICAO, QT_ELEITORES, QT_ELEITORES_NOME_SOCIAL.
- comparecimento: PI igual ao BRASIL nos 5 anos (43 colunas, tem QT_APTOS, não tem CD_ELEICAO nem CD_CARGO).
- local_votacao 2026 no PI: igual ao de 2024 (41 colunas) e igual ao BRASIL.

A correção de usar o PI como representante é válida.

Ressalvas que baixam a severidade:
(a) O esquemas.md commitado está completo, tanto no main (gerado antes do filtro) quanto no PR #4. Os dois têm `perfil_comparecimento_abstencao (2016–2024)`, `eleitorado_local_votacao (2016–2026)` e `perfil_eleitorado (2022–2026)`. No PR #4 as fontes são `perfil_comparecimento_abstencao_2024_BRASIL.csv` e `perfil_eleitorado_2026_BRASIL.csv`. O defeito só aparece quando alguém regenera o documento. Isso é provável, porque o próprio arquivo diz "Não editar à mão — rode o script de novo", e quem regenerar e commitar apaga esses blocos.
(b) Pelo item (a), o esquemas.md do PR #4 não se reproduz com a coleta commitada: a máquina do Davi tinha `_BRASIL` de eleitorado e abstenção que o coleta_tse.py não extrai.
(c) No local_votacao 2026 se perde só o rótulo do ano. O esquema é o mesmo.
(d) Frase imprecisa do achado: o QT_APTOS da Q7 não sai do perfil_eleitorado 2022–2026. Ele sai do perfil_comparecimento_abstencao, a família que some inteira, e o der-duda.md, linhas 139 e 277, depende dela. Ele só é igual ao QT_ELEITORES, coluna que existe apenas no esquema de 2022+.

### [media] `pr4-eng-02` — confirmado

- **Arquivo:** docs/esquemas.md
- **Problema:** O esquemas.md regenerado diz 'Gerado por scripts/inspecionar_esquemas.py ... rode o script de novo', mas foi gerado a partir de um dados/raw que o coleta commitado não produz: abstenção e perfil_eleitorado nacionais, extraídos antes do filtro de UF existir, e uma planilha de PIB 2010-2021 que sobrou de coleta antiga. Quem rodar coleta + inspetor recebe outro documento, sem os blocos de abstenção e de perfil_eleitorado 2022-2026 e sem o PIB 2010-2021.
- **Evidência:** O esquemas.md do PR cita 'dados/raw/abstencao/2024/comparecimento_abstencao_2024/perfil_comparecimento_abstencao_2024_BRASIL.csv', 'dados/raw/eleitorado/2026/perfil_eleitorado_2026/perfil_eleitorado_2026_BRASIL.csv' e 'base_de_dados_2010_2021_xlsx/PIB dos Municípios - base de dados 2010-2021.xlsx'. Já o coleta_tse.py tem `_coletar_tema("eleitorado", ELEITORADO, force, manter_uf=UF)` e `_coletar_tema("abstencao", ABSTENCAO, force, manter_uf=UF)`, e o coleta_ibge.py:100 raspa só a listagem atual (2010_2023). O main tinha esses blocos vindos dos arquivos _PI.
- **Correção:** 1) Decidir o recorte de eleitorado e abstenção. O estrategia.md do PR (decisão ①) fala em "nacional", mas coleta_tse.py l.107/l.128 continua com manter_uf=UF. Trocar para NACIONAL, ou documentar que esses dois temas ficam só no PI, e alinhar raw_abstencao.ipynb e raw_eleitorado.ipynb, que hoje apontam para arquivos _BRASIL que a coleta não gera.

2) No inspecionar_esquemas.py, quando uma família não tiver arquivo nacional num ano, cair para o arquivo por UF daquele ano, em vez de descartar. O teste precisa ser por (família, ano), não só por família: hoje o perfil_eleitorado 2022-2026 some sem aviso porque os anos 2016-2020 marcam a família como lida. Enquanto isso não for corrigido, o esquemas.md precisa ser gerado com --todas-ufs.

3) Apagar do dados/raw a pasta obsoleta ibge/pib_municipios/base_de_dados_2010_2021_xlsx. A edição atual do FTP (2022_2023) só publica 2002_2009 e 2010_2023.

4) Depois de corrigir o pr4-eng-01, regenerar o esquemas.md a partir de um dados/raw limpo, produzido só pelos scripts do repositório, e conferir que os blocos de abstenção e de perfil_eleitorado 2022-2026 continuam lá. O bloco de abstenção é o único com abstenção por faixa etária e é necessário para a Q7.
- **Verificação:** Reproduzi de forma independente e tudo se confirmou.

1) O esquemas.md do PR (git show origin/pr/4:docs/esquemas.md) cita como fonte, na linha 13, `perfil_comparecimento_abstencao_2024_BRASIL.csv`; na 808, `perfil_eleitorado_2026_BRASIL.csv`; na 2167, `base_de_dados_2010_2021_xlsx/PIB dos Municípios - base de dados 2010-2021.xlsx`. O origin/main cita `perfil_comparecimento_abstencao_2022_PI.csv` (l.13) e `perfil_eleitorado_2026_PI.csv` (l.808), e não tem o bloco do PIB 2010-2021.

2) O coleta_tse.py do PR mantém o recorte PI nesses temas: l.107 `_coletar_tema("eleitorado", ELEITORADO, force, manter_uf=UF)` e l.128 `_coletar_tema("abstencao", ABSTENCAO, force, manter_uf=UF)`, com UF="PI". Com manter_uf=PI, o filtrar_uf (coleta_comum.py) descarta o `_BRASIL`, e o inspetor novo (eh_nacional) pula os `_PI`.

3) O filtro por UF entrou em 6385c8b (20/09). Em 9daa973 (Davi, 19/09) o baixar_zip fazia `z.extractall(pasta)` sem filtro. Como o baixar_zip não reextrai quando a pasta já existe, os `_BRASIL` antigos continuaram no disco. O próprio estrategia.md do PR admite o mesmo mecanismo para as contas: "foram baixados antes do filtro de UF existir e nunca foram limpos".

4) PIB: o 9daa973 casava `href="(\d{4})/"`, ou seja, a edição 2021, que traz o arquivo 2010_2021. Consultei o FTP do IBGE hoje (curl_cffi): a edição escolhida é 2022_2023, e a listagem só tem ['base_de_dados_2002_2009_xlsx.zip', 'base_de_dados_2010_2023_xlsx.zip']. O dados/raw local, gerado pela coleta atual, só tem essas duas pastas.

5) Rodei o inspecionar_esquemas.py e o coleta_comum.py do PR (copiados em C:/Users/eduar/Downloads/rv/cet-eng02/scripts) sobre o dados/raw local, que tem abstencao/*/*_PI.csv e perfil_eleitorado_2022/2024/2026_PI.csv. Saída em C:/Users/eduar/Downloads/rv/cet-eng02/docs/esquemas_local.md, com 1400 linhas contra 2311 do PR:
- o bloco perfil_comparecimento_abstencao sumiu (0 ocorrências);
- sumiu o `perfil_eleitorado` (2022–2026);
- sumiu o PIB 2010-2021; ficaram só 2002-2009 e 2010-2023.
O log mostra "sem arquivo nacional, fora do documento: ... perfil_comparecimento_abstencao ...", mas não avisa do perfil_eleitorado 2022-2026. A família `perfil_eleitorado` já conta como "lida" por causa dos arquivos sem sufixo de 2016-2020, então a omissão é silenciosa. É um bug extra do inspetor. (Os blocos de prestação de contas também somem nessa execução, mas porque o raw local foi extraído com filtro PI. É outro achado, não entra aqui.)

6) Atenuante: comparei as listas de colunas por md5. São idênticas entre main (_PI) e PR (_BRASIL) em perfil_comparecimento_abstencao (201608a3...) e em perfil_eleitorado 2022-2026 (2570dfcb...). Os dois PIB, 2010-2021 e 2010-2023, também têm as mesmas 45 colunas (1a88d5f3...). O conteúdo que interessa ao DER está certo hoje; o problema é de reprodutibilidade e procedência, mais um bloco de PIB duplicado e obsoleto.

7) Agravante: os notebooks do PR usam caminhos `_BRASIL` fixos que a coleta commitada não gera. raw_abstencao.ipynb lê `.../perfil_comparecimento_abstencao_2024_BRASIL.csv` e raw_eleitorado.ipynb lê `.../perfil_eleitorado_2026_BRASIL.csv`.

### [media] `pr4-eng-03` — confirmado

- **Arquivo:** docs/esquemas.md
- **Problema:** O esquemas.md do PR perdeu 9 blocos que existiam no main. (a) receitas_comites (2014): o receitas_comites_2014_brasil.txt tem aspas sem escape, o sniffer do DuckDB falha, e ler_cabecalho engole a exceção e devolve (). (b) Os 8 blocos *_prestacao_contas_final_{2014,2016}_sup: os _sup de 2014 têm esquema próprio. A receita de comitê de 2014 importa para a Q8 (dinheiro que passa por comitê ou partido, fato 8).
- **Evidência:** Comparação de blocos main x PR (pr4eng/): 'SO MAIN ('receitas_comites','2014') 29' mais 8 blocos _sup. DuckDB com as mesmas CSV_OPTS (inclusive ignore_errors): receitas_comites_2014_brasil.txt -> 'Invalid Input Error: Error when sniffing file'. O receitas_comites_2014_BR.txt lê 29 colunas. As linhas culpadas são a 120 ('""PROTENDE" SISTEMAS E METODOS...') e a 4862 ('""PROACQUA" CONTRUCOES...'). O esquema _sup 2014 tem 3 colunas a mais que o regular (dif: 'Sigla da UE','Nome da UE','CPF do vice/suplente'; despesas também muda 'Sigla  Partido' e 'Tipo do documento').
- **Correção:** (1) Em ler_cabecalho, parar de engolir a exceção em silêncio. Se o DESCRIBE falhar, ler só a primeira linha do arquivo (decodificar em cp1252, separar por ';', tirar as aspas). É o fallback mais robusto para pegar o cabeçalho. Em inspecionar_tabular, tentar de novo com `ignore_errors=true, strict_mode=false` juntos: `strict_mode=false` sozinho ainda quebra o sniff de receitas_candidatos_2014 e de receitas_partidos_2016. (2) Todo arquivo nacional que não puder ser lido precisa entrar no esquemas.md como bloco "⚠️ não foi possível ler: <erro>" (o `escrever` já tem esse ramo, mas o main nunca manda esses arquivos para ele). O aviso no console também está errado: diz "sem arquivo nacional" quando o arquivo nacional existe, só não abriu. (3) O `_sup` não é recorte de UF, é outra eleição (2014: Cód. Eleição 268, que não aparece no _brasil). Duas saídas: tratar "sup" como nacional em `eh_nacional` ou criar uma opção `--incluir-sup`, pelo menos para 2014, cujo esquema é próprio. Ou, se ficar de fora, listar as famílias excluídas no próprio documento. Os 4 `_sup` de 2016 têm o mesmo esquema do regular, e basta citá-los. A correção é no script, que já está no main (839cdb4). Depois o PR #4 regenera o esquemas.md. (4) No staging e na Q8, ler `receitas_comites_2014_brasil.txt` com as aspas internas dobradas, como no fato 7: dá 9.173/9.173 linhas em leitura estrita. Não precisa do `_BR`, que já está contido no `_brasil`. O DER precisa decidir se a receita de comitê entra na Q8: há R$ 405,5 mi em doação direta de empresa a comitês. Se entrar, deduplicar os repasses do comitê para o candidato, que voltam como doador originário em receitas_candidatos.
- **Verificação:** Refiz tudo sozinho em C:/Users/eduar/Downloads/rv/cet03/ (DuckDB 1.5.5, a mesma versão mínima do pyproject do PR, "duckdb>=1.5.5").

1) Blocos que sumiram. Comparei com `diff` as contagens de cabeçalhos `### ` entre `git show origin/main:docs/esquemas.md` e `git show origin/pr/4:docs/esquemas.md`. Existem só no main: `receitas_comites` (2014) e os 8 blocos `{receitas,despesas}_{candidatos,partidos}_prestacao_contas_final_{2014,2016}_sup`. Fora isso, `rede_social_candidato` passou de 2018–2020 para 2018–2026, e o PR acrescentou o bloco do PIB. São exatamente 9 blocos perdidos. Fora do esquemas.md, o PR não cita comitê em nenhum lugar (git grep -i "comit" em docs, dossie e notebooks).

2) Por que `receitas_comites` sumiu. `ler_cabecalho` (scripts/inspecionar_esquemas.py:50-56, igual no main e no PR) faz `except Exception: return ()`. Extraí `receitas_comites_2014_brasil.txt` do zip e rodei com as mesmas CSV_OPTS, inclusive `ignore_errors=true`. Resultado: "Invalid Input Error: Error when sniffing file". O `_BR` lê 29 colunas e o `despesas_comites_2014_brasil.txt` lê 19. As duas linhas culpadas se confirmam: a 120 (`;""PROTENDE" SISTEMAS E METODOS...`) e a 4862 (`;""PROACQUA" CONTRUCOES...`). O PR usa o recorte BRASIL e o `filtrar_uf` não extrai o `_BR`. Mas o `_BR` está todo dentro do `_brasil` (3.764 linhas, R$ 287,1 mi, `EXCEPT ALL` = 0), então basta ler o `_brasil`. Com as aspas internas dobradas, a leitura estrita traz 9.173/9.173 linhas e 29 colunas, R$ 738,4 mi.

Relevância para a Q8, que o revisor afirmou sem número. Na receita de comitê de 2014 há R$ 405,5 mi (1.695 linhas) doados diretamente por CNPJ que não é 9492800 (ou seja, empresa), mais R$ 306,0 mi vindos de CNPJ 9492800 (organização política). Parte disso chega aos candidatos como doador originário, então há risco de contar duas vezes, mas o valor pesa.

3) Os `_sup`. A exclusão vem do commit 839cdb4, que já está no main: `eh_nacional` com `_RECORTE=_\d{4}_([A-Za-z]{2,6})` trata "sup" como recorte, e o aviso só sai no console ("sem arquivo nacional, fora do documento"). O PR apenas regenerou o documento. Comparei os cabeçalhos dos `_sup` com os arquivos regulares:
- **2014, esquema próprio:** receitas_candidatos tem 35 colunas contra 32 do regular (só no `_sup`: 'Sigla da UE', 'Nome da UE', 'CPF do vice/suplente'). despesas_candidatos tem 25 contra 22 ('Sigla  Partido' e 'Tipo de documento' no lugar de 'Sigla Partido' e 'Tipo do documento'). receitas_partidos tem 31 contra 29 e despesas_partidos 21 contra 19.
- **2016, idênticos ao regular:** 35/35, 25/25, 31/31 e 21/21 colunas, com os mesmos nomes. Perder esses 4 blocos não tira nenhuma informação de esquema.

O `_sup` também não é uma fatia do nacional. O `receitas_candidatos_..._2014_sup` só tem 'Cód. Eleição'=268 (659 linhas), e o `_brasil` corrigido só tem 143 (427.489 linhas). É um conteúdo à parte, não um recorte por UF. Para a Q8, que olha só eleição ordinária, o `_sup` pesa pouco.

4) A correção proposta. Testei `strict_mode=false` sozinho: ele lê o comitê, mas ainda falha no sniff de `receitas_candidatos_2014_PI.txt` e de `receitas_partidos_prestacao_contas_final_2016_PI.txt`. A combinação `ignore_errors=true` + `strict_mode=false` leu os 3 arquivos (32, 31 e 29 colunas), e o comitê saiu com 9.173 linhas e campos alinhados. Nesse modo as aspas do nome são descartadas ('PROTENDE SISTEMAS...' em vez de '"PROTENDE" SISTEMAS...').

### [media] `pr4-eng-04` — parcial

- **Arquivo:** scripts/coleta_comum.py
- **Problema:** A troca da prestação de contas para manter_uf=NACIONAL não se aplica a quem já tinha extraído o PI. baixar_zip sai cedo quando a pasta existe. O único caminho é --force, que rebaixa todos os zips (só o de candidatos 2024 tem 1,33 GB). E o extractall não apaga os _PI antigos, então PI e BRASIL passam a conviver na mesma pasta, e qualquer glob do tipo receitas_candidatos_*_*.csv conta o PI duas vezes.
- **Evidência:** coleta_comum.py: `if pasta.is_dir() and destino.exists() and not force: log("  ok ..."); return` e `baixar(url, destino, force)` rebaixa quando force=True. Estado local: dados/raw/prestacao_contas/2026/prestacao_contas_candidatos_2026/ tem só receitas_candidatos_2026_PI.csv etc., enquanto o zip ao lado contém receitas_candidatos_2026_BRASIL.csv. prestacao_contas_candidatos_2024.zip = 1.333.884.113 B. O patch é idêntico no PR (206f969) e no main (839cdb4).
- **Correção:** Correção imediata, sem código e sem rede: apagar só as pastas extraídas de dados/raw/prestacao_contas/<ano>/<nome>_<ano>/, mantendo os .zip, e rodar `python scripts/coleta_tse.py prestacao_contas`. Isso re-extrai só os `_BRASIL` do zip local, sem baixar nada (verificado na simulação). Não usar `--force` no Windows, porque ele baixa ~4,9 GB de zips de prestação e depois quebra no rename.

Correção no código, em coleta_comum.py:
(1) Em `baixar_zip`, trocar a saída cedo baseada em `pasta.is_dir()` por uma comparação entre `set(filtrar_uf(z.namelist(), manter_uf))` e os arquivos em disco. Se faltar algum membro esperado, re-extrair do zip local sem chamar `baixar`.
(2) Antes de extrair, remover da pasta os arquivos de dado (`_SUFIXO_UF` casando) que não estão em `nomes`, para o `_PI` não ficar junto do `_BRASIL`. Alternativa: expor isso numa opção `--reextrair` separada de `--force`.
(3) Em `baixar`, trocar `parcial.rename(destino)` por `parcial.replace(destino)`, nos dois lugares. Sem isso o `--force` falha no Windows sempre que o arquivo já existe.
(4) Atualizar a tabela "Recorte por UF" do README, que ainda diz `prestacao_contas` "só PI", e documentar o passo de migração.

A dupla contagem por glob deve ser rebaixada a risco potencial, porque nenhum código atual usa um glob que pegue os dois arquivos.
- **Verificação:** O problema central se confirma. Duas afirmações do achado estão erradas ou exageradas, e há um agravante que o revisor não viu.

1) O patch é idêntico no PR e no main. `git diff 206f969 839cdb4 -- scripts/` e `git diff origin/main origin/pr/4 -- scripts/coleta_comum.py scripts/coleta_tse.py` não mostram diferença. Em origin/main, coleta_tse.py:118 tem `manter_uf=NACIONAL`, e coleta_comum.py em `baixar_zip` tem `if pasta.is_dir() and destino.exists() and not force: log(...); return`.

2) O estado local se confirma. Em dados/raw/prestacao_contas há 0 arquivos `*_brasil.*` extraídos e 50 `*_PI.*`. A pasta 2026/prestacao_contas_candidatos_2026/ só tem os `_PI.csv`, enquanto o zip dela (112 membros) contém receitas_candidatos_2026_BRASIL.csv. O zip prestacao_contas_candidatos_2024.zip tem 1.333.884.113 B. Rodei `filtrar_uf(namelist, 'BRASIL')` nos 15 zips e comparei com o disco: faltam 50 arquivos `_BRASIL` e sobrariam 50 `_PI`.

3) Simulei com o coleta_comum.py do main copiado para C:/Users/eduar/Downloads/rv/cet04/sim.py, com um zip falso e a rede bloqueada:
   - (a) Com a pasta PI já extraída, `baixar_zip(..., manter_uf='BRASIL')` só imprime "ok" e a pasta continua só com o `_PI`. Confirmado.
   - (b) Com `force=True`, a função tenta baixar da rede. Confirmado.
   - (c) Com o download simulado, o `extractall` deixa `_BRASIL` e `_PI` juntos na mesma pasta. Confirmado.
   - (d) Contorno: apagar a pasta extraída e rodar sem force re-extrai só o `_BRASIL` do zip local, com 0 downloads. Isso refuta "o único caminho é --force".

4) Agravante: no Windows, o `--force` nem funciona para arquivo que já existe. Rodei sim2.py: `baixar(force=True)` baixa tudo no `.part` e quebra em `parcial.rename(destino)` com `FileExistsError [WinError 183]`, deixando `a.zip` e `a.zip.part`. Numa segunda rodada o `.part` completo leva ao 416 e cai no mesmo `rename`. O caminho que o achado aponta como o único falha na máquina do grupo.

5) A dupla contagem é hipotética. O `git grep` em main e nos PRs 2, 3 e 4 não acha nenhum glob que pegue `_PI` e `_BRASIL` juntos:
   - O staging do Enrico usa `receitas_candidatos_????_??.csv`, que com os dois arquivos juntos pega só o `_PI` (verificado na simulação).
   - Os notebooks do PR #4 apontam direto para `_BRASIL`.
   - O inspecionar_esquemas do main filtra com `eh_nacional`.

   O efeito concreto é outro: notebooks como notebooks/visualizar/raw_prestacao_contas.ipynb (PR #4) abrem `receitas_candidatos_2026_BRASIL.csv`, que não existe no estado local, e dão FileNotFound.

6) O próprio docs/estrategia.md do PR #4 reforça o achado. A tabela diz que em 2014 o `_BRASIL` segue "ainda dentro do zip" e conta com ele para chegar aos "~21 GB", mas o código nunca vai extraí-lo. Também manda "apagar as UFs", e nenhum código faz isso. Além disso, o README do main continua dizendo que `prestacao_contas` fica "só PI", e o 839cdb4 não atualizou o README.

### [baixa] `pr4-eng-05` — parcial

- **Arquivo:** notebooks/visualizar/*.ipynb
- **Problema:** Dos 15 notebooks de visualização, só 5 rodam, e 3 desses leem arquivos vazios. raw_abstencao e raw_eleitorado esperam _BRASIL que o coleta nunca extrai (manter_uf=UF). Os 8 de prestação falham em qualquer extração da era PI (ver pr4-eng-04). Os 3 de resultados apontam para 2026, cuja votação é só cabeçalho antes da eleição, e geram parquet de 0 linhas. As saídas commitadas vêm de execuções fora de ordem.
- **Evidência:** Execução das células (pr4eng/runnb.py): raw_abstencao, raw_eleitorado e os 8 raw_prestacao_contas_* dão 'IOException: No files found that match the pattern'; raw_candidatos e raw_extras dão ok. Os arquivos votacao_candidato/partido/detalhe_munzona_2026_BRASIL.csv têm 1 linha cada; os parquets resultados/detalhe/votacao_partido ficam com count(*)=0. As saídas commitadas de raw_resultados.ipynb mostram 'IO Error: No files found ... /home/davi/Documentos/UFPI/6-periodo/BDR/analiseCandidatos/dados/raw/resultados/2024/votacao_candidato_munzona_2026/...' e SUMMARIZE com min/max None. Em raw_abstencao.ipynb, a célula 5 ('SELECT DISTINCT DT_GERACAO', exec=None) mostra '[9825477 rows x 1 columns]'.
- **Correção:** 1) Abstenção e eleitorado: apontar os notebooks para _PI, que é o que o coletor extrai (manter_uf=UF), em vez de mudar o coletor para nacional. Os _BRASIL descompactados passam de 2 GB cada (2,56 GB e 2,17 GB). Se precisar do Brasil inteiro, mudar manter_uf para NACIONAL nas linhas 107 e 128 do coleta_tse.py e documentar essa escolha.

2) Resultados: usar 2024 ou 2022 enquanto a votação de 2026 não sair, com ANO e recorte num parâmetro no topo.

3) Prestação: deixar escrito que quem já tinha a extração PI precisa rodar 'python scripts/coleta_tse.py prestacao_contas --force' (liga com pr4-eng-04). Em vez de caminho fixo, o notebook pode fazer um glob '*_{BRASIL,PI}.csv'.

4) Trocar os 15 clones por um único notebook ou script parametrizado (tema, ano, recorte). Tirar ignore_errors=true, que descarta linhas em silêncio (fato 7). Não gravar em dados/processed/candidatos.parquet, que é a saída multi-ano do convert_csv_parquet_candidatos.py; usar outro nome ou não gerar parquet num notebook de inspeção.

5) Antes de commitar, rodar 'Restart & Run All' ou limpar as saídas com nbstripout. Isso também remove o caminho /home/davi e as saídas que não batem com o código, como o DISTINCT com 9,8 milhões de linhas.
- **Verificação:** Refiz a verificação do zero. Extraí os 15 notebooks de origin/pr/4:notebooks/visualizar para C:/Users/eduar/Downloads/rv/cet05/nb. Montei uma raiz falsa (pyproject.toml, dados/raw como junction para os dados locais e dados/processed próprio) e executei as células em ordem com o script C:/Users/eduar/Downloads/rv/cet05/run.py (Python 3.12 e duckdb). Depois removi a junction; os dados brutos continuam intactos.

O QUE SE CONFIRMA
1) Execução local: 10 notebooks param na célula 0 com 'IOException: No files found that match the pattern': raw_abstencao, raw_eleitorado e os 8 raw_prestacao_contas*. Rodam até o fim só 5: raw_candidatos (candidatos.parquet com 20.984 linhas), raw_extras (5.571 linhas) e os 3 de resultados.

2) Abstenção e eleitorado falham por causa do próprio coletor do PR #4. Em scripts/coleta_tse.py, as linhas 107 e 128 usam manter_uf=UF, com UF="PI". Em scripts/coleta_comum.py, a filtrar_uf só mantém o arquivo quando m.group(1).upper()==uf.upper(), então o _BRASIL fica sempre de fora. Os zips têm o nacional, mas ele nunca é extraído: perfil_comparecimento_abstencao_2024_BRASIL.csv tem 2.564.889.477 bytes e perfil_eleitorado_2026_BRASIL.csv tem 2.172.782.281 bytes.

3) Os 3 notebooks de resultados leem 2026. Os arquivos votacao_candidato, votacao_partido e detalhe_votacao_munzona_2026_BRASIL.csv têm 1 linha cada no wc -l (894, 671 e 935 bytes), ou seja, só o cabeçalho. Os parquets gerados ficam com count(*)=0: resultados, votacao_partido_munzona e detalhe_votacao_munzona.

4) As saídas commitadas são inconsistentes com o código:
- raw_resultados.ipynb: a célula 0 mostra o erro com o caminho /home/davi/Documentos/UFPI/6-periodo/BDR/analiseCandidatos/dados/raw/resultados/2024/votacao_candidato_munzona_2026/..., mas o código atual aponta para 2026/. Mesmo assim as células seguintes têm saída (SUMMARIZE com min/max None).
- raw_abstencao.ipynb: a célula 5 ('SELECT DISTINCT DT_GERACAO', execution_count=None, saída com execution_count 29) mostra '[9825477 rows x 1 columns]', todas com o valor 29/04/2025. Um DISTINCT não pode devolver isso.
- A ordem de execução é irregular. raw_prestacao_contas: 2,3,4,None,6,7,14. raw_candidatos: None,2,3,4,5,6.
- O caminho /home/davi aparece só em raw_resultados.ipynb.

O QUE ESTÁ EXAGERADO
5) A manchete "só 5 rodam" vale para a extração da era PI que está nesta máquina, não para o PR em si. A coleta de prestação no PR #4 é manter_uf=NACIONAL e ANOS_PRESTACAO inclui 2026. Os zips de 2026 contêm os 8 _BRASIL que os notebooks esperam:
- despesas_contratadas_candidatos_2026_BRASIL.csv, 463 MB
- receitas_candidatos_2026_BRASIL.csv, 83 MB, com 119.654 linhas contando o cabeçalho
- os outros 6 também estão lá

Então, num clone novo com a coleta do PR, rodam 13 de 15; 3 deles dão 0 linhas e 2 falham (abstenção e eleitorado). A falha de prestação só atinge quem já tinha pastas extraídas com PI e não rodou --force: baixar_zip pula a extração quando a pasta existe (coleta_comum.py, linha 113), que é o ponto do pr4-eng-04.

6) Os dados vazios de resultados 2026 são temporários. Hoje é 23/09/2026 e o 1º turno ainda não aconteceu; o problema é ter fixado o ano de 2026, não um defeito permanente.

GRAVIDADE
7) Nada no PR consome as saídas desses notebooks. git grep por 118115, 9825477, raw_* e notebooks/visualizar fora da pasta não acha nada. O próprio docs/TODO.md do PR já lista 'estabelecer metodologia correta (scripts de dados, notebooks para visualizar ...)'. Por isso rebaixo para baixa.

ACHADO EXTRA (verificado)
raw_candidatos.ipynb grava em dados/processed/candidatos.parquet, o mesmo arquivo que scripts/convert_csv_parquet_candidatos.py gera com todos os anos (glob */candidatos_[0-9]*/consulta_cand_[0-9]*_BRASIL.csv). Rodar o notebook sobrescreve esse parquet com as 20.984 linhas de 2026.

### [baixa] `pr4-eng-06` — confirmado

- **Arquivo:** notebooks/visualizar/raw_candidatos.ipynb
- **Problema:** A célula 0 grava dados/processed/candidatos.parquet, o mesmo arquivo que scripts/convert_csv_parquet_candidatos.py gera com todos os anos. Rodar o notebook substitui a base 2002-2026 por só 2026, sem aviso.
- **Evidência:** convert_csv_parquet_candidatos.py: `COPY (SELECT * FROM candidatos_raw) TO '{ROOT / "dados" / "processed" / "candidatos.parquet"}'` sobre o glob */candidatos_[0-9]*/consulta_cand_[0-9]*_BRASIL.csv, que dá 2.954.876 linhas e 13 anos distintos (medido). O notebook faz `COPY dados_raw TO '{ROOT / "dados" / "processed" / "candidatos.parquet"}'` a partir de consulta_cand_2026_BRASIL.csv, e o parquet resultante tem 20.984 linhas (medido em rv/nbrun).
- **Correção:** O conflito existe e é silencioso, mas nenhum consumidor no repositório lê candidatos.parquet (analise.ipynb e tse.duckdb leem os CSVs) e o arquivo se regenera com `scripts/convert_csv_parquet_candidatos.py`. Por isso a severidade cai para baixa. Correção: tirar o COPY da célula 0 do notebook e montar a view `dados` direto sobre o CSV de 2026 (read_csv com quote='"' e sem ignore_errors, para não perder linhas em silêncio). DESCRIBE/SUMMARIZE rodam sobre a view. Se o Davi quiser mesmo materializar, que use um nome próprio fora do artefato documentado no README, por exemplo dados/processed/visualizar/candidatos_2026.parquet. Outra opção é ler o parquet consolidado do script com WHERE ANO_ELEICAO = '2026'.
- **Verificação:** 1) Leitura no ref: `git show origin/pr/4:notebooks/visualizar/raw_candidatos.ipynb`, célula 0: CSV = ROOT / "dados/raw/candidatos/2026/candidatos_2026/consulta_cand_2026_BRASIL.csv"; `con.sql(f"COPY dados_raw TO '{ROOT / "dados" / "processed" / "candidatos.parquet"}' ...")`. O `scripts/convert_csv_parquet_candidatos.py` (igual em origin/main e origin/pr/4, diff vazio, vem do commit 9daa973) faz `COPY (SELECT * FROM candidatos_raw) TO '{ROOT / "dados" / "processed" / "candidatos.parquet"}'` sobre o glob `*/candidatos_[0-9]*/consulta_cand_[0-9]*_BRASIL.csv`. O README do PR #4, seção "Conversão para Parquet", diz que o script "Consolida os CSVs de candidatos de todos os anos em um único Parquet". O caminho é o mesmo, e o notebook foi adicionado no PR #4 (commit 3565b41).
2) Reproduzi os dois COPY gravando em C:/Users/eduar/Downloads/rv/cet06/ (script m.py) com os dados raw: a saída do script tem 2.954.874 linhas, 13 anos distintos (2002 a 2026) e 190 MB. A saída do notebook tem 20.984 linhas, 1 ano (2026) e 1,09 MB. O revisor mediu 2.954.876 linhas, 2 a mais que eu. A diferença deve vir do ignore_errors=true do script e não muda a conclusão.
3) As saídas salvas no próprio notebook confirmam que o Davi rodou e gerou o parquet só com 2026: na célula 2 (SUMMARIZE), ANO_ELEICAO tem min=max=2026, approx_unique=1 e count=20984; na célula 5, DISTINCT DT_GERACAO devolve só '16/09/2026'.
4) Ressalva sobre o impacto: procurei 'parquet' em todos os .py/.ipynb/.md/.sql do PR #4. Nenhum código lê dados/processed/candidatos.parquet. notebooks/analise.ipynb não cita parquet nenhuma vez e usa tse.duckdb, cuja view candidatos_raw lê os CSVs e não o parquet. dados/processed/* está no .gitignore. Os outros notebooks de visualizar gravam abstencao/eleitorado/extras/prestacao_contas/resultados.parquet, e esses nomes não batem com a saída de nenhum script. Então a colisão acontece só em candidatos.parquet, e o arquivo sobrescrito se regenera rodando o script de novo.

### [baixa] `pr4-eng-07` — confirmado

- **Arquivo:** docs/dossie/leiames/
- **Problema:** Caminhos de até 139 caracteres (40 caminhos passam de 100) quebram o checkout no Windows quando o caminho-base passa de uns 119 caracteres (MAX_PATH=260). Os arquivos que falham ficam como 'deletados' no working tree, e um git add -A commita a remoção. Nesta máquina LongPathsEnabled=0, e core.longpaths só está ligado no config do worktree, não no clone em Downloads.
- **Evidência:** O maior caminho tem 139 caracteres: docs/dossie/leiames/prestacao_contas/20xx/prestacao_contas_orgaos_partidarios_20xx/leiame_receitas-orgaos-partidarios-doador-originario.pdf. Teste: clone local com base de 136 caracteres e `git -c core.longpaths=false checkout pr4` -> 'error: unable to create file ...: Filename too long'; git status mostra 20 de 197 arquivos como ' D'. reg LongPathsEnabled = 0x0. O worktree atual tem base de 100 caracteres (239 no total, passa por pouco).
- **Correção:** (a) Encurtar e deduplicar a pasta docs/dossie/leiames. O nome do subdiretório repete o ano: '.../2026/prestacao_contas_orgaos_partidarios_2026/' sozinho ocupa 41 caracteres, e tirando esse nível redundante o maior caminho cai de 139 para uns 98. Além disso, dos 143 arquivos só 44 são distintos, então vale guardar um PDF por conteúdo (por exemplo leiames/<tema>/<nome>.pdf ou leiames/<sha8>.pdf) e deixar o indice.md mapear quais anos usam cada um. Isso também tira umas 99 cópias do tree.
(b) Enquanto a estrutura não muda, documentar no README o `git config core.longpaths true` (ou `git clone -c core.longpaths=true ...`). Testei aqui: resolve o checkout mesmo com LongPathsEnabled=0. Vale avisar que outras ferramentas do Windows (Explorer, scripts sem suporte a caminho longo) ainda podem falhar nesses arquivos.
(c) Orientar a conferir o `git status` antes de `git add -A`, para não commitar remoções que vieram de um checkout que falhou.
- **Verificação:** Reproduzi tudo de forma independente, e todos os fatos do achado batem.
(1) `git ls-tree -r --name-only origin/pr/4` (e0e5bd8): são 197 arquivos, 40 com mais de 100 caracteres. Os mais longos têm 139, por exemplo docs/dossie/leiames/prestacao_contas/2026/prestacao_contas_orgaos_partidarios_2026/leiame_receitas-orgaos-partidarios-doador-originario.pdf. Os comprimentos no topo são 139, 133, 127, 123, 121 e 117, com 5 arquivos cada.
(2) `Get-ItemProperty HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem` retorna LongPathsEnabled = 0.
(3) `git config --show-origin --get-all core.longpaths`: o clone em Downloads não tem a opção (rc=1); o worktree atual tem `true` só em .git/worktrees/ibge-electoral-datasets-daf825/config.worktree; o global e o system não têm. Git 2.46.2.windows.1.
(4) Fiz um clone local com --no-checkout e depois `git -c core.longpaths=false checkout <e0e5bd8>`. Com base de 130 caracteres (contando a barra final): aparece 'error: unable to create file ...: Filename too long' e o status fica com 10 arquivos ' D' (os de 133 e 139); os de 127 passam (130+127=257). Com base de 137 (136 sem a barra): 20 erros e 20 ' D' (os de 123, 127, 133 e 139), exatamente os 20 de 197 do achado. O limite fica por volta de 259 caracteres no caminho completo.
(5) Rodei `git add -A` nesse clone: as 10 remoções ficam em stage como 'D ', então um commit apagaria esses arquivos.
(6) `git -c core.longpaths=true checkout -- .` recuperou os 20 arquivos mesmo com LongPathsEnabled=0, e o status ficou limpo.
(7) As bases reais: o clone em Downloads tem 47 caracteres (47+139=186, passa) e o worktree atual tem 100 (239, passa com folga de 20).
(8) Nenhum README do PR #4 menciona longpaths ou MAX_PATH (`git grep -i longpaths|MAX_PATH` em origin/pr/4 não retornou nada).
(9) A pasta docs/dossie/leiames tem 143 arquivos, mas só 44 blobs distintos. São 99 duplicatas: o mesmo leiame repetido por ano, somando 25,7 MiB no tree.
Os clones temporários ficaram em C:/Users/eduar/Downloads/rv/cetico07 e já foram removidos.
Por que baixei a severidade: nenhum dos clones conhecidos quebra, o problema só aparece com caminho-base acima de uns 120 caracteres (cenário realista: worktree do Claude sobre uma pasta funda), o erro no checkout é explícito e não silencioso, e os arquivos atingidos são PDFs de referência que dá para recuperar pelo histórico. O risco real é um `git add -A` feito sem olhar, por exemplo por um agente.

### [baixa] `pr4-eng-08` — parcial

- **Arquivo:** docs/dossie/leiames/
- **Problema:** 141 PDFs de leia-me versionados, mas só 42 são distintos (70% duplicados por hash). Todos já vêm dentro dos zips que o coleta baixa, e nenhum script gera leiames/ nem indice.md, então o espelho não se reproduz. Com mermaid.min.js e o PDF de saída, a árvore versionada passa de 0,59 MB para 32 MB.
- **Evidência:** git ls-tree -r -l origin/pr/4 docs/dossie/leiames: 141 PDFs, 26.922.648 B, 42 blobs distintos com 8.108.537 B. Exemplos de grupos idênticos: candidatos 2002-2012+2016 (7 cópias de 393.129 B), eleitorado_local_votacao 2016-2026 (6 cópias de 336.489 B), detalhe_votacao_munzona 2016-2026 (6 cópias de 134.884 B). Árvore do main: 591.878 B em 20 arquivos; do PR: 32.092.449 B em 197. Blobs novos no histórico: 99, com 13.049.488 B (8.314.610 B em disco). grep em scripts/ não acha gerador de indice.md.
- **Correção:** Escolher uma de duas opções.

(a) Espelho gerado: acrescentar ao scripts/build_dossie.py uma função que percorre dados/raw buscando `*leiame*.pdf` (sem distinguir maiúsculas), copia para docs/dossie/leiames/ e escreve o indice.md. Depois colocar docs/dossie/leiames/*.pdf no .gitignore. Nessa opção a página só mostra os leia-me para quem rodou a coleta.

(b) Manter versionado para o dossiê funcionar sozinho, mas sem as cópias no checkout: guardar só os 42 PDFs distintos (por exemplo leiames/<sha1-curto>.pdf) e fazer o build_dossie.py gerar um indice.md com `- [tema/ano/pacote/leiame.pdf](<sha>.pdf)`. O fetch atual do HTML (regex `^- \[..\]\((..)\)`) continua funcionando sem mudança. O checkout cai de 26,9 MB para 8,1 MB. O histórico praticamente não muda, porque o git já deduplicava.

Nos dois casos, documentar no README que o espelho é gerado. De quebra, avaliar se vale versionar mermaid.min.js (3,3 MB, poderia vir de cdn.jsdelivr.net/npm/mermaid@11) e output/pdf (artefato de build de 721 KB).

Não usar links para o CDN do TSE sem antes confirmar que o TSE publica os leia-me soltos (não verificado).
- **Verificação:** Todos os números reproduzem, mas o custo real no git é menor do que o achado dá a entender, e há um motivo legítimo para versionar os PDFs.

1) `git -C C:/Users/eduar/Downloads/bdr/analiseCandidatos ls-tree -r -l origin/pr/4 docs/dossie/leiames`: 143 entradas (141 PDFs + indice.md de 19.592 B + .gitkeep). Os 141 PDFs somam 26.922.648 B e são 42 blobs distintos, com 8.108.537 B (a conta com awk dá 44 distintos e 8.128.130 B incluindo indice.md e .gitkeep). 99/141 = 70,2% de cópias. Os grupos citados batem: candidatos 2002-2012 e 2016 (7 cópias de 393.129 B), eleitorado_local_votacao 2016-2026 (6 de 336.489 B), detalhe_votacao_munzona 2016-2026 (6 de 134.884 B). Há mais 15 grupos de 5 cópias (prestação de contas 2018-2026, bens, vagas, coligações etc.).

2) Árvore: origin/main tem 20 arquivos com 591.878 B; origin/pr/4 tem 197 com 32.092.449 B. Os maiores blobs são docs/dossie/mermaid.min.js (3.338.725 B) e output/pdf/dossie-analise-candidatos-ufpi.pdf (721.022 B).

3) `git rev-list --objects origin/pr/4 --not origin/main | git cat-file --batch-check`: 99 blobs novos, 13.049.488 B (8.314.610 B em disco). Confere.

4) Onde o achado exagera: o git guarda cada blob idêntico uma vez só. Os 42 PDFs distintos ocupam 6.776.619 B no pack e as 99 cópias extras não custam nada no histórico nem no download do clone. A duplicação só pesa no checkout: 26,9 MB em disco contra 8,1 MB. Ou seja, "70% duplicados" é verdade em arquivos, mas não em armazenamento no repositório.

5) Nada gera o espelho: `git grep -i leiame origin/pr/4 -- scripts/` só acha HTML e JS embutidos em build_dossie.py (a página faz `fetch('leiames/indice.md')`). Nenhum código cria leiames/ nem escreve indice.md. Os PDFs estão em 141 caminhos, o indice.md lista os 141 e o próprio índice diz que foram espelhados de dados/raw/. A cópia foi manual.

6) "Já vêm nos zips": comparei com `git hash-object` os leia-me extraídos localmente em dados/raw (139 arquivos) com os blobs do PR. 138 são idênticos byte a byte, inclusive extras/municipio_tse_ibge. Um difere: candidatos/2022/redes_sociais_2022/leiame.pdf, com 178.756 B no PR contra 177.918 B no zip local. O zip local é de uma coleta antiga, não do _BR nacional. Dois (redes_sociais 2024 e 2026) não foram verificados porque esses zips não foram baixados aqui, mas o coleta_tse.py do PR tem o modelo `consulta_cand/rede_social_candidato_{ano}{br}.zip`, então baixaria.

7) Atenuante que o achado ignora: dados/raw/* está no .gitignore do PR e o README manda servir a página com `http.server --directory docs/dossie`, que não enxerga ../../dados/raw. Para o dossiê entregue funcionar sozinho para quem só clona (sem rodar uma coleta de vários GB), faz sentido ter os PDFs dentro de docs/dossie. O problema é de higiene do repositório. Não afeta dados, DER nem respostas, então média é exagero.

### [baixa] `pr4-eng-09` — confirmado

- **Arquivo:** output/pdf/dossie-analise-candidatos-ufpi.pdf
- **Problema:** O PDF entregue está desatualizado em relação ao próprio PR e nenhum script o gera. Foi gerado antes dos commits de renumeração, topbar, leiame e TODOs: ainda tem a numeração antiga (3 a 10) e a seção 'Visualização — DESCRIBE', que foi removida. Além disso, output/ não está no .gitignore.
- **Evidência:** Metadados: '/CreationDate (D:20260923142921+00'00')', '/Creator ... HeadlessChrome/153.0.0.0' (Linux X11), 18 páginas. Texto extraído via ToUnicode (pr4eng/pdftxt.py), sumário: '3.Introdução ... 9.Visualização—`DESCRIBE`noDuckDB ... 10.Fontesdosdadoseleia-me'. As seções atuais em docs/dossie/secoes vão de '## 1. Introdução' a '## 7. Fontes dos dados e leia-me'. O commit e0e5bd8 apagou secoes/visualizacao.md. grep por print-to-pdf/playwright/weasyprint em scripts não acha nada.
- **Correção:** O problema existe como descrito. Baixei a gravidade porque o conteúdo do modelo no PDF (der.mmd, perguntas, dicionário) é idêntico ao atual. Mudaram só a numeração e as seções que foram removidas depois. Basta regerar o PDF. Há dois caminhos.

(a) Tirar output/ do git: `git rm --cached output/pdf/dossie-analise-candidatos-ufpi.pdf`, pôr `/output/` no .gitignore e gerar o PDF só na entrega.

(b) Versionar um gerador, por exemplo scripts/gerar_pdf_dossie.sh ou .py, e rodá-lo como último passo antes de cada entrega. Ele precisa fazer duas coisas, nesta ordem:
- servir a pasta por HTTP, com `python -m http.server 8765 --directory docs/dossie`. Isso é obrigatório: a página carrega der.mmd e leiames/indice.md via fetch, e em file:// o navegador bloqueia, como o próprio README avisa. Nesse caso o DER sairia em branco no PDF.
- imprimir com `msedge/chrome --headless=new --disable-gpu --virtual-time-budget=20000 --print-to-pdf=output/pdf/dossie-analise-candidatos-ufpi.pdf http://127.0.0.1:8765/index.html`. O tempo virtual deixa o Mermaid terminar de renderizar os módulos de #print-diagrams.

Também vale corrigir a frase do docs/dossie/README.md para dizer como o PDF é gerado.
- **Verificação:** Reproduzi tudo de forma independente, com um extrator de texto próprio (C:/Users/eduar/Downloads/rv/cetico09/ext.py, que lê o ToUnicode via zlib) aplicado a `git show origin/pr/4:output/pdf/dossie-analise-candidatos-ufpi.pdf`, que tem 721.022 bytes.

1) Metadados do PDF: `/Creator (Mozilla/5.0 (X11; Linux x86_64) ... HeadlessChrome/153.0.0.0 ...)`, `/Producer (Skia/PDF m153)`, `/CreationDate (D:20260923142921+00'00')`. São 18 páginas.

2) Sumário do PDF (página 2): "3. Introdução, 4. Perguntas, 5. DER, 6. Modelo relacional, 7. Dicionário de dados, 8. Sobre, 9. Visualização — `DESCRIBE` no DuckDB, 10. Fontes dos dados e leia-me". A seção DESCRIBE ocupa as páginas 14 a 16. A página 18 ainda traz "Documentos utilizados".

3) Em origin/pr/4, as seções de docs/dossie/secoes/*.md vão de "## 1. Introdução" até "## 7. Fontes dos dados e leia-me". Não existe mais visualizacao.md: `git show --stat e0e5bd8` mostra `docs/dossie/secoes/visualizacao.md | 5 --`.

4) O PDF entrou no commit 975e87e (11:54:20 -0300), único commit que toca output/. Ele foi gerado às 14:29:21 UTC, ou seja, 11:29 -0300, 25 minutos antes desse commit. Os `<h2>` do index.html em 975e87e (3. a 10., com "9. Visualização — DESCRIBE" e "Documentos utilizados") batem com o PDF. Os commits seguintes mudaram o conteúdo e o PDF não foi regerado:
- f5d76d3 renumerou para 1 a 8;
- 4075f6c tirou "Documentos utilizados" e trocou o seletor de pasta pela lista de leia-mes;
- e0e5bd8 tirou o DESCRIBE, ficando 1 a 7.

5) Nenhum script gera o PDF. scripts/build_dossie.py (135 linhas) só escreve o index.html. O único caminho é o botão `onclick="window.print()"` ("Imprimir / salvar PDF"). `git grep` por pdf/print-to-pdf/playwright/weasyprint/puppeteer/chrom em scripts/ e docs/ não encontra nenhum gerador. O Creator diz HeadlessChrome em Linux, então o PDF saiu de um processo headless que não está versionado.

6) O .gitignore em origin/pr/4 lista só /dados/raw/*, /dados/processed/*, .venv/ e __pycache__/. output/ não está nele.

Ressalva que reduz a gravidade: `git log origin/pr/4 -- docs/dossie/der.mmd` mostra só 975e87e, e o word-diff de index.html entre 975e87e e e0e5bd8 muda apenas numeração, layout (sidebar para topnav), a seção DESCRIBE, o texto do leia-me e "Documentos utilizados". O DER, as perguntas, o dicionário e a seção "Sobre" do PDF estão iguais aos atuais. A desatualização é de estrutura e numeração, não do conteúdo do modelo. O próprio docs/dossie/README.md admite: "O PDF entregue é uma captura estática do conteúdo no momento da geração".

### [baixa] `pr4-eng-10` — não verificado (baixa)

- **Arquivo:** docs/dossie/index.html
- **Problema:** O index.html commitado ('gerado, não editar direto') não é o que o build_dossie.py produz a partir das seções commitadas. O commit e0e5bd8 encurtou secoes/der.md mas não regenerou esse trecho da página.
- **Evidência:** Rodei build_dossie.py em rv/pr4 e comparei com o commitado: a única diferença é na seção DER. O commitado tem '... A página HTML carrega esse arquivo em tempo de execução ... Ele consolida o rascunho docs/der.md com as correções registradas em docs/estrategia.md, seção 4.1 ... depende da carga.' e o gerado termina em ').'.
- **Correção:** Rodar build_dossie.py e commitar. Opcional: um check (pre-commit ou CI) que regenere e falhe se houver diff.

### [baixa] `pr4-eng-11` — não verificado (baixa)

- **Arquivo:** docs/dossie/README.md
- **Problema:** As instruções de build não funcionam como estão escritas. Elas usam 'rtk proxy ...' e 'rtk uv run ...', mas rtk é ferramenta pessoal e não faz parte do projeto. O build_dossie.py importa mistune, que não está declarado no pyproject.toml (só chega de forma transitiva via jupyterlab/nbconvert). O README ainda fala em 'carregamento automático do DER e do CSV', mas a página não carrega mais o CSV.
- **Evidência:** README linha 13: 'rtk proxy python -m http.server 8765 ...'; linha 18: 'rtk uv run python scripts/build_dossie.py'. `which rtk` -> não encontrado. pyproject.toml não tem mistune nas dependencies; no uv.lock o mistune aparece só como dependência de nbconvert. O Python do sistema dá 'ModuleNotFoundError: No module named mistune'; num venv com mistune==3.3.4 o script roda.
- **Correção:** Trocar por 'uv run python scripts/build_dossie.py' e 'python -m http.server --directory docs/dossie'. Declarar mistune>=3.3 no pyproject. Remover a menção ao CSV.

### [baixa] `pr4-eng-12` — não verificado (baixa)

- **Arquivo:** scripts/coleta_comum.py
- **Problema:** eh_nacional e o comentário da linha 72 tratam o _BR como 'país todo' ou 'concatenação de todos', o que é falso: o _BR é só a circunscrição BR (presidente e vice). Há três regex para o mesmo conceito (_SUFIXO_UF, _RECORTE, _ANO_UF) e elas discordam: filtrar_uf(...,'BRASIL') exclui o _BR, eh_nacional inclui. Hoje não causa dano porque o coleta não extrai o _BR. Mas se eh_nacional for reaproveitado para carga, os registros de presidente entram duas vezes. O docstring de baixar_zip também diz '~6,7 GB só do nacional' para 2024.
- **Evidência:** consulta_cand_2022_BR.csv tem 30 linhas (Counter: ('BR','PRESIDENTE') 15, ('BR','VICE-PRESIDENTE') 15) contra 29.322 no consulta_cand_2022_BRASIL.csv. Código: `NACIONAIS = {"BRASIL", "BR"}`; docstring 'O arquivo cobre o país todo: tem sufixo _BRASIL/_BR'. Medição do _BRASIL 2024 nos zips: candidatos 5,47 GB + órgãos 0,39 GB = 5,86 GB (5,46 GiB), não 6,7 GB; o próprio estrategia.md do PR diz 5,5 GB.
- **Correção:** Usar NACIONAIS = {"BRASIL"} e tratar o BR como circunscrição. Centralizar o parse de recorte numa função só, usada por coleta e inspetor. Corrigir o número no docstring.

### [baixa] `pr4-eng-13` — não verificado (baixa)

- **Arquivo:** notebooks/
- **Problema:** Qualidade dos notebooks. Os 15 de visualização fazem LOAD encodings sem INSTALL, o que falha em ambiente novo. Todos usam ignore_errors=true, que descarta linhas em silêncio (o problema do fato 7). O hipotese_titulo_eleitoral.ipynb tem saída de erro commitada, todos os execution_count são None e não há célula de conclusão. O raw_prestacao_contas tem um comentário errado.
- **Evidência:** duckdb 1.5.5 com extension_directory vazio: `LOAD encodings` -> 'Extension ... not found. Install it first using "INSTALL encodings"'. hipotese_titulo_eleitoral.ipynb, célula 3: saída 'ERR NameError name 'con' is not defined'. raw_prestacao_contas.ipynb, célula 3: `con.sql("SELECT COUNT(*) FROM dados").df() #NUM DE COLUNAS` (retorna linhas: 118115). Nenhum notebook de visualização tem célula markdown.
- **Correção:** Usar 'INSTALL encodings; LOAD encodings;'. Na exploração, tirar o ignore_errors ou usar store_rejects para contar as linhas descartadas. No hipotese_titulo_eleitoral, acrescentar a conclusão com os números (7.972 comuns; 7.734 = 97,0% com o mesmo nome a menos de acento; 238 grafias diferentes; 39 nascimentos diferentes) e rodar de cima a baixo.

### [baixa] `pr4-eng-14` — não verificado (baixa)

- **Arquivo:** (histórico git)
- **Problema:** O PR #4 parte do 558c213, não do main atual, e traz o commit 206f969, que é o mesmo patch do 839cdb4 já no main mas com outro SHA. O merge é limpo, mas o histórico fica com o commit duplicado.
- **Evidência:** git merge-base origin/main origin/pr/4 = 558c213. `git range-diff 558c213..839cdb4 558c213..206f969` -> '1: 839cdb4 = 3: 206f969 fix(coleta): usa arquivos nacionais'.
- **Correção:** Rebasear o PR sobre origin/main (git rebase origin/main descarta o 206f969 automaticamente) antes do merge.


## PR #2 (Enrico) — staging SQL e Q10–Q12

Revisei o PR #2 (origin/pr/2, commit 12bf387): os 5 SQL, carregar_staging.py, der-enrico.md, q10/q11/q12 e README. Rodei os SQL no DuckDB 1.5.5 com cwd no worktree (prestação extraída só do PI) e todos rodam sem erro. Contagens e somas de stg_receita e stg_despesa batem centavo a centavo com contas feitas em Python csv direto nos arquivos, em todos os anos de 2014 a 2026. As tabelas numéricas de Q10, Q11 e Q12 se reproduzem. O FATO 10 está confirmado: com a extração nacional do main 839cdb4, os 6 globs acham 0 arquivos e o 01_staging falha. Mesmo corrigindo os globs, o latin-1 quebra nos arquivos nacionais e o ano sai NULL para os arquivos _brasil. Os demais problemas sólidos: (1) o staging descarta o doador originário, que existe no próprio arquivo de 2014/2016, e o tp_pessoa conta partido como PJ; (2) repasse de FEFC/FP entre candidatos é contado duas vezes como PÚBLICO; (3) a chave natural da CANDIDATURA não inclui o tipo de eleição, o que torna candidatura e mart_q12 não determinísticos; (4) os dados de 2026 são parciais e entram como se fossem completos; (5) o DER tem FKs que não apontam para chave e PARTIDO sem ano. Os docs têm ainda alguns números imprecisos.

**Conferido e correto:**

- Execução: 01_staging (1,0 s), 02 (1,3 s), 03 (1,6 s), 04 (102 s), 05 (1,3 s) rodam sem erro sobre a extração PI (script C:/Users/eduar/Downloads/rv/pr2/run/run_all.py, banco C:/Users/eduar/Downloads/rv/pr2/run/pr2.duckdb)
- stg_receita por ano (linhas / R$): 2014 12.150 / 61.658.390,92; 2016 65.744 / 73.818.559,69; 2018 7.414 / 65.479.849,88; 2020 42.417 / 93.762.161,64; 2022 4.398 / 128.768.753,54; 2024 30.862 / 144.212.856,09; 2026 2.410 / 132.280.000,68. São idênticos à contagem independente com Python csv+Decimal (run/indep.py). Total de 165.395, como diz o doc
- stg_despesa por ano: 2014 25.391; 2016 112.867; 2018 20.350; 2020 89.715; 2022 22.110; 2024 86.617; 2026 9.954 (total 367.004). Somas idênticas às do Python (ex.: 2016 R$77.899.355,81)
- Nenhum vr_receita/vr_despesa NULL após valor_br: valores como ',95' (2016) viram 0,95. Nenhum valor com ponto decimal ambíguo
- 0 receitas e 0 despesas órfãs em relação a candidatura. (ano, sq_candidato) é único em candidatura de 2014 em diante. Soma de mart_q10 por ano = soma de stg_receita (sem fan-out)
- Linhas por objeto: candidatura 2002 18.049 ... 2024 463.655, 2026 20.984. politico 1.856.216. mart_q10 PI: 403/10.202/439/10.702/433/8.978/402. fonte_recurso 25 pares. tipo_despesa 48 tipos canônicos
- Tabela da Q10 (PÚBLICO/PRIVADO/PRÓPRIO/PARTIDÁRIO/TRANSF. e % público 2,4 / 7,3 / 76,1 / 57,1 / 82,6 / 67,8 / 90,8) reproduzida exatamente com PIVOT sobre stg_receita_classificada
- 'NAO ESPECIFICADO' em 91% das receitas de 2014: 11.066/12.150 = 91,1%. PJ só aparece em 2014. As 14.925 linhas fora de PUB/PRIV/PROP conferem
- Q11 reproduzida: 367.004 despesas, 47,8% em propaganda, impressos 93.900 + 2.962 com prefixo (só 2014-2016), totais por canal (IMPRESSO 140,87 ... TELEMARKETING 0,07), tabela por ano, tabela por cargo e 4,11% × 4,97%
- Q12: 5.597 UEs / 8.070 pares (sg_ue, nm_ue). SQ_CANDIDATO=62 aparece em 4 anos com 2.004 títulos. Tabela (sq, turno) distintos 5.169/1.506/3.205/68.683/22.577/483.650. 12 pessoas nas 13 eleições. 2 pessoas com 11 siglas. 3,0% × 31,9%. A carreira PI mais longa (13 eleições, 11 partidos, 5 cargos, 0 eleita) se reproduz
- % sem título válido (critério do PR): 2002 1,76%, 2004 0,08%, 2012 0,23%, 2018 0,37%, 2024 0,01%, conforme o doc. A diferença para os 1,74% do FATO 1 vem só do critério
- FATO 2 consistente: 2004 tem 1.357 SQ distintos e 1.506 pares (sq, turno). O PR usa a segunda métrica
- CNAE: o leiaute antigo tem 7 dígitos (11.269 linhas) e o novo tem 5 (26.716 receitas / 148.435 despesas). A normalização para 5 dígitos está correta
- DuckDB recusa mesmo latin-1 nos consulta_cand de 2008 e 2016 ('File is not latin-1 encoded'), como afirma o 04. Os arquivos _PI da prestação não têm bytes 0x80-0x9F, então o latin-1 do 01 funciona na extração PI
- 2018+: cada candidato tem um único TP_PRESTACAO_CONTAS por ano, logo não há dupla contagem entre PARCIAL/FINAL/RELATÓRIO. SQ_RECEITA repetido são itens distintos do mesmo recibo, não duplicatas
- git merge-tree origin/main origin/pr/2 sem conflito textual. O Mermaid do der-enrico.md renderiza no Mermaid 11 (Edge headless: 'OK svg_len=174962')

**Achados:**

### [alta] `pr2-staging-01` — confirmado

- **Arquivo:** sql/01_staging.sql
- **Problema:** FATO 10 confirmado e ampliado. Com a extração nacional do main 839cdb4 (manter_uf=NACIONAL), nenhum dos 6 globs acha arquivo e o CREATE VIEW falha. Mesmo trocando os globs, há mais dois problemas. O ano do leiaute antigo sai do nome do arquivo com '_(\d{4})_[A-Z]{2}\.txt$' e vira NULL em '_brasil.txt'. E o encoding='latin-1' é recusado pelo DuckDB nos arquivos nacionais que têm bytes 0x80-0x9F. O README e o 05 ainda dizem 'prestação só PI'.
- **Evidência:** Montei a árvore nacional aplicando o filtrar_uf(...,'BRASIL') do origin/main aos .zip, com 500 linhas por arquivo (C:/Users/eduar/Downloads/rv/pr2/run/mk_nac.py e run_nac.py). Resultado: '01_staging ERRO: IO Error: No files found that match the pattern "dados/raw/prestacao_contas/2014/*/receitas_candidatos_????_??.txt"'. glob() devolve 0 para os 6 padrões. A regex do ano dá (2014,) para receitas_candidatos_2014_PI.txt e (None,) para receitas_candidatos_2014_brasil.txt. Varredura dos zips (run/scan_nac.py): 0x81 x21 nos dois arquivos de 2016, 0x9d em despesas_contratadas_2020, 0x83 em receitas_2022, 0x83/0x87 em despesas_2024, 0x8d/0x8b/0x92... em despesas_2026. Lendo a amostra nacional de receitas 2022: latin-1 -> 'Invalid Input Error: File is not latin-1 encoded'; cp1252 -> 500/500. Na amostra de 2016 com 0x81 (21 linhas), tanto latin-1 quanto cp1252 estrito dão erro.
- **Correção:** (a) Globs: trocar ????_??.txt por ????_brasil.txt e ????_??.csv por ????_BRASIL.csv. Uma alternativa é *_[bB][rR][aA][sS][iI][lL].*, que não depende de maiúsculas.

(b) Ano do leiaute antigo: não existe AA_ELEICAO, e 'Cód. Eleição' (143/220) não é ano. Usar regexp_extract(filename, '_(\d{4})_[A-Za-z]+\.txt$', 1) (testado: dá 2014 a 2026 certos) ou regexp_extract("Desc. Eleição", '(\d{4})', 1). Ver também o ponto (d).

(c) Encoding: NÃO usar store_rejects nem ignore_errors como solução. No DuckDB 1.5.5, os bytes indefinidos em DS_DESPESA (2020 e 2026) causam INTERNAL Error (store_rejects) ou somem com a linha em silêncio (ignore_errors). Além disso, no receitas 2014 esses modos descartariam as 11.734 linhas (R$206 mi) do FATO 7. O caminho é pré-limpar na coleta ou num passo de preparação: decodificar em cp1252 com errors='replace', ou trocar os bytes 0x81/0x8d/0x8f/0x90/0x9d por espaço. Isso deve vir junto da correção das aspas do receitas_candidatos_2014_brasil.txt. Depois ler com encoding='cp1252' em modo estrito, ou gravar tudo em UTF-8 e ler sem o parâmetro de encoding.

(d) Expor no staging a UF ("UF" no leiaute antigo, SG_UF no novo) e o código de eleição (CD_ELEICAO / "Cód. Eleição"), para filtrar suplementares (FATO 4). Filtrar o PI também no mart_q11 e no mart_q11_texto: hoje só o mart_q10 filtra, via candidatura.

(e) Atualizar o comentário das linhas 6-8 do 05_marts_enrico.sql. A linha 68 do README ('só PI') já está errada no próprio main desde o 839cdb4: a correção cabe a quem mudou a coleta (Davi), ou pode entrar no PR #2 como ajuste de rebase, mas não é defeito introduzido pelo PR #2.
- **Verificação:** Reproduzi tudo de forma independente, com scripts próprios em C:/Users/eduar/Downloads/rv/cet-pr2st01/ (não reutilizei os do revisor). Usei DuckDB 1.5.5 e o sql/01_staging.sql lido de origin/pr/2 (commit 12bf387, base 7ea58fc, anterior ao 839cdb4).

1) Globs. Copiei a regex _SUFIXO_UF e filtrar_uf(...,'BRASIL') de origin/main:scripts/coleta_comum.py e apliquei aos .zip (listnac.py e mktree.py). Montei a árvore nacional com 300 linhas por arquivo. Os 6 globs acham 0 arquivos, tanto na simulação quanto com glob() do DuckDB. Na árvore local atual, que tem extração PI, os mesmos globs acham 1, 1, 5, 1, 1 e 5 arquivos. Rodando o 01_staging (run.py), o erro sai exatamente como o revisor relatou: 'IO Error: No files found that match the pattern "dados/raw/prestacao_contas/2014/*/receitas_candidatos_????_??.txt"'.

2) Ano. regexp_extract('_(\d{4})_[A-Z]{2}\.txt$') devolve '2014' para ..._2014_PI.txt e '' para ..._2014_brasil.txt e ..._2016_brasil.txt; o TRY_CAST transforma '' em NULL. Troquei só os globs para _brasil/_BRASIL (01_staging_soglob.sql). A view passa a rodar, mas stg_receita e stg_despesa ficam com (None, 600): todas as linhas de 2014 e 2016 com ano NULL. Consequência: o JOIN do mart_q10 e do mart_q11 por c.ano = r.ano descarta 2014 e 2016 inteiros.

3) Encoding. Varri os 14 arquivos nacionais inteiros (scanbytes.py) e o resultado bate 100% com o scan_nac.log do revisor:
- 2016: 0x81 em 21 linhas no arquivo de receitas e 21 no de despesas;
- 2020 despesas: 0x9d em 1 linha;
- 2022 receitas: 0x83 em 1 linha;
- 2024 despesas: 0x83 x3 e 0x87 x4;
- 2026 despesas: 0x8b/0x8d/0x92 x15, mais 0x80, 0x88, 0x87, 0x9a e 0x9b;
- 2014 e 2018 não têm nenhum.
Os 14 arquivos _PI têm 0 bytes nessa faixa, então o problema só aparece com a extração nacional.

Com um CSV mínimo, o latin-1 do DuckDB recusa 0x81, 0x83 e 0x9d ('File is not latin-1 encoded'). O cp1252 estrito aceita 0x83 e recusa 0x81 e 0x9d, que são indefinidos no cp1252. Em linhas reais:
- 2016 (as 21 linhas com 0x81, no campo 'Nome candidato'): latin-1 dá erro mesmo com count(*) ou com uma única coluna projetada, porque o erro é no arquivo inteiro; cp1252 estrito dá 'CSV Error on Line: 2';
- 2022 (DS_RECEITA): latin-1 dá erro, cp1252 lê 1/1.

4) README e 05. origin/pr/2:sql/05_marts_enrico.sql, linhas 6-7, diz 'a prestação de contas foi baixada só do Piauí'. README.md linha 68 diz '| prestacao_contas, eleitorado, abstencao | só PI |'. Porém essa linha do README já está em origin/main e o diff main..pr/2 não mexe nela. É um resíduo do commit 839cdb4 do Davi, que mudou a coleta sem atualizar o README, e não algo que o PR #2 introduziu. O mart_q10 já filtra c.sg_uf = 'PI' via candidatura; mart_q11 e mart_q11_texto não filtram UF.

5) A correção sugerida não é segura.
- A linha real de 2020 tem 0x9d em DS_DESPESA, coluna que o stg_despesa projeta. As 15 linhas de 2026 também têm o byte em DS_DESPESA. Com cp1252 + store_rejects=true, count(*) funciona, mas projetar DS_DESPESA dá 'INTERNAL Error: Attempted to access index 51 within vector of size 1'. Em outro teste, o mesmo tipo de erro invalidou a conexão ('database has been invalidated').
- Com ignore_errors=true, count(*) devolve 1, mas SELECT DS_DESPESA devolve 0 linhas: a linha some em silêncio.
- A sugestão de usar AA_ELEICAO ou 'Cód. Eleição' também não serve: o leiaute antigo não tem AA_ELEICAO, e 'Cód. Eleição' vale 143 e 220, que são códigos de eleição e não o ano.
- Montei uma versão corrigida (01_staging_fix.sql) com globs _brasil/_BRASIL, ano por '_(\d{4})_[A-Za-z]+\.txt$' e cp1252. Na amostra nacional, os anos 2014 a 2026 saem com 300 linhas cada, em receitas e em despesas.

Ressalva: baixar_zip() não reextrai se a pasta já existe (a menos que se use --force). Quem já tem a extração PI continua rodando, e a falha aparece em coleta nova ou com --force. Isso não reduz a severidade: o estado depois do merge não funciona para quem coleta do zero.

### [alta] `pr2-staging-02` — confirmado

- **Arquivo:** sql/01_staging.sql
- **Problema:** stg_receita descarta o doador originário, embora ele esteja no próprio arquivo de 2014/2016 (colunas 'CPF/CNPJ do doador originário', 'Tipo doador originário', 'Setor econômico do doador originário'). Também não carrega SQ_RECEITA, que é a chave para ligar o arquivo receitas_candidatos_doador_originario de 2018+. O q10-publico-privado.md afirma que no caixa do partido 'O TSE não diz qual' é a origem e que o doador originário só existe em 2018+. Em 2014 isso é falso: quase todo o PARTIDÁRIO do PI é dinheiro de empresa (FATO 8).
- **Evidência:** Leitura de receitas_candidatos_2014_PI.txt. Na linha 'Outros Recursos nao descritos' + 'Recursos de partido político', Tipo doador originário J = 385 linhas / R$16.483.129,50, de um PARTIDÁRIO 2014 de R$16,75 mi (98,4%). Em 'Recursos de outros candidatos/comitês', J = 131 linhas / R$3.348.920,34, de uma TRANSFERÊNCIA de R$4,92 mi. Ao todo são R$19,83 mi de empresa fora da coluna PRIVADO (31,41 mi) na tabela de 2014. DESCRIBE do arquivo 2016: as colunas 30-34 são as do doador originário. O cabeçalho de receitas_candidatos_doador_originario_2024_PI.csv tem SQ_RECEITA, e stg_receita não tem essa coluna.
- **Correção:** (a) stg_receita: acrescentar sq_receita (vem de SQ_RECEITA em 2018+ e fica NULL em 2014/2016). Para 2014/2016, acrescentar as colunas que já estão no arquivo: cpf_cnpj_doador_originario, via documento("CPF/CNPJ do doador originário"); tp_doador_originario, que vale F ou J; ds_setor_doador_originario. Em 2014/2016 não existe código CNAE do originário. Quem precisar do código pode derivá-lo do texto do setor, casando com o par 'Cod setor econômico do doador' / 'Setor econômico do doador' do mesmo arquivo. Na montagem de empresa x organização política, tratar como ORG_POLITICA o originário J cujo setor é 'Atividades de organizações políticas': em 2014 no PI são R$ 28 mil.

(b) 2018+: não fazer LEFT JOIN do originário dentro do stg_receita, porque a relação é 1:N. Criar uma view à parte, stg_receita_originario, com sq_receita, sq_prestador_contas, cpf_cnpj_doador_originario, tp_doador_originario, cd_cnae_doador_originario, ds_cnae_doador_originario e vr_receita_originario. Filtrar SQ_RECEITA <> '-1' e as linhas sentinela ('#NULO', 0,00). Somar sempre pelo valor do próprio originário, nunca por r.VR_RECEITA depois da junção (a soma ingênua infla 2022 em R$ 847 mil). Para ter o mesmo formato nos dois leiautes, dá para gerar essa view também para 2014/2016 a partir das colunas inline, ficando uma linha por receita.

(c) q10-publico-privado.md e o comentário ④ de 02_fonte_recurso.sql: trocar 'O TSE não diz qual' por uma abertura do PARTIDÁRIO e da TRANSFERÊNCIA pelo tipo do doador originário. Em 2014, R$ 16,48 mi do PARTIDÁRIO (98,4%) e R$ 3,32 mi da TRANSFERÊNCIA têm empresa como originária. Em 2016, 50% do PARTIDÁRIO tem pessoa física como originária. Deixar explícito que o % público não muda e que a mudança está na coluna PRIVADO. Cuidado para não contar duas vezes: a receita com originário na TRANSFERÊNCIA pode já ter sido contada na receita do candidato ou comitê doador, por isso a reclassificação deve ser mostrada como abertura, não somada no total do estado.
- **Verificação:** Os números do achado se reproduzem. Rodei tudo com DuckDB, em modo estrito e sem ignore_errors; os scripts estão em C:/Users/eduar/Downloads/rv/cetico02/q1.py a q8.py.

(1) Contrato do stg_receita. Li `git show origin/pr/2:sql/01_staging.sql`. As duas gerações (antiga e nova) devolvem só estas colunas: sq_candidato, ano, dt, vr_receita, cpf_cnpj_doador, tp_pessoa, cd_cnae_doador, ds_fonte, ds_origem, ds_natureza. Não há doador originário e não há SQ_RECEITA, em nenhuma das duas. O `git grep -i originar origin/pr/2 -- sql docs` só acha o docs/esquemas.md.

(2) Colunas nos arquivos. O DESCRIBE de receitas_candidatos_2014_PI.txt (12.150 linhas) mostra, contando a partir de 1: col 28 'CPF/CNPJ do doador originário', 29 'Nome', 30 'Tipo doador originário', 31 'Setor econômico do doador originário', 32 'Nome (Receita Federal)'. No arquivo de 2016 (65.744 linhas) são as colunas 31 a 35, que dão 30 a 34 se contadas a partir de 0. Em 2014 e 2016 não existe código CNAE do originário, só o texto do setor.

(3) Agrupamento de 2014 por (Tipo receita, Fonte, Tipo doador originário):
- RECURSOS DE PARTIDO POLITICO + OUTROS RECURSOS NAO DESCRITOS: J = 385 linhas / R$ 16.483.129,50; F = 45 / R$ 18.773,60; #NULO = 78 / R$ 248.610,01. O PARTIDÁRIO soma R$ 16.750.513,11 (o 16,75 do q10), e J é 98,4% dele.
- RECURSOS DE OUTROS CANDIDATOS/COMITES sem Fundo Partidário: J = 131 / R$ 3.348.920,34, dentro de um TRANSFERÊNCIA de R$ 4.917.109,32 (o 4,92 do q10).
- PRIVADO = PF 15,70 mi + PJ 15,71 mi = 31,41 mi, igual à tabela do q10.

(4) Pequeno exagero no valor atribuído a empresa. Filtrei o setor 'Atividades de organizações políticas'. Dos J em transferência, 8 linhas / R$ 28.085,79 são direções partidárias (Direção Estadual, PRB, PTB). O que é de fato empresa soma R$ 19,80 mi (16,48 + 3,32), não 19,83. No partido, os 385 J são todos empresas: JBS R$ 2,38 mi, Cervejaria Petrópolis R$ 2,32 mi, OAS, Andrade Gutierrez e outras.

(5) Em 2016 o TSE também informa o originário. É sempre F, porque doação de empresa já estava proibida. No PARTIDÁRIO de 2016, F = R$ 346.159,67 de R$ 689.722,15 (50%). Na TRANSFERÊNCIA, F = R$ 564.765,69 de R$ 1,40 mi.

(6) O que o q10 diz. `git show origin/pr/2:docs/q10-publico-privado.md` e o comentário da regra ④ em 02_fonte_recurso.sql dizem que o caixa do partido 'mistura doação privada com sobra de fundo. O TSE não diz qual'. A seção de limitações cita só o arquivo doador_originario '(2018+)' e o deixa 'fora do escopo atual'. A limitação é declarada, mas a frase é falsa para 2014 e para 2016.

(7) Impacto. O % público da Q10 (2,4% em 2014, 90,8% em 2026) não muda, porque a reclassificação só move dinheiro entre PARTIDÁRIO e PRIVADO. Muda a coluna PRIVADO de 2014: de 31,41 mi para cerca de 51,2 mi. Muda também a Q8 da Duda, que o próprio 01_staging.sql lista como consumidora. A Q8 é 'dinheiro de empresa em 2014', e o docs/der-duda.md (linhas 199 e 243-244) exige o originário.

(8) Problema na correção proposta: juntar só por SQ_RECEITA infla valores.
- SQ_RECEITA não é único. Receitas 2018: 7.414 linhas para 7.255 valores; receitas 2024: 30.862 para 29.372.
- O sentinela '-1' aparece em 334 de 537 linhas do originário 2018 e em 8.382 de 8.605 em 2024.
- Uma receita pode ter vários originários: SQ_RECEITA 32915827, de 2022, tem 53.
- Fiz um LEFT JOIN ingênuo em 2022 e somei r.VR_RECEITA. A receita de partido subiu de R$ 110.200.580,97 para R$ 111.047.580,97, ou seja, R$ 847 mil a mais.
- Tirando os '-1', todo SQ_RECEITA do originário casa com o arquivo de receitas (2018-2026, 100%).

Veredito: o achado está confirmado no mérito. Três ajustes menores: são 19,80 mi de empresa, não 19,83; em 2014 e 2016 não há CNAE do originário, só o texto do setor; a junção de 2018+ não é 1:1.

### [media] `pr2-staging-03` — parcial

- **Arquivo:** sql/01_staging.sql
- **Problema:** tp_pessoa é derivado só do número de dígitos, então partido, comitê e outros candidatos (todos com CNPJ) viram 'PJ'. Quem usar tp_pessoa='PJ' como 'doação de empresa' (Q8 da Duda, Q1/Q2) superestima cerca de 30 vezes. A nota 4 do der-enrico.md ('tp_pessoa sai do tamanho') não traz esse alerta.
- **Evidência:** SELECT tp_pessoa, ds_origem, count(*), sum(vr_receita) FROM stg_receita WHERE tp_pessoa='PJ' GROUP BY ALL: PARTIDO POLITICO 18.858 linhas / R$447,95 mi (16.061 com CNAE 94928); OUTROS CANDIDATOS 17.725 / R$15,07 mi; OUTROS CANDIDATOS/COMITES 522 / R$4,93 mi; PESSOAS JURIDICAS (empresa de fato) só 740 / R$15,71 mi; FINANCIAMENTO COLETIVO 141 / R$0,19 mi.
- **Correção:** 1) Em sql/01_staging.sql (PR #2), criar tp_doador a partir de ds_origem, que é o critério principal:
- PESSOAS FISICAS → PF
- RECURSOS PROPRIOS → PROPRIO (hoje cai em PF)
- PESSOAS JURIDICAS → EMPRESA
- PARTIDO POLITICO → PARTIDO
- OUTROS CANDIDATOS e OUTROS CANDIDATOS/COMITES → CANDIDATO_COMITE
- FINANCIAMENTO COLETIVO e DOACOES PELA INTERNET → CROWDFUNDING
- ORIGENS NAO IDENTIFICADAS, RENDIMENTOS e COMERCIALIZACAO → OUTROS

2) Usar o CNAE 94928 só como checagem de divergência: gravar uma flag quando origem EMPRESA vier com CNAE 94928, ou origem PARTIDO vier com outro CNAE. Não usar o CNAE como critério sozinho: em 2016 ele rotularia R$6 mi de diretórios partidários como empresa.

3) Se tp_pessoa continuar existindo, renomear para tp_documento (CPF/CNPJ).

4) Corrigir a documentação: docs/der.md (linha 248, `"PF ou PJ - chave da Q8"`, e linha 380, `tp_pessoa = PJ`) e as notas 4 e 5 do der-enrico.md. Elas devem dizer que PJ ≠ empresa e que a chave da Q8 é tp_doador='EMPRESA'. A Q8 também precisa do doador originário (R$1,77 bi em 2014 passaram por partido), que falta em stg_receita; isso é um achado separado.

5) Tirar Q1/Q2 da lista de impacto (elas usam despesa). Trocar o "30x" pelos números do escopo da Q8: cerca de 2,7x em 2014 (nacional: R$3,52 bi contra R$1,30 bi); em 2016, R$569 mi de "PJ" contra zero de empresa.
- **Verificação:** 1) CÓDIGO CONFIRMADO. `git show origin/pr/2:sql/01_staging.sql`, linhas 45-46: `CREATE OR REPLACE MACRO tipo_pessoa(x) AS CASE length(documento(x)) WHEN 11 THEN 'PF' WHEN 14 THEN 'PJ' END;`. Ela é aplicada nas duas gerações (linhas 81 e 97). Em der-enrico.md, a nota 4 (linha 147) e a tabela 5 (linha 161) só dizem "tamanho do CPF/CNPJ", sem avisar que PJ não significa empresa.

2) NÚMEROS REPRODUZIDOS EXATAMENTE. Rodei o 01_staging.sql do PR #2 via duckdb, a partir da raiz do worktree (extração PI, 2014-2026). Script: C:/Users/eduar/Downloads/rv/cet03/run.py. Resultado de tp_pessoa='PJ' por ds_origem:
- RECURSOS DE PARTIDO POLITICO: 18.858 linhas / R$447,95 mi (16.061 com CNAE 94928)
- RECURSOS DE PESSOAS JURIDICAS: 740 / R$15,71 mi (5 com CNAE 94928)
- RECURSOS DE OUTROS CANDIDATOS: 17.725 / R$15,07 mi (17.714 com 94928)
- RECURSOS DE OUTROS CANDIDATOS/COMITES: 522 / R$4,93 mi
- RECURSOS DE FINANCIAMENTO COLETIVO: 141 / R$0,19 mi
Os rótulos reais têm o prefixo "RECURSOS DE"; o achado omitiu, o que é só cosmético.

3) O "30 VEZES" ESTÁ MAL ENQUADRADO. Ele sai de 483,85/15,71 = 30,8, ou seja, soma 2014 a 2026. Só que doação de empresa só existe em 2014. Por ano, na extração PI (run2.py), comparando PJ por tamanho com origem PJ:
- 2014: 38,87 contra 15,71, razão 2,47x
- 2016: 7,49 contra 0
- 2018 a 2026: 51 a 122 mi por ano contra 0
Na escala nacional, com os arquivos corrigidos do scratchpad (run3.py):
- 2014: total R$4.391,58 mi. PJ por tamanho dá R$3.520,45 mi (80%), contra R$1.299,40 mi de origem PESSOAS JURIDICAS. Razão 2,71x. PJ com CNAE 94928 soma R$2.210,13 mi, o que bate com o fato 8.
- 2016: total R$2.995,20 mi. PJ por tamanho dá R$568,97 mi (19%), contra zero de origem PJ (e R$6,16 mi de CNPJ fora do CNAE 94928).
Na Q8 o erro real é de cerca de 2,7x em 2014. Em 2016, que é o ano-marco, ele inventa R$569 mi de "PJ", e isso distorce justamente a conclusão sobre o efeito da ADI 4650. O problema é real, mas o número "30x" não descreve o escopo da Q8.

4) Q1/Q2 NÃO SÃO AFETADAS. As duas usam DESPESA_CAMPANHA: `git show origin/main:docs/der.md`, linhas da tabela 1 e 2, e estrategia.md, linhas 80-81 ("despesas de campanha ÷ vagas"; "despesa por candidatura"). E tp_pessoa só existe em stg_receita; stg_despesa não tem essa coluna.

5) O RISCO É CONCRETO, NÃO HIPOTÉTICO, e o achado não mencionou isso. O DER compartilhado manda usar tp_pessoa=PJ na Q8. Em origin/main:docs/der.md (igual em pr/2, pr/3 e pr/4):
- linha 248: `char tp_pessoa "PF ou PJ - chave da Q8"`
- linha 380: `| 8 | PJ × viés (doação) | ... AGENTE_FINANCEIRO (tp_pessoa = PJ) ...`
O PR #2 implementa exatamente isso sem aviso. O der-duda.md do working copy já corrige: linha 111, tp_agente "PF, EMPRESA ou ORG_POLITICA"; linhas 198 e 307.

6) SÓ O CNAE TAMBÉM NÃO BASTA (run4.py, nacional):
- 2016: os R$6,16 mi de CNPJ fora do 94928 estão todos em ds_origem RECURSOS DE PARTIDO POLITICO (R$6,04 mi, 4.537 linhas) e OUTROS CANDIDATOS (R$0,11 mi). São diretórios partidários com outro CNAE, não empresas. Isso relativiza o "R$6,2 mi de empresa em 2016" do fato 8 e do der-duda.md.
- 2014: 2.709 linhas / R$12,39 mi têm origem PESSOAS JURIDICAS com CNAE 94928, e 852 linhas / R$23,02 mi têm origem PARTIDO com CNAE diferente.
Portanto a classificação deve partir de ds_origem, com o CNAE como checagem, como a correção original propõe.

7) EXTRA: tp_pessoa='PF' também mistura doação de pessoa física com RECURSOS PROPRIOS do candidato. Na extração PI são 39.604 linhas / R$70,73 mi.

### [media] `pr2-cand-05` — confirmado

- **Arquivo:** sql/04_politico.sql
- **Problema:** A chave natural anunciada, (ano, sg_ue, cd_cargo, nr_turno, sq_candidato), não é única: em 2004 a eleição ordinária e a suplementar do mesmo município repetem SQ_CANDIDATO. O row_number que ordena só por nr_turno escolhe uma das linhas ao acaso, e às vezes descarta o prefeito ELEITO. O mart_q12 também desempata sem critério total (ORDER BY fl_eleito DESC, cd_cargo). Resultado: candidatura, politico e mart_q12 não são determinísticos, e os números dos docs (1.856.217 / 599.547 / 170.375) não se reproduzem exatamente. Além disso, o 01 promete 'sem _sup', mas o arquivo novo de 2020 do PI traz eleição suplementar.
- **Evidência:** Em stg_candidatura, GROUP BY ano, sg_ue, cd_cargo, nr_turno, sq_candidato HAVING count(*)>1 dá 22 grupos em 2004 (44 linhas, 35 títulos). Exemplo: SG_UE 10596 (Cristalândia do Piauí-PI), prefeito, SQ=1: CD_ELEICAO 200412 'ELEITO' (título 025731911520) × 610596 'Suplementar' (016493981520). Recriei candidatura 6 vezes (run/nondet.py): títulos distintos 1.856.215/215/216/215/214/216, e o prefeito eleito sobrevive só em 2 das 6 rodadas. Rodei mart_q12 5 vezes no mesmo banco read-only: reincidentes com qt_partidos=1 = 170.378/170.385/170.386/170.389/170.377. Há 4.280 pares (pessoa, ano) empatados no rank 1, 675 deles com partidos diferentes. Com CD_TIPO_ELEICAO na chave, sobram 0 duplicatas em todos os anos. Receitas 2020 PI têm NM_TIPO_ELEICAO='SUPLEMENTAR' em 97 linhas / 28 candidatos / R$0,208 mi.
- **Correção:** 1) Incluir cd_tipo_eleicao em stg_candidatura, no PARTITION BY de candidatura e na chave natural do DER/nota 2 do der-enrico.md: (ano, cd_tipo_eleicao, sg_ue, cd_cargo, sq_candidato), com nr_turno usado só para escolher a linha final. Outra saída é filtrar cd_tipo_eleicao='2' (ordinária). Não usar CD_ELEICAO cru, porque ele muda entre turnos (FATO 4). Em qualquer caso, fechar o ORDER BY do row_number com uma coluna única (ex.: nr_turno DESC, cd_tipo_eleicao DESC, nr_titulo_eleitoral).

2) No detalhe do mart_q12, o desempate precisa fazer sentido, e não só ser total. A maioria dos empates (3.622 de 4.281) é da mesma eleição, com um registro INAPTO seguido de um novo registro. Sugestão: ORDER BY fl_eleito DESC, (ds_situacao_candidatura = 'APTO') DESC, (cd_tipo_eleicao = '2') DESC, cd_cargo, sq_candidato DESC. Avaliar também tirar os INAPTO da contagem de qt_partidos/qt_eleicoes, ou pelo menos documentar que entram.

3) Decidir explicitamente se suplementares entram, de forma igual no consulta_cand e na prestação de contas (as duas gerações de leiaute), e corrigir o comentário "sem _sup" do 01: as suplementares estão dentro dos arquivos, e não em arquivos separados.

4) Recalcular 1.856.217 / 599.547 / 170.375 (q12-linha-do-tempo.md e README) depois de tornar a pipeline determinística. Hoje esses números oscilam entre execuções.
- **Verificação:** Refiz tudo em C:/Users/eduar/Downloads/rv/cetico-pr2-05/. Usei o SQL de origin/pr/2 (macros do 01 e o 04/05 copiados sem mudar a lógica; em stg_candidatura só acrescentei cd_eleicao, ds_eleicao, cd_tipo_eleicao, nm_tipo_eleicao e filename para diagnóstico). Scripts: build.py, q1.py, nondet.py e q12tie.py.

1) A chave natural não é única. docs/der-enrico.md (nota 2) e sql/04_politico.sql dizem que (ano, sg_ue, cd_cargo, nr_turno, sq_candidato) "vale em TODOS os anos". Com GROUP BY nessa chave e HAVING count(*)>1 sobre stg_candidatura (2.954.875 linhas), encontrei 22 grupos e 44 linhas, todos em 2004, com 34 títulos distintos (35 é a soma por grupo; é daí que vem o número do revisor). Cada grupo junta 1 linha de CD_ELEICAO 200412 (ELEIÇÃO ORDINÁRIA) com 1 linha de uma suplementar: Boca do Acre-AM, Iaras-SP, Cristalândia do Piauí-PI e outras, 12 CD_ELEICAO diferentes. O exemplo se confirma: SG_UE 10596, prefeito, SQ=1, 200412 'ELEITO' com título 025731911520 contra 610596 'NÃO ELEITO' com título 016493981520. Com cd_tipo_eleicao na chave, sobram 0 grupos duplicados em todos os anos.

2) candidatura e politico não são determinísticos. A PARTITION BY (ano, sg_ue, cd_cargo, sq_candidato) com ORDER BY nr_turno DESC empata nessas 22 partições. Recriei candidatura e politico 6 vezes (12 threads):
- títulos/politico: 1.856.214, 217, 216, 218, 216, 217;
- o prefeito eleito de Cristalândia sumiu em 1 das 6 rodadas (o revisor viu sumir em 4 de 6; é aleatório, então as duas observações são compatíveis);
- prefeitos eleitos em 2004: de 5.576 a 5.579.

3) mart_q12 também não é determinístico. ORDER BY fl_eleito DESC, cd_cargo deixa 4.281 pares (pessoa, ano) empatados no rank 1 (o revisor mediu 4.280; o número varia com a candidatura sorteada). Em 675 desses pares os partidos são diferentes. Com candidatura fixa, rodei o mart 5 vezes: reincidentes com qt_partidos=1 deram 170.378, 376, 373, 378 e 382. O dado novo é a origem dos empates. Só 659 dos 4.281 misturam eleição ordinária com suplementar. Os outros 3.622 vêm da mesma eleição e do mesmo cargo, com dois SQ: um registro INAPTO e um novo registro, muitas vezes por outro partido. Exemplo de 2020, SG_UE 12017: PT INAPTO × DEM APTO. Linhas nos empates de mesmo tipo: INAPTO 3.663, APTO 3.114, #NE 517. Ou seja, parte da contagem de partidos vem de registros que não chegaram à urna.

4) Números dos docs (q12-linha-do-tempo.md e README). Nas minhas 11 rodadas, 1.856.217 saiu em 2 das 6 reconstruções e 599.547 em 2 das 6 (faixa de 599.546 a 599.549). 170.375 não saiu nenhuma vez (faixa de 170.373 a 170.387). Os números estão dentro do ruído, mas não são reproduzíveis de forma estável. O impacto é pequeno: poucas pessoas em 1,8 milhão.

5) A promessa "sem _sup" do 01 não vale. prestacao_contas/2020/.../receitas_candidatos_2020_PI.csv tem CD_TIPO_ELEICAO=1 'SUPLEMENTAR' em 97 linhas, 28 candidatos e R$0,208 mi (CD_ELEICAO 531, 550, 606, 621 e 622, no Piauí), contra 42.320 linhas ordinárias. O zip de 2020 não tem nenhum arquivo *_sup*: as suplementares vêm misturadas dentro do arquivo da UF/BRASIL.

Severidade: mantenho média. O impacto numérico é mínimo, mas a chave declarada no DER é falsa e os entregáveis não se reproduzem.

### [media] `pr2-docs-06` — parcial

- **Arquivo:** docs/q10-publico-privado.md
- **Problema:** 2026 é um retrato parcial, tirado antes da eleição, mas é tratado como ano completo. A manchete 'passou de 2,4% público em 2014 para 90,8% em 2026' e 'receita de 2026 é o dobro da de 2014' usam prestação PARCIAL. fl_eleito é FALSE para todas as candidaturas de 2026, o que contamina as comparações entre eleito e não eleito da Q10 e da Q11 e a frase da Q12 'sem nunca ter sido eleita'.
- **Evidência:** receitas_candidatos_2026_PI.csv: DT_GERACAO = 20/09/2026. TP_PRESTACAO_CONTAS de 2026 só tem PARCIAL (1.321 linhas / R$105,90 mi) e RELATÓRIO FINANCEIRO (1.089 / R$26,38 mi), sem FINAL. consulta_cand_2026: DS_SIT_TOT_TURNO NULL em 20.984/20.984 linhas, e mart_q10 2026 tem 0 eleitos em 402. No q11, digital entre não eleitos 2018-2026 = 4,97%; sem 2026 (2018-2024) = 4,53% (eleitos 4,11% nos dois cortes).
- **Correção:** 1) Na Q10 e na Q11, marcar 2026 como PARCIAL em tabelas e gráficos. Anotar a fonte: DT_GERACAO 20/09/2026, TP_PRESTACAO_CONTAS = PARCIAL/RELATÓRIO FINANCEIRO, 335 de 402 candidatos do PI com receita. Trocar a manchete para '2,4% em 2014 → 82,6% em 2022 (2026, parcial: 90,8%)'. Reescrever o 'dobro' como 'já 2,15x a de 2014 com a prestação parcial'. Nos marts, expor tp_prestacao_contas ou uma coluna fl_parcial.
2) fl_eleito: deixar NULL só quando a eleição ainda não teve resultado, e não sempre que ds_sit_tot_turno for NULL. Por exemplo: CASE WHEN ano não tem nenhum ds_sit_tot_turno preenchido (hoje, 2026) THEN NULL ELSE <regra atual> END. Candidatura INAPTO ou #NE dos anos já decididos continua FALSE.
3) Na Q11, calcular a comparação eleito × não eleito só com 2018-2024 (4,53% contra 4,11%) e trocar o texto '4,97%'. O sentido da conclusão se mantém. Na tabela por cargo (2018-2026) e na de 2026 (6,0% digital), avisar que 2026 é parcial.
4) Na Q12, nenhum número muda (3,0% / 32,0% sem 2026). Basta dizer 'sem ter sido eleita em nenhuma das 12 eleições já apuradas (2026 em aberto)'.
- **Verificação:** Rodei o pipeline do PR #2 de novo, do zero: os arquivos sql/01..05 exportados de origin/pr/2, executados na ordem pelo carregar_staging.py sobre a extração local do PI. Pasta de trabalho: C:/Users/eduar/Downloads/rv/cetico06, com uma junction dados/raw apontando para os dados. Banco: C:/Users/eduar/Downloads/rv/cetico06/tse.duckdb. Scripts: q.py, run/q2.py, q3.py, run/q4.py e run/q5.py, na mesma pasta.

O QUE SE CONFIRMA:
(1) receitas_candidatos_2026_PI.csv: DT_GERACAO = '20/09/2026' em 2.410 de 2.410 linhas. TP_PRESTACAO_CONTAS só tem PARCIAL (1.321 linhas, R$ 105.897.789,94) e RELATÓRIO FINANCEIRO (1.089 linhas, R$ 26.382.210,74). Não há FINAL. DT_PRESTACAO_CONTAS vai de 09/09 a 19/09/2026, antes da eleição. Só 335 (277+58) dos 402 candidatos do PI têm alguma receita. Nos anos 2018-2024 o FINAL domina: 2022 tem 4.359 linhas FINAL e R$ 127,81 mi. Verifiquei também se há dupla contagem entre PARCIAL e RELATÓRIO: nenhum SQ_RECEITA nem candidato aparece nos dois tipos.
(2) consulta_cand_2026_BRASIL.csv: DS_SIT_TOT_TURNO = '#NULO' (CD = -1) em 20.984 de 20.984 linhas. Pela fórmula de sql/04_politico.sql, coalesce(limpa(...), '') IN (...), isso vira fl_eleito = FALSE. O mart_q10 de 2026 tem 402 linhas, 0 eleitos e 0 ds_sit_tot_turno preenchidos.
(3) A tabela da Q10 reproduz exatamente: 2014 = 2,4% e R$ 61,66 mi; 2026 = 90,8% e R$ 132,28 mi; 2022 = 82,6%. Nenhum doc do PR #2 avisa que 2026 é parcial (grep por 'parcial|DT_GERACAO|TP_PRESTACAO' não acha nada). A ressalva 'prestação de contas de 2026, ainda em curso' está no README do main, não no PR.
(4) Q11 (mart_q11, só PI), fatia digital: não eleitos 4,97% contra eleitos 4,11% em 2018-2026. Em 2018-2024 fica 4,53% contra 4,11%. O número é esse mesmo, e a diferença cai pela metade (0,86 para 0,42 p.p.), mas o sentido se mantém.

O QUE ESTÁ EXAGERADO:
(a) O docs/q10-publico-privado.md não compara eleito com não eleito. Ele só mostra o percentual por ano. A contaminação existe no mart_q10, porque a coluna fl_eleito sai FALSE para os 402 de 2026, mas não no texto do doc.
(b) 'Receita de 2026 é o dobro': 132,28 / 61,66 = 2,15x com dados parciais. A receita final só pode crescer, então esse 'dobro' é um piso. Falta a ressalva, mas o número não está inflado.
(c) Na Q12 o efeito é desprezível. Tirando 2026, quem disputou uma eleição só continua com 3,0% de eleitos, e os reincidentes vão de 31,9% para 32,0%. A carreira mais longa (13 eleições, 11 partidos, 5 cargos, só no PI) tem qt_eleito = 0 nas 12 eleições já decididas. A frase 'sem nunca ter sido eleita' é verdadeira até 2024; só falta dizer que 2026 está em aberto.
(d) A correção proposta ('fl_eleito NULL quando ds_sit_tot_turno for NULL') está errada. Há ds_sit_tot_turno nulo em todos os anos: 3.257 em 2014, 21.143 em 2016, 16.151 em 2024. Em 2014-2024 a maioria é candidatura INAPTO (41.599) ou #NE (16.151), gente que de fato não foi eleita. A regra proposta transformaria esses casos em NULL.

### [media] `pr2-despesa-07` — parcial

- **Arquivo:** sql/03_tipo_despesa.sql
- **Problema:** A classificação de propaganda olha só o tipo de despesa. 'SERVICOS PRESTADOS POR TERCEIROS', o 2º maior tipo com R$86,99 mi, fica de fora e nem aparece na lista 'O que ficou de fora' do q11. O mesmo vale para 'DIVERSAS A ESPECIFICAR' (R$15,26 mi). Pelo texto livre, parte relevante dessas despesas é marketing, redes sociais e publicidade, então o canal DIGITAL e a conclusão 'o digital estacionou em ~4-6%' estão subestimados.
- **Evidência:** Busca em ds_despesa, com upper(strip_accents()), dentro de SERVICOS PRESTADOS POR TERCEIROS. Termos digitais/marketing (REDES SOCIA|INSTAGRAM|FACEBOOK|MARKETING|MIDIA DIGITAL|INTERNET|IMPULSION|...): R$15,92 mi, mais que todo o canal DIGITAL (R$11,48 mi). Outros termos de propaganda (PUBLICIDADE|PANFLET|SANTINHO|ADESIV|VIDEO...): R$18,52 mi. Exemplos: 'PLANEJ ESTRAT MARKETING POLITICO REDES SOCIAIS' R$420.000; 'SERVIÇOS DE PUBLICIDADE E MARKETING CONFORME CONTR' R$400.000. Versão conservadora (sem 'MARKETING'), por ano: 2018 R$1,09 mi, 2022 R$1,25 mi, 2024 R$0,99 mi, contra DIGITAL de 1,50 / 3,37 / 2,51. É heurística de palavra-chave, não reclassificação definitiva.
- **Correção:** 1. **Documentar a omissao no `docs/q11-propaganda.md`.** Na secao "O que ficou de fora", citar os tipos genericos que nao foram classificados, com valores: 'SERVICOS PRESTADOS POR TERCEIROS' R$86,99 mi, 'DIVERSAS A ESPECIFICAR' R$15,26 mi e 'SERVICOS PROPRIOS PRESTADOS POR TERCEIROS' R$5,18 mi. Explicar que eles escondem gasto de propaganda.

2. **Nao jogar 'MARKETING' solto em DIGITAL.** Ao reclassificar pelo texto:
   - Termos claramente digitais (REDES SOCIAIS, MIDIAS SOCIAIS, IMPULSIONAMENTO, INSTAGRAM, FACEBOOK, MARKETING DIGITAL, CONTEUDO DIGITAL, TRAFEGO PAGO) vao para DIGITAL.
   - 'MARKETING' ou 'PUBLICIDADE' sem termo digital vao para um balde proprio, 'AGENCIA/MARKETING (indeterminado)'. Esse balde pode ser separado pelo CNAE do fornecedor: 59111 para RADIO E TV/VIDEO, 63194 para DIGITAL, 73114/73190 continua indeterminado.
   - Excluir falsos positivos como 'IMPRESSAO DIGITAL'.
   - Guardar a regra como coluna nova, por exemplo `ds_canal_texto` com `fl_reclassificado`, sem apagar a classificacao oficial por tipo.

3. **Publicar uma analise de sensibilidade** do % digital por ano:
   - oficial: 0,6 / 0,2 / 4,7 / 3,2 / 4,8 / 4,3 / 6,0
   - conservadora: 1,2 / 0,7 / 5,9 / 5,2 / 7,4 / 6,4 / 8,4
   - Reescrever a leitura 3 como "salto em 2018 e patamar de ~5-8% (4-6% so pela rubrica oficial)".

4. **Ajustar o `mart_q11_texto`** (`sql/05_marts_enrico.sql`) para incluir tambem as linhas dos tipos genericos. Hoje o filtro `ds_canal_propaganda IS NOT NULL` impede que a analise de texto do notebook sequer veja essas despesas.
- **Verificação:** Refiz o staging do PR #2 do zero. Salvei `sql/01..05` de `origin/pr/2` em `C:/Users/eduar/Downloads/rv/cetico07/` e rodei tudo com DuckDB (script `run.py`, banco `t.duckdb`) sobre a extracao PI da worktree. Os arquivos `*_PI` batem com os globs `????_??` do PR.

**Numeros do PR que se reproduziram**
- `stg_despesa` tem 367.004 linhas, igual ao doc.
- Totais por canal: IMPRESSO 140,87; RUA 49,66; RADIO E TV 33,01; ADESIVO 30,67; JINGLE 12,19; DIGITAL 11,48 mi. Tudo igual ao `docs/q11-propaganda.md`.
- O % digital por ano, pelo `mart_q11`, tambem bate com o doc: 0,6 / 0,2 / 4,7 / 3,2 / 4,8 / 4,3 / 6,0.

**Parte confirmada do achado**
- Na `stg_despesa_classificada`, 'SERVICOS PRESTADOS POR TERCEIROS' e de fato o 2o maior tipo: R$86,99 mi, 37.668 linhas, todas com `ds_despesa` preenchido.
- 'DIVERSAS A ESPECIFICAR' soma R$15,26 mi (11.568 linhas).
- Os dois caem com `ds_canal_propaganda` NULL. A lista "O que ficou de fora" do `q11-propaganda.md` cita apenas "servicos advocaticios e contabeis, combustivel, pessoal, aluguel, encargos bancarios", sem nenhum dos dois.
- Tambem fica de fora 'SERVICOS PROPRIOS PRESTADOS POR TERCEIROS' (R$5,18 mi).
- Agravante que o revisor nao citou: `mart_q11_texto` filtra `WHERE d.ds_canal_propaganda IS NOT NULL`. Com isso, o texto livre desses tipos genericos nem chega ao notebook.
- Os dois exemplos existem com os valores citados: 'PLANEJ ESTRAT MARKETING POLITICO REDES SOCIAIS' (2022, R$420.000, CNAE 63194) e 'SERVICOS DE PUBLICIDADE E MARKETING CONFORME CONTR' (2020, R$400.000).

**Parte exagerada: o numero principal de "digital"**
- Com uma regex digital+MARKETING parecida com a do revisor, obtive R$16,56 mi em SPT (ele: 15,92). Mas R$12,78 mi disso vem so de 'MARKETING' (668 linhas).
- 'MARKETING' sozinho nao indica digital. Sem nenhum termo digital junto, os maiores CNAEs sao:

| CNAE | Atividade | R$ (mi) |
|---|---|---|
| 73114 | agencia de publicidade | 2,55 |
| 59111 | producao audiovisual (provavel RADIO E TV) | 2,38 |
| 63194 | portais | 1,07 |

- Ha falsos positivos, por exemplo 'ADESIVO 15X45 CM EM PLASTICO IMPRESSAO DIGITAL' (R$85 mil, 2014) e 'C/ DE PECAS GRAFICAS INTERNET RADIO E TV' (R$250 mil em 2018).
- Portanto, "R$15,92 mi, mais que todo o canal DIGITAL" superestima o digital. Parte disso e radio/TV ou agencia generica.

**Versao conservadora (sem 'MARKETING' solto)**

Com os mesmos termos do revisor, cheguei a SPT 2018 R$1,11 mi, 2022 R$1,37 mi e 2024 R$1,19 mi (ele: 1,09 / 1,25 / 0,99). Mesma ordem de grandeza.

Rodei entao uma regex estrita: REDES SOCIA, INSTAGRAM, FACEBOOK, MIDIA DIGITAL, IMPULSION, MIDIAS SOCIA, MARKETING DIGITAL, CONTEUDO DIGITAL, COMUNICACAO DIGITAL, TRAFEGO PAGO. Somando SPT+DIVERSAS ao numerador e ao denominador, o % digital fica assim:

| Ano | Oficial | Ajustado |
|---|---|---|
| 2014 | 0,6% | 1,2% |
| 2016 | 0,2% | 0,7% |
| 2018 | 4,7% | 5,9% |
| 2020 | 3,2% | 5,2% |
| 2022 | 4,8% | 7,4% |
| 2024 | 4,3% | 6,4% |
| 2026 | 6,0% | 8,4% |

- Na versao ampla (com MARKETING), a faixa sobe para 9,6% a 14,6%.

**Conclusao**
- O nivel do digital esta subestimado em cerca de 1,2 a 2,6 p.p. mesmo na versao conservadora, ou seja, 30 a 60% relativos.
- O formato "salto em 2018 e patamar" continua de pe na versao conservadora. So a versao ampla, pouco confiavel, o derruba.
- O vies nao atinge so o digital: afeta tambem RADIO E TV e o total de propaganda.

**Detalhe menor:** o doc diz 81 tipos distintos; `count(distinct ds_tipo_despesa)` deu 80 (provavelmente o NULL foi contado).

### [media] `pr2-docs-08` — confirmado

- **Arquivo:** docs/q11-propaganda.md
- **Problema:** As 'três leituras' do q11 comparam eleição geral com municipal (2014 × 2024), o que o próprio q10 manda não fazer, e trazem afirmações que os números não sustentam. 'Material impresso é metade do gasto em todos os anos' é falso (2016 = 35,3%). 'Rádio e TV caíram pela metade (26% → 6,1%)' na verdade é uma queda de 77%, entre tipos de eleição diferentes. E a 'queda que começa em 2016' é efeito do tipo de eleição.
- **Evidência:** Tabela reproduzida do mart_q11, % impresso: gerais 45,1 (2014), 50,2 (2018), 50,8 (2022), 45,9 (2026); municipais 35,3 (2016), 48,1 (2020), 54,9 (2024). Rádio e TV: gerais 26,0 / 13,2 / 8,6 / 11,3; municipais 11,0 / 14,7 / 6,1, ou seja, subiu de 2016 para 2020.
- **Correção:** Separar a tabela de resultado em duas séries: gerais (2014, 2018, 2022, 2026) e municipais (2016, 2020, 2024). Acrescentar a mesma ressalva de tipo de eleição que existe no q10. Reescrever as três leituras:

1. **Impresso.** Trocar "metade em todos os anos" por algo como: "o impresso é o maior canal em todos os anos, entre 35% e 55% do gasto; nas gerais fica estável em 45–51%, nas municipais sobe de 35,3% (2016) para 54,9% (2024)".

2. **Rádio e TV.** Nas gerais caiu pela metade entre 2014 e 2018 (26,0% → 13,2%), no mesmo ciclo em que o digital surge. Depois fica em 8,6–11,3%. Nas municipais não há tendência: 11,0 → 14,7 → 6,1. Remover "a queda é anterior ao digital, começa em 2016". Se o autor quiser manter o número 26% → 6,1%, precisa dizer que isso é uma queda de 77% e que compara eleição geral com municipal.

3. **Digital.** Trocar "0,2% para 4,7% num ano" por: "nas gerais, de 0,6% (2014) para 4,7% (2018); nas municipais, de 0,2% (2016) para 3,2% (2020)". Rever "estacionou", porque depois o digital segue subindo devagar: 4,7 → 4,8 → 6,0 nas gerais e 3,2 → 4,3 nas municipais.
- **Verificação:** 1) Li `git show origin/pr/2:docs/q11-propaganda.md`. A tabela do próprio doc já traz impresso 2016 = 35,3%, 2014 = 45,1% e 2026 = 45,9%. Ou seja, a leitura 1 ("metade do gasto de propaganda em todos os anos") é contrariada pelo próprio documento.

2) Reproduzi o mart de forma independente. Exportei os SQL do PR (`sql/01` a `sql/05`) para `C:/Users/eduar/Downloads/rv/cetico-pr2-docs-08/`. Rodei tudo sem alteração, num DuckDB temporário, com cwd na worktree que tem `dados/raw` (extração local `_PI`, que os globs do Enrico acham). Os cinco scripts terminaram sem erro. Depois agrupei o `mart_q11` por ano (scripts `q.py` e `run.py`). Resultado, % do gasto de propaganda por ano:

| série | ano | impresso | rádio e TV | rua | digital | total (R$ mi) |
|---|---|---|---|---|---|---|
| gerais | 2014 | 45,1 | 26,0 | 6,4 | 0,6 | 25,2 |
| gerais | 2018 | 50,2 | 13,2 | 15,9 | 4,7 | 31,8 |
| gerais | 2022 | 50,8 | 8,6 | 21,7 | 4,8 | 70,7 |
| gerais | 2026 | 45,9 | 11,3 | 23,3 | 6,0 | 47,9 |
| municipais | 2016 | 35,3 | 11,0 | 15,3 | 0,2 | 22,7 |
| municipais | 2020 | 48,1 | 14,7 | 10,4 | 3,2 | 32,4 |
| municipais | 2024 | 54,9 | 6,1 | 16,6 | 4,3 | 58,4 |

Direto do `stg_despesa_classificada`, sem o join com `candidatura`, os números são idênticos. Tudo bate com o doc e com a evidência do achado.

3) Contas conferidas:
- 1 - 6,1/26,0 = 0,765, ou seja, queda de 76,5%, não "pela metade".
- Dentro das gerais, 13,2/26,0 = 0,51. A queda pela metade acontece entre 2014 e 2018, no mesmo intervalo em que o digital vai de 0,6% a 4,7%. Isso contradiz "a queda é anterior ao digital".
- Nas municipais, rádio e TV sobe de 11,0% (2016) para 14,7% (2020). Não há "queda que começa em 2016".
- "Cresceu de 45% para 55%" compara 2014 (geral) com 2024 (municipal). Nas gerais o impresso fica estável: 45,1 / 50,2 / 50,8 / 45,9.

4) `grep -i "geral|gerais|municipa|tipo de elei"` no q11 não retorna nada (exit=1): o q11 não faz nenhuma ressalva de tipo de eleição. Já o `q10-publico-privado.md`, linha 71, diz: "Não comparem anos adjacentes sem dizer isso".

5) Achado extra, na mesma linha: a leitura 3 diz "vai de 0,2% para 4,7% num ano". Mas 0,2% é de 2016 (municipal) e 4,7% é de 2018 (geral), dois anos e tipos diferentes. "Estacionou" também é discutível: nas gerais o digital vai 4,7 → 4,8 → 6,0 e nas municipais 3,2 → 4,3.

Pequenos exageros do revisor, que não mudam o veredito:
- O q10 não proíbe a comparação; ele pede que ela seja declarada. Mesmo assim o q11 falha, porque não declara.
- Dizer que a queda "é efeito do tipo de eleição" é causal demais. O mais preciso é que a afirmação não se sustenta, porque 2014 e 2016 são de séries diferentes.

### [media] `pr2-der-09` — verificação interrompida

- **Arquivo:** docs/der-enrico.md
- **Problema:** O DER não é consistente como modelo relacional. (a) RECEITA/DESPESA usam FK (sq_candidato, ano) para CANDIDATURA, mas a PK de CANDIDATURA é id_candidatura, e (ano, sq_candidato) não é chave candidata porque a tabela inclui 2002-2008. (b) CANDIDATURA.nr_partido é FK para PARTIDO sem ano, contrariando o FATO 3. (c) cd_fonte_recurso, cd_tipo_despesa, id_receita, id_despesa e AGENTE_FINANCEIRO (com nm_agente) não existem no SQL. fonte_recurso.cd_fonte_recurso é um row_number sobre os dados presentes, instável, e stg_receita_classificada não tem essa coluna. (d) Falta cd_tipo_eleicao em CANDIDATURA.
- **Evidência:** Em candidatura, 2004 tem 401.963 linhas e só 1.357 sq_candidato distintos, logo (ano, sq_candidato) não é único. Em stg_candidatura, NR_PARTIDO 25 = PFL(2002-06), DEM(2008-20), PRD(2020, 2024, 2026); 44 = PRP(2002-18), UNIÃO(2020-26). Efeito no mart_q12 (qt_partidos = count DISTINCT nr_partido): 344 dos 170.375 reincidentes 'fiéis a um partido' passaram de fato por PRP→UNIÃO ou DEM/PFL→PRD. O par (NULL, NULL) de fonte_recurso (1.265 linhas) não casa por '=' com a receita. No SQL não há nenhum CREATE para agente_financeiro, receita_campanha ou despesa_campanha.
- **Correção:** Usar id_candidatura como FK em RECEITA/DESPESA (resolvido no staging via ano + sq_candidato, válido só de 2010 em diante). PARTIDO com PK (ano, nr_partido) e FK composta. Gravar cd_fonte_recurso/cd_tipo_despesa nas views classificadas, com código estável (hash ou de-para fixo versionado), ou tirar do DER o que não será implementado. Incluir cd_tipo_eleicao.

### [baixa] `pr2-fonte-04` — parcial

- **Arquivo:** sql/02_fonte_recurso.sql
- **Problema:** A regra ① (fonte = FUNDO ESPECIAL/PARTIDARIO -> PUBLICO) vem antes da regra ⑤ (TRANSFERENCIA). Com isso, FEFC ou FP repassado de um candidato a outro é contado como PÚBLICO duas vezes: na receita de quem recebeu do partido e na de quem recebeu do colega. É exatamente a dupla contagem que o próprio doc usa para justificar a categoria ⑤. A coluna PÚBLICO e o % público da Q10 ficam inflados.
- **Evidência:** stg_receita_classificada WHERE tp_origem='PUBLICO' AND ds_origem LIKE 'RECURSOS DE OUTROS CANDIDATOS%', no PI: 2016 R$0,32 mi; 2018 R$2,19 mi; 2020 R$2,50 mi; 2022 R$0,74 mi; 2024 R$1,91 mi; 2026 R$3,66 mi (6.720+1.173+12 linhas nos pares 1, 4 e 5 da fonte_recurso). No nacional (run/pares_nac.py, arquivos _BRASIL): FUNDO ESPECIAL+OUTROS CANDIDATOS 2018 R$139,97 mi, 2020 R$99,76 mi, 2022 R$161,94 mi, 2024 R$168,56 mi; FP+OUTROS CANDIDATOS 2016 R$21,46 mi, 2014 R$27,60 mi.
- **Correção:** Nao reclassificar tp_origem. PUBLICO continua correto no grao da candidatura, que e o grao do mart_q10. Em vez disso:

1) Em stg_receita_classificada (e na tabela fonte_recurso), acrescentar `fl_transferencia = ds_origem LIKE 'RECURSOS DE OUTROS CANDIDATOS%'`, qualquer que seja a fonte.

2) Em todo total que soma varios candidatos (tabela estadual do docs/q10-publico-privado.md, qualquer total por UF ou pais e o DER/mart que alimenta esses graficos), excluir as linhas com fl_transferencia do numerador e do denominador. Isso vale tanto para as de fonte FUNDO ESPECIAL/FUNDO PARTIDARIO quanto para as da regra (5).

3) Corrigir o texto do doc:
- a regra (5) so pega transferencias entre candidatos fora dos fundos;
- as que vem de fundo ficam em PUBLICO no nivel do candidato e saem dos totais agregados;
- atualizar a tabela. O % publico deduplicado no PI fica 2,6 / 7,0 / 76,2 / 56,3 / 82,7 / 67,7 / 90,6 (2014 a 2026). A coluna PUBLICO cai 0,02 / 0,32 / 2,19 / 2,50 / 0,74 / 1,91 / 3,66 R$ mi.

4) Opcional: registrar que quem doou continua com o valor repassado na propria receita (receita nao e o mesmo que uso). Ha dois jeitos de tratar isso: descontar pelas despesas de doacao a outros candidatos, ou declarar a limitacao no relatorio.
- **Verificação:** O que eu reproduzi: rodei sql/01_staging.sql e sql/02_fonte_recurso.sql de origin/pr/2, sem alteracao, com DuckDB 1.5.5 sobre a extracao PI (scripts em C:/Users/eduar/Downloads/rv/cetico04/run_pi.py, dup.py e nac.py).

(1) A ordem das regras e como o achado diz. A regra (1) `WHEN r.ds_fonte IN ('FUNDO ESPECIAL','FUNDO PARTIDARIO') THEN 'PUBLICO'` vem antes da regra (5) `WHEN r.ds_origem IN ('RECURSOS DE OUTROS CANDIDATOS', ...) THEN 'TRANSFERENCIA'`. O comentario da (5) diz "Somar como privado contaria o mesmo real duas vezes no total do estado".

(2) Os numeros do achado se reproduzem exatamente. Na tabela fonte_recurso, os pares 1, 4 e 5 (FUNDO ESPECIAL ou FUNDO PARTIDARIO com RECURSOS DE OUTROS CANDIDATOS[/COMITES]) tem 6.720 + 1.173 + 12 linhas e todos caem em PUBLICO. O valor por ano no PI, em R$ mi, e: 2014 0,02 | 2016 0,32 | 2018 2,19 | 2020 2,50 | 2022 0,74 | 2024 1,91 | 2026 3,66. A tabela do docs/q10-publico-privado.md tambem sai identica (2,4% ... 90,8%).

(3) A dupla contagem existe de fato. Cruzei SQ_CANDIDATO_DOADOR com o SQ_CANDIDATO de quem doou, no mesmo arquivo PI. O doador tinha lancado FEFC como receita propria nestes valores (FEFC repassado / parte coberta pelo FEFC do proprio doador, em R$ mi): 2018 2,14/1,19; 2020 2,42/2,17; 2022 0,71/0,71; 2024 1,89/1,66; 2026 3,66/3,66. Ou seja, o mesmo real entra duas vezes como PUBLICO.

(4) Nacional (li direto os _BRASIL de dentro do .zip e o arquivo 2014 ja corrigido). FEFC entre candidatos: 2018 R$139,97 mi (33.146 linhas), 2022 R$161,94 mi. Fundo Partidario entre candidatos: 2014 R$27,60 mi, e ainda 2018 R$22,52 mi, que o achado nao cita. Em 2018 e 2022 a regra (5) so pega R$41,07 mi e R$28,83 mi das transferencias entre candidatos. O resto (R$162 mi e R$169 mi) vai para PUBLICO. Nao medi 2016, 2020 e 2024 no nacional.

Onde o achado exagera:
(a) "O % publico da Q10 fica inflado" nao vale para o mart_q10. O grao dele e a candidatura e o pc_publico e calculado por candidato. Para quem recebeu, FEFC vindo de um colega e dinheiro publico de verdade. Mandar isso para TRANSFERENCIA, como o achado propoe, subestimaria o publico de quem recebeu justamente na analise eleito x nao eleito.
(b) No agregado estadual, a coluna PUBLICO fica inflada em 1,0 / 5,9 / 4,4 / 4,7 / 0,7 / 2,0 / 3,0% (2014 a 2026). Ja o % publico quase nao muda quando a deduplicacao e feita direito, tirando todas as transferencias entre candidatos do numerador e do denominador: 2,4->2,6; 7,3->7,0; 76,1->76,2; 57,1->56,3; 82,6->82,7; 67,8->67,7; 90,8->90,6. A conclusao principal (2,4% -> ~90%) continua de pe.
(c) A correcao proposta (mandar para TRANSFERENCIA e manter no denominador) derruba o % em ate 3,3 pontos (2018: 72,8). Isso e ela tambem uma distorcao, porque o denominador da tabela do doc ja soma a coluna TRANSF.: 2014 1,49/61,66 = 2,4%.

Conclusao: a inconsistencia entre a regra (1), a regra (5) e o texto do doc e real, e os valores absolutos em PUBLICO estao contados em dobro. O efeito no % e na Q10 por candidato e bem menor do que o achado afirma.

### [baixa] `pr2-enc-10` — não verificado (baixa)

- **Arquivo:** sql/04_politico.sql
- **Problema:** As afirmações sobre encoding e ignore_errors estão erradas. Os bytes de 2008 (0x82/0x83/0x87/0x93) são válidos em cp1252, então 2008 lê inteiro em modo estrito. Só 2016 tem 2 linhas com 0x81, que é indefinido em cp1252 (um fragmento UTF-8 em 'FÁTIMA'). O ignore_errors descarta 1 linha em silêncio. O q12 atribui a diferença de 54 pessoas ao ignore_errors, o que não se sustenta com 1 linha. E o README recomenda ignore_errors=true, embora seja desnecessário e perigoso.
- **Evidência:** Varredura (run/scan_cand.py): 2008 tem 9 linhas com bytes C1 e 0 com byte indefinido em cp1252; 2016 tem 5 e 2 (não '7 linhas'). Com cp1252 estrito, materializando o arquivo de 2016: 'CSV Error on Line: 379610 ... ROSARIA DE F?TIMA RODRIGUES'. 2008 cp1252 estrito: 382.079 linhas = csv bruto. stg_candidatura 2016 = 498.390, contra 498.391 registros no csv bruto.
- **Correção:** Tirar ignore_errors. Usar store_rejects=true (e checar a tabela de rejeitos) ou corrigir os 2 bytes 0x81 antes de ler. Corrigir o comentário do 04, o README e a explicação dos 54 de diferença no q12, que vem do método de deduplicação e da não determinação (ver pr2-cand-05).

### [baixa] `pr2-fonte-11` — não verificado (baixa)

- **Arquivo:** sql/02_fonte_recurso.sql
- **Problema:** No recorte nacional aparecem origens que não existem no PI e caem no ELSE 'NAO IDENTIFICADO', mesmo não sendo origem não identificada: comercialização de bens/eventos e, em 2026, FEFC/FP e doações lançados como origem. Pares estranhos como FP + pessoa física/jurídica também viram PÚBLICO sem aviso.
- **Evidência:** Distintos nacionais (scratchpad 2014 corrigido/2016 e zips 2018-2026, run/pares_nac.py). 'COMERCIALIZACAO DE BENS OU REALIZACAO DE EVENTOS': 2014 7 linhas, 2016 152 (R$0,12 mi), 2018 97 (R$100.740), 2020 51 (R$53.179). 'COMERCIALIZACAO DE BENS COM OR': 2022 138, 2024 109. 'COM FEFC': 2022 4, 2024 17. Em 2026 com fonte OUTROS RECURSOS: 'FUNDO ESPECIAL DE FINANCIAMENTO DE CAMPANHA' 26 (R$14.117), 'DOACOES PARA CAMPANHA' 14, 'FUNDO PARTIDARIO' 2. 2014: FUNDO PARTIDARIO + PESSOAS JURIDICAS 21 linhas (R$0,21 mi).
- **Correção:** Criar regras explícitas para essas origens. Trocar o ELSE por 'SEM REGRA' e adicionar um teste que falhe se alguma linha cair lá, restringindo 'NAO IDENTIFICADO' a 'RECURSOS DE ORIGENS NAO IDENTIFICADAS' e ao par nulo.

### [baixa] `pr2-docs-12` — não verificado (baixa)

- **Arquivo:** docs/q10-publico-privado.md
- **Problema:** Números imprecisos nos docs. q10: '⑦ 1.343 linhas, todas de valor zero' e 'Em 2014 só 38 linhas trazem Fundo Partidario'. q11: '81 tipos' e '27 dos 81 tipos' com prefixo. q12: 2026 com '20.985 linhas'. README/q12: '402.157 candidaturas em 1.506 valores distintos' de sq_candidato.
- **Evidência:** NAO IDENTIFICADO: 1.265 linhas nulas com R$0,00 e mais 78 linhas 'RECURSOS DE ORIGENS NAO IDENTIFICADAS' somando R$71.322,38, todas diferentes de zero. ds_fonte='FUNDO PARTIDARIO' em 2014 = 62 linhas (12 + 50); 38 é só o subgrupo partido+Estimado. count(DISTINCT ds_tipo_despesa) = 80, mais o NULL (2.686 linhas). Tipos com prefixo: 28 em 2014, 27 em 2016, 34 no total. consulta_cand_2026: 20.984 registros (20.985 é a contagem de linhas com cabeçalho). 2004: 1.357 SQ distintos; 1.506 é a contagem de (sq, turno).
- **Correção:** Corrigir os números e as frases correspondentes nos três docs e no README.

### [baixa] `pr2-script-13` — não verificado (baixa)

- **Arquivo:** sql/04_politico.sql
- **Problema:** O cabeçalho diz 'Não depende do staging da prestação de contas', mas o 04 usa as macros limpa() e data_br() criadas no 01. 'carregar_staging.py 04' num banco novo falha.
- **Evidência:** Executar só o 04_politico.sql num duckdb.connect() novo dá 'Catalog Error: Scalar Function with name limpa does not exist!'.
- **Correção:** Mover as macros para um 00_macros.sql, ou corrigir o cabeçalho e fazer o carregar_staging.py sempre incluir o 01 quando houver filtro.


## PR #3 (Dudu) — DER da Q4–Q6

Revisei o docs/der-modulo-eduardo.md do PR #3 (origin/pr/3, commit 6042474) contra os arquivos reais: consulta_cand 2002-2026, votacao_partido_munzona e detalhe_votacao_munzona 2016-2026 (_BRASIL), SIDRA 10061/10062 (JSON e metadados), a ponte municipio_tse_ibge e os 1.622 PDFs de proposta_governo do PI (2016-2026), dos quais extraí o texto com pdftotext 4.00. Também renderizei o Mermaid no Edge headless com Mermaid 11. Os scripts que reproduzem cada número estão em C:/Users/eduar/Downloads/rv/pr3/q*.py. O diagrama renderiza e as colunas de origem existem com os nomes citados. A lógica central está certa: sentinela -1, federação por eleição, de-para como entidade, PK composta das propostas. Há dois defeitos graves. (1) O texto amarra federação e eleição ao ANO, e os arquivos anuais trazem eleições suplementares, com PT em duas federações no "ano" 2022 e PP/UNIÃO/PRD/SOLIDARIEDADE federados no "ano" 2024. (2) Em votacao_partido_munzona o CD_MUNICIPIO vem sem zero à esquerda e em 2018/2022 o SG_UE é a UF, então a carga que o documento descreve perde de 8 a 10% das linhas em silêncio. Das duas lacunas que o PR declarou, fechei as duas com medição: não há duplicação de voto de legenda entre partidos da mesma federação, e 16,4% dos PDFs vêm sem texto. Os outros achados são dados incorretos pontuais: ST_VOTO_EM_TRANSITO, leiaute de 2016, códigos -4/0 de instrução, padrão do nome do PDF e o código de exemplo do SIDRA.

**Conferido e correto:**

- Mermaid renderiza sem erro no Edge headless (mermaid@11 ESM): status 'OK svg_len=221031' e os 13 ids g-entity-* presentes (MUNICIPIO, PARTIDO, ELEICAO, CARGO, CANDIDATURA, FEDERACAO, PARTIDO_FEDERACAO, VOTACAO_LEGENDA_MUNICIPIO, NIVEL_INSTRUCAO_COMPARAVEL, GRAU_INSTRUCAO, CENSO_INSTRUCAO, PROPOSTA_GOVERNO, TERMO_PROPOSTA). Pagina: C:/Users/eduar/Downloads/rv/pr3/render.html
- Colunas de origem existem com os nomes citados: CD_GRAU_INSTRUCAO/DS_GRAU_INSTRUCAO em consulta_cand de 2002 a 2026; NR_FEDERACAO/NM_FEDERACAO/SG_FEDERACAO/DS_COMPOSICAO_FEDERACAO em consulta_cand desde 2014 e em votacao_partido_munzona desde 2016; QT_VOTOS_LEGENDA_VALIDOS, QT_TOTAL_VOTOS_LEG_VALIDOS e QT_VOTOS_NOMINAIS_VALIDOS nos cabecalhos de 2016 a 2026 (conferido com head -1 | iconv)
- NR_FEDERACAO = -1 e de fato a sentinela de 'sem federacao': em todos os anos (2014-2026) o -1 vem acompanhado de SG/NM/DS = '#NULO#' (2014-2018) ou '#NULO' (2020+) (q4.py)
- Regra 'um partido em no maximo uma federacao por eleicao' confirmada por CD_ELEICAO: 0 conflitos em 2020, 2022, 2024 e 2026 (q5.py). Federacoes de fato na eleicao ordinaria (CD_TIPO_ELEICAO=2): 2014-2020 nenhuma; 2022 {1,2,3}; 2024 {100,101,102}; 2026 {100..104} (q4.py/q21.py)
- Codigos 1..8 do de-para batem com o TSE em todos os 13 anos (1 ANALFABETO ... 8 SUPERIOR COMPLETO, q1.py), com o PR respondendo sozinho o proprio 'A conferir' da secao 4. Os cortes do SIDRA 10061 coincidem com fronteiras de codigos do TSE: nenhum codigo TSE se divide entre dois niveis IBGE
- SIDRA 10061: 27.850 linhas de dado, 5.570 municipios, exatamente 5 por municipio (Total 120704 + 9493, 9494, 9495, 99713); variavel 2667 'Pessoas de 18 anos ou mais de idade'; nenhum valor nao numerico (q2.py/q3.py)
- Nome do PDF traz o SQ_CANDIDATO: casamento de 100% em 2018 (10/10), 2020 (527/527) e 2022 (9/9); nenhum SQ se repete entre anos nos PDFs, logo a PK (sq_candidato, nr_sequencial) nao quebra no tempo (FATO 2 nao afeta 2016+); 2024 tem 6 candidatos com _02, o que confirma a cardinalidade ||--o{ (q15.py)
- Limite 'Q4 no grao de municipio so em eleicao municipal' confirmado: SG_UE tem 2 caracteres (UF) em 2018 e 2022 e 5 digitos em 2016/2020/2024 (q11.py)
- Legenda so existe em cargo proporcional: 2022 Governador/Presidente/Senador = 0 votos de legenda; 2024 Prefeito = 0 (q14.py). O escopo da Q5 fica correto se ficar restrito a vereador/deputados
- A decisao de somar zona existe mesmo no der.md (linha 223: 'Zona nao interessa a nenhuma das 12 perguntas'); a contagem 'seis das oito PKs sao compostas' esta correta
- SIDRA 10062 (anos medios de estudo, universo 11+ anos) nao foi modelada. Para a Q4 isso e defensavel, porque o universo nao bate com candidatos (18+)

**Achados:**

### [alta] `pr3-dudu-01` — confirmado

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** O documento amarra federacao e eleicao ao ANO ('identifica so dentro do ano', PARTIDO_FEDERACAO com 'uma linha por (ano, partido)', 'nr_federacao nula em 2016-2020') e nunca define id_eleicao, que alias nao consta do contrato de chaves (o contrato diz eleicao.ano + nr_turno). Como todo arquivo anual mistura eleicoes suplementares (FATO 4), essa chave por ano viola a PK de PARTIDO_FEDERACAO, atribui federacao errada a partidos e, em VOTACAO_LEGENDA_MUNICIPIO, soma eleicao ordinaria com suplementar.
- **Evidência:** q5.py sobre consulta_cand: em 2022, PT(13) aparece com NR_FEDERACAO {2,101} e PSOL(50) com {3,102}; 101/102 vem de CD_ELEICAO 6278 'Eleicao Suplementar Governador 2026' dentro do arquivo 2022. Em 2024, depois de tirar o -1 (como o doc manda), PP e UNIAO ficam na federacao 104 e PRD e SOLIDARIEDADE na 103, que so aparecem em suplementares de 2026 (CD 6265-6293); na ordinaria 619 esses partidos sao -1. Por CD_ELEICAO: 0 conflitos. Com CD_TIPO_ELEICAO='2': 0 conflitos (q21.py). (ANO, NR_FEDERACAO) com mais de uma descricao: 1 em 2020 e 3 em 2024; por CD_ELEICAO: 0 (q20.py). O 'nula em 2016-2020' tambem falha: votacao_partido_munzona_2020 tem 33 linhas com NR_FEDERACAO 1/2/3 e consulta_cand_2020 tem 79, todas de suplementares de 2022-2024. Em votacao_partido_munzona, a PK (ano, turno, cargo, municipio, partido) com mais de um CD_ELEICAO acontece em 217 grupos (2016), 564 (2018), 164 (2020), 0 (2022) e 41 (2024) (q6.py). Linhas 163-167, 179 e 223 do doc.
- **Correção:** 1. Definir no diagrama que id_eleicao = CD_ELEICAO, alinhado com o der-davi.md do PR #4. O stub ELEICAO deve trazer como atributos ano_eleicao, nr_turno, cd_tipo_eleicao e ds_eleicao.
   - Tirar nr_turno da PK de VOTACAO_LEGENDA_MUNICIPIO e ler o turno via ELEICAO. Medido: nenhum CD_ELEICAO tem mais de um turno.
   - Efeito colateral a declarar: FEDERACAO e PARTIDO_FEDERACAO passam a repetir a composição por turno (por exemplo 546 e 547). É aceitável.
2. Alternativa equivalente: filtrar CD_TIPO_ELEICAO = 2 na carga, com comentário, e só então chavear por (ano, ...). Medido: 0 conflitos por (ano, partido) em 2020, 2022 e 2024, e 0 colisões de PK em votacao_partido 2016-2024. Mesmo assim ELEICAO precisa ter chave própria, porque 2022 tem 4 CD_ELEICAO ordinários (544 a 547).
3. Ajustes de texto:
   - "dentro do ano" passa a "dentro da eleição (CD_ELEICAO)".
   - "uma linha por (ano, partido)" passa a "(CD_ELEICAO, partido)".
   - "nula em 2016-2020" passa a "-1/nula em todas as linhas de eleição ordinária até 2020". Os arquivos de 2020 têm 79 linhas (consulta_cand) e 33 linhas (votacao_partido) com federação, todas de suplementares de 2022-2024.
4. Tirar o "sem exceção" (linha 42) e o item do checklist que alega o mesmo nome e tipo do contrato. Propor ao grupo incluir eleicao.cd_eleicao e cargo.cd_cargo no contrato de chaves, e alinhar nomes e tipos com o PR #4 (cod_cargo vs CD_CARGO; PK de MUNICIPIO cod_ibge vs CD_MUNICIPIO VARCHAR(5)).
5. Ao carregar nm_federacao, padronizar maiúsculas/minúsculas ou pegar o nome da eleição ordinária. As únicas divergências de nome medidas são de caixa.
6. Na justificativa, não afirmar grande distorção nos votos de legenda: o erro de soma pesa sobretudo nos votos nominais de cargos majoritários (0 votos de legenda afetados em 2016 e 2018; 681 em 2020; 40 em 2024).
- **Verificação:** Reproduzi tudo de forma independente, com scripts em C:/Users/eduar/Downloads/rv/cetico-pr3/q1.py a q5.py (DuckDB, cp1252, all_varchar, sem ignore_errors).

TEXTO DO DOC (git show origin/pr/3:docs/der-modulo-eduardo.md):
- Linha 165: "identifica só dentro do ano". Linha 167: "identidade dentro do ano". Linha 179: "uma linha por `(ano, partido)` distinto". Linhas 182 e 185: "dentro do ano é 1:N" e "no mesmo ano". Linha 223: "nula em 2016–2020".
- id_eleicao só aparece como stub (linha 84, "stub - modulo 1"), sem definição.
- Linha 42 diz "sem exceção", mas o contrato de chaves (origin/pr/3:docs/estrategia.md, linha 206) só traz "eleicao.ano + nr_turno" e não tem id_eleicao nem cod_cargo.
- A PK de VOTACAO_LEGENDA_MUNICIPIO leva id_eleicao e nr_turno juntos (linhas 106-107). Isso indica que o autor pensou id_eleicao como "ano".
- A palavra "suplementar" não aparece no doc, e nenhum filtro de CD_TIPO_ELEICAO é citado.
- Já o der-davi.md (origin/pr/4) define ELEICAO.CD_ELEICAO como "um codigo por turno".

CONSULTA_CAND (q1/q2):
- 2022, conflitos (ano, partido) fora os -1: PT {101, 2} e PSOL {102, 3}. As federações 101 e 102 vêm só de CD_ELEICAO 6278, "Eleição Suplementar Governador 2026" (4 linhas). Por (CD_ELEICAO, partido): 0 conflitos. Só na ordinária: 0.
- 2024:
  - Federação 103 (PRD e SOLIDARIEDADE) tem 5 linhas e a 104 (PP e UNIÃO) tem 15. Todas têm CD_TIPO_ELEICAO = 1 e CD_ELEICAO entre 6265 e 6293.
  - Na ordinária, os quatro partidos são só -1: PP 39.920 linhas, PRD 17.096, UNIÃO 36.623, SOLIDARIEDADE 15.105.
  - Então, tirando o -1, não há violação da PK, mas o partido ganha uma federação errada.
- 2020: 79 linhas com federação, todas suplementares (CD 563-630). Isso é um achado extra que o revisor não explicitou: tirando o -1, PARTIDO_FEDERACAO de "2020" recebe 5 vínculos falsos (PT e PCdoB na 2, PSDB e CIDADANIA na 1, PSOL na 3).
- Número de federação com mais de um NM_FEDERACAO: 1 caso em 2020 e 3 em 2024, como o revisor disse. Porém é só diferença de maiúsculas ("Federação PSDB Cidadania" vs "FEDERAÇÃO PSDB CIDADANIA"). SG_FEDERACAO e DS_COMPOSICAO_FEDERACAO não divergem em nenhum ano. Essa sub-evidência é cosmética e não prova problema de chave.

VOTACAO_PARTIDO_MUNZONA (q3/q4/q5):
- Grupos (turno, cargo, município, partido) com mais de um CD_ELEICAO: 217 em 2016, 564 em 2018, 164 em 2020, 0 em 2022 e 41 em 2024. Os números batem exatamente. Com filtro CD_TIPO_ELEICAO = '2', são 0 em todos os anos.
- 2020: 33 linhas com NR_FEDERACAO diferente de -1 (13 na federação 1, 19 na 2, 1 na 3), todas suplementares. Nas ordinárias de 2016, 2018 e 2020 há 0 linhas com federação.
- Nenhum CD_ELEICAO tem mais de um NR_TURNO (0 casos nos 5 anos). Portanto nr_turno depende funcionalmente de CD_ELEICAO.

RESSALVA DE MAGNITUDE (exagero parcial em "soma eleição ordinária com suplementar"):
- Nas linhas suplementares que colidem, os votos de legenda (a métrica da Q5) são 0 em 2016 (Prefeito) e 2018 (Senador MT), 681 em 2020 (Vereador) e 40 em 2024.
- O que infla muito é qt_votos_nominais_partido: 1.263.820 votos em 2016, 648.148 em 2018, cerca de 700 mil em 2020 e cerca de 186 mil em 2024. Quase tudo é de cargo majoritário.
- Conclusão: a soma indevida existe, mas o efeito no total de legenda é pequeno.

O ponto central se sustenta integralmente:
- 2022: violação real da PK de PARTIDO_FEDERACAO.
- 2020 e 2024: atribuição silenciosa de federação errada.
- "nula em 2016-2020" é falso no arquivo.
- "sem exceção" no contrato é falso.

Nota adjacente, fora do escopo do achado: os stubs de Dudu e Davi também não casam. MUNICIPIO tem PK cod_ibge INTEGER no PR #3 e PK CD_MUNICIPIO VARCHAR(5) com COD_IBGE como UK no PR #4. O cargo é cod_cargo no PR #3 e CD_CARGO no PR #4.

### [alta] `pr3-dudu-02` — confirmado

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** O doc diz que cod_tse VARCHAR(5) serve 'so na carga, para resolver SG_UE -> cod_ibge'. Em 2018/2022 o SG_UE de votacao_partido_munzona e a sigla da UF, entao nao resolve municipio nenhum. E o CD_MUNICIPIO desse arquivo vem SEM zero a esquerda em 2016, 2020, 2022 e 2024, entao o join texto com texto na ponte perde linhas sem dar erro. O detalhe_votacao_munzona tem 5 digitos, o que explica por que o teste do estrategia.md passou.
- **Evidência:** q11.py, comprimento de CD_MUNICIPIO em votacao_partido_munzona 2024: 2 digitos em 221 linhas, 3 em 572, 4 em 7.069 e 5 em 72.752. Em 2022: 657/3.431/41.153/491.918. Em 2018: sempre 5. No detalhe_votacao_munzona: sempre 5. q12.py, join com municipio_tse_ibge.CD_MUNICIPIO_TSE: em 2024, 7.862 de 80.614 linhas orfas (519 municipios) com join direto e 0 com lpad(CD_MUNICIPIO,5,'0'). Em 2022, 47.594 de 537.159 orfas (700 municipios) no direto e 2.353 com lpad, estas todas SG_UF='ZZ' (exterior, ex.: MUMBAI, LOS ANGELES). SG_UE em 2018/2022 tem 2 caracteres ('AC'...).
- **Correção:** Mantenho a correção, com dois ajustes.

(1) Na carga de VOTACAO_LEGENDA_MUNICIPIO, resolver cod_ibge por lpad(CD_MUNICIPIO,5,'0') = municipio_tse_ibge.CD_MUNICIPIO_TSE em todos os anos. Motivo: nos anos municipais funciona igual ao SG_UE (os dois coincidem em 100% das linhas) e nos anos gerais é a única coluna com o município. Nunca resolver por SG_UE, que em 2018/2022 é a UF ou 'BR'.

Excluir da carga:
- SG_UF='ZZ': só Presidente, legenda 0, sem cod_ibge.
- O cargo Presidente, se não houver legenda útil nele.
- As 17 linhas de 2018 da eleição 339 (Conselho Distrital FN), que não são eleição federal nem estadual.

Na linha 47, trocar "para resolver SG_UE → cod_ibge" por "para resolver lpad(CD_MUNICIPIO,5,'0') → cod_ibge nos arquivos de resultado; SG_UE só para CANDIDATURA em eleição municipal". Acrescentar um teste de carga: contar as linhas sem cod_ibge (fora ZZ) e exigir 0.

(2) Registrar o lpad como regra do contrato de chaves (seção 3 do estrategia.md, no main). A frase "Os dois lados trazem o zero à esquerda" é falsa para votacao_partido_munzona (2016/2020/2022/2024) e para votacao_candidato_munzona (2016/2020/2024). O "testado, o join casa" vale só para o detalhe_votacao_munzona, e não para "detalhe/votacao_candidato", como dizia a correção original.
- **Verificação:** Refiz tudo de forma independente, com os scripts C:/Users/eduar/Downloads/rv/cet_pr3_02/m.py e m2.py (saída em m2.out). Usei DuckDB no modo estrito (sem ignore_errors) sobre os arquivos resultados/<ano>/*_BRASIL.csv e extras/municipio_tse_ibge/municipio_tse_ibge.csv. A ponte tem 5.571 linhas e o CD_MUNICIPIO_TSE sempre tem 5 caracteres.

1) O que o doc diz. Em `git show origin/pr/3:docs/der-modulo-eduardo.md`, a linha 47 traz: "`municipio.cod_tse` | `VARCHAR(5)` | só na carga, para resolver `SG_UE` → `cod_ibge`". Procurei por CD_MUNICIPIO, ZZ, exterior, lpad e zero no doc inteiro e não achei nada (exit 1). A única regra de resolução escrita no doc é, portanto, via SG_UE.

2) SG_UE em votacao_partido_munzona:
- 2018: 607.079 das 607.096 linhas têm 2 caracteres. As 17 que têm 5 são da "Eleição Conselho Distrital 2018 FN".
- 2022: 537.159 de 537.159 têm 2 caracteres. O valor é a UF ou 'BR' para presidente (ex.: OIAPOQUE aparece com SG_UE='AP'; SUCUPIRA DO NORTE com 'BR').
- Nos anos municipais, SG_UE = lpad(CD_MUNICIPIO,5,'0') em 100% das linhas: 2016 125.816/125.816, 2020 79.134/79.134, 2024 80.614/80.614.
Conclusão: seguindo o doc, a resolução falha em todas as linhas de 2018 e 2022, justamente os anos das federações, que são o centro da Q5.

3) Comprimento de CD_MUNICIPIO em votacao_partido_munzona. Os números batem exatamente com o achado:
- 2024: 221/572/7.069/72.752 linhas com 2/3/4/5 dígitos.
- 2022: 657/3.431/41.153/491.918.
- 2016: 447/905/12.835/111.629.
- 2020: 283/540/7.589/70.722.
- 2018: sempre 5 dígitos.
- detalhe_votacao_munzona: sempre 5 dígitos em todos os anos.

4) Linhas órfãs no join direto (texto com texto), comparado com o join via lpad:
- 2024: 7.862 órfãs em 519 municípios no direto; 0 com lpad.
- 2022: 47.594 órfãs em 700 municípios no direto; 2.353 com lpad, todas com SG_UF='ZZ'.
- 2016: 14.187 órfãs em 519 municípios no direto; 0 com lpad.
- 2020: 8.412 órfãs em 519 municípios no direto; 0 com lpad.
Votos de legenda perdidos em silêncio no join direto (fora ZZ): 2024 359.540 de 4.530.299 (7,9%), 2022 1.068.816 de 11.644.715 (9,2%), 2016 691.756 de 7.364.754, 2020 567.384 de 5.949.420.

5) Exterior (ZZ): as linhas ZZ existem só para cargo Presidente e têm QT_VOTOS_LEGENDA_VALIDOS = 0 nos dois anos (2018: 1.539 linhas; 2022: 2.353). Confirma que "não tem legenda".

6) O teste do estrategia.md: o detalhe_votacao_munzona 2024 tem 5.569 municípios distintos, exatamente o número citado ("5.569 de 5.569, zero órfãos"). Então o teste foi feito provavelmente sobre o detalhe. A explicação do achado é plausível.

7) Um trecho da correção proposta está errado. O achado diz que o "testado, o join casa" do estrategia.md "só vale para detalhe/votacao_candidato". Isso não se sustenta: votacao_candidato_munzona também vem sem zero à esquerda nos anos municipais.
- 2024: 2.535/3.410/62.555/648.746 linhas com 2/3/4/5 dígitos (5/47/467/5.049 municípios).
- 2016: 4.045/3.534/82.362/853.141.
- 2020: 3.709/3.863/88.418/887.624.
Só o detalhe_votacao_munzona tem sempre 5 dígitos.

Nota sobre a categoria "chave-errada": as PKs e FKs do DER (cod_ibge em VOTACAO_LEGENDA_MUNICIPIO) estão certas. O erro está na regra de carga que resolve cod_ibge. A severidade alta se mantém porque, seguindo o doc, a Q5 não carrega 2018/2022 no grão de município. E quem trocar para CD_MUNICIPIO sem lpad, confiando no estrategia.md, perde de 8% a 9% dos votos de legenda sem nenhum erro.

### [media] `pr3-dudu-03` — parcial

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** Os stubs PARTIDO {nr_partido PK} e CANDIDATURA {sq_candidato PK} tem PK que nao e unica nos dados. NR_PARTIDO e reaproveitado entre anos (FATO 3). E consulta_cand repete o SQ_CANDIDATO do candidato de 2o turno (uma linha por turno). Alem disso, o caminho da Q4 na secao 7 diz que 'os dois lados fecham em MUNICIPIO', mas o stub CANDIDATURA nao tem municipio, e a secao 8 do proprio doc diz que ela nao tem essa coluna.
- **Evidência:** q19.py em votacao_partido_munzona: 25 = DEM (2016-2020) e PRD (2024); 44 = PRP (2016-2018) e UNIAO (2020+); 36 = PTC (ate 2020) e AGIR (2022+); 15 valores de NR_PARTIDO com mais de uma sigla entre arquivos. q15.py em consulta_cand: SQ_CANDIDATO repetido em 228 SQs (2016), 60 (2018), 232 (2020), 52 (2022) e 204 (2024), sempre uma linha NR_TURNO=1 e outra NR_TURNO=2. No PI 2020, 2 PDFs de proposta casam com 2 linhas cada. Linhas 80-91 e 389 do doc.
- **Correção:** (a) PARTIDO: declarar o stub com PK (ano, nr_partido), conforme a decisao 3. Tornar compostas as FKs de PARTIDO_FEDERACAO e VOTACAO_LEGENDA_MUNICIPIO. Como elas usam id_eleicao, o ano sai de ELEICAO ou entra direto, porque CD_ELEICAO muda entre turnos e em eleicao suplementar (FATO 4). Fazer a mesma correcao no modulo 1 do PR #4 (der-davi.md, linhas 315-319, e dossie/der.mmd, linhas 84-88). No texto, corrigir o exemplo: 36 (PTC para AGIR) e 33 (PMN para MOBILIZA) sao troca de nome; reuso real e 25, 44 e 20. (b) CANDIDATURA: manter a PK sq_candidato, que e a certa para a candidatura. Documentar que consulta_cand tem uma linha por turno e que a carga deduplica por SQ. Os unicos campos que variam entre as linhas (NR_TURNO, CD_ELEICAO, DT_ELEICAO, CD_SIT_TOT_TURNO) vao para uma entidade de turno ou resultado, e o PR #4 precisa tirar CD_ELEICAO e CD_SIT_TOT_TURNO de CANDIDATURA. Sem dedup, a FK de PROPOSTA_GOVERNO quebra em 2 PDFs do PI 2020, e a Q4 conta duas vezes os candidatos de 2o turno. (c) Caminho Q4/Q6: no PR #3, acrescentar ao stub CANDIDATURA os atributos cod_ibge FK ('so eleicao municipal, derivado de SG_UE') e nr_partido FK, com as ligacoes MUNICIPIO ||--o{ CANDIDATURA e PARTIDO ||--o{ CANDIDATURA. Reescrever a linha 399 para dizer que a coluna e derivada de SG_UE, e nao que ela nao existe. Isso alinha com dossie/der.mmd (linha 101), que ja tem cod_ibge. Resolver no PR #4 a divergencia com der-davi.md, que usa CD_MUNICIPIO VARCHAR(5). (d) Extra: tornar nr_sequencial opcional, ou default 1, porque os PDFs de 2020 e 2022 nao tem sufixo _NN.
- **Verificação:** Li origin/pr/3:docs/der-modulo-eduardo.md e rodei scripts proprios em Python (csv, latin-1; o DuckDB com cp1252 quebra na linha 379.610 do consulta_cand_2016 por byte invalido). Scripts em C:/Users/eduar/Downloads/rv/cet_pr3_03/.

1) PARTIDO {nr_partido PK}: CONFIRMADO. O stub esta nas linhas 80-82 do doc. part.py em votacao_partido_munzona 2016-2026 _BRASIL: 52 NR_PARTIDO, 16 deles com mais de uma sigla (o achado diz 15; provavelmente 'PC do B' e 'PCDOB' foram contados como um so). Reuso de verdade: 25 = DEM (2016-2020) e PRD (2024); 44 = PRP (2016-2018) e UNIAO (2020+, com 2020 vindo de suplementar); 20 = PSC (2016-2022) e PODE (2024), caso que o achado nao cita. RESSALVA: 36 = PTC para AGIR e 33 = PMN para MOBILIZA sao troca de nome do mesmo partido, nao reuso. O exemplo do 36 esta mal classificado. Mesmo assim, uma linha por numero nao comporta nem reuso nem troca de nome. O doc contradiz a decisao 3 do estrategia.md ('PARTIDO fica identificado pelo numero dentro do ano') e a propria logica que ele usa para FEDERACAO (PK id_eleicao+nr_federacao, linhas 163-167). O problema nao e so do PR #3: origin/pr/4 tem o mesmo erro em docs/der-davi.md (linhas 315-319) e docs/dossie/der.mmd (linhas 84-88).

2) CANDIDATURA {sq_candidato PK}: OS NUMEROS BATEM, A CONCLUSAO ESTA EXAGERADA. sq2.py deu SQ repetido em 228 (2016), 60 (2018), 232 (2020), 52 (2022) e 204 (2024), sempre com o par de turnos '1,2' e CD_ELEICAO diferente. pdf.py confirmou que, no PI 2020, os PDFs 180001033351 e 180000652870 (prefeito de Teresina) casam com 2 linhas cada; em 2022 e 2024 nenhum PDF casa com mais de uma linha. Mas diff.py mostra que, entre as duas linhas do mesmo SQ, so mudam NR_TURNO, CD_ELEICAO, DT_ELEICAO, CD_SIT_TOT_TURNO e DS_SIT_TOT_TURNO. Partido, instrucao e todos os outros atributos da candidatura sao iguais. Entao SQ_CANDIDATO (2010+) e a PK certa da entidade candidatura. A repeticao e o grao do arquivo (uma linha por turno), resolvido com dedup na carga e atributos de turno numa entidade separada. Dizer que a PK nao e unica vale para o arquivo cru, nao para a entidade. Quem tem conflito real e o modulo 1 do PR #4: der-davi.md (linhas 54-59 e 168-175) poe CD_ELEICAO e CD_SIT_TOT_TURNO dentro de CANDIDATURA com PK SQ.

3) Caminho da Q4: CONFIRMADO como inconsistencia interna. A linha 389 diz 'os dois lados fecham em MUNICIPIO'. A linha 399 diz que 'CANDIDATURA nao tem coluna de municipio'. No diagrama, CANDIDATURA so tem ligacao com GRAU_INSTRUCAO e PROPOSTA_GOVERNO, sem MUNICIPIO nem PARTIDO, entao o caminho da Q6 (linha 391, CANDIDATURA -> PARTIDO / MUNICIPIO) tambem nao fecha no diagrama. Atenuante: a secao 8 explica o vinculo por SG_UE em eleicao municipal. E o modulo 1 ja expoe o municipio: origin/pr/4:docs/dossie/der.mmd linha 101 tem 'int cod_ibge FK "apenas eleicao municipal"'. Porem der-davi.md usa CD_MUNICIPIO VARCHAR(5), que e o codigo TSE, e isso diverge do dossie.

Achado lateral: os PDFs de 2020 (527 SQs) e 2022 (9) se chamam {ano}PI{SQ}.pdf, sem o '_seq'. O nr_sequencial 'o _01 do nome do arquivo' (linha 137) nao existe nesses anos.

### [media] `pr3-dudu-04` — confirmado

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** GRAU_INSTRUCAO e declarada com 'oito linhas, 1..8', mas o arquivo tem os codigos -4 (NAO DIVULGAVEL) e 0 (NAO INFORMADO), que nao se encaixam em nivel nenhum do Censo e quebram a FK de CANDIDATURA. A afirmacao 'sete das oito linhas sao identidade' esta errada: o mapeamento e de 8 para 4, muitos para um, e perde informacao do lado do TSE.
- **Evidência:** q1.py, DISTINCT CD/DS_GRAU_INSTRUCAO por ano. -4 aparece em 2012 (1.122), 2016 (109), 2018 (108), 2020 (284), 2022 (29), 2024 (46) e 2026 (3). 0 aparece em 2002 (633), 2004 (5.754) e 2006 (2). O DS muda: 2002/2004 usam 'FUNDAMENTAL INCOMPLETO' e 'MEDIO COMPLETO', 2006+ usam 'ENSINO FUNDAMENTAL INCOMPLETO'. O codigo 1 ANALFABETO nao existe em 2002-2006, 2014, 2018, 2022 e 2026. O de-para real fica {1,2,3}->1, {4,5}->2, {6,7}->3, {8}->4: nenhuma linha e identidade, mas nenhum codigo TSE se divide entre dois niveis, entao do lado IBGE nao ha perda. Linhas 122-127, 241-243 e 305 do doc.
- **Correção:** 1) Na seção 3 e no diagrama, trocar GRAU_INSTRUCAO para "10 linhas: 1..8 mais os sentinelas -4 'NÃO DIVULGÁVEL' e 0 'NÃO INFORMADO'", ambos com cd_nivel_comparavel NULL. Mudar o comentário da PK (L123) para "-4, 0, 1..8".

2) Mudar a cardinalidade L69 para `NIVEL_INSTRUCAO_COMPARAVEL |o--o{ GRAU_INSTRUCAO` (FK opcional). A relação L71 `GRAU_INSTRUCAO ||--o{ CANDIDATURA` continua obrigatória, porque os sentinelas passam a existir como linhas. Acrescentar `int cd_grau_instrucao FK` no stub CANDIDATURA, para a FK ficar visível.

3) Corrigir L315-316, "Se algum código divergir, muda a tabela, não o modelo": a medição mostra que muda o modelo, já que a cardinalidade passa a ser opcional. Fechar o bloco "A conferir" (L312-316) com o resultado medido: códigos por ano e o fato de o código 1 não aparecer em 2002-2006, 2014, 2018, 2022 e 2026. Corrigir também L330-331, de "tabela de 8 linhas" para 10.

4) Trocar "Sete das oito linhas são identidade" por "o agrupamento não tem ambiguidade: cada código do TSE cabe inteiro em um nível do Censo". A tabela de-para da seção 4 fica como está, porque está correta.

5) Declarar na seção 8 que candidatos com -4/0 saem da Q4, com a contagem medida. Nacional: 2016=109, 2018=108, 2020=284, 2022=29, 2024=46, 2026=3. PI: só 2020, com 10. O código 0 só aparece em 2002-2006, fora do escopo da Q4.

6) Registrar que o DS muda entre 2004 e 2006 e que a dimensão usa o CD como chave, com o texto da geração 2006+. A tabela da seção 4 já usa esse texto; falta dizer isso explicitamente para a carga, para ela não gerar dois DS por código.
- **Verificação:** 1) Li o arquivo no ref indicado: `git -C C:/Users/eduar/Downloads/bdr/analiseCandidatos show origin/pr/3:docs/der-modulo-eduardo.md`. As linhas citadas batem:
- L123: `int cd_grau_instrucao PK "1..8 - escala do TSE"`
- L241-243: "Oito linhas, a escala do TSE"
- L305: "Sete das oito linhas são identidade."
- L71: `GRAU_INSTRUCAO ||--o{ CANDIDATURA : "classifica"`, ou seja, CANDIDATURA leva FK obrigatória para GRAU_INSTRUCAO.
- L69: `NIVEL_INSTRUCAO_COMPARAVEL ||--o{ GRAU_INSTRUCAO`, ou seja, todo grau tem obrigatoriamente um nível.
- Um grep por '-4|não informado|não divulg' só encontra o -4 do CPF (L172). O doc não menciona sentinela de instrução.

2) Rodei `C:/Users/eduar/Downloads/rv/cetico_pr3_04/q.py`: DuckDB em modo estrito, sem ignore_errors, com GROUP BY CD_GRAU_INSTRUCAO, DS_GRAU_INSTRUCAO sobre consulta_cand_<ano>_BRASIL.csv de 2002 a 2026. Os números saíram idênticos aos do revisor.
- -4 'NÃO DIVULGÁVEL': 2012=1.122, 2016=109, 2018=108, 2020=284, 2022=29, 2024=46, 2026=3.
- 0 'NÃO INFORMADO': 2002=633, 2004=5.754, 2006=2.
- O código 1 ANALFABETO não aparece em 2002, 2004, 2006, 2014, 2018, 2022 nem 2026.
- O DS muda de geração: 2002/2004 usam 'FUNDAMENTAL INCOMPLETO' e 'MÉDIO COMPLETO'; de 2006 em diante, 'ENSINO FUNDAMENTAL INCOMPLETO' e 'ENSINO MÉDIO COMPLETO'.
- Os códigos 2 a 8 existem em todos os anos.
- Os arquivos têm 10 códigos distintos, não 8.

3) Rodei também `q2.py` só para o PI. Linhas com -4/0: 2002=12, 2004=70, 2012=14, 2020=10 (de 10.706). De 2016 a 2026, fora 2020, são 0.

Conclusão: o defeito central se reproduz. A dimensão foi declarada com 8 códigos, mas os dados têm 10. Os códigos -4 e 0 não têm nível no Censo, então tanto a FK obrigatória GRAU_INSTRUCAO→NIVEL quanto a FK CANDIDATURA→GRAU_INSTRUCAO (se GRAU_INSTRUCAO tiver só as linhas 1..8) quebram.

A crítica a "identidade" também procede: 8→4 é agrupamento muitos-para-um, não identidade. Duas ressalvas, que não invalidam o achado:
(a) A tabela de-para da seção 4 (L294-303) está certa. O de-para do revisor, {1,2,3}→1, {4,5}→2, {6,7}→3, {8}→4, é exatamente o do doc; o erro é só de vocabulário.
(b) A "perda de informação do lado do TSE" é inerente e intencional numa comparação com o Censo, não é defeito.

Impacto numérico na Q4: pequeno. Nos anos municipais nacionais fica em até 0,05% (284/558.804 em 2020), e no PI só há 10 casos em 2020. Uma FK declarada falha de forma visível na carga, não em silêncio. A severidade média se justifica porque o entregável é o próprio DER: a cardinalidade está errada e o item do checklist "Toda FK aponta para PK que existe" (L434) está marcado [x] indevidamente.

### [media] `pr3-dudu-05` — confirmado

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** O padrao '{ano}{UF}{SQ_CANDIDATO}_{seq}.pdf', de onde sai nr_sequencial ('o _01 do nome do arquivo'), so vale para 2024 e 2026. De 2016 a 2022 o nome nao tem sufixo. Ha ainda PDFs cujo SQ nao existe em consulta_cand, o que viola a FK para CANDIDATURA. E o '504 PDFs' conta o leiame.pdf e ignora os outros anos do corpus.
- **Evidência:** q15.py e find. Nomes sem sufixo (padrao 9999PI999999999999.pdf): 561 em 2016, 10 em 2018, 527 em 2020 e 9 em 2022. Com _NN: 503 em 2024 (497 SQ distintos, 6 com _02) e 12 em 2026. O PI/ de 2024 tem 504 arquivos, um deles leiame.pdf. Total de propostas nos 6 anos: 1.622 (os zips de 2016 e 2020 tem 321 MB e 308 MB). SQs orfaos, ausentes do consulta_cand do ano e de qualquer ano 2014-2026 (q16.py): 25 de 561 em 2016, 5 de 497 em 2024, 1 de 12 em 2026, 0 em 2018/2020/2022. Tambem nao estao no consulta_cand_<ano>_PI.csv do zip completo.
- **Correção:** Mantenho a correção do revisor, com quatro ajustes.

(a) Parse: aplicar o regex ancorado `^(\d{4})([A-Z]{2})(\d{12})(?:_(\d+))?\.pdf$` só a arquivos dentro de PI/, com `nr_sequencial = coalesce(int(grupo 4), 1)`. Descartar leiame.pdf sem diferenciar maiúsculas, porque 2018 e 2020 trazem LEIAME.pdf.

(b) Escopo: declarar no documento quais anos entram na Q6. Se for só 2024, trocar os números para 503 PDFs de proposta, 497 candidaturas e 5 SQs órfãos. Se for o corpus todo, são 1.622 PDFs, e 2016 e 2020 são os mais pesados (320 e 307 MiB).

(c) Órfãos: decidir e declarar o destino dos 31 (25 de 2016, 5 de 2024, 1 de 2026) antes de carregar com FK obrigatória para CANDIDATURA. As duas opções são descartar com contagem declarada ou manter com FK opcional e flag.

(d) Texto: na L264, deixar claro que 504 é o total de arquivos do zip, dos quais 1 é leiame. Na L336, trocar para 503. Nas L267-268, dizer que o sufixo `_{seq}` só existe a partir de 2024 e que antes disso vale nr_sequencial = 1.
- **Verificação:** Rodei tudo de novo, sem reaproveitar os scripts q15.py e q16.py do revisor.

1) Texto do PR (git show origin/pr/3:docs/der-modulo-eduardo.md):
- L137: `nr_sequencial PK "o _01 do nome do arquivo"`.
- L264: "Fonte: `proposta_governo_{ano}_PI.zip`. Só 2024 tem **504 PDFs / 328 MB**".
- L267-268: o padrão é dado como universal, `{ano}{UF}{SQ_CANDIDATO}_{seq}.pdf`.
- L336: "extrair texto de 504 PDFs".
- O documento nunca restringe a Q6 a 2024. A fonte é parametrizada por `{ano}` e existe o atributo `ano_eleicao`.

2) Nomes de arquivo (find + awk sobre dados/raw/proposta_governo/<ano>/proposta_governo_<ano>_PI):

| ano | sem sufixo | com _NN | leiame |
|---|---|---|---|
| 2016 | 561 | 0 | 1 |
| 2018 | 10 | 0 | 1 (LEIAME.pdf) |
| 2020 | 527 | 0 | 1 (LEIAME.pdf) |
| 2022 | 9 | 0 | 1 |
| 2024 | 0 | 503 | 1 |
| 2026 | 0 | 12 | 1 |

- 2024: 497 SQ distintos, com 497 `_01` e 6 `_02`. Todo `_02` tem um `_01` do mesmo SQ.
- 2026: 12 SQ distintos, todos `_01`.
- O regex estrito `^[0-9]{4}[A-Z]{2}[0-9]{12}(_[0-9]+)?\.pdf$`, sensível a maiúsculas, casa 1.622 arquivos. Sobram só os 6 leiame/LEIAME.
- Listagem dos zips com zipfile: 2024 tem 504 arquivos e 327,9 MiB descomprimidos (bate com os "328 MB"). Os zips de 2016 e 2020 têm 335.853.537 e 322.353.468 bytes (320,3 e 307,4 MiB). Os "321/308 MB" do revisor são arredondamento aproximado, sem efeito no achado.

3) SQs órfãos (C:/Users/eduar/Downloads/rv/cetico-pr3-05/orf.py):
- O script lê consulta_cand_<ano>_BRASIL.csv de 2014 a 2026 no DuckDB em modo estrito, sem ignore_errors.
- Resultado: 2016 tem 25 órfãos em 561, 2024 tem 5 em 497, 2026 tem 1 em 12. 2018, 2020 e 2022 têm 0.
- Os 31 também não aparecem na união dos 7 anos.
- Exemplos em 2024: 180001985797, 180001998664, 180002005327, 180002127755, 180002205787. Em 2026: 180002533958.
- Também procurei no consulta_cand_<ano>_PI.csv de dentro dos zips completos:
  - 2024 e 2026: nenhuma ocorrência.
  - 2016: 180000000818 e 180000000840 aparecem, mas só na coluna SQ_COLIGACAO. O csv.reader confirmou que nunca aparecem em SQ_CANDIDATO.

Ressalvas:
- "504 PDFs" é literalmente verdade como contagem de arquivos do zip, e o fontes-de-dados.md do próprio PR avisa que cada zip traz um leiame.pdf. Mas como número de propostas o certo é 503. A L336, que fala em extrair texto, está errada: seria 503.
- "Só 2024 tem" é ambíguo, mas o documento de fato não menciona os 1.107 PDFs de 2016 a 2022.
- A tese central do PR continua certa e é confirmada pelos 6 `_02` de 2024: PK composta e cardinalidade `||--o{`.

### [media] `pr3-dudu-06` — confirmado

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** A secao 8 deixa em aberto a taxa de PDFs escaneados, e medi essa taxa. A regra derivada fl_texto_extraido = qt_caracteres > 0 classifica como 'texto extraido' PDFs que so tem texto num cabecalho e o resto escaneado.
- **Evidência:** pdftotext 4.00 (xpdf) sobre os 1.622 PDFs; textos em C:/Users/eduar/Downloads/rv/pr3/txt. Zero caracteres nao brancos: 154 de 561 em 2016 (27,5%), 71 de 527 em 2020 (13,5%), 41 de 503 em 2024 (8,2%) e 0 em 2018 (10), 2022 (9) e 2026 (12). Total: 266 de 1.622 (16,4%). Outros 9 PDFs tem mais de 0 e menos de 200 caracteres por pagina, ex.: 2016PI180000003260 (87 caracteres em 40 paginas) e 2024PI180002104236_01 (103 em 11) e _02 (68 em 11). Pela regra do doc esses 9 ficariam com fl_texto_extraido = true. Linhas 142, 371 e 420-426 do doc.
- **Correção:** (a) Redefinir `qt_caracteres` para contar só caracteres não brancos, por exemplo `length(regexp_replace(tx_conteudo, '\s', '', 'g'))`, e não `length(tx_conteudo)`. Com pdftotext, todo PDF escaneado tem length entre 1 e 43 (quebras de página e espaços), então a regra `> 0` atual marca os 1.622 como texto extraído.

(b) Adicionar a coluna derivada `qt_paginas_com_texto` e definir `fl_texto_extraido = qt_paginas_com_texto / qt_paginas >= 0.5 AND qt_caracteres / qt_paginas >= 100`, declarando os limites. Com pdftotext, essa regra exclui 274 PDFs (os 266 vazios mais 8 com capa, marca d'água ou texto corrompido) e mantém o 2020PI180001210646. Esse é um texto legítimo com 189,8 caracteres por página, que o limite único de 200 descartaria por engano.

(c) Se quiserem pegar camada de texto corrompida por codificação de fonte, considerar também uma proporção mínima de letras entre os caracteres não brancos. Dois casos apareceram: 2024PI180002301846_01 tem 9% de letras e 2024PI180002303107_01 tem 0%.

(d) Trocar o "Falta medir" da seção 8 pelos números medidos: 266 de 1.622 sem texto (16,4%). Por ano: 2016 com 27,5%, 2020 com 13,5% e 2024 com 8,2%. Em 2018, 2022 e 2026 a perda é zero. Registrar que esses números valem para pdftotext 4.00. O estrategia.md prevê pypdf ou pdfplumber, e com eles a medição não foi verificada.

(e) Declarar a perda por ano na Q6, ou restringir as comparações a 2020 e 2024, que têm volume e perda menor.
- **Verificação:** Refiz a medição por conta própria e não reaproveitei os textos do revisor. Os textos novos estão em C:/Users/eduar/Downloads/rv/cet-pr3-06/txt e os números em C:/Users/eduar/Downloads/rv/cet-pr3-06/medidas.csv (script run.py).

(1) Documento: `git show origin/pr/3:docs/der-modulo-eduardo.md`. A linha 142 traz `fl_texto_extraido "DERIVADA - false = PDF escaneado"`. A linha 371 diz "`qt_caracteres > 0` — falso indica PDF escaneado". A linha 372 define `qt_caracteres = length(tx_conteudo)`. As linhas 420-426 dizem "Falta medir: taxa de PDFs escaneados na Q6". As referências de linha do achado estão certas.

(2) Corpus: find em dados/raw/proposta_governo achou 1.628 PDFs. Seis são leiame, então sobram 1.622 propostas: 561 em 2016, 10 em 2018, 527 em 2020, 9 em 2022, 503 em 2024 e 12 em 2026.

(3) Extração: rodei pdftotext 4.00 (-enc UTF-8) nos 1.622 arquivos, sem nenhum erro (rc != 0 em 0 casos). Contei como página cada \f.
- PDFs sem nenhum caractere não branco: 154/561 em 2016 (27,5%), 0/10 em 2018, 71/527 em 2020 (13,5%), 0/9 em 2022, 41/503 em 2024 (8,2%) e 0/12 em 2026. Total 266/1.622 (16,4%). Bate exatamente com o achado.
- PDFs com texto mas menos de 200 caracteres por página: 9, exatamente os citados. 2016PI180000003260 tem 87 caracteres em 40 páginas, 2024PI180002104236_01 tem 103 em 11 e o _02 tem 68 em 11.

(4) Achei um problema mais grave que o do achado. Com pdftotext, os 266 PDFs "vazios" têm length(texto) entre 1 e 43, só \f e espaços. Ou seja, length(tx_conteudo) > 0 vale para 1.622 de 1.622. Aplicada ao pé da letra, a regra do doc (length > 0) marcaria 100% como texto extraído, e não só os 9. O estrategia.md (linha 366) prevê pypdf ou pdfplumber. Não verifiquei esse comportamento com eles: nenhum dos dois está instalado e baixar pacotes exigiria permissão.

(5) Uma ressalva sobre a descrição dos 9. Nem todos são "cabeçalho com texto e o resto escaneado":
- Quatro são de fato capa ou primeiras páginas com texto e o resto imagem: 2020PI180000727406 (1 de 18 páginas com texto), 2024PI180002182724_01 (1 de 9), 2024PI180002104236_01 (4 de 11, só títulos) e _02 (6 de 11, sumário).
- 2016PI180000003260 só tem a marca d'água "Powered by TCPDF" em 3 de 40 páginas.
- Três têm camada de texto corrompida por codificação de fonte: 2020PI180001050322 (glifos com o caractere de substituição), 2024PI180002301846_01 (374 páginas, só 9% de letras) e 2024PI180002303107_01 (0% de letras, só números e marcadores).
- 2020PI180001210646 é um texto legítimo, com 5.505 caracteres e 189,8 por página ("Duplicar a Avenida São Nicolau..."). O limite de 200 proposto no achado jogaria esse PDF fora por engano.

(6) Testei uma regra combinada: pelo menos 50% das páginas com texto e pelo menos 100 caracteres por página. Ela exclui 274 PDFs (155 em 2016, 73 em 2020, 46 em 2024), que são os 266 vazios mais 8 dos 9, e mantém o 2020PI180001210646.

A severidade média se mantém. O doc declara a lacuna honestamente, mas o atributo derivado, como está definido, não cumpre a função que ele mesmo promete ("false = PDF escaneado").

### [media] `pr3-dudu-07` — confirmado

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** A decisao ⑤ e o grao declarado se apoiam em 'vem duas linhas por combinacao (S e N)' de ST_VOTO_EM_TRANSITO. Isso nao existe em ano nenhum. O grao real do arquivo tambem esta errado: usa ano no lugar de CD_ELEICAO e omite SQ_COLIGACAO.
- **Evidência:** q6.py: ST_VOTO_EM_TRANSITO = 'N' em 100% das linhas de votacao_partido_munzona (125.816 em 2016, 607.096 em 2018, 79.134 em 2020, 537.159 em 2022 e 80.614 em 2024), e tambem 100% 'N' no detalhe_votacao_munzona. q17.py: (CD_ELEICAO, NR_TURNO, CD_CARGO, CD_MUNICIPIO, NR_ZONA, NR_PARTIDO, SQ_COLIGACAO) tem 0 duplicatas em todos os anos. Sem SQ_COLIGACAO ha linhas duplicadas: 960 (2016), 148 (2018), 183 (2020), 7.330 (2022) e 148 (2024); ex.: 2022, Trairi/CE, zona 97, Dep. Estadual, partido 23 com dois SQ_COLIGACAO. Linhas 193-202 e 353-356 do doc.
- **Correção:** 1) Reescrever o grão como CD_ELEICAO × NR_TURNO × CD_CARGO × CD_MUNICIPIO × NR_ZONA × NR_PARTIDO × SQ_COLIGACAO. Esta chave tem 0 duplicatas de 2016 a 2024. Registrar também que o arquivo mistura eleições suplementares, e por isso a chave é CD_ELEICAO e não o ano.

2) Tirar ST_VOTO_EM_TRANSITO da justificativa das linhas 201-202 e da decisão ⑤. A coluna vale 'N' em 100% das linhas; pode ser descartada ou virar filtro/assert (ST_VOTO_EM_TRANSITO='N').

3) Justificar a agregação da seguinte forma: saem zona e SQ_COLIGACAO. As linhas repetidas por SQ_COLIGACAO vêm de coligação trocada ou cancelada. Não é correto somá-las sem cuidado. Em 2016 (191 grupos, 5.352 votos) e em 2018 (74 grupos do AM, 7.048 votos), a linha extra repete o mesmo voto de legenda, e a soma superestima o total em relação ao detalhe_votacao_munzona.

Regra que validei: primeiro MAX por (CD_ELEICAO, NR_TURNO, CD_CARGO, CD_MUNICIPIO, NR_ZONA, NR_PARTIDO), nos campos QT_VOTOS_LEGENDA_VALIDOS, QT_TOTAL_VOTOS_LEG_VALIDOS e QT_VOTOS_NOMINAIS_VALIDOS; depois SUM sobre as zonas até o município. Motivos:
- Nos grupos duplicados, os votos nominais nunca se repetem (MAX = SUM).
- Em 2020-2024, as linhas extras são zeradas (MAX = SUM).
- Com essa regra, o total bate com o detalhe em 74 de 74 zonas afetadas em 2018 e em 139 de 146 em 2016.

Acrescentar ao doc um teste de conciliação contra o detalhe_votacao_munzona (QT_VOTOS_LEG_VALIDOS por zona).
- **Verificação:** Texto do doc (git show origin/pr/3:docs/der-modulo-eduardo.md): nas linhas 193-194 o grão aparece como "ano × turno × cargo × município × zona × partido × ST_VOTO_EM_TRANSITO". As linhas 201-202 dizem "Vêm duas linhas por combinação (S e N)" e as linhas 353-356 repetem o mesmo na decisão ⑤. A PK do Mermaid (linhas 105-110) é (id_eleicao, nr_turno, cod_cargo, cod_ibge, nr_partido).

Rodei DuckDB com os parâmetros do contrato (cp1252, all_varchar, sem ignore_errors) sobre dados/raw/resultados/<ano>/votacao_partido_munzona_<ano>_BRASIL.csv. Scripts em C:/Users/eduar/Downloads/rv/cetico07/v.py a v6.py.

1) ST_VOTO_EM_TRANSITO vale 'N' em 100% das linhas nos cinco anos. Contagens: 125.816 (2016), 607.096 (2018), 79.134 (2020), 537.159 (2022) e 80.614 (2024). O arquivo de 2026 só tem cabeçalho (0 linhas). No detalhe_votacao_munzona também é 100% 'N': 13.137 / 40.476 / 12.630 / 39.982 / 12.486 linhas. A afirmação "duas linhas S e N" não existe em ano nenhum.

2) A chave (CD_ELEICAO, NR_TURNO, CD_CARGO, CD_MUNICIPIO, NR_ZONA, NR_PARTIDO, SQ_COLIGACAO) tem 0 duplicatas em todos os anos. Sem SQ_COLIGACAO, as linhas em grupos duplicados são 960 / 148 / 183 / 7.330 / 148, exatamente os números do revisor. O grão do doc (com ANO_ELEICAO, com ou sem trânsito) duplica ainda mais: 1.420 / 1.316 / 513 / 7.330 / 230 linhas. O exemplo do revisor confere: 2022, Trairi/CE (15717), zona 97, cargo 7, partido 23, SQ 60001685158 (499 nominais, 16 legenda) e SQ 60001682610 (0, 0).

3) PONTO NOVO, que contradiz a frase final da correção ("A soma continua válida"). Somar por SQ_COLIGACAO conta os votos de legenda em dobro em 2016 e 2018. Nesses dois anos, a linha extra repete o mesmo QT_VOTOS_LEGENDA_VALIDOS diferente de zero.
- 2018: são 74 grupos, todos do AM, cargo Dep. Federal, partido 12, com as coligações "EU VOTO NO AMAZONAS I" e "PARTIDO ISOLADO". O excesso é de 7.048 votos em QT_VOTOS_LEGENDA_VALIDOS e em QT_TOTAL_VOTOS_LEG_VALIDOS. A soma por zona dá 100.580, contra 93.532 no detalhe (QT_VOTOS_LEG_VALIDOS). A soma bate com o detalhe em 0 de 74 zonas; deduplicando, bate em 74 de 74.
- 2016: são 191 grupos (Vereador) com excesso de 5.352 votos de legenda (5.882 no total de legenda). A soma bate com o detalhe em 0 de 146 zonas afetadas; deduplicando, bate em 139 de 146.
- Votos nominais nunca se repetem: soma menos máximo = 0 em todos os grupos.
- Em 2020, 2022 e 2024, cada grupo duplicado tem no máximo uma linha com voto (as demais são zeradas), então lá a soma é segura.

Conclusão: o problema e as evidências do revisor se reproduzem exatamente. A correção proposta, porém, tem um erro em 2016 e 2018 (ver o item 3).

### [baixa] `pr3-dudu-08` — não verificado (baixa)

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** A tabela de leiaute dos campos QT_ compara '2018 | 2020+' e diz que os _ANULADOS 'so existem de 2020 em diante'. Mas 2016 tem o mesmo cabecalho de 2020+, e so 2018 difere. A identidade usada para dispensar a coluna renomeada (convertidos = total - legenda) tambem nao vale em todas as linhas.
- **Evidência:** O cabecalho de votacao_partido_munzona_2016_BRASIL.csv traz QT_VOTOS_NOM_CONVR_LEG_VALIDOS, QT_VOTOS_LEGENDA_ANULADOS e QT_VOTOS_NOMINAIS_ANULADOS (8 campos QT_). O de 2018 tem 6, com QT_VOTOS_NOMINAIS_CONVR_LEG. q13.py/q18.py: TOTAL = LEG + CONV vale em 100% das linhas de 2018 e 2022, mas falha em 16 linhas de 2016 (-15.410 votos), 30 de 2020 (-16.706) e 6 de 2024 (-9.540), sempre com TOTAL=0 e CONV>0. Ex.: 2016, RS, Vereador, partido 45: LEG 0, CONV 5.764, TOTAL 0. O arquivo de 2026 so tem cabecalho (1 linha, 671 bytes). Linhas 207-221 e 358-360 do doc.
- **Correção:** Corrigir a tabela: 2016 igual a 2020+, so 2018 diverge. Trocar 'so existem de 2020 em diante' por 'nao existem em 2018'. Se o campo convertido for usado, ler a coluna com os dois nomes de staging ou declarar a divergencia. Registrar que 2026 ainda nao tem votacao.

### [baixa] `pr3-dudu-09` — não verificado (baixa)

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** A secao 8 deixa aberto se o voto de legenda de partido federado sai duplicado. Medi e nao ha duplicacao: o TSE registra a legenda por partido membro, e a soma dos membros bate com o total do detalhe_votacao_munzona.
- **Evidência:** q13.py, soma por (CD_ELEICAO, turno, cargo, lpad(CD_MUNICIPIO), zona) de QT_TOTAL_VOTOS_LEG_VALIDOS em votacao_partido comparada com detalhe_votacao_munzona. Grupos com federacao: 38.607 de 38.607 iguais em 2022 (11.887.865 = 11.887.865) e 7.638 de 7.638 em 2024 (4.330.321 = 4.330.321). q14.py: na federacao 2 em 2022, legenda de PT = 3.040.185, PV = 129.625 e PCdoB = 116.124. Nenhuma linha usa o numero da federacao como NR_PARTIDO.
- **Correção:** Substituir o 'Falta medir' pelo resultado: a Q5 por federacao e SUM sobre os partidos membros (via nr_federacao da propria linha), sem deduplicar.

### [baixa] `pr3-dudu-10` — não verificado (baixa)

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** A derivacao pc_legenda = qt_votos_legenda / (qt_votos_legenda + qt_votos_nominais_partido) divide por zero em muitos grupos e e sempre 0 em cargo majoritario. Ela tambem ignora os votos nominais convertidos em legenda, embora qt_total_votos_legenda seja carregado.
- **Evidência:** q14.py, apos agregar por (eleicao, turno, cargo, municipio, partido): legenda + nominais = 0 em 64.526 de 485.331 grupos (2022) e 4.316 de 64.641 (2024). Legenda = 0 em Governador, Presidente e Senador (2022) e em Prefeito (2024). Convertidos em legenda (q13.py): 243.150 votos em 2022 e 38.974 em 2024. Linha 370 do doc.
- **Correção:** Restringir a Q5 aos cargos proporcionais (CD_CARGO 6, 7, 8, 13), usar NULLIF no denominador e declarar qual numerador vale (qt_votos_legenda ou qt_total_votos_legenda).

### [baixa] `pr3-dudu-11` — não verificado (baixa)

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** Detalhes errados em CENSO_INSTRUCAO. O exemplo de cd_nivel_sidra ('120704') e justamente o codigo do Total, que o proprio doc manda nao carregar. 'O Total e SUM dos outros quatro' nao e exato. cd_nivel_sidra depende so de cd_nivel_comparavel, o que e dependencia transitiva e fere a 3FN. Um municipio com candidatos em 2024 nao tem Censo.
- **Evidência:** 10061_metadados.json, classificacao 1568: 120704 = Total; os niveis sao 9493, 9494, 9495 e 99713. q3.py: Total difere da soma dos 4 niveis em 2.293 de 5.570 municipios (diferencas entre -2 e +2; Brasil 154.309.509 contra 154.309.446), efeito da perturbacao do IBGE. A ponte tem 5.571 municipios e o SIDRA 5.570: falta Boa Esperanca do Norte/MT (IBGE 5101837, TSE 73709), que teve 53 candidaturas em 2024. O JSON tem 27.851 elementos: o primeiro e cabecalho. Linhas 132, 250-255 do doc.
- **Correção:** Trocar o exemplo por 9493/9494/9495/99713 e mover cd_nivel_sidra para NIVEL_INSTRUCAO_COMPARAVEL (relacao 1:1). Dizer 'Total aproximadamente igual a soma (diferenca de +-2 por perturbacao do IBGE)' e usar a soma dos 4 niveis como denominador. Declarar o municipio sem Censo e pular o elemento 0 do JSON na carga.

### [baixa] `pr3-dudu-12` — não verificado (baixa)

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** A justificativa da PK composta de FEDERACAO ('a composicao muda de eleicao para eleicao, entao o numero sozinho nao identifica') nao se sustenta nos dados: nenhum numero foi reaproveitado para outra composicao. O que acontece e o contrario: a mesma federacao recebe numeros diferentes (1 vira 100). A PK composta continua certa. Alem disso, sg_federacao e ds_composicao sao sempre iguais, o formato muda entre anos e a descricao do doc esta errada.
- **Evidência:** q4.py, numero -> composicao igual em todos os arquivos de 2020 a 2026: 1 = PSDB/CIDADANIA (2020-supl, 2022); 100 = PSDB/CIDADANIA (2024, 2026); 2 e 101 = PT/PCdoB/PV; 3 e 102 = PSOL/REDE; 103 = PRD/SOLIDARIEDADE; 104 = UNIAO/PP. q20.py: SG_FEDERACAO = DS_COMPOSICAO_FEDERACAO em 100% das linhas federadas (79; 4.565; 73.788; 6.506). Formato: 'PT/PC do B/PV' em 2020/2022 e '13-PT/65-PC do B/43-PV' em 2024+, nao 'PT / PCdoB / PV' como diz o doc (linha 188). O valor chega a 22 caracteres, e o doc tipa sg_federacao como char. NM_FEDERACAO varia de caixa ('Federacao' e 'FEDERACAO').
- **Correção:** Justificar a PK (id_eleicao, nr_federacao) pelo fato de o numero so ter sentido dentro da eleicao e de a mesma federacao receber numeros diferentes (1 -> 100), sem continuidade garantida. Tipar sg_federacao como varchar, marcar ds_composicao como redundante e normalizar a caixa de nm_federacao na carga.

### [baixa] `pr3-dudu-13` — não verificado (baixa)

- **Arquivo:** docs/der-modulo-eduardo.md
- **Problema:** No Mermaid, algumas cardinalidades contradizem os atributos: FEDERACAO ||--o{ VOTACAO_LEGENDA_MUNICIPIO e obrigatoria, mas nr_federacao e anulavel; GRAU_INSTRUCAO ||--o{ CANDIDATURA e NIVEL ||--o{ GRAU tambem sao obrigatorias apesar de -4/0. VOTACAO_LEGENDA_MUNICIPIO.nr_federacao e redundante com PARTIDO_FEDERACAO (id_eleicao, nr_partido), e o checklist pede que redundancia seja marcada.
- **Evidência:** Linhas 67, 69, 71 e 111 do doc. VOTACAO_LEGENDA_MUNICIPIO.nr_federacao tem comentario 'nulo antes de 2022' e a relacao com FEDERACAO esta como '||'. Por CD_ELEICAO, (partido -> federacao) e funcional (0 conflitos, q5.py), logo nr_federacao em VOTACAO_LEGENDA e deduzivel. O diagrama renderiza sem erro no Mermaid 11.
- **Correção:** Usar FEDERACAO |o--o{ VOTACAO_LEGENDA_MUNICIPIO, NIVEL_INSTRUCAO_COMPARAVEL |o--o{ GRAU_INSTRUCAO e GRAU_INSTRUCAO |o--o{ CANDIDATURA. Marcar nr_federacao em VOTACAO_LEGENDA_MUNICIPIO como 'DERIVADA/redundante, mantida para a Q5' na secao 6.


## Consistência entre os quatro DERs

Comparei os DERs do grupo lado a lado: der-davi.md, dossie/der.mmd, dicionario-dados.md e dossie/secoes/dicionario.md (PR #4), der-enrico.md e sql/01-05 (PR #2), der-modulo-eduardo.md (PR #3), der-duda.md (working copy) e o Contrato de chaves do estrategia.md (main, igual no PR #4). Cada divergência de chave, grão, tipo e nome foi conferida contra os arquivos baixados com DuckDB. Os scripts estão em C:/Users/eduar/Downloads/rv/consist-der/py/k1.py a k20.py, e o recorte de consulta_cand está em C:/Users/eduar/Downloads/rv/consist-der/c.parquet. Na junção, o que bloqueia de verdade são as chaves de CANDIDATURA, PARTIDO, ELEICAO e MUNICIPIO. Para CANDIDATURA há duas PKs (sq_candidato x id_candidatura) e dois grãos (por turno x por pleito). O PARTIDO é chaveado só por nr_partido, e mesmo (ano, nr_partido) colide quando entram eleições suplementares. Para ELEICAO há quatro chaves diferentes (CD_ELEICAO, id_eleicao, ano+turno, nenhuma). O MUNICIPIO tem PK TSE no Davi e PK IBGE nos demais. Os dados também mostram que o contrato erra ao dizer que o cod_tse tem zero à esquerda nos dois lados: votacao_candidato e votacao_partido trazem CD_MUNICIPIO sem o zero, e 519 municípios ficam órfãos sem LPAD. Os demais achados são atributos em entidade errada, medidas diferentes para a mesma coisa, entidades que existem em um DER e faltam nos outros, e nomes divergentes. Filtrar só eleições ordinárias (CD_TIPO_ELEICAO 2, ou 0 em 2006) resolve as colisões de CANDIDATURA e PARTIDO em todos os anos (medido em k19.py) e vale como regra global do DER geral.

**Conferido e correto:**

- Nenhum DER usa CPF como chave da pessoa: Davi (NR_CPF_CANDIDATO 'nunca chave; -4 em 2024'), dicionário, Enrico e Duda chaveiam POLITICO pelo título, coerente com o fato 1.
- Os códigos de GRAU_INSTRUCAO do de-para do Eduardo batem com o dado (k5.py): 1 ANALFABETO, 2 LÊ E ESCREVE, 3-4 FUNDAMENTAL, 5-6 MÉDIO, 7-8 SUPERIOR, em 2002-2026. As sentinelas -4 'NÃO DIVULGÁVEL' (1.701 linhas) e 0 'NÃO INFORMADO' (6.389 linhas, 2002-2006) precisam virar NULL no de-para.
- perfil_comparecimento_abstencao 2016-2024 tem ANO_ELEICAO, NR_TURNO, CD_MUNICIPIO, NR_ZONA, CD_GENERO e CD_FAIXA_ETARIA, e não tem CD_ELEICAO nem CD_CARGO (DESCRIBE em k6.py). A chave de COMPARECIMENTO_PERFIL da Duda (cod_ibge, ano, nr_turno, faixa, gênero) está correta (fato 5).
- detalhe_votacao_munzona 2016-2026 tem CD_ELEICAO, CD_CARGO, QT_APTOS, QT_ABSTENCOES, QT_VOTOS_BRANCOS e QT_VOTOS_NULOS. A fonte do COMPARECIMENTO_MUNICIPIO do Davi está certa, e a PK (el, turno, cargo, mun, zona) é única (2024: 12.486/12.486; k7.py).
- consulta_vagas usa QT_VAGAS em 2016 e QT_VAGA de 2018 em diante (Davi correto). (CD_ELEICAO, SG_UE, CD_CARGO) é única em todos os anos (k9.py), e as vagas só usam o CD_ELEICAO do 1º turno (2024: só 619; 2022: 544/546; k17.py).
- despesas_pagas_candidatos_2024 tem SQ_DESPESA e SQ_PARCELAMENTO_DESPESA, que existem para compor a PK de PAGAMENTO_DESPESA (Davi).
- Normalização de CNAE do Enrico confirmada (k11.py): em 2014 (PI) o código tem 7 dígitos (9492800 em 939 linhas); de 2018 em diante tem 5 (94928).
- A tabela (sq, turno) do Enrico reproduz exatamente: 2002 5.169; 2004 1.506; 2006 3.205; 2008 68.683; 2012 483.650 (91 colisões); 2014+ sem colisão (k1.py).
- Os casos de troca de CD_ELEICAO entre turnos da Duda reproduzem: 204 SQ em duas linhas em 2024 e 52 em 2022 (k2.py). Ressalva ao fato 4: 2002, 2006, 2010 e 2026 têm zero linhas suplementares; 'todo arquivo' vale para 2004, 2008 e 2012-2024.
- O SQL do Enrico (04_politico.sql) já gera CANDIDATURA uma linha por pleito (PARTITION BY ano, sg_ue, cd_cargo, sq_candidato, ORDER BY nr_turno DESC), o mesmo grão do DER da Duda. O join (sq_candidato, ano) do mart_q10 não duplica receita de 2014 em diante.
- NR_FEDERACAO = -1 é mesmo sentinela em 2014-2026 (k3.py), como o Eduardo alertou.
- votacao_partido_munzona 2018 não tem os campos _ANULADOS e usa QT_VOTOS_NOMINAIS_CONVR_LEG; de 2020 em diante é QT_VOTOS_NOM_CONVR_LEG_VALIDOS (Eduardo correto).
- Ponte municipio_tse_ibge: 5.571 linhas, CD_MUNICIPIO_TSE sempre com 5 caracteres, IBGE sempre com 7 dígitos, nenhum município sem IBGE (k7.py).
- Título inválido em 2002 (não numérico ou zero): 318 de 18.109 linhas = 1,76%, o número do Enrico (k5.py). O estrategia.md diz 1,74%. A diferença é só de critério e não afeta o DER.

**Achados:**

### [alta] `der-candidatura-01` — verificação interrompida

- **Arquivo:** docs/der-davi.md, docs/dossie/der.mmd, docs/dicionario-dados.md (PR #4); docs/der-modulo-eduardo.md (PR #3); docs/der-enrico.md (PR #2); docs/der-duda.md; docs/estrategia.md (Contrato de chaves)
- **Problema:** CANDIDATURA tem duas PKs e dois grãos incompatíveis. PK sq_candidato: Davi, der.mmd, dicionário, stub do Eduardo e contrato. PK id_candidatura substituta: Enrico e Duda. Grão por turno: dicionário ('1 linha por candidato × eleição × turno'), Davi Q2 ('candidato de 2º turno = duas candidaturas') e chave natural do Enrico com nr_turno. Grão por pleito: Duda e o SQL do próprio Enrico. Com a PK sq_candidato, o grão por turno viola a PK em todo ano com 2º turno.
- **Evidência:** k1.py/k2.py sobre consulta_cand_<ano>_BRASIL.csv (sem os complementares). Linhas x SQ distintos: 2024 463.859 x 463.655; 2020 558.804 x 558.572; 2016 498.391 x 498.163; 2022 29.322 x 29.270; 2018 29.287 x 29.227; 2014 26.263 x 26.195. O mesmo SQ aparece nos dois turnos (2024: 204 SQ; (sq, NR_TURNO) distintos = 463.859). A chave do Enrico (ano, sg_ue, cd_cargo, nr_turno, sq) tem 22 colisões em 2004 (402.135/402.157), todas ordinária x suplementar. A chave da Duda sem filtro junta 13 pares de títulos diferentes em 2004. Filtrando CD_TIPO_ELEICAO in (2,0), (ano, sg_ue, cd_cargo, sq) fica consistente com o título em todos os anos (k19.py). O SQL do Enrico já usa PARTITION BY ano, sg_ue, cd_cargo, sq_candidato ORDER BY nr_turno DESC, sem nr_turno, contradizendo o próprio der-enrico.md.
- **Correção:** No DER geral: CANDIDATURA(id_candidatura PK), uma linha por candidato por pleito, com UK (ano, sg_ue, cd_cargo, sq_candidato) e escopo restrito a eleições ordinárias. cd_eleicao é o do 1º turno (o que consulta_vagas referencia). ds/cd_sit_tot_turno vem do último turno. O turno fica só em VOTACAO_*. RECEITA, DESPESA, BEM, PROPOSTA e VOTACAO apontam para id_candidatura, resolvido na carga por (ano, sq_candidato), único de 2010 em diante. Atualizar o contrato, tirar nr_turno da chave natural do der-enrico.md e corrigir a granularidade no dicionário e na Q2 do Davi.

### [alta] `pr4-dicionario-02` — confirmado

- **Arquivo:** docs/dicionario-dados.md
- **Problema:** O dicionário afirma três coisas que os dados contradizem. (1) sq_candidato é 'Único em toda a base (o TSE não reusa entre anos)'. (2) 'Candidato que vai ao 2º turno aparece em duas linhas (dois SQ_CANDIDATO)'. (3) nr_federacao é 'Sempre nulo antes de 2022'.
- **Evidência:** k4.py: 393.256 SQ de 2012 reaparecem em 2016, só 4 com o mesmo título; 14.036 entre 2010 e 2012; 18.442 entre 2010 e 2014. Entre 2014 e 2026 há zero reuso. k1.py: o 2º turno repete o MESMO SQ (2024: 463.859 linhas, 463.655 SQ). k3.py: o arquivo de 2020 traz NR_FEDERACAO 1, 2 e 3 (suplementares de 2022+). Pré-2010 o SQ é contador (fato 2).
- **Correção:** A correção do revisor está na direção certa, mas precisa ficar mais precisa em três pontos.

(a) Linha 42 (sq_candidato):
- Tirar o papel de PK sozinho. O texto passa a ser: "Identificador da candidatura no TSE. Não é único sozinho: o 2º turno repete o mesmo SQ na mesma eleição; entre 2010 e 2016 o TSE reusou SQ entre anos (por exemplo, 393.256 SQ de 2012 reaparecem em 2016 em pessoas diferentes); em 2012, 91 SQ se repetem entre eleição ordinária e suplementar; antes de 2010 é um contador por unidade eleitoral."
- PK da tabela: (ano_eleicao, cd_eleicao, sg_ue, sq_candidato), que é única em todos os anos de 2002 a 2026. A alternativa é uma chave substituta, mantendo essa combinação como UNIQUE.
- Retirar "dentro de eleição ordinária" da redação proposta pelo revisor: a chave com cd_eleicao já resolve o conflito entre ordinária e suplementar.
- Linha 32 (PK) e linha 36 (relacionamentos): as FKs de votação, receita e despesa devem apontar para essa chave composta, ou para a chave substituta, e não para sq_candidato sozinho.

(b) Linha 51 (nr_turno): "Candidato que vai ao 2º turno aparece em duas linhas com o MESMO SQ_CANDIDATO e CD_ELEICAO diferente (ex.: 619 e 620 em 2024)."

(c) Linha 48 (nr_federacao):
- Texto: "-1 vira NULL. Nulo em todas as eleições ordinárias antes de 2022. Arquivos de anos anteriores (ex.: 2020) trazem federação em eleições suplementares realizadas de 2022 em diante."
- Descrição da coluna: trocar "(2022+)" por "(eleições a partir de 2022)".
- Registrar que a numeração muda entre anos (PSDB Cidadania é 1 em 2022 e 100 em 2024-2026). Por isso a FK para FEDERACAO precisa incluir o ano, ou a eleição: (ano_eleicao, nr_federacao).
- **Verificação:** Texto no ref: `git show origin/pr/4:docs/dicionario-dados.md` traz as três afirmações. Linha 42 (sq_candidato): "Único em toda a base (o TSE não reusa entre anos)". Linha 51 (nr_turno): "Candidato que vai ao 2º turno aparece em duas linhas (dois `SQ_CANDIDATO`)". Linha 48 (nr_federacao): "Sempre nulo antes de 2022". A linha 32 declara PK = `sq_candidato`, e a linha 34 declara a granularidade "1 linha por candidato × eleição × turno".

Refiz as medições do zero, sem usar os scripts k1/k3/k4 do revisor. Com cp1252 o DuckDB quebra no arquivo de 2016, linha 379610, por causa de um byte fora do cp1252. Por isso escrevi C:/Users/eduar/Downloads/rv/cetico-dic02/ext.py, que lê os 13 consulta_cand_<ano>_BRASIL.csv com o csv do Python em latin-1 e extrai só as colunas-chave. Todas as linhas entraram (0 linhas com número de colunas diferente do cabeçalho). As contagens batem com o fato 2: 2004 tem 402.157 linhas e 2024 tem 463.859. A análise está em an.py e an2.py, na mesma pasta.

(1) Reuso de SQ entre anos. Contei SQ em comum entre pares de anos e, entre eles, quantos têm o mesmo título:
- 2010-2012: 14.023 (1 com o mesmo título)
- 2010-2014: 18.442 (5)
- 2010-2016: 1.236 (0)
- 2012-2014: 17.066 (1)
- 2012-2016: 393.256 (4)
- de 2014 em diante: nenhum par.

Dos 393.256 reusos entre 2012 e 2016, 392.903 ligam uma eleição ordinária a outra ordinária. No total, de 2010 em diante há 2.132.053 pares (ano, sq) distintos para apenas 1.700.533 SQ distintos. O revisor informou 14.036 para 2010-2012, eu medi 14.023: diferença pequena, que não muda a conclusão. Achei ainda um caso que o revisor não citou: em 2012, 91 SQ aparecem numa eleição ordinária e numa suplementar com títulos diferentes, ou seja, pessoas diferentes no mesmo ano. Exemplo: SQ 210000001281 está na suplementar de Almirante Tamandaré do Sul com o título 060696750434 e na eleição municipal de 2012 com o título 065112990477.

(2) 2º turno. O segundo turno repete o mesmo SQ em todos os anos. Em 2024 são 463.859 linhas para 463.655 SQ distintos. As 204 linhas de 2º turno têm SQ que também aparece no 1º turno, e nenhuma fica sem par. Exemplo: SQ 150001998778 aparece com turno 1 / CD_ELEICAO 619 e com turno 2 / CD_ELEICAO 620, mesmo título. O padrão se repete em todos os anos de 2010 a 2024. Consequência: a própria PK declarada (`sq_candidato`) é violada dentro de um mesmo ano (204 duplicatas em 2024, 228 em 2016, 232 em 2020).

(3) nr_federacao. No arquivo de 2020, 79 linhas têm NR_FEDERACAO igual a 1, 2 ou 3 (PSDB Cidadania, Brasil da Esperança, PSOL REDE), e todas são de eleições suplementares (Brusque 2023, Viseu 2023, Dom Expedito Lopes-PI e outras). Nos arquivos de 2014, 2016 e 2018 só aparece -1. Achado extra: a numeração muda de um ano para outro. Em 2022 a federação PSDB Cidadania é 1 e em 2024-2026 é 100; em 2022 a PSOL REDE é 3 nas ordinárias e 102 nas suplementares. Logo, uma FK só por nr_federacao fica ambígua.

Chaves que funcionam: (CD_ELEICAO, SQ_CANDIDATO) não tem nenhuma duplicata de 2010 a 2026. (CD_ELEICAO, SG_UE, SQ_CANDIDATO) não tem nenhuma duplicata em nenhum dos 13 anos, de 2002 a 2026. (SQ, NR_TURNO) ainda tem 91 duplicatas em 2012.

As três afirmações do achado se confirmam. A severidade alta está correta: a PK declarada falharia já na carga, e o reuso entre anos juntaria centenas de milhares de pessoas diferentes.

### [alta] `der-partido-03` — confirmado

- **Arquivo:** docs/der-davi.md (Q3), docs/dossie/der.mmd, docs/dicionario-dados.md (PR #4); docs/der-modulo-eduardo.md (PR #3); docs/der-enrico.md (PR #2); docs/estrategia.md (contrato); docs/der-duda.md
- **Problema:** PARTIDO é chaveado só por nr_partido em Davi Q3, der.mmd, dicionário (FK → PARTIDO.nr_partido), stub do Eduardo, FK do Enrico e contrato ('partido.nr_partido'). Isso contradiz o fato 3 (número reaproveitado). Só a Duda usa (ano, nr_partido), e mesmo essa chave colide quando as suplementares ficam misturadas no arquivo anual.
- **Evidência:** k2.py, (ANO_ELEICAO, NR_PARTIDO) com mais de uma sigla, 2014-2024: 16 pares. Exemplos: 2020/25 = DEM (ordinária) e PRD (suplementar de 28/04/2024); 2024/35 = PMB (ordinária) e DEMOCRATA (suplementar de 25/10/2026); 2016/15 = PMDB e MDB; 2018/22 = PR e PL. Só com ordinárias: 0 pares. Por (CD_ELEICAO, NR_PARTIDO): 0 pares.
- **Correção:** 1. PARTIDO(ano, nr_partido) como PK composta, com sg_partido, nm_partido e cd_espectro (ou ESPECTRO_PARTIDO com FK composta). Carregar só de eleições ordinárias (CD_TIPO_ELEICAO='2'); medido: 0 colisões. Deixar explícito que a mesma regra vale para as tabelas de fato. As suplementares somam 2.465 linhas de candidatura em 2014-2026 (0,15%) e, se ficarem, não podem apontar para PARTIDO(ano, nr) porque herdariam a sigla errada (ex.: PRD 2024 cairia em 2020/25 = DEM). Se o grupo quiser mantê-las, as saídas são guardar sg_partido 'da época' em CANDIDATURA, como o Enrico já faz no SQL, ou chavear PARTIDO por (cd_eleicao, nr_partido), que também deu 0 colisões mas multiplica linhas por turno. Não usar o ano de DT_ELEICAO: ainda sobram 5 colisões.

2. Todas as FKs para PARTIDO passam a ser compostas (ano, nr_partido): CANDIDATURA (der-davi Q3, der.mmd, dicionário linha 46 'FK → PARTIDO(ano, nr_partido)'), VOTACAO_LEGENDA_MUNICIPIO e PARTIDO_FEDERACAO (Eduardo e der.mmd), ESPECTRO_PARTIDO (a da Duda já está certa). Onde a tabela só carrega id_eleicao (VOTACAO_LEGENDA_MUNICIPIO e PARTIDO_FEDERACAO no DER do Eduardo, VOTACAO_LEGENDA_MUNICIPIO no der.mmd), falta a coluna ano: incluí-la para a FK composta existir, ou declarar a derivação via ELEICAO.

3. No estrategia.md, trocar a linha do contrato para 'partido (ano, nr_partido)', alinhando com a decisão ③ ('identificado pelo número dentro do ano'). Corrigir o stub do Eduardo para 'PARTIDO (ano, nr_partido)' e o der.md do main (rascunho do grupo), que também tem 'nr_partido PK'.

4. No DER do Enrico, basta marcar 'ano' também como parte da FK para PARTIDO em CANDIDATURA; o SQL dele não precisa mudar.

5. No der-duda.md, acrescentar ao mapeamento 'PARTIDO.* ← consulta_cand' o filtro CD_TIPO_ELEICAO='2' (ordinária), senão a própria PK (ano, nr_partido) dela é violada pelos 16 pares vindos das suplementares.
- **Verificação:** Refiz tudo de forma independente, sem reaproveitar o k2.py. Scripts em C:/Users/eduar/Downloads/rv/cet-partido03/p.py, p2.py e p3.py. Leitura em DuckDB, modo estrito (sem ignore_errors), dos consulta_cand_<ano>_BRASIL.csv de 2014 a 2026: 1.626.910 linhas, sendo 1.624.445 ordinárias (CD_TIPO_ELEICAO=2) e 2.465 suplementares (CD_TIPO_ELEICAO=1).

DADOS (reproduzidos):
(a) Pares (ANO_ELEICAO, NR_PARTIDO) com mais de uma sigla: 16, todos entre 2014 e 2024 (2026 não acrescenta nenhum). Os exemplos do achado batem:
- 2020/25: DEM na ordinária 426 (33.267 linhas) e PRD na suplementar 625 (Armação dos Búzios, 28/04/2024, 1 linha).
- 2024/35: PMB nas eleições 619/620 e DEMOCRATA na suplementar 6285 (Itaguaí, 25/10/2026, 2 linhas).
- 2016/15: PMDB e MDB. 2018/22: PR e PL.
(b) Só ordinárias: 0 pares. Por (CD_ELEICAO, NR_PARTIDO): 0 pares.
(c) Só NR_PARTIDO, nas ordinárias de 2014 a 2026: 16 números com mais de uma sigla. Troca real de partido: 25 DEM(2014-2020)/PRD(2024-26); 44 PRP(2014-18)/UNIÃO(2022+); 20 PSC(2014-22)/PODE(2024+); 14 PTB(2014-22)/MISSÃO(2026); 35 PMB(2016-24)/DEMOCRATA(2026). Portanto uma PK só em nr_partido não comporta nem a sigla nem o cd_espectro.

DOCUMENTOS (trechos lidos com git show):
- PR #4, docs/der-davi.md, Q3: 'PARTIDO { INTEGER NR_PARTIDO PK ...}' e 'CANDIDATURA { ... INTEGER NR_PARTIDO FK }'.
- PR #4, docs/dossie/der.mmd: 'PARTIDO { int nr_partido PK / string sg_partido / string cd_espectro }'. O espectro fica preso ao número, então 25 teria um espectro só para DEM e PRD.
- PR #4, docs/dicionario-dados.md, linha 46: 'FK → PARTIDO.nr_partido'.
- PR #3, docs/der-modulo-eduardo.md: stub 'PARTIDO { int nr_partido PK "stub - modulo 1" }' e a linha de contrato '`partido.nr_partido` | INTEGER | FK em VOTACAO_LEGENDA_MUNICIPIO, PARTIDO_FEDERACAO'.
- docs/estrategia.md (main e todos os PRs), linha 207 do main: '| `partido.nr_partido` | `INTEGER` |'.
- docs/der-duda.md (working copy): 'PARTIDO { int ano PK ... int nr_partido PK }'. A linha 260 manda carregar PARTIDO de consulta_cand sem filtrar ordinárias, então os 16 pares de (a) violariam a PK.
- origin/main docs/der.md (rascunho do grupo): também 'int nr_partido PK'. O achado não cita esse arquivo.

RESSALVAS (o achado exagera um pouco):
1. O estrategia.md não contradiz o fato 3 por inteiro. A decisão ③ (linha 289 do main) diz: 'PARTIDO fica identificado pelo número **dentro do ano**'. O problema é que a tabela do contrato omite o ano. Ou seja, os PRs #3 e #4 contrariam a decisão que o próprio grupo registrou.
2. Enrico (PR #2, der-enrico.md): o DER não declara bloco nem PK para PARTIDO. CANDIDATURA tem 'int ano' e 'int nr_partido FK', e o SQL (04_politico.sql, 05_marts_enrico.sql) não cria tabela partido: carrega sg_partido na própria linha de cada ano. O impacto é só de notação, nenhum na implementação. É exagero dizer que a FK dele é 'chaveada só por nr_partido'.
3. Dos 16 pares (ano, nr), a maioria é renomeação do mesmo partido (PMDB/MDB, PR/PL, PPS/CIDADANIA, PRB/REPUBLICANOS, PTN/PODE, PSDC/DC, PT do B/AVANTE, SD/SOLIDARIEDADE, PC do B/PCDOB). Partido diferente de fato aparece em 2020/25 (DEM x PRD), 2020/20 (PSC x PODE) e 2024/35 (PMB x DEMOCRATA). Mesmo assim, qualquer sigla diferente quebra uma PK (ano, nr) que tenha sg_partido como atributo. As linhas do lado suplementar somam 385.
4. Chave alternativa (ano de DT_ELEICAO, NR_PARTIDO): ainda sobram 5 colisões, todas renomeações ocorridas no mesmo ano civil (2017/19 PTN-PODE, 2018/15, 2018/77, 2019/10, 2019/22). Não resolve sozinha.

Severidade: mantenho alta. É a PK de uma entidade compartilhada pelos quatro módulos, contraria o fato 3 e a decisão ③ e quebra sigla e espectro da Q3 e da Q9 nos números reaproveitados.

### [alta] `der-eleicao-04` — verificação interrompida

- **Arquivo:** docs/der-davi.md, docs/dossie/der.mmd, docs/dicionario-dados.md (PR #4); docs/der-modulo-eduardo.md (PR #3); docs/der-enrico.md (PR #2); docs/der-duda.md; docs/estrategia.md (contrato)
- **Problema:** ELEICAO tem quatro identificações diferentes. PK CD_ELEICAO: Davi e Duda. PK surrogate id_eleicao: der.mmd, dicionário e Eduardo. O contrato usa 'eleicao.ano + nr_turno'. O Enrico não tem a entidade (ano e nr_turno ficam soltos em CANDIDATURA, e RECEITA/DESPESA têm um 'ano FK' que não aponta para nada). Além disso, der.mmd não tem nr_turno nem tipo de eleição, e (ano, nr_turno) não identifica uma eleição.
- **Evidência:** k2.py, CD_ELEICAO distintos por (ano, turno): 2022 turno 1 = 3 códigos, sendo 544 (federal) e 546 (estadual) ordinárias; 2020 turno 1 = 132 códigos (426 e 445 ordinárias); 2016 turno 1 = 179 códigos. O CD_ELEICAO muda entre turnos (619→620). k17.py: consulta_vagas só usa o código do 1º turno (2024: 16.707 linhas com 619, nenhuma com 620).
- **Correção:** ELEICAO(cd_eleicao INTEGER PK, ano, nr_turno, cd_tipo_eleicao, dt_eleicao, ds_eleicao), uma linha por código do TSE. Se o grupo preferir id_eleicao, declarar que é 1:1 com cd_eleicao. CANDIDATURA e VAGA referenciam o cd_eleicao do 1º turno; VOTACAO_* e COMPARECIMENTO_MUNICIPIO, o do turno. COMPARECIMENTO_PERFIL fica (ano, nr_turno) sem FK (fato 5). Corrigir o contrato e incluir ELEICAO no DER do Enrico no lugar do 'ano FK'.

### [alta] `main-contrato-06` — verificação interrompida

- **Arquivo:** docs/estrategia.md (Contrato de chaves, aviso sobre cod_tse); docs/der-duda.md (dicionário VOTACAO_CANDIDATO_MUNICIPIO); docs/der-modulo-eduardo.md (VOTACAO_LEGENDA_MUNICIPIO)
- **Problema:** O contrato diz que o cod_tse vem 'zero à esquerda em ambos os lados' e que 'texto com texto funciona'. É falso para CD_MUNICIPIO em votacao_candidato_munzona e votacao_partido_munzona, que vem numérico e sem o zero. Um join VARCHAR sem LPAD perde 519 municípios. Só o Davi prescreve LPAD. A Duda mapeia CD_MUNICIPIO direto. O Eduardo resolve por SG_UE, que em 2018 e 2022 é a UF ('PI') ou 'BR', então nesses anos o município precisa vir de CD_MUNICIPIO.
- **Evidência:** Linha bruta de votacao_candidato_munzona_2024_BRASIL.csv: SG_UE "01554" (com aspas) e CD_MUNICIPIO 1554 (sem aspas, sem zero). k8.py, órfãos contra municipio_tse_ibge em 2024: votacao_candidato 519 sem LPAD e 0 com LPAD; votacao_partido 519 e 0; detalhe_votacao 0 e 0. k7.py: órfãos de 518 a 519 por ano em 2016-2024 (2024: 28.057.415 votos nominais). Exterior (SG_UF=ZZ) sem código IBGE: 138 'municípios' em 2018 e 181 em 2022 (592.694 votos). k18.py: votacao_partido 2022 tem SG_UE = 'PI'/'BR'. O teste '5.569 de 5.569' do contrato coincide com o detalhe_votacao (5.569 distintos), não com votacao_candidato.
- **Correção:** Corrigir o aviso do contrato: 'cod_tse = LPAD(CD_MUNICIPIO,5,'0') em votacao_candidato e votacao_partido; SG_UE só serve em eleição municipal'. Documentar no DER geral a regra do exterior: excluir SG_UF='ZZ' ou criar MUNICIPIO sem cod_ibge. Ajustar a origem no dicionário da Duda e a nota do Eduardo para 2018/2022.

### [media] `pr4-municipio-05` — confirmado

- **Arquivo:** docs/der-davi.md (Q1, Q2, Q3)
- **Problema:** A PK de MUNICIPIO diverge. O Davi usa o código TSE, CD_MUNICIPIO VARCHAR(5), com COD_IBGE como UK, e CANDIDATURA, VAGA, VOTACAO, COMPARECIMENTO e ELEITORADO apontam para CD_MUNICIPIO. Todos os demais usam cod_ibge INTEGER como PK e cod_tse como UK: der.mmd e secoes/dicionario.md do próprio PR #4, Duda, stub do Eduardo e der.md do main. O PR #4 fica internamente inconsistente (der-davi.md x der.mmd).
- **Evidência:** der-davi.md, Q1 linha 43: 'VARCHAR(5) CD_MUNICIPIO PK "codigo TSE"'; Q3 linhas 279-280. der.mmd linhas 37-41: 'int cod_ibge PK / string cod_tse UK'. der-duda.md linha 46: 'int cod_ibge PK'. der-modulo-eduardo.md: stub 'MUNICIPIO (cod_ibge)'.
- **Correção:** Padronizar MUNICIPIO(cod_ibge INTEGER PK, cod_tse VARCHAR(5) NOT NULL UNIQUE, nm_municipio, sg_uf FK -> UF, mais os atributos de região da Duda), como já estão der.mmd e secoes/dicionario.md do PR #4 e o der-duda.md.

No docs/der-davi.md (Q1, Q2 e Q3), trocar todo CD_MUNICIPIO PK/FK por cod_ibge. Isso vale para CANDIDATURA, VAGA, VOTACAO_CANDIDATO_MUNICIPIO, COMPARECIMENTO_MUNICIPIO e ELEITORADO_MUNICIPIO, e não só para VAGA/VOTACAO/COMPARECIMENTO. Assim some a mistura atual, em que o mesmo diagrama tem FKs para COD_IBGE e para CD_MUNICIPIO.

A nota da l.238 ('CD_MUNICIPIO é VARCHAR(5) com LPAD') vira regra de carga: cod_ibge = (SELECT cod_ibge FROM municipio WHERE cod_tse = LPAD(CAST(CD_MUNICIPIO AS VARCHAR), 5, '0')). Sem o LPAD, 519 municípios de MA, PA, AM, RO, AC, AP e RR não casam, porque a votação traz o código como inteiro sem zero à esquerda.

Documentar que os registros do exterior (SG_UF='ZZ', 181 cidades e 592.694 votos em 2022) ficam fora das tabelas municipais, porque não têm código IBGE.

De quebra, corrigir o docs/der.md do main, que declara 'int cod_tse' e deveria usar VARCHAR(5).
- **Verificação:** Tudo o que o achado cita se reproduz. O impacto está exagerado: a chave do Davi não está errada, ela só diverge do resto do grupo.

1) git -C C:/Users/eduar/Downloads/bdr/analiseCandidatos show origin/pr/4:docs/der-davi.md (arquivo novo no PR #4, commits de SoaresDavidson):
- Q1: linha 43 'VARCHAR(5) CD_MUNICIPIO PK "codigo TSE; preservar zero a esquerda"', linha 44 'INTEGER COD_IBGE UK'. CANDIDATURA (l.57) e VAGA (l.69, PK composta) usam CD_MUNICIPIO.
- Q2: l.145 PK CD_MUNICIPIO, l.172 FK em CANDIDATURA, l.180 PK/FK em VOTACAO_CANDIDATO_MUNICIPIO.
- Q3: l.279-280 PK CD_MUNICIPIO e UK COD_IBGE. ELEITORADO_MUNICIPIO (l.299), CANDIDATURA (l.330), VOTACAO (l.340) e COMPARECIMENTO (l.349) usam CD_MUNICIPIO. Já MUNICIPIO_ANO (l.286) e IDHM (l.293) usam COD_IBGE. Ou seja, o mesmo diagrama tem dois alvos de FK para MUNICIPIO.

2) Os demais arquivos usam cod_ibge como PK:
- PR #4, docs/dossie/der.mmd l.37-39: 'int cod_ibge PK / string cod_tse UK "VARCHAR 5 preserva zero"'.
- PR #4, docs/dossie/secoes/dicionario.md l.8: cod_ibge (PK), cod_tse único.
- PR #4, docs/dicionario-dados.md l.49: CANDIDATURA.cod_ibge FK para MUNICIPIO.cod_ibge. Esse arquivo também contradiz o der-davi.md e o achado não o citou.
- Duda, der-duda.md l.46-47: 'int cod_ibge PK' / 'varchar cod_tse UK'.
- Eduardo, PR #3 der-modulo-eduardo.md: l.28 'MUNICIPIO (cod_ibge)', l.78 'int cod_ibge PK "stub - modulo 1"'.
- origin/main (839cdb4) docs/der.md l.76-77: 'int cod_ibge PK' e 'int cod_tse UK'. Aqui cod_tse é INT, o que contradiz a nota da l.11 do mesmo arquivo ("cod_tse é texto e não inteiro").

3) Por que baixei a severidade (medi com DuckDB):
- O arquivo municipio_tse_ibge.csv tem 5.571 linhas, com 5.571 CD_MUNICIPIO_TSE distintos, 5.571 CD_MUNICIPIO_IBGE distintos e 0 nulos. O mapeamento é 1:1, então qualquer um dos dois códigos serve de PK sem perder dado.
- FK apontando para uma UK é SQL válido.
- O problema real é de consistência: impede montar o DER único e deixa o PR #4 contraditório (der-davi.md contra der.mmd e dicionario-dados.md). Não é um erro que corrompa resultado.

4) Achado extra que afeta a correção (votacao_candidato_munzona_2022_BRASIL.csv, 5.751 pares SG_UF+CD_MUNICIPIO distintos):
- 700 códigos não casam direto com CD_MUNICIPIO_TSE do mapeamento.
- 519 deles são de MA, PA, AM, RO, AC, AP e RR. Nesse arquivo CD_MUNICIPIO vem como inteiro sem o zero à esquerda (ex.: '"AC";...;1554;"MANOEL URBANO"', contra '01554' no mapeamento). Por isso o LPAD é obrigatório.
- 181 são cidades do exterior (SG_UF='ZZ', ex.: 29335 ATENAS, 29386 BERLIM): 2.353 linhas e 592.694 votos. Elas não têm código IBGE e nem estão no mapeamento.

### [media] `der-politico-07` — confirmado

- **Arquivo:** docs/der-davi.md (Q2), docs/dossie/der.mmd, docs/dicionario-dados.md (PR #4); docs/der-enrico.md (PR #2); docs/der-duda.md; docs/estrategia.md (contrato)
- **Problema:** A PK de POLITICO diverge, e com ela a FK em CANDIDATURA. id_politico surrogate com título UK: Davi, der.mmd, dicionário e der.md. nr_titulo_eleitoral VARCHAR(12) como PK: Enrico, Duda e contrato. CANDIDATURA aponta para id_politico em uns e para nr_titulo_eleitoral em outros. Os nomes também divergem: nm_candidato x nm_completo (der.mmd) e CD_GENERO (Davi) x ds_genero (Enrico, Duda).
- **Evidência:** der-davi.md linhas 159-160: ID_POLITICO PK, NR_TITULO UK. der.mmd linhas 68-70: id_politico PK. der-enrico.md linha 23 e der-duda.md linha 78: nr_titulo_eleitoral PK. k5.py, títulos inválidos (não numéricos ou zero) por ano: 2002 318 (1,76%), 2012 1.122, 2018 108 (0,37%), 2024 47. O SQL do Enrico (04_politico.sql) transforma inválido em NULL e deixa essas linhas fora de POLITICO.
- **Correção:** 1) Adotar no DER geral a versão do contrato e do SQL já implementado:
- POLITICO(nr_titulo_eleitoral VARCHAR(12) PK), com lpad 12 e só títulos válidos (`^[0-9]{1,12}$` e maior que 0).
- CANDIDATURA.nr_titulo_eleitoral como FK ANULÁVEL. Isso afeta 2.323 das 2.954.876 linhas (0,08%), sendo 318 em 2002 (1,76%).
- Documentar essa nulidade na cardinalidade: CANDIDATURA }o--o| POLITICO, e não ||.

2) Arquivos a alinhar:
- der-davi.md: l.159-160 e 170, e remover "ID_POLITICO NOT NULL" da l.215.
- der.mmd: l.68-70 e 96.
- dicionario-dados.md: l.43.
- dossie/secoes/dicionario.md: l.13 e 18.
- docs/der.md do main: l.109-120. É a origem do id_politico, então precisa ser corrigido também, senão a divergência volta.

3) Padronizar os atributos:
- Nome: nm_candidato (é o que usam Davi, Enrico, Duda e o SQL). Trocar nm_completo na der.mmd, na der.md e no dossiê.
- Gênero: ds_genero VARCHAR, como no SQL. Opcionalmente, cd_genero INTEGER com domínio 2=Masc, 4=Fem, e 0 (NÃO INFORMADO, 2002) ou -4 (NÃO DIVULGÁVEL, 2024) viram NULL.
- Incluir gênero na der.mmd, onde ele está ausente.

4) Fora do escopo do achado, mas no mesmo bloco: tirar cod_ibge_nascimento de POLITICO na der.md, como pede a própria estrategia.md (item 5, l.334), e manter sg_uf_nascimento.

5) Se o grupo preferir o surrogate id_politico, a alternativa também é legítima, porque lida bem com título inválido: cada um vira um POLITICO próprio com UK nula. Nesse caso é preciso:
- atualizar o contrato de chaves, 04_politico.sql, der-enrico.md e der-duda.md;
- dizer explicitamente como título inválido é carregado. Hoje o SQL descarta esses casos de POLITICO, e isso conflita com "ID_POLITICO NOT NULL".
- **Verificação:** Consegui reproduzir o núcleo do achado, com algumas ressalvas menores.

1) Linhas citadas conferem (lidas com `git -C C:/Users/eduar/Downloads/bdr/analiseCandidatos show <ref>:<arq>`):
- origin/pr/4:docs/der-davi.md, l.159-160: `INTEGER ID_POLITICO PK "surrogate gerado na carga"` e `VARCHAR(12) NR_TITULO_ELEITORAL_CANDIDATO UK`. Na l.162 está NM_CANDIDATO, na l.164 `INTEGER CD_GENERO "NULL - 2 Masc, 4 Fem"`, na l.170 CANDIDATURA.ID_POLITICO FK. A l.215 diz "`ID_POLITICO` NOT NULL".
- origin/pr/4:docs/dossie/der.mmd, l.68-73: POLITICO tem id_politico PK, nr_titulo_eleitoral UK, nm_completo, dt_nascimento e sg_uf_nascimento. Não há coluna de gênero, e o achado não aponta essa omissão. Na l.96 está CANDIDATURA.id_politico FK.
- origin/pr/4:docs/dicionario-dados.md: não existe seção POLITICO. Só a l.43 fala do assunto: `id_politico INTEGER N FK -> POLITICO.id_politico`, "Resolvido na carga: título eleitoral -> id_politico". O dicionário não declara UK para o título. Quem diz "único quando válido" é origin/pr/4:docs/dossie/secoes/dicionario.md, l.13.
- origin/pr/2:docs/der-enrico.md: l.23 `varchar nr_titulo_eleitoral PK "VARCHAR(12), zero a esquerda"`, l.24 nm_candidato, l.27 ds_genero, l.36 CANDIDATURA.nr_titulo_eleitoral FK.
- docs/der-duda.md (working copy): l.78 `varchar nr_titulo_eleitoral PK`, l.79 nm_candidato, l.81 ds_genero, l.89 FK em CANDIDATURA.
- docs/der.md: o conteúdo é idêntico em origin/main, pr/2 e pr/4 (`git diff --stat` sai vazio). Nas l.109-120 estão id_politico PK, nr_titulo_eleitoral UK, nm_completo, `char cd_genero`, cod_ibge_nascimento FK e CANDIDATURA.id_politico FK. Ou seja, a versão com surrogate já existia no main (commit efc098a). O PR #4 não a introduziu, só a propagou para der-davi.md e der.mmd.
- Contrato (origin/main:docs/estrategia.md, "Contrato de chaves", l.~205): `politico.nr_titulo_eleitoral | VARCHAR(12)`, sob o título "Os quatro diagramas se encontram nestas colunas. Nome e tipo são fixos". A l.427 diz: "Decisão: POLITICO é chaveado por NR_TITULO_ELEITORAL_CANDIDATO". O contrato não escreve "PK" literalmente. Mesmo assim, se CANDIDATURA aponta para id_politico, os módulos deixam de se encontrar na coluna contratada, então a divergência com o contrato existe.
- origin/pr/2:sql/04_politico.sql: um título que não casa `^[0-9]{1,12}$` ou não é maior que 0 vira NULL; o válido recebe lpad 12. A tabela `politico` é criada com `WHERE nr_titulo_eleitoral IS NOT NULL`, particionada por título, e `candidatura` mantém o título NULL. O achado descreve esse comportamento corretamente.

2) Contagem de títulos inválidos, rodada por mim em C:/Users/eduar/Downloads/rv/cetico07/tit.py (DuckDB, cp1252, leitura estrita sem ignore_errors, mesma regra do SQL):
- 2002: 318/18.109 (1,76%)
- 2004: 302
- 2008: 1
- 2012: 1.122
- 2016: 109
- 2018: 108/29.287 (0,37%)
- 2020: 284
- 2022: 29
- 2024: 47
- 2026: 3

Os quatro números citados pelo achado batem exatamente. No total são 2.323 de 2.954.876 linhas (0,08%). O fato 1 fala em 1,74% para 2002 e a tabela da estrategia.md também, mas a der-enrico.md (l.95) diz 1,76%. A diferença vem só da definição (linha a linha, contando o zero como inválido), não muda o achado.

3) Domínio de gênero medido:
- 2002: CD_GENERO 2 MASCULINO 15.404, 4 FEMININO 2.602, 0 NÃO INFORMADO 103.
- 2024: 2 = 304.686, 4 = 159.127, -4 NÃO DIVULGÁVEL 46.

Ressalvas ao achado:
- Gênero tem três variantes, não duas: INTEGER CD_GENERO (Davi), `char cd_genero` (der.md) e varchar ds_genero (Enrico, Duda e SQL). Além disso, a der.mmd simplesmente não tem gênero.
- O dicionário do PR #4 não declara UK para o título.
- O contrato fixa nome e tipo da coluna de encontro, não diz "PK" com essas palavras.
- A divergência é anterior ao PR #4: está no docs/der.md do main.
- O "ID_POLITICO NOT NULL" de Davi (l.215) conflita com o SQL, que deixa NULL o título inválido. Com surrogate, cada candidatura de título inválido precisaria de uma linha própria em POLITICO. Isso é uma escolha de modelagem defensável, não um erro factual.

### [media] `der-corraca-08` — verificação interrompida

- **Arquivo:** docs/der-enrico.md (POLITICO), sql/04_politico.sql; docs/dicionario-dados.md (PR #4)
- **Problema:** Cor/raça está em entidades diferentes. O Enrico põe ds_cor_raca em POLITICO, com o valor da candidatura mais recente. O dicionário do Davi põe cd_cor_raca em CANDIDATURA porque o atributo 'muda entre eleições'. Os dados confirmam o dicionário: cor/raça muda com frequência para o mesmo título.
- **Evidência:** k16.py, títulos válidos que aparecem em mais de um ano de 2014 em diante: 317.463. Mudam de cor/raça (sem sentinelas -1/-4/6): 92.480 (29%). Mudam de gênero: 420 (0,13%). CD_COR_RACA = -3 em 100% das linhas de 2002 a 2012.
- **Correção:** No DER geral, cd_cor_raca fica em CANDIDATURA (domínio 1-5, 6 e -4 → NULL, só a partir de 2014). Tirar ds_cor_raca de POLITICO no der-enrico.md. Gênero pode ficar em POLITICO.

### [media] `der-situacao-09` — verificação interrompida

- **Arquivo:** docs/der-davi.md (Q2 e Q3: SITUACAO_TOTALIZACAO, FL_ELEITO '1, 2, 3 = true'); docs/dicionario-dados.md (domínio de cd_sit_tot_turno)
- **Problema:** fl_eleito tem duas regras. O Davi usa código (CD_SIT_TOT_TURNO in 1,2,3), com SITUACAO_TOTALIZACAO chaveada só pelo código. Enrico e Duda usam a descrição (DS in ELEITO, ELEITO POR QP, ELEITO POR MÉDIA, MÉDIA). O código muda de significado entre anos, então uma tabela de domínio por código não serve para o DER geral, que cobre a Q12 de 2002 a 2026.
- **Evidência:** k5.py, pares CD x DS: 2 = SUPLENTE em 2002, 2004 e 2010 (250.363 linhas) e ELEITO POR QP de 2012 em diante; 3 = RENÚNCIA/FALECIMENTO/CASSAÇÃO em 2002, 2004 e 2010 (1.006) e MÉDIA em 2006-2008; 5 = MÉDIA (eleito) em 2004 e 2010 (12.468) e SUPLENTE nos demais anos; -1 aparece como '#NULO' e como '#NULO#'. De 2012 em diante as duas regras dão o mesmo resultado.
- **Correção:** Unificar pela regra do Enrico e da Duda (descrição normalizada). Se SITUACAO_TOTALIZACAO continuar entidade, chaveá-la pela descrição normalizada, ou por (cd_sit_tot_turno, faixa de anos), com fl_eleito. Restringir o domínio do dicionário a '2012+' ou listar as variantes antigas.

### [media] `der-votacao-10` — verificação interrompida

- **Arquivo:** docs/der-davi.md (Q2 e Q3), docs/dossie/der.mmd; docs/der-duda.md; docs/der-modulo-eduardo.md (decisão ⑤)
- **Problema:** VOTACAO_CANDIDATO_MUNICIPIO diverge em grão, PK, FK e medida. Grão: zona no Davi (NR_ZONA na PK; na Q3 também CD_ELEICAO) e município×turno em der.mmd, Duda e der.md, com o Eduardo registrando que 'zona sai' por decisão do grupo. FK: SQ_CANDIDATO (Davi, der.mmd) x id_candidatura (Duda). Medida: QT_VOTOS_NOMINAIS_VALIDOS (Davi) x qt_votos_nominais vindo de QT_VOTOS_NOMINAIS (der.mmd, Duda), embora a Q9 da Duda fale em 'votos válidos'.
- **Evidência:** k7.py, soma nacional de QT_VOTOS_NOMINAIS x QT_VOTOS_NOMINAIS_VALIDOS: 2024 243.746.016 x 241.442.146; 2022 714.217.662 x 710.856.531; 2018 720.691.459 x 720.685.193. As PKs do Davi são únicas (2024: 717.246/717.246). ST_VOTO_EM_TRANSITO = 'S' tem 0 linhas em todos os anos, portanto não duplica.
- **Correção:** Grão município×turno (zonas somadas), PK (id_candidatura, cod_ibge, nr_turno) e FK de eleição pelo cd_eleicao do turno. Medida principal qt_votos_nominais_validos; qt_votos_nominais fica opcional. Remover NR_ZONA do der-davi.md.

### [media] `pr4-comparecimento-perfil-11` — verificação interrompida

- **Arquivo:** docs/dossie/der.mmd (COMPARECIMENTO_PERFIL), docs/dossie/secoes/dicionario.md
- **Problema:** COMPARECIMENTO_PERFIL do der.mmd tem PK (cod_ibge, ano, cd_faixa_etaria), sem nr_turno, sem gênero e sem qt_aptos. Com essa chave, o 2º turno soma com o 1º e duplica eleitores, e a PK é violada. A versão da Duda (cod_ibge, ano, nr_turno, id_faixa, gênero, com qt_aptos) está correta.
- **Evidência:** k9.py, perfil_comparecimento_abstencao PI. Aptos 2018: turno 1 = 2.370.894, turno 2 = 2.370.894. Aptos 2022: 2.573.810 nos dois turnos. Combinações distintas em 2024: chave da Duda 9.677; chave do der.mmd 4.911.
- **Correção:** Substituir no der.mmd e no dicionário do dossiê pela entidade da Duda, com FAIXA_ETARIA como tabela de domínio e qt_aptos, qt_comparecimento e qt_abstencao.

### [media] `der-eleitorado-12` — verificação interrompida

- **Arquivo:** docs/der-davi.md (Q3 ELEITORADO_MUNICIPIO), docs/dossie/der.mmd (ELEITORADO_MUNICIPIO)
- **Problema:** ELEITORADO_MUNICIPIO tem três versões: Davi (CD_MUNICIPIO, ANO_ELEICAO) com 'SUM QT_ELEITORES_PERFIL', der.mmd (cod_ibge, ano, cd_faixa_etaria) e der.md (mais escolaridade e gênero). A Duda removeu a entidade por redundância. Além disso, a coluna citada pelo Davi só existe até 2020, e o perfil_eleitorado baixado de 2022 em diante é só do PI, enquanto a Q3 é nacional.
- **Evidência:** k16.py, PI 2024: detalhe_votacao QT_APTOS (Prefeito, turno 1) = 2.698.764 = perfil_eleitorado QT_ELEITORES = perfil_comparecimento QT_APTOS (fato 5). k6.py: perfil_eleitorado 2016-2020 tem QT_ELEITORES_PERFIL e ANO_ELEICAO; 2022+ tem QT_ELEITORES e AA_ELEICAO, com arquivos *_PI.csv.
- **Correção:** Remover ELEITORADO_MUNICIPIO do DER geral. Na Q3, usar COMPARECIMENTO_MUNICIPIO.qt_aptos (detalhe_votacao, nacional) de um cargo representativo. Na Q7, usar COMPARECIMENTO_PERFIL. Se a entidade ficar, mapear as duas gerações de coluna e baixar o eleitorado nacional.

### [media] `der-receita-despesa-pk-13` — verificação interrompida

- **Arquivo:** docs/der-davi.md (Q1/Q2: SQ_RECEITA PK, SQ_DESPESA PK); docs/der-enrico.md (PR #2: FK 'sq_candidato' + 'ano FK'); docs/dossie/der.mmd
- **Problema:** O Davi usa SQ_RECEITA e SQ_DESPESA como PK, 'depois de filtrar Final e descartar -1'. Os outros usam surrogate (id_receita, id_despesa), e os dados mostram que o SQ continua repetido mesmo depois do filtro. As FKs para CANDIDATURA também divergem: sq_candidato (Davi, der.mmd), (sq_candidato, ano) sem entidade de destino (Enrico) e id_candidatura (Duda). O staging do Enrico não filtra Final; o DER do Davi exige.
- **Evidência:** k12.py e k14.py, PI 2024, prestação FINAL sem sentinela. Receitas: 30.301 linhas e 29.277 SQ_RECEITA; o SQ 44263753 aparece 12 vezes, mesmo candidato, 11 valores. Despesas contratadas: 86.375 linhas e 50.074 SQ_DESPESA; 10.867 SQ repetidos, todos do mesmo candidato, 10.355 com valores diferentes (k15.py). k20.py: as linhas PARCIAL, RELATÓRIO FINANCEIRO e REGULARIZAÇÃO são de candidatos sem FINAL (0 de sobreposição), então o filtro Final não deduplica nada e descarta candidatos (125 linhas no PI 2024).
- **Correção:** RECEITA_CAMPANHA(id_receita PK) e DESPESA_CAMPANHA(id_despesa PK), com sq_receita, sq_despesa e tp_prestacao_contas como atributos e FK id_candidatura. Documentar que PAGAMENTO_DESPESA liga pelo documento SQ_DESPESA, que não é a PK de DESPESA (associação N:N ou só atributo). Alinhar com o Enrico uma única regra sobre TP_PRESTACAO_CONTAS.

### [media] `der-agente-14` — verificação interrompida

- **Arquivo:** docs/der-enrico.md (AGENTE_FINANCEIRO), sql/01_staging.sql; docs/dossie/der.mmd (PR #4); docs/der-duda.md
- **Problema:** AGENTE_FINANCEIRO diverge em PK e classificação. PK: nr_cpf_cnpj no Enrico (FK nr_cpf_cnpj_doador/fornecedor), id_agente com UK nr_cpf_cnpj na Duda e no der.md, id_agente sem UK no der.mmd. Tipo: tp_pessoa pelo número de dígitos (Enrico, der.mmd) x tp_agente pelo CNAE (Duda). Pelos fatos 8 e 10, a regra por dígitos classifica partido e comitê como PJ.
- **Evidência:** Fatos 8 e 10 (50,3% da receita de 2014 vem de CNPJ com CNAE 9492-8). k11.py: 2014 PI 'Cod setor econômico do doador' com 7 dígitos (9492800 em 939 linhas) e '#NULO' em 10.330; 2018-2026 CD_CNAE_DOADOR com 5 dígitos (94928) e '-1' para PF (2024 PI: 20.816 linhas).
- **Correção:** AGENTE_FINANCEIRO(id_agente PK, nr_cpf_cnpj UK, nm_agente, cd_cnae CHAR(5) normalizado como no macro cnae5 do Enrico, ds_cnae, tp_pessoa (PF/PJ, por dígitos), tp_agente derivado (PF/EMPRESA/ORG_POLITICA, CNAE 94928 = organização política)). Manter os dois atributos com nomes distintos. FKs de RECEITA e DESPESA por id_agente.

### [media] `der-originario-15` — verificação interrompida

- **Arquivo:** docs/der-duda.md (RECEITA_CAMPANHA.id_agente_originario); docs/der-enrico.md e docs/dossie/der.mmd (sem originário)
- **Problema:** Só o DER da Duda tem o doador originário, como uma segunda FK 0..1 em RECEITA_CAMPANHA. O Enrico e o der.mmd não têm (fato 10). O modelo da Duda serve para 2014-2016, onde o originário é coluna da própria receita. De 2018 em diante ele vem em arquivo separado, com várias linhas por receita e quase sempre com SQ_RECEITA sentinela, então uma FK única não representa os anos novos.
- **Evidência:** k12.py, receitas_candidatos_doador_originario_<ano>_PI.csv: 2022 SQ_RECEITA 32915827 com 53 linhas e 45 originários distintos; 2024 44444513 com 42 linhas e 41 originários. SQ_RECEITA sentinela: 2024 8.382 de 8.605 linhas; 2020 9.880 de 10.368. k10.py: 2014 e 2016 têm 'CPF/CNPJ do doador originário', 'Tipo doador originário' e 'Setor econômico do doador originário' na mesma linha da receita.
- **Correção:** No DER geral, manter id_agente_originario em RECEITA_CAMPANHA com a nota 'só 2014-2016' (escopo da Q8), ou criar RECEITA_DOADOR_ORIGINARIO(id_receita, id_agente, vr) N:N para 2018+. Incluir as colunas do originário no contrato stg_receita.

### [media] `der-federacao-16` — verificação interrompida

- **Arquivo:** docs/dossie/der.mmd e docs/dicionario-dados.md (PR #4: FEDERACAO PK nr_federacao, CANDIDATURA.nr_federacao FK); docs/der-modulo-eduardo.md (PR #3)
- **Problema:** der.mmd e o dicionário chaveiam FEDERACAO só por nr_federacao e ligam CANDIDATURA direto à federação. O Eduardo usa (id_eleicao, nr_federacao) mais a associativa PARTIDO_FEDERACAO(id_eleicao, nr_partido), que não existe nos outros DERs. Nos dados, a mesma federação tem dois números, e (ano, nr_partido) aponta para duas federações quando as suplementares ficam misturadas.
- **Evidência:** k3.py. PT/PCdoB/PV = 2 na ordinária de 2022 e 101 nas suplementares de 2022 e em 2024/2026; PSDB/CIDADANIA = 1 x 100; PSOL/REDE = 3 x 102. Em 2022 o NR_PARTIDO 13 aparece com as federações 2 (ordinária) e 101 (suplementar). Em 2024 os partidos 11, 25, 44 e 77 aparecem com -1 (ordinária) e 103/104 (suplementar). Cada número tem uma composição só (ncomp = 1).
- **Correção:** Adotar o modelo do Eduardo no DER geral, com FEDERACAO(ano, nr_federacao) e PARTIDO_FEDERACAO(ano, nr_partido) restritos a ordinárias (ou por cd_eleicao, se as suplementares entrarem). Remover CANDIDATURA.nr_federacao ou marcá-la como derivada via PARTIDO_FEDERACAO. Na série histórica da Q5, agregar pela composição/sigla, não pelo número.

### [media] `pr4-proposta-17` — verificação interrompida

- **Arquivo:** docs/dossie/der.mmd (PROPOSTA_GOVERNO, TERMO_PROPOSTA), docs/dossie/secoes/dicionario.md, docs/dicionario-dados.md (1:0..1)
- **Problema:** PROPOSTA_GOVERNO tem PK sq_candidato e cardinalidade CANDIDATURA ||--o| (1:0..1) no der.mmd e nos dicionários. O Eduardo usa (sq_candidato, nr_sequencial) e 1:N, e os dados confirmam o Eduardo. Em contrapartida, a regra de parse do nome do arquivo do Eduardo só funciona para 2024 e 2026.
- **Evidência:** k11.py e k12.py, zips proposta_governo_<ano>_PI.zip: 6 candidatos de 2024 com _01 e _02 (por exemplo 2024PI180001930203_01/_02). Os PDFs de 2016 (562), 2020 (528), 2018 (11) e 2022 (10) não têm sufixo, no formato '2016PI180000007292.pdf'.
- **Correção:** PROPOSTA_GOVERNO(sq_candidato ou id_candidatura, nr_sequencial) como PK, com nr_sequencial = 1 quando o arquivo não tiver sufixo. TERMO_PROPOSTA(…, nr_sequencial, termo). Cardinalidade ||--o{.

### [media] `pr4-der-mmd-incompleto-18` — verificação interrompida

- **Arquivo:** docs/dossie/der.mmd, docs/dicionario-dados.md, docs/TODO.md
- **Problema:** O der.mmd do dossiê, que se apresenta como o DER do grupo, não tem várias entidades dos módulos. O dicionário declara FKs para tabelas que não existem em nenhum diagrama de módulo.
- **Evidência:** Ausentes no der.mmd: SITUACAO_TOTALIZACAO, BEM_CANDIDATO, PAGAMENTO_DESPESA, IDHM (Davi); GRAU_INSTRUCAO, NIVEL_INSTRUCAO_COMPARAVEL, PARTIDO_FEDERACAO (Eduardo); ESPECTRO_PARTIDO, FAIXA_ETARIA, CENSO_FAIXA_ETARIA (Duda). O dicionário-dados.md tem FK para COLIGACAO, OCUPACAO, GRAU_INSTRUCAO, SITUACAO_TOTALIZACAO e UF; COLIGACAO e OCUPACAO só aparecem no der.md antigo do main. O TODO.md do PR #4 deixa pendente '- [ ] modificar der.mmd, colocar o DER completo'.
- **Correção:** Regenerar o der.mmd a partir do DER geral unificado, com as 12 perguntas e as correções destes findings. Retirar do dicionário as FKs para COLIGACAO e OCUPACAO, ou incluir essas entidades no DER geral com fonte (consulta_coligacao existe em candidatos/<ano>/coligacoes_*).

### [media] `pr4-socioeconomico-19` — verificação interrompida

- **Arquivo:** docs/der-davi.md (Q3: IDHM, MUNICIPIO_ANO), docs/dossie/der.mmd (MUNICIPIO_ANO)
- **Problema:** As entidades socioeconômicas do Davi não batem com o que foi baixado nem com o estrategia.md. IDHM não tem arquivo em dados/raw. MUNICIPIO_ANO precisa de população por ano de eleição, mas a SIDRA 6579 baixada só tem 2026. A renda domiciliar do Censo 2022 (SIDRA 10295), que o estrategia.md põe como eixo rico/pobre da Q3 junto com o PIB per capita, foi baixada e não está em nenhum DER.
- **Evidência:** k13.py: nenhum caminho em dados/raw contém 'idh' ou 'atlas'. 6579_populacao_municipios.json tem 5.571 linhas, todas de 2026. 10295_renda_domiciliar_municipios.json tem 11.140 linhas, todas de 2022. O PIB tem base_de_dados_2002_2009 e 2010_2023. estrategia.md (main) linhas 96-97: 'O eixo rico/pobre é PIB per capita + renda domiciliar do Censo 2022, não IDHM'.
- **Correção:** Incluir a renda domiciliar (por exemplo, atributo vr_renda_domiciliar em uma entidade MUNICIPIO_CENSO(cod_ibge, ano_censo) junto com CENSO_INSTRUCAO e CENSO_FAIXA_ETARIA). Marcar IDHM como 'sem fonte baixada' ou baixar o Atlas. Baixar a população dos anos de eleição, ou declarar o uso da estimativa 2026 e do Censo 2022 como denominador.

### [baixa] `der-municipio-opcional-20` — não verificado (baixa)

- **Arquivo:** docs/der-davi.md (Q1/Q2: MUNICIPIO ||--o{ CANDIDATURA e VAGA com FK município); docs/dicionario-dados.md (sigla_uf FK → UF)
- **Problema:** Nas Q1 e Q2 o Davi torna o município obrigatório em CANDIDATURA ('CD_MUNICIPIO NOT NULL') e VAGA sempre aponta para MUNICIPIO. Na Q3, no der.mmd e na Duda o vínculo é opcional. Em eleição geral SG_UE é a UF ou 'BR', então a FK obrigatória quebra. O dicionário também põe CANDIDATURA.sigla_uf como FK → UF, mas presidente tem 'BR'.
- **Evidência:** k18.py, votacao_partido 2022: cargo 1 com SG_UE='BR'; cargos 3, 5, 6 e 7 com SG_UE='PI'. k9.py: consulta_vagas de 2018, 2022 e 2026 tem 197, 193 e 191 linhas, todas com SG_UE = UF ou BR. k5.py: SG_UF='BR' em 172 linhas de consulta_cand.
- **Correção:** No DER geral, usar MUNICIPIO o|--o{ CANDIDATURA (cod_ibge anulável) e declarar que VAGA com FK para município vale só para eleição municipal. Para eleição geral, criar UNIDADE_ELEITORAL(sg_ue), como o próprio Davi sugere na Q1, ou deixar VAGA municipal-only. Incluir 'BR' em UF ou tornar sigla_uf anulável.

### [baixa] `der-nomes-21` — não verificado (baixa)

- **Arquivo:** docs/dossie/der.mmd, docs/dicionario-dados.md (PR #4); docs/der-modulo-eduardo.md (PR #3); docs/der-enrico.md e sql/02-03 (PR #2); docs/der-davi.md
- **Problema:** A mesma coisa aparece com nomes diferentes: cod_cargo (der.mmd, dicionário, Eduardo) x CD_CARGO/cd_cargo (Davi, Enrico, Duda); sigla_uf x SG_UF/sg_uf; nm_completo x nm_candidato; qt_abstencao (der.mmd) x QT_ABSTENCOES (coluna real, Davi); ano x ANO_REFERENCIA x ano_censo; id_fonte_recurso (der.mmd) x cd_fonte_recurso (Enrico). O Enrico usa o prefixo cd_ em surrogates, o que as confunde com códigos do TSE. Além disso, CENSO_INSTRUCAO usa cd_nivel_instrucao no der.mmd e cd_nivel_comparavel no Eduardo.
- **Evidência:** sql/02_fonte_recurso.sql: 'row_number() OVER (ORDER BY ds_fonte, ds_origem) AS cd_fonte_recurso'. sql/03_tipo_despesa.sql: 'row_number() ... AS cd_tipo_despesa'. k10.py: não existe CD_TIPO_DESPESA em nenhum leiaute (2014/2016 só 'Tipo despesa' texto; 2024 CD_ORIGEM_DESPESA/DS_ORIGEM_DESPESA). O próprio dicionário diz que 'cd_' é código herdado do TSE.
- **Correção:** Criar um glossário único no DER geral: cd_cargo, sg_uf, nm_candidato, qt_abstencoes, ano_referencia só para IBGE. Surrogates com id_ (id_fonte_recurso, id_tipo_despesa). CENSO_INSTRUCAO com cd_nivel_comparavel → NIVEL_INSTRUCAO_COMPARAVEL, como no Eduardo.

### [baixa] `der-espectro-22` — não verificado (baixa)

- **Arquivo:** docs/dossie/der.mmd (PARTIDO.cd_espectro); docs/estrategia.md decisão ③; docs/der-modulo-eduardo.md decisão ④; docs/der-duda.md (ESPECTRO_PARTIDO)
- **Problema:** O espectro partidário está modelado de duas formas: como atributo PARTIDO.cd_espectro (der.mmd, estrategia.md ③, Eduardo ④) e como entidade separada ESPECTRO_PARTIDO(ano, nr_partido) com ano_rodada, vl_ideologia e ds_fonte (Duda).
- **Evidência:** der.mmd linhas 84-88: PARTIDO {nr_partido PK, sg_partido, cd_espectro}. der-duda.md linhas 69-76: ESPECTRO_PARTIDO {ano PK FK, nr_partido PK FK, ano_rodada, vl_ideologia, cd_espectro, ds_fonte}, PARTIDO ||--o| ESPECTRO_PARTIDO.
- **Correção:** Adotar a entidade da Duda no DER geral: fonte não governamental, rodada 2018 x 2022 e partidos sem classificação (PRD) ficam 0..1. Retirar cd_espectro de PARTIDO no der.mmd e atualizar a referência no Eduardo.

### [baixa] `pr3-transito-23` — não verificado (baixa)

- **Arquivo:** docs/der-modulo-eduardo.md (VOTACAO_LEGENDA_MUNICIPIO; decisão ⑤)
- **Problema:** O Eduardo diz que votacao_partido_munzona traz 'duas linhas por combinação (S e N)' de ST_VOTO_EM_TRANSITO e que carregar sem agregar duplicaria a PK. Nos arquivos baixados só existe 'N'. Somar continua inofensivo, mas a justificativa não se sustenta.
- **Evidência:** k9.py, contagem por ST_VOTO_EM_TRANSITO em votacao_partido_munzona_<ano>_BRASIL.csv: só N em 2016 (125.816), 2018 (607.096), 2020 (79.134), 2022 (537.159) e 2024 (80.614). O mesmo vale para votacao_candidato e detalhe_votacao (0 linhas 'S', k7.py).
- **Correção:** Reescrever a justificativa: somar zona é a única agregação que muda a chave. Manter o SUM sobre ST_VOTO_EM_TRANSITO só como proteção, com a nota de que em 2016-2024 não há linhas 'S'.


## Dados faltantes por pergunta

Levantei os dados faltantes das 12 perguntas cruzando três coisas: o que os coletores do main (839cdb4: coleta_tse.py, coleta_ibge.py, coleta_pnud.py) baixam, o que existe de fato em dados/raw (contei linhas, UFs e anos com DuckDB e Python) e o que o CDN do TSE e a API do IBGE oferecem. No TSE só fiz requisições HEAD e Range de poucos bytes, sem baixar arquivo nenhum. Também conferi o que os PRs #2, #3 e #4 e o der-duda.md afirmam sobre essas fontes. As lacunas mais graves são quatro. A Q6 não tem nenhuma proposta de presidente, embora os zips _BR existam no CDN. A população municipal só foi baixada para 2026 (p/last), sem 2022/2024 para a Q3 nem 2018-2024 para a Q7. O IDHM municipal não é coletado por nenhum script, mas está no DER da Q3. E não existe no repositório nenhum dado de espectro partidário, do qual dependem Q7, Q8 e Q9. Há também lacunas médias. A prestação de contas extraída localmente é só do PI, mas o main diz nacional. Q7 e o eleitorado de 2022/2024 cobrem só o PI. A Q8 não tem os anos de 2002 a 2012 nem as receitas de partidos e comitês de 2014. Parte dos PDFs de prefeito não tem texto, e o DER da Q1 cobre só eleições municipais. Todos os scripts de medição estão em C:/Users/eduar/Downloads/rv/df/.

**Conferido e correto:**

- Q1 denominador: consulta_vagas nacional para todos os anos (vag.py). 2016: 17.082 linhas / 5.568 SG_UE / 69.456 vagas. 2020: 16.955 linhas / 69.579 vagas. 2024: 16.795 linhas / 5.569 SG_UE / 69.671 vagas. 2018 e 2022: 197 e 193 linhas (27 UFs + BR). A coluna é QT_VAGAS em 2016 e QT_VAGA de 2018 em diante, como diz o der-davi.md.
- Q5: votacao_partido_munzona nacional de 2018 a 2024 está presente. Não há duplicação do voto de legenda entre os partidos de uma federação, pendência que o PR #3 (linha 408) deixou como 'Falta medir'. Em 2022, a soma de QT_TOTAL_VOTOS_LEG_VALIDOS do votacao_partido é igual à de QT_VOTOS_LEG_VALIDOS do detalhe_votacao: Dep. Federal 4.291.513 = 4.291.513, Estadual 7.527.036 = 7.527.036, Distrital 69.316 = 69.316. Em 2024 (vereador) dá 4.559.733 contra 4.582.222: o votacao_partido fica 0,5% abaixo, e não num múltiplo (leg2.py).
- Q3 abstenção, brancos e nulos: detalhe_votacao_munzona _BRASIL está presente de 2016 a 2024. Tem 5.570 municípios em 2022 (governador, 1º turno) e 5.569 em 2024 (prefeito) (apt.py).
- Q3 PIB: a planilha 'PIB dos Municípios 2010-2023' cobre 2010 a 2023, com 5.570 municípios por ano desde 2013 (5.565 entre 2010 e 2012). Traz PIB per capita pronto e as regiões Imediata e Intermediária, que o der-duda.md usa para a Q9. Não existe PIB municipal de 2024, então a eleição de 2024 usa o de 2023 (defasagem a declarar).
- SIDRA (Censo 2022, 5.570 municípios): 10061 tem 27.850 linhas (5 por município: Total + 4 níveis); 10062 tem 5.570; 10295 tem 11.140; 9606 tem 116.970 (21 faixas por município). A soma da 9606 dá 203.080.756 pessoas no Brasil e 866.300 em Teresina, os totais do Censo, então a população de 2022 pode sair daí. As faixas 15-19, 20-24 e 25-29 fecham o corte de jovem em 15-29.
- consulta_cand nacional de 2002 a 2026 está presente para a Q12. DS_SIT_TOT_TURNO está preenchido em 85-93% das linhas entre 2002 e 2014; o resto é #NULO, de candidaturas sem resultado. DT_NASCIMENTO inválido fica em no máximo 284 linhas por ano entre 2016 e 2024. CD_GRAU_INSTRUCAO não tem inválidos em nenhum ano (cand.py).
- Fato 9 reconfirmado nos cabeçalhos: 2002-2012 têm 63 colunas, 2014 tem 50, 2016 tem 75 e 2018-2026 têm 50. VR_DESPESA_MAX_CAMPANHA e NR_IDADE_DATA_POSSE existem em 2002-2012 e em 2016, e não existem em 2014 nem de 2018 em diante. Fato 2 reconfirmado: 2004 tem 402.157 linhas e 1.357 valores distintos de SQ_CANDIDATO.
- Q8: as receitas de 2014 e 2016 trazem as colunas de doador originário na mesma linha: 'CPF/CNPJ do doador originário', 'Tipo doador originário' e 'Setor econômico do doador originário' (cabeçalho de receitas_candidatos_2014_PI.txt e de ..._final_2016_PI.txt). Os _brasil nacionais estão dentro dos zips.
- Achado 7 do der-duda.md vale para os quatro anos, não só para 2024. No PI, QT_APTOS do perfil_comparecimento no 1º turno é igual à soma do perfil_eleitorado: 2018 = 2.370.894, 2020 = 2.456.056, 2022 = 2.573.810, 2024 = 2.698.764 (apt2.py).
- Q6 governador: todos os candidatos a governador do PI têm PDF: 10/10 em 2018, 9/9 em 2022 e 11/11 em 2026 (prop.py). Os PDFs de governador têm texto extraível: 0 de 31 sem fonte.
- Ponte de municípios: municipio_tse_ibge.csv tem 5.571 linhas, com CD_MUNICIPIO_TSE e CD_MUNICIPIO_IBGE únicos.
- Q10 em 2018: o CDN não tem fefc_fp_2018.zip (404), mas isso não é lacuna. A receita de 2018 identifica o FEFC por DS_FONTE_RECEITA; o PR #2 mede R$ 49,86 mi de dinheiro público no PI em 2018.
- Q11: despesas_contratadas de 2018 a 2024 têm DS_ORIGEM_DESPESA, DS_DESPESA (texto livre para a nuvem) e NM_MUNICIPIO_FORNECEDOR, no cabeçalho de 53 colunas.
- Arquivos de 2026 vazios são esperados, porque a eleição ainda não aconteceu: os três CSVs de resultados/2026 só têm o cabeçalho (1 linha), e perfil_comparecimento_abstencao_2026.zip devolve 404.

**Achados:**

### [alta] `q7q8q9-espectro-01` — confirmado

- **Arquivo:** docs/der-duda.md (ESPECTRO_PARTIDO, working copy); docs/estrategia.md decisão ③; PR #4 docs/dossie/der.mmd:87
- **Problema:** Q7, Q8 e Q9 agregam por cd_espectro, mas não existe no repositório nenhum dado de espectro: nem CSV, nem tabela, nem coletor. A fonte citada (Bolognesi et al., rodadas de 2018 e 2022) está só em texto. Além disso, várias siglas dos anos pedidos não aparecem com o mesmo nome na rodada correspondente.
- **Evidência:** 'git grep -i -E "bolognesi|espectro"' no main e nos PRs #2, #3 e #4 só acha texto em .md e .mmd. sig.py listou as siglas por ano com CD_TIPO_ELEICAO='2'. Siglas de 2014/2016 que não existem em 2018: PMDB, PSDC, PT do B, PTN, SD. Siglas de 2020 que não existem em 2018: CIDADANIA, PL, REPUBLICANOS, UP. Siglas de 2024 que não existem em 2022: MOBILIZA, PRD. O der-duda.md só registra o PRD.
- **Correção:** 1) Commitar dados/manual/espectro_partido.csv (ano_rodada, sg_partido_rodada, vl_ideologia, fonte, pagina_tabela), transcrito das tabelas de Bolognesi, Ribeiro e Codato (2023, Dados 66(2), rodada de 2018) e de Bolognesi, Ribeiro, Codato e Silva (2025, Opinião Pública 31, rodada de 2022). Citar a referência completa também no estrategia.md, que hoje só diz 'escala acadêmica'.

2) Commitar dados/manual/de_para_sigla.csv com as colunas (ano, nr_partido, sg_partido_tse, ano_rodada, sg_partido_rodada, regra). Uma linha por (ano, nr_partido) de cada eleição em uso: 2014, 2016, 2018, 2020, 2022 e 2024.
- Renomeações: PMDB→MDB, PSDC→DC, PT do B→AVANTE, PTN→PODE, SD→SOLIDARIEDADE, PPS→CIDADANIA, PR→PL, PRB→REPUBLICANOS, PMN→MOBILIZA.
- O casamento é pela sigla, ou pelo par (ano, nr_partido) explícito, e NUNCA só pelo nr_partido. Três números foram reaproveitados: 20 (PSC até 2022, PODE em 2024; o PODE era 19), 25 (DEM→PRD) e 44 (PRP→UNIÃO).
- Com esse CSV, ESPECTRO_PARTIDO é montada por (ano, nr_partido) na carga.

3) Escrever as regras dos casos sem rodada:
- UP: registrada em dez/2019, sem partido de origem, portanto não pode herdar. Em 2020, deixar NULL ('sem classificação') ou usar a rodada de 2022, se o UP estiver nela. Decidir e documentar.
- PRD: fusão PTB+PATRIOTA em 2023. Herdar, por exemplo, a média dos dois na rodada de 2022, ou NULL. Documentar.
- MOBILIZA: herda do PMN.

4) Definir o corte do vl_ideologia nas 5 categorias de cd_espectro, usando as faixas dos artigos se elas existirem.

5) Colocar no der-duda.md a lista completa de siglas sem correspondência, não só o PRD. Acrescentar o reaproveitamento do número 20 à tabela de achados (linha 196).

6) No PR #4 (der.mmd:84-88), tirar cd_espectro de PARTIDO, que tem PK só em nr_partido, ou mudar a PK para (ano, nr_partido).

Sem os CSVs dos itens 1 e 2 prontos antes da carga, Q7, Q8 e Q9 ficam sem resposta.
- **Verificação:** Reproduzi o achado por conta própria e as afirmações centrais se confirmam.

(1) Não existe dado de espectro em lugar nenhum. Rodei 'git -C C:/Users/eduar/Downloads/bdr/analiseCandidatos grep -n -i -E "bolognesi|espectro"' em origin/main, pr/2, pr/3 e pr/4. Só aparece texto:
- main: docs/estrategia.md:136, 147, 283, 291 e 294
- pr/2: também docs/q12-linha-do-tempo.md:59
- pr/3: docs/der-modulo-eduardo.md:348
- pr/4: docs/dossie/der.mmd:87 ('string cd_espectro'), secoes/dicionario.md:16 ('documentar fonte do espectro'), perguntas.md:13, sobre.md:7 e index.html
Não há nenhum .csv, .py ou .sql. 'git ls-tree -r' dos 4 refs não mostra nenhum arquivo de espectro, ideologia ou dados/manual. Um find no working copy e no worktree de dados também não achou nada. Os CSVs brutos que batem no grep só contêm a palavra solta.

(2) A fonte está só em texto, e é ainda pior do que o achado diz. 'Bolognesi' não aparece em nenhum ref do git. Está só no docs/der-duda.md não commitado (linhas 220-234, rodadas de 2018 e 2022; regra na linha 229: '2014 a 2020 usam a rodada de 2018; 2022 e 2024 usam a de 2022'). O estrategia.md do main diz apenas 'escala acadêmica publicada' (decisão ③), sem citar o artigo. O corte do vl_ideologia nas 5 categorias continua em aberto (der-duda.md:234).

(3) Siglas. Rodei C:/Users/eduar/Downloads/rv/cetico-espectro/sig.py (DuckDB, consulta_cand_<ano>_BRASIL.csv, CD_TIPO_ELEICAO='2'). Resultado:
- 2014-2018 = [PMDB, PSDC, PT do B, PTN, SD]
- 2016-2018 = igual
- 2020-2018 = [CIDADANIA, PL, REPUBLICANOS, UP]
- 2024-2022 = [MOBILIZA, PRD]
Os números batem exatamente com o achado. O der-duda.md:231 só trata do PRD, como o achado diz.

Ressalva: usei o arquivo do TSE de 2018/2022 como substituto dos nomes que a rodada usa. A lista real de partidos dos artigos não foi verificada, porque não há cópia deles no repo nem nos dados.

(4) Um detalhe que o achado não viu. Rodei nr.py para mapear número → sigla por ano. Todas as renomeações mantêm o número:
- 15 PMDB→MDB
- 27 PSDC→DC
- 70 PT do B→AVANTE
- 19 PTN→PODE
- 77 SD→SOLIDARIEDADE
- 23 PPS→CIDADANIA
- 22 PR→PL
- 10 PRB→REPUBLICANOS
- 33 PMN→MOBILIZA
Porém: 20 = PSC (2014-2022) e PODE (2024). O PODE era 19 até 2022. Além disso, 25 = DEM (2014-2020) e PRD (2024), e 44 = PRP (2014-2018) e UNIÃO (2022+). O 20 é um terceiro número reaproveitado, que o der-duda.md:196 não registra. Nenhum (ano, nr) tem duas siglas.

Por fim, no PR #4 o der.mmd:80-88 põe cd_espectro dentro de PARTIDO com PK só em nr_partido. Assim a classificação não pode variar por ano e colide nos números 20, 25 e 44. Na prática, isso é o mesmo problema da chave (ano, nr_partido).

Severidade alta mantida: as três perguntas (Q7, Q8 e Q9) agregam por espectro. Sem esse CSV nenhuma delas tem resposta.

### [alta] `pr4-chaves-q12-01` — confirmado

- **Arquivo:** docs/dicionario-dados.md:42; docs/estrategia.md:315 e :336; main scripts/coleta_tse.py:34-35
- **Problema:** O dicionário declara SQ_CANDIDATO como 'Único em toda a base (o TSE não reusa entre anos)'. Isso contradiz o fato 2 e quebra a PK de CANDIDATURA de 2002 a 2008, anos que só a Q12 usa. A decisão ② do estrategia.md ainda diz que dá para ligar o político por CPF e que 2002-2012 estão 'fora', o que contradiz a seção 5 e a coleta. O comentário no coleta_tse.py do main repete o CPF como chave.
- **Evidência:** 2004: 402.157 linhas e 1.357 valores distintos de SQ_CANDIDATO, com leitura estrita, count(distinct). estrategia.md:315 diz 'dá para ligar o mesmo político entre eleições por CPF'. coleta_tse.py:35 diz 'dá para ligar a mesma pessoa entre eleições por CPF'. Em 2024, NR_CPF_CANDIDATO='-4' em 100% das linhas (fato 1). ANOS_HISTORICO coleta 2002-2014, o que contradiz estrategia.md:336.
- **Correção:** Correção no dicionário-dados.md, linha 42:
- A PK passa a ser uma substituta, `id_candidatura` BIGINT.
- Chave natural UNIQUE: (cd_eleicao, sg_ue, sq_candidato). Opcionalmente com ano_eleicao na frente, para ficar mais legível.
- Essa chave é única em 100% das 2.954.876 linhas de 2002 a 2026, e o CD_ELEICAO nunca se repete entre anos.
- Observação a registrar: "SQ_CANDIDATO NÃO é único. Até 2008 é um contador de 1 a 5 dígitos por unidade eleitoral. Entre 2010 e 2016 o TSE reaproveita valores entre anos (393.256 SQ em comum entre 2012 e 2016, de pessoas diferentes). O mesmo SQ aparece no 1º e no 2º turno."
- Domínio: "1 a 5 dígitos até 2008; 11 a 12 dígitos de 2010 em diante".

Se a CANDIDATURA juntar os turnos numa linha só, como faz o der-duda.md, use (cd_eleicao do 1º turno, sg_ue, sq_candidato). Não use (ano, sg_ue, cd_cargo, sq_candidato): em 2004 ela colide em 22 grupos entre a eleição regular e as suplementares, 13 deles com pessoas diferentes. A linha 85 do der-duda.md precisa da mesma correção.

Outras correções no PR #4:
- Linha 51 do dicionário: trocar "dois SQ_CANDIDATO" por "o mesmo SQ_CANDIDATO; o que muda são NR_TURNO e CD_ELEICAO (619→620 em 2024)".
- Nas tabelas que apontam para a candidatura (VOTACAO_CANDIDATO_MUNICIPIO, RECEITA_CAMPANHA, DESPESA_CAMPANHA, bens), trocar a FK em sq_candidato por id_candidatura, ou pela chave composta.
- Aplicar o mesmo em der-davi.md e dossie/der.mmd. No der.mmd, trocar `int` por `bigint`.

Na estrategia.md, decisão ②, reescrever:
- O CPF não serve como chave (2024 = '-4', LGPD); a chave da pessoa é o título de eleitor.
- 2002-2012 entram por causa da Q12, só com o consulta_cand, como a linha 155 e o ANOS_HISTORICO já dizem.

No coleta_tse.py, linhas 34-35, trocar o comentário do CPF por "liga-se a pessoa pelo NR_TITULO_ELEITORAL_CANDIDATO; o CPF foi suprimido em 2024". Isso vale para o main: o texto já existia lá antes do PR #4, que só deixou de corrigi-lo.
- **Verificação:** Tentei refutar o achado e não consegui. O problema existe e é maior do que o achado diz. Porém a correção proposta também está errada.

Scripts em C:/Users/eduar/Downloads/rv/cetico-q12/ (sq.py, cross2.py, cde.py). Todos leem os 13 arquivos consulta_cand_<ano>_BRASIL.csv com read_csv em modo estrito (all_varchar, cp1252, sem ignore_errors).

1) O texto do PR está como o achado diz. Comando: git show origin/pr/4:docs/dicionario-dados.md, linha 42.
- PK = `sq_candidato`.
- Domínio: "inteiro positivo, 11 dígitos".
- Observação: "Chave natural. Único em toda a base (o TSE não reusa entre anos)."
- O arquivo não existe em origin/main, então foi o PR #4 que introduziu o erro.

2) O fato 2 se reproduz. Em 2004 são 402.157 linhas e só 1.357 valores de SQ_CANDIDATO (count distinct).
- 2002: 18.109 linhas para 5.111 valores.
- 2006: 19.303 para 3.165.
- 2008: 382.079 para 68.563.
- Até 2008 o SQ tem de 1 a 5 dígitos; de 2010 em diante, de 11 a 12. O domínio "11 dígitos" também está errado.

3) O achado não viu isto: o SQ também se repete ENTRE anos de 2010 em diante. Rodei cross2.py sobre 2.133.228 linhas de 2010 a 2026: há só 1.700.533 SQ distintos.
- 2012 e 2016 têm 393.256 SQ em comum.
- 2010 e 2014 têm 18.442.
- 2012 e 2014 têm 17.066.
- 2010 e 2012 têm 14.023.
- 2010 e 2016 têm 1.236.
- 419.010 desses SQ aparecem com título de eleitor diferente, ou seja, são outra pessoa. Exemplo: SQ 180000009953 é o título 009853871511 no PI em 2012 e o título 020032431597 no PI em 2016.
- Entre os anos de 2018 a 2026 não achei SQ repetido.

4) O SQ também se repete DENTRO do mesmo ano, entre turnos. Em 2024 são 463.859 linhas e 463.655 SQ distintos. Os 204 SQ repetidos têm NR_TURNO 1 e 2. Exemplo: SQ 220001919959 aparece com turno 1 e CD_ELEICAO 619, e com turno 2 e CD_ELEICAO 620.
- Isso desmente a linha 51 do mesmo dicionário: "Candidato que vai ao 2º turno aparece em duas linhas (dois `SQ_CANDIDATO`)". O SQ é o mesmo nas duas linhas.
- Resultado: a PK `sq_candidato` quebra em todos os anos, não só de 2002 a 2008.

5) A chave que o achado propõe também não é única. Somando todos os anos, são 2.954.876 linhas.
- (ano, sg_ue, cd_cargo, sq_candidato): 2.953.378 valores distintos. Falha na granularidade que o próprio dicionário declara (candidato × eleição × turno).
- Mesmo acrescentando nr_turno, 2004 tem 22 grupos repetidos entre a eleição regular (CD_ELEICAO 200412) e eleições suplementares. Em 13 deles o título é diferente.
- (ano, cd_eleicao, sg_ue, sq_candidato): 2.954.876 distintos, ou seja, 100% únicos.
- (cd_eleicao, sg_ue, sq_candidato) também é 100% único. Nenhum CD_ELEICAO aparece em mais de um ano.
- O der-duda.md, linha 85, usa como chave natural justamente "ano, sg_ue, cd_cargo, sq_candidato". Portanto "como no der-duda.md" herda a colisão de 2004.

6) Na estrategia.md do PR #4, as linhas 313-316 dizem "dá para ligar o mesmo político entre eleições por CPF" e a linha 336 diz "2002–2012 — fora".
- A seção 5 do mesmo arquivo (linhas 454-488) desmente: título como chave, 2024 com CPF '-4'.
- A linha 155 também contradiz: "Q12 ... 2002–2026".
- Ressalva de atribuição: esse texto já estava no main (linhas 258-261 e 281). O PR #4 não o criou. O que o PR #4 fez foi reescrever a decisão ① e manter o cabeçalho "todas fechadas" sem atualizar a ②.

7) O coleta_tse.py do main, linhas 33-36, diz "dá para ligar a mesma pessoa entre eleições por CPF" e define ANOS_HISTORICO = [2002 … 2014]. O PR #4 não mexe nesse arquivo (git diff --stat vazio). Isso é do main, como o achado indica.

8) Os outros DERs do PR #4 têm o mesmo erro:
- docs/der-davi.md usa `BIGINT SQ_CANDIDATO PK` (linhas 55 e 169).
- docs/dossie/der.mmd usa `int sq_candidato PK` (linha 95). Além da chave, o tipo INT estoura: há SQ de 12 dígitos, como 250000076454, maior que 2.147.483.647.

Por que subi a severidade para alta: é a PK da entidade central, no dicionário e nos dois DERs do PR. Carregar 2012 junto com 2016 dá cerca de 393 mil violações de PK. Um upsert juntaria pessoas diferentes em silêncio.

### [media] `q6-presidente-01` — parcial

- **Arquivo:** scripts/coleta_tse.py (coletar_proposta_governo); docs/fontes-de-dados.md:121; PR #3 docs/der-modulo-eduardo.md:264
- **Problema:** A Q6 pede as propostas de prefeito, governador e presidente, mas não há nenhum PDF de presidente. O coletor só baixa proposta_governo_{ano}_PI.zip. O fontes-de-dados.md afirma que 'Não existe agregado _BR', o que é falso. O módulo do Dudu (PR #3) também só usa o _PI.
- **Evidência:** O zipcd.py leu a lista de arquivos no fim dos zips remotos, via Range, sem baixá-los. proposta_governo_2018_BR.zip tem 9.217.626 bytes e 13 PDFs (BR/2018BR280000601016.pdf ...). proposta_governo_2022_BR.zip tem 15.771.758 bytes e 13 PDFs. proposta_governo_2026_BR.zip tem 18.275.613 bytes e 14 PDFs. Os nomes _BRASIL dão 404. Candidatos a presidente em consulta_cand: 14 em 2018, 13 em 2022, 14 em 2026. Em dados/raw/proposta_governo só existem zips _PI; nos anos gerais eles trazem apenas governador (2018: 10 PDFs, todos de GOVERNADOR).
- **Correção:** (a) Antes de tudo, confirmar com o grupo e com o enunciado original se a Q6 inclui presidente. O texto do repositório não diz isso.

(b) Se incluir, alterar coletar_proposta_governo para baixar também proposta_governo_{ano}_BR.zip, só nos anos gerais 2018, 2022 e 2026. São cerca de 43,3 MB no total (9,2 + 15,8 + 18,3). Não pedir _BR em 2016, 2020 ou 2024 (404), nem _BRASIL (não existe).

(c) Reescrever docs/fontes-de-dados.md:121, em main e no PR #4, com algo como: "Não há agregado nacional das UFs nem `_BRASIL` (404). Nos anos gerais existe `proposta_governo_{ano}_BR.zip`, só com os PDFs de presidente (13/13/14 em 2018/2022/2026)." Corrigir também "10 PDFs" em 2022_PI para 9, e "504 PDFs" em 2024 para "503 PDFs + leiame".

(d) No PR #3, docs/der-modulo-eduardo.md §PROPOSTA_GOVERNO:
- Listar a fonte BR.
- Fazer o parse com sufixo opcional, `^(\d{4})([A-Z]{2})(\d+)(?:_(\d+))?\.pdf$`, e usar nr_sequencial = 1 quando não houver sufixo. O sufixo não existe em nenhum PDF de 2016-2022, nem no PI nem no BR. Só aparece em 2024 e 2026.
- Tirar o cargo e a UF do JOIN com CANDIDATURA por sq_candidato, e não do nome do arquivo. O 'BR' do nome é só a unidade eleitoral.
- Registrar que em 2018 um presidente (SQ 280000625869) não tem proposta.
- **Verificação:** Refiz tudo de forma independente, com um script próprio em C:/Users/eduar/Downloads/rv/cet-q6pres/cd.py. Ele usa curl_cffi com impersonate=chrome, porque curl puro recebe 403 do CDN, e lê o diretório central dos zips remotos via Range, sem baixá-los.

(1) Os números dos zips remotos se reproduzem exatamente:
- proposta_governo_2018_BR.zip: 9.217.626 bytes, 13 PDFs + LEIAME.pdf (BR/2018BR280000601016.pdf ...).
- proposta_governo_2022_BR.zip: 15.771.758 bytes, 13 PDFs + leiame.
- proposta_governo_2026_BR.zip: 18.275.613 bytes, 14 PDFs + leiame.
- Os nomes _BRASIL dão HTTP 404 em 2018, 2022 e 2026. O _BR também dá 404 em 2016, 2020 e 2024 (eleições municipais).

(2) Script chk.py, com DuckDB sobre consulta_cand_{ano}_BRASIL.csv e DS_CARGO='PRESIDENTE':
- Presidentes: 2018 = 14 SQ distintos (16 linhas, CD_ELEICAO 295/296); 2022 = 13 SQ (544/545); 2026 = 14 SQ (6257). SG_UF='BR' em todos.
- Os SQs dos PDFs _BR casam 13/13, 13/13 e 14/14 com presidentes. Em 2018 fica 1 presidente sem PDF (280000625869).

(3) Arquivos locais: dados/raw/proposta_governo/{2016..2026} só tem proposta_governo_{ano}_PI.zip.
- 2018_PI: 10 PDFs, e os 10 SQs são GOVERNADOR.
- 2022_PI: 9 PDFs, todos de GOVERNADOR (o fontes-de-dados diz 10).
- 2026_PI: 12 PDFs; 11 casam com GOVERNADOR.

(4) Código e documentos: `git show origin/main:scripts/coleta_tse.py`, linhas 131-135, só monta a URL proposta_governo_{ano}_{UF}.zip com UF="PI". pr/2, pr/3 e pr/4 têm a mesma função sem mudança. docs/fontes-de-dados.md:121 diz, em main e nos 3 PRs: "Não existe agregado `_BR`: é por UF ou nada." Em pr/3, docs/der-modulo-eduardo.md:264 diz "Fonte: `proposta_governo_{ano}_PI.zip`". A lacuna é real.

(5) O que não se sustenta, e por isso o veredito é parcial:
- A premissa "a Q6 pede as propostas de prefeito, governador e presidente" não aparece em nenhum texto do repositório. Em pr/4, docs/dossie/secoes/perguntas.md:10 diz "Quais temas aparecem nas propostas de governo?". Em main, estrategia.md:105-107 diz "proposta de governo → nuvem de palavras" e escolhe explicitamente `proposta_governo_*_PI.zip`. O README define o escopo como "candidaturas eleitorais no Piauí". Não achei o enunciado original, então a exigência de presidente fica **não verificada**.
- A frase da linha 121 é enganosa, mas só em parte falsa. O _BR não é um agregado das UFs: traz só os 13-14 PDFs de presidente, nenhum governador. O que é falso é "é por UF ou nada".

(6) Achado lateral, que afeta a correção proposta para o PR #3: o padrão `{ano}{UF}{SQ}_{seq}.pdf` do PR #3 (linhas 266-268), que sustenta a PK `(sq_candidato, nr_sequencial)`, só vale de 2024 em diante.
- Contagem nos zips PI: 2016 = 561 PDFs, 0 com _seq; 2018 = 10, 0; 2020 = 527, 0; 2022 = 9, 0; 2024 = 503, 503; 2026 = 12, 12.
- No _BR, 2018 e 2022 não têm _seq; 2026 tem _01.
- O PR #3 também diz "504 PDFs" para 2024. São 503 PDFs + leiame.

(7) Impacto no DER: nenhum na estrutura. PROPOSTA_GOVERNO → CANDIDATURA por sq_candidato já cobre presidente, porque o SQ é único desde 2010. O que falta é coleta e documentação, mais a regra de parse do nome do arquivo.

### [media] `q3q7-populacao-01` — parcial

- **Arquivo:** scripts/coleta_ibge.py:38; PR #4 docs/der-davi.md:288 e docs/dossie/secoes/dicionario.md (MUNICIPIO_ANO)
- **Problema:** A estimativa de população (SIDRA 6579) é baixada com p/last, o que traz só 2026. Faltam 2024 para a Q3 e 2018, 2020 e 2024 para a Q7. O der-davi.md tira QT_POPULACAO_ESTIMADA da 6579 e manda associar à eleição o dado com ano_referencia <= ano_eleicao. Com só 2026 carregado, nenhuma eleição acha população, e o indicador 'eleitores / população' sai nulo.
- **Evidência:** O JSON local 6579_populacao_municipios.json tem 5.571 linhas, todas com D3N='2026' (sidra.py). O esquemas.md do PR #4 mostra 'D3N = Ano | 2026'. A API /api/v3/agregados/6579/periodos devolve 2001-2006, 2008, 2009, 2011-2021, 2024, 2025 e 2026, sem 2022 nem 2023. A 9606 tem 2010 e 2022. A soma das faixas da 9606 de 2022 dá o Censo: 203.080.756 no Brasil e 866.300 em Teresina.
- **Correção:** 1) Em `scripts/coleta_ibge.py:38`, trocar `p/last` por uma lista explícita, por exemplo `/t/6579/n6/all/v/9324/p/2016,2018,2020,2024,2026`. São 27.855 valores, abaixo do limite de 50.000. Testei 2016,2018,2020,2024 e voltou HTTP 200 com 5.571 municípios por ano. NÃO usar `p/all`: retorna HTTP 400 porque pede 122.562 valores. Se quiserem a série inteira, dividir em lotes de até 8 períodos (8 x 5.571 = 44.568 valores).

2) Para 2022, que não existe no 6579, usar a soma das 21 faixas do 9606 de 2022, que já está baixada: 203.080.756 no Brasil e 866.300 em Teresina, tratando '-' como 0. A alternativa é o total da 9514.

3) No DER (`docs/der-davi.md` e `docs/dossie/secoes/dicionario.md`):
- acrescentar em MUNICIPIO_ANO uma coluna de origem, por exemplo `fonte_populacao` = 'ESTIMATIVA_6579' | 'CENSO_2022_9606';
- unificar o nome da coluna (`qt_populacao_estimada` no der-davi e `qt_populacao` no dicionário);
- resolver a contradição interna entre a linha 379 ('mesmo ano') e as linhas 402-403 ('mais recente <= ano_eleicao'). Com o passo 1, as duas regras coincidem para 2016-2024. Sem 2022, a regra '<=' pegaria 2021.

4) Q7: não é preciso mudar nada no 6579. A Q7 usa o 9606 (Censo) e COMPARECIMENTO_PERFIL. Só tirar a Q7 da coluna 'Serve' do 6579 em `docs/fontes-de-dados.md:230`, ou esclarecer que ela entra apenas como denominador opcional.
- **Verificação:** O núcleo do achado se reproduz. Três pontos estão exagerados e a correção proposta tem um erro.

CONFIRMADO:
(1) `git show origin/main:scripts/coleta_ibge.py`, linha 38: `baixar_json(f"{SIDRA}/t/6579/n6/all/v/all/p/last", ...)`. A mesma linha está idêntica em origin/pr/2, pr/3 e pr/4.
(2) Li o JSON local `dados/raw/ibge/sidra/6579_populacao_municipios.json` com Python. São 5.572 elementos: 1 cabeçalho e 5.571 linhas de dado. Contagem de D3N: `Counter({'2026': 5571})`. Teresina (2211001) = 908.012 em 2026.
(3) O `docs/esquemas.md` do pr/4, nas linhas 2063-2064, mostra D3C = D3N = 2026.
(4) `docs/der-davi.md` do pr/4:
- linha 288: `QT_POPULACAO_ESTIMADA "SIDRA 6579"`;
- linha 379: 'eleitores / população ... numerador e denominador precisam representar o mesmo ano';
- linhas 402-403: 'associe à eleição o dado mais recente cujo ano_referencia <= ano_eleicao'.
O `docs/dossie/secoes/dicionario.md` do pr/4, linha 9, diz: `MUNICIPIO_ANO ... qt_populacao ... SIDRA 6579`.
(5) Consultei a API /api/v3/agregados/{t}/periodos via curl_cffi:
- 6579 = 2001-2006, 2008, 2009, 2011-2021, 2024, 2025, 2026 (sem 2007, 2010, 2022 e 2023);
- 9606 = 2010 e 2022;
- 9514 = 2022.
(6) Somei as 21 faixas do 9606 local (116.970 linhas, só 2022, 5.570 municípios; 1.314 células '-' contadas como 0). Deu 203.080.756 no Brasil e 866.300 em Teresina. Os números batem exatamente.
(7) Também consultei `/values/t/6579/n6/2211001/v/9324/p/2016,2018,2020,2024` com Accept: application/json. Voltou 847430 / 861442 / 868075 / 902644. A consulta com p/2022 volta vazia.
(8) Nenhum código em main, pr/2, pr/3 ou pr/4 carrega o 6579 além da coleta (git grep '6579'). Já o `docs/estrategia.md:24` do main previa `sidra_6579_2024.json`, e o `fontes-de-dados.md` (pr/4, linha 246) testou `p/2024`. Então o `p/last` é uma regressão: o plano era trazer 2024.

EXAGERADO OU ERRADO:
(a) Q7: o DER da Q7 (`docs/der-duda.md`, linhas 40-41, 143 e 170-172) usa CENSO_FAIXA_ETARIA (SIDRA 9606) e COMPARECIMENTO_PERFIL, não o 6579. O 6579 traz só a população total, sem idade, e por isso não serve para medir a parcela de jovens. A afirmação 'faltam 2018, 2020 e 2024 para a Q7' não se sustenta no DER. Só o `fontes-de-dados.md` (pr/4, linha 230) lista a Q7 como consumidora ('denominador').
(b) Q3: dizer 'faltam 2024 para a Q3' fica curto. Faltam todas as eleições de 2016 a 2024.
(c) 'Nenhuma eleição acha população' não vale para 2026. Existe o 2026 do 6579 e existe `dados/raw/eleitorado/2026/perfil_eleitorado_2026`, então eleitores/população de 2026 é calculável.
(d) A correção 'ou p/all' falha. `GET /values/t/6579/n6/all/v/9324/p/all` retorna HTTP 400: 'Quantidade de valores solicitados: 122562 excedeu o limite: 50000'. Já `p/2016,2018,2020,2024` retorna 200 com 22.284 valores (5.571 por ano).
(e) O PIB per capita não depende do 6579: o xlsx do FTP já traz o per capita (`fontes-de-dados.md`, pr/4, linhas 268-269). O impacto fica restrito ao indicador eleitores/população da Q3.

Severidade rebaixada para média: é uma linha de coleta, afeta um dos quatro índices da Q3, nenhum staging consome o dado hoje e o dado existe na API.

### [media] `q3-idhm-01` — confirmado

- **Arquivo:** scripts/coleta_pnud.py; PR #4 docs/der-davi.md:292-294 (entidade IDHM); PR #4 docs/dossie/secoes/fontes.md
- **Problema:** A Q3 cita o IDHM de forma explícita, e o der-davi.md tem a entidade IDHM (1991/2000/2010), mas nenhum script coleta IDHM municipal. O coleta_pnud.py baixa uma série só por Brasil e UF, como diz o próprio docstring, e nem essa série está em dados/raw. O Atlas Brasil, a única fonte municipal, não tem coletor.
- **Evidência:** 'ls dados/raw' lista abstencao, candidatos, eleitorado, extras, ibge, prestacao_contas, proposta_governo, resultados e territorio: não há pasta pnud. O docstring do coleta_pnud.py diz: 'A coluna AGREGACAO ... só assume BRASIL e UF'. O esquemas.md do PR #4 não tem seção PNUD. O fontes-de-dados.md, seção 4 (main), diz que o IDHM municipal existe só no Atlas Brasil, para 1991, 2000 e 2010.
- **Correção:** 1) Decidir no grupo se o IDHM fica no modelo.
- Se ficar: baixar à mão, no Atlas Brasil (atlasbrasil.org.br/consulta/planilha, recorte município), o IDHM e as 3 dimensões (renda, longevidade, educação) de 1991, 2000 e 2010. Salvar em dados/raw/pnud/atlas/ e registrar a URL, a data de acesso e os filtros usados no README e no fontes-de-dados.md. Não existe URL direta conhecida: a antiga rawData dá 404. Depois, acrescentar a seção correspondente no esquemas.md, rodando o inspecionar_esquemas.py.
- Se sair: remover a entidade IDHM do der-davi.md e do der.md e declarar na Q3 que o eixo rico/pobre usa PIB per capita (MUNICIPIO_ANO) mais renda domiciliar per capita (SIDRA 10295) e anos de estudo (SIDRA 10062) do Censo 2022. Esses dois já estão em dados/raw/ibge/sidra.
2) Nos dois casos, corrigir o docs/dossie/secoes/fontes.md do PR #4. Ele lista o PNUD/Atlas em "Dados obtidos", mas nada foi coletado. O texto deve dizer "não coletado; download manual pendente" ou a linha deve sair.
3) Alinhar os três DERs: der-davi.md (IDHM só com VL_IDHM), dossie/der.mmd (sem IDHM) e main docs/der.md (IDHM com 3 dimensões). No DER geral da Duda, a entidade só deve entrar se o passo 1 escolher manter o IDHM, e sempre com ANO_REFERENCIA em 1991, 2000 ou 2010.
4) Opcional: a série do coleta_pnud.py (só Brasil e UF, 2012-2024) nunca foi baixada no ambiente local. Rodar o script ou tirá-lo do "coletar tudo", já que ele não atende ao grão municipal da Q3.
- **Verificação:** Todas as afirmações factuais do achado se reproduziram, mas a severidade está alta demais e o achado omite contexto relevante.

Pontos confirmados:
(1) A Q3 pede IDHM explicitamente. Em `git show origin/pr/4:docs/der-davi.md`, a linha 245 traz "Quais os índices de dado município (PIB per capita, IDHM, ...". As linhas 292-296 definem a entidade IDHM {COD_IBGE PK FK, ANO_REFERENCIA PK "1991, 2000 ou 2010", VL_IDHM}.
(2) O docstring de `git show origin/main:scripts/coleta_pnud.py` diz: "este arquivo NÃO tem IDHM por município. A coluna `AGREGACAO` ... só assume `BRASIL` e `UF`". O arquivo é idêntico no PR #4 (diff vazio).
(3) `git grep -i "atlas|idhm|pnud"` em origin/main e em origin/pr/4 não acha nenhum script que acesse o atlasbrasil.org.br; o Atlas aparece só em docstrings e docs.
(4) `ls` em `.../ibge-electoral-datasets-daf825/dados/raw` lista abstencao, candidatos, eleitorado, extras, ibge, prestacao_contas, proposta_governo, resultados e territorio: não há pnud. `find -iname "*pnud*|*idhm*|*atlas*"` em `C:/Users/eduar/OneDrive/UFPI/bdr` e `C:/Users/eduar/Downloads/bdr` só acha `coleta_pnud.py`. Os `dados/raw` dos dois checkouts principais estão vazios.
(5) `git show origin/pr/4:docs/esquemas.md` tem 0 ocorrências de pnud ou idh. As seções vão de TSE a IBGE SIDRA, PIB e malha.
(6) `origin/main:docs/fontes-de-dados.md` §4 (linhas 348-367) confirma que só o Atlas tem IDHM municipal, e só para os Censos de 1991, 2000 e 2010.

Contexto que o achado omite:
(a) A lacuna já está documentada pelo próprio projeto: docstring do `coleta_pnud.py`, README:50 ("não tem município"), `fontes-de-dados.md` §4 e `estrategia.md:283-285`. O projeto já escolheu o PIB per capita como eixo principal, com o IDHM 2010 só como validação cruzada. Os substitutos do Censo 2022 foram coletados e estão em `dados/raw/ibge/sidra`: `10295_renda_domiciliar_municipios.json` (5,9 MB) e `10062_anos_estudo_municipios.json` (1,9 MB).
(b) Agravantes que o achado não viu. `origin/pr/4:docs/dossie/secoes/fontes.md:7` põe PNUD/Atlas Brasil na coluna "Dados obtidos" com "IDHM municipal histórico", ou seja, declara como obtido um dado que não foi coletado. Além disso, `origin/pr/4:docs/dossie/der.mmd` não tem entidade IDHM (grep -i idh sem resultado; só MUNICIPIO_ANO com vr_pib_per_capita), enquanto `der-davi.md` tem e `origin/main:docs/der.md:329-335` tem IDHM com as 3 dimensões. Os três DERs se contradizem.
(c) Acesso automatizado, testado só com HEAD via curl_cffi, sem baixar nada: `atlasbrasil.org.br/consulta/planilha` responde 200 text/html (página interativa), e a URL antiga `atlasbrasil.org.br/2013/data/rawData/atlas2013_dadosbrutos_pt.xlsx` responde 404. Continua sem verificação se existe um download direto automatizável.

Sobre a severidade: é um dado faltante para um indicador que a Q3 pede, mas é uma limitação conhecida e declarada, com substitutos já coletados. O DER modela a entidade corretamente, com ano_referencia; o que falta é carregar os dados. Nenhum número sai errado. Por isso a severidade vai para média.

### [media] `fin-local-pi-01` — confirmado

- **Arquivo:** dados/raw/prestacao_contas/{2014..2026}/
- **Problema:** O main diz que a prestação de contas é nacional (manter_uf=NACIONAL), mas no disco só há arquivos _PI.csv e _PI.txt. Os _BRASIL continuam dentro dos zips. Q1 e Q3 em escala nacional, e Q8 com os totais de 2014 (fato 8), ainda não têm dado extraído. Rodar o coletor com --force baixaria de novo ~4,5 GB de zips à toa.
- **Evidência:** find mostra, por exemplo, despesas_contratadas_candidatos_2024_PI.csv (51,2 MB) e nenhum _BRASIL. Os zips contêm despesas_contratadas_candidatos_{2018,2020,2022,2024}_BRASIL.csv com 1010, 2379, 1282 e 2560 MB, receitas_candidatos_2014_brasil.txt com 213 MB e receitas_candidatos_prestacao_contas_final_2016_brasil.txt com 1481 MB. Pela lógica de coleta_comum.baixar_zip, apagar a pasta extraída e rodar sem --force re-extrai a partir do zip já baixado.
- **Correção:** (a) Os zips só existem na worktree de dados (OneDrive/.claude/worktrees/ibge-electoral-datasets-daf825). Antes de tudo, trazer os scripts do main para ela, com `git merge origin/main` ou `git checkout origin/main -- scripts/`. Sem isso, `coleta_tse.py:113` continua com `manter_uf=UF` e a re-extração sai de novo só com o PI. Não rodar no clone de Downloads: lá não há zips e o coletor baixaria 4,9 GB outra vez.

(b) Apagar ou renomear só as pastas extraídas `prestacao_contas/<ano>/<nome>_<ano>/`, sem tocar nos `.zip`. Depois rodar `python scripts/coleta_tse.py prestacao_contas` sem `--force`.
- Isso grava cerca de 22,65 GB (21,1 GiB) dentro da pasta do OneDrive. Convém pausar a sincronização ou excluir a pasta dela.
- Se quiser manter os `_PI`, dá para extrair via `zipfile` só os membros `*_BRASIL.*` para as pastas que já existem.

(c) Aspas:
- Trocar `receitas_candidatos_2014_brasil.txt` por `receitas_2014_brasil_corrigido.txt`, do scratchpad.
- NÃO é preciso trocar o de 2016: o arquivo do scratchpad é idêntico ao do zip e já lê certo em modo estrito.
- Aplicar a mesma correção (dobrar as aspas internas) e validar com `read_csv` estrito, sem `ignore_errors`, em `receitas_comites_2014_brasil.txt`, `despesas_comites_2014_brasil.txt`, `receitas_partidos_prestacao_contas_final_2016_brasil.txt` e `despesas_candidatos_prestacao_contas_final_2016_brasil.txt`.
- Validar também os `_BRASIL` de 2018 a 2026, que não foram verificados.

(d) Avisar o Enrico: sem os `_PI`, os globs do staging dele deixam de achar arquivos (fato 10).
- **Verificação:** Tudo o que o achado afirma se reproduziu. A correção proposta, porém, tem dois erros e fica incompleta.

1) O main manda extrair o nacional. Em `git show origin/main:scripts/coleta_tse.py`, `coletar_prestacao_contas` chama `_coletar_tema(... manter_uf=NACIONAL)`, com `NACIONAL = "BRASIL"`.

2) No disco só há arquivos do PI. Rodei `find` em `dados/raw/prestacao_contas` da worktree de dados:
- 0 arquivos `*brasil*` e 50 `*_PI.*`;
- o resto são `_sup.txt`, PDFs e `fefc_*`;
- `despesas_contratadas_candidatos_2024_PI.csv` tem 53.724.953 B (51,2 MiB).

3) Os tamanhos dentro dos zips batem com o achado. Listei os membros com `zipfile`:

| Arquivo | Tamanho |
|---|---|
| `despesas_contratadas_candidatos_2018_BRASIL.csv` | 1009,6 MiB |
| `despesas_contratadas_candidatos_2020_BRASIL.csv` | 2378,8 MiB |
| `despesas_contratadas_candidatos_2022_BRASIL.csv` | 1281,7 MiB |
| `despesas_contratadas_candidatos_2024_BRASIL.csv` | 2560,3 MiB |
| `receitas_candidatos_2014_brasil.txt` | 213,3 MiB |
| `receitas_candidatos_prestacao_contas_final_2016_brasil.txt` | 1480,9 MiB |

- Os 15 zips somam 4,90 GB (4,56 GiB).
- Todo o `_BRASIL` descompactado dá 22,65 GB (21,09 GiB). O C: tem 80 GB livres, mas a pasta fica dentro do OneDrive.

4) A lógica de re-extração confere. Em `coleta_comum.baixar_zip` só se pula quando a pasta existe, o zip existe e não há `--force`. Já `baixar()` devolve o zip existente sem baixar quando não há `--force`. Então apagar a pasta e rodar sem `--force` re-extrai a partir do zip.

5) Primeiro erro da correção: rodar o comando no lugar certo não resolve.
- A worktree de dados (branch `claude/ibge-electoral-datasets-daf825`) está em 558c213 e não contém 839cdb4 (`git merge-base --is-ancestor` falhou).
- Nela, `scripts/coleta_tse.py:113` ainda tem `manter_uf=UF`. Rodar ali `python scripts/coleta_tse.py prestacao_contas` extrairia o PI de novo.
- O clone do main em `Downloads/bdr/analiseCandidatos` não tem `dados/raw/prestacao_contas`. Rodar lá baixaria os 4,9 GB do zero.

6) Segundo erro: o arquivo de 2016 no scratchpad NÃO está corrigido.
- Ele tem o mesmo md5 do membro do zip (52e5062d4ab96d05bf26feb9a7d07d49) e o mesmo tamanho (1.552.844.788 B).
- Ele nem precisa de correção: o `read_csv` estrito no DuckDB leu 3.004.707 linhas, que são as 3.004.708 linhas físicas menos o cabeçalho.
- O de 2014 corrigido está certo: md5 f621a9e9 contra f77acfe7 do original, com 8 bytes a mais (4 linhas com aspas dobradas).

7) A correção fica incompleta: outros quatro nacionais de 2014/2016 falham na leitura estrita pelo mesmo motivo (aspas sem escape). Extraí cada um, rodei `read_csv` estrito e conferi com um parser de linhas:
- `receitas_comites_2014_brasil.txt`: o DuckDB falha na detecção do formato; 2 linhas com aspas internas, por exemplo a linha 120, com `"PROTENDE" SISTEMAS E METODOS...`.
- `despesas_comites_2014_brasil.txt`: linha 36525, com `GARAGEM"SS"LTDA`.
- `receitas_partidos_prestacao_contas_final_2016_brasil.txt`: linha 113154, com `ELEIÇÕES 2016"DOMINGOS FABIO DOS SANTOS" VEREADOR`.
- `despesas_candidatos_prestacao_contas_final_2016_brasil.txt`: erro na linha 89448.

Os `_brasil` de `receitas_partidos_2014`, `despesas_candidatos_2014`, `despesas_partidos_2014` e `despesas_partidos_2016` leem certo (contagem estrita = linhas − 1). Os `_BRASIL` de 2018 a 2026 não foram verificados, por causa do volume.

### [media] `pr4-q3-eleitorado-01` — confirmado

- **Arquivo:** docs/der-davi.md:301 e :387 (ELEITORADO_MUNICIPIO)
- **Problema:** ELEITORADO_MUNICIPIO sai de SUM(QT_ELEITORES_PERFIL) do perfil_eleitorado, o que falha de dois jeitos. A coluna não existe em 2022 e 2024, os anos da Q3. E o perfil_eleitorado desses anos só está no PI, enquanto a Q3 é declarada para os 5.570 municípios. O QT_APTOS do detalhe_votacao, que é nacional, também não é igual ao eleitorado em eleição geral.
- **Evidência:** Cabeçalhos: 2016-2020 têm QT_ELEITORES_PERFIL e ANO_ELEICAO; 2022-2026 têm QT_ELEITORES e AA_ELEICAO. perfil_eleitorado_2022 e _2024 locais: 224 municípios, 1 UF. detalhe_votacao 2024 (prefeito, 1º turno, PI) = 2.698.764, igual ao perfil_eleitorado. Em 2022 (governador, PI) o detalhe dá 2.568.604 contra 2.573.810 do perfil (−5.206), e o de presidente dá 2.570.433, ou seja, o voto em trânsito mexe no QT_APTOS.
- **Correção:** Três ajustes no DER e na coleta.

(a) Em `der-davi.md`, ELEITORADO_MUNICIPIO:
- Trocar o comentário da linha 301 e o texto das linhas 386-387 por `SUM(COALESCE(QT_ELEITORES_PERFIL, QT_ELEITORES))` e `COALESCE(ANO_ELEICAO, AA_ELEICAO)`, lendo com `union_by_name=true`.
- Registrar que o layout muda em 2022: `QT_ELEITORES_PERFIL` vale para 2016–2020 e `QT_ELEITORES` para 2022–2026.

(b) Universo nacional. Os anos de 2016 a 2020 já são nacionais. Para 2022–2026, escolher uma de duas saídas:
- Trocar `coletar_eleitorado` para `manter_uf=NACIONAL` em `scripts/coleta_tse.py:107`. Isso extrai os `_BRASIL` de 912 MiB, 1.708 MiB e 2.072 MiB.
- Ou usar o `QT_APTOS` do `detalhe_votacao_munzona`, que já é nacional, com todos estes filtros:
  - `NR_TURNO = 1`;
  - um único cargo;
  - o `CD_ELEICAO` da eleição ordinária (220 em 2016, 426 em 2020, 619 em 2024). Sem esse filtro as suplementares inflam a soma: em 2016 dá 147.723.807 contra 144.088.912.

(c) Deixar claro no DER que o `QT_APTOS` só serve de eleitorado em eleição municipal, onde bate com o perfil: 224 de 224 municípios no PI em 2024 e 5.567 de 5.567 no país em 2020. Em eleição geral ele muda conforme o cargo. No PI em 2022 o perfil dá 2.573.810, Presidente dá 2.570.433 e Governador dá 2.568.604. Nesses anos, usar o perfil ou declarar a diferença.

Uma inconsistência separada no mesmo PR: `docs/dossie/secoes/dicionario.md:11` põe ELEITORADO_MUNICIPIO com PK (`cod_ibge`, `ano`, `cd_faixa_etaria`, ...), enquanto `der-davi.md` usa (`CD_MUNICIPIO`, `ANO_ELEICAO`). O grão e a chave divergem e precisam ser alinhados.
- **Verificação:** Reproduzi o achado de forma independente. As três partes se confirmam. Só um ponto do enquadramento está impreciso.

(1) O que o PR escreve. Em `git show origin/pr/4:docs/der-davi.md`, a linha 301 diz `BIGINT QT_ELEITORES "SUM QT_ELEITORES_PERFIL"` e as linhas 386-387 dizem que o total "vem de `SUM(QT_ELEITORES_PERFIL)` do `perfil_eleitorado`". Nenhum ano é ressalvado.

(2) A coluna não existe de 2022 em diante. Li o cabeçalho dos CSVs locais:
- 2016, 2018 e 2020 têm `ANO_ELEICAO` e `QT_ELEITORES_PERFIL`.
- 2022, 2024 e 2026 têm `AA_ELEICAO` e `QT_ELEITORES`, e o nome social aparece como `QT_ELEITORES_NOME_SOCIAL`.
- No DuckDB, `SUM(QT_ELEITORES_PERFIL)` sobre `perfil_eleitorado_2022_PI.csv` e `_2024_PI.csv` dá `BinderException: Referenced column "QT_ELEITORES_PERFIL" not found`.
- O próprio `docs/esquemas.md` do PR #4 separa o `perfil_eleitorado` em 2016–2020 e 2022–2026, com `AA_ELEICAO` no segundo bloco. O DER contradiz o inventário do mesmo PR.

(3) O universo fica só no PI de 2022 em diante.
- Em `origin/pr/4:scripts/coleta_tse.py:107` está `_coletar_tema("eleitorado", ELEITORADO, force, manter_uf=UF)`, com `UF = "PI"` na linha 19.
- Os arquivos locais confirmam: 2022 tem 129.566 linhas, 224 municípios, só a UF PI e soma 2.573.810; 2024 tem 253.638 linhas, 224 municípios, só PI e soma 2.698.764.
- Nos zips estão `perfil_eleitorado_2022_BRASIL.csv` (956.322.103 bytes, cerca de 912 MiB), `_2024_BRASIL.csv` (1.791.473.148 bytes, cerca de 1.708 MiB) e `_2026_BRASIL.csv` (2.172.782.281 bytes).
- Ao mesmo tempo, `estrategia.md:240-243` do PR declara para a Q3 que "o universo são os 5.570".

(4) O `QT_APTOS` e o eleitorado. Somei o `detalhe_votacao_munzona_BRASIL`, 1º turno, só PI:
- 2024, Prefeito: 2.698.764, igual ao perfil. Município a município, 224 de 224 são iguais.
- 2022, Governador (e também Senador e Deputados): 2.568.604 contra 2.573.810 do perfil, diferença de −5.206. São 213 municípios abaixo, 9 acima e 2 iguais.
- 2022, Presidente: 2.570.433.

Atribuir a diferença ao voto em trânsito é inferência, porque `ST_VOTO_EM_TRANSITO` = 'N' em todas as linhas do 1º turno de 2016 a 2024 e o arquivo não separa o trânsito. O padrão, porém, é compatível: Teresina fica em −754 para Governador e +244 para Presidente, ou seja, recebe eleitores de fora que votam só para presidente.

A imprecisão. O achado fala em "os anos da Q3 (2022 e 2024)". Pelo próprio PR (`estrategia.md:277-282`), a Q3 cobre 2016–2026. Em 2016, 2018 e 2020 o perfil é um arquivo nacional único, com 5.568 municípios em 2016 e 2020 e a coluna `QT_ELEITORES_PERFIL` presente, então a fórmula do DER funciona nesses anos. A falha atinge 2022, 2024 e 2026. Isso não reduz o problema, que continua valendo para os ciclos mais recentes.

Dois dados extras que afetam a correção proposta:
- Em 2016 (Prefeito, 1º turno), sem filtrar a eleição ordinária, a soma do `QT_APTOS` dá 147.723,807... corrigindo: dá 147.723.807. Com `CD_ELEICAO` = 220 dá 144.088.912, igual ao perfil nacional. As eleições suplementares incham a conta.
- Em 2020, com `CD_ELEICAO` = 426, 5.567 de 5.567 municípios batem com o perfil. Em 2016, com `CD_ELEICAO` = 220, o total bate, mas só 5.004 de 5.568 municípios são iguais.

Scripts em `C:/Users/eduar/Downloads/rv/cetico-eleit/m1.py` a `m5.py`.

### [media] `q8-orgaos-partidarios-01` — confirmado

- **Arquivo:** docs/der-duda.md (RECEITA_CAMPANHA só de candidato); prestacao_contas_final_2014.zip; PR #4 docs/esquemas.md
- **Problema:** A Q8 modela só a receita de candidatos. Em 2014, a maior parte do dinheiro de empresa entrou em partidos e comitês, arquivos que nenhum DER nem o staging do PR #2 leem. Além disso, o receitas_comites_2014_brasil.txt tem aspas sem escape, falha na leitura estrita do DuckDB e por isso ficou fora do esquemas.md do PR #4 (o despesas_comites de 2014 está lá).
- **Evidência:** part14.py leu com o módulo csv, 0 linhas ruins. receitas_partidos_2014_brasil.txt: 12.247 linhas, R$ 1.961,7 mi no total, dos quais R$ 1.342,0 mi de CNPJ com CNAE diferente de 9492. receitas_comites_2014_brasil.txt: 9.173 linhas, R$ 738,4 mi, dos quais R$ 405,5 mi de empresa. O DuckDB estrito dá 'Error when sniffing file'. As linhas problemáticas são a 120 (;""PROTENDE" SISTEMAS...) e a 4.862 (;""PROACQUA" CONTRUCOES...). Com strict_mode=false ele lê 9.173 de 9.173. O esquemas.md do PR #4 tem bloco para despesas_comites (2014) e nenhum para receitas_comites.
- **Correção:** 1) No DER da Q8, criar RECEITA_ORGAO_PARTIDARIO para 2014 (receitas_partidos + receitas_comites) e 2016 (receitas_partidos).
- Colunas: tp_orgao (DIRETORIO/COMITE), sq_orgao (Sequencial Diretorio/Comite), uf, FK para PARTIDO e FKs de doador direto e de doador originário para AGENTE_FINANCEIRO.
- Nos arquivos de 2014 o partido que recebe só vem pela sigla. A FK para PARTIDO(ano, nr_partido) sai de um lookup (ano, sg_partido), feito com consulta_cand do mesmo ano.

2) Regra contra dupla contagem. Escolher UMA das duas e documentar.
- (a) Contar o dinheiro de empresa no ponto de entrada: doação direta a candidato + doação direta a partido/comitê ('Recursos de pessoas jurídicas' com CNAE diferente de 9492). Nessa opção, NÃO somar a receita de candidato cujo originário é empresa. Dá cerca de R$ 3,06 bi em 2014, atribuídos ao partido que recebeu.
- (b) Seguir o dinheiro até onde termina: doação direta a candidato + receita de candidato com originário empresa + só o gasto direto dos órgãos (despesas_comites/partidos menos o tipo "Doações financeiras a outros candidatos/comitês/partidos"). Essa opção exige também as tabelas de despesa dos órgãos.
- Em qualquer das duas, a regra atual do der-duda (direta + originário) precisa excluir os repasses entre candidatos com originário empresa, senão conta duas vezes. Essa parte não foi verificada.

3) Corrigir as aspas antes de ler, e não só no receitas_comites_2014 (linhas 120 e 4862). Também:
- despesas_comites_2014_brasil.txt (linha 36525; com ignore_errors perde 7.770 de 54.970 linhas);
- receitas_partidos_prestacao_contas_final_2016_brasil.txt (linha 113154; perde 1.790 de 140.496 linhas).
Depois rodar o inspetor com --contar e comparar com a contagem do módulo csv, para pegar perdas silenciosas.

4) Registrar no DER que em 2016 os partidos recebem só R$ 3,0 mi de CNPJ não partidário. Entram por completude, mas não mudam a resposta da Q8.
- **Verificação:** Refiz tudo por conta própria em C:/Users/eduar/Downloads/rv/cq8b/. Extraí os arquivos de dados/raw/prestacao_contas/2014/prestacao_contas_final_2014.zip e de 2016/prestacao_contas_final_2016.zip. Uso Python 3.12, módulo csv e DuckDB 1.5.5.

1) Números do achado. Todos se reproduzem, e o módulo csv não acha nenhuma linha ruim.
- receitas_partidos_2014_brasil.txt: 12.247 linhas, R$ 1.961,68 mi no total. Desse total, R$ 1.341,97 mi vêm de CNPJ com CNAE diferente de 9492, R$ 581,5 mi de CNAE 9492 e R$ 38,0 mi de pessoa física.
- receitas_comites_2014_brasil.txt: 9.173 linhas, R$ 738,36 mi no total, dos quais R$ 405,48 mi são de empresa.
- A doação direta de empresa a candidato é de R$ 1,31 bi (fato 8). Na entrada, então, partidos e comitês recebem R$ 1.747,4 mi de empresa, 57% do total. A frase "a maior parte" se sustenta.

2) Aspas. As linhas 120 (;""PROTENDE" SISTEMAS...) e 4862 (;""PROACQUA" CONTRUCOES...) conferem.
- DuckDB estrito (delim ';', quote '"', cp1252): "Error when sniffing file".
- Com strict_mode=false: 9.173 linhas.
- Com as opções exatas do scripts/inspecionar_esquemas.py do PR #4 (CSV_OPTS inclui ignore_errors=true), o DESCRIBE também falha. Por isso ler_cabecalho devolve () e a família some do documento.
- O script dfix.py dobra as aspas internas nas 2 linhas. Depois disso o DuckDB estrito lê 9.173 linhas e R$ 738,36 mi.
- Detalhe: a falha não é da "leitura estrita". É do sniffer, mesmo com ignore_errors=true.

3) esquemas.md do PR #4 (git show origin/pr/4:docs/esquemas.md).
- Tem os blocos despesas_comites (2014, linha 896), despesas_partidos, receitas_candidatos e receitas_partidos (linha 999).
- Não há nenhum bloco receitas_comites. O grep por "comite" só acha despesas_comites e uma descrição de receita.

4) Nenhum DER nem o staging lê receita de órgão partidário.
- der-duda.md (working copy): RECEITA_CAMPANHA tem FK só para CANDIDATURA, e as fontes (linhas 273-274) são só receitas_candidatos.
- der-davi.md, der.md, dicionario-dados.md e dossie/der.mmd do PR #4: RECEITA_CAMPANHA só pela relação "CANDIDATURA arrecada".
- der-modulo-eduardo.md do PR #3: nenhuma receita.
- sql/01_staging.sql do PR #2: stg_receita lê só receitas_candidatos_* (linhas 61, 62 e 70).
- O git grep por receitas_partidos/receitas_comites nos refs pr/2, pr/3, pr/4 e main não acha nada fora de leiames e da coleta.

5) Impacto real na Q8. O problema existe, mas é menor do que "a maior parte" sugere.
- Partido em 2014 funciona como repasse: despesas_partidos_2014 soma R$ 1.961,6 mi, dos quais R$ 1.771,1 mi (90%) são "Doações financeiras a outros candidatos/comitês/partidos".
- No arquivo de candidatos corrigido, a receita com doador originário tipo J e setor diferente de organização política soma R$ 1.789,8 mi: R$ 1.170,6 mi via partido e R$ 658,0 mi via outros candidatos/comitês. Esse dinheiro o der-duda já captura pela FK de doador originário.
- O que realmente falta é o gasto direto dos órgãos:
  - Comitês: R$ 804,6 mi de despesa, dos quais só R$ 191,8 mi foram repasses. Cerca de R$ 612,8 mi foram gastos direto (rádio/TV R$ 164,1 mi, impressos R$ 112,8 mi etc.).
  - Partidos: cerca de R$ 190 mi gastos direto.
- Estimativa proporcional, não rastreável porque dinheiro é fungível: uns R$ 0,34 bi de empresa via comitês mais R$ 0,13 bi via partidos, perto de R$ 0,47 bi, uns 15% do dinheiro de empresa de 2014. A lacuna é real e severidade média está adequada.

6) Problemas que o achado não viu.
- despesas_comites_2014_brasil.txt, o que está no esquemas.md, também tem aspas sem escape na linha 36525 ("ABASTECEDORA E GARAGEM"SS"LTDA"). O modo estrito falha; com ignore_errors o DuckDB lê 47.200 de 54.970 linhas (o csv lê 54.970, 0 ruins). São 7.770 linhas perdidas em silêncio que o inspetor não percebe, porque sem --contar só faz DESCRIBE + LIMIT 1.
- receitas_partidos_prestacao_contas_final_2016_brasil.txt falha no estrito na linha 113154 (;"ELEIÇÕES 2016"DOMINGOS FABIO..."). Com ignore_errors lê 138.706 de 140.496 linhas.
- Em 2016 os partidos recebem R$ 520,3 mi e só R$ 3,03 mi vêm de CNPJ com CNAE diferente de 9492. Incluir partidos de 2016 na Q8 quase não muda o resultado.
- Nos arquivos de órgão de 2014, o partido que recebe só vem por "Sigla  Partido": 32 siglas em partidos, 31 em comitês, sem número.

Não verificado: quanto dos R$ 658 mi "de outros candidatos/comitês" com originário empresa são repasses de candidato para candidato. A coluna "Número candidato doador" aparece preenchida até em receita de partido, então não serve para separar.

### [media] `q6-pdf-sem-texto-01` — parcial

- **Arquivo:** docs/der-modulo-eduardo.md:420 ('Falta medir: taxa de PDFs escaneados'); docs/fontes-de-dados.md (main, seção 1.4)
- **Problema:** Uma parte relevante das propostas de prefeito não tem camada de texto e sumiria da nuvem de palavras. O fontes-de-dados.md diz que os PDFs não são imagem 'na maioria', e em 2016 um quarto deles não tem texto. A cobertura de prefeitos também é incompleta.
- **Evidência:** pdfh.py usa uma heurística: PDF sem recurso /Font e sem operadores Tj/TJ, nem nos streams descompactados, é tratado como imagem. Resultado: 2016 com 138 de 561 (24,6%), 2020 com 51 de 527 (9,7%), 2024 com 23 de 503 (4,6%); governador 0 de 31. Cobertura (prop.py): os PDFs cobrem 533, 524 e 492 SQs de PREFEITO em 2016, 2020 e 2024, contra 569, 617 e 496 SQs distintos de prefeito no PI em consulta_cand, contados sem filtrar a situação da candidatura. Em 2016 há ainda 2 PDFs de VICE-PREFEITO e 1 de VEREADOR.
- **Correção:** 1) No PR #3, trocar o bloco "Falta medir" (linhas 420-426) pela medição feita com extração real (pdftotext), e não pela heurística /Font. PDFs sem texto: 2016 com 154/561 (27,5%), 2020 com 71/527 (13,5%), 2024 com 41/503 (8,2%); governador 0/31. Declarar também a perda por candidato a prefeito na eleição ordinária, contando só os APTO: 2016 fica com 371 de 543 com texto (68,3%), 2020 com 448 de 572 (78,3%) e 2024 com 454 de 496 (91,5%). Se 2016 entrar na Q6, decidir entre OCR e excluir o ano.

2) Redefinir o atributo derivado: fl_texto_extraido = (número de caracteres que não são espaço) > 50, e não qt_caracteres > 0, porque PDFs do Word e do iLovePDF devolvem só espaços. O qt_caracteres deve contar sem os espaços.

3) Na carga de PROPOSTA_GOVERNO:
   a) Fazer join com CANDIDATURA e manter só PREFEITO, GOVERNADOR e PRESIDENTE. São 3 PDFs descartados em 2016 (2 de vice e 1 de vereador) e 3 em 2020 (2 de vice e 1 de vereador).
   b) Descartar e registrar a contagem dos PDFs órfãos, cujo SQ não existe em consulta_cand: 25 em 2016, 5 em 2024 e 1 em 2026. Sem isso a FK para CANDIDATURA falha.
   c) Usar nr_sequencial = 1 quando o nome não tiver _seq (todos os arquivos de 2016 a 2022).

4) Corrigir a linha 264 do PR #3 ("Só 2024 tem 504 PDFs") com a contagem por ano: 2016 com 561, 2018 com 10, 2020 com 527, 2022 com 9, 2024 com 503 e 2026 com 12 (sem LEIAME). Corrigir também o "na maioria" de docs/fontes-de-dados.md, seção 1.4, com esses números.
- **Verificação:** O achado procede no mérito, mas os números estão subestimados e faltam pontos.

1) Onde está o texto. O trecho "Falta medir: taxa de PDFs escaneados na Q6" fica em origin/pr/3:docs/der-modulo-eduardo.md, linhas 420-426. Em origin/main:docs/fontes-de-dados.md, nas linhas 123-124, está escrito "o conteúdo é PDF de verdade, não imagem, na maioria". Confirmado.

2) A heurística do revisor se reproduz. Rodei C:/Users/eduar/Downloads/rv/df/pdfh.py (critério: tem /Font ou Tj, logo tem texto) e o resultado foi o mesmo: 138/561, 51/527 e 23/503.

3) Medi de forma independente com extração real. Usei pdftotext 4.00 em todos os PDFs, sem os LEIAME, e contei os caracteres que não são espaço (scripts em C:/Users/eduar/Downloads/rv/cetq6/ext.py e an.py). Vazio aqui quer dizer 50 caracteres ou menos:
- 2016: 154/561 (27,5%)
- 2020: 71/527 (13,5%)
- 2024: 41/503 (8,2%); com menos de 200 caracteres são 44 (8,7%)
- Governador (2018, 2022 e 2026): 0/31. Esse número confere.

Cruzando os dois métodos (cross.py): todo PDF que a heurística marca como "sem fonte" também sai vazio no pdftotext. Mas há mais 16 (2016), 20 (2020) e 18 (2024) PDFs que têm /Font ou Tj e mesmo assim não têm texto. Em insp.py, o número de imagens é igual ou maior que o de páginas: são páginas escaneadas, geradas pelo iLovePDF ou por um Word que embute as imagens. Em tj.py, o 2016PI180000001755.pdf tem 288 operadores TJ, e todos são "[( )] TJ", ou seja, só espaços. Portanto a heurística do revisor subconta a perda: 24,6/9,7/4,6% viram, na verdade, 27,5/13,5/8,2%.

4) A cobertura se reproduz (cov.py; o CSV foi relido em Python com cp1252 e errors=replace, porque o read_csv estrito com cp1252 do prop.py falha no 2016_BRASIL, na linha 379610, com um byte inválido). PDFs casados com PREFEITO: 533, 524 e 492. SQs distintos de prefeito no PI: 569, 617 e 496. Os 2 VICE-PREFEITO e o 1 VEREADOR de 2016 conferem, mas o revisor não viu que 2020 tem o mesmo caso: 2 VICE-PREFEITO e 1 VEREADOR.

Por candidato, só na eleição ordinária de prefeito (colunas: total / com PDF / com texto):
- 2016: 565 / 529 / 386 (68,3%); só APTO: 543 / 508 / 371 (68,3%)
- 2020: 608 / 517 / 448 (73,7%); só APTO: 572 / 517 / 448 (78,3%)
- 2024: 496 / 492 / 454 (91,5%)

5) O que faltou no achado:
- PDFs órfãos: há 25 PDFs em 2016, 5 em 2024 e 1 em 2026 cujo SQ não existe em consulta_cand, nem no PI nem no arquivo BRASIL inteiro (unm.py). Exemplos: 180000000818 (2016) e 180001985797 (2024). Isso quebra a FK PROPOSTA_GOVERNO.sq_candidato → CANDIDATURA.
- Nome do arquivo sem sequencial: de 2016 a 2022 os nomes não têm "_seq" (exemplo: 2016PI180000000504.pdf; 561+10+527+9 arquivos). O sequencial só aparece em 2024 e 2026 (2024: 497 com _01 e 6 com _02). Então nr_sequencial, "o _01 do nome do arquivo" (PR #3, linha 137), não existe antes de 2024.
- A definição fl_texto_extraido = qt_caracteres > 0 (PR #3, linha 371) classificaria como "com texto" os PDFs cujo texto é só espaço.

A severidade continua média.

### [media] `pr4-q1-geral-01` — confirmado

- **Arquivo:** docs/der-davi.md (Q1)
- **Problema:** A Q1 pede 2018 a 2024, mas o modelo da Q1 cobre só eleições municipais: a disputa é eleição × município × cargo. Assim, 2018 e 2022 ficam sem resposta, embora os dados existam. As vagas de 2018 e 2022 são por UF (SG_UE = UF ou BR), e a despesa de eleição geral também é por UF.
- **Evidência:** O próprio der-davi.md diz: 'O modelo acima cobre eleições municipais ... Para comparar cargos estaduais/federais seria necessária uma entidade mais geral UNIDADE_ELEITORAL'. consulta_vagas 2018 tem 197 linhas e 2022 tem 193, com 28 SG_UE (27 UFs + BR) e cargos Governador, Senador, Dep. Federal e Estadual, Presidente (vag.py).
- **Correção:** Corrigir no DER geral (der.mmd e dicionário), não só em der-davi.md.

Opção A (recomendada). Criar UNIDADE_ELEITORAL com os campos sg_ue VARCHAR(5) PK, tp_ue ('MUNICIPIO'/'UF'/'BR'), sg_uf e cod_ibge FK opcional para MUNICIPIO, preenchido só quando tp_ue = 'MUNICIPIO'. Não há colisão de chave: código de município é numérico e UF/BR é alfabético. A partir daí:
- VAGA passa a ter PK (id_eleicao, cod_cargo, sg_ue).
- CANDIDATURA ganha sg_ue FK NOT NULL e mantém cod_ibge opcional, como já está na Q3.
- A disputa da Q1 vira eleição × unidade eleitoral × cargo.
- A despesa entra pela candidatura. O join com VAGA usa (CD_ELEICAO, SG_UE, CD_CARGO), o que também separa as suplementares, porque o CD_ELEICAO é diferente.

Opção B. Restringir explicitamente a Q1 às eleições municipais (2016 opcional, 2020 e 2024) e escrever isso na pergunta e no DER.

Em qualquer das duas opções, é preciso remover cod_ibge da PK de VAGA em der.mmd e em secoes/dicionario.md, porque ele é nulo em eleição geral e não pode compor a PK. Também convém alinhar a cardinalidade MUNICIPIO–CANDIDATURA da Q1 com a da Q3, que é opcional.
- **Verificação:** Tentei refutar e não consegui. O núcleo do achado se reproduz. Há só uma imprecisão na premissa.

1) Leitura do arquivo (git show origin/pr/4:docs/der-davi.md). Na Q1, a disputa é "eleição × município × cargo". CANDIDATURA tem `CD_MUNICIPIO FK`, ligada por `MUNICIPIO ||--o{ CANDIDATURA`, ou seja, município obrigatório. VAGA tem PK `(CD_ELEICAO, CD_MUNICIPIO, CD_CARGO)`. O próprio texto admite a lacuna: "O modelo acima cobre eleições **municipais** ... seria necessária uma entidade mais geral `UNIDADE_ELEITORAL`". A lacuna está documentada, mas não foi resolvida. Na Q3 do mesmo arquivo, a CANDIDATURA já usa `MUNICIPIO o|--o{ CANDIDATURA` com a nota "NULL em eleicao geral". As duas questões do arquivo ficam inconsistentes entre si.

2) O problema também está no DER consolidado do PR, não só em der-davi.md. docs/dossie/der.mmd (linhas 131-136) e docs/dossie/secoes/dicionario.md (linha 22) definem `VAGA {id_eleicao PK, cod_cargo PK, cod_ibge PK}`. O dicionario-dados.md diz que cod_ibge é "Nulo em cargo estadual/federal". Uma coluna de PK não aceita NULL, então as vagas de 2018 e 2022 não cabem em VAGA de jeito nenhum.

3) Vagas (script C:/Users/eduar/Downloads/rv/cetico-q1/vag.py, DuckDB em modo estrito, sem ignore_errors):
- consulta_vagas_2018_BRASIL: 197 linhas, 28 SG_UE (27 UFs + BR), 4 CD_ELEICAO. Cargos: Presidente 1, Governador 27, Senador 56 vagas, Dep. Federal 513, Dep. Estadual 1.035, Distrital 24, além de suplentes.
- consulta_vagas_2022_BRASIL: 193 linhas, 28 SG_UE, 3 CD_ELEICAO. Dep. Federal 513, Estadual 1.035, Governador 28 (inclui uma suplementar de 2026).
- Para comparar: em 2020 são 16.955 linhas e 5.568 SG_UE; em 2024, 16.795 linhas e 5.569 SG_UE.
Os números do revisor (197, 193, 28) batem exatamente.

4) Candidatos (cand.py): consulta_cand 2018 tem 29.287 linhas, 28 SG_UE e 0 linhas com SG_UE numérico. Em 2022 são 29.322 linhas, 28 SG_UE e 0 numéricos. Nenhuma candidatura desses anos teria CD_MUNICIPIO para preencher a FK obrigatória.

5) Despesas (desp.py, extração local só do PI): despesas_contratadas_candidatos_2018_PI.csv tem SG_UE = 'PI' em 100% das linhas (Dep. Estadual R$20,04 mi, Federal R$25,85 mi, Governador R$7,07 mi, Senador R$7,32 mi). O arquivo de 2022 também tem só SG_UE = 'PI' (Federal R$62,57 mi etc.). A despesa de eleição geral é por UF, como o achado afirma. O dado existe para calcular custo por cadeira nesse grão, mas o modelo não o comporta.

Ressalva na premissa: o texto da Q1 não pede "2018 a 2024". O perguntas.md diz "comparando território, cargo e eleição". O recorte 2018–2024 vem da decisão ② do estrategia.md: "2018, 2020, 2022, 2024 — base obrigatória. Cobre 10 das 12 perguntas". O mesmo estrategia.md (seção ①) já registra que "em 2018/2022/2026 o grão do gasto é a UF". Isso não muda a conclusão, porque a Q1 fica sem 2018 e 2022 dentro do recorte base do próprio grupo. Severidade média mantida: é um defeito de modelagem que afeta o DER geral entregue em 24/09. Não há dado errado.

### [baixa] `q7-recorte-pi-01` — parcial

- **Arquivo:** scripts/coleta_tse.py (coletar_abstencao e coletar_eleitorado, manter_uf=UF); docs/der-duda.md (COMPARECIMENTO_PERFIL, CENSO_FAIXA_ETARIA)
- **Problema:** Para a Q7, o comparecimento por faixa etária existe só no PI, de 2016 a 2024, e o perfil_eleitorado de 2022 e 2024 também só no PI, enquanto a votação é nacional. A sub-pergunta 'município mais jovem vota em que espectro' fica restrita a 224 municípios. A estrutura etária da população por município só existe para o Censo 2022 (e 2010): 2018, 2020 e 2024 não têm dado próprio.
- **Evidência:** Em dados/raw/abstencao/*/ só existe perfil_comparecimento_abstencao_{ano}_PI.csv. Os zips têm os _BRASIL: 2016 com 1.249 MB, 2018 com 2.252, 2020 com 1.250, 2022 com 2.363 e 2024 com 2.446. perfil_eleitorado de 2022 e 2024 tem 224 municípios e 1 UF (apt.py). A 9606 foi coletada com p/last, que só traz 2022. Os períodos da API da 9606 são 2010 e 2022.
- **Correção:** 1) Em docs/der-duda.md, na seção da Q7 ou no dicionário, declarar a cobertura de cada sub-pergunta:
- sub-perguntas 2 e 3 (COMPARECIMENTO_PERFIL): só PI, 224 municípios, 2016-2024, conforme o "Recorte por UF" do README;
- sub-pergunta 1 (CANDIDATURA) e CENSO_FAIXA_ETARIA: nacionais;
- CENSO_FAIXA_ETARIA: só o Censo 2022, usado como retrato fixo para todas as eleições de 2018 a 2024.
Ao cruzar com COMPARECIMENTO_PERFIL, filtrar VOTACAO_CANDIDATO_MUNICIPIO para sg_uf='PI', para não misturar a votação nacional com o eleitorado do PI.

2) Registrar a inconsistência de carga: o perfil_eleitorado de 2016 a 2020 foi extraído nacional (zip sem divisão por UF) e o de 2022 a 2024 só do PI. Se alguém usar o perfil_eleitorado para a Q7, a série muda de cobertura no meio.

3) Se o grupo quiser a Q7 nacional, não extrair os _BRASIL do comparecimento, que somam 10,0 GB (9,3 GiB). Duas opções:
(a) agregar direto do zip, em streaming, para (município, ano, turno, faixa, gênero) e gravar só o agregado;
(b) para a sub-pergunta 2, extrair apenas perfil_eleitorado_{2022,2024}_BRASIL (0,96 + 1,79 GB), já que 2016-2020 estão nacionais, e manter a abstenção (sub-pergunta 3) só no PI.

4) Opcional: em scripts/coleta_ibge.py:75, trocar p/last por p/2010,2022 para ter dois retratos da população.
- **Verificação:** Todos os fatos do achado se reproduziram. O exagero está no enquadramento como "lacuna de dado".

CONFIRMADO:
(1) Em git show origin/main:scripts/coleta_tse.py, a linha 107 tem coletar_eleitorado com manter_uf=UF e a linha 128 tem coletar_abstencao com manter_uf=UF, com UF="PI" na linha 19. Nenhum PR muda isso: pr/2, pr/3 e pr/4 têm as mesmas linhas.
(2) Em dados/raw/abstencao/{2016..2024}/ só existe perfil_comparecimento_abstencao_{ano}_PI.csv. No DuckDB (script em C:/Users/eduar/Downloads/rv/cetico-q7/a.py) cada arquivo dá 1 SG_UF e 224 CD_MUNICIPIO (120.048 a 259.844 linhas).
(3) Os zips têm _BRASIL de 1.310, 2.362, 1.311, 2.478 e 2.565 MB (10^6), medidos com zipfile.file_size. Os números do achado (1.249, 2.252, 1.250, 2.363, 2.446) estão em MiB. O total é 10,0 GB, ou 9,34 GiB, e não "~9,5 GB".
(4) perfil_eleitorado_2022_PI.csv e perfil_eleitorado_2024_PI.csv: 1 UF e 224 municípios cada.
(5) A consulta https://servicodados.ibge.gov.br/api/v3/agregados/9606/periodos retorna apenas 2010 e 2022. coleta_ibge.py:75 usa p/last. O arquivo 9606_populacao_idade_municipios.json tem 116.970 linhas, todas de 2022, com 5.570 municípios e 27 UFs.
(6) Votação: votacao_candidato_munzona_{2016..2026}_BRASIL.csv, nacional.
(7) docs/der-duda.md (working copy) não diz em lugar nenhum que a Q7 cobre só o PI. As linhas 164-166 cruzam COMPARECIMENTO_PERFIL com VOTACAO_CANDIDATO_MUNICIPIO, que é nacional.

O QUE O ACHADO EXAGERA OU OMITE:
(a) O recorte só PI é decisão documentada, não descuido. O README do origin/main diz na linha 3 "Análise de candidaturas eleitorais no Piauí". A tabela "Recorte por UF" (linhas 62-69) diz: "`prestacao_contas`, `eleitorado`, `abstencao` | só PI". O problema real é o DER não declarar o recorte e misturar a votação nacional com o comparecimento do PI.
(b) O achado omite que o perfil_eleitorado de 2016, 2018 e 2020 está NACIONAL no disco. Nesses anos o zip não é dividido por UF e é extraído inteiro: perfil_eleitorado_2016.csv com 26 UFs e 5.568 municípios, 2018 com 28 UFs e 5.741, 2020 com 26 UFs e 5.568. Para 2022 e 2024 só há o PI. Na janela 2018-2024 da Q7 a cobertura muda no meio da série, e esse é um risco a mais que o achado não viu.
(c) A frase "2018, 2020 e 2024 não têm dado próprio" vale só para a população do IBGE. A estrutura etária do eleitorado existe em toda eleição (QT_APTOS por CD_FAIXA_ETARIA), e o DER já a usa como retrato principal. O Censo entra como segundo retrato (der-duda.md, linhas 170-172). A rota pelo Censo (CENSO_FAIXA_ETARIA) é nacional, com 5.570 municípios, mas só tem 2022.
(d) A sub-pergunta 2 continua respondível no PI, com 224 municípios. A estrutura do DER não muda: é só uma questão de carga e de documentação.

Por isso rebaixo a severidade de media para baixa.

### [baixa] `q8-anos-antigos-01` — parcial

- **Arquivo:** scripts/coleta_tse.py (ANOS_PRESTACAO); PR #4 docs/estrategia.md:127 e :438
- **Problema:** A Q8 pede 'até 2016'. O estrategia.md descreve a Q8 como 'doação empresarial, 2002–2014' e propõe 'analisar 2002–2014 como o período com doação PJ'. Só que só 2014 e 2016 são coletados: ANOS_PRESTACAO = [2014, *ANOS]. Os anos de 2002 a 2012 existem no CDN.
- **Evidência:** cdn.py e cdn2.py (HEAD e Range de 1 byte, sem baixar): prestacao_contas_2002.zip tem 13.925.110 bytes, _2004 tem 68.980.525, _2006 tem 32.925.482, _2008 tem 154.761.414, _2010 tem 110.243.477 e prestacao_final_2012.zip tem 671.229.467, todos com HTTP 200/206. Não verifiquei se esses leiautes têm CNAE ou doador originário, porque isso exige baixar os zips.
- **Correção:** Corrigir só o texto do docs/estrategia.md (no PR #4 e no main), alinhando com a decisão ② (PR4:332-336), o código (ANOS_PRESTACAO = [2014, *ANOS]) e o docs/der-duda.md:
- Linha 127: trocar "doação empresarial, 2002–2014" por "doação empresarial em 2014 (último ano com PJ) × 2016 (marco zero)".
- Linha 146: trocar "O período real é 2002–2014" por "O período com PJ nos dados coletados é 2014; 2016 é o marco zero".
- Linhas 437-438: trocar "Os dados de PJ de verdade estão em 2002–2014... analisar 2002–2014" por "A doação de PJ vai até 2014. O projeto analisa 2014 contra 2016 (decisão ②). 2002–2012 existem no CDN mas ficaram fora, porque cada leiaute antigo exige um mapeamento de staging próprio."

Não recomendo pôr 2002-2012 em PRESTACAO_CONTAS_POR_ANO agora. Isso contraria a decisão ② e custa mais uma geração de leiaute no staging, que ainda nem lê 2014 e 2016 com a extração nacional (fato 10). A premissa de que esses leiautes têm CNAE ou doador originário também não foi verificada. Se o grupo quiser a série longa, vira uma decisão nova e registrada, e não um conserto deste achado.
- **Verificação:** Os fatos do achado se reproduzem. O que não se sustenta é a leitura de que falta coletar dados: é texto desatualizado no estrategia.md.

1) Código. `git show origin/main:scripts/coleta_tse.py` (igual em origin/pr/4):
- linha 18: `ANOS = [2016, 2018, 2020, 2022, 2024, 2026]`
- linha 31: `ANOS_PRESTACAO = [2014, *ANOS]`
- linhas 64-67: PRESTACAO_CONTAS_POR_ANO só tem 2014 e 2016.

No disco local, dados/raw/prestacao_contas/ só tem as pastas 2014 a 2026.

2) CDN. Rodei C:/Users/eduar/Downloads/rv/cetico-q8/head.py e range.py (curl_cffi, impersonate chrome, HEAD e Range bytes=0-0, sem baixar os zips). O curl puro recebe 403. Resultados:
- prestacao_contas_2002.zip: 200, 13.925.110 bytes
- _2004: 200, 68.980.525
- _2006: 200, 32.925.482
- _2008: 206, 0-0/154.761.414
- _2010: 206, 0-0/110.243.477
- prestacao_final_2012.zip: 206, 0-0/671.229.467 (prestacao_contas_2012.zip dá 404)
- prestacao_final_2014.zip: 0-0/202.146.097, igual ao zip local.

Os tamanhos batem com os do achado.

3) Documento. No PR #4, docs/estrategia.md tem:
- linha 127: `| **Q8** PJ × viés político (doação) | doação empresarial, 2002–2014 |`
- linha 146: "O período real é 2002–2014"
- linhas 437-438: "Os dados de PJ de verdade estão em **2002–2014**... analisar **2002–2014 como o período com doação PJ**"

No main as mesmas frases estão nas linhas 127, 146 e 382-383. O texto "até 2016" só aparece citado no próprio estrategia.md (PR4:432, main:377).

Onde o achado exagera: o mesmo estrategia.md tem a decisão ② explícita, que bate com o código.
- PR4:332 / main:277: "**2014** — entra obrigatoriamente, só por causa da Q8"
- PR4:335: "**2016** — entra se sobrar tempo, como marco zero da Q8"
- PR4:336 / main:281: "**2002–2012** — fora, salvo se a Q12 ficar rasa demais"

A lista de arquivos da seção da Duda (linha 132, nos dois refs) já diz "`receitas_*` de 2014 (leiaute antigo)". O README.md do main (linha 58) diz prestacao_contas 2014–2026. O docs/der-duda.md (linha 10) já recorta a Q8 como 2014 contra 2016.

Então código, README, decisão ② e DER da Duda concordam entre si. O que sobra são três trechos de texto antigo (127, 146, 437-438) que contradizem a decisão do próprio documento. Não é lacuna de coleta. O achado também deixou de fora a linha 146.

Não verificado: se os leiautes de 2002-2012 têm CNAE, setor econômico ou doador originário. Para isso seria preciso baixar ou abrir os zips, e não fiz.

### [baixa] `q12-votos-antigos-01` — não verificado (baixa)

- **Arquivo:** scripts/coleta_tse.py (RESULTADOS usa ANOS = 2016+)
- **Problema:** A Q12 vai de 2002 a 2026, mas a votação por candidato só é coletada de 2016 em diante. De 2002 a 2014 a linha do tempo mostra eleito ou não eleito, pelo DS_SIT_TOT_TURNO, mas não a quantidade de votos.
- **Evidência:** Em dados/raw/resultados só há 2016 a 2026. No CDN: votacao_candidato_munzona_2002.zip tem 120.264.128 bytes, _2008 tem 42.670.412 e _2014 tem 494.100.168, todos com HTTP 200/206. DS_SIT_TOT_TURNO nulo: 2002 com 1.578 de 18.109, 2010 com 3.312 de 22.577, 2014 com 3.257 de 26.263 (cand.py).
- **Correção:** Se o visual da Q12 mostrar votos, acrescentar ANOS_HISTORICO ao tema resultados, só votacao_candidato_munzona. Senão, escrever que de 2002 a 2014 a trajetória usa só a situação de totalização.

### [baixa] `tipo-eleicao-2006-01` — não verificado (baixa)

- **Arquivo:** docs/der-davi.md:136; docs/der-duda.md (ELEICAO.tp_eleicao)
- **Problema:** O der-davi.md manda filtrar CD_TIPO_ELEICAO = 2 (ordinária). Em 2006 o código é '0' em todas as linhas. Se esse filtro for parar na ELEICAO compartilhada, 2006 some da Q12 sem erro. O texto de NM_TIPO_ELEICAO também muda ('ELEIÇÃO ORDINÁRIA' contra 'ORDINÁRIA'), o que afeta o tp_eleicao do der-duda.md.
- **Evidência:** GROUP BY CD_TIPO_ELEICAO, NM_TIPO_ELEICAO: 2002 = ('2', 'ELEIÇÃO ORDINÁRIA', 18.109); 2006 = ('0', 'ORDINÁRIA', 19.303); 2010 = ('2', 'ELEIÇÃO ORDINÁRIA', 22.577); 2014 = ('2', ...) com 26.221 linhas mais ('1', 'ELEIÇÃO SUPLEMENTAR') com 42.
- **Correção:** Derivar tp_eleicao com uma regra por ano, por exemplo: CD_TIPO_ELEICAO IN ('0','2') ou NM_TIPO_ELEICAO LIKE '%ORDIN%' é ORDINARIA. Escrever essa regra no dicionário.

### [baixa] `pr4-leiaute-cand-01` — não verificado (baixa)

- **Arquivo:** docs/estrategia.md:323, :387, :496; docs/dicionario-dados.md:66
- **Problema:** O estrategia.md e o dicionário do PR #4 descrevem o leiaute de consulta_cand de forma errada: '≤2010 — 62 colunas | ≥2014 — 50 colunas', e VR_DESPESA_MAX_CAMPANHA e NR_IDADE_DATA_POSSE 'só no leiaute ≤2010'. Na prática 2012 e 2016 têm essas colunas, e o staging da Q12 precisa conhecer três formatos.
- **Evidência:** Cabeçalhos medidos: 2002-2012 têm 63 colunas, 2014 tem 50, 2016 tem 75 e 2018-2026 têm 50. VR_DESPESA_MAX_CAMPANHA, NR_IDADE_DATA_POSSE e CD_MUNICIPIO_NASCIMENTO existem em 2002-2012 e em 2016, e não existem em 2014 nem de 2018 em diante (fato 9).
- **Correção:** Corrigir o texto para '2002–2012: 63; 2014: 50; 2016: 75; 2018–2026: 50 (núcleo comum 45)' e 'ausentes em 2014 e de 2018 em diante'.

### [baixa] `q9-malha-pi-01` — não verificado (baixa)

- **Arquivo:** scripts/coleta_ibge.py (coletar_malha); PR #4 docs/dossie/secoes/introducao.md:16 e :18
- **Problema:** Só existe a malha do PI, mas o dossiê do PR #4 promete 'Visualização espacial do Piauí e do país' e lista a tabela 9514, que não é coletada. Se o mapa da Q9 ('município/região') passar do PI, falta a malha.
- **Evidência:** territorio/malha_municipios_PI.geojson tem 224 features, por exemplo codarea 2200053. Não há outro geojson em dados/raw. O fontes-de-dados.md (main, perto da linha 320) já indica /api/v3/malhas/paises/BR?...&intrarregiao=municipio.
- **Correção:** Baixar a malha nacional (paises/BR, intrarregiao=municipio) ou tirar do dossiê o 'e do país'. Tirar do dossiê a menção à 9514 ou coletá-la.

### [baixa] `pr2-sq2004-01` — não verificado (baixa)

- **Arquivo:** docs/q12-linha-do-tempo.md:26; docs/der-enrico.md:107 e :120
- **Problema:** O PR #2 diz que 2004 tem 402.157 candidaturas em 1.506 valores de SQ_CANDIDATO. Medido com leitura estrita, são 1.357 valores, como no fato 2.
- **Evidência:** count(*), count(distinct SQ_CANDIDATO) e count(distinct try_cast(SQ_CANDIDATO AS BIGINT)) sobre consulta_cand_2004_BRASIL.csv dão (402157, 1357, 1357).
- **Correção:** Trocar 1.506 por 1.357 nos dois arquivos, ou dizer que método gerou 1.506.

### [baixa] `redes-sociais-01` — não verificado (baixa)

- **Arquivo:** scripts/coleta_tse.py (CANDIDATOS['redes_sociais'])
- **Problema:** Faltam as redes sociais de 2022 e 2024, mas nenhuma pergunta usa esse dado. Em 2024 o molde de URL acrescenta _BR e dá 404, enquanto o arquivo real não tem sufixo. Em 2022 o zip local só teve o leiame extraído.
- **Evidência:** HTTP: rede_social_candidato_2024_BR.zip dá 404; rede_social_candidato_2024.zip dá 206, com 20.154.989 bytes. A pasta candidatos/2022/redes_sociais_2022/ tem só leiame.pdf, enquanto o zip contém rede_social_candidato_2022_BR.csv. Não há pasta redes_sociais_2024.
- **Correção:** Baixa prioridade: ou remover redes_sociais do coletor (nenhuma Q usa), ou ajustar o sufixo por ano (_BR só em 2022) e re-extrair 2022.
