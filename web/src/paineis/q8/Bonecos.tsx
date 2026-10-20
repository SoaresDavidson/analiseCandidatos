import { fmt, int } from "../../lib/formato";
import type { Grupo } from "./tipos";

const FIGURA = "M5 3.2a2.2 2.2 0 1 1 0.01 0zM1.6 13.5v-4.2a3.4 3.4 0 0 1 6.8 0v4.2z";

/** 100 figuras, as dos eleitos pintadas. */
export function Bonecos({ t, cor, nome, g }: { t: number | null; cor: string; nome: string; g: Grupo }) {
  const k = t == null ? 0 : Math.round(t);
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2.5">
        <b className="text-[40px] leading-none font-extrabold tabular-nums" style={{ color: cor }}>
          {t == null ? "–" : fmt(t, 0)}
        </b>
        <span className="text-[13px] leading-[1.3] text-texto-2">
          de cada 100 se elegeram
          <br />
          <strong className="text-sm text-texto">{nome}</strong>
        </span>
      </div>
      <div
        className="grid max-w-[360px] grid-cols-[repeat(20,minmax(0,1fr))] gap-x-0.5 gap-y-[3px]"
        role="img"
        aria-label={`${k} de 100 figuras pintadas`}
      >
        {Array.from({ length: 100 }, (_, i) => (
          <svg
            key={i}
            viewBox="0 0 10 14"
            className={`block h-auto w-full ${i < k ? "" : "fill-bege"}`}
            style={i < k ? { fill: cor } : undefined}
            aria-hidden="true"
          >
            <path d={FIGURA} />
          </svg>
        ))}
      </div>
      <small className="text-texto-2">
        {int(g.e)} eleitos de {int(g.n)} candidatos
      </small>
    </div>
  );
}
