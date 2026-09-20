# DER proposto — entrega de quinta (24/09/2026)

Modelo lógico em notação pé-de-galinha (Mermaid `erDiagram`). Cada módulo é a
tarefa de um integrante; a soma dos quatro é o DER da entrega.

> **Status:** o grupo vai desenhar o diagrama à mão. Este arquivo é **rascunho e
> fonte de consulta** (lista de entidades, atributos, cardinalidades), não a entrega.
>
> ⚠️ **Antes de desenhar, leia a seção 4.1 do [`estrategia.md`](estrategia.md).**
> Sete correções saíram da conferência dos arquivos reais e ainda **não** estão
> aplicadas aqui — entre elas: `cod_tse` é texto e não inteiro, falta a entidade
> `FEDERACAO`, e três atributos de `CANDIDATURA` não existem nos anos da nossa base.

---

## Visão geral — como os 4 módulos se conectam

```mermaid
erDiagram
    POLITICO       ||--o{ CANDIDATURA : "concorre em"
    ELEICAO        ||--o{ CANDIDATURA : "contem"
    CARGO          ||--o{ CANDIDATURA : "disputa"
    PARTIDO        ||--o{ CANDIDATURA : "lanca"
    MUNICIPIO      ||--o{ CANDIDATURA : "sedia"

    CANDIDATURA    ||--o{ VOTACAO_CANDIDATO_MUNICIPIO : "recebe"
    CANDIDATURA    ||--o{ RECEITA_CAMPANHA           : "arrecada"
    CANDIDATURA    ||--o{ DESPESA_CAMPANHA           : "gasta"
    CANDIDATURA    ||--o| PROPOSTA_GOVERNO           : "registra"

    MUNICIPIO      ||--o{ COMPARECIMENTO_MUNICIPIO   : "apura"
    MUNICIPIO      ||--o{ VOTACAO_LEGENDA_MUNICIPIO  : "apura"
    MUNICIPIO      ||--o{ VAGA                       : "oferta"
    MUNICIPIO      ||--o{ MUNICIPIO_ANO              : "tem indicador"
    MUNICIPIO      ||--o{ CENSO_INSTRUCAO            : "tem perfil"
    MUNICIPIO      ||--o{ CENSO_FAIXA_ETARIA         : "tem perfil"
    MUNICIPIO      ||--o{ ELEITORADO_MUNICIPIO       : "tem eleitorado"

    AGENTE_FINANCEIRO ||--o{ RECEITA_CAMPANHA : "doa"
    AGENTE_FINANCEIRO ||--o{ DESPESA_CAMPANHA : "fornece"
```

`MUNICIPIO` e `CANDIDATURA` são os dois eixos do modelo inteiro. **Todo cruzamento
TSE × IBGE passa por `MUNICIPIO`**, que é a entidade que faltava no desenho antigo.

---

## Módulo 1 — Núcleo eleitoral

> Fonte: `consulta_cand`, `consulta_coligacao`, `municipio_tse_ibge`,
> `localidades/municipios` (IBGE). Responde Q4, Q7, Q12 e sustenta todo o resto.

