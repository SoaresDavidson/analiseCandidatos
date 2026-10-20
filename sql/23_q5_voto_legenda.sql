-- 23_q5_voto_legenda.sql — Q5: quantos candidatos de cada partido foram eleitos pelos
-- votos de legenda. [E.P.]
--
-- Dono: Davi. Refaz a distribuição das cadeiras dos cargos proporcionais (deputado
-- federal, deputado estadual e vereador) duas vezes: com os votos de legenda, como o
-- TSE fez, e sem eles. A cadeira que a lista perde sem a legenda foi ganha pela
-- legenda, e quem a ocupa é o eleito menos votado da lista. Para carregar, da RAIZ:
--
--     uv run python -m scripts.coleta.coleta_tse recorte_remoto --uf AM,GO,MA,MT,RS,SE
--     uv run python scripts/carregar_staging.py 00_limpeza 00_modelo 06_carga_nucleo 13_ficha 23_q5
--
-- Lê dados/raw/resultados/<ano>/votacao_partido_munzona_<ano>/votacao_partido_munzona_<ano>_<UF>.csv
-- e as tabelas modelo.candidatura, modelo.vaga (06) e modelo.votacao_candidato_municipio (13).
-- As checagens estão em sql/validacao/q5_voto_legenda.sql; o texto em docs/q5-voto-legenda.md.
--
-- Regras (Código Eleitoral, Lei 4.737/1965, arts. 106 a 111):
--   * lista = quem disputa as cadeiras: o partido isolado, a coligação (só em 2018:
--     a EC 97/2017 proibiu coligação proporcional a partir de 2020) ou a federação
--     (2022 e 2024, Lei 14.208/2021). O TSE marca a lista com SQ_COLIGACAO;
--   * votos válidos da lista = nominais + legenda + nominais convertidos em legenda
--     (voto em candidato com registro negado depois da eleição, art. 175 §4º);
--   * quociente eleitoral (QE) = válidos ÷ vagas, fração até meio desprezada, acima de
--     meio arredondada para cima (art. 106);
--   * quociente partidário (QP) = votos da lista ÷ QE, fração desprezada (art. 107).
--     Na fase 1 a lista elege até QP candidatos com ao menos 10% do QE (art. 108);
--   * sobras (art. 109): a cada cadeira, a lista com a maior média (votos ÷ cadeiras
--     já ganhas + 1) leva, se tiver candidato apto. Apto em 2018 e 2020 = 10% do QE,
--     qualquer lista (Lei 13.488/2017). Em 2022 e 2024 (Lei 14.211/2021) só a lista
--     com 80% do QE e o candidato com 20% do QE;
--   * fase 3: quando nenhuma lista tem candidato apto, as cadeiras que faltam vão às
--     maiores médias, de todas as listas, sem exigência de votação do candidato. Em
--     2022 o TSE só deixava entrar as listas com 80% do QE, e o STF (ADIs 7228, 7263
--     e 7325, fev. 2024) abriu para todas; aqui não faz diferença, porque nos 6
--     estados a fase 3 só foi usada em eleição municipal (V3 da validação);
--   * dentro da lista, as cadeiras vão aos candidatos mais votados; no empate, o mais
--     velho (art. 110).
--
-- "Sem legenda" tira só os votos dados ao número do partido. Os convertidos ficam:
-- o eleitor votou num candidato.

INSTALL encodings;
LOAD encodings;

-- ---------------------------------------------------------------------------
-- VOTACAO_LEGENDA_MUNICIPIO: o arquivo vem por zona; aqui soma por município.
-- Só o 1º turno: voto de legenda só existe na eleição proporcional, que tem um turno.
-- ---------------------------------------------------------------------------
DELETE FROM modelo.votacao_legenda_municipio;

INSERT INTO modelo.votacao_legenda_municipio
SELECT
    v.cd_eleicao,
    m.cod_ibge,
    v.cd_cargo,
    v.ano,
    v.nr_partido,
    v.sq_coligacao,
    sum(v.qt_votos_legenda_validos) AS qt_votos_legenda_validos,
    sum(v.qt_total_votos_leg_validos) AS qt_total_votos_leg_validos
