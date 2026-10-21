import { pc } from "../../lib/formato";
import type { Ano, Corte, Faixa, LinhaEleitos, Municipio } from "./tipos";

// Funções puras do painel: grupos por terço de idade, alternância, voto por faixa, correlação e cores do mapa.

export const TERCO = ["Cidades mais jovens", "Intermediárias", "Cidades mais velhas"];
export const TERCO_CURTO = ["mais jovens", "intermediárias", "mais velhas"];
/** Os 3 terços: um tom de verde do claro ao escuro (níveis 1, 3 e 4 do tema). */
export const TERCO_COR = ["var(--color-nivel-1)", "var(--color-nivel-3)", "var(--color-nivel-4)"];

/** Mapa: idade média da população em 5 classes sequenciais. */
export const PASSOS = [32, 35, 38, 41];
export const MAPA_COR = ["#e4ecc6", "#bcd07a", "#8ea83a", "#5e7a12", "#32440a"];
export const corIdade = (v: number | null): string => {
  if (v == null) return "var(--color-sem-dado)";
  const i = PASSOS.findIndex(p => v < p);
  return MAPA_COR[i < 0 ? MAPA_COR.length - 1 : i];
};

/** Índice da eleição municipal nos vetores por ano: 2020 -> 0, 2024 -> 1. */
export const indiceAno = (ano: Ano): 0 | 1 => (ano === 2020 ? 0 : 1);
export const anoAnterior = (ano: Ano): number => (ano === 2020 ? 2016 : 2020);

