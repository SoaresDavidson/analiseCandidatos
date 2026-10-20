export { maiusculaInicial, nomeLugar } from "../../lib/formato";

import { fmt } from "../../lib/formato";
import type { Filtros, Notas, Par } from "./tipos";

export const UF_NOME: Record<string, string> = {
  AM: "Amazonas",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  RS: "Rio Grande do Sul",
  SE: "Sergipe",
};
export const CATS = [
  "extrema esquerda",
  "esquerda",
  "centro-esquerda",
  "centro",
  "centro-direita",
  "direita",
  "extrema direita",
];
export const CAT_COR = ["#8a0f16", "#c53d33", "#e57f68", "#dcd9d1", "#73a7d4", "#2f72b4", "#0c3f7c"];
const CORTES = [1.5, 3, 4.49, 5.5, 7, 8.5];
export const catDe = (v: number): number => {
  const i = CORTES.findIndex(c => v <= c);
  return i < 0 ? 6 : i;
};

// cor da mudança: vermelho = foi à esquerda, azul = à direita, cinza = quase nada
export const PASSOS = [-0.75, -0.25, -0.05, 0.05, 0.25, 0.75];
export const DIF_COR = ["#8a0f16", "#c53d33", "#e57f68", "#e8e5de", "#73a7d4", "#2f72b4", "#0c3f7c"];
export const corDif = (d: number | null): string => {
  if (d == null) return "var(--color-sem-dado)";
  const i = PASSOS.findIndex(p => d < p);
  return DIF_COR[i < 0 ? 6 : i];
};

/** Cada par compara o mesmo cargo: [coluna A, coluna B, cargo, ano A, ano B]. */
export const PARES: Record<Par, [number, number, string, string, string]> = {
  mun: [1, 3, "vereador", "2020", "2024"],
  ger: [0, 2, "deputado federal", "2018", "2022"],
};

// Neste painel o número tem 2 casas por padrão (o kit usa 1).
export const f2 = (x: number | null | undefined, d = 2): string => fmt(x, d);
export const sinal = (x: number | null | undefined, d = 2): string =>
  x == null ? "–" : (x > 0 ? "+" : x < 0 ? "−" : "") + fmt(Math.abs(x), d);
export const semAcento = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Nome próprio como no painel original (trata "d'Oeste"). */

export const ondeUf = (uf: string): string =>
  uf === "TODAS" ? "nos 6 estados" : (["AM", "MA", "MT", "RS"].includes(uf) ? "no " : "em ") + UF_NOME[uf];

type ComNotas = { rodada: Notas; fixa: Notas };
type Visao = Pick<Filtros, "par" | "regua">;

export const notasDe = (x: ComNotas, f: Visao): Notas => x[f.regua];

/** Mudança de nota entre as duas eleições do par, na régua escolhida. */
export function mudanca(x: ComNotas, f: Visao): number | null {
  const [a, b] = PARES[f.par],
    n = x[f.regua];
  return n[a] == null || n[b] == null ? null : n[b] - n[a];
}

/** Escalas de um gráfico de linhas: x em 4 passos, y entre lo e hi. */
export function escalas(W: number, H: number, L: number, R: number, T: number, B: number, lo: number, hi: number) {
  return {
    X: (i: number) => L + ((W - L - R) * i) / 3,
    Y: (v: number) => T + (H - T - B) * (1 - (v - lo) / (hi - lo)),
  };
}

/** Valores de 0,5 em 0,5 entre lo e hi (linhas de grade). */
export function degraus(lo: number, hi: number): number[] {
  const r: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += 0.5) r.push(v);
  return r;
}

/** Pontos de uma série, sem as eleições que não têm nota; i é o índice do ano. */
export function pontos(serie: Notas, X: (i: number) => number, Y: (v: number) => number) {
  return serie.flatMap((v, i) => (v == null ? [] : [{ x: X(i), y: Y(v), v, i }]));
}
