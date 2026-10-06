-- 01_staging.sql — views canônicas da prestação de contas de candidatos.
--
-- Dono: Enrico. Consumidores: Davi (Q1, Q2), Duda (Q8), Enrico (Q10, Q11).
-- Rodar a partir da RAIZ do repositório (os caminhos são relativos a ela):
--
--     uv run python scripts/carregar_staging.py
--
-- Duas gerações de leiaute, sem coluna em comum (union_by_name NÃO resolve entre
-- elas, só dentro de cada uma):
--   antiga  2014–2016  .txt, colunas em português ("CPF/CNPJ do doador")
--   nova    2018–2026  .csv, SNAKE_CASE (NR_CPF_CNPJ_DOADOR)
-- Cada view lê as duas e devolve os nomes do contrato do estrategia.md.
--
-- O que entra: só prestação de contas de CANDIDATOS, só arquivos por UF
-- (`*_PI.*`), sem `_BRASIL` e sem `_sup` (eleições suplementares).
-- Para incluir outra UF basta baixá-la: o glob pega `_??`.

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

-- ---------------------------------------------------------------------------
-- Receita
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW stg_receita AS
WITH antiga AS (
    SELECT * FROM read_csv(
        [
            'dados/raw/prestacao_contas/2014/*/receitas_candidatos_????_??.txt',
            'dados/raw/prestacao_contas/2016/*/receitas_candidatos_prestacao_contas_final_????_??.txt'
        ],
        delim = ';', quote = '"', header = TRUE, encoding = 'latin-1',
        all_varchar = TRUE, union_by_name = TRUE, filename = TRUE
    )
),

nova AS (
    SELECT * FROM read_csv(
        'dados/raw/prestacao_contas/20*/prestacao_contas_candidatos_????/receitas_candidatos_????_??.csv',
        delim = ';', quote = '"', header = TRUE, encoding = 'latin-1',
        all_varchar = TRUE, union_by_name = TRUE
    )
)

SELECT
    try_cast("Sequencial Candidato" AS bigint) AS sq_candidato,
    try_cast(regexp_extract(filename, '_(\d{4})_[A-Z]{2}\.txt$', 1) AS integer) AS ano,
    data_br("Data da receita") AS dt,
    valor_br("Valor receita") AS vr_receita,
    documento("CPF/CNPJ do doador") AS cpf_cnpj_doador,
    tipo_pessoa("CPF/CNPJ do doador") AS tp_pessoa,
    cnae5("Cod setor econômico do doador") AS cd_cnae_doador,
    categoria("Fonte recurso") AS ds_fonte,
    categoria("Tipo receita") AS ds_origem,
    -- a geração antiga não tem "natureza"; só a espécie. 'Estimado' = estimável.
    CASE
        WHEN limpa("Especie recurso") IS NULL THEN NULL
        WHEN categoria("Especie recurso") = 'ESTIMADO' THEN 'ESTIMAVEL'
        ELSE 'FINANCEIRO'
    END AS ds_natureza
FROM antiga
UNION ALL BY NAME
SELECT
    try_cast(sq_candidato AS bigint) AS sq_candidato,
    try_cast(aa_eleicao AS integer) AS ano,
    data_br(dt_receita) AS dt,
    valor_br(vr_receita) AS vr_receita,
    documento(nr_cpf_cnpj_doador) AS cpf_cnpj_doador,
    tipo_pessoa(nr_cpf_cnpj_doador) AS tp_pessoa,
    cnae5(cd_cnae_doador) AS cd_cnae_doador,
    categoria(ds_fonte_receita) AS ds_fonte,
    categoria(ds_origem_receita) AS ds_origem,
    categoria(ds_natureza_receita) AS ds_natureza
FROM nova;

-- ---------------------------------------------------------------------------
-- Despesa
--
-- 2018+ tem duas famílias: `despesas_contratadas` (valor CONTRATADO, com
-- candidato, fornecedor, CNAE e descrição) e `despesas_pagas` (valor PAGO, em
-- parcelas, sem candidato nem fornecedor — só liga por SQ_DESPESA). Usamos a
-- CONTRATADA: é a que carrega tudo que a Q11 precisa e a que corresponde ao
-- "Valor despesa" único da geração antiga. Uma despesa = uma linha.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW stg_despesa AS
WITH antiga AS (
    SELECT * FROM read_csv(
        [
            'dados/raw/prestacao_contas/2014/*/despesas_candidatos_????_??.txt',
            'dados/raw/prestacao_contas/2016/*/despesas_candidatos_prestacao_contas_final_????_??.txt'
        ],
        delim = ';', quote = '"', header = TRUE, encoding = 'latin-1',
        all_varchar = TRUE, union_by_name = TRUE, filename = TRUE
    )
),

nova AS (
    SELECT * FROM read_csv(
        'dados/raw/prestacao_contas/20*/prestacao_contas_candidatos_????/despesas_contratadas_candidatos_????_??.csv',
        delim = ';', quote = '"', header = TRUE, encoding = 'latin-1',
        all_varchar = TRUE, union_by_name = TRUE
    )
)

SELECT
    try_cast("Sequencial Candidato" AS bigint) AS sq_candidato,
    try_cast(regexp_extract(filename, '_(\d{4})_[A-Z]{2}\.txt$', 1) AS integer) AS ano,
    data_br("Data da despesa") AS dt,
    valor_br("Valor despesa") AS vr_despesa,
    documento("CPF/CNPJ do fornecedor") AS cpf_cnpj_fornecedor,
    cnae5("Cod setor econômico do fornecedor") AS cd_cnae_fornecedor,
    limpa("Descriçao da despesa") AS ds_despesa,
    categoria("Tipo despesa") AS ds_tipo_despesa
FROM antiga
UNION ALL BY NAME
SELECT
    try_cast(sq_candidato AS bigint) AS sq_candidato,
    try_cast(aa_eleicao AS integer) AS ano,
    data_br(dt_despesa) AS dt,
    valor_br(vr_despesa_contratada) AS vr_despesa,
    documento(nr_cpf_cnpj_fornecedor) AS cpf_cnpj_fornecedor,
    cnae5(cd_cnae_fornecedor) AS cd_cnae_fornecedor,
    limpa(ds_despesa) AS ds_despesa,
    categoria(ds_origem_despesa) AS ds_tipo_despesa
FROM nova;
