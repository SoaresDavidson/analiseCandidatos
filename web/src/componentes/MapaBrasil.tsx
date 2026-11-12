import { memo, type ReactNode, useEffect, useMemo, useRef } from "react";
import { useDados } from "../lib/dados";
import { UF_NOME } from "../lib/uf";
import { useDica } from "./Dica";

// Mapa do Brasil por estado, com zoom: clicar num estado aproxima o mapa dele e, se a página
// passar a camada de municípios, pinta cada cidade. Os estados e os municípios usam o mesmo
// sistema de coordenadas (scripts/gerar_malhas_web.py), então o zoom é só mudar o viewBox.
// Com `pais`, o mapa do país já abre com as 5.570 cidades pintadas (malha leve, num arquivo só).
// Com `relevo`, o mapa ganha espessura e inclina de leve acompanhando o mouse.

export interface MalhaBrasil {
  w: number;
  h: number;
  ufs: Record<string, { d: string; bb: [number, number, number, number]; c: [number, number] }>;
}
export interface MalhaUf {
  uf: string;
  bb: [number, number, number, number];
  /** código IBGE -> [caminho, x do centro, y do centro] */
  p: Record<string, [string, number, number]>;
}

/** Os 5.570 municípios num arquivo só, com o traço mais simples: código IBGE -> caminho. */
interface MalhaPais {
  p: Record<string, string>;
}

export interface CamadaMunicipios {
  cor: (cod: number) => string;
  dica?: (cod: number) => ReactNode;
  sel: number | null;
  aoEscolher: (cod: number) => void;
}

/** As cidades do país inteiro. Fica fora do redesenho do mapa (memo): são milhares de caminhos. */
const CamadaPais = memo(function CamadaPais({ P, cores }: { P: MalhaPais; cores: ReadonlyMap<number, string> }) {
  return (
    <>
      {Object.entries(P.p).map(([cod, d]) => (
        <path key={cod} d={d} data-c={cod} fill={cores.get(+cod) ?? "var(--color-sem-dado)"} />
      ))}
    </>
  );
});

/** Quantas camadas formam a espessura do mapa em relevo. */
const CAMADAS = 7;

type Caixa = [x: number, y: number, w: number, h: number];
const semMovimento = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Caixa do estado com folga, na mesma proporção do mapa inteiro (o SVG não muda de tamanho). */
function caixaDoEstado(bb: readonly number[], W: number, H: number): Caixa {
  const folga = 0.08;
  let w = (bb[2] - bb[0]) * (1 + 2 * folga),
    h = (bb[3] - bb[1]) * (1 + 2 * folga);
  if (w / h < W / H) w = (h * W) / H;
  else h = (w * H) / W;
  return [(bb[0] + bb[2]) / 2 - w / 2, (bb[1] + bb[3]) / 2 - h / 2, w, h];
}

