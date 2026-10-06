# Escolaridade do candidato × escolaridade da população

> Grau de escolaridade do candidato × grau de escolaridade dos votadores; existe relação entre escolaridade do candidato e sua chance de ser eleito? Também, locais com menor escolaridade costumam eleger pessoas de semelhante escolaridade? **[2022, 2024]**

Responsáveis pela apresentação: Duda e Davi. Recorte: **AM, GO, MA, MT, RS e SE**, eleições ordinárias de 2022 e 2024.

Este texto explica o que foi feito, por que cada decisão foi tomada e o que os resultados permitem (e não permitem) dizer. Os números saem de [`notebooks/q4_escolaridade.ipynb`](../notebooks/q4_escolaridade.ipynb); os gráficos estão em [`output/q4/`](../output/q4/).

---

## 1. A pergunta são três perguntas

| Parte | Pergunta | Unidade de análise | Medida |
|---|---|---|---|
| **A** | Candidatos e eleitos se parecem com a população? | grupo | distribuição nos 4 níveis de escolaridade |
| **B** | A escolaridade muda a chance de ser eleito? | **candidato** | taxa de eleição = eleitos ÷ candidatos, por grau, **dentro de cada cargo** |
| **C** | Município menos escolarizado elege gente menos escolarizada? | **município** (2024) | moda + % com superior completo, população × eleitos |

Separar assim é o primeiro ponto da apresentação: cada parte tem uma unidade, uma medida e um gráfico diferentes.

---

## 2. O que foi feito, passo a passo

```
coleta (TSE + IBGE) → carga no banco (DuckDB) → views de consulta → checagens → notebook com gráficos
```

### 2.1 Fontes

| Lado | Fonte | O que traz |
|---|---|---|
| Candidato | TSE, `consulta_cand` 2022 e 2024 | `CD_GRAU_INSTRUCAO` (8 graus, **declarado** pelo candidato no registro), cargo, resultado (`DS_SIT_TOT_TURNO`) |
| Vagas | TSE, `consulta_vagas` 2022 e 2024 | quantas cadeiras cada cargo tinha (usado só para conferir) |
| População | IBGE, **Censo 2022, SIDRA tabela 10061** | pessoas de **18 anos ou mais** por município e nível de instrução (4 níveis), **medido** pelo Censo |
| Ponte | TSE, `municipio_tse_ibge` | código do município no TSE ↔ código no IBGE |

**Por que o Censo e não o cadastro de eleitores do TSE?** O TSE também tem escolaridade do eleitor, mas o próprio leia-me avisa que é a declarada no alistamento e "pode não representar o grau de escolaridade atual". O Censo mede. O preço: o Censo conta a população adulta, não o eleitorado. A diferença é pequena porque o voto é obrigatório dos 18 aos 70 anos. E o Censo só existe para 2022, então serve às duas eleições (dois anos de defasagem em 2024).

**As duas escalas.** O candidato tem 8 graus e o Censo, 4 níveis. A ponte é a tabela `GRAU_INSTRUCAO`, desenhada pelo Eduardo no módulo da Q4:

| Grau do TSE | Nível do Censo |
|---|---|
| 1 Analfabeto, 2 Lê e escreve, 3 Fundamental incompleto | 1 Sem instrução / fundamental incompleto |
| 4 Fundamental completo, 5 Médio incompleto | 2 Fundamental completo / médio incompleto |
| 6 Médio completo, 7 Superior incompleto | 3 Médio completo / superior incompleto |
| 8 Superior completo | 4 Superior completo |

A única escolha não óbvia é "lê e escreve" ir para o nível 1 (ninguém ali concluiu etapa escolar). A parte B usa os 8 graus direto; as partes A e C usam os 4 níveis, porque comparam com o Censo.

### 2.2 Coleta

