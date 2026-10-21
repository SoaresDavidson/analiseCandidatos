import type { ReactNode } from "react";

/** Selo de partido ou categoria: borda esquerda e fundo claro na cor dada (do espectro, vinda dos dados). */
export function Chip({ cor, titulo, children }: { cor: string; titulo?: string; children: ReactNode }) {
  return (
    <span
      title={titulo}
      className="inline-block rounded border-l-4 px-[7px] py-px text-[12.5px] font-bold whitespace-nowrap"
      style={{ borderLeftColor: cor, background: `color-mix(in srgb, ${cor} 14%, #fff)` }}
    >
      {children}
    </span>
  );
}
