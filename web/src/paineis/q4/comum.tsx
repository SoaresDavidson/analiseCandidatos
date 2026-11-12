import type { ReactNode } from "react";
import { Empilhada } from "../../componentes";
import { fmt } from "../../lib/formato";
import { useNavegacao } from "../../lib/navegacao";
import { COR_NIVEL, type Eleito, type Municipio, NIVEL } from "./tipos";

/** Nome do eleito: abre a ficha com foto por cima do livro. O deputado distrital não tem ficha. */
export function NomeEleito({ e }: { e: Eleito }) {
  const { abrirCandidato } = useNavegacao();
  if (e.cargo === 8) return <b>{e.urna}</b>;
  return (
    <button
      type="button"
      title="Abrir a ficha com foto"
      onClick={() => abrirCandidato(e.ano, e.sq, e.uf)}
      className="cursor-pointer border-0 bg-transparent p-0 text-left font-bold text-tinta underline decoration-ouro decoration-2 underline-offset-3 hover:text-verde-esc"
    >
      {e.urna}
    </button>
  );
}

/** Conteúdo do balão sobre uma cidade do mapa. */
export function DicaMun({ m }: { m: Municipio }) {
  if (!m.pop)
    return (
      <>
        <b>{m.n}</b>
        <br />
        Sem dado do Censo 2022
      </>
    );
  if (!m.ok)
    return (
      <>
        <b>{m.n}</b>
        <br />
        Sem resultado de vereador no arquivo do TSE
      </>
    );
  return (
    <>
      <b>
        {m.n} ({m.u})
      </b>
      {m.cap ? " · capital" : ""}
      <br />
      População com faculdade: {fmt(m.pPop, 0)}%<br />
      Eleitos com faculdade: {fmt(m.pEl, 0)}% de {m.te}
    </>
  );
}

/** Faixa 100% empilhada dos 4 níveis, com o título em cima (população × eleitos). */
export function BarraNiveis({ vals, titulo }: { vals: number[]; titulo: ReactNode }) {
  const tot = vals.reduce((a, b) => a + b, 0);
  const partes = vals
    .map((v, i) => ({ w: tot ? (100 * v) / tot : 0, i }))
    .filter(x => x.w > 0)
    .map(({ w, i }) => ({
      pct: w,
      cor: COR_NIVEL(i + 1),
      titulo: `${NIVEL[i + 1]}: ${fmt(w, 0)}%`,
      rotulo: w >= 11 ? `${fmt(w, 0)}%` : "",
    }));
  return (
    <div className="grid gap-1">
      <span className="text-[13px] font-semibold">{titulo}</span>
      <Empilhada partes={partes} />
    </div>
  );
}

/** Legenda dos 4 níveis, em linha. */
export function LegendaNiveis() {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[12px] text-tinta-2">
      {[1, 2, 3, 4].map(n => (
        <span key={n} className="inline-flex items-center gap-1.5">
          <i
            aria-hidden="true"
            className="inline-block size-[11px] rounded-[2px]"
            style={{ background: COR_NIVEL(n) }}
          />
          {NIVEL[n]}
        </span>
      ))}
    </div>
  );
}
