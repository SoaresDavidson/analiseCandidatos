-- 12_q9_propaganda.sql — Q9: onde o candidato investe em propaganda.
--
-- "Onde o candidato investe em propaganda (nuvem de palavras)?" [E.P.]
--
-- Dono: Enrico. Depende de 01 a 05 (lê só mart_q9 e mart_q9_texto). Para carregar:
--
--     uv run scripts/carregar_staging.py 01_staging 02_fonte 03_tipo 04_politico 05_marts 12_q9
--
-- Duas respostas, porque a nuvem mostra FREQUÊNCIA e a pergunta é sobre
-- INVESTIMENTO:
--   q9_canal  quanto foi gasto em cada canal (o canal vem do tipo de despesa do
--             TSE, de-para em 03_tipo_despesa.sql)
--   q9_termo  as palavras do texto livre (ds_despesa) que o candidato escreveu
--             na prestação de contas — o que o canal não diz ("santinho",
--             "bandeira", "impulsionamento facebook")

-- ---------------------------------------------------------------------------
-- Base: as mesmas regras da Q8 (anos divulgados, sem vices e suplentes)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q9_despesa AS
SELECT
    ano,
    sg_uf,
    ds_cargo,
    fl_eleito,
    ds_canal,
    ds_tipo_despesa,
    vr_despesa,
    ds_despesa,
    row_number() OVER () AS id_despesa
FROM mart_q9_texto
WHERE
    fl_divulgado
    AND ds_cargo IN (
        'VEREADOR', 'PREFEITO', 'DEPUTADO ESTADUAL', 'DEPUTADO FEDERAL', 'SENADOR', 'GOVERNADOR'
    );

-- ---------------------------------------------------------------------------
-- Quanto foi gasto em cada canal
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q9_canal AS
SELECT
    ano,
    sg_uf,
    ds_cargo,
    fl_eleito,
    ds_canal,
    -- candidatos que gastaram algo no canal (não soma entre canais: o mesmo
    -- candidato aparece em vários)
    count(DISTINCT sq_candidato) AS qt_candidatos,
    sum(qt_despesas) AS qt_despesas,
    sum(vr_despesa) AS vr_despesa
FROM mart_q9
WHERE
    fl_divulgado
    AND ds_cargo IN (
        'VEREADOR', 'PREFEITO', 'DEPUTADO ESTADUAL', 'DEPUTADO FEDERAL', 'SENADOR', 'GOVERNADOR'
    )
GROUP BY ALL;

-- ---------------------------------------------------------------------------
-- Palavras do texto livre
--
-- Passos, nesta ordem:
--   1. maiúsculas e sem acento ("Serviço" e "SERVICO" viram a mesma palavra);
--   2. expressões de duas ou mais palavras viram um termo só, senão "cabo
--      eleitoral" vira "cabo" e "carro de som" vira "carro" + "som";
--   3. quebra em palavras;
--   4. plural → singular por regra simples (santinhos → santinho,
--      impressões → impressão, materiais → material);
--   5. cada termo conta uma vez por despesa ("santinho" e "santinhos" na
--      mesma despesa contam uma) e saem as palavras vazias (q9_palavra_vazia).
-- ---------------------------------------------------------------------------

