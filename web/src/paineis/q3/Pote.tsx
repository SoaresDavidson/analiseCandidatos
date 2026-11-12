import { useId } from "react";

/** Pote de vidro com moedas até `nivel` (0 = vazio, 1 = cheio). O enchimento sobe ao aparecer. */
export function Pote({ nivel, className = "w-full", titulo }: { nivel: number; className?: string; titulo?: string }) {
  const id = "pote" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const n = Math.max(0, Math.min(1, nivel));
  const FUNDO = 144,
    TOPO = 30;
  const h = Math.max(n > 0 ? 6 : 0, n * (FUNDO - TOPO));
  const corpo = "M36,18H84V30Q104,36 104,58V128Q104,144 88,144H32Q16,144 16,128V58Q16,36 36,30Z";
  return (
    <svg viewBox="0 0 120 150" role="img" aria-label={titulo} className={`block h-auto ${className}`}>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={corpo} />
        </clipPath>
        <pattern id={`${id}m`} width="14" height="12" patternUnits="userSpaceOnUse">
          <rect width="14" height="12" fill="#f3c62f" />
          <ellipse cx="7" cy="6" rx="6" ry="4.4" fill="#ebb400" stroke="#b98a00" strokeWidth="1" />
          <ellipse cx="0" cy="12" rx="6" ry="4.4" fill="#f6d04a" stroke="#b98a00" strokeWidth="1" />
          <ellipse cx="14" cy="12" rx="6" ry="4.4" fill="#f6d04a" stroke="#b98a00" strokeWidth="1" />
          <ellipse cx="0" cy="0" rx="6" ry="4.4" fill="#f6d04a" stroke="#b98a00" strokeWidth="1" />
          <ellipse cx="14" cy="0" rx="6" ry="4.4" fill="#f6d04a" stroke="#b98a00" strokeWidth="1" />
        </pattern>
      </defs>
      <path d={corpo} fill="#f4f8f9" />
      <g clipPath={`url(#${id}c)`}>
        <rect
          key={h.toFixed(1)}
          x="14"
          y={FUNDO - h}
          width="92"
          height={h + 2}
          fill={`url(#${id}m)`}
          className="anima-cresce-y"
        />
      </g>
      <path d={corpo} fill="none" stroke="#8fa0a8" strokeWidth="3" strokeLinejoin="round" />
      <path d="M25,62V122" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".75" />
      <rect x="30" y="5" width="60" height="14" rx="5" fill="#7c5e00" />
      <rect x="30" y="5" width="60" height="5" rx="2.5" fill="#a88200" />
    </svg>
  );
}