FROM (
    SELECT
        ano_eleicao::integer AS ano,
        cd_eleicao::integer AS cd_eleicao,
        cd_cargo::integer AS cd_cargo,
        try_cast(nr_partido AS integer) AS nr_partido,
        try_cast(sq_coligacao AS bigint) AS sq_coligacao,
        lpad(cd_municipio, 5, '0') AS cd_municipio,
        coalesce(try_cast(qt_votos_legenda_validos AS bigint), 0) AS qt_votos_legenda_validos,
        coalesce(try_cast(qt_total_votos_leg_validos AS bigint), 0) AS qt_total_votos_leg_validos
    FROM
        read_csv(
            'dados/raw/resultados/*/votacao_partido_munzona_[0-9]*/votacao_partido_munzona_[0-9]*_??.csv',
            delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
            all_varchar = TRUE, union_by_name = TRUE
        )
    WHERE cd_tipo_eleicao = '2' AND nr_turno = '1'
) AS v
INNER JOIN modelo.eleicao AS e ON v.cd_eleicao = e.cd_eleicao
INNER JOIN modelo.cargo AS g ON v.cd_cargo = g.cd_cargo
INNER JOIN modelo.partido AS p ON v.ano = p.ano AND v.nr_partido = p.nr_partido
INNER JOIN modelo.municipio AS m ON v.cd_municipio = lpad(m.cod_tse, 5, '0')
WHERE v.sq_coligacao IS NOT NULL
GROUP BY v.cd_eleicao, m.cod_ibge, v.cd_cargo, v.ano, v.nr_partido, v.sq_coligacao;

-- ---------------------------------------------------------------------------
-- Partido na eleição: votos de legenda e a lista em que concorreu
--
-- Grão: eleição × UE × cargo proporcional × partido. A UE é o município (vereador) ou
-- a UF (deputado). O TSE às vezes grava o mesmo partido em duas listas na mesma UE,
-- uma delas fantasma (sem voto, ou repetindo a legenda da outra, como o PDT do AM em
-- 2018). Fica a lista com mais votos de legenda; no empate, a que tem mais partidos
-- (coligação ou federação antes do registro isolado).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q5_partido_lista AS
WITH por_lista AS (
    SELECT
        l.cd_eleicao,
        l.ano,
        m.sg_uf,
        l.cd_cargo,
        l.nr_partido,
        l.sq_coligacao,
        CASE WHEN e.tp_abrangencia = 'MUNICIPAL' THEN m.cod_tse ELSE m.sg_uf END AS sg_ue,
        sum(l.qt_votos_legenda_validos) AS qt_votos_legenda,
        sum(l.qt_total_votos_leg_validos - l.qt_votos_legenda_validos) AS qt_votos_convertidos
    FROM modelo.votacao_legenda_municipio AS l
    INNER JOIN modelo.eleicao AS e ON l.cd_eleicao = e.cd_eleicao
    INNER JOIN modelo.municipio AS m ON l.cod_ibge = m.cod_ibge
    WHERE l.cd_cargo IN (6, 7, 13) AND l.ano BETWEEN 2018 AND 2024
    GROUP BY ALL
),

tamanho AS (
    SELECT
        cd_eleicao,
        sg_ue,
        cd_cargo,
        sq_coligacao,
        count(DISTINCT nr_partido) AS qt_partidos
    FROM por_lista
    GROUP BY ALL
)

SELECT
    p.cd_eleicao,
    p.ano,
    p.sg_ue,
    p.sg_uf,
    p.cd_cargo,
    p.nr_partido,
    p.sq_coligacao,
    p.qt_votos_legenda,
    p.qt_votos_convertidos
FROM por_lista AS p
INNER JOIN tamanho AS t
    ON
        p.cd_eleicao = t.cd_eleicao
        AND p.sg_ue = t.sg_ue
        AND p.cd_cargo = t.cd_cargo
        AND p.sq_coligacao = t.sq_coligacao
QUALIFY
    row_number() OVER (
        PARTITION BY p.cd_eleicao, p.sg_ue, p.cd_cargo, p.nr_partido
        ORDER BY p.qt_votos_legenda DESC, t.qt_partidos DESC, p.sq_coligacao ASC
    ) = 1;

