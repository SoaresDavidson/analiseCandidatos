import { fmt } from "../../lib/formato";
import { afastar } from "./calculo";

const W = 560,
  H = 132,
  X0 = 26,
  X1 = 534,
  EIXO = 70,
  DE = 25,
  ATE = 65;
const X = (v: number) => X0 + ((X1 - X0) * (Math.max(DE, Math.min(ATE, v)) - DE)) / (ATE - DE);
export const COR_ELEITORES = "#5e7a12",
  COR_CANDIDATOS = "#d99a00";

export interface Marca {
  rotulo: string;
  valor: number | null;
}

/** A régua das idades do lugar escolhido: os dois rostos (eleitores e candidatos) como bolas
 *  grandes ligadas por uma barra, e as outras idades como marcas pequenas com o nome em cima. */
export function Regua({
  eleitores,
  candidatos,
  outras,
}: {
  eleitores: number | null;
  candidatos: number | null;
  outras: Marca[];
}) {
  const marcas = outras.filter((m): m is { rotulo: string; valor: number } => m.valor != null);
  // os nomes não se encostam: cada um ocupa uns 118 px
  const xs = afastar(
    marcas.map(m => X(m.valor)),
    118,
    X0 + 50,
    X1 - 50,
  );
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Régua de idades: eleitores ${fmt(eleitores)} anos, candidatos ${fmt(candidatos)} anos${marcas.map(m => `, ${m.rotulo} ${fmt(m.valor)} anos`).join("")}.`}
      className="block h-auto w-full"
    >
      <line x1={X0} x2={X1} y1={EIXO} y2={EIXO} stroke="#d9d5cb" strokeWidth="6" strokeLinecap="round" />
      {[30, 40, 50, 60].map(v => (
        <g key={v}>
          <line x1={X(v)} x2={X(v)} y1={EIXO - 7} y2={EIXO + 7} stroke="#fff" strokeWidth="2" />
          <text x={X(v)} y={EIXO + 28} textAnchor="middle" className="fill-texto-2 text-[13px] font-bold">
            {v}
          </text>
        </g>
      ))}
      <text x={X1} y={EIXO + 46} textAnchor="end" className="fill-texto-2 text-[12px]">
        idade média, em anos
      </text>

      {/* as outras idades: marca pequena, nome em cima, com um fio até o lugar exato */}
      {marcas.map((m, k) => (
        <g key={m.rotulo}>
          <path
            d={`M${X(m.valor)},${EIXO - 9} L${X(m.valor)},${EIXO - 18} L${xs[k]},${EIXO - 30}`}
            fill="none"
            stroke="#9aa3ad"
            strokeWidth="1.5"
          />
          <circle cx={X(m.valor)} cy={EIXO} r="5" fill="#7d8791" stroke="#fff" strokeWidth="1.5" />
          <text x={xs[k]} y={EIXO - 50} textAnchor="middle" className="fill-texto-2 text-[12.5px] font-bold">
            {m.rotulo}
          </text>
          <text x={xs[k]} y={EIXO - 35} textAnchor="middle" className="fill-texto text-[14px] font-extrabold">
            {fmt(m.valor)}
          </text>
        </g>
      ))}

      {/* eleitores e candidatos: a distância entre os dois é a resposta */}
      {eleitores != null && candidatos != null && (
        <line
          x1={X(eleitores)}
          x2={X(candidatos)}
          y1={EIXO}
          y2={EIXO}
          stroke="#1b222b"
          strokeWidth="6"
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      )}
      {(
        [
          [eleitores, COR_ELEITORES],
          [candidatos, COR_CANDIDATOS],
        ] as const
      ).map(([v, cor]) =>
        v == null ? null : (
          <circle
            key={cor}
            cy={EIXO}
            r="11"
            fill={cor}
            stroke="#fff"
            strokeWidth="3"
            className="transition-all duration-700"
            style={{ cx: X(v) }}
          />
        ),
      )}
    </svg>
  );
}
