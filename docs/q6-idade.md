# Q6: idade do município, idade dos eleitos e alternância de poder

> **Q6.** Idade média do município (mais velho × mais jovem): há alternância de poder? Qual a
> idade média dos eleitos? Jovem vota em jovem e velho em velho? [E.P.]

Nos 6 estados (AM, GO, MA, MT, RS, SE). Os números saem do banco
(`dados/processed/tse.duckdb`) pelas views de `sql/20_q6_idade.sql`; as tabelas de idade
são carregadas por `sql/19_faixa_etaria.sql`. Checagens em `sql/validacao/q6_idade.sql`.

## Resposta

**Os eleitos são mais velhos que o eleitor em toda cidade, e a cidade mais velha elege
vereadores um pouco mais velhos.** Jovem não vota em jovem: em qualquer cidade, só 5% a 8%
dos votos para vereador vão para candidatos de até 29 anos, mesmo onde um terço do eleitorado
é jovem. Velho vota um pouco mais em velho. A alternância de poder é maior nas cidades jovens,
mas isso é efeito do estado (Maranhão e Amazonas trocam mais de prefeito que o Rio Grande do
Sul): comparando cidades do mesmo estado, a idade não muda a alternância.

---

## Fontes

| Dado | Fonte | Onde está no projeto |
|---|---|---|
| População por faixa de idade e município | IBGE, Censo 2022, SIDRA [9606](https://sidra.ibge.gov.br/tabela/9606) | coleta `coleta_ibge idade`; tabela `CENSO_FAIXA_ETARIA` |
| Eleitorado (aptos, comparecimento, abstenção) por faixa de idade e município | TSE, Dados Abertos: `perfil_comparecimento_abstencao` 2018–2024 ([portal](https://dadosabertos.tse.jus.br/)) | coleta `coleta_tse recorte_remoto`; tabela `COMPARECIMENTO_PERFIL` |
| Idade, cargo, partido e resultado de cada candidato | TSE: `consulta_cand` 2016–2024 | tabela `CANDIDATURA` (`nr_idade_eleicao`) |
| Votos por candidato e município | TSE: `votacao_candidato_munzona` 2018–2024 | tabela `VOTACAO_CANDIDATO_MUNICIPIO` |
| Renomeações, fusões e incorporações de partidos (2017–2023) | registro de partidos do TSE | `dados/referencia/partido_sucessao.csv` |
| Definição de jovem (15 a 29 anos) | Estatuto da Juventude, [Lei 12.852/2013](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12852.htm), art. 1º | regra R10, `FAIXA_ETARIA.fl_jovem` |
| Definição de idoso (60 anos ou mais) | Estatuto da Pessoa Idosa, [Lei 10.741/2003](https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741.htm), art. 1º | `q6_*` (`pc_*_idoso`) |

---

## Como medimos

- **Idade do município** = idade média da população no Censo 2022 (cada faixa de 5 anos
  conta pelo meio dela). As 1.238 cidades que o Censo tem foram divididas em **terços**:
  *mais jovens* (média de 23,7 a 34,0 anos), *intermediárias* (34,1 a 39,1) e *mais velhas*
  (39,1 a 49,2). A mais jovem é Jutaí (AM, 23,7); a mais velha, Coqueiro Baixo (RS, 49,2).
- **Corte dentro do estado:** os terços misturam a idade com o estado — as 62 cidades do AM e
  194 das 217 do MA estão no terço mais jovem; 336 das 497 do RS, no mais velho. Por isso há
  também o terço *dentro de cada estado* (`ds_corte = 'NA UF'`): compara cidades do mesmo estado.
- **Idade do eleitorado:** perfil do eleitor do TSE no 1º turno de cada eleição.
- **Idade dos eleitos:** idade na data da eleição, de 18 a 100 anos (46 candidaturas de 2016
  a 2024 têm data de nascimento errada no TSE, como 807 anos, e ficam fora).
- **Jovem vota em jovem?** O voto é secreto: não dá para saber em quem o jovem votou. O que se
  compara é a parcela de jovens no eleitorado da cidade com a parcela dos votos que foi para
  candidatos jovens. Mesmo cargo da Q7: **vereador** em 2020 e 2024 (todos os candidatos são
  da cidade) e **deputado federal** em 2018 e 2022; 1º turno.
- **Alternância de poder:** o partido do prefeito eleito mudou de 2016 para 2020 e de 2020
  para 2024? Renomeações e fusões não contam como troca (PMDB → MDB, DEM → União etc.).
  E o prefeito: tentou se reeleger? Conseguiu? A pessoa é a mesma pelo título de eleitor.

---

## Resultados

### Idade média dos eleitos

| 6 estados | Candidatos | Eleitos | Jovens (18–29) entre os eleitos | 60 anos ou mais entre os eleitos |
|---|---|---|---|---|
| Vereador 2020 | 44,7 anos | 44,4 | 7,5% | 8,0% |
| Vereador 2024 | 46,4 | 45,5 | 6,1% | 9,9% |
| Prefeito 2020 | 49,8 | 49,4 | 1,5% | 17,0% |
| Prefeito 2024 | 50,6 | 50,0 | 1,9% | 20,6% |
| Deputado federal 2018 | 47,3 | 49,5 | 3,3% | 18,9% |
| Deputado federal 2022 | 47,8 | 48,0 | 6,7% | 24,4% |

O eleitorado tem 24,5% de jovens (16 a 29 anos) e 21,1% de pessoas com 60 anos ou mais (2024);
os eleitos se concentram entre 30 e 59 anos. Dentro do mesmo cargo, quem tem de 30 a 59 anos
tem mais chance de vencer: para vereador em 2024, 16,8% dos candidatos dessa faixa foram
eleitos, contra 13,5% dos jovens e 11,5% dos de 60 ou mais. Os eleitos envelheceram de 2020
para 2024.

### Cidade jovem × cidade velha

| Terço (6 estados) | Idade média da população | do eleitorado (2024) | dos vereadores eleitos (2024) | dos prefeitos eleitos (2024) |
|---|---|---|---|---|
| Mais jovens | 31,3 | 41,1 | 44,0 | 49,2 |
| Intermediárias | 36,4 | 45,5 | 45,9 | 49,9 |
| Mais velhas | 40,4 | 48,5 | 46,6 | 51,1 |

A cidade mais velha elege vereadores um pouco mais velhos (correlação de 0,30 entre a idade da
população e a dos vereadores eleitos), mas a diferença entre os terços (2,6 anos) é bem menor
que a do eleitorado (7,4 anos). Para prefeito quase não há relação (0,08).

### Jovem vota em jovem? Velho vota em velho?

| Vereador, 2024 | Eleitorado jovem (16–29) | Votos em candidato jovem | Eleitorado de 60+ | Votos em candidato de 60+ |
|---|---|---|---|---|
| Cidades mais jovens | 29,5% | 5,7% | 15,8% | 9,2% |
| Intermediárias | 21,5% | 5,2% | 23,3% | 14,0% |
| Cidades mais velhas | 18,3% | 5,4% | 30,3% | 15,3% |

- **Jovem não vota em jovem.** Os votos em candidato jovem ficam entre 5% e 8% em qualquer
  terço e não sobem com a parcela de jovens: a correlação entre as duas, cidade a cidade, é
  0,00 em 2020 e −0,02 em 2024 (vereador). Em 2020 o quadro é o mesmo (7,0% × 7,7% dos votos).
- **Velho vota um pouco mais em velho.** Nas cidades mais velhas os candidatos de 60+ recebem
  15,3% dos votos para vereador; nas mais jovens, 9,2%. A correlação é 0,43 em 2024 (0,38 em
  2020) e continua positiva dentro de cada estado (de 0,10 no RS a 0,41 no AM, em 2024).
  Mesmo assim, o candidato de 60+ recebe 12,1% dos votos, pouco mais da metade do peso do
  idoso no eleitorado (21,1%).
- Jovem também se abstém mais: em 2024, 25,8% dos eleitores de 16 a 29 anos não votaram,
  contra 19,9% dos demais.

### Há alternância de poder?

**Sim, e muita:** o partido do prefeito mudou em 65,6% das cidades de 2016 para 2020 e em 60,0%
de 2020 para 2024. Cerca de metade dos prefeitos tentou a reeleição; dos que tentaram, 65%
se reelegeram em 2020 e 84% em 2024.

| Partido do prefeito mudou | 2016 → 2020 | 2020 → 2024 |
|---|---|---|
| Cidades mais jovens (6 estados) | 76,0% | 69,3% |
| Intermediárias | 65,8% | 60,3% |
| Cidades mais velhas | 55,0% | 50,5% |
| Mais jovens **do mesmo estado** | 65,0% | 58,0% |
| Intermediárias do mesmo estado | 68,4% | 61,6% |
| Mais velhas do mesmo estado | 63,5% | 60,4% |

Entre os 6 estados, a cidade jovem troca mais de partido. Mas, dentro de cada estado, a
cidade jovem e a velha trocam na mesma medida: a diferença vem de os estados jovens (MA, AM)
alternarem mais que o RS, não da idade da cidade. A reeleição de quem tentou também é igual
nos três terços (82% a 86% em 2024).

---

## Views (o que a página usa)

| View | Grão (uma linha por) | Colunas principais |
|---|---|---|
| `q6_municipio` | município (1.238) | idade média da população, % jovem e % 60+ (Censo 2022); terço nos 6 estados e no estado; idade média e % jovem do eleitorado 2024; abstenção jovem × não jovem; idade média dos vereadores e do prefeito eleitos em 2024; partido do prefeito em 2016, 2020 e 2024; troca de partido; prefeito concorreu e foi reeleito |
| `q6_resumo` | corte (`6 UFS` ou `NA UF`) × terço × eleição municipal (2020, 2024) | as médias das idades, % troca de partido, % prefeito concorreu, % reeleito, votos em jovem e em 60+ |
| `q6_idade_eleitos` | eleição × estado × cargo (2018–2024) | idade média de candidatos e eleitos, % jovem e % 60+, chance de vitória por faixa |
| `q6_voto_idade` | município × eleição (vereador 2020/2024, deputado federal 2018/2022) | idade do eleitorado, % jovem e % 60+ no eleitorado e nos votos, idade média do voto, % jovem entre candidatos e eleitos |
| `q6_voto_idade_correlacao` | eleição × estado (e `TODAS`) | correlações entre o eleitorado e os votos, jovem e 60+ |

Apoio: `q6_censo_municipio`, `q6_eleitorado_municipio`, `q6_candidatura`, `q6_prefeito`,
`q6_partido_sucessao`.

---

## Limites

- **Falácia ecológica:** "jovem vota em jovem" é medido por cidade, não por eleitor. Uma
  cidade com mais jovens não votar mais em jovem não prova que o jovem não vota em jovem — só
  que isso não aparece no resultado. O TSE não publica voto por idade do eleitor.
- **Oferta:** só 7% a 10% dos candidatos a vereador são jovens; o eleitor jovem tem pouco em
  quem votar. `q6_voto_idade.pc_candidatos_jovem` traz a oferta de cada cidade.
- **Idade do município é quase o estado:** por isso o corte dentro do estado. Cidades velhas
  são em geral pequenas e do RS; a idade anda junto com tamanho, renda e região.
- **Censo de 2022 para todas as eleições:** a idade da população é uma foto de 2022; a do
  eleitorado muda a cada eleição (o eleitorado dos 6 estados foi de 42,7 para 44,2 anos de
  2018 a 2024).
- **Cidades fora:** Boa Esperança do Norte (MT) não existia no Censo 2022. Cidades com eleição
  de prefeito anulada (11 em 2016, 8 em 2020 e 9 em 2024, listadas na V7 da validação) ficam
  sem troca de partido naquela comparação. Em 2024 o TSE não publicou os votos de vereador de
  17 cidades (V3 de `validacao/q7_vies.sql`).
- **Partido não é grupo político:** trocar de partido pode ser o mesmo grupo mudando de sigla
  (ou o prefeito mudando de partido). A troca de pessoa (`fl_prefeito_reeleito_*`) é a outra
  medida.
- **Correlação não é causa.**
