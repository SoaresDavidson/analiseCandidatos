import { type ReactNode, useId, useMemo, useState } from "react";
import { LADOS, lado } from "../lib/espectro";
import { useDica } from "./Dica";
import { setoresDosLados } from "./lados";

// Plenário visto de cima, no formato da Câmara dos Deputados: a mesa diretora no alto,
// com o painel atrás e os telões dos lados; as bancadas em arcos voltados para a mesa,
// cortadas pelos corredores. Cada cadeira é um eleito, com a foto e um anel na cor do
// espectro do partido, da esquerda para a direita pela nota do partido. Com `lados`, as cadeiras
// se juntam em três blocos (esquerda, centro, direita), cada um sobre um fundo da sua cor; o bloco
// maior simplesmente ocupa mais do arco.

export interface Assento {
  nome: string;
  partido: string;
  nota: number | null;
  cor?: string;
  foto?: string;
  /** linha extra no balão (ex.: "4,50 · centro · 1.234 votos") */
  rotulo?: string;
}

const W = 960,
  CX = W / 2,
  CY = 150,
  R0 = 190;
const A0 = 12,
  A1 = 168,
  FENDA = 4.5,
  CORTES = [51, 90, 129];
// corredores: 3 fendas que dividem a plateia em 4 setores, como no plenário
const SETORES: [number, number][] = [
  [A0, CORTES[0] - FENDA / 2],
  [CORTES[0] + FENDA / 2, CORTES[1] - FENDA / 2],
  [CORTES[1] + FENDA / 2, CORTES[2] - FENDA / 2],
  [CORTES[2] + FENDA / 2, A1],
];
const UTIL = SETORES.reduce((s, [a, b]) => s + (b - a), 0);
const rad = (a: number) => (a * Math.PI) / 180;

// arco entre dois ângulos (graus; 0 = direita, 90 = para baixo, no sistema do SVG)
function arco(r: number, a0: number, a1: number): string {
  const x0 = CX + r * Math.cos(rad(a0)),
    y0 = CY + r * Math.sin(rad(a0));
  const x1 = CX + r * Math.cos(rad(a1)),
    y1 = CY + r * Math.sin(rad(a1));
  return `M${x0.toFixed(1)},${y0.toFixed(1)}A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
}

/** Fileiras, raio das cadeiras e posição de cada uma, da esquerda (ângulo maior) para a direita. */
function geometria(n: number) {
  // mais cadeiras, mais fileiras; cadeiras por fileira proporcionais ao raio
  const filas = Math.max(2, Math.min(7, Math.round(Math.sqrt(n / 2.4))));
  const dr = Math.min(70, 300 / filas);
  const raios = Array.from({ length: filas }, (_, i) => R0 + i * dr),
    soma = raios.reduce((a, b) => a + b, 0);
  let resto = n;
  const porFila = raios.map((r, i) => {
    const k = i === filas - 1 ? resto : Math.max(1, Math.round((n * r) / soma));
    resto -= k;
    return k;
  });
  const rExt = raios[filas - 1] + dr * 0.55;
  const pos: { a: number; x: number; y: number }[] = [];
  raios.forEach((r, i) => {
    const k = porFila[i];
    for (let j = 0; j < k; j++) {
      let t = UTIL * (k === 1 ? 0.5 : (j + 0.5) / k),
        a = A0; // anda pelos setores pulando as fendas
      for (const [s0, s1] of SETORES) {
        if (t <= s1 - s0) {
          a = s0 + t;
          break;
        }
        t -= s1 - s0;
      }
      pos.push({ a, x: CX + r * Math.cos(rad(a)), y: CY + r * Math.sin(rad(a)) });
    }
  });
  pos.sort((p, q) => q.a - p.a);
  const raio = Math.max(7, Math.min(26, dr * 0.34, ((Math.PI * raios[0] * (UTIL / 180)) / porFila[0]) * 0.42));
  return { dr, raios, rExt, pos, raio, altura: CY + rExt + 30 };
}

export function Plenario<A extends Assento>({
  assentos,
  aoClicar,
  titulo,
  lados = false,
}: {
  assentos: readonly A[];
  aoClicar?: (a: A) => void;
  titulo?: string;
  /** agrupa as cadeiras em esquerda, centro e direita, com o fundo de cada lado */
  lados?: boolean;
}) {
  const id = "plen" + useId().replace(/[^a-zA-Z0-9_-]/g, ""); // vai dentro de url(#...)
  const dica = useDica();
  // a ordem é feita aqui: pelo lado (se pedido), pela nota do partido e pela sigla
  const xs = useMemo(
    () =>
      assentos
        .slice()
        .sort(
          (a, b) =>
            (lados ? lado(a.nota) - lado(b.nota) : 0) ||
            (a.nota ?? (lados ? 5 : 99)) - (b.nota ?? (lados ? 5 : 99)) ||
            String(a.partido).localeCompare(String(b.partido)),
        ),
    [assentos, lados],
  );
  const g = useMemo(() => geometria(xs.length), [xs.length]);
  const rIn = g.raios[0] - g.dr * 0.75;
  const pIn = (a: number) => `${CX + rIn * Math.cos(rad(a))},${CY + rIn * Math.sin(rad(a))}`;
  // leque entre dois ângulos, do anel de dentro ao de fora (a0 < a1)
  const leque = (a0: number, a1: number) => `${arco(g.rExt, a0, a1)}L${pIn(a1)}A${rIn},${rIn} 0 0 0 ${pIn(a0)}Z`;
  const fundos = useMemo(() => (lados ? setoresDosLados(xs, g.pos) : []), [lados, xs, g.pos]);

  return (
    <svg viewBox={`0 0 ${W} ${g.altura}`} role="img" aria-label={titulo} className="grafico">
      <defs>
        <radialGradient id={`${id}piso`} cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#4c6b3a" />
          <stop offset="100%" stopColor="#2f4527" />
        </radialGradient>
      </defs>
      {/* carpete só na área das bancadas (um anel em leque), com a tribuna livre perto da mesa */}
      <path d={leque(A0 - 6, A1 + 6)} fill={`url(#${id}piso)`} />
      {fundos.map(f => (
        <path key={f.lado} d={leque(f.a0, f.a1)} fill={LADOS[f.lado].cor} />
      ))}
      <path d={arco(g.rExt + 8, A0 - 6, A1 + 6)} fill="none" stroke="#cfc6b4" strokeWidth={14} />
      <MesaDiretora />
      {/* bancadas (mesas em arco, na frente de cada fileira), cortadas nos corredores */}
      {g.raios.flatMap((r, i) =>
        SETORES.map(([a, b], j) => (
          <path
            key={`${i}-${j}`}
            d={arco(r - g.dr * 0.36, a, b)}
            fill="none"
            stroke="#b78a55"
            strokeWidth={Math.max(6, g.dr * 0.16)}
          />
        )),
      )}
      {xs.map((s, i) => (
        <Cadeira
          key={i}
          id={`${id}c${i}`}
          assento={s}
          {...g.pos[i]}
          raio={g.raio}
          contorno={lados}
          aoClicar={aoClicar && (() => aoClicar(s))}
          aoPassar={ev =>
            dica.mostrar(
              ev,
              <>
                <b>{s.nome}</b>
                <br />
                {s.partido}
                {s.rotulo && (
                  <>
                    <br />
                    {s.rotulo}
                  </>
                )}
              </>,
            )
          }
          aoSair={dica.esconder}
        />
      ))}
    </svg>
  );
}

