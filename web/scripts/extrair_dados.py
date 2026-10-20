"""Extrai os dados embutidos nos painéis HTML antigos para web/public/dados/.

Uso único na migração: cada docs/teste/<pasta>/index.html traz os dados num
<script id="dados" type="application/json">; o app React lê o mesmo JSON por fetch.
"""

import re
import shutil
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
ORIGEM = RAIZ / "docs" / "teste"
DESTINO = RAIZ / "web" / "public" / "dados"
PADRAO = re.compile(r'<script id="dados" type="application/json">(.*?)</script>', re.S)

DESTINO.mkdir(parents=True, exist_ok=True)
for html in sorted(ORIGEM.glob("*-painel/index.html")):
    nome = html.parent.name.removesuffix("-painel")
    achado = PADRAO.search(html.read_text(encoding="utf-8"))
    if achado:
        (DESTINO / f"{nome}.json").write_text(achado.group(1), encoding="utf-8")
        print(f"{nome}.json")

shutil.copy(ORIGEM / "municipios-painel" / "dados.json", DESTINO / "municipios-cidades.json")
shutil.copy(RAIZ / "docs" / "candidatos-painel" / "dados.json", DESTINO / "candidatos-eleitos.json")
shutil.copytree(ORIGEM / "q10-painel" / "financas", DESTINO / "q10-financas", dirs_exist_ok=True)