```mermaid
erDiagram
    UF ||--o{ MUNICIPIO : "contem"
    MUNICIPIO ||--o{ CANDIDATURA : "sedia"
    MUNICIPIO ||--o{ POLITICO : "e naturalidade de"
    ELEICAO ||--o{ CANDIDATURA : "contem"
    ELEICAO ||--o{ COLIGACAO : "registra"
    CARGO ||--o{ CANDIDATURA : "disputa"
    PARTIDO ||--o{ CANDIDATURA : "lanca"
    PARTIDO }o--o{ COLIGACAO : "compoe"
    COLIGACAO ||--o{ CANDIDATURA : "abriga"
    POLITICO ||--o{ CANDIDATURA : "concorre em"
    GRAU_INSTRUCAO ||--o{ CANDIDATURA : "classifica"
    OCUPACAO ||--o{ CANDIDATURA : "classifica"
    SITUACAO_TOTALIZACAO ||--o{ CANDIDATURA : "resulta em"

    UF {
        char sigla_uf PK
        int cod_uf_ibge UK
        varchar nome
        varchar regiao
    }
    MUNICIPIO {
        int cod_ibge PK "7 digitos"
        int cod_tse UK "5 digitos - ponte com o TSE"
        varchar nome
        char sigla_uf FK
        int cod_microrregiao
        varchar nome_microrregiao
        int cod_mesorregiao
        varchar nome_mesorregiao
    }
    ELEICAO {
        int id_eleicao PK
        int ano
        int cod_tipo_eleicao
        varchar nome_eleicao
        date dt_eleicao
    }
    CARGO {
        int cod_cargo PK
        varchar ds_cargo
        varchar abrangencia "municipal|estadual|federal"
    }
    PARTIDO {
        int nr_partido PK
        char sg_partido
        varchar nm_partido
    }
    COLIGACAO {
        bigint sq_coligacao PK
        int id_eleicao FK
        varchar nm_coligacao
        varchar ds_composicao
        varchar tp_agremiacao
    }
    POLITICO {
        int id_politico PK
        char nr_cpf UK "so existe de 2010 em diante"
        varchar nm_completo
        date dt_nascimento
        char cd_genero
        int cod_ibge_nascimento FK
    }
    CANDIDATURA {
        bigint sq_candidato PK "chave natural do TSE"
        int id_politico FK
        int id_eleicao FK
        int cod_cargo FK
        int nr_partido FK
        bigint sq_coligacao FK
        int cod_ibge FK "nulo em cargo estadual ou federal"
        char sigla_uf FK
        int nr_turno
        int nr_candidato
        varchar nm_urna
        int cd_grau_instrucao FK
        int cd_ocupacao FK
        int cd_sit_tot_turno FK
        int cd_estado_civil
        int cd_cor_raca
        int nr_idade_posse
        decimal vr_despesa_max_campanha
    }
    GRAU_INSTRUCAO {
        int cd_grau_instrucao PK
        varchar ds_grau_instrucao
        int ordem "para ordenar no grafico"
    }
    OCUPACAO {
        int cd_ocupacao PK
        varchar ds_ocupacao
    }
    SITUACAO_TOTALIZACAO {
        int cd_sit_tot_turno PK
        varchar ds_sit_tot_turno
        boolean fl_eleito "derivada - chave para Q2 e Q10"
    }
```

**Decisões que precisam ficar escritas no relatório:**

- `POLITICO` ≠ `CANDIDATURA`. A pessoa é uma; as candidaturas são várias ao longo
  dos anos. **Sem essa separação a Q12 não existe.**
- Atributos que **mudam entre eleições** (grau de instrução, ocupação, estado civil,
  partido) ficam em `CANDIDATURA`, não em `POLITICO`. Só nascimento, CPF, nome e
  sexo ficam na pessoa.
- Deduplicar `POLITICO`: CPF onde existir; nos anos antigos, `nome + data_nascimento
  + UF`. ⚠️ **Verificar localmente a partir de que ano o `consulta_cand` traz CPF** —
  isso define até onde a Q12 consegue voltar com segurança.
- Partidos mudam de nome e número (PFL → DEM → União Brasil). Para a Q9 (viés na
  linha do tempo) isso é um problema real: ou se adota a sigla vigente no ano, ou se
  cria uma tabela `PARTIDO_SUCESSAO`. **Decidir e documentar.**

---

## Módulo 2 — Resultados e votos

> Fonte: `votacao_candidato_munzona`, `votacao_partido_munzona`,
> `detalhe_votacao_munzona`, `consulta_vagas`. Responde Q1, Q2, Q3, Q5, Q9, Q10.

```mermaid
erDiagram
    CANDIDATURA ||--o{ VOTACAO_CANDIDATO_MUNICIPIO : "recebe"
    MUNICIPIO   ||--o{ VOTACAO_CANDIDATO_MUNICIPIO : "apura"
    MUNICIPIO   ||--o{ VOTACAO_LEGENDA_MUNICIPIO   : "apura"
    MUNICIPIO   ||--o{ COMPARECIMENTO_MUNICIPIO    : "apura"
    MUNICIPIO   ||--o{ VAGA                        : "oferta"
    PARTIDO     ||--o{ VOTACAO_LEGENDA_MUNICIPIO   : "recebe"
    ELEICAO     ||--o{ COMPARECIMENTO_MUNICIPIO    : "contextualiza"
    CARGO       ||--o{ VAGA                        : "define"

    VOTACAO_CANDIDATO_MUNICIPIO {
        bigint sq_candidato PK, FK
        int cod_ibge PK, FK
        int nr_turno PK
        bigint qt_votos_nominais
    }
    VOTACAO_LEGENDA_MUNICIPIO {
        int id_eleicao PK, FK
        int cod_cargo PK, FK
        int nr_partido PK, FK
        int cod_ibge PK, FK
        int nr_turno PK
        bigint qt_votos_legenda
        bigint qt_votos_nominais_partido
    }
    COMPARECIMENTO_MUNICIPIO {
        int id_eleicao PK, FK
        int cod_cargo PK, FK
        int cod_ibge PK, FK
        int nr_turno PK
        bigint qt_aptos
        bigint qt_comparecimento
        bigint qt_abstencao
        bigint qt_votos_validos
        bigint qt_votos_brancos
        bigint qt_votos_nulos
        decimal tx_abstencao "derivada"
    }
    VAGA {
        int id_eleicao PK, FK
        int cod_cargo PK, FK
        int cod_ibge PK, FK
        int qt_vagas
    }
```

