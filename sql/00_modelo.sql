-- 00_modelo.sql — tabelas do modelo relacional (dossiê, seção 4).
--
-- Fonte: docs/dossie/secoes/modelo-relacional.md (estrutura, chaves, FKs) e
-- docs/dossie/secoes/dicionario.md (tipo e nulidade de cada atributo).
-- Rodar a partir da RAIZ do repositório:
--
--     uv run python scripts/carregar_staging.py 00_modelo
--
-- As tabelas ficam no schema `modelo` para não colidir com as tabelas de
-- trabalho de mesmo nome que 02–04 criam em `main` (candidatura, politico,
-- fonte_recurso, tipo_despesa).
--
-- Idempotente: CREATE ... IF NOT EXISTS. Rodar de novo não apaga dados; para
-- recriar depois de mudar o esquema, apague antes com DROP SCHEMA modelo CASCADE.
--
-- Observações do DuckDB:
--   * o comprimento em VARCHAR(n) é documental, não é imposto;
--   * a ordem das tabelas segue as FKs: cada tabela vem depois das que referencia.
--
-- Pontos em que o dicionário refina o modelo relacional (seguimos o dicionário):
--   * CANDIDATURA: UK (ano, sg_ue, cd_cargo, sq_candidato), não sem cd_cargo;
--   * PROPOSTA_GOVERNO: PK (id_candidatura, nr_sequencial), pois nr_sequencial é a
--     ordem do PDF dentro da candidatura; TERMO_PROPOSTA herda a chave composta;
--   * VOTACAO_LEGENDA_MUNICIPIO: `ano` fica fora da PK (é determinado por cd_eleicao).
--   * RECEITA_CAMPANHA.id_agente_doador e DESPESA_CAMPANHA.id_agente_fornecedor
--     aceitam nulo: ~175 mil receitas de 2018+ vêm sem CPF/CNPJ do doador.
-- Pendência 4.6 ainda aberta e não imposta aqui: consistência entre `ano` e
-- `cd_eleicao`. POLITICO.sg_uf_nascimento fica sem FK para UF de propósito: o TSE
-- grava `ZZ` para quem nasceu no exterior, e `ZZ` não é UF (pendência 4.6.2).

CREATE SCHEMA IF NOT EXISTS modelo;

