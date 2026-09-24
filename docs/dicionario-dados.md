# Dicionário de dados

Descreve os 178 atributos das 32 entidades do DER geral (`docs/der/der-geral.mmd`): o significado, o tipo, se aceita nulo, a chave, a coluna de onde vêm e as armadilhas medidas nos arquivos. As colunas de origem foram conferidas no inventário gerado a partir dos arquivos baixados (`docs/esquemas.md`). As regras de carga vêm dos DERs de cada módulo, do SQL em `sql/` e da revisão de 23/09/2026. Este arquivo tem o mesmo texto da seção 5 do dossiê (`docs/dossie/secoes/dicionario.md`); ao editar um, copie para o outro.

### Convenções

- **Nomes** em `snake_case`, com o prefixo herdado do TSE: `id_` chave substituta, `sq_` sequencial do TSE, `nr_` número, `cd_` código, `ds_` descrição, `nm_` nome, `sg_` sigla, `dt_` data, `qt_` quantidade, `vr_` valor em reais, `vl_` índice, `fl_` indicador booleano, `tp_` tipo, `tx_` texto longo.
- **Tipo** na notação do DuckDB: `VARCHAR(n)`, `CHAR(n)`, `TEXT`, `INTEGER`, `BIGINT`, `DECIMAL(p,s)`, `DATE`, `BOOLEAN`. Todo valor em reais é `DECIMAL(15,2)`.
- **Nulo:** `N` = `NOT NULL`; `S` = aceita nulo, com a condição em *Observações*.
- **Chave:** `PK` chave primária, `FK → TABELA` chave estrangeira, `UK` chave única. Numa PK composta, cada parte leva `PK`.
- **Origem:** `arquivo → COLUNA`. Colunas entre aspas ("Valor receita") são do leiaute antigo da prestação de contas (2014–2016, `.txt` em português). `derivado` indica atributo calculado. `regra do grupo` indica classificação nossa, documentada no módulo correspondente.
- **Sentinelas:** `#NULO`, `#NULO#`, `#NE`, `#NE#`, `-1`, `-3`, `-4`, `NÃO DIVULGÁVEL` e texto vazio viram `NULL` na carga, salvo onde a tabela diz outra coisa.
- **Conversões:** valores `1.234,56` e `562,5` viram `DECIMAL(15,2)` pela macro `valor_br`; datas `dd/mm/aaaa` (inclusive `18/07/201400:00:00`, sem espaço) viram `DATE` pela macro `data_br`; CPF e CNPJ ficam só com dígitos pela macro `documento`.
- **Filtros de toda a carga:** só eleições ordinárias (`CD_TIPO_ELEICAO = 2`; em 2006 o código é `0`), filtrando pelo código, não pelo texto (regra R1). Linhas do exterior (`SG_UF = 'ZZ'`) ficam fora dos fatos por município (R7).
- **Código de município nos arquivos de votação:** `cod_tse = LPAD(CD_MUNICIPIO, 5, '0')` (R6). Sem isso somem 519 municípios num join de texto, sem erro.

Arquivos citados na coluna *Origem*:

| Nome curto | Arquivo em `dados/raw/` | Anos |
|---|---|---|
| `municipio_tse_ibge` | `extras/municipio_tse_ibge/municipio_tse_ibge.csv` | atual |
| `consulta_cand` | `candidatos/<ano>/candidatos_<ano>/consulta_cand_<ano>_BRASIL.csv` | 2002–2026 |
| `consulta_vagas` | `candidatos/<ano>/vagas_<ano>/consulta_vagas_<ano>_BRASIL.csv` | 2016–2026 |
| `bem_candidato` | `candidatos/<ano>/bens_candidato_<ano>/bem_candidato_<ano>_BRASIL.csv` | 2016–2026 |
| `votacao_candidato_munzona` | `resultados/<ano>/votacao_candidato_munzona_<ano>/…_BRASIL.csv` | 2016–2026 |
| `votacao_partido_munzona` | `resultados/<ano>/votacao_partido_munzona_<ano>/…_BRASIL.csv` | 2016–2026 |
| `detalhe_votacao_munzona` | `resultados/<ano>/detalhe_votacao_munzona_<ano>/…_BRASIL.csv` | 2016–2026 |
| `perfil_comparecimento_abstencao` | `abstencao/<ano>/comparecimento_abstencao_<ano>/…_PI.csv` | 2016–2024 |
| `receitas_candidatos` | `prestacao_contas/<ano>/…/receitas_candidatos_<ano>_<UF>.csv` (2018+) ou `.txt` (2014–2016) | 2014–2026 |
| `receitas_orgaos_partidarios` | idem, `receitas_orgaos_partidarios_<ano>_<UF>.csv`; em 2014, `receitas_partidos` e `receitas_comites` | 2014–2026 |
| `despesas_contratadas_candidatos` | idem, `despesas_contratadas_candidatos_<ano>_<UF>.csv`; em 2014–2016, `despesas_candidatos*.txt` | 2014–2026 |
| `proposta_governo` | `proposta_governo/<ano>/proposta_governo_<ano>_PI/*.pdf` | 2016–2026 |
| SIDRA nnnn | `ibge/sidra/<nnnn>_*.json` (colunas `D1C` município, `D3N` ano, `V` valor) | Censo 2022; 6579 anual |
| PIB FTP | `ibge/pib_municipios/base_de_dados_2010_2023_xlsx/PIB dos Municípios - base de dados 2010-2023.xlsx` | 2010–2023 |
| Atlas Brasil | planilha do Atlas do Desenvolvimento Humano (PNUD); sem coletor | 1991, 2000, 2010 |

### Território e contexto

#### `UF`

Unidade da federação usada para situar os municípios. **PK:** `sg_uf`. **Grão:** uma linha por UF (27). **Perguntas:** Q3, Q9.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `sg_uf` | `CHAR(2)` | N | PK | Sigla da UF. | `municipio_tse_ibge → SG_UF` | 26 estados e o DF. `ZZ` (exterior) e `BR` não são UF e não entram. |
| `cd_uf_ibge` | `INTEGER` | N | UK | Código IBGE da UF, 2 dígitos. | `municipio_tse_ibge → CD_UF_IBGE` | 11 a 53. O `CD_UF_TSE` do mesmo arquivo não é carregado. |
| `nm_uf` | `VARCHAR(30)` | N | — | Nome da UF. | `municipio_tse_ibge → NM_UF` | Ex.: `Piauí`. |
| `nm_regiao` | `VARCHAR(20)` | N | — | Grande região do IBGE. | PIB FTP → "Nome da Grande Região" | Norte, Nordeste, Sudeste, Sul ou Centro-Oeste. |

#### `MUNICIPIO`

