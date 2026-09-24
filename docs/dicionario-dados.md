# Dicionário de dados

## Entidades do DER geral

O catálogo abaixo reúne as 32 entidades de `docs/der/der-geral.mmd`. As tabelas reservam espaço para os atributos; seu preenchimento ficará para uma etapa posterior. O rascunho preexistente de `CANDIDATURA`, ao fim deste arquivo, ainda precisa ser conferido com o DER atual.

### Território e contexto

#### `UF`

Unidade da federação usada para situar os municípios.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `MUNICIPIO`

Município identificado por códigos do IBGE e do TSE, permitindo relacionar dados territoriais e eleitorais.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `MUNICIPIO_ANO`

Indicadores de população e economia de um município em determinado ano.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `MUNICIPIO_CENSO`

Indicadores de renda e anos de estudo de um município em um ano censitário.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `IDHM_MUNICIPIO`

Índice de Desenvolvimento Humano Municipal e seus componentes para um município e ano censitário.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `NIVEL_INSTRUCAO`

Categorias de escolaridade usadas para classificar a população nos dados censitários.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `GRAU_INSTRUCAO`

Graus de escolaridade declarados por candidatos ao TSE, associados quando possível aos níveis censitários.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `CENSO_INSTRUCAO`

Quantidade de pessoas por município, ano censitário e nível de instrução.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `FAIXA_ETARIA`

Faixas de idade usadas para classificar dados populacionais e de comparecimento, com indicação da fonte TSE ou IBGE.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `CENSO_FAIXA_ETARIA`

Quantidade de pessoas por município, ano censitário e faixa etária.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `COMPARECIMENTO_PERFIL`

Eleitores aptos, comparecimentos e abstenções por município, ano, turno, faixa etária e gênero.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

### Eleição, partido e candidatura

#### `ELEICAO`

Pleito identificado pelo código do TSE, com ano, turno, data e abrangência.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `CARGO`

Cargo político disputado em uma candidatura e ao qual correspondem vagas e resultados eleitorais.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `PARTIDO`

Agremiação partidária identificada pelo ano e número, preservando mudanças ao longo do tempo.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `ESPECTRO_PARTIDO`

Classificação ideológica de um partido em determinado ano, com rodada e fonte da classificação.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `FEDERACAO`

Federação partidária identificada por ano e número, formada por partidos que atuam em conjunto.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `PARTIDO_FEDERACAO`

Associação entre um partido e a federação da qual participa em determinado ano.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `POLITICO`

Pessoa que pode participar de diferentes eleições por meio de candidaturas distintas.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `CANDIDATURA`

Participação de um político em uma eleição para determinado cargo e partido, com dados declarados e situação eleitoral.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `BEM_CANDIDATO`

Bem patrimonial declarado em uma candidatura, identificado pela ordem na declaração.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

### Resultados eleitorais

#### `VAGA`

Quantidade de cadeiras oferecidas para um cargo em uma eleição e unidade eleitoral.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `VOTACAO_CANDIDATO_MUNICIPIO`

Votos nominais recebidos por uma candidatura em um município e turno, com zonas eleitorais agregadas.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `VOTACAO_LEGENDA_MUNICIPIO`

Votos de legenda de um partido em um município, eleição, cargo e coligação.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `COMPARECIMENTO_MUNICIPIO`

Totais de eleitores aptos, comparecimento, abstenções e votos brancos e nulos por eleição, cargo e município.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

### Finanças de campanha

#### `AGENTE_FINANCEIRO`

Pessoa ou organização que participa das finanças de campanha como doadora, fonte originária ou fornecedora.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `ORGAO_PARTIDARIO`

Diretório ou comitê de um partido que pode arrecadar recursos de campanha.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `FONTE_RECURSO`

Classificação da fonte e origem dos recursos recebidos em campanha.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `RECEITA_CAMPANHA`

Entrada de recursos registrada para uma candidatura ou órgão partidário, com doador, fonte e valor.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `TIPO_DESPESA`

Categoria de despesa de campanha, incluindo a identificação de gastos com propaganda.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `DESPESA_CAMPANHA`

Gasto registrado por uma candidatura, com fornecedor, tipo, descrição e valor.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

### Propostas de governo

#### `PROPOSTA_GOVERNO`

Documento de propostas apresentado por uma candidatura, com conteúdo extraído para análise textual.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

#### `TERMO_PROPOSTA`

Termo encontrado no texto de uma proposta de governo e sua frequência no documento.

| Atributo | Tipo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|

---

## Rascunho preexistente de `CANDIDATURA`



Complementa o [`der.md`](der/der.md) (estrutura) e o [`esquemas.md`](esquemas.md)
(inventário bruto dos CSVs). Aqui fica o **significado** de cada atributo do
modelo lógico, o tipo escolhido, o domínio e de onde ele vem no arquivo-fonte.

