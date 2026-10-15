# DER geral — as 10 perguntas num modelo só

Une os DERs do Davi (PR #4), do Enrico (PR #2), do Dudu (PR #3) e da Duda
(`der-duda.md`), com as chaves corrigidas pela revisão de 23/09/2026
([`revisao-prs.md`](../revisao-prs.md)). **32 entidades, 43 relacionamentos.**

| Arquivo | Para quê |
|---|---|
| [`der-geral-mermaid.md`](diagramas/der-geral-mermaid.md) | **Colar no mermaid.ai.** Só o bloco de código, em ASCII |
| `der-geral.mmd` | O mesmo código sem as cercas, para editores que pedem `.mmd` |
| [`der-geral.png`](../dossie/diagramas/der-geral.png) / [`der-geral.svg`](../dossie/diagramas/der-geral.svg) | Renderizado pelo Mermaid 11 (validado), para consulta |
| este arquivo | Regras, origem de cada entidade, caminho de cada pergunta, dados faltantes |

Toda coluna de origem citada aqui foi conferida nos cabeçalhos reais dos arquivos
baixados, em todos os grupos de anos que o modelo cobre.

**Este documento substitui o "Contrato de chaves" da seção 3 do [`estrategia.md`](../estrategia.md)**,
que ainda traz `partido.nr_partido` como chave e afirma que o código de município
casa sem LPAD — as duas coisas a revisão desmentiu (regras R2 e R6 abaixo).

---

## 1. Regras globais

Valem para o modelo inteiro. Cada uma responde a um problema medido nos dados.

| # | Regra | Por quê (medido) |
|---|---|---|
| R1 | **Só eleições ordinárias** entram em `PARTIDO`, `CANDIDATURA`, `FEDERACAO` e nas séries. Ordinária é `CD_TIPO_ELEICAO` `2` (em 2006 é `0`, com texto "ORDINÁRIA"); suplementar é `1`. Filtrar pelo código, não pelo texto | Todo arquivo anual traz suplementares de anos depois (8 a 1.186 linhas/ano). Com elas, `(ano, nr_partido)` tem 16 colisões em 2014–2024 (ex.: 2020/25 = DEM e PRD); só com ordinárias, **zero** |
| R2 | `PARTIDO` é identificado por **(ano, nr_partido)** | O número é reaproveitado: 25 foi DEM e virou PRD; 44 foi PRP e virou UNIÃO |
| R3 | `POLITICO` é identificado pelo **título de eleitor**, nunca pelo CPF | Em 2024 o CPF vem `-4` (LGPD) nas 463.859 linhas |
| R4 | `CANDIDATURA` tem chave substituta e chave natural **(ano, sg_ue, cd_cargo, sq_candidato)**, uma linha por candidatura (não por turno) | `SQ_CANDIDATO` só é único a partir de 2010; o candidato de 2º turno tem duas linhas com o mesmo SQ; em 2004 ordinária e suplementar repetem SQ (resolvido por R1) |
| R5 | `ELEICAO` é identificada por `CD_ELEICAO`, que **já separa o turno**; a candidatura aponta para a do 1º turno | O código muda entre turnos (619→620 em 2024) |
| R6 | Município nos arquivos de votação: **`cod_tse = LPAD(CD_MUNICIPIO, 5, '0')`**. `SG_UE` só identifica município em eleição municipal | `votacao_candidato` e `votacao_partido` trazem `CD_MUNICIPIO` sem o zero: um join de texto perde **519 municípios** em silêncio. Só o `detalhe_votacao` vem com 5 dígitos |
| R7 | Linhas do exterior (`SG_UF = 'ZZ'`) ficam fora dos fatos por município | Não têm código IBGE: 138 "municípios" em 2018 e 181 em 2022 |
| R8 | Receita e despesa têm chave substituta | `SQ_DESPESA` repete em 31% das linhas mesmo filtrando a prestação final |
| R9 | Empresa ≠ CNPJ: `tp_agente` sai do **CNAE 9492-8** (organização política) | Em 2014, 50,3% da receita de candidatos veio de CNPJ de partido/comitê |
| R10 | Jovem = **15 a 29 anos** (Lei nº 12.852/2013) | As faixas do TSE e do IBGE cortam exatamente em 29/30 |

---

## 2. De onde vem cada entidade

TSE em `dados/raw/`; nomes entre aspas são do leiaute antigo (2014–2016, `.txt`).

### Território e contexto

| Entidade | Chave | Fonte | Observação |
|---|---|---|---|
| `UF` | `sg_uf` | `municipio_tse_ibge` → `SG_UF`, `CD_UF_IBGE`, `NM_UF` | |
| `MUNICIPIO` | `cod_ibge` | `municipio_tse_ibge` → `CD_MUNICIPIO_IBGE`, `CD_MUNICIPIO_TSE`; FTP do PIB → "Código/Nome da Região Geográfica Imediata/Intermediária" | `cod_tse` com LPAD (R6) |
| `MUNICIPIO_ANO` | `cod_ibge, ano` | SIDRA 6579 (população, var. 9324); FTP do PIB 2010–2023 (PIB, PIB per capita) | ⚠️ ver dados faltantes: população só 2026 |
| `MUNICIPIO_CENSO` | `cod_ibge, ano_censo` | SIDRA 10295 (vars. 13431/13534, renda média e mediana per capita); SIDRA 10062 (var. 13285, anos de estudo) | Censo 2022, 5.570 municípios |
| `IDHM_MUNICIPIO` | `cod_ibge, ano_censo` | Atlas Brasil (PNUD) | ⚠️ só 1991/2000/2010 e **sem coletor** |
| `NIVEL_INSTRUCAO` | `cd_nivel` | SIDRA 10061, classificação c1568 (4 níveis) | modelo do Dudu; `cd_categoria_sidra` mudou para cá (3FN) |
| `GRAU_INSTRUCAO` | `cd_grau_instrucao` | `consulta_cand` → `CD_GRAU_INSTRUCAO`, `DS_GRAU_INSTRUCAO` | inclui `-4` e `0`, com `cd_nivel` nulo |
| `CENSO_INSTRUCAO` | `cod_ibge, ano_censo, cd_nivel` | SIDRA 10061 | |
| `FAIXA_ETARIA` | `id_faixa` | TSE `CD_FAIXA_ETARIA`/`DS_FAIXA_ETARIA`; IBGE SIDRA 9606 classificação 287 | uma dimensão, duas origens |
| `CENSO_FAIXA_ETARIA` | `cod_ibge, ano_censo, id_faixa` | SIDRA 9606 | Censo 2022 |
| `COMPARECIMENTO_PERFIL` | `cod_ibge, ano, nr_turno, id_faixa, ds_genero` | `perfil_comparecimento_abstencao` → `CD_MUNICIPIO`, `ANO_ELEICAO`, `NR_TURNO`, `CD_FAIXA_ETARIA`, `DS_GENERO`, `QT_APTOS`, `QT_COMPARECIMENTO`, `QT_ABSTENCAO` | não tem código de eleição nem cargo; `QT_APTOS` = eleitorado (substitui `ELEITORADO_MUNICIPIO`) |

### Eleição, partido, candidatura

| Entidade | Chave | Fonte | Observação |
|---|---|---|---|
| `ELEICAO` | `cd_eleicao` | `CD_ELEICAO`, `ANO_ELEICAO`, `NR_TURNO`, `DT_ELEICAO`, `CD_TIPO_ELEICAO`, `TP_ABRANGENCIA` | R1, R5 |
| `CARGO` | `cd_cargo` | `CD_CARGO`, `DS_CARGO` | |
| `PARTIDO` | `ano, nr_partido` | `consulta_cand` → `NR_PARTIDO`, `SG_PARTIDO`, `NM_PARTIDO` | R2 |
| `ESPECTRO_PARTIDO` | `ano, nr_partido` | Bolognesi, Ribeiro e Codato (2023, *Dados* 66(2)) — rodada 2018; Bolognesi, Ribeiro, Codato e Silva (2025, *Opinião Pública* 31) — rodada 2022 | carregado para 2022 e 2024 (`sql/15_espectro.sql`) |
| `FEDERACAO` | `ano, nr_federacao` | `NR_FEDERACAO`, `SG_FEDERACAO`, `DS_COMPOSICAO_FEDERACAO` (2022+) | a mesma federação muda de número entre eleições (PSDB/Cidadania: 1 → 100): série da Q5 por composição, não por número |
| `PARTIDO_FEDERACAO` | `ano, nr_partido` | idem | modelo do Dudu, com ano no lugar de `id_eleicao` |
| `POLITICO` | `nr_titulo_eleitoral` | `NR_TITULO_ELEITORAL_CANDIDATO` (LPAD 12), `NM_CANDIDATO`, `DT_NASCIMENTO`, `SG_UF_NASCIMENTO` | valores divergem entre eleições: usar os da candidatura mais recente |
| `CANDIDATURA` | `id_candidatura` | `SQ_CANDIDATO`, `SG_UE`, `CD_CARGO`, `CD_GRAU_INSTRUCAO`, `DS_GENERO`, `DS_COR_RACA`, `DS_OCUPACAO`, `DS_SIT_TOT_TURNO` | R4. Cor/raça fica **aqui**, não em `POLITICO`: muda entre eleições. `fl_eleito` sai da **descrição** (ELEITO, ELEITO POR QP, ELEITO POR MEDIA, MEDIA), não do código, que muda de sentido entre anos |
| `BEM_CANDIDATO` | `id_candidatura, nr_ordem_bem` | `SQ_CANDIDATO`, `NR_ORDEM_BEM_CANDIDATO` (**2016: `NR_ORDEM_CANDIDATO`**), `DS_TIPO_BEM_CANDIDATO`, `VR_BEM_CANDIDATO` | patrimônio declarado da Q2 |

### Resultados

| Entidade | Chave | Fonte | Observação |
|---|---|---|---|
| `VAGA` | `cd_eleicao, sg_ue, cd_cargo` | `consulta_vagas` → `CD_ELEICAO`, `SG_UE`, `CD_CARGO`, `QT_VAGA` (**2016: `QT_VAGAS`**) | `SG_UE` é `BR`, a UF ou o município: chavear por município perderia as vagas estaduais e federais |
| `VOTACAO_CANDIDATO_MUNICIPIO` | `id_candidatura, cod_ibge, nr_turno` | `votacao_candidato_munzona` → `SQ_CANDIDATO`, `CD_MUNICIPIO`, `NR_TURNO`, `QT_VOTOS_NOMINAIS`, `QT_VOTOS_NOMINAIS_VALIDOS` | zonas somadas; R6, R7 |
| `VOTACAO_LEGENDA_MUNICIPIO` | `cd_eleicao, cod_ibge, cd_cargo, nr_partido, sq_coligacao` | `votacao_partido_munzona` → `CD_ELEICAO`, `CD_MUNICIPIO`, `CD_CARGO`, `NR_PARTIDO`, `SQ_COLIGACAO`, `QT_VOTOS_LEGENDA_VALIDOS`, `QT_TOTAL_VOTOS_LEG_VALIDOS` | a coligação **faz parte do grão**: o mesmo partido aparece com duas agremiações na mesma eleição/município/cargo (62 casos em 2018, 67 em 2024) |
| `COMPARECIMENTO_MUNICIPIO` | `cd_eleicao, cd_cargo, cod_ibge` | `detalhe_votacao_munzona` → `QT_APTOS`, `QT_COMPARECIMENTO`, `QT_ABSTENCOES`, `QT_VOTOS_BRANCOS`, `QT_TOTAL_VOTOS_NULOS` | abstenção **por cargo** (Q3) |

### Finanças

| Entidade | Chave | Fonte | Observação |
|---|---|---|---|
| `AGENTE_FINANCEIRO` | `id_agente` | 2018+: `NR_CPF_CNPJ_DOADOR`/`_FORNECEDOR`, `NM_*_RFB`, `CD_CNAE_*`; 2014–16: "CPF/CNPJ do doador", "Nome do doador (Receita Federal)", "Cod setor econômico do doador" | R9. CNAE vem com 7 dígitos no antigo e 5 no novo |
| `ORGAO_PARTIDARIO` | `id_orgao` | 2014: `receitas_partidos`/`receitas_comites` → "Sequencial Diretorio"/"Sequencial Comite", "Tipo diretorio"/"Tipo Comite", "UF", "Sigla  Partido", "CNPJ Prestador Conta"; 2018+: `receitas_orgaos_partidarios` → `SQ_PRESTADOR_CONTAS`, `DS_ESFERA_PARTIDARIA`, `SG_UF`, `NR_PARTIDO`, `NR_CNPJ_PRESTADOR_CONTA` | **nova**. Em 2014, R$ 1,34 bi de empresas entraram em partidos e R$ 406 mi em comitês. O antigo só traz a sigla: o número sai de `PARTIDO` por (ano, sigla) |
| `FONTE_RECURSO` | `id_fonte_recurso` | 2018+: `DS_FONTE_RECEITA`, `DS_ORIGEM_RECEITA`; 2014–16: "Fonte recurso", "Tipo receita" | `tp_origem` é regra do grupo (Q8) |
| `RECEITA_CAMPANHA` | `id_receita` | 2018+: `SQ_CANDIDATO`, `SQ_RECEITA`, `DT_RECEITA`, `VR_RECEITA`; 2014–16: "Sequencial Candidato", "Data da receita", "Valor receita", "CPF/CNPJ do doador originário" | pertence a **uma** candidatura **ou** a um órgão. Doador originário só em 2014–2016: de 2018 em diante vem em arquivo separado, com várias linhas por receita e `SQ_RECEITA` sentinela em ~97% das linhas (não liga) |
| `TIPO_DESPESA` | `id_tipo_despesa` | 2018+: `DS_ORIGEM_DESPESA`; 2014–16: "Tipo despesa" | canal de propaganda: regra do Enrico |
| `DESPESA_CAMPANHA` | `id_despesa` | 2018+: `SQ_CANDIDATO`, `SQ_DESPESA`, `DT_DESPESA`, `VR_DESPESA_CONTRATADA`, `DS_DESPESA`; 2014–16: "Sequencial Candidato", "Data da despesa", "Valor despesa", "Descriçao da despesa" (sic) | |

### Propostas

| Entidade | Chave | Fonte | Observação |
|---|---|---|---|
| `PROPOSTA_GOVERNO` | `id_candidatura, nr_sequencial` | PDFs `proposta_governo_{ano}_{UF}.zip` | 1:N (há candidatos com `_01`, `_02`). O sufixo só existe em 2024/2026; antes, `nr_sequencial = 1`. `fl_texto_extraido` mede os PDFs escaneados |
| `TERMO_PROPOSTA` | `id_candidatura, nr_sequencial, termo` | derivada do texto | |

---

## 3. Caminho de cada pergunta

Numeração da lista de 10 perguntas entregue ao professor. E.P. = 2018, 2020, 2022 e 2024.

| # | Pergunta | Período | Caminho no modelo |
|---|---|---|---|
| Q1 | Quanto custa uma cadeira | E.P. | `DESPESA_CAMPANHA` → `CANDIDATURA` → agrupa por (`cd_eleicao`, `sg_ue`, `cd_cargo`) ÷ `VAGA.qt_vaga`. Funciona para eleição geral também, porque `VAGA` é por unidade eleitoral |
| Q2 | Taxa de sucesso por patrimônio declarado | E.P. | `CANDIDATURA.fl_eleito` × soma de `BEM_CANDIDATO.vr_bem` por candidatura |
| Q3 | Índices do município × eleitos e partidos mais vitoriosos | 2008–2012 | `MUNICIPIO_ANO` + `IDHM_MUNICIPIO` (2010) ↔ `CANDIDATURA` eleitas → `PARTIDO`; alienação em `COMPARECIMENTO_MUNICIPIO` (só existe de 2016 em diante, F10) |
| Q4 | Escolaridade do candidato × dos eleitores × chance de eleição | 2022, 2024 | `CANDIDATURA` → `GRAU_INSTRUCAO` → `NIVEL_INSTRUCAO` ← `CENSO_INSTRUCAO`, com `CANDIDATURA.fl_eleito` |
| Q5 | Eleitos por votos de legenda | E.P. | `VOTACAO_LEGENDA_MUNICIPIO` → `PARTIDO` (→ `PARTIDO_FEDERACAO` → `FEDERACAO` a partir de 2022), somando as coligações, ao lado de `VOTACAO_CANDIDATO_MUNICIPIO` e `VAGA` |
| Q6 | Idade média do município × alternância de poder × idade dos eleitos | E.P. | `CENSO_FAIXA_ETARIA` por município; `CANDIDATURA.nr_idade_eleicao` + `FAIXA_ETARIA.fl_jovem` dos eleitos; troca de `PARTIDO` do prefeito eleito entre eleições; `COMPARECIMENTO_PERFIL` para o comparecimento por idade |
| Q7 | Viés do município na linha do tempo | E.P. | `VOTACAO_CANDIDATO_MUNICIPIO` → `CANDIDATURA` → `PARTIDO` → `ESPECTRO_PARTIDO`, por `MUNICIPIO`/`cd_regiao_imediata` e `ELEICAO.ano` |
| Q8 | Sucesso × repasses públicos e outras fontes | E.P. | `RECEITA_CAMPANHA` → `FONTE_RECURSO.tp_origem` × `CANDIDATURA.fl_eleito` |
| Q9 | Onde investe em propaganda | E.P. | `DESPESA_CAMPANHA` → `TIPO_DESPESA.fl_propaganda`/`ds_canal_propaganda`; nuvem sobre `ds_despesa` |
| Q10 | Sobrevivência da carreira do político | 2002–2026 | `POLITICO` → `CANDIDATURA` (2002–2026) → `PARTIDO`, `CARGO`, `ELEICAO` |

### Correspondência com a lista antiga de 12

Os DERs individuais, os arquivos `q10-publico-privado.md`, `q11-propaganda.md` e `q12-linha-do-tempo.md` e o `docs/estrategia.md` usam a numeração antiga.

| Lista antiga | Lista de 10 |
|---|---|
| Q1 $ por cadeira | Q1 |
| Q2 Taxa de sucesso × $$ | Q2, só na leitura "$$ = patrimônio" |
| Q3 Perfil do município | Q3 |
| Q4 Instrução do candidato × população | Q4 |
| Q5 Votos de legenda | Q5 |
| Q6 Propostas de governo | saiu da lista |
| Q7 Jovens × não jovens × viés | Q6 |
| Q8 Doação de PJ × viés | saiu da lista |
| Q9 Viés do município na linha do tempo | Q7 |
| Q10 Eleito × recurso público/privado | Q8 |
| Q11 Onde investe em propaganda | Q9 |
| Q12 Linha do tempo do político | Q10 |

`PROPOSTA_GOVERNO`, `TERMO_PROPOSTA` (antiga Q6) e `ORGAO_PARTIDARIO` (antiga Q8) continuam no modelo, mas nenhuma pergunta da lista de 10 depende deles.

---

## 4. Dados faltantes

O modelo está completo; **os dados, não**. Levantado pela revisão e conferido nos
arquivos. A coluna "Afeta" usa a numeração da lista de 10; "fora da lista" marca o que só servia a uma pergunta que saiu.

| # | Falta | Afeta | Situação e como resolver |
|---|---|---|---|
| F1 | **Espectro partidário não existe como dado**: `modelo.espectro_partido` está criada em `sql/00_modelo.sql`, mas não há CSV nem coletor | Q6, Q7 | **Resolvido para 2022 e 2024** (`sql/15_espectro.sql`): a tabela do artigo de 2025 está, sem alteração, em `dados/referencia/espectro_bolognesi_2025.csv`, com o de-para das siglas em `espectro_de_para_tse.csv`. Mobiliza = PMN renomeado; PRD = média de PTB e Patriota, marcado como estimado. **Falta** 2014–2020 (rodada 2018), que exige o de-para das siglas antigas |
| F2 | **População só de 2026**: `coleta_ibge.py` baixa a 6579 com `p/last` | Q3, Q6 | **Aberto.** Pedir os anos de eleição de cada pergunta (`p/2008,2012` para a Q3). A 6579 não tem 2022 nem 2023: para 2022, usar a 9606 (Censo) |
| F3 | **IDHM municipal sem coletor**, e só existe até 2010 | Q3 | **Aberto.** Atlas Brasil (download manual); o `dados/raw/pnud/idhm/` atual só tem Brasil e UF. Com a Q3 em 2008–2012, o IDHM 2010 casa com o período e deixa de ser só validação |
| F4 | Propostas de presidente não são coletadas | fora da lista | **Sem efeito.** Propostas de governo saíram da lista de 10 |
| F5 | ~~Prestação de contas extraída só do PI~~ | Q1, Q8, Q9 | **Resolvido** com o recorte de AM, GO, MA, MT, RS e SE, sorteados pelo professor (#14). A coleta extrai os 6 estados com `--uf AM,GO,MA,MT,RS,SE` (#28), e o staging lê os arquivos por UF (#32) |
| F6 | `receitas_candidatos_2014_brasil.txt` e `receitas_comites_2014_brasil.txt` têm aspas sem escape | fora da lista | **Sem efeito.** Nenhuma pergunta da lista de 10 usa 2014, e o staging só lê o leiaute de 2018 em diante |
| F7 | ~~Staging não acha a extração nacional e não traz o doador originário~~ | Q1, Q8, Q9 | **Resolvido** no #32: o glob lê os arquivos `_??` de cada UF. O doador originário só servia à antiga pergunta de doação de PJ |
| F8 | ~~Comparecimento por idade só do PI~~ | Q6 | **Resolvido** com o recorte das 6 UFs (#14): `perfil_comparecimento_abstencao_{ano}_{UF}.csv` dos 6 estados |
| F9 | Doação de PJ só com 2014 e 2016 | fora da lista | **Sem efeito.** A pergunta de doação de PJ saiu da lista de 10 |
| F10 | **Votos e comparecimento só de 2016 em diante**: de 2002 a 2014 há só eleito ou não eleito, pelo cadastro | Q3, Q10 | **Aberto.** Coletar `votacao_candidato_munzona` e `detalhe_votacao_munzona` de 2008 e 2012 para a Q3, e os anos anteriores se a carreira da Q10 precisar de votos |
| F11 | ~~Malha só do PI~~ | Q7 | **Resolvido** com o recorte das 6 UFs (#14): `coleta_ibge malha --uf AM,GO,MA,MT,RS,SE` grava `malha_municipios_{UF}.geojson` por estado |

---

## 5. O que mudou em relação aos DERs de cada um

| Tema | Antes | No DER geral |
|---|---|---|
| Chave de `CANDIDATURA` | `sq_candidato` (Davi, Dudu, contrato) × `id_candidatura` (Enrico, Duda) | substituta + natural (R4) |
| Chave de `PARTIDO` | `nr_partido` em quase todos | `(ano, nr_partido)` (R2) |
| Chave de `ELEICAO` | 4 versões | `cd_eleicao` (R5) |
| Chave de `POLITICO` | `id_politico` × título | título (R3) |
| `MUNICIPIO` | PK pelo código TSE (Davi) × IBGE (demais) | `cod_ibge`, com `cod_tse` UK e LPAD (R6) |
| `VAGA` | por município (Davi) | por unidade eleitoral |
| `VOTACAO_LEGENDA_MUNICIPIO` | sem coligação | coligação no grão |
| `COMPARECIMENTO_PERFIL` | sem turno (Davi) | com turno, gênero e aptos |
| `ELEITORADO_MUNICIPIO` | entidade própria | removida: `QT_APTOS` já é o eleitorado |
| `RECEITA_CAMPANHA` | um agente, só candidato | doador direto + originário; candidato **ou** órgão |
| `AGENTE_FINANCEIRO` | `tp_pessoa` por dígitos | `tp_agente` por CNAE (R9) |
| `ORGAO_PARTIDARIO` | não existia | nova (antiga Q8) |
| `PROPOSTA_GOVERNO` | 1:0..1 (Davi) | 1:N com `nr_sequencial` (Dudu) |
| Espectro | atributo de `PARTIDO` | entidade própria, com a fonte |
| Socioeconômico | população + PIB | + renda e anos de estudo do Censo 2022, + IDHM |
