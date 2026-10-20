-- 20_q6_idade.sql — Q6: idade do município, idade dos eleitos e alternância de poder (E.P.).
--
-- "Idade média do município (mais velho × mais jovem): há alternância de poder? Qual a
-- idade média dos eleitos? Jovem vota em jovem e velho em velho?"
--
-- Regras:
--   jovem = 15 a 29 anos (Estatuto da Juventude, Lei 12.852/2013, art. 1º; R10). No eleitorado,
--           16 a 29 (não há eleitor de 15); no candidato, 18 a 29 (idade mínima do cargo).
--   idoso = 60 anos ou mais (Estatuto da Pessoa Idosa, Lei 10.741/2003, art. 1º).
--   idade de uma faixa = o meio dela, em anos completos ((mín + máx) / 2; 100 ou mais = 102),
--           na mesma conta da idade do candidato (nr_idade_eleicao, anos completos).
--   idade do candidato: só de 18 a 100 anos. O TSE tem datas de nascimento erradas (idade de
--           807, 2003 e -941 anos); ficam fora.
--   município mais jovem × mais velho = terços da idade média da população no Censo 2022, entre
--           as 1.238 cidades dos 6 estados que o Censo tem (e, à parte, dentro de cada estado).
--   voto: o mesmo cargo da Q7 — deputado federal em 2018 e 2022, vereador em 2020 e 2024; 1º turno.
--   alternância: o partido (com renomeações e fusões) ou a pessoa (pelo título) do prefeito eleito
--           mudou de 2016 para 2020 e de 2020 para 2024.
--
-- Rodar da RAIZ do repositório, depois do 13_ficha (votos), 17_q7 e 19_faixa_etaria:
--
--     uv run python scripts/carregar_staging.py 20_q6

-- ---------------------------------------------------------------------------
-- Idade da população (Censo 2022), uma linha por município dos 6 estados
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q6_censo_municipio AS
WITH base AS (
    SELECT
        m.cod_ibge,
        m.nm_municipio,
        m.sg_uf,
        sum(c.qt_pessoas) AS qt_populacao,
        sum(c.qt_pessoas * (f.nr_idade_min + coalesce(f.nr_idade_max, f.nr_idade_min + 4)) / 2.0)
        / sum(c.qt_pessoas) AS nr_idade_media,
        100.0 * sum(c.qt_pessoas) FILTER (WHERE f.fl_jovem) / sum(c.qt_pessoas) AS pc_jovem,
        100.0 * sum(c.qt_pessoas) FILTER (WHERE f.nr_idade_min >= 60) / sum(c.qt_pessoas) AS pc_idoso
    FROM modelo.censo_faixa_etaria AS c
    INNER JOIN modelo.faixa_etaria AS f ON c.id_faixa = f.id_faixa
    INNER JOIN modelo.municipio AS m ON c.cod_ibge = m.cod_ibge
    WHERE c.ano_censo = 2022 AND m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
    GROUP BY ALL
)

SELECT
    *,
    ntile(3) OVER (ORDER BY nr_idade_media) AS nr_terco,
    ntile(3) OVER (PARTITION BY sg_uf ORDER BY nr_idade_media) AS nr_terco_uf
FROM base;

-- ---------------------------------------------------------------------------
-- Idade do eleitorado (TSE), uma linha por município e eleição (1º turno)
-- ---------------------------------------------------------------------------
-- A faixa -3 (data de nascimento inválida, umas dezenas por estado) fica fora das contas.
CREATE OR REPLACE VIEW q6_eleitorado_municipio AS
SELECT
    m.cod_ibge,
    m.nm_municipio,
    m.sg_uf,
    p.ano,
    sum(p.qt_aptos) AS qt_aptos,
    sum(p.qt_aptos * (f.nr_idade_min + coalesce(f.nr_idade_max, f.nr_idade_min + 4)) / 2.0)
    / sum(p.qt_aptos) AS nr_idade_media,
    100.0 * sum(p.qt_aptos) FILTER (WHERE f.fl_jovem) / sum(p.qt_aptos) AS pc_aptos_jovem,
    100.0 * sum(p.qt_aptos) FILTER (WHERE f.nr_idade_min >= 60) / sum(p.qt_aptos) AS pc_aptos_idoso,
    100.0 * sum(p.qt_abstencao) / sum(p.qt_aptos) AS pc_abstencao,
    100.0 * sum(p.qt_abstencao) FILTER (WHERE f.fl_jovem) / sum(p.qt_aptos) FILTER (WHERE f.fl_jovem)
        AS pc_abstencao_jovem,
    100.0 * sum(p.qt_abstencao) FILTER (WHERE NOT f.fl_jovem) / sum(p.qt_aptos) FILTER (WHERE NOT f.fl_jovem)
        AS pc_abstencao_nao_jovem
