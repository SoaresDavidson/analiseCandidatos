-- 05_marts_enrico.sql — uma view por pergunta: Q10, Q11, Q12.
--
-- Dono: Enrico. Depende de 01 a 04.
-- A camada visual lê só daqui; nenhum notebook deve tocar em dados/raw.
--
-- Recorte: a prestação de contas foi baixada só do Piauí (decisão ① do
-- estrategia.md), então Q10 e Q11 são do PI. A Q12 é nacional, porque o
-- consulta_cand é leve e vem inteiro — o filtro de UF fica no `sg_uf`.

-- ---------------------------------------------------------------------------
-- Q10 — eleito × não eleito × recurso público × privado
--
-- Grão: uma candidatura. Uma linha por candidato por eleição, com a receita
-- aberta por origem e o desfecho dele.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW mart_q10 AS
WITH receita AS (
    SELECT
        sq_candidato,
        ano,
        sum(vr_receita) AS vr_total,
        sum(vr_receita) FILTER (WHERE tp_origem = 'PUBLICO') AS vr_publico,
        sum(vr_receita) FILTER (WHERE tp_origem = 'PRIVADO') AS vr_privado,
        sum(vr_receita) FILTER (WHERE tp_origem = 'PROPRIO') AS vr_proprio,
        sum(vr_receita) FILTER (WHERE tp_origem = 'PARTIDARIO') AS vr_partidario,
        sum(vr_receita) FILTER (WHERE tp_origem = 'TRANSFERENCIA') AS vr_transferencia,
        count(*) AS qt_receitas,
        count(DISTINCT cpf_cnpj_doador) AS qt_doadores
    FROM stg_receita_classificada
    GROUP BY sq_candidato, ano
)

SELECT
    c.ano,
    c.sg_uf,
    c.sg_ue,
    c.nm_ue,
    c.ds_cargo,
    c.sg_partido,
    c.nr_partido,
    c.nm_candidato,
    c.nr_titulo_eleitoral,
    c.sq_candidato,
    c.ds_sit_tot_turno,
    c.fl_eleito,
    coalesce(r.vr_total, 0) AS vr_total,
    coalesce(r.vr_publico, 0) AS vr_publico,
    coalesce(r.vr_privado, 0) AS vr_privado,
    coalesce(r.vr_proprio, 0) AS vr_proprio,
    coalesce(r.vr_partidario, 0) AS vr_partidario,
    coalesce(r.vr_transferencia, 0) AS vr_transferencia,
    coalesce(r.qt_receitas, 0) AS qt_receitas,
    coalesce(r.qt_doadores, 0) AS qt_doadores,
    -- derivada: a variável da pergunta. NULL quando não houve receita, para não
    -- inventar 0% de público em quem simplesmente não arrecadou.
    CASE WHEN r.vr_total > 0 THEN round(100.0 * r.vr_publico / r.vr_total, 2) END
        AS pc_publico
FROM candidatura AS c
LEFT JOIN receita AS r ON c.sq_candidato = r.sq_candidato AND c.ano = r.ano
-- só os anos e a UF com prestação de contas carregada
WHERE c.ano >= 2014 AND c.sg_uf = 'PI';

-- ---------------------------------------------------------------------------
-- Q11 — onde o candidato investe em propaganda
--
-- Grão: candidatura × canal. O texto livre (`ds_despesa`) fica em mart_q11_texto.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW mart_q11 AS
SELECT
    c.ano,
    c.sg_uf,
    c.sg_ue,
    c.nm_ue,
    c.ds_cargo,
    c.sg_partido,
    c.nm_candidato,
    c.sq_candidato,
    c.fl_eleito,
    d.ds_canal_propaganda AS ds_canal,
    d.ds_tipo_canonico AS ds_tipo_despesa,
    sum(d.vr_despesa) AS vr_despesa,
    count(*) AS qt_despesas,
    count(DISTINCT d.cpf_cnpj_fornecedor) AS qt_fornecedores
