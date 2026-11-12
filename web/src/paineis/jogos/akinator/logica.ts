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
/**
 * Contradições toleradas para um eleito continuar entre os "candidatos possíveis" ("Sim"/"Não"
 * contam 1, "provavelmente" conta 0,5). Quando ninguém fica dentro disso, o gênio desiste.
 */
export const TOLERANCIA = 2;
/** Ganho mínimo, em bits, para uma pergunta valer a pena; abaixo disso o gênio chuta. */
export const GANHO_MINIMO = 0.01;

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
 * Resultado de cada pergunta para cada eleito (mesma ordem de `eleitos`): 1 sim, -1 não, 0 sem dado.
 * Os testes não mudam durante a partida, então a tabela é montada uma vez por baralho.
 */
export interface Tabela {
  eleitos: readonly Eleito[];
  perguntas: readonly Pergunta[];
  linhas: ReadonlyMap<string, Int8Array>;
}

export function montarTabela(eleitos: readonly Eleito[], perguntas: readonly Pergunta[]): Tabela {
  const linhas = new Map<string, Int8Array>();
  for (const p of perguntas) {
    const linha = new Int8Array(eleitos.length);
    eleitos.forEach((e, i) => {
      const t = p.teste(e);
      linha[i] = t === null ? 0 : t ? 1 : -1;
    });
    linhas.set(p.id, linha);
  }
  return { eleitos, perguntas, linhas };
}

/**
 * P(resposta | dado): 1 - ERRO se a resposta concorda com o dado (1 sim, -1 não), ERRO se
 * contradiz, interpolado para "provavelmente" (0,7 / 0,3). "Não sei" e dado ausente (0) valem 1:
 * não mudam nada.
 */
export function chance(dado: number, valor: number): number {
  if (dado === 0 || valor === 0) return 1;
  const acerto = 0.5 + Math.abs(valor) * (0.5 - ERRO);
  return valor > 0 === dado > 0 ? acerto : 1 - acerto;
}

/** P(resposta | eleito), com o dado tirado da pergunta. */
export function verossimilhanca(p: Pergunta, valor: number, e: Eleito): number {
  const t = p.teste(e);
  return chance(t === null ? 0 : t ? 1 : -1, valor);
}

/** true quando a resposta contradiz o dado do eleito. */
export const contradiz = (p: Pergunta, valor: number, e: Eleito): boolean => verossimilhanca(p, valor, e) < 0.5;

/** Peso da contradição: 1 para "Sim"/"Não", 0,5 para "provavelmente", 0 se não contradiz. */
const peso = (dado: number, valor: number): number => (chance(dado, valor) < 0.5 ? Math.abs(valor) : 0);

export interface Avaliacao {
  /** Probabilidade de cada eleito (mesma ordem de `eleitos`). Excluídos valem 0. Soma 1, ou tudo 0. */
  probs: Float64Array;
  /** Índice do líder (maior probabilidade, desempate pelos votos); -1 se não sobrou ninguém. */
  lider: number;
  /** Probabilidade do líder. */
  topo: number;
  /** Eleitos não excluídos com no máximo TOLERANCIA de contradições: a contagem na tela. */
  plausiveis: number;
}

/**
 * Aplica as respostas partindo de uma distribuição uniforme e resume o resultado numa passada.
 * A conta é feita em log para não estourar com muitas respostas.
 */
export function avaliar(
  tabela: Tabela,
  respostas: readonly Resposta[],
  excluidos: ReadonlySet<number> = new Set(),
): Avaliacao {
  const { eleitos, linhas } = tabela;
  const n = eleitos.length;
  const logs = new Float64Array(n);
  const contra = new Float64Array(n);
  for (const r of respostas) {
    const linha = linhas.get(r.id);
    if (!linha) continue;
    const lSim = Math.log(chance(1, r.valor));
    const lNao = Math.log(chance(-1, r.valor));
    const cSim = peso(1, r.valor);
    const cNao = peso(-1, r.valor);
    for (let i = 0; i < n; i++) {
      if (linha[i] === 1) {
        logs[i] += lSim;
        contra[i] += cSim;
      } else if (linha[i] === -1) {
        logs[i] += lNao;
        contra[i] += cNao;
      }
    }
  }
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < n; i++) {
    if (excluidos.has(eleitos[i].id)) logs[i] = Number.NEGATIVE_INFINITY;
    else if (logs[i] > max) max = logs[i];
  }
  const probs = new Float64Array(n);
  if (max === Number.NEGATIVE_INFINITY) return { probs, lider: -1, topo: 0, plausiveis: 0 };
  let total = 0;
  for (let i = 0; i < n; i++) {
    probs[i] = Math.exp(logs[i] - max);
    total += probs[i];
  }
  let lider = -1;
  let topo = 0;
  let plausiveis = 0;
  for (let i = 0; i < n; i++) {
    const p = probs[i] / total;
    probs[i] = p;
    if (p === 0) continue;
    if (contra[i] <= TOLERANCIA) plausiveis++;
    if (p > topo || (p === topo && (eleitos[i].votos ?? 0) > (eleitos[lider].votos ?? 0))) {
      lider = i;
      topo = p;
    }
  }
  return { probs, lider, topo, plausiveis };
}

