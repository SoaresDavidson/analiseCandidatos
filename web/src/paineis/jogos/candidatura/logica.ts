// Lógica pura do jogo "Monte sua candidatura": nota do jogador, cidades onde ele ganharia,
// partidos mais próximos e prefeito parecido. Sem React, para testar no Vitest.

export interface Proposta {
  id: string;
  tema: string;
  icone: string;
  texto: string;
  /** −1: concordar leva à esquerda; +1: concordar leva à direita */
  direcao: -1 | 1;
}

export const PROPOSTAS: readonly Proposta[] = [
  { id: "renda", tema: "Renda", icone: "💸", texto: "Ampliar os programas de transferência de renda.", direcao: -1 },
  { id: "impostos", tema: "Impostos", icone: "🏭", texto: "Reduzir os impostos pagos pelas empresas.", direcao: 1 },
  { id: "estatais", tema: "Estatais", icone: "🏢", texto: "Privatizar empresas estatais.", direcao: 1 },
  { id: "tarifa", tema: "Transporte", icone: "🚌", texto: "Tarifa zero no ônibus urbano.", direcao: -1 },
  {
    id: "policia",
    tema: "Segurança",
    icone: "👮",
    texto: "Mais policiamento nas ruas e penas mais duras.",
    direcao: 1,
  },
  { id: "cotas", tema: "Minorias", icone: "🤝", texto: "Ampliar cotas e políticas para minorias.", direcao: -1 },
  { id: "militar", tema: "Escola", icone: "🎖️", texto: "Escolas cívico-militares na rede pública.", direcao: 1 },
  { id: "terra", tema: "Terra", icone: "🌾", texto: "Fazer a reforma agrária.", direcao: -1 },
  {
    id: "ambiente",
    tema: "Ambiente",
    icone: "🌳",
    texto: "Reduzir a regulação ambiental para o agronegócio.",
    direcao: 1,
  },
  { id: "saude", tema: "Saúde", icone: "🏥", texto: "Saúde 100% pública e ampliada.", direcao: -1 },
];

export const NIVEIS: readonly { valor: number; rotulo: string; curto: string }[] = [
  { valor: -2, rotulo: "Discordo muito", curto: "−2" },
  { valor: -1, rotulo: "Discordo", curto: "−1" },
  { valor: 0, rotulo: "Neutro", curto: "0" },
  { valor: 1, rotulo: "Concordo", curto: "+1" },
  { valor: 2, rotulo: "Concordo muito", curto: "+2" },
];

/** Distância máxima (em pontos da nota) para o jogador ganhar numa cidade. */
export const LIMITE = 0.35;
/** "Perto": até duas vezes o limite. */
export const FATOR_PERTO = 2;

const limitar = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Nota 0–10 = 5 + 5 × Σ(direção × resposta) / (2 × N). Respostas em −2..+2, na ordem das direções. */
export function calcularNota(direcoes: readonly number[], respostas: readonly number[]): number {
  const n = direcoes.length;
  if (n === 0) return 5;
  let soma = 0;
  for (let i = 0; i < n; i++) soma += direcoes[i] * (respostas[i] ?? 0);
  return limitar(5 + (5 * soma) / (2 * n), 0, 10);
}

export type Nivel = "forte" | "perto" | "longe";

export interface Cidade {
  cod: number;
  nome: string;
  uf: string;
  cap: boolean;
  /** nota de 2024 da cidade (régua de cada ano) */
  nota: number;
}

export interface CidadeRanque extends Cidade {
  dist: number;
  nivel: Nivel;
}

export const nivelDe = (dist: number, limite = LIMITE): Nivel =>
  dist <= limite ? "forte" : dist <= limite * FATOR_PERTO ? "perto" : "longe";

/** Todas as cidades com nota, da mais próxima da sua nota para a mais distante. */
export function ranquear(cidades: readonly Cidade[], nota: number, limite = LIMITE): CidadeRanque[] {
  return cidades
    .map(c => {
      const dist = Math.abs(c.nota - nota);
      return { ...c, dist, nivel: nivelDe(dist, limite) };
    })
    .sort((a, b) => a.dist - b.dist || a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Cidades onde você ganharia (dist ≤ limite). */
export const favoraveis = (ranque: readonly CidadeRanque[]): CidadeRanque[] => ranque.filter(c => c.nivel === "forte");

/** Quantas cidades favoráveis por estado, da maior para a menor contagem. */
export function contarPorUf(fav: readonly Cidade[]): [string, number][] {
  const m = new Map<string, number>();
  for (const c of fav) m.set(c.uf, (m.get(c.uf) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

type Espectro = Readonly<Record<string, readonly [number, ...unknown[]]>>;

export interface PartidoNota {
  partido: string;
  nota: number;
  dist: number;
}

/** Partidos do ano, do mais próximo ao mais distante da nota. `espectro`: "ano|partido" -> [nota, ...]. */
export function partidosDoAno(espectro: Espectro, ano: number, nota: number): PartidoNota[] {
  const pref = `${ano}|`;
  return Object.entries(espectro)
    .filter(([k]) => k.startsWith(pref))
    .map(([k, v]) => ({ partido: k.slice(pref.length), nota: v[0], dist: Math.abs(v[0] - nota) }))
    .sort((a, b) => a.dist - b.dist || a.partido.localeCompare(b.partido, "pt-BR"));
}

export const partidosProximos = (espectro: Espectro, ano: number, nota: number, n = 3): PartidoNota[] =>
  partidosDoAno(espectro, ano, nota).slice(0, n);

export interface EleitoMin {
  ano: number;
  cargo: number;
  cod: number;
  sq: number;
  nome: string;
  partido: string;
  espectro: readonly [number, ...unknown[]] | null;
}

/** Prefeito (cargo 11) eleito em 2024 numa das cidades dadas, de partido com a nota mais próxima da sua. */
export function prefeitoParecido<E extends EleitoMin>(eleitos: readonly E[], cods: ReadonlySet<number>, nota: number) {
  let melhor: { eleito: E; dist: number } | null = null;
  for (const e of eleitos) {
    if (e.ano !== 2024 || e.cargo !== 11 || !e.espectro || !cods.has(e.cod)) continue;
    const dist = Math.abs(e.espectro[0] - nota);
    if (!melhor || dist < melhor.dist || (dist === melhor.dist && e.sq < melhor.eleito.sq))
      melhor = { eleito: e, dist };
  }
  return melhor;
}

const f1 = (x: number) => x.toFixed(1).replace(".", ",");

/** Texto para copiar e colar. */
export function textoResultado(o: {
  nome: string;
  cargo: string;
  nota: number;
  categoria: string;
  partidos: readonly string[];
  ganharia: number;
  total: number;
  topo: readonly string[];
}): string {
  return [
    `${o.nome || "Eu"} (${o.cargo}, 2024) · nota ${f1(o.nota)}/10: ${o.categoria}`,
    `Partidos mais parecidos: ${o.partidos.join(", ")}`,
    `Eu ganharia em ${o.ganharia} de ${o.total} cidades${o.topo.length ? `, como ${o.topo.join(", ")}` : ""}.`,
    "Monte sua candidatura · painel de análise dos eleitos",
  ].join("\n");
}
