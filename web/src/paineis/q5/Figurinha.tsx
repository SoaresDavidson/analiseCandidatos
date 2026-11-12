import { useId, useRef, useState } from "react";
import { nomeDe, numeroDe, urlFigurinha } from "./partidos";

/** A figurinha de um partido: a imagem pronta, quando existe, ou uma no mesmo estilo (moldura
 *  prateada, sigla grande, nome e número) para os demais. Com `viva`, inclina com o mouse e
 *  ganha o brilho holográfico. */
export function Figurinha({
  sigla,
  ano,
  viva,
  className = "",
}: {
  sigla: string;
  ano: number;
  viva?: boolean;
  className?: string;
}) {
  const url = urlFigurinha(sigla, ano);
  const caixa = useRef<HTMLDivElement>(null);
  const [falhou, setFalhou] = useState(false);
  const inclinar = (ev: React.MouseEvent) => {
    const el = caixa.current;
    if (!el || !viva) return;
    const r = el.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5,
      y = (ev.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${(x * 14).toFixed(1)}deg) rotateX(${(-y * 14).toFixed(1)}deg)`;
  };
  const soltar = () => {
    if (caixa.current) caixa.current.style.transform = "";
  };
  return (
    <div
      ref={caixa}
      onMouseMove={inclinar}
      onMouseLeave={soltar}
      className={`relative aspect-[4/5] overflow-hidden rounded-[5.5%] shadow-[0_18px_40px_rgb(0_0_0/.45)] transition-transform duration-200 ease-out will-change-transform ${className}`}
    >
      {url && !falhou ? (
        <img
          src={url}
          alt={`Figurinha do ${nomeDe(sigla)} (${sigla})`}
          className="size-full scale-[1.095] object-cover"
          onError={() => setFalhou(true)}
        />
      ) : (
        <Desenhada sigla={sigla} ano={ano} />
      )}
      {viva && <div aria-hidden="true" className="holo pointer-events-none absolute inset-0 mix-blend-screen" />}
    </div>
  );
}

/** Figurinha montada na página, para os partidos sem imagem pronta. */
function Desenhada({ sigla, ano }: { sigla: string; ano: number }) {
  const id = "fig" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const numero = numeroDe(sigla, ano);
  const tamanho = sigla.length <= 3 ? 34 : sigla.length <= 5 ? 24 : sigla.length <= 8 ? 15.5 : 11.5;
  return (
    <svg viewBox="0 0 100 125" role="img" aria-label={`Figurinha do ${nomeDe(sigla)} (${sigla})`} className="size-full">
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f6f8" />
          <stop offset=".3" stopColor="#c9d6e6" />
          <stop offset=".5" stopColor="#f7eef6" />
          <stop offset=".7" stopColor="#cfe9e2" />
          <stop offset="1" stopColor="#e9ecef" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1637b8" />
          <stop offset=".55" stopColor="#0b1f7a" />
          <stop offset="1" stopColor="#081555" />
        </linearGradient>
      </defs>
      <rect width="100" height="125" rx="7" fill={`url(#${id}p)`} />
      <rect x="4" y="4" width="92" height="117" rx="4.5" fill={`url(#${id}c)`} />
      {/* faixa verde e amarela no alto, como nas outras */}
      <path d="M4,16 Q60,10 96,44 V8.5 Q96,4 91.5,4 H50 Z" fill="#11a04a" />
      <path d="M4,17.5 Q58,11 96,47 V41 Q62,9 4,14 Z" fill="#f4c20d" />
      <rect x="4" y="4" width="92" height="9.5" rx="4.5" fill="#0a1a66" />
      <text
        x="50"
        y="11"
        textAnchor="middle"
        fontSize="5.2"
        fontWeight="800"
        fontStyle="italic"
        fill="#e6ebf2"
        letterSpacing=".3"
      >
        PARTIDOS DO BRASIL
      </text>
      <text
        x="50"
        y={52 + tamanho * 0.34}
        textAnchor="middle"
        fontSize={tamanho}
        fontWeight="800"
        fontStyle="italic"
        fill="#fff"
      >
        {sigla}
      </text>
      {/* plenário estilizado */}
      {[0, 1, 2].map(k => (
        <path
          key={k}
          d={`M${10 + k * 7},${84 - k * 1.5} Q50,${62 + k * 5} ${90 - k * 7},${84 - k * 1.5}`}
          fill="none"
          stroke={`url(#${id}p)`}
          strokeWidth="3.2"
          strokeDasharray="5 1.6"
          opacity=".85"
        />
      ))}
      <path d="M4,88 H70 L76,98 H4 Z" fill={`url(#${id}p)`} />
      <path d="M72,88 H96 V98 H78 Z" fill="#0a1a66" />
      <text x="37" y="94.8" textAnchor="middle" fontSize="4.4" fontWeight="800" fontStyle="italic" fill="#0a1a66">
        {nomeDe(sigla).toUpperCase().slice(0, 30)}
      </text>
      {numero != null && (
        <text x="86" y="96" textAnchor="middle" fontSize="8.5" fontWeight="800" fontStyle="italic" fill="#fff">
          {numero}
        </text>
      )}
      {/* Congresso Nacional */}
      <g fill={`url(#${id}p)`}>
        <rect x="20" y="113" width="60" height="1.6" />
        <rect x="47.2" y="102" width="2.2" height="11" />
        <rect x="50.6" y="102" width="2.2" height="11" />
        <path d="M27,113 Q34,104 41,113 Z" />
        <path d="M58,108 Q65,115 72,108 Z" />
      </g>
    </svg>
  );
}
