-- 17_q7_vies.sql — Q7: viés político de um município/região na linha do tempo (E.P. 2018–2024).
--
-- O viés é a nota média dos votos (0 = esquerda, 10 = direita), cada voto pesando a
-- nota do partido do candidato, no mesmo cargo em cada tipo de eleição:
--   eleições gerais (2018, 2022)   → deputado federal (proporcional, todos os partidos)
--   eleições municipais (2020, 2024) → vereador (idem)
-- 1º turno. Comparar só dentro do mesmo cargo: 2018 × 2022 e 2020 × 2024.
--
-- Duas réguas, porque os especialistas reavaliaram os partidos entre as rodadas
-- (o PL foi de 7,78 em 2018 para 8,80 em 2022):
--   vl_rodada     regra do grupo: 2018 e 2020 com a rodada de 2018, 2022 e 2024 com a de 2022
--   vl_fixa_2018  a rodada de 2018 para todos os anos: a mudança que sobra é só do eleitor
-- Rodada de 2018: Bolognesi, Ribeiro e Codato (2023), Dados 66(2), tabela 1, em
-- dados/referencia/espectro_bolognesi_2023_rodada2018.csv; de-para das siglas (renomeações
-- e fusões) em espectro_de_para_tse_2018.csv. Fusões levam a média dos partidos de origem,
-- a mesma regra dos autores (o União de 2018 no artigo de 2025 = média de DEM e PSL).
--
-- Rodar da RAIZ do repositório, depois do 13_ficha (votos), 15_espectro e 16_indicadores:
--
--     uv run python scripts/carregar_staging.py 17_q7

-- ---------------------------------------------------------------------------
-- Nota de cada sigla do TSE na rodada de 2018
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TABLE q7_nota_rodada2018 AS
SELECT
    d.sg_partido_tse,
    d.sigla_artigo,
    d.regra,
    (
        SELECT avg(e.media::double)
        FROM
            read_csv(
                'dados/referencia/espectro_bolognesi_2023_rodada2018.csv', delim = ';', all_varchar = TRUE
            ) AS e
        WHERE list_contains(string_split(d.sigla_artigo, '+'), e.sigla_artigo)
    ) AS vl_ideologia
FROM read_csv('dados/referencia/espectro_de_para_tse_2018.csv', delim = ';', all_varchar = TRUE) AS d;

-- ESPECTRO_PARTIDO para 2018 e 2020 (regra do grupo: rodada de 2018)
DELETE FROM modelo.espectro_partido
WHERE ano IN (2018, 2020);

INSERT INTO modelo.espectro_partido
SELECT
    p.ano,
    p.nr_partido,
    2018 AS nr_rodada,
    round(n.vl_ideologia, 2) AS vl_ideologia,
    CASE
        WHEN round(n.vl_ideologia, 2) <= 1.5 THEN 'EXTREMA ESQUERDA'
        WHEN round(n.vl_ideologia, 2) <= 3 THEN 'ESQUERDA'
        WHEN round(n.vl_ideologia, 2) < 4.5 THEN 'CENTRO-ESQUERDA'
        WHEN round(n.vl_ideologia, 2) <= 5.5 THEN 'CENTRO'
        WHEN round(n.vl_ideologia, 2) <= 7 THEN 'CENTRO-DIREITA'
        WHEN round(n.vl_ideologia, 2) <= 8.5 THEN 'DIREITA'
        ELSE 'EXTREMA DIREITA'
    END AS cd_espectro,
    'Bolognesi, Ribeiro e Codato (2023), Dados 66(2), rodada 2018'
    || CASE WHEN n.regra LIKE 'mesma%' OR n.regra LIKE 'sigla%' THEN '' ELSE ' — ' || n.regra END AS ds_fonte
FROM modelo.partido AS p
INNER JOIN q7_nota_rodada2018 AS n ON p.sg_partido = n.sg_partido_tse
WHERE p.ano IN (2018, 2020) AND n.vl_ideologia IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Votos por município, ano e partido (deputado federal em 2018/2022, vereador em 2020/2024)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q7_voto_partido AS
SELECT
    v.cod_ibge,
    c.ano,
    c.cd_cargo,
    c.nr_partido,
    p.sg_partido,
    e.vl_ideologia AS vl_rodada,
    f.vl_ideologia AS vl_fixa_2018,
    sum(v.qt_votos_nominais) AS qt_votos
