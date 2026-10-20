import { Aneis, Anel, Caixa, Legenda, Linha, useDica } from "../../componentes";
import { fmt, int } from "../../lib/formato";
import { noEstado } from "../../lib/uf";
import {
  anoAnterior,
  doFiltro,
  grupos,
  idadesPorGrupo,
  media,
  reeleicao,
  SERIES_IDADE,
  TERCO,
  troca,
  votoGrupo,
} from "./calculo";
import type { Ctx } from "./tipos";

const compara = (v: number | null, e: number | null) =>
  v == null || e == null
    ? "têm idade parecida com"
    : Math.abs(v - e) < 0.5
      ? "têm a mesma idade que"
      : v > e
        ? "são mais velhos que"
        : "são mais novos que";

/** Seção 1: a resposta em texto, os dois anéis e a régua de idades por terço. */
export function Resposta({ M, f }: Ctx) {
  const xs = doFiltro(M, f.uf),
    tr = troca(xs, f.ano),
    vg = votoGrupo(xs, f.ano),
    g = grupos(xs, f.corte);
  const onde = noEstado(f.uf);
  const ver = media(xs.map(m => m.idVer)),
    pjv = media(xs.map(m => m.pjVer));
  const elJ = media(g[0].map(m => m.idEl)),
    vJ = media(g[0].map(m => m.idVer)),
    elV = media(g[2].map(m => m.idEl)),
    vV = media(g[2].map(m => m.idVer));
  const tj = troca(g[0], f.ano).pc,
    tv = troca(g[2], f.ano).pc,
    dif = tj != null && tv != null ? tj - tv : null;
  const corte = f.corte === "uf" ? "do mesmo estado" : "dos 6 estados";
  const re = reeleicao(xs, f.ano);
  const anterior = anoAnterior(f.ano);

  return (
    <>
      <Caixa>
        <h2>A resposta</h2>
        <p className="texto-simples">
          Os eleitos ficam no meio da vida: {onde}, os vereadores eleitos em 2024 têm em média <b>{fmt(ver)} anos</b>, e
          só {fmt(pjv, 0)}% têm até 29. A idade deles muda pouco de uma cidade para outra: na cidade mais jovem{" "}
          {compara(vJ, elJ)} o eleitorado ({fmt(vJ)} × {fmt(elJ)} anos); na mais velha, {compara(vV, elV)} ele (
          {fmt(vV)} × {fmt(elV)} anos). <b>Jovem não vota em jovem:</b> em {f.ano}, só {fmt(vg.vj)}% dos votos para
          vereador foram para candidatos de até 29 anos, e os jovens são {fmt(vg.aj)}% do eleitorado.{" "}
          <b>Alternância há, e muita:</b> o partido do prefeito mudou em {fmt(tr.pc, 0)}% das cidades de {anterior} para{" "}
          {f.ano}.{" "}
          {dif == null
            ? ""
            : Math.abs(dif) < 5
              ? `Comparando cidades ${corte}, a cidade jovem e a velha trocam na mesma medida (${fmt(tj, 0)}% × ${fmt(tv, 0)}%).`
              : `Comparando cidades ${corte}, a jovem troca ${dif > 0 ? "mais" : "menos"} (${fmt(tj, 0)}% × ${fmt(tv, 0)}%).`}
        </p>
        <div>
          <Linha rotulo="Cidades" valor={int(xs.length)} />
          <Linha rotulo={`Prefeito tentou a reeleição (${f.ano})`} valor={`${fmt(re.tentou, 0)}%`} />
          <Linha rotulo="Dos que tentaram, se reelegeram" valor={`${fmt(re.venceu, 0)}%`} />
          <Linha
            rotulo={`Votos em candidato de 60+ (${f.ano})`}
            valor={`${fmt(vg.vi)}% (são ${fmt(vg.ai)}% do eleitorado)`}
          />
        </div>
      </Caixa>
      <div className="grid min-w-0 gap-3.5">
        <Aneis>
          <Anel
            pct={tr.pc}
            legenda={`das cidades, de ${anterior} para ${f.ano}`}
            nome="trocaram o partido do prefeito"
          />
          <Anel
            pct={vg.vj}
            variante="verde"
            legenda={`dos votos para vereador (${f.ano}); jovens são ${fmt(vg.aj, 0)}% do eleitorado`}
            nome="foram para jovens"
          />
        </Aneis>
        <Idades {...{ M, f }} />
      </div>
    </>
  );
}

