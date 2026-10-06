-- validacao/q4_escolaridade.sql — checagens da pergunta de escolaridade.
--
-- Cada consulta deve voltar VAZIA, salvo as exceções conhecidas anotadas em V4 e V5.
-- Fica fora de sql/*.sql de propósito: o carregar_staging.py não roda esta pasta.
-- Rodar no notebook ou no duckdb, depois de 00_modelo, 06_carga_nucleo e 10_q4.

-- V1. Toda candidatura da análise tem nível do Censo (o de-para cobre os graus 1–8).
SELECT
    'V1 grau sem nível' AS checagem,
    cd_grau_instrucao,
    count(*) AS qt
FROM q4_candidatura
WHERE cd_nivel IS NULL
GROUP BY cd_grau_instrucao;

-- V2. A tabela da Parte B soma exatamente a base (nada some nem duplica no GROUP BY).
SELECT
    'V2 soma da parte B' AS checagem,
    (SELECT sum(qt_candidatos) FROM q4_chance_por_grau) AS soma_b,
    (SELECT count(*) FROM q4_candidatura) AS base
WHERE (SELECT sum(qt_candidatos) FROM q4_chance_por_grau) <> (SELECT count(*) FROM q4_candidatura);

-- V3. Eleitos por cargo e UF batem com as vagas (precisa de modelo.vaga carregada).
--     Deputado federal 2022: AM 8, GO 17, MA 18, MT 8, RS 31, SE 8.
WITH v AS (
    SELECT
        e.ano,
        va.sg_ue AS sg_uf,
        va.cd_cargo,
        sum(va.qt_vaga) AS vagas
    FROM modelo.vaga AS va INNER JOIN modelo.eleicao AS e ON va.cd_eleicao = e.cd_eleicao
    GROUP BY ALL
)

SELECT
    'V3 eleitos ≠ vagas' AS checagem,
    q.ano,
    q.sg_uf,
    q.ds_cargo,
    q.eleitos,
    v.vagas
FROM (
    SELECT
        ano,
        sg_uf,
        cd_cargo,
        ds_cargo,
        count(*) FILTER (WHERE fl_eleito) AS eleitos
    FROM q4_candidatura
    WHERE cd_cargo IN (3, 5, 6, 7)
    GROUP BY ALL
) AS q
INNER JOIN v
    ON q.ano = v.ano AND q.sg_uf = v.sg_uf AND q.cd_cargo = v.cd_cargo
WHERE q.eleitos <> v.vagas;

-- V4. 2024: cada município tem 1 prefeito eleito.
--     Exceção conhecida (9 de 1.239): Iporá e Americano do Brasil (GO); Anajatuba,
--     Guimarães e Santana do Maranhão (MA); Barra dos Coqueiros, Cedro de São João e
--     Nossa Senhora do Socorro (SE) têm todos os candidatos com situação #NULO, e
--     Arroio do Sal (RS) todos como NÃO ELEITO: eleição anulada ou sub judice, que
--     vira suplementar, e a suplementar fica fora pela R1.
SELECT
    'V4 prefeitos eleitos ≠ 1' AS checagem,
    m.sg_uf,
    m.nm_municipio,
    count(c.id_candidatura) AS prefeitos_eleitos
FROM modelo.municipio AS m
LEFT JOIN q4_candidatura AS c ON m.cod_ibge = c.cod_ibge AND c.ano = 2024 AND c.cd_cargo = 11 AND c.fl_eleito
WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
GROUP BY ALL
HAVING count(c.id_candidatura) <> 1;

-- V5. Censo: todo município das 6 UFs tem os 4 níveis (sem a linha Total).
--     Exceção conhecida: Boa Esperança do Norte (MT), criado depois do Censo 2022.
SELECT
    'V5 censo incompleto' AS checagem,
    m.sg_uf,
    m.nm_municipio,
    count(ci.cd_nivel) AS niveis
FROM modelo.municipio AS m
LEFT JOIN modelo.censo_instrucao AS ci ON m.cod_ibge = ci.cod_ibge AND ci.ano_censo = 2022
WHERE m.sg_uf IN ('AM', 'GO', 'MA', 'MT', 'RS', 'SE')
GROUP BY ALL
HAVING count(ci.cd_nivel) <> 4;

-- V6. Percentuais fecham 100 em cada grupo da Parte A (tolerância de arredondamento).
SELECT
    'V6 perfil não soma 100' AS checagem,
    ano,
    sg_uf,
    grupo,
    sum(pc) AS soma
FROM q4_perfil_uf
GROUP BY ALL
HAVING abs(sum(pc) - 100) > 0.5;
