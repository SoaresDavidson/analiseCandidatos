# Esquemas reais dos arquivos baixados

Gerado por `scripts/inspecionar_esquemas.py` a partir de `dados/raw/`.
**Não editar à mão** — rode o script de novo.

Cada bloco mostra as colunas que o arquivo tem de verdade, quantas linhas,
e uma linha de exemplo. Use isto para desenhar o DER, não a documentação.

## TSE

### `perfil_comparecimento_abstencao` (2016–2024)

Fonte: `dados/raw/abstencao/2024/comparecimento_abstencao_2024/perfil_comparecimento_abstencao_2024_BRASIL.csv`

Anos com este mesmo esquema: **2016, 2018, 2020, 2022, 2024**

43 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 29/04/2025 |
| 2 | `HH_GERACAO` | 16:22:43 |
| 3 | `ANO_ELEICAO` | 2024 |
| 4 | `NR_TURNO` | 1 |
| 5 | `SG_UF` | PR |
| 6 | `CD_MUNICIPIO` | 74004 |
| 7 | `NM_MUNICIPIO` | GODOY MOREIRA |
| 8 | `NR_ZONA` | 132 |
| 9 | `CD_GENERO` | 2 |
| 10 | `DS_GENERO` | MASCULINO |
| 11 | `CD_ESTADO_CIVIL` | 1 |
| 12 | `DS_ESTADO_CIVIL` | SOLTEIRO |
| 13 | `CD_FAIXA_ETARIA` | 1600 |
| 14 | `DS_FAIXA_ETARIA` | 16 anos |
| 15 | `CD_GRAU_ESCOLARIDADE` | 3 |
| 16 | `DS_GRAU_ESCOLARIDADE` | ENSINO FUNDAMENTAL INCOMPLETO |
| 17 | `CD_COR_RACA` | 3 |
| 18 | `DS_COR_RACA` | Parda |
| 19 | `CD_QUILOMBOLA` | 2 |
| 20 | `DS_QUILOMBOLA` | NÃO |
| 21 | `CD_INTERPRETE_LIBRAS` | 2 |
| 22 | `DS_INTERPRETE_LIBRAS` | NÃO |
| 23 | `CD_IDENTIDADE_GENERO` | 1 |
| 24 | `DS_IDENTIDADE_GENERO` | Cisgênero |
| 25 | `CD_IDIOMA_INDIGENA` | -1 |
| 26 | `DS_IDIOMA_INDIGENA` | NÃO INFORMADO |
| 27 | `CD_GRUPO_INDIGENA` | -1 |
| 28 | `DS_GRUPO_INDIGENA` | NÃO INFORMADO |
| 29 | `QT_APTOS` | 1 |
| 30 | `QT_COMPARECIMENTO` | 1 |
| 31 | `QT_ABSTENCAO` | 0 |
| 32 | `QT_COMPARECIMENTO_DEFICIENCIA` | 0 |
| 33 | `QT_ABSTENCAO_DEFICIENCIA` | 0 |
| 34 | `QT_COMPARECIMENTO_TTE` | 0 |
| 35 | `QT_ABSTENCAO_TTE` | 0 |
| 36 | `QT_COMPAREC_FACULTATIVO` | 1 |
| 37 | `QT_ABST_FACULTATIVO` | 0 |
| 38 | `QT_COMPAREC_OBRIGATORIO` | 0 |
| 39 | `QT_ABST_OBRIGATORIO` | 0 |
| 40 | `QT_COMPAREC_DEFIC_FACULTATIVO` | 0 |
| 41 | `QT_ABST_DEFIC_FACULTATIVO` | 0 |
| 42 | `QT_COMPAREC_DEFIC_OBRIGATORIO` | 0 |
| 43 | `QT_ABST_DEFIC_OBRIGATORIO` | 0 |

### `consulta_cand` (2002–2012)

Fonte: `dados/raw/candidatos/2012/candidatos_2012/consulta_cand_2012_BRASIL.csv`

Anos com este mesmo esquema: **2002, 2004, 2006, 2008, 2010, 2012**

63 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 22/07/2022 |
| 2 | `HH_GERACAO` | 16:10:47 |
| 3 | `ANO_ELEICAO` | 2012 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | ELEIÇÃO ORDINÁRIA |
| 6 | `NR_TURNO` | 1 |
| 7 | `CD_ELEICAO` | 47 |
| 8 | `DS_ELEICAO` | Eleição Municipal 2012 |
| 9 | `DT_ELEICAO` | 07/10/2012 |
| 10 | `TP_ABRANGENCIA` | MUNICIPAL |
| 11 | `SG_UF` | ES |
| 12 | `SG_UE` | 56170 |
| 13 | `NM_UE` | BARRA DE SÃO FRANCISCO |
| 14 | `CD_CARGO` | 13 |
| 15 | `DS_CARGO` | VEREADOR |
| 16 | `SQ_CANDIDATO` | 80000011933 |
| 17 | `NR_CANDIDATO` | 70000 |
| 18 | `NM_CANDIDATO` | PEDRINHO GODOY DE OLIVEIRA |
| 19 | `NM_URNA_CANDIDATO` | PEDRINHO GODOY |
| 20 | `NM_SOCIAL_CANDIDATO` | #NE# |
| 21 | `NR_CPF_CANDIDATO` | 11035304708 |
| 22 | `NM_EMAIL` | #NULO# |
| 23 | `CD_SITUACAO_CANDIDATURA` | 12 |
| 24 | `DS_SITUACAO_CANDIDATURA` | APTO |
| 25 | `CD_DETALHE_SITUACAO_CAND` | 2 |
| 26 | `DS_DETALHE_SITUACAO_CAND` | DEFERIDO |
| 27 | `TP_AGREMIACAO` | COLIGAÇÃO |
| 28 | `NR_PARTIDO` | 70 |
| 29 | `SG_PARTIDO` | PT do B |
| 30 | `NM_PARTIDO` | PARTIDO TRABALHISTA DO BRASIL |
| 31 | `SQ_COLIGACAO` | 80000000563 |
| 32 | `NM_COLIGACAO` | UNIDOS POR UM FUTURO MELHOR |
| 33 | `DS_COMPOSICAO_COLIGACAO` | PRB / PSL / PMN / PT do B |
| 34 | `CD_NACIONALIDADE` | 1 |
| 35 | `DS_NACIONALIDADE` | BRASILEIRA NATA |
| 36 | `SG_UF_NASCIMENTO` | ES |
| 37 | `CD_MUNICIPIO_NASCIMENTO` | -3 |
| 38 | `NM_MUNICIPIO_NASCIMENTO` | BARRA DE SAO FRANCISCO |
| 39 | `DT_NASCIMENTO` | 31/08/1984 |
| 40 | `NR_IDADE_DATA_POSSE` | 28 |
| 41 | `NR_TITULO_ELEITORAL_CANDIDATO` | 023976801422 |
| 42 | `CD_GENERO` | 2 |
| 43 | `DS_GENERO` | MASCULINO |
| 44 | `CD_GRAU_INSTRUCAO` | 6 |
| 45 | `DS_GRAU_INSTRUCAO` | ENSINO MÉDIO COMPLETO |
| 46 | `CD_ESTADO_CIVIL` | 1 |
| 47 | `DS_ESTADO_CIVIL` | SOLTEIRO(A) |
| 48 | `CD_COR_RACA` | -3 |
| 49 | `DS_COR_RACA` | #NE# |
| 50 | `CD_OCUPACAO` | 390 |
| 51 | `DS_OCUPACAO` | SECRETÁRIO E DATILÓGRAFO |
| 52 | `VR_DESPESA_MAX_CAMPANHA` | 100000 |
| 53 | `CD_SIT_TOT_TURNO` | 4 |
| 54 | `DS_SIT_TOT_TURNO` | NÃO ELEITO |
| 55 | `ST_REELEICAO` | N |
| 56 | `ST_DECLARAR_BENS` | S |
| 57 | `NR_PROTOCOLO_CANDIDATURA` | 9900131752012 |
| 58 | `NR_PROCESSO` | 2017220126080023 |
| 59 | `CD_SITUACAO_CANDIDATO_PLEITO` | 2 |
| 60 | `DS_SITUACAO_CANDIDATO_PLEITO` | DEFERIDO |
| 61 | `CD_SITUACAO_CANDIDATO_URNA` | 2 |
| 62 | `DS_SITUACAO_CANDIDATO_URNA` | DEFERIDO |
| 63 | `ST_CANDIDATO_INSERIDO_URNA` | SIM |

### `bem_candidato` (2016)

Fonte: `dados/raw/candidatos/2016/bens_candidato_2016/bem_candidato_2016_BRASIL.csv`

Anos com este mesmo esquema: **2016**

19 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 18/02/2021 |
| 2 | `HH_GERACAO` | 12:06:52 |
| 3 | `ANO_ELEICAO` | 2016 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Ordinária |
| 6 | `CD_ELEICAO` | 220 |
| 7 | `DS_ELEICAO` | Eleições Municipais 2016 |
| 8 | `DT_ELEICAO` | 02/10/2016 |
| 9 | `SG_UF` | BA |
| 10 | `SG_UE` | 34835 |
| 11 | `NM_UE` | CORONEL JOÃO SÁ |
| 12 | `SQ_CANDIDATO` | 50000018442 |
| 13 | `NR_ORDEM_CANDIDATO` | 3 |
| 14 | `CD_TIPO_BEM_CANDIDATO` | 21 |
| 15 | `DS_TIPO_BEM_CANDIDATO` | Veículo automotor terrestre: caminhão, automóvel, moto, etc. |
| 16 | `DS_BEM_CANDIDATO` | CAMINHÃO MODELO 1620, MERCEDEZ BENZ, COR AMARELA, ANO 2010,  |
| 17 | `VR_BEM_CANDIDATO` | 50000,00 |
| 18 | `DT_ULTIMA_ATUALIZACAO` | 12/07/2018 |
| 19 | `HH_ULTIMA_ATUALIZACAO` | 16:35:48 |

### `consulta_cand` (2016)

Fonte: `dados/raw/candidatos/2016/candidatos_2016/consulta_cand_2016_BRASIL.csv`

Anos com este mesmo esquema: **2016**

75 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 13/03/2023 |
| 2 | `HH_GERACAO` | 15:28:45 |
| 3 | `ANO_ELEICAO` | 2016 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | ELEIÇÃO ORDINÁRIA |
| 6 | `NR_TURNO` | 1 |
| 7 | `CD_ELEICAO` | 220 |
| 8 | `DS_ELEICAO` | Eleições Municipais 2016 |
| 9 | `DT_ELEICAO` | 02/10/2016 |
| 10 | `TP_ABRANGENCIA` | MUNICIPAL |
| 11 | `SG_UF` | MA |
| 12 | `SG_UE` | 07439 |
| 13 | `NM_UE` | BURITI BRAVO |
| 14 | `CD_CARGO` | 13 |
| 15 | `DS_CARGO` | VEREADOR |
| 16 | `SQ_CANDIDATO` | 100000004568 |
| 17 | `NR_CANDIDATO` | 14456 |
| 18 | `NM_CANDIDATO` | MARIA SOLIDADE COSME DE OLIVEIRA |
| 19 | `NM_URNA_CANDIDATO` | XUXA |
| 20 | `NM_SOCIAL_CANDIDATO` | #NULO# |
| 21 | `NR_CPF_CANDIDATO` | 95168559387 |
| 22 | `NM_EMAIL` | NÃO DIVULGÁVEL |
| 23 | `CD_SITUACAO_CANDIDATURA` | 12 |
| 24 | `DS_SITUACAO_CANDIDATURA` | APTO |
| 25 | `CD_DETALHE_SITUACAO_CAND` | 2 |
| 26 | `DS_DETALHE_SITUACAO_CAND` | DEFERIDO |
| 27 | `TP_AGREMIACAO` | COLIGAÇÃO |
| 28 | `NR_PARTIDO` | 14 |
| 29 | `SG_PARTIDO` | PTB |
| 30 | `NM_PARTIDO` | PARTIDO TRABALHISTA BRASILEIRO |
| 31 | `NR_FEDERACAO` | -1 |
| 32 | `NM_FEDERACAO` | #NULO# |
| 33 | `SG_FEDERACAO` | #NULO# |
| 34 | `DS_COMPOSICAO_FEDERACAO` | #NULO# |
| 35 | `SQ_COLIGACAO` | 100000000354 |
| 36 | `NM_COLIGACAO` | BURITI BRAVO NO RUMO CERTO I |
| 37 | `DS_COMPOSICAO_COLIGACAO` | PTB / DEM / PTN |
| 38 | `CD_NACIONALIDADE` | 1 |
| 39 | `DS_NACIONALIDADE` | BRASILEIRA NATA |
| 40 | `SG_UF_NASCIMENTO` | MA |
| 41 | `CD_MUNICIPIO_NASCIMENTO` | -3 |
| 42 | `NM_MUNICIPIO_NASCIMENTO` | PASSAGEM FRANCA |
| 43 | `DT_NASCIMENTO` | 08/01/1943 |
| 44 | `NR_IDADE_DATA_POSSE` | 73 |
| 45 | `NR_TITULO_ELEITORAL_CANDIDATO` | 035741881104 |
| 46 | `CD_GENERO` | 4 |
| 47 | `DS_GENERO` | FEMININO |
| 48 | `CD_GRAU_INSTRUCAO` | 3 |
| 49 | `DS_GRAU_INSTRUCAO` | ENSINO FUNDAMENTAL INCOMPLETO |
| 50 | `CD_ESTADO_CIVIL` | 3 |
| 51 | `DS_ESTADO_CIVIL` | CASADO(A) |
| 52 | `CD_COR_RACA` | 03 |
| 53 | `DS_COR_RACA` | PARDA |
| 54 | `CD_OCUPACAO` | 606 |
| 55 | `DS_OCUPACAO` | TRABALHADOR RURAL |
| 56 | `VR_DESPESA_MAX_CAMPANHA` | 10803.91 |
| 57 | `CD_SIT_TOT_TURNO` | 5 |
| 58 | `DS_SIT_TOT_TURNO` | SUPLENTE |
| 59 | `ST_REELEICAO` | N |
| 60 | `ST_DECLARAR_BENS` | N |
| 61 | `NR_PROTOCOLO_CANDIDATURA` | 516812016 |
| 62 | `NR_PROCESSO` | 1604620166100044 |
| 63 | `CD_SITUACAO_CANDIDATO_PLEITO` | 2 |
| 64 | `DS_SITUACAO_CANDIDATO_PLEITO` | DEFERIDO |
| 65 | `CD_SITUACAO_CANDIDATO_URNA` | 2 |
| 66 | `DS_SITUACAO_CANDIDATO_URNA` | DEFERIDO |
| 67 | `ST_CANDIDATO_INSERIDO_URNA` | SIM |
| 68 | `NM_TIPO_DESTINACAO_VOTOS` | Válido |
| 69 | `CD_SITUACAO_CANDIDATO_TOT` | 2 |
| 70 | `DS_SITUACAO_CANDIDATO_TOT` | Deferido |
| 71 | `ST_PREST_CONTAS` | S |
| 72 | `ST_SUBSTITUIDO` | N |
| 73 | `SQ_SUBSTITUIDO` | -1 |
| 74 | `SQ_ORDEM_SUPLENCIA` | 9 |
| 75 | `DT_ACEITE_CANDIDATURA` | 12/08/2016 11:13:45 |

### `consulta_coligacao` (2016)

