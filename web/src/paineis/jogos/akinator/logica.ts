import { categoria } from "../../../lib/espectro";
import { semAcento, UF_NOME } from "../../../lib/uf";
import { CARGO } from "../../candidatos/modelo";
import type { Eleito } from "../../candidatos/tipos";
import { CAPITAIS, sortear, vitorias } from "../comum";

// Regras do Akinator de eleito: perguntas sim/não geradas dos dados, penalidade por resposta
// que contradiz o candidato (tolera erro do jogador) e escolha da pergunta mais equilibrada.

/** Valor de cada resposta: sinal = sim (+) ou não (-); módulo = certeza. */
export const RESPOSTAS = [
  { valor: 1, rotulo: "Sim" },
  { valor: 0.5, rotulo: "Provavelmente sim" },
  { valor: 0, rotulo: "Não sei" },
  { valor: -0.5, rotulo: "Provavelmente não" },
  { valor: -1, rotulo: "Não" },
] as const;

export interface Pergunta {
  id: string;
  texto: string;
  /** true/false sobre o eleito; null quando o dado não existe (não pesa nem a favor nem contra) */
  teste: (e: Eleito) => boolean | null;
}

export interface Resposta {
  id: string;
  valor: number;
}

/** Chute a cada tantas perguntas, mesmo com muitos candidatos vivos. */
export const CHUTE_A_CADA = 20;
/** Chutes errados a partir dos quais o jogador pode dizer quem era. */
export const ERROS_PARA_REVELAR = 3;

const nulo = (v: number | null | undefined, f: (x: number) => boolean): boolean | null => (v == null ? null : f(v));

const FAIXAS_NOME: [string, string, string][] = [
  ["a-d", "A", "D"],
  ["e-j", "E", "J"],
  ["k-o", "K", "O"],
  ["p-t", "P", "T"],
  ["u-z", "U", "Z"],
];

const NO_ESTADO: Record<string, string> = { AM: "do", GO: "de", MA: "do", MT: "de", RS: "do", SE: "de" };

/** Todas as perguntas possíveis para o conjunto de eleitos (partidos só os presentes). */
export function gerarPerguntas(eleitos: readonly Eleito[]): Pergunta[] {
  const ps: Pergunta[] = [{ id: "mulher", texto: "O eleito é mulher?", teste: e => e.genero === "FEMININO" }];
  for (const uf of Object.keys(UF_NOME))
    ps.push({
      id: `uf-${uf}`,
      texto: `Foi eleito no estado ${NO_ESTADO[uf] ?? "de"} ${UF_NOME[uf]}?`,
      teste: e => e.uf === uf,
    });
  for (const [c, nome] of Object.entries(CARGO))
    ps.push({ id: `cargo-${c}`, texto: `O cargo é ${nome.toLowerCase()}?`, teste: e => e.cargo === Number(c) });
  ps.push({ id: "ano-2022", texto: "Foi eleito em 2022 (e não em 2024)?", teste: e => e.ano === 2022 });
  ps.push({ id: "capital", texto: "Foi eleito numa capital?", teste: e => CAPITAIS.has(e.cod) });

  for (const p of [...new Set(eleitos.map(e => e.partido))].sort())
    ps.push({ id: `partido-${p}`, texto: `O partido é o ${p}?`, teste: e => e.partido === p });

  ps.push({
    id: "esq",
    texto: "O partido é de esquerda ou centro-esquerda?",
    teste: e => (e.espectro ? categoria(e.espectro[0]) <= 2 : null),
  });
  ps.push({
    id: "centro",
    texto: "O partido é de centro?",
    teste: e => (e.espectro ? categoria(e.espectro[0]) === 3 : null),
  });
  ps.push({
    id: "dir",
    texto: "O partido é de centro-direita ou direita?",
    teste: e => (e.espectro ? categoria(e.espectro[0]) >= 4 : null),
  });

  const cores: [string, string][] = [
    ["PARDA", "parda"],
    ["BRANCA", "branca"],
    ["PRETA", "preta"],
  ];
  for (const [c, t] of cores)
    ps.push({
      id: `cor-${c}`,
      texto: `O eleito se declara de cor/raça ${t}?`,
      teste: e => (e.cor === "NÃO INFORMADO" ? null : e.cor === c),
    });

  ps.push({ id: "superior", texto: "Tem ensino superior completo?", teste: e => e.grau === "SUPERIOR COMPLETO" });
  ps.push({
    id: "fundamental",
    texto: "Estudou só até o ensino fundamental (ou menos)?",
    teste: e => e.grau.includes("FUNDAMENTAL") || e.grau === "LÊ E ESCREVE",
  });
  for (const i of [40, 50, 60])
    ps.push({ id: `idade-${i}`, texto: `Tem mais de ${i} anos?`, teste: e => nulo(e.idade, x => x > i) });
  for (const [v, t] of [
    [1e4, "10 mil"],
    [1e5, "100 mil"],
    [1e6, "1 milhão"],
  ] as const)
    ps.push({ id: `votos-${v}`, texto: `Teve mais de ${t} de votos?`, teste: e => nulo(e.votos, x => x > v) });
  ps.push({
    id: "patrimonio",
    texto: "Declarou patrimônio acima de R$ 1 milhão?",
    teste: e => nulo(e.patrimonio, x => x > 1e6),
  });
  for (const [v, t] of [
    [1e5, "R$ 100 mil"],
    [1e6, "R$ 1 milhão"],
  ] as const)
    ps.push({
      id: `receita-${v}`,
      texto: `Arrecadou mais de ${t} na campanha?`,
      teste: e => nulo(e.receita, x => x > v),
    });
  for (const n of [2, 4])
    ps.push({ id: `vit-${n}`, texto: `Já venceu ${n} eleições ou mais na carreira?`, teste: e => vitorias(e) >= n });
  ps.push({
    id: "outro-cargo",
    texto: "Já se candidatou a outro cargo?",
    teste: e => e.carreira.some(c => c.cargo !== e.cargo),
  });
  for (const [id, a, b] of FAIXAS_NOME) {
    ps.push({
      id: `nome-${id}`,
      texto: `O nome de urna começa com uma letra de ${a} a ${b}?`,
      teste: e => {
        const l = semAcento(e.nome.trim()).charAt(0).toUpperCase();
        return l === "" ? null : l >= a && l <= b;
      },
    });
  }
  return ps;
}

