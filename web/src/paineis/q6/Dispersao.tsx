import { memo, useMemo } from "react";
import { Alternador, Caixa, Campo, Cor, useDica } from "../../componentes";
import { fmt, int, maiusculaInicial } from "../../lib/formato";
import { noEstado } from "../../lib/uf";
import {
  doFiltro,
  forcaCorrelacao,
  limiteEixo,
  type PontoDisp,
  pontosDispersao,
  TERCO,
  TERCO_COR,
  tercoDe,
  votoGrupo,
} from "./calculo";
import type { Corte, Ctx, Faixa, Municipio } from "./tipos";

interface Props extends Ctx {
  aoMudarFaixa(faixa: Faixa): void;
  /** Escolhe a cidade, leva o mapa ao estado dela e rola até ele. */
  aoSelecionar(m: Municipio): void;
}

const W = 760,
  H = 430,
  L = 54,
  RR = 20,
  T = 14,
  B = 46;

/** Seção 4: cada cidade, parcela do eleitorado na faixa × parcela dos votos para candidatos da faixa. */
export function Dispersao({ M, f, aoMudarFaixa, aoSelecionar }: Props) {
  const jov = f.faixa === "jovem";
  const xs = useMemo(() => doFiltro(M, f.uf), [M, f.uf]);
  const { pontos, semCand, r } = useMemo(() => pontosDispersao(xs, f.ano, f.faixa), [xs, f.ano, f.faixa]);
  const vg = votoGrupo(xs, f.ano);
  const onde = maiusculaInicial(noEstado(f.uf));
  const forca = forcaCorrelacao(r);
  const faixa = jov ? "jovens (16 a 29 anos)" : "de 60 anos ou mais";
  const cand = jov ? "jovens (18 a 29)" : "de 60 anos ou mais";
  const sufixo = f.corte === "uf" ? " do estado" : "";

  return (
    <Caixa>
      <h2>{jov ? `Jovem vota em jovem? Vereador, ${f.ano}` : `Velho vota em velho? Vereador, ${f.ano}`}</h2>
      <div className="flex flex-wrap items-end gap-x-[18px] gap-y-2.5">
        <Campo rotulo="Faixa de idade" grupo>
          <Alternador<Faixa>
            rotulo="Faixa de idade"
            valor={f.faixa}
            aoMudar={aoMudarFaixa}
            opcoes={[
              ["jovem", "Jovens"],
              ["idoso", "60 anos ou mais"],
            ]}
          />
        </Campo>
      </div>
      <p className="texto-simples text-[15.5px]!">
        {jov ? (
          <>
            <b>Não.</b> {onde}, os jovens são {fmt(vg.aj)}% do eleitorado, mas só {fmt(vg.vj)}% dos votos para vereador
            foram para candidatos jovens. Ter mais jovens na cidade não aumenta o voto em jovem: a correlação é de{" "}
            {fmt(r, 2)} ({forca}).
            {semCand > 0 &&
              ` Em ${int(semCand)} cidades não havia nenhum candidato jovem: elas ficam fora do gráfico, e na conta dos votos contam como 0%.`}
          </>
        ) : (
          <>
            <b>Um pouco.</b> {onde}, quem tem 60 anos ou mais é {fmt(vg.ai)}% do eleitorado e recebeu {fmt(vg.vi)}% dos
            votos para vereador. Onde há mais idosos, o candidato idoso recebe mais votos: a correlação é de {fmt(r, 2)}{" "}
            ({forca}).
            {semCand > 0 &&
              ` Em ${int(semCand)} cidades não havia nenhum candidato de 60 anos ou mais: elas ficam fora do gráfico.`}
          </>
        )}
      </p>
      <Grafico pontos={pontos} corte={f.corte} sel={f.sel} faixa={faixa} cand={cand} aoSelecionar={aoSelecionar} />
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-texto-2">
        {TERCO.map((t, i) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <Cor cor={TERCO_COR[i]} redonda />
            {t}
            {sufixo}
          </span>
        ))}
        <span>ponto maior = capital</span>
      </div>
      <p className="texto-nota">
        Cada ponto é uma cidade, na eleição para vereador. O voto é secreto: não dá para saber em quem o jovem votou. O
        gráfico compara quantos jovens (ou idosos) a cidade tem com quantos votos foram para candidatos jovens (ou
        idosos). Se cada faixa votasse só nos seus, os pontos ficariam sobre a linha tracejada.
      </p>
    </Caixa>
  );
}

