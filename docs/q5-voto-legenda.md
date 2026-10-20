# Q5: eleitos por voto de legenda

Análise da pergunta Q5 nos 6 estados (AM, GO, MA, MT, RS, SE), período E.P. (2018, 2020,
2022, 2024). Os números saem do banco (`dados/processed/tse.duckdb`) pelas views de
`sql/23_q5_voto_legenda.sql`. As checagens estão em `sql/validacao/q5_voto_legenda.sql`.

## A resposta

Poucos: 422 dos 26.043 eleitos para cargos proporcionais (1,6%) só ganharam a cadeira por
causa dos votos de legenda, os votos dados ao número do partido e não a um candidato. São
235 vereadores em 2020, 177 em 2024 e 5 deputados em cada eleição geral (2018 e 2022). Os
partidos que mais elegeram assim foram MDB (58), PP (52), PDT (48) e PL (40).

## Como medimos

Refizemos a distribuição das cadeiras duas vezes, com as regras do Código Eleitoral (Lei
4.737/1965, arts. 106 a 111):

1. **com** os votos de legenda, como o TSE fez;
2. **sem** os votos de legenda (o resto igual).

A cadeira que uma lista tem no cenário 1 e não tem no 2 foi ganha pela legenda, e quem a
ocupa é o eleito menos votado da lista: esse é o **eleito pela legenda**. A cadeira vai
para outra lista, e o candidato que a ganharia sem a legenda aparece como **fora pela
legenda**.

- **Lista** = quem disputa as cadeiras: o partido isolado, a coligação (só em 2018; a EC
  97/2017 acabou com a coligação proporcional a partir de 2020) ou a federação (2022 e
  2024, Lei 14.208/2021). O TSE marca a lista com `SQ_COLIGACAO`.
- **Votos válidos da lista** = nominais + legenda + nominais convertidos em legenda (voto
  em candidato com registro negado depois da eleição, art. 175 §4º). "Sem legenda" tira
  só os votos de legenda; os convertidos ficam, porque o eleitor votou num candidato.
- **Quociente eleitoral (QE)** = válidos ÷ vagas, fração até meio desprezada, acima de meio
  arredondada para cima (art. 106). Sem a legenda o QE também cai.
- **Fase 1, quociente partidário:** a lista elege até (votos ÷ QE) candidatos com ao menos
  10% do QE (arts. 107 e 108).
- **Fase 2, sobras:** cada cadeira que sobra vai à lista com a maior média (votos ÷
  cadeiras + 1) que ainda tem candidato apto (art. 109). Em 2018 e 2020 (Lei 13.488/2017)
  disputam todas as listas, com candidato de 10% do QE. Em 2022 e 2024 (Lei 14.211/2021)
  só a lista com 80% do QE e o candidato com 20%.
- **Fase 3:** se nenhuma lista tem candidato apto, as cadeiras que faltam vão às maiores
  médias, sem exigência de votação. Em 2022 o TSE só deixava entrar as listas com 80% do
  QE, e o STF (ADIs 7228, 7263 e 7325, fev. 2024) abriu para todas. Nos 6 estados isso não faz diferença: a fase 3 só aconteceu
  em eleição municipal (2 cadeiras em 2020, 5 em 2024).
- **Dentro da lista** ganham os mais votados; no empate, o mais velho (art. 110).
- **Empate de média entre listas:** a lista mais votada e, se persistir, a do candidato que
  levaria a cadeira com mais votos. Foi assim que o TSE decidiu em Santo Amaro das Brotas
  (SE) e Barra do Quaraí (RS) em 2020, os dois empates exatos do período.

**A conta com legenda reproduz o TSE:** os 26.043 eleitos do modelo são exatamente os
candidatos que o TSE declarou "eleito por QP" ou "eleito por média", e a fase 1 bate com os
"eleito por QP" lista a lista (V4 e V6 da validação). Isso confere o método antes de tirar
a legenda.

## Resultados

| Cargo | Ano | Eleitos | Pela legenda | Votos de legenda | % dos votos |
|---|---|---|---|---|---|
| Deputado federal | 2018 | 90 | 2 | 1.030.358 | 6,4% |
| Deputado estadual | 2018 | 210 | 3 | 1.234.429 | 7,5% |
| Vereador | 2020 | 12.791 | 235 | 874.355 | 5,1% |
| Deputado federal | 2022 | 90 | 2 | 663.583 | 3,7% |
| Deputado estadual | 2022 | 210 | 3 | 1.057.792 | 5,9% |
| Vereador | 2024 | 12.652 | 177 | 626.256 | 3,3% |

**O voto de legenda está caindo** (de 6,4% para 3,7% dos votos para deputado federal; de
5,1% para 3,3% para vereador), e com ele os eleitos pela legenda (235 → 177 vereadores).

**Deputados eleitos pela legenda:**

