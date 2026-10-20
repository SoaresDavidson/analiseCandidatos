-- 18_q2_patrimonio.sql — Q2: taxa de sucesso eleitoral por patrimônio declarado.
--
-- "Qual a taxa de sucesso eleitoral por patrimônio declarado?" [E.P.]
--
-- Dono: Enrico. Mesma forma da Q8 (taxa de eleição por faixa, sempre dentro do
-- mesmo cargo), trocando o dinheiro da campanha pelos bens declarados ao TSE no
-- registro da candidatura. Para carregar, da RAIZ do repositório:
--
--     uv run python scripts/carregar_staging.py 00_limpeza 00_modelo 06_carga_nucleo 13_ficha 14_q10 18_q2
--
-- Lê modelo.candidatura (06), modelo.bem_candidato (13), q10_bem_tipo e q10_ipca (14).
-- As checagens estão em sql/validacao/q2_patrimonio.sql; o texto em docs/q2-patrimonio.md.
--
-- Decisões (o porquê está no doc):
--   * faixas = quintos do patrimônio DENTRO de cada cargo e ano. O patrimônio típico
--     muda 10× entre cargos (mediana de vereador ~R$ 100 mil, de senador ~R$ 900 mil):
--     faixas fixas em reais jogariam quase todo vereador nas faixas de baixo;
--   * quem não declarou nenhum bem com valor fica na faixa 0, "sem bens", e não
--     no 1º quinto: não declarar não é ser pobre;
--   * bem individual de R$ 100 milhões ou mais é tratado como suspeito de erro de
--     digitação (o TSE publica como veio). A candidatura sai das faixas, mas fica
--     na base com fl_suspeito, para a checagem contar quantos casos são.

-- ---------------------------------------------------------------------------
-- Base: uma linha por candidatura que entra na análise
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q2_candidatura AS
WITH bens AS (
    SELECT
        id_candidatura,
        sum(vr_bem) AS vr_patrimonio,
        count(*) AS qt_bens,
        max(vr_bem) AS vr_maior_bem
    FROM modelo.bem_candidato
    GROUP BY id_candidatura
),

base AS (
    SELECT
        c.id_candidatura,
        c.ano,
        c.sg_ue,
        cg.ds_cargo,
        c.nr_titulo_eleitoral,
        c.fl_eleito,
        -- a UF da candidatura: o município em eleição municipal, a própria UE
        -- (sigla do estado) em eleição geral
        coalesce(m.sg_uf, c.sg_ue) AS sg_uf,
        coalesce(b.vr_patrimonio, 0) AS vr_patrimonio,
        coalesce(b.vr_patrimonio, 0) * i.fator_2024 AS vr_patrimonio_2024,
        coalesce(b.qt_bens, 0) AS qt_bens,
        coalesce(b.vr_maior_bem >= 100000000, FALSE) AS fl_suspeito
    FROM modelo.candidatura AS c
    INNER JOIN modelo.cargo AS cg ON c.cd_cargo = cg.cd_cargo
    LEFT JOIN modelo.municipio AS m ON c.cod_ibge = m.cod_ibge
    LEFT JOIN bens AS b ON c.id_candidatura = b.id_candidatura
    LEFT JOIN q10_ipca AS i ON c.ano = i.ano
    WHERE
        c.ano IN (2018, 2020, 2022, 2024)                -- E.P.; 2026 fora
        AND cg.ds_cargo IN (
            'VEREADOR', 'PREFEITO', 'DEPUTADO ESTADUAL', 'DEPUTADO FEDERAL', 'SENADOR', 'GOVERNADOR'
        )                                                -- vices e suplentes herdam a chapa
        AND c.ds_sit_tot_turno IS NOT NULL               -- foi a voto (indeferido fica fora)
)

SELECT
    *,
    -- 0 = sem bens com valor; 1 a 5 = quintos dentro do cargo e ano; NULL = suspeito
    CASE
        WHEN fl_suspeito THEN NULL
        WHEN vr_patrimonio <= 0 THEN 0
        ELSE ntile(5) OVER (
            PARTITION BY ano, ds_cargo, (vr_patrimonio > 0 AND NOT fl_suspeito)
            ORDER BY vr_patrimonio, id_candidatura
        )
    END AS nr_faixa
FROM base;

-- ---------------------------------------------------------------------------
-- Os limites de cada quinto, em reais da época e de 2024, para o rótulo da página
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q2_limite AS
SELECT
    ano,
    ds_cargo,
    nr_faixa,
    min(vr_patrimonio) AS vr_min,
    max(vr_patrimonio) AS vr_max,
    min(vr_patrimonio_2024) AS vr_min_2024,
    max(vr_patrimonio_2024) AS vr_max_2024,
    median(vr_patrimonio_2024) AS vr_mediana_2024
FROM q2_candidatura
WHERE nr_faixa >= 1
GROUP BY ALL;

