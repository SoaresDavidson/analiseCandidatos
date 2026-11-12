-- 24_motivo_cassacao.sql — decisões da Justiça Eleitoral sobre candidaturas: registro
-- negado e cassação (marca na ficha dos eleitos).
--
-- O arquivo "motivo_cassacao" do TSE (CAND_MOTIVCASS_JULG_DCONSTDIPL) traz, por
-- candidatura, o motivo do indeferimento do registro, da cassação ou da desconstituição
-- do diploma. Quase tudo é registro negado; cassação mesmo são 4 casos nos 6 estados
-- (2024). São decisões já tomadas, não investigações.
--
-- Para carregar, da RAIZ do repositório:
--
--     uv run python -m scripts.coleta.coleta_tse recorte_remoto --uf AM,GO,MA,MT,RS,SE
--     uv run python scripts/carregar_staging.py 24_motivo
--
-- Lê modelo.candidatura e modelo.partido (06). Fora do DER: é uma tabela de apoio do
-- painel, como as views q*.
--
-- Famílias de motivo (ds_familia), para não chamar de "cassação" uma falha de papelada:
--   1 ilícito na campanha: cassação, abuso de poder, compra de voto (captação ilícita de
--     sufrágio), conduta vedada, gasto ilícito, fraude à cota de gênero;
--   2 inelegibilidade: Ficha Limpa (LC 64/90) e as outras inelegibilidades da lei;
--   3 falha formal ou do partido: requisito de registro, quitação eleitoral, partido ou
--     coligação indeferidos etc.
-- A ficha marca só as famílias 1 e 2 (fl_marca).
--
-- Limites: quem perde o mandato depois de eleito costuma ter a situação reescrita pelo TSE
-- para "não eleito" (Selma Arruda, senadora de MT em 2018); uma decisão sobre a chapa
-- (DRAP, cota de gênero) vale para todos os candidatos dela; o motivo não diz a alínea da
-- Ficha Limpa (condenação, contas rejeitadas...).

INSTALL encodings;
LOAD encodings;

CREATE OR REPLACE TABLE motivo_cassacao AS
SELECT
    ano_eleicao::integer AS ano,
    cd_tipo_eleicao::integer AS cd_tipo_eleicao,
    sg_uf,
    sg_ue,
    nm_ue,
    sq_candidato::bigint AS sq_candidato,
    nr_processo,
    ds_tp_motivo,
    trim(ds_motivo) AS ds_motivo
FROM read_csv(
    'dados/raw/candidatos/*/motivo_cassacao_*/motivo_cassacao_*_??.csv',
    delim = ';', quote = '"', header = TRUE, encoding = 'cp1252',
    all_varchar = TRUE, union_by_name = TRUE
);

-- Uma linha por decisão, ligada à candidatura (e à pessoa, pelo título de eleitor)
CREATE OR REPLACE VIEW cassacao_decisao AS
WITH classe AS (
    SELECT
        m.*,
        CASE
            WHEN m.ds_tp_motivo ILIKE '%cassa%' THEN 1
            -- registro negado por "Abuso de poder (LC 64/90)" é inelegibilidade por condenação
            -- anterior (LC 64/90, art. 1º, I, d/h), não ilícito naquela campanha
            WHEN
                m.ds_motivo ILIKE '%ficha limpa%'
                OR m.ds_motivo ILIKE '%inelegibilidade%'
                OR (m.ds_motivo ILIKE '%abuso%' AND m.ds_motivo ILIKE '%LC 64/90%')
                THEN 2
            WHEN
                m.ds_motivo ILIKE '%abuso%'
                OR m.ds_motivo ILIKE '%compra de voto%'
                OR m.ds_motivo ILIKE '%capta%'
                OR m.ds_motivo ILIKE '%conduta vedada%'
                OR m.ds_motivo ILIKE '%gasto il%'
                OR m.ds_motivo ILIKE '%fraude%'
                THEN 1
            ELSE 3
        END AS nr_familia
    FROM motivo_cassacao AS m
)

SELECT
    k.id_candidatura,
    c.ano,
    c.cd_tipo_eleicao,
    c.sg_uf,
    c.sg_ue,
    c.nm_ue,
    c.sq_candidato,
    k.nr_titulo_eleitoral,
    k.cd_cargo,
    p.sg_partido,
    k.ds_sit_tot_turno,
    c.nr_processo,
    c.ds_tp_motivo,
    c.ds_motivo,
    c.nr_familia,
    CASE c.nr_familia
        WHEN 1 THEN 'ILICITO NA CAMPANHA'
        WHEN 2 THEN 'INELEGIBILIDADE'
        ELSE 'FALHA FORMAL OU DO PARTIDO'
    END AS ds_familia,
    c.nr_familia IN (1, 2) AS fl_marca
FROM classe AS c
LEFT JOIN modelo.candidatura AS k
    ON c.ano = k.ano AND c.sq_candidato = k.sq_candidato AND c.sg_ue = k.sg_ue
LEFT JOIN modelo.partido AS p ON k.ano = p.ano AND k.nr_partido = p.nr_partido;
