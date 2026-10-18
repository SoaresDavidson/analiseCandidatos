-- validacao/q3_indicadores.sql — checagens dos indicadores dos municípios (Q3).
--
-- Cada consulta deve voltar VAZIA, salvo as exceções conhecidas anotadas em V1, V2, V4, V5 e V7.
-- Fica fora de sql/*.sql de propósito: o carregar_staging.py não roda esta pasta.
-- Rodar no notebook ou no duckdb, depois de 00_modelo, 06_carga_nucleo e
-- 16_indicadores_municipio, com a coleta das 6 UFs (AM, GO, MA, MT, RS, SE).

-- V1. Cobertura: todo município das 6 UFs tem comparecimento de prefeito no 1º turno
--     de 2020 e de 2024 (a base dos "isentos" e dos eleitores por habitante).
--     EXCEÇÃO CONHECIDA: Boa Esperança do Norte (MT) em 2020: o município só foi
--     instalado na eleição de 2024.
WITH uf6 AS (
    SELECT DISTINCT m.sg_uf
    FROM modelo.comparecimento_municipio AS cm
    INNER JOIN modelo.municipio AS m ON cm.cod_ibge = m.cod_ibge
),

prefeito_t1 AS (
    SELECT
        cm.cod_ibge,
        e.ano
    FROM modelo.comparecimento_municipio AS cm
    INNER JOIN modelo.eleicao AS e ON cm.cd_eleicao = e.cd_eleicao
    INNER JOIN modelo.cargo AS c ON cm.cd_cargo = c.cd_cargo
    WHERE c.ds_cargo = 'PREFEITO' AND e.nr_turno = 1
),

anos AS (
    SELECT unnest([2020, 2024]) AS ano
)

SELECT
    'V1 município sem comparecimento' AS checagem,
    a.ano,
    m.sg_uf,
    m.nm_municipio
FROM modelo.municipio AS m
CROSS JOIN anos AS a
LEFT JOIN prefeito_t1 AS p ON m.cod_ibge = p.cod_ibge AND a.ano = p.ano
WHERE m.sg_uf IN (SELECT u.sg_uf FROM uf6 AS u) AND p.cod_ibge IS NULL;

-- V2. Aptos = comparecimento + abstenções, linha a linha (a soma por zona fecha).
--     EXCEÇÃO CONHECIDA: Manaus 2022 (5 linhas, os cargos dos dois turnos), 81 a menos:
--     uma seção não instalada na zona 68 (QT_ELEITORES_SECOES_NAO_INSTALADAS = 81),
--     cujos eleitores não contam como comparecimento nem como abstenção.
SELECT
    'V2 aptos não fecha' AS checagem,
    cd_eleicao,
    cd_cargo,
    cod_ibge,
    qt_aptos,
    qt_comparecimento + qt_abstencoes AS comparecimento_mais_abstencao
FROM modelo.comparecimento_municipio
WHERE qt_aptos <> qt_comparecimento + qt_abstencoes;

-- V3. Brancos + nulos cabem no comparecimento, e os isentos ficam entre 0% e 100%.
SELECT
    'V3 brancos e nulos' AS checagem,
    cd_eleicao,
    cd_cargo,
    cod_ibge,
    qt_comparecimento,
    qt_votos_brancos + qt_total_votos_nulos AS brancos_mais_nulos
FROM modelo.comparecimento_municipio
WHERE qt_votos_brancos + qt_total_votos_nulos > qt_comparecimento OR qt_aptos <= 0;

-- V4. PIB per capita de 2023 (o usado para a eleição de 2024) para toda cidade com voto.
--     EXCEÇÃO CONHECIDA: Boa Esperança do Norte (MT), instalada depois da série do PIB.
SELECT
    'V4 cidade sem PIB 2023' AS checagem,
    m.sg_uf,
    m.nm_municipio
FROM modelo.municipio AS m
LEFT JOIN modelo.municipio_ano AS a ON m.cod_ibge = a.cod_ibge AND a.ano = 2023
WHERE
    m.cod_ibge IN (SELECT cm.cod_ibge FROM modelo.comparecimento_municipio AS cm)
    AND a.vr_pib_per_capita IS NULL;

-- V5. População estimada de 2024 para toda cidade com voto (o denominador de
--     eleitores por habitante).
--     EXCEÇÃO CONHECIDA: Boa Esperança do Norte (MT), como em V4.
SELECT
    'V5 cidade sem população 2024' AS checagem,
    m.sg_uf,
    m.nm_municipio
FROM modelo.municipio AS m
LEFT JOIN modelo.municipio_ano AS a ON m.cod_ibge = a.cod_ibge AND a.ano = 2024
WHERE
    m.cod_ibge IN (SELECT cm.cod_ibge FROM modelo.comparecimento_municipio AS cm)
    AND a.qt_populacao IS NULL;

-- V6. 2º turno de prefeito só onde a lei permite: cidade com mais de 200 mil eleitores.
SELECT
    'V6 2º turno em cidade pequena' AS checagem,
    e.ano,
    m.nm_municipio,
    cm.qt_aptos
FROM modelo.comparecimento_municipio AS cm
INNER JOIN modelo.eleicao AS e ON cm.cd_eleicao = e.cd_eleicao
INNER JOIN modelo.cargo AS c ON cm.cd_cargo = c.cd_cargo
INNER JOIN modelo.municipio AS m ON cm.cod_ibge = m.cod_ibge
WHERE c.ds_cargo = 'PREFEITO' AND e.nr_turno = 2 AND cm.qt_aptos <= 200000;

-- V7. Mais eleitores aptos que habitantes estimados (prefeito, 1º turno, 2024).
--     EXCEÇÃO CONHECIDA, não é erro de carga: 230 cidades (GO 99, RS 89, SE 16, MA 15,
--     MT 11). 227 delas têm mais eleitores que a população CONTADA no Censo 2022, e
--     todas têm mais eleitores que moradores de 15 anos ou mais: é o cadastro eleitoral
--     (domicílio eleitoral por vínculo, Res. TSE 23.659/2021, art. 23), não a
--     estimativa de população. Ver docs/q3-q7-analise.md.
SELECT
    'V7 mais eleitores que habitantes' AS checagem,
    m.sg_uf,
    count(*) AS qt_cidades
FROM modelo.comparecimento_municipio AS cm
INNER JOIN modelo.eleicao AS e ON cm.cd_eleicao = e.cd_eleicao
INNER JOIN modelo.cargo AS c ON cm.cd_cargo = c.cd_cargo
INNER JOIN modelo.municipio AS m ON cm.cod_ibge = m.cod_ibge
INNER JOIN modelo.municipio_ano AS a ON cm.cod_ibge = a.cod_ibge AND e.ano = a.ano
WHERE c.ds_cargo = 'PREFEITO' AND e.nr_turno = 1 AND e.ano = 2024 AND cm.qt_aptos > a.qt_populacao
GROUP BY m.sg_uf;
