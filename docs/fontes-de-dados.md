# Catálogo de fontes — validado em 18/09/2026

Tudo aqui foi testado de verdade (requisição feita, resposta conferida). O que **não**
foi possível validar está marcado como ⚠️.

---

## 1. TSE — Portal de Dados Abertos

Não existe API de consulta. O portal é um CKAN que só aponta para `.zip` no
`cdn.tse.jus.br`, com padrão de URL fixo por recurso e por ano — é o que o
[`scripts/baixar_candidatos_tse.py`](../scripts/baixar_candidatos_tse.py) já explora.

> **Atenção operacional:** todo o domínio `*.tse.jus.br` está atrás de Akamai e
> devolve `403 Access Denied` para cliente que não pareça navegador. O script já
> manda `User-Agent` de browser — **não remova isso**. Se um dia der 403 em massa,
> é bloqueio de borda, não é bug do código.

### 1.1 Recursos já mapeados no script

| Recurso | URL (padrão `{ano}`) |
|---|---|
| candidatos | `.../odsele/consulta_cand/consulta_cand_{ano}.zip` |
| candidatos_complementar | `.../odsele/consulta_cand_complementar/consulta_cand_complementar_{ano}.zip` |
| bens_candidato | `.../odsele/bem_candidato/bem_candidato_{ano}.zip` |
| coligacoes | `.../odsele/consulta_coligacao/consulta_coligacao_{ano}.zip` |
| vagas | `.../odsele/consulta_vagas/consulta_vagas_{ano}.zip` |
| motivo_cassacao | `.../odsele/motivo_cassacao/motivo_cassacao_{ano}.zip` |
| redes_sociais | `.../odsele/consulta_cand/rede_social_candidato_{ano}.zip` |

### 1.2 Recursos que FALTAM no script (obrigatórios para as perguntas)

Prefixo comum: `https://cdn.tse.jus.br/estatistica/sead/odsele/`

| Chave sugerida | URL | Serve |
|---|---|---|
| `votacao_candidato` | `votacao_candidato_munzona/votacao_candidato_munzona_{ano}.zip` | Q1 Q2 Q3 Q7 Q9 Q10 |
| `votacao_partido` | `votacao_partido_munzona/votacao_partido_munzona_{ano}.zip` | **Q5** (votos de legenda) |
| `detalhe_votacao` | `detalhe_votacao_munzona/detalhe_votacao_munzona_{ano}.zip` | **Q3** (abstenção, aptos, comparecimento) |
| `prestacao_contas` (2018+) | `prestacao_contas/prestacao_de_contas_eleitorais_candidatos_{ano}.zip` | Q1 Q2 Q8 Q10 Q11 |
| `prestacao_contas` (≤2016) | `prestacao_contas/prestacao_contas_final_{ano}.zip` | Q8 |
| `cnpj_campanha` | `prestacao_contas/CNPJ_campanha_{ano}.zip` (minúsculo `cnpj_` em 2016) | Q8 |
| `perfil_eleitorado` | `perfil_eleitorado/perfil_eleitorado_{ano}.zip` | Q3 Q7 |
| `comparecimento_abstencao` | `perfil_comparecimento_abstencao/perfil_comparecimento_abstencao_{ano}.zip` | **Q7** |
| `proposta_governo` | `proposta_governo/proposta_governo_{ano}_{UF}.zip` | **Q6** |
| `municipio_tse_ibge` | `municipio_tse_ibge/municipio_tse_ibge.zip` (**sem ano**) | ponte TSE↔IBGE |

#### `detalhe_votacao_munzona` × `perfil_comparecimento_abstencao` — não são substitutos

Erro fácil de cometer: achar que o grupo *Comparecimento e Abstenção* dispensa o
`detalhe_votacao_munzona`. **Não dispensa.** Os dois têm abstenção, mas em grãos
diferentes e para perguntas diferentes:

| | `detalhe_votacao_munzona` | `perfil_comparecimento_abstencao` |
|---|---|---|
| grão | município × zona × **cargo** × turno | município × zona × **perfil do eleitor** |
| recortes | — | gênero, estado civil, **faixa etária**, escolaridade, cor/raça, quilombola, identidade de gênero, indígena |
| tem cargo? | **sim** | **não** |
| além da abstenção | válidos, nominais, legenda, brancos, nulos, seções | comparecimento/abstenção por obrigatório × facultativo, deficiência, TTE |
| tamanho (2024) | **1,4 MB** | 188 MB |

