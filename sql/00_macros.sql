-- 00_macros.sql — macros de limpeza usadas por todos os scripts de carga.
--
-- Ficavam no começo do 01_staging.sql. Saíram para cá porque o 04_politico.sql
-- também as usa, e o 01 só roda com a prestação de contas baixada: sem ela, o
-- DuckDB recusa criar as views ("No files found") e nada depois do 01 roda.
-- Com as macros à parte, a Q10 (carreira) carrega só com o consulta_cand:
--
--     uv run scripts/carregar_staging.py 00_macros 04_politico 07_q10

-- ---------------------------------------------------------------------------
-- Limpeza. O TSE usa sentinelas em vez de NULL: '#NULO', '#NULO#', '-1', '-3', '-4'.
-- ---------------------------------------------------------------------------

-- texto: sentinela -> NULL, espaços aparados
CREATE OR REPLACE MACRO limpa(x) AS
CASE
    WHEN x IS NULL OR trim(x) IN ('', '#NULO', '#NULO#', '-1', '-3', '-4')
        THEN NULL
    ELSE trim(x)
END;

-- categoria (fonte, origem, natureza, tipo de despesa): sem acento e em caixa
-- alta, para 'Fundo Partidario' (2014) e 'FUNDO PARTIDÁRIO' (2024) serem a mesma
-- chave. NÃO usar em texto livre (ds_despesa): lá o acento é conteúdo.
CREATE OR REPLACE MACRO categoria(x) AS upper(strip_accents(limpa(x)));

-- valor: '1.234,56' (nova) e '725' / '562,5' (antiga) -> DECIMAL
CREATE OR REPLACE MACRO valor_br(x) AS
try_cast(replace(replace(limpa(x), '.', ''), ',', '.') AS decimal(15, 2));

-- data: '18/07/201400:00:00' (antiga, sem espaço), '22/10/2020' (nova) -> DATE
CREATE OR REPLACE MACRO data_br(x) AS
try_strptime(substr(limpa(x), 1, 10), '%d/%m/%Y')::date;

-- CPF/CNPJ só com dígitos; sentinela vira NULL
CREATE OR REPLACE MACRO documento(x) AS
nullif(regexp_replace(coalesce(limpa(x), ''), '[^0-9]', '', 'g'), '');

-- PF = 11 dígitos, PJ = 14. A fonte não traz tipo de doador para todos os anos.
CREATE OR REPLACE MACRO tipo_pessoa(x) AS
CASE length(documento(x)) WHEN 11 THEN 'PF' WHEN 14 THEN 'PJ' END;

-- CNAE: a geração antiga traz a subclasse (7 dígitos, 9492800), a nova a classe
-- (5 dígitos, 94928). Normaliza para 5 dígitos.
CREATE OR REPLACE MACRO cnae5(x) AS
left(nullif(regexp_replace(coalesce(limpa(x), ''), '[^0-9]', '', 'g'), ''), 5);
