-- validacao/q2_patrimonio.sql — checagens da Q2 (patrimônio declarado × sucesso).
--
-- Cada consulta deve voltar VAZIA, salvo as exceções conhecidas anotadas em V6 e V8.
-- Fica fora de sql/*.sql de propósito: o carregar_staging.py não roda esta pasta.
-- Rodar no notebook ou no duckdb, depois de 00_modelo, 06_carga_nucleo, 13_ficha,
-- 14_q10 e 18_q2.

-- V1. As faixas somam exatamente a base sem os suspeitos (nada some nem duplica).
SELECT
    'V1 soma das faixas' AS checagem,
    (SELECT sum(qt_candidatos) FROM q2_faixa) AS soma_faixas,
    (
        SELECT count(*) FROM q2_candidatura
        WHERE NOT fl_suspeito
    ) AS base
WHERE (
    SELECT sum(qt_candidatos) FROM q2_faixa) <> (
    SELECT count(*) FROM q2_candidatura
    WHERE NOT fl_suspeito
);

-- V2. Uma linha por candidatura na base.
SELECT
    'V2 candidatura repetida' AS checagem,
    id_candidatura,
    count(*) AS qt
FROM q2_candidatura
GROUP BY id_candidatura
HAVING count(*) > 1;

-- V3. O patrimônio da base é a soma dos bens das mesmas candidaturas: o LEFT JOIN
--     com os bens não multiplica nem perde valor.
SELECT
    'V3 soma do patrimônio' AS checagem,
    (SELECT sum(vr_patrimonio) FROM q2_candidatura) AS soma_base,
    (
        SELECT sum(b.vr_bem) FROM modelo.bem_candidato AS b
        WHERE b.id_candidatura IN (SELECT q.id_candidatura FROM q2_candidatura AS q)
    ) AS soma_bens
WHERE
    (SELECT sum(vr_patrimonio) FROM q2_candidatura)
    <> (
        SELECT sum(b.vr_bem) FROM modelo.bem_candidato AS b
        WHERE b.id_candidatura IN (SELECT q.id_candidatura FROM q2_candidatura AS q)
    );

-- V4. Os quintos têm o mesmo tamanho dentro de cada ano e cargo (ntile: diferença
--     de no máximo 1 candidato entre o maior e o menor).
SELECT
    'V4 quintos desiguais' AS checagem,
    ano,
    ds_cargo,
    min(qt) AS menor,
    max(qt) AS maior
FROM (
    SELECT
        ano,
        ds_cargo,
        nr_faixa,
        count(*) AS qt
    FROM q2_candidatura
    WHERE nr_faixa BETWEEN 1 AND 5
    GROUP BY ALL
) AS t
GROUP BY ALL
HAVING max(qt) - min(qt) > 1 OR count(*) <> 5;

-- V5. Cobertura: as 6 UFs aparecem em todo ano e cargo com candidatos nas 6.
SELECT
    'V5 UF faltando' AS checagem,
    ano,
    ds_cargo,
    list(DISTINCT sg_uf ORDER BY sg_uf) AS ufs
FROM q2_candidatura
GROUP BY ALL
HAVING count(DISTINCT sg_uf) <> 6;

-- V6. Declarações suspeitas (um bem de R$ 100 milhões ou mais): ficam fora das faixas.
--     EXCEÇÃO CONHECIDA, não é erro de carga: 22 candidaturas em 2018–2024
--       vereador 13 · prefeito 4 · governador 3 · deputado estadual 2
--     A maioria é erro de digitação (vereador com casa de R$ 250 milhões que declara
--     R$ 0,3 milhão na eleição seguinte). Algumas parecem reais (governador de MT com
--     ~R$ 110 milhões em 2018 e em 2022). Ver docs/q2-patrimonio.md.
SELECT
    'V6 suspeitos' AS checagem,
    ds_cargo,
    count(*) AS qt,
    count(*) FILTER (WHERE fl_eleito) AS qt_eleitos
FROM q2_candidatura
WHERE fl_suspeito
GROUP BY ds_cargo;

-- V7. Sensibilidade à regra de V6: devolver os suspeitos ao 5º quinto muda a taxa de
--     eleição de alguma faixa em mais de 0,5 ponto? (cargos com 100+ candidatos)
WITH com_suspeito AS (
    SELECT
        ano,
        ds_cargo,
        coalesce(nr_faixa, 5) AS nr_faixa,
        100.0 * count(*) FILTER (WHERE fl_eleito) / count(*) AS pc_taxa
    FROM q2_candidatura
    GROUP BY ALL
),

sem_suspeito AS (
    SELECT
        ano,
        ds_cargo,
        nr_faixa,
        100.0 * sum(qt_eleitos) / sum(qt_candidatos) AS pc_taxa
    FROM q2_faixa
    GROUP BY ALL
),

porte AS (
    SELECT
        ano,
        ds_cargo
    FROM q2_candidatura
    GROUP BY ALL
    HAVING count(*) >= 100
)

SELECT
    'V7 sensibilidade' AS checagem,
    s.ano,
    s.ds_cargo,
    s.nr_faixa,
    round(c.pc_taxa - s.pc_taxa, 2) AS diferenca
FROM sem_suspeito AS s
INNER JOIN com_suspeito AS c ON s.ano = c.ano AND s.ds_cargo = c.ds_cargo AND s.nr_faixa = c.nr_faixa
INNER JOIN porte AS p ON s.ano = p.ano AND s.ds_cargo = p.ds_cargo
WHERE abs(c.pc_taxa - s.pc_taxa) > 0.5;

-- V8. Governador e senador: o número certo de eleitos por UF (1, ou 2 senadores em
--     2018). Confere fl_eleito e a UF derivada da UE.
--     EXCEÇÃO CONHECIDA: 2018 MT senador = 1. A segunda eleita foi cassada em 2019, e
--     o consulta_cand atual do TSE a grava como NÃO ELEITO / INAPTO.
SELECT
    'V8 eleitos por UF' AS checagem,
    ano,
    sg_uf,
    ds_cargo,
    count(*) FILTER (WHERE fl_eleito) AS eleitos
FROM q2_candidatura
WHERE ds_cargo IN ('GOVERNADOR', 'SENADOR')
GROUP BY ALL
HAVING count(*) FILTER (WHERE fl_eleito) <> CASE WHEN ds_cargo = 'SENADOR' AND ano = 2018 THEN 2 ELSE 1 END;
