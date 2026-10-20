import type { Palavra } from "./tipos";

export const NUVEM_W = 600;
export const NUVEM_H = 380;

export interface Posicionada {
  w: Palavra;
  i: number;
  x: number;
  y: number;
  fs: number;
  peso: number;
}

interface Retangulo { x: number; y: number; w: number; h: number }

let medidor: CanvasRenderingContext2D | null = null;

/** Posiciona as palavras em espiral, sem sobreposição. Tamanho proporcional à raiz da frequência. */
export function posicionar(ws: Palavra[], familia: string): Posicionada[] {
  if (!ws.length) return [];
  medidor ??= document.createElement("canvas").getContext("2d");
  const nmax = ws[0].n;
  const nmin = ws[ws.length - 1].n;
  const ocup: Retangulo[] = [];
  const bate = (a: Retangulo) => ocup.some(b => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
  const saida: Posicionada[] = [];
  ws.forEach((w, i) => {
    const tz = (Math.sqrt(w.n) - Math.sqrt(nmin)) / Math.max(1e-9, Math.sqrt(nmax) - Math.sqrt(nmin));
    const fs = Math.round(13 + tz * 40);
    const peso = i < 8 ? 800 : 600;
    if (medidor) medidor.font = `${peso} ${fs}px ${familia}`;
    const lw = (medidor?.measureText(w.termo).width ?? w.termo.length * fs * 0.55) + 8;
    const lh = fs * 1.05;
    for (let k = 0; k < 2500; k++) {
      const ang = 0.33 * k;
      const raio = 1.6 * ang;
      const cx = NUVEM_W / 2 + raio * Math.cos(ang) * 1.6;
      const cy = NUVEM_H / 2 + raio * Math.sin(ang);
      const r = { x: cx - lw / 2, y: cy - lh / 2, w: lw, h: lh };
      if (r.x < 2 || r.y < 2 || r.x + r.w > NUVEM_W - 2 || r.y + r.h > NUVEM_H - 2 || bate(r)) continue;
      ocup.push(r);
      saida.push({ w, i, x: cx, y: cy + fs * 0.05, fs, peso });
      break;
    }
  });
  return saida;
}