Município identificado pelos códigos do IBGE e do TSE; é a ponte entre os dados territoriais e os eleitorais. **PK:** `cod_ibge`. **Grão:** uma linha por município (5.570). **Perguntas:** Q1, Q3, Q4, Q5, Q7, Q9.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cod_ibge` | `INTEGER` | N | PK | Código IBGE do município, 7 dígitos. | `municipio_tse_ibge → CD_MUNICIPIO_IBGE` | O mesmo código de `D1C` no SIDRA, de "Código do Município" no PIB e de `codarea` na malha GeoJSON. |
| `cod_tse` | `VARCHAR(5)` | N | UK | Código TSE do município. | `municipio_tse_ibge → CD_MUNICIPIO_TSE` | Texto com zero à esquerda (`01007`). Em eleição municipal é igual ao `SG_UE`. Nos arquivos de votação, casar com `LPAD(CD_MUNICIPIO, 5, '0')` (R6). |
| `nm_municipio` | `VARCHAR(60)` | N | — | Nome oficial. | `municipio_tse_ibge → NM_MUNICIPIO_IBGE` | Não usar o `NM_UE` do TSE: a grafia muda entre anos (5.597 unidades eleitorais geram 8.070 pares código–nome). |
| `sg_uf` | `CHAR(2)` | N | FK → `UF` | UF do município. | `municipio_tse_ibge → SG_UF` | |
| `cd_regiao_imediata` | `INTEGER` | S | — | Código da Região Geográfica Imediata (IBGE, 2017). | PIB FTP → "Código da Região Geográfica Imediata" | Recorte regional da Q9. Nulo só em município ausente da planilha do PIB. |
| `nm_regiao_imediata` | `VARCHAR(60)` | S | — | Nome da Região Geográfica Imediata. | PIB FTP → "Nome da Região Geográfica Imediata" | Depende de `cd_regiao_imediata`, não da PK: desnormalização aceita (ver pendências). |
| `cd_regiao_intermediaria` | `INTEGER` | S | — | Código da Região Geográfica Intermediária. | PIB FTP → "Código da Região Geográfica Intermediária" | Agrupa as imediatas. |

#### `MUNICIPIO_ANO`

Indicadores anuais de população e economia de um município. **PK:** (`cod_ibge`, `ano`). **Grão:** município × ano. **Perguntas:** Q3, Q7.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cod_ibge` | `INTEGER` | N | PK, FK → `MUNICIPIO` | Município. | SIDRA 6579 → `D1C`; PIB FTP → "Código do Município" | |
| `ano` | `INTEGER` | N | PK | Ano de referência do indicador. | SIDRA 6579 → `D3N`; PIB FTP → "Ano" | Ao juntar com uma eleição, usar o maior `ano` que não passe do ano da eleição, para não olhar o futuro. |
| `qt_populacao` | `BIGINT` | S | — | População residente, estimada ou recenseada. | SIDRA 6579 → `V` (var. 9324); em 2022, soma de SIDRA 9606 → `V` (var. 93) | Nulo em ano sem estimativa. ⚠️ O coletor baixa só o último ano da 6579 (F2). |
| `ds_fonte_populacao` | `VARCHAR(20)` | S | — | De onde saiu `qt_populacao`. | regra de carga | `SIDRA 6579` (estimativa) ou `SIDRA 9606` (Censo 2022). A 6579 não tem 2022 nem 2023. Nulo quando `qt_populacao` é nulo. |
| `vr_pib_mil` | `DECIMAL(15,3)` | S | — | PIB a preços correntes, em R$ 1.000. | PIB FTP → "Produto Interno Bruto, a preços correntes (R$ 1.000)" | 2010 a 2023. Nulo fora da série. |
| `vr_pib_per_capita` | `DECIMAL(12,2)` | S | — | PIB per capita a preços correntes, em R$. | PIB FTP → "Produto Interno Bruto per capita, a preços correntes (R$ 1,00)" | Vem pronto no FTP; as tabelas 21 e 5938 do SIDRA não trazem per capita. O cabeçalho do xlsx tem quebras de linha: conferir a coluna na leitura. Até 2023. |

#### `MUNICIPIO_CENSO`

Indicadores de renda e escolaridade de um município num ano de censo. **PK:** (`cod_ibge`, `ano_censo`). **Grão:** município × censo (hoje só 2022). **Perguntas:** Q3.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cod_ibge` | `INTEGER` | N | PK, FK → `MUNICIPIO` | Município. | SIDRA 10295/10062 → `D1C` | |
| `ano_censo` | `INTEGER` | N | PK | Ano do censo. | SIDRA → `D3N` | Só 2022. |
| `vr_renda_media_pc` | `DECIMAL(10,2)` | S | — | Rendimento nominal médio mensal domiciliar per capita (R$). | SIDRA 10295 → `V` (var. 13431) | Recortes de sexo, cor/raça e idade = `Total`. |
| `vr_renda_mediana_pc` | `DECIMAL(10,2)` | S | — | Rendimento nominal mediano mensal domiciliar per capita (R$). | SIDRA 10295 → `V` (var. 13534) | Idem. |
| `nr_anos_estudo` | `DECIMAL(4,1)` | S | — | Número médio de anos de estudo das pessoas de 11 anos ou mais. | SIDRA 10062 → `V` (var. 13285) | Universo: 11 anos ou mais. Ex.: `7.1`. |

#### `IDHM_MUNICIPIO`

Índice de Desenvolvimento Humano Municipal e seus três componentes. **PK:** (`cod_ibge`, `ano_censo`). **Grão:** município × censo. **Perguntas:** Q3 (validação).

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cod_ibge` | `INTEGER` | N | PK, FK → `MUNICIPIO` | Município. | Atlas Brasil → código IBGE | ⚠️ Sem coletor: download manual (F3). |
| `ano_censo` | `INTEGER` | N | PK | Censo de referência. | Atlas Brasil | 1991, 2000 ou 2010. Não existe IDHM municipal de 2022; o resultado precisa exibir o ano. |
| `vl_idhm` | `DECIMAL(4,3)` | N | — | IDHM, de 0 a 1. | Atlas Brasil → IDHM | É a média geométrica dos três componentes; guardado como vem da fonte. |
| `vl_idhm_renda` | `DECIMAL(4,3)` | N | — | Componente renda. | Atlas Brasil → IDHM Renda | |
| `vl_idhm_longevidade` | `DECIMAL(4,3)` | N | — | Componente longevidade. | Atlas Brasil → IDHM Longevidade | |
| `vl_idhm_educacao` | `DECIMAL(4,3)` | N | — | Componente educação. | Atlas Brasil → IDHM Educação | |

#### `NIVEL_INSTRUCAO`

As quatro categorias de escolaridade do Censo 2022; é a escala comum que liga a instrução dos candidatos à da população. **PK:** `cd_nivel`. **Grão:** 4 linhas. **Perguntas:** Q4.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cd_nivel` | `INTEGER` | N | PK | Código do nível. | regra do grupo | 1 = sem instrução e fundamental incompleto; 2 = fundamental completo e médio incompleto; 3 = médio completo e superior incompleto; 4 = superior completo. |
| `ds_nivel` | `VARCHAR(60)` | N | — | Rótulo do nível. | SIDRA 10061 → `D4N` | |
| `cd_categoria_sidra` | `INTEGER` | N | UK | Código da categoria na classificação c1568 do SIDRA. | SIDRA 10061 → `D4C` | Guardado para voltar ao arquivo de origem. A categoria `Total` (120704) não é nível e não entra. |
| `nr_ordem` | `INTEGER` | N | UK | Posição na escala, da menor para a maior escolaridade. | regra do grupo | Ordena os gráficos. Hoje coincide com `cd_nivel`. |

#### `GRAU_INSTRUCAO`

Graus de escolaridade que o candidato declara ao TSE, com o nível do Censo equivalente. **PK:** `cd_grau_instrucao`. **Grão:** uma linha por código do TSE. **Perguntas:** Q4.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cd_grau_instrucao` | `INTEGER` | N | PK | Código do grau de instrução no TSE. | `consulta_cand → CD_GRAU_INSTRUCAO` | 1 = analfabeto … 8 = superior completo. Inclui `-4` (não divulgável, 579 candidaturas) e `0`, que aqui viram linhas, não `NULL`, para a candidatura não perder a FK. |
| `ds_grau_instrucao` | `VARCHAR(40)` | N | — | Descrição do grau. | `consulta_cand → DS_GRAU_INSTRUCAO` | Caixa e acento mudam entre anos: normalizar. |
| `cd_nivel` | `INTEGER` | S | FK → `NIVEL_INSTRUCAO` | Nível censitário equivalente. | regra do grupo (de-para da Q4) | 1, 2, 3 → 1; 4, 5 → 2; 6, 7 → 3; 8 → 4. A única escolha não óbvia: "lê e escreve" (2) vai para o nível 1. Nulo em `-4` e `0`. |

#### `CENSO_INSTRUCAO`

