import { fmt, int, pc } from "../../lib/formato";
import type { DadosQ9, Filtros, Palavra } from "./tipos";

export const UF_NOME: Record<string, string> = {
  AM: "Amazonas",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  RS: "Rio Grande do Sul",
  SE: "Sergipe",
};
export const CARGO = ["Vereador", "Prefeito", "Dep. estadual", "Dep. federal", "Senador", "Governador"];
export const PLUR = [
  "vereadores",
  "prefeitos",
  "deputados estaduais",
  "deputados federais",
  "senadores",
  "governadores",
];
// mesma ordem de D.canais: impresso, rua, rádio e TV, adesivo, digital, jingle, carro de som, jornal e revista
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
export const ANOS: readonly (readonly [number, string])[] = [
  [2018, "2018"],
  [2020, "2020"],
  [2022, "2022"],
  [2024, "2024"],
];
export const TODOS_CANAIS = 8;

export const cargosDoAno = (a: number): number[] => (a === 2020 || a === 2024 ? [0, 1] : [2, 3, 4, 5]);

/** Valor "R$ 1,2 milhões" do painel (difere do `brl` compartilhado: sem singular e com "mil" a partir de 1 mil). */
export const reais = (v: number): string =>
  v >= 1e6 ? `R$ ${fmt(v / 1e6, 1)} milhões` : v >= 1e3 ? `R$ ${fmt(v / 1e3, 0)} mil` : `R$ ${int(v)}`;

export const maiuscula = (s: string): string => s[0].toUpperCase() + s.slice(1);

export const indicesUf = (d: DadosQ9, uf: string): number[] =>
  uf === "TODAS" ? [0, 1, 2, 3, 4, 5] : [d.ufs.indexOf(uf)];

export const onde = (uf: string): string =>
  uf === "TODAS" ? "nos 6 estados" : (["AM", "MA", "MT", "RS"].includes(uf) ? "no " : "em ") + UF_NOME[uf];

/** Valor e nº de despesas por canal: [não eleitos / eleitos][canal]. */
export function somarCanais(d: DadosQ9, uf: string, anos: number[], cargos: number[]) {
  const v = [Array<number>(8).fill(0), Array<number>(8).fill(0)];
  const nd = [0, 0];
  const us = indicesUf(d, uf);
  for (const [a, u, c, e, k, , ndesp, vr] of d.q9c) {
    if (anos.includes(a) && cargos.includes(c) && us.includes(u)) {
      v[e][k] += vr;
      nd[e] += ndesp;
    }
  }
  return { v, nd };
}

export const chaveT = (d: DadosQ9, f: Filtros, eleito: number, canal: number): string =>
  `${f.ano}|${f.cargo}|${f.uf === "TODAS" ? 6 : d.ufs.indexOf(f.uf)}|${eleito}|${canal}`;

export function grupoT(d: DadosQ9, f: Filtros, eleito: number, canal: number): Palavra[] {
  const g = d.q9t[chaveT(d, f, eleito, canal)];
  return g ? g[0].map((t, i) => ({ t, termo: d.termos[t], n: g[1][i], vr: g[2][i] })) : [];
}

export const totalT = (d: DadosQ9, f: Filtros, eleito: number, canal: number): number =>
  d.q9tot[chaveT(d, f, eleito, canal)] || 0;

/** Valor por canal e participação (%) de cada um no gasto total de [anos] x [cargos]. */
export function participacoes(d: DadosQ9, uf: string, anos: number[], cargos: number[]) {
  const { v, nd } = somarCanais(d, uf, anos, cargos);
  const tot = v[0].map((x, k) => x + v[1][k]);
  const T = tot.reduce((a, b) => a + b, 0);
  return { v, nd, tot, T, p: tot.map(x => pc(x, T)) };
}
