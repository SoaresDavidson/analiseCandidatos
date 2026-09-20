# Estratégia do trabalho — análise de candidatos

Grupo de 4. Entrega mais próxima: **DER, quinta-feira 24/09/2026** (6 dias a partir
de hoje, 18/09). Entrega final: banco carregado + consultas + resultado visual que
responda às 12 perguntas.

Documentos irmãos:
[`fontes-de-dados.md`](fontes-de-dados.md) (o que existe, validado) e
[`der.md`](der.md) (o modelo e o mapa pergunta → entidade).

---

## 1. A arquitetura, em uma frase

**Zip do TSE e JSON do IBGE caem em `dados/raw/` → DuckDB lê os arquivos como views
(`staging`) → um script de carga materializa as tabelas do DER (`core`) → uma
consulta SQL por pergunta (`marts`) → a camada visual só lê os marts.**

```
dados/raw/            zips e jsons crus, nunca editados a mão (já no .gitignore)
  candidatos/2024/...
  resultados/2024/...
  contas/2024/...
  ibge/sidra_6579_2024.json ...

dados/processed/
  tse.duckdb          banco único, versionável por script (não por commit do .duckdb)

sql/
  01_staging.sql      views sobre CSV/JSON cru (read_csv, read_json)
  02_core.sql         DDL + carga das tabelas do DER, com PK/FK de verdade
  03_marts.sql        uma view por pergunta: mart_q01, mart_q02, ...

scripts/
  coleta_comum.py     infra: download com retomada, extração com filtro de UF
  coleta_tse.py       candidatos, resultados, contas, eleitorado, abstenção, propostas
  coleta_ibge.py      SIDRA, FTP do PIB, malha municipal
  coleta_pnud.py      IDHM (só Brasil/UF — ver seção 4)
  coletar_dados.py    roda os três de uma vez
```

**Por que DuckDB e não PostgreSQL:** já está no `pyproject.toml`, lê CSV e JSON
direto do disco sem ETL, roda em notebook, e o banco é um arquivo só (fácil de
passar entre os 4). ✅ **Decidido: DuckDB conta como SGBD para a disciplina.**
Mantenha o `02_core.sql` em SQL quase-ANSI mesmo assim — custa nada e evita
dependência de dialeto.

---

## 2. As cinco fases

| Fase | O quê | Prazo | Quem |
|---|---|---|---|
| **0. Kickoff** | Decisões já fechadas (seção 4) — só dividir os módulos e escrever o contrato de chaves | seg 21/09, ~45min | todos |
| **1. DER** | 4 módulos desenhados + consolidação | **qui 24/09** | todos |
| **2. Ingestão** | Todos os arquivos baixados e lendo em staging | 01/10 | A + D |
| **3. Carga** | `02_core.sql` rodando, PK/FK válidas | 08/10 | B + C |
| **4. Consultas** | 12 marts, um por pergunta | 15/10 | todos (3 cada) |
| **5. Visual** | Dashboard / notebook final | reta final | todos |

As fases 2 e 3 se sobrepõem de propósito: quem termina de baixar um domínio já
começa a modelar aquele domínio.

---

## 3. Divisão por pergunta — quem faz o quê

Cada um desenha o próprio diagrama, do jeito que preferir (à mão, ferramenta, IA).
O que **não** é livre são as chaves compartilhadas: sem isso os quatro diagramas
não encaixam. Ver "Contrato de chaves" no fim desta seção.

Todos os esquemas citados aqui estão em [`esquemas.md`](esquemas.md), gerado a
partir dos arquivos baixados de verdade. **Modele por ele, não pela documentação
do TSE** — as colunas mudam de ano para ano.

### Davi — Q1, Q2, Q3

| | |
|---|---|
| **Q1** $ por cadeira | despesas de campanha ÷ vagas em disputa |
| **Q2** taxa de sucesso × $$ | despesa por candidatura × `CD_SIT_TOT_TURNO` |
| **Q3** perfil do município × partido × votação × abstenção | o cruzamento TSE × IBGE |

