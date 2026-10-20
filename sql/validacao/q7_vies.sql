-- validacao/q7_vies.sql — checagens do viés político na linha do tempo (Q7).
--
-- Cada consulta deve voltar VAZIA, salvo as exceções conhecidas anotadas em V3, V4 e V5.
-- Fica fora de sql/*.sql de propósito: o carregar_staging.py não roda esta pasta.
-- Rodar no notebook ou no duckdb, da RAIZ do repositório (V5 e V6 leem os CSV do TSE),
-- depois de 06_carga_nucleo, 13_ficha_candidato, 15_espectro, 16_indicadores e 17_q7,
-- com a coleta das 6 UFs (AM, GO, MA, MT, RS, SE).

-- V1. Votos com nota: ≥ 99,9% dos votos de cada eleição têm nota nas duas réguas.
--     EXCEÇÃO CONHECIDA: nenhuma acima do corte. O que fica sem nota é só o UP (fundado em
--     2019, fora da rodada de 2018): 2.322 votos em 2020 nas duas réguas e, na régua fixa,
--     5.192 em 2022 e 2.198 em 2024 — de 0,01% a 0,03% dos votos.
SELECT
    'V1 votos sem nota' AS checagem,
    v.ano,
    round(100.0 * sum(v.qt_votos) FILTER (WHERE v.vl_rodada IS NOT NULL) / sum(v.qt_votos), 3) AS pc_rodada,
    round(100.0 * sum(v.qt_votos) FILTER (WHERE v.vl_fixa_2018 IS NOT NULL) / sum(v.qt_votos), 3) AS pc_fixa_2018
FROM q7_voto_partido AS v
INNER JOIN modelo.municipio AS m ON v.cod_ibge = m.cod_ibge
WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
GROUP BY v.ano
HAVING
    100.0 * sum(v.qt_votos) FILTER (WHERE v.vl_rodada IS NOT NULL) / sum(v.qt_votos) < 99.9
    OR 100.0 * sum(v.qt_votos) FILTER (WHERE v.vl_fixa_2018 IS NOT NULL) / sum(v.qt_votos) < 99.9;

-- V2. Cada cidade e ano numa linha só; cada região e ano numa linha só; um prefeito por
--     cidade e ano.
SELECT
    'V2 cidade duplicada' AS checagem,
    cod_ibge::varchar AS chave,
    ano,
    count(*) AS qt
FROM q7_vies_municipio
GROUP BY cod_ibge, ano
HAVING count(*) > 1
UNION ALL
SELECT
    'V2 região duplicada' AS checagem,
    cd_regiao_imediata::varchar AS chave,
    ano,
    count(*) AS qt
FROM q7_vies_regiao
GROUP BY cd_regiao_imediata, ano
HAVING count(*) > 1
UNION ALL
SELECT
    'V2 prefeito duplicado' AS checagem,
    cod_ibge::varchar AS chave,
    ano,
    count(*) AS qt
FROM q7_prefeito
GROUP BY cod_ibge, ano
HAVING count(*) > 1;

-- V3. Cobertura: toda cidade das 6 UFs tem viés em cada eleição.
--     EXCEÇÕES CONHECIDAS:
--     - Boa Esperança do Norte (MT), de 2018 a 2022: instalada só na eleição de 2024.
--     - 17 cidades em 2024 (GO: Águas Lindas de Goiás, Buriti Alegre, Cavalcante, Iporá,
--       Jataí, Santo Antônio do Descoberto, São Domingos, Valparaíso de Goiás; MA: Central do
--       Maranhão, Itapecuru Mirim, Lagoa Grande do Maranhão, Nova Olinda do Maranhão, São
--       Benedito do Rio Preto, São Luís Gonzaga do Maranhão, Trizidela do Vale, Vitorino Freire;
--       SE: Nossa Senhora das Dores): o votacao_candidato_munzona_2024 do TSE não traz votos de
--       vereador dessas cidades, e os candidatos estão sem situação final (eleição proporcional
--       anulada ou em retotalização). O detalhe_votacao tem o comparecimento delas.
WITH anos AS (
    SELECT unnest([2018, 2020, 2022, 2024]) AS ano
)

SELECT
    'V3 cidade sem viés' AS checagem,
    a.ano,
    m.sg_uf,
    m.nm_municipio
FROM modelo.municipio AS m
CROSS JOIN anos AS a
LEFT JOIN q7_vies_municipio AS v ON m.cod_ibge = v.cod_ibge AND a.ano = v.ano
WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE') AND v.cod_ibge IS NULL
ORDER BY a.ano, m.sg_uf, m.nm_municipio;

-- V4. Notas no intervalo da régua (0 a 10) e regiões imediatas: 122 nos 6 estados, cada
--     cidade numa região só.
--     EXCEÇÃO CONHECIDA: Boa Esperança do Norte (MT, 5101837) sem região: criada em 2023, não
--     está na base do PIB 2010–2023, de onde sai a região. Fica fora de q7_vies_regiao.
SELECT
    'V4 nota fora de 0–10' AS checagem,
    cod_ibge::varchar AS chave,
    ano,
    vl_rodada AS valor
FROM q7_vies_municipio
WHERE vl_rodada NOT BETWEEN 0 AND 10 OR vl_fixa_2018 NOT BETWEEN 0 AND 10
UNION ALL
SELECT
    'V4 regiões ≠ 122' AS checagem,
    NULL AS chave,
    NULL AS ano,
    count(DISTINCT cd_regiao_imediata) AS valor
FROM modelo.municipio
WHERE sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
HAVING count(DISTINCT cd_regiao_imediata) <> 122
UNION ALL
SELECT
    'V4 cidade sem região' AS checagem,
    cod_ibge::varchar AS chave,
    NULL AS ano,
    NULL AS valor
FROM modelo.municipio
WHERE sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE') AND cd_regiao_imediata IS NULL;

-- V5. Soma dos votos por UF e ano = total do TSE. Duas réguas:
--     (a) o próprio votacao_candidato_munzona (nada se perde nos joins com CANDIDATURA,
--         PARTIDO e MUNICIPIO): deve voltar vazia;
--     (b) o detalhe_votacao_munzona (válidos + anulados + anulados sub judice), que é o total
--         publicado do cargo.
--     EXCEÇÕES CONHECIDAS em (b): GO, MA e SE em 2024 (as 17 cidades da V3, 270 mil, 120 mil e
--     16 mil votos); RS em 2022 (o votacao tem 85.911 votos a mais, 1,5%); AM, MT e RS em 2024
--     (diferenças de até 2 mil votos, 0,1%).
WITH q7 AS (
    SELECT
        m.sg_uf,
        v.ano,
        sum(v.qt_votos) AS qt_votos
    FROM q7_voto_partido AS v
    INNER JOIN modelo.municipio AS m ON v.cod_ibge = m.cod_ibge
    WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
    GROUP BY ALL
),

arquivo AS (
    SELECT
        sg_uf,
        ano_eleicao::integer AS ano,
        sum(qt_votos_nominais::bigint) AS qt_votos
    FROM
        read_csv(
            'dados/raw/resultados/*/votacao_candidato_munzona_[0-9]*/votacao_candidato_munzona_[0-9]*_??.csv',
            delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
            all_varchar = TRUE, union_by_name = TRUE
        )
    WHERE
        cd_tipo_eleicao = '2' AND nr_turno = '1'
        AND (
            (ano_eleicao IN ('2018', '2022') AND cd_cargo = '6')
            OR (ano_eleicao IN ('2020', '2024') AND cd_cargo = '13')
        )
    GROUP BY ALL
),

