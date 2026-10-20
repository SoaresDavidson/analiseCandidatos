-- 15_espectro.sql — espectro ideológico dos partidos, dos eleitos e dos municípios.
--
-- Fonte (única não governamental do modelo): Bolognesi, Ribeiro, Codato e Silva
-- (2025), "O desaparecimento do centro ideológico no sistema partidário
-- brasileiro", Opinião Pública 31, e31120 (survey com cientistas políticos, escala
-- de 0 = esquerda a 10 = direita). A tabela do artigo está, sem alteração, em
-- dados/referencia/espectro_bolognesi_2025.csv; o de-para das siglas do artigo para
-- as do TSE, em dados/referencia/espectro_de_para_tse.csv.
--
-- Regras (docs/der/der-duda.md): eleições de 2022 e 2024 usam a rodada de 2022. A
-- categoria usa os cortes escritos no artigo: 0–1,5 extrema esquerda; 1,51–3
-- esquerda; 3,01–4,49 centro-esquerda; 4,5–5,5 centro; 5,51–7 centro-direita;
-- 7,01–8,5 direita; 8,51–10 extrema direita. (A coluna "ideologia categórica" do
-- artigo aplica os cortes à média ponderada das duas rodadas; aqui, à de 2022.)
-- Fora das rodadas: Mobiliza = PMN renomeado (mesma nota); PRD (fusão de PTB e
-- Patriota em 2023) = média das notas de 2022 dos dois, marcado como estimado.
--
-- Rodar da RAIZ do repositório, depois do 06_carga_nucleo, 13_ficha e 01–05:
--
--     uv run python scripts/carregar_staging.py 15_espectro

-- ---------------------------------------------------------------------------
-- ESPECTRO_PARTIDO (2022 e 2024)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TEMP TABLE stg_espectro AS
SELECT
    d.sg_partido_tse,
    d.regra,
    CASE
        WHEN d.sigla_artigo = 'PTB+PATRI'
            THEN (
                SELECT avg(e2.media_2022::double)
                FROM
                    read_csv('dados/referencia/espectro_bolognesi_2025.csv', delim = ';', all_varchar = TRUE) AS e2
                WHERE e2.sigla_artigo IN ('PTB', 'PATRI')
            )
        ELSE e.media_2022::double
    END AS vl_ideologia
FROM read_csv('dados/referencia/espectro_de_para_tse.csv', delim = ';', all_varchar = TRUE) AS d
LEFT JOIN read_csv('dados/referencia/espectro_bolognesi_2025.csv', delim = ';', all_varchar = TRUE) AS e
    ON d.sigla_artigo = e.sigla_artigo;

DELETE FROM modelo.espectro_partido
WHERE ano IN (2022, 2024);

INSERT INTO modelo.espectro_partido
SELECT
    p.ano,
    p.nr_partido,
    2022 AS nr_rodada,
    round(s.vl_ideologia, 2) AS vl_ideologia,
    CASE
        WHEN round(s.vl_ideologia, 2) <= 1.5 THEN 'EXTREMA ESQUERDA'
        WHEN round(s.vl_ideologia, 2) <= 3 THEN 'ESQUERDA'
        WHEN round(s.vl_ideologia, 2) < 4.5 THEN 'CENTRO-ESQUERDA'
        WHEN round(s.vl_ideologia, 2) <= 5.5 THEN 'CENTRO'
        WHEN round(s.vl_ideologia, 2) <= 7 THEN 'CENTRO-DIREITA'
        WHEN round(s.vl_ideologia, 2) <= 8.5 THEN 'DIREITA'
        ELSE 'EXTREMA DIREITA'
    END AS cd_espectro,
    'Bolognesi, Ribeiro, Codato e Silva (2025), Opinião Pública 31, rodada 2022'
    || CASE WHEN s.regra LIKE 'mesma%' OR s.regra LIKE 'sigla%' THEN '' ELSE ' — ' || s.regra END AS ds_fonte
FROM modelo.partido AS p
INNER JOIN stg_espectro AS s ON p.sg_partido = s.sg_partido_tse
WHERE p.ano IN (2022, 2024) AND s.vl_ideologia IS NOT NULL;

-- ---------------------------------------------------------------------------
-- A régua: do partido mais à esquerda ao mais à direita entre os que elegeram
-- alguém em 2024 nos 6 estados. O meio da régua separa "tende à esquerda" de
-- "tende à direita".
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW espectro_regua AS
WITH com_eleito AS (
    SELECT DISTINCT
        p.sg_partido,
        e.vl_ideologia
    FROM modelo.candidatura AS c
    INNER JOIN modelo.partido AS p ON c.ano = p.ano AND c.nr_partido = p.nr_partido
    INNER JOIN modelo.espectro_partido AS e ON c.ano = e.ano AND c.nr_partido = e.nr_partido
    WHERE c.ano = 2024 AND c.fl_eleito
)

SELECT
    arg_min(sg_partido, vl_ideologia) AS sg_mais_esquerda,
    min(vl_ideologia) AS vl_mais_esquerda,
    arg_max(sg_partido, vl_ideologia) AS sg_mais_direita,
    max(vl_ideologia) AS vl_mais_direita,
    (min(vl_ideologia) + max(vl_ideologia)) / 2 AS vl_meio
