import { useDica } from "../../componentes";
import { fmt, int } from "../../lib/formato";
import { CARGO, cargosDoAno, comparar, faixas } from "./estatistica";
import type { Comparacao, DadosQ8 } from "./tipos";

const W = 900, L = 170, R = 230, T = 30, LH = 34, GAP = 22;

interface Item { a: number; c: number; k: Comparacao; y: number; cab: number | null }

/** Calcula as linhas do gráfico (uma por cargo e eleição), as posições verticais e a contagem do resumo. */
export function calcularHalteres(D: DadosQ8, us: number[]) {
  const itens: Item[] = [];
  let y = T, ultimo: number | null = null;
  for (const a of [2024, 2022, 2020, 2018]) {
    for (const c of cargosDoAno(a)) {
      let cab: number | null = null;
      if (a !== ultimo) { if (ultimo !== null) y += GAP; ultimo = a; cab = y; y += 22; }
      itens.push({ a, c, k: comparar(faixas(D, a, c, us), 50), y, cab });
      y += LH;
    }
  }
  let menos = 0, mais = 0, igual = 0;
  for (const { k } of itens) { if (k.real) { if (k.dif! < 0) menos++; else mais++; } else if (k.ok) igual++; }
  const H = y + 24;
  const mx = Math.min(100, Math.max(25, ...itens.flatMap(l => [l.k.tp || 0, l.k.to || 0])) * 1.1);
  return { itens, menos, mais, igual, H, mx };
}
export type Halteres = ReturnType<typeof calcularHalteres>;

export function GraficoHalteres({ calc, ano, cargo, aoEscolher }: {
  calc: Halteres; ano: number; cargo: number; aoEscolher: (a: number, c: number) => void;
}) {
  const { mostrar, esconder } = useDica();
  const { itens, H, mx } = calc;
  const X = (v: number) => L + (W - L - R) * v / mx;
  const passo = mx > 60 ? 20 : mx > 30 ? 10 : 5;
  const marcas: number[] = [];
  for (let v = 0; v <= mx; v += passo) marcas.push(v);

  return (
    <svg className="grafico min-w-[640px]" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Chance de se eleger de quem depende do fundo público e de quem não depende, por cargo e eleição">
      {marcas.map(v => (
        <g key={v}>
          <line x1={X(v)} x2={X(v)} y1={T} y2={H - 22} className="svg-grade" />
          <text x={X(v)} y={H - 8} textAnchor="middle" dominantBaseline="middle" className="svg-eixo">{v} em 100</text>
        </g>
      ))}
      {itens.map(({ a, c, k, y, cab }) => {
        const yy = y + LH / 2, atual = a === ano && c === cargo;
        const zero = k.dif != null && Math.round(Math.abs(k.dif)) === 0;
        const rot = !k.ok ? "poucos candidatos"
          : `${zero ? "" : k.dif! > 0 ? "+" : "−"}${fmt(Math.abs(k.dif!), 0)} ${zero ? "ponto" : "pontos"} · ${k.real ? (k.dif! < 0 ? "menos chance" : "mais chance") : "sem diferença real"}`;
        return (
          <g key={`${a}-${c}`}>
            {cab != null && (
              <text x={0} y={cab + 8} dominantBaseline="middle" className="svg-rotulo font-extrabold">
                {a} · {a % 4 === 0 ? "eleição municipal" : "eleição estadual e federal"}
              </text>
            )}
            <g
              className="group cursor-pointer outline-none focus-visible:[&_rect]:stroke-ouro focus-visible:[&_rect]:stroke-[3]"
              opacity={k.real ? 1 : 0.4}
              role="button"
              tabIndex={0}
              aria-label={`${CARGO[c]} ${a}: ver no alto da página`}
              onMouseMove={ev => mostrar(ev, (
                <>
                  <b>{CARGO[c]} · {a}</b><br />
                  Dependem do fundo: {fmt(k.tp, 0)} em 100 ({int(k.g.pub.e)} de {int(k.g.pub.n)})<br />
                  Outras fontes: {fmt(k.to, 0)} em 100 ({int(k.g.out.e)} de {int(k.g.out.n)})
                </>
              ))}
              onMouseLeave={esconder}
              onClick={() => aoEscolher(a, c)}
              onKeyDown={ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); aoEscolher(a, c); } }}
            >
              <rect x={0} y={y} width={W} height={LH} rx={6} className={atual ? "fill-ouro-claro" : "fill-transparent group-hover:fill-ouro-claro"} />
              <text x={12} y={yy} dominantBaseline="middle" className="svg-rotulo">{CARGO[c]}</text>
              {k.tp == null || k.to == null ? (
                <text x={L} y={yy} dominantBaseline="middle" className="svg-eixo">sem candidatos suficientes</text>
              ) : (
                <>
                  <line x1={X(k.tp)} x2={X(k.to)} y1={yy} y2={yy} className="stroke-texto-2" strokeWidth={3} />
                  <circle cx={X(k.to)} cy={yy} r={8} className="fill-verde-esc stroke-white" strokeWidth={2} />
                  <circle cx={X(k.tp)} cy={yy} r={8} className="fill-ouro stroke-white" strokeWidth={2} />
                  <text x={W - R + 14} y={yy} dominantBaseline="middle" className={`svg-rotulo ${k.real ? "font-bold" : ""}`}>{rot}</text>
                </>
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
