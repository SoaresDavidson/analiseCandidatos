-- 22_q1_custo_cadeira.sql — Q1: quanto custa uma cadeira? [E.P.]
--
-- Dono: Davi. Custo da cadeira = despesa de campanha de todos os candidatos do cargo
-- na UE ÷ vagas. Ao lado, o custo de quem ganhou: despesa dos eleitos ÷ eleitos.
-- Para carregar, da RAIZ do repositório:
--
--     uv run python -m scripts.coleta.coleta_tse recorte_remoto --uf AM,GO,MA,MT,RS,SE
--     uv run python -m scripts.coleta.coleta_ibge ipca
--     uv run python scripts/carregar_staging.py 00_limpeza 00_modelo 01_staging 02_fonte 06_carga_nucleo 14_q10 22_q1
--
-- Lê stg_despesa (01), stg_receita_classificada (02), modelo.candidatura e
-- modelo.vaga (06) e q10_ipca (14). As checagens estão em
-- sql/validacao/q1_custo_cadeira.sql; o texto em docs/q1-custo-cadeira.md.
--
-- Decisões (o porquê está no doc):
--   * gasto = DESPESA CONTRATADA (o que a campanha comprou), não a receita: receita
--     que sobra não elege ninguém e volta ao Tesouro ou ao partido, e a receita tem
--     erros de digitação grandes (vereadores de um município do AM em 2020 com
--     R$ 207 milhões cada);
--   * sem as doações a outros candidatos e partidos: esse dinheiro é gasto por quem
--     recebeu e já entra na despesa dele. Contar nos dois lados dobraria o real;
--   * a chapa conta junto: o vice-prefeito, o vice-governador e os suplentes de
--     senador entram no cargo do titular (eles quase não têm despesa própria);
--   * dinheiro público = Fundo Especial (FEFC) + Fundo Partidário, regra ① do
--     02_fonte_recurso.sql, e fica com quem gastou, como a despesa: cada candidato
--     soma o público que recebeu (do partido ou de outro candidato) e tira o que
--     repassou a outros candidatos. Assim o real repassado conta uma vez só, no cargo
--     de quem recebeu (o candidato a prefeito que passa fundo aos vereadores);
--   * pc_publico = público ÷ despesa: quanto do gasto o dinheiro público pagaria. A
--     receita, base natural, tem os erros de digitação acima;
--   * valores em reais da época e em reais de agosto de 2024 (IPCA).

-- ---------------------------------------------------------------------------
-- Base: uma linha por candidatura de 2018 a 2024, com o gasto e o dinheiro público
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q1_candidatura AS
WITH despesa AS (
    SELECT
        ano,
        sq_candidato,
        sum(vr_despesa) AS vr_despesa
    FROM stg_despesa
    WHERE coalesce(ds_tipo_despesa, '') <> 'DOACOES FINANCEIRAS A OUTROS CANDIDATOS/PARTIDOS'
    GROUP BY ano, sq_candidato
),

publico AS (
    -- o recebido entra com sinal +; o repassado a outro candidato, com sinal − no doador
    SELECT
        ano,
        sq_candidato,
        sum(vr_publico) AS vr_publico
    FROM (
        SELECT
            ano,
            sq_candidato,
            vr_receita AS vr_publico
        FROM stg_receita_classificada
        WHERE tp_origem = 'PUBLICO'
        UNION ALL
        SELECT
            ano,
            sq_candidato_doador AS sq_candidato,
            -vr_receita AS vr_publico
        FROM stg_receita_classificada
        WHERE tp_origem = 'PUBLICO' AND ds_origem LIKE 'RECURSOS DE OUTROS CANDIDATOS%' AND sq_candidato_doador > 0
    ) AS movimento
    GROUP BY ano, sq_candidato
)

SELECT
    c.id_candidatura,
    c.ano,
    c.sg_ue,
    c.cod_ibge,
    c.fl_eleito,
    c.cd_cargo AS cd_cargo_candidato,
    -- o cargo da vaga: vice e suplente vão para o titular
    CASE c.cd_cargo
        WHEN 4 THEN 3
        WHEN 9 THEN 5
        WHEN 10 THEN 5
        WHEN 12 THEN 11
        ELSE c.cd_cargo
    END AS cd_cargo,
    c.cd_cargo IN (4, 9, 10, 12) AS fl_vice,
    coalesce(d.vr_despesa, 0) AS vr_despesa,
    coalesce(r.vr_publico, 0) AS vr_publico
FROM modelo.candidatura AS c
LEFT JOIN despesa AS d ON c.ano = d.ano AND c.sq_candidato = d.sq_candidato
LEFT JOIN publico AS r ON c.ano = r.ano AND c.sq_candidato = r.sq_candidato
WHERE c.ano BETWEEN 2018 AND 2024;

