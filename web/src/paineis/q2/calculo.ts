import { anosDoCargo } from "../../lib/cargos";
import { fmt, int, pc } from "../../lib/formato";
import type { DadosQ2, Faixa, LimiteQuinto, Teste } from "./tipos";

export { anoAoTrocarCargo, anosDoCargo, CARGO_NOME, CARGO_ROT } from "../../lib/cargos";
export const GRUPO_ROT: Record<string, string> = {
  IMOVEIS: "Imóveis",
  VEICULOS: "Veículos",
  DINHEIRO: "Dinheiro",
  APLICACOES: "Aplicações",
  EMPRESAS: "Empresas",
  OUTROS: "Outros",
};
export const FAIXA_ROT = ["Sem bens", "1º quinto", "2º quinto", "3º quinto", "4º quinto", "5º quinto"];

/** Soma candidatos e eleitos por faixa (sem bens + 5 quintos) para cargo, ano e estado ("TODAS" soma o país). */
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

// ---------- o nome em destaque cabe sempre no espaço dele ----------

/** Largura de cada caractere em Open Sans ExtraBold (a fonte do destaque), em centésimos do
 *  tamanho da fonte. Medida no navegador; letra fora da tabela conta como larga. */
const LARGURA: Record<string, number> = {
  A: 73,
  B: 67,
  C: 65,
  D: 73,
  E: 55,
  F: 54,
  G: 74,
  H: 77,
  I: 35,
  J: 35,
  K: 69,
  L: 58,
  M: 97,
  N: 83,
  O: 80,
  P: 63,
  Q: 80,
  R: 68,
  S: 58,
  T: 59,
  U: 76,
  V: 69,
  W: 104,
  X: 72,
  Y: 66,
  Z: 61,
  ".": 29,
  "-": 32,
  "'": 29,
  " ": 26,
  $: 59,
  "?": 52,
};
const LARGURA_PADRAO = 85;

/** Largura de um texto em maiúsculas, em múltiplos do tamanho da fonte ("LEINHO" ≈ 3,9). */
export function larguraEm(texto: string): number {
  let soma = 0;
  // sem os acentos: Ã tem a largura de A
  for (const ch of texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase())
    soma += /\d/.test(ch) ? 59 : (LARGURA[ch] ?? LARGURA_PADRAO);
  return soma / 100;
}

/** Linha que termina em preposição ("MARIS DA") ou é só ela: a quebra fica melhor antes dela. */
const TERMINA_SOLTA = /(^| )(DE|DA|DO|DAS|DOS|E)$/i;

/** Quebra um nome em até 3 linhas de palavras inteiras, para a letra ficar o maior possível:
 *  procura a divisão em que a linha mais larga é a mais estreita, e só gasta uma linha a mais
 *  quando isso estreita o bloco em pelo menos 10%. Evita deixar preposição no fim da linha. */
export function linhasDoNome(nome: string): string[] {
  const palavras = nome.trim().split(/\s+/).filter(Boolean);
  let melhor: string[] = [palavras.join(" ")];
  let nota = Infinity;
  // cada bit da máscara diz se há quebra depois da palavra i
  for (let mascara = 0; mascara < 1 << Math.max(0, palavras.length - 1); mascara++) {
    const linhas: string[] = [];
    let atual = palavras[0] ?? "";
    for (let i = 1; i < palavras.length; i++) {
      if (mascara & (1 << (i - 1))) {
        linhas.push(atual);
        atual = palavras[i];
      } else atual += ` ${palavras[i]}`;
    }
    linhas.push(atual);
    if (linhas.length > 3) continue;
    const soltas = linhas.filter(l => TERMINA_SOLTA.test(l)).length;
    const n = Math.max(...linhas.map(larguraEm)) * (1 + 0.1 * (linhas.length - 1)) * (1 + 0.25 * soltas);
    if (n < nota) {
      nota = n;
      melhor = linhas;
    }
  }
  return melhor;
}