Fonte: `dados/raw/candidatos/2016/coligacoes_2016/consulta_coligacao_2016_BRASIL.csv`

Anos com este mesmo esquema: **2016**

23 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 18/02/2021 |
| 2 | `HH_GERACAO` | 12:08:37 |
| 3 | `ANO_ELEICAO` | 2016 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | ELEIÇÃO ORDINÁRIA |
| 6 | `NR_TURNO` | 1 |
| 7 | `CD_ELEICAO` | 220 |
| 8 | `DS_ELEICAO` | Eleições Municipais 2016 |
| 9 | `DT_ELEICAO` | 02/10/2016 |
| 10 | `SG_UF` | PI |
| 11 | `SG_UE` | 10979 |
| 12 | `NM_UE` | ISAÍAS COELHO |
| 13 | `CD_CARGO` | 11 |
| 14 | `DS_CARGO` | PREFEITO |
| 15 | `TP_AGREMIACAO` | COLIGACAO |
| 16 | `NR_PARTIDO` | 77 |
| 17 | `SG_PARTIDO` | SD |
| 18 | `NM_PARTIDO` | SOLIDARIEDADE |
| 19 | `SQ_COLIGACAO` | 180000000797 |
| 20 | `NM_COLIGACAO` | A FORÇA DAS NOVAS IDEIAS JUNTO COM O POVO |
| 21 | `DS_COMPOSICAO_COLIGACAO` | PSD / PP / PRB / PTB / SD |
| 22 | `CD_SITUACAO_LEGENDA` | D |
| 23 | `DS_SITUACAO` | DEFERIDO |

### `motivo_cassacao` (2016)

Fonte: `dados/raw/candidatos/2016/motivo_cassacao_2016/motivo_cassacao_2016_BRASIL.csv`

Anos com este mesmo esquema: **2016**

12 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 18/02/2021 |
| 2 | `HH_GERACAO` | 12:09:35 |
| 3 | `ANO_ELEICAO` | 2016 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Ordinária |
| 6 | `CD_ELEICAO` | 220 |
| 7 | `DS_ELEICAO` | Eleições Municipais 2016 |
| 8 | `SG_UF` | BA |
| 9 | `SG_UE` | 34410 |
| 10 | `NM_UE` | CARINHANHA |
| 11 | `SQ_CANDIDATO` | 50000033790 |
| 12 | `DS_MOTIVO_CASSACAO` | Conduta vedada (Lei 9.504/97). |

### `consulta_vagas` (2016)

Fonte: `dados/raw/candidatos/2016/vagas_2016/consulta_vagas_2016_BRASIL.csv`

Anos com este mesmo esquema: **2016**

15 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 18/05/2021 |
| 2 | `HH_GERACAO` | 15:27:06 |
| 3 | `ANO_ELEICAO` | 2016 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Ordinária |
| 6 | `CD_ELEICAO` | 220 |
| 7 | `DS_ELEICAO` | Eleições Municipais 2016 |
| 8 | `DT_ELEICAO` | 02/10/2016 |
| 9 | `DT_POSSE` | 01/01/2017 |
| 10 | `SG_UF` | PR |
| 11 | `SG_UE` | 75027 |
| 12 | `NM_UE` | NOVA ESPERANÇA DO SUDOESTE |
| 13 | `CD_CARGO` | 11 |
| 14 | `DS_CARGO` | Prefeito |
| 15 | `QT_VAGAS` | 1 |

### `bem_candidato` (2018–2026)

Fonte: `dados/raw/candidatos/2020/bens_candidato_2020/bem_candidato_2020_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

19 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 06/01/2026 |
| 2 | `HH_GERACAO` | 16:44:43 |
| 3 | `ANO_ELEICAO` | 2020 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Ordinária |
| 6 | `CD_ELEICAO` | 426 |
| 7 | `DS_ELEICAO` | Eleições Municipais 2020 |
| 8 | `DT_ELEICAO` | 15/11/2020 |
| 9 | `SG_UF` | RS |
| 10 | `SG_UE` | 87297 |
| 11 | `NM_UE` | LAJEADO |
| 12 | `SQ_CANDIDATO` | 210000762256 |
| 13 | `NR_ORDEM_BEM_CANDIDATO` | 4 |
| 14 | `CD_TIPO_BEM_CANDIDATO` | 21 |
| 15 | `DS_TIPO_BEM_CANDIDATO` | Veículo automotor terrestre: caminhão, automóvel, moto, etc. |
| 16 | `DS_BEM_CANDIDATO` | HYUNDAY HB20 205 2019/2019 BRANCO PLACA IZR1A25 |
| 17 | `VR_BEM_CANDIDATO` | 43000,00 |
| 18 | `DT_ULT_ATUAL_BEM_CANDIDATO` | 16/06/2023 |
| 19 | `HH_ULT_ATUAL_BEM_CANDIDATO` | 15:12:59 |

### `consulta_cand` (2014–2026)

Fonte: `dados/raw/candidatos/2020/candidatos_2020/consulta_cand_2020_BRASIL.csv`

Anos com este mesmo esquema: **2014, 2018, 2020, 2022, 2024, 2026**

50 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 06/01/2026 |
| 2 | `HH_GERACAO` | 16:44:45 |
| 3 | `ANO_ELEICAO` | 2020 |
| 4 | `CD_TIPO_ELEICAO` | 1 |
| 5 | `NM_TIPO_ELEICAO` | ELEIÇÃO SUPLEMENTAR |
| 6 | `NR_TURNO` | 1 |
| 7 | `CD_ELEICAO` | 632 |
| 8 | `DS_ELEICAO` | Vereador |
| 9 | `DT_ELEICAO` | 09/06/2024 |
| 10 | `TP_ABRANGENCIA` | MUNICIPAL |
| 11 | `SG_UF` | AL |
| 12 | `SG_UE` | 28495 |
| 13 | `NM_UE` | PORTO REAL DO COLÉGIO |
| 14 | `CD_CARGO` | 13 |
| 15 | `DS_CARGO` | VEREADOR |
| 16 | `SQ_CANDIDATO` | 20001878117 |
| 17 | `NR_CANDIDATO` | 11444 |
| 18 | `NM_CANDIDATO` | ALEXANDRA BONFIM RIBEIRO DA SILVA |
| 19 | `NM_URNA_CANDIDATO` | ALEXANDRA DA SAÚDE |
| 20 | `NM_SOCIAL_CANDIDATO` | #NULO |
| 21 | `NR_CPF_CANDIDATO` | 03550325460 |
| 22 | `DS_EMAIL` | NÃO DIVULGÁVEL |
| 23 | `CD_SITUACAO_CANDIDATURA` | 12 |
| 24 | `DS_SITUACAO_CANDIDATURA` | APTO |
| 25 | `TP_AGREMIACAO` | PARTIDO ISOLADO |
| 26 | `NR_PARTIDO` | 11 |
| 27 | `SG_PARTIDO` | PP |
| 28 | `NM_PARTIDO` | PROGRESSISTAS |
| 29 | `NR_FEDERACAO` | -1 |
| 30 | `NM_FEDERACAO` | #NULO |
| 31 | `SG_FEDERACAO` | #NULO |
| 32 | `DS_COMPOSICAO_FEDERACAO` | #NULO |
| 33 | `SQ_COLIGACAO` | 20001687180 |
| 34 | `NM_COLIGACAO` | PARTIDO ISOLADO |
| 35 | `DS_COMPOSICAO_COLIGACAO` | PP |
| 36 | `SG_UF_NASCIMENTO` | PE |
| 37 | `DT_NASCIMENTO` | 29/11/1979 |
| 38 | `NR_TITULO_ELEITORAL_CANDIDATO` | 024385921716 |
| 39 | `CD_GENERO` | 4 |
| 40 | `DS_GENERO` | FEMININO |
| 41 | `CD_GRAU_INSTRUCAO` | 6 |
| 42 | `DS_GRAU_INSTRUCAO` | ENSINO MÉDIO COMPLETO |
| 43 | `CD_ESTADO_CIVIL` | 3 |
| 44 | `DS_ESTADO_CIVIL` | CASADO(A) |
| 45 | `CD_COR_RACA` | 03 |
| 46 | `DS_COR_RACA` | PARDA |
| 47 | `CD_OCUPACAO` | 999 |
| 48 | `DS_OCUPACAO` | OUTROS |
| 49 | `CD_SIT_TOT_TURNO` | 5 |
| 50 | `DS_SIT_TOT_TURNO` | SUPLENTE |

### `consulta_cand_complementar` (2018–2020)

Fonte: `dados/raw/candidatos/2020/candidatos_complementar_2020/consulta_cand_complementar_2020_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020**

45 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 06/01/2026 |
| 2 | `HH_GERACAO` | 16:44:45 |
| 3 | `ANO_ELEICAO` | 2020 |
| 4 | `CD_ELEICAO` | 426 |
| 5 | `SQ_CANDIDATO` | 180001091405 |
| 6 | `CD_DETALHE_SITUACAO_CAND` | 2 |
| 7 | `DS_DETALHE_SITUACAO_CAND` | DEFERIDO |
| 8 | `CD_NACIONALIDADE` | 1 |
| 9 | `DS_NACIONALIDADE` | BRASILEIRA NATA |
| 10 | `CD_MUNICIPIO_NASCIMENTO` | -3 |
| 11 | `NM_MUNICIPIO_NASCIMENTO` | COCAL |
| 12 | `NR_IDADE_DATA_POSSE` | 48 |
| 13 | `ST_QUILOMBOLA` | #NE |
| 14 | `CD_ETNIA_INDIGENA` | -3 |
| 15 | `DS_ETNIA_INDIGENA` | #NE |
| 16 | `VR_DESPESA_MAX_CAMPANHA` | 12307.75 |
| 17 | `ST_REELEICAO` | S |
| 18 | `ST_DECLARAR_BENS` | S |
| 19 | `NR_PROTOCOLO_CANDIDATURA` | -1 |
| 20 | `NR_PROCESSO` | 06000847920206180053 |
| 21 | `CD_SITUACAO_CANDIDATO_PLEITO` | 2 |
| 22 | `DS_SITUACAO_CANDIDATO_PLEITO` | DEFERIDO |
| 23 | `CD_SITUACAO_CANDIDATO_URNA` | 2 |
| 24 | `DS_SITUACAO_CANDIDATO_URNA` | DEFERIDO |
| 25 | `ST_CANDIDATO_INSERIDO_URNA` | SIM |
| 26 | `NM_TIPO_DESTINACAO_VOTOS` | Válido |
| 27 | `CD_SITUACAO_CANDIDATO_TOT` | 2 |
| 28 | `DS_SITUACAO_CANDIDATO_TOT` | DEFERIDO |
| 29 | `ST_PREST_CONTAS` | S |
| 30 | `ST_SUBSTITUIDO` | N |
| 31 | `SQ_SUBSTITUIDO` | -1 |
| 32 | `SQ_ORDEM_SUPLENCIA` | -1 |
| 33 | `DT_ACEITE_CANDIDATURA` | 2020-09-25 14:28:10 |
| 34 | `CD_SITUACAO_JULGAMENTO` | -3 |
| 35 | `DS_SITUACAO_JULGAMENTO` | #NE |
| 36 | `CD_SITUACAO_JULGAMENTO_PLEITO` | -3 |
| 37 | `DS_SITUACAO_JULGAMENTO_PLEITO` | #NE |
| 38 | `CD_SITUACAO_JULGAMENTO_URNA` | -3 |
| 39 | `DS_SITUACAO_JULGAMENTO_URNA` | #NE |
| 40 | `CD_SITUACAO_CASSACAO` | -3 |
| 41 | `DS_SITUACAO_CASSACAO` | #NE |
| 42 | `CD_SITUACAO_CASSACAO_MIDIA` | -3 |
| 43 | `DS_SITUACAO_CASSACAO_MIDIA` | #NE |
| 44 | `CD_SITUACAO_DIPLOMA` | -3 |
| 45 | `DS_SITUACAO_DIPLOMA` | #NE |

### `motivo_cassacao` (2018–2020)

Fonte: `dados/raw/candidatos/2020/motivo_cassacao_2020/motivo_cassacao_2020_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020**

15 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 06/01/2026 |
| 2 | `HH_GERACAO` | 16:44:48 |
| 3 | `ANO_ELEICAO` | 2020 |
| 4 | `CD_TIPO_ELEICAO` | 1 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Suplementar |
| 6 | `CD_ELEICAO` | 601 |
| 7 | `DS_ELEICAO` | Eleição Suplementar Iaciara - GO |
| 8 | `SG_UF` | GO |
| 9 | `SG_UE` | 93939 |
| 10 | `NM_UE` | IACIARA |
| 11 | `SQ_CANDIDATO` | 90001805446 |
| 12 | `TP_MOTIVO` | J |
| 13 | `DS_TP_MOTIVO` | Fundamentos legais de julgamento |
| 14 | `CD_MOTIVO` | 6 |
| 15 | `DS_MOTIVO` | Ausência de requisito de registro  |

### `consulta_vagas` (2018–2026)

Fonte: `dados/raw/candidatos/2020/vagas_2020/consulta_vagas_2020_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

15 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 06/01/2026 |
| 2 | `HH_GERACAO` | 16:44:23 |
| 3 | `ANO_ELEICAO` | 2020 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Ordinária |
| 6 | `CD_ELEICAO` | 426 |
| 7 | `DS_ELEICAO` | Eleições Municipais 2020 |
| 8 | `DT_ELEICAO` | 15/11/2020 |
| 9 | `DT_POSSE` | 01/01/2021 |
| 10 | `SG_UF` | MT |
| 11 | `SG_UE` | 89800 |
| 12 | `NM_UE` | CURVELÂNDIA |
| 13 | `CD_CARGO` | 13 |
| 14 | `DS_CARGO` | Vereador |
| 15 | `QT_VAGA` | 9 |

### `consulta_cand_complementar` (2022–2026)

Fonte: `dados/raw/candidatos/2024/candidatos_complementar_2024/consulta_cand_complementar_2024_BRASIL.csv`

Anos com este mesmo esquema: **2022, 2024, 2026**

