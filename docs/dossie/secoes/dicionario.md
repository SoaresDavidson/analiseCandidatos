## 5. Dicionário de dados

Este dicionário cobre as entidades do DER em nível de tabela e campos essenciais. Tipos e restrições são propostas de modelagem e precisam de conferência na carga. O dicionário detalhado de `CANDIDATURA` já iniciado em `docs/dicionario-dados.md` complementa esta síntese.

| Entidade | Chave e campos essenciais | Significado e origem |
|---|---|---|
| `UF` | `sigla_uf` (PK), `nome` | Unidade da federação; TSE/IBGE. |
| `MUNICIPIO` | `cod_ibge` (PK), `cod_tse` (`VARCHAR(5)`, único), `sigla_uf`, `nome` | Ponte territorial oficial TSE–IBGE; `cod_tse` preserva zero inicial. |
| `MUNICIPIO_ANO` | (`cod_ibge`, `ano`) (PK), `qt_populacao`, `vr_pib_per_capita` | Indicadores por ano; SIDRA 6579 e planilha PIB dos Municípios. Alinhar anos disponíveis. |
| `CENSO_INSTRUCAO` | (`cod_ibge`, `ano_censo`, `cd_nivel_instrucao`) (PK), `qt_pessoas` | Escolaridade da população; SIDRA 10061. |
| `ELEITORADO_MUNICIPIO` | (`cod_ibge`, `ano`, `cd_faixa_etaria`) e outras dimensões de perfil (PK), `qt_eleitores` | Perfil do eleitorado; TSE. |
| `COMPARECIMENTO_PERFIL` | (`cod_ibge`, `ano`, `cd_faixa_etaria`) e outras dimensões de perfil (PK), `qt_comparecimento`, `qt_abstencao` | Participação por faixa etária; `perfil_comparecimento_abstencao` do TSE, com zonas agregadas. |
| `POLITICO` | `id_politico` (PK), `nr_titulo_eleitoral` (único quando válido), `nm_completo`, `dt_nascimento` | Identidade longitudinal da pessoa; `consulta_cand`. CPF não é chave histórica confiável. |
| `ELEICAO` | `id_eleicao` (PK), `ano`, `dt_eleicao` | Pleito e data; TSE. |
| `CARGO` | `cod_cargo` (PK), `ds_cargo` | Cargo disputado; TSE. |
| `PARTIDO` | `nr_partido` (PK no recorte adotado), `sg_partido`, `cd_espectro` | Agremiação e classificação analítica; verificar identificação por eleição e documentar fonte do espectro. |
| `FEDERACAO` | `nr_federacao` (PK no recorte adotado), `sg_federacao`, `nm_federacao` | Federação partidária a partir de 2022; TSE. |
| `CANDIDATURA` | `sq_candidato` (PK), `id_politico`, `id_eleicao`, `cod_cargo`, `nr_partido`, `nr_federacao`, `cod_ibge`, `cd_grau_instrucao`, `cd_sit_tot_turno` | Participação de pessoa em pleito; `consulta_cand`. `cod_ibge` só é preenchido quando `SG_UE` representa município. |
| `VOTACAO_CANDIDATO_MUNICIPIO` | (`sq_candidato`, `cod_ibge`, `nr_turno`) (PK), `qt_votos_nominais` | Votos nominais com zonas agregadas; `votacao_candidato_munzona`. |
| `VOTACAO_LEGENDA_MUNICIPIO` | `id_legenda` (PK), `id_eleicao`, `cod_cargo`, `cod_ibge`, `nr_turno`, `nr_partido`, `nr_federacao`, `qt_votos_legenda` | Votos de legenda agregados por município; `votacao_partido_munzona`. Definir regra de associação à federação na carga. |
| `COMPARECIMENTO_MUNICIPIO` | (`id_eleicao`, `cod_cargo`, `cod_ibge`, `nr_turno`) (PK), `qt_aptos`, `qt_abstencao`, `qt_votos_brancos`, `qt_votos_nulos` | Participação por cargo com zonas agregadas; `detalhe_votacao_munzona`. |
| `VAGA` | (`id_eleicao`, `cod_cargo`, `cod_ibge`) (PK), `qt_vagas` | Cadeiras em disputa; `consulta_vagas`. |
| `AGENTE_FINANCEIRO` | `id_agente` (PK), `nr_cpf_cnpj`, `tp_pessoa`, `cd_cnae` | Doador ou fornecedor; prestação de contas, com CNAE quando disponível. |
| `FONTE_RECURSO` | `id_fonte_recurso` (PK), `ds_fonte_receita`, `ds_origem_receita`, `tp_origem` | Classificação público/privado/próprio construída com fonte e origem da receita; regra do grupo. |
| `RECEITA_CAMPANHA` | `id_receita` (PK), `sq_candidato`, `id_agente`, `id_fonte_recurso`, `vr_receita` | Entrada de recursos de campanha; prestação de contas. |
| `TIPO_DESPESA` | `cd_tipo_despesa` (PK), `ds_tipo_despesa`, `fl_propaganda` | Categoria de gasto; prestação de contas. |
| `DESPESA_CAMPANHA` | `id_despesa` (PK), `sq_candidato`, `id_agente`, `cd_tipo_despesa`, `vr_despesa`, `ds_despesa` | Gasto de campanha e descrição; prestação de contas. |
| `PROPOSTA_GOVERNO` | `sq_candidato` (PK/FK), `url_pdf`, `tx_conteudo` | Documento de proposta ligado ao candidato; PDF do TSE. |
| `TERMO_PROPOSTA` | (`sq_candidato`, `termo`) (PK), `qt_frequencia` | Frequência de termo extraído da proposta. |

**Observações de qualidade:** Chaves do TSE devem ser lidas como texto antes de qualquer conversão. Valores especiais de ausência precisam de normalização explícita. A classificação ideológica e a classificação da origem de recursos exigem critérios documentados. Entidades e atributos acima descrevem o modelo pretendido, não tabelas já criadas.
