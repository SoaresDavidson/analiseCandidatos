-- 01_staging.sql — views canônicas da prestação de contas de candidatos.
--
-- Dono: Enrico. Consumidores: Davi (Q1), Enrico (Q8, Q9) — numeração da lista de
-- 10 perguntas entregue ao professor.
-- Rodar a partir da RAIZ do repositório (os caminhos são relativos a ela):
--
--     uv run python scripts/carregar_staging.py
--
-- Só o leiaute de 2018 em diante (.csv, SNAKE_CASE). O leiaute antigo (.txt de
-- 2014–2016, colunas em português) saiu junto com a pergunta de doação de PJ, a
-- única que precisava dele: o escopo agora é 2018–2026.
--
-- O que entra: só prestação de contas de CANDIDATOS, só eleições ordinárias (R1:
-- CD_TIPO_ELEICAO = '2'; em 2020 há receitas de suplementares no mesmo arquivo).
-- O recorte de UF vem da extração (`--uf AM,GO,MA,MT,RS,SE`): o glob pega os
-- arquivos `_??` que estiverem no disco. `_BRASIL` não casa com `_??`.
--
-- Uma prestação aparece num tipo de entrega só (FINAL, PARCIAL, RELATÓRIO
-- FINANCEIRO…): conferido em 2018–2026, nenhum candidato tem dois tipos, então
-- somar as linhas não conta nada em dobro. Em 2026 só há entrega parcial.

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
SELECT
    try_cast(sq_candidato AS bigint) AS sq_candidato,
    try_cast(aa_eleicao AS integer) AS ano,
    limpa(sg_uf) AS sg_uf,
    data_br(dt_receita) AS dt,
    valor_br(vr_receita) AS vr_receita,
    documento(nr_cpf_cnpj_doador) AS cpf_cnpj_doador,
    tipo_pessoa(nr_cpf_cnpj_doador) AS tp_pessoa,
    cnae5(cd_cnae_doador) AS cd_cnae_doador,
    categoria(ds_fonte_receita) AS ds_fonte,
    categoria(ds_origem_receita) AS ds_origem,
    categoria(ds_natureza_receita) AS ds_natureza
FROM
    read_csv(
        'dados/raw/prestacao_contas/20*/prestacao_contas_candidatos_????/receitas_candidatos_????_??.csv',
        delim = ';', quote = '"', header = TRUE, encoding = 'latin-1',
        all_varchar = TRUE, union_by_name = TRUE
    )
WHERE cd_tipo_eleicao = '2';

-- ---------------------------------------------------------------------------
-- Despesa
--
-- 2018+ tem duas famílias: `despesas_contratadas` (valor CONTRATADO, com
-- candidato, fornecedor, CNAE e descrição) e `despesas_pagas` (valor PAGO, em
-- parcelas, sem candidato nem fornecedor — só liga por SQ_DESPESA). Usamos a
-- CONTRATADA: é a que carrega tudo que a Q9 precisa (fornecedor, CNAE e
-- descrição). Uma despesa = uma linha.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW stg_despesa AS
SELECT
    try_cast(sq_candidato AS bigint) AS sq_candidato,
    try_cast(aa_eleicao AS integer) AS ano,
    limpa(sg_uf) AS sg_uf,
    data_br(dt_despesa) AS dt,
    valor_br(vr_despesa_contratada) AS vr_despesa,
    documento(nr_cpf_cnpj_fornecedor) AS cpf_cnpj_fornecedor,
    cnae5(cd_cnae_fornecedor) AS cd_cnae_fornecedor,
    limpa(ds_despesa) AS ds_despesa,
    categoria(ds_origem_despesa) AS ds_tipo_despesa
FROM
    read_csv(
        'dados/raw/prestacao_contas/20*/prestacao_contas_candidatos_????/despesas_contratadas_candidatos_????_??.csv',
        delim = ';', quote = '"', header = TRUE, encoding = 'latin-1',
        all_varchar = TRUE, union_by_name = TRUE
    )
WHERE cd_tipo_eleicao = '2';
