import { fmt } from "../../lib/formato";
import { UF_NOME } from "../../lib/uf";
import { N_MIN } from "./estatistica";

/** Os 27 estados, do que menos ao que mais depende do fundo público: cada coluna é um botão que
 *  leva o estado para a cena do Congresso. Clicar de novo no estado marcado volta para o Brasil. */
export function Estados({
  itens,
  uf,
  cargo,
  ano,
  aoMudar,
}: {
  itens: { uf: string; n: number; pub: number | null }[];
  /** estado marcado, ou "TODAS" */
  uf: string;
  cargo: string;
  ano: number;
  aoMudar: (uf: string) => void;
}) {
  const ord = itens.filter(x => x.pub != null).sort((a, b) => a.pub! - b.pub! || a.uf.localeCompare(b.uf));
  if (ord.length < 2) return null;
  return (
    <div className="grid gap-1.5 border-t border-linha pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <b className="text-[14.5px]">
          Em que estado mais candidatos a {cargo} dependeram do fundo em {ano}? Clique para ver no Congresso.
        </b>
        {uf !== "TODAS" && (
          <button
            type="button"
            onClick={() => aoMudar("TODAS")}
            className="cursor-pointer rounded-full border-2 border-ouro bg-transparent px-3 py-0.5 text-[13px] font-bold hover:bg-ouro-claro"
          >
            ← Brasil
          </button>
        )}
      </div>
      <div className="rolagem-x">
        <div className="grid min-w-[640px] grid-flow-col auto-cols-fr items-end gap-1">
          {ord.map(x => {
            const sel = x.uf === uf,
              poucos = x.n < N_MIN;
            return (
              <button
                key={x.uf}
                type="button"
                aria-pressed={sel}
                aria-label={`${UF_NOME[x.uf]}: ${fmt(x.pub, 0)} de cada 100 candidatos dependeram do fundo público`}
                title={`${UF_NOME[x.uf]}: ${fmt(x.pub, 0)} em cada 100${poucos ? ` (só ${x.n} candidatos)` : ""}`}
                onClick={() => aoMudar(sel ? "TODAS" : x.uf)}
                className="group grid cursor-pointer justify-items-center gap-0.5 border-0 bg-transparent p-0"
              >
                <span className={`text-[12px] tabular-nums ${sel ? "font-extrabold" : "text-texto-2"}`}>
                  {fmt(x.pub, 0)}
                </span>
                <span className="flex h-[52px] w-full items-end">
                  <span
                    className={`block w-full rounded-t-[4px] transition-[height] duration-500 group-hover:brightness-90 ${
                      sel ? "bg-ouro-esc" : poucos ? "bg-sem-dado" : "bg-ouro"
                    }`}
                    style={{ height: `${Math.max(3, x.pub!)}%` }}
                  />
                </span>
                <span
                  className={`w-full rounded-[4px] py-px text-center text-[12.5px] font-bold ${sel ? "bg-texto text-white" : ""}`}
                >
                  {x.uf}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="texto-nota m-0">
        Número em cima da coluna: de cada 100 candidatos, quantos tiveram metade ou mais da campanha paga pelo fundo.
        Coluna cinza: menos de {N_MIN} candidatos no estado.
      </p>
    </div>
  );
}
