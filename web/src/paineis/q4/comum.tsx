import type { ReactNode, SVGProps } from "react";
import { fmt } from "../../lib/formato";
import { useNavegacao } from "../../lib/navegacao";
import type { Eleito, Municipio } from "./tipos";
import { UF_NOME } from "./tipos";

/** "nos 6 estados", "no Maranhão", "em Goiás". */
export function textoOnde(uf: string): string {
  if (uf === "TODAS") return "nos 6 estados";
  return (["AM", "MA", "MT", "RS"].includes(uf) ? "no " : "em ") + UF_NOME[uf];
}

/** Texto de SVG centrado na vertical; `cls` é uma classe de styles/utilitarios.css. */
export function Texto({
  x,
  y,
  cls = "svg-rotulo",
  anchor = "start",
  children,
  ...resto
}: {
  x: number;
  y: number;
  cls?: string;
  anchor?: "start" | "middle" | "end";
  children: ReactNode;
} & Omit<SVGProps<SVGTextElement>, "x" | "y">) {
  return (
    <text x={x} y={y} className={cls} textAnchor={anchor} dominantBaseline="middle" {...resto}>
      {children}
    </text>
  );
}

/** Nome do eleito: abre a ficha com foto na página de candidatos. */
export function NomeEleito({ e }: { e: Eleito }) {
  const { abrirCandidato } = useNavegacao();
  return (
    <button
      type="button"
      title="Ver a ficha com foto"
      onClick={() => abrirCandidato(e.ano, e.sq)}
      className="cursor-pointer border-0 bg-transparent p-0 text-left font-bold text-texto underline decoration-ouro underline-offset-3 hover:text-verde-esc"
    >
      {e.urna}
    </button>
  );
}

/** Conteúdo do balão sobre uma cidade (mapa e dispersão). */
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

/** Linha de lista de eleitos (esquerda e direita). */
export function LinhaEleito({ esq, dir }: { esq: ReactNode; dir: ReactNode }) {
  return (
    <div className="flex justify-between gap-2.5 border-b border-linha px-0.5 py-1.5 text-[13.5px]">
      {esq}
      {dir}
    </div>
  );
}
