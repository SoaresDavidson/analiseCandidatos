-- 06_carga_modelo.sql — popula as tabelas do schema `modelo` (criadas em 00_modelo.sql).
--
-- Rodar a partir da RAIZ do repositório, depois do 00:
--
--     uv run python scripts/carregar_staging.py 00_modelo 06_carga
--     uv run python scripts/carregar_propostas.py     # PROPOSTA_GOVERNO e TERMO_PROPOSTA
--
-- Regras de carga: docs/dossie/secoes/dicionario.md. Recorte: decisão ① do
-- estrategia.md — nacional (arquivos `_BRASIL`), com o PI filtrado no SQL de quem
-- consome. As exceções são as fontes que só existem para o PI: perfil de
-- comparecimento e propostas de governo.
--
-- Idempotente: apaga o conteúdo das tabelas (filhas antes das mães) e recarrega.
-- Leva alguns minutos: lê ~30 GB de CSV (votação por zona e prestação de contas).
--
-- Tabelas que ficam vazias por falta de dado no repositório (pendência 9 do
-- dicionário): IDHM_MUNICIPIO (o xlsx do PNUD em dados/raw/pnud só tem UF e RM,
-- não município — F3) e ESPECTRO_PARTIDO (F1).

INSTALL encodings;
LOAD encodings;
INSTALL excel;
LOAD excel;

SET preserve_insertion_order = false;

-- ---------------------------------------------------------------------------
-- Limpeza. Macros temporárias para não colidir com as de 01_staging.sql, que
-- tratam menos sentinelas (pendência 3 do dicionário).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE TEMP MACRO nulo(x) AS
    CASE WHEN x IS NULL
           OR upper(trim(x)) IN ('', '#NULO', '#NULO#', '#NE', '#NE#', '-1', '-3', '-4',
                                 'NÃO DIVULGÁVEL')
         THEN NULL ELSE trim(x) END;

-- categoria (fonte, origem, tipo de despesa): sem acento e em caixa alta
CREATE OR REPLACE TEMP MACRO categoria(x) AS upper(strip_accents(nulo(x)));

-- '1.234,56' (2018+) e '562,5' (2014–2016) -> DECIMAL
CREATE OR REPLACE TEMP MACRO valor_br(x) AS
    TRY_CAST(replace(replace(nulo(x), '.', ''), ',', '.') AS DECIMAL(15, 2));

-- '18/07/201400:00:00', '22/10/2020' e, em receitas_partidos, '25-SEP-14'
CREATE OR REPLACE TEMP MACRO data_br(x) AS
    coalesce(TRY_STRPTIME(substr(nulo(x), 1, 10), '%d/%m/%Y'),
             TRY_STRPTIME(nulo(x), '%d-%b-%y'))::DATE;

-- CPF (11) ou CNPJ (14) só com dígitos; qualquer outro comprimento é sentinela
CREATE OR REPLACE TEMP MACRO documento(x) AS
    CASE WHEN length(regexp_replace(coalesce(x, ''), '[^0-9]', '', 'g')) IN (11, 14)
         THEN regexp_replace(x, '[^0-9]', '', 'g') END;

-- CNAE: subclasse de 7 dígitos (2014–2016) ou classe de 5 (2018+) -> 5 dígitos
CREATE OR REPLACE TEMP MACRO cnae5(x) AS
    left(nullif(regexp_replace(coalesce(nulo(x), ''), '[^0-9]', '', 'g'), ''), 5);

-- R1: só eleições ordinárias, pelo código (2 em geral; 0 em 2006)
CREATE OR REPLACE TEMP MACRO ordinaria(cd, ano) AS
    cd = '2' OR (cd = '0' AND ano = '2006');

-- abrangência: texto no consulta_cand, letra nos arquivos de resultado
CREATE OR REPLACE TEMP MACRO abrangencia(x) AS
    CASE upper(x) WHEN 'M' THEN 'MUNICIPAL' WHEN 'E' THEN 'ESTADUAL'
                  WHEN 'F' THEN 'FEDERAL' ELSE upper(x) END;

-- Prestação 2018+: uma prestação pode aparecer em várias entregas. A final é
-- cumulativa, então fica só a entrega mais completa de cada prestador. Em 2026
-- ainda não há final e a parcial é a que vale.
CREATE OR REPLACE TEMP MACRO prioridade_entrega(x) AS
    CASE upper(strip_accents(x))
        WHEN 'FINAL' THEN 1 WHEN 'REGULARIZACAO DA OMISSAO' THEN 2
        WHEN 'PARCIAL' THEN 3 WHEN 'RELATORIO FINANCEIRO' THEN 4 ELSE 5 END;

-- ---------------------------------------------------------------------------
-- Esvazia o modelo, das filhas para as mães
-- ---------------------------------------------------------------------------

DELETE FROM modelo.termo_proposta;
DELETE FROM modelo.proposta_governo;
DELETE FROM modelo.despesa_campanha;
DELETE FROM modelo.receita_campanha;
DELETE FROM modelo.tipo_despesa;
DELETE FROM modelo.fonte_recurso;
DELETE FROM modelo.agente_financeiro;
DELETE FROM modelo.comparecimento_municipio;
DELETE FROM modelo.votacao_legenda_municipio;
DELETE FROM modelo.votacao_candidato_municipio;
DELETE FROM modelo.vaga;
DELETE FROM modelo.bem_candidato;
DELETE FROM modelo.candidatura;
DELETE FROM modelo.politico;
DELETE FROM modelo.cargo;
DELETE FROM modelo.eleicao;
DELETE FROM modelo.orgao_partidario;
DELETE FROM modelo.partido_federacao;
DELETE FROM modelo.federacao;
DELETE FROM modelo.espectro_partido;
DELETE FROM modelo.partido;
DELETE FROM modelo.comparecimento_perfil;
DELETE FROM modelo.censo_faixa_etaria;
DELETE FROM modelo.faixa_etaria;
DELETE FROM modelo.censo_instrucao;
DELETE FROM modelo.grau_instrucao;
DELETE FROM modelo.nivel_instrucao;
DELETE FROM modelo.idhm_municipio;
DELETE FROM modelo.municipio_censo;
DELETE FROM modelo.municipio_ano;
DELETE FROM modelo.municipio;
DELETE FROM modelo.uf;

-- ===========================================================================
-- Staging: cada arquivo grande é lido uma vez, só com as colunas usadas
-- ===========================================================================

CREATE OR REPLACE TEMP TABLE stg_pib AS
SELECT
    TRY_CAST(Ano AS INTEGER)                                       AS ano,
    TRY_CAST("Código do Município" AS INTEGER)                     AS cod_ibge,
    "Sigla da Unidade da Federação"                                AS sg_uf,
    "Nome da Grande Região"                                        AS nm_regiao,
    TRY_CAST("Código da Região Geográfica Imediata" AS INTEGER)    AS cd_regiao_imediata,
    "Nome da Região Geográfica Imediata"                           AS nm_regiao_imediata,
    TRY_CAST("Código da Região Geográfica Intermediária" AS INTEGER) AS cd_regiao_intermediaria,
    -- o cabeçalho do xlsx tem quebras de linha dentro do nome
    TRY_CAST(COLUMNS('^Produto Interno Bruto, \s*a preços correntes') AS DOUBLE) AS vr_pib_mil,
    TRY_CAST(COLUMNS('^Produto Interno Bruto per capita') AS DOUBLE)            AS vr_pib_per_capita
