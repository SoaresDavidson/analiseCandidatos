import { type ReactNode, useMemo } from "react";
import { useDica } from "../../componentes";
import { CORES_ESPECTRO, CORTES, corEspectro, nomeCategoria } from "../../lib/espectro";
import { fmt, int } from "../../lib/formato";
import type { Municipio, Regua } from "./tipos";

type Ancora = "start" | "middle" | "end";

/** Texto de SVG centrado na vertical. */
function T({
  x,
  y,
  anchor = "start",
  cls = "svg-rotulo",
  children,
}: {
  x: number;
  y: number;
  anchor?: Ancora;
  cls?: string;
  children: ReactNode;
}) {
  return (
    <text x={x} y={y} className={cls} textAnchor={anchor} dominantBaseline="middle">
      {children}
    </text>
  );
}

/** As 7 faixas do espectro, bem clarinhas, atrás da régua. */
function Faixas({ X, y0, y1 }: { X: (v: number) => number; y0: number; y1: number }) {
  const lim = [0, ...CORTES, 10];
  return (
    <>
      {CORES_ESPECTRO.map((cor, i) => {
        const a = X(lim[i]),
          b = X(lim[i + 1]);
        return (
          <rect
            key={i}
            x={a}
            y={y0}
            width={Math.max(0, b - a)}
            height={y1 - y0}
            fill={cor}
            opacity={i === 3 ? 0.5 : 0.16}
          />
        );
      })}
    </>
  );
}

// ---------- distribuição: quantas cidades em cada quarto de ponto ----------
const W = 900,
  H = 230,
  L = 40,
  RR = 20,
  TOP = 16,
  B = 46,
  PASSO = 0.25;

export function Distribuicao({ comVoto, regua }: { comVoto: Municipio[]; regua: Regua }) {
  const dica = useDica();
  const { bins, mx } = useMemo(() => {
    const bins = Array.from({ length: 40 }, () => 0);
    comVoto.forEach(m => {
      bins[Math.min(39, Math.floor((m.voto ?? 0) / PASSO))]++;
    });
    return { bins, mx: Math.max(...bins) };
  }, [comVoto]);
  const X = (v: number) => L + ((W - L - RR) * v) / 10;
  const Y = (n: number) => TOP + (H - TOP - B) * (1 - n / mx);
  const { esq, dir, meio } = regua;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Quantas cidades em cada ponto da régua" className="grafico">
      <Faixas X={X} y0={TOP} y1={H - B} />
      {bins.map((n, i) => {
        if (!n) return null;
        const v = i * PASSO;
        return (
          <rect
            key={i}
            x={X(v) + 1}
            y={Y(n)}
            width={X(PASSO) - X(0) - 2}
            height={H - B - Y(n)}
            fill={corEspectro(v + PASSO / 2)}
            rx={2}
            onMouseMove={ev =>
              dica.mostrar(
                ev,
                <>
                  <b>{int(n)} cidades</b>
                  <br />
                  nota de {fmt(v, 2)} a {fmt(v + PASSO, 2)} · {nomeCategoria(v + PASSO / 2)}
                </>,
              )
            }
            onMouseLeave={dica.esconder}
          />
        );
      })}
      {Array.from({ length: 11 }, (_, v) => (
        <T key={v} x={X(v)} y={H - B + 12} anchor="middle" cls="svg-eixo">
          {v}
        </T>
      ))}
      <line x1={X(meio)} x2={X(meio)} y1={TOP - 6} y2={H - B} className="stroke-texto" strokeDasharray="4 3" />
      <T x={X(meio) + 6} y={TOP} cls="svg-eixo">
        meio da régua ({fmt(meio, 2)})
      </T>
      {(
        [
          [esq, "mais à esquerda com eleitos"],
          [dir, "mais à direita com eleitos"],
        ] as const
      ).map(([[sg, v], rot], i) => (
        <g key={sg}>
          <line x1={X(v)} x2={X(v)} y1={H - B} y2={H - B + 22} className="stroke-texto-2" />
          <T x={X(v)} y={H - 8} anchor={i ? "end" : "start"} cls="svg-eixo">
            {sg} ({fmt(v, 2)}): {rot}
          </T>
        </g>
      ))}
    </svg>
  );
}

