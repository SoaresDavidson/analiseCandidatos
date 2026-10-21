import { semAcento } from "../../lib/uf";

export { maiusculaInicial, nomeLugar } from "../../lib/formato";

import { fmt, int, nomeLugar } from "../../lib/formato";
import type { ChaveIndice, DadosQ3, Indice, Municipio } from "./tipos";

export const PERFIL = ["Agropecuária", "Administração pública", "Serviços e comércio", "Indústria e outros"];

// Formatador local: o brl deste painel só chega até "mil" (o do kit vai a milhões).
export const brl = (v: number | null | undefined): string =>
  v == null ? "–" : v >= 1e3 ? `R$ ${fmt(v / 1e3, v >= 1e5 ? 0 : 1)} mil` : `R$ ${int(v)}`;
const reais = (v: number | null): string => (v == null ? "–" : `R$ ${int(v)}`);

export const INDICES: Record<ChaveIndice, Indice> = {
  pib: {
    rot: "PIB per capita",
    curto: "PIB per capita",
    v: m => m.pib,
    f: brl,
    log: true,
    frase: "riqueza (PIB per capita)",
  },
  renda: {
    rot: "renda domiciliar per capita (Censo 2022)",
    curto: "renda per capita",
    v: m => m.renda,
    f: reais,
    log: true,
    frase: "renda das famílias",
  },
  isentos: {
    rot: "isentos (abstenção + brancos + nulos)",
    curto: "isentos",
    v: m => m.isentos,
    f: v => `${fmt(v)}%`,
    log: false,
    frase: "taxa de isentos",
  },
  eleitores: {
    rot: "eleitores por habitante",
    curto: "eleitores por habitante",
    v: m => m.eleitHab,
    f: v => fmt(v, 2),
    log: false,
    frase: "proporção de eleitores por habitante",
  },
};

export function montarMunicipios(D: DadosQ3): Municipio[] {
  // eleitores por habitante pelos números inteiros (aptos ÷ população): arredondada, 1,0003 virava 1,000
  return D.municipios.map(r => ({
    cod: r[0],
    nome: nomeLugar(r[1]),
    uf: D.ufs[r[2]],
    cap: !!r[3],
    pib: r[4],
    perfil: r[5],
    pop: r[6],
    aptos: r[7],
    renda: r[8],
    estudo: r[9],
    pref: r[10],
    banc: r[11],
    qtBanc: r[12],
    empate: !!r[13],
    voto: r[14],
    eleitHab: r[6] && r[7] ? r[7] / r[6] : r[15],
    isentos: r[16],
    busca: semAcento(r[1]),
  }));
}

// correlação de postos (Spearman), com empates pela média dos postos
function postos(xs: number[]): number[] {
  const o = xs.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const r: number[] = Array(xs.length);
  for (let i = 0; i < o.length; ) {
    let j = i;
    while (j + 1 < o.length && o[j + 1][0] === o[i][0]) j++;
    for (let k = i; k <= j; k++) r[o[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return r;
}
export function spearman(a: number[], b: number[]): number {
  const ra = postos(a),
    rb = postos(b),
    n = a.length,
    ma = (n + 1) / 2;
  let sab = 0,
    saa = 0,
    sbb = 0;
  for (let i = 0; i < n; i++) {
    sab += (ra[i] - ma) * (rb[i] - ma);
    saa += (ra[i] - ma) ** 2;
    sbb += (rb[i] - ma) ** 2;
  }
  return sab / Math.sqrt(saa * sbb);
}

/** Conta prefeitos eleitos por partido, do mais frequente ao menos (empate: ordem alfabética). */
export function contarPref(xs: Municipio[]): [string, number][] {
  const c: Record<string, number> = {};
  xs.forEach(x => {
    if (x.pref) c[x.pref] = (c[x.pref] || 0) + 1;
  });
  return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Divide em 5 grupos do mesmo tamanho, em ordem crescente de `v`. */
export function dividirQuintos(xs: Municipio[], v: (m: Municipio) => number | null): Municipio[][] {
  const o = xs.filter(m => v(m) != null).sort((a, b) => v(a)! - v(b)!);
  const q: Municipio[][] = [[], [], [], [], []];
  o.forEach((m, i) => q[Math.min(4, Math.floor((5 * i) / o.length))].push(m));
  return q;
}