FROM com_eleito;

-- ---------------------------------------------------------------------------
-- Espectro de cada município (eleição municipal de 2024; 2022 para comparar).
-- Médias ponderadas: cada voto (ou cadeira) pesa a nota do partido. Votos em
-- partido sem nota ficam fora da média; pc_votos_classificados mostra quanto sobrou.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW espectro_municipio AS
WITH voto AS (
    SELECT
        v.cod_ibge,
        c.ano,
        c.cd_cargo,
        sum(v.qt_votos_nominais * e.vl_ideologia) AS soma_ponderada,
        sum(v.qt_votos_nominais) FILTER (WHERE e.vl_ideologia IS NOT NULL) AS qt_votos_classificados,
        sum(v.qt_votos_nominais) AS qt_votos
    FROM modelo.votacao_candidato_municipio AS v
    INNER JOIN modelo.candidatura AS c ON v.id_candidatura = c.id_candidatura
    LEFT JOIN modelo.espectro_partido AS e ON c.ano = e.ano AND c.nr_partido = e.nr_partido
    WHERE v.nr_turno = 1 AND ((c.ano = 2024 AND c.cd_cargo = 13) OR (c.ano = 2022 AND c.cd_cargo = 6))
    GROUP BY ALL
),

camara AS (
    SELECT
        c.cod_ibge,
        count(*) AS qt_vereadores,
        avg(e.vl_ideologia) AS vl_camara
    FROM modelo.candidatura AS c
    LEFT JOIN modelo.espectro_partido AS e ON c.ano = e.ano AND c.nr_partido = e.nr_partido
    WHERE c.ano = 2024 AND c.cd_cargo = 13 AND c.fl_eleito
    GROUP BY c.cod_ibge
),

prefeito AS (
    SELECT
        c.cod_ibge,
        any_value(e.vl_ideologia) AS vl_prefeito,
        any_value(p.sg_partido) AS sg_partido_prefeito
    FROM modelo.candidatura AS c
    INNER JOIN modelo.partido AS p ON c.ano = p.ano AND c.nr_partido = p.nr_partido
    LEFT JOIN modelo.espectro_partido AS e ON c.ano = e.ano AND c.nr_partido = e.nr_partido
    WHERE c.ano = 2024 AND c.cd_cargo = 11 AND c.fl_eleito
    GROUP BY c.cod_ibge
)

SELECT
    m.cod_ibge,
    m.nm_municipio,
    m.sg_uf,
    v24.qt_votos AS qt_votos_vereador_2024,
    ca.qt_vereadores,
    ca.vl_camara,
    pr.vl_prefeito,
    pr.sg_partido_prefeito,
    v24.soma_ponderada / nullif(v24.qt_votos_classificados, 0) AS vl_voto_vereador_2024,
    100.0 * v24.qt_votos_classificados / nullif(v24.qt_votos, 0) AS pc_votos_classificados_2024,
    v22.soma_ponderada / nullif(v22.qt_votos_classificados, 0) AS vl_voto_dep_federal_2022
FROM modelo.municipio AS m
LEFT JOIN voto AS v24 ON m.cod_ibge = v24.cod_ibge AND v24.ano = 2024
LEFT JOIN voto AS v22 ON m.cod_ibge = v22.cod_ibge AND v22.ano = 2022
LEFT JOIN camara AS ca ON m.cod_ibge = ca.cod_ibge
LEFT JOIN prefeito AS pr ON m.cod_ibge = pr.cod_ibge
WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE');

-- ---------------------------------------------------------------------------
-- Dinheiro das campanhas de 2024 em cada município (prefeito e vereador), pela
-- mesma regra da Q8 (público = FEFC + Fundo Partidário) e os canais da Q9.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW dinheiro_municipio AS
WITH receita AS (
    SELECT
        sg_ue,
        count(*) AS qt_candidatos,
        sum(vr_total) AS vr_receita,
        sum(vr_publico) AS vr_publico
    FROM mart_q8
    WHERE ano = 2024 AND ds_cargo IN ('PREFEITO', 'VEREADOR')
    GROUP BY sg_ue
),

canal AS (
    SELECT
        sg_ue,
        ds_canal,
        sum(vr_despesa) AS vr_canal
    FROM mart_q9
    WHERE ano = 2024 AND ds_cargo IN ('PREFEITO', 'VEREADOR')
    GROUP BY sg_ue, ds_canal
),

propaganda AS (
    SELECT
        sg_ue,
        sum(vr_canal) AS vr_propaganda,
        arg_max(ds_canal, (vr_canal, ds_canal)) AS ds_canal_principal
    FROM canal
    GROUP BY sg_ue
)

SELECT
    m.cod_ibge,
    r.qt_candidatos,
    r.vr_receita,
    r.vr_publico,
    p.vr_propaganda,
    p.ds_canal_principal
FROM modelo.municipio AS m
LEFT JOIN receita AS r ON lpad(m.cod_tse, 5, '0') = lpad(r.sg_ue, 5, '0')
LEFT JOIN propaganda AS p ON lpad(m.cod_tse, 5, '0') = lpad(p.sg_ue, 5, '0')
WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE');
