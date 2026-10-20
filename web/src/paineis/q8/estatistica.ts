import { pc } from "../../lib/formato";
import type { Comparacao, DadosQ8, Grupo } from "./tipos";

export const UF_NOME: Record<string, string> = { AM: "Amazonas", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", RS: "Rio Grande do Sul", SE: "Sergipe" };
export const CARGO = ["Vereador", "Prefeito", "Dep. estadual", "Dep. federal", "Senador", "Governador"];
export const SING = ["vereador", "prefeito", "deputado estadual", "deputado federal", "senador", "governador"];
export const ANOS: readonly (readonly [number, string])[] = [[2018, "2018"], [2020, "2020"], [2022, "2022"], [2024, "2024"]];
export const cargosDoAno = (a: number): number[] => (a === 2020 || a === 2024 ? [0, 1] : [2, 3, 4, 5]);
/** Mínimo de candidatos por grupo para comparar com segurança. */
export const N_MIN = 30;

export const ufIdx = (ufs: string[], uf: string): number[] => (uf === "TODAS" ? [0, 1, 2, 3, 4, 5] : [ufs.indexOf(uf)]);
export const onde = (uf: string): string =>
  uf === "TODAS" ? "nos 6 estados" : (["AM", "MA", "MT", "RS"].includes(uf) ? "no " : "em ") + UF_NOME[uf];

// qui-quadrado 2×2 (mesma função das outras perguntas)
function lgamma(z: number): number {
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
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
    b += 2; d = an * d + b; if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c; if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return f * h;
}

function qui2x2(e1: number, n1: number, e2: number, n2: number): { p: number | null; minEsp: number } {
  const N = n1 + n2, E = e1 + e2;
  if (!n1 || !n2 || !E || E === N) return { p: null, minEsp: 0 };
  let q = 0, minEsp = Infinity;
  for (const [e, n] of [[e1, n1], [e2, n2]]) {
    for (const [obs, col] of [[e, E], [n - e, N - E]]) {
      const esp = (n * col) / N;
      minEsp = Math.min(minEsp, esp);
      q += (obs - esp) ** 2 / esp;
    }
  }
  return { p: pQui2(q, 1), minEsp };
}

// faixas: 0 = exatamente 0%; 1..20 = de 5 em 5 pontos; 21 = exatamente 100%
export const inicioFaixa = (f: number): number => (f === 0 ? 0 : f === 21 ? 100 : 5 * (f - 1));
export const rotFaixa = (f: number): string =>
  f === 0 ? "0% (nada)" : f === 21 ? "100% (tudo)" : `${inicioFaixa(f)}% a ${inicioFaixa(f) + 5}%`;

export function faixas(D: DadosQ8, ano: number, cargo: number, us: number[]): Grupo[] {
  const r: Grupo[] = Array.from({ length: 22 }, () => ({ n: 0, e: 0 }));
  for (const [a, u, c, f, n, e] of D.q8) if (a === ano && c === cargo && us.includes(u)) { r[f].n += n; r[f].e += e; }
  return r;
}

export function grupos(r: Grupo[], corte: number): { pub: Grupo; out: Grupo } {
  const g = { pub: { n: 0, e: 0 }, out: { n: 0, e: 0 } };
  r.forEach((b, f) => { const k = inicioFaixa(f) >= corte ? "pub" : "out"; g[k].n += b.n; g[k].e += b.e; });
  return g;
}

export function comparar(r: Grupo[], corte: number): Comparacao {
  const g = grupos(r, corte), tp = pc(g.pub.e, g.pub.n), to = pc(g.out.e, g.out.n), t = qui2x2(g.pub.e, g.pub.n, g.out.e, g.out.n);
  const ok = g.pub.n >= N_MIN && g.out.n >= N_MIN && t.p != null && t.minEsp >= 5;
  return { g, tp, to, dif: tp != null && to != null ? tp - to : null, p: t.p, ok, real: ok && t.p! < 0.05 };
}
