-- consultas/q10_carreira.sql — as consultas que respondem a Q10.
--
-- "Dado certo político, como foi a sobrevivência de sua carreira (linha do tempo
-- de participações, vitórias, derrotas e reeleições)? [Máximo possível]"
--
-- Lê as views de sql/07_q10_carreira.sql (as definições estão lá). Não fica em
-- sql/ direto de propósito: o carregar_staging.py roda sql/*.sql, e isto aqui é
-- consulta, não carga. Para rodar tudo:
--
--     uv run scripts/consultar.py sql/consultas/q10_carreira.sql
--
-- Recorte: AM, GO, MA, MT, RS e SE, eleições ordinárias de 2002 a 2026.

-- ===========================================================================
-- 1. Escolher o político
-- ===========================================================================

-- O nome procurado (ILIKE: % é curinga, maiúscula e minúscula tanto faz).
SET VARIABLE nome = '%OTONI GOMIDE%';

-- 1a. Procurar pelo nome. Homônimos existem, então a escolha final é pelo título.
SELECT
    nr_titulo_eleitoral,
    nm_candidato,
    ufs,
    qt_participacoes,
    qt_vitorias,
    ano_estreia,
    ano_ultima
FROM q10_carreira
WHERE nm_candidato ILIKE getvariable('nome')
ORDER BY qt_participacoes DESC;

-- 1b. O político analisado: o primeiro da busca acima (temporário, só nesta
--     sessão). Para fixar outro homônimo, troque o WHERE por
--     nr_titulo_eleitoral = '<título da lista 1a>'.
CREATE OR REPLACE TEMP VIEW q10_escolhido AS
SELECT nr_titulo_eleitoral
FROM q10_carreira
WHERE nm_candidato ILIKE getvariable('nome')
ORDER BY qt_participacoes DESC
LIMIT 1;

-- ===========================================================================
-- 2. A resposta para um político
-- ===========================================================================

-- 2a. Linha do tempo: uma linha por eleição disputada.
SELECT
    nr_participacao AS n,
    ano,
    ds_cargo AS cargo,
    sg_partido AS partido,
    fl_trocou_partido AS trocou_partido,
    anos_desde_anterior,
    coalesce(nm_ue, sg_ue) AS onde,
    CASE WHEN fl_reeleito THEN 'REELEITO' ELSE resultado END AS resultado
FROM q10_linha_do_tempo
WHERE nr_titulo_eleitoral = (SELECT e.nr_titulo_eleitoral FROM q10_escolhido AS e)
ORDER BY ano;

-- 2b. Resumo da carreira: participações, vitórias, derrotas, reeleições.
SELECT
    nm_candidato,
    qt_participacoes AS participacoes,
    qt_vitorias AS vitorias,
    qt_derrotas AS derrotas,
    qt_sem_resultado AS sem_resultado,
    qt_reeleicoes AS reeleicoes,
    qt_tentativas_reeleicao AS tentativas_reeleicao,
    qt_max_vitorias_seguidas AS max_vitorias_seguidas,
    ano_estreia,
    ano_primeira_vitoria,
    ano_ultima_vitoria,
    ano_ultima,
    anos_carreira,
    qt_partidos AS partidos,
    qt_cargos AS cargos
FROM q10_carreira
WHERE nr_titulo_eleitoral = (SELECT e.nr_titulo_eleitoral FROM q10_escolhido AS e);

-- ===========================================================================
-- 3. Sobrevivência no agregado (o contexto para ler um político)
-- ===========================================================================

-- 3a. Quantas eleições as pessoas disputam, e quanto isso tem a ver com vencer.
--     ⚠️ A causalidade é a inversa da leitura fácil: é ter sido eleito que faz a
--     pessoa voltar a se candidatar, não o contrário.
SELECT
    qt_participacoes AS eleicoes_disputadas,
    count(*) AS pessoas,
    round(100.0 * count(*) / sum(count(*)) OVER (), 2) AS pct_pessoas,
    round(100.0 * count(*) FILTER (WHERE qt_vitorias > 0) / count(*), 1) AS pct_ja_eleitas,
    round(100.0 * count(*) FILTER (WHERE qt_reeleicoes > 0) / count(*), 1) AS pct_ja_reeleitas
FROM q10_carreira
GROUP BY qt_participacoes
ORDER BY qt_participacoes;

-- 3b. Dos eleitos para um cargo, quantos tentam e quantos conseguem a reeleição.
SELECT
    ds_cargo AS cargo,
    sum(qt_eleitos)::INTEGER AS eleitos,
    sum(qt_tentaram_reeleicao)::INTEGER AS tentaram,
    sum(qt_reeleitos)::INTEGER AS reeleitos,
    round(100.0 * sum(qt_tentaram_reeleicao) / sum(qt_eleitos), 1) AS pct_tentaram,
    round(100.0 * sum(qt_reeleitos) / sum(qt_tentaram_reeleicao), 1) AS pct_sucesso_de_quem_tentou,
    round(100.0 * sum(qt_seguiram_na_politica) / sum(qt_eleitos), 1) AS pct_seguiram_disputando
FROM q10_sobrevivencia
GROUP BY cd_cargo, ds_cargo
ORDER BY cd_cargo;

-- 3c. A mesma taxa de reeleição ao longo do tempo, por UF (só cargos com muitos
--     eleitos por ano; governador e senador são poucos demais para taxa).
SELECT
    ano,
    sg_uf,
    ds_cargo AS cargo,
    qt_eleitos AS eleitos,
    pct_tentaram,
    pct_sucesso_de_quem_tentou
FROM q10_sobrevivencia
WHERE cd_cargo IN (6, 7, 11, 13)
ORDER BY cd_cargo, sg_uf, ano;

-- 3d. As carreiras mais longas de cada UF (desempate: mais vitórias).
SELECT
    sg_uf,
    nm_candidato,
    qt_participacoes AS participacoes,
    qt_vitorias AS vitorias,
    qt_derrotas AS derrotas,
    qt_reeleicoes AS reeleicoes,
    qt_partidos AS partidos,
    trajetoria
FROM (
    SELECT
        *,
        unnest(ufs) AS sg_uf
    FROM q10_carreira
) AS por_uf
QUALIFY row_number() OVER (PARTITION BY sg_uf ORDER BY qt_participacoes DESC, qt_vitorias DESC) <= 3
ORDER BY sg_uf ASC, qt_participacoes DESC, qt_vitorias DESC;