Quantidade de pessoas de 18 anos ou mais por município e nível de instrução. **PK:** (`cod_ibge`, `ano_censo`, `cd_nivel`). **Grão:** município × censo × nível (5.570 × 4). **Perguntas:** Q4.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cod_ibge` | `INTEGER` | N | PK, FK → `MUNICIPIO` | Município. | SIDRA 10061 → `D1C` | |
| `ano_censo` | `INTEGER` | N | PK | Ano do censo. | SIDRA 10061 → `D3N` | 2022. |
| `cd_nivel` | `INTEGER` | N | PK, FK → `NIVEL_INSTRUCAO` | Nível de instrução. | SIDRA 10061 → `D4C`, via `NIVEL_INSTRUCAO.cd_categoria_sidra` | Não carregar a linha `Total`: 27.850 ÷ 5.570 = 5 linhas por município (Total + 4 níveis). Com ela, toda contagem da Q4 dobra. |
| `qt_pessoas` | `BIGINT` | N | — | Pessoas de 18 anos ou mais no nível. | SIDRA 10061 → `V` (var. 2667) | O universo de 18 anos ou mais é o mesmo dos candidatos elegíveis. Recortes de idade, sexo e cor/raça = `Total`. |

#### `FAIXA_ETARIA`

Faixas de idade das duas fontes (TSE e IBGE) numa só dimensão, com a marca de "jovem". **PK:** `id_faixa`. **Grão:** uma linha por faixa de cada fonte. **Perguntas:** Q7.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_faixa` | `INTEGER` | N | PK | Identificador da faixa. | gerado na carga | Chave substituta: as duas fontes numeram de forma independente. |
| `ds_origem` | `VARCHAR(4)` | N | UK | Fonte da faixa. | regra de carga | `TSE` ou `IBGE`. UK composta (`ds_origem`, `cd_origem`). |
| `cd_origem` | `VARCHAR(10)` | N | UK | Código da faixa na fonte. | TSE: `perfil_comparecimento_abstencao → CD_FAIXA_ETARIA`; IBGE: SIDRA 9606 → `D6C` (classificação 287) | TSE: `1600`, `1700`, `1800`, `1900`, `2000`, `2124`, `2529`, `3034`…; `-3` = inválido. IBGE: `93070` = 0 a 4 anos etc. |
| `ds_faixa` | `VARCHAR(30)` | N | — | Rótulo da faixa. | TSE: `DS_FAIXA_ETARIA`; IBGE: SIDRA 9606 → `D6N` | Ex.: `16 anos`, `21 a 24 anos`, `0 a 4 anos`. |
| `nr_idade_min` | `INTEGER` | S | — | Idade inicial da faixa. | derivado do código | Nulo na faixa `-3` (inválido). |
| `nr_idade_max` | `INTEGER` | S | — | Idade final da faixa. | derivado do código | Nulo na faixa aberta (100 anos ou mais) e na `-3`. |
| `fl_jovem` | `BOOLEAN` | S | — | A faixa está inteira entre 15 e 29 anos. | derivado | Jovem = 15 a 29 anos, Lei nº 12.852/2013 (R10). No TSE, `1600` a `2529`; no IBGE, 15–19, 20–24 e 25–29. Nenhuma faixa atravessa o corte 29/30. Nulo na `-3`. |

#### `CENSO_FAIXA_ETARIA`

População por município e faixa etária no censo. **PK:** (`cod_ibge`, `ano_censo`, `id_faixa`). **Grão:** município × censo × faixa do IBGE. **Perguntas:** Q7.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cod_ibge` | `INTEGER` | N | PK, FK → `MUNICIPIO` | Município. | SIDRA 9606 → `D1C` | |
| `ano_censo` | `INTEGER` | N | PK | Ano do censo. | SIDRA 9606 → `D3N` | 2022. |
| `id_faixa` | `INTEGER` | N | PK, FK → `FAIXA_ETARIA` | Faixa etária (origem `IBGE`). | SIDRA 9606 → `D6C` | 116.970 linhas ÷ 5.570 = 21 por município: conferir se há linha de total antes de carregar. |
| `qt_pessoas` | `BIGINT` | N | — | População residente na faixa. | SIDRA 9606 → `V` (var. 93) | Cor/raça e sexo = `Total`. |

#### `COMPARECIMENTO_PERFIL`

Eleitores aptos, comparecimento e abstenção por município, turno, faixa etária e gênero. **PK:** (`cod_ibge`, `ano`, `nr_turno`, `id_faixa`, `ds_genero`). **Grão:** município × ano × turno × faixa × gênero, com zonas e demais recortes somados. **Perguntas:** Q7.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cod_ibge` | `INTEGER` | N | PK, FK → `MUNICIPIO` | Município. | `perfil_comparecimento_abstencao → CD_MUNICIPIO`, com `LPAD` para `cod_tse` | Coletado só no PI (F8). |
| `ano` | `INTEGER` | N | PK | Ano da eleição. | `perfil_comparecimento_abstencao → ANO_ELEICAO` | O arquivo não tem `CD_ELEICAO` nem cargo; no mesmo dia pode haver eleição federal e estadual com os mesmos eleitores. |
| `nr_turno` | `INTEGER` | N | PK | Turno. | `perfil_comparecimento_abstencao → NR_TURNO` | Sem o turno, os aptos do PI em 2020 ficam 22,7% maiores (2º turno em Teresina). |
| `id_faixa` | `INTEGER` | N | PK, FK → `FAIXA_ETARIA` | Faixa etária (origem `TSE`). | `perfil_comparecimento_abstencao → CD_FAIXA_ETARIA` | |
| `ds_genero` | `VARCHAR(15)` | N | PK | Gênero do eleitor. | `perfil_comparecimento_abstencao → DS_GENERO` | `MASCULINO`, `FEMININO`, `NÃO INFORMADO`. |
| `qt_aptos` | `BIGINT` | N | — | Eleitores aptos. | `SUM(QT_APTOS)` | Soma sobre zona, estado civil, escolaridade, cor/raça e demais recortes. É o eleitorado: igual a `perfil_eleitorado.QT_ELEITORES` (2.698.764 no PI em 2024), por isso não há entidade de eleitorado. |
| `qt_comparecimento` | `BIGINT` | N | — | Eleitores que votaram. | `SUM(QT_COMPARECIMENTO)` | |
| `qt_abstencao` | `BIGINT` | N | — | Eleitores que não votaram. | `SUM(QT_ABSTENCAO)` | `qt_aptos = qt_comparecimento + qt_abstencao` (restrição de verificação). |

### Eleição, partido e candidatura

#### `ELEICAO`

Pleito identificado pelo código do TSE, que já separa turno e abrangência. **PK:** `cd_eleicao`. **Grão:** um código por turno × abrangência × tipo. **Perguntas:** todas.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cd_eleicao` | `INTEGER` | N | PK | Código da eleição no TSE. | `consulta_cand`, arquivos de resultado → `CD_ELEICAO` | Muda entre turnos (619 → 620 em 2024) e entre abrangências no mesmo dia (544 federal e 546 estadual em 2022). |
| `ano` | `INTEGER` | N | — | Ano do pleito. | `ANO_ELEICAO` (`AA_ELEICAO` na prestação de contas) | Tirado da linha, não do nome do arquivo: suplementares vêm gravadas em arquivos de outros anos. |
| `nr_turno` | `INTEGER` | N | — | Turno. | `NR_TURNO` | 1 ou 2. |
| `dt_eleicao` | `DATE` | N | — | Data da votação. | `DT_ELEICAO` | Base de `CANDIDATURA.nr_idade_eleicao`. |
| `tp_eleicao` | `VARCHAR(12)` | N | — | Tipo de eleição. | `CD_TIPO_ELEICAO` | `ORDINARIA` (código 2; 0 em 2006) ou `SUPLEMENTAR` (1). Classificar pelo código, não pelo `NM_TIPO_ELEICAO`, cuja grafia varia. |
| `tp_abrangencia` | `VARCHAR(10)` | N | — | Abrangência. | `TP_ABRANGENCIA` | `consulta_cand` traz o texto (`MUNICIPAL`); os arquivos de resultado trazem a letra (`M`, `E`, `F`). Normalizar para o texto. |

#### `CARGO`

Cargo em disputa. **PK:** `cd_cargo`. **Grão:** uma linha por cargo (13). **Perguntas:** Q1, Q3, Q5, Q6, Q12.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cd_cargo` | `INTEGER` | N | PK | Código do cargo no TSE. | `CD_CARGO` | 1 = presidente, 3 = governador, 5 = senador, 6 = deputado federal, 7 = deputado estadual, 8 = deputado distrital, 11 = prefeito, 13 = vereador; os demais são vices e suplentes. |
| `ds_cargo` | `VARCHAR(30)` | N | — | Nome do cargo. | `DS_CARGO` | A caixa varia (`VEREADOR` e `Vereador`): normalizar. |

