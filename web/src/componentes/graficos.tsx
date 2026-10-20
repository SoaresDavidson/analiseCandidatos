import type { ReactNode } from "react";
import { fmt } from "../lib/formato";

const CIRC = 2 * Math.PI * 38;

/** Anel de porcentagem com legenda ao lado (os dois números grandes do topo). */
export function Anel({
  pct,
  legenda,
  nome,
  variante = "ouro",
}: {
  pct: number | null;
  legenda: ReactNode;
  nome: ReactNode;
  variante?: "ouro" | "verde";
}) {
  const v = Math.max(0, Math.min(100, pct || 0));
  const verde = variante === "verde";
  return (
    <div
      className={`grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3.5 rounded-caixa border-2 bg-branco px-4 py-3.5 ${verde ? "border-verde" : "border-ouro"}`}
    >
      <svg viewBox="0 0 88 88" width="88" height="88" aria-hidden="true">
        <circle cx="44" cy="44" r="38" fill="none" className="stroke-bege" strokeWidth="9" />
        <circle
          cx="44"
          cy="44"
          r="38"
          fill="none"
          className={verde ? "stroke-verde-esc" : "stroke-ouro"}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${((CIRC * v) / 100).toFixed(1)} ${CIRC.toFixed(1)}`}
          transform="rotate(-90 44 44)"
        />
      </svg>
      <div>
        <span
          className={`text-[34px] leading-none font-extrabold tabular-nums ${verde ? "text-verde-esc" : "text-ouro-esc"}`}
        >
          {pct == null ? "–" : `${fmt(pct, 0)}%`}
        </span>
        <div className="text-[13px] text-texto-2">{legenda}</div>
        <div className="mt-1 text-base leading-tight font-extrabold uppercase">{nome}</div>
      </div>
    </div>
  );
}

/** Dois anéis lado a lado (um embaixo do outro no celular). */
export function Aneis({ children }: { children: ReactNode }) {
  return <div className="grid gap-3.5 min-[601px]:grid-cols-2">{children}</div>;
}

/** Barra horizontal: rótulo, trilho com preenchimento (0-100%) e valor. `media` desenha a linha tracejada de referência. */
export function Barra({
  rotulo,
  pct,
  valor,
  cor = "var(--color-ouro)",
  media,
  titulo,
  aoPassar,
  aoSair,
}: {
  rotulo: ReactNode;
  pct: number;
  valor: ReactNode;
  cor?: string;
  media?: number;
  /** balão nativo do navegador (ex.: o valor exato em reais) */
  titulo?: string;
  aoPassar?: (ev: React.MouseEvent) => void;
  aoSair?: () => void;
}) {
  return (
    <div
      className="grid grid-cols-[minmax(0,13em)_minmax(0,1fr)_3.4em] items-center gap-2.5 text-sm"
      title={titulo}
      onMouseMove={aoPassar}
      onMouseLeave={aoSair}
    >
      <span>{rotulo}</span>
      <span className="relative h-[18px] rounded-[3px] bg-bege">
        <i
          className="block h-full rounded-[3px]"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: cor }}
        />
        {media != null && (
          <span
            className="absolute -top-1 -bottom-1 w-0 border-l-2 border-dashed border-texto-2"
            style={{ left: `${media}%` }}
          />
        )}
      </span>
      <b className="text-right font-extrabold tabular-nums">{valor}</b>
    </div>
  );
}

export function Barras({ children }: { children: ReactNode }) {
  return <div className="grid gap-2.5">{children}</div>;
}

/** Barra 100% empilhada; cada parte mostra o rótulo se couber. */
export function Empilhada({
  partes,
}: {
  partes: readonly { pct: number; cor: string; rotulo?: ReactNode; titulo?: string }[];
}) {
  return (
    <div className="flex h-6 gap-0.5 overflow-hidden rounded">
      {partes.map((p, i) => (
        <span
          key={i}
          title={p.titulo}
          className="grid min-w-0 place-items-center overflow-hidden text-[11.5px] font-bold text-white"
          style={{ flex: `${p.pct} 0 0`, background: p.cor }}
        >
          {p.rotulo}
        </span>
      ))}
    </div>
  );
}
