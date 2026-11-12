import type { Municipio } from "./tipos";

// Cores dos partidos no mapa. Um mapa pinta áreas vizinhas, então todo par de cores precisa
// ser distinguível, também para daltônicos: só 5 cores passam juntas nas verificações
// (paleta validada). Elas ficam com os 5 partidos que mais elegeram prefeitos no país em 2024;
// os demais entram como "outros partidos" (o nome aparece no balão e no relatório).
// A cor é do partido, não da posição: não muda quando o filtro muda.
export const COR_PARTIDO: Record<string, string> = {
  PSD: "#2a78d6",
  MDB: "#1baf7a",
  PP: "#eda100",
  UNIÃO: "#c2378e",
  PL: "#a0522d",
};
export const COR_OUTROS = "#bdb9ae";
export const COR_SEM_PREFEITO = "#eceae5";
export const PARTIDOS_COM_COR = Object.keys(COR_PARTIDO);

export const corPartido = (sg: string | null | undefined): string =>
  !sg ? COR_SEM_PREFEITO : (COR_PARTIDO[sg] ?? COR_OUTROS);

/** Fatias de um conjunto de cidades pelo partido do prefeito: os 5 com cor, na ordem fixa, e "outros". */
export function fatias(xs: readonly Municipio[]): { sg: string; n: number; pct: number; cor: string }[] {
  const com = xs.filter(m => m.pref);
  if (!com.length) return [];
  const out = PARTIDOS_COM_COR.map(sg => ({ sg, n: com.filter(m => m.pref === sg).length }));
  out.push({ sg: "Outros", n: com.length - out.reduce((s, x) => s + x.n, 0) });
  return out
    .filter(x => x.n > 0)
    .map(x => ({ ...x, pct: (100 * x.n) / com.length, cor: corPartido(x.sg === "Outros" ? "?" : x.sg) }));
}
