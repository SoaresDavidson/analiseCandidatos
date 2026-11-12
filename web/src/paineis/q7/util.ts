import { CATEGORIAS, categoria } from "../../lib/espectro";
import { fmt } from "../../lib/formato";
import type { Filtros, Municipio, Notas, Par } from "./tipos";

// A cor do lado: a mesma no chão e no mapa. Vermelho à esquerda, cinza no centro (nota 5) e azul
// à direita; os tons de azul mudam mais rápido entre 5,5 e 8,5, onde está quase todo o país.
const ANCORAS: readonly (readonly [number, string])[] = [
  [0, "#6d0b12"],
  [3, "#c53d33"],
  [4.5, "#edb5a6"],
  [5, "#e4e1d9"],
  [5.5, "#c5dcef"],
  [6.5, "#73a7d4"],
  [7.5, "#2f72b4"],
  [8.5, "#0c3f7c"],
  [10, "#06264d"],
];
/** As paradas do degradê do chão: posição de 0 a 1 e a cor. */
export const PARADAS = ANCORAS.map(([v, cor]) => ({ em: v / 10, cor }));
const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

/** Cor de uma nota de 0 a 10 (interpolação linear entre as âncoras, como o degradê do SVG). */
export function corNota(v: number | null | undefined): string {
  if (v == null) return "var(--color-sem-dado)";
  const x = Math.max(0, Math.min(10, v));
  const i = Math.max(
    1,
    ANCORAS.findIndex(([a]) => a >= x),
  );
  const [v0, c0] = ANCORAS[i - 1],
    [v1, c1] = ANCORAS[i];
  const k = (x - v0) / (v1 - v0),
    a = rgb(c0),
    b = rgb(c1);
  return `rgb(${a.map((n, j) => Math.round(n + (b[j] - n) * k)).join(" ")})`;
}

/** "na centro-direita", "no centro", "na extrema esquerda". */
export function naCategoria(v: number | null | undefined): string {
  const c = categoria(v);
  return c < 0 ? "sem nota" : `${c === 3 ? "no" : "na"} ${CATEGORIAS[c]}`;
}

// cor da mudança: vermelho = foi à esquerda, azul = à direita, cinza = quase nada
export const PASSOS = [-0.75, -0.25, -0.05, 0.05, 0.25, 0.75];
export const DIF_COR = ["#8a0f16", "#c53d33", "#e57f68", "#e8e5de", "#73a7d4", "#2f72b4", "#0c3f7c"];
export const corDif = (d: number | null): string => {
  if (d == null) return "var(--color-sem-dado)";
  const i = PASSOS.findIndex(p => d < p);
  return DIF_COR[i < 0 ? 6 : i];
};

/** Cada par compara o mesmo cargo: [índice do ano A, do ano B, cargo, ano A, ano B]. */
export const PARES: Record<Par, [number, number, string, string, string]> = {
  mun: [1, 3, "vereador", "2020", "2024"],
  ger: [0, 2, "deputado federal", "2018", "2022"],
};

/** Índice (0 a 3) da eleição que está na tela. */
export const anoDe = (f: Pick<Filtros, "par" | "quando">): number => PARES[f.par][f.quando];

// Neste painel o número tem 2 casas por padrão (o kit usa 1).
export const f2 = (x: number | null | undefined, d = 2): string => fmt(x, d);
export const sinal = (x: number | null | undefined, d = 2): string =>
  x == null ? "–" : (x > 0 ? "+" : x < 0 ? "−" : "") + fmt(Math.abs(x), d);

/** Mudança de nota entre as duas eleições do par. */
export function mudanca(x: { notas: Notas }, par: Par): number | null {
  const [a, b] = PARES[par],
    n = x.notas;
  return n[a] == null || n[b] == null ? null : n[b] - n[a];
}

/** Menos de 0,05 ponto é "quase nada" (a faixa cinza do mapa). */
export const QUASE_NADA = 0.05;
export const paraOnde = (d: number): string =>
  Math.abs(d) < QUASE_NADA ? "quase não saiu do lugar" : d > 0 ? "foi para a direita" : "foi para a esquerda";

/** Cidades do estado (ou do país) que têm voto nas duas eleições do par. */
export const comMudanca = (M: Municipio[], uf: string | null, par: Par): Municipio[] =>
  M.filter(m => (!uf || m.uf === uf) && mudanca(m, par) != null);

/** Quantas cidades foram para cada lado e quantas se mexeram mais de 0,25 ponto. */
export function resumo(ms: Municipio[], par: Par) {
  let direita = 0,
    forteDireita = 0,
    forteEsquerda = 0;
  for (const m of ms) {
    const d = mudanca(m, par)!;
    if (d > 0) direita++;
    if (d > 0.25) forteDireita++;
    if (d < -0.25) forteEsquerda++;
  }
  return { n: ms.length, direita, forteDireita, forteEsquerda };
}
