import { Caixa, Legenda, useDica } from "../../componentes";
import { fmt, int } from "../../lib/formato";
import { doEstado } from "../../lib/uf";
import { afastar, grupos, idadesPorGrupo, SERIES_IDADE, TERCO } from "./calculo";
import type { Filtros, Municipio } from "./tipos";

const W = 900,
  H = 430,
  L = 150,
  R = 236,
  T = 26,
  B = 70;
const X = (i: number) => L + (i * (W - L - R)) / 2;

/** O gráfico de idade: três grupos de cidades (das mais jovens às mais velhas) e quatro linhas,
 *  quem mora, quem vota e quem foi eleito. A de quem mora sobe; as dos eleitos quase não saem do lugar. */
export function Idades({ escopo, f }: { escopo: Municipio[]; f: Filtros }) {
  const dica = useDica();
  const g = grupos(escopo, !!f.uf);
  const vals = idadesPorGrupo(g);
  const todos = vals.flat().filter((v): v is number => v != null);
  if (todos.length < 2 || g.some(x => !x.length)) return null;

  const lo = Math.floor((Math.min(...todos) - 1.5) / 5) * 5,
    hi = Math.ceil((Math.max(...todos) + 1.5) / 5) * 5;
  const Y = (v: number) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const marcas = Array.from({ length: (hi - lo) / 5 + 1 }, (_, k) => lo + 5 * k);

  // rótulos de cada coluna, afastados para não ficarem um em cima do outro
  const rotulos = [0, 1, 2].map(i => {
    const com = SERIES_IDADE.map((_, k) => k).filter(k => vals[i][k] != null);
    const ys = afastar(
      com.map(k => Y(vals[i][k] as number)),
      17,
      T + 6,
      H - B - 4,
    );
    return com.map((k, j) => ({ k, y: ys[j] }));
  });

  const sobe = (k: number) => (vals[0][k] != null && vals[2][k] != null ? vals[2][k] - vals[0][k] : null);
  const mora = sobe(0),
    ver = sobe(2);
  const onde = f.uf ? doEstado(f.uf) : "do Brasil";

  return (
    <Caixa>
      <h2>
        {mora != null && ver != null && mora > 2 * Math.abs(ver)
          ? "A cidade envelhece; os eleitos, quase nada"
          : "A idade de quem mora, de quem vota e de quem é eleito"}
      </h2>
      <p className="texto-nota m-0">
        As cidades {onde} em três grupos do mesmo tamanho, das mais jovens às mais velhas. Idade média, em anos.
      </p>
      <Legenda redonda itens={SERIES_IDADE.map(s => ({ cor: s.cor, rotulo: s.nome }))} />
      <svg
        className="grafico"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Idade média de quem mora, de quem vota e dos eleitos em três grupos de cidades"
      >
        {marcas.map(v => (
          <g key={v}>
            <line x1={44} x2={W - R + 18} y1={Y(v)} y2={Y(v)} className="svg-grade" />
            <text x={36} y={Y(v)} textAnchor="end" dominantBaseline="middle" className="svg-eixo text-[13px]">
              {v}
            </text>
          </g>
        ))}
        {TERCO.map((nome, i) => (
          <g key={nome}>
            <line x1={X(i)} x2={X(i)} y1={T} y2={H - B + 6} className="stroke-linha" strokeDasharray="3 4" />
            <text x={X(i)} y={H - B + 26} textAnchor="middle" className="fill-texto text-[15px] font-extrabold">
              {nome}
            </text>
            <text x={X(i)} y={H - B + 46} textAnchor="middle" className="svg-eixo text-[13px]">
              {int(g[i].length)} cidades
            </text>
          </g>
        ))}

        {SERIES_IDADE.map((s, k) => {
          const pts = [0, 1, 2].filter(i => vals[i][k] != null);
          return (
            <g key={s.nome}>
              <polyline
                points={pts.map(i => `${X(i)},${Y(vals[i][k] as number)}`).join(" ")}
                fill="none"
                stroke={s.cor}
                strokeWidth={k === 0 ? 5 : 3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pts.map(i => (
                <circle
                  key={i}
                  cx={X(i)}
                  cy={Y(vals[i][k] as number)}
                  r={8}
                  fill={s.cor}
                  stroke="#fff"
                  strokeWidth={2.5}
                  onMouseMove={ev =>
                    dica.mostrar(
                      ev,
                      <>
                        <b>{TERCO[i]}</b>
                        <br />
                        {s.nome}: <b>{fmt(vals[i][k])} anos</b>
                      </>,
                    )
                  }
                  onMouseLeave={dica.esconder}
                />
              ))}
            </g>
          );
        })}

        {/* os números: à esquerda do ponto nas duas primeiras colunas; na última, à direita, com o nome */}
        {rotulos.map((col, i) =>
          col.map(({ k, y }) => (
            <text
              key={`${i}-${k}`}
              x={i < 2 ? X(i) - 15 : X(i) + 16}
              y={y}
              textAnchor={i < 2 ? "end" : "start"}
              dominantBaseline="middle"
              className="fill-texto text-[15px] font-extrabold [paint-order:stroke] stroke-white stroke-[4px] tabular-nums"
            >
              {fmt(vals[i][k])}
              {i === 2 && (
                <tspan className="text-[13.5px] font-semibold" dx="7">
                  {SERIES_IDADE[k].curto}
                </tspan>
              )}
            </text>
          )),
        )}
      </svg>
      {mora != null && ver != null && (
        <p className="texto-simples m-0 text-[16px]!">
          Das cidades mais jovens para as mais velhas, quem mora fica <b>{fmt(mora)} anos</b> mais velho. Os vereadores
          eleitos, só <b>{fmt(ver)}</b>.
        </p>
      )}
      <p className="texto-nota m-0">
        Cada cidade conta uma vez. Fontes: IBGE, Censo 2022 (quem mora); TSE, 2024 (eleitores e eleitos).
      </p>
    </Caixa>
  );
}
