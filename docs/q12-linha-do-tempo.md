# Q12 — linha do tempo do político, 2002–2026

Implementação em [`sql/04_politico.sql`](../sql/04_politico.sql) (entidades) e
`mart_q12` (a trajetória montada). Cobertura nacional, 13 eleições.

Sigo a convenção do [`estrategia.md`](estrategia.md) de descrever carreiras sem
nomear pessoas. Os nomes estão nas views, para quem for montar o visual.

## A chave é o título de eleitor

| ano | linhas | sem título válido |
|---|---|---|
| 2002 | 18.109 | 1,76% |
| 2004 | 402.157 | 0,08% |
| 2012 | 483.741 | 0,23% |
| 2018 | 29.287 | 0,37% |
| 2024 | 463.859 | 0,01% |
| 2026 | 20.985 | 0,01% |

O pior ano perde 1,76% das linhas. O CPF perderia **100% de 2024** — ver a nota 1
do [`der-enrico.md`](der-enrico.md). Quem não tem título válido fica de fora do
mart: sem chave não há linha do tempo, e inventar uma por nome criaria homônimos.

🚨 **`sq_candidato` não serve para deduplicar antes de 2010** — é a armadilha
descrita na nota 2 do [`der-enrico.md`](der-enrico.md), e ela derruba justamente
os anos que só a Q12 usa. Em 2004 são 402.157 candidaturas em 1.506 valores de
`sq_candidato`.

## Resultado

**1.856.217 pessoas** distintas entre 2002 e 2026, das quais **599.547 (32,3%) se
candidataram em duas ou mais eleições.** Reproduz o número do `estrategia.md`
(1.856.271 / 599.547 / 32,3%) — a diferença de 54 pessoas são linhas descartadas
pelo `ignore_errors` nos arquivos de 2008 e 2016.

| eleições disputadas | pessoas |
|---|---|
| 1 | 1.256.670 |
| 2 | 337.134 |
| 3 | 135.479 |
| 4 | 66.661 |
| 5 | 34.434 |
| 6 | 20.054 |
| 7 a 9 | 5.322 |
| 10 a 12 | 451 |
| **13 (todas)** | **12** |

### Três leituras

**① Quem volta, volta muito.** A cauda é longa: 451 pessoas disputaram de 10 a 12
eleições, e 12 pessoas estiveram nas 13 — ou seja, em toda eleição realizada no
país desde 2002, municipal e geral, alternando entre cargos.

**② A fidelidade partidária é minoria.** Entre os 599.547 reincidentes, só
170.375 (28,4%) ficaram num único partido. A maioria passou por dois ou mais, e
2 pessoas passaram por 11 siglas.

Isso reforça a decisão ③ do kickoff, de **não modelar sucessão partidária e
classificar por espectro**: se nem a pessoa fica no partido, rastrear a sigla ao
longo do tempo responde menos do que rastrear o campo político.

**③ Reincidir e vencer andam juntos.** Entre quem disputou uma só eleição, 3,0%
foram eleitos alguma vez; entre os reincidentes, 31,9% — dez vezes mais.

⚠️ **A causalidade é a inversa da leitura fácil.** Não é candidatar-se de novo que
elege; é ter sido eleito que faz a pessoa se candidatar de novo. O mandato produz
a recandidatura, não o contrário. Vale escrever isso no relatório, porque o
gráfico sugere o oposto.

### A carreira mais longa

A trajetória mais longa da base do Piauí tem **13 eleições, de 2002 a 2026,
passando por 11 partidos e 5 cargos diferentes — sem nunca ter sido eleita.**

Isso corrige o `estrategia.md`, que registrou "12 eleições (2004–2026), 5
partidos". A diferença vem do método: aquele número deduplicava por
`sq_candidato`, que funde pessoas nos anos antigos.

É o perfil de **candidato perene**: a categoria que a Q12 revela e que nenhuma
das outras onze perguntas alcança, porque todas olham uma eleição por vez.

## Como usar o mart

`mart_q12` tem uma linha por pessoa. A coluna `trajetoria` é uma lista de structs
em ordem cronológica, com `ano`, `cargo`, `partido`, `sg_ue` e `eleito` — é ela
que alimenta o gráfico de linha do tempo.

```sql
-- as dez carreiras mais longas do Piauí
SELECT nm_candidato, qt_eleicoes, qt_eleito, qt_partidos, trajetoria
FROM mart_q12
WHERE list_contains(ufs, 'PI')
ORDER BY qt_eleicoes DESC LIMIT 10;
```

⚠️ `sg_ue` é código, não nome. Junte com `MUNICIPIO` do módulo do Davi para
exibir; **não** junte `nm_ue` por `sg_ue` direto do `consulta_cand`, que é
1-para-muitos e multiplica linhas (nota 3 do [`der-enrico.md`](der-enrico.md)).

## O que esta pergunta não responde

- **Mandato cumprido não é candidatura.** Quem foi eleito e assumiu, mas não
  disputou de novo, aparece com uma eleição só. A base é de candidaturas.
- **Cassação e renúncia** estão em `ds_sit_tot_turno`, mas não modelamos o
  desfecho pós-eleição (o `motivo_cassacao` foi baixado e está disponível).
- **Vice não é rastreado.** Quem concorreu como vice aparece na base, mas o
  cargo registrado é o da chapa.
