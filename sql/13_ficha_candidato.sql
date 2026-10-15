-- 13_ficha_candidato.sql — patrimônio e votos das candidaturas (tabelas do DER) e a
-- ficha dos eleitos que a aba "Candidatos" do painel mostra.
--
-- Rodar da RAIZ do repositório, depois do 06_carga_nucleo e da prestação de contas
-- (01 a 05, que montam mart_q8 e mart_q9):
--
--     uv run python scripts/carregar_staging.py 01_staging 02_fonte 03_tipo 04_politico 05_marts 13_ficha
--
-- Dados (coleta sem baixar os zips inteiros):
--
--     uv run python -m scripts.coleta.coleta_tse recorte_remoto --uf AM,GO,MA,MT,RS,SE
--
--     dados/raw/candidatos/<ano>/bens_candidato_<ano>/bem_candidato_<ano>_<UF>.csv
--     dados/raw/resultados/<ano>/votacao_candidato_munzona_<ano>/votacao_candidato_munzona_<ano>_<UF>.csv
--
-- Idempotente: esvazia as duas tabelas que carrega e recarrega.

INSTALL encodings;
LOAD encodings;

DELETE FROM modelo.bem_candidato;
DELETE FROM modelo.votacao_candidato_municipio;

-- ---------------------------------------------------------------------------
-- BEM_CANDIDATO: um bem declarado por linha. A candidatura é achada por
-- (ano, sq_candidato), que o TSE não repete dentro de uma eleição ordinária.
-- Bem sem tipo ou sem valor (o TSE grava "#NULO") fica de fora: as duas colunas
-- são obrigatórias no DER.
-- ---------------------------------------------------------------------------
INSERT INTO modelo.bem_candidato
SELECT
    c.id_candidatura,
    b.nr_ordem_bem,
    any_value(b.ds_tipo_bem) AS ds_tipo_bem,
    any_value(b.vr_bem) AS vr_bem
FROM (
    SELECT
        ano_eleicao::integer AS ano,
        try_cast(sq_candidato AS bigint) AS sq_candidato,
        try_cast(nr_ordem_bem_candidato AS integer) AS nr_ordem_bem,
        left(limpa(ds_tipo_bem_candidato), 100) AS ds_tipo_bem,
        valor_br(vr_bem_candidato) AS vr_bem
    FROM
        read_csv(
            'dados/raw/candidatos/*/bens_candidato_[0-9]*/bem_candidato_[0-9]*_??.csv',
            delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
            all_varchar = TRUE, union_by_name = TRUE
        )
    WHERE cd_tipo_eleicao = '2'
) AS b
INNER JOIN modelo.candidatura AS c ON b.ano = c.ano AND b.sq_candidato = c.sq_candidato
WHERE b.nr_ordem_bem IS NOT NULL AND b.ds_tipo_bem IS NOT NULL AND b.vr_bem IS NOT NULL
GROUP BY c.id_candidatura, b.nr_ordem_bem;

-- ---------------------------------------------------------------------------
-- VOTACAO_CANDIDATO_MUNICIPIO: o arquivo vem por zona; aqui soma por município.
-- CD_MUNICIPIO é o código do TSE, trocado pelo do IBGE via MUNICIPIO.
-- ---------------------------------------------------------------------------
INSERT INTO modelo.votacao_candidato_municipio
SELECT
    c.id_candidatura,
    m.cod_ibge,
    v.nr_turno,
    sum(v.qt_votos_nominais) AS qt_votos_nominais,
    sum(v.qt_votos_nominais_validos) AS qt_votos_nominais_validos
FROM (
    SELECT
        ano_eleicao::integer AS ano,
        nr_turno::integer AS nr_turno,
        try_cast(sq_candidato AS bigint) AS sq_candidato,
        lpad(cd_municipio, 5, '0') AS cd_municipio,
        coalesce(try_cast(qt_votos_nominais AS bigint), 0) AS qt_votos_nominais,
        coalesce(try_cast(qt_votos_nominais_validos AS bigint), 0) AS qt_votos_nominais_validos
    FROM
        read_csv(
            'dados/raw/resultados/*/votacao_candidato_munzona_[0-9]*/votacao_candidato_munzona_[0-9]*_??.csv',
            delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
            all_varchar = TRUE, union_by_name = TRUE
        )
    WHERE cd_tipo_eleicao = '2'
) AS v
INNER JOIN modelo.candidatura AS c ON v.ano = c.ano AND v.sq_candidato = c.sq_candidato
INNER JOIN modelo.municipio AS m ON v.cd_municipio = lpad(m.cod_tse, 5, '0')
GROUP BY c.id_candidatura, m.cod_ibge, v.nr_turno;

