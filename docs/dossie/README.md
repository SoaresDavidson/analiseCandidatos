# Dossiê da análise de candidatos

- `index.html`: página interativa (gerada, não editar direto).
- `secoes/`: um `.md` por seção numerada do dossiê — cada integrante edita o seu sem mexer nos demais. A primeira linha de cada arquivo é o título (`## N. Título`); o resto é o corpo em Markdown (tabelas incluídas). Ordem e mapeamento seção→arquivo ficam em `SECTION_FILES` no topo de `scripts/build_dossie.py`.
  - `introducao.md`, `perguntas.md`, `der.md`, `modelo-relacional.md`, `dicionario.md`, `sobre.md`, `fontes.md`.
- `diagramas/der-geral.drawio` e `diagramas/der-geral-separado.drawio`: fontes editáveis dos três diagramas. As duas páginas do DER separado aparecem no HTML e na impressão a partir de `der-geral-relacoes.drawio.svg` e `der-geral-atributos.drawio.svg`.
- `diagram-viewer.js`: navegação por arrasto, zoom e ajuste à tela do DER. `der.mmd` e `mermaid.min.js` permanecem como materiais anteriores; a página não os carrega.
- `describe-candidatos.csv`: resultado de `DESCRIBE candidatos_raw` em `dados/processed/tse.duckdb`, exportado em 23/09/2026. Mantido como evidência bruta; a página não exibe mais essa tabela.
- `leiames/`: 141 PDFs de leia-me espelhados de `dados/raw/`. O [índice](leiames/indice.md) lista todos os caminhos e é lido pela página na seção **Fontes**, que abre a prévia de qualquer PDF em uma janela sobreposta com um clique.

Para abrir a página com os PDFs de leia-me, na raiz do repositório execute:

```bash
rtk proxy python -m http.server 8765 --bind 127.0.0.1 --directory docs/dossie
```

Abra `http://127.0.0.1:8765/index.html`. O DER em SVG também funciona ao abrir o HTML diretamente; o navegador pode bloquear o índice dos PDFs de leia-me nesse caso.

Após editar qualquer `.drawio`, reexporte os três SVGs com fundo branco:

```bash
rtk uv run python scripts/export_dossie_der.py
```

Depois de editar um arquivo em `secoes/`, regenere a página com `rtk uv run python scripts/build_dossie.py`. O PDF entregue é uma captura estática do conteúdo no momento da geração; arquivos adicionados posteriormente a `leiames/` não entram nele automaticamente.
