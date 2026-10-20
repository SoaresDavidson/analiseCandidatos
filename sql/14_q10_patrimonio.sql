-- 14_q10_patrimonio.sql — patrimônio e campanha na carreira do político (Q10).
--
-- Para cada pessoa (título de eleitor) e eleição: os bens declarados ao TSE, por
-- tipo, e quanto a campanha arrecadou e gastou. Alimenta o bloco "Patrimônio e
-- campanha" da página da Q10.
--
-- Rodar da RAIZ do repositório, depois do 13_ficha_candidato (BEM_CANDIDATO) e da
-- prestação de contas (01 a 05):
--
--     uv run python -m scripts.coleta.coleta_ibge ipca
--     uv run python scripts/carregar_staging.py 14_q10
--
-- Limites dos dados (o TSE, não a consulta):
--   * bens só de 2006 em diante; em 2006 e 2008 sem tipo (tudo "outros bens e direitos");
--   * receita e despesa só de 2018 em diante (o leiaute antigo não é carregado);
--   * o valor é o declarado pelo candidato no registro, com erros de digitação
--     que o TSE publica como vieram (há bens de R$ 1 bilhão em vereadores).

-- ---------------------------------------------------------------------------
-- IPCA de agosto (registro da candidatura) de cada ano de eleição, e o fator que
-- leva um valor daquele ano para reais de agosto de 2024.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q10_ipca AS
WITH ipca AS (
    SELECT
        try_cast(v AS double) AS nr_indice,
        try_cast(left(d3c, 4) AS integer) AS ano
    FROM read_json('dados/raw/ibge/sidra/1737_ipca_agosto.json', format = 'array')
    -- a primeira linha repete o cabeçalho; try_cast porque o filtro pode rodar depois
    WHERE try_cast(v AS double) IS NOT NULL AND try_cast(left(d3c, 4) AS integer) IS NOT NULL
),

base AS (
    SELECT nr_indice AS nr_indice_2024
    FROM ipca
    WHERE ano = 2024
)

SELECT
    i.ano,
    i.nr_indice,
    b.nr_indice_2024 / i.nr_indice AS fator_2024
FROM ipca AS i
CROSS JOIN base AS b;

-- ---------------------------------------------------------------------------
-- Bens por candidatura e tipo. O grupo junta os ~50 tipos do TSE em 6, para o
-- gráfico; o tipo do TSE fica para o detalhe.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q10_bem_tipo AS
SELECT
    c.nr_titulo_eleitoral,
    c.ano,
    c.id_candidatura,
    b.ds_tipo_bem,
    CASE
        WHEN c.ano <= 2008 THEN 'SEM TIPO'          -- o TSE não separava o tipo
        WHEN regexp_matches(
            categoria(b.ds_tipo_bem),
            '^(CASA|APARTAMENTO|TERRENO|TERRA NUA|OUTROS BENS IMOVEIS|PREDIO|SALA OU CONJUNTO|LOJA|GALPAO|'
            || 'CONSTRUCAO|BENFEITORIAS)'
        ) THEN 'IMOVEIS'
        WHEN regexp_matches(categoria(b.ds_tipo_bem), '^(QUOTAS OU QUINHOES|OUTRAS PARTICIPACOES SOCIETARIAS)')
            THEN 'EMPRESAS'
        WHEN regexp_matches(
            categoria(b.ds_tipo_bem),
            '^(APLICACAO|OUTRAS APLICACOES|FUNDO|OUTROS FUNDOS|ACOES|VGBL|OURO|MERCADO FUTUROS|PLANO PAIT|'
            || 'POUPANCA PARA CONSTRUCAO|OUTROS CREDITOS E POUPANCA)'
        ) THEN 'APLICACOES'
        WHEN regexp_matches(
            categoria(b.ds_tipo_bem),
            '^(DEPOSITO BANCARIO|DINHEIRO EM ESPECIE|CADERNETA DE POUPANCA|OUTROS DEPOSITOS A VISTA)'
        ) THEN 'DINHEIRO'
        WHEN regexp_matches(categoria(b.ds_tipo_bem), '^(VEICULO|EMBARCACAO|AERONAVE)') THEN 'VEICULOS'
        ELSE 'OUTROS'
    END AS ds_grupo,
    sum(b.vr_bem) AS vr_bem,
    count(*) AS qt_bens
FROM modelo.bem_candidato AS b
INNER JOIN modelo.candidatura AS c ON b.id_candidatura = c.id_candidatura
WHERE c.nr_titulo_eleitoral IS NOT NULL
GROUP BY ALL;

-- ---------------------------------------------------------------------------
-- Uma linha por pessoa e eleição: patrimônio (declarado e em reais de 2024) e
-- campanha. Se a pessoa teve mais de uma candidatura no ano (registro trocado),
-- vale a que declarou mais bens; sem bens, a que foi a voto.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW q10_financas AS
WITH bens AS (
    SELECT
        id_candidatura,
        sum(vr_bem) AS vr_patrimonio,
        sum(qt_bens) AS qt_bens
    FROM q10_bem_tipo
    GROUP BY id_candidatura
),

candidatura AS (
    SELECT
        c.nr_titulo_eleitoral,
        c.ano,
        c.id_candidatura,
        c.sq_candidato,
        c.cd_cargo,
        b.vr_patrimonio,
        b.qt_bens
    FROM modelo.candidatura AS c
    LEFT JOIN bens AS b ON c.id_candidatura = b.id_candidatura
    WHERE c.nr_titulo_eleitoral IS NOT NULL
    QUALIFY row_number() OVER (
        PARTITION BY c.nr_titulo_eleitoral, c.ano
        ORDER BY b.qt_bens DESC NULLS LAST, c.ds_sit_tot_turno IS NOT NULL DESC, c.id_candidatura
    ) = 1
),

despesa AS (
    SELECT
        ano,
        sq_candidato,
        sum(vr_despesa) AS vr_despesa
    FROM stg_despesa
    GROUP BY ALL
)

SELECT
    c.nr_titulo_eleitoral,
    c.ano,
    c.id_candidatura,
    c.cd_cargo,
    c.vr_patrimonio,                                -- NULL = não declarou bens
    c.qt_bens,
    q8.vr_total AS vr_receita,                      -- NULL antes de 2018
    q8.vr_publico,
    d.vr_despesa,
    c.vr_patrimonio * i.fator_2024 AS vr_patrimonio_2024
FROM candidatura AS c
LEFT JOIN q10_ipca AS i ON c.ano = i.ano
LEFT JOIN mart_q8 AS q8 ON c.ano = q8.ano AND c.sq_candidato = q8.sq_candidato
LEFT JOIN despesa AS d ON c.ano = d.ano AND c.sq_candidato = d.sq_candidato;
