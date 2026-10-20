-- 19_faixa_etaria.sql — idade da população e do eleitorado por município (base da Q6).
--
-- Carrega as tabelas do DER que estavam vazias:
--   FAIXA_ETARIA          as faixas do IBGE (SIDRA 9606) e do TSE (perfil_comparecimento_abstencao),
--                         com a marca de jovem: 15 a 29 anos (Lei 12.852/2013, art. 1º; R10)
--   CENSO_FAIXA_ETARIA    população por faixa de idade e município, Censo 2022 (SIDRA 9606)
--   COMPARECIMENTO_PERFIL aptos, comparecimento e abstenção por faixa, município, turno e gênero
--                         (TSE, perfil_comparecimento_abstencao 2018–2024, somado por município)
--
-- Rodar da RAIZ do repositório, depois do 06_carga_nucleo (rodar este de novo depois dele):
--
--     uv run python -m scripts.coleta.coleta_ibge idade
--     uv run python -m scripts.coleta.coleta_tse recorte_remoto --uf AM,GO,MA,MT,RS,SE
--     uv run python scripts/carregar_staging.py 19_faixa

INSTALL encodings;
LOAD encodings;

-- ---------------------------------------------------------------------------
-- Staging: SIDRA 9606 e perfil do comparecimento do TSE
-- ---------------------------------------------------------------------------

-- a primeira linha do JSON repete o cabeçalho; ela some no TRY_CAST de D1C
CREATE OR REPLACE TEMP TABLE stg_censo_idade AS
SELECT
    try_cast(d1c AS integer) AS cod_ibge,
    try_cast(d3c AS integer) AS ano_censo,
    d6c AS cd_origem,
    d6n AS ds_faixa,
    try_cast(v AS bigint) AS qt_pessoas
FROM read_json('dados/raw/ibge/sidra/9606_populacao_idade_municipios.json', format = 'array')
WHERE try_cast(d1c AS integer) IS NOT NULL;

-- Uma linha por zona, gênero, estado civil, escolaridade… no arquivo; aqui já somada no grão
-- de COMPARECIMENTO_PERFIL. Lê os arquivos por UF, que é o que o recorte_remoto extrai.
CREATE OR REPLACE TEMP TABLE stg_perfil_comparecimento AS
SELECT
    ano_eleicao::integer AS ano,
    nr_turno::integer AS nr_turno,
    lpad(cd_municipio, 5, '0') AS cd_municipio,
    cd_faixa_etaria AS cd_origem,
    any_value(ds_faixa_etaria) AS ds_faixa,
    upper(ds_genero) AS ds_genero,
    sum(qt_aptos::bigint) AS qt_aptos,
    sum(qt_comparecimento::bigint) AS qt_comparecimento,
    sum(qt_abstencao::bigint) AS qt_abstencao
FROM
    read_csv(
        'dados/raw/abstencao/*/comparecimento_abstencao_[0-9]*/perfil_comparecimento_abstencao_[0-9]*_??.csv',
        delim = ';', quote = '"', header = TRUE, encoding = 'latin-1',
        all_varchar = TRUE, union_by_name = TRUE
    )
GROUP BY ALL;

-- ---------------------------------------------------------------------------
-- Esvazia o que este módulo carrega, das filhas para as mães
-- ---------------------------------------------------------------------------
DELETE FROM modelo.censo_faixa_etaria;
DELETE FROM modelo.comparecimento_perfil;
DELETE FROM modelo.faixa_etaria;

-- ---------------------------------------------------------------------------
-- FAIXA_ETARIA: IBGE de 1 a 21, TSE de 101 em diante, pela idade inicial
-- ---------------------------------------------------------------------------
-- TSE: o código junta as duas idades (2124 = 21 a 24); de 1600 a 2000 é uma idade só;
-- 9999 = 100 ou mais; -3 = inválido. IBGE: as idades saem do rótulo ("0 a 4 anos").
INSERT INTO modelo.faixa_etaria
WITH faixas AS (
    SELECT DISTINCT
        'IBGE' AS ds_origem,
        cd_origem,
        ds_faixa,
        regexp_extract(ds_faixa, '^(\d+)', 1)::integer AS nr_idade_min,
        try_cast(regexp_extract(ds_faixa, ' a (\d+) anos', 1) AS integer) AS nr_idade_max
    FROM stg_censo_idade
    UNION ALL
    SELECT DISTINCT
        'TSE' AS ds_origem,
        cd_origem,
        ds_faixa,
        CASE WHEN cd_origem = '9999' THEN 100 WHEN cd_origem <> '-3' THEN left(cd_origem, 2)::integer END
            AS nr_idade_min,
        CASE
            WHEN cd_origem IN ('9999', '-3') THEN NULL
            WHEN right(cd_origem, 2) = '00' THEN left(cd_origem, 2)::integer
            ELSE right(cd_origem, 2)::integer
        END AS nr_idade_max
    FROM stg_perfil_comparecimento
)

SELECT
    CASE ds_origem WHEN 'IBGE' THEN 0 ELSE 100 END
    + row_number() OVER (PARTITION BY ds_origem ORDER BY nr_idade_min NULLS FIRST) AS id_faixa,
    ds_origem,
    cd_origem,
    ds_faixa,
    nr_idade_min,
    nr_idade_max,
    CASE WHEN nr_idade_min IS NOT NULL THEN nr_idade_min >= 15 AND nr_idade_max <= 29 END AS fl_jovem
FROM faixas;

-- ---------------------------------------------------------------------------
-- CENSO_FAIXA_ETARIA e COMPARECIMENTO_PERFIL
-- ---------------------------------------------------------------------------
INSERT INTO modelo.censo_faixa_etaria
SELECT
    s.cod_ibge,
    f.id_faixa,
    s.ano_censo,
    s.qt_pessoas
FROM stg_censo_idade AS s
INNER JOIN modelo.faixa_etaria AS f ON f.ds_origem = 'IBGE' AND s.cd_origem = f.cd_origem
INNER JOIN modelo.municipio AS m ON s.cod_ibge = m.cod_ibge
WHERE s.qt_pessoas IS NOT NULL;

INSERT INTO modelo.comparecimento_perfil
SELECT
    m.cod_ibge,
    f.id_faixa,
    s.ano,
    s.nr_turno,
    s.ds_genero,
    s.qt_aptos,
    s.qt_comparecimento,
    s.qt_abstencao
FROM stg_perfil_comparecimento AS s
INNER JOIN modelo.municipio AS m ON s.cd_municipio = lpad(m.cod_tse, 5, '0')
INNER JOIN modelo.faixa_etaria AS f ON f.ds_origem = 'TSE' AND s.cd_origem = f.cd_origem;