-- ---------------------------------------------------------------------------
-- Candidato: votos nominais válidos no 1º turno e a ordem dentro da lista
--
-- Grão: uma candidatura a cargo proporcional com voto. nr_ordem = posição na lista
-- pelos votos (empate: o mais velho, art. 110). fl_eleito_tse = o resultado oficial.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q5_candidato AS
WITH votos AS (
    SELECT
        id_candidatura,
        sum(qt_votos_nominais_validos) AS qt_votos
    FROM modelo.votacao_candidato_municipio
    WHERE nr_turno = 1
    GROUP BY id_candidatura
),

base AS (
    SELECT
        c.id_candidatura,
        c.ano,
        c.cd_eleicao,
        c.sg_ue,
        pl.sg_uf,
        c.cd_cargo,
        c.nr_partido,
        pa.sg_partido,
        pl.sq_coligacao,
        c.nr_titulo_eleitoral,
        po.nm_candidato,
        po.dt_nascimento,
        c.cod_ibge,
        c.ds_sit_tot_turno,
        v.qt_votos,
        upper(strip_accents(c.ds_sit_tot_turno)) IN ('ELEITO POR QP', 'ELEITO POR MEDIA') AS fl_eleito_tse
    FROM modelo.candidatura AS c
    INNER JOIN votos AS v ON c.id_candidatura = v.id_candidatura
    INNER JOIN q5_partido_lista AS pl
        ON
            c.cd_eleicao = pl.cd_eleicao
            AND c.sg_ue = pl.sg_ue
            AND c.cd_cargo = pl.cd_cargo
            AND c.nr_partido = pl.nr_partido
    INNER JOIN modelo.partido AS pa ON c.ano = pa.ano AND c.nr_partido = pa.nr_partido
    LEFT JOIN modelo.politico AS po ON c.nr_titulo_eleitoral = po.nr_titulo_eleitoral
    WHERE c.cd_cargo IN (6, 7, 13) AND c.ano BETWEEN 2018 AND 2024
)

SELECT
    *,
    row_number() OVER (
        PARTITION BY cd_eleicao, sg_ue, cd_cargo, sq_coligacao
        ORDER BY qt_votos DESC, dt_nascimento ASC NULLS LAST, id_candidatura ASC
    ) AS nr_ordem
FROM base;

-- ---------------------------------------------------------------------------
-- Lista em cada cenário: votos, quocientes e candidatos aptos
--
-- Grão: eleição × UE × cargo × lista × cenário (COM LEGENDA, SEM LEGENDA).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q5_lista AS
WITH lista AS (
    SELECT
        p.cd_eleicao,
        p.ano,
        p.sg_ue,
        p.sg_uf,
        p.cd_cargo,
        p.sq_coligacao,
        sum(p.qt_votos_legenda) AS qt_votos_legenda,
        sum(p.qt_votos_convertidos) AS qt_votos_convertidos,
        count(*) AS qt_partidos
    FROM q5_partido_lista AS p
    GROUP BY ALL
),

nominal AS (
    SELECT
        cd_eleicao,
        sg_ue,
        cd_cargo,
        sq_coligacao,
        sum(qt_votos) AS qt_votos_nominais,
        -- sigla da lista: os partidos com candidato votado, em ordem alfabética
        string_agg(DISTINCT sg_partido, ' / ') AS sg_lista
    FROM q5_candidato
    GROUP BY ALL
),

cenario AS (
    SELECT
        l.*,
        c.cd_cenario,
        coalesce(n.qt_votos_nominais, 0) AS qt_votos_nominais,
        coalesce(n.sg_lista, '') AS sg_lista,
        coalesce(n.qt_votos_nominais, 0) + l.qt_votos_convertidos
        + CASE c.cd_cenario WHEN 'COM LEGENDA' THEN l.qt_votos_legenda ELSE 0 END AS qt_votos
    FROM lista AS l
    LEFT JOIN nominal AS n
        ON
            l.cd_eleicao = n.cd_eleicao
            AND l.sg_ue = n.sg_ue
            AND l.cd_cargo = n.cd_cargo
            AND l.sq_coligacao = n.sq_coligacao
    CROSS JOIN (VALUES ('COM LEGENDA'), ('SEM LEGENDA')) AS c (cd_cenario)
),

