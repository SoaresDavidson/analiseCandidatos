import type { ReactNode } from "react";

/** Esqueleto de todo painel: barra de filtros fixa no topo (opcional) e a coluna central. */
export function Pagina({ filtros, children }: { filtros?: ReactNode; children: ReactNode }) {
  return (
    <div className="pagina">
      {filtros && (
        <div className="sticky top-0 z-[5] rounded-b-[18px] bg-branco shadow-barra">
          <div className="mx-auto flex max-w-pagina flex-wrap items-end gap-x-6 gap-y-3.5 px-5 pt-2.5 pb-3.5">{filtros}</div>
        </div>
      )}
      <main className="mx-auto grid max-w-pagina gap-[18px] px-5 pt-[22px] pb-16">{children}</main>
    </div>
  );
}

/** Rótulo em negrito acima de um controle de filtro. */
export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="grid gap-[3px] text-[13px] font-bold">
      {rotulo}
      {children}
    </label>
  );
}
