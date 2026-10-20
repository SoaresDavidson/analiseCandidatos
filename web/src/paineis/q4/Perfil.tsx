import { useMemo } from "react";
import { Legenda, VerMais } from "../../componentes";
import { fmt, pc } from "../../lib/formato";
import { perfil } from "./calculo";
import { Texto } from "./comum";
import { COR_NIVEL, NIVEL, type DadosQ4, type Filtros } from "./tipos";

const LEGENDA = [1, 2, 3, 4].map(n => ({ cor: COR_NIVEL(n), rotulo: NIVEL[n] }));
const W = 900, L = 170, BH = 34, GAP = 14, H = 3 * BH + 2 * GAP + 26;
const x = (v: number) => L + (W - L - 10) * (v / 100);

/** Bloco "Ver o perfil completo": três barras 100% empilhadas (população, candidatos, eleitos). */
export function Perfil({ D, f, ufs }: { D: DadosQ4; f: Filtros; ufs: string[] }) {
  const q = useMemo(() => perfil(D.perfil, f.ano, ufs), [D, f.ano, ufs]);
  const tot = q.map(r => r.reduce((a, b) => a + b));
  const rotulos = ["População adulta", `Candidatos ${f.ano}`, `Eleitos ${f.ano}`];

  return (
    <VerMais titulo="Ver o perfil completo: população, candidatos e eleitos">
      <Legenda itens={LEGENDA} />
      <svg className="grafico" role="img" aria-label="Distribuição da escolaridade da população, dos candidatos e dos eleitos" viewBox={`0 0 ${W} ${H}`}>
        {[0, 25, 50, 75, 100].map(t => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={0} y2={H - 22} className="svg-grade" />
            <Texto x={x(t)} y={H - 8} cls="svg-eixo" anchor="middle">{t}%</Texto>
          </g>
        ))}
        {rotulos.map((rot, g) => {
          const y = g * (BH + GAP);
          let acc = 0;
          return (
            <g key={g}>
              <Texto x={0} y={y + BH / 2}>{rot}</Texto>
              {[1, 2, 3, 4].map(n => {
                const w = pc(q[g][n - 1], tot[g]) || 0;
                const ini = acc;
                acc += w;
                return (
                  <g key={n}>
                    <rect x={x(ini) + 1} y={y} width={Math.max(0, x(ini + w) - x(ini) - 2)} height={BH} rx={3} fill={COR_NIVEL(n)} />
                    {w >= 6 && <Texto x={x(ini + w / 2)} y={y + BH / 2} cls="fill-white text-[12.5px] font-bold" anchor="middle">{fmt(w, 0)}%</Texto>}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <p className="texto-nota">Cada barra soma 100%. Os níveis são os do Censo; cada um inclui quem começou a etapa seguinte sem terminar (por exemplo, "médio completo" inclui faculdade incompleta).</p>
    </VerMais>
  );
}