-- ---------------------------------------------------------------------------
-- Custo da cadeira em cada UE: a página do município lê daqui
--
-- Grão: ano × UE × cargo com vaga (governador, senador, deputado federal e estadual
-- por UF; prefeito e vereador por município). Presidente fica fora: a UE é o país.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q1_custo_ue AS
WITH por_ue AS (
    SELECT
        ano,
        sg_ue,
        cd_cargo,
        any_value(cod_ibge) AS cod_ibge,
        count(*) FILTER (WHERE NOT fl_vice) AS qt_candidatos,
        count(*) FILTER (WHERE NOT fl_vice AND vr_despesa > 0) AS qt_candidatos_com_despesa,
        count(*) FILTER (WHERE NOT fl_vice AND fl_eleito) AS qt_eleitos,
        sum(vr_despesa) AS vr_despesa,
        sum(vr_despesa) FILTER (WHERE NOT fl_vice AND fl_eleito) AS vr_despesa_eleitos,
        sum(vr_publico) AS vr_publico
    FROM q1_candidatura
    GROUP BY ano, sg_ue, cd_cargo
),

vaga AS (
    SELECT
        e.ano,
        v.sg_ue,
        v.cd_cargo,
        sum(v.qt_vaga) AS qt_vaga
    FROM modelo.vaga AS v
    INNER JOIN modelo.eleicao AS e ON v.cd_eleicao = e.cd_eleicao
    GROUP BY ALL
)

SELECT
    u.ano,
    u.sg_ue,
    u.cod_ibge,
    u.cd_cargo,
    g.ds_cargo,
    v.qt_vaga,
    u.qt_candidatos,
    u.qt_candidatos_com_despesa,
    u.qt_eleitos,
    u.vr_despesa,
    u.vr_publico,
    coalesce(m.sg_uf, u.sg_ue) AS sg_uf,
    coalesce(m.nm_municipio, u.sg_ue) AS nm_ue,
    coalesce(u.vr_despesa_eleitos, 0) AS vr_despesa_eleitos,
    round(u.vr_despesa / v.qt_vaga, 2) AS vr_custo_cadeira,
    -- NULL quando o TSE não publicou eleito (eleição anulada ou sub judice)
    round(u.vr_despesa_eleitos / nullif(u.qt_eleitos, 0), 2) AS vr_custo_eleito,
    round(u.vr_publico / v.qt_vaga, 2) AS vr_publico_cadeira,
    round(100.0 * u.vr_publico / nullif(u.vr_despesa, 0), 2) AS pc_publico,
    -- os mesmos valores em reais de agosto de 2024
    round(u.vr_despesa / v.qt_vaga * i.fator_2024, 2) AS vr_custo_cadeira_2024,
    round(u.vr_despesa_eleitos / nullif(u.qt_eleitos, 0) * i.fator_2024, 2) AS vr_custo_eleito_2024,
    round(u.vr_publico / v.qt_vaga * i.fator_2024, 2) AS vr_publico_cadeira_2024,
    ano_divulgado(u.ano) AS fl_divulgado
FROM por_ue AS u
INNER JOIN vaga AS v ON u.ano = v.ano AND u.sg_ue = v.sg_ue AND u.cd_cargo = v.cd_cargo
INNER JOIN modelo.cargo AS g ON u.cd_cargo = g.cd_cargo
LEFT JOIN modelo.municipio AS m ON u.cod_ibge = m.cod_ibge
LEFT JOIN q10_ipca AS i ON u.ano = i.ano;

-- ---------------------------------------------------------------------------
-- A resposta: custo da cadeira por ano, UF e cargo
--
-- Grão: ano × UF × cargo. Nos cargos municipais o custo da UF é o gasto de todos os
-- municípios ÷ todas as vagas (o custo médio de uma cadeira no estado); a mediana
-- entre os municípios fica ao lado, porque a capital puxa a média.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q1_custo_cargo AS
SELECT
    u.ano,
    u.sg_uf,
    u.cd_cargo,
    u.ds_cargo,
    u.fl_divulgado,
    count(*) AS qt_ues,
    sum(u.qt_vaga) AS qt_vaga,
    sum(u.qt_candidatos) AS qt_candidatos,
    sum(u.qt_eleitos) AS qt_eleitos,
    sum(u.vr_despesa) AS vr_despesa,
    sum(u.vr_despesa_eleitos) AS vr_despesa_eleitos,
    sum(u.vr_publico) AS vr_publico,
    round(sum(u.vr_despesa) / sum(u.qt_vaga), 2) AS vr_custo_cadeira,
    round(sum(u.vr_despesa_eleitos) / nullif(sum(u.qt_eleitos), 0), 2) AS vr_custo_eleito,
    round(sum(u.vr_publico) / sum(u.qt_vaga), 2) AS vr_publico_cadeira,
    round(100.0 * sum(u.vr_publico) / nullif(sum(u.vr_despesa), 0), 2) AS pc_publico,
    round(median(u.vr_custo_cadeira), 2) AS vr_custo_cadeira_mediana,
    round(sum(u.vr_despesa) / sum(u.qt_vaga) * any_value(i.fator_2024), 2) AS vr_custo_cadeira_2024,
    round(sum(u.vr_despesa_eleitos) / nullif(sum(u.qt_eleitos), 0) * any_value(i.fator_2024), 2)
        AS vr_custo_eleito_2024,
    round(sum(u.vr_publico) / sum(u.qt_vaga) * any_value(i.fator_2024), 2) AS vr_publico_cadeira_2024,
    round(median(u.vr_custo_cadeira_2024), 2) AS vr_custo_cadeira_mediana_2024
FROM q1_custo_ue AS u
LEFT JOIN q10_ipca AS i ON u.ano = i.ano
GROUP BY u.ano, u.sg_uf, u.cd_cargo, u.ds_cargo, u.fl_divulgado;
