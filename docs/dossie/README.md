# Dossiê da análise de candidatos

Projeto React + Vite + TypeScript, estilizado com Tailwind CSS v4. Requer Node.js 20+.

```bash
cd docs/dossie
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc
npm run build      # tsc + gera dist/ (estático, base relativa)
```

## Estrutura

- `secoes/`: um `.md` por seção numerada do dossiê — cada integrante edita o seu sem mexer nos demais. A primeira linha de cada arquivo é o título (`## N. Título`); o resto é o corpo em Markdown (tabelas incluídas). Ordem e mapeamento seção→arquivo ficam em `SECTION_FILES` em `src/sections.ts`. O Vite recarrega a página ao salvar; não há etapa de geração.
  - `introducao.md`, `perguntas.md`, `der.md`, `modelo-relacional.md`, `dicionario.md`, `sobre.md`, `fontes.md`.
- `src/`: aplicação. `App.tsx` monta capa, sumário e seções; `Markdown.tsx` aplica as classes Tailwind ao HTML das seções; `DictionarySection.tsx` renderiza o dicionário com o filtro por tabela ou atributo; `DiagramViewer.tsx` faz arrasto, zoom e ajuste à tela do DER; `LeiameBrowser.tsx` lista os PDFs de leia-me e abre a prévia. Cores e fontes do tema ficam em `@theme` em `src/styles.css`; a impressão usa as variantes `print:` do Tailwind.
- `public/`: arquivos servidos como estão.
  - `public/diagramas/der-geral.drawio` e `public/diagramas/der-geral-separado.drawio`: fontes editáveis dos diagramas. As duas páginas do DER separado aparecem na página e na impressão a partir de `der-geral-relacoes.drawio.svg` e `der-geral-atributos.drawio.svg`.
  - `public/leiames/`: 141 PDFs de leia-me espelhados de `dados/raw/`. O [índice](public/leiames/indice.md) lista todos os caminhos e é lido pela seção **Fontes**, que abre a prévia de qualquer PDF com um clique.
- `der.mmd` e `mermaid.min.js`: materiais anteriores; a página não os carrega.
- `describe-candidatos.csv`: resultado de `DESCRIBE candidatos_raw` em `dados/processed/tse.duckdb`, exportado em 23/09/2026. Mantido como evidência bruta; a página não exibe essa tabela.

Após editar qualquer `.drawio`, reexporte os SVGs com fundo branco (na raiz do repositório):

```bash
uv run python scripts/export_dossie_der.py
```

O PDF entregue é uma captura estática do conteúdo no momento da impressão (botão "Imprimir / salvar PDF").
