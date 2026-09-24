## 5. Dicionário de dados

As 32 entidades abaixo seguem o DER geral. As tabelas de atributos estão reservadas para preenchimento posterior; tipos, chaves e origens dos campos ainda serão documentados. O rascunho detalhado de `CANDIDATURA` está em `docs/dicionario-dados.md` e precisa ser conferido com o DER atual.

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