FROM modelo.votacao_candidato_municipio AS v
INNER JOIN modelo.candidatura AS c ON v.id_candidatura = c.id_candidatura
INNER JOIN modelo.partido AS p ON c.ano = p.ano AND c.nr_partido = p.nr_partido
LEFT JOIN modelo.espectro_partido AS e ON c.ano = e.ano AND c.nr_partido = e.nr_partido
LEFT JOIN q7_nota_rodada2018 AS f ON p.sg_partido = f.sg_partido_tse
WHERE
    v.nr_turno = 1
    AND ((c.ano IN (2018, 2022) AND c.cd_cargo = 6) OR (c.ano IN (2020, 2024) AND c.cd_cargo = 13))
GROUP BY ALL;

-- Viés de cada município em cada eleição
CREATE OR REPLACE VIEW q7_vies_municipio AS
SELECT
    m.cod_ibge,
    m.nm_municipio,
    m.sg_uf,
    m.cd_regiao_imediata,
    m.nm_regiao_imediata,
    v.ano,
    v.cd_cargo,
    sum(v.qt_votos) AS qt_votos,
    sum(v.qt_votos * v.vl_rodada) / nullif(sum(v.qt_votos) FILTER (WHERE v.vl_rodada IS NOT NULL), 0) AS vl_rodada,
    sum(v.qt_votos * v.vl_fixa_2018) / nullif(sum(v.qt_votos) FILTER (WHERE v.vl_fixa_2018 IS NOT NULL), 0)
        AS vl_fixa_2018,
    100.0 * sum(v.qt_votos) FILTER (WHERE v.vl_rodada IS NOT NULL) / nullif(sum(v.qt_votos), 0)
        AS pc_votos_com_nota
FROM q7_voto_partido AS v
INNER JOIN modelo.municipio AS m ON v.cod_ibge = m.cod_ibge
WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
GROUP BY ALL;

-- Viés de cada região geográfica imediata (IBGE) em cada eleição: votos somados da região
CREATE OR REPLACE VIEW q7_vies_regiao AS
SELECT
    m.sg_uf,
    m.cd_regiao_imediata,
    m.nm_regiao_imediata,
    v.ano,
    v.cd_cargo,
    count(DISTINCT m.cod_ibge) AS qt_municipios,
    sum(v.qt_votos) AS qt_votos,
    sum(v.qt_votos * v.vl_rodada) / nullif(sum(v.qt_votos) FILTER (WHERE v.vl_rodada IS NOT NULL), 0) AS vl_rodada,
    sum(v.qt_votos * v.vl_fixa_2018) / nullif(sum(v.qt_votos) FILTER (WHERE v.vl_fixa_2018 IS NOT NULL), 0)
        AS vl_fixa_2018
FROM q7_voto_partido AS v
INNER JOIN modelo.municipio AS m ON v.cod_ibge = m.cod_ibge
WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE') AND m.cd_regiao_imediata IS NOT NULL
GROUP BY ALL;

-- Partido do prefeito eleito em 2020 e 2024, com as duas réguas (alternância de lado)
CREATE OR REPLACE VIEW q7_prefeito AS
SELECT
    c.cod_ibge,
    c.ano,
    p.sg_partido,
    e.vl_ideologia AS vl_rodada,
    f.vl_ideologia AS vl_fixa_2018
FROM modelo.candidatura AS c
INNER JOIN modelo.partido AS p ON c.ano = p.ano AND c.nr_partido = p.nr_partido
LEFT JOIN modelo.espectro_partido AS e ON c.ano = e.ano AND c.nr_partido = e.nr_partido
LEFT JOIN q7_nota_rodada2018 AS f ON p.sg_partido = f.sg_partido_tse
WHERE c.ano IN (2020, 2024) AND c.cd_cargo = 11 AND c.fl_eleito;