- **Q3** quer abstenção **por cargo** (prefeito vs vereador) e a composição do voto
  → `detalhe_votacao_munzona`. E ele é 130× menor.
- **Q7** quer **abstenção por faixa etária** → só o
  `perfil_comparecimento_abstencao` tem isso. Nenhum outro arquivo dá.

**Baixem os dois.**

Todas as URLs acima foram lidas direto das páginas do portal (não são chute).

### 1.3 A ponte TSE ↔ IBGE — resolvida

O TSE publica a correspondência **oficial**, no grupo *Dados de apoio*:

- Dataset: `dadosabertos.tse.jus.br/dataset/codigos-oficiais-de-uf-e-municipios-segundo-o-tse-e-o-ibge`
- Arquivo: `https://cdn.tse.jus.br/estatistica/sead/odsele/municipio_tse_ibge/municipio_tse_ibge.zip`

**Use esse, não a tabela de comunidade do GitHub.** É fonte oficial, é o que o
professor vai aceitar como justificativa, e é atualizada pelo próprio TSE.

Conferido por dentro — o `municipio_tse_ibge.csv` (gerado em 13/09/2026) tem
exatamente o que precisamos:

```
"DT_GERACAO";"HH_GERACAO";"CD_UF_TSE";"CD_UF_IBGE";"SG_UF";"NM_UF";
"CD_MUNICIPIO_TSE";"NM_MUNICIPIO_TSE";"CD_MUNICIPIO_IBGE";"NM_MUNICIPIO_IBGE"
"13/09/2026";"09:00:12";24;12;"AC";"Acre";"01007";"Bujari";1200138;"Bujari"
```

⚠️ **`CD_MUNICIPIO_TSE` vem com zero à esquerda (`"01007"`).** Ler como inteiro
quebra o join sem dar erro — o registro simplesmente não casa. Modelar como
`VARCHAR(5)`.

### 1.4 Propostas de governo (Q6) — ✅ existe em lote, risco derrubado

**Correção de uma informação errada que este documento trazia antes.** Eu havia
escrito que as propostas só existiam uma a uma no DivulgaCandContas. Estão sim no
portal, em lote, dentro do grupo **Candidatos**, um zip por UF por ano:

```
https://cdn.tse.jus.br/estatistica/sead/odsele/proposta_governo/proposta_governo_{ano}_{UF}.zip
```

Conferido por dentro:

| | arquivos | tamanho |
|---|---|---|
| `proposta_governo_2024_PI.zip` | 504 PDFs | 328 MB |
| `proposta_governo_2022_PI.zip` | 10 PDFs | < 1 MB |

A diferença é a eleição: em 2024 (municipal) todo candidato a prefeito registra
proposta; em 2022 (geral) só os majoritários do estado.

**O nome do arquivo já traz a chave de join.** Padrão
`{ano}{UF}{SQ_CANDIDATO}_{seq}.pdf` — por exemplo `2024PI180001881915_01.pdf`,
onde `180001881915` é o `SQ_CANDIDATO`. Ou seja, `PROPOSTA_GOVERNO.sq_candidato`
sai de um parse de nome de arquivo, sem precisar casar por nome de candidato.

Não existe agregado `_BR`: é por UF ou nada. E cada zip traz um `leiame.pdf`.

Sobra só o trabalho de extrair texto de PDF (o conteúdo é PDF de verdade, não
imagem, na maioria) — mas isso é biblioteca de Python, não é problema de fonte.

### 1.5 Prestação de contas — o nome do arquivo muda todo ano

Não existe template com `{ano}` que funcione. Medido um a um:

