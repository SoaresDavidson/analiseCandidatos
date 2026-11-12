import { type CSSProperties, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useDica } from "../../componentes";
import { fmt, int, pc } from "../../lib/formato";
import { reais } from "./dominio";
import { Efeitos } from "./Efeitos";
import { type Posicionada, posicionar, TELA_ESTREITA, TELA_LARGA } from "./layoutNuvem";
import { decifrar } from "./movimento";
import "./nuvem.css";
import { FOLGA, FONTE_TERMINAL, PAPEIS, sorte, type Tema } from "./temas";
import type { Palavra } from "./tipos";

/** Quantas palavras viram cartaz de passeata na cena "rua". */
const CARTAZES = 6;

/** Nuvem de palavras em SVG, vestida com a cena do tipo de gasto; clicar (ou Enter/Espaço) numa palavra a seleciona. */
export function Nuvem({
  palavras,
  total,
  termo,
  aoEscolher,
  tema,
  recorte,
}: {
  palavras: Palavra[];
  total: number;
  termo: number | null;
  aoEscolher: (t: number) => void;
  tema: Tema;
  /** identifica o filtro atual: quando muda, as palavras entram de novo */
  recorte: string;
}) {
  const dica = useDica();
  const palco = useRef<HTMLDivElement>(null);
  const grupo = useRef<SVGGElement>(null);

  // a fonte web muda a largura do texto: refaz a posição quando terminar de carregar
  const [fontes, setFontes] = useState(0);
  useEffect(() => {
    let vivo = true;
    document.fonts?.ready.then(() => {
      if (vivo) setFontes(n => n + 1);
    });
    return () => {
      vivo = false;
    };
  }, []);

  // no celular a nuvem é mais quadrada, para as letras não ficarem miúdas
  const [estreita, setEstreita] = useState(false);
  useEffect(() => {
    const el = palco.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(([e]) => setEstreita(e.contentRect.width < 620));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const tela = estreita ? TELA_ESTREITA : TELA_LARGA;

  const familia = tema === "internet" ? FONTE_TERMINAL : undefined;
  const itens = useMemo(
    () =>
      posicionar(palavras, familia ?? getComputedStyle(document.body).fontFamily, tela, i =>
        tema === "rua" && i >= CARTAZES ? FOLGA.todos : FOLGA[tema],
      ),
    // `fontes` só serve para refazer o cálculo quando a fonte web chega
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [palavras, fontes, tela, tema],
  );
  // na passeata as palavras chegam da esquerda para a direita
  const ordem = useMemo(() => {
    const m = new Map<number, number>();
    itens
      .slice()
      .sort((a, b) => a.x - b.x)
      .forEach((it, k) => m.set(it.w.t, k));
    return m;
  }, [itens]);

  // internet: as letras chegam embaralhadas e vão se decifrando
  useEffect(() => {
    if (tema !== "internet" || !grupo.current) return;
    return decifrar([...grupo.current.querySelectorAll("text")]);
    // só na entrada da cena (o <g> é remontado por estas chaves), não quando a fonte web chega
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema, recorte, tela.w]);

  return (
    <div ref={palco} className="nuvem-palco" data-tema={tema}>
      <Efeitos key={`fundo-${tema}`} tema={tema} camada="fundo" />
      <svg
        viewBox={`0 0 ${tela.w} ${tela.h}`}
        role="img"
        aria-label="Nuvem de palavras das descrições de despesa de propaganda"
      >
        <g ref={grupo} key={`${tema}|${recorte}|${tela.w}`}>
          {itens.map(it => (
            <PalavraSvg
              key={it.w.t}
              it={it}
              tema={tema}
              familia={familia}
              ordem={ordem.get(it.w.t) ?? 0}
              sel={termo === it.w.t}
              aoEscolher={aoEscolher}
              aoMover={ev =>
                dica.mostrar(
                  ev,
                  <>
                    <b>{it.w.termo}</b>
                    <br />
                    {int(it.w.n)} despesas ({fmt(pc(it.w.n, total), 0)}%)
                    <br />
                    {reais(it.w.vr)} no total
                  </>,
                )
              }
              aoSair={dica.esconder}
            />
          ))}
        </g>
      </svg>
      <Efeitos key={`frente-${tema}`} tema={tema} camada="frente" />
    </div>
  );
}

function PalavraSvg({
  it,
  tema,
  familia,
  ordem,
  sel,
  aoEscolher,
  aoMover,
  aoSair,
}: {
  it: Posicionada;
  tema: Tema;
  familia: string | undefined;
  ordem: number;
  sel: boolean;
  aoEscolher: (t: number) => void;
  aoMover: (ev: MouseEvent) => void;
  aoSair: () => void;
}) {
  const { w, i, x, y, fs, peso, lw, lh } = it;
  const adesivo = tema === "adesivos";
  const cartaz = tema === "rua" && i < CARTAZES;
  // adesivo torto: quanto mais comprido, menos gira (para não invadir o vizinho)
  const torto = adesivo ? (sorte(w.t, 1) - 0.5) * 2 * Math.min(6, 700 / lw) : 0;
  const cabo = cartaz ? fs * 0.34 : 0;
  const estilo = {
    "--i": i,
    "--ordem": ordem,
    "--dx": `${-(250 + sorte(w.t, 2) * 550)}px`,
    "--dy": `${(sorte(w.t, 3) - 0.5) * 320}px`,
    "--giro": `${(sorte(w.t, 4) - 0.5) * 200}deg`,
  } as CSSProperties;

  return (
    <g transform={`translate(${x} ${y})${torto ? ` rotate(${torto.toFixed(2)})` : ""}`}>
      {/* biome-ignore lint/a11y/useSemanticElements: dentro de SVG não existe <button> */}
      <g
        className="nuvem-palavra"
        data-topo={i < 8 ? "" : undefined}
        data-sel={sel ? "" : undefined}
        data-cartaz={cartaz ? "" : undefined}
        style={estilo}
        role="button"
        aria-label={w.termo}
        tabIndex={0}
        aria-pressed={sel}
        onMouseMove={aoMover}
        onMouseLeave={aoSair}
        onClick={() => aoEscolher(w.t)}
        onKeyDown={ev => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            aoEscolher(w.t);
          }
        }}
      >
        {adesivo && (
          <>
            <rect className="nuvem-sombra" x={-lw / 2 + 4.5} y={-lh / 2 + 5.5} width={lw - 6} height={lh - 6} rx={3} />
            <rect
              className="nuvem-papel"
              x={-lw / 2 + 3}
              y={-lh / 2 + 3}
              width={lw - 6}
              height={lh - 6}
              rx={sorte(w.t, 5) > 0.6 ? (lh - 6) / 2 : 3}
              fill={PAPEIS[Math.floor(sorte(w.t, 6) * PAPEIS.length)]}
            />
            {sorte(w.t, 5) <= 0.6 && sorte(w.t, 7) > 0.45 && (
              <rect
                className="nuvem-fita"
                x={-fs * 0.5}
                y={-lh / 2 - fs * 0.06}
                width={fs}
                height={fs * 0.3}
                transform={`rotate(${((sorte(w.t, 8) - 0.5) * 14).toFixed(1)})`}
              />
            )}
          </>
        )}
        {cartaz && (
          <>
            <line className="nuvem-cabo" x1={0} y1={lh / 2 - cabo - 2} x2={0} y2={lh / 2 - 3} />
            <rect
              className="nuvem-cartaz"
              x={-lw / 2 + 3}
              y={-lh / 2 + 3}
              width={lw - 6}
              height={lh - cabo - 6}
              rx={3}
            />
          </>
        )}
        <text
          y={fs * 0.05 - cabo / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fs}
          fontWeight={peso}
          style={familia ? { fontFamily: familia } : undefined}
        >
          {w.termo}
        </text>
      </g>
    </g>
  );
}