| Ano | UF | Cargo | Eleito | Partido (lista) | Votos |
|---|---|---|---|---|---|
| 2018 | GO | Dep. federal | José Nelto | PODE (PSC / PODE / PROS / PDT / PRP / DEM) | 61.809 |
| 2018 | RS | Dep. federal | Maria do Rosário | PT | 97.303 |
| 2018 | MA | Dep. estadual | Pastor Cavalcante | PROS (PPL / PTB / PROS / PPS) | 29.365 |
| 2018 | RS | Dep. estadual | Stela Farias | PT | 30.661 |
| 2018 | RS | Dep. estadual | Giuseppe Riesgo | NOVO | 16.224 |
| 2022 | GO | Dep. federal | Marussa Boldrin | MDB | 80.464 |
| 2022 | RS | Dep. federal | Afonso Motta | PDT | 70.307 |
| 2022 | GO | Dep. estadual | Dr. José Machado | PSDB (federação PSDB / Cidadania) | 22.928 |
| 2022 | MA | Dep. estadual | Neto Evangelista | UNIÃO | 50.923 |
| 2022 | RS | Dep. estadual | Laura Sito | PT (federação PT / PV / PC do B) | 36.705 |

**Vereadores por partido:** em 2020, DEM 32, PDT 31, PP 28, MDB 25, PL 19, PT 15; em 2024,
MDB 32, União 26, PP 24, PL 21, PDT 16, PT 14. Os partidos grandes e com eleitor fiel ao
número são os que mais ganham. Por estado, o RS lidera nos dois anos (81 e 63), seguido de
GO (62 e 37).

## Views (o que a página lê)

| View | Grão (uma linha por) | Colunas principais |
|---|---|---|
| `q5_partido` | ano × UF × cargo × partido (a resposta) | `ds_cargo`, `sg_partido`, `qt_eleitos_tse`, `qt_eleitos`, `qt_eleitos_sem_legenda`, `qt_eleitos_legenda`, `qt_votos_nominais`, `qt_votos_legenda`, `pc_legenda`, `fl_divulgado` |
| `q5_eleito_legenda` | candidatura afetada (quem são) | `nm_ue`, `ds_cargo`, `nm_candidato`, `sg_partido`, `sg_lista`, `qt_votos`, `nr_ordem`, `qt_cadeiras_com`, `qt_cadeiras_sem`, `qt_votos_legenda`, `tp_efeito` (`ELEITO PELA LEGENDA` / `FORA PELA LEGENDA`), `fl_divulgado` |
| `q5_lista_cadeiras` | eleição × UE × cargo × lista | `sg_lista`, `qt_votos_nominais`, `qt_votos_legenda`, `qt_vaga`, `qt_qe_com`, `qt_qe_sem`, `qt_cadeiras_com`, `qt_cadeiras_sem`, `qt_cadeiras_legenda` |
| `q5_distribuicao` | eleição × UE × cargo × lista × cenário | o passo a passo: `qt_qe`, `qt_qp`, aptos, `qt_fase1`, `qt_fase2`, `qt_fase3`, `qt_cadeiras` |

`modelo.votacao_legenda_municipio` (tabela do DER) é carregada pelo mesmo script.

## Fontes

| Dado | Fonte | Onde está no projeto |
|---|---|---|
| Votos de legenda por partido e município | TSE, Dados Abertos: `votacao_partido_munzona` 2018–2024 ([portal](https://dadosabertos.tse.jus.br/dataset/?groups=resultados)) | `recorte_remoto`; tabela `VOTACAO_LEGENDA_MUNICIPIO` |
| Votos nominais por candidato | TSE: `votacao_candidato_munzona` 2018–2024 | `recorte_remoto`; tabela `VOTACAO_CANDIDATO_MUNICIPIO` |
| Vagas | TSE: `consulta_vagas` 2018–2024 | `recorte_remoto`; tabela `VAGA` |
| Candidaturas, partido e resultado oficial | TSE: `consulta_cand` | tabela `CANDIDATURA` |
| Regras | [Código Eleitoral, arts. 106 a 111](https://www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm); [Lei 13.488/2017](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13488.htm); [Lei 14.211/2021](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14211.htm); [EC 97/2017](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc97.htm); [Lei 14.208/2021](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14208.htm) | `sql/23_q5_voto_legenda.sql` |

## Limites

- **É contrafactual.** "Sem legenda" supõe que quem votou na legenda não teria votado em
  ninguém. Na prática parte desse eleitor votaria num candidato do mesmo partido; o número
  é o teto do efeito da legenda, não uma previsão.
- **Partido da coligação ou da federação.** O eleito pela legenda pode dever a cadeira à
  legenda do parceiro: em 2018 José Nelto (PODE) foi eleito numa coligação de seis
  partidos. `q5_partido` conta o eleito no partido dele e mostra ao lado a legenda do
  próprio partido.
- **Listas duplicadas no arquivo.** O TSE às vezes grava o mesmo partido em duas listas na
  mesma UE (uma sem voto, ou repetindo a legenda da outra, como o PDT do AM em 2018). Fica
  a lista com mais legenda e, no empate, a com mais partidos.
- **17 câmaras sem resultado em 2024** (as da V7 de `q4_escolaridade.sql`): o TSE não
  publicou voto nominal de vereador; nenhuma cadeira é distribuída ali.
- **2026 fora** (`fl_divulgado`).
- **Consulta com janela sobre estas views pode derrubar o DuckDB 1.5.5** (falha de
  segmentação vista com `row_number() OVER` numa subconsulta sobre `q5_partido`). Ler as
  views direto funciona; para ranquear, materialize antes numa tabela temporária.
