-- 02_fonte_recurso.sql — classificação público × privado da receita (Q10).
--
-- Dono: Enrico. Depende de 01_staging.sql (stg_receita).
-- O critério está escrito em docs/q10-publico-privado.md — o de-para é decisão
-- nossa, não vem do TSE, e é o que o relatório precisa justificar.
--
-- A classificação sai do PAR (ds_fonte, ds_origem), nunca de um campo só:
--   ds_fonte  = de que bolso veio    (FUNDO ESPECIAL / FUNDO PARTIDARIO / OUTROS)
--   ds_origem = quem entregou        (pessoa física, partido, outro candidato...)
--
-- 🚨 Em 2014 ds_fonte é 'NAO ESPECIFICADO' em 91% das linhas — naquele ano o
-- discriminante é ds_origem. Por isso a regra testa fonte primeiro (que resolve
-- os fundos públicos em todos os anos) e cai em origem no resto.

CREATE OR REPLACE VIEW stg_receita_classificada AS
SELECT
    r.*,
    CASE
        -- ① Dinheiro público, qualquer que seja quem repassou. O Fundo Especial
        --    (FEFC, 2018+) e o Fundo Partidário são orçamento da União; chegam ao
        --    candidato via partido, mas a origem é pública.
        WHEN r.ds_fonte IN ('FUNDO ESPECIAL', 'FUNDO PARTIDARIO')        THEN 'PUBLICO'
        -- ② Recurso do próprio candidato — categoria separada de propósito: a Q10
        --    pergunta por público × privado, e autofinanciamento não é nem um nem
        --    outro (não há doador).
        WHEN r.ds_origem = 'RECURSOS PROPRIOS'                           THEN 'PROPRIO'
        -- ③ Doação privada identificada.
        WHEN r.ds_origem IN ('RECURSOS DE PESSOAS FISICAS',
                             'RECURSOS DE PESSOAS JURIDICAS',
                             'RECURSOS DE FINANCIAMENTO COLETIVO',
                             'DOACOES PELA INTERNET')                    THEN 'PRIVADO'
        -- ④ Repasse partidário fora dos fundos públicos: é o caixa do partido,
        --    formado por doação privada e sobra de fundo. O TSE não diz qual, e
        --    chutar contamina os dois lados da Q10. Fica em categoria própria.
        WHEN r.ds_origem = 'RECURSOS DE PARTIDO POLITICO'                THEN 'PARTIDARIO'
        -- ⑤ Transferência entre campanhas: o doador é outro candidato, e o
        --    dinheiro dele já foi classificado na receita DELE. Somar como
        --    privado contaria o mesmo real duas vezes no total do estado.
        WHEN r.ds_origem IN ('RECURSOS DE OUTROS CANDIDATOS',
                             'RECURSOS DE OUTROS CANDIDATOS/COMITES')    THEN 'TRANSFERENCIA'
        -- ⑥ Rendimento de aplicação do próprio dinheiro de campanha.
        WHEN r.ds_origem = 'RENDIMENTOS DE APLICACOES FINANCEIRAS'       THEN 'RENDIMENTO'
        -- ⑦ O TSE tem uma categoria explícita para doador não identificado, e há
        --    1.265 linhas (todas de valor 0,00) sem fonte nem origem.
        ELSE 'NAO IDENTIFICADO'
    END AS tp_origem
FROM stg_receita r;

-- Tabela de-para para o DER: é a entidade FONTE_RECURSO, materializada a partir
-- dos pares que existem de verdade nos arquivos — não de uma lista escrita a mão
-- que pode divergir do dado.
CREATE OR REPLACE TABLE fonte_recurso AS
SELECT
    row_number() OVER (ORDER BY ds_fonte, ds_origem) AS cd_fonte_recurso,
    ds_fonte      AS ds_fonte_recurso,
    ds_origem     AS ds_origem_recurso,
    tp_origem,
    count(*)      AS qt_linhas,
    sum(vr_receita) AS vr_total,
    min(ano)      AS ano_min,
    max(ano)      AS ano_max
FROM stg_receita_classificada
GROUP BY ds_fonte, ds_origem, tp_origem;
