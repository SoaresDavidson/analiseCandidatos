import { useMemo } from "react";
import { Alternador, Caixa, useDica } from "../../componentes";
import { fmt, int } from "../../lib/formato";
import { contarPref, dividirQuintos } from "./calculo";
import { Pote } from "./Pote";
import { corPartido, fatias } from "./partidos";
import type { Municipio } from "./tipos";

export type Riqueza = "pib" | "renda";
const RIQUEZA: Record<Riqueza, { rot: string; unidade: string; v: (m: Municipio) => number | null }> = {
  pib: { rot: "PIB por habitante", unidade: "por habitante (PIB, 2023)", v: m => m.pib },
  renda: { rot: "Renda das famílias", unidade: "por pessoa ao mês (Censo 2022)", v: m => m.renda },
};
const NOME_POTE = ["Mais pobres", "2º grupo", "3º grupo", "4º grupo", "Mais ricas"];
const mediana = (v: number[]): number => {
  const s = [...v].sort((a, b) => a - b),
    m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const reais = (v: number): string => (v >= 1e3 ? `R$ ${fmt(v / 1e3, v >= 1e5 ? 0 : 1)} mil` : `R$ ${int(v)}`);

/** O dinheiro muda quem vence? As cidades em 5 potes, do mais vazio ao mais cheio, e o partido que mais
 *  elegeu prefeitos em cada um. */
export function Potes({
  xs,
  onde,
  riqueza,
  aoMudar,
}: {
  xs: Municipio[];
  onde: string;
  riqueza: Riqueza;
  aoMudar: (r: Riqueza) => void;
}) {
  const { mostrar, esconder } = useDica();
  const R = RIQUEZA[riqueza];
  const potes = useMemo(() => {
    const q = dividirQuintos(
      xs.filter(m => m.pref),
      R.v,
    );
    if (q.some(g => g.length < 3)) return null;
    return q.map(g => ({ g, med: mediana(g.map(m => R.v(m)!)), lideres: contarPref(g), fat: fatias(g) }));
  }, [xs, R]);

  return (
    <Caixa>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2>O dinheiro da cidade muda quem vence a prefeitura?</h2>
        <Alternador
          rotulo="Medida de riqueza"
          opcoes={[
            ["pib", RIQUEZA.pib.rot],
            ["renda", RIQUEZA.renda.rot],
          ]}
          valor={riqueza}
          aoMudar={aoMudar}
        />
      </div>
      {!potes ? (
        <p className="texto-nota">Poucas cidades com prefeito eleito {onde} para dividir em 5 potes.</p>
      ) : (
        <>
          <Frase potes={potes} onde={onde} />
          <div className="grid grid-cols-5 gap-x-2 gap-y-1 min-[761px]:gap-x-5">
            {potes.map((p, i) => {
              const nivel = 0.1 + 0.86 * (p.med / potes[4].med);
              const [lider, n] = p.lideres[0];
              return (
                <div
                  key={`${riqueza}${i}`}
                  className="grid min-w-0 content-start justify-items-center gap-1.5 text-center"
                >
                  <Pote
                    nivel={nivel}
                    className="w-full max-w-[128px]"
                    titulo={`${NOME_POTE[i]}: ${reais(p.med)} ${R.unidade}`}
                  />
                  <b className="text-[14.5px] leading-tight">{NOME_POTE[i]}</b>
                  <span className="text-[12.5px] leading-tight text-texto-2">
                    <b className="text-texto">{reais(p.med)}</b>
                    <br />
                    {int(p.g.length)} cidades
                  </span>
                  {/* de que partido são os prefeitos do pote */}
                  <div className="flex h-3.5 w-full gap-px overflow-hidden rounded-[4px]">
                    {p.fat.map(x => (
                      <i
                        key={x.sg}
                        className="h-full"
                        style={{ width: `${x.pct}%`, background: x.cor }}
                        onMouseMove={ev =>
                          mostrar(
                            ev,
                            <>
                              <b>{x.sg === "Outros" ? "Outros partidos" : x.sg}</b>
                              <br />
                              {int(x.n)} prefeituras ({fmt(x.pct, 0)}%)
                            </>,
                          )
                        }
                        onMouseLeave={esconder}
                      />
                    ))}
                  </div>
                  <span className="text-[12.5px] leading-tight">
                    <b className="inline-flex items-center gap-1">
                      <i className="size-2.5 rounded-[3px]" style={{ background: corPartido(lider) }} />
                      {lider}
                    </b>{" "}
                    <span className="text-texto-2">{fmt((100 * n) / p.g.length, 0)}%</span>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Caixa>
  );
}

function Frase({ potes, onde }: { potes: { g: Municipio[]; lideres: [string, number][] }[]; onde: string }) {
  const lider = potes.map(p => p.lideres[0][0]);
  const pct = (i: number) => fmt((100 * potes[i].lideres[0][1]) / potes[i].g.length, 0);
  const iguais = lider.filter(l => l === lider[0]).length;
  return (
    <p className="texto-simples m-0">
      {iguais === 5 ? (
        <>
          <b>Quase não.</b> Do pote mais vazio ao mais cheio, o partido que mais elegeu prefeitos {onde} é o mesmo:{" "}
          <b>{lider[0]}</b> ({pct(0)}% nas cidades mais pobres, {pct(4)}% nas mais ricas).
        </>
      ) : lider[0] === lider[4] ? (
        <>
          <b>Pouco.</b> Nas cidades mais pobres e nas mais ricas {onde}, quem mais elegeu prefeitos foi o mesmo partido,{" "}
          <b>{lider[0]}</b> ({pct(0)}% e {pct(4)}%); nos potes do meio a liderança muda.
        </>
      ) : (
        <>
          <b>Em parte.</b> Nas cidades mais pobres {onde}, quem mais elegeu prefeitos foi o <b>{lider[0]}</b> ({pct(0)}
          %); nas mais ricas, o <b>{lider[4]}</b> ({pct(4)}%).
        </>
      )}
    </p>
  );
}
