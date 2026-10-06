-- 03_tipo_despesa.sql — classificação da despesa por canal de propaganda (Q11).
--
-- Dono: Enrico. Depende de 01_staging.sql (stg_despesa).
-- Critério escrito em docs/q11-propaganda.md.
--
-- Duas normalizações antes de classificar:
--
-- ① O prefixo `BAIXA DE ESTIMAVEIS - `. Até 2016 o recurso estimável (o palanque
--    emprestado, o carro cedido) entrava como despesa própria com esse prefixo,
--    criando um par para quase toda categoria: `PUBLICIDADE POR MATERIAIS
--    IMPRESSOS` e `BAIXA DE ESTIMAVEIS - PUBLICIDADE POR MATERIAIS IMPRESSOS`.
--    De 2018 em diante o mesmo gasto vem sem prefixo. Comparar 2016 com 2024 sem
--    tirar o prefixo parte a série no meio. Não é duplicata: é a mesma despesa
--    com outro nome, então normaliza e soma.
--
-- ② `PUBLICIDADE POR PLACAS, ESTANDARTES E FAIXAS` só existe em 2014 — a
--    categoria foi extinta, não o gasto. Ele passou a cair em adesivos e
--    impressos. Fica como canal próprio, com a ressalva no doc.

CREATE OR REPLACE VIEW stg_despesa_classificada AS
WITH normalizada AS (
    SELECT
        d.*,
        -- tira o prefixo e o que sobra é a categoria canônica
        regexp_replace(d.ds_tipo_despesa, '^BAIXA DE ESTIMAVEIS - ', '') AS ds_tipo_canonico,
        d.ds_tipo_despesa LIKE 'BAIXA DE ESTIMAVEIS -%' AS fl_estimavel
    FROM stg_despesa AS d
)

SELECT
    n.*,
    CASE n.ds_tipo_canonico
        -- material físico que o eleitor leva ou vê na rua
        WHEN 'PUBLICIDADE POR MATERIAIS IMPRESSOS' THEN 'IMPRESSO'
        WHEN 'PUBLICIDADE POR ADESIVOS' THEN 'ADESIVO'
        WHEN 'PUBLICIDADE POR PLACAS, ESTANDARTES E FAIXAS' THEN 'PLACA E FAIXA'
        -- mídia eletrônica tradicional
        WHEN 'PRODUCAO DE PROGRAMAS DE RADIO, TELEVISAO OU VIDEO' THEN 'RADIO E TV'
        WHEN 'PRODUCAO DE JINGLES, VINHETAS E SLOGANS' THEN 'JINGLE'
        WHEN 'PUBLICIDADE POR CARROS DE SOM' THEN 'CARRO DE SOM'
        WHEN 'PUBLICIDADE POR JORNAIS E REVISTAS' THEN 'JORNAL E REVISTA'
        WHEN 'PUBLICIDADE POR TELEMARKETING' THEN 'TELEMARKETING'
        -- digital. `IMPULSIONAMENTO` só existe de 2018 em diante: a Lei
        -- 13.488/2017 liberou o impulsionamento pago e criou a rubrica.
        WHEN 'DESPESA COM IMPULSIONAMENTO DE CONTEUDOS' THEN 'DIGITAL'
        WHEN 'CRIACAO E INCLUSAO DE PAGINAS NA INTERNET' THEN 'DIGITAL'
        -- corpo a corpo: é propaganda, mas de outra natureza
        WHEN 'ATIVIDADES DE MILITANCIA E MOBILIZACAO DE RUA' THEN 'RUA'
        WHEN 'COMICIOS' THEN 'RUA'
        WHEN 'EVENTOS DE PROMOCAO DA CANDIDATURA' THEN 'RUA'
    END AS ds_canal_propaganda
FROM normalizada AS n;

-- Entidade TIPO_DESPESA do DER, materializada dos valores que existem de fato.
CREATE OR REPLACE TABLE tipo_despesa AS
SELECT
    row_number() OVER (ORDER BY ds_tipo_canonico) AS cd_tipo_despesa,
    ds_tipo_canonico AS ds_tipo_despesa,
    ds_canal_propaganda,
    ds_canal_propaganda IS NOT NULL AS fl_propaganda,
    count(*) AS qt_linhas,
    sum(vr_despesa) AS vr_total,
    min(ano) AS ano_min,
    max(ano) AS ano_max
FROM stg_despesa_classificada
GROUP BY ds_tipo_canonico, ds_canal_propaganda;