quociente AS (
    -- QE: inteiro mais próximo, com a fração de meio exato para baixo (art. 106)
    SELECT
        c.cd_eleicao,
        c.sg_ue,
        c.cd_cargo,
        c.cd_cenario,
        v.qt_vaga,
        sum(c.qt_votos) AS qt_validos,
        sum(c.qt_votos) // v.qt_vaga + (2 * (sum(c.qt_votos) % v.qt_vaga) > v.qt_vaga)::integer AS qt_qe
    FROM cenario AS c
    INNER JOIN modelo.vaga AS v ON c.cd_eleicao = v.cd_eleicao AND c.sg_ue = v.sg_ue AND c.cd_cargo = v.cd_cargo
    GROUP BY c.cd_eleicao, c.sg_ue, c.cd_cargo, c.cd_cenario, v.qt_vaga
),

aptos AS (
    -- candidatos com voto e com 10% e 20% do QE, em cada cenário
    SELECT
        q.cd_eleicao,
        q.sg_ue,
        q.cd_cargo,
        q.cd_cenario,
        k.sq_coligacao,
        count(*) FILTER (WHERE k.qt_votos > 0) AS qt_candidatos,
        count(*) FILTER (WHERE 10 * k.qt_votos >= q.qt_qe) AS qt_aptos_10,
        count(*) FILTER (WHERE 5 * k.qt_votos >= q.qt_qe) AS qt_aptos_20
    FROM quociente AS q
    INNER JOIN q5_candidato AS k ON q.cd_eleicao = k.cd_eleicao AND q.sg_ue = k.sg_ue AND q.cd_cargo = k.cd_cargo
    GROUP BY ALL
)

SELECT
    c.cd_eleicao,
    c.ano,
    c.sg_uf,
    c.sg_ue,
    c.cd_cargo,
    c.sq_coligacao,
    c.sg_lista,
    c.qt_partidos,
    c.cd_cenario,
    c.qt_votos_nominais,
    c.qt_votos_legenda,
    c.qt_votos_convertidos,
    c.qt_votos,
    q.qt_vaga,
    q.qt_validos,
    q.qt_qe,
    c.qt_votos // q.qt_qe AS qt_qp,
    coalesce(a.qt_candidatos, 0) AS qt_candidatos,
    coalesce(a.qt_aptos_10, 0) AS qt_aptos_10,
    coalesce(a.qt_aptos_20, 0) AS qt_aptos_20,
    -- regra das sobras: Lei 13.488/2017 (2018, 2020) ou Lei 14.211/2021 (2022 em diante)
    c.ano >= 2022 AS fl_lei_14211,
    -- 80% do QE: a lista entra nas sobras (só conta a partir de 2022)
    10 * c.qt_votos >= 8 * q.qt_qe AS fl_lista_80
FROM cenario AS c
INNER JOIN quociente AS q
    ON
        c.cd_eleicao = q.cd_eleicao
        AND c.sg_ue = q.sg_ue
        AND c.cd_cargo = q.cd_cargo
        AND c.cd_cenario = q.cd_cenario
LEFT JOIN aptos AS a
    ON
        c.cd_eleicao = a.cd_eleicao
        AND c.sg_ue = a.sg_ue
        AND c.cd_cargo = a.cd_cargo
        AND c.cd_cenario = a.cd_cenario
        AND c.sq_coligacao = a.sq_coligacao;

