import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Carregando, ProvedorDica } from "./componentes";
import { Inicio } from "./inicio/Inicio";
import { type Navegacao, NavegacaoContexto } from "./lib/navegacao";
import { irPara, useHash } from "./lib/useHash";
import { useRecolheAoRolar } from "./lib/useRecolheAoRolar";
import { ESCONDIDAS, FichaEleito, PAGINAS, type PaginaComTema, TEMAS } from "./paineis/registro";

// Navegação por tema: poucas abas no topo; dentro de cada tema, as perguntas viram
// botões (como "PRESIDENTE | GOVERNADOR | ..." no site do TSE). Cada pergunta é um painel.

const ORDEM = ["inicio", ...PAGINAS.map(p => p.id)];

/** #cidades abre a 1ª página do tema; #q7 abre a pergunta; o resto é o início. */
function resolver(id: string): PaginaComTema | null {
  const tema = TEMAS.find(t => t.id === id);
  return tema ? { ...tema.paginas[0], tema } : (PAGINAS.find(p => p.id === id) ?? null);
}

// o segredo: código Konami (↑↑↓↓←→←→BA) ou 5 cliques no logo em 3 s abrem a Arena
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const digitando = (e: KeyboardEvent) => e.target instanceof Element && !!e.target.closest("input, select, textarea");