**Arquivos:** `despesas_*` (prestação de contas — consumir do Enrico, ver abaixo),
`consulta_vagas`, `detalhe_votacao_munzona`, `votacao_candidato_munzona`,
PIB per capita (FTP do IBGE), renda domiciliar e população (SIDRA).

**Entidades no diagrama:** `DESPESA_CAMPANHA`, `VAGA`, `CANDIDATURA`,
`SITUACAO_TOTALIZACAO`, `COMPARECIMENTO_MUNICIPIO`, `MUNICIPIO_ANO`, `PARTIDO`.

**Atenção:**
- A Q1 precisa do `consulta_vagas` — é o arquivo que todo mundo esquece de baixar,
  e sem ele "por cadeira" não existe.
- A abstenção da Q3 vem do `detalhe_votacao_munzona` (tem cargo), **não** do grupo
  Comparecimento e Abstenção (que não tem cargo).
- O eixo "rico/pobre" é **PIB per capita + renda domiciliar do Censo 2022**, não
  IDHM — ver seção 4 do [`fontes-de-dados.md`](fontes-de-dados.md).

### Dudu — Q4, Q5, Q6

| | |
|---|---|
| **Q4** instrução do candidato × população | `CD_GRAU_INSTRUCAO` × Censo 2022 |
| **Q5** votos de legenda × partido | `votacao_partido_munzona` |
| **Q6** proposta de governo → nuvem de palavras | PDFs do TSE |

**Arquivos:** `consulta_cand`, `votacao_partido_munzona`, `proposta_governo_*_PI.zip`,
SIDRA 10061 (nível de instrução) e 10062 (anos médios de estudo).

**Entidades:** `GRAU_INSTRUCAO`, `CENSO_INSTRUCAO`, `VOTACAO_LEGENDA_MUNICIPIO`,
`PARTIDO`, `FEDERACAO`, `PROPOSTA_GOVERNO`, `TERMO_PROPOSTA`.

**Atenção:**
- **Federação partidária muda a Q5 de 2022 em diante.** O voto de legenda vai para
  a federação, não para o partido isolado. `consulta_cand` tem `NR_FEDERACAO`,
  `SG_FEDERACAO` e `DS_COMPOSICAO_FEDERACAO`.
- Na Q6, a chave de join sai do **nome do arquivo** PDF
  (`2024PI180001881915_01.pdf` → `SQ_CANDIDATO = 180001881915`).
- Medir cedo quantos PDFs são imagem escaneada: rodar a extração em 20 arquivos e
  ver a taxa de retorno vazio. Se for alta, restringir o corpus e declarar.

### Duda — Q7, Q8, Q9

| | |
|---|---|
| **Q7** jovens × não jovens × viés político | idade do candidato × idade do eleitorado |
| **Q8** PJ × viés político (doação) | doação empresarial, 2002–2014 |
| **Q9** viés do município na linha do tempo | série histórica + mapa |

**Arquivos:** `consulta_cand` (`DT_NASCIMENTO`), `perfil_comparecimento_abstencao`
(único com abstenção por faixa etária), SIDRA 9606 (idade da população),
`receitas_*` de 2014 (leiaute antigo), `votacao_candidato_munzona` de todos os anos,
hierarquia geográfica (FTP do PIB) e a malha GeoJSON para o mapa.

**Entidades:** `POLITICO`, `CENSO_FAIXA_ETARIA`, `COMPARECIMENTO_PERFIL`,
`AGENTE_FINANCEIRO`, `RECEITA_CAMPANHA`, `PARTIDO` (com `cd_espectro`),
`VOTACAO_CANDIDATO_MUNICIPIO`, `MUNICIPIO`.

**Atenção:**
- **A Q8 é a pergunta mais chata do trabalho** e a razão é o leiaute: 2014 é `.txt`
  com colunas em português e espaço no nome (`"CPF/CNPJ do doador"`,
  `"Setor econômico do doador"`). Nada do staging de 2018+ serve. Combine com o
  Enrico: ele é o dono dessa carga.
