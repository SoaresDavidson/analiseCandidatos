import { useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { SECTIONS } from './sections';
import Markdown from './Markdown';
import DictionarySection from './DictionarySection';
import DiagramViewer from './DiagramViewer';
import LeiameBrowser from './LeiameBrowser';

const EXTRAS: Partial<Record<string, ComponentType>> = { der: DiagramViewer, fontes: LeiameBrowser };
const PAGE_IDS = ['capa', 'sumario', ...SECTIONS.map((section) => section.id)];
const NAV_ITEMS = [{ id: 'capa', title: 'Capa' }, { id: 'sumario', title: 'Sumário' }, ...SECTIONS];

// Na tela aparece só a seção do hash; na impressão, todas.
const SECTION_CLASS = 'mt-7 overflow-hidden rounded-[10px] border border-line bg-white px-[38px] py-[34px] max-[900px]:px-5 max-[900px]:py-6 print:m-0 print:block print:break-before-page print:overflow-visible print:rounded-none print:border-0 print:p-0 print:pb-[10mm]';
const TITLE_CLASS = 'mb-6 border-b-2 border-gold pb-3 text-[2rem] print:mb-[9mm] print:text-[18pt]';

function currentPage() {
  const id = decodeURIComponent(location.hash.slice(1));
  return PAGE_IDS.includes(id) ? id : PAGE_IDS[0];
}

function Section({ id, page, title, children }: { id: string; page: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={`${SECTION_CLASS} ${page === id ? 'block' : 'hidden'}`}>
      <h2 className={TITLE_CLASS}>{title}</h2>
      {children}
    </section>
  );
}

export default function App() {
  const [page, setPage] = useState(currentPage);

  useEffect(() => {
    const onHashChange = () => {
      setPage(currentPage());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-3.5 bg-ufpi px-6 py-[9px] text-white max-[900px]:gap-2 max-[900px]:px-3 max-[900px]:py-2 print:hidden">
        <img className="size-[38px] flex-none object-contain" src="logo-ufpi.webp" alt="Brasão da UFPI" />
        <div className="flex-none font-serif text-[.95rem] font-bold whitespace-nowrap">UFPI · Dossiê de pesquisa</div>
        <nav className="flex flex-1 gap-1 overflow-x-auto [scrollbar-width:thin]" aria-label="Seções do dossiê">
          {NAV_ITEMS.map(({ id, title }) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={page === id ? 'location' : undefined}
              className="flex-none rounded-md px-3 py-2 text-[.85rem] whitespace-nowrap text-[#e8f1fc] hover:bg-white/15 focus:bg-white/15 aria-[current=location]:bg-white aria-[current=location]:font-bold aria-[current=location]:text-ufpi"
            >
              {title}
            </a>
          ))}
        </nav>
        <span className="flex-none text-[.74rem] whitespace-nowrap text-[#bfd3ea] max-[900px]:hidden">Banco de Dados Relacionais · Teresina · 2026</span>
      </header>
      <main className="mx-auto max-w-[1160px] px-[42px] pb-20 max-[900px]:px-4 max-[900px]:pb-12 print:m-0 print:max-w-none print:p-0">
        <div className="flex items-center justify-end gap-2 py-[18px] print:hidden">
          <button type="button" className="btn" onClick={() => window.print()}>Imprimir / salvar PDF</button>
        </div>
        <section
          id="capa"
          className={`${page === 'capa' ? 'flex' : 'hidden'} min-h-[790px] flex-col items-center border border-t-[9px] border-line border-t-ufpi bg-linear-145 from-white from-60% to-[#eaf2fb] px-[60px] pt-[68px] pb-11 text-center shadow-[0_8px_32px_#153c7010] max-[900px]:min-h-[660px] max-[900px]:px-[18px] max-[900px]:py-10 print:flex print:h-[260mm] print:min-h-0 print:break-after-page print:border-0 print:px-[10mm] print:py-[30mm] print:shadow-none`}
        >
          <img className="size-[154px] object-contain print:size-[38mm]" src="logo-ufpi.webp" alt="Brasão da Universidade Federal do Piauí" />
          <div className="mt-6 mb-1 font-extrabold tracking-[.12em] text-ufpi uppercase">Universidade Federal do Piauí</div>
          <div className="tracking-[.04em] text-muted">Disciplina de Banco de Dados Relacionais</div>
          <h1 className="mt-16 mb-3 max-w-[780px] text-[clamp(2.4rem,5vw,4.5rem)] print:mt-[25mm] print:text-[31pt]">Análise de Candidatos</h1>
          <div className="mx-auto mt-[18px] mb-[35px] h-1 w-[130px] bg-gold" />
          <p className="mt-2.5 mb-4">Dossiê do projeto</p>
          <div className="mt-auto grid gap-[3px]">
            <strong>Professor</strong>
            <span>Luiz Claudio Demes da Mata Sousa</span>
            <br />
            <strong>Discentes</strong>
            <span>Eduardo Melo de Carvalho</span>
            <span>Enrico da Rocha Santos Teixeira</span>
            <span>Maria Eduarda Farias Gomes</span>
            <span>Davi Sousa Soares</span>
          </div>
          <div className="mt-10 text-muted">Teresina · PI · 2026</div>
        </section>
        <Section id="sumario" page={page} title="Sumário">
          <ol className="columns-2 max-[900px]:columns-1 print:columns-1">
            {SECTIONS.map(({ id, title }) => (
              <li key={id} className="break-inside-avoid border-b border-line py-2.5">
                <a className="font-semibold text-ufpi" href={`#${id}`}>{title}</a>
              </li>
            ))}
          </ol>
        </Section>
        {SECTIONS.map(({ id, title, body }) => {
          const Extra = EXTRAS[id];
          return (
            <Section key={id} id={id} page={page} title={title}>
              {id === 'dicionario' ? <DictionarySection body={body} /> : <Markdown>{body}</Markdown>}
              {Extra && <Extra />}
            </Section>
          );
        })}
      </main>
    </>
  );
}
