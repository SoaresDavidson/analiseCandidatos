# Politicagem (web)

Painel do grupo em React + Vite + TypeScript + Tailwind CSS v4. Substitui os HTML
gerados em `docs/*-painel/`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build -> dist/
```

## Estrutura

```
src/
  styles/          configuração do Tailwind, reutilizada por todo o app
    tema.css         tokens (@theme): cores, fonte, raios, sombras, animações
    base.css         padrões de elemento: h1-h3, tabelas, foco, texto de SVG
    utilitarios.css  classes próprias (@utility): texto-nota, grade-duas, svg-eixo, mapa...
    animacoes.css    entrada das páginas
  componentes/     kit de interface: Pagina, Campo, Seletor, Alternador, Caixa, Etiqueta,
                   Linha, Selo, VerMais, Legenda, Rampa, Anel, Barra, Empilhada, Dica,
                   FotoEleito, Plenario, Carregando
  lib/             formato (fmt, int, pc, brl, nomeProprio), espectro, dados (useDados),
                   navegacao (abrir ficha/município), usePersistente, useHash
  inicio/          página inicial e cartões das perguntas
  paineis/<id>/    um painel por pergunta; registro.ts lista temas e páginas
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

## Fotos

As fotos dos eleitos não vão para o git. Ficam em `docs/candidatos-painel/fotos/`
(baixadas pelo `scripts/servir_painel.py`); no `npm run dev` e no `npm run preview`
o caminho `/fotos/<ano>/<sq>.jpg` é servido de lá. Sem a foto, aparece a inicial.

## Dados

`scripts/extrair_dados.py` tirou os dados embutidos dos HTML antigos para `public/dados/`.
