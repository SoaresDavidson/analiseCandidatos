import type { Eleito } from "../candidatos/tipos";

// Peças que todos os jogos usam: sorteio com semente (o desafio do dia é o mesmo para
// todo mundo), o baralho de eleitos "conhecidos" e as capitais.

/** Gerador de números entre 0 e 1 a partir de uma semente de texto (mulberry32 sobre um hash FNV-1a). */
export function aleatorio(semente: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < semente.length; i++) h = Math.imul(h ^ semente.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Data local no formato "2026-10-21": a chave do desafio do dia. */
export function hoje(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Um item da lista; `rnd` padrão é Math.random. Lista vazia devolve undefined. */
export const sortear = <T>(lista: readonly T[], rnd: () => number = Math.random): T | undefined =>
  lista[Math.floor(rnd() * lista.length)];

/** Prefeitos, deputados, governadores e senadores: os vereadores (12 mil) ficam fora dos
 *  jogos de adivinhar, porque quase ninguém os conhece fora da própria cidade. */
export const conhecido = (e: Eleito): boolean => e.cargo !== 13;

/** Código IBGE das 6 capitais do recorte. */
export const CAPITAIS: ReadonlySet<number> = new Set([1302603, 5208707, 2111300, 5103403, 4314902, 2800308]);

/** Vitórias na carreira (candidaturas com resultado "eleito"). */
export const vitorias = (e: Eleito): number => e.carreira.filter(c => c.res === 0).length;