FROM stg_despesa_classificada AS d
INNER JOIN candidatura AS c ON d.sq_candidato = c.sq_candidato AND d.ano = c.ano
WHERE d.ds_canal_propaganda IS NOT NULL
GROUP BY ALL;

-- O texto livre que alimenta a nuvem de palavras. Uma linha por despesa de
-- propaganda; a tokenização fica no notebook, não no SQL.
CREATE OR REPLACE VIEW mart_q11_texto AS
SELECT
    d.ano,
    d.ds_canal_propaganda AS ds_canal,
    d.ds_tipo_canonico AS ds_tipo_despesa,
    d.vr_despesa,
    d.ds_despesa,
    d.cd_cnae_fornecedor,
    c.ds_cargo,
    c.sg_partido,
    c.fl_eleito
FROM stg_despesa_classificada AS d
INNER JOIN candidatura AS c ON d.sq_candidato = c.sq_candidato AND d.ano = c.ano
WHERE d.ds_canal_propaganda IS NOT NULL AND d.ds_despesa IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Q12 — linha do tempo do político, 2002–2026
--
-- Grão: uma pessoa. Só quem tem título válido; quem não tem não entra, porque
-- sem chave não há linha do tempo.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW mart_q12 AS
-- ⚠️ Nada de juntar `nm_ue` aqui. O par (sg_ue, nm_ue) é 1-para-muitos: 5.597
-- unidades eleitorais produzem 8.070 pares, porque a grafia do nome muda entre
-- anos. Um LEFT JOIN por sg_ue multiplica as linhas e a pessoa passa a ter mais
-- eleições do que teve — medido: 26 eleições numa série de 13, e a reincidência
-- saltando de 32,3% para 61,2%. O nome do município mora em MUNICIPIO, que é do
-- módulo do Davi; aqui fica só o código.
WITH por_eleicao AS (
    -- uma linha por pessoa por eleição: quem aparece em dois turnos, ou em dois
    -- cargos no mesmo ano, não vira duas eleições
    SELECT DISTINCT
        nr_titulo_eleitoral,
        ano
    FROM candidatura
    WHERE nr_titulo_eleitoral IS NOT NULL
),

detalhe AS (
    -- o detalhe de cada eleição, já reduzido a uma linha por (pessoa, ano):
    -- fica a candidatura de maior cargo, que é a principal daquele ano
    SELECT * EXCLUDE (rn) FROM (
        SELECT
            nr_titulo_eleitoral,
            ano,
            sg_uf,
            sg_ue,
            ds_cargo,
            sg_partido,
            nr_partido,
            fl_eleito,
            row_number() OVER (
                PARTITION BY nr_titulo_eleitoral, ano
                ORDER BY fl_eleito DESC, cd_cargo ASC
            ) AS rn
        FROM candidatura
        WHERE nr_titulo_eleitoral IS NOT NULL
    )
    WHERE rn = 1
)

SELECT
    p.nr_titulo_eleitoral,
    p.nm_candidato,
    p.dt_nascimento,
    p.ds_genero,
    p.ds_cor_raca,
    count(*) AS qt_eleicoes,
    sum(e.fl_eleito::INTEGER) AS qt_eleito,
    min(e.ano) AS ano_primeira,
    max(e.ano) AS ano_ultima,
    max(e.ano) - min(e.ano) AS anos_carreira,
    count(DISTINCT e.nr_partido) AS qt_partidos,
    count(DISTINCT e.ds_cargo) AS qt_cargos,
    count(DISTINCT e.sg_ue) AS qt_unidades_eleitorais,
    list(DISTINCT e.sg_uf) AS ufs,
    -- a trajetória em si, em ordem cronológica
    list(
        struct_pack(
            ano := e.ano, cargo := e.ds_cargo, partido := e.sg_partido,
            sg_ue := e.sg_ue, eleito := e.fl_eleito
        ) ORDER BY e.ano
    )
        AS trajetoria
FROM detalhe AS e
INNER JOIN politico AS p ON e.nr_titulo_eleitoral = p.nr_titulo_eleitoral
GROUP BY ALL;
