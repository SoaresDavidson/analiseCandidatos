import { fmt, pc } from "../../lib/formato";
import { grupos, N_MIN } from "./estatistica";
import type { Grupo } from "./tipos";

const W = 640,
  L = 46,
  R = 14,
  T = 12,
  HH = 220,
  H = T + HH + 28;

/** Diferença entre os grupos para cada corte, de 5% em 5%. */
export function GraficoSensibilidade({ r, corte }: { r: Grupo[]; corte: number }) {
  const pts: [number, number][] = [];
  for (let k = 5; k <= 100; k += 5) {
    const g = grupos(r, k);
    if (g.pub.n >= N_MIN && g.out.n >= N_MIN) pts.push([k, pc(g.pub.e, g.pub.n)! - pc(g.out.e, g.out.n)!]);
  }
  const aria = "Diferença na chance de se eleger para cada corte";
  if (!pts.length) {
    return (
      <svg className="grafico max-w-[760px]" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        <text x={W / 2} y={H / 2} textAnchor="middle" dominantBaseline="middle" className="svg-eixo">
          poucos candidatos para comparar
        </text>
      </svg>
    );
  }
  const m = Math.max(5, ...pts.map(p => Math.abs(p[1]))),
    lim = m <= 10 ? 10 : m <= 20 ? 20 : m <= 30 ? 30 : 50;
  const x = (k: number) => L + ((W - L - R) * (k - 5)) / 95;
  const y = (v: number) => T + HH / 2 - ((HH / 2) * v) / lim;
  const niveis = [-lim, -lim / 2, 0, lim / 2, lim];
  let d = "",
    prev: number | null = null;
  for (const [k, v] of pts) {
    d += (prev != null && k - prev === 5 ? "L" : "M") + x(k).toFixed(1) + "," + y(v).toFixed(1);
    prev = k;
  }
  const cur = pts.find(p => p[0] === corte);
  return (
    <svg className="grafico max-w-[760px]" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
      {niveis.map(v => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="svg-grade" />
          <text x={L - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" className="svg-eixo">
            {(v > 0 ? "+" : "") + fmt(v, 0)}
          </text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} className="stroke-texto-2" strokeWidth={1.2} />
      {[5, 25, 50, 75, 100].map(k => (
        <text key={k} x={x(k)} y={H - 8} textAnchor="middle" dominantBaseline="middle" className="svg-eixo">
          {k}%
        </text>
      ))}
      <path d={d} fill="none" className="stroke-verde-esc" strokeWidth={2.5} strokeLinejoin="round" />
      <line
        x1={x(corte)}
        x2={x(corte)}
        y1={T}
        y2={T + HH}
        className="stroke-ouro-esc"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      {cur && <circle cx={x(cur[0])} cy={y(cur[1])} r={6} className="fill-ouro stroke-white" strokeWidth={2} />}
    </svg>
  );
}
