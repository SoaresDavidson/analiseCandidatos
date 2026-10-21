import { categoria } from "../../../lib/espectro";
import type { Eleito } from "../../candidatos/tipos";
import { aleatorio, conhecido, sortear } from "../comum";

// Regras do Politicodle sem nada de React: comparação palpite × alvo, sorteio do dia,
// pistas, texto de compartilhar e estatísticas.

export type Status = "igual" | "parcial" | "diferente";
/** Seta para o alvo: "cima" = o alvo tem valor maior que o palpite. */
export type Seta = "cima" | "baixo" | null;
export interface Casa {
  status: Status;
  seta: Seta;
}

export const COLUNAS = ["cargo", "partido", "uf", "genero", "cor", "grau", "idade", "votos"] as const;
export type Coluna = (typeof COLUNAS)[number];
export type Resultado = Record<Coluna, Casa>;

export type Dados = Pick<
  Eleito,
  "cargo" | "partido" | "uf" | "genero" | "cor" | "grau" | "idade" | "votos" | "espectro"
>;

/** Ordem da escolaridade, da menor para a maior; -1 se o texto não for reconhecido. */
export function nivelGrau(grau: string): number {
  const g = grau
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();
  if (g.includes("LE E ESCREVE")) return 0;
  const incompleto = g.includes("INCOMPLETO");
  if (g.includes("FUNDAMENTAL")) return incompleto ? 1 : 2;
  if (g.includes("MEDIO")) return incompleto ? 3 : 4;
  if (g.includes("SUPERIOR")) return incompleto ? 5 : 6;
  return -1;
}

/** Municipal (prefeito, vereador) ou estadual/federal. */
export const esfera = (cargo: number): "municipal" | "estadual" =>
  cargo === 11 || cargo === 13 ? "municipal" : "estadual";

const sentido = (alvo: number, palpite: number): Seta => (alvo > palpite ? "cima" : "baixo");
const IGUAL: Casa = { status: "igual", seta: null };
const DIFERENTE: Casa = { status: "diferente", seta: null };

function texto(a: string, b: string, parcial = false): Casa {
  if (a === b) return IGUAL;
  return parcial ? { status: "parcial", seta: null } : DIFERENTE;
}

function numero(
  p: number | null,
  a: number | null,
  verde: (p: number, a: number) => boolean,
  amarelo: (p: number, a: number) => boolean,
): Casa {
  if (p == null || a == null) return DIFERENTE;
  if (p === a || verde(p, a)) return IGUAL;
  return { status: amarelo(p, a) ? "parcial" : "diferente", seta: sentido(a, p) };
}

/** Compara o palpite com o alvo, coluna por coluna. */
export function comparar(palpite: Dados, alvo: Dados): Resultado {
  const catP = categoria(palpite.espectro?.[0]);
  const catA = categoria(alvo.espectro?.[0]);
  const gp = nivelGrau(palpite.grau);
  const ga = nivelGrau(alvo.grau);
  return {
    cargo: texto(String(palpite.cargo), String(alvo.cargo), esfera(palpite.cargo) === esfera(alvo.cargo)),
    partido: texto(palpite.partido, alvo.partido, catP >= 0 && catP === catA),
    uf: texto(palpite.uf, alvo.uf),
    genero: texto(palpite.genero, alvo.genero),
    cor: texto(palpite.cor, alvo.cor),
    grau: gp === ga ? IGUAL : { status: "diferente", seta: gp < 0 || ga < 0 ? null : sentido(ga, gp) },
    // idade: verde igual, amarelo a até 5 anos
    idade: numero(
      palpite.idade,
      alvo.idade,
      () => false,
      (p, a) => Math.abs(p - a) <= 5,
    ),
    // votos: verde a até 5%, amarelo até o dobro (ou metade)
    votos: numero(
      palpite.votos,
      alvo.votos,
      (p, a) => Math.abs(p - a) <= 0.05 * Math.max(a, 1),
      (p, a) => Math.max(p, a) <= 2 * Math.max(Math.min(p, a), 1),
    ),
  };
}

export const acertou = (r: Resultado): boolean => COLUNAS.every(c => r[c].status === "igual");

/** Votos em formato curto: "950", "12,3 mil", "1,2 mi". */
export function votosCurto(v: number | null): string {
  if (v == null) return "—";
  const f = (x: number) => x.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  if (v >= 1_000_000) return `${f(v / 1_000_000)} mi`;
  if (v >= 1000) return `${f(v / 1000)} mil`;
  return String(v);
}

/** Alvo do dia: o mesmo para todo mundo na mesma data, entre os eleitos conhecidos. */
export function alvoDiario(eleitos: readonly Eleito[], data: string): Eleito | undefined {
  // ordena por id para o sorteio não depender da ordem em que os dados chegaram
  const pool = eleitos.filter(conhecido).sort((a, b) => a.id - b.id);
  return sortear(pool, aleatorio(`politicodle-${data}`));
}

/** Linhas de quadradinhos para colar numa conversa, na ordem em que os palpites foram feitos. */
export function textoResultado(titulo: string, linhas: readonly Resultado[]): string {
  const emoji: Record<Status, string> = { igual: "🟩", parcial: "🟨", diferente: "🟥" };
  const grade = linhas.map(l => COLUNAS.map(c => emoji[l[c].status]).join("")).join("\n");
  return `${titulo} em ${linhas.length} ${linhas.length === 1 ? "tentativa" : "tentativas"}\n${grade}`;
}

export const TENTATIVAS_LOCAL = 4;
export const TENTATIVAS_FOTO = 8;

/** Desfoque (px) da foto-pista: null antes da pista; forte ao liberar e menor a cada tentativa. */
export function desfoque(tentativas: number): number | null {
  if (tentativas < TENTATIVAS_FOTO) return null;
  return Math.max(2, 22 - (tentativas - TENTATIVAS_FOTO) * 3);
}

export interface Estatisticas {
  jogos: number;
  vitorias: number;
  soma: number;
}
export const ESTATISTICAS_ZERO: Estatisticas = { jogos: 0, vitorias: 0, soma: 0 };

export const comecouJogo = (e: Estatisticas): Estatisticas => ({ ...e, jogos: e.jogos + 1 });
export const venceuJogo = (e: Estatisticas, tentativas: number): Estatisticas => ({
  ...e,
  vitorias: e.vitorias + 1,
  soma: e.soma + tentativas,
});
export const mediaTentativas = (e: Estatisticas): number | null => (e.vitorias ? e.soma / e.vitorias : null);

/** Milissegundos até a meia-noite local. */
export function msAteAmanha(agora = new Date()): number {
  const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  return amanha.getTime() - agora.getTime();
}

/** "03:12:09" */
export function relogio(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}