Convenções:

- Nomes em `snake_case`, com prefixo por tipo herdado do TSE:
  `sq_` sequencial, `nr_` número, `cd_` código, `ds_` descrição, `nm_` nome,
  `sg_` sigla, `dt_` data, `qt_` quantidade, `vr_` valor, `fl_` flag.
- Tipos na notação DuckDB/Postgres (`VARCHAR(n)`, `INTEGER`, `BIGINT`, `DATE`,
  `DECIMAL(p,s)`, `BOOLEAN`).
- **Nulo?** — `N` = `NOT NULL`; `S` = aceita nulo, com a condição na coluna
  *Observações*.
- **Chave** — `PK`, `FK → tabela.coluna`, `UK` (única).
- **Origem** — arquivo e coluna do CSV bruto, no leiaute 2014–2026
  (`consulta_cand_<ano>_BRASIL.csv`). Transformações aplicadas na carga
  ficam em *Observações*.
- Valores textuais `#NULO`, `#NULO#`, `#NE`, `#NE#` e `-1` em código são
  convertidos para `NULL` na carga, salvo indicação contrária.

Uma seção por tabela. Copie o bloco de `CANDIDATURA` como template para as demais.

---

## CANDIDATURA

| Campo | Valor |
|---|---|
| **Descrição** | Participação de um político em uma eleição para um cargo, por um partido. Uma pessoa (`POLITICO`) tem várias candidaturas ao longo dos anos; cada linha aqui é uma delas. |
| **Chave primária** | `sq_candidato` |
| **Fonte** | `dados/raw/candidatos/<ano>/candidatos_<ano>/consulta_cand_<ano>_BRASIL.csv` |
| **Granularidade** | 1 linha por candidato × eleição × turno registrado no TSE |
| **Volume estimado** | ~500 mil linhas/ano em eleição municipal; ~30 mil em geral |
| **Relacionamentos** | N:1 com `POLITICO`, `ELEICAO`, `CARGO`, `PARTIDO`, `COLIGACAO`, `MUNICIPIO`, `UF`, `FEDERACAO`, `GRAU_INSTRUCAO`, `OCUPACAO`, `SITUACAO_TOTALIZACAO`; 1:N com `VOTACAO_CANDIDATO_MUNICIPIO`, `RECEITA_CAMPANHA`, `DESPESA_CAMPANHA`; 1:0..1 com `PROPOSTA_GOVERNO` |

### Atributos