FROM modelo.comparecimento_perfil AS p
INNER JOIN modelo.faixa_etaria AS f ON p.id_faixa = f.id_faixa
INNER JOIN modelo.municipio AS m ON p.cod_ibge = m.cod_ibge
WHERE p.nr_turno = 1 AND f.nr_idade_min IS NOT NULL AND m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
GROUP BY ALL;

-- ---------------------------------------------------------------------------
-- Candidaturas com idade, 2016–2024 (2016 só para a alternância de 2016 para 2020)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q6_candidatura AS
SELECT
    c.id_candidatura,
    c.ano,
    c.cd_cargo,
    g.ds_cargo,
    c.cod_ibge,
    c.nr_titulo_eleitoral,
    c.nr_partido,
    p.sg_partido,
    c.nr_idade_eleicao AS nr_idade,
    c.fl_eleito,
    coalesce(m.sg_uf, c.sg_ue) AS sg_uf,
    CASE
        WHEN c.nr_idade_eleicao <= 29 THEN '18 A 29'
        WHEN c.nr_idade_eleicao < 60 THEN '30 A 59'
        ELSE '60 OU MAIS'
    END AS ds_faixa
FROM modelo.candidatura AS c
INNER JOIN modelo.cargo AS g ON c.cd_cargo = g.cd_cargo
INNER JOIN modelo.partido AS p ON c.ano = p.ano AND c.nr_partido = p.nr_partido
LEFT JOIN modelo.municipio AS m ON c.cod_ibge = m.cod_ibge
WHERE
    c.ano BETWEEN 2016 AND 2024
    AND c.cd_cargo IN (3, 5, 6, 7, 11, 13)           -- sem presidente, vices e suplentes
    AND c.ds_sit_tot_turno IS NOT NULL               -- foi a voto (indeferido fica fora)
    AND c.nr_idade_eleicao BETWEEN 18 AND 100
    AND coalesce(m.sg_uf, c.sg_ue) IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE');

-- Idade de candidatos e eleitos por eleição, estado e cargo (E.P.: 2018 a 2024)
CREATE OR REPLACE VIEW q6_idade_eleitos AS
SELECT
    ano,
    sg_uf,
    cd_cargo,
    ds_cargo,
    count(*) AS qt_candidatos,
    count(*) FILTER (WHERE fl_eleito) AS qt_eleitos,
    avg(nr_idade) AS nr_idade_media_candidatos,
    avg(nr_idade) FILTER (WHERE fl_eleito) AS nr_idade_media_eleitos,
    100.0 * count(*) FILTER (WHERE ds_faixa = '18 A 29') / count(*) AS pc_jovem_candidatos,
    100.0 * count(*) FILTER (WHERE ds_faixa = '18 A 29' AND fl_eleito)
    / nullif(count(*) FILTER (WHERE fl_eleito), 0) AS pc_jovem_eleitos,
    100.0 * count(*) FILTER (WHERE ds_faixa = '60 OU MAIS') / count(*) AS pc_idoso_candidatos,
    100.0 * count(*) FILTER (WHERE ds_faixa = '60 OU MAIS' AND fl_eleito)
    / nullif(count(*) FILTER (WHERE fl_eleito), 0) AS pc_idoso_eleitos,
    -- chance de vitória por faixa, sempre dentro do mesmo cargo
    100.0 * count(*) FILTER (WHERE ds_faixa = '18 A 29' AND fl_eleito)
    / nullif(count(*) FILTER (WHERE ds_faixa = '18 A 29'), 0) AS pc_sucesso_jovem,
    100.0 * count(*) FILTER (WHERE ds_faixa = '30 A 59' AND fl_eleito)
    / nullif(count(*) FILTER (WHERE ds_faixa = '30 A 59'), 0) AS pc_sucesso_30_59,
    100.0 * count(*) FILTER (WHERE ds_faixa = '60 OU MAIS' AND fl_eleito)
    / nullif(count(*) FILTER (WHERE ds_faixa = '60 OU MAIS'), 0) AS pc_sucesso_idoso
