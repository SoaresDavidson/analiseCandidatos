# Dinheiro público e propaganda (Q8 e Q9)

> **Q8.** Qual a diferença de sucesso entre candidatos que dependem mais de repasses públicos em relação àqueles que são financiados por outras fontes? **[E.P.]**
>
> **Q9.** Onde o candidato investe em propaganda (nuvem de palavras)? **[E.P.]**

Responsável pela apresentação: Enrico. Recorte: **AM, GO, MA, MT, RS e SE**, eleições ordinárias de **2018 a 2024**. A prestação de contas está no banco de 2018 a 2026, mas 2026 fica fora até o TSE publicar o resultado e a prestação final.

Este texto explica o que foi feito, por que cada decisão foi tomada, quais interfaces foram consideradas e o que os resultados permitem (e não permitem) dizer. Os números saem de [`notebooks/q8_q9_interface.ipynb`](../notebooks/q8_q9_interface.ipynb); os gráficos estão em [`output/q8_q9/`](../output/q8_q9/); as páginas estão em [`docs/q8-painel/`](q8-painel/) e [`docs/q9-painel/`](q9-painel/).

---

## 1. As duas perguntas em partes

| Pergunta | Parte | O que responde | Unidade | Medida |
|---|---|---|---|---|
| Q8 | **A** | Quanto do dinheiro de cada candidato é público? | candidato | % público = (FEFC + Fundo Partidário) ÷ receita total |
| Q8 | **B** | Quem depende mais de dinheiro público se elege mais ou menos? | candidato | taxa de eleição dos dois grupos, **dentro do cargo**, corte em 50% |
| Q8 | **C** | Onde, na escala de % público, a chance muda? | candidato | taxa de eleição em faixas de % público |
| Q8 | **D** | A conclusão depende do corte? | cargo × ano | diferença de taxa para cada corte de 5% a 100% |
| Q9 | **A** | Quanto vai para cada canal? | despesa | % do valor contratado por canal |
| Q9 | **B** | Eleitos e não eleitos investem diferente? | despesa | a mesma divisão, por grupo |
| Q9 | **C** | O que o candidato escreve que comprou? | despesa | frequência das palavras do texto livre, e o valor por trás delas |

A Q8 parece uma pergunta só, mas "depender mais" pede um corte, e o corte muda a resposta (parte D). A Q9 pede uma nuvem de palavras, mas a nuvem mede **frequência** e a pergunta é sobre **investimento**: por isso o valor por canal (A e B) vem junto.

---

## 2. O que foi feito, passo a passo

```
coleta (TSE, --uf) → staging (01–04) → marts (05) → views de interface (11, 12) → checagens → notebook → painel
```

### 2.1 Fontes

| Arquivo do TSE | Anos | O que traz |
|---|---|---|
| `prestacao_de_contas_eleitorais_candidatos_{ano}`: `receitas_candidatos_{ano}_{UF}.csv` | 2018–2024 | cada receita: valor, **fonte** (`DS_FONTE_RECEITA`: Fundo Especial, Fundo Partidário, outros) e **origem** (`DS_ORIGEM_RECEITA`: pessoa física, partido, próprio...) |
| o mesmo zip: `despesas_contratadas_candidatos_{ano}_{UF}.csv` | 2018–2024 | cada despesa: valor, **tipo** (`DS_ORIGEM_DESPESA`) e **descrição livre** (`DS_DESPESA`) |
| `consulta_cand_{ano}` | 2018–2024 | cargo, partido e resultado (`DS_SIT_TOT_TURNO`) |

Por que só de 2018 em diante: o Fundo Especial de Financiamento de Campanha (FEFC) começou em 2018, e o leiaute da prestação de contas antes disso é outro (`.txt`, colunas diferentes).

### 2.2 Coleta

O coletor (`scripts/coleta/coleta_tse.py prestacao_contas --uf AM,GO,MA,MT,RS,SE`) baixa o zip nacional e extrai só os arquivos das 6 UFs: 3,4 GB em vez dos ~21 GB do nacional.

### 2.3 Carga e classificação (já no `main`, PR #32)

