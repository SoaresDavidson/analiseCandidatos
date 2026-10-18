# Q3 e Q7: análise e fontes

Análise para as duas perguntas novas da apresentação, nos 6 estados (AM, GO, MA, MT,
RS, SE). Os números saem do banco (`dados/processed/tse.duckdb`) pelas views de
`sql/16_indicadores_municipio.sql` e `sql/17_q7_vies.sql`; a página do site ainda
não foi feita (proposta no fim).

| | Pergunta do professor | Período usado |
|---|---|---|
| **Q3** | Índices do município (PIB per capita, IDHM, eleitores/população, isentos = brancos + nulos + abstenções) × eleitos/partidos mais vitoriosos? | 2024 (eleição municipal), com 2020 para conferir |
| **Q7** | Viés político de um município/região na linha do tempo? | E.P.: 2018, 2020, 2022, 2024 |

---

## Fontes

| Dado | Fonte | Onde está no projeto |
|---|---|---|
| Votos por candidato, município e zona | TSE, Dados Abertos: `votacao_candidato_munzona` 2018–2024 ([portal](https://dadosabertos.tse.jus.br/)) | coleta `recorte_remoto`; tabela `VOTACAO_CANDIDATO_MUNICIPIO` |
| Aptos, comparecimento, abstenções, brancos e nulos | TSE: `detalhe_votacao_munzona` 2018–2024 | `recorte_remoto`; tabela `COMPARECIMENTO_MUNICIPIO` |
| Candidaturas, partido e resultado | TSE: `consulta_cand` | tabelas `CANDIDATURA`, `PARTIDO` |
| PIB e PIB per capita; atividade principal; regiões imediatas | IBGE, PIB dos Municípios, base 2010–2023 ([FTP](https://ftp.ibge.gov.br/Pib_Municipios/2022_2023/base/)) | coleta `coleta_ibge pib`; `MUNICIPIO_ANO`, `MUNICIPIO` |
| População estimada (2018, 2020, 2024) | IBGE, SIDRA [6579](https://sidra.ibge.gov.br/tabela/6579) | `coleta_ibge indicadores`; `MUNICIPIO_ANO` |
| Renda domiciliar per capita e anos de estudo | IBGE, Censo 2022, SIDRA [10295](https://sidra.ibge.gov.br/tabela/10295) e [10062](https://sidra.ibge.gov.br/tabela/10062) | `coleta_ibge indicadores`; `MUNICIPIO_CENSO` |
| Nota ideológica dos partidos, rodada 2018 | Bolognesi, Ribeiro e Codato (2023), *Dados* 66(2), tabela 1 ([DOI](https://doi.org/10.1590/dados.2023.66.2.303)) | `dados/referencia/espectro_bolognesi_2023_rodada2018.csv` |
| Nota ideológica dos partidos, rodada 2022 | Bolognesi, Ribeiro, Codato e Silva (2025), *Opinião Pública* 31 ([DOI](https://doi.org/10.1590/1807-0191202531120)) | `dados/referencia/espectro_bolognesi_2025.csv` |
| IDHM municipal | PNUD, Atlas Brasil: **só até o Censo 2010** | não usado (ver limites) |

As duas tabelas de espectro estão no repositório **sem alteração**; o de-para das siglas
do TSE (renomeações e fusões) está ao lado, com a regra de cada linha.

---

## Q7 — viés político na linha do tempo

### Como medimos

- **Viés de um lugar numa eleição** = média das notas dos partidos (0 = esquerda,
  10 = direita), cada voto pesando a nota do partido do candidato votado. 1º turno.
- **Mesmo cargo para comparar:** deputado federal nas eleições gerais (2018 × 2022) e
  vereador nas municipais (2020 × 2024). Os dois são proporcionais: todos os partidos
  aparecem. Não comparamos deputado com vereador.
- **Duas réguas**, porque os especialistas reavaliaram os partidos entre 2018 e 2022
  (o PL foi de 7,78 para 8,80):
  - *régua de cada ano* (regra do grupo): 2018 e 2020 com a rodada de 2018; 2022 e 2024 com a de 2022;
  - *régua fixa*: a rodada de 2018 para os quatro anos. O que muda nela é só o voto do eleitor.
- **Região** = região geográfica imediata do IBGE (122 nos 6 estados), votos somados.
- Cobertura: 100% dos votos têm nota, menos o UP em 2020 (fundado em 2019, fora da rodada).

### Resultados

**Os 6 estados foram para a direita, e metade do movimento de 2018 a 2022 é do eleitor.**

| Média dos votos | 2018 (dep. fed.) | 2020 (vereador) | 2022 (dep. fed.) | 2024 (vereador) |
|---|---|---|---|---|
| régua de cada ano | 6,41 | 6,51 | 6,73 | 6,80 |
| régua fixa (2018) | 6,41 | 6,51 | 6,56 | 6,75 |

De 2018 a 2022 a média subiu 0,32 ponto: 0,15 com a régua fixa (o eleitor mudou) e
0,17 da reavaliação dos partidos. De 2020 a 2024, 0,25 com a régua fixa.

**Cidades:** dois terços foram para a direita nas duas comparações.

| | cidades | foram à direita (régua fixa) | mais de 0,25 à direita | mais de 0,25 à esquerda |
|---|---|---|---|---|
| 2018 → 2022 | 1.238 | 66,8% | 41,5% | 14,4% |
| 2020 → 2024 | 1.221 | 66,1% | 47,4% | 18,8% |

**Por estado** (régua de cada ano): todos à direita do meio, entre centro-direita e
direita. MA e SE tiveram o maior salto de 2018 a 2022 (MA 6,30 → 6,89; SE 6,20 → 6,97);
RS é o mais à esquerda em todos os anos (6,06 em 2018). De 2020 a 2024 os maiores
saltos foram do MA (6,22 → 6,62) e do RS (6,21 → 6,55).

**Regiões:** 94 das 122 regiões imediatas foram à direita de 2020 a 2024 (86 de 2018 a
2022). As maiores guinadas estão no Maranhão (São João dos Patos +1,45; Barreirinhas
+1,02; de 2018 a 2022, Codó +1,53 e Presidente Dutra +1,37). As poucas que foram à
esquerda estão no AM (Tefé −0,38, Eirunepé −0,35) e, de 2018 a 2022, no RS (São Borja
−0,65).

**O que puxou:** o PL foi de 5,4% para 14,5% dos votos para deputado federal (2018 →
2022) e de 5,2% para 9,4% dos votos para vereador (2020 → 2024); o Republicanos, de 4,3%
para 9,1% (deputado federal).

**Prefeitos:** em 813 das 1.221 cidades o partido do prefeito mudou de 2020 para 2024;
158 passaram de um partido à esquerda do meio da régua para um à direita, e 71 o
contrário (régua fixa). A nota média do partido do prefeito foi de 6,81 para 7,20.

**Capitais** (régua fixa, 2018 → 2024): Porto Alegre é a mais à esquerda (5,53 → 5,86);
Manaus a que mais oscilou (6,39; 6,81; 6,34; 6,94).

---

## Q3 — índices do município × quem vence

### Indicadores (como o DER do Davi define)

| Indicador | Cálculo | Ano |
|---|---|---|
| PIB per capita | IBGE | 2023 para a eleição de 2024 (o mais próximo sem passar do ano) |
| Eleitores / população | aptos (TSE) ÷ população estimada (IBGE) | 2024 ÷ 2024 |
| Isentos | (abstenções + brancos + nulos) ÷ aptos, prefeito, 1º turno | 2024 |
| Renda e escolaridade | renda domiciliar per capita e anos de estudo | Censo 2022, no lugar do IDHM |
| Perfil econômico | atividade com maior valor adicionado | 2021 (o IBGE não publicou 2022–2023) |
| Quem vence | partido do prefeito eleito, partido com mais vereadores, nota do voto (Q7) | 2024 |

### Resultados

**Partidos que mais venceram prefeituras em 2024:** União 248, MDB 244, PP 230, PL 132,
PDT 81, Republicanos 59.

**A riqueza da cidade quase não diz quem vence nem para que lado ela vota.**

| Quinto das cidades por PIB per capita | PIB per capita | Isentos | Nota do voto | Prefeitos mais eleitos |
|---|---|---|---|---|
| 1º (mais pobres) | R$ 7,7 mil a 18,1 mil | 18,3% | 6,70 | União 50, MDB 40, PL 39 |
| 2º | 18,2 mil a 32,4 mil | 19,4% | 6,89 | União 62, MDB 46, PP 45 |
| 3º | 32,5 mil a 44,6 mil | 20,6% | 6,75 | MDB 58, PP 56, União 42 |
| 4º | 44,6 mil a 63,1 mil | 20,7% | 6,87 | PP 60, MDB 42, União 38 |
| 5º (mais ricas) | 63,2 mil a 409 mil | 20,9% | 7,03 | MDB 57, União 56, PP 45 |

Correlação de postos (Spearman) com a nota do voto: PIB per capita 0,11; renda 0,00;
anos de estudo 0,01. Os partidos de esquerda (PT, PSB, PDT, PCdoB, PSOL, PV, Rede) têm
de 13% a 14% das prefeituras nos quatro primeiros quintos de renda e 10,5% no mais rico.

**O perfil econômico separa melhor os vencedores:**

| Perfil (IBGE 2021) | Cidades | PIB per capita (mediana) | Prefeitos mais eleitos |
|---|---|---|---|
| Agropecuária | 514 (GO, MT, RS) | R$ 48,6 mil | PP 121, MDB 121, União 94 |
| Administração pública | 402 (MA, AM, SE) | R$ 15,7 mil | União 91, MDB 64, PL 46 |
| Serviços e comércio | 189 | R$ 43,4 mil | PP 37, União 37, MDB 32 |
| Indústria e outros | 134 | R$ 65,4 mil | PP 28, MDB 27, União 26 |

Nas cidades em que o setor público é a maior atividade (as mais pobres), o União lidera;
nas do agronegócio, PP e MDB.

**Isentos andam com o tamanho da cidade, não com a riqueza:** correlação de postos
(Spearman) de 0,54 entre o número de eleitores e a taxa de isentos (a de Pearson é 0,22
porque a relação não é linear: sem as 13 cidades com mais de 200 mil eleitores, sobe
para 0,37); nas 20% de cidades com menos isentos (até
13,6%) a mediana é de 3,2 mil eleitores; nas 20% com mais (25,5% a 59,4%), 16,8 mil.

**Eleitores por habitante:** em 230 cidades (2024) há mais eleitores aptos que
habitantes estimados: GO 99, RS 89, SE 16, MA 15, MT 11 (nenhuma no AM). São cidades
pequenas: mediana de 3 mil habitantes, contra 10 mil no conjunto. O caso extremo é
Davinópolis (GO): 4.405 eleitores para 1.901 habitantes.

**É o cadastro eleitoral, não a estimativa de população.** Três testes:

- 227 das 230 têm mais eleitores que a população **contada** no Censo 2022 (SIDRA
  9606), não só que a estimativa. A estimativa de 2024 é quase igual ao Censo
  (Davinópolis: 1.901 estimados, 1.902 contados).
- Todas as 230 têm mais eleitores que **moradores de 15 anos ou mais** no Censo 2022
  (Davinópolis: 1.566). O excesso é grande demais para ser erro de estimativa.
- 121 delas já tinham mais eleitores que habitantes em 2020, antes do Censo.

O fenômeno é mais largo que as 230: em 835 das 1.238 cidades dos 6 estados (67%) há
mais eleitores aptos que moradores de 15 anos ou mais. A explicação compatível com os
dados é o **domicílio eleitoral**: a lei deixa votar onde a pessoa tem vínculo
residencial, familiar, profissional ou comunitário, não só onde mora
([Res. TSE 23.659/2021, art. 23](https://www.tse.jus.br/legislacao/compilada/res/2021/resolucao-no-23-659-de-26-de-outubro-de-2021);
[TSE, Temas Selecionados](https://temasselecionados.tse.jus.br/temas-selecionados/eleitor-do-alistamento-ao-voto/domicilio-eleitoral)).
Quem migra para a cidade grande pode manter o título na cidade de origem. O que os
dados **não** permitem afirmar: quantos desses eleitores moram fora, ou se há
irregularidade. A abstenção também não é maior nelas: 11,9% (mediana) nas 230, e entre
as cidades de menos de 5 mil habitantes, 11,3% nas que têm mais eleitores que
habitantes e 11,2% nas outras. A
consequência para a Q3: nas cidades pequenas, "eleitores por habitante" mede o vínculo
eleitoral com a cidade, não a participação dos moradores.

---

## Limites

- **IDHM:** o municipal só existe para os Censos de 1991, 2000 e 2010 (Atlas Brasil).
  Para 2024 usamos renda e anos de estudo do Censo 2022, que são duas das três
  dimensões do IDHM. Se o grupo quiser o IDHM 2010, é download manual do Atlas.
- **Período da Q3:** o PR #40 deixou a Q3 em 2008–2012 por causa do IDHM 2010, e anotou
  que era dedução a confirmar. A lista do professor diz "E.P. ou 2022, 2024, conforme
  houver dado", e para 2024 há todos os dados. Para 2008–2012 faltariam os votos e o
  comparecimento de 2008 e 2012 (pendência F10) e o IDHM 2010.
- **Espectro:** é a avaliação de especialistas, não do eleitor. Fusões levam a média
  dos partidos de origem (regra dos próprios autores para o União); o PRD, de 2023, é
  estimado. As duas réguas existem para separar o efeito da reavaliação.
- **Correlação não é causa.**

---

## Proposta para o site

**Q7 — "Para que lado cada lugar foi?"** (aba própria, ligada à aba Municípios)
1. Resposta em palavras + linha do tempo dos 6 estados (2018–2024), com as duas réguas.
2. Mapa por estado: cada cidade colorida pela mudança de 2020 para 2024 (à esquerda em
   vermelho, à direita em azul), clique abre a cidade.
3. Ranking das regiões imediatas que mais mudaram, com a linha de cada uma.
4. "O que puxou": partidos que mais ganharam e perderam votos.
5. Na página de cada cidade (aba Municípios): a linha do tempo do viés e a troca de
   partido do prefeito de 2020 para 2024.

**Q3 — "A cidade rica vota diferente?"**
1. Resposta em palavras: a riqueza quase não separa; o perfil econômico, sim.
2. Dispersão PIB per capita × nota do voto, cada ponto uma cidade, cor = partido do
   prefeito, com busca de cidade.
3. Barras por perfil econômico e por quinto de PIB: partidos que mais venceram.
4. Isentos: mapa e o gráfico tamanho da cidade × isentos.
5. Na página de cada cidade: um quadro "índices" (PIB per capita, eleitores por
   habitante, isentos, renda, perfil econômico) comparado com o estado.
