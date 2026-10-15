-- validacao/q10_carreira.sql — checagens da Q10 (carreira do político).
--
-- Cada consulta deve voltar VAZIA, salvo as exceções conhecidas anotadas em V5, V10
-- e V11. Fica fora de sql/*.sql de propósito: o carregar_staging.py não roda esta
-- pasta. Rodar no notebook ou no duckdb, depois de 00_limpeza, 04_politico e 07_q10.

-- V1. A linha do tempo tem uma linha por pessoa × ano (a candidatura principal).
SELECT
    'V1 pessoa × ano repetido' AS checagem,
    nr_titulo_eleitoral,
    ano,
    count(*) AS qt
FROM q10_linha_do_tempo
GROUP BY ALL
HAVING count(*) > 1;

-- V2. No resumo, participações = vitórias + derrotas + sem resultado (nenhuma
--     candidatura cai fora das três classes; o resumo só usa anos divulgados).
SELECT
    'V2 participações não fecham' AS checagem,
    nr_titulo_eleitoral,
    qt_participacoes,
    qt_vitorias,
    qt_derrotas,
    qt_sem_resultado
FROM q10_carreira
WHERE qt_participacoes <> qt_vitorias + qt_derrotas + qt_sem_resultado;

-- V3. Reeleição só existe com vitória e mandato anterior: todo reeleito é eleito e
--     tentou renovar, e ninguém tem tantas reeleições quanto vitórias (a primeira
--     vitória nunca é reeleição).
SELECT
    'V3 reeleição sem vitória' AS checagem,
    nr_titulo_eleitoral,
    ano,
    ds_cargo
FROM q10_candidatura
WHERE fl_reeleito AND NOT (fl_eleito AND fl_tentou_reeleicao)
UNION ALL
SELECT
    'V3 reeleições ≥ vitórias' AS checagem,
    nr_titulo_eleitoral,
    ano_ultima AS ano,
    ds_cargo_ultima AS ds_cargo
FROM q10_carreira
WHERE qt_vitorias > 0 AND qt_reeleicoes >= qt_vitorias;

-- V4. Entre duas participações seguidas da mesma pessoa passam 2, 4, 6... anos
--     (as ordinárias são de 2 em 2; ano ímpar ou zero indica suplementar ou duplicata).
SELECT
    'V4 intervalo inválido' AS checagem,
    anos_desde_anterior,
    count(*) AS qt
FROM q10_linha_do_tempo
WHERE anos_desde_anterior IS NOT NULL AND (anos_desde_anterior < 2 OR anos_desde_anterior % 2 <> 0)
GROUP BY ALL;

-- V5. Governador: 1 eleito por UF e ano. Senador: 1, ou 2 nos anos de renovação de
--     2/3 (2002, 2010, 2018). Confere fl_eleito e o recorte das 6 UFs.
--     Exceção conhecida (1): MT 2018 senador. Selma Arruda foi eleita e cassada; o
--     arquivo traz a candidatura dela como NÃO ELEITO (INAPTO), e a vaga foi preenchida
--     na suplementar de 2020 (Carlos Fávaro), que fica fora da Q10.
SELECT
    'V5 eleitos por UF' AS checagem,
    ano,
    sg_uf,
    ds_cargo,
    count(*) FILTER (WHERE fl_eleito) AS eleitos
FROM q10_candidatura
WHERE fl_divulgado AND cd_cargo IN (3, 5)
GROUP BY ALL
HAVING
    count(*) FILTER (WHERE fl_eleito)
    <> CASE WHEN cd_cargo = 5 AND ano IN (2002, 2010, 2018) THEN 2 ELSE 1 END;

-- V6. Prefeito: nenhum município tem mais de 1 eleito no mesmo ano (deve voltar vazio).
--     Município com 0 eleitos é exceção conhecida, não erro: 50 de 7.426 município × ano
--     (2004: 11, 2008: 9, 2012: 3, 2016: 10, 2020: 8, 2024: 9). São eleições anuladas ou
--     sub judice, com todos os candidatos #NULO ou NÃO ELEITO, refeitas em suplementar.
--     Em 2024 são os mesmos 9 da V4 da Q4 (Iporá, Americano do Brasil, Anajatuba, ...).
SELECT
    'V6 prefeitos eleitos > 1' AS checagem,
    ano,
    sg_uf,
    nm_ue,
    count(*) FILTER (WHERE fl_eleito) AS eleitos
FROM q10_candidatura
WHERE fl_divulgado AND cd_cargo = 11
GROUP BY ano, sg_uf, sg_ue, nm_ue
HAVING count(*) FILTER (WHERE fl_eleito) > 1;

-- V7. fl_divulgado segue a macro ano_divulgado (só 2026 fica fora), e "aguardando
--     2º turno" só aparece em ano não divulgado.
SELECT
    'V7 fl_divulgado' AS checagem,
    ano,
    resultado,
    count(*) AS qt
FROM q10_candidatura
WHERE fl_divulgado <> ano_divulgado(ano) OR (fl_divulgado AND resultado = 'AGUARDANDO 2º TURNO')
GROUP BY ALL;

-- V8. Parte C: os funis são encaixados. Reeleitos ⊆ tentaram ⊆ seguiram na política
--     ⊆ eleitos, em cada ano × UF × cargo.
SELECT
    'V8 funil da sobrevivência' AS checagem,
    ano,
    sg_uf,
    ds_cargo,
    qt_eleitos,
    qt_seguiram_na_politica,
    qt_tentaram_reeleicao,
    qt_reeleitos
FROM q10_sobrevivencia
WHERE NOT (
    qt_reeleitos <= qt_tentaram_reeleicao
    AND qt_tentaram_reeleicao <= qt_seguiram_na_politica
    AND qt_seguiram_na_politica <= qt_eleitos
);

-- V9. Parte B: a curva é encaixada (ainda eleito ⊆ ainda disputando ⊆ turma) e a
--     turma nunca cresce de um ciclo para o seguinte (só sai quem não chegou lá).
SELECT
    'V9 curva de sobrevivência' AS checagem,
    sg_uf,
    ds_cargo,
    nr_ciclo,
    qt_turma,
    qt_ainda_disputando,
    qt_ainda_eleitos
FROM q10_curva_sobrevivencia
QUALIFY
    NOT (qt_ainda_eleitos <= qt_ainda_disputando AND qt_ainda_disputando <= qt_turma)
    OR qt_turma > lag(qt_turma) OVER (PARTITION BY sg_uf, cd_cargo ORDER BY nr_ciclo);

-- V10. Eleitos sem título válido ficam fora da Q10 (a pessoa é o título).
--      Exceção conhecida (16): 2004: 3, 2012: 9, 2016: 4. Sem título, não há como ligar
--      a candidatura às outras da mesma pessoa. No total, ficam fora até 0,4% das
--      candidaturas por ano (0,75% em 2018).
SELECT
    'V10 eleito sem título' AS checagem,
    ano,
    count(*) AS eleitos_sem_titulo
FROM candidatura
WHERE fl_eleito AND nr_titulo_eleitoral IS NULL AND NOT fl_suplementar
GROUP BY ALL;

-- V11. O mesmo título com nomes de pessoas diferentes (similaridade < 0,8): erro de
--      digitação do título no TSE, que junta duas carreiras numa só.
--      Exceção conhecida (235 de 356 mil títulos, 0,07%). Grafias diferentes da mesma
--      pessoa (acento, abreviação, nome de casada) passam no limiar e não aparecem aqui.
WITH nomes AS (
    SELECT
        nr_titulo_eleitoral,
        list(DISTINCT strip_accents(upper(nm_candidato))) AS nomes
    FROM candidatura
    WHERE nr_titulo_eleitoral IS NOT NULL AND NOT fl_suplementar
    GROUP BY nr_titulo_eleitoral
)

SELECT
    'V11 título com pessoas diferentes' AS checagem,
    count(*) AS qt_titulos
FROM nomes
WHERE list_min(list_transform(nomes, n -> jaro_winkler_similarity(n, nomes[1]))) < 0.8
HAVING count(*) > 0;
