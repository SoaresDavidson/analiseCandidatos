# Roteiro da aula de 15/10: interface

Pedido do professor: pelo menos três perguntas com a interface bem trabalhada, para discutir as alternativas. Levamos quatro (Q4, Q8, Q9 e Q10), todas no mesmo painel: `docs/painel.html`.

Tempo total: ~18 minutos. Para cada pergunta, a mesma ordem:

1. **A pergunta**, quebrada em partes (30 s).
2. **Demonstração ao vivo** de uma interação (1 a 2 min).
3. **As alternativas que consideramos e por que escolhemos esta** (1 a 2 min). É a parte que o professor quer discutir.
4. **Um limite do dado**, em uma frase.

---

## Abertura · Duda (1 min)

- Recorte: os 6 estados sorteados, eleições ordinárias. O banco é o mesmo para todas as perguntas, carregado do TSE e do IBGE.
- Mostrar a aba **Início** do painel: as perguntas que já estão nele e as que faltam.

## Q4 Escolaridade · Duda e Davi (4 min)

**Pergunta em partes:** (A) candidatos e eleitos se parecem com a população? (B) escolaridade muda a chance de ser eleito? (C) município menos escolarizado elege gente menos escolarizada?

**Demonstração:**

1. Parte A em "Todas / 2024": 15% da população adulta tem superior; entre os eleitos, 37%.
2. Parte B: alternar **vereador** (a taxa sobe de 6,7% para 20,4%) e **prefeito** (sem diferença, p = 0,65). Clicar em "lê e escreve" e mostrar os nomes.
3. Parte C: mapa do MA, clicar em São Luís, marcar **"sem a capital"** na dispersão. A relação vem das cidades mais escolarizadas: sem os 20% do topo, r cai para 0,10.

**Alternativas:**

- **Contar eleitos × taxa de eleição.** Contar não mede chance, porque depende de quantos candidatos de cada grau existem.
- **Misturar cargos × separar por cargo.** Vereador e prefeito têm taxas muito diferentes, e misturar cria uma relação falsa.
- **Moda × % com superior.** A moda é boa para uma frase, mas se repete em quase todo município; o % contínuo separa os municípios.
- **Escolaridade do eleitor no TSE × Censo.** O TSE guarda a escolaridade declarada no alistamento, muitas vezes desatualizada; o Censo mede.

**Limite:** a parte C compara municípios, não pessoas (falácia ecológica).

## Q8 e Q9 Financiamento e propaganda · Enrico (5 min)

**Demonstração:**

1. Q8 em **prefeito 2024**: arrastar o corte de % público. Em 5% quem depende de dinheiro público se elege +26 p.p.; em 90%, −15 p.p. A conclusão depende do corte.
2. Q9: clicar num canal para filtrar a nuvem; clicar numa palavra para ver valor, canais e uso por eleitos × não eleitos.

**Alternativas (texto completo em `docs/q8-q9-publico-propaganda.md`, seção 4):**

- **Q8:** corte fixo em 50% × corte na mediana × **faixas com corte ajustável** (escolhida: mostra a forma da relação e que o corte importa).
- **Q9:** nuvem × barras por canal × treemap. **Nuvem + barras lado a lado**: a nuvem mede frequência, as barras medem valor. Treemap descartado porque uma despesa cita várias palavras, e o valor por palavra não soma.

**Limite:** eleição geral não tem município; em 2018 e 2022 o grão do dinheiro é o estado.

## Q10 Carreira · Eduardo (e Enrico) (5 min)

**Demonstração:**

1. Buscar **Caiado**: 6 eleições, 6 vitórias, 3 reeleições, 3 partidos. A ida a governador em 2018 não conta como reeleição.
2. Na parte B, ordenar por **vitórias** e clicar no primeiro do ranking.
3. Na parte C, alternar **vereador** e **governador**: de cada 100 vereadores eleitos, ~72 tentam de novo e ~41 se reelegem.

**Alternativas:**

- **Lista de candidaturas × linha do tempo.** A lista tem tudo, mas a linha do tempo mostra de relance as lacunas, as trocas de cargo e as reeleições.
- **Ligar a mesma pessoa pelo CPF × pelo `sq_candidato` × pelo título de eleitor.** O CPF veio vazio em 2024 e o `sq_candidato` se repete entre pessoas antes de 2010; o título é a única chave estável.
- **Um político × o agregado.** A busca responde "dado certo político"; o gráfico de reeleição mostra se a história dele é comum.

**Limite:** a carreira só aparece dentro das 6 UFs; quem disputou em outro estado tem esse trecho fora.

## Fechamento · todos (1 min)

- O que falta: Q1, Q2, Q3, Q5, Q6 e Q7. Para entrar no painel, cada pergunta só precisa gerar a sua página e ganhar uma linha na lista de abas (README, "Painel do grupo").
- Pergunta para o professor: a Q3 em 2008–2012 vale para o nosso grupo ou só para o Grupo 03?

## Antes da aula

- [ ] Abrir `docs/painel.html` no computador da apresentação e testar as quatro abas.
- [ ] Ensaio com todos, cronometrado.
- [ ] Cada um sabe responder sem consultar: de qual arquivo e coluna vem cada número da sua pergunta?
