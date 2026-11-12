import type { Palavra } from "./tipos";

/** Tela de desenho da nuvem: larga no computador, mais quadrada no celular. */
export interface Tela {
  w: number;
  h: number;
  /** tamanho da menor e da maior palavra */
  fsMin: number;
  fsMax: number;
}
export const TELA_LARGA: Tela = { w: 1000, h: 430, fsMin: 16, fsMax: 72 };
export const TELA_ESTREITA: Tela = { w: 600, h: 460, fsMin: 13, fsMax: 50 };

export interface Posicionada {
  w: Palavra;
  i: number;
  x: number;
  y: number;
  fs: number;
  peso: number;
  /** largura e altura da caixa reservada (texto + folga) */
  lw: number;
  lh: number;
}

/** Folga em volta de cada palavra, em múltiplos do tamanho da letra (adesivos e cartazes pedem mais). */
export interface Folga {
  x: number;
  y: number;
}
export const FOLGA_TEXTO: Folga = { x: 0.15, y: 0.05 };

interface Retangulo {
  x: number;
  y: number;
  w: number;
  h: number;
}

let medidor: CanvasRenderingContext2D | null = null;

/** Posiciona as palavras em espiral, sem sobreposição. Tamanho proporcional à raiz da frequência. */
export function posicionar(
  ws: Palavra[],
  familia: string,
  tela: Tela,
  folgaDe: (i: number) => Folga = () => FOLGA_TEXTO,
): Posicionada[] {
  if (!ws.length) return [];
  medidor ??= document.createElement("canvas").getContext("2d");
  const nmax = ws[0].n;
  const nmin = ws[ws.length - 1].n;
  const ocup: Retangulo[] = [];
  const bate = (a: Retangulo) =>
    ocup.some(b => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
  const saida: Posicionada[] = [];
  const achatar = (tela.w / tela.h) * 0.92;
  ws.forEach((w, i) => {
    const tz = (Math.sqrt(w.n) - Math.sqrt(nmin)) / Math.max(1e-9, Math.sqrt(nmax) - Math.sqrt(nmin));
    const fs = Math.round(tela.fsMin + tz * (tela.fsMax - tela.fsMin));
    const peso = i < 8 ? 800 : 600;
    const folga = folgaDe(i);
    if (medidor) medidor.font = `${peso} ${fs}px ${familia}`;
    const texto = medidor?.measureText(w.termo).width ?? w.termo.length * fs * 0.55;
    const lw = texto + 2 * folga.x * fs + 8;
    const lh = fs * (1.05 + 2 * folga.y);
    for (let k = 0; k < 3000; k++) {
      const ang = 0.33 * k;
      const raio = 1.5 * ang;
      const cx = tela.w / 2 + raio * Math.cos(ang) * achatar;
      const cy = tela.h / 2 + raio * Math.sin(ang);
      const r = { x: cx - lw / 2, y: cy - lh / 2, w: lw, h: lh };
      if (r.x < 4 || r.y < 4 || r.x + r.w > tela.w - 4 || r.y + r.h > tela.h - 4 || bate(r)) continue;
      ocup.push(r);
      saida.push({ w, i, x: cx, y: cy, fs, peso, lw, lh });
      break;
    }
  });
  return saida;
}