-- Palavras que aparecem em quase toda despesa e não dizem ONDE se investiu:
-- artigos e preposições, o vocabulário da prestação de contas, o cargo, medidas
-- e abreviações. A lista saiu dos 160 termos mais frequentes (2018–2024).
CREATE OR REPLACE TABLE q9_palavra_vazia AS
SELECT unnest([
    -- artigos, preposições, conectivos
    'PARA', 'COM', 'POR', 'COMO', 'NAS', 'NOS', 'DAS', 'DOS', 'UMA', 'UNS', 'AOS', 'QUE',
    'SEM', 'SOB', 'ATE', 'MAIS', 'ENTRE', 'PELO', 'PELA', 'SUA', 'SEU', 'ESTE', 'ESTA',
    -- o vocabulário da prestação de contas
    'SERVICO', 'SERV', 'PRESTACAO', 'PREST', 'PRESTADO', 'CONTRATO', 'CONTRATACAO',
    'ATIVIDADE', 'DESPESA', 'PAGAMENTO', 'REFERENTE', 'REF', 'CONFORME', 'NOTA', 'FISCAL',
    'VALOR', 'EMPRESA', 'FORNECIMENTO', 'AQUISICAO', 'COMPRA', 'PESSOAL', 'APOIO', 'VER',
    -- a própria eleição e o cargo
    'ELEITORAL', 'CAMPANHA', 'CAMP', 'ELEICAO', 'POLITICA', 'POLITICO', 'CANDIDATO',
    'CANDIDATA', 'CAND', 'VEREADOR', 'VEREADORA', 'PREFEITO', 'PREFEITA', 'PREF', 'VICE',
    'DEPUTADO', 'DEPUTADA', 'ESTADUAL', 'FEDERAL', 'SENADOR', 'GOVERNADOR',
    -- tempo, quantidade, medida
    'DIA', 'DIAS', 'PERIODO', 'HORA', 'MES', 'MIL', 'MILHEIRO', 'UNIDADE', 'UND', 'UNID', 'QTD',
    'QUANTIDADE', 'TAM', 'TAMANHO', 'MED', 'MEDINDO', 'MEDIDA', 'FORMATO', 'MODELO', 'CMX',
    'COR', 'TIPO', 'ETC',
    -- abreviações cortadas no meio
    'ADES', 'IMP', 'CONF', 'PERF',
    -- sobrenomes frequentes (nome de cabo eleitoral no texto)
    'SILVA', 'SANTOS', 'SOUZA', 'SOUSA', 'OLIVEIRA', 'PEREIRA', 'LIMA', 'COSTA', 'FERREIRA'
]) AS termo;

-- Tabela, não view: a tokenização leva ~10 s sobre 1,3 milhão de despesas, e o
-- notebook e o painel consultam várias vezes.
CREATE OR REPLACE TABLE q9_termo AS
WITH texto AS (
    SELECT
        id_despesa,
        ano,
        sg_uf,
        ds_cargo,
        fl_eleito,
        ds_canal,
        vr_despesa,
        -- passo 2: o "_" protege a expressão da quebra do passo 3
        regexp_replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        upper(strip_accents(ds_despesa)),
                        'CABOS? ELEITORA(L|IS)', 'CABO_ELEITORAL', 'g'
                    ),
                    'CARROS? DE SOM', 'CARRO_DE_SOM', 'g'
                ),
                'REDES? SOCIA(L|IS)', 'REDES_SOCIAIS', 'g'
            ),
            'MILITANCIA DE RUA', 'MILITANCIA_DE_RUA', 'g'
        ) AS texto
    FROM q9_despesa
),

palavra AS (
    SELECT
        id_despesa,
        ano,
        sg_uf,
        ds_cargo,
        fl_eleito,
        ds_canal,
        vr_despesa,
        unnest(regexp_split_to_array(texto, '[^A-Z_]+')) AS bruta
    FROM texto
),

singular AS (
    SELECT
        *,
        CASE
            WHEN bruta LIKE '%\_%' ESCAPE '\' THEN bruta          -- expressão do passo 2
            WHEN length(bruta) < 5 THEN bruta
            WHEN bruta LIKE '%OES' THEN left(bruta, -3) || 'AO'  -- impressões
            WHEN bruta LIKE '%AIS' THEN left(bruta, -3) || 'AL'  -- materiais
            WHEN bruta LIKE '%ZES' THEN left(bruta, -2)          -- cartazes
            WHEN bruta LIKE '%RES' THEN left(bruta, -2)          -- vereadores
            WHEN regexp_matches(bruta, '[^SUI]S$') THEN left(bruta, -1)
            ELSE bruta
        END AS termo
    FROM palavra
    WHERE length(bruta) >= 3
),

por_despesa AS (
    SELECT DISTINCT
        id_despesa,
        ano,
        sg_uf,
        ds_cargo,
        fl_eleito,
        ds_canal,
        vr_despesa,
        termo
    FROM singular
    WHERE termo NOT IN (SELECT q.termo FROM q9_palavra_vazia AS q)
)

SELECT
    ano,
    sg_uf,
    ds_cargo,
    fl_eleito,
    ds_canal,
    replace(termo, '_', ' ') AS termo,
    count(*) AS qt_despesas,
    -- soma das despesas que citam o termo: uma despesa com três termos entra
    -- nos três, então NÃO soma entre termos (para o total, use q9_canal)
    sum(vr_despesa) AS vr_despesa
FROM por_despesa
GROUP BY ALL;
