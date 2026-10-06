-- 07_q10_carreira.sql — Q10: sobrevivência da carreira do político.
--
-- "Dado certo político, como foi a sobrevivência de sua carreira (linha do tempo
-- de participações, vitórias, derrotas e reeleições)? [Máximo possível]"
--
-- É a Q10 da lista de 10 entregue ao professor e a Q12 da lista de 12 do repo.
-- Donos: Eduardo e Enrico. Depende só de 00_macros e 04_politico, ou seja, só do
-- consulta_cand (2002–2026). Para carregar:
--
--     uv run scripts/carregar_staging.py 00_macros 04_politico 07_q10
--
-- As consultas prontas (um político, ranking, sobrevivência) estão em
-- sql/consultas/q10_carreira.sql.
--
-- Definições (o que cada palavra da pergunta vira em dado):
--
--   político      uma pessoa = um título de eleitor. Nunca o CPF: em 2024 o TSE
--                 trocou todos por '-4'. Quem não tem título válido fica de fora.
--   participação  uma eleição ORDINÁRIA disputada. Suplementares ficam de fora
--                 (são refeitas da mesma eleição, não um novo ciclo da carreira).
--   vitória       fl_eleito: ELEITO, ELEITO POR QP, ELEITO POR MÉDIA, MÉDIA.
--   derrota       foi até a urna e não se elegeu: NÃO ELEITO ou SUPLENTE.
--   sem resultado candidatura que não chegou à urna ou não tem desfecho no
--                 arquivo: registro negado, indeferido, renúncia, cassação,
--                 substituição, ou o campo vazio. Conta como participação, não
--                 como derrota.
--   reeleição     eleito para o MESMO cargo, na MESMA unidade eleitoral (município
--                 ou UF), no ciclo anterior desse cargo: 4 anos antes, ou 8 para
--                 senador e seus suplentes. Vereador que vira prefeito não é
--                 reeleição; prefeito que volta depois de 8 anos fora também não.
--
-- ⚠️ Até 2010 o TSE não registra resultado de vice (prefeito e governador) nem de
-- suplente de senador: esses cargos aparecem "sem resultado" nesses anos, e a
-- reeleição de vice só é detectável de 2012 em diante.
-- ⚠️ 2026: o arquivo já traz o 1º turno. Quem está no 2º turno aparece como
-- "AGUARDANDO 2º TURNO" até o TSE publicar o resultado final.

-- ---------------------------------------------------------------------------
-- Grão: uma candidatura (pessoa × ano × cargo × unidade eleitoral).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q10_candidatura AS
WITH cand AS (
    SELECT
        c.id_candidatura,
        c.nr_titulo_eleitoral,
        c.ano,
        c.sg_uf,
        c.sg_ue,
        c.nm_ue,
        c.cd_cargo,
        c.ds_cargo,
        c.nr_partido,
        c.sg_partido,
        c.ds_sit_tot_turno,
        c.fl_eleito,
        CASE
            WHEN c.fl_eleito THEN 'ELEITO'
            WHEN upper(strip_accents(c.ds_sit_tot_turno)) IN ('NAO ELEITO', 'SUPLENTE') THEN 'NAO ELEITO'
            WHEN c.ds_sit_tot_turno = '2º TURNO' THEN 'AGUARDANDO 2º TURNO'
            ELSE 'SEM RESULTADO'
        END AS resultado,
        -- duração do mandato, que define qual é o "ciclo anterior" do cargo
        CASE WHEN c.cd_cargo IN (5, 9, 10) THEN 8 ELSE 4 END AS anos_mandato
    FROM candidatura AS c
    WHERE c.nr_titulo_eleitoral IS NOT NULL AND NOT c.fl_suplementar
),

-- mandatos conquistados, para procurar o anterior de cada candidatura
mandato AS (
    SELECT DISTINCT
        nr_titulo_eleitoral,
        cd_cargo,
        sg_ue,
        ano
    FROM cand
    WHERE fl_eleito
)

SELECT
    cand.*,
    -- titular buscando renovar o mandato que já tem
    m.ano IS NOT NULL AS fl_tentou_reeleicao,
    m.ano IS NOT NULL AND cand.fl_eleito AS fl_reeleito
