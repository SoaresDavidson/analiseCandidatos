-- validacao/q5_voto_legenda.sql — checagens dos eleitos pela legenda (Q5).
--
-- Cada consulta deve voltar VAZIA, salvo as exceções conhecidas anotadas em V5 e V7.
-- Fica fora de sql/*.sql de propósito: o carregar_staging.py não roda esta pasta.
-- Rodar no notebook ou no duckdb, depois de 06, 13 e 23_q5.

-- V1. Uma linha por candidatura (o partido cai numa lista só).
SELECT
    'V1 candidatura repetida' AS checagem,
    id_candidatura,
    count(*) AS qt
FROM q5_candidato
GROUP BY id_candidatura
HAVING count(*) > 1;

-- V2. Nenhum voto nominal se perde ao ligar o candidato à lista.
WITH modelo_votos AS (
    SELECT
        c.ano,
        c.cd_cargo,
        sum(v.qt_votos_nominais_validos) AS qt_votos
    FROM modelo.votacao_candidato_municipio AS v
    INNER JOIN modelo.candidatura AS c ON v.id_candidatura = c.id_candidatura
    WHERE v.nr_turno = 1 AND c.cd_cargo IN (6, 7, 13) AND c.ano BETWEEN 2018 AND 2024
    GROUP BY ALL
),

q5 AS (
    SELECT
        ano,
        cd_cargo,
        sum(qt_votos) AS qt_votos
    FROM q5_candidato
    GROUP BY ALL
)

SELECT
    'V2 votos nominais' AS checagem,
    m.ano,
    m.cd_cargo,
    m.qt_votos AS qt_modelo,
    q.qt_votos AS qt_q5
FROM modelo_votos AS m
LEFT JOIN q5 AS q ON m.ano = q.ano AND m.cd_cargo = q.cd_cargo
WHERE m.qt_votos IS DISTINCT FROM q.qt_votos;

-- V3. A carga da legenda fecha com o arquivo do TSE (1º turno, cargos proporcionais).
WITH arquivo AS (
    SELECT
        ano_eleicao::integer AS ano,
        cd_cargo::integer AS cd_cargo,
        sum(qt_votos_legenda_validos::bigint) AS qt_legenda
    FROM
        read_csv(
            'dados/raw/resultados/*/votacao_partido_munzona_[0-9]*/votacao_partido_munzona_[0-9]*_??.csv',
            delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
            all_varchar = TRUE, union_by_name = TRUE
        )
    WHERE cd_tipo_eleicao = '2' AND nr_turno = '1' AND cd_cargo IN ('6', '7', '13')
    GROUP BY ALL
),

carga AS (
    SELECT
        ano,
        cd_cargo,
        sum(qt_votos_legenda_validos) AS qt_legenda
    FROM modelo.votacao_legenda_municipio
    WHERE cd_cargo IN (6, 7, 13)
    GROUP BY ALL
)

SELECT
    'V3 legenda carregada' AS checagem,
    a.ano,
    a.cd_cargo,
    a.qt_legenda AS qt_arquivo,
    c.qt_legenda AS qt_carga
FROM arquivo AS a
LEFT JOIN carga AS c ON a.ano = c.ano AND a.cd_cargo = c.cd_cargo
WHERE a.qt_legenda IS DISTINCT FROM c.qt_legenda;

-- V4. A distribuição COM legenda reproduz o TSE: quem o modelo elege é quem o TSE
--     declarou ELEITO POR QP ou ELEITO POR MÉDIA, candidato a candidato.
SELECT
    'V4 eleito ≠ TSE' AS checagem,
    k.ano,
    k.sg_uf,
    k.sg_ue,
    k.cd_cargo,
    k.nm_candidato,
    k.sg_partido,
    k.ds_sit_tot_turno,
    k.nr_ordem,
    l.qt_cadeiras_com
FROM q5_candidato AS k
INNER JOIN q5_lista_cadeiras AS l
    ON
        k.cd_eleicao = l.cd_eleicao
        AND k.sg_ue = l.sg_ue
        AND k.cd_cargo = l.cd_cargo
        AND k.sq_coligacao = l.sq_coligacao
WHERE k.fl_eleito_tse <> (k.nr_ordem <= l.qt_cadeiras_com);

