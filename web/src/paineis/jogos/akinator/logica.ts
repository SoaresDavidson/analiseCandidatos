import { categoria } from "../../../lib/espectro";
import { semAcento, UF_NOME } from "../../../lib/uf";
import { CARGO } from "../../candidatos/modelo";
import type { Eleito } from "../../candidatos/tipos";
import { CAPITAIS, sortear, vitorias } from "../comum";

// Regras do Akinator de eleito: perguntas sim/não geradas dos dados e um modelo bayesiano.
// Cada eleito tem uma probabilidade de ser o pensado; cada resposta a multiplica pela chance
// de o jogador responder aquilo se fosse ele (o jogador pode errar, então ninguém zera).
// A próxima pergunta é a de maior ganho de informação esperado.

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

/** Chance de o jogador errar uma resposta dada com certeza ("Sim"/"Não"). */
export const ERRO = 0.1;
/** Probabilidade do líder a partir da qual o gênio chuta. */
export const LIMIAR_CHUTE = 0.8;
/** Chute a cada tantas perguntas, mesmo sem um favorito claro. */
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

/**
 * P(resposta | eleito): 1 - ERRO se concorda com o dado, ERRO se contradiz, interpolado para
 * "provavelmente" (0,7 / 0,3). "Não sei" e dado ausente valem 1: não mudam nada.
 */
export function verossimilhanca(p: Pergunta, valor: number, e: Eleito): number {
  const t = p.teste(e);
  if (t === null || valor === 0) return 1;
  const acerto = 0.5 + Math.abs(valor) * (0.5 - ERRO);
  return valor > 0 === t ? acerto : 1 - acerto;
}

/** true quando a resposta contradiz o dado do eleito. */
export const contradiz = (p: Pergunta, valor: number, e: Eleito): boolean => verossimilhanca(p, valor, e) < 0.5;

/**
 * Probabilidade de cada eleito (mesma ordem de `eleitos`) dado o histórico, partindo de uma
 * distribuição uniforme. Excluídos valem 0. Soma 1, ou tudo 0 se não sobrou ninguém.
 * A conta é feita em log para não estourar com muitas respostas.
 */
export function probabilidades(
  eleitos: readonly Eleito[],
  perguntas: ReadonlyMap<string, Pergunta>,
  respostas: readonly Resposta[],
  excluidos: ReadonlySet<number> = new Set(),
): number[] {
  const lista = respostas.flatMap(r => {
    const p = perguntas.get(r.id);
    return p ? [{ p, valor: r.valor }] : [];
  });
  const logs = eleitos.map(e =>
    excluidos.has(e.id)
      ? Number.NEGATIVE_INFINITY
      : lista.reduce((s, r) => s + Math.log(verossimilhanca(r.p, r.valor, e)), 0),
  );
  const max = Math.max(...logs);
  if (max === Number.NEGATIVE_INFINITY) return eleitos.map(() => 0);
  const pesos = logs.map(l => Math.exp(l - max));
  const total = pesos.reduce((s, x) => s + x, 0);
  return pesos.map(x => x / total);
}

/**
 * Quantos eleitos ainda são plausíveis: os que estão no máximo uma contradição atrás do líder
 * (probabilidade acima de 1/10 da dele). Serve para a contagem na tela.
 */
export function plausiveis(probs: readonly number[]): number {
  const max = Math.max(0, ...probs);
  return max === 0 ? 0 : probs.filter(p => p > max * ERRO).length;
}

/** Entropia binária em bits. */
const h = (q: number): number => (q <= 0 || q >= 1 ? 0 : -q * Math.log2(q) - (1 - q) * Math.log2(1 - q));

/**
 * Pergunta ainda não feita de maior ganho de informação esperado: H(resposta) - H(resposta | eleito),
 * com a resposta modelada como sim/não errando com chance ERRO; eleito sem o dado responde ao acaso.
 * Empate sorteado. null se nenhuma pergunta separa os eleitos que restam.
 */
export function melhorPergunta(
  eleitos: readonly Eleito[],
  probs: readonly number[],
  perguntas: readonly Pergunta[],
  feitas: ReadonlySet<string>,
  rnd: () => number = Math.random,
): Pergunta | null {
  const ativos = eleitos.flatMap((e, i) => (probs[i] > 0 ? [{ e, p: probs[i] }] : []));
  if (ativos.length < 2) return null;
  const pontuadas: { p: Pergunta; ganho: number }[] = [];
  for (const p of perguntas) {
    if (feitas.has(p.id)) continue;
    let sim = 0;
    let nao = 0;
    let nulo = 0;
    for (const a of ativos) {
      const t = p.teste(a.e);
      if (t === true) sim += a.p;
      else if (t === false) nao += a.p;
      else nulo += a.p;
    }
    if (sim === 0 || nao === 0) continue;
    const qSim = (1 - ERRO) * sim + ERRO * nao + 0.5 * nulo;
    const ganho = h(qSim) - (sim + nao) * h(ERRO) - nulo;
    if (ganho > 1e-9) pontuadas.push({ p, ganho });
  }
  if (!pontuadas.length) return null;
  const melhor = Math.max(...pontuadas.map(x => x.ganho));
  const empatadas = pontuadas.filter(x => melhor - x.ganho < 1e-9).map(x => x.p);
  return sortear(empatadas, rnd) ?? null;
}

/** Hora do chute: líder acima do limiar, nenhuma pergunta separa mais, ou 20 perguntas desde o último chute. */
export function deveChutar(estado: {
  topo: number;
  haPergunta: boolean;
  respondidas: number;
  ultimoChute: number;
}): boolean {
  return estado.topo >= LIMIAR_CHUTE || !estado.haPergunta || estado.respondidas - estado.ultimoChute >= CHUTE_A_CADA;
}

/** Candidato do chute: maior probabilidade, desempate pelos votos. null se não sobrou ninguém. */
export function melhorChute(eleitos: readonly Eleito[], probs: readonly number[]): Eleito | null {
  let melhor: Eleito | null = null;
  let pMelhor = 0;
  eleitos.forEach((e, i) => {
    const p = probs[i];
    if (p > pMelhor || (p === pMelhor && p > 0 && melhor && (e.votos ?? 0) > (melhor.votos ?? 0))) {
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
    if (p && contradiz(p, r.valor, e)) saida.push({ pergunta: p, valor: r.valor, correta: p.teste(e) === true });
  }
  return saida;
}