-- ---------------------------------------------------------------------------
-- Ficha do eleito: perfil, votos, patrimônio e campanha numa linha.
-- Campanha vem de mart_q8 (receita por origem) e mart_q9 (propaganda por canal),
-- as mesmas views da Q8 e da Q9: os números da ficha batem com as perguntas.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW ficha_eleito AS
WITH urna AS (
    -- nome de urna: fora do DER, vem do arquivo do TSE pela chave da candidatura
    SELECT
        ano_eleicao::integer AS ano,
        try_cast(sq_candidato AS bigint) AS sq_candidato,
        any_value(limpa(nm_urna_candidato)) AS nm_urna
    FROM
        read_csv(
            'dados/raw/candidatos/*/candidatos_[0-9]*/consulta_cand_[0-9]*_??.csv',
            delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
            all_varchar = TRUE, union_by_name = TRUE
        )
    WHERE cd_tipo_eleicao = '2'
    GROUP BY ALL
),

ultimo_turno AS (
    -- o turno que decidiu: o último que a candidatura disputou
    SELECT *
    FROM modelo.votacao_candidato_municipio
    QUALIFY nr_turno = max(nr_turno) OVER (PARTITION BY id_candidatura)
),

votos AS (
    SELECT
        id_candidatura,
        sum(qt_votos_nominais) AS qt_votos,
        arg_max(cod_ibge, qt_votos_nominais) AS cod_ibge_mais_votos
    FROM ultimo_turno
    GROUP BY id_candidatura
),

bens AS (
    SELECT
        id_candidatura,
        sum(vr_bem) AS vr_patrimonio,
        count(*) AS qt_bens
    FROM modelo.bem_candidato
    GROUP BY id_candidatura
),

propaganda AS (
    SELECT
        ano,
        sq_candidato,
        sum(vr_despesa) AS vr_propaganda,
        arg_max(ds_canal, vr_despesa) AS ds_canal_principal
    FROM mart_q9
    GROUP BY ano, sq_candidato
)

SELECT
    c.id_candidatura,
    c.ano,
    c.sg_ue,
    c.cd_cargo,
    g.ds_cargo,
    c.sq_candidato,
    c.nr_titulo_eleitoral,
    p.nm_candidato,
    pa.sg_partido,
    c.nr_idade_eleicao,
    c.ds_genero,
    c.ds_cor_raca,
    gi.ds_grau_instrucao,
    c.ds_ocupacao,
    c.ds_sit_tot_turno,
    v.qt_votos,
    mv.nm_municipio AS nm_municipio_mais_votos,
    b.vr_patrimonio,
    b.qt_bens,
    -- NULL = sem prestação de contas carregada para aquele ano e UF
    q8.vr_total AS vr_receita,
    q8.vr_publico,
    q8.vr_privado,
    q8.vr_proprio,
    q8.vr_partidario,
    q8.vr_transferencia,
    q8.qt_doadores,
    q8.pc_publico,
    pr.vr_propaganda,
    pr.ds_canal_principal,
    -- eleição geral: sg_ue é a sigla da UF; municipal: UF e nome vêm do município
    coalesce(m.sg_uf, c.sg_ue) AS sg_uf,
    coalesce(m.nm_municipio, c.sg_ue) AS nm_ue,
    coalesce(u.nm_urna, p.nm_candidato) AS nm_urna
FROM modelo.candidatura AS c
INNER JOIN modelo.cargo AS g ON c.cd_cargo = g.cd_cargo
LEFT JOIN modelo.municipio AS m ON c.cod_ibge = m.cod_ibge
LEFT JOIN modelo.politico AS p ON c.nr_titulo_eleitoral = p.nr_titulo_eleitoral
LEFT JOIN modelo.partido AS pa ON c.ano = pa.ano AND c.nr_partido = pa.nr_partido
LEFT JOIN modelo.grau_instrucao AS gi ON c.cd_grau_instrucao = gi.cd_grau_instrucao
LEFT JOIN urna AS u ON c.ano = u.ano AND c.sq_candidato = u.sq_candidato
LEFT JOIN votos AS v ON c.id_candidatura = v.id_candidatura
LEFT JOIN modelo.municipio AS mv ON v.cod_ibge_mais_votos = mv.cod_ibge
LEFT JOIN bens AS b ON c.id_candidatura = b.id_candidatura
LEFT JOIN mart_q8 AS q8 ON c.ano = q8.ano AND c.sq_candidato = q8.sq_candidato
LEFT JOIN propaganda AS pr ON c.ano = pr.ano AND c.sq_candidato = pr.sq_candidato
WHERE
    c.fl_eleito
    AND c.ano IN (2022, 2024)
    AND c.cd_cargo IN (3, 5, 6, 7, 11, 13);          -- sem presidente, vices e suplentes