// ---------- régua de uma cidade ----------
type Forma = "circle" | "diamond" | "square" | "ring";

export function ReguaCidade({ m, regua }: { m: Municipio; regua: Regua }) {
  const { esq, dir, meio } = regua;
  const marcas = useMemo(
    () =>
      (
        [
          ["voto para vereador 2024", m.voto, "circle", 9],
          ["câmara eleita", m.camara, "diamond", 7],
          [`prefeito (${m.sgPref || "–"})`, m.vlPref, "square", 7],
          ["voto dep. federal 2022", m.voto22, "ring", 7],
        ] as [string, number | null, Forma, number][]
      )
        .filter((x): x is [string, number, Forma, number] => x[1] != null)
        .sort((a, b) => a[1] - b[1]),
    [m],
  );
  // cada marca ganha a sua linha acima da barra: os rótulos nunca se sobrepõem
  const W = 900,
    L = 20,
    RR = 20,
    LIN = 17,
    y0 = 18 + marcas.length * LIN,
    y1 = y0 + 30,
    H = y1 + 46;
  const X = (v: number) => L + ((W - L - RR) * v) / 10;
  const y = (y0 + y1) / 2;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Régua do espectro com a posição da cidade"
      className="grafico"
    >
      <Faixas X={X} y0={y0} y1={y1} />
      {Array.from({ length: 11 }, (_, v) => (
        <T key={v} x={X(v)} y={y1 + 12} anchor="middle" cls="svg-eixo">
          {v}
        </T>
      ))}
      <line x1={X(meio)} x2={X(meio)} y1={y0 - 6} y2={y1 + 4} className="stroke-texto" strokeDasharray="4 3" />
      <T x={X(esq[1])} y={y1 + 32} cls="svg-eixo">
        ◂ {esq[0]} {fmt(esq[1], 2)}
      </T>
      <T x={X(dir[1])} y={y1 + 32} anchor="end" cls="svg-eixo">
        {dir[0]} {fmt(dir[1], 2)} ▸
      </T>
      <T x={X(meio)} y={y1 + 32} anchor="middle" cls="svg-eixo">
        meio {fmt(meio, 2)}
      </T>
      {marcas.map(([rot, v, forma, r], i) => {
        const x = X(v),
          cor = corEspectro(v),
          ty = 12 + i * LIN,
          direita = x > W * 0.7;
        return (
          <g key={rot}>
            <line x1={x} x2={x} y1={ty + 6} y2={y - r} className="stroke-texto-2" strokeWidth={1} />
            {/* o texto fica à direita da marca; perto da borda direita, à esquerda */}
            <T
              x={direita ? x - 6 : x + 6}
              y={ty}
              anchor={direita ? "end" : "start"}
              cls={`svg-rotulo ${forma === "circle" ? "font-extrabold" : "font-semibold"}`}
            >
              {rot}: {fmt(v, 2)}
            </T>
            {forma === "circle" && <circle cx={x} cy={y} r={r} fill={cor} stroke="#fff" strokeWidth={2.5} />}
            {forma === "ring" && <circle cx={x} cy={y} r={r} fill="#fff" stroke={cor} strokeWidth={3} />}
            {forma === "square" && (
              <rect x={x - r} y={y - r} width={2 * r} height={2 * r} fill={cor} stroke="#fff" strokeWidth={2} />
            )}
            {forma === "diamond" && (
              <path
                d={`M${x},${y - r - 2}L${x + r + 2},${y}L${x},${y + r + 2}L${x - r - 2},${y}Z`}
                fill={cor}
                stroke="#fff"
                strokeWidth={2}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