| Script | O que faz |
|---|---|
| `01_staging.sql` | lê receitas e despesas das UFs extraídas; só eleições ordinárias |
| `02_fonte_recurso.sql` | classifica cada receita em PÚBLICO, PRIVADO, PRÓPRIO, PARTIDÁRIO, TRANSFERÊNCIA ou RENDIMENTO, pelo **par** fonte × origem (regra abaixo) |
| `03_tipo_despesa.sql` | agrupa os tipos de despesa em 8 canais de propaganda |
| `04_politico.sql` | candidaturas e resultado (`fl_eleito`) |
| `05_marts_enrico.sql` | `mart_q8` (uma linha por candidatura, com a receita aberta por origem) e `mart_q9` / `mart_q9_texto` |

**A regra do dinheiro público** (`02_fonte_recurso.sql`): se a **fonte** é Fundo Especial ou Fundo Partidário, a receita é pública, **qualquer que seja quem repassou**. O fundo chega ao candidato via partido ou via outro candidato, mas a origem do dinheiro é o orçamento da União. Só depois a regra olha a origem (pessoa física, próprio etc.).

### 2.4 Views de interface (esta entrega)

| Arquivo | View | O que faz |
|---|---|---|
| `11_q8_publico.sql` | `q8_candidatura` | **a base**: quem entra na Q8. Todas as outras leem daqui |
| | `q8_faixa` | candidatos e eleitos por ano, UF, cargo e **faixa de 5 pontos** de % público (0% e 100% exatos à parte). É o que o painel usa para recalcular qualquer corte |
| | `q8_taxa` | os dois grupos no corte de 50% |
| `12_q9_propaganda.sql` | `q9_despesa` | a base da Q9: despesas de propaganda com descrição |
| | `q9_canal` | valor, despesas e candidatos por canal |
| | `q9_termo` | as palavras do texto livre, já limpas (tabela, não view: a limpeza leva ~10 s) |

**Quem entra:**

- 2018, 2020, 2022 e 2024, as 6 UFs, eleição ordinária;
- vereador, prefeito, deputado estadual e federal, senador e governador. **Sem vices e suplentes** (herdam o resultado da chapa e quase não têm receita própria);
- só quem **foi a voto** (situação final preenchida);
- na Q8, só quem declarou **alguma receita** (sem receita não há % a medir).

Ficaram 4.368 candidaturas em 2018 (317 eleitos), 87.122 em 2020 (13.686), 4.567 em 2022 (311) e 74.866 em 2024 (13.719).

**A limpeza do texto (Q9)**, em `q9_termo`, nesta ordem:

1. maiúsculas e sem acento ("Serviço" e "SERVICO" viram a mesma palavra);
2. expressões que perdem o sentido se separadas viram um termo só: "cabo eleitoral", "carro de som", "redes sociais", "militância de rua";
3. quebra em palavras de 3 letras ou mais;
4. plural para singular por regra de terminação (santinhos → santinho, impressões → impressão, materiais → material, cartazes → cartaz);
5. cada palavra conta uma vez por despesa;
6. saem as **palavras vazias**: artigos e preposições, o vocabulário da prestação de contas ("serviço", "prestação", "contrato", "referente"), a própria eleição ("campanha", "eleitoral", o nome do cargo), medidas ("tamanho", "unidade", "milheiro") e abreviações cortadas ("serv", "prest", "ades"). A lista saiu dos 160 termos mais frequentes e está em `q9_palavra_vazia`.

Para exibir, uma macro devolve o acento ("militancia" → "militância", "mobilizacao" → "mobilização").

### 2.5 Checagens: `sql/validacao/q8_q9.sql`

| # | O que garante | Resultado |
|---|---|---|
| V1 | as faixas da Q8 somam a base | ok |
| V2 | "mais público" é exatamente quem está da faixa de 50% para cima | ok (pegou um erro: ver abaixo) |
| V3 | governador e senador: 1 eleito por UF (2 senadores em 2018) | ok |
| V4 | eleitos sem receita declarada | exceção conhecida (seção 6) |
| V5 | nenhuma candidatura com receita acima de R$ 20 milhões | 12 exceções conhecidas (seção 6) |
| V6 | % público entre 0 e 100 e coerente com a faixa | ok |
| V7 | 2026 fora de todas as views de interface | ok |
| V8 | canais e texto livre contam as mesmas despesas | exceção conhecida: despesas sem descrição |
| V9 | nenhuma palavra vazia sobrou na nuvem | ok |

A V2 achou um erro antes da entrega: o candidato com exatamente 50% de dinheiro público (R$ 30,64 de R$ 61,28) caía na faixa de baixo, porque a divisão em ponto flutuante dava 0,4999… A faixa agora usa divisão inteira em centavos.

