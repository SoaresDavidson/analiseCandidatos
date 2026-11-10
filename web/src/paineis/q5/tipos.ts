/** Um partido num estado, cargo e eleição:
 *  [ano, índice da UF, índice do cargo, partido, eleitos, eleitos pela legenda, votos nominais, votos de legenda]. */
export type PartidoQ5 = [
  ano: number,
  uf: number,
  cargo: number,
  partido: string,
  eleitos: number,
  eleitosLegenda: number,
  nominais: number,
  legenda: number,
];

/** Um candidato que a legenda pôs ou tirou da cadeira:
 *  [ano, UF, cargo, nome da UE, candidato, partido, lista, partidos na lista, votos, 1 = eleito pela legenda / 0 = ficou fora]. */
export type AfetadoQ5 = [
  ano: number,
  uf: number,
  cargo: number,
  ue: string,
  nome: string,
  partido: string,
  lista: string,
  partidosNaLista: number,
  votos: number,
  eleito: number,
];

export interface DadosQ5 {
  ufs: string[];
  cargos: string[];
  partidos: PartidoQ5[];
  afetados: AfetadoQ5[];
}

export interface Filtros {
  uf: string;
  cargo: number;
  ano: number;
}

export interface Soma {
  eleitos: number;
  eleitosLegenda: number;
  nominais: number;
  legenda: number;
  /** % dos eleitos que só entraram pela legenda */
  pcEleitos: number | null;
  /** % dos votos (nominais + legenda) que foram na legenda */
  pcVotos: number | null;
}

/** Uma cidade (ou estado) com quem entrou pela legenda e quem ficaria com a vaga sem ela. */
export interface Troca {
  uf: number;
  ue: string;
  entraram: AfetadoQ5[];
  ficaramFora: AfetadoQ5[];
}
