-- validacao/q8_q9.sql — checagens da Q8 (repasse público) e da Q9 (propaganda).
--
-- Cada consulta deve voltar VAZIA, salvo as exceções conhecidas anotadas em V4, V5 e V8.
-- Fica fora de sql/*.sql de propósito: o carregar_staging.py não roda esta pasta.
-- Rodar no notebook ou no duckdb, depois de 01 a 05, 11_q8 e 12_q9.

-- V1. As faixas da Q8 somam exatamente a base (nada some nem duplica no GROUP BY).
SELECT
    'V1 soma das faixas' AS checagem,
    (SELECT sum(qt_candidatos) FROM q8_faixa) AS soma_faixas,
    (SELECT count(*) FROM q8_candidatura) AS base
WHERE (SELECT sum(qt_candidatos) FROM q8_faixa) <> (SELECT count(*) FROM q8_candidatura);

-- V2. Os dois grupos do corte de 50% somam a base, e o grupo bate com a faixa:
--     "mais público" é exatamente quem está da faixa 11 ([50, 55)) para cima.
SELECT
    'V2 grupo × faixa' AS checagem,
    tp_dependencia,
    nr_faixa,
    count(*) AS qt
FROM q8_candidatura
WHERE
    tp_dependencia IS NULL
    OR (tp_dependencia = 'MAIS PUBLICO') <> (nr_faixa >= 11)
GROUP BY ALL;

-- V3. Governador e senador: o número certo de eleitos por UF (1, ou 2 senadores
--     em 2018). Confere que fl_eleito e o recorte de UF estão certos.
SELECT
    'V3 eleitos por UF' AS checagem,
    ano,
    sg_uf,
    ds_cargo,
    count(*) FILTER (WHERE fl_eleito) AS eleitos
FROM mart_q8
WHERE fl_divulgado AND ds_cargo IN ('GOVERNADOR', 'SENADOR')
GROUP BY ALL
HAVING count(*) FILTER (WHERE fl_eleito) <> CASE WHEN ds_cargo = 'SENADOR' AND ano = 2018 THEN 2 ELSE 1 END;

-- V4. Eleitos sem nenhuma receita declarada: ficam fora da Q8 (sem receita não
--     há % público). EXCEÇÃO CONHECIDA, não é erro de carga:
--       2018 senador 1 · 2020 prefeito 20, vereador 343 · 2022 dep. estadual 1 ·
--       2024 prefeito 2, vereador 164
--     São prestações sem receita lançada (contas não prestadas ou entregues
--     zeradas). 343 de 12.800 vereadores eleitos em 2020 = 2,7%.
SELECT
    'V4 eleito sem receita' AS checagem,
    ano,
    ds_cargo,
    count(*) AS eleitos_sem_receita
FROM mart_q8
WHERE
    fl_divulgado
    AND fl_eleito
    AND vr_total = 0
    AND ds_cargo IN ('VEREADOR', 'PREFEITO', 'DEPUTADO ESTADUAL', 'DEPUTADO FEDERAL', 'SENADOR', 'GOVERNADOR')
GROUP BY ALL;

-- V5. Receita absurda: nenhuma candidatura passa de R$ 20 milhões (a maior
--     campanha de governador das 6 UFs em 2022 fica abaixo disso).
--     EXCEÇÃO CONHECIDA: 12 vereadores do AM em 2020, com R$ 207 milhões cada,
--     todos de "RECURSOS DE PARTIDO POLITICO / OUTROS RECURSOS". É erro de
--     digitação na prestação. Ficam na base (são "MAIS OUTRAS FONTES" de
--     qualquer jeito e mudam 12 de 88 mil candidatos), mas distorcem qualquer
--     SOMA de valor de 2020: para valores, filtre vr_total < 2e7.
SELECT
    'V5 receita absurda' AS checagem,
    ano,
    sg_uf,
    ds_cargo,
    nm_candidato,
    vr_total
FROM q8_candidatura
WHERE vr_total > 2e7;

-- V6. O % público está em [0, 100] e a faixa é coerente com ele.
SELECT
    'V6 % público fora da faixa' AS checagem,
    sq_candidato,
    pc_publico,
    nr_faixa
FROM q8_candidatura
WHERE
    pc_publico NOT BETWEEN 0 AND 100
    OR nr_faixa NOT BETWEEN 0 AND 21
    OR (nr_faixa = 0 AND vr_publico <> 0)
    OR (nr_faixa = 21 AND vr_publico < vr_total);

-- V7. 2026 não aparece em nenhuma view de interface (fica fora até o resultado
--     final e a prestação final, ver ano_divulgado em 05_marts_enrico.sql).
SELECT
    'V7 ano não divulgado' AS checagem,
    v.origem,
    v.ano
FROM (
    SELECT DISTINCT
        'q8_faixa' AS origem,
        ano
    FROM q8_faixa
    UNION ALL
    SELECT DISTINCT
        'q9_canal' AS origem,
        ano
    FROM q9_canal
    UNION ALL
    SELECT DISTINCT
        'q9_termo' AS origem,
        ano
    FROM q9_termo
) AS v
WHERE NOT ano_divulgado(v.ano);

-- V8. Os canais (q9_canal, que vem do mart_q9) e o texto livre (q9_despesa,
--     que vem do mart_q9_texto) contam as mesmas despesas. A nuvem só perde as
--     despesas sem descrição.
--     EXCEÇÃO CONHECIDA: 2022 tem 2 e 2024 tem 239 despesas de propaganda sem
--     `ds_despesa` (R$ 0,46 mi em 2024, 0,07% do total). 2018 e 2020 batem.
WITH c AS (
    SELECT
        ano,
        sum(qt_despesas) AS qt
    FROM q9_canal
    GROUP BY ano
),

d AS (
    SELECT
        ano,
        count(*) AS qt
    FROM q9_despesa
    GROUP BY ano
)

SELECT
    'V8 canal × texto' AS checagem,
    c.ano,
    c.qt AS qt_canal,
    d.qt AS qt_texto
FROM c FULL OUTER JOIN d ON c.ano = d.ano
WHERE c.qt IS DISTINCT FROM d.qt;

-- V9. Nenhuma palavra vazia sobrou na nuvem, e nenhum termo é curto demais.
SELECT
    'V9 termo inválido' AS checagem,
    termo,
    sum(qt_despesas) AS qt
FROM q9_termo
WHERE
    termo IN (SELECT p.termo FROM q9_palavra_vazia AS p)
    OR length(termo) < 3
GROUP BY termo;