export function MapaBrasil({
  corUf,
  uf,
  aoEscolherUf,
  dicaUf,
  municipios,
  zoom = !!municipios,
  pais,
  relevo,
  rotulo = "Mapa do Brasil por estado",
}: {
  corUf: (uf: string) => string;
  /** estado em foco (com `zoom`, o mapa se aproxima dele) */
  uf: string | null;
  aoEscolherUf: (uf: string | null) => void;
  dicaUf?: (uf: string) => ReactNode;
  municipios?: CamadaMunicipios;
  zoom?: boolean;
  /** cor de cada cidade (código IBGE -> cor) para pintar todas já no mapa do país */
  pais?: ReadonlyMap<number, string>;
  /** espessura e inclinação com o mouse */
  relevo?: boolean;
  rotulo?: string;
}) {
  const { dados: B } = useDados<MalhaBrasil>("malhas/brasil.json");
  const { dados: M } = useDados<MalhaUf>(municipios && uf ? `malhas/${uf}.json` : null);
  const { dados: P } = useDados<MalhaPais>(pais ? "malhas/municipios.json" : null);
  const dica = useDica();
  const svg = useRef<SVGSVGElement>(null);
  const plano = useRef<HTMLDivElement>(null);
  const atual = useRef<Caixa | null>(null);

  const alvo = useMemo<Caixa | null>(() => {
    if (!B) return null;
    const e = zoom && uf ? B.ufs[uf] : null;
    return e ? caixaDoEstado(e.bb, B.w, B.h) : [0, 0, B.w, B.h];
  }, [B, uf, zoom]);

  // anima o viewBox do quadro atual até o alvo (o React não redesenha a cada quadro)
  useEffect(() => {
    const el = svg.current;
    if (!el || !alvo) return;
    const de = atual.current;
    const B_W = 1000;
    const pintar = (cx: Caixa) => {
      atual.current = cx;
      el.setAttribute("viewBox", cx.map(v => v.toFixed(2)).join(" "));
      // a espessura do relevo acompanha o zoom
      el.style.setProperty("--esp", (cx[2] / B_W).toFixed(4));
    };
    if (!de || semMovimento()) {
      pintar(alvo);
      return;
    }
    const t0 = performance.now();
    let quadro = 0;
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / 750);
      const s = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
      pintar(de.map((v, i) => v + (alvo[i] - v) * s) as Caixa);
      if (k < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo]);

  if (!B)
    return (
      <div className="grid aspect-[1000/996] place-items-center rounded-caixa bg-[#e9f0f3]">Carregando o mapa…</div>
    );

  const comZoom = zoom && !!uf;
  const cidades = M && M.uf === uf && municipios ? Object.entries(M.p) : null;
  const sel = cidades && municipios?.sel != null ? M?.p[municipios.sel] : null;
  // todas as cidades do país, enquanto nenhum estado está em foco
  const todas = pais && P && !comZoom;
  // o contorno que dá a espessura: o país inteiro, ou só o estado em foco
  const contorno = !relevo
    ? ""
    : comZoom && B.ufs[uf!]
      ? B.ufs[uf!].d
      : Object.values(B.ufs)
          .map(e => e.d)
          .join("");
  const codDe = (ev: React.MouseEvent) => {
    const c = (ev.target as Element).getAttribute?.("data-c");
    return c ? +c : null;
  };

  // o mapa inclina de leve para o lado do mouse (direto no estilo: sem redesenhar a cada movimento)
  const inclinar = (ev: React.MouseEvent<HTMLDivElement>) => {
    const el = plano.current;
    if (!el || !relevo || semMovimento()) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5,
      y = (ev.clientY - r.top) / r.height - 0.5;
    el.style.transitionDuration = "160ms";
    el.style.transform = `rotateX(${(15 - y * 9).toFixed(2)}deg) rotateY(${(x * 11).toFixed(2)}deg)`;
  };
  const soltar = () => {
    const el = plano.current;
    if (!el) return;
    el.style.transitionDuration = "900ms";
    el.style.transform = "";
  };

  return (
    <div
      className={relevo ? "relative [perspective:1500px]" : "relative"}
      onMouseMove={relevo ? inclinar : undefined}
      onMouseLeave={relevo ? soltar : undefined}
    >
      <div
        ref={plano}
        className={
          relevo
            ? "relative origin-[50%_60%] [transform:rotateX(15deg)] transition-transform ease-out will-change-transform"
            : "relative overflow-hidden rounded-caixa bg-[linear-gradient(180deg,#eef4f6_0%,#dfe9ed_100%)]"
        }
      >
        <svg
          ref={svg}
          viewBox={`0 0 ${B.w} ${B.h}`}
          role="img"
          aria-label={rotulo}
          className={`block h-auto max-h-[640px] w-full [&_path]:[vector-effect:non-scaling-stroke] ${relevo ? "overflow-visible" : ""}`}
        >
          {/* relevo: a sombra no chão e as camadas que dão a espessura, do fundo para cima */}
          {relevo && (
            <g className="pointer-events-none">
              <defs>
                <filter id="mapa-sombra" x="-20%" y="-20%" width="140%" height="150%">
                  <feGaussianBlur stdDeviation="9" />
                </filter>
              </defs>
              <path
                d={contorno}
                fill="#1b222b"
                opacity=".22"
                filter="url(#mapa-sombra)"
                style={{ transform: `translateY(calc(var(--esp, 1) * ${CAMADAS * 2.2 + 14}px))` }}
              />
              {Array.from({ length: CAMADAS }, (_, k) => CAMADAS - k).map(k => (
                <path
                  key={k}
                  d={contorno}
                  fill={`rgb(${58 + (CAMADAS - k) * 7} ${68 + (CAMADAS - k) * 7} ${76 + (CAMADAS - k) * 7})`}
                  style={{ transform: `translateY(calc(var(--esp, 1) * ${k * 2.2}px))` }}
                />
              ))}
            </g>
          )}
          {/* a sombra dá relevo ao país; fica só na camada dos estados, que é leve */}
          <g style={relevo ? undefined : { filter: "drop-shadow(0 5px 6px rgb(40 60 70 / .28))" }}>
            {Object.entries(B.ufs).map(([sg, e]) => {
              const foco = uf === sg;
              return (
                <path
                  key={sg}
                  d={e.d}
                  fill={corUf(sg)}
                  role="button"
                  tabIndex={0}
                  aria-label={UF_NOME[sg]}
                  aria-pressed={foco}
                  className={`cursor-pointer stroke-white outline-none transition-[opacity,filter] duration-300 hover:brightness-[.93] focus-visible:brightness-[.85] ${
                    comZoom && !foco ? (relevo ? "opacity-0" : "opacity-30") : ""
                  } ${foco && !cidades ? "stroke-texto stroke-[2.2]" : "stroke-[0.9]"}`}
                  onClick={() => aoEscolherUf(foco && !comZoom ? null : sg)}
                  onKeyDown={ev => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      aoEscolherUf(sg);
                    }
                  }}
                  onMouseMove={ev => dicaUf && (!comZoom || !foco) && dica.mostrar(ev, dicaUf(sg))}
                  onMouseLeave={dica.esconder}
                />
              );
            })}
          </g>
          {/* o país inteiro, cidade por cidade: um só ouvinte de mouse para todas */}
          {todas && municipios && (
            <g
              className="cursor-pointer [&>path]:stroke-white/55 [&>path]:stroke-[0.25] [&>path:hover]:stroke-texto [&>path:hover]:stroke-[1.6]"
              onClick={ev => {
                const cod = codDe(ev);
                if (cod != null) municipios.aoEscolher(cod);
              }}
              onMouseMove={ev => {
                const cod = codDe(ev);
                if (cod != null && municipios.dica) dica.mostrar(ev, municipios.dica(cod));
              }}
              onMouseLeave={dica.esconder}
            >
              <CamadaPais P={P} cores={pais} />
            </g>
          )}
          {/* as divisas dos estados por cima das cidades */}
          {todas &&
            Object.entries(B.ufs).map(([sg, e]) => (
              <path key={sg} d={e.d} fill="none" className="pointer-events-none stroke-white stroke-[1.1]" />
            ))}
          {/* o estado em foco por cima dos vizinhos quando não há municípios */}
          {uf && !cidades && B.ufs[uf] && (
            <path d={B.ufs[uf].d} fill="none" className="pointer-events-none stroke-texto stroke-[2.2]" />
          )}
          {cidades && municipios && (
            <g>
              {cidades.map(([cod, [d]]) => (
                <path
                  key={cod}
                  d={d}
                  fill={municipios.cor(+cod)}
                  className="cursor-pointer stroke-white stroke-[0.5] hover:brightness-[.9]"
                  onClick={() => municipios.aoEscolher(+cod)}
                  onMouseMove={ev => municipios.dica && dica.mostrar(ev, municipios.dica(+cod))}
                  onMouseLeave={dica.esconder}
                />
              ))}
              {sel && <path d={sel[0]} fill="none" className="pointer-events-none stroke-texto stroke-[2.6]" />}
            </g>
          )}
          {/* siglas só no mapa do país, nos estados em que cabem */}
          {!comZoom &&
            !todas &&
            Object.entries(B.ufs).map(([sg, e]) =>
              (e.bb[2] - e.bb[0]) * (e.bb[3] - e.bb[1]) > 1500 ? (
                <text
                  key={sg}
                  x={e.c[0]}
                  y={e.c[1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none fill-texto text-[17px] font-extrabold [paint-order:stroke] stroke-white/80 stroke-[3px]"
                >
                  {sg}
                </text>
              ) : null,
            )}
        </svg>
        {comZoom && (
          <button
            type="button"
            onClick={() => aoEscolherUf(null)}
            className="absolute top-3 left-3 cursor-pointer rounded-full border-0 bg-branco px-3.5 py-1.5 text-[13px] font-bold shadow-dica hover:bg-ouro-claro"
          >
            ← Brasil
          </button>
        )}
        {comZoom && municipios && !cidades && (
          <span className="absolute right-3 bottom-3 rounded-full bg-branco/90 px-3 py-1 text-[12.5px] font-bold">
            Carregando as cidades…
          </span>
        )}
      </div>
    </div>
  );
}