49 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 16/09/2026 |
| 2 | `HH_GERACAO` | 02:16:29 |
| 3 | `ANO_ELEICAO` | 2024 |
| 4 | `CD_ELEICAO` | 619 |
| 5 | `SQ_CANDIDATO` | 110002198148 |
| 6 | `CD_DETALHE_SITUACAO_CAND` | -3 |
| 7 | `DS_DETALHE_SITUACAO_CAND` | #NE |
| 8 | `CD_NACIONALIDADE` | 1 |
| 9 | `DS_NACIONALIDADE` | BRASILEIRA NATA |
| 10 | `CD_MUNICIPIO_NASCIMENTO` | -3 |
| 11 | `NM_MUNICIPIO_NASCIMENTO` | SÃO FÉLIX DO ARAGUAIA |
| 12 | `NR_IDADE_DATA_POSSE` | 41 |
| 13 | `ST_QUILOMBOLA` | N |
| 14 | `CD_ETNIA_INDIGENA` | -1 |
| 15 | `DS_ETNIA_INDIGENA` | #NULO |
| 16 | `VR_DESPESA_MAX_CAMPANHA` | 15985.08 |
| 17 | `ST_REELEICAO` | N |
| 18 | `ST_DECLARAR_BENS` | S |
| 19 | `NR_PROTOCOLO_CANDIDATURA` | -1 |
| 20 | `NR_PROCESSO` | 06002557720246110057 |
| 21 | `CD_SITUACAO_CANDIDATO_PLEITO` | -3 |
| 22 | `DS_SITUACAO_CANDIDATO_PLEITO` | #NE |
| 23 | `CD_SITUACAO_CANDIDATO_URNA` | -3 |
| 24 | `DS_SITUACAO_CANDIDATO_URNA` | #NE |
| 25 | `ST_CANDIDATO_INSERIDO_URNA` | SIM |
| 26 | `NM_TIPO_DESTINACAO_VOTOS` | Válido |
| 27 | `CD_SITUACAO_CANDIDATO_TOT` | 2 |
| 28 | `DS_SITUACAO_CANDIDATO_TOT` | DEFERIDO |
| 29 | `ST_PREST_CONTAS` | S |
| 30 | `ST_SUBSTITUIDO` | N |
| 31 | `SQ_SUBSTITUIDO` | -1 |
| 32 | `SQ_ORDEM_SUPLENCIA` | 5 |
| 33 | `DT_ACEITE_CANDIDATURA` | 2024-08-13 11:05:22 |
| 34 | `CD_SITUACAO_JULGAMENTO` | 2 |
| 35 | `DS_SITUACAO_JULGAMENTO` | DEFERIDO |
| 36 | `CD_SITUACAO_JULGAMENTO_PLEITO` | 2 |
| 37 | `DS_SITUACAO_JULGAMENTO_PLEITO` | DEFERIDO |
| 38 | `CD_SITUACAO_JULGAMENTO_URNA` | 2 |
| 39 | `DS_SITUACAO_JULGAMENTO_URNA` | DEFERIDO |
| 40 | `CD_SITUACAO_CASSACAO` | -1 |
| 41 | `DS_SITUACAO_CASSACAO` | #NULO |
| 42 | `CD_SITUACAO_CASSACAO_MIDIA` | -1 |
| 43 | `DS_SITUACAO_CASSACAO_MIDIA` | #NULO |
| 44 | `CD_SITUACAO_DIPLOMA` | -1 |
| 45 | `DS_SITUACAO_DIPLOMA` | #NULO |
| 46 | `CD_GENERO_FEFC` | -3 |
| 47 | `DS_GENERO_FEFC` | #NE |
| 48 | `CD_COR_RACA_FEFC` | -3 |
| 49 | `DS_COR_RACA_FEFC` | #NE |

### `consulta_coligacao` (2018–2026)

Fonte: `dados/raw/candidatos/2024/coligacoes_2024/consulta_coligacao_2024_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

28 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 16/09/2026 |
| 2 | `HH_GERACAO` | 02:15:27 |
| 3 | `ANO_ELEICAO` | 2024 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | ELEIÇÃO ORDINÁRIA |
| 6 | `NR_TURNO` | 1 |
| 7 | `CD_ELEICAO` | 619 |
| 8 | `DS_ELEICAO` | Eleições Municipais 2024 |
| 9 | `DT_ELEICAO` | 06/10/2024 |
| 10 | `SG_UF` | BA |
| 11 | `SG_UE` | 35637 |
| 12 | `NM_UE` | IBITITÁ |
| 13 | `CD_CARGO` | 11 |
| 14 | `DS_CARGO` | PREFEITO |
| 15 | `TP_AGREMIACAO` | COLIGAÇÃO |
| 16 | `NR_PARTIDO` | 45 |
| 17 | `SG_PARTIDO` | PSDB |
| 18 | `NM_PARTIDO` | PARTIDO DA SOCIAL DEMOCRACIA BRASILEIRA |
| 19 | `NR_FEDERACAO` | 100 |
| 20 | `NM_FEDERACAO` | Federação PSDB CIDADANIA |
| 21 | `SG_FEDERACAO` | PSDB/CIDADANIA |
| 22 | `DS_COMPOSICAO_FEDERACAO` | PSDB/CIDADANIA |
| 23 | `SQ_COLIGACAO` | 50001699216 |
| 24 | `NM_COLIGACAO` | BORA MUDAR IBITITÁ |
| 25 | `DS_COMPOSICAO_COLIGACAO` | MDB / PSB / UNIÃO / Federação PSDB CIDADANIA (PSDB / CIDADAN |
| 26 | `CD_SITUACAO_LEGENDA` | D |
| 27 | `DS_SITUACAO` | DEFERIDO |
| 28 | `NM_TIPO_DESTINACAO_VOTOS` | #NE |

### `motivo_cassacao` (2022–2026)

Fonte: `dados/raw/candidatos/2024/motivo_cassacao_2024/motivo_cassacao_2024_BRASIL.csv`

Anos com este mesmo esquema: **2022, 2024, 2026**

14 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 16/09/2026 |
| 2 | `HH_GERACAO` | 02:16:51 |
| 3 | `ANO_ELEICAO` | 2024 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Ordinária |
| 6 | `CD_ELEICAO` | 619 |
| 7 | `DS_ELEICAO` | Eleições Municipais 2024 |
| 8 | `SG_UF` | PA |
| 9 | `SG_UE` | 04413 |
| 10 | `NM_UE` | CAMETÁ |
| 11 | `SQ_CANDIDATO` | 140002247123 |
| 12 | `NR_PROCESSO` | 06002631120246140012 |
| 13 | `DS_TP_MOTIVO` | Fundamentos legais de cassação |
| 14 | `DS_MOTIVO` | Abuso de poder econômico |

### `rede_social_candidato` (2018–2026)

Fonte: `dados/raw/candidatos/2024/redes_sociais_2024/rede_social_candidato_2024_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

11 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 16/09/2026 |
| 2 | `HH_GERACAO` | 02:16:54 |
| 3 | `AA_ELEICAO` | 2024 |
| 4 | `SG_UF` | SC |
| 5 | `CD_TIPO_ELEICAO` | 2 |
| 6 | `NM_TIPO_ELEICAO` | ELEIÇÃO ORDINÁRIA |
| 7 | `CD_ELEICAO` | 619 |
| 8 | `DS_ELEICAO` | ELEIÇÕES MUNICIPAIS 2024 |
| 9 | `SQ_CANDIDATO` | 240002230988 |
| 10 | `NR_ORDEM_REDE_SOCIAL` | 1 |
| 11 | `DS_URL` | https://www.instagram.com/rosanads23 |

### `perfil_eleitorado` (2016–2020)

Fonte: `dados/raw/eleitorado/2016/perfil_eleitorado_2016/perfil_eleitorado_2016.csv`

Anos com este mesmo esquema: **2016, 2020**

28 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 12/04/2021 |
| 2 | `HH_GERACAO` | 18:56:18 |
| 3 | `ANO_ELEICAO` | 2016 |
| 4 | `SG_UF` | ES |
| 5 | `CD_MUNICIPIO` | 56596 |
| 6 | `NM_MUNICIPIO` | IÚNA |
| 7 | `NR_ZONA` | 18 |
| 8 | `CD_GENERO` | 4 |
| 9 | `DS_GENERO` | FEMININO |
| 10 | `CD_ESTADO_CIVIL` | 3 |
| 11 | `DS_ESTADO_CIVIL` | CASADO |
| 12 | `CD_FAIXA_ETARIA` | 8084 |
| 13 | `DS_FAIXA_ETARIA` | 80 a 84 anos                   |
| 14 | `CD_GRAU_ESCOLARIDADE` | 4 |
| 15 | `DS_GRAU_ESCOLARIDADE` | ENSINO FUNDAMENTAL COMPLETO |
| 16 | `CD_RACA_COR` | -3 |
| 17 | `DS_RACA_COR` | #NE |
| 18 | `CD_IDENTIDADE_GENERO` | -3 |
| 19 | `DS_IDENTIDADE_GENERO` | #NE |
| 20 | `CD_QUILOMBOLA` | -3 |
| 21 | `DS_QUILOMBOLA` | #NE |
| 22 | `CD_INTERPRETE_LIBRAS` | -3 |
| 23 | `DS_INTERPRETE_LIBRAS` | #NE |
| 24 | `TP_OBRIGATORIEDADE_VOTO` | Facultativo |
| 25 | `QT_ELEITORES_PERFIL` | 5 |
| 26 | `QT_ELEITORES_BIOMETRIA` | 0 |
| 27 | `QT_ELEITORES_DEFICIENCIA` | 0 |
| 28 | `QT_ELEITORES_INC_NM_SOCIAL` | 0 |

### `perfil_eleitorado` (2018)

Fonte: `dados/raw/eleitorado/2018/perfil_eleitorado_2018/perfil_eleitorado_2018.csv`

Anos com este mesmo esquema: **2018**

21 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 12/04/2021 |
| 2 | `HH_GERACAO` | 13:55:01 |
| 3 | `ANO_ELEICAO` | 2018 |
| 4 | `SG_UF` | RJ |
| 5 | `CD_MUNICIPIO` | 58653 |
| 6 | `NM_MUNICIPIO` | NITERÓI |
| 7 | `CD_MUN_SIT_BIOMETRICA` | 1 |
| 8 | `DS_MUN_SIT_BIOMETRICA` | Biométrico |
| 9 | `NR_ZONA` | 71 |
| 10 | `CD_GENERO` | 4 |
| 11 | `DS_GENERO` | FEMININO |
| 12 | `CD_ESTADO_CIVIL` | 1 |
| 13 | `DS_ESTADO_CIVIL` | SOLTEIRO |
| 14 | `CD_FAIXA_ETARIA` | 5054 |
| 15 | `DS_FAIXA_ETARIA` | 50 a 54 anos                   |
| 16 | `CD_GRAU_ESCOLARIDADE` | 7 |
| 17 | `DS_GRAU_ESCOLARIDADE` | SUPERIOR INCOMPLETO |
| 18 | `QT_ELEITORES_PERFIL` | 126 |
| 19 | `QT_ELEITORES_BIOMETRIA` | 125 |
| 20 | `QT_ELEITORES_DEFICIENCIA` | 1 |
| 21 | `QT_ELEITORES_INC_NM_SOCIAL` | 0 |

### `eleitorado_local_votacao` (2016–2026)

Fonte: `dados/raw/eleitorado/2022/eleitorado_local_votacao_2022/eleitorado_local_votacao_2022.csv`

Anos com este mesmo esquema: **2016, 2018, 2020, 2022, 2024, 2026**

41 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 30/09/2024 |
| 2 | `HH_GERACAO` | 02:00:32 |
| 3 | `AA_ELEICAO` | 2022 |
| 4 | `DT_ELEICAO` | 02/10/2022 |
| 5 | `DS_ELEICAO` | 1º Turno |
| 6 | `NR_TURNO` | 1 |
| 7 | `SG_UF` | AC |
| 8 | `CD_MUNICIPIO` | 01120 |
| 9 | `NM_MUNICIPIO` | ACRELÂNDIA |
| 10 | `NR_ZONA` | 8 |
| 11 | `NR_SECAO` | 8 |
| 12 | `CD_TIPO_SECAO_AGREGADA` | 1 |
| 13 | `DS_TIPO_SECAO_AGREGADA` | Principal |
| 14 | `NR_SECAO_PRINCIPAL` | -1 |
| 15 | `NR_LOCAL_VOTACAO` | 1015 |
| 16 | `NM_LOCAL_VOTACAO` | ESCOLA ALTINA MAGALHAES |
| 17 | `CD_TIPO_LOCAL` | 1 |
| 18 | `DS_TIPO_LOCAL` | Convencional |
| 19 | `DS_ENDERECO` | BR 364 - KM 114 S/N |
| 20 | `NM_BAIRRO` | ZONA RURAL |
| 21 | `NR_CEP` | 69945000 |
| 22 | `NR_TELEFONE_LOCAL` | +5568992828362 |
| 23 | `NR_LATITUDE` | -9.827566 |
| 24 | `NR_LONGITUDE` | -66.8806837 |
| 25 | `CD_SITU_LOCAL_VOTACAO` | 1 |
| 26 | `DS_SITU_LOCAL_VOTACAO` | ATIVO |
| 27 | `CD_SITU_ZONA` | -1 |
| 28 | `DS_SITU_ZONA` | ATIVO |
| 29 | `CD_SITU_SECAO` | 1 |
| 30 | `DS_SITU_SECAO` | ATIVO |
| 31 | `CD_SITU_LOCALIDADE` | 1 |
| 32 | `DS_SITU_LOCALIDADE` | Ativo |
| 33 | `CD_SITU_SECAO_ACESSIBILIDADE` | 1 |
| 34 | `DS_SITU_SECAO_ACESSIBILIDADE` | Com acessibilidade |
| 35 | `QT_ELEITOR_SECAO` | 201 |
| 36 | `QT_ELEITOR_ELEICAO_FEDERAL` | 201 |
| 37 | `QT_ELEITOR_ELEICAO_ESTADUAL` | 201 |
| 38 | `QT_ELEITOR_ELEICAO_MUNICIPAL` | 0 |
| 39 | `NR_LOCAL_VOTACAO_ORIGINAL` | 1015 |
| 40 | `NM_LOCAL_VOTACAO_ORIGINAL` | ESCOLA ALTINA MAGALHAES |
| 41 | `DS_ENDERECO_LOCVT_ORIGINAL` | BR 364 - KM 114 S/N |

### `perfil_eleitorado` (2022–2026)

Fonte: `dados/raw/eleitorado/2026/perfil_eleitorado_2026/perfil_eleitorado_2026_BRASIL.csv`

Anos com este mesmo esquema: **2022, 2024, 2026**

27 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 14/07/2026 |
| 2 | `HH_GERACAO` | 18:03:33 |
| 3 | `AA_ELEICAO` | 2026 |
| 4 | `SG_UF` | MA |
| 5 | `CD_MUNICIPIO` | 09490 |
| 6 | `NM_MUNICIPIO` | VIANA |
| 7 | `NR_ZONA` | 20 |
| 8 | `CD_GENERO` | 2 |
| 9 | `DS_GENERO` | MASCULINO |
| 10 | `CD_ESTADO_CIVIL` | 1 |
| 11 | `DS_ESTADO_CIVIL` | SOLTEIRO |
| 12 | `CD_FAIXA_ETARIA` | 5559 |
| 13 | `DS_FAIXA_ETARIA` | 55 a 59 anos |
| 14 | `CD_GRAU_ESCOLARIDADE` | 2 |
| 15 | `DS_GRAU_ESCOLARIDADE` | LÊ E ESCREVE |
| 16 | `CD_RACA_COR` | 2 |
| 17 | `DS_RACA_COR` | Preta |
| 18 | `CD_IDENTIDADE_GENERO` | 1 |
| 19 | `DS_IDENTIDADE_GENERO` | Cisgênero |
| 20 | `CD_QUILOMBOLA` | 2 |
| 21 | `DS_QUILOMBOLA` | NÃO |
| 22 | `CD_INTERPRETE_LIBRAS` | 2 |
| 23 | `DS_INTERPRETE_LIBRAS` | NÃO |
| 24 | `QT_ELEITORES` | 4 |
| 25 | `QT_ELEITORES_BIOMETRIA` | 4 |
| 26 | `QT_ELEITORES_DEFICIENCIA` | 0 |
| 27 | `QT_ELEITORES_NOME_SOCIAL` | 0 |

### `municipio_tse_ibge`

Fonte: `dados/raw/extras/municipio_tse_ibge/municipio_tse_ibge.csv`