FROM read_xlsx('dados/raw/ibge/pib_municipios/base_de_dados_2010_2023_xlsx/PIB dos Municípios - base de dados 2010-2023.xlsx',
               all_varchar = true);

-- SIDRA: a primeira linha do JSON repete o cabeçalho; ela some no TRY_CAST de D1C.
-- Em V, '-' é zero absoluto (1.314 faixas etárias vazias na 9606).
CREATE OR REPLACE TEMP MACRO sidra(arquivo) AS TABLE
    SELECT * REPLACE (CASE WHEN V = '-' THEN '0' ELSE V END AS V) FROM read_json(arquivo, format = 'array', columns = {
        D1C: 'VARCHAR', D2C: 'VARCHAR', D3N: 'VARCHAR', D4C: 'VARCHAR', D4N: 'VARCHAR',
        D6C: 'VARCHAR', D6N: 'VARCHAR', V: 'VARCHAR'})
    WHERE TRY_CAST(D1C AS INTEGER) IS NOT NULL;

CREATE OR REPLACE TEMP TABLE stg_cand AS
SELECT
    ANO_ELEICAO::INTEGER                             AS ano,
    NR_TURNO::INTEGER                                AS nr_turno,
    CD_ELEICAO::INTEGER                              AS cd_eleicao,
    data_br(DT_ELEICAO)                              AS dt_eleicao,
    abrangencia(TP_ABRANGENCIA)                      AS tp_abrangencia,
    nulo(SG_UE)                                      AS sg_ue,
    CD_CARGO::INTEGER                                AS cd_cargo,
    upper(nulo(DS_CARGO))                            AS ds_cargo,
    TRY_CAST(SQ_CANDIDATO AS BIGINT)                 AS sq_candidato,
    CASE WHEN regexp_matches(NR_TITULO_ELEITORAL_CANDIDATO, '^[0-9]{1,12}$')
              AND TRY_CAST(NR_TITULO_ELEITORAL_CANDIDATO AS BIGINT) > 0
         THEN lpad(NR_TITULO_ELEITORAL_CANDIDATO, 12, '0') END AS nr_titulo_eleitoral,
    nulo(NM_CANDIDATO)                               AS nm_candidato,
    data_br(DT_NASCIMENTO)                           AS dt_nascimento,
    nulo(SG_UF_NASCIMENTO)                           AS sg_uf_nascimento,
    nulo(DS_GENERO)                                  AS ds_genero,
    nulo(DS_COR_RACA)                                AS ds_cor_raca,
    nulo(DS_OCUPACAO)                                AS ds_ocupacao,
    TRY_CAST(CD_GRAU_INSTRUCAO AS INTEGER)           AS cd_grau_instrucao,
    DS_GRAU_INSTRUCAO                                AS ds_grau_instrucao,
    nulo(DS_SIT_TOT_TURNO)                           AS ds_sit_tot_turno,
    TRY_CAST(NR_PARTIDO AS INTEGER)                  AS nr_partido,
    nulo(SG_PARTIDO)                                 AS sg_partido,
    nulo(NM_PARTIDO)                                 AS nm_partido,
    TRY_CAST(NR_FEDERACAO AS INTEGER)                AS nr_federacao,
    nulo(SG_FEDERACAO)                               AS sg_federacao,
    nulo(DS_COMPOSICAO_FEDERACAO)                    AS ds_composicao_federacao
FROM read_csv('dados/raw/candidatos/*/candidatos_[0-9]*/consulta_cand_[0-9]*_BRASIL.csv',
              delim = ';', quote = '"', header = true, encoding = 'cp1252',
              all_varchar = true, union_by_name = true, ignore_errors = true)
WHERE ordinaria(CD_TIPO_ELEICAO, ANO_ELEICAO)
  AND TRY_CAST(SQ_CANDIDATO AS BIGINT) IS NOT NULL;

CREATE OR REPLACE TEMP TABLE stg_vagas AS
SELECT
    ANO_ELEICAO::INTEGER AS ano, CD_ELEICAO::INTEGER AS cd_eleicao,
    data_br(DT_ELEICAO) AS dt_eleicao, SG_UE AS sg_ue, CD_CARGO::INTEGER AS cd_cargo,
    upper(DS_CARGO) AS ds_cargo,
    coalesce(TRY_CAST(QT_VAGA AS INTEGER), TRY_CAST(QT_VAGAS AS INTEGER)) AS qt_vaga
FROM read_csv('dados/raw/candidatos/*/vagas_*/consulta_vagas_*_BRASIL.csv',
              delim = ';', quote = '"', header = true, encoding = 'cp1252',
              all_varchar = true, union_by_name = true)
WHERE ordinaria(CD_TIPO_ELEICAO, ANO_ELEICAO);

-- Votação: já agregada ao grão do modelo (zona e voto em trânsito somados). Linhas
-- do exterior ficam fora (R7).
CREATE OR REPLACE TEMP TABLE stg_vcand AS
SELECT
    ANO_ELEICAO::INTEGER AS ano, CD_ELEICAO::INTEGER AS cd_eleicao,
    NR_TURNO::INTEGER AS nr_turno, data_br(DT_ELEICAO) AS dt_eleicao,
    abrangencia(TP_ABRANGENCIA) AS tp_abrangencia,
    SG_UE AS sg_ue, CD_CARGO::INTEGER AS cd_cargo, upper(DS_CARGO) AS ds_cargo,
    SQ_CANDIDATO::BIGINT AS sq_candidato,
    lpad(CD_MUNICIPIO, 5, '0') AS cod_tse,                           -- R6
    sum(QT_VOTOS_NOMINAIS::BIGINT)         AS qt_votos_nominais,
    sum(QT_VOTOS_NOMINAIS_VALIDOS::BIGINT) AS qt_votos_nominais_validos
FROM read_csv('dados/raw/resultados/*/votacao_candidato_munzona_*/votacao_candidato_munzona_*_BRASIL.csv',
              delim = ';', quote = '"', header = true, encoding = 'cp1252',
              all_varchar = true, union_by_name = true)
WHERE ordinaria(CD_TIPO_ELEICAO, ANO_ELEICAO) AND SG_UF <> 'ZZ'
GROUP BY ALL;

