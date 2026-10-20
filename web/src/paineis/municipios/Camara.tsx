import { useMemo } from "react";
import { useDica } from "../../componentes";
import { corEspectro, nomeCategoria } from "../../lib/espectro";
import { fmt } from "../../lib/formato";
import { Chip } from "./Chip";
import type { Municipio, NotaPartido } from "./tipos";

export interface Bancada {
  sg: string;
  n: number;
  v: number | null;
  nota: string;
}

/** Cadeiras por partido, da esquerda para a direita pela nota. */
export function bancadas(m: Municipio, partidos: Record<string, NotaPartido>): Bancada[] {
  const cad: Bancada[] = [];
  for (let i = 0; i < m.cadeiras.length; i += 2) {
    const sg = String(m.cadeiras[i]),
      p = partidos[sg];
    cad.push({ sg, n: Number(m.cadeiras[i + 1]), v: p ? p[0] : null, nota: p ? p[2] : "" });
  }
  return cad.sort((a, b) => (a.v ?? 99) - (b.v ?? 99));
}

const W = 420,
  H = 230,
  CX = W / 2,
  CY = H - 14,
  REXT = 196;

/** Semicírculo de pontos: fileiras concêntricas; as cadeiras vão da esquerda (180°) para a direita (0°). */
function geometria(n: number) {
  const filas = Math.max(2, Math.min(6, Math.round(Math.sqrt(n / 1.6))));
  const rInt = REXT * (filas <= 2 ? 0.55 : 0.4);
  const raios = Array.from({ length: filas }, (_, i) => rInt + (REXT - rInt) * (filas === 1 ? 1 : i / (filas - 1)));
  const soma = raios.reduce((a, b) => a + b, 0);
  let resto = n;
  const porFila = raios.map((r, i) => {
    const k = i === filas - 1 ? resto : Math.max(1, Math.round((n * r) / soma));
    resto -= k;
    return k;
  });
  const pos: { a: number; x: number; y: number }[] = [];
  raios.forEach((r, i) => {
    const k = porFila[i];
    for (let j = 0; j < k; j++) {
      const a = Math.PI * (k === 1 ? 0.5 : 1 - j / (k - 1));
      pos.push({ a, x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) });
    }
  });
  pos.sort((p, q) => q.a - p.a);
  const raio = Math.min(13, ((REXT - rInt) / filas) * 0.42 + 3, ((Math.PI * REXT) / Math.max(...porFila)) * 0.42);
  return { pos, raio };
}

/** Plano B do plenário: pontos na cor do partido (aparece enquanto as fichas carregam ou se não houver foto). */
export function Semicirculo({ cad, n }: { cad: Bancada[]; n: number }) {
  const dica = useDica();
  const { pos, raio } = useMemo(() => geometria(n), [n]);
  let k = 0;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Plenário da câmara de vereadores visto de cima, com a foto de cada eleito na sua cadeira"
      className="grafico mx-auto max-w-[1000px]"
    >
      {cad.flatMap(c =>
        Array.from({ length: c.n }, (_, j) => {
          const p = pos[k++];
          return (
            <circle
              key={`${c.sg}${j}`}
              cx={p.x}
              cy={p.y}
              r={raio}
              fill={corEspectro(c.v)}
              stroke="#fff"
              strokeWidth={1.5}
              onMouseMove={ev =>
                dica.mostrar(
                  ev,
                  <>
                    <b>{c.sg}</b> · {c.n} cadeira{c.n > 1 ? "s" : ""}
                    <br />
                    {c.v == null ? "sem nota" : `${fmt(c.v, 2)} · ${nomeCategoria(c.v)}`}
                    {c.nota && (
                      <>
                        <br />
                        <small>{c.nota}</small>
                      </>
                    )}
                  </>,
                )
              }
              onMouseLeave={dica.esconder}
            />
          );
        }),
      )}
      <text
        x={CX}
        y={CY - 6}
        className="fill-texto text-[30px] font-extrabold"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {n}
      </text>
    </svg>
  );
}

/** Siglas da câmara com o número de cadeiras e a nota sobre estimativas. */
export function ListaBancadas({ cad }: { cad: Bancada[] }) {
  const estimadas = cad.filter(c => c.nota);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-x-2.5 gap-y-1.5">
        {cad.map(c => (
          <span key={c.sg}>
            <Chip texto={c.sg} nota={c.v} /> <b>{c.n}</b>
          </span>
        ))}
      </div>
      <p className="texto-nota">
        Da esquerda para a direita, pela nota do partido.
        {estimadas.length > 0 &&
          ` Notas estimadas ou herdadas: ${estimadas.map(c => c.sg).join(", ")} (ver Como calculamos).`}
      </p>
    </div>
  );
}
