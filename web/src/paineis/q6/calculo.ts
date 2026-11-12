import { pc } from "../../lib/formato";
import type { LinhaEleitos, Municipio } from "./tipos";

// Funções puras da página: grupos por terço de idade, alternância, voto por faixa, idades e cores do mapa.

export const TERCO = ["Cidades mais jovens", "Intermediárias", "Cidades mais velhas"];
export const TERCO_CURTO = ["mais jovens", "intermediárias", "mais velhas"];

/** Mapa: idade média da população em 5 classes sequenciais (cortes perto dos quintos das cidades do país). */
export const PASSOS = [33, 35, 37, 39];
export const MAPA_COR = ["#e4ecc6", "#bcd07a", "#8ea83a", "#5e7a12", "#32440a"];
export const corIdade = (v: number | null): string => {
  if (v == null) return "var(--color-sem-dado)";
  const i = PASSOS.findIndex(p => v < p);
  return MAPA_COR[i < 0 ? MAPA_COR.length - 1 : i];
};

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

/** As cidades do estado em foco, ou todas quando o foco é o Brasil (uf = null). */
export const doFiltro = (M: readonly Municipio[], uf: string | null): Municipio[] =>
  uf ? M.filter(m => m.uf === uf) : [...M];

/** Divide as cidades nos 3 terços de idade: os do país, ou os de dentro do estado (`noEstado`).
 *  Cidades sem terço ficam de fora. */
export function grupos(ms: readonly Municipio[], noEstado: boolean): [Municipio[], Municipio[], Municipio[]] {
  const g: [Municipio[], Municipio[], Municipio[]] = [[], [], []];
  for (const m of ms) {
    const t = noEstado ? m.tercoUf : m.terco;
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

/** Alternância de poder: quantas cidades trocaram o partido do prefeito de 2020 para 2024. */
export function troca(ms: readonly Municipio[]): Troca {
  const v = ms.map(m => m.troca).filter(x => x != null);
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
export function votoGrupo(ms: readonly Municipio[]): VotoGrupo {
  const vs = ms.map(m => m.voto).filter(v => v != null);
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

/** As quatro idades comparadas no gráfico: quem mora, quem vota e quem foi eleito. */
export const SERIES_IDADE: readonly {
  nome: string;
  curto: string;
  cor: string;
  valor: (m: Municipio) => number | null;
}[] = [
  { nome: "Quem mora (Censo 2022)", curto: "Quem mora", cor: "#2a78d6", valor: m => m.idade },
  { nome: "Quem vota (eleitores, 2024)", curto: "Quem vota", cor: "#1baf7a", valor: m => m.idEl },
  { nome: "Vereadores eleitos (2024)", curto: "Vereadores", cor: "#eda100", valor: m => m.idVer },
  { nome: "Prefeitos eleitos (2024)", curto: "Prefeitos", cor: "#c2378e", valor: m => m.idPref },
];

/** Idade média de cada série em cada terço: matriz [terço][série]. Cada cidade conta uma vez. */
export const idadesPorGrupo = (g: readonly (readonly Municipio[])[]): (number | null)[][] =>
  g.map(ms => SERIES_IDADE.map(s => media(ms.map(s.valor))));

export interface Idades {
  /** idade média de quem mora, pesada pela população */
  mora: number | null;
  /** dos eleitores, pesada pelos aptos */
  vota: number | null;
  /** de quem recebeu os votos para vereador, pesada pelos votos */
  votado: number | null;
}

/** As idades de um conjunto de cidades (o país, um estado ou uma cidade só), como médias de pessoas e de votos. */
export function idadesDe(ms: readonly Municipio[]): Idades {
  return {
    mora: pesada(
      ms.map(m => m.idade),
      ms.map(m => m.pop),
    ),
    vota: pesada(
      ms.map(m => m.idEl),
      ms.map(m => m.aptos ?? 0),
    ),
    votado: pesada(
      ms.map(m => m.voto?.[7]),
      ms.map(m => m.voto?.[3] ?? 0),
    ),
  };
}

/** Afasta rótulos que ficariam um em cima do outro: devolve a posição y de cada um, na mesma ordem,
 *  com pelo menos `folga` entre vizinhos e sem sair de [min, max]. */
export function afastar(ys: readonly number[], folga: number, min: number, max: number): number[] {
  const ordem = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ordem.length; k++) ordem[k].y = Math.max(ordem[k].y, ordem[k - 1].y + folga);
  // se passou do fim, empurra todos para cima
  const sobra = ordem.length ? ordem[ordem.length - 1].y - max : 0;
  if (sobra > 0) for (const o of ordem) o.y -= sobra;
  for (let k = ordem.length - 2; k >= 0; k--) ordem[k].y = Math.min(ordem[k].y, ordem[k + 1].y - folga);
  const saida = new Array<number>(ys.length);
  for (const o of ordem) saida[o.i] = Math.max(min, o.y);
  return saida;
}

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

// ---------- o rosto ----------
const limitar = (v: number) => Math.max(0, Math.min(1, v));
/** 0 até a idade `de`, 1 a partir de `ate`, subindo em linha reta no meio. */
export const entre = (idade: number, de: number, ate: number): number => limitar((idade - de) / (ate - de));
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
const hex = (h: string): number[] => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
/** Cor entre duas, em hexadecimal. */
export function corEntre(a: string, b: string, t: number): string {
  const x = hex(a),
    y = hex(b);
  return `rgb(${x.map((v, i) => Math.round(mix(v, y[i], t))).join(",")})`;
}
/** Cabelo: escuro até os 36, grisalho aos 56, branco aos 72. */
export function corCabelo(idade: number): string {
  return idade < 56
    ? corEntre("#2b1f17", "#8f8b86", entre(idade, 36, 56))
    : corEntre("#8f8b86", "#efefeb", entre(idade, 56, 72));
}