FROM q6_candidatura
WHERE ano BETWEEN 2018 AND 2024
GROUP BY ALL;

-- ---------------------------------------------------------------------------
-- Jovem vota em jovem? Votos por idade do candidato, uma linha por município e eleição
-- ---------------------------------------------------------------------------
-- Mesmo cargo da Q7: deputado federal (2018, 2022) e vereador (2020, 2024), 1º turno. O voto é
-- secreto: o que se compara é o eleitorado da cidade com a idade de quem a cidade elegeu/votou.
CREATE OR REPLACE VIEW q6_voto_idade AS
WITH voto AS (
    SELECT
        v.cod_ibge,
        c.ano,
        c.cd_cargo,
        sum(v.qt_votos_nominais) AS qt_votos,
        sum(v.qt_votos_nominais * c.nr_idade) / sum(v.qt_votos_nominais) AS nr_idade_media_voto,
        100.0 * sum(v.qt_votos_nominais) FILTER (WHERE c.ds_faixa = '18 A 29') / sum(v.qt_votos_nominais)
            AS pc_votos_jovem,
        100.0 * sum(v.qt_votos_nominais) FILTER (WHERE c.ds_faixa = '60 OU MAIS') / sum(v.qt_votos_nominais)
            AS pc_votos_idoso
    FROM modelo.votacao_candidato_municipio AS v
    INNER JOIN q6_candidatura AS c ON v.id_candidatura = c.id_candidatura
    WHERE
        v.nr_turno = 1
        AND ((c.ano IN (2018, 2022) AND c.cd_cargo = 6) OR (c.ano IN (2020, 2024) AND c.cd_cargo = 13))
    GROUP BY ALL
    HAVING sum(v.qt_votos_nominais) > 0
),

-- oferta: a parcela de candidatos jovens que o eleitor tinha para escolher (vereador: a cidade;
-- deputado federal: o estado)
oferta AS (
    SELECT
        ano,
        sg_uf,
        coalesce(cod_ibge, -1) AS cod_ibge,
        100.0 * count(*) FILTER (WHERE ds_faixa = '18 A 29') / count(*) AS pc_candidatos_jovem,
        100.0 * count(*) FILTER (WHERE ds_faixa = '18 A 29' AND fl_eleito)
        / nullif(count(*) FILTER (WHERE fl_eleito), 0) AS pc_eleitos_jovem,
        avg(nr_idade) FILTER (WHERE fl_eleito) AS nr_idade_media_eleitos
    FROM q6_candidatura
    WHERE (ano IN (2018, 2022) AND cd_cargo = 6) OR (ano IN (2020, 2024) AND cd_cargo = 13)
    GROUP BY ALL
)

SELECT
    e.cod_ibge,
    e.nm_municipio,
    e.sg_uf,
    e.ano,
    v.cd_cargo,
    e.qt_aptos,
    e.nr_idade_media AS nr_idade_media_eleitorado,
    e.pc_aptos_jovem,
    e.pc_aptos_idoso,
    v.qt_votos,
    v.nr_idade_media_voto,
    v.pc_votos_jovem,
    v.pc_votos_idoso,
    o.pc_candidatos_jovem,
    o.pc_eleitos_jovem,          -- vereador: eleitos da cidade; deputado federal: do estado
    o.nr_idade_media_eleitos
FROM q6_eleitorado_municipio AS e
INNER JOIN voto AS v ON e.cod_ibge = v.cod_ibge AND e.ano = v.ano
INNER JOIN oferta AS o
    ON
        e.ano = o.ano
        AND (
            (v.cd_cargo = 13 AND e.cod_ibge = o.cod_ibge)
            OR (v.cd_cargo = 6 AND o.cod_ibge = -1 AND e.sg_uf = o.sg_uf)
        );