**Cuidado de granularidade:** o TSE entrega tudo por **município × zona eleitoral**.
Zona não interessa a nenhuma das 12 perguntas e multiplica o volume. **Somar zona
fora já na carga** (`GROUP BY município`). Registrar a decisão — é uma agregação
deliberada, não perda de dado.

---

## Módulo 3 — Finanças de campanha

> Fonte: `prestacao_de_contas_eleitorais_candidatos_{ano}` (2018+) e
> `prestacao_contas_final_{ano}` (≤2016). Responde Q1, Q2, Q8, Q10, Q11.

```mermaid
erDiagram
    CANDIDATURA       ||--o{ RECEITA_CAMPANHA : "arrecada"
    CANDIDATURA       ||--o{ DESPESA_CAMPANHA : "gasta"
    AGENTE_FINANCEIRO ||--o{ RECEITA_CAMPANHA : "doa"
    AGENTE_FINANCEIRO ||--o{ DESPESA_CAMPANHA : "fornece"
    FONTE_RECURSO     ||--o{ RECEITA_CAMPANHA : "classifica"
    TIPO_DESPESA      ||--o{ DESPESA_CAMPANHA : "classifica"

    AGENTE_FINANCEIRO {
        int id_agente PK
        varchar nr_cpf_cnpj UK
        varchar nm_agente
        char tp_pessoa "PF ou PJ - chave da Q8"
        varchar cd_cnae
        varchar ds_cnae
    }
    FONTE_RECURSO {
        int cd_fonte_recurso PK
        varchar ds_fonte_recurso
        char tp_origem "PUBLICO PRIVADO PROPRIO - chave da Q10"
    }
    TIPO_DESPESA {
        int cd_tipo_despesa PK
        varchar ds_tipo_despesa
        boolean fl_propaganda "chave da Q11"
    }
    RECEITA_CAMPANHA {
        bigint id_receita PK
        bigint sq_candidato FK
        int id_agente FK
        int cd_fonte_recurso FK
        date dt_receita
        decimal vr_receita
        varchar ds_especie_recurso
        varchar ds_natureza_receita
    }
    DESPESA_CAMPANHA {
        bigint id_despesa PK
        bigint sq_candidato FK
        int id_agente FK
        int cd_tipo_despesa FK
        date dt_despesa
        decimal vr_despesa
        text ds_despesa "texto livre - insumo da nuvem da Q11"
    }
```

**`tp_origem` em `FONTE_RECURSO` é a entidade inteira da Q10.** Fundo Partidário e
FEFC = público; doação de PF/PJ e recursos próprios = privado. Essa classificação
é **nossa**, não vem pronta do TSE — precisa de uma tabela de-para escrita à mão a
partir dos valores distintos de `DS_FONTE_RECURSO`. Vale como contribuição do
trabalho; documentar o critério.

---

## Módulo 4 — Contexto socioeconômico e texto

> Fonte: SIDRA 6579/5938/10061/9514, `localidades/municipios`,
> `perfil_eleitorado` (TSE), Atlas Brasil. Responde Q3, Q4, Q6, Q7.

