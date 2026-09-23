# DER — questões de Davi

Este arquivo detalha, em ordem, as três perguntas atribuídas ao Davi no
[`estrategia.md`](estrategia.md): Q1, Q2 e Q3.

---

## Q1 — quanto custa uma cadeira?

Para esta pergunta, **custo de uma cadeira** é o total de despesas contratadas por
todas as candidaturas de uma disputa dividido pela quantidade de vagas dessa
disputa. Uma disputa é identificada por eleição × município × cargo. Portanto, o
cálculo não é uma média apenas entre os eleitos:

```text
custo_por_cadeira = SUM(vr_despesa_contratada) / qt_vagas
```

O resultado pode ser comparado entre municípios, cargos e anos. A análise nacional
é formada pelas disputas de todos os municípios, mas o cálculo continua separado
por disputa; somar despesas e vagas de granularidades diferentes produziria uma
razão sem significado.

```mermaid
erDiagram
    ELEICAO   ||--o{ CANDIDATURA     : "contem"
    MUNICIPIO ||--o{ CANDIDATURA     : "sedia"
    CARGO     ||--o{ CANDIDATURA     : "e disputado em"

    CANDIDATURA ||--o{ DESPESA_CAMPANHA : "contrata"

    ELEICAO   ||--o{ VAGA : "oferta"
    MUNICIPIO ||--o{ VAGA : "oferta"
    CARGO     ||--o{ VAGA : "quantifica"

    ELEICAO {
        INTEGER CD_ELEICAO   PK "um codigo por turno"
        INTEGER ANO_ELEICAO
        INTEGER NR_TURNO        "1 ou 2"
    }

    MUNICIPIO {
        VARCHAR(5) CD_MUNICIPIO PK "codigo TSE; preservar zero a esquerda"
        INTEGER    COD_IBGE     UK "ponte para indicadores municipais"
        CHAR(2)    SG_UF
        VARCHAR    NM_MUNICIPIO
    }

    CARGO {
        INTEGER CD_CARGO PK "11 Prefeito; 13 Vereador"
        VARCHAR DS_CARGO
    }

    CANDIDATURA {
        BIGINT     SQ_CANDIDATO PK
        INTEGER    CD_ELEICAO   FK
        VARCHAR(5) CD_MUNICIPIO FK
        INTEGER    CD_CARGO     FK
    }

    DESPESA_CAMPANHA {
        BIGINT  SQ_DESPESA            PK
        BIGINT  SQ_CANDIDATO          FK
        DECIMAL VR_DESPESA_CONTRATADA    "15,2"
    }

    VAGA {
        INTEGER    CD_ELEICAO   PK, FK
        VARCHAR(5) CD_MUNICIPIO PK, FK
        INTEGER    CD_CARGO     PK, FK
        INTEGER    QT_VAGAS
    }
```

### Cardinalidades

| Relação | Cardinalidade | Justificativa |
| --- | --- | --- |
| `ELEICAO` – `CANDIDATURA` | 1:N | uma eleição contém várias candidaturas |
| `MUNICIPIO` – `CANDIDATURA` | 1:N | no recorte municipal, cada candidatura disputa em um município |
| `CARGO` – `CANDIDATURA` | 1:N | várias candidaturas concorrem ao mesmo cargo |
| `CANDIDATURA` – `DESPESA_CAMPANHA` | 1:N | uma candidatura pode contratar nenhuma ou várias despesas |
| `ELEICAO` – `VAGA` | 1:N | cada eleição publica vagas para várias disputas |
| `MUNICIPIO` – `VAGA` | 1:N | um município oferece vagas para mais de um cargo e ano |
| `CARGO` – `VAGA` | 1:N | o mesmo cargo tem quantidades de vagas em vários municípios e eleições |

### Observações de modelagem e cálculo

- `VAGA` vem de `consulta_vagas`. Em 2016 o campo bruto é `QT_VAGAS`; de 2018 em
  diante é `QT_VAGA`. Ambos são normalizados para `qt_vagas` na carga.
- O join deve usar as três chaves da disputa: `CD_ELEICAO`, `CD_MUNICIPIO` e
  `CD_CARGO`. Juntar só por ano ou município mistura Prefeito com Vereador e pode
  multiplicar despesas.
- Primeiro se soma `VR_DESPESA_CONTRATADA` por candidatura; depois por disputa; só
  então se divide por `QT_VAGAS`. Candidatura sem despesa registrada entra como
  zero por meio de `LEFT JOIN` a partir de `CANDIDATURA`.
- `SQ_DESPESA` só funciona como PK depois de filtrar a prestação Final e remover
  valores `-1`/nulos, conforme a regra já registrada na Q2.
