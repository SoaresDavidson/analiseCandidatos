-- 04_politico.sql — POLITICO e CANDIDATURA a partir do consulta_cand (Q12 do repo,
-- Q10 da lista de 10 entregue ao professor).
--
-- Dono: Enrico. Não depende do staging da prestação de contas.
--
-- 🚨 A chave da pessoa é NR_TITULO_ELEITORAL_CANDIDATO, nunca o CPF. Em 2024 o
--    TSE suprimiu o CPF: as 463.859 linhas trazem '-4' (dado protegido, LGPD). A
--    coluna não fica vazia, fica com um valor — uma checagem de nulo passa e a
--    eleição municipal inteira colapsa numa pessoa só.
--
-- Encoding: `cp1252` com `ignore_errors`, não `latin-1`. Os arquivos de 2008 e
-- 2016 têm bytes de controle (0x81, 0x83, 0x8a, 0x93) que fazem o DuckDB recusar
-- latin-1 com "File is not latin-1 encoded". São 7 linhas nos dois arquivos.

INSTALL encodings;
LOAD encodings;

CREATE OR REPLACE TABLE stg_candidatura AS
SELECT
    try_cast(sq_candidato AS BIGINT) AS sq_candidato,
    try_cast(ano_eleicao AS INTEGER) AS ano,
    try_cast(nr_turno AS INTEGER) AS nr_turno,
    -- Eleição suplementar (refeita num município depois de cassação) vem no mesmo
    -- arquivo do ano da ordinária. Até 2008 o sq_candidato é contador por UE, então
    -- uma suplementar pode repetir o sq de uma ordinária do mesmo município.
    coalesce(upper(strip_accents(nm_tipo_eleicao)) LIKE '%SUPLEMENTAR%', FALSE) AS fl_suplementar,
    -- VARCHAR(12) com zero à esquerda, como manda o contrato de chaves. O título
    -- vem com menos dígitos em anos antigos; sem o lpad a mesma pessoa aparece
    -- como duas entre eleições.
    CASE
        WHEN
            regexp_matches(nr_titulo_eleitoral_candidato, '^[0-9]{1,12}$')
            AND try_cast(nr_titulo_eleitoral_candidato AS BIGINT) > 0
            THEN lpad(nr_titulo_eleitoral_candidato, 12, '0')
    END AS nr_titulo_eleitoral,
    limpa(nm_candidato) AS nm_candidato,
    data_br(dt_nascimento) AS dt_nascimento,
    limpa(sg_uf_nascimento) AS sg_uf_nascimento,
    limpa(ds_genero) AS ds_genero,
    limpa(ds_grau_instrucao) AS ds_grau_instrucao,
    limpa(ds_cor_raca) AS ds_cor_raca,
    limpa(ds_ocupacao) AS ds_ocupacao,
    limpa(sg_uf) AS sg_uf,
    -- CANDIDATURA não tem coluna de município: em eleição municipal o vínculo é
    -- o SG_UE, que É o código TSE do município (VARCHAR(5), com zero à esquerda).
    limpa(sg_ue) AS sg_ue,
    limpa(nm_ue) AS nm_ue,
    try_cast(cd_cargo AS INTEGER) AS cd_cargo,
    limpa(ds_cargo) AS ds_cargo,
    try_cast(nr_partido AS INTEGER) AS nr_partido,
    limpa(sg_partido) AS sg_partido,
    try_cast(nr_federacao AS INTEGER) AS nr_federacao,
    limpa(sg_federacao) AS sg_federacao,
    limpa(ds_situacao_candidatura) AS ds_situacao_candidatura,
    limpa(ds_sit_tot_turno) AS ds_sit_tot_turno,
    -- derivada: 'MEDIA' é o nome do leiaute antigo para 'ELEITO POR MEDIA'.
    -- '2º TURNO' NÃO é eleito — é quem foi para o segundo turno.
    upper(strip_accents(coalesce(limpa(ds_sit_tot_turno), ''))) IN
    ('ELEITO', 'ELEITO POR QP', 'ELEITO POR MEDIA', 'MEDIA') AS fl_eleito
