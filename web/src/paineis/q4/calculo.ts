// Contas do painel de escolaridade: agregações dos dados, qui-quadrado, correlações e a rampa do mapa.
import { nomeProprio, pc } from "../../lib/formato";
import { GRAU_NIVEL, type DadosQ4, type Eleito, type LinhaChance, type LinhaPerfil, type Metrica, type Municipio } from "./tipos";

const soma = (v: number[]): number => v.reduce((a, b) => a + b, 0);
export const media = (v: number[]): number => soma(v) / v.length;

// ---------- preparo dos dados ----------
export function prepararMunicipios(D: DadosQ4): Municipio[] {
  return Object.entries(D.mun).map(([cod, b]) => {
    const tp = b.pop ? soma(b.pop) : 0;
    const te = soma(b.el);
    return {
      ...b,
      cod: +cod,
      ok: !!b.pop && b.ver > 0,
      te,
      popTotal: tp,
      pPop: b.pop ? pc(b.pop[3], tp) : null,
      pEl: te ? pc(b.el[3], te) : null,
      modaPop: b.pop ? b.pop.indexOf(Math.max(...b.pop)) + 1 : null,
      modaEl: te ? b.el.indexOf(Math.max(...b.el)) + 1 : null,
    };
  });
}

export function prepararEleitos(D: DadosQ4): Eleito[] {
  return D.eleitos.map(([ano, uf, cod, cargo, grau, urna, partido, civil, sq]) => ({
    ano, uf, cod, cargo, grau, partido, sq,
    urna: nomeProprio(urna),
    civil: civil && civil !== urna ? nomeProprio(civil) : "",
  }));
}

/** Candidaturas e eleitos de cada ano, para a nota "Como calculamos". */
export function totaisPorAno(chance: LinhaChance[]) {
  let n22 = 0, e22 = 0, n24 = 0, e24 = 0;
  for (const [a, , , , n, e] of chance) {
    if (a === 2022) { n22 += n; e22 += e; } else { n24 += n; e24 += e; }
  }
  return { n22, e22, n24, e24 };
}

// ---------- recortes por ano, estado e cargo ----------
/** Linhas: 0 população, 1 candidatos, 2 eleitos; colunas: os 4 níveis. */
export function perfil(linhas: LinhaPerfil[], ano: number, ufs: string[]): number[][] {
  const q = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  for (const [a, u, g, n, v] of linhas) if (a === ano && ufs.includes(u)) q[g][n - 1] += v;
  return q;
}

export interface Contagem { n: number; e: number }
/** Candidatos e eleitos por grau (índices 1 a 8). */
export function chance(linhas: LinhaChance[], ano: number, ufs: string[], cargo: number): Record<number, Contagem> {
  const r: Record<number, Contagem> = {};
  for (let g = 1; g <= 8; g++) r[g] = { n: 0, e: 0 };
  for (const [a, u, c, g, n, e] of linhas) {
    if (a === ano && ufs.includes(u) && c === cargo) { r[g].n += n; r[g].e += e; }
  }
  return r;
}

/** Candidatos, eleitos e taxa de eleição (eleitos ÷ candidatos) em cada um dos 4 níveis. */
export function porNivel(r: Record<number, Contagem>) {
  return [1, 2, 3, 4].map(n => {
    const gs = [1, 2, 3, 4, 5, 6, 7, 8].filter(g => GRAU_NIVEL[g] === n);
    const nn = gs.reduce((s, g) => s + r[g].n, 0);
    const ee = gs.reduce((s, g) => s + r[g].e, 0);
    return { n: nn, e: ee, t: pc(ee, nn) };
  });
}

// ---------- qui-quadrado (série + fração contínua; conferido contra a tabela) ----------
function lgamma(z: number): number {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function pQui2(q: number, gl: number): number {
  const a = gl / 2, x = q / 2;
  if (x <= 0) return 1;
  const f = Math.exp(-x + a * Math.log(x) - lgamma(a));
  if (x < a + 1) {
    let t = 1 / a, s = t;
    for (let k = 1; k < 1000; k++) { t *= x / (a + k); s += t; if (Math.abs(t) < Math.abs(s) * 1e-15) break; }
    return 1 - f * s;
  }
  const tiny = 1e-300;
  let b = x + 1 - a, c = 1 / tiny, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c; if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return f * h;
}

export interface Teste { N: number; E: number; p: number | null; conf: boolean }
/** Teste de que a chance de se eleger é a mesma em todos os graus (graus 1 a 3 juntos). */
export function teste(r: Record<number, Contagem>): Teste {
  let N = 0, E = 0;
  for (let g = 1; g <= 8; g++) { N += r[g].n; E += r[g].e; }
  const fx = [[1, 2, 3], [4], [5], [6], [7], [8]]
    .map(gs => gs.reduce((s, g) => ({ n: s.n + r[g].n, e: s.e + r[g].e }), { n: 0, e: 0 }))
    .filter(f => f.n > 0);
  let q = 0, minEsp = Infinity;
  for (const f of fx) {
    for (const [obs, col] of [[f.e, E], [f.n - f.e, N - E]]) {
      const esp = (f.n * col) / N;
      minEsp = Math.min(minEsp, esp);
      q += esp > 0 ? (obs - esp) ** 2 / esp : 0;
    }
  }
  const gl = fx.length - 1;
  return { N, E, p: gl > 0 && E > 0 && E < N ? pQui2(q, gl) : null, conf: minEsp >= 5 };
}

// ---------- correlações ----------
export function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const mx = media(xs), my = media(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

function postos(v: number[]): number[] {
  const idx = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
  const r = new Array<number>(v.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const m = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k][1]] = m;
    i = j + 1;
  }
  return r;
}
export const spearman = (xs: number[], ys: number[]): number | null => pearson(postos(xs), postos(ys));

/** Reta de mínimos quadrados y = a·x + b. */
export function reta(xs: number[], ys: number[]) {
  const n = xs.length, mx = media(xs), my = media(ys);
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const a = sxy / sxx;
  return { a, b: my - a * mx };
}

// ---------- mapa ----------
const RAMPA = ["#eef3d9", "#cfe08f", "#a5bd4e", "#7e9a2e", "#576f14", "#32440a"];
const hex = (h: string): number[] => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
/** Cor da rampa verde para t entre 0 e 1. */
export function rampa(t: number): string {
  t = Math.max(0, Math.min(1, t));
  const p = t * (RAMPA.length - 1), i = Math.min(RAMPA.length - 2, Math.floor(p)), f = p - i;
  const a = hex(RAMPA[i]), b = hex(RAMPA[i + 1]);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(",")})`;
}
export const GRADIENTE = `linear-gradient(90deg,${Array.from({ length: 11 }, (_, i) => rampa(i / 10)).join(",")})`;

export const METRICA: Record<Metrica, { rot: string; v: (m: Municipio) => number; dom: [number, number]; un?: boolean }> = {
  pop: { rot: "População com faculdade", v: m => m.pPop as number, dom: [0, 30] },
  el: { rot: "Eleitos com faculdade", v: m => m.pEl as number, dom: [0, 100] },
  dist: { rot: "Diferença", v: m => (m.pEl as number) - (m.pPop as number), dom: [0, 80], un: true },
};
