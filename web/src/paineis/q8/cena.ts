// Geometria da cena do Congresso (Pergunta 8): onde fica cada um dos 100 bonequinhos dentro da
// cúpula (outras fontes) e da cumbuca (fundo público). Medidas no viewBox de 1200 × 440.

export const CENA = {
  w: 1200,
  h: 440,
  /** altura da laje onde a cúpula e a cumbuca se apoiam */
  laje: 300,
  cupula: { cx: 300, rx: 180, ry: 128 },
  /** `borda` é a altura da boca */
  cumbuca: { cx: 900, rx: 205, ry: 122, borda: 178 },
} as const;

/** Tamanho do boneco e a distância entre vizinhos. */
/** O desenho do boneco tem 10 × 14; `escala` o leva ao tamanho da cena. */
export const BONECO = { escala: 1.35, w: 13.5, h: 18.9, passoX: 14.5, passoY: 18.5 };

type Ponto = [x: number, y: number];

/** Uma fileira centrada em `cx`, do meio para as pontas (fileira incompleta fica no meio). */
function fileira(cx: number, y: number, meiaLargura: number): Ponto[] {
  const n = Math.floor((2 * meiaLargura) / BONECO.passoX);
  return Array.from({ length: n }, (_, j) => (j - (n - 1) / 2) * BONECO.passoX)
    .sort((a, b) => Math.abs(a) - Math.abs(b) || a - b)
    .map(dx => [cx + dx, y] as Ponto);
}

/** Os pés de cada boneco na cúpula (meia-elipse com a base na laje), de baixo para cima. */
export function lugaresNaCupula(n = 100): Ponto[] {
  const { cx, rx, ry } = CENA.cupula;
  const r: Ponto[] = [];
  for (let k = 0; r.length < n; k++) {
    const topo = 2 + k * BONECO.passoY + BONECO.h; // a cabeça é o ponto mais apertado
    if (topo >= ry) break;
    r.push(...fileira(cx, CENA.laje - 2 - k * BONECO.passoY, rx * Math.sqrt(1 - (topo / ry) ** 2) - 4));
  }
  return r.slice(0, n);
}

/** Os pés de cada boneco na cumbuca (meia-elipse com a boca para cima), do fundo para a boca. */
export function lugaresNaCumbuca(n = 100): Ponto[] {
  const { cx, rx, ry, borda } = CENA.cumbuca;
  const r: Ponto[] = [];
  for (let k = 0; r.length < n; k++) {
    const pes = CENA.laje - 4 - k * BONECO.passoY - borda; // os pés são o ponto mais apertado
    if (pes - BONECO.h < 0) break;
    r.push(...fileira(cx, borda + pes, rx * Math.sqrt(1 - (pes / ry) ** 2) - 4));
  }
  return r.slice(0, n);
}