CREATE OR REPLACE TEMP TABLE stg_vpart AS
SELECT
    ANO_ELEICAO::INTEGER AS ano, CD_ELEICAO::INTEGER AS cd_eleicao,
    NR_TURNO::INTEGER AS nr_turno, data_br(DT_ELEICAO) AS dt_eleicao,
    abrangencia(TP_ABRANGENCIA) AS tp_abrangencia,
    CD_CARGO::INTEGER AS cd_cargo, upper(DS_CARGO) AS ds_cargo,
    NR_PARTIDO::INTEGER AS nr_partido, nulo(SG_PARTIDO) AS sg_partido, nulo(NM_PARTIDO) AS nm_partido,
    SQ_COLIGACAO::BIGINT AS sq_coligacao,
    lpad(CD_MUNICIPIO, 5, '0') AS cod_tse,
    sum(QT_VOTOS_LEGENDA_VALIDOS::BIGINT)   AS qt_votos_legenda_validos,
    sum(QT_TOTAL_VOTOS_LEG_VALIDOS::BIGINT) AS qt_total_votos_leg_validos
FROM read_csv('dados/raw/resultados/*/votacao_partido_munzona_*/votacao_partido_munzona_*_BRASIL.csv',
              delim = ';', quote = '"', header = true, encoding = 'cp1252',
              all_varchar = true, union_by_name = true)
WHERE ordinaria(CD_TIPO_ELEICAO, ANO_ELEICAO) AND SG_UF <> 'ZZ'
GROUP BY ALL;

CREATE OR REPLACE TEMP TABLE stg_detalhe AS
SELECT
    ANO_ELEICAO::INTEGER AS ano, CD_ELEICAO::INTEGER AS cd_eleicao,
    NR_TURNO::INTEGER AS nr_turno, data_br(DT_ELEICAO) AS dt_eleicao,
    abrangencia(TP_ABRANGENCIA) AS tp_abrangencia,
    CD_CARGO::INTEGER AS cd_cargo, upper(DS_CARGO) AS ds_cargo,
    lpad(CD_MUNICIPIO, 5, '0') AS cod_tse,
    sum(QT_APTOS::BIGINT)             AS qt_aptos,
    sum(QT_COMPARECIMENTO::BIGINT)    AS qt_comparecimento,
    sum(QT_ABSTENCOES::BIGINT)        AS qt_abstencoes,
    sum(QT_VOTOS_BRANCOS::BIGINT)     AS qt_votos_brancos,
    sum(QT_TOTAL_VOTOS_NULOS::BIGINT) AS qt_total_votos_nulos
FROM read_csv('dados/raw/resultados/*/detalhe_votacao_munzona_*/detalhe_votacao_munzona_*_BRASIL.csv',
              delim = ';', quote = '"', header = true, encoding = 'cp1252',
              all_varchar = true, union_by_name = true)
WHERE ordinaria(CD_TIPO_ELEICAO, ANO_ELEICAO) AND SG_UF <> 'ZZ'
GROUP BY ALL;

-- Leiaute antigo (2014–2016): há aspas soltas dentro de campos
-- ("ANTONIO GOMES DA SILVA"FOTO - ME). Com escape explícito e strict_mode
-- desligado só 2 de ~11 milhões de linhas ficam de fora (despesas 2016).
--
-- Receitas: candidatos e órgãos, leiaute antigo (2014–2016) e novo (2018+), numa
-- forma só. `id_orgao` é o sequencial do prestador; os atributos do órgão ficam
-- aqui para montar ORGAO_PARTIDARIO.
CREATE OR REPLACE TEMP TABLE stg_receita AS
WITH
cand_antiga AS (
    SELECT *, TRY_CAST(regexp_extract(filename, '_(20\d\d)_brasil\.txt$', 1) AS INTEGER) AS ano
    FROM read_csv(['dados/raw/prestacao_contas/2014/*/receitas_candidatos_2014_brasil.txt',
                   'dados/raw/prestacao_contas/2016/*/receitas_candidatos_prestacao_contas_final_2016_brasil.txt'],
                  delim = ';', quote = '"', header = true, encoding = 'cp1252',
                  all_varchar = true, union_by_name = true, filename = true,
                  escape = '"', strict_mode = false, ignore_errors = true)
),
org_antiga AS (
    SELECT *,
        TRY_CAST(regexp_extract(filename, '_(20\d\d)_brasil\.txt$', 1) AS INTEGER) AS ano,
        CASE WHEN filename LIKE '%receitas_comites%' THEN 'COMITE' ELSE 'DIRETORIO' END AS tp_orgao
    FROM read_csv(['dados/raw/prestacao_contas/2014/*/receitas_partidos_2014_brasil.txt',
                   'dados/raw/prestacao_contas/2014/*/receitas_comites_2014_brasil.txt',
                   'dados/raw/prestacao_contas/2016/*/receitas_partidos_prestacao_contas_final_2016_brasil.txt'],
                  delim = ';', quote = '"', header = true, encoding = 'cp1252',
                  all_varchar = true, union_by_name = true, filename = true,
                  escape = '"', strict_mode = false, ignore_errors = true)
),
cand_nova AS (
    SELECT * FROM read_csv('dados/raw/prestacao_contas/20*/prestacao_contas_candidatos_????/receitas_candidatos_????_BRASIL.csv',
                           delim = ';', quote = '"', header = true, encoding = 'cp1252',
                           all_varchar = true, union_by_name = true)
    WHERE ordinaria(CD_TIPO_ELEICAO, AA_ELEICAO)
    QUALIFY prioridade_entrega(TP_PRESTACAO_CONTAS)
          = min(prioridade_entrega(TP_PRESTACAO_CONTAS)) OVER (PARTITION BY AA_ELEICAO, SQ_CANDIDATO)
),
org_nova AS (
    SELECT * FROM read_csv('dados/raw/prestacao_contas/20*/prestacao_contas_orgaos_partidarios_????/receitas_orgaos_partidarios_????_BRASIL.csv',
                           delim = ';', quote = '"', header = true, encoding = 'cp1252',
                           all_varchar = true, union_by_name = true)
    WHERE ordinaria(CD_TIPO_ELEICAO, AA_ELEICAO)
    QUALIFY prioridade_entrega(TP_PRESTACAO_CONTAS)
          = min(prioridade_entrega(TP_PRESTACAO_CONTAS)) OVER (PARTITION BY AA_ELEICAO, SQ_PRESTADOR_CONTAS)
)
SELECT
    ano,
    TRY_CAST("Sequencial Candidato" AS BIGINT)            AS sq_candidato,
    NULL::BIGINT AS id_orgao, NULL AS tp_orgao, NULL AS ds_esfera, NULL AS sg_uf_orgao,
    NULL AS nr_cnpj_orgao, NULL::INTEGER AS nr_partido_orgao, NULL AS sg_partido_orgao,
    data_br("Data da receita")                            AS dt_receita,
    valor_br("Valor receita")                             AS vr_receita,
    documento("CPF/CNPJ do doador")                       AS doc_doador,
    nulo("Nome do doador (Receita Federal)")              AS nm_doador,
    cnae5("Cod setor econômico do doador")                AS cnae_doador,
    documento("CPF/CNPJ do doador originário")            AS doc_originario,
    nulo("Nome do doador originário (Receita Federal)")   AS nm_originario,
    categoria("Setor econômico do doador originário")     AS setor_originario,
    categoria("Fonte recurso")                            AS ds_fonte,
    categoria("Tipo receita")                             AS ds_origem
