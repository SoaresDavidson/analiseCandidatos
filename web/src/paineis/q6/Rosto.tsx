import { entre } from "./calculo";

const IMG = (nome: string) => `${import.meta.env.BASE_URL}img/q6/${nome}.webp`;

// As rugas, no sistema da ilustração (1254 × 1254). Cada grupo entra aos poucos entre duas idades.
const RUGAS: { de: number; ate: number; larg: number; d: string[] }[] = [
  {
    // sulcos do nariz à boca
    de: 36,
    ate: 52,
    larg: 6,
    d: ["M528,738 C474,772 436,812 436,872", "M734,738 C796,772 840,812 838,872"],
  },
  {
    // testa
    de: 38,
    ate: 56,
    larg: 5,
    d: [
      "M418,342 C520,326 600,348 700,334 S820,328 862,342",
      "M436,378 C530,364 610,384 706,370 S810,366 846,378",
      "M470,410 C550,400 620,414 700,404 S780,400 812,410",
    ],
  },
  {
    // pés de galinha
    de: 42,
    ate: 58,
    larg: 4,
    d: [
      "M398,556 L346,532",
      "M394,570 L340,566",
      "M398,584 L350,598",
      "M866,552 L914,528",
      "M870,566 L920,562",
      "M866,580 L912,594",
    ],
  },
  {
    // bolsas sob os olhos
    de: 46,
    ate: 62,
    larg: 4.5,
    d: [
      "M414,606 Q492,646 578,610",
      "M428,630 Q494,662 566,634",
      "M694,608 Q776,646 858,604",
      "M706,632 Q776,662 846,628",
    ],
  },
  {
    // entre as sobrancelhas, cantos da boca e pescoço
    de: 52,
    ate: 68,
    larg: 5,
    d: [
      "M616,432 Q610,462 618,492",
      "M656,430 Q662,460 654,490",
      "M470,884 Q452,934 468,980",
      "M806,884 Q824,934 808,980",
      "M452,1160 Q632,1196 816,1160",
    ],
  },
];

/** O rosto da Pergunta 6: a mesma ilustração para qualquer idade. O cabelo, a sobrancelha e a barba
 *  ficam brancos aos poucos (camada grisalha por cima da original) e as rugas entram por grupos.
 *  Sem idade (sem dado), o rosto aparece apagado. */
export function Rosto({ idade, rotulo, className = "" }: { idade: number | null; rotulo: string; className?: string }) {
  const i = idade ?? 30;
  // castanho até os 34; todo branco a partir dos 64
  const grisalho = entre(i, 34, 64);
  return (
    <div
      role="img"
      aria-label={rotulo}
      className={`relative aspect-square transition-[filter,opacity] duration-700 ${
        idade == null ? "opacity-30 grayscale" : ""
      } ${className}`}
    >
      <img src={IMG("rosto")} alt="" width={720} height={720} className="absolute inset-0 size-full" />
      <img
        src={IMG("rosto-grisalho")}
        alt=""
        width={720}
        height={720}
        className="absolute inset-0 size-full transition-opacity duration-700 ease-out"
        style={{ opacity: grisalho }}
      />
      <svg viewBox="0 0 1254 1254" aria-hidden="true" className="absolute inset-0 size-full mix-blend-multiply">
        <defs>
          <filter id="q6-ruga" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
        <g fill="none" stroke="#a8663f" strokeLinecap="round" filter="url(#q6-ruga)">
          {RUGAS.map(g => (
            <g
              key={g.de}
              strokeWidth={g.larg}
              className="transition-opacity duration-700 ease-out"
              style={{ opacity: 0.85 * entre(i, g.de, g.ate) }}
            >
              {g.d.map(d => (
                <path key={d} d={d} />
              ))}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