- A premissa da Q8 precisa de ajuste no relatório: o STF derrubou a doação de PJ em
  setembro de 2015 (ADI 4650), então **2016 já foi sem PJ**. O período real é
  2002–2014, e 2016 vira o marco zero — o que melhora a pergunta.
- A Q9 depende da decisão ③ (espectro partidário em vez de sucessão de sigla).

### Enrico — Q10, Q11, Q12 + **dono da prestação de contas**

| | |
|---|---|
| **Q10** eleito/não eleito × recurso público × privado | classificação da receita |
| **Q11** onde o candidato investe em propaganda | texto livre da despesa |
| **Q12** linha do tempo do político | 2002–2026, por título de eleitor |

**Arquivos:** `receitas_*`, `despesas_*` (todos os anos), `consulta_cand` 2002–2024.

**Entidades:** `RECEITA_CAMPANHA`, `FONTE_RECURSO`, `DESPESA_CAMPANHA`,
`TIPO_DESPESA`, `AGENTE_FINANCEIRO`, `POLITICO`, `CANDIDATURA`.

**Atenção:**
- 🚨 **Não use CPF para identificar a pessoa. Use o título de eleitor.** Em 2024 o
  TSE suprimiu o CPF: as 463.859 linhas trazem `NR_CPF_CANDIDATO = '-4'`, que é o
  código de dado protegido (LGPD). Um `POLITICO` chaveado por CPF perde 2024
  inteiro e ninguém percebe, porque a coluna não fica vazia — fica com um valor.
  O `NR_TITULO_ELEITORAL_CANDIDATO` está preenchido em **todos** os anos (pior
  caso 1,74% de ruim, em 2002). Medição completa na seção 5.
- A Q12 está comprovada de ponta a ponta: 1.856.271 pessoas distintas entre 2002 e
  2026, das quais **599.547 (32,3%) se candidataram em duas ou mais eleições**. A
  carreira mais longa do Piauí tem 12 eleições (2004–2026) e passou por 5 partidos.
- A classificação público/privado da Q10 **não vem pronta**: sai da combinação de
  `DS_FONTE_RECEITA` e `DS_ORIGEM_RECEITA`. É uma tabela de-para escrita à mão, e
  vale como contribuição do trabalho — documentem o critério.

#### Por que o Enrico é o dono da prestação de contas

A prestação de contas é necessária por **três dos quatro**: Davi (Q1, Q2), Duda
(Q8) e Enrico (Q10, Q11). E é a fonte com **dois leiautes incompatíveis**. Se os
três escreverem staging separado, fazem três vezes o trabalho mais difícil do
projeto e chegam a três números diferentes para "quanto o candidato gastou".

O Enrico tem duas das três perguntas inteiramente dentro dessa fonte, então ele
entrega **duas views canônicas** que os outros consomem sem tocar no arquivo cru:

```sql
stg_receita(sq_candidato, ano, dt, vr_receita, cpf_cnpj_doador, tp_pessoa,
            cd_cnae_doador, ds_fonte, ds_origem, ds_natureza)
stg_despesa(sq_candidato, ano, dt, vr_despesa, cpf_cnpj_fornecedor,
            cd_cnae_fornecedor, ds_despesa, ds_tipo_despesa)
```

Cada view lê os dois leiautes e renomeia para esses nomes. **Esse é o primeiro
entregável do Enrico, antes de Q10 e Q11** — o Davi e a Duda estão bloqueados nele.

### Contrato de chaves

Os quatro diagramas se encontram nestas colunas. Nome e tipo são fixos:

