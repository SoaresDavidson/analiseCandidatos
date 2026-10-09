-- 05_marts_enrico.sql — uma view por pergunta: Q8 e Q9.
--
-- Dono: Enrico. Depende de 01 a 04.
-- A camada visual lê só daqui; nenhum notebook deve tocar em dados/raw.
--
-- Numeração da lista de 10 perguntas entregue ao professor:
--   Q8  diferença de sucesso entre quem depende mais de repasse público e quem é
--       financiado por outras fontes (era a Q10 da lista de 12)
--   Q9  onde o candidato investe em propaganda (era a Q11)
-- A linha do tempo do político (Q12 antiga, Q10 nova) é do Eduardo, em
-- 07_q10_carreira.sql; o mart_q12 que morava aqui saiu.
--
-- Recorte: os anos e as UFs com prestação de contas no disco (2018–2026, as UFs
-- extraídas com `--uf`). `candidatura` (04) pode ter mais UFs e anos; os marts
-- filtram pelo que a prestação traz, sem lista de UF escrita aqui.

-- 2026 fica no escopo, mas indisponível para visualização até o TSE publicar o
-- resultado completo e a prestação de contas final (decisão do grupo). Quando
-- publicar, troque 2024 por 2026 aqui e recarregue: é o único lugar.
CREATE OR REPLACE MACRO ano_divulgado(a) AS a <= 2024;

-- ---------------------------------------------------------------------------
-- Q8 — sucesso × dependência de repasse público
--
-- Grão: uma candidatura. A receita aberta por origem, o percentual público e o
-- desfecho. "Repasse público" = Fundo Especial (FEFC) + Fundo Partidário, pela
-- regra ① do 02_fonte_recurso.sql.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW mart_q8 AS
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
),

com_prestacao AS (
    -- os pares (ano, UF) que têm prestação de contas carregada
    SELECT DISTINCT
        ano,
        sg_uf
    FROM stg_receita
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
    c.ds_situacao_candidatura,
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
    -- derivada: NULL quando não houve receita, para não inventar 0% de público
    -- em quem simplesmente não arrecadou.
    CASE WHEN r.vr_total > 0 THEN round(100.0 * coalesce(r.vr_publico, 0) / r.vr_total, 2) END
        AS pc_publico,
    -- derivada: o grupo da pergunta. Corte em 50% — PROPOSTA, a confirmar com o
    -- grupo; `pc_publico` fica no mart para quem quiser outro corte (quartis…).
    CASE
        WHEN r.vr_total IS NULL OR r.vr_total <= 0 THEN NULL
        WHEN coalesce(r.vr_publico, 0) >= 0.5 * r.vr_total THEN 'MAIS PUBLICO'
        ELSE 'MAIS OUTRAS FONTES'
    END AS tp_dependencia,
    ano_divulgado(c.ano) AS fl_divulgado
FROM candidatura AS c
INNER JOIN com_prestacao AS p ON c.ano = p.ano AND c.sg_uf = p.sg_uf
LEFT JOIN receita AS r ON c.sq_candidato = r.sq_candidato AND c.ano = r.ano;

-- A resposta agregada: taxa de eleição de cada grupo, por ano, UF e cargo.
-- Só entra quem teve receita (sem receita não há dependência a medir).
CREATE OR REPLACE VIEW mart_q8_resumo AS
SELECT
    ano,
    sg_uf,
    ds_cargo,
    tp_dependencia,
    fl_divulgado,
    count(*) AS qt_candidatos,
    count(*) FILTER (WHERE fl_eleito) AS qt_eleitos,
    round(100.0 * count(*) FILTER (WHERE fl_eleito) / count(*), 2) AS pc_eleitos,
    sum(vr_total) AS vr_total,
    sum(vr_publico) AS vr_publico
FROM mart_q8
WHERE tp_dependencia IS NOT NULL
GROUP BY ALL;

-- ---------------------------------------------------------------------------
-- Q9 — onde o candidato investe em propaganda
--
-- Grão: candidatura × canal. O texto livre (`ds_despesa`) fica em mart_q9_texto.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW mart_q9 AS
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
    ano_divulgado(c.ano) AS fl_divulgado,
    sum(d.vr_despesa) AS vr_despesa,
    count(*) AS qt_despesas,
    count(DISTINCT d.cpf_cnpj_fornecedor) AS qt_fornecedores
FROM stg_despesa_classificada AS d
INNER JOIN candidatura AS c ON d.sq_candidato = c.sq_candidato AND d.ano = c.ano
WHERE d.ds_canal_propaganda IS NOT NULL
GROUP BY ALL;

-- O texto livre que alimenta a nuvem de palavras. Uma linha por despesa de
-- propaganda; a tokenização fica no notebook, não no SQL.
CREATE OR REPLACE VIEW mart_q9_texto AS
SELECT
    d.ano,
    c.sg_uf,
    d.ds_canal_propaganda AS ds_canal,
    d.ds_tipo_canonico AS ds_tipo_despesa,
    d.vr_despesa,
    d.ds_despesa,
    d.cd_cnae_fornecedor,
    c.ds_cargo,
    c.sg_partido,
    c.fl_eleito,
    ano_divulgado(d.ano) AS fl_divulgado
FROM stg_despesa_classificada AS d
INNER JOIN candidatura AS c ON d.sq_candidato = c.sq_candidato AND d.ano = c.ano
WHERE d.ds_canal_propaganda IS NOT NULL AND d.ds_despesa IS NOT NULL;