#### `PARTIDO`

Partido num dado ano. O número sozinho não identifica o partido porque o TSE o reaproveita. **PK:** (`ano`, `nr_partido`). **Grão:** partido × ano de eleição ordinária. **Perguntas:** Q3, Q5, Q7, Q8, Q9, Q12.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `ano` | `INTEGER` | N | PK | Ano da eleição. | `consulta_cand → ANO_ELEICAO` | Só ordinárias (R1): com as suplementares há 16 colisões de (ano, número) entre 2014 e 2024. |
| `nr_partido` | `INTEGER` | N | PK | Número do partido. | `consulta_cand → NR_PARTIDO` | 10 a 90. Reaproveitado: 25 foi DEM e virou PRD; 44 foi PRP e virou UNIÃO (R2). |
| `sg_partido` | `VARCHAR(20)` | N | UK | Sigla. | `consulta_cand → SG_PARTIDO` | UK composta (`ano`, `sg_partido`); é por ela que o leiaute antigo, que só traz a sigla, chega ao número. Normalizar grafias (`PC do B` e `PCDOB`). |
| `nm_partido` | `VARCHAR(80)` | N | — | Nome. | `consulta_cand → NM_PARTIDO` | |

#### `ESPECTRO_PARTIDO`

Posição ideológica de um partido num ano, com a rodada e a fonte acadêmica usadas. **PK:** (`ano`, `nr_partido`). **Grão:** partido × ano. **Perguntas:** Q7, Q8, Q9.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `ano` | `INTEGER` | N | PK, FK → `PARTIDO` | Ano da eleição. | igual a `PARTIDO.ano` | FK composta (`ano`, `nr_partido`). |
| `nr_partido` | `INTEGER` | N | PK, FK → `PARTIDO` | Partido. | igual a `PARTIDO.nr_partido` | |
| `nr_rodada` | `INTEGER` | N | — | Rodada do survey aplicada. | regra do grupo | 2018 para as eleições de 2014 a 2020; 2022 dali em diante. |
| `vl_ideologia` | `DECIMAL(4,2)` | S | — | Posição na escala de 0 (esquerda) a 10 (direita). | Bolognesi, Ribeiro e Codato (2023, *Dados* 66(2)); Bolognesi, Ribeiro, Codato e Silva (2025, *Opinião Pública* 31) | ⚠️ Ainda não existe como dado no repositório (F1). Nulo para partido fora das rodadas (ex.: PRD, 2023). |
| `cd_espectro` | `VARCHAR(20)` | S | — | Categoria de espectro. | derivado de `vl_ideologia` | Cinco categorias, da esquerda à direita. Os cortes ainda não foram definidos; usar os dos artigos, se houver. |
| `ds_fonte` | `VARCHAR(200)` | N | — | Referência bibliográfica da classificação. | regra do grupo | Única fonte não governamental do modelo; por isso fica fora de `PARTIDO`. |

#### `FEDERACAO`

Federação partidária (a partir de 2022) num dado ano. **PK:** (`ano`, `nr_federacao`). **Grão:** federação × ano. **Perguntas:** Q5.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `ano` | `INTEGER` | N | PK | Ano da eleição. | `consulta_cand`, `votacao_partido_munzona → ANO_ELEICAO` | Só ordinárias: o arquivo de 2022 traz federações 101 e 102 de suplementares de 2026. |
| `nr_federacao` | `INTEGER` | N | PK | Número da federação. | `NR_FEDERACAO` | `-1` significa "sem federação" e nunca vira linha (`WHERE nr_federacao <> -1`). A mesma federação muda de número: PSDB/Cidadania 1 → 100, Brasil da Esperança 2 → 101, PSOL/Rede 3 → 102. A série da Q5 segue a composição, não o número. |
| `sg_federacao` | `VARCHAR(40)` | N | — | Sigla. | `SG_FEDERACAO` | O formato muda (`PT/PC do B/PV` e `13-PT/65-PC do B/43-PV`). |
| `ds_composicao` | `VARCHAR(100)` | S | — | Composição em texto. | `DS_COMPOSICAO_FEDERACAO` | Informativo. A composição oficial vem de `PARTIDO_FEDERACAO`, não do texto. `NM_FEDERACAO` não é carregado: varia só na caixa (13 grafias para 8 números) e quebraria um `SELECT DISTINCT`. |

#### `PARTIDO_FEDERACAO`

Participação de um partido numa federação num dado ano. **PK:** (`ano`, `nr_partido`). **Grão:** partido federado × ano. **Perguntas:** Q5.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `ano` | `INTEGER` | N | PK, FK → `PARTIDO`, `FEDERACAO` | Ano da eleição. | `ANO_ELEICAO` | |
| `nr_partido` | `INTEGER` | N | PK, FK → `PARTIDO` | Partido membro. | `NR_PARTIDO` | A PK impede o mesmo partido em duas federações no mesmo ano. |
| `nr_federacao` | `INTEGER` | N | FK → `FEDERACAO` | Federação. | `NR_FEDERACAO` | FK composta (`ano`, `nr_federacao`). A composição sai do par `NR_PARTIDO` + `NR_FEDERACAO` linha a linha, não do texto `DS_COMPOSICAO_FEDERACAO`. |

#### `POLITICO`

A pessoa que se candidata, independentemente da eleição. **PK:** `nr_titulo_eleitoral`. **Grão:** uma linha por título de eleitor válido. **Perguntas:** Q7, Q12.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `nr_titulo_eleitoral` | `VARCHAR(12)` | N | PK | Título de eleitor. | `consulta_cand → NR_TITULO_ELEITORAL_CANDIDATO` | Com zero à esquerda até 12 dígitos. Nunca o CPF: em 2024 ele vem `-4` nas 463.859 linhas (R3). As 579 candidaturas com título `-4` (2016–2026) não geram político. |
| `nm_candidato` | `VARCHAR(100)` | N | — | Nome civil. | `consulta_cand → NM_CANDIDATO` | Máximo medido: 70 caracteres (2018). Vem da candidatura mais recente. |
| `dt_nascimento` | `DATE` | S | — | Data de nascimento. | `consulta_cand → DT_NASCIMENTO` | Da candidatura mais recente. Nulo quando não divulgada. |
| `sg_uf_nascimento` | `CHAR(2)` | S | — | UF de nascimento. | `consulta_cand → SG_UF_NASCIMENTO` | `Não divulgável` (579 linhas) vira `NULL`; `ZZ` (874, nascido no exterior) é mantido. Por causa do `ZZ` não há FK para `UF`. |

#### `CANDIDATURA`

