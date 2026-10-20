# Q1: quanto custa uma cadeira

Análise da pergunta Q1 nos 6 estados (AM, GO, MA, MT, RS, SE), período E.P. (2018, 2020,
2022, 2024). Os números saem do banco (`dados/processed/tse.duckdb`) pelas views de
`sql/22_q1_custo_cadeira.sql`. As checagens estão em `sql/validacao/q1_custo_cadeira.sql`.

## A resposta

Uma cadeira de deputado federal custou, somando o gasto de todos os candidatos, R$ 6,0
milhões em 2022 (R$ 2,2 milhões em 2018). A de vereador custou R$ 39,5 mil em 2024, e a
de prefeito R$ 573 mil. Quem ganhou gastou menos que isso: o eleito a deputado federal
gastou em média R$ 1,8 milhão; o resto foi gasto por quem perdeu. Em 2022 e 2024, de 69%
a 89% do gasto poderia ter sido pago só com dinheiro público (Fundo Eleitoral e Fundo
Partidário).

## Como medimos

- **Custo da cadeira** = despesa de campanha de todos os candidatos do cargo na unidade
  eleitoral (UE) ÷ vagas. A UE é o estado (governador, senador, deputados) ou o município
  (prefeito, vereador). Presidente fica fora: a UE é o país.
- **Custo do eleito** = despesa dos eleitos ÷ eleitos. É quanto gastou quem ganhou.
- **No estado** (cargos municipais): o gasto de todos os municípios ÷ todas as vagas. A
  mediana entre os municípios fica ao lado, porque a capital puxa a média.
- **Despesa contratada, não receita.** O leiaute de 2018 em diante tem as duas. A despesa
  é o que a campanha comprou; a receita que sobra não elege ninguém e volta ao Tesouro ou
  ao partido. E a receita tem erros de digitação grandes: num município do AM em 2020,
  vereadores aparecem com R$ 207 milhões de receita cada.
- **Sem as doações a outros candidatos e partidos.** Esse dinheiro é gasto por quem
  recebeu e já entra na despesa dele. Contar nos dois lados contaria o mesmo real duas
  vezes (R$ 109 milhões de 2018 a 2024).
- **A chapa conta junto:** vice-prefeito, vice-governador e suplentes de senador entram no
  cargo do titular. Quase não têm despesa própria (R$ 130 mil em todo o período).
- **Dinheiro público** = Fundo Especial de Financiamento de Campanha (FEFC) + Fundo
  Partidário, pela regra ① de `sql/02_fonte_recurso.sql`. Ele fica com quem gastou, como a
  despesa: cada candidato soma o fundo que recebeu (do partido ou de outro candidato) e
  tira o que repassou. Assim o fundo que o candidato a prefeito passa aos vereadores conta
  uma vez, na conta dos vereadores. `pc_publico` = público ÷ despesa.
- **Reais de agosto de 2024** (IPCA, a mesma correção da Q10 e da Q2), ao lado dos reais
  da época.

## Resultados

Custo da cadeira, todos os 6 estados juntos:

| Cargo | Ano | Vagas | Gasto total | Custo da cadeira | Em R$ de 2024 | Custo do eleito | Público |
|---|---|---|---|---|---|---|---|
| Governador | 2018 | 6 | R$ 101,7 mi | R$ 16,9 mi | R$ 23,4 mi | R$ 5,9 mi | 62% |
| Governador | 2022 | 6 | R$ 180,8 mi | R$ 30,1 mi | R$ 32,8 mi | R$ 9,0 mi | 69% |
| Senador | 2018 | 12 | R$ 64,5 mi | R$ 5,4 mi | R$ 7,4 mi | R$ 1,6 mi | 73% |
| Senador | 2022 | 6 | R$ 72,4 mi | R$ 12,1 mi | R$ 13,2 mi | R$ 3,2 mi | 82% |
| Deputado federal | 2018 | 90 | R$ 198,3 mi | R$ 2,2 mi | R$ 3,0 mi | R$ 999 mil | 79% |
| Deputado federal | 2022 | 90 | R$ 538,8 mi | R$ 6,0 mi | R$ 6,5 mi | R$ 1,8 mi | 89% |
| Deputado estadual | 2018 | 210 | R$ 183,1 mi | R$ 872 mil | R$ 1,2 mi | R$ 300 mil | 60% |
| Deputado estadual | 2022 | 210 | R$ 318,1 mi | R$ 1,5 mi | R$ 1,7 mi | R$ 478 mil | 75% |
| Prefeito | 2020 | 1.238 | R$ 408,9 mi | R$ 330 mil | R$ 429 mil | R$ 125 mil | 57% |
| Prefeito | 2024 | 1.239 | R$ 710,5 mi | R$ 573 mil | R$ 573 mil | R$ 242 mil | 78% |
| Vereador | 2020 | 12.791 | R$ 236,5 mi | R$ 18,5 mil | R$ 24,0 mil | R$ 4,6 mil | 56% |
| Vereador | 2024 | 12.852 | R$ 508,0 mi | R$ 39,5 mil | R$ 39,5 mil | R$ 10,3 mil | 73% |

