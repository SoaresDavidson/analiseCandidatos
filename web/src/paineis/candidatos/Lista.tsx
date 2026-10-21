import { FotoEleito } from "../../componentes";
import { brl, int } from "../../lib/formato";
import { corCategoria } from "./Ficha";
import type { Eleito } from "./tipos";

export type Ordem = "votos" | "nome" | "patrimonio" | "receita";

export const ORDENS: Record<Ordem, (a: Eleito, b: Eleito) => number> = {
  votos: (a, b) => (b.votos || 0) - (a.votos || 0),
  nome: (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
  patrimonio: (a, b) => (b.patrimonio || 0) - (a.patrimonio || 0),
  receita: (a, b) => (b.receita || 0) - (a.receita || 0),
};

/** Cartão de um eleito na lista: foto, nome, partido, cidade e o número da ordenação escolhida. */
function Cartao({
  e,
  ordem,
  todosEstados,
  aoAbrir,
}: {
  e: Eleito;
  ordem: Ordem;
  todosEstados: boolean;
  aoAbrir: (e: Eleito) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => aoAbrir(e)}
      className="grid cursor-pointer grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-[10px] border border-linha bg-branco p-2 text-left hover:border-ouro hover:shadow-[0_0_0_2px_var(--color-ouro)] focus-visible:border-ouro focus-visible:shadow-[0_0_0_2px_var(--color-ouro)]"
    >
      <FotoEleito ano={e.ano} sq={e.sq} nome={e.nome} className="w-16 aspect-[81/113] rounded-lg! text-[26px]" />
      <span className="grid min-w-0 gap-px">
        <b className="text-[15px] leading-tight">{e.nome}</b>
        <small className="overflow-hidden text-[12.5px] text-ellipsis whitespace-nowrap text-texto-2">
          {e.espectro && (
            <i
              title={e.espectro[1].toLowerCase()}
              className="mr-[5px] inline-block size-[9px] rounded-full"
              style={{ background: corCategoria(e.espectro[1]) }}
            />
          )}
          {e.partido} · {e.local}
          {todosEstados && e.cargo >= 11 ? ` (${e.uf})` : ""}
        </small>
        <span className="text-[13px] font-bold tabular-nums text-verde-esc">
          {ordem === "patrimonio"
            ? `${brl(e.patrimonio || 0)} em bens`
            : ordem === "receita"
              ? `${brl(e.receita)} arrecadados`
              : `${e.votos == null ? "–" : int(e.votos)} votos`}
        </span>
      </span>
    </button>
  );
}

/** Grade de cartões; quem chama já entrega só a fatia que cabe na tela. */
export default function Lista({
  eleitos,
  ordem,
  todosEstados,
  aoAbrir,
}: {
  eleitos: Eleito[];
  ordem: Ordem;
  todosEstados: boolean;
  aoAbrir: (e: Eleito) => void;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2.5">
      {eleitos.map(e => (
        <Cartao key={e.id} e={e} ordem={ordem} todosEstados={todosEstados} aoAbrir={aoAbrir} />
      ))}
    </div>
  );
}
