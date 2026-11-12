import { mediana } from "../../lib/estatistica";
import { fmt, pc } from "../../lib/formato";
import type { DadosQ1, Soma, UeQ1 } from "./tipos";

export { anoAoTrocarCargo, anosDoCargo, CARGO_NOME, CARGO_ROT } from "../../lib/cargos";

/** Cargo municipal (vereador, prefeito): a UE é o município. */
export const municipal = (cargo: number): boolean => cargo <= 1;

/** As UEs de cargo, ano e estado ("TODAS" = o país). UF desconhecida: lista vazia. */
export function filtrar(D: DadosQ1, cargo: number, ano: number, uf: string): UeQ1[] {
  const todas = uf === "TODAS",
    iu = D.ufs.indexOf(uf);
  return D.ues.filter(u => u[0] === ano && u[1] === cargo && (todas || u[2] === iu));
}

/** Custo da cadeira de uma UE: despesa ÷ vagas. */
export const custoUe = (u: UeQ1): number => u[8] / u[5];

/** Soma as UEs: o custo do conjunto é a soma do gasto ÷ a soma das vagas (não a média dos custos). */
export function somar(ues: readonly UeQ1[]): Soma {
  let vagas = 0,
    despesaComEleito = 0,
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
    if (u[7] > 0) despesaComEleito += u[8];
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
    // só nas UEs com eleito: a despesa de UE sem resultado não entra no denominador
    pcEleitos: pc(despesaEleitos, despesaComEleito),
    mediana: mediana(ues.map(custoUe)),
  };
}

/** Reais da época em reais de agosto de 2024; null se faltar o valor ou o IPCA do ano. */
export function em2024(D: DadosQ1, ano: number, v: number | null): number | null {
  const fator = D.ipca[ano];
  return v == null || fator == null ? null : v * fator;
}

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

/** Chave de `somasPorFiltro`: cargo, ano e UF ("TODAS" = o país). */
export const chaveSoma = (cargo: number, ano: number, uf: string): string => `${cargo}|${ano}|${uf}`;

/** Soma de cada cargo, ano e UF (e "TODAS") de uma vez, para os painéis não refiltrarem a cada linha. */
export function somasPorFiltro(D: DadosQ1): Map<string, Soma> {
  const grupos = new Map<string, UeQ1[]>();
  const poe = (k: string, u: UeQ1) => {
    const g = grupos.get(k);
    if (g) g.push(u);
    else grupos.set(k, [u]);
  };
  for (const u of D.ues) {
    poe(chaveSoma(u[1], u[0], D.ufs[u[2]]), u);
    poe(chaveSoma(u[1], u[0], "TODAS"), u);
  }
  return new Map([...grupos].map(([k, g]) => [k, somar(g)]));
}