-- Correlação entre a idade do eleitorado e a idade de quem recebeu o voto, por eleição: nos 6
-- estados juntos ('TODAS') e dentro de cada estado (tira o efeito de MA e AM serem jovens e RS velho)
CREATE OR REPLACE VIEW q6_voto_idade_correlacao AS
SELECT
    q.ano,
    q.cd_cargo,
    CASE WHEN r.fl_por_uf THEN q.sg_uf ELSE 'TODAS' END AS sg_uf,
    count(*) AS qt_municipios,
    corr(q.pc_aptos_jovem, q.pc_votos_jovem) AS vl_corr_jovem,
    corr(q.pc_aptos_idoso, q.pc_votos_idoso) AS vl_corr_idoso,
    corr(q.nr_idade_media_eleitorado, q.nr_idade_media_voto) AS vl_corr_idade_media,
    sum(q.pc_aptos_jovem * q.qt_aptos) / sum(q.qt_aptos) AS pc_aptos_jovem,
    sum(q.pc_votos_jovem * q.qt_votos) / sum(q.qt_votos) AS pc_votos_jovem,
    sum(q.pc_aptos_idoso * q.qt_aptos) / sum(q.qt_aptos) AS pc_aptos_idoso,
    sum(q.pc_votos_idoso * q.qt_votos) / sum(q.qt_votos) AS pc_votos_idoso
FROM q6_voto_idade AS q
CROSS JOIN (VALUES (TRUE), (FALSE)) AS r (fl_por_uf)
GROUP BY ALL;

-- ---------------------------------------------------------------------------
-- Alternância de poder: o prefeito eleito em 2016, 2020 e 2024, uma linha por município
-- ---------------------------------------------------------------------------
-- Renomeações, fusões e incorporações de partidos de 2017 a 2023. Sem elas, PMDB → MDB (2016 → 2020)
-- e DEM → União (2020 → 2024) contariam como troca de partido.
CREATE OR REPLACE TABLE q6_partido_sucessao AS
SELECT
    sg_partido,
    sg_sucessor,
    ano_mudanca::integer AS ano_mudanca,
    regra
FROM read_csv('dados/referencia/partido_sucessao.csv', delim = ';', header = TRUE, all_varchar = TRUE);

-- sg_partido_seguinte: o nome que o partido do prefeito tinha na eleição seguinte (ano + 4). Duas
-- voltas, para cadeias como PRP → Patriota → PRD.
CREATE OR REPLACE VIEW q6_prefeito AS
SELECT
    c.cod_ibge,
    c.ano,
    c.nr_titulo_eleitoral,
    c.sg_partido,
    c.nr_idade,
    coalesce(s2.sg_sucessor, s1.sg_sucessor, c.sg_partido) AS sg_partido_seguinte
FROM q6_candidatura AS c
LEFT JOIN q6_partido_sucessao AS s1
    ON c.sg_partido = s1.sg_partido AND c.ano < s1.ano_mudanca AND s1.ano_mudanca <= c.ano + 4
LEFT JOIN q6_partido_sucessao AS s2
    ON s1.sg_sucessor = s2.sg_partido AND s1.ano_mudanca < s2.ano_mudanca AND s2.ano_mudanca <= c.ano + 4
WHERE c.cd_cargo = 11 AND c.fl_eleito
QUALIFY count(*) OVER (PARTITION BY c.cod_ibge, c.ano) = 1;  -- cidade com 2 "eleitos" fica de fora