```mermaid
erDiagram
    MUNICIPIO ||--o{ MUNICIPIO_ANO        : "tem"
    MUNICIPIO ||--o{ CENSO_INSTRUCAO      : "tem"
    MUNICIPIO ||--o{ CENSO_FAIXA_ETARIA   : "tem"
    MUNICIPIO ||--o{ IDHM                 : "tem"
    MUNICIPIO ||--o{ ELEITORADO_MUNICIPIO : "tem"
    CANDIDATURA ||--o| PROPOSTA_GOVERNO   : "registra"
    PROPOSTA_GOVERNO ||--o{ TERMO_PROPOSTA : "gera"

    MUNICIPIO_ANO {
        int cod_ibge PK, FK
        int ano PK
        bigint qt_populacao_estimada "SIDRA 6579"
        decimal vr_pib_mil_corrente "SIDRA 5938"
        decimal vr_pib_per_capita "DERIVADA - nao vem do IBGE"
        varchar fl_porte "pequeno medio grande - derivada"
        varchar fl_faixa_renda "derivada por quartil de PIB per capita"
    }
    CENSO_INSTRUCAO {
        int cod_ibge PK, FK
        int ano_censo PK
        int cd_nivel_instrucao PK
        varchar ds_nivel_instrucao
        bigint qt_pessoas
    }
    CENSO_FAIXA_ETARIA {
        int cod_ibge PK, FK
        int ano_censo PK
        int cd_grupo_idade PK
        char cd_sexo PK
        bigint qt_pessoas
    }
    IDHM {
        int cod_ibge PK, FK
        int ano_referencia PK "so Censo 1991/2000/2010 - NAO existe 2022"
        decimal vl_idhm
        decimal vl_idhm_renda
        decimal vl_idhm_longevidade
        decimal vl_idhm_educacao
    }
    ELEITORADO_MUNICIPIO {
        int cod_ibge PK, FK
        int ano PK
        int cd_faixa_etaria PK
        int cd_escolaridade PK
        char cd_genero PK
        bigint qt_eleitores
    }
    PROPOSTA_GOVERNO {
        bigint sq_candidato PK, FK
        varchar url_pdf
        text tx_conteudo
        date dt_coleta
    }
    TERMO_PROPOSTA {
        bigint sq_candidato PK, FK
        varchar termo PK
        int qt_frequencia
    }
```

**Duas observações que valem nota:**

1. `vr_pib_per_capita` é **derivada** (`vr_pib_mil_corrente × 1000 ÷
   qt_populacao_estimada`). O IBGE não publica essa variável em nenhuma das tabelas
   de PIB municipal — conferimos as duas (21 e 5938).
2. `ELEITORADO_MUNICIPIO` (TSE) é **melhor que o Censo** para a Q7: idade do
   *eleitorado*, ano a ano, é mais próxima da pergunta do que idade da *população*
   só em ano de Censo. Sugiro Censo como reserva, eleitorado como principal.

---

## Mapa pergunta → entidades

| # | Pergunta | Entidades | Módulo |
|---|---|---|---|
| 1 | $ por cadeira | `DESPESA_CAMPANHA` + `VAGA` + `CANDIDATURA` | 3 + 2 |
| 2 | Taxa de sucesso × $$ | `DESPESA_CAMPANHA` + `SITUACAO_TOTALIZACAO` | 3 + 1 |
| 3 | IBGE × partidos × votados × abstenção | `MUNICIPIO_ANO` + `COMPARECIMENTO_MUNICIPIO` + `VOTACAO_CANDIDATO_MUNICIPIO` + `PARTIDO` | 4 + 2 |
| 4 | Instrução do candidato × população | `CANDIDATURA.cd_grau_instrucao` + `CENSO_INSTRUCAO` | 1 + 4 |
| 5 | Votos de legenda × partido | `VOTACAO_LEGENDA_MUNICIPIO` | 2 |
| 6 | Proposta → nuvem de palavras | `PROPOSTA_GOVERNO` + `TERMO_PROPOSTA` | 4 |
| 7 | Jovens × não jovens × viés | `POLITICO.dt_nascimento` + `ELEITORADO_MUNICIPIO` + `VOTACAO_CANDIDATO_MUNICIPIO` | 1 + 4 + 2 |
| 8 | PJ × viés (doação) | `RECEITA_CAMPANHA` + `AGENTE_FINANCEIRO` (tp_pessoa = PJ) + `PARTIDO` | 3 |
| 9 | Viés do município na linha do tempo | `VOTACAO_CANDIDATO_MUNICIPIO` + `PARTIDO` + `ELEICAO.ano` + `MUNICIPIO.nome_mesorregiao` | 2 + 1 |
| 10 | Eleito × recurso público/privado | `RECEITA_CAMPANHA` + `FONTE_RECURSO.tp_origem` + `SITUACAO_TOTALIZACAO` | 3 + 1 |
| 11 | Onde investe em propaganda | `DESPESA_CAMPANHA.ds_despesa` + `TIPO_DESPESA` + `AGENTE_FINANCEIRO.cd_cnae` | 3 |
| 12 | Linha do tempo do político | `POLITICO` + `CANDIDATURA` (todas as eleições) | 1 |

Nenhuma das 12 ficou sem cobertura. O módulo 1 aparece em 7 delas — por isso ele é
pré-requisito dos outros três.
