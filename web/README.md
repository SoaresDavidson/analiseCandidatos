# Politicagem (web)

Painel do grupo em React + Vite + TypeScript + Tailwind CSS v4. Substitui os HTML
gerados em `docs/*-painel/`.

O app mostra as respostas às perguntas do trabalho para os 6 estados do recorte (AM, GO,
MA, MT, RS, SE). É um site estático: não tem servidor nem banco. Os dados chegam já prontos
em `public/dados/`, gravados pelos geradores Python (ver [Dados](#dados)).

As páginas ficam em três temas, definidos em `src/paineis/registro.ts`:

| tema | páginas |
| --- | --- |
| Cidades | Q7 para que lado vota · Q3 riqueza × quem vence · Q4 escolaridade · Q6 idade e alternância · explorar municípios |
| Dinheiro | Q8 fundo público · Q9 propaganda · Q2 patrimônio |
| Políticos | Q10 carreira · quem são os eleitos · plenários |

A Arena fica fora dos temas e abre pela aba ⚔ na faixa do topo.

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
para `public/fotos/<ano>/<sq>.jpg` (~14 mil, uns 3 minutos na primeira vez; reaproveita
as de `docs/candidatos-painel/fotos/` se existirem). Daí em diante o `npm run dev` as
serve e o `npm run build` as copia para `dist/`. Sem a foto, aparece a inicial do nome.

## Dados

Os geradores Python (`scripts/gerar_painel_*.py`, da raiz do repositório) leem o banco
e gravam cada arquivo de `public/dados/` por `scripts/painel_web.py`:

| arquivo | gerador |
| --- | --- |
| `q3.json`, `q7.json` | `uv run python -m scripts.gerar_painel_q3_q7` |
| `q2.json`, `q6.json` | `uv run python -m scripts.gerar_painel_q2_q6` |
| `q4.json` | `uv run python -m scripts.gerar_painel_q4` |
| `q8.json`, `q9.json` | `uv run python -m scripts.gerar_painel_q8_q9` |
| `q10.json`, `q10-financas/NN.json` | `uv run python -m scripts.gerar_painel_q10` |
| `candidatos-eleitos.json` (+ fotos) | `uv run python -m scripts.gerar_painel_candidatos` |
| `municipios-cidades.json` | `uv run python -m scripts.gerar_painel_municipios` |