10 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 13/09/2026 |
| 2 | `HH_GERACAO` | 09:00:12 |
| 3 | `CD_UF_TSE` | 24 |
| 4 | `CD_UF_IBGE` | 12 |
| 5 | `SG_UF` | AC |
| 6 | `NM_UF` | Acre |
| 7 | `CD_MUNICIPIO_TSE` | 01007 |
| 8 | `NM_MUNICIPIO_TSE` | Bujari |
| 9 | `CD_MUNICIPIO_IBGE` | 1200138 |
| 10 | `NM_MUNICIPIO_IBGE` | Bujari |

### `despesas_candidatos` (2014)

Fonte: `dados/raw/prestacao_contas/2014/prestacao_contas_final_2014/despesas_candidatos_2014_brasil.txt`

Anos com este mesmo esquema: **2014**

22 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Cód. Eleição` | 143 |
| 2 | `Desc. Eleição` | Eleições Gerais 2014 |
| 3 | `Data e hora` | 09/07/2016 17:17:36 |
| 4 | `CNPJ Prestador Conta` | 20497869000109 |
| 5 | `Sequencial Candidato` | 280000000001 |
| 6 | `UF` | BR |
| 7 | `Sigla Partido` | PSTU |
| 8 | `Número candidato` | 16 |
| 9 | `Cargo` | Presidente |
| 10 | `Nome candidato` | JOSÉ MARIA DE ALMEIDA |
| 11 | `CPF do candidato` | 03325634800 |
| 12 | `Tipo do documento` | Cupom Fiscal |
| 13 | `Número do documento` | 0044 |
| 14 | `CPF/CNPJ do fornecedor` | 34028316225962 |
| 15 | `Nome do fornecedor` | EMPRESA BRASILEIRA DE CORREIOS E TELEGRAFOS |
| 16 | `Nome do fornecedor (Receita Federal)` | EMPRESA BRASILEIRA DE CORREIOS E TELEGRAFOS |
| 17 | `Cod setor econômico do fornecedor` | 5310501 |
| 18 | `Setor econômico do fornecedor` | Atividades do Correio Nacional |
| 19 | `Data da despesa` | 19/09/2014 |
| 20 | `Valor despesa` | 288,7 |
| 21 | `Tipo despesa` | Correspondências e despesas postais |
| 22 | `Descriçao da despesa` | ENVIO DE NATERIAIS DE CAMPANHA |

### `despesas_comites` (2014)

Fonte: `dados/raw/prestacao_contas/2014/prestacao_contas_final_2014/despesas_comites_2014_brasil.txt`

Anos com este mesmo esquema: **2014**

19 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Cód. Eleição` | 143 |
| 2 | `Desc. Eleição` | Eleições Gerais 2014 |
| 3 | `Data e hora` | 09/07/2016 17:24:17 |
| 4 | `CNPJ Prestador Conta` | 20618280000103 |
| 5 | `Sequencial Comite` | 687823 |
| 6 | `UF` | SP |
| 7 | `Tipo Comite` | Comitê Financeiro Único |
| 8 | `Sigla  Partido` | PSC |
| 9 | `Tipo do documento` | Nota Fiscal |
| 10 | `Número do documento` | 244 - SN |
| 11 | `CPF/CNPJ do fornecedor` | 11828188000187 |
| 12 | `Nome do fornecedor` | ARIANA DE PAULA CANTEIRO - ME |
| 13 | `Nome do fornecedor (Receita Federal)` | ARIANA DE PAULA CANTEIRO - ME |
| 14 | `Cod setor econômico do fornecedor` | 8299799 |
| 15 | `Setor econômico do fornecedor` | Outras atividades de serviços prestados principalmente às em |
| 16 | `Data da despesa` | 05/09/201400:00:00 |
| 17 | `Valor despesa` | 70 |
| 18 | `Tipo despesa` | Diversas a especificar |
| 19 | `Descrição da despesa` | #NULO |

### `despesas_partidos` (2014)

Fonte: `dados/raw/prestacao_contas/2014/prestacao_contas_final_2014/despesas_partidos_2014_brasil.txt`

Anos com este mesmo esquema: **2014**

19 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Cód. Eleição` | 143 |
| 2 | `Desc. Eleição` | Eleições Gerais 2014 |
| 3 | `Data e hora` | 09/07/2016 17:23:26 |
| 4 | `CNPJ Prestador Conta` | 61064465000109 |
| 5 | `Sequencial Diretorio` | 41672 |
| 6 | `UF` | SP |
| 7 | `Tipo diretorio` | Direção Estadual/Distrital |
| 8 | `Sigla  Partido` | PTC |
| 9 | `Tipo do documento` | Cupom Fiscal |
| 10 | `Número do documento` | 208784 |
| 11 | `CPF/CNPJ do fornecedor` | 46470449000114 |
| 12 | `Nome do fornecedor` | AUTO POSTO PASIL LTDA - ME |
| 13 | `Nome do fornecedor (Receita Federal)` | AUTO POSTO PASIL LTDA - ME |
| 14 | `Cod setor econômico do fornecedor` | 4731800 |
| 15 | `Setor econômico do fornecedor` | Comércio varejista de combustíveis para veículos automotores |
| 16 | `Data da despesa` | 09-SEP-14 |
| 17 | `Valor despesa` | 119,6 |
| 18 | `Tipo despesa` | Combustíveis e lubrificantes |
| 19 | `Descrição da despesa` | #NULO |

### `receitas_candidatos` (2014)

Fonte: `dados/raw/prestacao_contas/2014/prestacao_contas_final_2014/receitas_candidatos_2014_brasil.txt`

Anos com este mesmo esquema: **2014**

32 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Cód. Eleição` | 143 |
| 2 | `Desc. Eleição` | Eleições Gerais 2014 |
| 3 | `Data e hora` | 09/07/201617:15:01 |
| 4 | `CNPJ Prestador Conta` | 20578194000114 |
| 5 | `Sequencial Candidato` | 90000000637 |
| 6 | `UF` | GO |
| 7 | `Sigla  Partido` | PSDB |
| 8 | `Numero candidato` | 45 |
| 9 | `Cargo` | Governador |
| 10 | `Nome candidato` | MARCONI FERREIRA PERILLO JUNIOR |
| 11 | `CPF do candidato` | 03553821809 |
| 12 | `Numero Recibo Eleitoral` | 000450300000GO000064 |
| 13 | `Numero do documento` | 20141550000 |
| 14 | `CPF/CNPJ do doador` | 01256007000131 |
| 15 | `Nome do doador` | GOVESA GOIANIA VEICULOS SA |
| 16 | `Nome do doador (Receita Federal)` | GOVESA GOIANIA VEICULOS SA |
| 17 | `Sigla UE doador` | #NULO |
| 18 | `Número partido doador` | #NULO |
| 19 | `Número candidato doador` | 45 |
| 20 | `Cod setor econômico do doador` | 4511101 |
| 21 | `Setor econômico do doador` | Comércio a varejo de automóveis, camionetas e utilitários no |
| 22 | `Data da receita` | 02/10/201400:00:00 |
| 23 | `Valor receita` | 145000 |
| 24 | `Tipo receita` | Recursos de pessoas jurídicas |
| 25 | `Fonte recurso` | Nao especificado |
| 26 | `Especie recurso` | Transferência eletrônica |
| 27 | `Descricao da receita` | #NULO |
| 28 | `CPF/CNPJ do doador originário` | #NULO |
| 29 | `Nome do doador originário` | #NULO |
| 30 | `Tipo doador originário` | #NULO |
| 31 | `Setor econômico do doador originário` | #NULO |
| 32 | `Nome do doador originário (Receita Federal)` | #NULO |

### `receitas_partidos` (2014)

Fonte: `dados/raw/prestacao_contas/2014/prestacao_contas_final_2014/receitas_partidos_2014_brasil.txt`

Anos com este mesmo esquema: **2014**

29 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Cód. Eleição` | 143 |
| 2 | `Desc. Eleição` | Eleições Gerais 2014 |
| 3 | `Data e hora` | 09/07/2016 17:23:04 |
| 4 | `CNPJ Prestador Conta` | 59941682000180 |
| 5 | `Sequencial Diretorio` | 41682 |
| 6 | `UF` | SP |
| 7 | `Tipo diretorio` | Direção Estadual/Distrital |
| 8 | `Sigla  Partido` | PSDB |
| 9 | `Tipo do documento` | P45000371072SP000182 |
| 10 | `Número do documento` | 662945000452014 |
| 11 | `CPF/CNPJ do doador` | 03653474000120 |
| 12 | `Nome do doador` | Direção Nacional |
| 13 | `Nome do doador (Receita Federal)` | PARTIDO DA SOCIAL DEMOCRACIA BRASILEIRA |
| 14 | `Sigla UE doador` | BR |
| 15 | `Número partido doador` | 45 |
| 16 | `Número candidato doador` | #NULO |
| 17 | `Cod setor econômico do doador` | 9492800 |
| 18 | `Setor econômico do doador` | Atividades de organizações políticas |
| 19 | `Data da receita` | 25-SEP-14 |
| 20 | `Valor receita` | 50000 |
| 21 | `Tipo receita` | Recursos de partido político |
| 22 | `Fonte recurso` | Outros Recursos nao descritos |
| 23 | `Espécie recurso` | Transferência eletrônica |
| 24 | `Descrição da receita` | #NULO |
| 25 | `CPF/CNPJ do doador originário` | 51990695000137 |
| 26 | `Nome do doador originário` | BRADESCO VIDA E PREVIDENCIA S/A |
| 27 | `Tipo doador originário` | J |
| 28 | `Setor econômico do doador originário` | Previdência complementar aberta |
| 29 | `Nome do doador originário (Receita Federal)` | BRADESCO VIDA E PREVIDENCIA S.A. |

### `despesas_candidatos_prestacao_contas_final` (2016)

Fonte: `dados/raw/prestacao_contas/2016/prestacao_contas_final_2016/despesas_candidatos_prestacao_contas_final_2016_brasil.txt`

Anos com este mesmo esquema: **2016**

25 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Cód. Eleição` | 220 |
| 2 | `Desc. Eleição` | Eleições Municipais 2016 |
| 3 | `Data e hora` | 02/06/2018 06:13:40 |
| 4 | `CNPJ Prestador Conta` | 25491188000149 |
| 5 | `Sequencial Candidato` | 240000002396 |
| 6 | `UF` | SC |
| 7 | `Sigla da UE` | 80934 |
| 8 | `Nome da UE` | CURITIBANOS |
| 9 | `Sigla  Partido` | PSDB |
| 10 | `Número candidato` | 45678 |
| 11 | `Cargo` | Vereador |
| 12 | `Nome candidato` | FRANCIELLE CAMARGO |
| 13 | `CPF do candidato` | 06300150909 |
| 14 | `CPF do vice/suplente` | #NULO |
| 15 | `Tipo de documento` | Nota Fiscal |
| 16 | `Número do documento` | 329 - U |
| 17 | `CPF/CNPJ do fornecedor` | 02940983000171 |
| 18 | `Nome do fornecedor` | JOAO BENTO DA SILVA NETO - ME |
| 19 | `Nome do fornecedor (Receita Federal)` | JOAO BENTO DA SILVA NETO - ME |
| 20 | `Cod setor econômico do fornecedor` | 1813001 |
| 21 | `Setor econômico do fornecedor` | Impressão de material para uso publicitário |
| 22 | `Data da despesa` | 28/09/201600:00:00 |
| 23 | `Valor despesa` | 3 |
| 24 | `Tipo despesa` | Publicidade por adesivos |
| 25 | `Descriçao da despesa` | CONFECÇÃO DE BOTONS |

### `despesas_partidos_prestacao_contas_final` (2016)

Fonte: `dados/raw/prestacao_contas/2016/prestacao_contas_final_2016/despesas_partidos_prestacao_contas_final_2016_brasil.txt`

Anos com este mesmo esquema: **2016**

21 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Cód. Eleição` | 220 |
| 2 | `Desc. Eleição` | Eleições Municipais 2016 |
| 3 | `Data e hora` | 02/06/2018 20:34:23 |
| 4 | `CNPJ Prestador Conta` | 14125041000119 |
| 5 | `Sequencial do Prestador de conta` | 311916 |
| 6 | `UF` | PA |
| 7 | `Sigla da UE` | PA |
| 8 | `Nome da UE` | PARÁ |
| 9 | `Tipo diretorio` | Direção Estadual/Distrital |
| 10 | `Sigla  Partido` | PPS |
| 11 | `Tipo do documento` | Nota Fiscal |
| 12 | `Número do documento` | 1263 - NFSE |
| 13 | `CPF/CNPJ do fornecedor` | 17940670000190 |
| 14 | `Nome do fornecedor` | C. KZAN - ME |
| 15 | `Nome do fornecedor (Receita Federal)` | C. KZAN - ME |
| 16 | `Cod setor econômico do fornecedor` | 1813001 |
| 17 | `Setor econômico do fornecedor` | Impressão de material para uso publicitário |
| 18 | `Data da despesa` | 30-SEP-16 |
| 19 | `Valor despesa` | 110 |
| 20 | `Tipo despesa` | Publicidade por materiais impressos |
| 21 | `Descrição da despesa` | SANTINHO MED 9X6CM ANANINDEUA |

### `receitas_candidatos_prestacao_contas_final` (2016)

Fonte: `dados/raw/prestacao_contas/2016/prestacao_contas_final_2016/receitas_candidatos_prestacao_contas_final_2016_brasil.txt`

Anos com este mesmo esquema: **2016**

35 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Cód. Eleição` | 220 |
| 2 | `Desc. Eleição` | Eleições Municipais 2016 |
| 3 | `Data e hora` | 08/09/201821:36:21 |
| 4 | `CNPJ Prestador Conta` | 25360253000105 |
| 5 | `Sequencial Candidato` | 210000003005 |
| 6 | `UF` | RS |
| 7 | `Sigla da UE` | 89524 |
| 8 | `Nome da UE` | WESTFÁLIA |
| 9 | `Sigla  Partido` | PDT |
| 10 | `Numero candidato` | 12222 |
| 11 | `Cargo` | Vereador |
| 12 | `Nome candidato` | MIRGON SCHUMANN |
| 13 | `CPF do candidato` | 42315794072 |
| 14 | `CPF do vice/suplente` | #NULO |
| 15 | `Numero Recibo Eleitoral` | 122221389524RS000001E |
| 16 | `Numero do documento` | 3BEFAC91988BD6CBD89E |
| 17 | `CPF/CNPJ do doador` | 42315794072 |
| 18 | `Nome do doador` | MIRGON SCHUMANN |
| 19 | `Nome do doador (Receita Federal)` | MIRGON SCHUMANN |
| 20 | `Sigla UE doador` | 89524 |
| 21 | `Número partido doador` | 12 |
| 22 | `Número candidato doador` | 12222 |
| 23 | `Cod setor econômico do doador` | #NULO |
| 24 | `Setor econômico do doador` | #NULO |
| 25 | `Data da receita` | 19/08/201600:00:00 |
| 26 | `Valor receita` | 250 |
| 27 | `Tipo receita` | Recursos próprios |
| 28 | `Fonte recurso` | Outros Recursos |
| 29 | `Especie recurso` | Depósito em espécie |
| 30 | `Descricao da receita` | #NULO |
| 31 | `CPF/CNPJ do doador originário` | #NULO |
| 32 | `Nome do doador originário` | #NULO |
| 33 | `Tipo doador originário` | #NULO |
| 34 | `Setor econômico do doador originário` | #NULO |
| 35 | `Nome do doador originário (Receita Federal)` | #NULO |

### `receitas_partidos_prestacao_contas_final` (2016)

