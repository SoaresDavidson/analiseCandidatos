-- validacao/q6_idade.sql — checagens da Q6 (idade do município, dos eleitos e alternância).
--
-- Cada consulta deve voltar VAZIA, salvo as exceções conhecidas anotadas em V1 e V7.
-- Fica fora de sql/*.sql de propósito: o carregar_staging.py não roda esta pasta.
-- Rodar no notebook ou no duckdb, da RAIZ do repositório (V1 lê o JSON do SIDRA), depois de
-- 06_carga_nucleo, 13_ficha_candidato, 17_q7 e 19_q6, com a coleta das 6 UFs.

-- V1. Censo: a população carregada soma o JSON do SIDRA 9606 inteiro (203.080.756 no país) e
--     toda cidade das 6 UFs tem idade média.
--     EXCEÇÃO CONHECIDA: Boa Esperança do Norte (MT), criada depois do Censo 2022.
SELECT
    'V1 censo ≠ SIDRA' AS checagem,
    NULL AS sg_uf,
    NULL AS nm_municipio,
    (SELECT sum(c.qt_pessoas) FROM modelo.censo_faixa_etaria AS c) AS qt_carregada,
    sum(try_cast(s.v AS bigint)) AS qt_sidra
FROM read_json('dados/raw/ibge/sidra/9606_populacao_idade_municipios.json', format = 'array') AS s
WHERE try_cast(s.d1c AS integer) IS NOT NULL
HAVING sum(try_cast(s.v AS bigint)) <> (SELECT sum(c.qt_pessoas) FROM modelo.censo_faixa_etaria AS c)
UNION ALL
SELECT
    'V1 cidade sem idade' AS checagem,
    m.sg_uf,
    m.nm_municipio,
    NULL AS qt_carregada,
    NULL AS qt_sidra
FROM modelo.municipio AS m
LEFT JOIN q6_censo_municipio AS c ON m.cod_ibge = c.cod_ibge
WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE') AND c.cod_ibge IS NULL;

-- V2. Faixas: 21 do IBGE e 23 do TSE (com a -3, inválida); a marca de jovem pega 3 do IBGE
--     (15–19, 20–24, 25–29) e 7 do TSE (16, 17, 18, 19, 20, 21–24, 25–29); nenhuma faixa
--     atravessa os cortes de 15 e de 29/30 anos.
SELECT
    'V2 faixas' AS checagem,
    ds_origem,
    count(*) AS qt_faixas,
    count(*) FILTER (WHERE fl_jovem) AS qt_jovem
FROM modelo.faixa_etaria
GROUP BY ds_origem
HAVING
    count(*) <> CASE ds_origem WHEN 'IBGE' THEN 21 ELSE 23 END
    OR count(*) FILTER (WHERE fl_jovem) <> CASE ds_origem WHEN 'IBGE' THEN 3 ELSE 7 END
UNION ALL
SELECT
    'V2 faixa atravessa o corte' AS checagem,
    ds_origem,
    nr_idade_min AS qt_faixas,
    nr_idade_max AS qt_jovem
FROM modelo.faixa_etaria
WHERE
    (nr_idade_min < 15 AND nr_idade_max >= 15)
    OR (nr_idade_min <= 29 AND coalesce(nr_idade_max, 999) >= 30);

-- V3. Eleitorado: os aptos do 1º turno por UF e ano (perfil do eleitor, somado) batem com os
--     aptos de COMPARECIMENTO_MUNICIPIO (detalhe_votacao_munzona, outro arquivo do TSE),
--     governador em 2018/2022 e prefeito em 2020/2024, com folga de 0,2%.
--     Em 2020 e 2024 batem exatamente. Em 2018 e 2022 o perfil tem de 0,04% a 0,13% a mais em
--     todas as UFs (a diferença é só das eleições gerais; pode ser o voto em trânsito).
WITH perfil AS (
    SELECT
        m.sg_uf,
        p.ano,
        sum(p.qt_aptos) AS qt_aptos
    FROM modelo.comparecimento_perfil AS p
    INNER JOIN modelo.municipio AS m ON p.cod_ibge = m.cod_ibge
    WHERE p.nr_turno = 1
    GROUP BY ALL
),

detalhe AS (
    SELECT
        m.sg_uf,
        e.ano,
        sum(cm.qt_aptos) AS qt_aptos
    FROM modelo.comparecimento_municipio AS cm
    INNER JOIN modelo.eleicao AS e ON cm.cd_eleicao = e.cd_eleicao
    INNER JOIN modelo.municipio AS m ON cm.cod_ibge = m.cod_ibge
    WHERE e.nr_turno = 1 AND cm.cd_cargo IN (3, 11)
    GROUP BY ALL
)

SELECT
    'V3 aptos ≠ detalhe' AS checagem,
    p.sg_uf,
    p.ano,
    p.qt_aptos AS qt_perfil,
    d.qt_aptos AS qt_detalhe
FROM perfil AS p
FULL OUTER JOIN detalhe AS d ON p.sg_uf = d.sg_uf AND p.ano = d.ano
WHERE p.qt_aptos IS NULL OR d.qt_aptos IS NULL OR abs(p.qt_aptos - d.qt_aptos) > 0.002 * d.qt_aptos;

-- V4. Grão das views: uma linha por município (q6_municipio, q6_censo_municipio), por
--     município e ano (q6_eleitorado_municipio, q6_voto_idade), por candidatura
--     (q6_candidatura) e por cidade e ano (q6_prefeito).
SELECT
    'V4 q6_municipio' AS checagem,
    cod_ibge AS chave,
    NULL AS ano,
    count(*) AS qt
FROM q6_municipio
GROUP BY cod_ibge
HAVING count(*) > 1
UNION ALL
SELECT
    'V4 q6_censo_municipio' AS checagem,
    cod_ibge AS chave,
    NULL AS ano,
    count(*) AS qt
FROM q6_censo_municipio
GROUP BY cod_ibge
HAVING count(*) > 1
UNION ALL
SELECT
    'V4 q6_eleitorado_municipio' AS checagem,
    cod_ibge AS chave,
    ano,
    count(*) AS qt
FROM q6_eleitorado_municipio
GROUP BY cod_ibge, ano
HAVING count(*) > 1
UNION ALL
SELECT
    'V4 q6_voto_idade' AS checagem,
    cod_ibge AS chave,
    ano,
    count(*) AS qt
FROM q6_voto_idade
GROUP BY cod_ibge, ano
HAVING count(*) > 1
UNION ALL
SELECT
    'V4 q6_candidatura' AS checagem,
    id_candidatura AS chave,
    NULL AS ano,
    count(*) AS qt
FROM q6_candidatura
GROUP BY id_candidatura
HAVING count(*) > 1
UNION ALL
SELECT
    'V4 q6_prefeito' AS checagem,
    cod_ibge AS chave,
    ano,
    count(*) AS qt
FROM q6_prefeito
GROUP BY cod_ibge, ano
HAVING count(*) > 1;

-- V5. Votos: q6_voto_idade tem ≥ 99,99% dos votos da Q7 (mesmo cargo e turno) em cada UF e
--     ano. O que falta é voto em candidato com idade fora de 18–100 anos (data de nascimento
--     errada no TSE).
--     EXCEÇÃO CONHECIDA: nenhuma acima do corte (em 2024 faltam 21 votos em GO e 94 no RS).
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

q6 AS (
    SELECT
        sg_uf,
        ano,
        sum(qt_votos) AS qt_votos
    FROM q6_voto_idade
    GROUP BY ALL
)

SELECT
    'V5 votos perdidos' AS checagem,
    q7.sg_uf,
    q7.ano,
    q7.qt_votos AS qt_q7,
    q6.qt_votos AS qt_q6
FROM q7
LEFT JOIN q6 ON q7.sg_uf = q6.sg_uf AND q7.ano = q6.ano
WHERE coalesce(q6.qt_votos, 0) < 0.9999 * q7.qt_votos;

-- V6. Idades: médias no intervalo plausível e poucas candidaturas fora (idade fora de 18–100
--     em no máximo 0,1% das que foram a voto).
SELECT
    'V6 idade média implausível' AS checagem,
    cod_ibge AS chave,
    nr_idade_media_populacao AS valor
FROM q6_municipio
WHERE
    nr_idade_media_populacao NOT BETWEEN 15 AND 60
    OR nr_idade_media_eleitorado_2024 NOT BETWEEN 30 AND 70
    OR nr_idade_media_vereadores_2024 NOT BETWEEN 25 AND 75
UNION ALL
SELECT
    'V6 idade fora de 18–100' AS checagem,
    k.ano AS chave,
    100.0 * count(*) FILTER (WHERE NOT coalesce(k.nr_idade_eleicao BETWEEN 18 AND 100, FALSE)) / count(*)
        AS valor
FROM modelo.candidatura AS k
WHERE k.ano BETWEEN 2016 AND 2024 AND k.ds_sit_tot_turno IS NOT NULL
GROUP BY k.ano
HAVING count(*) FILTER (WHERE NOT coalesce(k.nr_idade_eleicao BETWEEN 18 AND 100, FALSE)) > 0.001 * count(*);

-- V7. Alternância: toda cidade das 6 UFs tem prefeito eleito em 2016, 2020 e 2024.
--     EXCEÇÕES CONHECIDAS (30): eleição anulada ou sub judice, que vira suplementar (fora pela
--     R1), e Boa Esperança do Norte (MT), instalada só em 2024.
--     2016 (12): Niquelândia (GO), Sambaíba (MA), Boa Esperança do Norte (MT), Arambaré,
--       Arvorezinha, Butiá, Gravataí, Salto do Jacuí, São Vendelino, São Vicente do Sul (RS),
--       Carmópolis e Laranjeiras (SE).
--     2020 (9): Coari (AM), Acorizal, Boa Esperança do Norte, Matupá, Torixoréu (MT),
--       Cachoeirinha, Pinheiro Machado, Putinga, São Francisco de Assis (RS).
--     2024 (9): as da V4 de validacao/q4_escolaridade.sql.
--     A cidade sem prefeito num dos anos fica sem troca de partido naquela comparação.
WITH anos AS (
    SELECT unnest([2016, 2020, 2024]) AS ano
)

SELECT
    'V7 cidade sem prefeito' AS checagem,
    a.ano,
    m.sg_uf,
    m.nm_municipio
FROM modelo.municipio AS m
CROSS JOIN anos AS a
LEFT JOIN q6_prefeito AS p ON m.cod_ibge = p.cod_ibge AND a.ano = p.ano
WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE') AND p.cod_ibge IS NULL
ORDER BY a.ano, m.sg_uf, m.nm_municipio;