| # | Atributo | Tipo | Nulo? | Chave | Descrição | Domínio | Origem (CSV) | Observações |
|---|---|---|---|---|---|---|---|---|
| 1 | `sq_candidato` | `BIGINT` | N | PK | Identificador sequencial da candidatura, atribuído pelo TSE. | inteiro positivo, 11 dígitos | `SQ_CANDIDATO` | Chave natural. Único em toda a base (o TSE não reusa entre anos). |
| 2 | `id_politico` | `INTEGER` | N | FK → `POLITICO.id_politico` | Pessoa que concorre. | — | `NR_TITULO_ELEITORAL_CANDIDATO` | Resolvido na carga: título eleitoral → `id_politico`. CPF não serve de chave (suprimido em 2024). |
| 3 | `id_eleicao` | `INTEGER` | N | FK → `ELEICAO.id_eleicao` | Pleito em que concorre. | — | `CD_ELEICAO` | `CD_ELEICAO` é o código do TSE; `id_eleicao` é surrogate gerado na carga de `ELEICAO`. |
| 4 | `cod_cargo` | `INTEGER` | N | FK → `CARGO.cod_cargo` | Cargo disputado. | ver `CARGO` (1=Presidente … 13=Vereador) | `CD_CARGO` | |
| 5 | `nr_partido` | `INTEGER` | N | FK → `PARTIDO.nr_partido` | Partido que lança a candidatura. | 2 dígitos (10–99) | `NR_PARTIDO` | |
| 6 | `sq_coligacao` | `BIGINT` | S | FK → `COLIGACAO.sq_coligacao` | Coligação/agremiação pela qual concorre. | — | `SQ_COLIGACAO` | Nulo quando `TP_AGREMIACAO` = `PARTIDO ISOLADO` **e** o TSE não gerou sequencial. |
| 7 | `nr_federacao` | `INTEGER` | S | FK → `FEDERACAO.nr_federacao` | Federação partidária (2022+). | — | `NR_FEDERACAO` | `-1` → `NULL`. Sempre nulo antes de 2022. |
| 8 | `cod_ibge` | `INTEGER` | S | FK → `MUNICIPIO.cod_ibge` | Município da candidatura (eleições municipais). | 7 dígitos IBGE | `SG_UE` | **Não existe `CD_MUNICIPIO` no arquivo.** `SG_UE` em eleição municipal é o código TSE do município (5 dígitos, `VARCHAR`, zero à esquerda); converte para IBGE via `MUNICIPIO.cod_tse`. Nulo em cargo estadual/federal. |
| 9 | `sigla_uf` | `CHAR(2)` | N | FK → `UF.sigla_uf` | Unidade da federação da candidatura. | 26 UFs + `DF`; `BR` para Presidente | `SG_UF` | |
| 10 | `nr_turno` | `INTEGER` | N | — | Turno em que a candidatura foi registrada. | `1`, `2` | `NR_TURNO` | Candidato que vai ao 2º turno aparece em duas linhas (dois `SQ_CANDIDATO`). |
| 11 | `nr_candidato` | `INTEGER` | N | — | Número votado na urna. | 2 a 5 dígitos conforme cargo | `NR_CANDIDATO` | Não é único: repete entre municípios e anos. |
| 12 | `nm_urna` | `VARCHAR(30)` | N | — | Nome de urna. | texto livre, maiúsculas | `NM_URNA_CANDIDATO` | Mantido como no TSE (sem normalizar acento). |
| 13 | `cd_situacao_candidatura` | `INTEGER` | N | — | Situação do registro de candidatura. | `12` Apto, `14` Inapto, … | `CD_SITUACAO_CANDIDATURA` | Descrição em `DS_SITUACAO_CANDIDATURA`; se virar tabela de domínio, migrar para FK. |
| 14 | `cd_grau_instrucao` | `INTEGER` | S | FK → `GRAU_INSTRUCAO.cd_grau_instrucao` | Escolaridade declarada na candidatura. | `1`–`8` | `CD_GRAU_INSTRUCAO` | Fica em `CANDIDATURA`, não em `POLITICO`, porque muda entre eleições. |
| 15 | `cd_ocupacao` | `INTEGER` | S | FK → `OCUPACAO.cd_ocupacao` | Ocupação declarada. | 3 dígitos; `999` = Outros | `CD_OCUPACAO` | Idem: varia por eleição. |
| 16 | `cd_estado_civil` | `INTEGER` | S | — | Estado civil declarado. | `1` Solteiro, `3` Casado, `5` Viúvo, `7` Separado, `9` Divorciado | `CD_ESTADO_CIVIL` | |
| 17 | `cd_cor_raca` | `INTEGER` | S | — | Cor/raça autodeclarada. | `1` Branca, `2` Preta, `3` Parda, `4` Amarela, `5` Indígena, `6` Não informado | `CD_COR_RACA` | Vem como texto `"03"` → `CAST` para inteiro. Só existe a partir de 2014. |
| 18 | `cd_sit_tot_turno` | `INTEGER` | S | FK → `SITUACAO_TOTALIZACAO.cd_sit_tot_turno` | Resultado do candidato no turno. | `1` Eleito, `2` Eleito por QP, `3` Eleito por média, `4` Não eleito, `5` Suplente, `6` 2º turno, `-1` sem resultado | `CD_SIT_TOT_TURNO` | `-1` → `NULL`. Base de `fl_eleito` (Q2, Q10). |

### Regras e decisões registradas

- **`POLITICO` ≠ `CANDIDATURA`.** Atributos que mudam entre eleições (instrução,
  ocupação, estado civil, cor/raça) ficam aqui; os fixos da pessoa (título,
  nascimento, gênero) ficam em `POLITICO`.
- **Removidos do modelo** (existiam só no leiaute ≤2010, não nos anos da base):
  `vr_despesa_max_campanha`, `nr_idade_data_posse`. Idade é derivada de
  `POLITICO.dt_nascimento` e `ELEICAO.dt_eleicao`.
- **Colunas do CSV não carregadas** (redundantes com tabelas de domínio ou
  metadados de geração): `DT_GERACAO`, `HH_GERACAO`, `DS_*` que duplicam um `CD_*`,
  `NM_PARTIDO`, `SG_PARTIDO`, `NM_COLIGACAO`, `DS_COMPOSICAO_*`, `DS_EMAIL`,
  `NM_SOCIAL_CANDIDATO`.
- **Encoding e tipos na carga:** CSV lido com `all_varchar=true`; casts para os
  tipos acima acontecem na camada tratada com `TRY_CAST`, e linhas que falham
  o cast são contadas e reportadas, não descartadas em silêncio.

### Pendências

- [ ] Confirmar volume real por ano após a carga (`SELECT ano, COUNT(*)`).
- [ ] Decidir se `cd_situacao_candidatura`, `cd_estado_civil` e `cd_cor_raca`
  viram tabelas de domínio próprias ou ficam como código + `CHECK`.
- [ ] Validar domínio de `cd_sit_tot_turno` contra os valores distintos reais
  (`SELECT DISTINCT CD_SIT_TOT_TURNO, DS_SIT_TOT_TURNO`).