/** Penalidade de um candidato por uma resposta: erro total = 1, provável = 0,5, "não sei" = 0. */
export function penalidade(p: Pergunta, valor: number, e: Eleito): number {
  const t = p.teste(e);
  if (t === null || valor === 0) return 0;
  return valor > 0 === t ? 0 : Math.abs(valor);
}

/** Penalidade acumulada de cada eleito (mesma ordem de `eleitos`); excluídos viram Infinity. */
export function penalidades(
  eleitos: readonly Eleito[],
  perguntas: ReadonlyMap<string, Pergunta>,
  respostas: readonly Resposta[],
  excluidos: ReadonlySet<number> = new Set(),
): number[] {
  const lista = respostas.flatMap(r => {
    const p = perguntas.get(r.id);
    return p ? [{ p, valor: r.valor }] : [];
  });
  return eleitos.map(e =>
    excluidos.has(e.id) ? Number.POSITIVE_INFINITY : lista.reduce((s, r) => s + penalidade(r.p, r.valor, e), 0),
  );
}

/** Eleitos de penalidade mínima; se forem menos de 3, entram também os de mínima + 0,5. */
export function vivos(eleitos: readonly Eleito[], pens: readonly number[]): Eleito[] {
  let min = Number.POSITIVE_INFINITY;
  for (const p of pens) if (p < min) min = p;
  if (min === Number.POSITIVE_INFINITY) return [];
  const exatos = eleitos.filter((_, i) => pens[i] === min);
  if (exatos.length >= 3) return exatos;
  return eleitos.filter((_, i) => pens[i] <= min + 0.5);
}

/** Pergunta ainda não feita que mais se aproxima de 50/50 entre os vivos; empate sorteado. null se nenhuma divide. */
export function melhorPergunta(
  vivosAgora: readonly Eleito[],
  perguntas: readonly Pergunta[],
  feitas: ReadonlySet<string>,
  rnd: () => number = Math.random,
): Pergunta | null {
  if (vivosAgora.length < 2) return null;
  const pontuadas: { p: Pergunta; desvio: number }[] = [];
  for (const p of perguntas) {
    if (feitas.has(p.id)) continue;
    let sim = 0;
    let nao = 0;
    for (const e of vivosAgora) {
      const t = p.teste(e);
      if (t === true) sim++;
      else if (t === false) nao++;
    }
    if (sim === 0 || nao === 0) continue;
    pontuadas.push({ p, desvio: Math.abs(sim / vivosAgora.length - 0.5) });
  }
  if (!pontuadas.length) return null;
  const melhor = Math.min(...pontuadas.map(x => x.desvio));
  const empatadas = pontuadas.filter(x => x.desvio - melhor < 1e-9).map(x => x.p);
  return sortear(empatadas, rnd) ?? null;
}

/** Hora do chute: sobrou 1 vivo, nenhuma pergunta divide mais, ou já se passaram 20 perguntas desde o último chute. */
export function deveChutar(estado: {
  vivos: number;
  haPergunta: boolean;
  respondidas: number;
  ultimoChute: number;
}): boolean {
  return estado.vivos <= 1 || !estado.haPergunta || estado.respondidas - estado.ultimoChute >= CHUTE_A_CADA;
}

/** Candidato do chute: menor penalidade entre os vivos, desempate pelos votos. */
export function melhorChute(
  eleitos: readonly Eleito[],
  pens: readonly number[],
  vivosAgora: readonly Eleito[],
): Eleito | null {
  const ids = new Set(vivosAgora.map(e => e.id));
  let melhor: Eleito | null = null;
  let pMelhor = Number.POSITIVE_INFINITY;
  eleitos.forEach((e, i) => {
    if (!ids.has(e.id)) return;
    const p = pens[i];
    if (p < pMelhor || (p === pMelhor && melhor && (e.votos ?? 0) > (melhor.votos ?? 0))) {
      melhor = e;
      pMelhor = p;
    }
  });
  return melhor;
}

/** Respostas em que o eleito contradiz o que o jogador disse. */
export function discordancias(
  e: Eleito,
  perguntas: ReadonlyMap<string, Pergunta>,
  respostas: readonly Resposta[],
): { pergunta: Pergunta; valor: number; correta: boolean }[] {
  const saida: { pergunta: Pergunta; valor: number; correta: boolean }[] = [];
  for (const r of respostas) {
    const p = perguntas.get(r.id);
    if (p && penalidade(p, r.valor, e) > 0) saida.push({ pergunta: p, valor: r.valor, correta: p.teste(e) === true });
  }
  return saida;
}