Participação de um político numa eleição, para um cargo, por um partido. Uma linha por candidatura, não por turno. **PK:** `id_candidatura`. **UK:** (`ano`, `sg_ue`, `cd_cargo`, `sq_candidato`). **Grão:** candidatura em eleição ordinária, com o resultado do último turno. **Perguntas:** todas, menos Q3 e Q5 diretamente.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_candidatura` | `BIGINT` | N | PK | Identificador da candidatura. | gerado na carga | Chave substituta: `row_number()` ordenado por ano, `sg_ue`, cargo e `sq_candidato` (`sql/04_politico.sql`). |
| `ano` | `INTEGER` | N | UK | Ano da eleição. | `consulta_cand → ANO_ELEICAO` | Redundante com `ELEICAO.ano`, mas necessário para a FK de `PARTIDO`. |
| `sg_ue` | `VARCHAR(5)` | N | UK | Unidade eleitoral. | `consulta_cand → SG_UE` | `BR`, sigla da UF ou código TSE do município (5 dígitos), conforme o cargo. |
| `cd_cargo` | `INTEGER` | N | UK, FK → `CARGO` | Cargo disputado. | `consulta_cand → CD_CARGO` | |
| `sq_candidato` | `BIGINT` | N | UK | Sequencial do candidato no TSE. | `consulta_cand → SQ_CANDIDATO` | Único só a partir de 2010: em 2004 são 402.157 linhas em 1.506 valores. É a chave de ligação com prestação de contas, bens e votação (todos 2014+). |
| `nr_titulo_eleitoral` | `VARCHAR(12)` | S | FK → `POLITICO` | Pessoa que concorre. | `consulta_cand → NR_TITULO_ELEITORAL_CANDIDATO` | Nulo nas 579 candidaturas com título `-4`. |
| `cd_eleicao` | `INTEGER` | N | FK → `ELEICAO` | Eleição do 1º turno. | `consulta_cand → CD_ELEICAO` da linha com `NR_TURNO = 1` | O turno fica nos fatos de votação (R5). |
| `nr_partido` | `INTEGER` | N | FK → `PARTIDO` | Partido. | `consulta_cand → NR_PARTIDO` | FK composta (`ano`, `nr_partido`). |
| `cod_ibge` | `INTEGER` | S | FK → `MUNICIPIO` | Município da disputa. | derivado: `SG_UE` → `MUNICIPIO.cod_tse` | Só em eleição municipal; nulo nas gerais, em que `SG_UE` é UF ou `BR`. O arquivo não tem coluna de município. |
| `cd_grau_instrucao` | `INTEGER` | N | FK → `GRAU_INSTRUCAO` | Escolaridade declarada. | `consulta_cand → CD_GRAU_INSTRUCAO` | Fica aqui, não em `POLITICO`, porque muda entre eleições. |
| `ds_genero` | `VARCHAR(15)` | S | — | Gênero declarado. | `consulta_cand → DS_GENERO` | `MASCULINO` ou `FEMININO`; `-4` vira `NULL`. |
| `ds_cor_raca` | `VARCHAR(20)` | S | — | Cor/raça autodeclarada. | `consulta_cand → DS_COR_RACA` | Só a partir de 2014 (antes, 100% `#NE`). Muda entre eleições, por isso fica aqui. `NÃO INFORMADO` aparece em 2020–2024. |
| `ds_ocupacao` | `VARCHAR(100)` | S | — | Ocupação declarada. | `consulta_cand → DS_OCUPACAO` | O código `CD_OCUPACAO` não é carregado. |
| `ds_sit_tot_turno` | `VARCHAR(20)` | S | — | Resultado da totalização no último turno. | `consulta_cand → DS_SIT_TOT_TURNO` da linha de maior `NR_TURNO` | `ELEITO`, `ELEITO POR QP`, `ELEITO POR MÉDIA`, `MÉDIA` (leiaute antigo), `NÃO ELEITO`, `SUPLENTE`, `2º TURNO`. Nulo em 2026, ainda sem resultado. |
| `fl_eleito` | `BOOLEAN` | N | — | A candidatura foi eleita. | derivado de `ds_sit_tot_turno` | Verdadeiro para `ELEITO`, `ELEITO POR QP`, `ELEITO POR MEDIA` e `MEDIA` (sem acento). `2º TURNO` não é eleito. Não usar o código `CD_SIT_TOT_TURNO`, que muda de sentido entre anos. |
| `nr_idade_eleicao` | `INTEGER` | S | — | Idade na data da eleição. | derivado: `ELEICAO.dt_eleicao` − `POLITICO.dt_nascimento` | `NR_IDADE_DATA_POSSE` não existe de 2018 em diante. Nulo sem data de nascimento. |

#### `BEM_CANDIDATO`

Bem declarado ao TSE no registro da candidatura. **PK:** (`id_candidatura`, `nr_ordem_bem`). **Grão:** um bem de uma candidatura. **Perguntas:** Q2 (leitura "dinheiro = patrimônio").

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_candidatura` | `BIGINT` | N | PK, FK → `CANDIDATURA` | Candidatura que declarou o bem. | `bem_candidato → ANO_ELEICAO`, `SG_UE`, `SQ_CANDIDATO` → UK de `CANDIDATURA` | Candidatura sem bens não tem linhas: patrimônio zero, não desconhecido. |
| `nr_ordem_bem` | `INTEGER` | N | PK | Ordem do bem na declaração. | `bem_candidato → NR_ORDEM_BEM_CANDIDATO` (2016: `NR_ORDEM_CANDIDATO`) | |
| `ds_tipo_bem` | `VARCHAR(100)` | N | — | Tipo do bem. | `bem_candidato → DS_TIPO_BEM_CANDIDATO` | Ex.: `Veículo automotor terrestre: caminhão, automóvel, moto, etc.`. O código e a descrição livre do bem não são carregados. |
| `vr_bem` | `DECIMAL(15,2)` | N | — | Valor declarado, em R$. | `bem_candidato → VR_BEM_CANDIDATO` | `50000,00` → `50000.00`. |

### Resultados eleitorais

#### `VAGA`

Cadeiras em disputa para um cargo numa eleição e unidade eleitoral. **PK:** (`cd_eleicao`, `sg_ue`, `cd_cargo`). **Grão:** eleição × unidade eleitoral × cargo. **Perguntas:** Q1.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cd_eleicao` | `INTEGER` | N | PK, FK → `ELEICAO` | Eleição. | `consulta_vagas → CD_ELEICAO` | |
| `sg_ue` | `VARCHAR(5)` | N | PK | Unidade eleitoral. | `consulta_vagas → SG_UE` | `BR`, UF ou município. Chavear por município perderia as vagas estaduais e federais. |
| `cd_cargo` | `INTEGER` | N | PK, FK → `CARGO` | Cargo. | `consulta_vagas → CD_CARGO` | |
| `cod_ibge` | `INTEGER` | S | FK → `MUNICIPIO` | Município, se a eleição for municipal. | derivado: `SG_UE` → `MUNICIPIO.cod_tse` | Nulo nas eleições gerais. |
| `qt_vaga` | `INTEGER` | N | — | Número de cadeiras. | `consulta_vagas → QT_VAGA` (2016: `QT_VAGAS`) | Maior que zero. É o divisor do custo por cadeira da Q1. |

#### `VOTACAO_CANDIDATO_MUNICIPIO`