FROM cand_antiga
UNION ALL BY NAME
SELECT
    ano,
    NULL::BIGINT AS sq_candidato,
    TRY_CAST(coalesce("Sequencial Diretorio", "Sequencial Comite", "Sequencial prestador conta") AS BIGINT) AS id_orgao,
    tp_orgao,
    nulo(coalesce("Tipo diretorio", "Tipo Comite"))       AS ds_esfera,
    nulo("UF")                                            AS sg_uf_orgao,
    documento("CNPJ Prestador Conta")                     AS nr_cnpj_orgao,
    NULL::INTEGER                                         AS nr_partido_orgao,
    nulo("Sigla  Partido")                                AS sg_partido_orgao,
    data_br("Data da receita"), valor_br("Valor receita"),
    documento("CPF/CNPJ do doador"), nulo("Nome do doador (Receita Federal)"),
    cnae5("Cod setor econômico do doador"),
    documento("CPF/CNPJ do doador originário"), nulo("Nome do doador originário (Receita Federal)"),
    categoria("Setor econômico do doador originário"),
    categoria("Fonte recurso"), categoria("Tipo receita")
FROM org_antiga
UNION ALL BY NAME
SELECT
    AA_ELEICAO::INTEGER AS ano, TRY_CAST(SQ_CANDIDATO AS BIGINT) AS sq_candidato,
    data_br(DT_RECEITA) AS dt_receita, valor_br(VR_RECEITA) AS vr_receita,
    documento(NR_CPF_CNPJ_DOADOR) AS doc_doador, nulo(NM_DOADOR_RFB) AS nm_doador,
    cnae5(CD_CNAE_DOADOR) AS cnae_doador,
    categoria(DS_FONTE_RECEITA) AS ds_fonte, categoria(DS_ORIGEM_RECEITA) AS ds_origem
FROM cand_nova
UNION ALL BY NAME
SELECT
    AA_ELEICAO::INTEGER AS ano,
    TRY_CAST(SQ_PRESTADOR_CONTAS AS BIGINT) AS id_orgao, 'DIRETORIO' AS tp_orgao,
    nulo(DS_ESFERA_PARTIDARIA) AS ds_esfera, nulo(SG_UF) AS sg_uf_orgao,
    documento(NR_CNPJ_PRESTADOR_CONTA) AS nr_cnpj_orgao,
    TRY_CAST(NR_PARTIDO AS INTEGER) AS nr_partido_orgao, nulo(SG_PARTIDO) AS sg_partido_orgao,
    data_br(DT_RECEITA) AS dt_receita, valor_br(VR_RECEITA) AS vr_receita,
    documento(NR_CPF_CNPJ_DOADOR) AS doc_doador, nulo(NM_DOADOR_RFB) AS nm_doador,
    cnae5(CD_CNAE_DOADOR) AS cnae_doador,
    categoria(DS_FONTE_RECEITA) AS ds_fonte, categoria(DS_ORIGEM_RECEITA) AS ds_origem
FROM org_nova;

-- Despesa contratada de candidatos (a paga vem em parcelas e sem fornecedor).
CREATE OR REPLACE TEMP TABLE stg_despesa AS
WITH
antiga AS (
    SELECT 2014 AS ano, "Sequencial Candidato", "Data da despesa", "Valor despesa",
           "Descriçao da despesa", "CPF/CNPJ do fornecedor", "Nome do fornecedor (Receita Federal)",
           "Cod setor econômico do fornecedor", "Tipo despesa"
    FROM read_csv('dados/raw/prestacao_contas/2014/*/despesas_candidatos_2014_brasil.txt',
                  delim = ';', quote = '"', header = true, encoding = 'cp1252', all_varchar = true,
                  escape = '"', strict_mode = false, ignore_errors = true)
    UNION ALL
    SELECT 2016, "Sequencial Candidato", "Data da despesa", "Valor despesa",
           "Descriçao da despesa", "CPF/CNPJ do fornecedor", "Nome do fornecedor (Receita Federal)",
           "Cod setor econômico do fornecedor", "Tipo despesa"
    FROM read_csv('dados/raw/prestacao_contas/2016/*/despesas_candidatos_prestacao_contas_final_2016_brasil.txt',
                  delim = ';', quote = '"', header = true, encoding = 'cp1252', all_varchar = true,
                  escape = '"', strict_mode = false, ignore_errors = true)
),
nova AS (
    -- ignore_errors: uma linha malformada do arquivo de 2020 derruba o DuckDB 1.5
    -- com erro interno ("index 51 within vector of size 11"); sem ela, 1 de 4,1 mi
    -- linhas fica de fora.
    SELECT * FROM read_csv('dados/raw/prestacao_contas/20*/prestacao_contas_candidatos_????/despesas_contratadas_candidatos_????_BRASIL.csv',
                           delim = ';', quote = '"', header = true, encoding = 'cp1252',
                           all_varchar = true, union_by_name = true, ignore_errors = true)
    WHERE ordinaria(CD_TIPO_ELEICAO, AA_ELEICAO)
    QUALIFY prioridade_entrega(TP_PRESTACAO_CONTAS)
          = min(prioridade_entrega(TP_PRESTACAO_CONTAS)) OVER (PARTITION BY AA_ELEICAO, SQ_CANDIDATO)
)
SELECT
    ano,
    TRY_CAST("Sequencial Candidato" AS BIGINT)            AS sq_candidato,
    data_br("Data da despesa")                            AS dt_despesa,
    valor_br("Valor despesa")                             AS vr_despesa,
    nulo("Descriçao da despesa")                          AS ds_despesa,
    documento("CPF/CNPJ do fornecedor")                   AS doc_fornecedor,
    nulo("Nome do fornecedor (Receita Federal)")          AS nm_fornecedor,
    cnae5("Cod setor econômico do fornecedor")            AS cnae_fornecedor,
    -- sem o prefixo que até 2016 duplicava quase toda categoria (03_tipo_despesa.sql)
    regexp_replace(categoria("Tipo despesa"), '^BAIXA DE ESTIMAVEIS - ', '') AS ds_tipo_despesa
FROM antiga
UNION ALL
SELECT
    AA_ELEICAO::INTEGER, TRY_CAST(SQ_CANDIDATO AS BIGINT),
    data_br(DT_DESPESA), valor_br(VR_DESPESA_CONTRATADA), nulo(DS_DESPESA),
    documento(NR_CPF_CNPJ_FORNECEDOR), nulo(NM_FORNECEDOR_RFB), cnae5(CD_CNAE_FORNECEDOR),
    regexp_replace(categoria(DS_ORIGEM_DESPESA), '^BAIXA DE ESTIMAVEIS - ', '')
FROM nova;

-- ===========================================================================
-- 4.1 Território e socioeconômico
-- ===========================================================================

