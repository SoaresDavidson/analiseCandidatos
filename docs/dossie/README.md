# Dossiê da análise de candidatos

- `index.html`: página interativa (gerada, não editar direto).
- `secoes/`: um `.md` por seção numerada do dossiê — cada integrante edita o seu sem mexer nos demais. A primeira linha de cada arquivo é o título (`## N. Título`); o resto é o corpo em Markdown (tabelas incluídas). Ordem e mapeamento seção→arquivo ficam em `SECTION_FILES` no topo de `scripts/build_dossie.py`.
  - `introducao.md`, `perguntas.md`, `der.md`, `modelo-relacional.md`, `dicionario.md`, `sobre.md`, `fontes.md`.
- `der.mmd`: **fonte Mermaid lida pela página para renderizar o DER**. O PDF usa o mesmo arquivo e o divide em módulos para impressão.
- `describe-candidatos.csv`: resultado de `DESCRIBE candidatos_raw` em `dados/processed/tse.duckdb`, exportado em 23/09/2026. Mantido como evidência bruta; a página não exibe mais essa tabela.
- `leiames/`: 141 PDFs de leia-me espelhados de `dados/raw/`. O [índice](leiames/indice.md) lista todos os caminhos e é lido pela página na seção **Fontes**, que abre a prévia de qualquer PDF em uma janela sobreposta com um clique.

Para abrir com o carregamento automático do DER e do CSV, na raiz do repositório execute:

```bash
rtk proxy python -m http.server 8765 --bind 127.0.0.1 --directory docs/dossie
```

Abra `http://127.0.0.1:8765/index.html`. O HTML também pode ser aberto diretamente, mas nesse caso o navegador pode bloquear o carregamento automático dos arquivos; o seletor do DER permite escolhê-lo manualmente.

Depois de editar um arquivo em `secoes/`, regenere a página com `rtk uv run python scripts/build_dossie.py`. O PDF entregue é uma captura estática do conteúdo no momento da geração; arquivos adicionados posteriormente a `leiames/` não entram nele automaticamente.
