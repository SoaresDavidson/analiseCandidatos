"""Gera a página estática do dossiê a partir de docs/dossie/conteudo.md."""

from __future__ import annotations

import re
from html import escape
from pathlib import Path

import mistune


ROOT = Path(__file__).resolve().parents[1]
DOSSIER = ROOT / "docs" / "dossie"
MARKDOWN = mistune.create_markdown(plugins=["table"])


def sections(source: str) -> list[tuple[str, str]]:
    result = []
    for part in re.split(r"(?=^## )", source, flags=re.MULTILINE):
        if not part.startswith("## "):
            continue
        heading, _, body = part.partition("\n")
        result.append((heading[3:].strip(), body.strip()))
    return result


def build() -> None:
    source = (DOSSIER / "conteudo.md").read_text(encoding="utf-8")
    items = sections(source)
    ids = {
        "Sumário": "sumario",
        "3. Introdução": "introducao",
        "4. Perguntas": "perguntas",
        "5. Diagrama": "der",
        "6. Modelo": "modelo-relacional",
        "7. Dicionário": "dicionario",
        "8. Sobre": "sobre",
        "9. Visualização": "visualizacao",
        "10. Fontes": "fontes",
        "Documentos utilizados": "referencias",
    }
    def slug(title: str) -> str:
        return next((value for prefix, value in ids.items() if title.startswith(prefix)), "secao")

    nav = '<a href="#capa">Capa</a>' + "".join(
        f'<a href="#{slug(title)}">{escape(title)}</a>'
        for title, _ in items
    )
    body = []
    for title, content in items:
        sid = slug(title)
        if sid == "sumario":
            links = "".join(
                f'<li><a href="#{slug(name)}">{escape(name)}</a></li>'
                for name, _ in items
                if not name.startswith("Sumário") and not name.startswith("Documentos")
            )
            body.append(f'<section id="sumario" class="document-section"><h2>Sumário</h2><ol class="toc">{links}</ol></section>')
            continue
        if sid == "modelo-relacional":
            body.append('<section id="modelo-relacional" class="document-section model-blank"><h2>6. Modelo relacional</h2><div class="blank-area" aria-label="Espaço em branco para o modelo relacional"></div></section>')
            continue
        extra = ""
        if sid == "der":
            extra = '''<div class="diagram-toolbar no-print">
              <button id="zoom-out" type="button" aria-label="Diminuir diagrama">−</button>
              <button id="zoom-reset" type="button">Ajustar</button>
              <button id="zoom-in" type="button" aria-label="Ampliar diagrama">+</button>
              <a href="der.mmd" download>Baixar Mermaid</a>
              <label class="file-label">Carregar Mermaid local<input id="mermaid-picker" type="file" accept=".mmd,.txt" hidden></label>
            </div><div id="diagram-scroll"><div id="diagram" role="img" aria-label="Diagrama entidade-relacionamento"></div></div><div id="print-diagrams"></div><p id="diagram-status" class="status" role="status">Carregando docs/dossie/der.mmd…</p>'''
        elif sid == "visualizacao":
            extra = '''<div class="controls no-print"><label>Buscar coluna <input id="describe-search" type="search" placeholder="Nome, tipo ou nulidade"></label><span id="describe-count" role="status"></span><a href="describe-candidatos.csv" download>Baixar CSV</a></div><div class="table-scroll"><table id="describe-table"><thead><tr><th>Coluna</th><th>Tipo</th><th>Nulo?</th><th>Chave</th><th>Padrão</th><th>Extra</th></tr></thead><tbody></tbody></table></div><p id="describe-status" class="status" role="status">Carregando DESCRIBE candidatos_raw…</p>'''
        elif sid == "fontes":
            extra = '''<div class="folder-box no-print"><strong>Consultar PDFs de leia-me</strong><p>Há 141 PDFs em <code>docs/dossie/leiames/</code>, preservando as subpastas de <code>dados/raw/</code>. <a href="leiames/indice.md">Ver índice completo</a>. Para visualizá-los aqui, selecione a pasta; o navegador só a lê após sua escolha.</p><label class="file-label">Selecionar pasta leiames/<input id="folder-picker" type="file" webkitdirectory directory multiple hidden></label><p id="folder-status" role="status">Nenhuma pasta selecionada.</p><ul id="pdf-list"></ul><iframe id="pdf-preview" title="Prévia do PDF de leia-me" hidden></iframe></div>'''
        body.append(f'<section id="{sid}" class="document-section"><h2>{escape(title)}</h2>{MARKDOWN(content)}{extra}</section>')

    html = rf'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dossiê · Análise de Candidatos | UFPI</title>