detalhe AS (
    SELECT
        sg_uf,
        ano_eleicao::integer AS ano,
        sum(
            qt_votos_nominais_validos::bigint
            + qt_votos_nominais_anulados::bigint
            + qt_votos_nominais_anul_subjud::bigint
        ) AS qt_votos
    FROM
        read_csv(
            'dados/raw/resultados/*/detalhe_votacao_munzona_[0-9]*/detalhe_votacao_munzona_[0-9]*_??.csv',
            delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
            all_varchar = TRUE, union_by_name = TRUE
        )
    WHERE
        cd_tipo_eleicao = '2' AND nr_turno = '1'
        AND (
            (ano_eleicao IN ('2018', '2022') AND cd_cargo = '6')
            OR (ano_eleicao IN ('2020', '2024') AND cd_cargo = '13')
        )
    GROUP BY ALL
)

SELECT
    'V5a soma ≠ votacao_candidato_munzona' AS checagem,
    a.sg_uf,
    a.ano,
    q7.qt_votos AS qt_q7,
    a.qt_votos AS qt_tse
FROM arquivo AS a
LEFT JOIN q7 ON a.sg_uf = q7.sg_uf AND a.ano = q7.ano
WHERE q7.qt_votos IS DISTINCT FROM a.qt_votos
UNION ALL
SELECT
    'V5b soma ≠ detalhe_votacao_munzona' AS checagem,
    d.sg_uf,
    d.ano,
    q7.qt_votos AS qt_q7,
    d.qt_votos AS qt_tse
FROM detalhe AS d
LEFT JOIN q7 ON d.sg_uf = q7.sg_uf AND d.ano = q7.ano
WHERE q7.qt_votos IS DISTINCT FROM d.qt_votos
ORDER BY checagem, ano, sg_uf;

-- V6. Régua fixa: fusões levam a média dos partidos de origem (União = DEM e PSL; PRD = PTB e
--     Patriota) e toda sigla do de-para de 2018 acha nota no artigo.
SELECT
    'V6 fusão ≠ média' AS checagem,
    f.sg_partido_tse,
    f.vl_ideologia,
    (
        SELECT avg(o.vl_ideologia)
        FROM q7_nota_rodada2018 AS o
        WHERE list_contains(string_split(f.sigla_artigo, '+'), o.sigla_artigo)
    ) AS vl_media_origem
FROM q7_nota_rodada2018 AS f
WHERE
    f.sigla_artigo LIKE '%+%'
    AND abs(
        f.vl_ideologia
        - (
            SELECT avg(o.vl_ideologia)
            FROM q7_nota_rodada2018 AS o
            WHERE list_contains(string_split(f.sigla_artigo, '+'), o.sigla_artigo)
        )
    ) > 0.001
UNION ALL
SELECT
    'V6 sigla sem nota' AS checagem,
    sg_partido_tse,
    vl_ideologia,
    NULL AS vl_media_origem
FROM q7_nota_rodada2018
WHERE vl_ideologia IS NULL;
