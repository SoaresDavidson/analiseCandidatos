# DER — Q2: taxa de sucesso × patrimônio declarado


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