| Chave | Tipo | Onde nasce |
|---|---|---|
| `municipio.cod_ibge` | `INTEGER` (7 dígitos) | `municipio_tse_ibge.csv` |
| `municipio.cod_tse` | **`VARCHAR(5)`** — zero à esquerda em ambos os lados (`"01007"`) | `municipio_tse_ibge.csv` |
| `candidatura.sq_candidato` | `BIGINT` | `consulta_cand.SQ_CANDIDATO` |
| `politico.nr_titulo_eleitoral` | `VARCHAR(12)` | `consulta_cand.NR_TITULO_ELEITORAL_CANDIDATO` |
| `eleicao.ano` + `nr_turno` | `INTEGER` | qualquer arquivo do TSE |
| `partido.nr_partido` | `INTEGER` | `consulta_cand.NR_PARTIDO` |

⚠️ Sobre o `cod_tse`: **testado, o join casa** — 5.569 municípios da votação de
2024, 5.569 pares encontrados, zero órfãos. Os dois lados trazem o zero à esquerda,
então texto com texto funciona, e inteiro com inteiro também. O que quebra é
**misturar**: converter só um lado para número, ou deixar o pandas inferir `int` num
arquivo e `str` noutro. Fixem `VARCHAR(5)` nos dois lados e o problema não existe.

⚠️ `candidatura` **não tem coluna de município**. O vínculo é por `SG_UE`, que em
eleição municipal é o código TSE do município.

---

## 4. Decisões do kickoff — todas fechadas

As cinco estão resolvidas. ④ e ⑤ foram decididas pelo grupo; ①, ② e ③ foram
fechadas com medição real dos arquivos (números na seção 4 do
[`fontes-de-dados.md`](fontes-de-dados.md)). O kickoff de segunda vira reunião de
alinhamento, não de decisão.

### ① Recorte geográfico → **nacional, menos finanças; finanças por UF, começando por PI**

O que a medição mostrou: o zip de prestação de contas de 2024 tem **1,27 GB
compactado, 112 arquivos, ~12 GB descompactado**. Mas ele já vem **partido por UF**,
e metade do volume são os arquivos `_BRASIL`, que só repetem o que as UFs já têm.

| | só PI | só BRASIL |
|---|---|---|
| despesas contratadas 2024 | 51,2 MB | ≥ 4 GB |
| despesas pagas 2024 | 18,7 MB | 1.207 MB |
| receitas 2024 | 20,2 MB | 1.342 MB |
| receitas doador originário 2024 | 1,6 MB | 106 MB |
| **total** | **~92 MB** | **~6,7 GB** |

**70× menos dado pela mesma pergunta respondida.** A regra operacional:

1. Baixar o zip inteiro (não dá para baixar parcial — é um arquivo só).
2. Extrair e **apagar os `_BRASIL` na hora**. São duplicata pura e sozinhos
   estouram o disco de quem tiver SSD apertado.
3. Carregar só as UFs escolhidas: **PI + SP + MG** (PI é o nosso recorte, SP e MG
   dão contraste de porte e riqueza sem inviabilizar).

Tudo que não é finança (candidatos, votação, IBGE) entra **nacional**, porque é
leve: `detalhe_votacao_munzona` 2024 tem 1,4 MB, `votacao_candidato_munzona` 46 MB,
`consulta_cand` 61 MB. As Q3 e Q9 precisam de amplitude nacional e usam justamente
essas tabelas.

### ② Recorte de anos → **2018–2024 como base, 2014 obrigatório, resto opcional**

Duas descobertas mudaram o raciocínio:

**Boa notícia: `NR_CPF_CANDIDATO` existe desde 2002.** Abri o cabeçalho real dos CSVs
de 2002, 2010, 2014, 2018, 2020, 2022 e 2024 — o CPF está em todos. **O risco que eu
tinha levantado sobre a Q12 não existe**: dá para ligar o mesmo político entre
eleições por CPF, sem heurística de nome, em toda a série. (Falta só conferir a taxa
de preenchimento nos anos antigos — coluna existir não é coluna cheia.)

**Má notícia: existem duas gerações de leiaute, e a fronteira não é onde parece.**