const W = 680,
  LH = 58,
  L = 150,
  RR = 20,
  T = 18,
  H = T + 3 * LH + 34,
  LO = 25,
  HI = 55;
const X = (v: number) => L + ((W - L - RR) * (v - LO)) / (HI - LO);
const MARCAS = [25, 30, 35, 40, 45, 50, 55];

/** Régua de idades: população, eleitorado, vereadores e prefeitos em cada terço de cidades. */
function Idades({ M, f }: Pick<Ctx, "M" | "f">) {
  const dica = useDica();
  const g = grupos(doFiltro(M, f.uf), f.corte);
  const vals = idadesPorGrupo(g);
  const pv = vals.map(v => v[0]),
    vv = vals.map(v => v[2]);
  const nota =
    pv[0] != null && pv[2] != null && vv[0] != null && vv[2] != null
      ? `Da cidade mais jovem para a mais velha, a idade da população sobe ${fmt(pv[2] - pv[0])} anos; a dos vereadores eleitos, só ${fmt(vv[2] - vv[0])}. Terços ${f.corte === "uf" ? "dentro de cada estado" : "entre todas as cidades dos 6 estados"}.`
      : "";

  return (
    <Caixa>
      <h2>Quem mora, quem vota e quem é eleito: a idade média</h2>
      <svg
        className="grafico"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Idade média da população, do eleitorado e dos eleitos por grupo de cidades"
      >
        {MARCAS.map(v => (
          <g key={v}>
            <line x1={X(v)} x2={X(v)} y1={T - 6} y2={T + 3 * LH - 10} className="svg-grade" />
            <text x={X(v)} y={T + 3 * LH + 4} className="svg-eixo" textAnchor="middle" dominantBaseline="middle">
              {v} anos
            </text>
          </g>
        ))}
        {vals.map((vs, i) => {
          const y = T + i * LH + LH / 2 - 8,
            ok = vs.filter(v => v != null);
          return (
            <g key={TERCO[i]}>
              <text
                x={L - 12}
                y={y - 7}
                className="svg-rotulo"
                textAnchor="end"
                dominantBaseline="middle"
                fontWeight={700}
              >
                {TERCO[i]}
              </text>
              <text x={L - 12} y={y + 10} className="svg-eixo" textAnchor="end" dominantBaseline="middle">
                {int(g[i].length)} cidades
              </text>
              {ok.length > 0 && (
                <line
                  x1={X(Math.min(...ok))}
                  x2={X(Math.max(...ok))}
                  y1={y}
                  y2={y}
                  className="stroke-linha"
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              )}
              {vs.map((v, k) =>
                v == null ? null : (
                  <g key={k}>
                    <circle
                      cx={X(v)}
                      cy={y}
                      r={9}
                      fill={SERIES_IDADE[k].cor}
                      stroke="#fff"
                      strokeWidth={2}
                      onMouseMove={ev =>
                        dica.mostrar(
                          ev,
                          <>
                            <b>{TERCO[i]}</b>
                            <br />
                            {SERIES_IDADE[k].nome}: <b>{fmt(v)} anos</b>
                          </>,
                        )
                      }
                      onMouseLeave={dica.esconder}
                    />
                    {(k === 0 || k === 2) && (
                      <text
                        x={X(v)}
                        y={y + (k === 0 ? -17 : 19)}
                        className="svg-eixo"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {fmt(v)}
                      </text>
                    )}
                  </g>
                ),
              )}
            </g>
          );
        })}
      </svg>
      <Legenda redonda itens={SERIES_IDADE.map(s => ({ cor: s.cor, rotulo: s.nome }))} />
      <p className="texto-nota">{nota}</p>
    </Caixa>
  );
}
