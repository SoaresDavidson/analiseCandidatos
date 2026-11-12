import { pc } from "../../lib/formato";
import type { Dados2026, LinhaPatrimonio } from "./tipos";

export const CARGO: Record<number, string> = { 3: "Governador", 5: "Senador", 6: "Dep. federal", 7: "Dep. estadual" };
export const CARGO_PLURAL: Record<number, string> = {
  3: "governadores",
  5: "senadores",
  6: "deputados federais",
  7: "deputados estaduais",
};
/** Os cargos em que há voto de legenda (os proporcionais). */
export const PROPORCIONAL = new Set([6, 7]);
export const CANAL = [
  "Material impresso",
  "Campanha de rua",
  "Rádio e TV",
  "Adesivos",
  "Internet",
  "Jingle",
  "Carro de som",
  "Jornal e revista",
];

type Linha = readonly [number, number, ...unknown[]];

/** A linha de uma tabela para o ano, o lugar (-1 = país) e o cargo. */
export function achar<T extends Linha>(tabela: readonly T[], ano: number, uf: number, cargo?: number): T | undefined {
  return tabela.find(l => l[0] === ano && l[1] === uf && (cargo == null || l[2] === cargo));
}

/** Custo da cadeira: despesa de todos os candidatos ÷ vagas, em reais de 2024 quando há o fator. */
export function custoCadeira(D: Dados2026, ano: number, uf: number, cargo: number): number | null {
  const l = achar(D.custo, ano, uf, cargo);
  return l && l[3] > 0 ? (l[4] / l[3]) * (l[5] ?? 1) : null;
}

/** Eleitos em cada 100 candidatos do quinto mais rico e do mais pobre (entre quem declarou bens). */
export function chancePorPatrimonio(tabela: readonly LinhaPatrimonio[], ano: number, uf: number, cargo: number) {
  const do_ = (quinto: number) => {
    const l = tabela.find(x => x[0] === ano && x[1] === uf && x[2] === cargo && x[3] === quinto);
    return l ? { n: l[4], taxa: pc(l[5], l[4]) } : { n: 0, taxa: null };
  };
  return { pobres: do_(1), ricos: do_(5) };
}

/** A parte de cada tipo de propaganda no gasto, em %, do maior para o menor. */
export function partesDaPropaganda(valores: readonly number[] | undefined): { canal: number; pct: number }[] {
  if (!valores) return [];
  const total = valores.reduce((s, v) => s + v, 0);
  if (!total) return [];
  return valores.map((v, canal) => ({ canal, pct: (100 * v) / total })).sort((a, b) => b.pct - a.pct);
}
