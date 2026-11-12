// A ordem das aberturas do livro: sumário, o Brasil, os 27 estados (por região, em ordem
// alfabética dentro dela) e as notas. Cada abertura são duas páginas: a da esquerda é par.
import { REGIOES, UF_NOME } from "../../lib/uf";

export type Capitulo =
  | { tipo: "sumario" }
  | { tipo: "brasil" }
  | { tipo: "estado"; uf: string; regiao: string }
  | { tipo: "notas" };

export const ESTADOS_POR_REGIAO: readonly (readonly [string, readonly string[]])[] = REGIOES.map(([regiao, ufs]) => [
  regiao,
  [...ufs].sort((a, b) => UF_NOME[a].localeCompare(UF_NOME[b], "pt")),
]);

export const CAPITULOS: readonly Capitulo[] = [
  { tipo: "sumario" },
  { tipo: "brasil" },
  ...ESTADOS_POR_REGIAO.flatMap(([regiao, ufs]) => ufs.map(uf => ({ tipo: "estado" as const, uf, regiao }))),
  { tipo: "notas" },
];

export const INDICE_BRASIL = 1;
export const INDICE_NOTAS = CAPITULOS.length - 1;
/** Em que abertura está o capítulo do estado. */
export const indiceDoEstado = (uf: string): number => CAPITULOS.findIndex(c => c.tipo === "estado" && c.uf === uf);
/** Número da página da esquerda de uma abertura (a da direita é a seguinte). */
export const paginaDe = (indice: number): number => 2 * indice;

/** Nome que vai no alto da página da direita. */
export function nomeDoCapitulo(c: Capitulo): string {
  if (c.tipo === "sumario") return "Sumário";
  if (c.tipo === "brasil") return "O Brasil";
  if (c.tipo === "notas") return "Notas e fontes";
  return UF_NOME[c.uf];
}
