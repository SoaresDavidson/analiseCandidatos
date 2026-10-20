-- 21_q3_indices.sql — Q3: índices do município × eleitos e partidos mais vitoriosos (2024).
--
-- Pergunta: "Quais os índices de dado município (PIB per capita, IDHM, eleitores por
-- população total, isentos = votos brancos + nulos + abstenções) com relação aos
-- eleitos/partidos mais vitoriosos?" Período: 2024 (decisão do grupo, 17/10).
--
-- Uma linha por município dos 6 estados, com os índices e quem venceu:
--   PIB per capita       IBGE, 2023 (o ano mais próximo da eleição sem passar dela)
--   perfil econômico     atividade com maior valor adicionado, IBGE 2021 (o IBGE não
--                        publicou a atividade de 2022 e 2023 nesta edição)
--   eleitores/população  aptos (TSE, 2024) ÷ população estimada (IBGE, 2024)
--   isentos              (abstenções + brancos + nulos) ÷ aptos, prefeito, 1º turno
--   renda e estudo       Censo 2022, no lugar do IDHM municipal (que parou em 2010)
--   quem venceu          partido do prefeito eleito, partido com mais vereadores,
--                        nota do voto para vereador (q7_vies_municipio)
--
-- Rodar da RAIZ do repositório, depois do 16_indicadores e do 17_q7:
--
--     uv run python scripts/carregar_staging.py 21_q3

CREATE OR REPLACE VIEW q3_municipio AS
WITH comparecimento AS (
    SELECT
        cm.cod_ibge,
        cm.qt_aptos,
        cm.qt_abstencoes + cm.qt_votos_brancos + cm.qt_total_votos_nulos AS qt_isentos
    FROM modelo.comparecimento_municipio AS cm
    INNER JOIN modelo.eleicao AS e ON cm.cd_eleicao = e.cd_eleicao
    WHERE e.ano = 2024 AND e.nr_turno = 1 AND cm.cd_cargo = 11
),

bancada AS (
    SELECT
        c.cod_ibge,
        p.sg_partido,
        count(*) AS qt_vereadores
    FROM modelo.candidatura AS c
    INNER JOIN modelo.partido AS p ON c.ano = p.ano AND c.nr_partido = p.nr_partido
    WHERE c.ano = 2024 AND c.cd_cargo = 13 AND c.fl_eleito
    GROUP BY c.cod_ibge, p.sg_partido
),

maior_bancada AS (
    -- empate desfeito pela sigla, para o resultado não variar; o empate fica marcado
    SELECT
        cod_ibge,
        arg_max(sg_partido, (qt_vereadores, sg_partido)) AS sg_maior_bancada,
        max(qt_vereadores) AS qt_maior_bancada,
        count(*) FILTER (WHERE fl_maior) > 1 AS fl_empate_bancada
    FROM (
        SELECT
            *,
            qt_vereadores = max(qt_vereadores) OVER (PARTITION BY cod_ibge) AS fl_maior
        FROM bancada
    ) AS b
    GROUP BY cod_ibge
),

pib AS (
    SELECT
        cod_ibge,
        vr_pib_per_capita
    FROM stg_pib_municipio
    WHERE ano = 2023
),

perfil AS (
    SELECT
        cod_ibge,
        ds_atividade_principal,
        CASE
            WHEN ds_atividade_principal LIKE 'Administração%' THEN 'ADMINISTRACAO PUBLICA'
            WHEN
                ds_atividade_principal LIKE 'Agricultura%'
                OR ds_atividade_principal LIKE 'Pecuária%'
                OR ds_atividade_principal LIKE 'Produção florestal%'
                THEN 'AGROPECUARIA'
            WHEN ds_atividade_principal LIKE 'Demais serviços%' OR ds_atividade_principal LIKE 'Comércio%'
                THEN 'SERVICOS E COMERCIO'
            ELSE 'INDUSTRIA E OUTROS'
        END AS ds_perfil
    FROM stg_pib_municipio
    WHERE ano = 2021
)

SELECT
    m.cod_ibge,
    m.nm_municipio,
    m.sg_uf,
    pib.vr_pib_per_capita,
    pf.ds_atividade_principal,
    pf.ds_perfil,
    pop.qt_populacao,
    cp.qt_aptos,
    ce.vr_renda_media_pc,
    ce.nr_anos_estudo,
    pr.sg_partido AS sg_prefeito,
    pr.vl_rodada AS vl_prefeito,
    mb.sg_maior_bancada,
    mb.qt_maior_bancada,
    mb.fl_empate_bancada,
    v.vl_rodada AS vl_voto,
    1.0 * cp.qt_aptos / nullif(pop.qt_populacao, 0) AS vl_eleitores_por_habitante,
    100.0 * cp.qt_isentos / nullif(cp.qt_aptos, 0) AS pc_isentos
FROM modelo.municipio AS m
LEFT JOIN comparecimento AS cp ON m.cod_ibge = cp.cod_ibge
LEFT JOIN pib ON m.cod_ibge = pib.cod_ibge
LEFT JOIN perfil AS pf ON m.cod_ibge = pf.cod_ibge
LEFT JOIN modelo.municipio_ano AS pop ON m.cod_ibge = pop.cod_ibge AND pop.ano = 2024
LEFT JOIN modelo.municipio_censo AS ce ON m.cod_ibge = ce.cod_ibge AND ce.ano_censo = 2022
LEFT JOIN q7_prefeito AS pr ON m.cod_ibge = pr.cod_ibge AND pr.ano = 2024
LEFT JOIN maior_bancada AS mb ON m.cod_ibge = mb.cod_ibge
LEFT JOIN q7_vies_municipio AS v ON m.cod_ibge = v.cod_ibge AND v.ano = 2024
WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE');