Fonte: `dados/raw/prestacao_contas/2016/prestacao_contas_final_2016/receitas_partidos_prestacao_contas_final_2016_brasil.txt`

Anos com este mesmo esquema: **2016**

31 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Cód. Eleição` | 220 |
| 2 | `Desc. Eleição` | Eleições Municipais 2016 |
| 3 | `Data e hora` | 02/06/2018 20:24:08 |
| 4 | `CNPJ Prestador Conta` | 01266559000120 |
| 5 | `Sequencial prestador conta` | 346779 |
| 6 | `UF` | SC |
| 7 | `Sigla da UE` | 80055 |
| 8 | `Nome da UE` | AGRONÔMICA |
| 9 | `Tipo diretorio` | Direção Municipal/Comissão Provisória |
| 10 | `Sigla  Partido` | PMDB |
| 11 | `Número recibo eleitoral` | P15000480055SC000004E |
| 12 | `Número do documento` | #NULO |
| 13 | `CPF/CNPJ do doador` | 09295964985 |
| 14 | `Nome do doador` | NATHIERI LUANA DA SILVA |
| 15 | `Nome do doador (Receita Federal)` | NATHIERI KAUANA DA SILVA |
| 16 | `Sigla UE doador` | #NULO |
| 17 | `Número partido doador` | 15 |
| 18 | `Número candidato doador` | #NULO |
| 19 | `Cod setor econômico do doador` | #NULO |
| 20 | `Setor econômico do doador` | #NULO |
| 21 | `Data da receita` | 30-SEP-16 |
| 22 | `Valor receita` | 440 |
| 23 | `Tipo receita` | Recursos de pessoas físicas |
| 24 | `Fonte recurso` | Outros Recursos |
| 25 | `Espécie recurso` | Estimado |
| 26 | `Descrição da receita` | 50 PORCENTO DO SALARIO DA SECRETÁRIA DO COMITE ELEITORAL PMD |
| 27 | `CPF/CNPJ do doador originário` | #NULO |
| 28 | `Nome do doador originário` | #NULO |
| 29 | `Tipo doador originário` | #NULO |
| 30 | `Setor econômico do doador originário` | #NULO |
| 31 | `Nome do doador originário (Receita Federal)` | #NULO |

### `receitas_orgaos_partidarios_doador_originario` (2018–2026)

Fonte: `dados/raw/prestacao_contas/2018/prestacao_contas_orgaos_partidarios_2018/receitas_orgaos_partidarios_doador_originario_2018_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

19 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 20/09/2026 |
| 2 | `HH_GERACAO` | 03:00:18 |
| 3 | `AA_ELEICAO` | 2018 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Ordinária |
| 6 | `TP_PRESTACAO_CONTAS` | Final |
| 7 | `DT_PRESTACAO_CONTAS` | 03/11/2022 |
| 8 | `SQ_PRESTADOR_CONTAS` | 246938272 |
| 9 | `SG_UF` | BR |
| 10 | `NR_CPF_CNPJ_DOADOR_ORIGINARIO` | 17268885334 |
| 11 | `NM_DOADOR_ORIGINARIO` | ANTONIO DEIJALMA PEREIRA ALENCAR |
| 12 | `NM_DOADOR_ORIGINARIO_RFB` | ANTONIO DEIJALMA PEREIRA ALENCAR |
| 13 | `TP_DOADOR_ORIGINARIO` | F |
| 14 | `CD_CNAE_DOADOR_ORIGINARIO` | -1 |
| 15 | `DS_CNAE_DOADOR_ORIGINARIO` | #NULO |
| 16 | `SQ_RECEITA` | 30254127 |
| 17 | `DT_RECEITA` | 27/09/2018 |
| 18 | `DS_RECEITA` | Recursos de partido político |
| 19 | `VR_RECEITA` | 48,06 |

### `fefc_cor_raca` (2020–2024)

Fonte: `dados/raw/prestacao_contas/2020/fefc_fp_2020/fefc_cor_raca_2020.csv`

Anos com este mesmo esquema: **2020, 2022, 2024**

14 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `AA_ELEICAO` | 2020 |
| 2 | `SG_PARTIDO` | AVANTE |
| 3 | `NR_PARTIDO` | 70 |
| 4 | `DS_GENERO` | Feminino |
| 5 | `DS_COR_RACA` | NEGRA |
| 6 | `QT_CANDIDATO` | 2672 |
| 7 | `VR_PARTIDO_FEFC` | 9277206,19 |
| 8 | `PE_CAND_PARTIDO_GENERO` | 53,29 |
| 9 | `VR_REPASSE_MINIMO_COTA` | 4943823,18 |
| 10 | `VR_TOTAL_RECEBIDO_FEFC` | 3494615,98 |
| 11 | `PE_VALOR_FEFC_GENERO` | 37,67 |
| 12 | `ST_RENUNCIA` | 0 |
| 13 | `DT_GERACAO` | 22/09/2026 |
| 14 | `HH_GERACAO` | 03:09 |

### `fefc_genero` (2020–2024)

Fonte: `dados/raw/prestacao_contas/2020/fefc_fp_2020/fefc_genero_2020.csv`

Anos com este mesmo esquema: **2020, 2022, 2024**

13 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `AA_ELEICAO` | 2020 |
| 2 | `SG_PARTIDO` | AVANTE |
| 3 | `NR_PARTIDO` | 70 |
| 4 | `DS_GENERO` | Feminino |
| 5 | `QT_CANDIDATO` | 5015 |
| 6 | `VR_PARTIDO_FEFC` | 28121267,64 |
| 7 | `PE_CAND_PARTIDO_GENERO` | 32,99 |
| 8 | `VR_REPASSE_MINIMO_COTA` | 9277206,19 |
| 9 | `VR_TOTAL_RECEBIDO_FEFC` | 7834668,88 |
| 10 | `PE_VALOR_FEFC_GENERO` | 27,86 |
| 11 | `ST_RENUNCIA` | 0 |
| 12 | `DT_GERACAO` | 22/09/2026 |
| 13 | `HH_GERACAO` | 03:09 |

### `receitas_candidatos` (2018–2026)

Fonte: `dados/raw/prestacao_contas/2020/prestacao_contas_candidatos_2020/receitas_candidatos_2020_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

60 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 19/09/2026 |
| 2 | `HH_GERACAO` | 15:00:11 |
| 3 | `AA_ELEICAO` | 2020 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | ORDINÁRIA |
| 6 | `CD_ELEICAO` | 426 |
| 7 | `DS_ELEICAO` | Eleições Municipais 2020 |
| 8 | `DT_ELEICAO` | 15/11/2020 |
| 9 | `ST_TURNO` | 1 |
| 10 | `TP_PRESTACAO_CONTAS` | FINAL |
| 11 | `DT_PRESTACAO_CONTAS` | 15/12/2020 |
| 12 | `SQ_PRESTADOR_CONTAS` | 1850467950 |
| 13 | `SG_UF` | SP |
| 14 | `SG_UE` | 62197 |
| 15 | `NM_UE` | BAURU |
| 16 | `NR_CNPJ_PRESTADOR_CONTA` | 39180080000140 |
| 17 | `CD_CARGO` | 13 |
| 18 | `DS_CARGO` | Vereador |
| 19 | `SQ_CANDIDATO` | 250001249175 |
| 20 | `NR_CANDIDATO` | 28177 |
| 21 | `NM_CANDIDATO` | FRANCISCO ANTONIO JERONYMO GUERREIRO |
| 22 | `NR_CPF_CANDIDATO` | 04711441859 |
| 23 | `NR_CPF_VICE_CANDIDATO` | None |
| 24 | `NR_PARTIDO` | 28 |
| 25 | `SG_PARTIDO` | PRTB |
| 26 | `NM_PARTIDO` | Partido Renovador Trabalhista Brasileiro |
| 27 | `CD_FONTE_RECEITA` | 1 |
| 28 | `DS_FONTE_RECEITA` | OUTROS RECURSOS |
| 29 | `CD_ORIGEM_RECEITA` | 10040000 |
| 30 | `DS_ORIGEM_RECEITA` | Recursos de outros candidatos |
| 31 | `CD_NATUREZA_RECEITA` | 0 |
| 32 | `DS_NATUREZA_RECEITA` | ESTIMÁVEL |
| 33 | `CD_ESPECIE_RECEITA` | 2 |
| 34 | `DS_ESPECIE_RECEITA` | Estimado |
| 35 | `CD_CNAE_DOADOR` | 94928 |
| 36 | `DS_CNAE_DOADOR` | Atividades de organizações políticas |
| 37 | `NR_CPF_CNPJ_DOADOR` | 39079563000152 |
| 38 | `NM_DOADOR` | RAUL APARECIDO GONÇALVES PAULA |
| 39 | `NM_DOADOR_RFB` | ELEICAO 2020 RAUL APARECIDO GONCALVES PAULA PREFEITO |
| 40 | `CD_ESFERA_PARTIDARIA_DOADOR` | -1 |
| 41 | `DS_ESFERA_PARTIDARIA_DOADOR` | #NULO |
| 42 | `SG_UF_DOADOR` | SP |
| 43 | `CD_MUNICIPIO_DOADOR` | 62197 |
| 44 | `NM_MUNICIPIO_DOADOR` | BAURU |
| 45 | `SQ_CANDIDATO_DOADOR` | 250001180711 |
| 46 | `NR_CANDIDATO_DOADOR` | 25 |
| 47 | `CD_CARGO_CANDIDATO_DOADOR` | 11 |
| 48 | `DS_CARGO_CANDIDATO_DOADOR` | Prefeito |
| 49 | `NR_PARTIDO_DOADOR` | 25 |
| 50 | `SG_PARTIDO_DOADOR` | DEM |
| 51 | `NM_PARTIDO_DOADOR` | Democratas |
| 52 | `NR_RECIBO_DOACAO` | 281771362197SP000003E |
| 53 | `NR_DOCUMENTO_DOACAO` | #NULO# |
| 54 | `SQ_RECEITA` | 18793095 |
| 55 | `DT_RECEITA` | 12/11/2020 |
| 56 | `DS_RECEITA` | SANTINHOS |
| 57 | `VR_RECEITA` | 133,00 |
| 58 | `DS_NATUREZA_RECURSO_ESTIMAVEL` | Publicidade por materiais impressos |
| 59 | `DS_GENERO` | Masculino |
| 60 | `DS_COR_RACA` | Parda |

### `receitas_candidatos_doador_originario` (2018–2026)

Fonte: `dados/raw/prestacao_contas/2020/prestacao_contas_candidatos_2020/receitas_candidatos_doador_originario_2020_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

23 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 19/09/2026 |
| 2 | `HH_GERACAO` | 15:00:13 |
| 3 | `AA_ELEICAO` | 2020 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Ordinária |
| 6 | `CD_ELEICAO` | 426 |
| 7 | `DS_ELEICAO` | Eleições Municipais 2020 |
| 8 | `DT_ELEICAO` | 15/11/2020 |
| 9 | `ST_TURNO` | 1 |
| 10 | `TP_PRESTACAO_CONTAS` | Final |
| 11 | `DT_PRESTACAO_CONTAS` | 15/12/2020 |
| 12 | `SQ_PRESTADOR_CONTAS` | 1846422038 |
| 13 | `SG_UF` | SC |
| 14 | `NR_CPF_CNPJ_DOADOR_ORIGINARIO` | -1 |
| 15 | `NM_DOADOR_ORIGINARIO` | #NULO |
| 16 | `NM_DOADOR_ORIGINARIO_RFB` | #NULO |
| 17 | `TP_DOADOR_ORIGINARIO` | #NULO |
| 18 | `CD_CNAE_DOADOR_ORIGINARIO` | -1 |
| 19 | `DS_CNAE_DOADOR_ORIGINARIO` | #NULO |
| 20 | `SQ_RECEITA` | -1 |
| 21 | `DT_RECEITA` | None |
| 22 | `DS_RECEITA` | #NULO |
| 23 | `VR_RECEITA` | 0,00 |

### `despesas_contratadas_orgaos_partidarios` (2018–2026)

Fonte: `dados/raw/prestacao_contas/2020/prestacao_contas_orgaos_partidarios_2020/despesas_contratadas_orgaos_partidarios_2020_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

46 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 19/09/2026 |
| 2 | `HH_GERACAO` | 15:00:16 |
| 3 | `AA_ELEICAO` | 2020 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | ORDINÁRIA |
| 6 | `TP_PRESTACAO_CONTAS` | FINAL |
| 7 | `DT_PRESTACAO_CONTAS` | 15/12/2020 |
| 8 | `SQ_PRESTADOR_CONTAS` | 1220565651 |
| 9 | `CD_ESFERA_PARTIDARIA` | M |
| 10 | `DS_ESFERA_PARTIDARIA` | Municipal |
| 11 | `SG_UF` | SP |
| 12 | `SG_UE` | 69299 |
| 13 | `NM_UE` | PRESIDENTE PRUDENTE |
| 14 | `CD_MUNICIPIO` | 69299 |
| 15 | `NM_MUNICIPIO` | PRESIDENTE PRUDENTE |
| 16 | `NR_CNPJ_PRESTADOR_CONTA` | 25362761000114 |
| 17 | `NR_PARTIDO` | 51 |
| 18 | `SG_PARTIDO` | PATRIOTA |
| 19 | `NM_PARTIDO` | Patriota |
| 20 | `CD_TIPO_FORNECEDOR` | 1 |
| 21 | `DS_TIPO_FORNECEDOR` | PESSOA JURÍDICA |
| 22 | `CD_CNAE_FORNECEDOR` | -1 |
| 23 | `DS_CNAE_FORNECEDOR` | #NULO |
| 24 | `NR_CPF_CNPJ_FORNECEDOR` | -1 |
| 25 | `NM_FORNECEDOR` | #NULO |
| 26 | `NM_FORNECEDOR_RFB` | #NULO |
| 27 | `CD_ESFERA_PART_FORNECEDOR` | M |
| 28 | `DS_ESFERA_PART_FORNECEDOR` | Municipal |
| 29 | `SG_UF_FORNECEDOR` | #NULO# |
| 30 | `CD_MUNICIPIO_FORNECEDOR` | -1 |
| 31 | `NM_MUNICIPIO_FORNECEDOR` | #NULO |
| 32 | `SQ_CANDIDATO_FORNECEDOR` | -1 |
| 33 | `NR_CANDIDATO_FORNECEDOR` | -1 |
| 34 | `CD_CARGO_FORNECEDOR` | -1 |
| 35 | `DS_CARGO_FORNECEDOR` | #NULO |
| 36 | `NR_PARTIDO_FORNECEDOR` | -1 |
| 37 | `SG_PARTIDO_FORNECEDOR` | #NULO |
| 38 | `NM_PARTIDO_FORNECEDOR` | #NULO |
| 39 | `DS_TIPO_DOCUMENTO` | #NULO |
| 40 | `NR_DOCUMENTO` | #NULO# |
| 41 | `CD_ORIGEM_DESPESA` | 20210000 |
| 42 | `DS_ORIGEM_DESPESA` | Encargos financeiros, taxas bancárias e/ou op. cartão de cré |
| 43 | `SQ_DESPESA` | 37853595 |
| 44 | `DT_DESPESA` | 06/10/2020 |
| 45 | `DS_DESPESA` | TARIFA |
| 46 | `VR_DESPESA_CONTRATADA` | 35,00 |

### `despesas_pagas_orgaos_partidarios` (2018–2026)

Fonte: `dados/raw/prestacao_contas/2020/prestacao_contas_orgaos_partidarios_2020/despesas_pagas_orgaos_partidarios_2020_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