-- ---------------------------------------------------------------------------
-- Distribuição das cadeiras
--
-- Grão: eleição × UE × cargo × lista × cenário. Dar a cadeira, uma a uma, à maior
-- média é o mesmo que listar as médias de cada lista (votos ÷ (cadeiras + 1),
-- votos ÷ (cadeiras + 2)…, uma por candidato apto que sobra) e ficar com as N maiores
-- da UE: as médias de uma lista só caem. Empate de média: a lista mais votada e, se
-- persistir, a do candidato que levaria a cadeira com mais votos e depois o mais velho
-- (é como o TSE desempatou em Santo Amaro das Brotas/SE e Barra do Quaraí/RS, 2020).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q5_distribuicao AS
WITH passo AS (
    -- 1, 2, 3… até o tamanho da maior lista: a k-ésima cadeira a mais de cada lista
    SELECT unnest(range(1, max(qt_candidatos) + 1)) AS k
    FROM q5_lista
),

fase1 AS (
    SELECT
        *,
        least(qt_qp, qt_aptos_10) AS qt_fase1,
        -- candidatos que ainda podem entrar nas sobras (fase 2)
        CASE
            WHEN NOT fl_lei_14211 THEN greatest(qt_aptos_10 - least(qt_qp, qt_aptos_10), 0)
            WHEN fl_lista_80 THEN greatest(qt_aptos_20 - least(qt_qp, qt_aptos_10), 0)
            ELSE 0
        END AS qt_vez_fase2
    FROM q5_lista
),

sobra2 AS (
    SELECT
        *,
        qt_vaga - sum(qt_fase1) OVER ue AS qt_sobra2
    FROM fase1
    WINDOW ue AS (PARTITION BY cd_eleicao, sg_ue, cd_cargo, cd_cenario)
),

media2 AS (
    SELECT
        s.cd_eleicao,
        s.sg_ue,
        s.cd_cargo,
        s.cd_cenario,
        s.sq_coligacao,
        s.qt_sobra2,
        row_number() OVER (
            PARTITION BY s.cd_eleicao, s.sg_ue, s.cd_cargo, s.cd_cenario
            ORDER BY
                s.qt_votos / (s.qt_fase1 + k.k) DESC,
                s.qt_votos DESC,
                c.qt_votos DESC,
                c.dt_nascimento ASC,
                s.sq_coligacao ASC
        ) AS nr_media
    FROM sobra2 AS s
    INNER JOIN passo AS k ON s.qt_vez_fase2 >= k.k
    -- o candidato que levaria a cadeira, para o desempate
    LEFT JOIN q5_candidato AS c
        ON
            s.cd_eleicao = c.cd_eleicao
            AND s.sg_ue = c.sg_ue
            AND s.cd_cargo = c.cd_cargo
            AND s.sq_coligacao = c.sq_coligacao
            AND s.qt_fase1 + k.k = c.nr_ordem
),

ganho2 AS (
    SELECT
        cd_eleicao,
        sg_ue,
        cd_cargo,
        cd_cenario,
        sq_coligacao,
        count(*) AS qt_fase2
    FROM media2
    WHERE nr_media <= qt_sobra2
    GROUP BY ALL
),

fase2 AS (
    SELECT
        s.*,
        coalesce(m.qt_fase2, 0) AS qt_fase2
    FROM sobra2 AS s
    LEFT JOIN ganho2 AS m
        ON
            s.cd_eleicao = m.cd_eleicao
            AND s.sg_ue = m.sg_ue
            AND s.cd_cargo = m.cd_cargo
            AND s.cd_cenario = m.cd_cenario
            AND s.sq_coligacao = m.sq_coligacao
),

sobra3 AS (
    SELECT
        *,
        qt_vaga - sum(qt_fase1 + qt_fase2) OVER ue AS qt_sobra3,
        -- fase 3: todas as listas, qualquer candidato com voto
        qt_candidatos - qt_fase1 - qt_fase2 AS qt_vez_fase3
    FROM fase2
    WINDOW ue AS (PARTITION BY cd_eleicao, sg_ue, cd_cargo, cd_cenario)
),

