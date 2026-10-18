# Q2: patrimônio declarado e sucesso eleitoral

> **Q2.** Qual a taxa de sucesso eleitoral por patrimônio declarado? **[E.P.]**

Responsável: Enrico. Recorte: **AM, GO, MA, MT, RS e SE**, eleições ordinárias de **2018 a 2024**. Os números saem das views de [`sql/18_q2_patrimonio.sql`](../sql/18_q2_patrimonio.sql); as checagens estão em [`sql/validacao/q2_patrimonio.sql`](../sql/validacao/q2_patrimonio.sql).

## A resposta

**Quanto maior o patrimônio declarado, maior a chance de se eleger, dentro do mesmo cargo e em todos os anos.** Entre deputados estaduais de 2018, a taxa de eleição vai de 1,4% no quinto mais pobre a 26,3% no quinto mais rico; entre vereadores de 2024, de 12,3% a 27,3%. Quem não declara nenhum bem se elege menos ainda (0,6% e 8,0%).

Isso **não prova que o dinheiro elege**: quem já tem mandato tende a ser mais velho, mais conhecido e a ter acumulado mais bens, e o patrimônio vem junto com outros fatores que a pergunta não separa.

---

## Os números

### Taxa de eleição por faixa de patrimônio (%)

Faixas: **sem bens** (nenhum bem com valor declarado) e os **quintos** do patrimônio, cortados dentro de cada cargo e ano.

| Cargo | Ano | Sem bens | 1º quinto (menor) | 2º | 3º | 4º | 5º quinto (maior) | Candidatos |
|---|---|---|---|---|---|---|---|---|
| Vereador | 2020 | 6,1 | 9,4 | 14,2 | 16,7 | 19,5 | 24,8 | 98.698 |
| Vereador | 2024 | 8,0 | 12,3 | 16,5 | 21,2 | 23,3 | 27,3 | 79.738 |
| Prefeito | 2020 | 19,4 | 26,0 | 30,2 | 33,1 | 32,8 | 39,7 | 3.950 |
| Prefeito | 2024 | 17,9 | 32,5 | 36,5 | 43,4 | 43,6 | 46,7 | 3.178 |
| Deputado estadual | 2018 | 0,6 | 1,4 | 2,6 | 5,8 | 11,0 | 26,3 | 3.388 |
| Deputado estadual | 2022 | 0,7 | 1,0 | 3,3 | 7,1 | 13,2 | 26,7 | 3.118 |
| Deputado federal | 2018 | 0,7 | 3,8 | 1,9 | 6,3 | 14,0 | 29,3 | 1.206 |
| Deputado federal | 2022 | 0,5 | 0,9 | 6,8 | 7,7 | 6,4 | 17,7 | 1.687 |

**Governador e senador** ficam fora da tabela: são 41 a 69 candidatos por ano nas 6 UFs, poucos para dividir em 6 faixas (a view `q2_faixa` traz os números, e a página pode mostrá-los com esse aviso).

### O teste: a faixa e o resultado são independentes?

Qui-quadrado de independência (6 faixas × eleito/não eleito), por cargo e ano, view `q2_quiquadrado`:

| Cargo | 2018/2020 | 2022/2024 |
|---|---|---|
| Vereador | χ² = 3.853, p < 10⁻¹⁵ | χ² = 3.076, p < 10⁻¹⁵ |
| Prefeito | χ² = 59,8, p ≈ 10⁻¹¹ | χ² = 84,9, p < 10⁻¹⁴ |
| Deputado estadual | χ² = 408,9, p < 10⁻¹⁵ | χ² = 371,1, p < 10⁻¹⁵ |
| Deputado federal | χ² = 156,1, p < 10⁻¹⁵ | χ² = 106,2, p < 10⁻¹⁴ |
| Governador, senador | teste não vale (célula esperada < 5) | idem |

Em todos os cargos com volume, a chance de eleição **depende** da faixa de patrimônio.