- O modelo acima cobre eleições **municipais**, nas quais `SG_UE` identifica o
  município. Em eleições gerais `SG_UE` é UF ou `BR`; não se deve fingir que é um
  código municipal. Para comparar cargos estaduais/federais seria necessária uma
  entidade mais geral `UNIDADE_ELEITORAL`.

---

## Q2 — taxa de sucesso × patrimônio declarado

Leitura (pé-de-galinha): `||` exatamente um, `o{` zero ou muitos. Todas as FKs da
Q2 são `NOT NULL`, então todo lado "1" é obrigatório. `BEM_CANDIDATO` e
`PAGAMENTO_DESPESA` são entidades propostas (não estão no `der.md` do repositório).
`CARGO` aparece só pela chave porque o dicionário ainda não a descreve.

```mermaid
erDiagram
    %% ---- dimensoes ----
    UF                   ||--o{ MUNICIPIO   : "contem"
    POLITICO             ||--o{ CANDIDATURA : "concorre em"
    ELEICAO              ||--o{ CANDIDATURA : "contem"
    MUNICIPIO            ||--o{ CANDIDATURA : "sedia"
    CARGO                ||--o{ CANDIDATURA : "e disputado em"
    SITUACAO_TOTALIZACAO ||--o{ CANDIDATURA : "resulta em"

    %% ---- sucesso ----
    CANDIDATURA ||--o{ VOTACAO_CANDIDATO_MUNICIPIO : "recebe"
    MUNICIPIO   ||--o{ VOTACAO_CANDIDATO_MUNICIPIO : "totaliza"

    %% ---- dinheiro ----
    CANDIDATURA      ||--o{ BEM_CANDIDATO     : "declara"
    CANDIDATURA      ||--o{ RECEITA_CAMPANHA  : "arrecada"
    CANDIDATURA      ||--o{ DESPESA_CAMPANHA  : "contrata"
    DESPESA_CAMPANHA ||--o{ PAGAMENTO_DESPESA : "e paga por"

    ELEICAO {
        INTEGER CD_ELEICAO      PK "4 - um codigo por turno"
        INTEGER ANO_ELEICAO        "4 - AA_ELEICAO na prestacao de contas"
        INTEGER CD_TIPO_ELEICAO    "1 - filtrar = 2 (ordinaria)"
        INTEGER NR_TURNO           "1 - valores 1, 2"
    }

    UF {
        CHAR(2) SG_UF PK
    }

    MUNICIPIO {
        VARCHAR(5) CD_MUNICIPIO PK "cod_tse - LPAD 5 zeros; SG_UE na prestacao"
        CHAR(2)    SG_UF        FK
    }

    CARGO {
        INTEGER CD_CARGO PK "2 - 11 Prefeito, 12 Vice, 13 Vereador"
    }

    SITUACAO_TOTALIZACAO {
        INTEGER     CD_SIT_TOT_TURNO PK "1 - sucesso = 1, 2, 3"
        VARCHAR(16) DS_SIT_TOT_TURNO
    }

    POLITICO {
        INTEGER     ID_POLITICO                   PK "surrogate gerado na carga"
        VARCHAR(12) NR_TITULO_ELEITORAL_CANDIDATO UK "chave natural - LPAD 12"
        VARCHAR(11) NR_CPF_CANDIDATO                 "NULL - nunca chave; -4 em 2024"
        VARCHAR(69) NM_CANDIDATO                     "da eleicao mais recente"
        DATE        DT_NASCIMENTO                    "NULL - dd/mm/aaaa"
        INTEGER     CD_GENERO                        "NULL - 2 Masc, 4 Fem"
        CHAR(2)     SG_UF_NASCIMENTO                 "NULL - ZZ exterior"
    }

    CANDIDATURA {
        BIGINT     SQ_CANDIDATO     PK "12 - chave de cruzamento"
        INTEGER    ID_POLITICO      FK
        INTEGER    CD_ELEICAO       FK
        VARCHAR(5) CD_MUNICIPIO     FK "SG_UE na prestacao de contas"
        INTEGER    CD_CARGO         FK "comparar sempre dentro do mesmo cargo"
        INTEGER    CD_SIT_TOT_TURNO FK "base da taxa de sucesso"
    }

    VOTACAO_CANDIDATO_MUNICIPIO {
        BIGINT     SQ_CANDIDATO              PK, FK
        INTEGER    NR_TURNO                  PK
        VARCHAR(5) CD_MUNICIPIO              PK, FK
        INTEGER    NR_ZONA                   PK "3"
        INTEGER    QT_VOTOS_NOMINAIS_VALIDOS    "6 - SUM por SQ_CANDIDATO, NR_TURNO"
    }

    BEM_CANDIDATO {
        BIGINT  SQ_CANDIDATO           PK, FK
        INTEGER NR_ORDEM_BEM_CANDIDATO PK "3"
        INTEGER CD_TIPO_BEM_CANDIDATO     "2 - 50 codigos em 2024"
        DECIMAL VR_BEM_CANDIDATO          "15,2 - patrimonio = SUM por SQ_CANDIDATO"
    }

    RECEITA_CAMPANHA {
        BIGINT  SQ_RECEITA   PK "NULL/-1 em 3,3%; filtrar TP_PRESTACAO_CONTAS = Final"
        BIGINT  SQ_CANDIDATO FK
        DECIMAL VR_RECEITA      "15,2"
    }

    DESPESA_CAMPANHA {
        BIGINT  SQ_DESPESA            PK "NULL/-1 em 3,5%; filtrar TP_PRESTACAO_CONTAS = Final"
        BIGINT  SQ_CANDIDATO          FK
        DECIMAL VR_DESPESA_CONTRATADA    "15,2"
    }

    PAGAMENTO_DESPESA {
        BIGINT  SQ_DESPESA              PK, FK
        INTEGER SQ_PARCELAMENTO_DESPESA PK
        DECIMAL VR_PAGTO_DESPESA           "15,2 - contratado diferente de pago"
    }
```

