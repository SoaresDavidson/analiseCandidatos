-- 10_q4_escolaridade.sql — pergunta de escolaridade (candidato × população), 6 UFs, 2022 e 2024.
-- Lê só o schema `modelo`. Métrica de escolaridade do município: Censo 2022 (SIDRA 10061).

-- ---------------------------------------------------------------------------
-- Base: candidaturas que entram na análise
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q4_candidatura AS
SELECT
    c.id_candidatura,
    c.ano,
    c.cd_cargo,
    g.ds_cargo,
    c.cod_ibge,
    c.cd_grau_instrucao,
    gi.ds_grau_instrucao,
    gi.cd_nivel,                -- 1 a 4, a escala do Censo (de-para GRAU_INSTRUCAO)
    c.fl_eleito,
    -- eleição geral: sg_ue é a sigla da UF; municipal: a UF vem do município
    coalesce(m.sg_uf, c.sg_ue) AS sg_uf
FROM modelo.candidatura AS c
INNER JOIN modelo.cargo AS g ON c.cd_cargo = g.cd_cargo
INNER JOIN modelo.grau_instrucao AS gi ON c.cd_grau_instrucao = gi.cd_grau_instrucao
LEFT JOIN modelo.municipio AS m ON c.cod_ibge = m.cod_ibge
WHERE
    c.ano IN (2022, 2024)
    AND c.cd_cargo NOT IN (1, 2, 4, 9, 10, 12)       -- presidente, vices e suplentes
    AND c.ds_sit_tot_turno IS NOT NULL               -- foi a voto (indeferido fica fora)
    AND c.cd_grau_instrucao BETWEEN 1 AND 8          -- tira 0 e -4 (não informado)
    AND coalesce(m.sg_uf, c.sg_ue) IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE');

-- ---------------------------------------------------------------------------
-- Parte B — chance de ser eleito por grau (1 a 8), por ano e cargo
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q4_chance_por_grau AS
SELECT
    ano,
    ds_cargo,
    cd_grau_instrucao,
    ds_grau_instrucao,
    count(*) AS qt_candidatos,
    count(*) FILTER (WHERE fl_eleito) AS qt_eleitos,
    round(100.0 * count(*) FILTER (WHERE fl_eleito) / count(*), 1) AS pc_taxa_eleicao
FROM q4_candidatura
GROUP BY ano, ds_cargo, cd_grau_instrucao, ds_grau_instrucao;

-- ---------------------------------------------------------------------------
-- Parte A — perfil: população 18+ × candidatos × eleitos, nos 4 níveis, por UF
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q4_perfil_uf AS
WITH contagem AS (
    SELECT
        ano,
        sg_uf,
        'Candidatos' AS grupo,
        cd_nivel,
        count(*) AS qt
    FROM q4_candidatura
    GROUP BY ano, sg_uf, cd_nivel
    UNION ALL
    SELECT
        ano,
        sg_uf,
        'Eleitos' AS grupo,
        cd_nivel,
        count(*) AS qt
    FROM q4_candidatura
    WHERE fl_eleito
    GROUP BY ano, sg_uf, cd_nivel
    UNION ALL
    -- o Censo é de 2022 e serve às duas eleições
    SELECT
        a.ano,
        m.sg_uf,
        'População 18+ (Censo 2022)' AS grupo,
        ci.cd_nivel,
        sum(ci.qt_pessoas) AS qt
    FROM modelo.censo_instrucao AS ci
    INNER JOIN modelo.municipio AS m ON ci.cod_ibge = m.cod_ibge
    CROSS JOIN (VALUES (2022), (2024)) AS a (ano)
    WHERE ci.ano_censo = 2022 AND m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
    GROUP BY a.ano, m.sg_uf, ci.cd_nivel
)

SELECT
    k.ano,
    k.sg_uf,
    k.grupo,
    n.cd_nivel,
    n.ds_nivel,
    k.qt,
    round(100.0 * k.qt / sum(k.qt) OVER (PARTITION BY k.ano, k.sg_uf, k.grupo), 1) AS pc
FROM contagem AS k
INNER JOIN modelo.nivel_instrucao AS n ON k.cd_nivel = n.cd_nivel;