| Ano | URL (sob `.../odsele/prestacao_contas/`) | Tamanho | Leiaute |
|---|---|---|---|
| 2002 | `prestacao_contas_2002.zip` | < 1 MB | antigo |
| 2004 | `prestacao_contas_2004.zip` | < 1 MB | antigo |
| 2006 | `prestacao_contas_2006.zip` | < 1 MB | antigo |
| 2008 | `prestacao_contas_2008.zip` | 148 MB | antigo |
| 2010 | `prestacao_contas_2010.zip` | 105 MB | antigo |
| 2012 | `prestacao_contas_final_2012.zip` | 640 MB | antigo |
| **2014** | **`prestacao_final_2014.zip`** ← sem o `_contas_` | 193 MB | antigo |
| 2016 | `prestacao_contas_final_2016.zip` | 1.045 MB | antigo |
| 2018 | `prestacao_de_contas_eleitorais_candidatos_2018.zip` | 281 MB | novo |
| 2020 | `prestacao_de_contas_eleitorais_candidatos_2020.zip` | 1.316 MB | novo |
| 2022 | `prestacao_de_contas_eleitorais_candidatos_2022.zip` | 359 MB | novo |
| 2024 | `prestacao_de_contas_eleitorais_candidatos_2024.zip` | 1.268 MB | novo |

Ano de eleição municipal é ~4× maior que ano de eleição geral — são muito mais
candidatos. 2002–2006 com menos de 1 MB provavelmente é dado incompleto; conferir
antes de prometer qualquer coisa que dependa deles.

### 1.6 As duas gerações de leiaute

Esta é a pegadinha que mais custa tempo. **`union_by_name=true` não resolve**,
porque os nomes das colunas são diferentes, não ausentes.

**`consulta_cand`** — conferido abrindo o cabeçalho real de 2002, 2010, 2014, 2018,
2020, 2022 e 2024:

| | ≤ 2010 | ≥ 2014 |
|---|---|---|
| nº de colunas | 62 | 50 |
| `NR_CPF_CANDIDATO` | ✅ | ✅ |
| `NR_FEDERACAO`, `SG_FEDERACAO` | ❌ | ✅ |
| `VR_DESPESA_MAX_CAMPANHA` | ✅ | ❌ |
| `NR_IDADE_DATA_POSSE` | ✅ | ❌ |
| `CD_MUNICIPIO_NASCIMENTO` | ✅ | ❌ |
| `CD_DETALHE_SITUACAO_CAND` | ✅ | ❌ |

**CPF existe desde 2002** — isso derruba o principal risco da Q12.

**Prestação de contas** — a fronteira é outra, entre 2016 e 2018:

| | ≤ 2016 | ≥ 2018 |
|---|---|---|
| extensão | `.txt` | `.csv` |
| nomes de coluna | português, com espaço e acento: `"Cód. Eleição"`, `"CPF/CNPJ do doador"`, `"Sigla  Partido"` (dois espaços) | `SNAKE_CASE`: `NR_CPF_CNPJ_DOADOR`, `CD_CNAE_DOADOR` |
| CNAE do doador | `Cod setor econômico do doador` | `CD_CNAE_DOADOR` / `DS_CNAE_DOADOR` |
| classificação da receita | `Fonte recurso`, `Especie recurso` | `CD_FONTE_RECEITA` + `CD_ORIGEM_RECEITA` + `CD_NATUREZA_RECEITA` + `CD_ESPECIE_RECEITA` |

### 1.7 Tamanhos medidos (2024)

| Arquivo | Zip | Observação |
|---|---|---|
| `detalhe_votacao_munzona` | **1,4 MB** | ridiculamente leve — puxar todos os anos |
| `votacao_candidato_munzona` | 46 MB | |
| `consulta_cand` | 61 MB | |
| `perfil_eleitorado` | 318 MB | |
| `prestacao_de_contas_..._candidatos` | 1.268 MB | ~12 GB descompactado, 112 arquivos |

Dentro do zip de contas de 2024, por família de arquivo:

| Família | só `_PI` | só `_BRASIL` |
|---|---|---|
| `despesas_contratadas_candidatos` | 51,2 MB | ≥ 4 GB |
| `despesas_pagas_candidatos` | 18,7 MB | 1.207 MB |
| `receitas_candidatos` | 20,2 MB | 1.342 MB |
| `receitas_candidatos_doador_originario` | 1,6 MB | 106 MB |

Os `_BRASIL` são **duplicata pura** das UFs. Apagar logo após extrair. O zip também
traz quatro `leiame_*.pdf` com a documentação oficial de cada família — vale ler
antes de escrever o staging.

