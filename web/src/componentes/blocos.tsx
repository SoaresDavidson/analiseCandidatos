import type { HTMLAttributes, ReactNode } from "react";

/** Cartão branco arredondado que agrupa um gráfico ou uma resposta. */
export function Caixa({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={`grid min-w-0 gap-3 rounded-caixa bg-branco px-5 py-[18px] ${className}`} />;
}

/** Selo verde do topo: "PERGUNTA 4 · ESCOLARIDADE". */
export function Etiqueta({ children }: { children: ReactNode }) {
  return <span className="justify-self-start rounded-md bg-verde-esc px-3.5 py-1.5 text-[13px] font-bold tracking-[.03em] text-white">{children}</span>;
}

/** Linha "rótulo .......... valor" com o valor em negrito. */
export function Linha({ rotulo, valor }: { rotulo: ReactNode; valor: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-linha py-[7px] text-[14.5px]">
      <span>{rotulo}</span>
      <b className="font-extrabold tabular-nums">{valor}</b>
    </div>
  );
}

/** Pílula de conclusão: "sim" verde, "não" bege. */
export function Selo({ tipo, children }: { tipo: "sim" | "nao"; children: ReactNode }) {
  const cor = tipo === "sim" ? "bg-verde-claro text-verde-esc" : "bg-bege text-texto";
  return <span className={`inline-flex items-center gap-2 justify-self-start rounded-full px-3 py-1.5 text-[13.5px] font-bold ${cor}`}>{children}</span>;
}

/** Bloco recolhível "Ver mais" para o detalhe técnico (método, tabelas). */
export function VerMais({ titulo, children, aberto }: { titulo: ReactNode; children: ReactNode; aberto?: boolean }) {
  return (
    <details open={aberto} className="group rounded-caixa bg-branco">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-caixa border-2 border-ouro px-5 py-3.5 font-bold group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
        {titulo}
        <span aria-hidden="true" className="text-[22px] leading-none text-ouro-esc">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">–</span>
        </span>
      </summary>
      <div className="grid gap-3.5 rounded-b-caixa border-2 border-t-0 border-ouro px-5 pt-4 pb-5 [&_ul]:m-0 [&_ul]:grid [&_ul]:max-w-[90ch] [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </details>
  );
}

/** Legenda horizontal de cores. */
export function Legenda({ itens }: { itens: readonly { cor: string; rotulo: ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-texto-2">
      {itens.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <Cor cor={it.cor} />
          {it.rotulo}
        </span>
      ))}
    </div>
  );
}

/** Quadradinho de cor (legendas, listas). */
export function Cor({ cor }: { cor: string }) {
  return <i aria-hidden="true" className="inline-block size-[13px] flex-none rounded-[3px]" style={{ background: cor }} />;
}

/** Faixa de gradiente com marcas embaixo (legenda de mapa contínuo). */
export function Rampa({ gradiente, marcas }: { gradiente: string; marcas: readonly ReactNode[] }) {
  return (
    <div className="grid max-w-[340px] gap-1 text-[12.5px] text-texto-2">
      <div className="h-2.5 rounded-[3px]" style={{ background: gradiente }} />
      <div className="flex justify-between">{marcas.map((m, i) => <span key={i}>{m}</span>)}</div>
    </div>
  );
}