| Fonte | Geração antiga | Geração nova |
|---|---|---|
| `consulta_cand` | ≤ 2010 — 62 colunas | ≥ 2014 — 50 colunas, com federação |
| prestação de contas | ≤ 2016 — `.txt`, colunas em português (`"Cód. Eleição"`, `"CPF/CNPJ do doador"`) | ≥ 2018 — `.csv`, `SNAKE_CASE` (`NR_CPF_CNPJ_DOADOR`) |

Cada ano anterior ao corte custa **um mapeamento de staging inteiro**, não um
arquivo a mais. `union_by_name=true` não salva: os nomes de coluna são outros.

Decisão:

- **2018, 2020, 2022, 2024** — base obrigatória. Cobre 10 das 12 perguntas.
- **2014** — entra obrigatoriamente, só por causa da Q8. É o último ano com doação
  de PJ e o arquivo tem exatamente o que a pergunta pede (`CPF/CNPJ do doador`,
  `Setor econômico do doador`, `Tipo doador originário`). São 193 MB.
- **2016** — entra se sobrar tempo, como marco zero da Q8 (ver seção 5).
- **2002–2012** — fora, salvo se a Q12 ficar rasa demais só com 2014–2024.

### ③ Sucessão partidária → **não modelar sucessão; classificar por espectro**

PFL → DEM → União Brasil é um problema insolúvel se a gente tentar decidir se são
um partido ou três. A saída é notar que **a Q9 não pergunta por sigla, pergunta por
viés político**. Então:

- `PARTIDO` fica identificado pelo número **dentro do ano**, sem continuidade
  histórica. Simples, fiel ao dado do TSE.
- Ganha um atributo `cd_espectro` (esquerda / centro-esquerda / centro /
  centro-direita / direita), classificado por eleição a partir de uma escala
  acadêmica publicada, **com a fonte citada no relatório**.
- **Q9 agrega por espectro, não por sigla.** O problema da sucessão desaparece:
  não importa se o PFL virou União Brasil, importa que o município votou à direita
  nas duas eleições.
- **Q5 e Q8 usam a sigla do ano** e não precisam de continuidade nenhuma.
- Nada de tabela `PARTIDO_SUCESSAO`. Fica de fora com a justificativa escrita.

⚠️ **E um achado que muda a Q5:** os arquivos de 2022 e 2024 têm `NR_FEDERACAO`,
`NM_FEDERACAO`, `SG_FEDERACAO` e `DS_COMPOSICAO_FEDERACAO`. **Federação partidária
é uma entidade que não está no DER** e afeta direto a Q5 — desde 2022 o voto de
legenda vai para a federação, não para o partido isolado. Ver seção 4.1.

### ④ SGBD → **DuckDB, decidido pelo grupo**

Sem ressalva. O `02_core.sql` continua em SQL quase-ANSI por higiene, mas não há
plano de migração para Postgres.

### ⑤ Notação do DER → **diagrama, feito à mão depois**

O grupo vai desenhar. O [`der.md`](der.md) serve de rascunho e de fonte da lista de
entidades, atributos e cardinalidades — não é a entrega.

---

## 4.1 Correções ao rascunho do DER que saíram dessas verificações

Não mexi no [`der.md`](der.md) — são notas para quem for desenhar.

1. **`MUNICIPIO.cod_tse` deve ser `VARCHAR(5)`.** Vem como `"01007"` na ponte e
   também nos arquivos de votação, com o zero à esquerda dos dois lados — então o
   join casa (testado: 5.569 de 5.569, zero órfãos). Fixar o tipo como texto nos
   dois lados evita que alguém converta só um deles e perca registros sem erro.
2. **Falta a entidade `FEDERACAO`** (2022+): `nr_federacao`, `sg_federacao`,
   `nm_federacao`, `ds_composicao`. `CANDIDATURA` ganha FK opcional para ela, e a
   Q5 passa a somar legenda por federação quando ela existir.
3. **`CANDIDATURA` não tem coluna de município.** O vínculo é por `SG_UE`
   (unidade eleitoral), que em eleição municipal **é** o código TSE do município.
   Documentar isso, senão alguém perde uma tarde procurando `CD_MUNICIPIO`.