CREATE OR REPLACE VIEW q6_municipio AS
WITH pref AS (
    SELECT
        cod_ibge,
        max(sg_partido) FILTER (WHERE ano = 2016) AS sg_partido_2016,
        max(sg_partido) FILTER (WHERE ano = 2020) AS sg_partido_2020,
        max(sg_partido) FILTER (WHERE ano = 2024) AS sg_partido_2024,
        max(sg_partido_seguinte) FILTER (WHERE ano = 2016) AS sg_partido_2016_em_2020,
        max(sg_partido_seguinte) FILTER (WHERE ano = 2020) AS sg_partido_2020_em_2024,
        max(nr_titulo_eleitoral) FILTER (WHERE ano = 2016) AS nr_titulo_2016,
        max(nr_titulo_eleitoral) FILTER (WHERE ano = 2020) AS nr_titulo_2020,
        max(nr_titulo_eleitoral) FILTER (WHERE ano = 2024) AS nr_titulo_2024,
        max(nr_idade) FILTER (WHERE ano = 2024) AS nr_idade_prefeito_2024
    FROM q6_prefeito
    GROUP BY cod_ibge
),

-- o prefeito eleito tentou de novo a mesma prefeitura na eleição seguinte?
concorreu AS (
    SELECT
        p.cod_ibge,
        p.ano + 4 AS ano,
        count(c.id_candidatura) > 0 AS fl_concorreu
    FROM q6_prefeito AS p
    LEFT JOIN q6_candidatura AS c
        ON
            p.cod_ibge = c.cod_ibge
            AND c.ano = p.ano + 4
            AND c.cd_cargo = 11
            AND p.nr_titulo_eleitoral = c.nr_titulo_eleitoral
    WHERE p.ano IN (2016, 2020)
    GROUP BY ALL
),

vereador AS (
    SELECT
        cod_ibge,
        avg(nr_idade) AS nr_idade_media_vereadores_2024,
        100.0 * count(*) FILTER (WHERE ds_faixa = '18 A 29') / count(*) AS pc_vereadores_jovem_2024
    FROM q6_candidatura
    WHERE ano = 2024 AND cd_cargo = 13 AND fl_eleito
    GROUP BY cod_ibge
)

SELECT
    cm.cod_ibge,
    cm.nm_municipio,
    cm.sg_uf,
    cm.qt_populacao,
    cm.nr_idade_media AS nr_idade_media_populacao,
    cm.pc_jovem AS pc_populacao_jovem,
    cm.pc_idoso AS pc_populacao_idosa,
    cm.nr_terco,
    cm.nr_terco_uf,
    e.qt_aptos AS qt_aptos_2024,
    e.nr_idade_media AS nr_idade_media_eleitorado_2024,
    e.pc_aptos_jovem AS pc_eleitorado_jovem_2024,
    e.pc_abstencao_jovem AS pc_abstencao_jovem_2024,
    e.pc_abstencao_nao_jovem AS pc_abstencao_nao_jovem_2024,
    v.nr_idade_media_vereadores_2024,
    v.pc_vereadores_jovem_2024,
    p.nr_idade_prefeito_2024,
    p.sg_partido_2016,
    p.sg_partido_2020,
    p.sg_partido_2024,
    c20.fl_concorreu AS fl_prefeito_concorreu_2020,
    c24.fl_concorreu AS fl_prefeito_concorreu_2024,
    CASE cm.nr_terco WHEN 1 THEN 'MAIS JOVENS' WHEN 2 THEN 'INTERMEDIÁRIAS' ELSE 'MAIS VELHAS' END AS ds_terco,
    -- troca de partido: compara com o nome que o partido anterior tinha naquela eleição
    p.sg_partido_2020 <> p.sg_partido_2016_em_2020 AS fl_troca_partido_2020,
    p.sg_partido_2024 <> p.sg_partido_2020_em_2024 AS fl_troca_partido_2024,
    p.nr_titulo_2020 = p.nr_titulo_2016 AS fl_prefeito_reeleito_2020,
    p.nr_titulo_2024 = p.nr_titulo_2020 AS fl_prefeito_reeleito_2024
FROM q6_censo_municipio AS cm
LEFT JOIN q6_eleitorado_municipio AS e ON cm.cod_ibge = e.cod_ibge AND e.ano = 2024
LEFT JOIN vereador AS v ON cm.cod_ibge = v.cod_ibge
LEFT JOIN pref AS p ON cm.cod_ibge = p.cod_ibge
LEFT JOIN concorreu AS c20 ON cm.cod_ibge = c20.cod_ibge AND c20.ano = 2020
LEFT JOIN concorreu AS c24 ON cm.cod_ibge = c24.cod_ibge AND c24.ano = 2024;