FROM cand
LEFT JOIN mandato AS m
    ON
        cand.nr_titulo_eleitoral = m.nr_titulo_eleitoral
        AND cand.cd_cargo = m.cd_cargo
        AND cand.sg_ue = m.sg_ue
        AND cand.ano - cand.anos_mandato = m.ano;

-- ---------------------------------------------------------------------------
-- Grão: uma participação (pessoa × ano). É a linha do tempo.
--
-- Em 0,3% dos casos a pessoa tem mais de uma candidatura no mesmo ano (vice e
-- vereador ao mesmo tempo, ou registro refeito). Fica a principal: a que elegeu;
-- senão, a que chegou à urna; senão, a de maior cargo (cd_cargo menor).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q10_linha_do_tempo AS
WITH principal AS (
    SELECT * FROM q10_candidatura
    QUALIFY row_number() OVER (
        PARTITION BY nr_titulo_eleitoral, ano
        ORDER BY fl_eleito DESC, (resultado = 'SEM RESULTADO') ASC, cd_cargo ASC, id_candidatura ASC
    ) = 1
)

SELECT
    t.nr_titulo_eleitoral,
    p.nm_candidato,
    t.ano,
    t.sg_uf,
    t.sg_ue,
    t.nm_ue,
    t.cd_cargo,
    t.ds_cargo,
    t.sg_partido,
    t.resultado,
    t.ds_sit_tot_turno,
    t.fl_eleito,
    t.fl_tentou_reeleicao,
    t.fl_reeleito,
    row_number() OVER pessoa AS nr_participacao,
    t.ano - min(t.ano) OVER pessoa AS anos_desde_estreia,
    coalesce(t.sg_partido <> lag(t.sg_partido) OVER pessoa, FALSE) AS fl_trocou_partido,
    coalesce(t.cd_cargo <> lag(t.cd_cargo) OVER pessoa, FALSE) AS fl_trocou_cargo,
    -- anos parado desde a participação anterior (2 = disputou o ciclo seguinte)
    t.ano - lag(t.ano) OVER pessoa AS anos_desde_anterior
FROM principal AS t
INNER JOIN politico AS p ON t.nr_titulo_eleitoral = p.nr_titulo_eleitoral
WINDOW pessoa AS (PARTITION BY t.nr_titulo_eleitoral ORDER BY t.ano);

-- ---------------------------------------------------------------------------
-- Grão: uma pessoa. O resumo da carreira.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q10_carreira AS
WITH sequencia AS (
    -- ilhas de vitórias seguidas: participações eleitas consecutivas têm a mesma
    -- diferença entre a posição geral e a posição entre as eleitas. Já sai com
    -- uma linha por pessoa (a maior ilha), senão o join abaixo multiplica linhas.
    SELECT
        nr_titulo_eleitoral,
        max(qt) AS qt_max_vitorias_seguidas
    FROM (
        SELECT
            nr_titulo_eleitoral,
            count(*) AS qt
        FROM (
            SELECT
                nr_titulo_eleitoral,
                nr_participacao
                - row_number() OVER (PARTITION BY nr_titulo_eleitoral ORDER BY ano) AS ilha
            FROM q10_linha_do_tempo
            WHERE fl_eleito
        ) AS eleitas
        GROUP BY nr_titulo_eleitoral, ilha
    ) AS ilhas
    GROUP BY nr_titulo_eleitoral
)

SELECT
    t.nr_titulo_eleitoral,
    any_value(t.nm_candidato) AS nm_candidato,
    list(DISTINCT t.sg_uf ORDER BY t.sg_uf) AS ufs,
    count(*) AS qt_participacoes,
    count(*) FILTER (WHERE t.resultado = 'ELEITO') AS qt_vitorias,
    count(*) FILTER (WHERE t.resultado = 'NAO ELEITO') AS qt_derrotas,
    count(*) FILTER (WHERE t.resultado = 'SEM RESULTADO') AS qt_sem_resultado,
    count(*) FILTER (WHERE t.fl_tentou_reeleicao) AS qt_tentativas_reeleicao,
    count(*) FILTER (WHERE t.fl_reeleito) AS qt_reeleicoes,
    coalesce(any_value(s.qt_max_vitorias_seguidas), 0) AS qt_max_vitorias_seguidas,
    min(t.ano) AS ano_estreia,
    max(t.ano) AS ano_ultima,
    max(t.ano) - min(t.ano) AS anos_carreira,
    min(t.ano) FILTER (WHERE t.fl_eleito) AS ano_primeira_vitoria,
    max(t.ano) FILTER (WHERE t.fl_eleito) AS ano_ultima_vitoria,
    arg_max(t.ds_cargo, t.ano) AS ds_cargo_ultima,
    arg_max(t.resultado, t.ano) AS resultado_ultima,
    count(DISTINCT t.sg_partido) AS qt_partidos,
    count(DISTINCT t.cd_cargo) AS qt_cargos,
    -- a trajetória legível numa coluna só: "2004 VEREADOR (PT) ELEITO → 2008 ..."
    string_agg(
        concat_ws(
            ' ', t.ano::VARCHAR, t.ds_cargo, '(' || t.sg_partido || ')',
            CASE WHEN t.fl_reeleito THEN 'REELEITO' ELSE t.resultado END
        ),
        ' → ' ORDER BY t.ano
    ) AS trajetoria
