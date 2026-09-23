# Dossiê da análise de candidatos

- `index.html`: página interativa.
- `conteudo.md`: texto-base do dossiê, construído a partir dos documentos de `docs/`.
- `der.mmd`: **fonte Mermaid lida pela página para renderizar o DER**. O PDF usa o mesmo arquivo e o divide em módulos para impressão.
- `describe-candidatos.csv`: resultado de `DESCRIBE candidatos_raw` em `dados/processed/tse.duckdb`, exportado em 23/09/2026.
- `leiames/`: 141 PDFs de leia-me espelhados de `dados/raw/`, com a mesma estrutura relativa. O [índice](leiames/indice.md) lista todos os caminhos. Na página, clique em **Selecionar pasta leiames/** para que o navegador leia também as subpastas; a seleção é necessária por segurança do navegador.

Para abrir com o carregamento automático do DER e do CSV, na raiz do repositório execute:

```bash
rtk proxy python -m http.server 8765 --bind 127.0.0.1 --directory docs/dossie
```

Abra `http://127.0.0.1:8765/index.html`. O HTML também pode ser aberto diretamente, mas nesse caso o navegador pode bloquear o carregamento automático dos arquivos; o seletor do DER permite escolhê-lo manualmente.

Depois de editar `conteudo.md`, regenere a página com `rtk uv run python scripts/build_dossie.py`. O PDF entregue é uma captura estática do conteúdo no momento da geração; arquivos adicionados posteriormente a `leiames/` não entram nele automaticamente.
