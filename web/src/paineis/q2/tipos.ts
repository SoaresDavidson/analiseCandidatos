/** Uma linha de `faixas`: [ano, índice da UF, índice do cargo, faixa (0 = sem bens, 1..5 = quintos), candidatos, eleitos]. */
export type LinhaQ2 = [ano: number, uf: number, cargo: number, faixa: number, n: number, e: number];

/** Limites de um quinto de patrimônio em reais: [mínimo, máximo, mediana]. */
export type LimiteQuinto = [min: number, max: number, mediana: number];

/** Por grupo de bem: [% dos eleitos que têm, % dos não eleitos que têm, ...]. Só os dois primeiros são usados. */
export type ComposicaoGrupo = [eleitos: number, naoEleitos: number, ...resto: number[]];

export interface DadosQ2 {
  ufs: string[];
  cargos: string[];
  grupos: string[];
  faixas: LinhaQ2[];
  /** chave "cargo|ano" */
  limites: Record<string, LimiteQuinto[]>;
  qui: Record<string, number[]>;
  /** chave "cargo|ano" */
  composicao: Record<string, Record<string, ComposicaoGrupo>>;
  /** [candidaturas com bem de R$ 100 milhões ou mais, total de candidaturas] */
  suspeitos: [number, number];
}

export interface Filtros {
  uf: string;
  cargo: number;
  ano: number;
}

/** [candidatos, eleitos] de uma faixa. */
export type Faixa = [candidatos: number, eleitos: number];

export interface Teste {
  chi: number;
  p: number;
  valido: boolean;
  n: number;
  e: number;
}
