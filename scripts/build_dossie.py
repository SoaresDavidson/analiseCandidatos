"""Gera a página estática do dossiê a partir de docs/dossie/secoes/*.md.

Cada seção numerada vive em um arquivo próprio (um por integrante), lido na
ordem declarada em SECTION_FILES. A capa e o sumário continuam gerados aqui
porque são estrutura compartilhada, não conteúdo de uma seção.
"""

from __future__ import annotations

import re
from html import escape
from pathlib import Path

import mistune


ROOT = Path(__file__).resolve().parents[1]
DOSSIER = ROOT / "docs" / "dossie"
SECOES = DOSSIER / "secoes"
MARKDOWN = mistune.create_markdown(plugins=["table"])

# (slug, arquivo) na ordem em que aparecem na página.
SECTION_FILES = [
    ("introducao", "introducao.md"),
    ("perguntas", "perguntas.md"),
    ("der", "der.md"),
    ("modelo-relacional", "modelo-relacional.md"),
    ("dicionario", "dicionario.md"),
    ("sobre", "sobre.md"),
    ("fontes", "fontes.md"),
]
DER_PAGES = [
    ("Entidades e relacionamentos", "diagramas/der-geral-relacoes.drawio.svg"),
    ("Entidades e atributos", "diagramas/der-geral-atributos.drawio.svg"),
]


def load_section(sid: str, filename: str) -> tuple[str, str]:
    text = (SECOES / filename).read_text(encoding="utf-8").strip()
    heading, _, body = text.partition("\n")
    if not heading.startswith("## "):
        raise ValueError(f"{filename}: primeira linha deve ser um título '## ...'")
    return heading[3:].strip(), body.strip()


def build() -> None:
    items = [(sid, *load_section(sid, filename)) for sid, filename in SECTION_FILES]
    for _, filename in DER_PAGES:
        if not (DOSSIER / filename).is_file():
            raise FileNotFoundError(f"SVG do DER ausente: {DOSSIER / filename}")

    nav = '<a href="#capa">Capa</a><a href="#sumario">Sumário</a>' + "".join(
        f'<a href="#{sid}">{escape(title)}</a>' for sid, title, _ in items
    )
    body = []
    for sid, title, content in items:
        extra = ""
        if sid == "der":
            page_options = "".join(
                f'<option value="{escape(filename, quote=True)}">{escape(title)}</option>'
                for title, filename in DER_PAGES
            )
            print_pages = "".join(
                f'<section class="print-module"><h3>{escape(title)}</h3>'
                f'<img src="{escape(filename, quote=True)}" alt="DER: {escape(title, quote=True)}"></section>'
                for title, filename in DER_PAGES
            )
            extra = f'''<div class="diagram-toolbar no-print">
              <label for="diagram-page">Página</label><select id="diagram-page" aria-label="Página do DER">{page_options}</select>
              <button id="zoom-out" type="button" aria-label="Diminuir diagrama">−</button>
              <button id="zoom-reset" type="button">Ajustar</button>
              <button id="zoom-in" type="button" aria-label="Ampliar diagrama">+</button>
              <a href="diagramas/der-geral-separado.drawio" download>Baixar .drawio</a>
            </div><div id="diagram-viewport" role="region" aria-label="DER: arraste para percorrer; use a roda do mouse para ampliar" tabindex="0"><img id="diagram-image" alt="Diagrama entidade-relacionamento"></div><div id="print-diagrams">{print_pages}</div><p id="diagram-status" class="status" role="status">Carregando DER…</p>'''
        elif sid == "dicionario":
            # Envolve cada entidade (h4 + descrição + tabela) num bloco que o
            # filtro consegue esconder sem depender da ordem dos irmãos no DOM.
            content_html = re.sub(
                r'(<h4>.*?)(?=<h4>|<h3>|$)',
                lambda m: f'<div class="dict-entity">{m.group(1)}</div>',
                MARKDOWN(content),
                flags=re.S,
            )
            extra = '''<div class="dict-filter no-print"><label for="dict-search">Filtrar por tabela ou atributo</label><input id="dict-search" type="search" placeholder="ex.: MUNICIPIO, cod_ibge, CD_FAIXA_ETARIA"><span id="dict-status" class="status" role="status"></span></div>'''
            body.append(f'<section id="{sid}" class="document-section"><h2>{escape(title)}</h2>{extra}{content_html}</section>')
            continue
        elif sid == "fontes":
            extra = '''<div class="folder-box no-print"><strong>Consultar PDFs de leia-me</strong><p>Lista carregada de <code>docs/dossie/leiames/indice.md</code>. <a href="leiames/indice.md">Ver índice em Markdown</a>. Clique em um arquivo para abrir a prévia.</p><input id="leiame-search" type="search" placeholder="Filtrar por caminho"><p id="leiame-status" role="status">Carregando índice de leia-mes…</p><ul id="leiame-list"></ul></div>'''
        body.append(f'<section id="{sid}" class="document-section"><h2>{escape(title)}</h2>{MARKDOWN(content)}{extra}</section>')

    sumario_links = "".join(
        f'<li><a href="#{sid}">{escape(title)}</a></li>'
        for sid, title, _ in items
    )

    html = rf'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dossiê · Análise de Candidatos | UFPI</title>