24 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 19/09/2026 |
| 2 | `HH_GERACAO` | 15:00:14 |
| 3 | `AA_ELEICAO` | 2020 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Ordinária |
| 6 | `TP_PRESTACAO_CONTAS` | Final |
| 7 | `DT_PRESTACAO_CONTAS` | 10/12/2020 |
| 8 | `SQ_PRESTADOR_CONTAS` | 1220492911 |
| 9 | `SG_UF` | PR |
| 10 | `DS_TIPO_DOCUMENTO` | Nota Fiscal |
| 11 | `NR_DOCUMENTO` | 900011 |
| 12 | `CD_FONTE_DESPESA` | 2 |
| 13 | `DS_FONTE_DESPESA` | Fundo Especial de Financiamento de Campanha |
| 14 | `CD_ORIGEM_DESPESA` | 20140000 |
| 15 | `DS_ORIGEM_DESPESA` | Publicidade por materiais impressos |
| 16 | `CD_NATUREZA_DESPESA` | 1 |
| 17 | `DS_NATUREZA_DESPESA` | Financeiro |
| 18 | `CD_ESPECIE_RECURSO` | 0 |
| 19 | `DS_ESPECIE_RECURSO` | Cheque |
| 20 | `SQ_DESPESA` | 35908992 |
| 21 | `SQ_PARCELAMENTO_DESPESA` | 23520798 |
| 22 | `DT_PAGTO_DESPESA` | 26/10/2020 |
| 23 | `DS_DESPESA` | BANNERS 0·40X0·50CM \| BANNERS 1·50X2·50CM \| BOTOM 7X7CM/VERE |
| 24 | `VR_PAGTO_DESPESA` | 13100,00 |

### `receitas_orgaos_partidarios` (2018–2026)

Fonte: `dados/raw/prestacao_contas/2020/prestacao_contas_orgaos_partidarios_2020/receitas_orgaos_partidarios_2020_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

48 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 19/09/2026 |
| 2 | `HH_GERACAO` | 15:00:14 |
| 3 | `AA_ELEICAO` | 2020 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Ordinária |
| 6 | `TP_PRESTACAO_CONTAS` | Final |
| 7 | `DT_PRESTACAO_CONTAS` | 12/12/2020 |
| 8 | `SQ_PRESTADOR_CONTAS` | 1220481948 |
| 9 | `CD_ESFERA_PARTIDARIA` | M |
| 10 | `DS_ESFERA_PARTIDARIA` | Municipal |
| 11 | `SG_UF` | RS |
| 12 | `CD_MUNICIPIO` | 88145 |
| 13 | `NM_MUNICIPIO` | XANGRI-LÁ |
| 14 | `NR_CNPJ_PRESTADOR_CONTA` | 03891443000108 |
| 15 | `NR_PARTIDO` | 12 |
| 16 | `SG_PARTIDO` | PDT |
| 17 | `NM_PARTIDO` | Partido Democrático Trabalhista |
| 18 | `CD_FONTE_RECEITA` | 1 |
| 19 | `DS_FONTE_RECEITA` | Outros Recursos |
| 20 | `CD_ORIGEM_RECEITA` | 10010200 |
| 21 | `DS_ORIGEM_RECEITA` | Recursos de pessoas físicas |
| 22 | `CD_NATUREZA_RECEITA` | 0 |
| 23 | `DS_NATUREZA_RECEITA` | Estimável |
| 24 | `CD_ESPECIE_RECEITA` | 2 |
| 25 | `DS_ESPECIE_RECEITA` | Estimado |
| 26 | `CD_CNAE_DOADOR` | -1 |
| 27 | `DS_CNAE_DOADOR` | #NULO |
| 28 | `NR_CPF_CNPJ_DOADOR` | 04180792001 |
| 29 | `NM_DOADOR` | LETICIA MARTINI BITENCLOURT |
| 30 | `NM_DOADOR_RFB` | LETICIA MARTINI BITENCOURT |
| 31 | `CD_ESFERA_PARTIDARIA_DOADOR` | -1 |
| 32 | `DS_ESFERA_PARTIDARIA_DOADOR` | #NULO |
| 33 | `SG_UF_DOADOR` | #NULO# |
| 34 | `CD_MUNICIPIO_DOADOR` | -1 |
| 35 | `NM_MUNICIPIO_DOADOR` | #NULO |
| 36 | `SQ_CANDIDATO_DOADOR` | -1 |
| 37 | `NR_CANDIDATO_DOADOR` | -1 |
| 38 | `CD_CARGO_CANDIDATO_DOADOR` | -1 |
| 39 | `DS_CARGO_CANDIDATO_DOADOR` | #NULO |
| 40 | `NR_PARTIDO_DOADOR` | -1 |
| 41 | `SG_PARTIDO_DOADOR` | #NULO |
| 42 | `NM_PARTIDO_DOADOR` | #NULO |
| 43 | `NR_RECIBO_DOACAO` | P12000488145RS000013A |
| 44 | `NR_DOCUMENTO_DOACAO` | #NULO# |
| 45 | `SQ_RECEITA` | 18145812 |
| 46 | `DT_RECEITA` | 01/10/2020 |
| 47 | `DS_RECEITA` | SERVIÇO DE MILITÂNCIA |
| 48 | `VR_RECEITA` | 1320,00 |

### `fp_cor_raca` (2020–2024)

Fonte: `dados/raw/prestacao_contas/2024/fefc_fp_2024/fp_cor_raca_2024.csv`

Anos com este mesmo esquema: **2020, 2022, 2024**

17 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `AA_ELEICAO` | 2024 |
| 2 | `SG_PARTIDO` | AGIR |
| 3 | `NR_PARTIDO` | 36 |
| 4 | `DS_ESFERA_PARTIDARIA` | Estadual |
| 5 | `SG_UF` | AC |
| 6 | `SG_UE` | None |
| 7 | `DS_MUNICIPIO` | None |
| 8 | `DS_GENERO` | Feminino |
| 9 | `DS_COR_RACA` | NEGRA |
| 10 | `QT_CANDIDATO` | 6 |
| 11 | `VR_DESPESA_DIRETORIO_FP` | 0,00 |
| 12 | `PE_CAND_PARTIDO_GENERO` | 75,00 |
| 13 | `VR_DESPESA_MINIMO_COTA` | 0,00 |
| 14 | `VR_TOTAL_RECEBIDO_FP` | 0,00 |
| 15 | `PE_VALOR_FP_GENERO` | 0,00 |
| 16 | `DT_GERACAO` | 21/09/2026 |
| 17 | `HH_GERACAO` | 01:03 |

### `fp_genero` (2020–2024)

Fonte: `dados/raw/prestacao_contas/2024/fefc_fp_2024/fp_genero_2024.csv`

Anos com este mesmo esquema: **2020, 2022, 2024**

16 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `AA_ELEICAO` | 2024 |
| 2 | `SG_PARTIDO` | AGIR |
| 3 | `NR_PARTIDO` | 36 |
| 4 | `DS_ESFERA_PARTIDARIA` | Estadual |
| 5 | `SG_UF` | AC |
| 6 | `SG_UE` | None |
| 7 | `DS_MUNICIPIO` | None |
| 8 | `DS_GENERO` | Feminino |
| 9 | `QT_CANDIDATO` | 8 |
| 10 | `VR_DESPESA_DIRETORIO_FP` | 0,00 |
| 11 | `PE_CAND_PARTIDO_GENERO` | 34,79 |
| 12 | `VR_DESPESA_MINIMO_COTA` | 0,00 |
| 13 | `VR_TOTAL_RECEBIDO_FP` | 0,00 |
| 14 | `PE_VALOR_FP_GENERO` | 0,00 |
| 15 | `DT_GERACAO` | 21/09/2026 |
| 16 | `HH_GERACAO` | 01:03 |

### `despesas_contratadas_candidatos` (2018–2026)

Fonte: `dados/raw/prestacao_contas/2024/prestacao_contas_candidatos_2024/despesas_contratadas_candidatos_2024_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

53 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 21/09/2026 |
| 2 | `HH_GERACAO` | 23:00:13 |
| 3 | `AA_ELEICAO` | 2024 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Ordinária |
| 6 | `CD_ELEICAO` | 619 |
| 7 | `DS_ELEICAO` | Eleições Municipais 2024 |
| 8 | `DT_ELEICAO` | 06/10/2024 |
| 9 | `ST_TURNO` | 1 |
| 10 | `TP_PRESTACAO_CONTAS` | Final |
| 11 | `DT_PRESTACAO_CONTAS` | 24/10/2024 |
| 12 | `SQ_PRESTADOR_CONTAS` | 5257095434 |
| 13 | `SG_UF` | RS |
| 14 | `SG_UE` | 86797 |
| 15 | `NM_UE` | GIRUÁ |
| 16 | `NR_CNPJ_PRESTADOR_CONTA` | 56290985000191 |
| 17 | `CD_CARGO` | 13 |
| 18 | `DS_CARGO` | Vereador |
| 19 | `SQ_CANDIDATO` | 210001955284 |
| 20 | `NR_CANDIDATO` | 15123 |
| 21 | `NM_CANDIDATO` | CARLOS FERREIRA DA SILVA |
| 22 | `NR_CPF_CANDIDATO` | -4 |
| 23 | `NR_CPF_VICE_CANDIDATO` | -4 |
| 24 | `NR_PARTIDO` | 15 |
| 25 | `SG_PARTIDO` | MDB |
| 26 | `NM_PARTIDO` | Movimento Democrático Brasileiro |
| 27 | `CD_TIPO_FORNECEDOR` | 0 |
| 28 | `DS_TIPO_FORNECEDOR` | PESSOA FÍSICA |
| 29 | `CD_CNAE_FORNECEDOR` | -1 |
| 30 | `DS_CNAE_FORNECEDOR` | #NULO |
| 31 | `NR_CPF_CNPJ_FORNECEDOR` | 96707518020 |
| 32 | `NM_FORNECEDOR` | MARCIA ZAVASKI SOARES KEGLER |
| 33 | `NM_FORNECEDOR_RFB` | MARCIA ZAVASKI SOARES KEGLER |
| 34 | `CD_ESFERA_PART_FORNECEDOR` | -1 |
| 35 | `DS_ESFERA_PART_FORNECEDOR` | #NULO |
| 36 | `SG_UF_FORNECEDOR` | #NULO# |
| 37 | `CD_MUNICIPIO_FORNECEDOR` | -1 |
| 38 | `NM_MUNICIPIO_FORNECEDOR` | #NULO |
| 39 | `SQ_CANDIDATO_FORNECEDOR` | -1 |
| 40 | `NR_CANDIDATO_FORNECEDOR` | -1 |
| 41 | `CD_CARGO_FORNECEDOR` | -1 |
| 42 | `DS_CARGO_FORNECEDOR` | #NULO |
| 43 | `NR_PARTIDO_FORNECEDOR` | -1 |
| 44 | `SG_PARTIDO_FORNECEDOR` | #NULO |
| 45 | `NM_PARTIDO_FORNECEDOR` | #NULO |
| 46 | `DS_TIPO_DOCUMENTO` | Recibo |
| 47 | `NR_DOCUMENTO` | 003 |
| 48 | `CD_ORIGEM_DESPESA` | 20360002 |
| 49 | `DS_ORIGEM_DESPESA` | Serviços contábeis |
| 50 | `SQ_DESPESA` | 63493787 |
| 51 | `DT_DESPESA` | 16/08/2024 |
| 52 | `DS_DESPESA` | SERV. CONTÁBEIS PRESTAÇÃO CONTAS ELEIÇÕES 2024 |
| 53 | `VR_DESPESA_CONTRATADA` | 500,00 |

### `despesas_pagas_candidatos` (2018–2026)

Fonte: `dados/raw/prestacao_contas/2024/prestacao_contas_candidatos_2024/despesas_pagas_candidatos_2024_BRASIL.csv`

Anos com este mesmo esquema: **2018, 2020, 2022, 2024, 2026**

28 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 21/09/2026 |
| 2 | `HH_GERACAO` | 23:00:14 |
| 3 | `AA_ELEICAO` | 2024 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Ordinária |
| 6 | `CD_ELEICAO` | 619 |
| 7 | `DS_ELEICAO` | Eleições Municipais 2024 |
| 8 | `DT_ELEICAO` | 06/10/2024 |
| 9 | `ST_TURNO` | 2 |
| 10 | `TP_PRESTACAO_CONTAS` | Final |
| 11 | `DT_PRESTACAO_CONTAS` | 15/11/2024 |
| 12 | `SQ_PRESTADOR_CONTAS` | 5285471259 |
| 13 | `SG_UF` | RO |
| 14 | `DS_TIPO_DOCUMENTO` | Nota Fiscal |
| 15 | `NR_DOCUMENTO` | 092003 |
| 16 | `CD_FONTE_DESPESA` | 2 |
| 17 | `DS_FONTE_DESPESA` | Fundo Especial de Financiamento de Campanha |
| 18 | `CD_ORIGEM_DESPESA` | 20140000 |
| 19 | `DS_ORIGEM_DESPESA` | Publicidade por materiais impressos |
| 20 | `CD_NATUREZA_DESPESA` | 1 |
| 21 | `DS_NATUREZA_DESPESA` | Financeiro |
| 22 | `CD_ESPECIE_RECURSO` | 19 |
| 23 | `DS_ESPECIE_RECURSO` | PIX |
| 24 | `SQ_DESPESA` | 70154096 |
| 25 | `SQ_PARCELAMENTO_DESPESA` | 52600396 |
| 26 | `DT_PAGTO_DESPESA` | 20/09/2024 |
| 27 | `DS_DESPESA` | ADESIVOS BOLA 30X30 \| BOTONS 10X10 \| CARTAZ 43 COUCHE \| CART |
| 28 | `VR_PAGTO_DESPESA` | 127170,00 |

### `detalhe_votacao_munzona` (2016–2026)

Fonte: `dados/raw/resultados/2018/detalhe_votacao_munzona_2018/detalhe_votacao_munzona_2018_BRASIL.csv`

Anos com este mesmo esquema: **2016, 2018, 2020, 2022, 2024, 2026**