media3 AS (
    SELECT
        s.cd_eleicao,
        s.sg_ue,
        s.cd_cargo,
        s.cd_cenario,
        s.sq_coligacao,
        s.qt_sobra3,
        row_number() OVER (
            PARTITION BY s.cd_eleicao, s.sg_ue, s.cd_cargo, s.cd_cenario
            ORDER BY
                s.qt_votos / (s.qt_fase1 + s.qt_fase2 + k.k) DESC,
                s.qt_votos DESC,
                c.qt_votos DESC,
                c.dt_nascimento ASC,
                s.sq_coligacao ASC
        ) AS nr_media
    FROM sobra3 AS s
    INNER JOIN passo AS k ON s.qt_vez_fase3 >= k.k
    -- o candidato que levaria a cadeira, para o desempate
    LEFT JOIN q5_candidato AS c
        ON
            s.cd_eleicao = c.cd_eleicao
            AND s.sg_ue = c.sg_ue
            AND s.cd_cargo = c.cd_cargo
            AND s.sq_coligacao = c.sq_coligacao
            AND s.qt_fase1 + s.qt_fase2 + k.k = c.nr_ordem
    WHERE s.qt_sobra3 > 0
),

ganho3 AS (
    SELECT
        cd_eleicao,
        sg_ue,
        cd_cargo,
        cd_cenario,
        sq_coligacao,
        count(*) AS qt_fase3
    FROM media3
    WHERE nr_media <= qt_sobra3
    GROUP BY ALL
)

SELECT
    s.* EXCLUDE (s.qt_sobra2, s.qt_sobra3, s.qt_vez_fase2, s.qt_vez_fase3),
    coalesce(m.qt_fase3, 0) AS qt_fase3,
    s.qt_fase1 + s.qt_fase2 + coalesce(m.qt_fase3, 0) AS qt_cadeiras,
    ano_divulgado(s.ano) AS fl_divulgado
FROM sobra3 AS s
LEFT JOIN ganho3 AS m
    ON
        s.cd_eleicao = m.cd_eleicao
        AND s.sg_ue = m.sg_ue
        AND s.cd_cargo = m.cd_cargo
        AND s.cd_cenario = m.cd_cenario
        AND s.sq_coligacao = m.sq_coligacao;

-- ---------------------------------------------------------------------------
-- Cadeiras da lista com e sem legenda, lado a lado
--
-- Grão: eleição × UE × cargo × lista. qt_cadeiras_legenda > 0 = a lista ganhou
-- cadeiras pela legenda; < 0 = perdeu para quem tinha mais legenda.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q5_lista_cadeiras AS
SELECT
    c.cd_eleicao,
    c.ano,
    c.sg_uf,
    c.sg_ue,
    c.cd_cargo,
    c.sq_coligacao,
    c.sg_lista,
    c.qt_partidos,
    c.qt_votos_nominais,
    c.qt_votos_legenda,
    c.qt_votos_convertidos,
    c.qt_vaga,
    c.qt_qe AS qt_qe_com,
    s.qt_qe AS qt_qe_sem,
    c.qt_cadeiras AS qt_cadeiras_com,
    s.qt_cadeiras AS qt_cadeiras_sem,
    c.fl_divulgado,
    c.qt_cadeiras - s.qt_cadeiras AS qt_cadeiras_legenda
FROM q5_distribuicao AS c
INNER JOIN q5_distribuicao AS s
    ON
        c.cd_eleicao = s.cd_eleicao
        AND c.sg_ue = s.sg_ue
        AND c.cd_cargo = s.cd_cargo
        AND c.sq_coligacao = s.sq_coligacao
WHERE c.cd_cenario = 'COM LEGENDA' AND s.cd_cenario = 'SEM LEGENDA';

-- ---------------------------------------------------------------------------
-- Eleitos pela legenda (e quem entraria no lugar deles)
--
-- Grão: uma candidatura. tp_efeito:
--   ELEITO PELA LEGENDA  = eleito com a legenda e fora sem ela (a lista perde a cadeira);
--   FORA PELA LEGENDA    = ficaria com a cadeira sem a legenda e ficou de fora.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q5_eleito_legenda AS
SELECT
    k.id_candidatura,
    k.ano,
    k.sg_uf,
    k.sg_ue,
    k.cd_cargo,
    g.ds_cargo,
    k.nr_titulo_eleitoral,
    k.nm_candidato,
    k.sg_partido,
    l.sg_lista,
    l.qt_partidos,
    k.qt_votos,
    k.nr_ordem,
    l.qt_cadeiras_com,
    l.qt_cadeiras_sem,
    l.qt_votos_legenda,
    l.qt_qe_com,
    k.ds_sit_tot_turno,
    l.fl_divulgado,
    coalesce(m.nm_municipio, k.sg_ue) AS nm_ue,
    CASE WHEN k.nr_ordem <= l.qt_cadeiras_com THEN 'ELEITO PELA LEGENDA' ELSE 'FORA PELA LEGENDA' END AS tp_efeito