O coletor do Davi (PR #28) ganhou `--uf`: baixa o zip inteiro do TSE, mas extrai só os arquivos das UFs pedidas. Para esta pergunta bastam uns 125 MB.

### 2.3 Carga: `sql/06_carga_nucleo.sql`

O antigo `06_carga_modelo.sql` foi removido no PR #28. O `06_carga_nucleo.sql` é o primeiro módulo do que o substitui: carrega só o **núcleo** do modelo, ou seja, as tabelas que a pergunta usa e as que as chaves estrangeiras de `CANDIDATURA` exigem.

| Tabela | De onde vem | Para quê |
|---|---|---|
| `uf`, `municipio` | de-para TSE ↔ IBGE | ligar candidatura e Censo pelo município |
| `nivel_instrucao`, `censo_instrucao` | SIDRA 10061 | a escolaridade da população |
| `grau_instrucao` | `consulta_cand` | a ponte 8 graus → 4 níveis |
| `eleicao`, `cargo`, `partido`, `politico` | `consulta_cand` | chaves estrangeiras obrigatórias de `candidatura` |
| `candidatura` | `consulta_cand` | uma linha por candidatura (o candidato que foi ao 2º turno aparece uma vez, com o resultado final) |
| `vaga` | `consulta_vagas` | conferir que eleitos = vagas |

A lógica vem do 06 antigo; o que mudou: lê os arquivos por UF, e a região da UF sai do código IBGE (não precisa mais da planilha do PIB). Leva ~3 segundos.

### 2.4 Consultas: `sql/10_q4_escolaridade.sql`

| View | O que faz |
|---|---|
| `q4_candidatura` | **a base**: quem entra na análise. Todas as outras leem daqui, então a regra fica escrita num lugar só |
| `q4_chance_por_grau` | parte B: candidatos, eleitos e taxa por ano, cargo e grau |
| `q4_perfil_uf` | parte A: população × candidatos × eleitos nos 4 níveis, por UF |
| `q4_municipio_nivel` | parte C: cada município × os 4 níveis, % da população e % dos eleitos |
| `q4_municipio` | parte C: uma linha por município, com moda, % com superior e nº de vereadores eleitos |

**Quem entra em `q4_candidatura`:**

- 2022 e 2024, só as 6 UFs, só eleição ordinária;
- **sem presidente** (eleição nacional), **sem vices e suplentes** (herdam o resultado da chapa);
- só quem **foi a voto** (situação final preenchida; indeferido e renúncia ficam fora);
- só graus de 1 a 8 (sai o "não informado").

Ficaram 4.899 candidaturas em 2022 (312 eleitos) e 82.923 em 2024 (13.882 eleitos).

### 2.5 Checagens: `sql/validacao/q4_escolaridade.sql`

| # | O que garante | Resultado |
|---|---|---|
| V1 | todo grau 1–8 tem nível do Censo | ok |
| V2 | a tabela da parte B soma exatamente a base | ok |
| V3 | eleitos = vagas em 2022 (governador, senador, deputados) | ok nos 24 pares UF × cargo |
| V4 | cada município tem 1 prefeito eleito em 2024 | 9 exceções reais (ver seção 5) |
| V5 | todo município tem os 4 níveis no Censo | 1 exceção real |
| V6 | os percentuais da parte A fecham 100% | ok |
| V7 | todo município tem vereador eleito em 2024 | 17 exceções reais |

Conferências extras: as candidaturas no banco são exatamente as do arquivo do TSE (5.361 em 2022 e 90.614 em 2024, antes dos filtros). Os totais fecham entre si:

- deputado estadual: 210 eleitos = 24 + 41 + 42 + 24 + 55 + 24 vagas;
- deputado federal: 90 eleitos = 8 + 17 + 18 + 8 + 31 + 8;
- governador e senador: 6 eleitos cada, um por UF;
- prefeito: 1.230 eleitos = 1.239 municípios − os 9 sem resultado.

---

## 3. Resultados e interpretação

### A. Os eleitos são muito mais escolarizados que a população

As 6 UFs juntas, em % de cada grupo:

| | Sem instrução / fund. incompleto | Fund. completo / médio incompleto | Médio completo / sup. incompleto | Superior completo |
|---|---|---|---|---|
| População 18+ (Censo 2022) | 33,7 | 16,6 | 34,7 | **15,0** |
| Candidatos 2022 | 3,6 | 6,4 | 33,8 | 56,3 |
| **Eleitos 2022** | 1,0 | 1,9 | 17,9 | **79,2** |
| Candidatos 2024 | 12,7 | 15,1 | 43,7 | 28,5 |
| **Eleitos 2024** | 9,4 | 12,4 | 41,2 | **37,0** |

Gráficos: `a_perfil_geral.png`, `a_perfil_uf_2024.png`.

- **15% da população adulta** tem superior completo; entre os **eleitos** são **79% em 2022** e **37% em 2024**.
- O grupo mais numeroso da população, "sem instrução / fundamental incompleto" (34%), é **1% dos eleitos de 2022** e **9% dos de 2024**.
- O filtro acontece **em duas etapas**: já na candidatura (os candidatos são mais escolarizados que a população) e de novo na eleição (os eleitos são mais escolarizados que os candidatos).
- A distância é muito maior em 2022 (deputado, senador, governador) que em 2024 (vereador, prefeito). A política municipal é bem mais parecida com a população.
- O padrão se repete nas 6 UFs. O MA e o SE têm a população menos escolarizada (40% no nível 1), e mesmo assim 39% e 30% dos eleitos de 2024 têm superior.

### B. A escolaridade muda a chance de ser eleito, mas depende do cargo

**Por que taxa e não contagem:** "4.448 vereadores eleitos têm superior completo" não diz nada sobre chance se houver muitos candidatos com superior. A taxa divide pelos candidatos daquele grau.

**Por que separar por cargo:** a taxa geral de vereador é 15,9%; a de prefeito, 38,7%; a de deputado federal, 5,3%. Misturar cargos mistura essas taxas e cria uma relação falsa.

Taxa de eleição (%) por grau:

| Grau | Vereador 2024 | Prefeito 2024 | Dep. estadual 2022 | Dep. federal 2022 |
|---|---|---|---|---|
| 2 Lê e escreve | 6,7 | 5,6 (1 de 18) | 0,0 | 0,0 |
| 3 Fund. incompleto | 13,0 | 40,4 | 2,0 | 4,0 |
| 4 Fund. completo | 14,2 | 44,9 | 1,3 | 1,8 |
| 5 Médio incompleto | 11,3 | 39,6 | 2,6 | 4,0 |
| 6 Médio completo | 15,4 | 39,5 | 2,7 | 2,3 |
| 7 Superior incompleto | 13,3 | 36,8 | 3,8 | 8,6 |
| 8 Superior completo | **20,4** | 38,1 | **10,3** | 6,3 |
| **Teste qui-quadrado** | p ≈ 1e-116 | p = 0,65 | p ≈ 4e-14 | p = 0,011 (pouco confiável) |

Gráfico: `b_chance_por_grau.png` (o rótulo de cada barra mostra eleitos/candidatos; barra clara = menos de 30 candidatos).

- **Vereador (2024):** a chance sobe com a escolaridade. O candidato com superior completo se elege **3 vezes mais** que o que só "lê e escreve" (20,4% × 6,7%). Mas a subida não é uma escada: do grau 3 ao 7 a taxa fica entre 11% e 16%. A diferença forte está nas pontas.
- **Deputado estadual (2022):** o superior completo se destaca, com 10,3% contra 1% a 4% nos demais graus.
- **Deputado federal (2022):** há diferença (p = 0,011), mas **sem ordem clara**: o maior valor é superior incompleto (8,6%), acima de superior completo (6,3%). Os graus baixos têm 21 a 56 candidatos, e o próprio teste avisa que está no limite (casela esperada abaixo de 5). Não dá para afirmar uma tendência.
- **Prefeito (2024):** **nenhuma diferença** (p = 0,65). Quem chega a ser candidato a prefeito tem 37% a 45% de chance em todos os graus com pelo menos 30 candidatos. A exceção "lê e escreve" (1 eleito em 18) tem poucos candidatos demais para pesar no teste. É um contraexemplo importante: a escolaridade não pesa igual em todo cargo.
- **Governador e senador (2022):** todos os 12 eleitos têm superior, mas são 49 e 45 candidatos no total, a maioria com superior (42 e 36). Não há como testar; fica como descrição.

**Leitura honesta da parte B:** há associação clara entre escolaridade e eleição nos cargos proporcionais (vereador e deputado estadual), e nenhuma em prefeito. Associação **não é causa**: escolaridade anda junto com renda, dinheiro de campanha, rede de contatos, partido e estar no mandato. Este gráfico não separa esses efeitos; separar exigiria controlar por essas variáveis (por exemplo, uma regressão logística com cargo, partido e reeleição).

### C. Município mais escolarizado elege gente mais escolarizada (2024)

Entram 1.221 dos 1.239 municípios (ver seção 5).

**Moda (frase de impacto, não conclusão).** A moda da população só assume dois valores: "sem instrução / fundamental incompleto" (1.067 municípios) ou "médio completo / superior incompleto" (154). Entre os eleitos, o mais comum é "médio completo / superior incompleto" (695 municípios) ou "superior completo" (398). Em 168 municípios há empate na moda dos eleitos. Por isso a moda serve para frases como:

> Em Coronel Barros (RS), predomina na população "sem instrução e fundamental incompleto" (10% com superior); entre os 10 eleitos, predomina "superior completo" (40%).

Mas ela não serve para comparar municípios: quase todos caem nas mesmas duas ou três combinações.

**Indicador contínuo (a resposta).** Para cada município: % da população com superior × % dos eleitos com superior.

| UF | Municípios | Pearson r | Spearman ρ |
|---|---|---|---|
| AM | 62 | 0,47 | 0,29 |
| GO | 238 | 0,41 | 0,33 |
| MA | 209 | 0,39 | 0,33 |
| MT | 141 | 0,41 | 0,34 |
| RS | 497 | 0,49 | 0,45 |
| SE | 74 | 0,37 | 0,13 |

Municípios em 5 faixas (quintis) do % da população com superior:

| Faixa | % da população com superior (média) | % dos eleitos com superior (média) |
|---|---|---|
| 1º quintil (menos escolarizados) | 5,3 | 30,6 |
| 2º | 7,7 | 32,0 |
| 3º | 9,7 | 31,7 |
| 4º | 12,0 | 34,2 |
| 5º quintil (mais escolarizados) | 16,6 | 46,8 |

Gráficos: `c_dispersao_uf.png`, `c_quintis.png`.

- **Sim, há relação positiva nas 6 UFs** (r de 0,37 a 0,49): onde a população é mais escolarizada, os eleitos também são.
- **Mas os eleitos ficam muito acima da população em todas as faixas.** Mesmo nos municípios menos escolarizados (5% com superior), 31% dos eleitos têm superior. "Elege gente de escolaridade **semelhante**" não é verdade: elege gente **mais** escolarizada em todo lugar, só que um pouco menos onde a população é menos escolarizada.
- **O efeito se concentra no topo.** Do 1º ao 4º quintil o % dos eleitos quase não muda (31% → 34%); o salto é no 5º (47%), onde estão as 6 capitais. Tirando o 5º quintil, a correlação das 6 UFs juntas cai para **0,09**: entre os 80% de municípios menos escolarizados, praticamente não há relação.
- **Por que r e ρ diferem (AM, SE):** o r (Pearson) é puxado por poucos pontos extremos, e a capital tem muito mais superior que o resto do estado. O ρ (Spearman) usa só a ordem e é mais robusto. Tirando a capital, o SE cai para r = 0,16 (ρ = 0,09) e o AM para r = 0,32 (ρ = 0,26). O RS, com 497 municípios, é onde a relação é mais firme (r = 0,49, ρ = 0,45).

**O que a parte C não pode concluir (falácia ecológica):** a comparação é entre **municípios**. Isso **não** prova que o *eleitor* pouco escolarizado vota no candidato pouco escolarizado; não existe dado de em quem cada eleitor votou. Pode ser, por exemplo, que em municípios mais escolarizados simplesmente haja mais candidatos com superior.

---

## 4. Resumo em três frases (para a conclusão)

1. **Os eleitos são muito mais escolarizados que a população:** 15% dos adultos têm superior completo, contra 79% dos eleitos em 2022 e 37% em 2024.
2. **A escolaridade está associada à chance de ser eleito nos cargos proporcionais** (vereador: 20% com superior × 7% entre os que só leem e escrevem), **mas não para prefeito**; é associação, não causa.
3. **Municípios mais escolarizados elegem gente mais escolarizada** (correlação positiva nas 6 UFs, puxada pelas capitais e cidades mais escolarizadas), mas em todo lugar os eleitos ficam bem acima da população: não é "semelhante", é "um pouco menos distante".

---

## 5. Exceções nos dados (já tratadas)

| Checagem | Casos | O que é | Como foi tratado |
|---|---|---|---|
| V4 | 9 municípios sem prefeito eleito | Iporá e Americano do Brasil (GO); Anajatuba, Guimarães e Santana do Maranhão (MA); Barra dos Coqueiros, Cedro de São João e Nossa Senhora do Socorro (SE): todos os candidatos com situação `#NULO`. Arroio do Sal (RS): todos "não eleito". Eleição anulada ou *sub judice*, que vira suplementar | a suplementar fica fora (só ordinária, regra R1); os vereadores desses municípios seguem na análise |
| V5 | Boa Esperança do Norte (MT) | criado depois do Censo 2022, sem dado do Censo | fica sem moda e fora da parte C |
| V7 | 17 municípios sem vereador eleito | o `consulta_cand_2024` (gerado em 06/10/2026) traz todos os 1.854 candidatos a vereador desses municípios com situação `#NULO` e registro `#NE`, ou seja, sem resultado | ficam fora da parte C (senão sobraria só o prefeito, e o % de eleitos com superior seria 0% ou 100%) e fora das partes A e B |

Os gráficos ajudaram a achar dois erros nas views antes da entrega (a moda inventada no município sem Censo e os municípios só com o prefeito). Os dois foram corrigidos.

---

## 6. Ressalvas para dizer na apresentação

1. **Cargo é o principal confusor.** Toda comparação de chance é dentro do cargo.
2. **Correlação não é causa.** Renda, dinheiro, partido e mandato atual andam junto com a escolaridade.
3. **Falácia ecológica** na parte C: vale para municípios, não para pessoas.
4. **Escolaridade autodeclarada** pelo candidato; a da população é medida pelo Censo.
5. **Censo de 2022** para uma eleição de 2024.
6. **Município pequeno elege 10 a 12 pessoas:** o % dos eleitos pula de 8 a 10 pontos com uma pessoa a mais ou a menos.
7. **Fora da análise:** presidente, vices, suplentes, quem não foi a voto, grau não informado e as exceções da seção 5.

---

## 7. O que cada um precisa saber responder sem consultar

- Por que a taxa de eleição e não só a contagem de eleitos?
- Por que separar por cargo? Dê o exemplo de prefeito × vereador.
- Por que o Censo e não o cadastro de eleitores do TSE?
- Como os 8 graus do candidato viram os 4 níveis do Censo?
- Por que a parte C só usa 2024?
- O que a parte C **não** permite concluir?
- Por que r e ρ dão valores diferentes no SE? E o que acontece com a correlação sem o 5º quintil?
- De qual arquivo e coluna vem cada número? (seção 2.1)

---

## 8. Como abrir no computador do Davi

**Só ver (sem rodar nada):** o notebook já foi salvo com os gráficos e tabelas. O GitHub mostra direto, ou:

```bash
git fetch origin
git switch duda/q4-escolaridade
uv sync
uv run jupyter lab notebooks/q4_escolaridade.ipynb
```

**Rodar de novo do zero.** O banco (`dados/processed/tse.duckdb`) não vai para o git.

1. Guarde o banco atual, se houver um: o `06_carga_nucleo` apaga e recarrega as tabelas do núcleo.
   ```bash
   mv dados/processed/tse.duckdb dados/processed/tse_completo.duckdb
   ```
2. Colete com `--uf`. Se os zips já estiverem baixados, só extrai os arquivos das 6 UFs, sem baixar de novo.
   ```bash
   uv run python -m scripts.coleta.coleta_tse candidatos municipio_tse_ibge --uf AM,GO,MA,MT,RS,SE
   uv run python -m scripts.coleta.coleta_ibge sidra
   ```
3. Carregue e abra:
   ```bash
   uv run python scripts/carregar_staging.py 00_modelo 06_carga_nucleo 10_q4
   uv run jupyter lab notebooks/q4_escolaridade.ipynb
   ```
4. No Jupyter, rode tudo (*Run → Run All Cells*). A primeira seção roda as checagens; se alguma tiver casos além dos da seção 5, pare e investigue antes de olhar os gráficos.
