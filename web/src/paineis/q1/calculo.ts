import { fmt, pc } from "../../lib/formato";
import type { DadosQ1, Soma, UeQ1 } from "./tipos";

// a ordem de `cargos` no q1.json (a mesma da Q2)
export const CARGO_ROT = ["Vereador", "Prefeito", "Dep. estadual", "Dep. federal", "Governador", "Senador"];
export const CARGO_NOME = ["vereador", "prefeito", "deputado estadual", "deputado federal", "governador", "senador"];

/** Cargo municipal (vereador, prefeito): a UE é o município. */
export const municipal = (cargo: number): boolean => cargo <= 1;

/** Eleições de cada cargo: municipais ou gerais. */
export const anosDoCargo = (cargo: number): number[] => (municipal(cargo) ? [2020, 2024] : [2018, 2022]);

/** Ao trocar de cargo, mantém a posição do ano (1ª ou 2ª eleição do cargo). */
export function anoAoTrocarCargo(cargoAntigo: number, ano: number, cargoNovo: number): number {
  const k = anosDoCargo(cargoAntigo).indexOf(ano);
  return anosDoCargo(cargoNovo)[k < 0 ? 1 : k];
}

/** As UEs de cargo, ano e estado ("TODAS" = o país). */
export function filtrar(D: DadosQ1, cargo: number, ano: number, uf: string): UeQ1[] {
  const iu = uf === "TODAS" ? -1 : D.ufs.indexOf(uf);
  return D.ues.filter(u => u[0] === ano && u[1] === cargo && (iu < 0 || u[2] === iu));
}

/** Custo da cadeira de uma UE: despesa ÷ vagas. */
export const custoUe = (u: UeQ1): number => u[8] / u[5];

export function mediana(v: number[]): number | null {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b),
    m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Soma as UEs: o custo do conjunto é a soma do gasto ÷ a soma das vagas (não a média dos custos). */
export function somar(ues: readonly UeQ1[]): Soma {
  let vagas = 0,
    candidatos = 0,
    eleitos = 0,
    despesa = 0,
    despesaEleitos = 0,
    publico = 0;
  for (const u of ues) {
    vagas += u[5];
    candidatos += u[6];
    eleitos += u[7];
    despesa += u[8];
    despesaEleitos += u[9];
    publico += u[10];
  }
  return {
    ues: ues.length,
    vagas,
    candidatos,
    eleitos,
    despesa,
    despesaEleitos,
    publico,
    custo: vagas ? despesa / vagas : null,
    custoEleito: eleitos ? despesaEleitos / eleitos : null,
    pcPublico: pc(publico, despesa),
    pcEleitos: pc(despesaEleitos, despesa),
    mediana: mediana(ues.map(custoUe)),
  };
}

/** Reais da época em reais de agosto de 2024. */
export const em2024 = (D: DadosQ1, ano: number, v: number | null): number | null =>
  v == null ? null : v * (D.ipca[ano] ?? 1);

/** As `n` UEs com a cadeira mais cara. */
export const maisCaras = (ues: readonly UeQ1[], n: number): UeQ1[] =>
  [...ues].sort((a, b) => custoUe(b) - custoUe(a)).slice(0, n);

/** Valor curto para caber ao lado da barra: "9,7 mi", "40 mil", "870" (espaço inseparável: não quebra a linha). */
export function curto(v: number): string {
  if (v >= 1e6) return `${fmt(v / 1e6, 1)}\u00a0mi`;
  if (v >= 1e4) return `${fmt(v / 1e3, 0)}\u00a0mil`;
  if (v >= 1e3) return `${fmt(v / 1e3, 1)}\u00a0mil`;
  return fmt(v, 0);
}

/** Rampa do mapa: da cadeira mais barata (verde escuro) à mais cara (amarelo). */
export const RAMPA_CUSTO = ["#2f6d31", "#6c9b2e", "#a9c23a", "#dccf3c", "#ffd21f"];

/** Cortes que dividem os valores em 5 grupos do mesmo tamanho (4 cortes); com poucos valores, repete. */
export function classes(valores: readonly number[]): number[] {
  const v = [...valores].sort((a, b) => a - b);
  if (!v.length) return [];
  return [1, 2, 3, 4].map(k => v[Math.min(v.length - 1, Math.floor((k * v.length) / 5))]);
}
