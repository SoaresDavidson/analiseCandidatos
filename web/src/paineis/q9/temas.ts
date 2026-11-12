import { TODOS_CANAIS } from "./dominio";
import { FOLGA_TEXTO, type Folga } from "./layoutNuvem";

/** Cada tipo de gasto veste a nuvem com uma cena própria. */
export type Tema = "todos" | "impresso" | "rua" | "internet" | "radiotv" | "adesivos";

const POR_CANAL: Record<number, Tema> = {
  [TODOS_CANAIS]: "todos",
  0: "impresso",
  1: "rua",
  2: "radiotv",
  3: "adesivos",
  4: "internet",
};
export const temaDoCanal = (canal: number): Tema => POR_CANAL[canal] ?? "todos";

/** Fonte das palavras: a internet usa letra de terminal; o resto herda a da página. */
export const FONTE_TERMINAL = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

/** Quanto espaço cada palavra reserva: adesivo tem papel em volta, cartaz tem moldura. */
export const FOLGA: Record<Tema, Folga> = {
  todos: FOLGA_TEXTO,
  impresso: FOLGA_TEXTO,
  internet: FOLGA_TEXTO,
  radiotv: FOLGA_TEXTO,
  // só os cartazes (as palavras mais citadas); a altura inclui o cabo
  rua: { x: 0.32, y: 0.32 },
  adesivos: { x: 0.5, y: 0.22 },
};

/** Papéis dos adesivos (post-its e etiquetas). */
export const PAPEIS = ["#ffe066", "#ff9ecb", "#8fd3ff", "#b6ec8a", "#ffb86b", "#ffffff"];
/** Cores das bandeiras da passeata: as do painel, sem cor de partido. */
export const BANDEIRAS = ["#ebb400", "#5e7a12", "#c0392b", "#2f72b4", "#9eb735", "#ffffff"];

/** Número pseudoaleatório estável (0 a 1) para a palavra `t`, variando com `sal`: a cena não muda a cada render. */
export function sorte(t: number, sal: number): number {
  let x = Math.imul(t + 1, 374761393) + Math.imul(sal, 668265263);
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x ^= x >>> 16;
  return ((x >>> 0) % 10000) / 10000;
}