<meta name="description" content="Dossiê acadêmico de Banco de Dados Relacionais da UFPI: perguntas, DER, dicionário e fontes.">
<style>
:root{{--blue:#143e76;--blue2:#315d99;--pale:#eff5fb;--gold:#d7ac31;--ink:#1e2d3e;--muted:#52677d;--line:#d8e2ec;--scale:1}}
*{{box-sizing:border-box}}html{{scroll-behavior:smooth}}body{{margin:0;background:#f7f9fc;color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}}
button,input{{font:inherit}}button,.file-label{{cursor:pointer}}a{{color:var(--blue)}}a:hover{{text-decoration-color:var(--gold)}}
.sidebar{{position:fixed;inset:0 auto 0 0;width:248px;background:var(--blue);color:white;padding:30px 19px;overflow:auto;z-index:2}}.sidebar img{{width:62px;height:62px;object-fit:contain}}.sidebar .brand{{font:700 1.1rem Georgia,serif;margin:10px 0 25px}}.sidebar nav{{display:grid;gap:4px}}.sidebar a{{color:#e8f1fc;text-decoration:none;padding:8px 10px;border-radius:6px;font-size:.87rem}}.sidebar a:hover,.sidebar a:focus{{background:#ffffff24}}.sidebar a[aria-current="location"]{{background:white;color:var(--blue);border-left:4px solid var(--gold);font-weight:700}}
.sidebar .sub{{color:#bfd3ea;font-size:.76rem;line-height:1.3;margin-top:30px}}
main{{max-width:1160px;margin-left:248px;padding:0 42px 80px}}.topbar{{display:flex;justify-content:flex-end;align-items:center;padding:18px 0;gap:9px}}button,.file-label{{border:1px solid var(--line);border-radius:7px;background:white;color:var(--blue);padding:7px 12px;font-weight:600}}button:hover,.file-label:hover{{background:var(--pale)}}
.cover{{min-height:790px;background:linear-gradient(145deg,#fff 60%,#eaf2fb);border:1px solid var(--line);border-top:9px solid var(--blue);display:flex;flex-direction:column;align-items:center;text-align:center;padding:68px 60px 44px;box-shadow:0 8px 32px #153c7010}}.cover img{{width:154px;height:154px;object-fit:contain}}.cover .university{{color:var(--blue);font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin:23px 0 4px}}.cover .course{{color:var(--muted);letter-spacing:.04em}}h1,h2,h3{{font-family:Georgia,"Times New Roman",serif;color:var(--blue);line-height:1.22}}h1{{font-size:clamp(2.4rem,5vw,4.5rem);margin:64px 0 12px;max-width:780px}}.cover .rule{{width:130px;height:4px;background:var(--gold);margin:18px auto 35px}}.cover .people{{margin-top:auto;display:grid;gap:3px}}.cover .place{{margin-top:40px;color:var(--muted)}}
.document-section{{background:white;border:1px solid var(--line);border-radius:10px;margin-top:27px;padding:34px 38px;overflow:hidden}}main > section[hidden]{{display:none!important}}.document-section>h2{{font-size:2rem;margin:0 0 25px;border-bottom:2px solid var(--gold);padding-bottom:13px}}h3{{font-size:1.34rem;margin:27px 0 8px}}p{{margin:10px 0 16px}}.toc{{columns:2;list-style:none;padding:0;counter-reset:items}}.toc li{{counter-increment:items;padding:10px 0;border-bottom:1px solid var(--line);break-inside:avoid}}.toc li::before{{content:counter(items,decimal-leading-zero);font-weight:700;color:var(--gold);margin-right:12px}}.toc a{{text-decoration:none;font-weight:600}}
table{{border-collapse:collapse;width:100%;font-size:.9rem}}th,td{{text-align:left;padding:10px 12px;vertical-align:top;border-bottom:1px solid var(--line)}}th{{background:var(--pale);color:var(--blue);font-weight:700}}tr:nth-child(even) td{{background:#fbfdff}}.document-section>table{{display:block;overflow-x:auto}}code{{font-size:.88em;background:#f0f4f8;padding:1px 3px;border-radius:3px;overflow-wrap:anywhere}}.model-blank .blank-area{{height:290px}}.status{{font-size:.85rem;color:var(--muted)}}
.diagram-toolbar,.controls{{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:20px 0}}#diagram-scroll{{overflow:auto;border:1px solid var(--line);background:white;min-height:340px;max-height:750px;padding:12px}}#diagram{{width:max-content;min-width:100%;transform:scale(var(--scale));transform-origin:top left}}#diagram svg{{max-width:none}}#print-diagrams{{display:none}}.table-scroll{{overflow:auto;max-height:640px;border:1px solid var(--line)}}#describe-table th{{position:sticky;top:0}}#describe-table td:first-child{{font-weight:650;color:var(--blue)}}.controls input{{border:1px solid var(--line);border-radius:6px;padding:7px 10px;min-width:230px}}.folder-box{{border:1px dashed var(--blue2);background:var(--pale);padding:22px;border-radius:9px;margin-top:25px}}#pdf-list{{padding-left:19px}}#pdf-preview{{width:100%;height:580px;border:1px solid var(--line);background:white}}
@media(max-width:900px){{.sidebar{{position:static;width:auto;padding:12px 18px;display:grid;grid-template-columns:42px 1fr;gap:8px 14px}}.sidebar img{{width:42px;height:42px}}.sidebar .brand{{margin:0}}.sidebar nav{{grid-column:1/-1;display:flex;overflow-x:auto;gap:4px}}.sidebar nav a{{white-space:nowrap;flex:none}}.sidebar .sub{{display:none}}main{{margin:0;padding:0 16px 50px}}.cover{{min-height:660px;padding:40px 18px}}.document-section{{padding:24px 19px}}.toc{{columns:1}}}}
@page{{size:A4;margin:17mm 15mm}}@media print{{body{{background:white;font-size:10pt;print-color-adjust:exact;-webkit-print-color-adjust:exact}}.sidebar,.topbar,.no-print{{display:none!important}}main{{margin:0;padding:0;max-width:none}}main > section[hidden]{{display:block!important}}main > .cover[hidden]{{display:flex!important}}.cover{{border:0;box-shadow:none;height:260mm;min-height:0;break-after:page;padding:30mm 10mm 10mm}}.cover img{{width:38mm;height:38mm}}h1{{font-size:31pt;margin-top:25mm}}.document-section{{border:0;border-radius:0;margin:0;padding:0 0 10mm;overflow:visible;break-before:page}}.document-section>h2{{font-size:18pt;margin:0 0 9mm}}h3{{font-size:13pt}}.toc{{columns:1}}table{{font-size:7.7pt;display:table!important}}th,td{{padding:4px 5px;break-inside:avoid}}tr{{break-inside:avoid}}.table-scroll{{max-height:none;overflow:visible;border:0}}#describe-table th{{position:static}}#diagram-scroll{{display:none}}#print-diagrams{{display:block}}.print-module{{break-inside:avoid;break-after:page}}.print-module:last-child{{break-after:auto}}.print-module h3{{font-size:12pt;margin:7mm 0}}.print-module svg{{display:block;width:100%!important;height:auto!important;max-width:100%;max-height:205mm}}.model-blank .blank-area{{height:175mm}}#diagram-status,#describe-status{{display:none}}}}
</style><script src="mermaid.min.js"></script></head><body>
<aside class="sidebar"><img src="logo-ufpi.webp" alt="Brasão da UFPI"><div class="brand">UFPI<br>Dossiê de pesquisa</div><nav aria-label="Seções do dossiê">{nav}</nav><p class="sub">Banco de Dados Relacionais<br>Teresina · 2026</p></aside>
<main><div class="topbar no-print"><button type="button" onclick="window.print()">Imprimir / salvar PDF</button></div>
<section id="capa" class="cover"><img src="logo-ufpi.webp" alt="Brasão da Universidade Federal do Piauí"><div class="university">Universidade Federal do Piauí</div><div class="course">Disciplina de Banco de Dados Relacionais</div><h1>Análise de Candidatos</h1><div class="rule"></div><p>Dossiê do projeto</p><div class="people"><strong>Professor</strong><span>Luiz Claudio Demes da Mata Sousa</span><br><strong>Discentes</strong><span>Eduardo Melo de Carvalho</span><span>Enrico da Rocha Santos Teixeira</span><span>Maria Eduarda Farias Gomes</span><span>Davi Sousa Soares</span></div><div class="place">Teresina · PI · 2026</div></section>
{''.join(body)}
</main><script>
const sections=[...document.querySelectorAll('main > section[id]')];
const navLinks=[...document.querySelectorAll('.sidebar nav a')];
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
const statusEl=document.getElementById('diagram-status');let zoom=1;
async function renderDiagram(code){{try{{if(!window.mermaid)throw Error('Biblioteca Mermaid indisponível');mermaid.initialize({{startOnLoad:false,securityLevel:'strict',theme:'base',themeVariables:{{primaryColor:'#e9f2fc',primaryTextColor:'#143e76',primaryBorderColor:'#315d99',lineColor:'#315d99'}}}});const out=await mermaid.render('ufpiDer',code);document.getElementById('diagram').innerHTML=out.svg;await renderPrintModules(code);statusEl.textContent='DER renderizado a partir de docs/dossie/der.mmd';}}catch(e){{statusEl.textContent='Não foi possível renderizar o DER: '+e.message;document.getElementById('diagram').textContent=code;}}}}
async function renderPrintModules(code){{const groups=[['Núcleo eleitoral',['UF','MUNICIPIO','POLITICO','ELEICAO','CARGO','PARTIDO','FEDERACAO','CANDIDATURA']],['Votação e comparecimento',['MUNICIPIO','ELEICAO','CARGO','PARTIDO','FEDERACAO','CANDIDATURA','VOTACAO_CANDIDATO_MUNICIPIO','VOTACAO_LEGENDA_MUNICIPIO','COMPARECIMENTO_MUNICIPIO','VAGA']],['Indicadores e perfis',['MUNICIPIO','MUNICIPIO_ANO','CENSO_INSTRUCAO','ELEITORADO_MUNICIPIO','COMPARECIMENTO_PERFIL']],['Finanças de campanha',['CANDIDATURA','AGENTE_FINANCEIRO','FONTE_RECURSO','RECEITA_CAMPANHA','TIPO_DESPESA','DESPESA_CAMPANHA']],['Propostas de governo',['CANDIDATURA','PROPOSTA_GOVERNO','TERMO_PROPOSTA']]];const blocks=[...code.matchAll(/^    ([A-Z_]+) \{{[\s\S]*?^    \}}/gm)];const edgeLines=code.split('\n').filter(line=>line.includes(':')&&!line.includes('"'));const container=document.getElementById('print-diagrams');container.replaceChildren();for(let i=0;i<groups.length;i++){{const [name,names]=groups[i],set=new Set(names);const edges=edgeLines.filter(line=>{{const p=line.trim().split(/\s+/);return set.has(p[0])&&set.has(p[2])}});const subset='erDiagram\n'+edges.join('\n')+'\n'+blocks.filter(m=>set.has(m[1])).map(m=>m[0]).join('\n');const out=await mermaid.render('ufpiModule'+i,subset);const section=document.createElement('section');section.className='print-module';const h=document.createElement('h3');h.textContent=name;section.append(h);const div=document.createElement('div');div.innerHTML=out.svg;section.append(div);container.append(section)}}}}
fetch('der.mmd').then(r=>{{if(!r.ok)throw Error('HTTP '+r.status);return r.text()}}).then(renderDiagram).catch(()=>{{statusEl.textContent='Abra a página por um servidor local ou selecione o arquivo der.mmd.'}});
document.getElementById('mermaid-picker').addEventListener('change',async e=>{{const f=e.target.files[0];if(f)await renderDiagram(await f.text())}});
function setZoom(z){{zoom=Math.max(.4,Math.min(2.5,z));document.documentElement.style.setProperty('--scale',zoom)}}
document.getElementById('zoom-in').onclick=()=>setZoom(zoom+.2);document.getElementById('zoom-out').onclick=()=>setZoom(zoom-.2);document.getElementById('zoom-reset').onclick=()=>setZoom(1);
function parseCsv(text){{return text.trim().split(/\r?\n/).slice(1).map(line=>line.split(','))}}
let schema=[];function drawSchema(){{const q=document.getElementById('describe-search').value.toLocaleLowerCase('pt-BR');const rows=schema.filter(r=>r.some(x=>x.toLocaleLowerCase('pt-BR').includes(q)));document.querySelector('#describe-table tbody').innerHTML=rows.map(r=>'<tr>'+r.map(x=>'<td>'+x.replaceAll('&','&amp;').replaceAll('<','&lt;')+'</td>').join('')+'</tr>').join('');document.getElementById('describe-count').textContent=rows.length+' de '+schema.length+' colunas';}}
fetch('describe-candidatos.csv').then(r=>{{if(!r.ok)throw Error('HTTP '+r.status);return r.text()}}).then(t=>{{schema=parseCsv(t);drawSchema();document.getElementById('describe-status').textContent='Resultado completo de DESCRIBE candidatos_raw.'}}).catch(()=>{{document.getElementById('describe-status').textContent='Sirva a pasta localmente para carregar o CSV do DuckDB.'}});
document.getElementById('describe-search').addEventListener('input',drawSchema);
let pdfUrl=null;document.getElementById('folder-picker').addEventListener('change',e=>{{const files=[...e.target.files].filter(f=>/\.pdf$/i.test(f.name)).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));const list=document.getElementById('pdf-list');list.replaceChildren();document.getElementById('folder-status').textContent=files.length+' PDF(s) encontrado(s) na pasta selecionada.';for(const f of files){{const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.textContent=f.webkitRelativePath||f.name;b.onclick=()=>{{if(pdfUrl)URL.revokeObjectURL(pdfUrl);pdfUrl=URL.createObjectURL(f);const frame=document.getElementById('pdf-preview');frame.src=pdfUrl;frame.hidden=false}};li.append(b);list.append(li)}}}});
</script></body></html>'''
    (DOSSIER / "index.html").write_text(html, encoding="utf-8")
    print(f"index.html gerado: {len(html)} caracteres, {len(items)} seções")


if __name__ == "__main__":
    build()
