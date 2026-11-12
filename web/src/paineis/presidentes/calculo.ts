import { nomeProprio } from "../../lib/formato";
import type { Eleicao, LinhaCandidato } from "./tipos";

// A cor é do partido do candidato, não da posição: não muda de uma eleição para outra.
const COR_PARTIDO: Record<string, string> = {
  PT: "#c8372d",
  PSDB: "#3aa0e0",
  // azul-marinho, não verde: vermelho com verde não se distingue para quem é daltônico
  PSL: "#1d3f7a",
  PL: "#1d3f7a",
  PSB: "#eda100",
  PPS: "#c2378e",
  PDT: "#7a4fb0",
  PMDB: "#1baf7a",
  MDB: "#1baf7a",
  PV: "#58a13a",
  REDE: "#58a13a",
  NOVO: "#f08a24",
  PSOL: "#a8327a",
  UNIÃO: "#0b6aa2",
};
export const COR_OUTROS = "#9aa3ad";
export const corPartido = (sg: string): string => COR_PARTIDO[sg] ?? COR_OUTROS;

export interface Candidato {
  /** posição na lista da eleição (o índice usado nos votos) */
  i: number;
  sq: number;
  numero: number;
  nome: string;
  civil: string;
  partido: string;
  eleito: boolean;
  foto: boolean;
  bens: [string, number][] | null;
  cor: string;
}

export const candidato = (c: LinhaCandidato, i: number): Candidato => ({
  i,
  sq: c[0],
  numero: c[1],
  nome: nomeProprio(c[2]),
  civil: nomeProprio(c[3]),
  partido: c[4],
  eleito: c[5] === 1,
  foto: c[6] === 1,
  bens: c[7],
  cor: corPartido(c[4]),
});

export interface Linha {
  c: Candidato;
  votos: number;
  /** parte dos votos válidos, em % */
  pct: number;
}

/** Os candidatos com voto num recorte (país, estado), do mais votado ao menos votado. */
export function placar(cands: Candidato[], votos: readonly number[]): Linha[] {
  const total = votos.reduce((s, v) => s + v, 0);
  return cands
    .map(c => ({ c, votos: votos[c.i] ?? 0, pct: total ? (100 * (votos[c.i] ?? 0)) / total : 0 }))
    .filter(l => l.votos > 0)
    .sort((a, b) => b.votos - a.votos);
}

/** O turno que decidiu a eleição: o último. */
export const turnoFinal = (e: Eleicao): number => e.turnos[e.turnos.length - 1].turno;

/** Total dos bens declarados; null se o candidato não tem a declaração nos dados. */
export const patrimonio = (c: Candidato): number | null => (c.bens ? c.bens.reduce((s, b) => s + b[1], 0) : null);