---

## 3. Resultados e interpretação

### Q8. A. A dependência de dinheiro público muda muito com o cargo

| Cargo | Ano | Mediana do % público | Com 0% público | Com 100% público |
|---|---|---|---|---|
| Vereador | 2020 | 0% | 51% | 15% |
| Vereador | 2024 | 39% | 39% | 21% |
| Prefeito | 2020 | 53% | 19% | 9% |
| Prefeito | 2024 | 83% | 6% | 13% |
| Deputado estadual | 2018 | 57% | 25% | 13% |
| Deputado estadual | 2022 | 91% | 12% | 29% |
| Deputado federal | 2018 | 77% | 21% | 16% |
| Deputado federal | 2022 | 97% | 8% | 32% |

Gráfico: `q8_a_distribuicao.png`.

- **Vereador é bimodal**: um bloco grande com 0% (o partido não repassou nada de fundo) e outro com 100%. Em 2020, metade dos vereadores não recebeu nenhum real público.
- **De 2018 para 2022 e de 2020 para 2024 a dependência subiu em todo cargo.** Em deputado federal 2022, a mediana é 97%.
- Consequência: o corte de 50% separa grupos de tamanhos muito diferentes. Em deputado federal 2022, "mais outras fontes" são só 13% dos candidatos.

### Q8. B. Os dois grupos (corte de 50%)

| Cargo | Ano | ≥ 50% público | < 50% público | Diferença | p (qui²) |
|---|---|---|---|---|---|
| Vereador | 2020 | 6,1% (1.553/25.456) | 18,8% (10.904/57.853) | −12,7 p.p. | < 0,001 |
| Vereador | 2024 | 14,0% (4.687/33.411) | 20,4% (7.802/38.325) | −6,4 p.p. | < 0,001 |
| Prefeito | 2020 | 26,0% (515/1.981) | 39,0% (714/1.832) | −13,0 p.p. | < 0,001 |
| Prefeito | 2024 | 38,7% (945/2.440) | 41,3% (285/690) | −2,6 p.p. | 0,22 |
| Deputado estadual | 2018 | 4,5% (75/1.663) | 9,3% (135/1.456) | −4,8 p.p. | < 0,001 |
| Deputado estadual | 2022 | 5,1% (113/2.195) | 13,7% (96/700) | −8,6 p.p. | < 0,001 |
| Deputado federal | 2018 | 10,1% (73/722) | 4,1% (17/417) | **+6,0 p.p.** | < 0,001 |
| Deputado federal | 2022 | 5,6% (78/1.381) | 6,1% (12/198) | −0,5 p.p. | 0,81 |

Gráfico: `q8_b_taxa_grupos.png`. Senador e governador têm de 6 a 22 candidatos no grupo "outras fontes": não dá para testar.

- Em **vereador, prefeito 2020 e deputado estadual**, quem depende mais de dinheiro público se elege **menos**.
- Em **deputado federal 2018**, o contrário.
- Em **prefeito 2024 e deputado federal 2022**, nenhuma diferença.

**Por que separar por cargo:** a taxa geral de vereador (2024) é 17%, a de prefeito (2024) 39%, a de deputado federal (2022) 6%. Misturar cargos mistura essas taxas.

### Q8. C. A relação não é uma reta

Taxa de eleição (%) por faixa de % público, nos cargos com candidatos suficientes:

| % público | Vereador 2020 | Vereador 2024 | Prefeito 2020 | Prefeito 2024 | Dep. est. 2022 | Dep. fed. 2018 |
|---|---|---|---|---|---|---|
| 0% exato | 18,8 | 18,5 | 28,8 | 14,1 | 7,8 | 2,5 |
| 0–10 | **26,7** | **31,7** | 42,9 | 43,5 | 21,7 | 8,9 |
| 20–30 | 17,7 | 24,3 | 46,5 | 54,9 | 21,3 | 3,7 |
| 40–50 | 12,6 | 20,5 | 45,1 | 50,5 | 16,9 | 7,0 |
| 60–70 | 11,2 | 20,1 | 36,9 | 45,3 | 10,2 | **14,8** |
| 80–90 | 8,0 | 17,2 | 25,6 | 42,9 | 7,6 | 12,9 |
| 100% exato | **3,1** | **9,5** | 5,8 | 21,2 | 0,4 | 1,1 |