4. **Tirar `vr_despesa_max_campanha` e `nr_idade_data_posse` de `CANDIDATURA`.**
   Só existem no leiaute antigo (≤2010), não nos anos da nossa base. Idade sai de
   `dt_nascimento`, que existe em todos.
5. **Tirar `cod_ibge_nascimento` de `POLITICO`.** Mesma razão: `CD_MUNICIPIO_NASCIMENTO`
   sumiu do leiaute novo. Sobra `SG_UF_NASCIMENTO`, que existe sempre.
6. **`FONTE_RECURSO` deve nascer de dois campos, não de um.** O leiaute novo tem
   `CD_FONTE_RECEITA`/`DS_FONTE_RECEITA` **e** `CD_ORIGEM_RECEITA`/`DS_ORIGEM_RECEITA`.
   A classificação público/privado da Q10 sai da combinação dos dois.
7. **`AGENTE_FINANCEIRO.cd_cnae` tem fonte confirmada:** `CD_CNAE_DOADOR` /
   `DS_CNAE_DOADOR` no leiaute novo, `Cod setor econômico do doador` no antigo.

---

## 5. Riscos reais

> **A ordem de gravidade mudou depois das verificações.** Hoje o maior risco é
> **"leiaute muda entre anos"**; Q6 e Q12 caíram para quase nada. As seções abaixo
> ficaram na ordem original, com o status atualizado em cada uma.

### Q6 — risco derrubado (eu tinha errado)

Escrevi antes que as propostas de governo não existiam em lote e que a Q6 era o
maior risco do trabalho. **Estava errado.** Elas estão no portal, no grupo
Candidatos, um zip por UF por ano:

```
https://cdn.tse.jus.br/estatistica/sead/odsele/proposta_governo/proposta_governo_{ano}_{UF}.zip
```

`proposta_governo_2024_PI.zip` = 328 MB, **504 PDFs**. E o melhor: o nome do
arquivo é `{ano}{UF}{SQ_CANDIDATO}_{seq}.pdf` (ex.: `2024PI180001881915_01.pdf`),
então **a chave de join com `CANDIDATURA` sai de um parse de nome de arquivo** —
nada de casar por nome de candidato.

O que sobra da Q6 é trabalho normal de pipeline: extrair texto dos PDFs
(`pypdf` ou `pdfplumber`), tokenizar, remover stopwords em português, contar.
Nada disso é risco de fonte. Detalhes na seção 1.4 do
[`fontes-de-dados.md`](fontes-de-dados.md).

⚠️ Uma ressalva que continua valendo: parte dos PDFs pode ser **imagem escaneada**,
não texto. Quem pegar a Q6 deve medir isso cedo — rodar a extração em 20 PDFs do PI
e ver a taxa de retorno vazio. Se for alta, a saída é restringir o corpus aos que
têm texto e declarar isso, não partir para OCR.

### Q8 — a pergunta tem um problema de premissa

A pergunta diz "PJ × viés político (doação) — **até 2016**". Mas o STF declarou
inconstitucional a doação empresarial a campanhas em **setembro de 2015** (ADI
4650), e a Lei 13.165/2015 tirou a previsão legal. Ou seja: **a eleição municipal
de 2016 já foi sem doação de pessoa jurídica a candidato.**

Os dados de PJ de verdade estão em **2002–2014**. Sugestão de reenquadramento —
que melhora a pergunta em vez de estragá-la: analisar **2002–2014 como o período
com doação PJ e usar 2016 como marco zero**, mostrando o que aconteceu com o
financiamento quando a fonte secou. Vale confirmar isso com o professor; é o tipo
de achado que rende discussão no relatório.

(PJ continua aparecendo como **fornecedora** de despesas depois de 2016 — isso é
outra coisa, e é o que alimenta a Q11.)