### Quanto vale cada quinto (limite de cima, em mil reais de 2024)

| Cargo | Ano | 1º | 2º | 3º | 4º |
|---|---|---|---|---|---|
| Vereador | 2024 | 25 | 80 | 180 | 385 |
| Prefeito | 2024 | 173 | 400 | 750 | 1.665 |
| Deputado estadual | 2022 | 62 | 186 | 393 | 890 |
| Deputado federal | 2022 | 71 | 237 | 507 | 1.172 |

O 5º quinto vai do limite do 4º até o maior patrimônio do cargo. A view `q2_limite` traz todos os cargos e anos, em reais da época e de 2024.

### O que os eleitos têm: composição do patrimônio

Só entre quem declarou algum bem. "% com o bem" = quantos declararam ao menos um bem do grupo; "% do patrimônio" = fatia do valor total do grupo. View `q2_composicao`.

| Cargo, ano | Grupo | % com o bem: eleitos | não eleitos | % do patrimônio: eleitos | não eleitos |
|---|---|---|---|---|---|
| Deputado federal, 2022 | Aplicações | 58,6 | 18,9 | 19,5 | 5,8 |
| | Empresas | 36,8 | 19,9 | 11,9 | 10,4 |
| | Imóveis | 78,2 | 70,7 | 47,0 | 61,2 |
| Prefeito, 2024 | Aplicações | 36,5 | 23,5 | 9,6 | 7,3 |
| | Empresas | 33,9 | 25,0 | 9,8 | 11,0 |
| | Imóveis | 83,2 | 80,0 | 52,7 | 57,9 |
| Vereador, 2024 | Aplicações | 14,7 | 7,3 | 3,0 | 2,3 |
| | Empresas | 12,8 | 7,2 | 2,7 | 2,5 |
| | Imóveis | 66,0 | 58,9 | 68,0 | 73,2 |

**Os eleitos têm aplicações financeiras e participação em empresas com mais frequência**; nos não eleitos o patrimônio é mais concentrado em imóveis. A diferença não é só de nível de riqueza: entre os vereadores de 2024 do quinto mais rico, 21% dos eleitos têm empresas, contra 13% dos não eleitos.

---

## Como foi feito

**Base** (view `q2_candidatura`, uma linha por candidatura): eleições ordinárias de 2018, 2020, 2022 e 2024; vereador, prefeito, deputado estadual, deputado federal, senador e governador (vices e suplentes herdam o resultado da chapa); só quem foi a voto (`ds_sit_tot_turno` preenchido). São 195.188 candidaturas, 28.532 eleitas.

**Patrimônio** = soma dos bens declarados ao TSE no registro da candidatura (`BEM_CANDIDATO`). Para comparar anos, o valor também sai em reais de agosto de 2024, pelo IPCA de agosto de cada ano (`q10_ipca`).

**Por que quintos dentro do cargo e ano, e não faixas fixas em reais.** O patrimônio típico muda 10 vezes entre cargos: a mediana de quem declarou bens é de cerca de R$ 100 mil para vereador e de R$ 900 mil para senador. Com faixas fixas, quase todo vereador cairia nas faixas de baixo e quase todo governador nas de cima, e a comparação deixaria de ser dentro do cargo (regra do grupo). Os quintos põem 20% dos candidatos de cada cargo em cada faixa, então toda faixa tem gente suficiente para a taxa, e a inflação não interfere (o corte é dentro do mesmo ano). Para quem lê, a tabela de limites diz quanto cada quinto vale em reais.

**Por que "sem bens" é uma faixa própria.** Cerca de 35% dos vereadores e deputados não declaram nenhum bem. Pôr essas pessoas no 1º quinto confundiria "não declarou" com "é pobre". Entre os eleitos, só 3% a 4% dos deputados e 17% dos vereadores estão nessa faixa.

