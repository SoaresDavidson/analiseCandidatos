import type { SelectHTMLAttributes } from "react";

const SETA = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23333' stroke-width='2' fill='none'/%3E%3C/svg%3E")`;

/** Select com borda ouro e seta própria (o "Brasil ▾" do TSE). */
export function Seletor({ className = "", style, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ backgroundImage: SETA, ...style }}
      className={`cursor-pointer appearance-none rounded-lg border-2 border-ouro bg-white bg-[right_12px_center] bg-no-repeat py-[7px] pr-[34px] pl-3.5 font-bold ${className}`}
    />
  );
}

/** Grupo de botões em que só um fica marcado (aria-pressed), como "1º turno | 2º turno". */
export function Alternador<T extends string | number>({
  opcoes,
  valor,
  aoMudar,
  rotulo,
}: {
  opcoes: readonly (readonly [T, string])[];
  valor: T;
  aoMudar: (v: T) => void;
  rotulo?: string;
}) {
  return (
    <span
      role="group"
      aria-label={rotulo}
      className="inline-flex flex-wrap overflow-hidden rounded-[7px] border-2 border-ouro bg-white"
    >
      {opcoes.map(([v, texto]) => (
        <button
          key={String(v)}
          type="button"
          aria-pressed={v === valor}
          onClick={() => aoMudar(v)}
          className="cursor-pointer border-0 bg-transparent px-[13px] py-1.5 font-bold hover:bg-ouro-claro aria-pressed:bg-ouro"
        >
          {texto}
        </button>
      ))}
    </span>
  );
}
