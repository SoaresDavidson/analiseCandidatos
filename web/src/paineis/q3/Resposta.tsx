import { Anel, Aneis, Caixa, Legenda, Linha } from "../../componentes";
import { CATEGORIAS, COR_SEM_NOTA, CORES_ESPECTRO } from "../../lib/espectro";
import { fmt, pc } from "../../lib/formato";
import { contarPref, dividirQuintos, maiusculaInicial, mediana, spearman } from "./calculo";
import type { Indice, Municipio } from "./tipos";

interface Props {
  xs: Municipio[];
  indice: Indice;
  onde: string;
  corPartido: (sg: string) => string;
}

/** "A resposta" (texto, linhas e dois anéis) e o gráfico de quem venceu em cada quinto. */
export function Resposta({ xs, indice, onde, corPartido }: Props) {
  const v = indice.v;
  const com = xs.filter(m => v(m) != null && m.voto != null);
  const rho = spearman(com.map(m => v(m)!), com.map(m => m.voto!));
  const top = contarPref(xs), q = dividirQuintos(xs, v);
  const lideres = q.map(g => contarPref(g).slice(0, 3).map(p => p[0]));
  // "os mesmos" se a base e o topo dividem ao menos 2 dos 3 partidos que mais venceram
  const mesmos = lideres[0].filter(p => lideres[4].includes(p)).length >= 2;
  const forca = Math.abs(rho) < 0.1 ? "quase nada" : Math.abs(rho) < 0.3 ? "pouco" : Math.abs(rho) < 0.5 ? "moderadamente" : "bastante";
  const tres = top.slice(0, 3), soma3 = tres.reduce((s, p) => s + p[1], 0), comPref = xs.filter(m => m.pref).length;
  const top5 = top.slice(0, 5).map(p => p[0]);

  return (
    <div className="grade-duas">
      <Caixa>
        <h2>A resposta</h2>
        <p className="texto-simples">
          {Math.abs(rho) < 0.3 ? "Quase não." : "Sim, em parte."} {maiusculaInicial(onde)}, a {indice.frase} diz <b>{forca}</b> sobre para que lado a cidade vota (correlação {fmt(rho, 2)}).{" "}
          {mesmos
            ? <>Os partidos que mais elegem prefeitos são praticamente os mesmos nas cidades do topo e da base: <b>{top.slice(0, 3).map(p => p[0]).join(", ")}</b>.</>
            : <>Os partidos que mais vencem mudam ao longo da escala: nas cidades da base, {lideres[0].join(", ")}; nas do topo, {lideres[4].join(", ")}.</>}
        </p>
        <div>
          <Linha rotulo="Partido com mais prefeituras" valor={`${top[0][0]} (${top[0][1]})`} />
          <Linha rotulo="Correlação com a nota do voto" valor={fmt(rho, 2)} />
          <Linha rotulo={`${maiusculaInicial(indice.curto)} (mediana)`} valor={indice.f(mediana(xs.map(v)))} />
        </div>
      </Caixa>
      <div className="grid min-w-0 gap-3.5">
        <Aneis>
          <Anel pct={pc(soma3, comPref)} legenda="das prefeituras" nome={tres.map(p => p[0]).join(", ")} />
          <Anel variante="verde" pct={mediana(xs.map(m => m.isentos))} legenda="isentos (mediana)" nome="não escolheram ninguém" />
        </Aneis>
        <Caixa>
          <h2>Quem venceu a prefeitura em cada quinto das cidades, do menor ao maior {indice.curto}?</h2>
          <div>
            {q.map((g, i) => {
              const n = g.filter(m => m.pref).length, por = Object.fromEntries(contarPref(g));
              const outros = n - top5.reduce((s, p) => s + (por[p] || 0), 0);
              const seg: [string, number][] = [...top5.map(p => [p, por[p] || 0] as [string, number]), ["outros", outros]];
              const lo = v(g[0]), hi = v(g[g.length - 1]), voto = mediana(g.map(m => m.voto));
              return (
                <div key={i} className="grid grid-cols-[minmax(0,11em)_minmax(0,1fr)_3.2em] items-center gap-2.5 py-1">
                  <span className="grid text-[13.5px] leading-[1.25]">
                    <b>{i === 0 ? "Base" : i === 4 ? "Topo" : `${i + 1}º quinto`}</b>
                    <small className="text-xs text-texto-2">{indice.f(lo)} a {indice.f(hi)}</small>
                  </span>
                  <span className="flex h-[26px] gap-0.5 overflow-hidden rounded">
                    {seg.filter(s => s[1]).map(([p, k]) => {
                      const parte = pc(k, n);
                      return (
                        <span
                          key={p} title={`${p}: ${k} prefeituras (${fmt(parte, 0)}%)`}
                          className="grid min-w-0 place-items-center overflow-hidden text-[11px] font-bold text-white [text-shadow:0_0_2px_rgb(0_0_0/.45)]"
                          style={{ flex: k, background: p === "outros" ? COR_SEM_NOTA : corPartido(p) }}
                        >
                          {parte != null && parte >= 11 ? p : ""}
                        </span>
                      );
                    })}
                  </span>
                  <b className="text-right tabular-nums" title="nota mediana do voto para vereador">{fmt(voto, 2)}</b>
                </div>
              );
            })}
          </div>
          <Legenda
            itens={[
              ...CATEGORIAS.filter((_, i) => i !== 3).map((c, i) => ({ cor: CORES_ESPECTRO[i >= 3 ? i + 1 : i], rotulo: c })),
              { cor: COR_SEM_NOTA, rotulo: "outros partidos" },
            ]}
          />
          <p className="texto-nota">
            Cada barra: as prefeituras do quinto, por partido (os 5 que mais venceram {onde}); a cor é o espectro do partido. À direita, a nota mediana do voto para vereador.
          </p>
        </Caixa>
      </div>
    </div>
  );
}
