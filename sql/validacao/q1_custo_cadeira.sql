-- validacao/q1_custo_cadeira.sql — checagens do custo da cadeira (Q1).
--
-- Cada consulta deve voltar VAZIA, salvo as exceções conhecidas anotadas em V4, V5 e V6.
-- Fica fora de sql/*.sql de propósito: o carregar_staging.py não roda esta pasta.
-- Rodar no notebook ou no duckdb, depois de 01, 02, 06, 14 e 22_q1.

-- V1. Uma linha por candidatura na base (o join com despesa e receita não duplica).
SELECT
    'V1 candidatura repetida' AS checagem,
    id_candidatura,
    count(*) AS qt
FROM q1_candidatura
GROUP BY id_candidatura
HAVING count(*) > 1;

-- V2. A despesa fecha: o total da base é o da prestação de contas de 2018 a 2024, sem
--     as doações a outros candidatos (toda despesa acha a sua candidatura).
WITH prestacao AS (
    SELECT
        ano,
        sum(vr_despesa) AS vr_despesa
    FROM stg_despesa
    WHERE
        ano BETWEEN 2018 AND 2024
        AND coalesce(ds_tipo_despesa, '') <> 'DOACOES FINANCEIRAS A OUTROS CANDIDATOS/PARTIDOS'
    GROUP BY ano
),

base AS (
    SELECT
        ano,
        sum(vr_despesa) AS vr_despesa
    FROM q1_candidatura
    GROUP BY ano
)

SELECT
    'V2 despesa não fecha' AS checagem,
    p.ano,
    p.vr_despesa AS vr_prestacao,
    b.vr_despesa AS vr_base
FROM prestacao AS p
LEFT JOIN base AS b ON p.ano = b.ano
WHERE p.vr_despesa IS DISTINCT FROM b.vr_despesa;

-- V3. Nada se perde da base para as UEs: toda candidatura com gasto cai numa UE com
--     vaga. Só o presidente fica fora (a UE é o país, sem vaga por UF).
SELECT
    'V3 gasto sem vaga' AS checagem,
    c.ano,
    c.cd_cargo,
    count(*) AS qt_candidaturas,
    sum(c.vr_despesa) AS vr_despesa
FROM q1_candidatura AS c
LEFT JOIN q1_custo_ue AS u ON c.ano = u.ano AND c.sg_ue = u.sg_ue AND c.cd_cargo = u.cd_cargo
WHERE u.ano IS NULL AND c.cd_cargo <> 1 AND c.vr_despesa > 0
GROUP BY ALL;

-- V4. Cobertura: cada ano tem os 6 estados, e nos cargos municipais todos os municípios.
--     Exceção conhecida: MT em 2020 (141 de 142), sem Boa Esperança do Norte, criado
--     depois e com a primeira eleição em 2024.
SELECT
    'V4 cobertura' AS checagem,
    k.ano,
    k.ds_cargo,
    k.sg_uf,
    k.qt_ues,
    count(m.cod_ibge) AS qt_municipios
FROM q1_custo_cargo AS k
LEFT JOIN modelo.municipio AS m ON k.sg_uf = m.sg_uf
GROUP BY ALL
HAVING k.qt_ues <> CASE WHEN k.cd_cargo IN (11, 13) THEN count(m.cod_ibge) ELSE 1 END
UNION ALL
SELECT
    'V4 cobertura' AS checagem,
    ano,
    ds_cargo,
    'UFs' AS sg_uf,
    count(*) AS qt_ues,
    6 AS qt_municipios
FROM q1_custo_cargo
GROUP BY ALL
HAVING count(*) <> 6;

-- V5. Eleitos = vagas em cada UE.
--     Exceções conhecidas (35): o TSE não publicou eleito porque a eleição foi anulada,
--     cassada ou ficou sub judice, e a nova eleição é suplementar (fora pela R1). O custo
--     do eleito fica NULL ali (ou, no senado de MT, é o de um eleito só).
--       * 2018, senador, MT: 1 de 2 (a chapa de Selma Arruda foi cassada);
--       * 2020, prefeito: Coari (AM), Acorizal, Matupá e Torixoréu (MT), Cachoeirinha,
--         Pinheiro Machado, Putinga e São Francisco de Assis (RS);
--       * 2024, prefeito: os 9 municípios da V4 de q4_escolaridade.sql;
--       * 2024, vereador: os 17 municípios da V7 de q4_escolaridade.sql.
SELECT
    'V5 eleitos ≠ vagas' AS checagem,
    ano,
    ds_cargo,
    sg_uf,
    nm_ue,
    qt_eleitos,
    qt_vaga
FROM q1_custo_ue
WHERE qt_eleitos <> qt_vaga
ORDER BY ano, ds_cargo, sg_uf, nm_ue;

-- V6. No estado, o dinheiro público não passa do gasto. Num município pequeno pode
--     passar: o candidato recebeu o fundo e declarou menos despesa contratada.
--     Exceção conhecida: senador no AM em 2022 (102%).
SELECT
    'V6 público > gasto no estado' AS checagem,
    ano,
    sg_uf,
    ds_cargo,
    pc_publico
FROM q1_custo_cargo
WHERE pc_publico > 100;