47 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 13/11/2024 |
| 2 | `HH_GERACAO` | 10:56:19 |
| 3 | `ANO_ELEICAO` | 2018 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Ordinária |
| 6 | `NR_TURNO` | 1 |
| 7 | `CD_ELEICAO` | 297 |
| 8 | `DS_ELEICAO` | Eleições Gerais Estaduais 2018 |
| 9 | `DT_ELEICAO` | 07/10/2018 |
| 10 | `TP_ABRANGENCIA` | E |
| 11 | `SG_UF` | GO |
| 12 | `SG_UE` | GO |
| 13 | `NM_UE` | GOIÁS |
| 14 | `CD_MUNICIPIO` | 93696 |
| 15 | `NM_MUNICIPIO` | GOIANDIRA |
| 16 | `NR_ZONA` | 8 |
| 17 | `CD_CARGO` | 7 |
| 18 | `DS_CARGO` | Deputado Estadual |
| 19 | `QT_APTOS` | 3882 |
| 20 | `QT_SECOES_PRINCIPAIS` | 13 |
| 21 | `QT_SECOES_AGREGADAS` | 2 |
| 22 | `QT_SECOES_NAO_INSTALADAS` | 0 |
| 23 | `QT_TOTAL_SECOES` | 15 |
| 24 | `QT_COMPARECIMENTO` | 3323 |
| 25 | `QT_ELEITORES_SECOES_NAO_INSTALADAS` | 0 |
| 26 | `QT_ABSTENCOES` | 559 |
| 27 | `ST_VOTO_EM_TRANSITO` | N |
| 28 | `QT_VOTOS` | 3323 |
| 29 | `QT_VOTOS_CONCORRENTES` | 2747 |
| 30 | `QT_TOTAL_VOTOS_VALIDOS` | 2747 |
| 31 | `QT_VOTOS_NOMINAIS_VALIDOS` | 2518 |
| 32 | `QT_TOTAL_VOTOS_LEG_VALIDOS` | 229 |
| 33 | `QT_VOTOS_LEG_VALIDOS` | 229 |
| 34 | `QT_VOTOS_NOM_CONVR_LEG_VALIDOS` | 0 |
| 35 | `QT_TOTAL_VOTOS_ANULADOS` | 0 |
| 36 | `QT_VOTOS_NOMINAIS_ANULADOS` | 0 |
| 37 | `QT_VOTOS_LEGENDA_ANULADOS` | 0 |
| 38 | `QT_TOTAL_VOTOS_ANUL_SUBJUD` | 0 |
| 39 | `QT_VOTOS_NOMINAIS_ANUL_SUBJUD` | 0 |
| 40 | `QT_VOTOS_LEGENDA_ANUL_SUBJUD` | 0 |
| 41 | `QT_VOTOS_BRANCOS` | 134 |
| 42 | `QT_TOTAL_VOTOS_NULOS` | 442 |
| 43 | `QT_VOTOS_NULOS` | 442 |
| 44 | `QT_VOTOS_NULOS_TECNICOS` | 0 |
| 45 | `QT_VOTOS_ANULADOS_APU_SEP` | 0 |
| 46 | `HH_ULTIMA_TOTALIZACAO` | 15:11:13 |
| 47 | `DT_ULTIMA_TOTALIZACAO` | 30/09/2022 |

### `votacao_candidato_munzona` (2018)

Fonte: `dados/raw/resultados/2018/votacao_candidato_munzona_2018/votacao_candidato_munzona_2018_BRASIL.csv`

Anos com este mesmo esquema: **2018**

50 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 13/11/2024 |
| 2 | `HH_GERACAO` | 10:56:11 |
| 3 | `ANO_ELEICAO` | 2018 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Ordinária |
| 6 | `NR_TURNO` | 1 |
| 7 | `CD_ELEICAO` | 297 |
| 8 | `DS_ELEICAO` | ELEIÇÕES GERAIS ESTADUAIS 2018 |
| 9 | `DT_ELEICAO` | 07/10/2018 |
| 10 | `TP_ABRANGENCIA` | E |
| 11 | `SG_UF` | SP |
| 12 | `SG_UE` | SP |
| 13 | `NM_UE` | SÃO PAULO |
| 14 | `CD_MUNICIPIO` | 71072 |
| 15 | `NM_MUNICIPIO` | SÃO PAULO |
| 16 | `NR_ZONA` | 258 |
| 17 | `CD_CARGO` | 6 |
| 18 | `DS_CARGO` | Deputado Federal |
| 19 | `SQ_CANDIDATO` | 250000604972 |
| 20 | `NR_CANDIDATO` | 7777 |
| 21 | `NM_CANDIDATO` | PAULO PEREIRA DA SILVA |
| 22 | `NM_URNA_CANDIDATO` | PAULINHO DA FORÇA |
| 23 | `NM_SOCIAL_CANDIDATO` | #NULO# |
| 24 | `CD_SITUACAO_CANDIDATURA` | 12 |
| 25 | `DS_SITUACAO_CANDIDATURA` | APTO |
| 26 | `CD_DETALHE_SITUACAO_CAND` | 2 |
| 27 | `DS_DETALHE_SITUACAO_CAND` | DEFERIDO |
| 28 | `CD_SITUACAO_JULGAMENTO` | -3 |
| 29 | `DS_SITUACAO_JULGAMENTO` | #NE |
| 30 | `CD_SITUACAO_CASSACAO` | -3 |
| 31 | `DS_SITUACAO_CASSACAO` | #NE |
| 32 | `CD_SITUACAO_DIPLOMA` | -3 |
| 33 | `DS_SITUACAO_DIPLOMA` | #NE |
| 34 | `TP_AGREMIACAO` | PARTIDO ISOLADO |
| 35 | `NR_PARTIDO` | 77 |
| 36 | `SG_PARTIDO` | SOLIDARIEDADE |
| 37 | `NM_PARTIDO` | Solidariedade |
| 38 | `NR_FEDERACAO` | -1 |
| 39 | `NM_FEDERACAO` | #NULO# |
| 40 | `SG_FEDERACAO` | #NULO# |
| 41 | `DS_COMPOSICAO_FEDERACAO` | #NULO# |
| 42 | `SQ_COLIGACAO` | 250000050143 |
| 43 | `NM_COLIGACAO` | PARTIDO ISOLADO |
| 44 | `DS_COMPOSICAO_COLIGACAO` | SOLIDARIEDADE |
| 45 | `ST_VOTO_EM_TRANSITO` | N |
| 46 | `QT_VOTOS_NOMINAIS` | 67 |
| 47 | `NM_TIPO_DESTINACAO_VOTOS` | Válido |
| 48 | `QT_VOTOS_NOMINAIS_VALIDOS` | 67 |
| 49 | `CD_SIT_TOT_TURNO` | 3 |
| 50 | `DS_SIT_TOT_TURNO` | ELEITO POR MÉDIA |

### `votacao_partido_munzona` (2018)

Fonte: `dados/raw/resultados/2018/votacao_partido_munzona_2018/votacao_partido_munzona_2018_BRASIL.csv`

Anos com este mesmo esquema: **2018**

36 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 09/04/2023 |
| 2 | `HH_GERACAO` | 04:43:32 |
| 3 | `ANO_ELEICAO` | 2018 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Ordinária |
| 6 | `NR_TURNO` | 1 |
| 7 | `CD_ELEICAO` | 297 |
| 8 | `DS_ELEICAO` | Eleições Gerais Estaduais 2018 |
| 9 | `DT_ELEICAO` | 07/10/2018 |
| 10 | `TP_ABRANGENCIA` | E |
| 11 | `SG_UF` | PE |
| 12 | `SG_UE` | PE |
| 13 | `NM_UE` | PERNAMBUCO |
| 14 | `CD_MUNICIPIO` | 23132 |
| 15 | `NM_MUNICIPIO` | ALIANÇA |
| 16 | `NR_ZONA` | 125 |
| 17 | `CD_CARGO` | 7 |
| 18 | `DS_CARGO` | Deputado Estadual |
| 19 | `TP_AGREMIACAO` | Coligação |
| 20 | `NR_PARTIDO` | 77 |
| 21 | `SG_PARTIDO` | SOLIDARIEDADE |
| 22 | `NM_PARTIDO` | Solidariedade |
| 23 | `NR_FEDERACAO` | -1 |
| 24 | `NM_FEDERACAO` | #NULO# |
| 25 | `SG_FEDERACAO` | #NULO# |
| 26 | `DS_COMPOSICAO_FEDERACAO` | #NULO# |
| 27 | `SQ_COLIGACAO` | 170000050375 |
| 28 | `NM_COLIGACAO` | PERNAMBUCO EM 1. LUGAR |
| 29 | `DS_COMPOSICAO_COLIGACAO` | PP / PR / SOLIDARIEDADE / PMN |
| 30 | `ST_VOTO_EM_TRANSITO` | N |
| 31 | `QT_VOTOS_LEGENDA_VALIDOS` | 15 |
| 32 | `QT_VOTOS_NOMINAIS_CONVR_LEG` | 0 |
| 33 | `QT_TOTAL_VOTOS_LEG_VALIDOS` | 15 |
| 34 | `QT_VOTOS_NOMINAIS_VALIDOS` | 133 |
| 35 | `QT_VOTOS_LEGENDA_ANUL_SUBJUD` | 0 |
| 36 | `QT_VOTOS_NOMINAIS_ANUL_SUBJUD` | 0 |

### `votacao_candidato_munzona` (2016–2026)

Fonte: `dados/raw/resultados/2022/votacao_candidato_munzona_2022/votacao_candidato_munzona_2022_BRASIL.csv`

Anos com este mesmo esquema: **2016, 2020, 2022, 2024, 2026**

50 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 19/09/2026 |
| 2 | `HH_GERACAO` | 03:16:36 |
| 3 | `ANO_ELEICAO` | 2022 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Ordinária |
| 6 | `NR_TURNO` | 1 |
| 7 | `CD_ELEICAO` | 544 |
| 8 | `DS_ELEICAO` | ELEIÇÃO GERAL FEDERAL 2022 |
| 9 | `DT_ELEICAO` | 02/10/2022 |
| 10 | `TP_ABRANGENCIA` | F |
| 11 | `SG_UF` | BA |
| 12 | `SG_UE` | BR |
| 13 | `NM_UE` | BRASIL |
| 14 | `CD_MUNICIPIO` | 34975 |
| 15 | `NM_MUNICIPIO` | CURAÇÁ |
| 16 | `NR_ZONA` | 85 |
| 17 | `CD_CARGO` | 1 |
| 18 | `DS_CARGO` | Presidente |
| 19 | `SQ_CANDIDATO` | 280001618036 |
| 20 | `NR_CANDIDATO` | 22 |
| 21 | `NM_CANDIDATO` | JAIR MESSIAS BOLSONARO |
| 22 | `NM_URNA_CANDIDATO` | JAIR BOLSONARO |
| 23 | `NM_SOCIAL_CANDIDATO` | #NULO |
| 24 | `CD_SITUACAO_CANDIDATURA` | 12 |
| 25 | `DS_SITUACAO_CANDIDATURA` | APTO |
| 26 | `CD_DETALHE_SITUACAO_CAND` | 2 |
| 27 | `DS_DETALHE_SITUACAO_CAND` | DEFERIDO |
| 28 | `CD_SITUACAO_JULGAMENTO` | -3 |
| 29 | `DS_SITUACAO_JULGAMENTO` | #NE |
| 30 | `CD_SITUACAO_CASSACAO` | -3 |
| 31 | `DS_SITUACAO_CASSACAO` | #NE |
| 32 | `CD_SITUACAO_DCONST_DIPLOMA` | -3 |
| 33 | `DS_SITUACAO_DCONST_DIPLOMA` | #NE |
| 34 | `TP_AGREMIACAO` | COLIGAÇÃO |
| 35 | `NR_PARTIDO` | 22 |
| 36 | `SG_PARTIDO` | PL |
| 37 | `NM_PARTIDO` | Partido Liberal |
| 38 | `NR_FEDERACAO` | -1 |
| 39 | `NM_FEDERACAO` | #NULO# |
| 40 | `SG_FEDERACAO` | #NULO# |
| 41 | `DS_COMPOSICAO_FEDERACAO` | #NULO# |
| 42 | `SQ_COLIGACAO` | 280001682069 |
| 43 | `NM_COLIGACAO` | PELO BEM DO BRASIL |
| 44 | `DS_COMPOSICAO_COLIGACAO` | PP / REPUBLICANOS / PL |
| 45 | `ST_VOTO_EM_TRANSITO` | N |
| 46 | `QT_VOTOS_NOMINAIS` | 3457 |
| 47 | `NM_TIPO_DESTINACAO_VOTOS` | Válido |
| 48 | `QT_VOTOS_NOMINAIS_VALIDOS` | 3457 |
| 49 | `CD_SIT_TOT_TURNO` | 6 |
| 50 | `DS_SIT_TOT_TURNO` | 2º TURNO |

### `votacao_partido_munzona` (2016–2026)

Fonte: `dados/raw/resultados/2022/votacao_partido_munzona_2022/votacao_partido_munzona_2022_BRASIL.csv`

Anos com este mesmo esquema: **2016, 2020, 2022, 2024, 2026**