-- ---------------------------------------------------------------------------
-- Taxa de eleição por faixa: a view da página
--
-- Grão: ano × UF × cargo × faixa. As faixas são cortadas no conjunto das 6 UFs
-- (ano × cargo); a UF fica no grão para o filtro da página somar.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q2_faixa AS
SELECT
    ano,
    sg_uf,
    ds_cargo,
    nr_faixa,
    CASE nr_faixa
        WHEN 0 THEN 'SEM BENS'
        WHEN 1 THEN '1º QUINTO (MENOR)'
        WHEN 2 THEN '2º QUINTO'
        WHEN 3 THEN '3º QUINTO'
        WHEN 4 THEN '4º QUINTO'
        WHEN 5 THEN '5º QUINTO (MAIOR)'
    END AS ds_faixa,
    count(*) AS qt_candidatos,
    count(*) FILTER (WHERE fl_eleito) AS qt_eleitos,
    round(100.0 * count(*) FILTER (WHERE fl_eleito) / count(*), 1) AS pc_taxa_eleicao,
    sum(vr_patrimonio_2024) AS vr_patrimonio_2024
FROM q2_candidatura
WHERE nr_faixa IS NOT NULL
GROUP BY ALL;

-- ---------------------------------------------------------------------------
-- Qui-quadrado de independência (faixa × eleito), por ano e cargo
--
-- A estatística e os graus de liberdade; o p-valor sai da distribuição qui-quadrado,
-- que o DuckDB não tem (calculado no doc e na página). As 6 faixas, todas as UFs.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q2_quiquadrado AS
WITH tabela AS (
    SELECT
        ano,
        ds_cargo,
        nr_faixa,
        fl_eleito,
        count(*) AS qt_observado
    FROM q2_candidatura
    WHERE nr_faixa IS NOT NULL
    GROUP BY ALL
),

faixa AS (
    SELECT DISTINCT
        ano,
        ds_cargo,
        nr_faixa
    FROM tabela
),

desfecho AS (
    SELECT unnest([TRUE, FALSE]) AS fl_eleito
),

-- completa a tabela 6 × 2: uma faixa sem nenhum eleito também entra no teste
grade AS (
    SELECT
        f.ano,
        f.ds_cargo,
        f.nr_faixa,
        e.fl_eleito
    FROM faixa AS f
    CROSS JOIN desfecho AS e
),

completa AS (
    SELECT
        g.ano,
        g.ds_cargo,
        g.nr_faixa,
        g.fl_eleito,
        coalesce(t.qt_observado, 0) AS qt_observado
    FROM grade AS g
    LEFT JOIN tabela AS t
        ON
            g.ano = t.ano AND g.ds_cargo = t.ds_cargo
            AND g.nr_faixa = t.nr_faixa AND g.fl_eleito = t.fl_eleito
),

esperado AS (
    SELECT
        *,
        sum(qt_observado) OVER (PARTITION BY ano, ds_cargo, nr_faixa)
        * sum(qt_observado) OVER (PARTITION BY ano, ds_cargo, fl_eleito)
        / sum(qt_observado) OVER (PARTITION BY ano, ds_cargo) AS qt_esperado
    FROM completa
)

SELECT
    ano,
    ds_cargo,
    sum(qt_observado)::BIGINT AS qt_candidatos,
    count(DISTINCT nr_faixa) - 1 AS nr_graus_liberdade,
    sum((qt_observado - qt_esperado) ^ 2 / qt_esperado) AS vl_qui_quadrado,
    -- regra usual: o teste vale se toda célula esperada tem 5 ou mais
    min(qt_esperado) >= 5 AS fl_teste_valido
FROM esperado
GROUP BY ALL;

-- ---------------------------------------------------------------------------
-- Composição do patrimônio: eleitos × não eleitos
--
-- Grão: ano × cargo × eleito × grupo de bem. Duas medidas: a fatia do patrimônio
-- total do grupo em cada tipo de bem, e o % de candidatos que declarou aquele tipo.
-- Só quem declarou algum bem (faixas 1 a 5): "declarar" e "ter" são perguntas
-- diferentes, e quem não declara nada já aparece na faixa 0 da q2_faixa.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q2_composicao AS
WITH bens AS (
    SELECT
        q.ano,
        q.ds_cargo,
        q.fl_eleito,
        t.ds_grupo,
        sum(t.vr_bem) AS vr_bem,
        count(DISTINCT q.id_candidatura) AS qt_com_bem
    FROM q2_candidatura AS q
    INNER JOIN q10_bem_tipo AS t ON q.id_candidatura = t.id_candidatura
    WHERE q.nr_faixa >= 1
    GROUP BY ALL
),

grupo AS (
    SELECT
        ano,
        ds_cargo,
        fl_eleito,
        count(*) AS qt_candidatos
    FROM q2_candidatura
    WHERE nr_faixa >= 1
    GROUP BY ALL
)

SELECT
    b.ano,
    b.ds_cargo,
    b.fl_eleito,
    b.ds_grupo,
    b.vr_bem,
    b.qt_com_bem,
    round(100.0 * b.vr_bem / sum(b.vr_bem) OVER (PARTITION BY b.ano, b.ds_cargo, b.fl_eleito), 1)
        AS pc_do_patrimonio,
    round(100.0 * b.qt_com_bem / g.qt_candidatos, 1) AS pc_candidatos_com_bem
FROM bens AS b
INNER JOIN grupo AS g ON b.ano = g.ano AND b.ds_cargo = g.ds_cargo AND b.fl_eleito = g.fl_eleito;
