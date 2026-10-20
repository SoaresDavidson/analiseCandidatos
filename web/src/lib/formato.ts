// Formatação de números em pt-BR, igual em todos os painéis. "–" marca ausência de dado.

export const fmt = (x: number | null | undefined, casas = 1): string =>
  x == null || Number.isNaN(x) ? "–" : x.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

export const int = (x: number): string => Math.round(x).toLocaleString("pt-BR");

/** Porcentagem de a em b; null quando b não é positivo. */
export const pc = (a: number, b: number): number | null => (b > 0 ? (100 * a) / b : null);

/** Reais por extenso curto: "R$ 1,2 milhão", "R$ 35 mil", "R$ 870". */
export function brl(v: number | null | undefined): string {
  if (v == null) return "–";
  const a = Math.abs(v);
  if (a >= 1e9) return `R$ ${fmt(v / 1e9, 1)} ${a < 2e9 ? "bilhão" : "bilhões"}`;
  if (a >= 1e6) return `R$ ${fmt(v / 1e6, a >= 1e7 ? 0 : 1)} ${a < 2e6 ? "milhão" : "milhões"}`;
  if (a >= 1e4) return `R$ ${fmt(v / 1e3, 0)} mil`;
  return `R$ ${int(v)}`;
}

const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e", "di", "du", "del"]);
/** "MARIA DA SILVA" -> "Maria da Silva" (o TSE grava os nomes em caixa alta). */
export const nomeProprio = (s: string | null | undefined): string =>
  (s || "")
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i && PARTICULAS.has(w) ? w : w.replace(/(^|[-'])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase())))
    .join(" ");