-- V5. As cadeiras distribuídas somam as vagas, nos dois cenários.
--     Exceção conhecida (2024, vereador): os 17 municípios da V7 de q4_escolaridade.sql
--     não têm voto nominal de vereador publicado: nenhuma cadeira é distribuída (34 linhas,
--     os dois cenários).
WITH distribuidas AS (
    SELECT
        cd_eleicao,
        sg_ue,
        cd_cargo,
        cd_cenario,
        sum(qt_cadeiras) AS qt_cadeiras
    FROM q5_distribuicao
    GROUP BY ALL
)

SELECT
    'V5 cadeiras ≠ vagas' AS checagem,
    e.ano,
    v.sg_ue,
    v.cd_cargo,
    d.cd_cenario,
    d.qt_cadeiras,
    v.qt_vaga
FROM modelo.vaga AS v
INNER JOIN modelo.eleicao AS e ON v.cd_eleicao = e.cd_eleicao
LEFT JOIN distribuidas AS d ON v.cd_eleicao = d.cd_eleicao AND v.sg_ue = d.sg_ue AND v.cd_cargo = d.cd_cargo
WHERE
    v.cd_cargo IN (6, 7, 13)
    AND e.ano BETWEEN 2018 AND 2024
    AND d.qt_cadeiras IS DISTINCT FROM v.qt_vaga
ORDER BY e.ano, v.sg_ue, d.cd_cenario;

-- V6. A fase 1 (quociente partidário) é o ELEITO POR QP do TSE, lista a lista.
WITH qp AS (
    SELECT
        cd_eleicao,
        sg_ue,
        cd_cargo,
        sq_coligacao,
        count(*) FILTER (WHERE upper(strip_accents(ds_sit_tot_turno)) = 'ELEITO POR QP') AS qt_qp_tse
    FROM q5_candidato
    GROUP BY ALL
)

SELECT
    'V6 fase 1 ≠ ELEITO POR QP' AS checagem,
    d.ano,
    d.sg_ue,
    d.cd_cargo,
    d.sg_lista,
    d.qt_fase1,
    q.qt_qp_tse
FROM q5_distribuicao AS d
INNER JOIN qp AS q
    ON
        d.cd_eleicao = q.cd_eleicao
        AND d.sg_ue = q.sg_ue
        AND d.cd_cargo = q.cd_cargo
        AND d.sq_coligacao = q.sq_coligacao
WHERE d.cd_cenario = 'COM LEGENDA' AND d.qt_fase1 <> q.qt_qp_tse;

-- V7. Cobertura: deputados nos 6 estados; vereador em todos os municípios.
--     Exceção conhecida: MT em 2020 (141 de 142), sem Boa Esperança do Norte, criado depois.
WITH m AS (
    SELECT
        sg_uf,
        count(*) AS qt_municipios
    FROM modelo.municipio
    GROUP BY sg_uf
)

SELECT
    'V7 cobertura' AS checagem,
    k.ano,
    k.cd_cargo,
    k.sg_uf,
    count(DISTINCT k.sg_ue) AS qt_ues,
    any_value(m.qt_municipios) AS qt_municipios
FROM q5_lista_cadeiras AS k
INNER JOIN m ON k.sg_uf = m.sg_uf
GROUP BY k.ano, k.cd_cargo, k.sg_uf
HAVING count(DISTINCT k.sg_ue) <> CASE WHEN k.cd_cargo = 13 THEN any_value(m.qt_municipios) ELSE 1 END
UNION ALL
SELECT
    'V7 cobertura' AS checagem,
    ano,
    cd_cargo,
    'UFs' AS sg_uf,
    count(DISTINCT sg_uf) AS qt_ues,
    6 AS qt_municipios
FROM q5_lista_cadeiras
GROUP BY ano, cd_cargo
HAVING count(DISTINCT sg_uf) <> 6;

-- V8. Toda cadeira que uma lista ganha pela legenda sai de outra lista da mesma UE.
SELECT
    'V8 troca desequilibrada' AS checagem,
    ano,
    sg_ue,
    cd_cargo,
    count(*) FILTER (WHERE tp_efeito = 'ELEITO PELA LEGENDA') AS qt_eleitos,
    count(*) FILTER (WHERE tp_efeito = 'FORA PELA LEGENDA') AS qt_fora
FROM q5_eleito_legenda
GROUP BY ano, sg_ue, cd_cargo
HAVING
    count(*) FILTER (WHERE tp_efeito = 'ELEITO PELA LEGENDA')
    <> count(*) FILTER (WHERE tp_efeito = 'FORA PELA LEGENDA');