export default function App() {
  const [id, extra] = useHash();
  const pagina = resolver(id);
  const escondida = pagina ? null : (ESCONDIDAS.find(x => x.id === id) ?? null);
  const [recolhido, aoRolar] = useRecolheAoRolar(pagina?.id ?? escondida?.id ?? "inicio");
  const [ficha, setFicha] = useState<{ ano: number; sq: number } | null>(null);
  const [aviso, setAviso] = useState(false);

  const progresso = useRef(0);
  const cliques = useRef<number[]>([]);
  // quem tinha o foco antes da ficha abrir: volta para ele ao fechar
  const focoAntes = useRef<HTMLElement | null>(null);

  const fecharFicha = useCallback(() => {
    setFicha(null);
    focoAntes.current?.focus();
  }, []);

  const desbloquear = useCallback(() => {
    setAviso(true);
    setTimeout(() => setAviso(false), 1800);
    setTimeout(() => irPara("arena"), 500);
  }, []);

  /** Avança o código Konami; true enquanto ele está no meio (as setas não trocam de página). */
  const konami = useCallback(
    (tecla: string) => {
      const k = tecla.length === 1 ? tecla.toLowerCase() : tecla;
      progresso.current = k === KONAMI[progresso.current] ? progresso.current + 1 : k === KONAMI[0] ? 1 : 0;
      if (progresso.current === KONAMI.length) {
        progresso.current = 0;
        desbloquear();
        return true;
      }
      return progresso.current > 4;
    },
    [desbloquear],
  );

  const cliqueNoLogo = () => {
    const t = Date.now();
    cliques.current = cliques.current.filter(x => t - x < 3000).concat(t);
    if (cliques.current.length >= 5) {
      cliques.current = [];
      desbloquear();
    }
  };

  const passo = useCallback(
    (d: number) => {
      const i = ORDEM.indexOf(pagina ? pagina.id : "inicio");
      irPara(ORDEM[(Math.max(0, i) + d + ORDEM.length) % ORDEM.length]);
    },
    [pagina],
  );

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      // com a ficha aberta, só o Esc vale (fecha mesmo se o foco saiu do diálogo)
      if (ficha) {
        if (e.key === "Escape") fecharFicha();
        return;
      }
      if (digitando(e)) return;
      if (konami(e.key)) return;
      if (e.key === "ArrowRight") passo(1);
      if (e.key === "ArrowLeft") passo(-1);
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [passo, ficha, konami, fecharFicha]);

  const nav = useMemo<Navegacao>(
    () => ({
      abrirCandidato: (ano, sq) => {
        if (document.activeElement instanceof HTMLElement) focoAntes.current = document.activeElement;
        setFicha({ ano, sq });
      },
      abrirMunicipio: cod => {
        setFicha(null);
        irPara(`municipios/${cod}`);
      },
      abrirEstado: uf => {
        setFicha(null);
        irPara(`municipios/${uf}`);
      },
    }),
    [],
  );

  const telaCheia = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else
      document.documentElement.requestFullscreen().catch(() => {
        /* o navegador não deixa */
      });
  };

  const temaAtual = pagina ? pagina.tema.id : escondida ? null : "inicio";
  const BOTAO_FAIXA =
    "cursor-pointer border-0 bg-transparent px-1 py-0.5 text-[12.5px] font-bold text-white hover:underline";

  return (
    <NavegacaoContexto.Provider value={nav}>
      <ProvedorDica>
        <div className="flex h-full flex-col">
          {/* faixa, abas e perguntas do tema: recolhem ao rolar a página para baixo e voltam ao
              rolar para cima; a barra de filtros do painel (sticky dentro do main) continua */}
          <div
            inert={recolhido}
            className={`grid flex-none transition-[grid-template-rows] duration-300 ease-out ${recolhido ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="flex flex-none flex-wrap items-center justify-end gap-3 bg-ouro px-5 pt-[calc(4px+env(safe-area-inset-top,0px))] pb-1 text-[12.5px] font-bold text-white motion-safe:animate-desce">
                <span>Banco de Dados Relacionais · UFPI</span>
                <span aria-hidden="true">|</span>
                <span>Davi, Duda, Eduardo e Enrico</span>
                {/* a aba do jogo, na faixa ao lado dos nomes do grupo */}
                <a
                  href="#arena"
                  aria-current={escondida?.id === "arena" ? "page" : undefined}
                  className="rounded-full bg-white px-[11px] py-0.5 font-extrabold text-texto no-underline hover:bg-verde-esc hover:text-white aria-[current=page]:bg-verde-esc aria-[current=page]:text-white"
                >
                  ⚔ Arena
                </a>
                <span aria-hidden="true">|</span>
                <button type="button" className={BOTAO_FAIXA} aria-label="Pergunta anterior" onClick={() => passo(-1)}>
                  ‹ anterior
                </button>
                <button type="button" className={BOTAO_FAIXA} aria-label="Próxima pergunta" onClick={() => passo(1)}>
                  próxima ›
                </button>
                <button type="button" className={BOTAO_FAIXA} onClick={telaCheia}>
                  Tela cheia
                </button>
              </div>

              <header className="relative z-[2] flex-none bg-branco shadow-[0_2px_8px_rgb(0_0_0/.06)] motion-safe:animate-desce motion-safe:[animation-delay:.08s]">
                <div className="mx-auto flex min-h-[62px] max-w-pagina flex-wrap items-center gap-x-7 gap-y-2.5 px-5">
                  <a className="grid leading-none no-underline" href="#inicio" onClick={cliqueNoLogo}>
                    <b className="text-[11.5px] font-extrabold tracking-[.02em]">ELEIÇÕES</b>
                    <span className="text-[21px] font-extrabold text-ouro">POLITICAGEM</span>
                    <small className="mt-0.5 text-[9px] font-bold text-texto-2">AM · GO · MA · MT · RS · SE</small>
                  </a>
                  <nav className="ml-auto flex flex-wrap gap-x-6 gap-y-1" aria-label="Temas">
                    {[{ id: "inicio", nome: "Início" }, ...TEMAS].map(a => (
                      <a
                        key={a.id}
                        href={`#${a.id}`}
                        aria-current={a.id === temaAtual ? "page" : undefined}
                        className="border-b-4 border-transparent pt-[19px] pb-[15px] text-[14.5px] font-semibold no-underline hover:border-ouro-borda aria-[current=page]:border-ouro"
                      >
                        {a.nome}
                      </a>
                    ))}
                  </nav>
                </div>
              </header>

              {pagina && (
                <nav className="flex-none border-t border-linha bg-branco" aria-label="Perguntas do tema">
                  <div className="mx-auto flex max-w-pagina flex-wrap gap-2 px-5 py-2">
                    {pagina.tema.paginas.map(q => (
                      <a
                        key={q.id}
                        href={`#${q.id}`}
                        aria-current={q.id === pagina.id ? "page" : undefined}
                        className="group inline-flex items-center gap-2 rounded-md border-2 border-verde-esc px-3.5 py-[5px] text-[13.5px] font-bold text-verde-esc no-underline hover:bg-verde-claro motion-safe:animate-sobe aria-[current=page]:bg-verde-esc aria-[current=page]:text-white"
                      >
                        {q.n && (
                          <small className="rounded bg-verde-esc px-1.5 text-[11.5px] text-white group-aria-[current=page]:bg-white group-aria-[current=page]:text-verde-esc">
                            {q.n}
                          </small>
                        )}
                        {q.nome}
                      </a>
                    ))}
                  </div>
                </nav>
              )}
            </div>
          </div>

          {/* a chave reinicia a rolagem e a animação de entrada a cada página */}
          <main
            key={pagina?.id ?? escondida?.id ?? "inicio"}
            onScroll={aoRolar}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            {pagina || escondida ? (
              <Suspense fallback={<Carregando />}>
                {pagina ? <pagina.Componente extra={extra} /> : escondida && <escondida.Componente extra={extra} />}
              </Suspense>
            ) : (
              <Inicio />
            )}
          </main>
        </div>

        {aviso && (
          <div
            role="status"
            className="fixed top-[40%] left-1/2 z-[60] flex -translate-1/2 items-center gap-3 rounded-2xl bg-[#1b222b] px-[30px] py-[18px] text-[26px] font-extrabold text-[#ffd86b] shadow-[0_0_0_4px_#ffd86b,0_20px_60px_rgb(0_0_0/.5)] animate-segredo"
          >
            <span aria-hidden="true" className="text-[38px]">
              ⚡
            </span>
            Arena desbloqueada!
          </div>
        )}

        {/* a ficha de um eleito abre por cima da página atual; ao fechar, a página continua onde estava */}
        {ficha && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/40"
            role="dialog"
            aria-modal="true"
            aria-label="Ficha do eleito"
          >
            <Suspense fallback={<Carregando />}>
              <FichaEleito key={`${ficha.ano}-${ficha.sq}`} ano={ficha.ano} sq={ficha.sq} aoFechar={fecharFicha} />
            </Suspense>
          </div>
        )}
      </ProvedorDica>
    </NavegacaoContexto.Provider>
  );
}