Gráfico: `q8_c_taxa_faixa.png` (todas as faixas no notebook).

- **Vereador:** a maior taxa está na faixa de 0 a 10% público, e a taxa cai faixa a faixa até a de 100%.
- **Prefeito e deputado estadual:** um "morro": sobe da faixa de 0% para as faixas baixas e desce depois.
- **Deputado federal 2018:** o inverso: salta para 13% a 16% nas faixas entre 60% e 100% (o 100% exato fica de fora, com 1%).
- **A faixa de 100% é a pior em quase todo cargo.** São campanhas pequenas: quem só tem dinheiro público teve receita mediana de R$ 3.168 (vereador 2024), contra R$ 5.144 de quem misturou fontes. O dinheiro público, sozinho, não traz a rede de doadores de uma candidatura competitiva.
- **A faixa de 0% também fica abaixo da seguinte.** Também são campanhas pequenas: receita mediana de R$ 1.900 (vereador 2024).

### Q8. D. O corte muda a conclusão?

Diferença (taxa ≥ corte − taxa < corte), em p.p., para cada corte de 5% a 95%. Gráfico: `q8_d_sensibilidade.png`.

- **Vereador e deputado estadual:** negativa em praticamente todo corte (prefeito 2020 também, exceto nos cortes de 5% e 10%). A conclusão "quem depende mais de dinheiro público se elege menos" **não depende do corte**, só o tamanho dela.
- **Prefeito 2024:** a linha **cruza o zero** perto de 40%. Corte de 5%: "mais público" se elege 26 p.p. mais; corte de 90%: 15 p.p. menos.
- **Deputado federal:** positiva em 2018 em quase todo corte, perto de zero em 2022.

### Q9. A. Impresso e rua levam mais de 60% do dinheiro

R$ 2,03 bilhões em propaganda contratada nas 6 UFs, de 2018 a 2024 (294 mi, 367 mi, 666 mi e 706 mi). Divisão no período todo:

| Canal | % do valor |
|---|---|
| Impresso (santinho, panfleto, praguinha) | 35,6 |
| Rua (cabo eleitoral, militância, eventos) | 25,9 |
| Rádio e TV | 14,3 |
| Adesivo | 11,9 |
| Digital (impulsionamento, páginas) | 6,5 |
| Jingle | 2,4 |
| Carro de som | 2,1 |
| Jornal e revista | 1,2 |

Gráfico: `q9_a_canal.png`.

- **Impresso e rua** lideram em vereador, prefeito e deputados.
- **Rádio e TV** lideram nas majoritárias estaduais: governador 2018 (57%) e 2022 (36%), senador (31%). Pesa em prefeito (20% a 25%).
- **Digital** cresce em todo cargo (deputado estadual: 3,7% em 2018 → 8,7% em 2022; vereador: 5,7% em 2020 → 6,7% em 2024), mas segue pequeno no valor.

### Q9. B. Eleitos põem menos em rua e mais em material

| Canal | Vereador 2024: eleitos | não eleitos | Dep. federal 2022: eleitos | não eleitos |
|---|---|---|---|---|
| Impresso | 42,1 | 37,5 | 44,1 | 36,8 |
| Rua | **29,6** | **39,0** | **23,5** | **31,7** |
| Adesivo | 12,7 | 10,1 | 16,0 | 10,7 |
| Digital | 7,6 | 6,3 | 6,8 | 8,4 |

Gráfico: `q9_b_eleitos.png`.

- Em vereador e deputados, nos dois anos, **os eleitos põem uma fatia maior em adesivo e impresso e menor em rua.** A campanha pequena é, proporcionalmente, mais gente e menos material. Em prefeito, não: os eleitos põem um pouco **mais** em rua (2024: 23,2% × 21,4%) e menos em rádio e TV.
- A diferença maior está no **quanto**. Gasto mediano em propaganda: deputado federal 2022 eleito R$ 1,08 milhão × não eleito R$ 41 mil (26 vezes menos); vereador 2024, R$ 2.500 × R$ 2.000.

### Q9. C. A nuvem: adesivo, cabo eleitoral, santinho

As palavras mais escritas, em todos os cargos: **adesivo, cabo eleitoral, santinho, militância, perfurado, bandeira, rua, mobilização, colinha, panfletagem, impulsionamento**. Gráficos: `q9_c_nuvem.png`, `q9_c_nuvem_eleitos.png`.

