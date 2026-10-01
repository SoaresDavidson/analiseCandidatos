## 4. Modelo relacional

**Fonte:** mapeamento do DER geral (`docs/dossie/public/diagramas/der-geral-separado.drawio`) para tabelas: 32 entidades e 43 relacionamentos.

**Regras aplicadas:** relacionamentos 1:N levam a chave estrangeira para o lado N; relacionamentos 1:1 levam-na para o lado dependente. Entidades cuja chave sublinhada é parcial (por exemplo, `ano` em `MUNICIPIO_ANO`) foram tratadas como fracas, e sua chave primária é a chave do dono somada à chave parcial. Atributos tracejados no DER são derivados e aparecem marcados como tal.

**Notação:** **negrito** = chave primária; `FK → TABELA` = chave estrangeira; `UK` = chave única.

### 4.1 Território e socioeconômico

- **UF**(**sg_uf**, cd_uf_ibge `UK`, nm_uf, nm_regiao)
- **MUNICIPIO**(**cod_ibge**, cod_tse `UK`, nm_municipio, cd_regiao_imediata, nm_regiao_imediata, cd_regiao_intermediaria, sg_uf `FK → UF`)
- **MUNICIPIO_ANO**(**cod_ibge** `FK → MUNICIPIO`, **ano**, qt_populacao, ds_fonte_populacao, vr_pib_mil, vr_pib_per_capita)
- **MUNICIPIO_CENSO**(**cod_ibge** `FK → MUNICIPIO`, **ano_censo**, vr_renda_media_pc, vr_renda_mediana_pc, nr_anos_estudo)
- **IDHM_MUNICIPIO**(**cod_ibge** `FK → MUNICIPIO`, **ano_censo**, vl_idhm, vl_idhm_renda, vl_idhm_longevidade, vl_idhm_educacao)
- **NIVEL_INSTRUCAO**(**cd_nivel**, ds_nivel, cd_categoria_sidra, nr_ordem)
- **GRAU_INSTRUCAO**(**cd_grau_instrucao**, ds_grau_instrucao, cd_nivel `FK → NIVEL_INSTRUCAO`)
- **CENSO_INSTRUCAO**(**cod_ibge** `FK → MUNICIPIO`, **cd_nivel** `FK → NIVEL_INSTRUCAO`, **ano_censo**, qt_pessoas)
- **FAIXA_ETARIA**(**id_faixa**, ds_origem, cd_origem, ds_faixa, nr_idade_min, nr_idade_max, fl_jovem)
- **CENSO_FAIXA_ETARIA**(**cod_ibge** `FK → MUNICIPIO`, **id_faixa** `FK → FAIXA_ETARIA`, **ano_censo**, qt_pessoas)
- **COMPARECIMENTO_PERFIL**(**cod_ibge** `FK → MUNICIPIO`, **id_faixa** `FK → FAIXA_ETARIA`, **ano**, **nr_turno**, **ds_genero**, qt_aptos, qt_comparecimento, qt_abstencao)

### 4.2 Eleição e candidatura

- **ELEICAO**(**cd_eleicao**, ano, nr_turno, dt_eleicao, tp_eleicao, tp_abrangencia)
- **CARGO**(**cd_cargo**, ds_cargo)
- **POLITICO**(**nr_titulo_eleitoral**, nm_candidato, dt_nascimento, sg_uf_nascimento)
- **CANDIDATURA**(**id_candidatura**, ano, sg_ue, sq_candidato, ds_genero, ds_cor_raca, ds_ocupacao, ds_sit_tot_turno, fl_eleito *(derivado)*, nr_idade_eleicao *(derivado)*, cd_eleicao `FK → ELEICAO`, cd_cargo `FK → CARGO`, nr_partido, nr_titulo_eleitoral `FK → POLITICO`, cd_grau_instrucao `FK → GRAU_INSTRUCAO`, cod_ibge `FK → MUNICIPIO`)
    - `UK` (ano, sg_ue, cd_cargo, sq_candidato)
    - (ano, nr_partido) `FK → PARTIDO`
    - cod_ibge é nulo fora de pleitos municipais
- **BEM_CANDIDATO**(**id_candidatura** `FK → CANDIDATURA`, **nr_ordem_bem**, ds_tipo_bem, vr_bem)
- **VAGA**(**cd_eleicao** `FK → ELEICAO`, **cd_cargo** `FK → CARGO`, **sg_ue**, qt_vaga, cod_ibge `FK → MUNICIPIO`)
    - cod_ibge é nulo fora de pleitos municipais
- **PROPOSTA_GOVERNO**(**id_candidatura** `FK → CANDIDATURA`, **nr_sequencial**, nm_arquivo `UK`, qt_caracteres, fl_texto_extraido, tx_conteudo)
- **TERMO_PROPOSTA**(**id_candidatura**, **nr_sequencial**, **termo**, qt_frequencia)
    - (id_candidatura, nr_sequencial) `FK → PROPOSTA_GOVERNO`

### 4.3 Votação

- **VOTACAO_CANDIDATO_MUNICIPIO**(**id_candidatura** `FK → CANDIDATURA`, **cod_ibge** `FK → MUNICIPIO`, **nr_turno**, qt_votos_nominais, qt_votos_nominais_validos)
- **VOTACAO_LEGENDA_MUNICIPIO**(**cd_eleicao** `FK → ELEICAO`, **cod_ibge** `FK → MUNICIPIO`, **cd_cargo** `FK → CARGO`, **ano**, **nr_partido**, **sq_coligacao**, qt_votos_legenda_validos, qt_total_votos_leg_validos)
    - (ano, nr_partido) `FK → PARTIDO`
