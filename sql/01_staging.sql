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
-- Macros de limpeza (limpa, categoria, valor_br, data_br…): sql/00_limpeza.sql.

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