---

## 2. IBGE — API SIDRA

Funciona sem chave, sem cadastro, responde JSON. Formato:

```
https://apisidra.ibge.gov.br/values/t/{tabela}/n6/{municipios}/v/{variaveis}/p/{periodos}
```

`n6` = nível município. `n6/all` = todos os 5.570. `n6/in n3 22` = só os do Piauí.

### 2.1 Tabelas confirmadas (todas com nível N6 = município)

| Tabela | Conteúdo | Período | Serve |
|---|---|---|---|
| **6579** | População residente estimada | 2001–2026 | Q3 Q4 Q7 (denominador) |
| **5938** | PIB a preços correntes + VAB por atividade | 2002–**2023** | Q3 |
| **10061** | Pessoas 18+ por **nível de instrução** × idade × sexo × cor | 2022 | **Q4** |
| **10062** | Média de anos de estudo (11+ anos) | 2022 | Q4 (alternativa) |
| **9514** | População por sexo e **idade** (134 categorias) | 2022 | **Q7** |
| **9606** | População por cor/raça, sexo e idade | 2010 **e** 2022 | Q7 (comparação intercensitária) |

> ⚠️ **Não use a tabela 1378 para a Q7.** Ela aparece em muita busca do SIDRA como
> "população residente por idade", mas é **Censo 2010 apenas** (`inicio: 2010,
> fim: 2010`) — conferido nos metadados. Para o nosso recorte de 2018–2024 o dado
> certo é a **9514** (Censo 2022) ou a **9606**, que traz 2010 e 2022 e permite
> mostrar a mudança do perfil etário entre os dois Censos.

Testes feitos:

```bash
# população de todos os municípios, 2024 → 5.571 registros, 1,5 MB
curl "https://apisidra.ibge.gov.br/values/t/6579/n6/all/v/9324/p/2024"

# PIB de todos os municípios, 2023 → 5.570 registros, 1,6 MB
curl "https://apisidra.ibge.gov.br/values/t/5938/n6/all/v/37/p/2023"

# instrução, municípios do PI, totais de idade/sexo/raça → 1.120 registros
curl "https://apisidra.ibge.gov.br/values/t/10061/n6/in%20n3%2022/v/allxp/p/2022/c1568/all/c58/0/c2/0/c86/0"
```

Volume é confortável: ~1,5 MB por ano por indicador nacional. Puxar tudo cabe em
minutos.

> **Cuidado com combinação de classificações.** A 10061 tem 5 níveis de instrução ×
> 19 grupos de idade × 3 sexos × 6 cor/raça. Pedir `all` em tudo × 5.570 municípios
> estoura. Fixe as dimensões que não interessam no total (`c58/0/c2/0/c86/0`),
> como no exemplo acima.

### 2.1-bis Atalho melhor que o SIDRA para o PIB: o FTP

`https://ftp.ibge.gov.br/Pib_Municipios/2022_2023/base/base_de_dados_2010_2023_xlsx.zip`
(20 MB) resolve mais coisa de uma vez do que a tabela 5938:

- **PIB e PIB per capita já calculado**, 2010–2023, todos os municípios — não
  precisa dividir por população.
- **A hierarquia geográfica inteira na mesma linha**: grande região, UF,
  mesorregião, microrregião, região geográfica imediata e intermediária,
  concentração urbana, hierarquia urbana, região rural, Amazônia Legal, Semiárido.
  Isso cobre a Q9 sem precisar da API de localidades.
- Atividade com maior, 2º maior e 3º maior valor adicionado bruto.

Três ressalvas:

1. **Não tem coluna de população.** A tabela 6579 continua necessária para Q3, Q4 e Q7.
2. **Use o `.xlsx`, não o `.txt`.** O txt é largura fixa, sem cabeçalho, e só é
   parseável com o PDF de layout que vem junto. O xlsx tem cabeçalho.
3. **2022 e 2023 só têm PIB e PIB per capita** — sem VAB por atividade (nota
   técnica 02/2024 do IBGE). Se a análise depender de VAB setorial, o último ano
   cheio é 2021.

Ou seja: **FTP para PIB e geografia; SIDRA para população, instrução e idade.**

### 2.2 Metadados (para descobrir código de variável/classificação)

