import { useEffect, useMemo, useState } from "react";
import { useDica } from "../../componentes";
import { fmt, int, pc } from "../../lib/formato";
import { reais } from "./dominio";
import { NUVEM_H, NUVEM_W, posicionar } from "./layoutNuvem";
import type { Palavra } from "./tipos";

/** Nuvem de palavras em SVG; clicar (ou Enter/Espaço) numa palavra a seleciona. */
export function Nuvem({
  palavras,
  total,
  termo,
  aoEscolher,
}: {
  palavras: Palavra[];
  total: number;
  termo: number | null;
  aoEscolher: (t: number) => void;
}) {
  const dica = useDica();
  // a fonte web muda a largura do texto: refaz a posição quando terminar de carregar
  const [fontes, setFontes] = useState(0);
  useEffect(() => {
    let vivo = true;
    document.fonts?.ready.then(() => {
      if (vivo) setFontes(n => n + 1);
    });
    return () => {
      vivo = false;
    };
  }, []);
  const itens = useMemo(
    () => posicionar(palavras, getComputedStyle(document.body).fontFamily),
    // `fontes` só serve para refazer o cálculo quando a fonte web chega
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [palavras, fontes],
  );

  return (
    <svg
      className="grafico max-h-[440px]"
      viewBox={`0 0 ${NUVEM_W} ${NUVEM_H}`}
      role="img"
      aria-label="Nuvem de palavras das descrições de despesa de propaganda"
    >
      {itens.map(({ w, i, x, y, fs, peso }) => (
        <text
          key={w.t}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fs}
          fontWeight={peso}
          tabIndex={0}
          role="button"
          className={`cursor-pointer hover:underline ${termo === w.t ? "fill-ouro-esc" : i < 8 ? "fill-verde-esc" : "fill-verde"}`}
          onMouseMove={ev =>
            dica.mostrar(
              ev,
              <>
                <b>{w.termo}</b>
                <br />
                {int(w.n)} despesas ({fmt(pc(w.n, total), 0)}%)
                <br />
                {reais(w.vr)} no total
              </>,
            )
          }
          onMouseLeave={dica.esconder}
          onClick={() => aoEscolher(w.t)}
          onKeyDown={ev => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              aoEscolher(w.t);
            }
          }}
        >
          {w.termo}
        </text>
      ))}
    </svg>
  );
}