**O arquivo de 2014 foi conferido e tem tudo que a pergunta precisa.** Abri o
cabeçalho de `receitas_candidatos_2014_*.txt`: vem com `CPF/CNPJ do doador`,
`Nome do doador (Receita Federal)`, `Cod setor econômico do doador`,
`Setor econômico do doador` e ainda `Tipo doador originário` (para doação
triangulada via partido). São 193 MB o zip inteiro. É o ano mais rico da Q8 e por
isso ele entrou como obrigatório na decisão ② — ⚠️ a URL dele é
`prestacao_final_2014.zip`, **sem** o `_contas_`, diferente de todos os outros anos.

### Q12 — resolvida, mas a chave não é a que parecia

O `SQ_CANDIDATO` é único por eleição e não liga a pessoa entre anos. A coluna
`NR_CPF_CANDIDATO` existe desde 2002 e parecia resolver — **mas não resolve.**

Contagem feita sobre os 13 arquivos `consulta_cand_*_BRASIL.csv` baixados:

| ano | linhas | CPFs distintos | CPF inutilizável | títulos distintos | título inutilizável |
|---|---|---|---|---|---|
| 2002 | 18.109 | 17.662 | 1,91% | 17.676 | 1,74% |
| 2004 | 402.157 | 400.037 | 0,19% | 400.376 | 0,06% |
| 2006 | 19.303 | 19.209 | 0,00% | 19.203 | 0,00% |
| 2008 | 382.079 | 380.885 | 0,00% | 380.846 | 0,00% |
| 2010 | 22.577 | 22.325 | 0,00% | 22.323 | 0,00% |
| 2012 | 483.741 | 480.300 | 0,23% | 480.303 | 0,23% |
| 2014 | 26.263 | 26.018 | 0,11% | 26.040 | 0,00% |
| 2016 | 498.391 | 496.417 | 0,02% | 496.415 | 0,02% |
| 2018 | 29.287 | 28.984 | 0,37% | 28.984 | 0,37% |
| 2020 | 558.804 | 556.528 | 0,05% | 556.527 | 0,05% |
| 2022 | 29.322 | 28.946 | 0,10% | 28.946 | 0,10% |
| **2024** | **463.859** | **1** | **100,00%** | **462.865** | **0,01%** |
| 2026 | 20.984 | 20.873 | 0,01% | 20.873 | 0,01% |

🚨 **Em 2024 o TSE suprimiu o CPF.** Todas as 463.859 linhas trazem
`NR_CPF_CANDIDATO = '-4'`, o código de dado protegido (LGPD). A armadilha é que a
coluna **não fica vazia** — fica com um valor. Uma verificação de nulo passa, o
`GROUP BY` roda, e a eleição municipal de 2024 inteira colapsa numa pessoa só.

**Decisão: `POLITICO` é chaveado por `NR_TITULO_ELEITORAL_CANDIDATO`.** Ele está
preenchido em todos os anos e sobrevive a 2024. O CPF fica como atributo
informativo, nunca como chave.

Validado de ponta a ponta: 1.856.271 pessoas distintas entre 2002 e 2026, das quais
**599.547 (32,3%) se candidataram em duas ou mais eleições** — é exatamente esse
recorte que a Q12 analisa. A carreira mais longa do Piauí tem 12 eleições
(2004–2026) e passou por PTC, MDB, PSD, PSDB e PV.

### Leiaute muda entre anos — o risco que substituiu o da Q12

Este é o que pode custar uma semana se aparecer tarde. São **duas gerações de
leiaute** (detalhe na seção 4, decisão ②):

- `consulta_cand` ≤2010 tem 62 colunas; 2014+ tem 50. Colunas somem
  (`VR_DESPESA_MAX_CAMPANHA`, `CD_MUNICIPIO_NASCIMENTO`, `NR_IDADE_DATA_POSSE`) e
  aparecem (`NR_FEDERACAO`).