Votos nominais de uma candidatura num município e turno, com as zonas somadas. **PK:** (`id_candidatura`, `cod_ibge`, `nr_turno`). **Grão:** candidatura × município × turno. **Perguntas:** Q3, Q7, Q9.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_candidatura` | `BIGINT` | N | PK, FK → `CANDIDATURA` | Candidatura votada. | `votacao_candidato_munzona → ANO_ELEICAO`, `SG_UE`, `CD_CARGO`, `SQ_CANDIDATO` → UK de `CANDIDATURA` | |
| `cod_ibge` | `INTEGER` | N | PK, FK → `MUNICIPIO` | Município da apuração. | `votacao_candidato_munzona → CD_MUNICIPIO`, com `LPAD` | O arquivo traz o código sem o zero à esquerda (R6). Linhas `ZZ` ficam fora (R7). |
| `nr_turno` | `INTEGER` | N | PK | Turno. | `votacao_candidato_munzona → NR_TURNO` | |
| `qt_votos_nominais` | `BIGINT` | N | — | Votos nominais recebidos. | `SUM(QT_VOTOS_NOMINAIS)` | Soma sobre `NR_ZONA` e `ST_VOTO_EM_TRANSITO`. |
| `qt_votos_nominais_validos` | `BIGINT` | N | — | Votos nominais válidos. | `SUM(QT_VOTOS_NOMINAIS_VALIDOS)` | Difere do anterior quando o voto foi anulado ou está *sub judice* (`NM_TIPO_DESTINACAO_VOTOS`). |

#### `VOTACAO_LEGENDA_MUNICIPIO`

Votos de legenda de um partido num município, eleição, cargo e coligação. **PK:** (`cd_eleicao`, `cod_ibge`, `cd_cargo`, `nr_partido`, `sq_coligacao`). **Grão:** eleição × município × cargo × partido × coligação, com zonas e voto em trânsito somados. **Perguntas:** Q5.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cd_eleicao` | `INTEGER` | N | PK, FK → `ELEICAO` | Eleição (já inclui o turno). | `votacao_partido_munzona → CD_ELEICAO` | |
| `cod_ibge` | `INTEGER` | N | PK, FK → `MUNICIPIO` | Município. | `votacao_partido_munzona → CD_MUNICIPIO`, com `LPAD` | R6, R7. |
| `cd_cargo` | `INTEGER` | N | PK, FK → `CARGO` | Cargo. | `votacao_partido_munzona → CD_CARGO` | |
| `nr_partido` | `INTEGER` | N | PK, FK → `PARTIDO` | Partido. | `votacao_partido_munzona → NR_PARTIDO` | FK composta (`ano`, `nr_partido`). |
| `sq_coligacao` | `BIGINT` | N | PK | Agremiação pela qual o partido concorreu. | `votacao_partido_munzona → SQ_COLIGACAO` | Faz parte do grão: o mesmo partido aparece com duas agremiações no mesmo município e cargo (62 casos em 2018, 67 em 2024). A Q5 soma as coligações. |
| `ano` | `INTEGER` | N | FK → `PARTIDO` | Ano da eleição. | `votacao_partido_munzona → ANO_ELEICAO` | Redundante com `ELEICAO.ano`; precisa de restrição de consistência. |
| `qt_votos_legenda_validos` | `BIGINT` | N | — | Votos dados só à legenda. | `SUM(QT_VOTOS_LEGENDA_VALIDOS)` | |
| `qt_total_votos_leg_validos` | `BIGINT` | N | — | Total válido da legenda. | `SUM(QT_TOTAL_VOTOS_LEG_VALIDOS)` | Legenda + votos nominais convertidos em legenda. A parcela convertida, que muda de nome em 2018, sai por diferença e não é lida. |

#### `COMPARECIMENTO_MUNICIPIO`

Totais de aptos, comparecimento, abstenção, brancos e nulos por eleição, cargo e município. **PK:** (`cd_eleicao`, `cd_cargo`, `cod_ibge`). **Grão:** eleição × cargo × município, com zonas somadas. **Perguntas:** Q3.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `cd_eleicao` | `INTEGER` | N | PK, FK → `ELEICAO` | Eleição (já inclui o turno). | `detalhe_votacao_munzona → CD_ELEICAO` | |
| `cd_cargo` | `INTEGER` | N | PK, FK → `CARGO` | Cargo. | `detalhe_votacao_munzona → CD_CARGO` | Os totais se repetem por cargo: nunca somar entre cargos, senão o eleitorado dobra. |
| `cod_ibge` | `INTEGER` | N | PK, FK → `MUNICIPIO` | Município. | `detalhe_votacao_munzona → CD_MUNICIPIO` | Único arquivo de votação que já traz 5 dígitos. |
| `qt_aptos` | `BIGINT` | N | — | Eleitores aptos. | `SUM(QT_APTOS)` | |
| `qt_comparecimento` | `BIGINT` | N | — | Eleitores que votaram. | `SUM(QT_COMPARECIMENTO)` | |
| `qt_abstencoes` | `BIGINT` | N | — | Eleitores que não votaram. | `SUM(QT_ABSTENCOES)` | |
| `qt_votos_brancos` | `BIGINT` | N | — | Votos em branco. | `SUM(QT_VOTOS_BRANCOS)` | |
| `qt_total_votos_nulos` | `BIGINT` | N | — | Votos nulos, inclusive os técnicos. | `SUM(QT_TOTAL_VOTOS_NULOS)` | Os "isentos" da Q3 = (brancos + nulos + abstenções) ÷ aptos, dentro do mesmo cargo e turno. |

### Finanças de campanha

#### `AGENTE_FINANCEIRO`

Pessoa ou organização que aparece nas contas de campanha como doadora direta, doadora originária ou fornecedora. **PK:** `id_agente`. **UK:** `nr_cpf_cnpj`. **Grão:** um CPF ou CNPJ. **Perguntas:** Q8, Q11.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_agente` | `BIGINT` | N | PK | Identificador do agente. | gerado na carga | |
| `nr_cpf_cnpj` | `VARCHAR(14)` | N | UK | CPF (11 dígitos) ou CNPJ (14). | 2018+: `NR_CPF_CNPJ_DOADOR`, `NR_CPF_CNPJ_FORNECEDOR`; 2014–2016: "CPF/CNPJ do doador", "CPF/CNPJ do doador originário", "CPF/CNPJ do fornecedor" | Só dígitos (macro `documento`). Documento sentinela não cria agente. A mesma gráfica pode ser fornecedora num ano e doadora noutro: uma entidade para os três papéis. |
| `nm_agente` | `VARCHAR(150)` | S | — | Nome na Receita Federal. | 2018+: `NM_DOADOR_RFB`, `NM_FORNECEDOR_RFB`; 2014–2016: "Nome do doador (Receita Federal)", "Nome do doador originário (Receita Federal)" | Mais estável que o nome declarado. |
| `cd_cnae` | `VARCHAR(5)` | S | — | Classe CNAE da atividade econômica. | 2018+: `CD_CNAE_DOADOR`, `CD_CNAE_FORNECEDOR`; 2014–2016: "Cod setor econômico do doador" | Normalizado para 5 dígitos: o leiaute antigo traz 7 (`9492800`), o novo 5 (`94928`) (macro `cnae5`). Nulo em pessoa física e no doador originário, que só traz a descrição do setor. |
| `tp_agente` | `VARCHAR(12)` | N | — | Tipo de agente. | derivado | `PF` (11 dígitos); `ORG_POLITICA` (CNAE 94928, ou setor "Atividades de organizações políticas" no originário); `EMPRESA` (demais CNPJ). R9: em 2014, 50,3% da receita de candidatos veio de CNPJ de partido ou comitê, que não é empresa. |

#### `ORGAO_PARTIDARIO`

Diretório ou comitê de partido que arrecada recursos de campanha. **PK:** `id_orgao`. **Grão:** um órgão prestador de contas por eleição. **Perguntas:** Q8.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_orgao` | `BIGINT` | N | PK | Identificador do órgão. | 2018+: `receitas_orgaos_partidarios → SQ_PRESTADOR_CONTAS`; 2014: "Sequencial Diretorio" / "Sequencial Comite" | |
| `ano` | `INTEGER` | N | FK → `PARTIDO` | Ano da eleição. | 2018+: `AA_ELEICAO`; 2014: ano do arquivo | FK composta (`ano`, `nr_partido`). |
| `nr_partido` | `INTEGER` | N | FK → `PARTIDO` | Partido do órgão. | 2018+: `NR_PARTIDO`; 2014: "Sigla  Partido" (com dois espaços) → número por `PARTIDO` (`ano`, `sg_partido`) | O leiaute de 2014 só traz a sigla. |
| `tp_orgao` | `VARCHAR(10)` | N | — | Tipo de órgão. | 2014: arquivo de origem (`receitas_partidos` ou `receitas_comites`); 2018+: sempre diretório | `DIRETORIO` ou `COMITE`. |
| `ds_esfera` | `VARCHAR(20)` | S | — | Esfera partidária. | 2018+: `DS_ESFERA_PARTIDARIA`; 2014: "Tipo diretorio" / "Tipo Comite" | `Nacional`, `Estadual` ou `Municipal`; normalizar `Direção Estadual/Distrital` para `Estadual`. |
| `sg_uf` | `CHAR(2)` | S | — | UF do órgão. | 2018+: `SG_UF`; 2014: "UF" | Nulo em órgão nacional. Sem relacionamento desenhado com `UF` (pendência do modelo relacional). |
| `nr_cnpj` | `VARCHAR(14)` | S | — | CNPJ do prestador de contas. | 2018+: `NR_CNPJ_PRESTADOR_CONTA`; 2014: "CNPJ Prestador Conta" | Só dígitos. |

