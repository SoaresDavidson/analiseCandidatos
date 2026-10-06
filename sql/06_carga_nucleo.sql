-- 06_carga_nucleo.sql — carga do núcleo do modelo: território, escolaridade e candidatura.
--
-- Primeiro módulo do que substitui o antigo 06_carga_modelo.sql (removido no PR #28).
-- Carrega só as tabelas de que a pergunta de escolaridade precisa, mais as que as
-- FKs de CANDIDATURA obrigam. Finanças, votação e propostas ficam para outros módulos.
--
-- Rodar da RAIZ do repositório, depois do 00:
--
--     uv run python scripts/carregar_staging.py 00_modelo 06_carga_nucleo
--
-- Dados (coleta por UF; o mesmo vale para qualquer lista de UFs e anos):
--
--     dados/raw/candidatos/<ano>/candidatos_<ano>/consulta_cand_<ano>_<UF>.csv
--     dados/raw/candidatos/<ano>/vagas_<ano>/consulta_vagas_<ano>_<UF>.csv
--     dados/raw/extras/municipio_tse_ibge/municipio_tse_ibge.csv
--     dados/raw/ibge/sidra/10061_instrucao_municipios.json
--
-- Lê os arquivos por UF (`_AM`, `_GO`…), não o `_BRASIL`: é o que `--uf` extrai.
-- Idempotente: apaga as tabelas que carrega (filhas antes das mães) e recarrega.
-- Se outro módulo já tiver gravado filhas de CANDIDATURA, o DELETE falha e nada muda.
--
-- A lógica vem do antigo 06 (git show fd853ea:sql/06_carga_modelo.sql), com duas
-- mudanças: a região da UF sai do código IBGE, não da planilha do PIB; e
-- MUNICIPIO fica sem as regiões geográficas, que só a planilha do PIB trazia.

INSTALL encodings;
LOAD encodings;

-- ---------------------------------------------------------------------------
-- Limpeza
-- ---------------------------------------------------------------------------

-- sentinelas do TSE (#NULO, #NE, -1, -3, -4) viram NULL
CREATE OR REPLACE TEMP MACRO nulo(x) AS
CASE
    WHEN
        x IS NULL
        OR upper(trim(x)) IN ('', '#NULO', '#NULO#', '#NE', '#NE#', '-1', '-3', '-4', 'NÃO DIVULGÁVEL')
        THEN NULL
    ELSE trim(x)
END;

CREATE OR REPLACE TEMP MACRO data_br(x) AS try_strptime(substr(nulo(x), 1, 10), '%d/%m/%Y')::date;

-- R1: só eleição ordinária (código 2; 0 em 2006)
CREATE OR REPLACE TEMP MACRO ordinaria(cd, ano) AS cd = '2' OR (cd = '0' AND ano = '2006');

-- SIDRA 10061: a primeira linha do JSON repete o cabeçalho; ela some no TRY_CAST de D1C.
CREATE OR REPLACE TEMP TABLE stg_sidra_10061 AS
SELECT
    d1c::varchar AS d1c,
    d3n::varchar AS d3n,
    d4c::varchar AS d4c,
    d4n::varchar AS d4n,
    v::varchar AS v
FROM read_json('dados/raw/ibge/sidra/10061_instrucao_municipios.json', format = 'array')
WHERE try_cast(d1c AS integer) IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Esvazia o que este módulo carrega, das filhas para as mães
-- ---------------------------------------------------------------------------

DELETE FROM modelo.vaga;
DELETE FROM modelo.candidatura;
DELETE FROM modelo.politico;
DELETE FROM modelo.partido;
DELETE FROM modelo.cargo;
DELETE FROM modelo.eleicao;
DELETE FROM modelo.censo_instrucao;
DELETE FROM modelo.grau_instrucao;
DELETE FROM modelo.nivel_instrucao;
DELETE FROM modelo.municipio;
DELETE FROM modelo.uf;

-- ---------------------------------------------------------------------------
-- Staging: cada arquivo é lido uma vez, só com as colunas usadas
-- ---------------------------------------------------------------------------

-- Uma linha por candidatura × turno. DISTINCT: se a mesma UF vier de dois
-- arquivos, as linhas iguais colapsam.
CREATE OR REPLACE TEMP TABLE stg_cand AS
SELECT DISTINCT
    ano_eleicao::integer AS ano,
    nr_turno::integer AS nr_turno,
    cd_eleicao::integer AS cd_eleicao,
    data_br(dt_eleicao) AS dt_eleicao,
    upper(tp_abrangencia) AS tp_abrangencia,
    nulo(sg_ue) AS sg_ue,
    cd_cargo::integer AS cd_cargo,
    upper(nulo(ds_cargo)) AS ds_cargo,
    try_cast(sq_candidato AS bigint) AS sq_candidato,
    CASE
        WHEN
            regexp_matches(nr_titulo_eleitoral_candidato, '^[0-9]{1,12}$')
            AND try_cast(nr_titulo_eleitoral_candidato AS bigint) > 0
            THEN lpad(nr_titulo_eleitoral_candidato, 12, '0')
    END AS nr_titulo_eleitoral,
    nulo(nm_candidato) AS nm_candidato,
    data_br(dt_nascimento) AS dt_nascimento,
    nulo(sg_uf_nascimento) AS sg_uf_nascimento,
    nulo(ds_genero) AS ds_genero,
    nulo(ds_cor_raca) AS ds_cor_raca,
    nulo(ds_ocupacao) AS ds_ocupacao,
    try_cast(cd_grau_instrucao AS integer) AS cd_grau_instrucao,
    ds_grau_instrucao,
    nulo(ds_sit_tot_turno) AS ds_sit_tot_turno,
    try_cast(nr_partido AS integer) AS nr_partido,
    nulo(sg_partido) AS sg_partido,
    nulo(nm_partido) AS nm_partido
FROM
    read_csv(
        'dados/raw/candidatos/*/candidatos_[0-9]*/consulta_cand_[0-9]*_??.csv',
        delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
        all_varchar = TRUE, union_by_name = TRUE
    )
WHERE
    ordinaria(cd_tipo_eleicao, ano_eleicao)
    AND sg_uf NOT IN ('BR', 'ZZ', 'VT')
    AND try_cast(sq_candidato AS bigint) IS NOT NULL;

CREATE OR REPLACE TEMP TABLE stg_vagas AS
SELECT DISTINCT
    cd_eleicao::integer AS cd_eleicao,
    sg_ue,
    cd_cargo::integer AS cd_cargo,
    upper(ds_cargo) AS ds_cargo,
    try_cast(qt_vaga AS integer) AS qt_vaga
FROM
    read_csv(
        'dados/raw/candidatos/*/vagas_*/consulta_vagas_*_??.csv',
        delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
        all_varchar = TRUE, union_by_name = TRUE
    )
WHERE ordinaria(cd_tipo_eleicao, ano_eleicao);

-- ---------------------------------------------------------------------------
-- Território
-- ---------------------------------------------------------------------------

CREATE OR REPLACE TEMP TABLE stg_municipio AS
SELECT
    cd_municipio_ibge::integer AS cod_ibge,
    cd_municipio_tse AS cod_tse,
    nm_municipio_ibge AS nm_municipio,
    sg_uf,
    cd_uf_ibge::integer AS cd_uf_ibge,
    nm_uf
FROM
    read_csv(
        'dados/raw/extras/municipio_tse_ibge/municipio_tse_ibge.csv',
        delim = ';', quote = '"', header = TRUE, encoding = 'cp1252', all_varchar = TRUE
    )
WHERE sg_uf NOT IN ('ZZ', 'BR') AND try_cast(cd_municipio_ibge AS integer) IS NOT NULL;

-- Região pelo primeiro dígito do código IBGE da UF.
INSERT INTO modelo.uf
SELECT
    sg_uf,
    any_value(cd_uf_ibge) AS cd_uf_ibge,
    any_value(nm_uf) AS nm_uf,
    CASE any_value(cd_uf_ibge) // 10
        WHEN 1 THEN 'Norte'
        WHEN 2 THEN 'Nordeste'
        WHEN 3 THEN 'Sudeste'
        WHEN 4 THEN 'Sul'
        WHEN 5 THEN 'Centro-Oeste'
    END AS nm_regiao
FROM stg_municipio
GROUP BY sg_uf;

INSERT INTO modelo.municipio (cod_ibge, cod_tse, nm_municipio, sg_uf)
SELECT
    cod_ibge,
    cod_tse,
    nm_municipio,
    sg_uf
FROM stg_municipio;

-- ---------------------------------------------------------------------------
-- Escolaridade
-- ---------------------------------------------------------------------------

-- Os quatro níveis do Censo; a categoria Total (120704) não é nível.
INSERT INTO modelo.nivel_instrucao
SELECT
    cd_nivel,
    d4n AS ds_nivel,
    d4c::integer AS cd_categoria_sidra,
    cd_nivel AS nr_ordem
FROM (
    SELECT DISTINCT
        d4c,
        d4n,
        CASE d4n
            WHEN 'Sem instrução e fundamental incompleto' THEN 1
            WHEN 'Fundamental completo e médio incompleto' THEN 2
            WHEN 'Médio completo e superior incompleto' THEN 3
            WHEN 'Superior completo' THEN 4
        END AS cd_nivel
    FROM stg_sidra_10061
    WHERE d4c <> '120704'
) AS niveis;

-- Pessoas de 18 anos ou mais por município e nível (Censo 2022). Sem a linha Total:
-- com ela, toda contagem dobra.
INSERT INTO modelo.censo_instrucao
SELECT
    s.d1c::integer AS cod_ibge,
    n.cd_nivel,
    s.d3n::integer AS ano_censo,
    try_cast(s.v AS bigint) AS qt_pessoas
FROM stg_sidra_10061 AS s
INNER JOIN modelo.nivel_instrucao AS n ON n.cd_categoria_sidra = s.d4c::integer
WHERE s.d1c::integer IN (SELECT m.cod_ibge FROM modelo.municipio AS m);

-- Grau do TSE (1 a 8) com o nível do Censo equivalente: o de-para da pergunta.
-- -4 e 0 entram com nível nulo, para a candidatura não perder a FK.
-- A descrição vem do ano mais recente, porque a grafia muda entre anos.
INSERT INTO modelo.grau_instrucao
SELECT
    cd_grau_instrucao,
    arg_max(ds_grau_instrucao, ano) AS ds_grau_instrucao,
    CASE
        WHEN cd_grau_instrucao IN (1, 2, 3) THEN 1
        WHEN cd_grau_instrucao IN (4, 5) THEN 2
        WHEN cd_grau_instrucao IN (6, 7) THEN 3
        WHEN cd_grau_instrucao = 8 THEN 4
    END AS cd_nivel
FROM stg_cand
WHERE cd_grau_instrucao IS NOT NULL
GROUP BY cd_grau_instrucao;

-- ---------------------------------------------------------------------------
-- Eleição, cargo, partido
-- ---------------------------------------------------------------------------

INSERT INTO modelo.eleicao
SELECT
    cd_eleicao,
    any_value(ano) AS ano,
    any_value(nr_turno) AS nr_turno,
    any_value(dt_eleicao) AS dt_eleicao,
    'ORDINARIA' AS tp_eleicao,
    any_value(tp_abrangencia) AS tp_abrangencia
FROM stg_cand
GROUP BY cd_eleicao;

INSERT INTO modelo.cargo
SELECT
    cd_cargo,
    arg_min(ds_cargo, prioridade) AS ds_cargo
FROM (
    SELECT
        cd_cargo,
        ds_cargo,
        1 AS prioridade
    FROM stg_cand
    UNION ALL
    SELECT
        cd_cargo,
        ds_cargo,
        2 AS prioridade
    FROM stg_vagas
) AS cargos
WHERE ds_cargo IS NOT NULL
GROUP BY cd_cargo;

INSERT INTO modelo.partido
SELECT
    ano,
    nr_partido,
    any_value(sg_partido) AS sg_partido,
    any_value(nm_partido) AS nm_partido
FROM stg_cand
WHERE nr_partido IS NOT NULL AND sg_partido IS NOT NULL
GROUP BY ano, nr_partido;

-- ---------------------------------------------------------------------------
-- Candidatura
-- ---------------------------------------------------------------------------

-- Uma linha por candidatura (não por turno): eleição do 1º turno, resultado do último.
CREATE OR REPLACE TEMP TABLE stg_candidatura AS
SELECT
    row_number() OVER (ORDER BY ano, sg_ue, cd_cargo, sq_candidato) AS id_candidatura,
    *
FROM (
    SELECT
        ano,
        sg_ue,
        cd_cargo,
        sq_candidato,
        arg_min(cd_eleicao, nr_turno) AS cd_eleicao,
        arg_min(dt_eleicao, nr_turno) AS dt_eleicao,
        arg_min(tp_abrangencia, nr_turno) AS tp_abrangencia,
        arg_max(ds_sit_tot_turno, nr_turno) AS ds_sit_tot_turno,
        arg_max(nr_titulo_eleitoral, nr_turno) AS nr_titulo_eleitoral,
        arg_max(nm_candidato, nr_turno) AS nm_candidato,
        arg_max(dt_nascimento, nr_turno) AS dt_nascimento,
        arg_max(sg_uf_nascimento, nr_turno) AS sg_uf_nascimento,
        arg_max(ds_genero, nr_turno) AS ds_genero,
        arg_max(ds_cor_raca, nr_turno) AS ds_cor_raca,
        arg_max(ds_ocupacao, nr_turno) AS ds_ocupacao,
        arg_max(cd_grau_instrucao, nr_turno) AS cd_grau_instrucao,
        arg_max(nr_partido, nr_turno) AS nr_partido
    FROM stg_cand
    GROUP BY ano, sg_ue, cd_cargo, sq_candidato
) AS por_candidatura;

-- Atributos estáveis da pessoa vêm da candidatura mais recente (R3: chave = título).
INSERT INTO modelo.politico
SELECT
    nr_titulo_eleitoral,
    nm_candidato,
    dt_nascimento,
    sg_uf_nascimento
FROM stg_candidatura
WHERE nr_titulo_eleitoral IS NOT NULL
QUALIFY row_number() OVER (PARTITION BY nr_titulo_eleitoral ORDER BY ano DESC, id_candidatura DESC) = 1;

INSERT INTO modelo.candidatura
SELECT
    c.id_candidatura,
    c.ano,
    c.sg_ue,
    c.sq_candidato,
    c.ds_genero,
    c.ds_cor_raca,
    c.ds_ocupacao,
    c.ds_sit_tot_turno,
    -- 'MEDIA' é o nome antigo de 'ELEITO POR MEDIA'; '2º TURNO' não é eleito.
    coalesce(
        upper(strip_accents(c.ds_sit_tot_turno)) IN ('ELEITO', 'ELEITO POR QP', 'ELEITO POR MEDIA', 'MEDIA'),
        FALSE
    ) AS fl_eleito,
    date_sub('year', c.dt_nascimento, c.dt_eleicao) AS nr_idade_eleicao,
    c.cd_eleicao,
    c.cd_cargo,
    c.nr_partido,
    c.nr_titulo_eleitoral,
    c.cd_grau_instrucao,
    m.cod_ibge
FROM stg_candidatura AS c
LEFT JOIN modelo.municipio AS m ON c.tp_abrangencia = 'MUNICIPAL' AND c.sg_ue = m.cod_tse;

-- VAGA: só eleições que já vieram de consulta_cand.
INSERT INTO modelo.vaga
SELECT
    v.cd_eleicao,
    v.cd_cargo,
    v.sg_ue,
    any_value(v.qt_vaga) AS qt_vaga,
    any_value(m.cod_ibge) AS cod_ibge
FROM stg_vagas AS v
INNER JOIN modelo.eleicao AS e ON v.cd_eleicao = e.cd_eleicao
LEFT JOIN modelo.municipio AS m ON e.tp_abrangencia = 'MUNICIPAL' AND v.sg_ue = m.cod_tse
WHERE v.qt_vaga > 0
GROUP BY v.cd_eleicao, v.cd_cargo, v.sg_ue;