-- ---------------------------------------------------------------------------
-- Parte C — locais (2024): cada município, população × eleitos (prefeito e vereadores)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q4_municipio_nivel AS
WITH pop AS (
    SELECT
        ci.cod_ibge,
        ci.cd_nivel,
        sum(ci.qt_pessoas) AS qt
    FROM modelo.censo_instrucao AS ci
    WHERE ci.ano_censo = 2022
    GROUP BY ci.cod_ibge, ci.cd_nivel
),

eleitos AS (
    SELECT
        cod_ibge,
        cd_nivel,
        count(*) AS qt
    FROM q4_candidatura
    WHERE ano = 2024 AND fl_eleito AND cd_cargo IN (11, 13)   -- prefeito, vereador
    GROUP BY cod_ibge, cd_nivel
),

grade AS (   -- todo município × os 4 níveis, para nível sem ninguém valer 0
    SELECT
        m.cod_ibge,
        m.nm_municipio,
        m.sg_uf,
        n.cd_nivel,
        n.ds_nivel
    FROM modelo.municipio AS m
    CROSS JOIN modelo.nivel_instrucao AS n
    WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
)

SELECT
    g.sg_uf,
    g.cod_ibge,
    g.nm_municipio,
    g.cd_nivel,
    g.ds_nivel,
    coalesce(p.qt, 0) AS qt_populacao,
    coalesce(e.qt, 0) AS qt_eleitos,
    round(100.0 * coalesce(p.qt, 0) / nullif(sum(coalesce(p.qt, 0)) OVER w, 0), 1) AS pc_populacao,
    round(100.0 * coalesce(e.qt, 0) / nullif(sum(coalesce(e.qt, 0)) OVER w, 0), 1) AS pc_eleitos
FROM grade AS g
LEFT JOIN pop AS p ON g.cod_ibge = p.cod_ibge AND g.cd_nivel = p.cd_nivel
LEFT JOIN eleitos AS e ON g.cod_ibge = e.cod_ibge AND g.cd_nivel = e.cd_nivel
WINDOW w AS (PARTITION BY g.cod_ibge);

-- Uma linha por município: moda (frase de impacto) + indicador contínuo (dispersão).
CREATE OR REPLACE VIEW q4_municipio AS
WITH moda AS (
    SELECT
        cod_ibge,
        -- moda; empate vai para o nível MENOR e fica sinalizado
        arg_max(cd_nivel, qt_populacao * 10 - cd_nivel) AS cd_nivel_moda_populacao,
        CASE WHEN max(qt_eleitos) > 0 THEN arg_max(cd_nivel, qt_eleitos * 10 - cd_nivel) END AS cd_nivel_moda_eleitos,
        count(*) FILTER (WHERE qt_eleitos = max_eleitos AND max_eleitos > 0) > 1 AS fl_empate_eleitos
    FROM (
        SELECT
            *,
            max(qt_eleitos) OVER (PARTITION BY cod_ibge) AS max_eleitos
        FROM q4_municipio_nivel
    ) AS t
    GROUP BY cod_ibge
)

SELECT
    v.sg_uf,
    v.cod_ibge,
    v.nm_municipio,
    np.ds_nivel AS ds_moda_populacao,
    ne.ds_nivel AS ds_moda_eleitos,
    mo.fl_empate_eleitos,
    sum(v.qt_eleitos) AS qt_eleitos,
    max(v.pc_populacao) FILTER (WHERE v.cd_nivel = 4) AS pc_populacao_superior,
    max(v.pc_eleitos) FILTER (WHERE v.cd_nivel = 4) AS pc_eleitos_superior,
    max(v.pc_populacao) FILTER (WHERE v.cd_nivel = 1) AS pc_populacao_nivel1,
    max(v.pc_eleitos) FILTER (WHERE v.cd_nivel = 1) AS pc_eleitos_nivel1
FROM q4_municipio_nivel AS v
INNER JOIN moda AS mo ON v.cod_ibge = mo.cod_ibge
INNER JOIN modelo.nivel_instrucao AS np ON mo.cd_nivel_moda_populacao = np.cd_nivel
LEFT JOIN modelo.nivel_instrucao AS ne ON mo.cd_nivel_moda_eleitos = ne.cd_nivel
GROUP BY ALL;
