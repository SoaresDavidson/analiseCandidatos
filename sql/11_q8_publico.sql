-- 11_q8_publico.sql — Q8: sucesso de quem depende mais de repasse público.
--
-- "Qual a diferença de sucesso entre candidatos que dependem mais de repasses
-- públicos em relação àqueles que são financiados por outras fontes?" [E.P.]
--
-- Dono: Enrico. Depende de 01 a 05 (lê só o mart_q8). Para carregar:
--
--     uv run scripts/carregar_staging.py 01_staging 02_fonte 03_tipo 04_politico 05_marts 11_q8
--
-- As views daqui alimentam o notebook (notebooks/q8_q9_interface.ipynb) e o
-- painel (scripts/gerar_painel_q8_q9.py). As checagens estão em
-- sql/validacao/q8_q9.sql.
--
-- "Repasse público" = Fundo Especial (FEFC) + Fundo Partidário, pela regra ① do
-- 02_fonte_recurso.sql. O % público é sobre a receita total do candidato.

-- ---------------------------------------------------------------------------
-- Base: candidaturas que entram na análise
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q8_candidatura AS
SELECT
    ano,
    sg_uf,
    sg_ue,
    nm_ue,
    ds_cargo,
    sg_partido,
    nm_candidato,
    sq_candidato,
    fl_eleito,
    vr_total,
    vr_publico,
    pc_publico,
    tp_dependencia,
    -- faixa de 5 pontos do % público. 0% e 100% exatos ganham faixa própria: são
    -- 20% a 50% dos candidatos, conforme o cargo, e somem dentro de "0 a 5%".
    --   0 = exatamente 0%, 1 = (0, 5), 2 = [5, 10), ..., 20 = [95, 100), 21 = 100%
    CASE
        WHEN vr_publico = 0 THEN 0
        WHEN vr_publico >= vr_total THEN 21
        -- divisão inteira em centavos: em ponto flutuante, 30,64 / 61,28 dá
        -- 0,4999… e o candidato de exatamente 50% cairia na faixa de baixo
        ELSE 1 + ((20 * vr_publico * 100)::HUGEINT // (vr_total * 100)::HUGEINT)::INTEGER
    END AS nr_faixa
FROM mart_q8
WHERE
    fl_divulgado                                     -- 2026 fora até o resultado final
    AND ds_cargo IN (
        'VEREADOR', 'PREFEITO', 'DEPUTADO ESTADUAL', 'DEPUTADO FEDERAL', 'SENADOR', 'GOVERNADOR'
    )                                                -- vices e suplentes herdam a chapa
    AND ds_sit_tot_turno IS NOT NULL                 -- foi a voto (indeferido fica fora)
    AND vr_total > 0;                                -- sem receita não há dependência a medir

-- ---------------------------------------------------------------------------
-- Taxa de eleição por faixa de % público
--
-- É a view do painel: com as 22 faixas ele recalcula qualquer corte (o controle
-- deslizante) e também desenha a taxa faixa a faixa.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q8_faixa AS
SELECT
    ano,
    sg_uf,
    ds_cargo,
    nr_faixa,
    -- limite inferior em %, para o corte: "mais público" = pc_inicio >= corte
    CASE nr_faixa WHEN 0 THEN 0 WHEN 21 THEN 100 ELSE 5 * (nr_faixa - 1) END AS pc_inicio,
    CASE nr_faixa
        WHEN 0 THEN '0%'
        WHEN 21 THEN '100%'
        ELSE (5 * (nr_faixa - 1))::VARCHAR || '–' || (5 * nr_faixa)::VARCHAR || '%'
    END AS ds_faixa,
    count(*) AS qt_candidatos,
    count(*) FILTER (WHERE fl_eleito) AS qt_eleitos,
    sum(vr_total) AS vr_total,
    sum(vr_publico) AS vr_publico
FROM q8_candidatura
GROUP BY ALL;

-- ---------------------------------------------------------------------------
-- Os dois grupos no corte de 50% (o do mart): a resposta direta à pergunta
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q8_taxa AS
SELECT
    ano,
    sg_uf,
    ds_cargo,
    tp_dependencia,
    count(*) AS qt_candidatos,
    count(*) FILTER (WHERE fl_eleito) AS qt_eleitos,
    round(100.0 * count(*) FILTER (WHERE fl_eleito) / count(*), 1) AS pc_taxa_eleicao,
    median(pc_publico) AS pc_publico_mediana
FROM q8_candidatura
GROUP BY ALL;