-- Resumo por terço de idade: a resposta da pergunta, uma linha por corte, terço e eleição
-- municipal (2020, 2024). ds_corte = '6 UFS' (terços entre todas as cidades) ou 'NA UF' (terços
-- dentro de cada estado). Idades da população, do eleitorado e dos eleitos: Censo 2022 e 2024.
CREATE OR REPLACE VIEW q6_resumo AS
WITH t AS (
    SELECT
        c.ds_corte,
        a.ano,
        m.cod_ibge,
        m.qt_populacao,
        m.nr_idade_media_populacao,
        m.nr_idade_media_eleitorado_2024,
        m.nr_idade_media_vereadores_2024,
        m.nr_idade_prefeito_2024,
        CASE c.ds_corte WHEN '6 UFS' THEN m.nr_terco ELSE m.nr_terco_uf END AS nr_terco,
        CASE a.ano WHEN 2020 THEN m.fl_troca_partido_2020 ELSE m.fl_troca_partido_2024 END AS fl_troca_partido,
        CASE a.ano WHEN 2020 THEN m.fl_prefeito_concorreu_2020 ELSE m.fl_prefeito_concorreu_2024 END
            AS fl_concorreu,
        CASE a.ano WHEN 2020 THEN m.fl_prefeito_reeleito_2020 ELSE m.fl_prefeito_reeleito_2024 END AS fl_reeleito
    FROM q6_municipio AS m
    CROSS JOIN (VALUES ('6 UFS'), ('NA UF')) AS c (ds_corte)
    CROSS JOIN (VALUES (2020), (2024)) AS a (ano)
)

SELECT
    t.ds_corte,
    t.nr_terco,
    t.ano,
    CASE t.nr_terco WHEN 1 THEN 'MAIS JOVENS' WHEN 2 THEN 'INTERMEDIÁRIAS' ELSE 'MAIS VELHAS' END AS ds_terco,
    count(*) AS qt_municipios,
    min(t.nr_idade_media_populacao) AS nr_idade_media_populacao_min,
    max(t.nr_idade_media_populacao) AS nr_idade_media_populacao_max,
    sum(t.nr_idade_media_populacao * t.qt_populacao) / sum(t.qt_populacao) AS nr_idade_media_populacao,
    avg(t.nr_idade_media_eleitorado_2024) AS nr_idade_media_eleitorado_2024,
    avg(t.nr_idade_media_vereadores_2024) AS nr_idade_media_vereadores_2024,
    avg(t.nr_idade_prefeito_2024) AS nr_idade_media_prefeito_2024,
    count(t.fl_troca_partido) AS qt_com_prefeito_nos_dois_anos,
    100.0 * count(*) FILTER (WHERE t.fl_troca_partido) / count(t.fl_troca_partido) AS pc_troca_partido,
    100.0 * count(*) FILTER (WHERE t.fl_concorreu) / count(t.fl_concorreu) AS pc_prefeito_concorreu,
    100.0 * count(*) FILTER (WHERE t.fl_reeleito) / count(*) FILTER (WHERE t.fl_concorreu)
        AS pc_reeleito_entre_os_que_concorreram,
    -- voto para vereador (q6_voto_idade), somado no terço
    sum(q.pc_aptos_jovem * q.qt_aptos) / sum(q.qt_aptos) AS pc_aptos_jovem,
    sum(q.pc_votos_jovem * q.qt_votos) / sum(q.qt_votos) AS pc_votos_jovem,
    sum(q.pc_aptos_idoso * q.qt_aptos) / sum(q.qt_aptos) AS pc_aptos_idoso,
    sum(q.pc_votos_idoso * q.qt_votos) / sum(q.qt_votos) AS pc_votos_idoso,
    sum(q.nr_idade_media_voto * q.qt_votos) / sum(q.qt_votos) AS nr_idade_media_voto
FROM t
LEFT JOIN q6_voto_idade AS q ON t.cod_ibge = q.cod_ibge AND t.ano = q.ano
GROUP BY t.ds_corte, t.nr_terco, t.ano;