- **COMPARECIMENTO_MUNICIPIO**(**cd_eleicao** `FK → ELEICAO`, **cd_cargo** `FK → CARGO`, **cod_ibge** `FK → MUNICIPIO`, qt_aptos, qt_comparecimento, qt_abstencoes, qt_votos_brancos, qt_total_votos_nulos)

### 4.4 Partidos

- **PARTIDO**(**ano**, **nr_partido**, sg_partido, nm_partido)
- **ESPECTRO_PARTIDO**(**ano**, **nr_partido**, nr_rodada, vl_ideologia, cd_espectro, ds_fonte)
    - (ano, nr_partido) `FK → PARTIDO` (1:1)
- **FEDERACAO**(**ano**, **nr_federacao**, sg_federacao, ds_composicao)
- **PARTIDO_FEDERACAO**(**ano**, **nr_partido**, nr_federacao)
    - (ano, nr_partido) `FK → PARTIDO` (1:1)
    - (ano, nr_federacao) `FK → FEDERACAO`
- **ORGAO_PARTIDARIO**(**id_orgao**, tp_orgao, ds_esfera, sg_uf `FK → UF`, nr_cnpj, ano, nr_partido)
    - (ano, nr_partido) `FK → PARTIDO`
    - sg_uf é nulo em órgão nacional

### 4.5 Finanças de campanha

- **AGENTE_FINANCEIRO**(**id_agente**, nr_cpf_cnpj `UK`, nm_agente, cd_cnae, tp_agente)
- **FONTE_RECURSO**(**id_fonte_recurso**, ds_fonte_receita, ds_origem_receita, tp_origem)
- **TIPO_DESPESA**(**id_tipo_despesa**, ds_tipo_despesa, ds_canal_propaganda, fl_propaganda)
- **RECEITA_CAMPANHA**(**id_receita**, dt_receita, vr_receita, id_candidatura `FK → CANDIDATURA`, id_orgao `FK → ORGAO_PARTIDARIO`, id_agente_doador `FK → AGENTE_FINANCEIRO`, id_agente_originario `FK → AGENTE_FINANCEIRO`, id_fonte_recurso `FK → FONTE_RECURSO`)
    - exatamente um entre id_candidatura e id_orgao é preenchido (relacionamentos "arrecada")
    - id_agente_doador vem de "doa direto"; id_agente_originario vem de "origina 2014-2016" e é nulo fora desse período
- **DESPESA_CAMPANHA**(**id_despesa**, dt_despesa, vr_despesa, ds_despesa, id_candidatura `FK → CANDIDATURA`, id_agente_fornecedor `FK → AGENTE_FINANCEIRO`, id_tipo_despesa `FK → TIPO_DESPESA`)

### 4.6 Pendências a conferir com o DER

1. `ESPECTRO_PARTIDO` não tem chave sublinhada no DER. O atributo `nr_rodada` sugere mais de uma leitura por partido; nesse caso a chave passa a ser (ano, nr_partido, nr_rodada) e o relacionamento com `PARTIDO` deixa de ser 1:1.
2. Três atributos parecem chaves estrangeiras sem relacionamento desenhado. Decisão:
    - `VOTACAO_LEGENDA_MUNICIPIO.cd_cargo` é `FK → CARGO` e `ORGAO_PARTIDARIO.sg_uf` é `FK → UF` (opcional: órgão nacional não tem UF; o arquivo traz `BR`, que vira nulo). Pela notação de Chen, uma entidade não guarda o código de outra como atributo, então falta desenhar no DER os relacionamentos com `CARGO` e com `UF`.
    - `POLITICO.sg_uf_nascimento` continua atributo, sem FK. O TSE grava `ZZ` para quem nasceu no exterior (de 36 a 254 candidatos por ano nos arquivos de 2016 a 2026), e `ZZ` não é UF. Com a FK, a carga teria de apagar essa informação.
3. `COMPARECIMENTO_MUNICIPIO` não tem atributo sublinhado; a chave primária foi formada só pelas chaves estrangeiras. Se os dados forem por turno, falta `nr_turno`.
4. `COMPARECIMENTO_PERFIL` guarda `ano` e `nr_turno` sem ligação com `ELEICAO`, de propósito. O arquivo `perfil_comparecimento_abstencao` não tem `CD_ELEICAO`, e o par (ano, nr_turno) não determina uma eleição. Em eleição geral o eleitor vota para os cargos federais e estaduais no mesmo dia, e o arquivo conta esse comparecimento uma vez só, mas o TSE registra duas eleições (1º turno de 2018: 295 e 297; de 2022: 544 e 546). Em 2020 há ainda a eleição adiada do Amapá (426 e 445). Uma FK `cd_eleicao` não teria um valor certo para apontar.
5. `ano` convive com `cd_eleicao` em `CANDIDATURA` e `VOTACAO_LEGENDA_MUNICIPIO` porque a chave de `PARTIDO` inclui o ano. É uma redundância que precisa de restrição de consistência.
6. O DER não indica participação obrigatória ou opcional; as colunas anuláveis acima foram deduzidas do significado dos relacionamentos.