**Regra para erro de digitação.** O TSE publica o valor como o candidato digitou, e há bens de R$ 1 bilhão declarados por vereadores. **Regra:** a candidatura com algum bem de **R$ 100 milhões ou mais** sai das faixas (`fl_suspeito`). Ela afeta **22 de 195.188 candidaturas** (vereador 13, prefeito 4, governador 3, deputado estadual 2), 6 delas eleitas.

- A maioria é erro: vereador com uma casa de R$ 250 milhões que, na eleição seguinte, declara R$ 0,3 milhão no total.
- Alguns parecem reais: um governador declara cerca de R$ 110 milhões em 2018 **e** em 2022; um prefeito eleito declara 94 bens. A regra não distingue os dois casos, e por isso foi checada: devolver os 22 ao 5º quinto não muda a taxa de nenhuma faixa em mais de 0,5 ponto (checagem V7). Com faixas por posição, um valor absurdo não desloca as outras pessoas.

**Grupos de bens**: os ~50 tipos do TSE juntados em 6 (imóveis, empresas, aplicações, dinheiro, veículos, outros), pela regra da view `q10_bem_tipo` (Q10).

### Checagens (`sql/validacao/q2_patrimonio.sql`)

| | O que confere | Resultado |
|---|---|---|
| V1 | as faixas somam a base | ok |
| V2 | uma linha por candidatura | ok |
| V3 | o patrimônio da base = soma dos bens das mesmas candidaturas | ok |
| V4 | os 5 quintos têm o mesmo tamanho em cada cargo e ano | ok |
| V5 | as 6 UFs em todo cargo e ano | ok |
| V6 | declarações suspeitas | 22, exceção conhecida |
| V7 | sensibilidade à regra de V6 | ok (nenhuma faixa muda mais de 0,5 ponto) |
| V8 | 1 governador e 1 ou 2 senadores eleitos por UF | ok, menos MT 2018 senador = 1: a segunda eleita foi cassada em 2019 e o TSE a grava hoje como não eleita |

---

## Para a página

**View principal: `q2_faixa`.** Grão: **ano × UF × cargo × faixa** (uma linha por faixa de patrimônio de um cargo, num estado e ano). Colunas: `ano`, `sg_uf`, `ds_cargo`, `nr_faixa` (0 = sem bens, 1 a 5 = quintos), `ds_faixa`, `qt_candidatos`, `qt_eleitos`, `pc_taxa_eleicao`, `vr_patrimonio_2024`.

Os quintos são cortados nas 6 UFs juntas; a UF está no grão para o filtro somar `qt_eleitos` e `qt_candidatos` (não somar `pc_taxa_eleicao`).

Apoio: `q2_limite` (quanto vale cada quinto, para o rótulo), `q2_quiquadrado` (o teste; o p-valor é calculado na página ou no notebook, porque o DuckDB não tem a distribuição qui-quadrado), `q2_composicao` (eleitos × não eleitos por grupo de bem).

## Fontes

| Dado | Fonte |
|---|---|
| Bens declarados (2018–2024) | TSE, Dados Abertos, `bem_candidato` ([portal](https://dadosabertos.tse.jus.br/)), por UF; tabela `BEM_CANDIDATO` (`sql/13_ficha_candidato.sql`) |
| Candidaturas, cargo e resultado | TSE, `consulta_cand`; tabela `CANDIDATURA` (`sql/06_carga_nucleo.sql`) |
| IPCA de agosto | IBGE, SIDRA [1737](https://sidra.ibge.gov.br/tabela/1737); view `q10_ipca` |

## Limites

- **É o patrimônio declarado, não o real.** O candidato declara o que quer, pelo valor que quer (imóvel costuma ir pelo valor de compra, não de mercado), e não há conferência.
- **Associação, não causa.** Patrimônio anda junto com idade, carreira, mandato anterior e partido; a Q2 não separa esses fatores. A carreira está na Q10.
- **Governador e senador** têm poucos candidatos por ano: as taxas por faixa oscilam e o teste não vale.
- **2026** fica fora (E.P.): ainda sem resultado completo.