CREATE OR REPLACE TEMP TABLE stg_municipio AS
SELECT
    CD_MUNICIPIO_IBGE::INTEGER AS cod_ibge, CD_MUNICIPIO_TSE AS cod_tse,
    NM_MUNICIPIO_IBGE AS nm_municipio, SG_UF AS sg_uf,
    CD_UF_IBGE::INTEGER AS cd_uf_ibge, NM_UF AS nm_uf
FROM read_csv('dados/raw/extras/municipio_tse_ibge/municipio_tse_ibge.csv',
              delim = ';', quote = '"', header = true, encoding = 'cp1252', all_varchar = true)
WHERE SG_UF NOT IN ('ZZ', 'BR');

INSERT INTO modelo.uf
SELECT m.sg_uf, any_value(m.cd_uf_ibge), any_value(m.nm_uf),
       (SELECT any_value(p.nm_regiao) FROM stg_pib p WHERE p.sg_uf = m.sg_uf)
FROM stg_municipio m
GROUP BY m.sg_uf;

-- Regiões geográficas: da linha mais recente da planilha do PIB.
INSERT INTO modelo.municipio
SELECT m.cod_ibge, m.cod_tse, m.nm_municipio,
       p.cd_regiao_imediata, p.nm_regiao_imediata, p.cd_regiao_intermediaria, m.sg_uf
FROM stg_municipio m
LEFT JOIN (SELECT * FROM stg_pib QUALIFY row_number() OVER (PARTITION BY cod_ibge ORDER BY ano DESC) = 1) p
       USING (cod_ibge);

-- População: estimativa anual (6579) ou, em 2022, a soma das faixas do Censo (9606).
INSERT INTO modelo.municipio_ano
WITH pop AS (
    SELECT D1C::INTEGER AS cod_ibge, D3N::INTEGER AS ano,
           TRY_CAST(V AS BIGINT) AS qt_populacao, 'SIDRA 6579' AS ds_fonte_populacao
    FROM sidra('dados/raw/ibge/sidra/6579_populacao_municipios.json')
    UNION ALL
    SELECT D1C::INTEGER, D3N::INTEGER, sum(TRY_CAST(V AS BIGINT)), 'SIDRA 9606'
    FROM sidra('dados/raw/ibge/sidra/9606_populacao_idade_municipios.json')
    GROUP BY 1, 2
)
SELECT cod_ibge, ano, pop.qt_populacao,
       CASE WHEN pop.qt_populacao IS NOT NULL THEN pop.ds_fonte_populacao END,
       pib.vr_pib_mil, pib.vr_pib_per_capita
FROM pop
FULL JOIN (SELECT cod_ibge, ano, vr_pib_mil, vr_pib_per_capita FROM stg_pib) pib USING (cod_ibge, ano)
WHERE cod_ibge IN (SELECT cod_ibge FROM modelo.municipio);

INSERT INTO modelo.municipio_censo
WITH renda AS (
    SELECT D1C::INTEGER AS cod_ibge, D3N::INTEGER AS ano_censo,
           max(TRY_CAST(V AS DECIMAL(10, 2))) FILTER (WHERE D2C = '13431') AS vr_renda_media_pc,
           max(TRY_CAST(V AS DECIMAL(10, 2))) FILTER (WHERE D2C = '13534') AS vr_renda_mediana_pc
    FROM sidra('dados/raw/ibge/sidra/10295_renda_domiciliar_municipios.json')
    GROUP BY 1, 2
),
estudo AS (
    SELECT D1C::INTEGER AS cod_ibge, D3N::INTEGER AS ano_censo,
           TRY_CAST(V AS DECIMAL(4, 1)) AS nr_anos_estudo
    FROM sidra('dados/raw/ibge/sidra/10062_anos_estudo_municipios.json')
)
SELECT cod_ibge, ano_censo, vr_renda_media_pc, vr_renda_mediana_pc, nr_anos_estudo
FROM renda FULL JOIN estudo USING (cod_ibge, ano_censo)
WHERE cod_ibge IN (SELECT cod_ibge FROM modelo.municipio);

-- Os quatro níveis do Censo; a categoria Total (120704) não é nível.
INSERT INTO modelo.nivel_instrucao
SELECT CASE D4N
           WHEN 'Sem instrução e fundamental incompleto'  THEN 1
           WHEN 'Fundamental completo e médio incompleto' THEN 2
           WHEN 'Médio completo e superior incompleto'    THEN 3
           WHEN 'Superior completo'                       THEN 4
       END AS cd_nivel,
       D4N, D4C::INTEGER, cd_nivel
FROM (SELECT DISTINCT D4C, D4N FROM sidra('dados/raw/ibge/sidra/10061_instrucao_municipios.json'))
WHERE D4C <> '120704';

-- Grau do TSE com o nível censitário equivalente (de-para da Q4). A descrição
-- vem do ano mais recente, porque a grafia muda entre anos.
INSERT INTO modelo.grau_instrucao
SELECT cd_grau_instrucao,
       arg_max(ds_grau_instrucao, ano),
       CASE WHEN cd_grau_instrucao IN (1, 2, 3) THEN 1
            WHEN cd_grau_instrucao IN (4, 5)    THEN 2
            WHEN cd_grau_instrucao IN (6, 7)    THEN 3
            WHEN cd_grau_instrucao = 8          THEN 4 END
FROM stg_cand
WHERE cd_grau_instrucao IS NOT NULL
GROUP BY cd_grau_instrucao;

INSERT INTO modelo.censo_instrucao
SELECT D1C::INTEGER, n.cd_nivel, D3N::INTEGER, TRY_CAST(V AS BIGINT)
FROM sidra('dados/raw/ibge/sidra/10061_instrucao_municipios.json') s
JOIN modelo.nivel_instrucao n ON n.cd_categoria_sidra = s.D4C::INTEGER
WHERE D1C::INTEGER IN (SELECT cod_ibge FROM modelo.municipio);

CREATE OR REPLACE TEMP TABLE stg_perfil AS
SELECT
    ANO_ELEICAO::INTEGER AS ano, NR_TURNO::INTEGER AS nr_turno,
    lpad(CD_MUNICIPIO, 5, '0') AS cod_tse,
    CD_FAIXA_ETARIA AS cd_faixa, DS_FAIXA_ETARIA AS ds_faixa, DS_GENERO AS ds_genero,
    sum(QT_APTOS::BIGINT) AS qt_aptos,
    sum(QT_COMPARECIMENTO::BIGINT) AS qt_comparecimento,
    sum(QT_ABSTENCAO::BIGINT) AS qt_abstencao
FROM read_csv('dados/raw/abstencao/*/comparecimento_abstencao_*/perfil_comparecimento_abstencao_*_PI.csv',
              delim = ';', quote = '"', header = true, encoding = 'cp1252',
              all_varchar = true, union_by_name = true)
GROUP BY ALL;