<meta name="description" content="Dossiê acadêmico de Banco de Dados Relacionais da UFPI: perguntas, DER, dicionário e fontes.">
<style>
:root{{--blue:#143e76;--blue2:#315d99;--pale:#eff5fb;--gold:#d7ac31;--ink:#1e2d3e;--muted:#52677d;--line:#d8e2ec}}
*{{box-sizing:border-box}}html{{scroll-behavior:smooth}}body{{margin:0;background:#f7f9fc;color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}}
button,input,select{{font:inherit}}button,.file-label{{cursor:pointer}}a{{color:var(--blue)}}a:hover{{text-decoration-color:var(--gold)}}
.topnav{{position:sticky;top:0;z-index:5;background:var(--blue);color:white;display:flex;align-items:center;gap:14px;padding:9px 24px}}.topnav img{{width:38px;height:38px;object-fit:contain;flex:none}}.topnav .brand{{font:700 .95rem Georgia,serif;white-space:nowrap;flex:none}}.topnav nav{{display:flex;gap:4px;overflow-x:auto;flex:1;scrollbar-width:thin}}.topnav a{{color:#e8f1fc;text-decoration:none;padding:8px 12px;border-radius:6px;font-size:.85rem;white-space:nowrap;flex:none}}.topnav a:hover,.topnav a:focus{{background:#ffffff24}}.topnav a[aria-current="location"]{{background:white;color:var(--blue);font-weight:700}}
.topnav .sub{{color:#bfd3ea;font-size:.74rem;white-space:nowrap;flex:none}}
main{{max-width:1160px;margin:0 auto;padding:0 42px 80px}}.topbar{{display:flex;justify-content:flex-end;align-items:center;padding:18px 0;gap:9px}}button,.file-label{{border:1px solid var(--line);border-radius:7px;background:white;color:var(--blue);padding:7px 12px;font-weight:600}}button:hover,.file-label:hover{{background:var(--pale)}}
.cover{{min-height:790px;background:linear-gradient(145deg,#fff 60%,#eaf2fb);border:1px solid var(--line);border-top:9px solid var(--blue);display:flex;flex-direction:column;align-items:center;text-align:center;padding:68px 60px 44px;box-shadow:0 8px 32px #153c7010}}.cover img{{width:154px;height:154px;object-fit:contain}}.cover .university{{color:var(--blue);font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin:23px 0 4px}}.cover .course{{color:var(--muted);letter-spacing:.04em}}h1,h2,h3{{font-family:Georgia,"Times New Roman",serif;color:var(--blue);line-height:1.22}}h1{{font-size:clamp(2.4rem,5vw,4.5rem);margin:64px 0 12px;max-width:780px}}.cover .rule{{width:130px;height:4px;background:var(--gold);margin:18px auto 35px}}.cover .people{{margin-top:auto;display:grid;gap:3px}}.cover .place{{margin-top:40px;color:var(--muted)}}
.document-section{{background:white;border:1px solid var(--line);border-radius:10px;margin-top:27px;padding:34px 38px;overflow:hidden}}main > section[hidden]{{display:none!important}}.document-section>h2{{font-size:2rem;margin:0 0 25px;border-bottom:2px solid var(--gold);padding-bottom:13px}}h3{{font-size:1.34rem;margin:27px 0 8px}}p{{margin:10px 0 16px}}.toc{{columns:2;list-style:none;padding:0}}.toc li{{padding:10px 0;border-bottom:1px solid var(--line);break-inside:avoid}}.toc a{{text-decoration:none;font-weight:600}}
table{{border-collapse:collapse;width:100%;font-size:.9rem}}th,td{{text-align:left;padding:10px 12px;vertical-align:top;border-bottom:1px solid var(--line)}}th{{background:var(--pale);color:var(--blue);font-weight:700}}tr:nth-child(even) td{{background:#fbfdff}}.document-section>table{{display:block;overflow-x:auto}}code{{font-size:.88em;background:#f0f4f8;padding:1px 3px;border-radius:3px;overflow-wrap:anywhere}}.model-blank .blank-area{{height:290px}}.status{{font-size:.85rem;color:var(--muted)}}
.diagram-toolbar{{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:20px 0}}.diagram-toolbar select{{border:1px solid var(--line);border-radius:7px;background:white;color:var(--blue);padding:7px 12px;max-width:100%}}#diagram-viewport{{position:relative;overflow:hidden;border:1px solid var(--line);background:white;height:clamp(340px,65vh,750px);touch-action:none;cursor:grab}}#diagram-viewport.dragging{{cursor:grabbing}}#diagram-viewport:focus-visible{{outline:3px solid var(--gold);outline-offset:2px}}#diagram-image{{display:block;position:absolute;top:0;left:0;max-width:none;transform-origin:top left;user-select:none;-webkit-user-drag:none;pointer-events:none}}#print-diagrams{{display:none}}.folder-box{{border:1px dashed var(--blue2);background:var(--pale);padding:22px;border-radius:9px;margin-top:25px}}.folder-box input[type=search]{{border:1px solid var(--line);border-radius:6px;padding:7px 10px;min-width:260px;margin:10px 0}}
#leiame-list{{list-style:none;padding:0;margin:10px 0 0;max-height:420px;overflow:auto;border:1px solid var(--line);border-radius:8px;background:white}}#leiame-list li{{border-bottom:1px solid var(--line)}}#leiame-list li:last-child{{border-bottom:0}}#leiame-list button{{display:block;width:100%;text-align:left;border:0;border-radius:0;background:white;padding:9px 14px;font-size:.85rem;font-weight:400;color:var(--ink)}}#leiame-list button:hover{{background:var(--pale)}}
.dict-filter{{position:sticky;top:56px;z-index:3;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;background:var(--pale);border:1px solid var(--line);border-radius:9px;padding:12px 16px;margin:0 0 20px}}.dict-filter label{{font-weight:600;color:var(--blue)}}.dict-filter input{{flex:1;min-width:220px;border:1px solid var(--line);border-radius:6px;padding:7px 10px}}.dict-entity h4{{font-size:1.08rem;margin:30px 0 4px;color:var(--blue)}}.dict-entity table{{display:block;overflow-x:auto}}.dict-entity td:nth-child(-n+3){{white-space:nowrap}}#dicionario [hidden]{{display:none!important}}
.modal{{position:fixed;inset:0;background:#0b1a2eb3;display:flex;align-items:center;justify-content:center;z-index:20;padding:24px}}.modal[hidden]{{display:none}}.modal-box{{background:white;border-radius:10px;width:min(920px,100%);height:min(760px,90vh);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px #0006}}.modal-bar{{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--line)}}.modal-bar span{{font-weight:600;color:var(--blue);overflow-wrap:anywhere;font-size:.85rem}}.modal-bar button{{border:0;background:transparent;font-size:1.3rem;line-height:1;color:var(--muted);cursor:pointer;padding:4px 8px}}.modal-bar button:hover{{color:var(--blue)}}#leiame-modal-frame{{flex:1;border:0}}
@media(max-width:900px){{.topnav{{padding:8px 12px;gap:8px}}.topnav .sub{{display:none}}main{{padding:0 16px 50px}}.cover{{min-height:660px;padding:40px 18px}}.document-section{{padding:24px 19px}}.toc{{columns:1}}}}
@page{{size:A4;margin:17mm 15mm}}@media print{{body{{background:white;font-size:10pt;print-color-adjust:exact;-webkit-print-color-adjust:exact}}.topnav,.topbar,.no-print{{display:none!important}}main{{margin:0;padding:0;max-width:none}}main > section[hidden]{{display:block!important}}main > .cover[hidden]{{display:flex!important}}.cover{{border:0;box-shadow:none;height:260mm;min-height:0;break-after:page;padding:30mm 10mm}}.cover img{{width:38mm;height:38mm}}h1{{font-size:31pt;margin-top:25mm}}.document-section{{border:0;border-radius:0;margin:0;padding:0 0 10mm;overflow:visible;break-before:page}}.document-section>h2{{font-size:18pt;margin:0 0 9mm}}h3{{font-size:13pt}}.toc{{columns:1}}table{{font-size:7.7pt;display:table!important}}th,td{{padding:4px 5px;break-inside:avoid}}#diagram-viewport{{display:none}}#print-diagrams{{display:block}}.print-module{{break-inside:avoid;break-after:page}}.print-module:last-child{{break-after:auto}}.print-module h3{{font-size:12pt;margin:7mm 0}}.print-module img{{display:block;width:100%;height:auto;max-height:205mm;object-fit:contain}}.model-blank .blank-area{{height:175mm}}#diagram-status{{display:none}}}}
</style></head><body>
<header class="topnav"><img src="logo-ufpi.webp" alt="Brasão da UFPI"><div class="brand">UFPI · Dossiê de pesquisa</div><nav aria-label="Seções do dossiê">{nav}</nav><span class="sub">Banco de Dados Relacionais · Teresina · 2026</span></header>
<main><div class="topbar no-print"><button type="button" onclick="window.print()">Imprimir / salvar PDF</button></div>
<section id="capa" class="cover"><img src="logo-ufpi.webp" alt="Brasão da Universidade Federal do Piauí"><div class="university">Universidade Federal do Piauí</div><div class="course">Disciplina de Banco de Dados Relacionais</div><h1>Análise de Candidatos</h1><div class="rule"></div><p>Dossiê do projeto</p><div class="people"><strong>Professor</strong><span>Luiz Claudio Demes da Mata Sousa</span><br><strong>Discentes</strong><span>Eduardo Melo de Carvalho</span><span>Enrico da Rocha Santos Teixeira</span><span>Maria Eduarda Farias Gomes</span><span>Davi Sousa Soares</span></div><div class="place">Teresina · PI · 2026</div></section>
<section id="sumario" class="document-section"><h2>Sumário</h2><ol class="toc">{sumario_links}</ol></section>
{''.join(body)}
</main>
<div id="leiame-modal" class="modal no-print" hidden role="dialog" aria-modal="true" aria-label="Prévia do PDF de leia-me"><div class="modal-box"><div class="modal-bar"><span id="leiame-modal-title"></span><button type="button" id="leiame-modal-close" aria-label="Fechar prévia">×</button></div><iframe id="leiame-modal-frame" title="Prévia do PDF de leia-me"></iframe></div></div>
<script>
const sections=[...document.querySelectorAll('main > section[id]')];
const navLinks=[...document.querySelectorAll('.topnav nav a')];
function showSection(){{
  const id=decodeURIComponent(location.hash.slice(1));
  const selected=sections.find(section=>section.id===id)||sections[0];
  for(const section of sections)section.hidden=section!==selected;
  for(const link of navLinks){{
    if(link.hash==='#'+selected.id)link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  }}
  window.scrollTo(0,0);
}}
window.addEventListener('hashchange',showSection);
showSection();
const leiameModal=document.getElementById('leiame-modal'),leiameFrame=document.getElementById('leiame-modal-frame'),leiameTitle=document.getElementById('leiame-modal-title'),leiameStatus=document.getElementById('leiame-status'),leiameList=document.getElementById('leiame-list'),leiameSearch=document.getElementById('leiame-search');
function openLeiame(path){{leiameFrame.src='leiames/'+path;leiameTitle.textContent=path;leiameModal.hidden=false}}
function closeLeiame(){{leiameModal.hidden=true;leiameFrame.src=''}}
document.getElementById('leiame-modal-close').onclick=closeLeiame;
leiameModal.addEventListener('click',e=>{{if(e.target===leiameModal)closeLeiame()}});
document.addEventListener('keydown',e=>{{if(e.key==='Escape'&&!leiameModal.hidden)closeLeiame()}});
let leiamePaths=[];
function drawLeiames(){{const q=leiameSearch.value.toLocaleLowerCase('pt-BR');const rows=leiamePaths.filter(p=>p.toLocaleLowerCase('pt-BR').includes(q));leiameList.replaceChildren();for(const p of rows){{const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.textContent=p;b.onclick=()=>openLeiame(p);li.append(b);leiameList.append(li)}}leiameStatus.textContent=rows.length+' de '+leiamePaths.length+' PDF(s)';}}
leiameSearch.addEventListener('input',drawLeiames);
const dictSection=document.getElementById('dicionario'),dictSearch=document.getElementById('dict-search'),dictStatus=document.getElementById('dict-status');
const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function filterDict(){{
  const q=fold(dictSearch.value.trim());
  const entities=[...dictSection.querySelectorAll('.dict-entity')];
  let shownEntities=0,shownRows=0,totalRows=0;
  for(const entity of entities){{
    const name=fold(entity.querySelector('h4').textContent);
    const rows=[...entity.querySelectorAll('tbody tr')];
    totalRows+=rows.length;
    const whole=!q||name.includes(q);
    let hits=0;
    for(const row of rows){{const show=whole||fold(row.textContent).includes(q);row.hidden=!show;if(show)hits++}}
    entity.hidden=hits===0&&!whole;
    if(!entity.hidden){{shownEntities++;shownRows+=hits}}
  }}
  // Cabeçalhos de grupo e texto solto (convenções, pendências) só aparecem sem filtro,
  // salvo o h3 de um grupo que ainda tem entidade visível.
  let heading=null,groupVisible=false;
  const flush=()=>{{if(heading)heading.hidden=!!q&&!groupVisible}};
  for(const el of dictSection.children){{
    if(el.tagName==='H2'||el.classList.contains('dict-filter'))continue;
    if(el.tagName==='H3'){{flush();heading=el;groupVisible=false;continue}}
    if(el.classList.contains('dict-entity')){{if(!el.hidden)groupVisible=true;continue}}
    el.hidden=!!q;
  }}
  flush();
  dictStatus.textContent=q?`${{shownEntities}} de ${{entities.length}} tabelas · ${{shownRows}} de ${{totalRows}} atributos`:`${{entities.length}} tabelas · ${{totalRows}} atributos`;
}}
dictSearch.addEventListener('input',filterDict);
filterDict();
fetch('leiames/indice.md').then(r=>{{if(!r.ok)throw Error('HTTP '+r.status);return r.text()}}).then(t=>{{leiamePaths=[...t.matchAll(/^- \[[^\]]+\]\(([^)]+)\)/gm)].map(m=>m[1]);drawLeiames()}}).catch(()=>{{leiameStatus.textContent='Sirva a pasta localmente para carregar o índice de leia-mes.'}});
</script><script src="diagram-viewer.js"></script></body></html>'''
    (DOSSIER / "index.html").write_text(html, encoding="utf-8")
    print(f"index.html gerado: {len(html)} caracteres, {len(items)} seções")


if __name__ == "__main__":
    build()