#### `FONTE_RECURSO`

Classificação da receita pelo par fonte × origem, com a leitura público/privado da Q10. **PK:** `id_fonte_recurso`. **UK:** (`ds_fonte_receita`, `ds_origem_receita`). **Grão:** um par que existe nos arquivos. **Perguntas:** Q10.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_fonte_recurso` | `INTEGER` | N | PK | Identificador do par. | gerado na carga (`sql/02_fonte_recurso.sql`) | `row_number()` sobre os pares reais, não sobre uma lista escrita à mão. |
| `ds_fonte_receita` | `VARCHAR(40)` | S | UK | De que bolso veio o dinheiro. | 2018+: `DS_FONTE_RECEITA`; 2014–2016: "Fonte recurso" | Sem acento e em caixa alta (macro `categoria`): `FUNDO ESPECIAL`, `FUNDO PARTIDARIO`, `OUTROS RECURSOS`, `NAO ESPECIFICADO` (91% das linhas de 2014). |
| `ds_origem_receita` | `VARCHAR(60)` | S | UK | Quem entregou o dinheiro. | 2018+: `DS_ORIGEM_RECEITA`; 2014–2016: "Tipo receita" | Ex.: `RECURSOS DE PESSOAS FISICAS`, `RECURSOS DE PARTIDO POLITICO`, `RECURSOS PROPRIOS`. |
| `tp_origem` | `VARCHAR(20)` | N | — | Classe da Q10. | regra do grupo (`docs/der/q10-publico-privado.md`) | `PUBLICO` (fundos, qualquer que seja quem repassou), `PROPRIO`, `PRIVADO`, `PARTIDARIO`, `TRANSFERENCIA`, `RENDIMENTO`, `NAO IDENTIFICADO`. A fonte é testada antes da origem, porque em 2014 a fonte quase nunca vem preenchida. |

#### `RECEITA_CAMPANHA`

Entrada de recursos numa candidatura ou num órgão partidário. **PK:** `id_receita`. **Grão:** uma receita declarada na prestação de contas final. **Perguntas:** Q8, Q10.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_receita` | `BIGINT` | N | PK | Identificador da receita. | gerado na carga | Chave substituta (R8): `SQ_RECEITA` repete e, no arquivo de doador originário, é sentinela em ~97% das linhas. |
| `id_candidatura` | `BIGINT` | S | FK → `CANDIDATURA` | Candidatura que recebeu. | 2018+: `receitas_candidatos → SQ_CANDIDATO`, `AA_ELEICAO`; 2014–2016: "Sequencial Candidato" | Exatamente um entre `id_candidatura` e `id_orgao` é preenchido (restrição de verificação). |
| `id_orgao` | `BIGINT` | S | FK → `ORGAO_PARTIDARIO` | Órgão partidário que recebeu. | 2018+: `receitas_orgaos_partidarios → SQ_PRESTADOR_CONTAS`; 2014: "Sequencial Diretorio" / "Sequencial Comite" | Em 2014, R$ 1,34 bi de empresas entraram em partidos e R$ 406 mi em comitês. |
| `id_agente_doador` | `BIGINT` | N | FK → `AGENTE_FINANCEIRO` | Doador direto. | 2018+: `NR_CPF_CNPJ_DOADOR`; 2014–2016: "CPF/CNPJ do doador" | |
| `id_agente_originario` | `BIGINT` | S | FK → `AGENTE_FINANCEIRO` | Quem deu o dinheiro ao doador direto (ex.: empresa → partido → candidato). | 2014–2016: "CPF/CNPJ do doador originário" | Só 2014–2016. De 2018 em diante vem noutro arquivo, sem vínculo confiável com a receita. Em 2014, R$ 1,77 bi chegaram por partido com empresa como originária. |
| `id_fonte_recurso` | `INTEGER` | N | FK → `FONTE_RECURSO` | Classificação da receita. | par (`DS_FONTE_RECEITA`, `DS_ORIGEM_RECEITA`) / ("Fonte recurso", "Tipo receita") | |
| `dt_receita` | `DATE` | S | — | Data da receita. | 2018+: `DT_RECEITA`; 2014–2016: "Data da receita" | Formatos `12/11/2020`, `02/10/201400:00:00` e, em `receitas_partidos` 2014, `25-SEP-14`. |
| `vr_receita` | `DECIMAL(15,2)` | N | — | Valor recebido, em R$. | 2018+: `VR_RECEITA`; 2014–2016: "Valor receita" | Inclui recurso estimável (serviço ou bem cedido). |

#### `TIPO_DESPESA`

Categoria de despesa de campanha, com o canal de propaganda da Q11. **PK:** `id_tipo_despesa`. **Grão:** uma categoria canônica. **Perguntas:** Q11.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_tipo_despesa` | `INTEGER` | N | PK | Identificador da categoria. | gerado na carga (`sql/03_tipo_despesa.sql`) | |
| `ds_tipo_despesa` | `VARCHAR(80)` | N | UK | Categoria canônica. | 2018+: `DS_ORIGEM_DESPESA`; 2014–2016: "Tipo despesa" | Sem acento, em caixa alta e sem o prefixo `BAIXA DE ESTIMAVEIS - ` que até 2016 duplicava quase toda categoria. |
| `ds_canal_propaganda` | `VARCHAR(20)` | S | — | Canal de propaganda. | regra do grupo (`docs/der/q11-propaganda.md`) | `IMPRESSO`, `ADESIVO`, `PLACA E FAIXA` (só 2014), `RADIO E TV`, `JINGLE`, `CARRO DE SOM`, `JORNAL E REVISTA`, `TELEMARKETING`, `DIGITAL` (impulsionamento, só 2018+), `RUA`. Nulo = não é propaganda. |
| `fl_propaganda` | `BOOLEAN` | N | — | A categoria é propaganda. | derivado: `ds_canal_propaganda IS NOT NULL` | Redundante; mantido para filtrar sem comparar texto. |

#### `DESPESA_CAMPANHA`

Gasto contratado por uma candidatura. **PK:** `id_despesa`. **Grão:** uma despesa contratada. **Perguntas:** Q1, Q2, Q11.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_despesa` | `BIGINT` | N | PK | Identificador da despesa. | gerado na carga | Chave substituta (R8): `SQ_DESPESA` repete em 31% das linhas mesmo na prestação final. |
| `id_candidatura` | `BIGINT` | N | FK → `CANDIDATURA` | Candidatura que contratou. | 2018+: `despesas_contratadas_candidatos → SQ_CANDIDATO`, `AA_ELEICAO`; 2014–2016: "Sequencial Candidato" | |
| `id_agente_fornecedor` | `BIGINT` | N | FK → `AGENTE_FINANCEIRO` | Fornecedor. | 2018+: `NR_CPF_CNPJ_FORNECEDOR`; 2014–2016: "CPF/CNPJ do fornecedor" | |
| `id_tipo_despesa` | `INTEGER` | N | FK → `TIPO_DESPESA` | Categoria. | 2018+: `DS_ORIGEM_DESPESA`; 2014–2016: "Tipo despesa" | |
| `dt_despesa` | `DATE` | S | — | Data da contratação. | 2018+: `DT_DESPESA`; 2014–2016: "Data da despesa" | |
| `vr_despesa` | `DECIMAL(15,2)` | N | — | Valor contratado, em R$. | 2018+: `VR_DESPESA_CONTRATADA`; 2014–2016: "Valor despesa" | Valor contratado, não pago: `despesas_pagas` vem em parcelas e sem candidato nem fornecedor. |
| `ds_despesa` | `TEXT` | S | — | Descrição livre do gasto. | 2018+: `DS_DESPESA`; 2014–2016: "Descriçao da despesa" (sic) | Acento preservado (macro `limpa`, não `categoria`). Texto da nuvem de palavras da Q11. |