FROM
    read_csv(
        'dados/raw/candidatos/*/candidatos_[0-9]*/consulta_cand_[0-9]*_*.csv',
        delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
        all_varchar = TRUE, union_by_name = TRUE, ignore_errors = TRUE, filename = TRUE
    )
-- Recorte: a coleta extrai OU o _BRASIL (país todo) OU os _<UF> pedidos em --uf.
-- O _BRASIL é a concatenação das UFs, então num ano que tenha os dois só ele
-- entra; sem ele, entram os _<UF>. _BR (só presidente, já dentro do _BRASIL) e
-- _ZZ (exterior) ficam de fora nos dois casos.
WHERE
    regexp_extract(filename, '_([A-Za-z]+)\.csv$', 1) = 'BRASIL'
    OR (
        regexp_extract(filename, '_([A-Za-z]+)\.csv$', 1) NOT IN ('BRASIL', 'BR', 'ZZ')
        AND regexp_extract(filename, 'consulta_cand_([0-9]{4})_', 1) NOT IN (
            SELECT regexp_extract(g.file, 'consulta_cand_([0-9]{4})_BRASIL', 1)
            FROM glob('dados/raw/candidatos/*/candidatos_[0-9]*/consulta_cand_[0-9]*_BRASIL.csv') AS g
        )
    );

-- Uma linha por candidatura. O arquivo traz uma linha por turno; ficamos com o
-- último, que é onde está o resultado final.
--
-- 🚨 `sq_candidato` NÃO serve de chave em 2002–2008. Medido nos arquivos:
--
--   ano    linhas   (sq, turno) distintos
--   2002    18.109       5.169
--   2004   402.157       1.506   ← 402 mil linhas em 1.506 valores
--   2006    19.303       3.205
--   2008   382.079      68.683
--   2010+  todos         sem colisão
--
-- Até 2008 o campo tem de 1 a 5 dígitos e é um contador por unidade eleitoral,
-- não um identificador de candidato: `SQ_CANDIDATO = 62` aparece em quatro anos
-- com 2.004 títulos de eleitor diferentes. De 2010 em diante passa a ter 11–12
-- dígitos e fica único (2012 tem 91 colisões residuais).
--
-- Consequência prática: deduplicar por `sq_candidato` sozinho funde 400 mil
-- pessoas de 2004 em 1.506 registros — e sem erro nenhum, só com o número final
-- errado. A chave natural que vale em TODOS os anos é
-- (ano, sg_ue, cd_cargo, nr_turno, sq_candidato), mais `fl_suplementar`: a
-- suplementar de um município sai no arquivo do mesmo ano e pode repetir o sq.
--
-- Para a prestação de contas (2014+) o `sq_candidato` continua válido e é o join
-- do contrato: o problema só existe antes de 2010, que é território da Q12.
CREATE OR REPLACE TABLE candidatura AS
SELECT
    row_number() OVER (ORDER BY ano, fl_suplementar, sg_ue, cd_cargo, sq_candidato) AS id_candidatura,
    * EXCLUDE (rn)
FROM (
    SELECT
        c.*,
        row_number() OVER (
            PARTITION BY c.ano, c.fl_suplementar, c.sg_ue, c.cd_cargo, c.sq_candidato
            ORDER BY c.nr_turno DESC
        ) AS rn
    FROM stg_candidatura AS c
    WHERE c.sq_candidato IS NOT NULL
) AS ranqueada
WHERE rn = 1;

-- Uma linha por pessoa. Atributos que não mudam (nascimento, UF de nascimento)
-- vêm da candidatura mais recente, que é a de cadastro mais confiável.
CREATE OR REPLACE TABLE politico AS
SELECT * EXCLUDE (rn) FROM (
    SELECT
        nr_titulo_eleitoral,
        nm_candidato,
        dt_nascimento,
        sg_uf_nascimento,
        ds_genero,
        ds_cor_raca,
        row_number() OVER (PARTITION BY nr_titulo_eleitoral ORDER BY ano DESC) AS rn
    FROM candidatura
    WHERE nr_titulo_eleitoral IS NOT NULL
) AS ranqueada
WHERE rn = 1;