FROM q10_linha_do_tempo AS t
LEFT JOIN sequencia AS s ON t.nr_titulo_eleitoral = s.nr_titulo_eleitoral
GROUP BY t.nr_titulo_eleitoral;

-- ---------------------------------------------------------------------------
-- Grão: ano × UF × cargo dos eleitos. A sobrevivência no agregado: de quem se
-- elegeu num ano, quantos tentaram o mesmo cargo no ciclo seguinte, quantos se
-- reelegeram e quantos seguiram disputando qualquer coisa depois.
--
-- Só cargos titulares (vice e suplente não têm resultado antes de 2012), e só
-- anos cujo ciclo seguinte já está na base.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q10_sobrevivencia AS
WITH eleito AS (
    SELECT DISTINCT
        nr_titulo_eleitoral,
        ano,
        sg_uf,
        sg_ue,
        cd_cargo,
        ds_cargo,
        anos_mandato
    FROM q10_candidatura
    WHERE fl_eleito AND cd_cargo IN (3, 5, 6, 7, 11, 13)
),

seguinte AS (
    SELECT
        e.nr_titulo_eleitoral,
        e.ano,
        e.cd_cargo,
        e.sg_ue,
        bool_or(n.cd_cargo = e.cd_cargo AND n.sg_ue = e.sg_ue AND n.ano = e.ano + e.anos_mandato)
            AS fl_tentou,
        bool_or(
            n.fl_eleito AND n.cd_cargo = e.cd_cargo AND n.sg_ue = e.sg_ue AND n.ano = e.ano + e.anos_mandato
        ) AS fl_reeleito,
        bool_or(n.ano IS NOT NULL) AS fl_continuou
    FROM eleito AS e
    LEFT JOIN q10_candidatura AS n
        ON e.nr_titulo_eleitoral = n.nr_titulo_eleitoral AND e.ano < n.ano
    GROUP BY ALL
)

SELECT
    e.ano,
    e.sg_uf,
    e.cd_cargo,
    any_value(e.ds_cargo) AS ds_cargo,
    count(*) AS qt_eleitos,
    count(*) FILTER (WHERE s.fl_tentou) AS qt_tentaram_reeleicao,
    count(*) FILTER (WHERE s.fl_reeleito) AS qt_reeleitos,
    count(*) FILTER (WHERE s.fl_continuou) AS qt_seguiram_na_politica,
    round(100.0 * count(*) FILTER (WHERE s.fl_tentou) / count(*), 1) AS pct_tentaram,
    round(100.0 * count(*) FILTER (WHERE s.fl_reeleito) / count(*), 1) AS pct_reeleitos,
    round(
        100.0 * count(*) FILTER (WHERE s.fl_reeleito)
        / nullif(count(*) FILTER (WHERE s.fl_tentou), 0), 1
    ) AS pct_sucesso_de_quem_tentou
FROM eleito AS e
INNER JOIN seguinte AS s
    ON
        e.nr_titulo_eleitoral = s.nr_titulo_eleitoral
        AND e.ano = s.ano
        AND e.cd_cargo = s.cd_cargo
        AND e.sg_ue = s.sg_ue
WHERE e.ano + e.anos_mandato <= (SELECT max(c.ano) FROM candidatura AS c)
GROUP BY e.ano, e.sg_uf, e.cd_cargo;