/**
 * Entropia (em nats) da distribuição depois de uma resposta que multiplica a probabilidade de cada
 * grupo g por w[g]. s[g] é a soma de p no grupo e t[g] a soma de p·ln p.
 */
function entropiaApos(s: readonly number[], t: readonly number[], w: readonly number[]): number {
  let z = 0;
  for (let g = 0; g < 3; g++) z += w[g] * s[g];
  let soma = 0;
  for (let g = 0; g < 3; g++) if (s[g] > 0) soma += w[g] * (t[g] + s[g] * Math.log(w[g] / z));
  return -soma / z;
}

/**
 * Pergunta ainda não feita que mais reduz, em média, a entropia da distribuição. A redução usa a
 * mesma `chance` de `avaliar` (eleito sem o dado não se mexe). Para prever a resposta, supõe-se
 * "Sim" ou "Não" (errando com chance ERRO) e que quem não tem o dado responde qualquer um dos dois.
 * Empate sorteado. null se nenhuma pergunta rende pelo menos GANHO_MINIMO bits.
 */
export function melhorPergunta(
  tabela: Tabela,
  probs: ArrayLike<number>,
  feitas: ReadonlySet<string>,
  rnd: () => number = Math.random,
): Pergunta | null {
  const n = probs.length;
  const plnp = new Float64Array(n);
  let h0 = 0;
  let ativos = 0;
  for (let i = 0; i < n; i++) {
    const p = probs[i];
    if (p > 0) {
      ativos++;
      plnp[i] = p * Math.log(p);
      h0 -= plnp[i];
    }
  }
  if (ativos < 2) return null;
  const wSim = [chance(1, 1), chance(-1, 1), 1];
  const wNao = [chance(1, -1), chance(-1, -1), 1];
  const pontuadas: { p: Pergunta; ganho: number }[] = [];
  let melhor = 0;
  for (const p of tabela.perguntas) {
    const linha = tabela.linhas.get(p.id);
    if (!linha || feitas.has(p.id)) continue;
    // grupos: 0 = sim, 1 = não, 2 = sem dado
    const s = [0, 0, 0];
    const t = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      const q = probs[i];
      if (q === 0) continue;
      const g = linha[i] === 1 ? 0 : linha[i] === -1 ? 1 : 2;
      s[g] += q;
      t[g] += plnp[i];
    }
    if (s[0] === 0 || s[1] === 0) continue;
    const pSim = (1 - ERRO) * s[0] + ERRO * s[1] + 0.5 * s[2];
    const depois = pSim * entropiaApos(s, t, wSim) + (1 - pSim) * entropiaApos(s, t, wNao);
    const ganho = (h0 - depois) / Math.LN2;
    if (ganho < GANHO_MINIMO) continue;
    pontuadas.push({ p, ganho });
    if (ganho > melhor) melhor = ganho;
  }
  const empatadas = pontuadas.filter(x => melhor - x.ganho < 1e-9).map(x => x.p);
  return sortear(empatadas, rnd) ?? null;
}

/**
 * Hora do chute: líder acima do limiar (com pelo menos uma resposta desde o último chute, para não
 * emendar chutes depois de um erro), nenhuma pergunta útil, ou 20 perguntas desde o último chute.
 */
export function deveChutar(estado: {
  topo: number;
  haPergunta: boolean;
  respondidas: number;
  ultimoChute: number;
}): boolean {
  const desde = estado.respondidas - estado.ultimoChute;
  return (estado.topo >= LIMIAR_CHUTE && desde > 0) || !estado.haPergunta || desde >= CHUTE_A_CADA;
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