/** Média dos valores presentes; null se não houver nenhum. */
export function media(xs: readonly (number | null | undefined)[]): number | null {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

/** Média pesada: ignora valor nulo e peso zero. */
export function pesada(xs: readonly (number | null | undefined)[], ws: readonly number[]): number | null {
  let s = 0,
    w = 0;
  xs.forEach((x, i) => {
    if (x != null && ws[i]) {
      s += x * ws[i];
      w += ws[i];
    }
  });
  return w ? s / w : null;
}

/** Correlação de Pearson; null com menos de 3 pontos. */
export function pearson(a: readonly number[], b: readonly number[]): number | null {
  const n = a.length;
  if (n < 3) return null;
  const ma = a.reduce((s, x) => s + x, 0) / n,
    mb = b.reduce((s, x) => s + x, 0) / n;
  let sab = 0,
    saa = 0,
    sbb = 0;
  for (let i = 0; i < n; i++) {
    sab += (a[i] - ma) * (b[i] - mb);
    saa += (a[i] - ma) ** 2;
    sbb += (b[i] - mb) ** 2;
  }
  return sab / Math.sqrt(saa * sbb);
}

/** "nada", "pouco"... conforme o tamanho da correlação. */
export function forcaCorrelacao(r: number | null): string {
  if (r == null) return "";
  const a = Math.abs(r);
  return a < 0.1 ? "nada" : a < 0.3 ? "pouco" : a < 0.5 ? "moderadamente" : "bastante";
}

export const doFiltro = (M: readonly Municipio[], uf: string): Municipio[] =>
  M.filter(m => uf === "TODAS" || m.uf === uf);

export const tercoDe = (m: Municipio, corte: Corte): number | null => (corte === "uf" ? m.tercoUf : m.terco);

/** Divide as cidades nos 3 terços de idade (cidades sem terço ficam de fora). */
export function grupos(ms: readonly Municipio[], corte: Corte): [Municipio[], Municipio[], Municipio[]] {
  const g: [Municipio[], Municipio[], Municipio[]] = [[], [], []];
  for (const m of ms) {
    const t = tercoDe(m, corte);
    if (t != null && t >= 1 && t <= 3) g[t - 1].push(m);
  }
  return g;
}

export interface Troca {
  /** cidades com a informação */
  n: number;
  /** cidades em que o partido do prefeito mudou */
  t: number;
  pc: number | null;
}

/** Alternância de poder: quantas cidades trocaram o partido do prefeito naquela eleição. */
export function troca(ms: readonly Municipio[], ano: Ano): Troca {
  const v = ms.map(m => m.troca[indiceAno(ano)]).filter(x => x != null);
  const t = v.filter(Boolean).length;
  return { n: v.length, t, pc: pc(t, v.length) };
}

export interface VotoGrupo {
  /** % de eleitores jovens */
  aj: number | null;
  /** % de eleitores 60+ */
  ai: number | null;
  /** % dos votos para candidatos jovens */
  vj: number | null;
  /** % dos votos para candidatos 60+ */
  vi: number | null;
}

/** Parcela de eleitores e de votos por faixa, pesada pelos aptos e pelos votos. */
export function votoGrupo(ms: readonly Municipio[], ano: Ano): VotoGrupo {
  const vs = ms.map(m => m.voto[indiceAno(ano)]).filter(v => v != null);
  const aptos = vs.map(v => v[0]),
    votos = vs.map(v => v[3]);
  // cidade sem candidato da faixa: a parcela vem vazia; nos votos ela conta como 0%
  return {
    aj: pesada(
      vs.map(v => v[1]),
      aptos,
    ),
    ai: pesada(
      vs.map(v => v[2]),
      aptos,
    ),
    vj: pesada(
      vs.map(v => v[4] ?? 0),
      votos,
    ),
    vi: pesada(
      vs.map(v => v[5] ?? 0),
      votos,
    ),
  };
}

/** Reeleição: % dos prefeitos que tentaram e % dos que tentaram e venceram. */
export function reeleicao(ms: readonly Municipio[], ano: Ano): { tentou: number | null; venceu: number | null } {
  const i = indiceAno(ano);
  const conc = ms.map(m => m.conc[i]).filter(x => x != null);
  const re = ms.filter(m => m.conc[i] && m.reel[i] != null);
  return {
    tentou: pc(conc.filter(Boolean).length, conc.length),
    venceu: pc(re.filter(m => m.reel[i]).length, re.length),
  };
}

/** Séries da régua de idades: nome, cor e a idade de cada cidade. */
export const SERIES_IDADE: readonly { nome: string; cor: string; valor: (m: Municipio) => number | null }[] = [
  { nome: "População (Censo 2022)", cor: "#cfc8b8", valor: m => m.idade },
  { nome: "Eleitorado (2024)", cor: "var(--color-verde)", valor: m => m.idEl },
  { nome: "Vereadores eleitos (2024)", cor: "var(--color-ouro)", valor: m => m.idVer },
  { nome: "Prefeitos eleitos (2024)", cor: "var(--color-texto)", valor: m => m.idPref },
];

/** Idade média de cada série em cada terço: matriz [terço][série]. */
export const idadesPorGrupo = (g: readonly (readonly Municipio[])[]): (number | null)[][] =>
  g.map(ms => SERIES_IDADE.map(s => media(ms.map(s.valor))));

export interface PontoDisp {
  m: Municipio;
  x: number;
  y: number;
}

/** Cada cidade: parcela do eleitorado na faixa (x) × parcela dos votos para candidatos da faixa (y). */
export function pontosDispersao(ms: readonly Municipio[], ano: Ano, faixa: Faixa) {
  const k = faixa === "jovem" ? [1, 4] : [2, 5];
  const todos = ms.flatMap(m => {
    const v = m.voto[indiceAno(ano)];
    return v ? [{ m, x: v[k[0]] as number | null, y: v[k[1]] as number | null }] : [];
  });
  const pontos = todos.filter((p): p is PontoDisp => p.x != null && p.y != null);
  return {
    pontos,
    semCand: todos.length - pontos.length,
    r: pearson(
      pontos.map(p => p.x),
      pontos.map(p => p.y),
    ),
  };
}

/** Limite dos eixos da dispersão: o maior valor arredondado para cima de 5 em 5 (mínimo 10). */
export const limiteEixo = (pontos: readonly PontoDisp[]): number =>
  Math.ceil(Math.max(...pontos.map(p => Math.max(p.x, p.y)), 10) / 5) * 5;

export interface LinhaCargo {
  cargo: number;
  ano: number;
  idadeCand: number | null;
  idadeEleitos: number | null;
  eleitosJovens: number | null;
  eleitos60: number | null;
  chanceJovem: number | null;
  chanceMeio: number | null;
  chance60: number | null;
}

export const CARGOS_TABELA = ["Vereador", "Prefeito", "Dep. estadual", "Dep. federal"];
const ORDEM_CARGOS: [number, number[]][] = [
  [0, [2020, 2024]],
  [1, [2020, 2024]],
  [2, [2018, 2022]],
  [3, [2018, 2022]],
];

/** Idade dos eleitos por cargo e ano; `iu` é o índice do estado (-1 = todos). */
export function linhasEleitos(eleitos: readonly LinhaEleitos[], iu: number): LinhaCargo[] {
  const n = (x: number | null | undefined) => x ?? 0;
  const soma = (v: number[]) => v.reduce((s, x) => s + x, 0);
  const linhas: LinhaCargo[] = [];
  for (const [c, anos] of ORDEM_CARGOS)
    for (const a of anos) {
      const rs = eleitos.filter(r => r[0] === a && r[2] === c && (iu < 0 || r[1] === iu));
      if (!rs.length) continue;
      const qc = rs.map(r => n(r[3])),
        qe = rs.map(r => n(r[4]));
      // chance de vencer por faixa: eleitos da faixa ÷ candidatos da faixa, somados nos estados
      const cj = rs.map(r => (n(r[3]) * n(r[7])) / 100),
        ci = rs.map(r => (n(r[3]) * n(r[9])) / 100),
        ej = rs.map((r, i) => (cj[i] * n(r[11])) / 100),
        ei = rs.map((r, i) => (ci[i] * n(r[13])) / 100),
        cm = rs.map((r, i) => n(r[3]) - cj[i] - ci[i]),
        em = rs.map((r, i) => (cm[i] * n(r[12])) / 100);
      linhas.push({
        cargo: c,
        ano: a,
        idadeCand: pesada(
          rs.map(r => r[5]),
          qc,
        ),
        idadeEleitos: pesada(
          rs.map(r => r[6]),
          qe,
        ),
        eleitosJovens: pesada(
          rs.map(r => r[8]),
          qe,
        ),
        eleitos60: pesada(
          rs.map(r => r[10]),
          qe,
        ),
        chanceJovem: pc(soma(ej), soma(cj)),
        chanceMeio: pc(soma(em), soma(cm)),
        chance60: pc(soma(ei), soma(ci)),
      });
    }
  return linhas;
}