FROM q5_candidato AS k
INNER JOIN q5_lista_cadeiras AS l
    ON
        k.cd_eleicao = l.cd_eleicao
        AND k.sg_ue = l.sg_ue
        AND k.cd_cargo = l.cd_cargo
        AND k.sq_coligacao = l.sq_coligacao
INNER JOIN modelo.cargo AS g ON k.cd_cargo = g.cd_cargo
LEFT JOIN modelo.municipio AS m ON k.cod_ibge = m.cod_ibge
WHERE
    k.nr_ordem > least(l.qt_cadeiras_com, l.qt_cadeiras_sem)
    AND k.nr_ordem <= greatest(l.qt_cadeiras_com, l.qt_cadeiras_sem);

-- ---------------------------------------------------------------------------
-- A resposta: por partido, quantos eleitos e quantos pela legenda
--
-- Grão: ano × UF × cargo × partido. O partido é o do candidato: numa coligação ou
-- federação a legenda que elegeu pode ter vindo do partido parceiro, e por isso
-- qt_votos_legenda é a do próprio partido e não a da lista.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q5_partido AS
WITH eleitos AS (
    SELECT
        k.ano,
        k.sg_uf,
        k.cd_cargo,
        k.sg_partido,
        count(*) FILTER (WHERE k.fl_eleito_tse) AS qt_eleitos_tse,
        count(*) FILTER (WHERE k.nr_ordem <= l.qt_cadeiras_com) AS qt_eleitos,
        count(*) FILTER (WHERE k.nr_ordem <= l.qt_cadeiras_sem) AS qt_eleitos_sem_legenda,
        count(*) FILTER (WHERE k.nr_ordem <= l.qt_cadeiras_com AND k.nr_ordem > l.qt_cadeiras_sem)
            AS qt_eleitos_legenda,
        sum(k.qt_votos) AS qt_votos_nominais
    FROM q5_candidato AS k
    INNER JOIN q5_lista_cadeiras AS l
        ON
            k.cd_eleicao = l.cd_eleicao
            AND k.sg_ue = l.sg_ue
            AND k.cd_cargo = l.cd_cargo
            AND k.sq_coligacao = l.sq_coligacao
    GROUP BY ALL
),

legenda AS (
    SELECT
        p.ano,
        p.sg_uf,
        p.cd_cargo,
        pa.sg_partido,
        sum(p.qt_votos_legenda) AS qt_votos_legenda
    FROM q5_partido_lista AS p
    INNER JOIN modelo.partido AS pa ON p.ano = pa.ano AND p.nr_partido = pa.nr_partido
    GROUP BY ALL
)

SELECT
    e.ano,
    e.sg_uf,
    e.cd_cargo,
    g.ds_cargo,
    e.sg_partido,
    e.qt_eleitos_tse,
    e.qt_eleitos,
    e.qt_eleitos_sem_legenda,
    e.qt_eleitos_legenda,
    e.qt_votos_nominais,
    coalesce(lg.qt_votos_legenda, 0) AS qt_votos_legenda,
    round(
        100.0 * coalesce(lg.qt_votos_legenda, 0) / nullif(e.qt_votos_nominais + coalesce(lg.qt_votos_legenda, 0), 0), 2
    )
        AS pc_legenda,
    ano_divulgado(e.ano) AS fl_divulgado
FROM eleitos AS e
INNER JOIN modelo.cargo AS g ON e.cd_cargo = g.cd_cargo
LEFT JOIN legenda AS lg
    ON e.ano = lg.ano AND e.sg_uf = lg.sg_uf AND e.cd_cargo = lg.cd_cargo AND e.sg_partido = lg.sg_partido;