/** O gráfico em si: os ~1.200 pontos só são refeitos quando os dados, a seleção ou o corte mudam. */
const Grafico = memo(function Grafico({
  pontos,
  corte,
  sel,
  faixa,
  cand,
  aoSelecionar,
}: {
  pontos: PontoDisp[];
  corte: Corte;
  sel: number | null;
  faixa: string;
  cand: string;
  aoSelecionar(m: Municipio): void;
}) {
  const dica = useDica();
  const mx = limiteEixo(pontos);
  const { X, Y } = useMemo(
    () => ({
      X: (v: number) => L + ((W - L - RR) * v) / mx,
      Y: (v: number) => T + (H - T - B) * (1 - v / mx),
    }),
    [mx],
  );
  const marcas = Array.from({ length: mx / 5 + 1 }, (_, i) => i * 5);
  const ang = (-Math.atan2(Y(0) - Y(mx), X(mx) - X(0)) * 180) / Math.PI;
  const lx = X(mx * 0.62),
    ly = Y(mx * 0.62) - 12;
  const cy = (T + H - B) / 2;

  const circulos = useMemo(
    () =>
      pontos.map(p => {
        const t = tercoDe(p.m, corte);
        return (
          <circle
            key={p.m.cod}
            cx={X(p.x)}
            cy={Y(p.y)}
            r={p.m.cap ? 6 : 3.5}
            fill={TERCO_COR[(t || 2) - 1]}
            fillOpacity={0.75}
            stroke={p.m.cod === sel ? "var(--color-texto)" : "none"}
            strokeWidth={2}
            className="cursor-pointer"
            onMouseMove={ev =>
              dica.mostrar(
                ev,
                <>
                  <b>{p.m.nome}</b> ({p.m.uf})
                  <br />
                  eleitores {faixa}: {fmt(p.x)}%
                  <br />
                  votos em candidatos {cand}: {fmt(p.y)}%
                </>,
              )
            }
            onMouseLeave={dica.esconder}
            onClick={() => aoSelecionar(p.m)}
          />
        );
      }),
    [pontos, corte, sel, faixa, cand, dica, aoSelecionar, X, Y],
  );

  return (
    <svg
      className="grafico max-h-[520px]"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Cada cidade: parcela do eleitorado na faixa × parcela dos votos para candidatos da faixa"
    >
      {marcas.map(v => (
        <g key={v}>
          <line x1={L} x2={W - RR} y1={Y(v)} y2={Y(v)} className="svg-grade" />
          <text x={L - 8} y={Y(v)} className="svg-eixo" textAnchor="end" dominantBaseline="middle">
            {v}%
          </text>
          <text x={X(v)} y={H - B + 14} className="svg-eixo" textAnchor="middle" dominantBaseline="middle">
            {v}%
          </text>
        </g>
      ))}
      <line x1={X(0)} y1={Y(0)} x2={X(mx)} y2={Y(mx)} className="stroke-texto-2" strokeDasharray="5 4" />
      <text
        x={lx}
        y={ly}
        className="svg-eixo"
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(${ang} ${lx} ${ly})`}
      >
        votariam na proporção do eleitorado
      </text>
      <text x={(L + W - RR) / 2} y={H - 10} className="svg-rotulo" textAnchor="middle" dominantBaseline="middle">
        Eleitores {faixa} na cidade
      </text>
      <text
        x={14}
        y={cy}
        className="svg-rotulo"
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(-90 14 ${cy})`}
      >
        Votos para candidatos {cand}
      </text>
      {circulos}
    </svg>
  );
});
