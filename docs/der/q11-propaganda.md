# Q11 — critério de canal de propaganda

Documento de decisão. Implementação em
[`sql/03_tipo_despesa.sql`](../../sql/03_tipo_despesa.sql) e no mart `mart_q11`.
Medido sobre o Piauí, 2014–2026: **367.004 despesas**, 81 tipos distintos, dos
quais 13 são propaganda — **47,8% de todo o gasto de campanha**.

## Duas normalizações antes de classificar

### ① O prefixo `BAIXA DE ESTIMAVEIS -`

Até 2016 o recurso estimável (o palanque emprestado, o carro cedido, a gráfica
que não cobrou) entrava como despesa própria com esse prefixo, criando um par
para quase toda categoria:

```
PUBLICIDADE POR MATERIAIS IMPRESSOS                        93.900 linhas
BAIXA DE ESTIMAVEIS - PUBLICIDADE POR MATERIAIS IMPRESSOS   2.962 linhas  (só 2014–2016)
```

De 2018 em diante o mesmo gasto vem sem prefixo, com a natureza marcada em outro
campo. **Não é duplicata — é a mesma despesa com outro nome.** Quem comparar 2016
com 2024 sem remover o prefixo parte a série no meio e conclui que o gasto com
impresso despencou, quando só mudou a rubrica. São 27 dos 81 tipos.

### ② Categorias extintas

`PUBLICIDADE POR PLACAS, ESTANDARTES E FAIXAS` só existe em 2014 e
`PUBLICIDADE POR TELEMARKETING` praticamente some depois. A categoria foi
extinta, **não o gasto** — ele passou a cair em adesivos e impressos. Mantidos
como canal próprio, com a ressalva declarada.

## Os dez canais

| Canal | Tipos do TSE que entram | R$ (mi) |
|---|---|---|
| `IMPRESSO` | publicidade por materiais impressos | 140,87 |
| `RUA` | militância e mobilização de rua, comícios, eventos de promoção | 49,66 |
| `RADIO E TV` | produção de programas de rádio, televisão ou vídeo | 33,01 |
| `ADESIVO` | publicidade por adesivos | 30,67 |
| `JINGLE` | produção de jingles, vinhetas e slogans | 12,19 |
| `DIGITAL` | impulsionamento de conteúdos, criação de páginas na internet | 11,48 |
| `CARRO DE SOM` | publicidade por carros de som | 8,32 |
| `PLACA E FAIXA` | placas, estandartes e faixas (só 2014) | 2,23 |
| `JORNAL E REVISTA` | publicidade por jornais e revistas | 0,57 |
| `TELEMARKETING` | publicidade por telemarketing | 0,07 |

**`RUA` é o canal discutível.** Militância, comício e evento são propaganda de
contato direto, não mídia paga. Ficam dentro porque a pergunta é "onde o
candidato investe em propaganda" e cabo eleitoral é o segundo maior investimento
do Piauí — mas o campo `ds_canal` permite excluí-los com um filtro se o grupo
preferir o recorte só de mídia.

**O que ficou de fora:** serviços advocatícios e contábeis, combustível, pessoal,
aluguel, encargos bancários. São custo de operação da campanha, não comunicação
com o eleitor.

## Resultado — participação de cada canal no gasto de propaganda

| ano | impresso | rádio e TV | rua | digital | total (mi) |
|---|---|---|---|---|---|
| 2014 | 45,1% | 26,0% | 6,4% | **0,6%** | 25,2 |
| 2016 | 35,3% | 11,0% | 15,3% | 0,2% | 22,7 |
| 2018 | 50,2% | 13,2% | 15,9% | 4,7% | 31,8 |
| 2020 | 48,1% | 14,7% | 10,4% | 3,2% | 32,4 |
| 2022 | 50,8% | 8,6% | 21,7% | 4,8% | 70,7 |
| 2024 | 54,9% | 6,1% | 16,6% | 4,3% | 58,4 |
| 2026 | 45,9% | 11,3% | 23,3% | **6,0%** | 47,9 |

Três leituras que o gráfico sustenta:

1. **O papel não morreu.** Material impresso é metade do gasto de propaganda em
   todos os anos e *cresceu* de 45% para 55% entre 2014 e 2024. A digitalização
   da campanha, no Piauí, não aconteceu onde se esperava.
2. **Rádio e TV caíram pela metade** (26% → 6,1%), e a queda é anterior ao
   digital — começa em 2016, antes de o impulsionamento existir.
3. **O digital saltou em 2018 e estacionou.** Vai de 0,2% para 4,7% num ano e
   fica ali. O salto tem data e causa: a Lei 13.488/2017 liberou o
   impulsionamento pago e criou a rubrica. Antes dela só havia "criação de
   páginas na internet".

### O digital é coisa de campanha grande

Percentual do gasto de propaganda em digital, 2018–2026, por cargo:

| cargo | % digital | gasto (mi) |
|---|---|---|
| Senador | 12,7% | 14,02 |
| Governador | 10,1% | 15,31 |
| Prefeito | 4,6% | 41,41 |
| Deputado estadual | 3,8% | 45,41 |
| Deputado federal | 3,6% | 75,62 |
| Vereador | 3,3% | 49,37 |

Quanto mais alto o cargo, maior a fatia digital — chega a 3× entre senador e
vereador. Vereador continua em impresso e corpo a corpo.

⚠️ **Investir em digital não prediz vitória.** Entre os eleitos a fatia digital é
4,11%, e entre os não eleitos, 4,97%. A diferença é pequena e vai no sentido
contrário do senso comum. Cuidado com causalidade: quem gasta mais em digital
tende a ser o candidato de campanha grande **e** o azarão sem estrutura de rua.

## Texto livre — `mart_q11_texto`

A view entrega uma linha por despesa de propaganda com `ds_despesa` preenchido,
para a nuvem de palavras. A tokenização fica no notebook, não no SQL.

⚠️ O campo é digitado pelo prestador de contas, sem padronização: abreviação,
caixa alta, erro de grafia e `\|` como separador de itens na mesma nota. Antes de
contar palavra, remover stopwords em português **e** os termos operacionais que
dominam sem informar nada (`SERVICOS`, `REFERENTE`, `PAGAMENTO`, `CONFECCAO`,
`MATERIAL`).
