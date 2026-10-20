import { fmt, int, pc } from "../../lib/formato";
import type { DadosQ2, Faixa, LimiteQuinto, Teste } from "./tipos";

export const CARGO_ROT = ["Vereador", "Prefeito", "Dep. estadual", "Dep. federal", "Governador", "Senador"];
export const CARGO_NOME = ["vereador", "prefeito", "deputado estadual", "deputado federal", "governador", "senador"];
export const GRUPO_ROT: Record<string, string> = {
  IMOVEIS: "Imóveis",
  VEICULOS: "Veículos",
  DINHEIRO: "Dinheiro",
  APLICACOES: "Aplicações",
  EMPRESAS: "Empresas",
  OUTROS: "Outros",
};
export const FAIXA_ROT = ["Sem bens", "1º quinto", "2º quinto", "3º quinto", "4º quinto", "5º quinto"];

/** Eleições de cada cargo: municipais (vereador e prefeito) ou gerais. */
export const anosDoCargo = (cargo: number): number[] => (cargo <= 1 ? [2020, 2024] : [2018, 2022]);

/** Ao trocar de cargo, mantém a posição do ano (1ª ou 2ª eleição do cargo). */
export function anoAoTrocarCargo(cargoAntigo: number, ano: number, cargoNovo: number): number {
  const k = anosDoCargo(cargoAntigo).indexOf(ano);
  return anosDoCargo(cargoNovo)[k < 0 ? 1 : k];
}

/** Soma candidatos e eleitos por faixa (sem bens + 5 quintos) para cargo, ano e estado ("TODAS" soma os 6). */
export function somarFaixas(D: DadosQ2, cargo: number, ano: number, uf: string): Faixa[] {
  const s: Faixa[] = Array.from({ length: 6 }, () => [0, 0]);
  const iu = uf === "TODAS" ? -1 : D.ufs.indexOf(uf);
  for (const [a, u, c, f, n, e] of D.faixas)
    if (a === ano && c === cargo && (iu < 0 || u === iu)) {
      s[f][0] += n;
      s[f][1] += e;
    }
  return s;
}

/** Taxa de eleição (%) de cada faixa; null onde não há candidatos. */
export const taxas = (s: readonly Faixa[]): (number | null)[] => s.map(([c, e]) => pc(e, c));

// ---------- qui-quadrado ----------

/** Logaritmo da função gama (aproximação de Lanczos). */
function lnGama(z: number): number {
  const g = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2,
    -0.5395239384953e-5,
  ];
  const x = z;
  let y = z,
    t = x + 5.5;
  t -= (x + 0.5) * Math.log(t);
  let s = 1.000000000190015;
  for (const c of g) s += c / ++y;
  return -t + Math.log((2.5066282746310005 * s) / x);
}

/** Função gama incompleta regularizada superior Q(a, x): série para x pequeno, fração contínua para x grande. */
export function gamaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  if (x < a + 1) {
    let soma = 1 / a,
      termo = soma;
    for (let n = 1; n < 500; n++) {
      termo *= x / (a + n);
      soma += termo;
      if (Math.abs(termo) < Math.abs(soma) * 1e-15) break;
    }
    return 1 - soma * Math.exp(-x + a * Math.log(x) - lnGama(a));
  }
  const tiny = 1e-300;
  let b = x + 1 - a,
    c = 1 / tiny,
    d = 1 / b,
    h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return Math.exp(-x + a * Math.log(x) - lnGama(a)) * h;
}

/** p-valor do qui-quadrado `chi` com `gl` graus de liberdade. */
export const pQui2 = (chi: number, gl: number): number => gamaQ(gl / 2, chi / 2);

/** Qui-quadrado de independência da tabela faixas × (eleito, não eleito). Válido só com 5+ casos esperados em toda célula. */
export function teste(s: readonly Faixa[]): Teste {
  const n = s.reduce((a, x) => a + x[0], 0),
    e = s.reduce((a, x) => a + x[1], 0);
  let chi = 0,
    valido = n > 0;
  for (const [c, el] of s) {
    const esp = [(c * e) / n, (c * (n - e)) / n],
      obs = [el, c - el];
    for (let k = 0; k < 2; k++) {
      if (esp[k] < 5) valido = false;
      if (esp[k] > 0) chi += (obs[k] - esp[k]) ** 2 / esp[k];
    }
  }
  return { chi, p: n > 0 ? pQui2(chi, s.length - 1) : 1, valido, n, e };
}

export const pTexto = (p: number): string =>
  p < 1e-9
    ? "menos de 1 em 1 bilhão"
    : p < 1e-6
      ? "menos de 1 em 1 milhão"
      : p < 0.001
        ? "menos de 1 em mil"
        : `${fmt(100 * p, 1)}%`;

// ---------- textos ----------

/** "1 em cada 12"; "nenhum" para taxa zero. */
export const umEm = (t: number): string => (t > 0 ? `1 em cada ${int(100 / t)}` : "nenhum");

/** Reais curtos deste painel: "R$ 1,2 mi", "R$ 25 mil", "R$ 870". */
export const brlCurto = (v: number | null | undefined): string =>
  v == null ? "–" : v >= 1e6 ? `R$ ${fmt(v / 1e6, 1)} mi` : v >= 1e3 ? `R$ ${int(v / 1e3)} mil` : `R$ ${int(v)}`;

const unidade = (v: number): [string, string] => (v >= 1e6 ? [fmt(v / 1e6, 1), "mi"] : [int(v / 1e3), "mil"]);

/** Faixa curta para caber sob a barra: "R$ 169–386 mil", "R$ 734 mil–1,6 mi". */
export function intervalo(a: number, b: number): string {
  const [x, ua] = unidade(a),
    [y, ub] = unidade(b);
  return ua === ub ? `R$ ${x}–${y} ${ub}` : `R$ ${x} ${ua}–${y} ${ub}`;
}

/** Valores em reais de um quinto (1..5): "até R$ 25 mil", "acima de R$ 385 mil"; vazio sem limites. */
export function faixaValor(lim: readonly LimiteQuinto[] | undefined, i: number): string {
  if (!lim || !lim[i - 1]) return "";
  if (i === 1) return `até ${brlCurto(lim[0][1])}`;
  if (i === 5) return `acima de ${brlCurto(lim[4][0])}`;
  return intervalo(lim[i - 1][0], lim[i - 1][1]);
}

/** Entre as combinações cargo × eleição com teste válido, quantas têm o quinto mais rico elegendo mais que o mais pobre. */
export function contarMaisRicosGanham(D: DadosQ2, uf: string): { favoraveis: number; total: number } {
  let favoraveis = 0,
    total = 0;
  for (let c = 0; c < 6; c++)
    for (const a of anosDoCargo(c)) {
      const s = somarFaixas(D, c, a, uf);
      if (!teste(s).valido) continue;
      const tx = taxas(s);
      total++;
      if ((tx[5] ?? 0) > (tx[1] ?? 0)) favoraveis++;
    }
  return { favoraveis, total };
}
