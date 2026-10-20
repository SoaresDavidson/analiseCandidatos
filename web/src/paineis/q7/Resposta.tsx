import { Aneis, Anel, Caixa, Legenda, Linha, useDica } from "../../componentes";
import { int, pc } from "../../lib/formato";
import type { Ctx } from "./tipos";
import {
  CAT_COR,
  CATS,
  degraus,
  escalas,
  f2,
  maiusculaInicial,
  mudanca,
  ondeUf,
  PARES,
  pontos,
  sinal,
  UF_NOME,
} from "./util";

/** Seção 1: a resposta em linguagem simples, os números e os dois anéis. */
export function Resposta({ D, M, R, f }: Ctx) {
  const [a, b, cargo, aa, ab] = PARES[f.par],
    med = D.media[f.uf],
    mf = med[1],
    mr = med[0];
  const ms = M.filter(m => (f.uf === "TODAS" || m.uf === f.uf) && mudanca(m, f) != null);
  const d = (x: Ctx["M"][number] | Ctx["R"][number]) => mudanca(x, f)!;
  const dir = ms.filter(m => d(m) > 0).length;
  const forte = ms.filter(m => d(m) > 0.25).length,
    esq = ms.filter(m => d(m) < -0.25).length;
  const rs = R.filter(r => (f.uf === "TODAS" || r.uf === f.uf) && mudanca(r, f) != null);
  const rdir = rs.filter(r => d(r) > 0).length;
  const dFixa = mf[b]! - mf[a]!,
    dRod = mr[b]! - mr[a]!;
  return (
    <>
      <Caixa>
        <h2>A resposta</h2>
        <p className="texto-simples">
          {dFixa > 0 ? "Foram para a direita." : "Foram para a esquerda."} {maiusculaInicial(ondeUf(f.uf))}, o voto para{" "}
          {cargo} foi de <b>{f2(mf[a])}</b> em {aa} para <b>{f2(mf[b])}</b> em {ab} na escala de 0 a 10, com a mesma
          régua nos dois anos: só o eleitor mudou. <b>{f2(pc(dir, ms.length), 0)}%</b> das cidades votaram mais à
          direita.{" "}
          {Math.abs(dRod - dFixa) >= 0.03
            ? `Com a régua de cada ano a mudança é de ${sinal(dRod)}: ${sinal(dRod - dFixa)} ponto vem de os especialistas terem reavaliado os partidos.`
            : "Com a régua de cada ano o resultado é quase o mesmo."}
        </p>
        <div>
          <Linha rotulo="Cidades que votaram mais à direita" valor={`${int(dir)} de ${int(ms.length)}`} />
          <Linha rotulo="Mais de 0,25 ponto à direita" valor={`${int(forte)} (${f2(pc(forte, ms.length), 0)}%)`} />
          <Linha rotulo="Mais de 0,25 ponto à esquerda" valor={`${int(esq)} (${f2(pc(esq, ms.length), 0)}%)`} />
        </div>
      </Caixa>
      <div className="grid min-w-0 gap-3.5">
        <Aneis>
          <Anel pct={pc(dir, ms.length)} legenda="das cidades" nome="votaram mais à direita" />
          <Anel variante="verde" pct={pc(rdir, rs.length)} legenda={`de ${rs.length} regiões`} nome="foram à direita" />
        </Aneis>
        <Tempo D={D} uf={f.uf} />
      </div>
    </>
  );
}

const W = 640,
  H = 270,
  L = 46,
  RR = 100,
  T = 16,
  B = 42;
const SERIES = [
  { k: 0, cor: "var(--color-ouro)", rot: "régua de cada ano", traco: "6 4" },
  { k: 1, cor: "var(--color-verde-esc)", rot: "só o eleitor (régua de 2018)", traco: undefined },
] as const;
// faixas das categorias do artigo, ao fundo: [de, até, categoria]
const FAIXAS: [number, number, number][] = [
  [5.5, 7, 4],
  [7, 8.5, 5],
  [4.49, 5.5, 3],
];

/** Seção 2: nota média dos votos de 2018 a 2024, pelas duas réguas. */
function Tempo({ D, uf }: { D: Ctx["D"]; uf: string }) {
  const dica = useDica();
  const med = D.media[uf];
  const vals = [...med[0], ...med[1]].filter((v): v is number => v != null);
  const lo = Math.floor((Math.min(...vals) - 0.3) * 2) / 2,
    hi = Math.ceil((Math.max(...vals) + 0.3) * 2) / 2;
  const { X, Y } = escalas(W, H, L, RR, T, B, lo, hi);
  return (
    <Caixa>
      <h2>Para que lado votou {uf === "TODAS" ? "o conjunto dos 6 estados" : UF_NOME[uf]}, eleição a eleição?</h2>
      <svg className="grafico" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Nota média dos votos de 2018 a 2024">
        {FAIXAS.map(([x0, x1, c]) => {
          const y0 = Y(Math.min(hi, x1)),
            y1 = Y(Math.max(lo, x0));
          if (y1 <= y0) return null;
          return (
            <g key={c}>
              <rect x={L} y={y0} width={W - L - RR} height={y1 - y0} fill={CAT_COR[c]} opacity={0.1} />
              <text x={W - RR + 6} y={(y0 + y1) / 2} className="svg-eixo" dominantBaseline="middle">
                {CATS[c]}
              </text>
            </g>
          );
        })}
        {degraus(lo, hi).map(v => (
          <g key={v}>
            <line x1={L} x2={W - RR} y1={Y(v)} y2={Y(v)} className="svg-grade" />
            <text x={L - 6} y={Y(v)} className="svg-eixo" textAnchor="end" dominantBaseline="middle">
              {f2(v, 1)}
            </text>
          </g>
        ))}
        {D.anos.map((a, i) => (
          <g key={a}>
            <text x={X(i)} y={H - B + 14} className="svg-eixo" textAnchor="middle" dominantBaseline="middle">
              {a}
            </text>
            <text x={X(i)} y={H - B + 28} className="svg-eixo" textAnchor="middle" dominantBaseline="middle">
              {i % 2 ? "vereador" : "dep. federal"}
            </text>
          </g>
        ))}
        {SERIES.map(({ k, cor, rot, traco }) => {
          const pts = pontos(med[k], X, Y);
          return (
            <g key={k}>
              <polyline
                points={pts.map(p => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke={cor}
                strokeWidth={2.5}
                strokeDasharray={traco}
              />
              {pts.map(p => (
                <circle
                  key={p.i}
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill={cor}
                  stroke="#fff"
                  strokeWidth={2}
                  onMouseMove={ev =>
                    dica.mostrar(
                      ev,
                      <>
                        <b>{D.anos[p.i]}</b> · {rot}
                        <br />
                        nota {f2(p.v)}
                      </>,
                    )
                  }
                  onMouseLeave={dica.esconder}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <Legenda
        itens={[
          { cor: "var(--color-verde-esc)", rotulo: "só o eleitor (régua de 2018)" },
          { cor: "var(--color-ouro)", rotulo: "régua de cada ano" },
        ]}
      />
      <p className="texto-nota">
        Compare só pontos do mesmo cargo: 2018 com 2022 (deputado federal) e 2020 com 2024 (vereador). Média pesada
        pelos votos.
      </p>
    </Caixa>
  );
}