- Em vereador 2024, "adesivo" está em 21% das despesas (80.634), e "cabo eleitoral" em 52.165.
- As nuvens de eleitos e não eleitos são quase iguais. "Impulsionamento" aparece um pouco maior entre os não eleitos.
- **Frequência não é valor.** As palavras mais caras por despesa (citadas em ao menos 200) são "consultoria" (R$ 38,6 mil em média) e "direção" (R$ 31 mil), seguidas de "televisão", "programa", "marketing" e "rádio" (R$ 18 a 23 mil). Em vereador 2024, "adesivo" tem média de R$ 513.

---

## 4. Interface: alternativas consideradas

A aula de 15/10 discute alternativas de interface. Para cada pergunta, as opções que consideramos e por que escolhemos uma.

### Q8

| Alternativa | A favor | Contra |
|---|---|---|
| **1. Corte fixo em 50%**, duas barras | simples, responde a pergunta literal ("depende mais") | esconde que a conclusão depende do corte (prefeito 2024) e junta 0% com 49% |
| **2. Corte na mediana do cargo** | grupos do mesmo tamanho, compara melhor | o significado muda por cargo: em deputado federal 2022 a mediana é 97%, e "depender mais" vira "depender totalmente" |
| **3. Faixas + corte ajustável** (escolhida) | mostra a forma da relação (o "morro") e deixa o usuário testar qualquer corte; 50% e a mediana viram botões | mais complexa; exige explicar o gráfico de sensibilidade |

**Escolha: a 3**, com o corte de 50% como padrão. O controle deslizante é a interação da demonstração ao vivo: em prefeito 2024, arrastar de 10% para 90% inverte a conclusão na frente da turma. Clicar numa barra do gráfico de faixas move o corte para lá.

### Q9

| Alternativa | A favor | Contra |
|---|---|---|
| **1. Nuvem de palavras** | é o que a pergunta pede; mostra o vocabulário real ("santinho", "praguinha", "colinha") que o tipo de despesa do TSE não mostra | mede frequência, não valor; tamanho de fonte é difícil de comparar com precisão |
| **2. Barras por canal** | mede o investimento (valor); compara bem eleitos × não eleitos | 8 categorias fixas do TSE; perde o detalhe do que se comprou |
| **3. Treemap de valor (canal → palavra)** | junta as duas: área = valor | o valor de uma palavra não soma dentro do canal (uma despesa cita várias palavras), então a área mentiria |

**Escolha: 1 + 2 lado a lado.** As barras respondem "quanto e onde"; a nuvem responde "o quê". O treemap foi descartado porque a soma de valor por palavra conta a mesma despesa várias vezes. Interações: clicar num canal filtra a nuvem; clicar numa palavra mostra o valor por trás dela, o valor médio, os canais em que aparece e se eleitos a usam mais.

---

## 5. Resumo em quatro frases (para a conclusão)

1. **Depender mais de dinheiro público está associado a se eleger menos** para vereador, deputado estadual e prefeito 2020 (vereador 2020: 6% × 19%), em praticamente qualquer corte; para deputado federal 2018 é o contrário, e em prefeito 2024 a conclusão depende do corte.
2. **Quem só tem dinheiro público (100%) é o grupo que menos se elege**: são campanhas pequenas, sem rede de doadores.
3. **Impresso e rua levam mais de 60% do dinheiro de propaganda**; rádio e TV dominam só nas eleições de governador e senador; digital cresce, mas segue pequeno.
4. **Eleitos gastam muito mais e, nos cargos proporcionais, põem uma fatia menor em rua e maior em material**; no texto, a campanha típica é adesivo, cabo eleitoral e santinho.

---

## 6. Exceções nos dados (já tratadas)

| Checagem | Casos | O que é | Como foi tratado |
|---|---|---|---|
| V4 | eleitos sem receita: 343 vereadores e 20 prefeitos em 2020, 164 vereadores e 2 prefeitos em 2024, 1 senador em 2018, 1 deputado estadual em 2022 | prestação sem receita lançada (contas não prestadas ou entregues zeradas) | ficam fora da Q8. São 2,7% dos vereadores eleitos em 2020 |
| V5 | 12 vereadores do AM em 2020 | R$ 207 milhões cada em "repasse de partido / outros recursos" (soma R$ 2,49 bi, mais que todo o resto de 2020). Erro de digitação | ficam na base, no grupo "outras fontes" (12 de 87 mil, não mudam a taxa); somas de valor os excluem |
| V8 | 2 despesas em 2022, 239 em 2024 | despesa de propaganda sem descrição | entram no valor por canal, não na nuvem |