-- ---------------------------------------------------------------------------
-- 4.1 Território e socioeconômico
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS modelo.uf (
    sg_uf CHAR(2) NOT NULL PRIMARY KEY,
    cd_uf_ibge INTEGER NOT NULL UNIQUE,
    nm_uf VARCHAR(30) NOT NULL,
    nm_regiao VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS modelo.municipio (
    cod_ibge INTEGER NOT NULL PRIMARY KEY,
    cod_tse VARCHAR(5) NOT NULL UNIQUE,
    nm_municipio VARCHAR(60) NOT NULL,
    cd_regiao_imediata INTEGER,
    nm_regiao_imediata VARCHAR(60),
    cd_regiao_intermediaria INTEGER,
    sg_uf CHAR(2) NOT NULL REFERENCES modelo.uf (sg_uf)
);

CREATE TABLE IF NOT EXISTS modelo.municipio_ano (
    cod_ibge INTEGER NOT NULL REFERENCES modelo.municipio (cod_ibge),
    ano INTEGER NOT NULL,
    qt_populacao BIGINT,
    ds_fonte_populacao VARCHAR(20),
    vr_pib_mil DECIMAL(15, 3),
    vr_pib_per_capita DECIMAL(12, 2),
    PRIMARY KEY (cod_ibge, ano)
);

CREATE TABLE IF NOT EXISTS modelo.municipio_censo (
    cod_ibge INTEGER NOT NULL REFERENCES modelo.municipio (cod_ibge),
    ano_censo INTEGER NOT NULL,
    vr_renda_media_pc DECIMAL(10, 2),
    vr_renda_mediana_pc DECIMAL(10, 2),
    nr_anos_estudo DECIMAL(4, 1),
    PRIMARY KEY (cod_ibge, ano_censo)
);

CREATE TABLE IF NOT EXISTS modelo.idhm_municipio (
    cod_ibge INTEGER NOT NULL REFERENCES modelo.municipio (cod_ibge),
    ano_censo INTEGER NOT NULL,
    vl_idhm DECIMAL(4, 3) NOT NULL,
    vl_idhm_renda DECIMAL(4, 3) NOT NULL,
    vl_idhm_longevidade DECIMAL(4, 3) NOT NULL,
    vl_idhm_educacao DECIMAL(4, 3) NOT NULL,
    PRIMARY KEY (cod_ibge, ano_censo)
);

CREATE TABLE IF NOT EXISTS modelo.nivel_instrucao (
    cd_nivel INTEGER NOT NULL PRIMARY KEY,
    ds_nivel VARCHAR(60) NOT NULL,
    cd_categoria_sidra INTEGER NOT NULL UNIQUE,
    nr_ordem INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS modelo.grau_instrucao (
    cd_grau_instrucao INTEGER NOT NULL PRIMARY KEY,
    ds_grau_instrucao VARCHAR(40) NOT NULL,
    cd_nivel INTEGER REFERENCES modelo.nivel_instrucao (cd_nivel)
);

CREATE TABLE IF NOT EXISTS modelo.censo_instrucao (
    cod_ibge INTEGER NOT NULL REFERENCES modelo.municipio (cod_ibge),
    cd_nivel INTEGER NOT NULL REFERENCES modelo.nivel_instrucao (cd_nivel),
    ano_censo INTEGER NOT NULL,
    qt_pessoas BIGINT NOT NULL,
    PRIMARY KEY (cod_ibge, cd_nivel, ano_censo)
);

CREATE TABLE IF NOT EXISTS modelo.faixa_etaria (
    id_faixa INTEGER NOT NULL PRIMARY KEY,
    ds_origem VARCHAR(4) NOT NULL,
    cd_origem VARCHAR(10) NOT NULL,
    ds_faixa VARCHAR(30) NOT NULL,
    nr_idade_min INTEGER,
    nr_idade_max INTEGER,
    fl_jovem BOOLEAN,
    UNIQUE (ds_origem, cd_origem)
);

CREATE TABLE IF NOT EXISTS modelo.censo_faixa_etaria (
    cod_ibge INTEGER NOT NULL REFERENCES modelo.municipio (cod_ibge),
    id_faixa INTEGER NOT NULL REFERENCES modelo.faixa_etaria (id_faixa),
    ano_censo INTEGER NOT NULL,
    qt_pessoas BIGINT NOT NULL,
    PRIMARY KEY (cod_ibge, id_faixa, ano_censo)
);

CREATE TABLE IF NOT EXISTS modelo.comparecimento_perfil (
    cod_ibge INTEGER NOT NULL REFERENCES modelo.municipio (cod_ibge),
    id_faixa INTEGER NOT NULL REFERENCES modelo.faixa_etaria (id_faixa),
    ano INTEGER NOT NULL,
    nr_turno INTEGER NOT NULL,
    ds_genero VARCHAR(15) NOT NULL,
    qt_aptos BIGINT NOT NULL,
    qt_comparecimento BIGINT NOT NULL,
    qt_abstencao BIGINT NOT NULL,
    PRIMARY KEY (cod_ibge, id_faixa, ano, nr_turno, ds_genero)
);

-- ---------------------------------------------------------------------------
-- 4.4 Partidos (antes de 4.2, porque CANDIDATURA referencia PARTIDO)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS modelo.partido (
    ano INTEGER NOT NULL,
    nr_partido INTEGER NOT NULL,
    sg_partido VARCHAR(20) NOT NULL,
    nm_partido VARCHAR(80) NOT NULL,
    PRIMARY KEY (ano, nr_partido),
    UNIQUE (ano, sg_partido)
);

-- 1:1 com PARTIDO: a PK é a própria FK (pendência 4.6.1 se houver mais de uma rodada).
CREATE TABLE IF NOT EXISTS modelo.espectro_partido (
    ano INTEGER NOT NULL,
    nr_partido INTEGER NOT NULL,
    nr_rodada INTEGER NOT NULL,
    vl_ideologia DECIMAL(4, 2),
    cd_espectro VARCHAR(20),
    ds_fonte VARCHAR(200) NOT NULL,
    PRIMARY KEY (ano, nr_partido),
    FOREIGN KEY (ano, nr_partido) REFERENCES modelo.partido (ano, nr_partido)
);

CREATE TABLE IF NOT EXISTS modelo.federacao (
    ano INTEGER NOT NULL,
    nr_federacao INTEGER NOT NULL,
    sg_federacao VARCHAR(40) NOT NULL,
    ds_composicao VARCHAR(100),
    PRIMARY KEY (ano, nr_federacao)
);

-- 1:1 com PARTIDO: um partido está em no máximo uma federação por ano.
CREATE TABLE IF NOT EXISTS modelo.partido_federacao (
    ano INTEGER NOT NULL,
    nr_partido INTEGER NOT NULL,
    nr_federacao INTEGER NOT NULL,
    PRIMARY KEY (ano, nr_partido),
    FOREIGN KEY (ano, nr_partido) REFERENCES modelo.partido (ano, nr_partido),
    FOREIGN KEY (ano, nr_federacao) REFERENCES modelo.federacao (ano, nr_federacao)
);

CREATE TABLE IF NOT EXISTS modelo.orgao_partidario (
    id_orgao BIGINT NOT NULL PRIMARY KEY,
    tp_orgao VARCHAR(10) NOT NULL,
    ds_esfera VARCHAR(20),
    sg_uf CHAR(2) REFERENCES modelo.uf (sg_uf),  -- nulo em órgão nacional
    nr_cnpj VARCHAR(14),
    ano INTEGER NOT NULL,
    nr_partido INTEGER NOT NULL,
    FOREIGN KEY (ano, nr_partido) REFERENCES modelo.partido (ano, nr_partido)
);

-- ---------------------------------------------------------------------------
-- 4.2 Eleição e candidatura
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS modelo.eleicao (
    cd_eleicao INTEGER NOT NULL PRIMARY KEY,
    ano INTEGER NOT NULL,
    nr_turno INTEGER NOT NULL,
    dt_eleicao DATE NOT NULL,
    tp_eleicao VARCHAR(12) NOT NULL,
    tp_abrangencia VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS modelo.cargo (
    cd_cargo INTEGER NOT NULL PRIMARY KEY,
    ds_cargo VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS modelo.politico (
    nr_titulo_eleitoral VARCHAR(12) NOT NULL PRIMARY KEY,
    nm_candidato VARCHAR(100) NOT NULL,
    dt_nascimento DATE,
    sg_uf_nascimento CHAR(2)
);

CREATE TABLE IF NOT EXISTS modelo.candidatura (
    id_candidatura BIGINT NOT NULL PRIMARY KEY,
    ano INTEGER NOT NULL,
    sg_ue VARCHAR(5) NOT NULL,
    sq_candidato BIGINT NOT NULL,
    ds_genero VARCHAR(15),
    ds_cor_raca VARCHAR(20),
    ds_ocupacao VARCHAR(100),
    ds_sit_tot_turno VARCHAR(20),
    fl_eleito BOOLEAN NOT NULL, -- derivado de ds_sit_tot_turno
    nr_idade_eleicao INTEGER,               -- derivado de dt_nascimento e dt_eleicao
    cd_eleicao INTEGER NOT NULL REFERENCES modelo.eleicao (cd_eleicao),
    cd_cargo INTEGER NOT NULL REFERENCES modelo.cargo (cd_cargo),
    nr_partido INTEGER NOT NULL,
    nr_titulo_eleitoral VARCHAR(12) REFERENCES modelo.politico (nr_titulo_eleitoral),
    cd_grau_instrucao INTEGER NOT NULL REFERENCES modelo.grau_instrucao (cd_grau_instrucao),
    cod_ibge INTEGER REFERENCES modelo.municipio (cod_ibge), -- nulo fora de pleitos municipais
    UNIQUE (ano, sg_ue, cd_cargo, sq_candidato),
    FOREIGN KEY (ano, nr_partido) REFERENCES modelo.partido (ano, nr_partido)
);

CREATE TABLE IF NOT EXISTS modelo.bem_candidato (
    id_candidatura BIGINT NOT NULL REFERENCES modelo.candidatura (id_candidatura),
    nr_ordem_bem INTEGER NOT NULL,
    ds_tipo_bem VARCHAR(100) NOT NULL,
    vr_bem DECIMAL(15, 2) NOT NULL,
    PRIMARY KEY (id_candidatura, nr_ordem_bem)
);

CREATE TABLE IF NOT EXISTS modelo.vaga (
    cd_eleicao INTEGER NOT NULL REFERENCES modelo.eleicao (cd_eleicao),
    cd_cargo INTEGER NOT NULL REFERENCES modelo.cargo (cd_cargo),
    sg_ue VARCHAR(5) NOT NULL,
    qt_vaga INTEGER NOT NULL,
    cod_ibge INTEGER REFERENCES modelo.municipio (cod_ibge), -- nulo fora de pleitos municipais
    PRIMARY KEY (cd_eleicao, cd_cargo, sg_ue)
);

CREATE TABLE IF NOT EXISTS modelo.proposta_governo (
    id_candidatura BIGINT NOT NULL REFERENCES modelo.candidatura (id_candidatura),
    nr_sequencial INTEGER NOT NULL,
    nm_arquivo VARCHAR(60) NOT NULL UNIQUE,
    qt_caracteres INTEGER NOT NULL,
    fl_texto_extraido BOOLEAN NOT NULL,
    tx_conteudo TEXT,
    PRIMARY KEY (id_candidatura, nr_sequencial)
);

CREATE TABLE IF NOT EXISTS modelo.termo_proposta (
    id_candidatura BIGINT NOT NULL,
    nr_sequencial INTEGER NOT NULL,
    termo VARCHAR(60) NOT NULL,
    qt_frequencia INTEGER NOT NULL,
    PRIMARY KEY (id_candidatura, nr_sequencial, termo),
    FOREIGN KEY (id_candidatura, nr_sequencial)
    REFERENCES modelo.proposta_governo (id_candidatura, nr_sequencial)
);

-- ---------------------------------------------------------------------------
-- 4.3 Votação
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS modelo.votacao_candidato_municipio (
    id_candidatura BIGINT NOT NULL REFERENCES modelo.candidatura (id_candidatura),
    cod_ibge INTEGER NOT NULL REFERENCES modelo.municipio (cod_ibge),
    nr_turno INTEGER NOT NULL,
    qt_votos_nominais BIGINT NOT NULL,
    qt_votos_nominais_validos BIGINT NOT NULL,
    PRIMARY KEY (id_candidatura, cod_ibge, nr_turno)
);

CREATE TABLE IF NOT EXISTS modelo.votacao_legenda_municipio (
    cd_eleicao INTEGER NOT NULL REFERENCES modelo.eleicao (cd_eleicao),
    cod_ibge INTEGER NOT NULL REFERENCES modelo.municipio (cod_ibge),
    cd_cargo INTEGER NOT NULL REFERENCES modelo.cargo (cd_cargo),
    ano INTEGER NOT NULL,
    nr_partido INTEGER NOT NULL,
    sq_coligacao BIGINT NOT NULL,
    qt_votos_legenda_validos BIGINT NOT NULL,
    qt_total_votos_leg_validos BIGINT NOT NULL,
    PRIMARY KEY (cd_eleicao, cod_ibge, cd_cargo, nr_partido, sq_coligacao),
    FOREIGN KEY (ano, nr_partido) REFERENCES modelo.partido (ano, nr_partido)
);

-- Sem atributo próprio na chave (pendência 4.6.3): PK formada pelas FKs.
CREATE TABLE IF NOT EXISTS modelo.comparecimento_municipio (
    cd_eleicao INTEGER NOT NULL REFERENCES modelo.eleicao (cd_eleicao),
    cd_cargo INTEGER NOT NULL REFERENCES modelo.cargo (cd_cargo),
    cod_ibge INTEGER NOT NULL REFERENCES modelo.municipio (cod_ibge),
    qt_aptos BIGINT NOT NULL,
    qt_comparecimento BIGINT NOT NULL,
    qt_abstencoes BIGINT NOT NULL,
    qt_votos_brancos BIGINT NOT NULL,
    qt_total_votos_nulos BIGINT NOT NULL,
    PRIMARY KEY (cd_eleicao, cd_cargo, cod_ibge)
);

-- ---------------------------------------------------------------------------
-- 4.5 Finanças de campanha
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS modelo.agente_financeiro (
    id_agente BIGINT NOT NULL PRIMARY KEY,
    nr_cpf_cnpj VARCHAR(14) NOT NULL UNIQUE,
    nm_agente VARCHAR(150),
    cd_cnae VARCHAR(5),
    tp_agente VARCHAR(12) NOT NULL
);

CREATE TABLE IF NOT EXISTS modelo.fonte_recurso (
    id_fonte_recurso INTEGER NOT NULL PRIMARY KEY,
    ds_fonte_receita VARCHAR(40),
    ds_origem_receita VARCHAR(60),
    tp_origem VARCHAR(20) NOT NULL,
    UNIQUE (ds_fonte_receita, ds_origem_receita)
);

CREATE TABLE IF NOT EXISTS modelo.tipo_despesa (
    id_tipo_despesa INTEGER NOT NULL PRIMARY KEY,
    ds_tipo_despesa VARCHAR(80) NOT NULL UNIQUE,
    ds_canal_propaganda VARCHAR(20),
    fl_propaganda BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS modelo.receita_campanha (
    id_receita BIGINT NOT NULL PRIMARY KEY,
    dt_receita DATE,
    vr_receita DECIMAL(15, 2) NOT NULL,
    id_candidatura BIGINT REFERENCES modelo.candidatura (id_candidatura),
    id_orgao BIGINT REFERENCES modelo.orgao_partidario (id_orgao),
    -- nulo quando o arquivo não traz CPF/CNPJ válido (pendência 6 do dicionário)
    id_agente_doador BIGINT REFERENCES modelo.agente_financeiro (id_agente),
    id_agente_originario BIGINT REFERENCES modelo.agente_financeiro (id_agente), -- só 2014–2016
    id_fonte_recurso INTEGER NOT NULL REFERENCES modelo.fonte_recurso (id_fonte_recurso),
    -- "arrecada": a receita é de uma candidatura ou de um órgão, nunca dos dois.
    CHECK ((id_candidatura IS NULL) <> (id_orgao IS NULL))
);

CREATE TABLE IF NOT EXISTS modelo.despesa_campanha (
    id_despesa BIGINT NOT NULL PRIMARY KEY,
    dt_despesa DATE,
    vr_despesa DECIMAL(15, 2) NOT NULL,
    ds_despesa TEXT,
    id_candidatura BIGINT NOT NULL REFERENCES modelo.candidatura (id_candidatura),
    id_agente_fornecedor BIGINT REFERENCES modelo.agente_financeiro (id_agente), -- idem
    id_tipo_despesa INTEGER NOT NULL REFERENCES modelo.tipo_despesa (id_tipo_despesa)
);