```
https://servicodados.ibge.gov.br/api/v3/agregados/{tabela}/metadados
https://servicodados.ibge.gov.br/api/v3/agregados          # catálogo completo
```

### 2.3 Divisão territorial (mesorregião, microrregião, região)

```
https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orientacao=nivelado
```

5.570 municípios com código, nome, micro, meso, região imediata, região
intermediária, UF e região. **2,4 MB, uma requisição, resolve a hierarquia
geográfica inteira da Q9.** Testado, HTTP 200. (Redundante se usarmos o FTP do
PIB da seção 2.1-bis, que já traz a mesma hierarquia — escolher um dos dois.)

### 2.4 Malha municipal (mapas) — prefira a API ao geoftp

O `geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/`
funciona (pastas `municipio_2000/` até as recentes), mas entrega **shapefile**, que
exige geopandas/GDAL instalado e ainda precisa virar GeoJSON.

A API v3 entrega GeoJSON pronto e minúsculo:

```
https://servicodados.ibge.gov.br/api/v3/malhas/estados/22?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio
```

Testado: **126 KB, 224 features**, cada uma com `properties.codarea` = código IBGE
de 7 dígitos, que casa direto com `MUNICIPIO.cod_ibge`. Troque `22` pela UF
desejada, ou use `/api/v3/malhas/paises/BR?...&intrarregiao=municipio` para o país
inteiro. `qualidade=minima` é suficiente para coroplético; só aumente se o mapa
ficar visivelmente pobre.

---

## 3. Correções ao levantamento anterior

Três pontos do texto que circulou no grupo precisam de ajuste:

**① PIB per capita não vem pronto.** Foi dito que a tabela 5938 "já vem com PIB per
capita calculado". Não vem. Conferimos a lista de variáveis das duas tabelas de PIB
municipal (21 e 5938): **nenhuma das duas tem variável per capita.** Tem PIB a
preços correntes, impostos, VAB total e por atividade, e participações percentuais.
O per capita é conta nossa: `PIB (mil R$) × 1000 ÷ população`. Isso é uma **coluna
derivada no nosso modelo**, não um dado de origem — e vale registrar isso no DER.

**② A série do PIB vai até 2023**, não 2021.

**③ Instrução no Censo 2022 tem sim recorte municipal.** Foi dito que "o número da
tabela varia, vale procurar no catálogo". Já procuramos: é a **10061**, e ela tem
nível N6. Não precisa garimpar.

E um ponto que estava certo e merece reforço: **IDHM não é IBGE.** É PNUD/Atlas
Brasil. Ver a seção 4 — o caso é pior do que parecia.

---

## 4. IDHM — a situação real (conferida)

Existem duas fontes, e **nenhuma das duas dá IDHM municipal recente**.

**① Painel IDHM do PNUD** (`undp.org/pt/brazil/desenvolvimento-humano/painel-idhm`)
→ `https://www.undp.org/sites/g/files/zskgke326/files/2023-07/base_de_dados.xlsx`
(331 KB). Baixei e abri: tem série **anual de 2012 a 2024**, com IDHM, IDHM
Longevidade / Educação / Renda, esperança de vida, renda per capita, Gini, Theil.
⚠️ Mas a coluna `AGREGACAO` só assume **`BRASIL` e `UF`**. **Não desce a município.**

**② Atlas Brasil** (`atlasbrasil.org.br/consulta/planilha`) → esse sim tem
município, mas os indicadores estão marcados **`Censo 1991`, `Censo 2000` e
`Censo 2010`**. **Não existe IDHM municipal de 2022.**

Ou seja: **o IDHM por município mais recente é de 2010** — catorze anos antes da
eleição de 2024. Usar isso como "perfil rico/pobre do município" em 2024 é frágil
e o professor vai perguntar.

**Recomendação:** eixo principal de rico/pobre = **PIB per capita** (temos ano a
ano até 2023, via FTP do PIB, seção 2.1-bis). IDHM 2010 entra só como validação
cruzada, com a defasagem declarada. Se quiser um segundo eixo anual, o próprio FTP
do PIB traz `Hierarquia Urbana` e `Tipo Concentração Urbana`, que separam
município grande de pequeno melhor do que população crua.