---

## 7. Ressalvas para dizer na apresentação

1. **Cargo é o principal confusor.** Toda comparação é dentro do cargo.
2. **Associação não é causa.** O partido escolhe para quem vai o fundo, e concentra em quem tem chance; quem se banca sozinho tem renda e rede própria. A Q8 não separa esses efeitos.
3. **O corte é uma escolha.** O painel mostra que em alguns cargos ele muda a conclusão.
4. **Despesa contratada, não paga.** A Q9 usa o que o candidato contratou.
5. **Texto livre.** O mesmo serviço aparece como "militância", "mobilização" ou "ativista"; a limpeza junta só plural, acento e quatro expressões.
6. **Frequência não é valor** na nuvem.
7. **Fora da análise:** 2026, vices, suplentes, quem não foi a voto e, na Q8, quem não declarou receita.

---

## 8. O que precisa saber responder sem consultar

- O que conta como dinheiro público, e por que o fundo repassado por outro candidato também conta?
- Por que a taxa de eleição e não a contagem de eleitos? Por que dentro do cargo?
- Por que o painel deixa mudar o corte? Dê o exemplo de prefeito 2024.
- Por que a faixa de 100% público se elege tão pouco?
- Por que a nuvem não basta para responder "onde investe"?
- Por que o valor de uma palavra não soma entre palavras (e por isso não há treemap)?
- O que são os 12 vereadores do AM com R$ 207 milhões?

---

## 9. Como rodar

**Só ver:** o notebook já foi salvo com os gráficos e tabelas, e as páginas abrem direto no navegador (`docs/q8-painel/index.html` e `docs/q9-painel/index.html`).

**Rodar do zero.** O banco (`dados/processed/tse.duckdb`) não vai para o git.

1. Colete com `--uf`. Se os zips já estiverem baixados, só extrai os arquivos das 6 UFs.
   ```bash
   uv run python -m scripts.coleta.coleta_tse candidatos prestacao_contas --uf AM,GO,MA,MT,RS,SE
   ```
   ⚠️ O staging lê **todos** os `receitas_candidatos_{ano}_??.csv` da pasta. Se houver arquivos de outra UF extraídos antes (por exemplo o PI, do recorte antigo), tire-os da pasta, senão entram nas views.
2. Carregue (≈ 2 min) e rode as checagens e o notebook:
   ```bash
   uv run scripts/carregar_staging.py
   uv run jupyter lab notebooks/q8_q9_interface.ipynb
   ```
3. Regere o painel depois de mudar a carga ou as views:
   ```bash
   uv run python scripts/gerar_painel_q8_q9.py
   ```

---

## 10. Painel interativo

Uma página por pergunta, no visual do painel do grupo (inspirado no site de resultados do TSE): a resposta em linguagem simples primeiro, os detalhes técnicos em blocos recolhidos no fim. Filtros no topo: Estado, eleição (2018 a 2024) e cargo.

- **Q8 (`docs/q8-painel/index.html`):** chance de se eleger de quem depende do fundo público (metade ou mais da campanha) × outras fontes, com o teste qui-quadrado; barras em 4 faixas (nada, menos da metade, metade ou mais, tudo do fundo); panorama de todos os cargos e anos (clique num quadro para abri-lo); bloco recolhido para mudar o corte (5% a 100%) e ver se a conclusão muda; tabela por faixa de 5%.
- **Q9 (`docs/q9-painel/index.html`):** de cada R$ 100 de propaganda, quanto vai para cada canal; nuvem de palavras com filtro eleitos / não eleitos e por canal (clique numa palavra para ver o dinheiro por trás dela); blocos recolhidos com eleitos × não eleitos e a comparação com a eleição anterior.

Arquivos:

- `docs/q8-painel/modelo.html` e `docs/q9-painel/modelo.html`: as páginas, com `__DADOS__` no lugar dos dados.
- `scripts/gerar_painel_q8_q9.py`: lê as views do banco e gera os dois `index.html` (Q8 ≈ 50 KB, Q9 ≈ 1,1 MB), cada um só com os seus dados. A nuvem guarda as 40 palavras mais citadas de cada combinação de filtros.
