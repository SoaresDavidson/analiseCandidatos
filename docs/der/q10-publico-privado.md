# Q10 — critério de classificação público × privado

Documento de decisão. O TSE **não** publica uma coluna "este dinheiro é público".
A classificação abaixo é contribuição nossa e precisa aparecer no relatório com a
justificativa — é justamente o tipo de escolha que o professor vai questionar.

Implementação em [`sql/02_fonte_recurso.sql`](../../sql/02_fonte_recurso.sql), sobre
as views de [`sql/01_staging.sql`](../../sql/01_staging.sql).
Medido sobre o Piauí, 2014–2026: **165.395 receitas**, 25 pares distintos.

## De onde sai a classificação

De um **par** de campos, nunca de um só:

| campo | pergunta que responde | exemplos |
|---|---|---|
| `ds_fonte` (`DS_FONTE_RECEITA`) | de que bolso veio | `FUNDO ESPECIAL`, `FUNDO PARTIDARIO`, `OUTROS RECURSOS` |
| `ds_origem` (`DS_ORIGEM_RECEITA` / `Tipo receita`) | quem entregou | `RECURSOS DE PESSOAS FISICAS`, `RECURSOS DE PARTIDO POLITICO` |

🚨 **Por que o par e não só a fonte:** em 2014 o campo `Fonte recurso` vale
`Nao especificado` em 91% das linhas. Quem classificar só por fonte perde o ano
inteiro da Q8 da Duda. E quem classificar só por origem chama de "partidário" o
Fundo Especial, que é orçamento da União repassado pelo partido — o erro que
inverte a resposta da Q10.

## As sete categorias

A regra é sequencial: a primeira que casar vence.

| # | `tp_origem` | Regra | Por quê |
|---|---|---|---|
| ① | `PUBLICO` | `ds_fonte` é `FUNDO ESPECIAL` ou `FUNDO PARTIDARIO` | FEFC e Fundo Partidário são orçamento da União. Chegam via partido, mas a origem é pública — a fonte prevalece sobre quem entregou. |
| ② | `PROPRIO` | `ds_origem` = `RECURSOS PROPRIOS` | Autofinanciamento não é público nem privado: não há doador. Misturar com privado infla a doação de terceiros. |
| ③ | `PRIVADO` | pessoas físicas, pessoas jurídicas, financiamento coletivo, doações pela internet | Doação privada identificada. PJ só existe até 2014 (ADI 4650). |
| ④ | `PARTIDARIO` | `ds_origem` = `RECURSOS DE PARTIDO POLITICO` **e** fonte não é fundo | Caixa do partido fora dos fundos públicos: mistura doação privada com sobra de fundo. O TSE não diz qual. Chutar contamina os dois lados da Q10. |
| ⑤ | `TRANSFERENCIA` | recursos de outros candidatos / comitês | O dinheiro já foi classificado na receita de quem doou. Contar como privado soma o mesmo real duas vezes no total do estado. |
| ⑥ | `RENDIMENTO` | rendimentos de aplicações financeiras | Juros do próprio caixa de campanha. 21 linhas, R$ 0,00 arredondado. |
| ⑦ | `NAO IDENTIFICADO` | origens não identificadas, ou fonte e origem nulas | 1.343 linhas, todas de valor zero. Declarado, não escondido. |

**Categorias ④, ⑤ e ⑥ são a razão de não haver só três.** O rascunho do
[`der.md`](der.md) previa `PUBLICO / PRIVADO / PROPRIO`, mas forçar as 14.925
linhas restantes nessas três caixas exigiria uma suposição que o dado não
sustenta. Para um gráfico de duas fatias, some ④ e ⑤ em privado e declare a
escolha; o campo continua lá para quem quiser o detalhe.

## Resultado — e o achado da Q10

Receita de campanha no Piauí, em milhões de reais:

| ano | PÚBLICO | PRIVADO | PRÓPRIO | PARTIDÁRIO | TRANSF. | % público |
|---|---|---|---|---|---|---|
| 2014 | 1,49 | 31,41 | 7,09 | 16,75 | 4,92 | **2,4%** |
| 2016 | 5,40 | 39,32 | 27,00 | 0,69 | 1,40 | 7,3% |
| 2018 | 49,86 | 9,51 | 4,72 | 0,64 | 0,71 | 76,1% |
| 2020 | 53,54 | 27,56 | 11,83 | 0,29 | 0,52 | 57,1% |
| 2022 | 106,43 | 12,89 | 4,71 | 4,58 | 0,16 | 82,6% |
| 2024 | 97,73 | 32,91 | 12,17 | 0,57 | 0,82 | 67,8% |
| 2026 | 120,08 | 7,54 | 3,21 | 1,30 | 0,15 | **90,8%** |

**O financiamento de campanha no Piauí passou de 2,4% público em 2014 para 90,8%
em 2026.** A virada acontece exatamente entre 2016 e 2018 — o STF derrubou a
doação de PJ em setembro de 2015 (ADI 4650) e o Fundo Especial de Financiamento
de Campanha foi criado em 2017. Some-se a isso o crescimento absoluto: a receita
total de 2026 é o dobro da de 2014.

Isso amarra a Q10 à Q8 da Duda: onde ela mostra a fonte privada secando, a Q10
mostra o que entrou no lugar. Vale combinar o mesmo recorte de anos nas duas.

⚠️ **Eleição geral × municipal.** 2014, 2018, 2022 e 2026 são gerais (poucos
candidatos, campanhas caras); 2016, 2020 e 2024 são municipais (milhares de
candidatos, campanhas baratas). Não comparem anos adjacentes sem dizer isso — o
percentual de público oscila em parte por causa do tipo de eleição, já que
vereador depende mais de recurso próprio.

## O que este critério não resolve

- **Fundo Partidário repassado em anos antigos.** Em 2014 só 38 linhas trazem
  `Fundo Partidario` explícito. Se havia mais fundo público escondido em
  `Nao especificado`, não há como saber pelo arquivo.
- **Doação triangulada.** Quando o partido repassa dinheiro de um doador privado,
  o par (fonte, origem) mostra o partido, não o doador. O arquivo
  `receitas_candidatos_doador_originario` (2018+) tem o doador final e liga por
  `SQ_RECEITA` — fica como refinamento possível, fora do escopo atual.