function MesaDiretora() {
  const telao = (x: number): ReactNode => (
    <g key={x}>
      <rect x={x} y={18} width={100} height={48} rx={4} fill="#1d3f72" />
      {[0, 1, 2, 3].map(k => (
        <rect key={k} x={x + 8} y={24 + k * 10} width={84} height={4} fill="#5f86c2" opacity={0.8} />
      ))}
    </g>
  );
  return (
    <g>
      <rect x={CX - 230} y={8} width={460} height={64} rx={6} fill="#d9d2c3" />
      {Array.from({ length: 46 }, (_, i) => (
        <rect key={i} x={CX - 226 + i * 10} y={12} width={5} height={56} fill={i % 2 ? "#bfb5a1" : "#e8e1d2"} />
      ))}
      {telao(CX - 330)}
      {telao(CX + 230)}
      <path
        d={`M${CX - 150},${CY - 42}Q${CX},${CY + 2} ${CX + 150},${CY - 42}L${CX + 135},${CY - 62}Q${CX},${CY - 22} ${CX - 135},${CY - 62}Z`}
        fill="#a87a45"
        stroke="#7d5a31"
        strokeWidth={2}
      />
      <text x={CX} y={CY - 70} textAnchor="middle" className="svg-eixo" fill="#5a5446">
        MESA DIRETORA
      </text>
    </g>
  );
}

function Cadeira({
  id,
  assento: s,
  x,
  y,
  raio,
  contorno,
  aoClicar,
  aoPassar,
  aoSair,
}: {
  id: string;
  assento: Assento;
  x: number;
  y: number;
  raio: number;
  /** contorno branco, para o anel não sumir no fundo da mesma cor */
  contorno?: boolean;
  aoClicar?: () => void;
  aoPassar: (ev: React.MouseEvent) => void;
  aoSair: () => void;
}) {
  const [semFoto, setSemFoto] = useState(false);
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${s.nome}, ${s.partido}`}
      className="group cursor-pointer outline-none"
      onClick={aoClicar}
      onKeyDown={ev => {
        if (aoClicar && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          aoClicar();
        }
      }}
      onMouseMove={aoPassar}
      onMouseLeave={aoSair}
    >
      <clipPath id={id}>
        <circle cx={x} cy={y} r={raio} />
      </clipPath>
      {/* anel na cor do espectro; contorno ouro ao passar o mouse ou focar pelo teclado */}
      <circle
        cx={x}
        cy={y}
        r={raio + 3.5}
        fill={s.cor || "#b9b6ae"}
        stroke={contorno ? "#fff" : undefined}
        strokeWidth={contorno ? 1.5 : undefined}
        className="group-hover:stroke-ouro group-hover:stroke-4 group-focus-visible:stroke-ouro group-focus-visible:stroke-4"
      />
      <circle cx={x} cy={y} r={raio} fill="#e8e5de" />
      <text x={x} y={y + raio * 0.35} textAnchor="middle" fontSize={raio} fontWeight={800} fill="#8a8578">
        {(s.nome || "?")[0]}
      </text>
      {s.foto && !semFoto && (
        <image
          href={s.foto}
          x={x - raio}
          y={y - raio}
          width={2 * raio}
          height={(2 * raio * 113) / 81}
          clipPath={`url(#${id})`}
          preserveAspectRatio="xMidYMin slice"
          onError={() => setSemFoto(true)}
        />
      )}
    </g>
  );
}
