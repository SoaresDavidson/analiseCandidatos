import type { Eleito } from "../../candidatos/tipos";
import { sortear, vitorias } from "../comum";

// Regras puras do "Quem ganha?": critérios, grupos justos de comparação, sorteio de pares
// e a curva de dificuldade. Nada aqui depende de React.

export interface Criterio {
  id: string;
  pergunta: string;
  /** valor do eleito no critério; null quando não há dado */
  valor: (e: Eleito) => number | null;
  formatar: (v: number) => string;
}

const reais = (v: number): string => {
  const a = Math.abs(v);
  if (a >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} bi`;
  if (a >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`;
  return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
};

export const CRITERIOS: readonly Criterio[] = [
  {
    id: "votos",
    pergunta: "Quem teve MAIS votos?",
    valor: e => e.votos,
    formatar: v => Math.round(v).toLocaleString("pt-BR"),
  },
  { id: "receita", pergunta: "Quem arrecadou MAIS na campanha?", valor: e => e.receita, formatar: reais },
  { id: "patrimonio", pergunta: "Quem declarou MAIS patrimônio?", valor: e => e.patrimonio, formatar: reais },
  {
    id: "gasto-voto",
    pergunta: "Quem gastou MAIS por voto?",
    valor: e => (e.receita != null && e.votos != null && e.votos > 0 ? e.receita / e.votos : null),
    formatar: v => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/voto`,
  },
  {
    id: "idade",
    pergunta: "Quem é MAIS velho?",
    valor: e => e.idade,
    formatar: v => `${Math.round(v)} anos`,
  },
  {
    id: "vitorias",
    pergunta: "Quem tem MAIS vitórias na carreira?",
    valor: e => vitorias(e),
    formatar: v => `${Math.round(v)} ${Math.round(v) === 1 ? "vitória" : "vitórias"}`,
  },
  { id: "propaganda", pergunta: "Quem gastou MAIS com propaganda?", valor: e => e.propaganda, formatar: reais },
];

export const MISTURADO = "misturado";

export const criterioPorId = (id: string): Criterio | undefined => CRITERIOS.find(c => c.id === id);

export interface Grupo {
  id: string;
  rotulo: string;
  pertence: (e: Eleito) => boolean;
}

/** Cada eleito só se compara com quem disputou o mesmo tipo de eleição. */
export const GRUPOS: readonly Grupo[] = [
  { id: "prefeitos", rotulo: "Prefeitos 2024", pertence: e => e.cargo === 11 && e.ano === 2024 },
  { id: "vereadores", rotulo: "Vereadores 2024", pertence: e => e.cargo === 13 && e.ano === 2024 },
  { id: "estaduais", rotulo: "Deputados estaduais 2022", pertence: e => e.cargo === 7 && e.ano === 2022 },
  { id: "federais", rotulo: "Deputados federais 2022", pertence: e => e.cargo === 6 && e.ano === 2022 },
  {
    id: "executivo-senado",
    rotulo: "Governadores e senadores 2022",
    pertence: e => (e.cargo === 3 || e.cargo === 5) && e.ano === 2022,
  },
];

export const grupoDe = (e: Eleito): Grupo | undefined => GRUPOS.find(g => g.pertence(e));

export type Rnd = () => number;

/** Maior razão permitida (maior valor / menor valor) para a sequência atual: começa
 *  enorme (qualquer par serve) e cai até ~1,05 (valores quase iguais). */
export function razaoMaxima(sequencia: number): number {
  return 1.05 + 60 * 0.85 ** Math.max(0, sequencia);
}

/** Razão maior/menor entre dois valores; Infinity se o menor for zero. */
export function razao(a: number, b: number): number {
  const mx = Math.max(a, b);
  const mn = Math.min(a, b);
  if (mn <= 0) return mx <= 0 ? 1 : Infinity;
  return mx / mn;
}

/** Acertou? `escolha` é o lado clicado; vale o de maior valor. */
export function acertou(a: number, b: number, escolha: "a" | "b"): boolean {
  return escolha === "a" ? a > b : b > a;
}

export interface Rodada {
  a: Eleito;
  b: Eleito;
  criterio: Criterio;
  grupo: Grupo;
}

export interface Pedido {
  eleitos: readonly Eleito[];
  /** id do critério ou MISTURADO */
  modo: string;
  /** sigla do estado ou "TODAS" */
  uf: string;
  sequencia: number;
  /** quem venceu e fica (modo clássico); o desafiante é do mesmo grupo */
  fixo?: Eleito;
  rnd?: Rnd;
}

/** Elegíveis do grupo para o critério (valor não nulo), opcionalmente de um estado. */
export function candidatos(eleitos: readonly Eleito[], grupo: Grupo, criterio: Criterio, uf: string): Eleito[] {
  return eleitos.filter(e => grupo.pertence(e) && (uf === "TODAS" || e.uf === uf) && criterio.valor(e) != null);
}

/** Sorteia o par num grupo e critério já escolhidos; null se não houver par possível.
 *  Com `fixo`, ele é o primeiro do par e o desafiante vem de `pool`. */
export function sortearPar(
  pool: readonly Eleito[],
  criterio: Criterio,
  sequencia: number,
  rnd: Rnd = Math.random,
  fixo?: Eleito,
): [Eleito, Eleito] | null {
  const v = (e: Eleito) => criterio.valor(e) as number;
  if (fixo && criterio.valor(fixo) == null) return null;
  const a = fixo ?? sortear(pool, rnd);
  if (!a || criterio.valor(a) == null) return null;
  const va = v(a);
  const outros = pool.filter(e => e.sq !== a.sq && criterio.valor(e) != null && v(e) !== va);
  if (!outros.length) return null;
  const limite = razaoMaxima(sequencia);
  const perto = outros.filter(e => razao(va, v(e)) <= limite);
  // se ninguém chega perto o bastante, fica o mais próximo possível
  const escolhido = perto.length
    ? sortear(perto, rnd)
    : outros.reduce((m, e) => (razao(va, v(e)) < razao(va, v(m)) ? e : m));
  return escolhido ? [a, escolhido] : null;
}

/** Monta a próxima rodada (sorteia grupo e critério). Estado sem par cai para os 6 estados. */
export function novaRodada({ eleitos, modo, uf, sequencia, fixo, rnd = Math.random }: Pedido): Rodada | null {
  const criterios = modo === MISTURADO ? CRITERIOS : [criterioPorId(modo) ?? CRITERIOS[0]];
  const grupos = fixo ? [grupoDe(fixo)].filter((g): g is Grupo => !!g) : GRUPOS;
  for (const estado of uf === "TODAS" ? ["TODAS"] : [uf, "TODAS"]) {
    // pesos iguais por grupo: sorteia o grupo antes do eleito
    for (let t = 0; t < 20; t++) {
      const grupo = sortear(grupos, rnd);
      const criterio = sortear(criterios, rnd);
      if (!grupo || !criterio) continue;
      const pool = candidatos(eleitos, grupo, criterio, estado);
      const par = sortearPar(pool, criterio, sequencia, rnd, fixo);
      if (par) return { a: par[0], b: par[1], criterio, grupo };
    }
  }
  return null;
}
