# Politicagem (web)

Painel do grupo em React + Vite + TypeScript + Tailwind CSS v4. Substitui os HTML
gerados em `docs/*-painel/`.

O app mostra as respostas às perguntas do trabalho. As 10 perguntas e a página dos presidentes usam a base
do Brasil inteiro (27 UFs); as páginas de exploração (municípios, quem são os eleitos, plenários,
Arena e Jogos) ainda usam os 6 estados do recorte original (AM, GO, MA, MT, RS, SE). É um site estático: não tem servidor nem banco. Os dados chegam já prontos
em `public/dados/`, gravados pelos geradores Python (ver [Dados](#dados)).

As páginas ficam em três temas, definidos em `src/paineis/registro.ts`:

| tema | páginas |
| --- | --- |
| Cidades | Q7 para que lado vota · Q3 riqueza × quem vence · Q4 escolaridade · Q6 idade e alternância · explorar municípios |
| Dinheiro | Q8 fundo público · Q9 propaganda · Q2 patrimônio |
| Políticos | Q10 carreira · quem são os eleitos · plenários |

A Arena e os Jogos ficam fora dos temas e abrem pelas abas ⚔ e 🎮 na faixa do topo. Os jogos
(`src/paineis/jogos/`) usam os mesmos eleitos: Politicodle (adivinhe o eleito do dia, como o
pokedle.net), Akinator, Quem ganha? (maior ou menor) e Monte sua candidatura. Cada um mora na
própria pasta e abre por `#jogos/<id>`; o hub fica em `jogos/index.tsx`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build -> dist/
npm test         # testes de unidade (Vitest)
npm run format   # formata com o Biome (format:check só confere)
npm run lint     # oxlint
```

## Estrutura

```
src/
  styles/          configuração do Tailwind, reutilizada por todo o app
    tema.css         tokens (@theme): cores, fonte, raios, sombras, animações
    base.css         padrões de elemento: h1-h3, tabelas, foco, texto de SVG
    utilitarios.css  classes próprias (@utility): texto-nota, grade-duas, svg-eixo, mapa...
    animacoes.css    entrada das páginas
  componentes/     kit de interface: Pagina, Campo, Seletor, SeletorUf, Alternador, Botao,
                   BuscaComLista, Chip, Caixa, Etiqueta,
                   Linha, Selo, VerMais, Legenda, Rampa, Anel, Barra, Empilhada, Dica,
                   FotoEleito, Plenario, Carregando
  lib/             formato (fmt, int, pc, brl, nomeProprio, nomeLugar), uf (UF_NOME, noEstado,
                   semAcento), estatistica (mediana), espectro, dados (useDados),
                   navegacao (abrir ficha/município), usePersistente, useHash
  inicio/          página inicial e cartões das perguntas
  paineis/<id>/    um painel por pergunta; registro.ts lista temas e páginas
tests/            testes de unidade (Vitest), espelhando src/
public/dados/      JSON de cada painel (lido por fetch, fora do bundle)
public/bandeiras/  bandeiras dos 6 estados
```

## Convenções

- Cores e medidas vêm de `styles/tema.css` (`bg-ouro`, `text-texto-2`, `rounded-caixa`,
  `max-w-pagina`). Valor solto (`#ebb400`) só onde o SVG precisa da cor calculada.
- Antes de escrever markup, procure o bloco em `componentes/`. Repetiu em dois painéis,
  vira componente ou `@utility`.
- Dados: `useDados<T>("q8.json")`. Os tipos do JSON ficam em `paineis/<id>/tipos.ts`.
- Filtros que o usuário escolhe: `usePersistente("q8-filtros", padrao)`.
- Abrir a ficha de um eleito ou um município: `useNavegacao()`.
- Endereço: `#q7`, `#municipios/2111300`, `#municipios/MA`, `#candidatos/2024-123`.

## Testes e formatação

- Testes ficam em `tests/`, com a mesma árvore de `src/`: `src/lib/formato.ts` ->
  `tests/lib/formato.test.ts`. Funções puras rodam no ambiente node; teste de hook ou componente começa com `// @vitest-environment jsdom`
  e chama `afterEach(cleanup)` (o Vitest roda sem globals).
- Cálculo de painel (estatística, faixas, agregações) vai para um módulo puro
  (`calculo.ts`, `estatistica.ts`), que é o que se testa.
- Biome formata (2 espaços, 120 colunas, aspas duplas) e organiza imports; o lint é do oxlint.

## Fotos

As fotos dos eleitos não vão para o git. `npm run fotos` baixa do TSE as que faltam
para `public/fotos/<ano>/<sq>.jpg` (~65 mil, uns 15 minutos na primeira vez; reaproveita
as de `docs/candidatos-painel/fotos/` se existirem). Daí em diante o `npm run dev` as
serve e o `npm run build` as copia para `dist/`. Sem a foto, aparece a inicial do nome.

## Publicação

O workflow `.github/workflows/pages.yml` publica o painel no GitHub Pages a cada push na
`main` (ou à mão, pelo botão "Run workflow" na aba Actions). Ele baixa as fotos pequenas do
TSE (com cache), roda `npm ci` e `npm run build` em `web/` e publica `web/dist`. Antes da
primeira vez, o dono do repositório precisa ligar o Pages em Settings > Pages > Source:
"GitHub Actions". O endereço fica `https://<dono>.github.io/analiseCandidatos/`. As fotos
grandes (`fotos-grandes/`) não vão para o site publicado: lá os retratos usam a foto pequena.

## Dados

Os geradores Python (`scripts/gerar_painel_*.py`, da raiz do repositório) leem o banco
e gravam cada arquivo de `public/dados/` por `scripts/painel_web.py`:

| arquivo | gerador |
| --- | --- |
| `q1.json`, `q5.json` | `uv run python -m scripts.gerar_painel_q1_q5` |
| `q3.json`, `q7-brasil.json` | `uv run python -m scripts.gerar_painel_q3_q7` |
| `q7.json` | a Pergunta 7 antiga (6 estados), que só o jogo da candidatura ainda lê (não é mais gerado) |
| `q2.json`, `q6.json`, `q2-fotos/` | `uv run python -m scripts.gerar_painel_q2_q6` |
| `malhas/brasil.json`, `malhas/<UF>.json`, `malhas/municipios.json` (as 5.570 cidades num arquivo leve) | `uv run python -m scripts.gerar_malhas_web` |
| `q4.json` (o país) e `q4/<UF>.json` (cada estado) | `uv run python -m scripts.gerar_painel_q4` |
| `q8.json`, `q9.json` (o país) e `q9/<UF>.json` (a nuvem de cada estado) | `uv run python -m scripts.gerar_painel_q8_q9` (com `q8` ou `q9`, só uma) |
| `q10.json` (o país), `q10/<UF>.json` e `q10/BR.json` (as pessoas), `q10-financas/<UF>-NN.json` | `uv run python -m scripts.gerar_painel_q10` |
| `e2026.json` (a aba 2026) | `uv run python -m scripts.gerar_painel_2026` |
| `presidentes.json` e as fotos de `public/img/presidentes/` | `uv run python -m scripts.gerar_painel_presidentes` (busca no TSE os arquivos nacionais; não usa o banco) |
| `candidatos/<UF>.json` (+ fotos): as fichas do país, um arquivo por estado | `uv run python -m scripts.gerar_painel_candidatos` |
| `candidatos-eleitos.json` | as fichas dos 6 estados, das páginas ainda no recorte original (não é mais gerado) |
| `municipios-cidades.json` | `uv run python -m scripts.gerar_painel_municipios` |

Os geradores de duas perguntas aceitam o nome de uma só (`... gerar_painel_q1_q5 q1`). As
10 perguntas e as fichas dos eleitos saem com o país inteiro (`ufs` com as 27 siglas, `UFS_BR`
em `painel_web.py`). Para o país inteiro, a coleta é
`recorte_remoto --uf` com as 27 siglas (uns 31 GB em `dados/raw/`).

A Pergunta 4 é um livro (`src/paineis/q4/`, estilos em `src/styles/livro.css`): a capa abre
girando na lombada, o sumário lista os 27 estados e cada capítulo traz o mapa do estado na
página da esquerda e a resposta na da direita. O `Livro.tsx` cuida da capa e das folhas que
viram; `capitulos.ts` diz a ordem das aberturas. Os dados de cada estado (`q4/<UF>.json`) só
são buscados quando o capítulo é aberto.

A Pergunta 3 (`src/paineis/q3/`) usa o `MapaBrasil` com `relevo` (espessura e inclinação com o
mouse) e `pais` (as 5.570 cidades já no mapa do país, de `malhas/municipios.json`). A página
dos presidentes usa o mesmo mapa.

A Pergunta 6 (`src/paineis/q6/`) tem o mapa do país com zoom e dois rostos (`Rosto.tsx`), o dos
eleitores e o dos candidatos: a mesma ilustração (`public/img/q6/`), com uma camada grisalha por
cima e rugas que entram conforme a idade. `Regua.tsx` põe as idades do lugar numa régua só.

A rolagem é a da página inteira (o cabeçalho sobe junto); `Transicao.tsx` é a cortina branca
com a caricatura que aparece ao trocar de tela.

A Pergunta 7 (`src/paineis/q7/`) tem um chão que vai do vermelho (nota 0, esquerda) ao azul
(nota 10, direita): a urninha (`Mascote.tsx`) corre até a nota do lugar clicado no mapa
(`Chao.tsx`). Lula e Bolsonaro ficam na nota do PT e do PL; as fotos (`public/img/q7/`) são as
do registro de candidatura a presidente em 2022, dos dados abertos do TSE. A cor do mapa é a
mesma do chão (`corNota` em `util.ts`).

A Pergunta 8 (`src/paineis/q8/`) desenha o Congresso Nacional como gráfico (`Congresso.tsx`):
de cada 100 candidatos, os que dependem do fundo público ficam dentro da cumbuca e os outros,
na cúpula; cada janela acesa das torres é um eleito em cada 100 do grupo. `cena.ts` calcula o
lugar dos 100 bonecos. As animações das duas cenas estão em `src/styles/cenas.css`.

`malhas/` são os mapas: os 27 estados e os municípios de cada um, no mesmo sistema de
coordenadas, para o `MapaBrasil` (`src/componentes`) dar zoom do país para um estado.
`q2-fotos/` tem a foto original do TSE (161×225) do candidato de maior patrimônio de cada
cargo, eleição e estado; essas vão para o git, porque são poucas (uma por destaque).

`q8.json` e `q9.json` foram refeitos com o país inteiro (27 UFs), direto do banco: os números
não são mais os publicados por Enrico para os 6 estados.

2026 fica numa aba só dela (`src/paineis/e2026/`, dados em `e2026.json`): as contas de cada
pergunta para os deputados, senadores e governadores de 2026, ao lado de 2022. As páginas das
perguntas seguem até 2024 (macro `ano_divulgado`, em `sql/00_limpeza.sql`), porque a prestação
de contas de 2026 ainda pode mudar no TSE. Fora da aba, 2026 aparece só na linha do tempo da
Pergunta 10, na caixinha "2026" da Pergunta 4 e na página dos presidentes.

As fotos dos retratos em destaque (Pergunta 10) ficam em `public/fotos-grandes/`, no tamanho
do TSE (161×225): `uv run python -m scripts.baixar_fotos_web --grandes` (uns 600 MB, fora do
git). Sem elas, o retrato usa a foto pequena de `public/fotos/`.