38 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `DT_GERACAO` | 19/09/2026 |
| 2 | `HH_GERACAO` | 03:16:36 |
| 3 | `ANO_ELEICAO` | 2022 |
| 4 | `CD_TIPO_ELEICAO` | 2 |
| 5 | `NM_TIPO_ELEICAO` | Eleição Ordinária |
| 6 | `NR_TURNO` | 1 |
| 7 | `CD_ELEICAO` | 546 |
| 8 | `DS_ELEICAO` | Eleições Gerais Estaduais 2022 |
| 9 | `DT_ELEICAO` | 02/10/2022 |
| 10 | `TP_ABRANGENCIA` | E |
| 11 | `SG_UF` | SP |
| 12 | `SG_UE` | SP |
| 13 | `NM_UE` | SÃO PAULO |
| 14 | `CD_MUNICIPIO` | 68713 |
| 15 | `NM_MUNICIPIO` | PIQUETE |
| 16 | `NR_ZONA` | 68 |
| 17 | `CD_CARGO` | 7 |
| 18 | `DS_CARGO` | Deputado Estadual |
| 19 | `TP_AGREMIACAO` | Federação |
| 20 | `NR_PARTIDO` | 43 |
| 21 | `SG_PARTIDO` | PV |
| 22 | `NM_PARTIDO` | Partido Verde |
| 23 | `NR_FEDERACAO` | 2 |
| 24 | `NM_FEDERACAO` | Federação Brasil da Esperança - FE BRASIL |
| 25 | `SG_FEDERACAO` | PT/PC do B/PV |
| 26 | `DS_COMPOSICAO_FEDERACAO` | PC do B / PT / PV |
| 27 | `SQ_COLIGACAO` | 250001681589 |
| 28 | `NM_COLIGACAO` | FEDERAÇÃO |
| 29 | `DS_COMPOSICAO_COLIGACAO` | Federação Brasil da Esperança - FE BRASIL (PT / PC do B / PV |
| 30 | `ST_VOTO_EM_TRANSITO` | N |
| 31 | `QT_VOTOS_LEGENDA_VALIDOS` | 0 |
| 32 | `QT_VOTOS_NOM_CONVR_LEG_VALIDOS` | 0 |
| 33 | `QT_TOTAL_VOTOS_LEG_VALIDOS` | 0 |
| 34 | `QT_VOTOS_NOMINAIS_VALIDOS` | 7 |
| 35 | `QT_VOTOS_LEGENDA_ANUL_SUBJUD` | 0 |
| 36 | `QT_VOTOS_NOMINAIS_ANUL_SUBJUD` | 0 |
| 37 | `QT_VOTOS_LEGENDA_ANULADOS` | 0 |
| 38 | `QT_VOTOS_NOMINAIS_ANULADOS` | 0 |

## IBGE — SIDRA

### `10061_instrucao_municipios`

Fonte: `dados/raw/ibge/sidra/10061_instrucao_municipios.json`

19 colunas. 27.850 linhas, 5570 municípios

| # | coluna | exemplo |
|---|---|---|
| 1 | `NC = Nível Territorial (Código)` | 6 |
| 2 | `NN = Nível Territorial` | Município |
| 3 | `MC = Unidade de Medida (Código)` | 45 |
| 4 | `MN = Unidade de Medida` | Pessoas |
| 5 | `V = Valor` | 15826 |
| 6 | `D1C = Município (Código)` | 1100015 |
| 7 | `D1N = Município` | Alta Floresta D'Oeste - RO |
| 8 | `D2C = Variável (Código)` | 2667 |
| 9 | `D2N = Variável` | Pessoas de 18 anos ou mais de idade |
| 10 | `D3C = Ano (Código)` | 2022 |
| 11 | `D3N = Ano` | 2022 |
| 12 | `D4C = Nível de instrução (Código)` | 120704 |
| 13 | `D4N = Nível de instrução` | Total |
| 14 | `D5C = Grupo de idade (Código)` | 95253 |
| 15 | `D5N = Grupo de idade` | Total |
| 16 | `D6C = Sexo (Código)` | 6794 |
| 17 | `D6N = Sexo` | Total |
| 18 | `D7C = Cor ou raça (Código)` | 95251 |
| 19 | `D7N = Cor ou raça` | Total |

### `10062_anos_estudo_municipios`

Fonte: `dados/raw/ibge/sidra/10062_anos_estudo_municipios.json`

17 colunas. 5.570 linhas, 5570 municípios

| # | coluna | exemplo |
|---|---|---|
| 1 | `NC = Nível Territorial (Código)` | 6 |
| 2 | `NN = Nível Territorial` | Município |
| 3 | `MC = Unidade de Medida (Código)` | 1622 |
| 4 | `MN = Unidade de Medida` | Anos |
| 5 | `V = Valor` | 7.1 |
| 6 | `D1C = Município (Código)` | 1100015 |
| 7 | `D1N = Município` | Alta Floresta D'Oeste - RO |
| 8 | `D2C = Variável (Código)` | 13285 |
| 9 | `D2N = Variável` | Número médio de anos de estudo das pessoas de 11 anos ou mai |
| 10 | `D3C = Ano (Código)` | 2022 |
| 11 | `D3N = Ano` | 2022 |
| 12 | `D4C = Grupo de idade (Código)` | 95253 |
| 13 | `D4N = Grupo de idade` | Total |
| 14 | `D5C = Sexo (Código)` | 6794 |
| 15 | `D5N = Sexo` | Total |
| 16 | `D6C = Cor ou raça (Código)` | 95251 |
| 17 | `D6N = Cor ou raça` | Total |

### `10295_renda_domiciliar_municipios`

Fonte: `dados/raw/ibge/sidra/10295_renda_domiciliar_municipios.json`

17 colunas. 11.140 linhas, 5570 municípios

| # | coluna | exemplo |
|---|---|---|
| 1 | `NC = Nível Territorial (Código)` | 6 |
| 2 | `NN = Nível Territorial` | Município |
| 3 | `MC = Unidade de Medida (Código)` | 38 |
| 4 | `MN = Unidade de Medida` | Reais |
| 5 | `V = Valor` | 1210.60 |
| 6 | `D1C = Município (Código)` | 1100015 |
| 7 | `D1N = Município` | Alta Floresta D'Oeste - RO |
| 8 | `D2C = Variável (Código)` | 13431 |
| 9 | `D2N = Variável` | Valor do rendimento nominal médio mensal domiciliar per capi |
| 10 | `D3C = Ano (Código)` | 2022 |
| 11 | `D3N = Ano` | 2022 |
| 12 | `D4C = Sexo (Código)` | 6794 |
| 13 | `D4N = Sexo` | Total |
| 14 | `D5C = Cor ou raça (Código)` | 95251 |
| 15 | `D5N = Cor ou raça` | Total |
| 16 | `D6C = Grupo de idade (Código)` | 95253 |
| 17 | `D6N = Grupo de idade` | Total |

### `6579_populacao_municipios`

Fonte: `dados/raw/ibge/sidra/6579_populacao_municipios.json`

11 colunas. 5.571 linhas, 5571 municípios

| # | coluna | exemplo |
|---|---|---|
| 1 | `NC = Nível Territorial (Código)` | 6 |
| 2 | `NN = Nível Territorial` | Município |
| 3 | `MC = Unidade de Medida (Código)` | 45 |
| 4 | `MN = Unidade de Medida` | Pessoas |
| 5 | `V = Valor` | 22724 |
| 6 | `D1C = Município (Código)` | 1100015 |
| 7 | `D1N = Município` | Alta Floresta D'Oeste - RO |
| 8 | `D2C = Variável (Código)` | 9324 |
| 9 | `D2N = Variável` | População residente estimada |
| 10 | `D3C = Ano (Código)` | 2026 |
| 11 | `D3N = Ano` | 2026 |

### `9606_populacao_idade_municipios`

Fonte: `dados/raw/ibge/sidra/9606_populacao_idade_municipios.json`

17 colunas. 116.970 linhas, 5570 municípios

| # | coluna | exemplo |
|---|---|---|
| 1 | `NC = Nível Territorial (Código)` | 6 |
| 2 | `NN = Nível Territorial` | Município |
| 3 | `MC = Unidade de Medida (Código)` | 45 |
| 4 | `MN = Unidade de Medida` | Pessoas |
| 5 | `V = Valor` | 1564 |
| 6 | `D1C = Município (Código)` | 1100015 |
| 7 | `D1N = Município` | Alta Floresta D'Oeste - RO |
| 8 | `D2C = Variável (Código)` | 93 |
| 9 | `D2N = Variável` | População residente |
| 10 | `D3C = Ano (Código)` | 2022 |
| 11 | `D3N = Ano` | 2022 |
| 12 | `D4C = Cor ou raça (Código)` | 95251 |
| 13 | `D4N = Cor ou raça` | Total |
| 14 | `D5C = Sexo (Código)` | 6794 |
| 15 | `D5N = Sexo` | Total |
| 16 | `D6C = Idade (Código)` | 93070 |
| 17 | `D6N = Idade` | 0 a 4 anos |

## IBGE — PIB dos municípios

### `PIB dos Municípios - base de dados 2002-2009`

Fonte: `dados/raw/ibge/pib_municipios/base_de_dados_2002_2009_xlsx/PIB dos Municípios - base de dados 2002-2009.xlsx`

45 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Ano` |  |
| 2 | `Código da Grande Região` |  |
| 3 | `Nome da Grande Região` |  |
| 4 | `Código da Unidade da Federação` |  |
| 5 | `Sigla da Unidade da Federação` |  |
| 6 | `Nome da Unidade da Federação` |  |
| 7 | `Código do Município` |  |
| 8 | `Nome do Município` |  |
| 9 | `Região Metropolitana` |  |
| 10 | `Código da Mesorregião` |  |
| 11 | `Nome da Mesorregião` |  |
| 12 | `Código da Microrregião` |  |
| 13 | `Nome da Microrregião` |  |
| 14 | `Código da Região Geográfica Imediata` |  |
| 15 | `Nome da Região Geográfica Imediata` |  |
| 16 | `Município da Região Geográfica Imediata` |  |
| 17 | `Código da Região Geográfica Intermediária` |  |
| 18 | `Nome da Região Geográfica Intermediária` |  |
| 19 | `Município da Região Geográfica Intermediária` |  |
| 20 | `Código Concentração Urbana` |  |
| 21 | `Nome Concentração Urbana` |  |
| 22 | `Tipo Concentração Urbana` |  |
| 23 | `Código Arranjo Populacional` |  |
| 24 | `Nome Arranjo Populacional` |  |
| 25 | `Hierarquia Urbana` |  |
| 26 | `Hierarquia Urbana (principais categorias)` |  |
| 27 | `Código da Região Rural` |  |
| 28 | `Nome da Região Rural` |  |
| 29 | `Região rural (segundo classificação do núcleo)` |  |
| 30 | `Amazônia Legal` |  |
| 31 | `Semiárido` |  |
| 32 | `Cidade-Região de São Paulo` |  |
| 33 | `Valor adicionado bruto da Agropecuária, 
a preços correntes
(R$ 1.000)` |  |
| 34 | `Valor adicionado bruto da Indústria,
a preços correntes
(R$ 1.000)` |  |
| 35 | `Valor adicionado bruto dos Serviços,
a preços correntes 
- exceto Administração, defesa, educação e saúde públicas e seguridade social
(R$ 1.000)` |  |
| 36 | `Valor adicionado bruto da Administração, defesa, educação e saúde públicas e seguridade social, 
a preços correntes
(R$ 1.000)` |  |
| 37 | `Valor adicionado bruto total, 
a preços correntes
(R$ 1.000)` |  |
| 38 | `Impostos, líquidos de subsídios, sobre produtos, 
a preços correntes
(R$ 1.000)` |  |
| 39 | `Produto Interno Bruto, 
a preços correntes
(R$ 1.000)` |  |
| 40 | `Produto Interno Bruto ` |  |
| 41 | `per capita,` |  |
| 42 | ` 
a preços correntes
(R$ 1,00)` |  |
| 43 | `Para o cálculo do Produto Interno Bruto ` |  |
| 44 | `per capita` |  |
| 45 | ` foi considerada a população residente, estimada por município, com data de referência em 1º de julho de cada ano, enviada ao Tribunal de Contas da União - TCU.` |  |

### `PIB dos Municípios - base de dados 2010-2021`

Fonte: `dados/raw/ibge/pib_municipios/base_de_dados_2010_2021_xlsx/PIB dos Municípios - base de dados 2010-2021.xlsx`

45 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Ano` |  |
| 2 | `Código da Grande Região` |  |
| 3 | `Nome da Grande Região` |  |
| 4 | `Código da Unidade da Federação` |  |
| 5 | `Sigla da Unidade da Federação` |  |
| 6 | `Nome da Unidade da Federação` |  |
| 7 | `Código do Município` |  |
| 8 | `Nome do Município` |  |
| 9 | `Região Metropolitana` |  |
| 10 | `Código da Mesorregião` |  |
| 11 | `Nome da Mesorregião` |  |
| 12 | `Código da Microrregião` |  |
| 13 | `Nome da Microrregião` |  |
| 14 | `Código da Região Geográfica Imediata` |  |
| 15 | `Nome da Região Geográfica Imediata` |  |
| 16 | `Município da Região Geográfica Imediata` |  |
| 17 | `Código da Região Geográfica Intermediária` |  |
| 18 | `Nome da Região Geográfica Intermediária` |  |
| 19 | `Município da Região Geográfica Intermediária` |  |
| 20 | `Código Concentração Urbana` |  |
| 21 | `Nome Concentração Urbana` |  |
| 22 | `Tipo Concentração Urbana` |  |
| 23 | `Código Arranjo Populacional` |  |
| 24 | `Nome Arranjo Populacional` |  |
| 25 | `Hierarquia Urbana` |  |
| 26 | `Hierarquia Urbana (principais categorias)` |  |
| 27 | `Código da Região Rural` |  |
| 28 | `Nome da Região Rural` |  |
| 29 | `Região rural (segundo classificação do núcleo)` |  |
| 30 | `Amazônia Legal` |  |
| 31 | `Semiárido` |  |
| 32 | `Cidade-Região de São Paulo` |  |
| 33 | `Valor adicionado bruto da Agropecuária, 
a preços correntes
(R$ 1.000)` |  |
| 34 | `Valor adicionado bruto da Indústria,
a preços correntes
(R$ 1.000)` |  |
| 35 | `Valor adicionado bruto dos Serviços,
a preços correntes 
- exceto Administração, defesa, educação e saúde públicas e seguridade social
(R$ 1.000)` |  |
| 36 | `Valor adicionado bruto da Administração, defesa, educação e saúde públicas e seguridade social, 
a preços correntes
(R$ 1.000)` |  |
| 37 | `Valor adicionado bruto total, 
a preços correntes
(R$ 1.000)` |  |
| 38 | `Impostos, líquidos de subsídios, sobre produtos, 
a preços correntes
(R$ 1.000)` |  |
| 39 | `Produto Interno Bruto, 
a preços correntes
(R$ 1.000)` |  |
| 40 | `Produto Interno Bruto ` |  |
| 41 | `per capita,` |  |
| 42 | ` 
a preços correntes
(R$ 1,00)` |  |
| 43 | `Atividade com maior valor adicionado bruto` |  |
| 44 | `Atividade com segundo maior valor adicionado bruto` |  |
| 45 | `Atividade com terceiro maior valor adicionado bruto` |  |

### `PIB dos Municípios - base de dados 2010-2023`

Fonte: `dados/raw/ibge/pib_municipios/base_de_dados_2010_2023_xlsx/PIB dos Municípios - base de dados 2010-2023.xlsx`

45 colunas

| # | coluna | exemplo |
|---|---|---|
| 1 | `Ano` |  |
| 2 | `Código da Grande Região` |  |
| 3 | `Nome da Grande Região` |  |
| 4 | `Código da Unidade da Federação` |  |
| 5 | `Sigla da Unidade da Federação` |  |
| 6 | `Nome da Unidade da Federação` |  |
| 7 | `Código do Município` |  |
| 8 | `Nome do Município` |  |
| 9 | `Região Metropolitana` |  |
| 10 | `Código da Mesorregião` |  |
| 11 | `Nome da Mesorregião` |  |
| 12 | `Código da Microrregião` |  |
| 13 | `Nome da Microrregião` |  |
| 14 | `Código da Região Geográfica Imediata` |  |
| 15 | `Nome da Região Geográfica Imediata` |  |
| 16 | `Município da Região Geográfica Imediata` |  |
| 17 | `Código da Região Geográfica Intermediária` |  |
| 18 | `Nome da Região Geográfica Intermediária` |  |
| 19 | `Município da Região Geográfica Intermediária` |  |
| 20 | `Código Concentração Urbana` |  |
| 21 | `Nome Concentração Urbana` |  |
| 22 | `Tipo Concentração Urbana` |  |
| 23 | `Código Arranjo Populacional` |  |
| 24 | `Nome Arranjo Populacional` |  |
| 25 | `Hierarquia Urbana` |  |
| 26 | `Hierarquia Urbana (principais categorias)` |  |
| 27 | `Código da Região Rural` |  |
| 28 | `Nome da Região Rural` |  |
| 29 | `Região rural (segundo classificação do núcleo)` |  |
| 30 | `Amazônia Legal` |  |
| 31 | `Semiárido` |  |
| 32 | `Cidade-Região de São Paulo` |  |
| 33 | `Valor adicionado bruto da Agropecuária, 
a preços correntes
(R$ 1.000)` |  |
| 34 | `Valor adicionado bruto da Indústria,
a preços correntes
(R$ 1.000)` |  |
| 35 | `Valor adicionado bruto dos Serviços,
a preços correntes 
- exceto Administração, defesa, educação e saúde públicas e seguridade social
(R$ 1.000)` |  |
| 36 | `Valor adicionado bruto da Administração, defesa, educação e saúde públicas e seguridade social, 
a preços correntes
(R$ 1.000)` |  |
| 37 | `Valor adicionado bruto total, 
a preços correntes
(R$ 1.000)` |  |
| 38 | `Impostos, líquidos de subsídios, sobre produtos, 
a preços correntes
(R$ 1.000)` |  |
| 39 | `Produto Interno Bruto, 
a preços correntes
(R$ 1.000)` |  |
| 40 | `Produto Interno Bruto ` |  |
| 41 | `per capita,` |  |
| 42 | ` 
a preços correntes
(R$ 1,00)` |  |
| 43 | `Atividade com maior valor adicionado bruto` |  |
| 44 | `Atividade com segundo maior valor adicionado bruto` |  |
| 45 | `Atividade com terceiro maior valor adicionado bruto` |  |

## IBGE — malha territorial

### `malha_municipios_PI`

Fonte: `dados/raw/territorio/malha_municipios_PI.geojson`

1 colunas. 224 linhas

| # | coluna | exemplo |
|---|---|---|
| 1 | `codarea` | 2200053 |
