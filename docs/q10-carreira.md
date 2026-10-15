# Sobrevivência da carreira do político (Q10)

> **Q10.** Dado certo político, como foi a sobrevivência de sua carreira (linha do tempo de participações, vitórias, derrotas e reeleições)? **[Máximo possível]**

Responsáveis: Eduardo e Enrico. Recorte: **AM, GO, MA, MT, RS e SE**, eleições ordinárias de **2002 a 2024**, as 12 eleições com título de eleitor no arquivo do TSE. 2026 está carregado, mas fica fora até o resultado final (`fl_divulgado`, #15).

Este texto explica o que foi feito, por que cada decisão foi tomada, quais interfaces consideramos e o que os resultados permitem (e não permitem) dizer. Os números saem de [`notebooks/q10_carreira.ipynb`](../notebooks/q10_carreira.ipynb); os gráficos estão em [`output/q10/`](../output/q10/); a página interativa é [`docs/q10-painel/index.html`](q10-painel/index.html).

---

## 1. A pergunta são quatro perguntas

"Sobrevivência da carreira" só tem sentido se a carreira de uma pessoa puder ser comparada com a das outras. Por isso a pergunta foi quebrada em uma parte individual e três de contexto:

| Parte | Pergunta | Unidade de análise | Medida |
|---|---|---|---|
| **A** | Como foi a carreira **deste** político? | **pessoa** | linha do tempo: ano, cargo, partido, lugar e resultado de cada candidatura |
| **B** | Quanto tempo uma carreira dura depois da primeira vitória? | **turma** (cargo da 1ª vitória) | % que ainda tem mandato (ou ainda disputa) 4, 8, 12 e 16 anos depois |
| **C** | Quem se elege tenta de novo? E consegue? | **eleitos de um ano** × cargo | tentaram, reeleitos e sucesso de quem tentou, no ciclo seguinte |
| **D** | Quem sobreviveu mais? Carreira longa é comum? | **pessoa** | ranking por vitórias, anos ou reeleições; distribuição do nº de eleições |

---

## 2. O que foi feito, passo a passo

```
coleta (TSE, consulta_cand por UF) → carga (CANDIDATURA, POLITICO) → views q10_* → checagens → notebook → painel
```

### 2.1 Fonte

Uma só: o **`consulta_cand`** do TSE, de 2002 a 2026, só as 6 UFs. É o único arquivo que volta até 2002 e traz tudo o que a pergunta pede: quem é a pessoa (título de eleitor), o ano, o cargo, o lugar, o partido e a situação final (`DS_SIT_TOT_TURNO`).

### 2.2 Coleta

```bash
uv run python -m scripts.coleta.coleta_tse candidatos historico --uf AM,GO,MA,MT,RS,SE
```

Baixa os zips do TSE e extrai só os arquivos das 6 UFs (≈ 1,5 GB extraídos).

### 2.3 Carga: `sql/04_politico.sql`

Grava `CANDIDATURA` (uma linha por candidatura) e `POLITICO` (uma linha por pessoa). Duas decisões desta etapa importam para a Q10:

- **A pessoa é o título de eleitor.** Nunca o CPF: em 2024 o TSE gravou todos como `-4` (LGPD), e usar CPF juntaria todos os candidatos de 2024 numa pessoa só. Nem o `sq_candidato`: ele identifica a candidatura, não a pessoa, e antes de 2010 se repete entre pessoas.
- **Suplementares ficam separadas** (`fl_suplementar`). São a mesma eleição refeita, não um novo ciclo da carreira.

### 2.4 Views: `sql/07_q10_carreira.sql`

| View | Grão | Parte | O que faz |
|---|---|---|---|
| `q10_candidatura` | candidatura | todas | **a base**: resultado (eleito, não eleito, sem resultado), tentou reeleição, reeleito, `fl_divulgado` |
| `q10_linha_do_tempo` | pessoa × ano | A | a candidatura principal de cada ano, com nº da participação, troca de partido, troca de cargo e anos parado |
| `q10_carreira` | pessoa | A, D | o resumo: participações, vitórias, derrotas, reeleições, maior sequência de vitórias, anos de carreira e a trajetória numa coluna |
| `q10_curva_sobrevivencia` | UF × cargo da 1ª vitória × ciclo | B | a turma, quantos ainda eleitos e quantos ainda disputando 4, 8, 12 e 16 anos depois (**nova nesta entrega**: antes a curva era calculada no navegador) |
| `q10_sobrevivencia` | ano × UF × cargo | C | eleitos, tentaram, reeleitos e seguiram na política |

As consultas prontas para um político escolhido (linha do tempo, resumo e contexto) estão em `sql/consultas/q10_carreira.sql`:

```bash
uv run scripts/consultar.py sql/consultas/q10_carreira.sql
```

### 2.5 O que cada palavra da pergunta vira em dado

| Termo | Definição |
|---|---|
| **Político** | uma pessoa = um título de eleitor |
| **Participação** | uma candidatura numa eleição ordinária. Se a pessoa tem duas no mesmo ano (0,3% dos casos), fica a principal: a que elegeu; senão, a que foi à urna; senão, a de maior cargo |
| **Vitória** | situação final ELEITO, ELEITO POR QP, ELEITO POR MÉDIA ou MÉDIA |
| **Derrota** | foi à urna e não se elegeu (NÃO ELEITO ou SUPLENTE) |
| **Sem resultado** | não chegou à urna (registro negado, indeferido, renúncia, cassação, substituição) ou o arquivo não traz o desfecho. Conta como participação, **não** como derrota: quem teve o registro negado não perdeu a eleição |
| **Reeleição** | eleito para o **mesmo cargo**, no **mesmo lugar** (município ou UF), no **ciclo anterior** desse cargo (4 anos, ou 8 para senador). Vereador que vira prefeito subiu de cargo, não se reelegeu |
| **Sobrevivência** | ainda ter mandato (ou ainda disputar) N anos depois da primeira vitória |

### 2.6 Checagens: `sql/validacao/q10_carreira.sql`

| # | O que garante | Resultado |
|---|---|---|
| V1 | uma linha por pessoa × ano na linha do tempo | ok |
| V2 | participações = vitórias + derrotas + sem resultado | ok |
| V3 | todo reeleito é eleito e tinha mandato; ninguém tem tantas reeleições quanto vitórias | ok |
| V4 | entre duas participações passam 2, 4, 6... anos | ok |
| V5 | 1 governador por UF e ano; 1 senador (2 em 2002, 2010 e 2018) | 1 exceção real (seção 6) |
| V6 | nenhum município com mais de 1 prefeito eleito no mesmo ano | ok |
| V7 | `fl_divulgado` só esconde 2026, e "aguardando 2º turno" só aparece em 2026 | ok |
| V8 | parte C: reeleitos ⊆ tentaram ⊆ seguiram ⊆ eleitos | ok |
| V9 | parte B: ainda eleitos ⊆ ainda disputando ⊆ turma, e a turma não cresce de um ciclo para o outro | ok |
| V10 | eleitos sem título válido (ficam fora) | 16 exceções reais |
| V11 | o mesmo título com nomes de pessoas diferentes | 235 exceções reais |

Ficaram **564.362 candidaturas** de 2002 a 2024, de **355.281 pessoas**; 51.347 delas se elegeram ao menos uma vez. Ninguém passa de 12 participações, o máximo possível em 12 eleições.

---

## 3. Resultados e interpretação

### A. Uma carreira, eleição por eleição

Três carreiras que a escada conta sem precisar de tabela (`output/q10/a_escada_exemplos.png`):

- **Ronaldo Caiado (GO):** 6 vitórias em 6 eleições. Três mandatos seguidos de deputado federal (2 reeleições), senador em 2014, governador em 2018, reeleito em 2022: 3 reeleições. A ida a governador em 2018 **não** é reeleição, porque o cargo mudou. Passou por PFL, DEM e União.
- **Flávio Dino (MA):** deputado federal em 2006; perde a prefeitura de São Luís em 2008 e o governo em 2010; vence o governo em 2014, é reeleito em 2018 e vai ao Senado em 2022. Duas derrotas seguidas não encerraram a carreira.
- **Eduardo Leite (RS):** perde para vereador (2004) e para deputado estadual (2010), mas vence vereador em 2008, prefeito de Pelotas em 2012, governador em 2018 e se reelege em 2022. O salto de 2012 a 2018 aparece no desenho: ele não tentou a reeleição em Pelotas.

### B. A maioria das carreiras acaba no primeiro mandato

% da turma que ainda tem mandato (em qualquer cargo) depois da primeira vitória. Só quem estreou de 2006 em diante:

| 1ª vitória como | +4 anos | +8 | +12 | +16 |
|---|---|---|---|---|
| Vereador | 42,6 | 26,7 | 18,1 | 13,6 |
| Prefeito | 47,6 | **5,3** | 11,5 | 10,2 |
| Deputado estadual | 64,8 | 46,8 | 30,0 | 23,8 |
| Deputado federal | 66,7 | 40,0 | – | – |

- De cada 100 vereadores que ganham a primeira eleição, **43 ainda estão eleitos 4 anos depois e 27 depois de 8**.
- **O prefeito despenca aos 8 anos** (48% → 5%): a Constituição permite uma só reeleição seguida. A curva **volta a subir** aos 12 anos: é quem volta depois do intervalo obrigatório. Esse degrau é regra do jogo, não erro de dado.
- Deputado sobrevive mais: 65% dos estaduais estreantes ainda têm mandato 4 anos depois.
- **Ainda disputando:** 80% dos vereadores estreantes disputam de novo 4 anos depois, mas só 43% vencem. A distância entre as duas curvas é quem tentou e perdeu.
- Por UF o padrão se repete; Sergipe tem as carreiras mais longas (32% dos vereadores ainda eleitos aos 8 anos) e Mato Grosso as mais curtas (23%).

### C. Quem se elege quase sempre tenta de novo, e pouco mais da metade consegue

Eleitos de 2002 a 2020 (os de 2022 dependem de 2026), somando as 6 UFs:

| Cargo | Eleitos | Tentaram | Reeleitos | Sucesso de quem tentou |
|---|---|---|---|---|
| Vereador | 60.948 | 71,8% | 40,5% | 56,5% |
| Prefeito | 6.146 | 50,9% | 31,7% | 62,3% |
| Deputado estadual | 1.050 | 71,5% | 48,9% | 68,3% |
| Deputado federal | 450 | 74,4% | 54,2% | 72,8% |
| Senador | 36 | 50,0% | 27,8% | 55,6% |
| Governador | 30 | 53,3% | 30,0% | 56,2% |

- O "tentaram" do prefeito é baixo porque **quem está no segundo mandato não pode tentar**: no primeiro mandato, 66% tentam; no segundo, 0,4%.
- O sucesso do prefeito que tenta cresceu muito: **82%** dos prefeitos de 2020 que tentaram se reelegeram em 2024 (520 de 630).
- Quem chega a deputado tende a ficar: tenta mais e consegue mais.
- Senador e governador têm 30 a 36 eleitos em 20 anos; a linha pula de um ano para o outro e não sustenta conclusão.

### D. Carreira longa é rara

- Dos 355 mil candidatos, **67% disputaram uma única eleição**; 14% chegaram a 3 eleições e 1,2% a 6 ou mais.
- Entre quem já se elegeu, 43% venceram 2 eleições ou mais, 7% venceram 4 ou mais e 0,6% venceram 6 ou mais.
- O topo do ranking (Pedro Fernandes e Rigo Teles, do MA, com 7 vitórias) são deputados que viraram prefeitos. A carreira mais longa costuma atravessar os dois níveis, e só aparece porque a base junta eleições gerais e municipais.

---

## 4. Interface: alternativas consideradas

A aula de 15/10 discute alternativas de interface. Para cada parte, as opções que consideramos e por que escolhemos uma.

### Como ligar as candidaturas da mesma pessoa (modelagem, antes da interface)

| Alternativa | A favor | Contra |
|---|---|---|
| **CPF** | é o identificador "natural" de pessoa | em 2024 o TSE gravou todos como `-4`; juntaria 90 mil candidatos numa pessoa |
| **`sq_candidato`** | é a chave da candidatura no TSE | muda a cada eleição, e antes de 2010 se repete entre pessoas |
| **Nome + data de nascimento** | não depende de documento | grafia muda (acento, nome de casada, abreviação); homônimos |
| **Título de eleitor** (escolhida) | preenchido em mais de 99% das linhas em todos os anos (99,25% no pior, 2018); estável | 235 títulos com erro de digitação juntam duas pessoas (V11) |

### A. Um político

| Alternativa | A favor | Contra |
|---|---|---|
| **1. Tabela de candidaturas** (ano, cargo, partido, resultado) | exata e simples; é o que a consulta SQL devolve | o padrão da carreira (subiu de cargo? parou? voltou?) não salta aos olhos |
| **2. Linha do tempo única**, um ponto por eleição colorido pelo resultado | mostra vitória × derrota e os intervalos | troca de cargo some: vereador eleito e governador eleito ficam iguais |
| **3. Barras de mandato (Gantt)**, uma barra do início ao fim de cada mandato | mostra o tempo no poder, inclusive os 8 anos de senador | derrota e "sem resultado" não têm duração e somem; mandatos de níveis diferentes se sobrepõem |
| **4. Escada por cargo** (escolhida): uma faixa por cargo, da câmara ao governo, com a linha ligando as candidaturas | a subida e a descida de cargo viram forma; derrota, reeleição e troca de partido aparecem juntas | precisa de legenda; carreira com muitos cargos fica alta |

**Escolha: a 4**, com a tabela da alternativa 1 recolhida embaixo, para quem quer conferir. A busca aceita **nome de urna e nome civil** (Caiado é "Ronaldo Caiado" na urna e "Ronaldo Ramos Caiado" no registro). Os atalhos (Caiado, Flávio Dino, Eduardo Leite) são a interação da demonstração ao vivo.

### B. Quanto a carreira dura

| Alternativa | A favor | Contra |
|---|---|---|
| **1. Histograma do nº de eleições disputadas** | simples; responde "quantos disputaram N vezes" | mistura quem estreou em 2004 com quem estreou em 2020 e ainda não teve tempo de disputar mais: subestima as carreiras recentes |
| **2. Curva de sobrevivência por turma** (escolhida) | cada ponto só usa as turmas que já chegaram lá, o que resolve o problema do tempo; separa o efeito do cargo (o degrau do prefeito) | conceito menos conhecido; precisa da frase "de cada 100 que ganham..." |
| **3. Fluxo entre cargos (Sankey)**, vereador → prefeito → deputado | mostra para onde as carreiras vão | com 13 cargos e 12 eleições, os fluxos pequenos ficam ilegíveis |

**Escolha: a 2**, com o botão "ainda eleito × ainda disputando". O histograma da alternativa 1 ficou no notebook (parte D) como contexto.

### C. Reeleição

| Alternativa | A favor | Contra |
|---|---|---|
| **1. Uma taxa só** (reeleitos ÷ eleitos) | um número por cargo | mistura "não quis" com "não conseguiu" |
| **2. Três números** (escolhida): tentaram, reeleitos, sucesso de quem tentou | separa a decisão de tentar do resultado | três linhas por gráfico |
| **3. Mapa por município** | geografia | um prefeito por município por eleição: a taxa vira 0% ou 100% |

### D. Ranking

Ordenar por **vitórias**, **anos de carreira** ou **reeleições**, com filtro de UF e último cargo. Clicar numa linha abre a escada na parte A: o ranking é a porta de entrada para quem não sabe que nome procurar.

### 2026

Consideramos mostrar 2026 como "em apuração" (o arquivo já tem o 1º turno). Ficou de fora, como nas outras perguntas: o painel só mostra anos com resultado final, e quando a macro `ano_divulgado` liberar 2026, ele entra sozinho.

---

## 5. Resumo em quatro frases (para a conclusão)

1. **A maioria das carreiras acaba no primeiro mandato:** de cada 100 vereadores que ganham a primeira eleição, 43 ainda estão eleitos 4 anos depois e 27 depois de 8.
2. **Quem se elege quase sempre tenta de novo** (72% dos vereadores, 74% dos deputados federais), e pouco mais da metade de quem tenta consegue; o prefeito que tenta ganha cada vez mais (82% em 2024).
3. **A regra do jogo aparece no dado:** o limite de uma reeleição derruba a curva do prefeito de 48% para 5% aos 8 anos.
4. **Carreira longa é rara e atravessa níveis:** 67% dos candidatos disputam uma única eleição, e as carreiras mais longas passam pela câmara, pela assembleia e pela prefeitura.

---

## 6. Exceções nos dados (já tratadas)

| Checagem | Casos | O que é | Como foi tratado |
|---|---|---|---|
| V5 | MT 2018, senador: 1 eleito, não 2 | Selma Arruda foi eleita e cassada; o arquivo a traz como NÃO ELEITO (INAPTO). A vaga foi preenchida na suplementar de 2020 (Carlos Fávaro) | fica como está; a suplementar é fora da Q10 |
| V6 (anotada) | 50 de 7.426 município × ano sem prefeito eleito (9 em 2024) | eleição anulada ou sub judice, refeita em suplementar | entram como "sem resultado"; em 2024 são os mesmos 9 da Q4 |
| V10 | 16 eleitos sem título (2004: 3, 2012: 9, 2016: 4) | título vazio ou inválido no arquivo | ficam fora: sem título não há como ligar às outras candidaturas |
| V11 | 235 títulos (0,07%) com nomes de pessoas diferentes | erro de digitação do título no TSE | ficam na base; a carreira dessas pessoas mistura duas. Grafias diferentes da mesma pessoa passam no limiar |

---

## 7. Ressalvas para dizer na apresentação

1. **A carreira só existe dentro das 6 UFs.** Quem disputou em outro estado tem esse trecho fora da linha do tempo.
2. **Antes de 2002 não há dado.** Quem aparece em 2002 ou 2004 pode ter carreira anterior (22% das pessoas estreiam nesses anos). Por isso a curva da parte B só usa quem estreou de 2006 em diante.
3. **Vice e suplente de senador não têm resultado até 2010.** Aparecem como "sem resultado" nesses anos, e a reeleição de vice só é detectável de 2012 em diante. Depois, suplente eleito conta como vitória (por exemplo, o 1º suplente de senador de Pedro Fernandes em 2018).
4. **Reeleição exige o mesmo lugar.** Vereador que muda de município não conta como reeleito.
5. **"Tentaram" do prefeito inclui quem não podia tentar** (segundo mandato). O número de quem podia e não quis é menor do que parece.
6. **Associação, não causa.** A parte C não diz por que alguém não tentou de novo (desistiu, foi para outro cargo, ficou inelegível).
7. **Fora da análise:** 2026, suplementares e quem não tem título válido.

---

## 8. O que precisa saber responder sem consultar

- Por que a pessoa é o título de eleitor, e não o CPF nem o `sq_candidato`?
- Qual a diferença entre "derrota" e "sem resultado"? Por que separar?
- Por que Caiado em 2018 (senador → governador) não conta como reeleição?
- Por que a curva do prefeito cai aos 8 anos e sobe aos 12?
- Por que a curva só usa quem estreou de 2006 em diante?
- Por que três números na parte C e não só a taxa de reeleição?
- Por que a escada e não uma tabela ou uma linha do tempo simples?
- Por que 2026 não aparece?

---

## 9. Como rodar

**Só ver:** o notebook foi salvo com gráficos e tabelas, e o painel abre direto no navegador (`docs/q10-painel/index.html`, ou a aba Q10 de `docs/painel.html`).

**Rodar do zero.** O banco (`dados/processed/tse.duckdb`) não vai para o git. A Q10 só depende do `consulta_cand`:

```bash
uv run python -m scripts.coleta.coleta_tse candidatos historico --uf AM,GO,MA,MT,RS,SE
uv run python scripts/carregar_staging.py 00_limpeza 04_politico 07_q10
uv run jupyter lab notebooks/q10_carreira.ipynb
```

No Jupyter, rode tudo. A primeira seção roda as checagens; se alguma tiver casos além dos da seção 6, pare e investigue antes de olhar os gráficos.

Regere o painel depois de mudar a carga ou as views:

```bash
uv run python scripts/gerar_painel_q10.py
```

---

## 10. Painel interativo

`docs/q10-painel/index.html` (≈ 4,7 MB), na identidade visual do painel do grupo:

- **A · um político:** busca por nome de urna ou civil, atalhos de exemplo, escada da carreira, 6 indicadores e a tabela das candidaturas.
- **B · sobrevivência:** curva por cargo da primeira vitória, com "ainda eleito" × "ainda disputando" (`q10_curva_sobrevivencia`).
- **C · reeleição:** tentaram, reeleitos e sucesso por ano, trocando o cargo (`q10_sobrevivencia`).
- **D · ranking:** carreiras mais longas por vitórias, anos ou reeleições; clicar abre a parte A.
- **Filtro de UF** no topo, para as partes B, C e D (na B, vale a UF da primeira vitória).

Na busca entra quem se elegeu ao menos uma vez de 2002 a 2024 (51.347 pessoas), com todas as participações, inclusive as derrotas.

- `docs/q10-painel/modelo.html`: a página, com `__DADOS__` no lugar dos dados.
- `scripts/gerar_painel_q10.py`: lê as views do banco e gera o `index.html`. O nome de urna vem direto do `consulta_cand`, porque ficou fora do DER.