## Cardinalidades

| Relação | Cardinalidade | Justificativa (dicionário) |
| --- | --- | --- |
| `POLITICO` – `CANDIDATURA` | 1:N | uma pessoa, várias candidaturas ao longo dos anos; `ID_POLITICO` NOT NULL |
| `ELEICAO` – `CANDIDATURA` | 1:N | cada turno tem seu `CD_ELEICAO`; candidato de 2º turno = duas candidaturas |
| `MUNICIPIO` – `CANDIDATURA` | 1:N | `CD_MUNICIPIO` NOT NULL (recorte é eleição municipal) |
| `CARGO` – `CANDIDATURA` | 1:N | `CD_CARGO` NOT NULL |
| `SITUACAO_TOTALIZACAO` – `CANDIDATURA` | 1:N | `CD_SIT_TOT_TURNO` NOT NULL |
| `UF` – `MUNICIPIO` | 1:N | `SG_UF` NOT NULL |
| `CANDIDATURA` – `VOTACAO_CANDIDATO_MUNICIPIO` | 1:N | uma linha por candidato × turno × município × zona |
| `MUNICIPIO` – `VOTACAO_CANDIDATO_MUNICIPIO` | 1:N | `CD_MUNICIPIO` na PK composta |
| `CANDIDATURA` – `BEM_CANDIDATO` | 1:N | uma linha por bem; zero linhas = patrimônio zero |
| `CANDIDATURA` – `RECEITA_CAMPANHA` | 1:N | uma linha por receita declarada |
| `CANDIDATURA` – `DESPESA_CAMPANHA` | 1:N | uma linha por despesa contratada |
| `DESPESA_CAMPANHA` – `PAGAMENTO_DESPESA` | 1:N | uma despesa contratada pode ter vários pagamentos |

## Observações de modelagem

- `DECIMAL` nos atributos de valor é `DECIMAL(15,2)`; a precisão foi para o
  comentário porque a notação Mermaid não aceita vírgula no tipo.
- `SQ_RECEITA` e `SQ_DESPESA` são PK no dicionário mas aceitam `-1`/nulo e
  repetem entre entregas Parcial/Final. Na carga: filtrar `TP_PRESTACAO_CONTAS =
  'Final'` e descartar `-1`; só então a PK vale.
- `PAGAMENTO_DESPESA` tem PK composta `(SQ_DESPESA, SQ_PARCELAMENTO_DESPESA)`; o
  dicionário cita `SQ_PARCELAMENTO_DESPESA` só na coluna Chave, por isso ele
  aparece no diagrama sem tipo confirmado (assumido `INTEGER`).
- `CD_MUNICIPIO` é `VARCHAR(5)` com zero à esquerda nos dois lados
  (`LPAD(…, 5, '0')`), senão o join votação × prestação de contas perde linhas.

---

## Q3 — índices municipais × eleitos e partidos vitoriosos

Pergunta recebida: “Quais os índices de dado município (PIB per capita, IDHM,
eleitores por população total, isentos = votos brancos + nulos + abstenções) com
relação aos eleitos/partidos mais vitoriosos?”