-- Faixas das duas fontes. Idades saem do rótulo ('21 a 24 anos', '16 anos',
-- '100 anos ou mais'); a faixa '-3' (inválido) fica sem idade.
INSERT INTO modelo.faixa_etaria
WITH faixas AS (
    SELECT DISTINCT 'TSE' AS ds_origem, cd_faixa AS cd_origem, ds_faixa FROM stg_perfil
    UNION
    SELECT DISTINCT 'IBGE', D6C, D6N FROM sidra('dados/raw/ibge/sidra/9606_populacao_idade_municipios.json')
),
idades AS (
    SELECT *,
        TRY_CAST(regexp_extract(ds_faixa, '^(\d+)', 1) AS INTEGER) AS nr_idade_min,
        CASE WHEN ds_faixa LIKE '%ou mais%' THEN NULL
             ELSE TRY_CAST(coalesce(nullif(regexp_extract(ds_faixa, ' a (\d+)', 1), ''),
                                    regexp_extract(ds_faixa, '^(\d+)', 1)) AS INTEGER) END AS nr_idade_max
    FROM faixas
)
SELECT row_number() OVER (ORDER BY ds_origem DESC, nr_idade_min NULLS FIRST),
       ds_origem, cd_origem, ds_faixa, nr_idade_min, nr_idade_max,
       -- jovem = 15 a 29 anos (R10)
       CASE WHEN nr_idade_min IS NOT NULL THEN nr_idade_min >= 15 AND coalesce(nr_idade_max, 999) <= 29 END
FROM idades;

INSERT INTO modelo.censo_faixa_etaria
SELECT D1C::INTEGER, f.id_faixa, D3N::INTEGER, TRY_CAST(V AS BIGINT)
FROM sidra('dados/raw/ibge/sidra/9606_populacao_idade_municipios.json') s
JOIN modelo.faixa_etaria f ON f.ds_origem = 'IBGE' AND f.cd_origem = s.D6C
WHERE D1C::INTEGER IN (SELECT cod_ibge FROM modelo.municipio);

INSERT INTO modelo.comparecimento_perfil
SELECT m.cod_ibge, f.id_faixa, p.ano, p.nr_turno, p.ds_genero,
       sum(p.qt_aptos), sum(p.qt_comparecimento), sum(p.qt_abstencao)
FROM stg_perfil p
JOIN modelo.municipio m ON m.cod_tse = p.cod_tse
JOIN modelo.faixa_etaria f ON f.ds_origem = 'TSE' AND f.cd_origem = p.cd_faixa
GROUP BY ALL;

-- ===========================================================================
-- 4.4 Partidos
-- ===========================================================================

-- Base no consulta_cand; a votação de legenda e os órgãos partidários acrescentam
-- partidos sem candidatura naquele ano, para as FKs deles fecharem.
INSERT INTO modelo.partido
SELECT ano, nr_partido,
       arg_min(sg_partido, prioridade), arg_min(nm_partido, prioridade)
FROM (
    SELECT ano, nr_partido, sg_partido, nm_partido, 1 AS prioridade FROM stg_cand
    UNION ALL
    SELECT ano, nr_partido, sg_partido, nm_partido, 2 FROM stg_vpart
    UNION ALL
    SELECT r.ano, r.nr_partido_orgao, r.sg_partido_orgao, NULL, 3
    FROM stg_receita r WHERE r.nr_partido_orgao IS NOT NULL
)
WHERE nr_partido IS NOT NULL AND sg_partido IS NOT NULL
GROUP BY ano, nr_partido;

-- Só o consulta_cand de 2022+ traz federação; -1 (sem federação) já virou NULL.
INSERT INTO modelo.federacao
SELECT ano, nr_federacao, arg_max(sg_federacao, cnt), arg_max(ds_composicao_federacao, cnt)
FROM (SELECT ano, nr_federacao, sg_federacao, ds_composicao_federacao, count(*) AS cnt
      FROM stg_cand WHERE nr_federacao > 0 GROUP BY ALL)
GROUP BY ano, nr_federacao;

INSERT INTO modelo.partido_federacao
SELECT DISTINCT ano, nr_partido, nr_federacao
FROM stg_cand WHERE nr_federacao > 0;

-- Um órgão por sequencial de prestador. Em 2014–2016 o arquivo só traz a sigla do
-- partido, e o número sai de PARTIDO (ano, sg_partido).
INSERT INTO modelo.orgao_partidario
SELECT
    r.id_orgao,
    arg_max(r.tp_orgao, r.ano),
    arg_max(CASE WHEN upper(r.ds_esfera) LIKE '%NACIONAL%'  THEN 'Nacional'
                 WHEN upper(r.ds_esfera) LIKE '%ESTADUAL%'  THEN 'Estadual'
                 WHEN upper(r.ds_esfera) LIKE '%MUNICIPAL%' THEN 'Municipal' END, r.ano),
    arg_max(nullif(r.sg_uf_orgao, 'BR'), r.ano),
    arg_max(r.nr_cnpj_orgao, r.ano),
    max(r.ano),
    arg_max(coalesce(r.nr_partido_orgao, p.nr_partido), r.ano)
FROM stg_receita r
LEFT JOIN modelo.partido p
       ON p.ano = r.ano AND r.nr_partido_orgao IS NULL
      AND upper(replace(p.sg_partido, ' ', '')) = upper(replace(r.sg_partido_orgao, ' ', ''))
WHERE r.id_orgao IS NOT NULL
GROUP BY r.id_orgao
HAVING arg_max(coalesce(r.nr_partido_orgao, p.nr_partido), r.ano) IS NOT NULL;

-- ===========================================================================
-- 4.2 Eleição e candidatura
-- ===========================================================================

INSERT INTO modelo.eleicao
SELECT cd_eleicao,
       arg_min(ano, prioridade), arg_min(nr_turno, prioridade), arg_min(dt_eleicao, prioridade),
       'ORDINARIA', arg_min(tp_abrangencia, prioridade)
FROM (
    SELECT cd_eleicao, ano, nr_turno, dt_eleicao, tp_abrangencia, 1 AS prioridade FROM stg_cand
    UNION ALL SELECT cd_eleicao, ano, nr_turno, dt_eleicao, tp_abrangencia, 2 FROM stg_vcand
    UNION ALL SELECT cd_eleicao, ano, nr_turno, dt_eleicao, tp_abrangencia, 2 FROM stg_vpart
    UNION ALL SELECT cd_eleicao, ano, nr_turno, dt_eleicao, tp_abrangencia, 2 FROM stg_detalhe
)
GROUP BY cd_eleicao;

INSERT INTO modelo.cargo
SELECT cd_cargo, arg_min(ds_cargo, prioridade)
FROM (
    SELECT cd_cargo, ds_cargo, 1 AS prioridade FROM stg_cand
    UNION ALL SELECT cd_cargo, ds_cargo, 2 FROM stg_vagas
    UNION ALL SELECT cd_cargo, ds_cargo, 2 FROM stg_vcand
    UNION ALL SELECT cd_cargo, ds_cargo, 2 FROM stg_vpart
    UNION ALL SELECT cd_cargo, ds_cargo, 2 FROM stg_detalhe
)
WHERE ds_cargo IS NOT NULL
GROUP BY cd_cargo;