- Prestação de contas ≤2016 é `.txt` com colunas em português e espaço no nome
  (`"Cód. Eleição"`, `"Sigla  Partido"` — com dois espaços). 2018+ é `.csv`
  `SNAKE_CASE`.

`union_by_name=true` **não resolve isso**, porque os nomes são diferentes, não
ausentes. O membro C precisa de **duas views de staging** para o módulo 3, uma por
geração, cada uma renomeando para um nome canônico. Planejar isso desde o começo
custa uma hora; descobrir no meio da carga custa uma semana.

### Volume

Nada aqui é big data, mas as prestações de contas são grandes (~12 GB
descompactados em 2024, dos quais metade é duplicata `_BRASIL`). Duas mitigações,
nessa ordem: **apagar os `_BRASIL` logo após extrair** e **não carregar coluna que
ninguém vai usar** — o DuckDB lê CSV com projeção, então selecione as colunas na
view de staging, não depois.

### Bloqueio de rede do TSE

Todo o domínio `*.tse.jus.br` está atrás de Akamai e devolve `403` para cliente que
não pareça navegador. O `coleta_comum.py` usa `curl_cffi` impersonando o Chrome
— **não remova**. Se der 403 em massa algum dia, é bloqueio de borda; tentar de
outra rede antes de mexer no código.

---

## 6. Definição de pronto — checklist da quinta

O DER está pronto quando:

- [ ] Toda entidade tem PK declarada, e toda PK composta está explícita.
- [ ] Toda FK aponta para uma PK que **existe** em outro módulo, com o mesmo nome e
      tipo do contrato do A.
- [ ] Cada uma das 12 perguntas tem um caminho de joins traçável no diagrama
      (usar o mapa no fim do [`der.md`](der.md) como prova).
- [ ] Todo atributo **derivado** está marcado como tal (`vr_pib_per_capita`,
      `tx_abstencao`, `fl_eleito`, `fl_porte`). O professor vai perguntar.
- [ ] Os quatro módulos renderizam em um único diagrama sem entidade órfã.
- [ ] Existe um parágrafo escrito para cada decisão da seção 4, com a justificativa.

---

## 7. Estado da coleta

✅ **Feita.** Os coletores estão em `scripts/coleta_*.py`, um por domínio, todos
idempotentes. Ver o [README](../README.md) para como rodar.

O que foi conferido de verdade (requisição feita, resposta lida):

- As duas consultas do SIDRA devolvem os 5.570 municípios com as categorias certas
  — 10061 (instrução) e 9606 (idade). Os códigos de classificação estão corretos,
  que é onde esse tipo de código erra em silêncio.
- As 109 URLs que o `coleta_tse.py` gera, incluindo os casos irregulares de
  prestação de contas (2014 é `prestacao_final_2014.zip`, sem o `_contas_`).
- O filtro de UF, contra os nomes reais de arquivo dos zips de 2014 e 2024.
- A ponte TSE↔IBGE: `municipio_tse_ibge.csv` traz `CD_MUNICIPIO_TSE`,
  `CD_MUNICIPIO_IBGE`, `CD_UF_TSE`, `CD_UF_IBGE` e os nomes nos dois padrões,
  gerado em 13/09/2026. O maior risco de integração morreu.

Correções aplicadas sobre a primeira versão dos scripts:

| Problema | Efeito se não corrigido |
|---|---|
| regex do FTP do PIB não casava a pasta `2022_2023/` | baixava a edição de 2021 em silêncio, perdendo 2022 e 2023 |
| faltava `detalhe_votacao_munzona` | Q3 sem abstenção por cargo |
| `ANOS` começava em 2016 | Q8 sem nenhum ano com doação de PJ; Q12 com 6 eleições em vez de 12 |
| zips extraídos inteiros | ~100 GB em disco, metade duplicata `_BRASIL` |
| 416 renomeava `.part` sem conferir tamanho | download corrompido virava arquivo final |

O `scripts/baixar_candidatos_tse.py` foi removido: o `coleta_tse.py` faz o mesmo
e mais, e nada mais o referenciava.