O grão de análise é **município × eleição × cargo × turno**. `MUNICIPIO` faz a
ponte entre o código TSE, usado nos resultados eleitorais, e o código IBGE, usado
nos indicadores socioeconômicos.

```mermaid
erDiagram
    UF        ||--o{ MUNICIPIO : "contem"
    MUNICIPIO ||--o{ MUNICIPIO_ANO : "tem indicadores"
    MUNICIPIO ||--o{ IDHM : "tem indice historico"
    MUNICIPIO ||--o{ ELEITORADO_MUNICIPIO : "tem eleitorado"

    ELEICAO              ||--o{ CANDIDATURA : "contem"
    PARTIDO              ||--o{ CANDIDATURA : "lanca"
    CARGO                ||--o{ CANDIDATURA : "e disputado em"
    SITUACAO_TOTALIZACAO ||--o{ CANDIDATURA : "resulta em"
    MUNICIPIO            o|--o{ CANDIDATURA : "sedia se municipal"

    CANDIDATURA ||--o{ VOTACAO_CANDIDATO_MUNICIPIO : "recebe"
    MUNICIPIO   ||--o{ VOTACAO_CANDIDATO_MUNICIPIO : "totaliza"
    ELEICAO     ||--o{ VOTACAO_CANDIDATO_MUNICIPIO : "contextualiza"

    MUNICIPIO ||--o{ COMPARECIMENTO_MUNICIPIO : "apura"
    ELEICAO   ||--o{ COMPARECIMENTO_MUNICIPIO : "contextualiza"
    CARGO     ||--o{ COMPARECIMENTO_MUNICIPIO : "segmenta"

    UF {
        CHAR(2) SG_UF PK
    }

    MUNICIPIO {
        VARCHAR(5) CD_MUNICIPIO PK "codigo TSE; LPAD 5"
        INTEGER    COD_IBGE     UK "codigo IBGE; 7 digitos"
        CHAR(2)    SG_UF        FK
        VARCHAR    NM_MUNICIPIO
    }

    MUNICIPIO_ANO {
        INTEGER COD_IBGE             PK, FK
        INTEGER ANO_REFERENCIA       PK
        BIGINT  QT_POPULACAO_ESTIMADA   "SIDRA 6579"
        DECIMAL VR_PIB_PER_CAPITA       "IBGE PIB dos Municipios"
    }

    IDHM {
        INTEGER COD_IBGE       PK, FK
        INTEGER ANO_REFERENCIA PK "1991, 2000 ou 2010"
        DECIMAL VL_IDHM
    }

    ELEITORADO_MUNICIPIO {
        VARCHAR(5) CD_MUNICIPIO PK, FK
        INTEGER    ANO_ELEICAO  PK
        BIGINT     QT_ELEITORES    "SUM QT_ELEITORES_PERFIL"
    }

    ELEICAO {
        INTEGER CD_ELEICAO PK
        INTEGER ANO_ELEICAO
        INTEGER NR_TURNO
    }

    CARGO {
        INTEGER CD_CARGO PK
        VARCHAR DS_CARGO
    }

    PARTIDO {
        INTEGER NR_PARTIDO PK
        VARCHAR SG_PARTIDO
        VARCHAR NM_PARTIDO
    }

    SITUACAO_TOTALIZACAO {
        INTEGER CD_SIT_TOT_TURNO PK
        VARCHAR DS_SIT_TOT_TURNO
        BOOLEAN FL_ELEITO           "1, 2, 3 = true"
    }

    CANDIDATURA {
        BIGINT     SQ_CANDIDATO     PK
        INTEGER    CD_ELEICAO       FK
        VARCHAR(5) CD_MUNICIPIO     FK "NULL em eleicao geral"
        INTEGER    CD_CARGO         FK
        INTEGER    NR_PARTIDO       FK
        INTEGER    CD_SIT_TOT_TURNO FK
    }

    VOTACAO_CANDIDATO_MUNICIPIO {
        BIGINT     SQ_CANDIDATO PK, FK
        INTEGER    CD_ELEICAO   PK, FK
        INTEGER    NR_TURNO     PK
        VARCHAR(5) CD_MUNICIPIO PK, FK
        INTEGER    NR_ZONA      PK
        BIGINT     QT_VOTOS_NOMINAIS_VALIDOS
    }

    COMPARECIMENTO_MUNICIPIO {
        INTEGER    CD_ELEICAO       PK, FK
        INTEGER    NR_TURNO         PK
        INTEGER    CD_CARGO         PK, FK
        VARCHAR(5) CD_MUNICIPIO     PK, FK
        INTEGER    NR_ZONA          PK
        BIGINT     QT_APTOS
        BIGINT     QT_ABSTENCOES
        BIGINT     QT_VOTOS_BRANCOS
        BIGINT     QT_VOTOS_NULOS
    }
```