**A cadeira ficou mais cara, acima da inflação.** De 2018 a 2022 a de deputado federal
dobrou em reais de 2024 (R$ 3,0 mi → R$ 6,5 mi); de 2020 a 2024 a de vereador subiu 64%
(R$ 24,0 mil → R$ 39,5 mil). O FEFC também cresceu: a parte pública do gasto subiu em
todos os cargos.

**Deputado federal por estado (2022):** MT R$ 9,7 mi, AM R$ 7,8 mi, GO R$ 7,0 mi, MA R$ 6,1
mi, SE R$ 5,8 mi, RS R$ 4,0 mi. O RS, com mais vagas (31), tem a cadeira mais barata.

**Vereador por estado (2024):** AM R$ 90,7 mil, SE R$ 57,5 mil, MT R$ 54,8 mil, GO R$ 38,9
mil, MA R$ 31,3 mil, RS R$ 28,6 mil. A mediana entre os municípios é bem menor (de R$ 8,9
mil no RS a R$ 28,3 mil no AM): o gasto se concentra nas cidades grandes. As cadeiras mais
caras de vereador em 2024 são as das capitais: Manaus R$ 1,08 mi, São Luís R$ 1,01 mi,
Aracaju R$ 998 mil, Goiânia R$ 800 mil, Cuiabá R$ 796 mil.

## Views (o que a página lê)

| View | Grão (uma linha por) | Colunas principais |
|---|---|---|
| `q1_custo_cargo` | ano × UF × cargo | `qt_ues`, `qt_vaga`, `qt_candidatos`, `qt_eleitos`, `vr_despesa`, `vr_custo_cadeira`, `vr_custo_eleito`, `vr_publico_cadeira`, `pc_publico`, `vr_custo_cadeira_mediana` e os mesmos em `_2024`, `fl_divulgado` |
| `q1_custo_ue` | ano × UE × cargo (a página da cidade filtra por `cod_ibge`) | `sg_uf`, `sg_ue`, `cod_ibge`, `nm_ue`, `qt_vaga`, `qt_candidatos`, `qt_candidatos_com_despesa`, `qt_eleitos`, `vr_despesa`, `vr_despesa_eleitos`, `vr_publico`, `vr_custo_cadeira`, `vr_custo_eleito`, `vr_publico_cadeira`, `pc_publico`, os `_2024`, `fl_divulgado` |
| `q1_candidatura` | candidatura (base) | `cd_cargo` (o da vaga), `fl_vice`, `fl_eleito`, `vr_despesa`, `vr_publico` |

## Fontes

| Dado | Fonte | Onde está no projeto |
|---|---|---|
| Despesas contratadas e receitas dos candidatos | TSE, Dados Abertos: `prestacao_de_contas_eleitorais_candidatos` 2018–2024 ([portal](https://dadosabertos.tse.jus.br/dataset/?groups=prestacao-de-contas)) | `recorte_remoto`; views `stg_despesa`, `stg_receita` |
| Vagas por cargo e UE | TSE: `consulta_vagas` 2018–2024 ([portal](https://dadosabertos.tse.jus.br/dataset/?groups=candidatos)) | `recorte_remoto`; tabela `VAGA` |
| Candidaturas e resultado | TSE: `consulta_cand` | tabela `CANDIDATURA` |
| IPCA de agosto | IBGE, SIDRA [1737](https://sidra.ibge.gov.br/tabela/1737) | `coleta_ibge ipca`; view `q10_ipca` |

## Limites

- **Só o que foi declarado.** A despesa é a da prestação de contas; caixa 2 não aparece.
  31% das candidaturas não declararam despesa nenhuma (96% delas de vereador).
- **Fundo maior que o gasto em município pequeno.** Em 380 das 5.002 combinações de
  município e cargo o dinheiro público passa da despesa declarada: o candidato recebeu o
  fundo e declarou menos despesa contratada (a diferença volta ao Tesouro ou não foi
  declarada). No estado isso só acontece no senado do AM em 2022 (102%).
- **Repasse sem o doador identificado.** 8% do fundo repassado entre candidatos (em valor)
  vem sem o número do candidato doador; essa parte fica contada duas vezes (no doador e em
  quem recebeu).
- **Eleição sem eleito.** Em 35 combinações (17 câmaras e 9 prefeituras em 2024, 8
  prefeituras em 2020, o senado de MT em 2018) o TSE não publicou eleito ou cassou a chapa;
  ali o custo do eleito fica vazio ou é o de um eleito só (lista na V5 da validação).
- **2026 fora**: a prestação de contas ainda é parcial (`fl_divulgado`).