-- Uma linha por candidatura (não por turno): eleição do 1º turno, resultado do último.
CREATE OR REPLACE TEMP TABLE stg_candidatura AS
SELECT
    row_number() OVER (ORDER BY ano, sg_ue, cd_cargo, sq_candidato) AS id_candidatura,
    *
FROM (
    SELECT
        ano, sg_ue, cd_cargo, sq_candidato,
        arg_min(cd_eleicao, nr_turno)          AS cd_eleicao,
        arg_min(dt_eleicao, nr_turno)          AS dt_eleicao,
        arg_min(tp_abrangencia, nr_turno)      AS tp_abrangencia,
        arg_max(ds_sit_tot_turno, nr_turno)    AS ds_sit_tot_turno,
        arg_max(nr_titulo_eleitoral, nr_turno) AS nr_titulo_eleitoral,
        arg_max(nm_candidato, nr_turno)        AS nm_candidato,
        arg_max(dt_nascimento, nr_turno)       AS dt_nascimento,
        arg_max(sg_uf_nascimento, nr_turno)    AS sg_uf_nascimento,
        arg_max(ds_genero, nr_turno)           AS ds_genero,
        arg_max(ds_cor_raca, nr_turno)         AS ds_cor_raca,
        arg_max(ds_ocupacao, nr_turno)         AS ds_ocupacao,
        arg_max(cd_grau_instrucao, nr_turno)   AS cd_grau_instrucao,
        arg_max(nr_partido, nr_turno)          AS nr_partido
    FROM stg_cand
    GROUP BY ano, sg_ue, cd_cargo, sq_candidato
);

-- Atributos estáveis da pessoa vêm da candidatura mais recente.
INSERT INTO modelo.politico
SELECT nr_titulo_eleitoral, nm_candidato, dt_nascimento, sg_uf_nascimento
FROM stg_candidatura
WHERE nr_titulo_eleitoral IS NOT NULL
QUALIFY row_number() OVER (PARTITION BY nr_titulo_eleitoral ORDER BY ano DESC, id_candidatura DESC) = 1;

INSERT INTO modelo.candidatura
SELECT
    c.id_candidatura, c.ano, c.sg_ue, c.sq_candidato, c.ds_genero, c.ds_cor_raca,
    c.ds_ocupacao, c.ds_sit_tot_turno,
    -- 'MEDIA' é o nome antigo de 'ELEITO POR MEDIA'; '2º TURNO' não é eleito.
    coalesce(upper(strip_accents(c.ds_sit_tot_turno)) IN
             ('ELEITO', 'ELEITO POR QP', 'ELEITO POR MEDIA', 'MEDIA'), false),
    date_sub('year', c.dt_nascimento, c.dt_eleicao),
    c.cd_eleicao, c.cd_cargo, c.nr_partido, c.nr_titulo_eleitoral, c.cd_grau_instrucao,
    m.cod_ibge
FROM stg_candidatura c
LEFT JOIN modelo.municipio m ON c.tp_abrangencia = 'MUNICIPAL' AND m.cod_tse = c.sg_ue;

-- Bens ligam pela UK (ano, sg_ue, sq_candidato), sem cargo no arquivo.
INSERT INTO modelo.bem_candidato
SELECT c.id_candidatura, b.nr_ordem, any_value(b.ds_tipo_bem), sum(b.vr_bem)
FROM (
    SELECT ANO_ELEICAO::INTEGER AS ano, SG_UE AS sg_ue, SQ_CANDIDATO::BIGINT AS sq_candidato,
           coalesce(TRY_CAST(NR_ORDEM_BEM_CANDIDATO AS INTEGER),
                    TRY_CAST(NR_ORDEM_CANDIDATO AS INTEGER)) AS nr_ordem,
           nulo(DS_TIPO_BEM_CANDIDATO) AS ds_tipo_bem, valor_br(VR_BEM_CANDIDATO) AS vr_bem
    FROM read_csv('dados/raw/candidatos/*/bens_candidato_*/bem_candidato_*_BRASIL.csv',
                  delim = ';', quote = '"', header = true, encoding = 'cp1252',
                  all_varchar = true, union_by_name = true)
    WHERE ordinaria(CD_TIPO_ELEICAO, ANO_ELEICAO)
) b
JOIN stg_candidatura c USING (ano, sg_ue, sq_candidato)
WHERE b.nr_ordem IS NOT NULL AND b.vr_bem IS NOT NULL AND b.ds_tipo_bem IS NOT NULL
GROUP BY c.id_candidatura, b.nr_ordem;

-- VAGA não traz turno nem abrangência: vêm da eleição, que já veio de outra fonte.
INSERT INTO modelo.vaga
SELECT v.cd_eleicao, v.cd_cargo, v.sg_ue, any_value(v.qt_vaga),
       any_value(m.cod_ibge)
FROM stg_vagas v
JOIN modelo.eleicao e USING (cd_eleicao)
LEFT JOIN modelo.municipio m ON e.tp_abrangencia = 'MUNICIPAL' AND m.cod_tse = v.sg_ue
WHERE v.qt_vaga > 0
GROUP BY v.cd_eleicao, v.cd_cargo, v.sg_ue;

-- ===========================================================================
-- 4.3 Votação
-- ===========================================================================

INSERT INTO modelo.votacao_candidato_municipio
SELECT c.id_candidatura, m.cod_ibge, v.nr_turno,
       sum(v.qt_votos_nominais), sum(v.qt_votos_nominais_validos)
FROM stg_vcand v
JOIN stg_candidatura c USING (ano, sg_ue, cd_cargo, sq_candidato)
JOIN modelo.municipio m ON m.cod_tse = v.cod_tse
GROUP BY ALL;

INSERT INTO modelo.votacao_legenda_municipio
SELECT v.cd_eleicao, m.cod_ibge, v.cd_cargo, v.ano, v.nr_partido, v.sq_coligacao,
       sum(v.qt_votos_legenda_validos), sum(v.qt_total_votos_leg_validos)
FROM stg_vpart v
JOIN modelo.municipio m ON m.cod_tse = v.cod_tse
GROUP BY ALL;

INSERT INTO modelo.comparecimento_municipio
SELECT d.cd_eleicao, d.cd_cargo, m.cod_ibge,
       sum(d.qt_aptos), sum(d.qt_comparecimento), sum(d.qt_abstencoes),
       sum(d.qt_votos_brancos), sum(d.qt_total_votos_nulos)
FROM stg_detalhe d
JOIN modelo.municipio m ON m.cod_tse = d.cod_tse
GROUP BY ALL;

-- ===========================================================================
-- 4.5 Finanças de campanha
-- ===========================================================================

-- Candidatura da prestação: (ano, sq_candidato), único de 2014 em diante. Linhas
-- de candidatura que não está no modelo (suplementar) ficam fora.
CREATE OR REPLACE TEMP TABLE stg_cand_prestacao AS
SELECT ano, sq_candidato, id_candidatura FROM stg_candidatura WHERE ano >= 2014;

