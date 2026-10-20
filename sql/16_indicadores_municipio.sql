-- 16_indicadores_municipio.sql — indicadores dos municípios (base da Q3 e das regiões da Q7).
--
-- Carrega as tabelas do DER que estavam vazias:
--   MUNICIPIO_ANO            PIB e PIB per capita (IBGE, PIB dos Municípios 2010–2023) e
--                            população estimada nos anos de eleição (SIDRA 6579: 2018, 2020, 2024)
--   MUNICIPIO_CENSO          renda domiciliar per capita média e mediana (SIDRA 10295) e anos
--                            de estudo (SIDRA 10062), Censo 2022: substituem o IDHM municipal,
--                            que só existe até o Censo 2010 (Atlas Brasil, sem coletor)
--   COMPARECIMENTO_MUNICIPIO aptos, comparecimento, abstenções, brancos e nulos por eleição
--                            (turno) e cargo (TSE, detalhe_votacao_munzona, somado por município)
-- e preenche em MUNICIPIO a região geográfica imediata e intermediária, que só a
-- planilha do PIB traz (o 06_carga_nucleo deixa essas colunas vazias).
--
-- Rodar da RAIZ do repositório, depois do 06_carga_nucleo (rodar este de novo depois dele):
--
--     uv run python -m scripts.coleta.coleta_ibge pib indicadores
--     uv run python -m scripts.coleta.coleta_tse recorte_remoto --uf AM,GO,MA,MT,RS,SE
--     uv run python scripts/carregar_staging.py 16_indicadores

INSTALL excel;
LOAD excel;
INSTALL encodings;
LOAD encodings;

-- ---------------------------------------------------------------------------
-- Planilha do PIB dos Municípios (IBGE), um registro por município e ano
-- ---------------------------------------------------------------------------
-- Os nomes das colunas da planilha têm quebras de linha; por isso a letra da coluna no
-- Excel (sem cabeçalho, a partir da linha 2), conferida na edição 2010–2023.
CREATE OR REPLACE TABLE stg_pib_municipio AS
SELECT
    a::integer AS ano,                             -- A: Ano
    g::integer AS cod_ibge,                        -- G: Código do Município
    n::integer AS cd_regiao_imediata,              -- N: Código da Região Geográfica Imediata
    o AS nm_regiao_imediata,                       -- O: Nome da Região Geográfica Imediata
    q::integer AS cd_regiao_intermediaria,         -- Q: Código da Região Geográfica Intermediária
    r AS nm_regiao_intermediaria,                  -- R: Nome da Região Geográfica Intermediária
    am::decimal(15, 3) AS vr_pib_mil,              -- AM: PIB a preços correntes (R$ 1.000)
    an::decimal(12, 2) AS vr_pib_per_capita,       -- AN: PIB per capita a preços correntes (R$ 1,00)
    ao AS ds_atividade_principal                   -- AO: Atividade com maior valor adicionado bruto
FROM
    read_xlsx(
        'dados/raw/ibge/pib_municipios/base_de_dados_2010_2023_xlsx/PIB dos Municípios - base de dados 2010-2023.xlsx',
        header = FALSE, all_varchar = TRUE, range = 'A2:AO100000'
    )
WHERE a IS NOT NULL;

-- população estimada (SIDRA 6579); a primeira linha do JSON repete o cabeçalho
CREATE OR REPLACE TEMP TABLE stg_populacao AS
SELECT
    try_cast(d1c AS integer) AS cod_ibge,
    try_cast(d3c AS integer) AS ano,
    try_cast(v AS bigint) AS qt_populacao
FROM read_json('dados/raw/ibge/sidra/6579_populacao_anos_eleicao.json', format = 'array')
WHERE try_cast(v AS bigint) IS NOT NULL AND try_cast(d1c AS integer) IS NOT NULL;

DELETE FROM modelo.municipio_ano;
DELETE FROM modelo.municipio_censo;
DELETE FROM modelo.comparecimento_municipio;

INSERT INTO modelo.municipio_ano
SELECT
    m.cod_ibge,
    coalesce(p.ano, s.ano) AS ano,
    s.qt_populacao,
    CASE WHEN s.qt_populacao IS NOT NULL THEN 'ESTIMATIVA IBGE' END AS ds_fonte_populacao,
    p.vr_pib_mil,
    p.vr_pib_per_capita
FROM stg_pib_municipio AS p
FULL OUTER JOIN stg_populacao AS s ON p.cod_ibge = s.cod_ibge AND p.ano = s.ano
INNER JOIN modelo.municipio AS m ON coalesce(p.cod_ibge, s.cod_ibge) = m.cod_ibge;