### Propostas de governo

#### `PROPOSTA_GOVERNO`

PDF de proposta registrado por uma candidatura, com o texto extraído. **PK:** (`id_candidatura`, `nr_sequencial`). **Grão:** um arquivo PDF. **Perguntas:** Q6.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_candidatura` | `BIGINT` | N | PK, FK → `CANDIDATURA` | Candidatura que registrou a proposta. | nome do arquivo `{ano}{UF}{SQ_CANDIDATO}_{seq}.pdf` → (`ano`, `sq_candidato`) | A ligação sai do nome do arquivo, não do nome do candidato. ⚠️ Propostas de presidente (`_BR`) não são coletadas (F4). |
| `nr_sequencial` | `INTEGER` | N | PK | Ordem do PDF na candidatura. | sufixo do nome (`_01`, `_02`) | O sufixo só existe em 2024 e 2026; antes, `1`. |
| `nm_arquivo` | `VARCHAR(60)` | N | UK | Nome do PDF. | nome do arquivo | Ex.: `2024PI180001881915_01.pdf`. |
| `qt_caracteres` | `INTEGER` | N | — | Caracteres não brancos do texto extraído. | derivado: `length(regexp_replace(tx_conteudo, '\s', '', 'g'))` | Contar os brancos marcaria PDF escaneado como texto: todo escaneado tem de 1 a 43 caracteres de quebras e espaços. |
| `fl_texto_extraido` | `BOOLEAN` | N | — | O PDF tem texto aproveitável. | derivado | Regra proposta: pelo menos metade das páginas com texto e 100 caracteres por página. Medido com pdftotext 4.00: 266 de 1.622 PDFs sem texto (16,4%): 27,5% em 2016, 13,5% em 2020, 8,2% em 2024, nenhum em 2018, 2022 e 2026. |
| `tx_conteudo` | `TEXT` | S | — | Texto integral extraído. | extração do PDF | Nulo ou vazio em PDF escaneado; não há OCR. Guardado para recontar os termos sem reprocessar os PDFs. |

#### `TERMO_PROPOSTA`

Termo de uma proposta e quantas vezes aparece. Entidade inteiramente derivada. **PK:** (`id_candidatura`, `nr_sequencial`, `termo`). **Grão:** termo × proposta. **Perguntas:** Q6.

| Atributo | Tipo | Nulo | Chave | Descrição | Origem | Observações |
|---|---|---|---|---|---|---|
| `id_candidatura` | `BIGINT` | N | PK, FK → `PROPOSTA_GOVERNO` | Proposta de origem. | igual a `PROPOSTA_GOVERNO.id_candidatura` | FK composta (`id_candidatura`, `nr_sequencial`). |
| `nr_sequencial` | `INTEGER` | N | PK, FK → `PROPOSTA_GOVERNO` | Proposta de origem. | igual a `PROPOSTA_GOVERNO.nr_sequencial` | |
| `termo` | `VARCHAR(60)` | N | PK | Palavra normalizada. | derivado de `tx_conteudo` | Minúsculas, sem stopwords do português. Só de propostas com `fl_texto_extraido`. |
| `qt_frequencia` | `INTEGER` | N | — | Ocorrências do termo no documento. | derivado: contagem | Maior que zero. |

### Colunas do TSE que não entram no modelo

Metadados de geração (`DT_GERACAO`, `HH_GERACAO`); descrições que repetem um código já carregado, ou o inverso (`DS_CARGO` fora de `CARGO`, `CD_GENERO`, `CD_COR_RACA`, `CD_OCUPACAO`, `CD_SIT_TOT_TURNO`); nomes que mudam de grafia entre anos (`NM_UE`, `NM_MUNICIPIO`, `NM_FEDERACAO`); dados pessoais sem uso nas perguntas (`NR_CPF_CANDIDATO`, `DS_EMAIL`, `NM_SOCIAL_CANDIDATO`, `CD_ESTADO_CIVIL`); e atributos de candidatura fora do DER geral (`NR_CANDIDATO`, `NM_URNA_CANDIDATO`, `CD_SITUACAO_CANDIDATURA`, `SQ_COLIGACAO` em `CANDIDATURA`, `NR_FEDERACAO` em `CANDIDATURA`). Os recortes do perfil de comparecimento (estado civil, escolaridade, cor/raça, quilombola, deficiência etc.) são somados. `NR_IDADE_DATA_POSSE` e `VR_DESPESA_MAX_CAMPANHA` só existem até 2010 e foram trocados por atributos derivados.

### Pendências: onde o SQL atual difere deste dicionário

1. **Nomes em `fonte_recurso` e `tipo_despesa`.** `sql/02_fonte_recurso.sql` gera `cd_fonte_recurso`, `ds_fonte_recurso` e `ds_origem_recurso`; o DER usa `id_fonte_recurso`, `ds_fonte_receita` e `ds_origem_receita`. `sql/03_tipo_despesa.sql` gera `cd_tipo_despesa` em vez de `id_tipo_despesa`. As duas tabelas também têm colunas de auditoria (`qt_linhas`, `vr_total`, `ano_min`, `ano_max`) que não estão no DER.
2. **`candidatura` e `politico` em `sql/04_politico.sql`.** Não aplicam R1 (lêem ordinárias e suplementares), não trazem `cd_eleicao`, `cd_grau_instrucao` nem `cod_ibge`, e `politico` guarda `ds_genero` e `ds_cor_raca`, que o DER põe em `CANDIDATURA` porque mudam entre eleições.
3. **Sentinelas.** A macro `limpa` de `sql/01_staging.sql` trata `#NULO`, `#NULO#`, `-1`, `-3` e `-4`, mas não `#NE`, `#NE#`, `NÃO DIVULGÁVEL` nem `Não divulgável`.
4. **Datas de 2014.** A macro `data_br` só lê `dd/mm/aaaa`; o `25-SEP-14` de `receitas_partidos` 2014 viraria `NULL`. Hoje o staging só lê receitas de candidatos, mas a Q8 precisa das de órgãos.
5. **Prestação final.** O staging não filtra `TP_PRESTACAO_CONTAS`. Em 2026 só existem entregas `PARCIAL` e `RELATÓRIO FINANCEIRO`.
6. **Doador e fornecedor obrigatórios.** O DER exige `id_agente_doador` e `id_agente_fornecedor`, mas há 1.265 receitas de valor zero sem fonte, origem nem doador identificável. É preciso decidir entre um agente "não identificado" e a FK anulável.
7. **`VOTACAO_LEGENDA_MUNICIPIO`.** O módulo Q4–Q6 previa `nr_federacao` e `qt_votos_nominais_validos`, que não entraram no DER geral. Falta medir se, desde 2022, o voto de legenda da federação se repete em cada partido membro.
8. **3FN em `MUNICIPIO`.** `nm_regiao_imediata` depende de `cd_regiao_imediata`. Aceito por serem só 5.570 linhas; a alternativa é uma entidade `REGIAO_IMEDIATA`.
9. **Dados que ainda não existem:** espectro partidário (F1), população de anos anteriores a 2026 (F2), IDHM municipal (F3) e propostas de presidente (F4). Ver `docs/der/der-geral.md`, seção 4.
10. **Conferir nos dados:** os códigos distintos de `CD_GRAU_INSTRUCAO` (o significado do `0`) e se a SIDRA 9606 traz uma linha de total por município.