DELETE FROM stg_receita r
WHERE (r.sq_candidato IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM stg_cand_prestacao c
                       WHERE c.ano = r.ano AND c.sq_candidato = r.sq_candidato))
   OR (r.id_orgao IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM modelo.orgao_partidario o WHERE o.id_orgao = r.id_orgao))
   OR (r.sq_candidato IS NULL AND r.id_orgao IS NULL)
   OR r.vr_receita IS NULL;

DELETE FROM stg_despesa d
WHERE NOT EXISTS (SELECT 1 FROM stg_cand_prestacao c
                  WHERE c.ano = d.ano AND c.sq_candidato = d.sq_candidato)
   OR d.vr_despesa IS NULL;

-- Um agente por CPF/CNPJ, nos três papéis. Nome: o da Receita Federal mais
-- recente. CNAE: o mais frequente (só PJ). Tipo (R9): CNPJ com CNAE de
-- organização política não é empresa.
INSERT INTO modelo.agente_financeiro
WITH papeis AS (
    SELECT doc_doador AS doc, nm_doador AS nm, cnae_doador AS cnae, NULL AS setor, ano FROM stg_receita
    UNION ALL
    SELECT doc_originario, nm_originario, NULL, setor_originario, ano FROM stg_receita
    UNION ALL
    SELECT doc_fornecedor, nm_fornecedor, cnae_fornecedor, NULL, ano FROM stg_despesa
)
SELECT
    row_number() OVER (ORDER BY doc) AS id_agente,
    doc,
    nm,
    CASE WHEN length(doc) = 14 THEN cnae END,
    CASE WHEN length(doc) = 11 THEN 'PF'
         WHEN cnae = '94928' OR fl_org_politica THEN 'ORG_POLITICA'
         ELSE 'EMPRESA' END
FROM (
    SELECT doc,
           arg_max(nm, ano) FILTER (WHERE nm IS NOT NULL) AS nm,
           mode(cnae) AS cnae,
           bool_or(setor = 'ATIVIDADES DE ORGANIZACOES POLITICAS') AS fl_org_politica
    FROM papeis
    WHERE doc IS NOT NULL
    GROUP BY doc
);

-- Classificação público × privado (docs/der/q10-publico-privado.md), sobre os
-- pares fonte × origem que existem nos arquivos.
INSERT INTO modelo.fonte_recurso
SELECT
    row_number() OVER (ORDER BY ds_fonte NULLS FIRST, ds_origem NULLS FIRST),
    ds_fonte, ds_origem,
    CASE
        WHEN ds_fonte IN ('FUNDO ESPECIAL', 'FUNDO PARTIDARIO')                THEN 'PUBLICO'
        WHEN ds_origem = 'RECURSOS PROPRIOS'                                   THEN 'PROPRIO'
        WHEN ds_origem IN ('RECURSOS DE PESSOAS FISICAS', 'RECURSOS DE PESSOAS JURIDICAS',
                           'RECURSOS DE FINANCIAMENTO COLETIVO', 'DOACOES PELA INTERNET')
                                                                               THEN 'PRIVADO'
        WHEN ds_origem = 'RECURSOS DE PARTIDO POLITICO'                        THEN 'PARTIDARIO'
        WHEN ds_origem IN ('RECURSOS DE OUTROS CANDIDATOS',
                           'RECURSOS DE OUTROS CANDIDATOS/COMITES')            THEN 'TRANSFERENCIA'
        WHEN ds_origem = 'RENDIMENTOS DE APLICACOES FINANCEIRAS'               THEN 'RENDIMENTO'
        ELSE 'NAO IDENTIFICADO'
    END
FROM (SELECT DISTINCT ds_fonte, ds_origem FROM stg_receita);

-- Canal de propaganda (docs/der/q11-propaganda.md).
INSERT INTO modelo.tipo_despesa
SELECT
    row_number() OVER (ORDER BY ds_tipo_despesa),
    ds_tipo_despesa, canal, canal IS NOT NULL
FROM (
    SELECT DISTINCT ds_tipo_despesa,
        CASE ds_tipo_despesa
            WHEN 'PUBLICIDADE POR MATERIAIS IMPRESSOS'                 THEN 'IMPRESSO'
            WHEN 'PUBLICIDADE POR ADESIVOS'                            THEN 'ADESIVO'
            WHEN 'PUBLICIDADE POR PLACAS, ESTANDARTES E FAIXAS'        THEN 'PLACA E FAIXA'
            WHEN 'PRODUCAO DE PROGRAMAS DE RADIO, TELEVISAO OU VIDEO'  THEN 'RADIO E TV'
            WHEN 'PRODUCAO DE JINGLES, VINHETAS E SLOGANS'             THEN 'JINGLE'
            WHEN 'PUBLICIDADE POR CARROS DE SOM'                       THEN 'CARRO DE SOM'
            WHEN 'PUBLICIDADE POR JORNAIS E REVISTAS'                  THEN 'JORNAL E REVISTA'
            WHEN 'PUBLICIDADE POR TELEMARKETING'                       THEN 'TELEMARKETING'
            WHEN 'DESPESA COM IMPULSIONAMENTO DE CONTEUDOS'            THEN 'DIGITAL'
            WHEN 'CRIACAO E INCLUSAO DE PAGINAS NA INTERNET'           THEN 'DIGITAL'
            WHEN 'ATIVIDADES DE MILITANCIA E MOBILIZACAO DE RUA'       THEN 'RUA'
            WHEN 'COMICIOS'                                            THEN 'RUA'
            WHEN 'EVENTOS DE PROMOCAO DA CANDIDATURA'                  THEN 'RUA'
        END AS canal
    FROM stg_despesa
    WHERE ds_tipo_despesa IS NOT NULL
);

INSERT INTO modelo.receita_campanha
SELECT
    row_number() OVER () AS id_receita,
    r.dt_receita, r.vr_receita, c.id_candidatura, r.id_orgao,
    ad.id_agente, ao.id_agente,
    f.id_fonte_recurso
FROM stg_receita r
LEFT JOIN stg_cand_prestacao c ON c.ano = r.ano AND c.sq_candidato = r.sq_candidato
LEFT JOIN modelo.agente_financeiro ad ON ad.nr_cpf_cnpj = r.doc_doador
LEFT JOIN modelo.agente_financeiro ao ON ao.nr_cpf_cnpj = r.doc_originario
JOIN modelo.fonte_recurso f
  ON f.ds_fonte_receita IS NOT DISTINCT FROM r.ds_fonte
 AND f.ds_origem_receita IS NOT DISTINCT FROM r.ds_origem;

INSERT INTO modelo.despesa_campanha
SELECT
    row_number() OVER () AS id_despesa,
    d.dt_despesa, d.vr_despesa, d.ds_despesa, c.id_candidatura, a.id_agente, t.id_tipo_despesa
FROM stg_despesa d
JOIN stg_cand_prestacao c ON c.ano = d.ano AND c.sq_candidato = d.sq_candidato
LEFT JOIN modelo.agente_financeiro a ON a.nr_cpf_cnpj = d.doc_fornecedor
JOIN modelo.tipo_despesa t ON t.ds_tipo_despesa = d.ds_tipo_despesa;