-- ---------------------------------------------------------------------------
-- Censo 2022: renda e anos de estudo
-- ---------------------------------------------------------------------------
INSERT INTO modelo.municipio_censo
WITH renda AS (
    SELECT
        try_cast(d1c AS integer) AS cod_ibge,
        max(try_cast(v AS decimal(10, 2))) FILTER (WHERE d2c = '13431') AS vr_renda_media_pc,
        max(try_cast(v AS decimal(10, 2))) FILTER (WHERE d2c = '13534') AS vr_renda_mediana_pc
    FROM read_json('dados/raw/ibge/sidra/10295_renda_domiciliar_municipios.json', format = 'array')
    WHERE try_cast(d1c AS integer) IS NOT NULL
    GROUP BY try_cast(d1c AS integer)
),

estudo AS (
    SELECT
        try_cast(d1c AS integer) AS cod_ibge,
        try_cast(v AS decimal(4, 1)) AS nr_anos_estudo
    FROM read_json('dados/raw/ibge/sidra/10062_anos_estudo_municipios.json', format = 'array')
    WHERE try_cast(d1c AS integer) IS NOT NULL
)

SELECT
    m.cod_ibge,
    2022 AS ano_censo,
    r.vr_renda_media_pc,
    r.vr_renda_mediana_pc,
    e.nr_anos_estudo
FROM modelo.municipio AS m
LEFT JOIN renda AS r ON m.cod_ibge = r.cod_ibge
LEFT JOIN estudo AS e ON m.cod_ibge = e.cod_ibge
WHERE r.cod_ibge IS NOT NULL OR e.cod_ibge IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Comparecimento por eleição (turno) e cargo: a "alienação" da Q3
-- ---------------------------------------------------------------------------
INSERT INTO modelo.comparecimento_municipio
SELECT
    d.cd_eleicao,
    d.cd_cargo,
    m.cod_ibge,
    sum(d.qt_aptos) AS qt_aptos,
    sum(d.qt_comparecimento) AS qt_comparecimento,
    sum(d.qt_abstencoes) AS qt_abstencoes,
    sum(d.qt_votos_brancos) AS qt_votos_brancos,
    sum(d.qt_total_votos_nulos) AS qt_total_votos_nulos
FROM (
    SELECT
        cd_eleicao::integer AS cd_eleicao,
        cd_cargo::integer AS cd_cargo,
        lpad(cd_municipio, 5, '0') AS cd_municipio,
        coalesce(try_cast(qt_aptos AS bigint), 0) AS qt_aptos,
        coalesce(try_cast(qt_comparecimento AS bigint), 0) AS qt_comparecimento,
        coalesce(try_cast(qt_abstencoes AS bigint), 0) AS qt_abstencoes,
        coalesce(try_cast(qt_votos_brancos AS bigint), 0) AS qt_votos_brancos,
        coalesce(try_cast(qt_total_votos_nulos AS bigint), 0) AS qt_total_votos_nulos
    FROM
        read_csv(
            'dados/raw/resultados/*/detalhe_votacao_munzona_[0-9]*/detalhe_votacao_munzona_[0-9]*_??.csv',
            delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
            all_varchar = TRUE, union_by_name = TRUE
        )
    WHERE cd_tipo_eleicao = '2'
) AS d
INNER JOIN modelo.municipio AS m ON d.cd_municipio = lpad(m.cod_tse, 5, '0')
INNER JOIN modelo.eleicao AS e ON d.cd_eleicao = e.cd_eleicao
INNER JOIN modelo.cargo AS c ON d.cd_cargo = c.cd_cargo
GROUP BY d.cd_eleicao, d.cd_cargo, m.cod_ibge;

-- ---------------------------------------------------------------------------
-- Regiões geográficas (IBGE, 2017) no MUNICIPIO, pela edição mais recente do PIB
-- ---------------------------------------------------------------------------
UPDATE modelo.municipio AS m
SET
    cd_regiao_imediata = p.cd_regiao_imediata,
    nm_regiao_imediata = p.nm_regiao_imediata,
    cd_regiao_intermediaria = p.cd_regiao_intermediaria
FROM (
    SELECT
        cod_ibge,
        arg_max(cd_regiao_imediata, ano) AS cd_regiao_imediata,
        arg_max(nm_regiao_imediata, ano) AS nm_regiao_imediata,
        arg_max(cd_regiao_intermediaria, ano) AS cd_regiao_intermediaria
    FROM stg_pib_municipio
    GROUP BY cod_ibge
) AS p
WHERE m.cod_ibge = p.cod_ibge;