### Cardinalidades

| Relação | Cardinalidade | Justificativa |
| --- | --- | --- |
| `UF` – `MUNICIPIO` | 1:N | uma UF contém vários municípios |
| `MUNICIPIO` – `MUNICIPIO_ANO` | 1:N | população e PIB variam por município e ano |
| `MUNICIPIO` – `IDHM` | 1:N | há uma observação por Censo disponível |
| `MUNICIPIO` – `ELEITORADO_MUNICIPIO` | 1:N | o total de eleitores muda a cada ano eleitoral |
| `MUNICIPIO` – `CANDIDATURA` | 1:N opcional | identifica a disputa local em eleição municipal; é nulo em eleição geral |
| `PARTIDO` – `CANDIDATURA` | 1:N | um partido lança várias candidaturas |
| `SITUACAO_TOTALIZACAO` – `CANDIDATURA` | 1:N | a situação identifica quais candidaturas foram eleitas |
| `CANDIDATURA` – `VOTACAO_CANDIDATO_MUNICIPIO` | 1:N | os votos de uma candidatura são distribuídos por município e zona |
| `MUNICIPIO` – `VOTACAO_CANDIDATO_MUNICIPIO` | 1:N | cada município totaliza votos de vários candidatos |
| `MUNICIPIO` – `COMPARECIMENTO_MUNICIPIO` | 1:N | a apuração é separada por eleição, cargo, turno e zona |

### Indicadores derivados

| Indicador | Cálculo no grão municipal | Observação |
| --- | --- | --- |
| PIB per capita | `vr_pib_per_capita` | usar o ano disponível mais próximo, sem ultrapassar o ano da eleição |
| IDHM | `vl_idhm` | para município, o último valor disponível é o do Censo 2010 |
| eleitores / população | `qt_eleitores / qt_populacao_estimada` | numerador e denominador precisam representar o mesmo ano |
| “isentos” | `(SUM(qt_votos_brancos) + SUM(qt_votos_nulos) + SUM(qt_abstencoes)) / SUM(qt_aptos)` | calcular dentro do mesmo cargo e turno |
| votos do partido | `SUM(qt_votos_nominais_validos)` agrupado por `nr_partido` | o partido do voto vem da candidatura |
| vitórias do partido | `COUNT(DISTINCT sq_candidato)` onde `fl_eleito = true` | ranquear dentro da mesma eleição e cargo |

### Observações de modelagem e cálculo

- `ELEITORADO_MUNICIPIO` é uma tabela agregada para esta pergunta. Sua quantidade
  vem de `SUM(QT_ELEITORES_PERFIL)` do `perfil_eleitorado`, eliminando as dimensões
  de gênero, faixa etária, escolaridade etc. antes do join.
- `COMPARECIMENTO_MUNICIPIO` e `VOTACAO_CANDIDATO_MUNICIPIO` aparecem no grão bruto
  município × zona. Para a análise municipal, somar as zonas primeiro. Nunca juntar
  as duas tabelas ainda no grão bruto: isso cria produto cartesiano entre candidatos
  e linhas de comparecimento e infla votos e eleitores.
- A soma de brancos, nulos e abstenções é chamada de **“isentos” apenas para manter
  o vocabulário da pergunta**. Tecnicamente, ela representa votos não válidos mais
  não comparecimento; não são eleitores legalmente isentos de votar.
- `QT_APTOS`, brancos, nulos e abstenções se repetem por cargo. O índice deve ser
  calculado separadamente por cargo (por exemplo, Prefeito) ou usando um único cargo
  representativo; somar Prefeito e Vereador duplica o eleitorado.
- O IDHM municipal é do Atlas Brasil e só existe para 1991, 2000 e 2010. Ele deve
  aparecer com `ano_referencia` no resultado; não pode ser rotulado como IDHM de
  2020 ou 2024.
- PIB per capita e população têm calendários distintos. Para evitar olhar o futuro,
  associe à eleição o dado mais recente cujo `ano_referencia <= ano_eleicao`.
- “Partido mais vitorioso” precisa de critério explícito. Para cadeiras conquistadas,
  use a contagem de candidaturas com `FL_ELEITO = true` e o município da disputa;
  esse ranking local só existe diretamente nas eleições municipais. Para preferência
  eleitoral local, inclusive em eleições gerais, use a soma dos votos no município.
  São rankings diferentes e ambos podem ser relacionados aos quatro índices.
