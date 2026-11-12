/** Uma UE (estado ou município) num cargo e eleição, em reais da época:
 *  [ano, índice do cargo, índice da UF, código IBGE (0 nos cargos estaduais), nome da UE, vagas, candidatos,
 *  eleitos, despesa de todos, despesa dos eleitos, dinheiro público]. */
export type UeQ1 = [
  ano: number,
  cargo: number,
  uf: number,
  cod: number,
  nome: string,
  vagas: number,
  candidatos: number,
  eleitos: number,
  despesa: number,
  despesaEleitos: number,
  publico: number,
];

export interface DadosQ1 {
  ufs: string[];
  cargos: string[];
  ues: UeQ1[];
  /** multiplicador para reais de agosto de 2024, por ano */
  ipca: Record<string, number>;
}

export interface Filtros {
  uf: string;
  cargo: number;
  ano: number;
}

/** As UEs de um filtro somadas. Valores em reais da época. */
export interface Soma {
  ues: number;
  vagas: number;
  candidatos: number;
  eleitos: number;
  despesa: number;
  despesaEleitos: number;
  publico: number;
  /** despesa ÷ vagas */
  custo: number | null;
  /** despesa dos eleitos ÷ eleitos */
  custoEleito: number | null;
  /** % da despesa que o dinheiro público pagaria */
  pcPublico: number | null;
  /** % da despesa feita pelos eleitos */
  pcEleitos: number | null;
  /** mediana do custo da cadeira entre as UEs (só faz sentido com várias, nos cargos municipais) */
  mediana: number | null;
}
