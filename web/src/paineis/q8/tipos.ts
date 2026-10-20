/** Uma linha de `q8`: [ano, índice da UF, índice do cargo, faixa (0..21), candidatos, eleitos]. */
export type LinhaQ8 = [ano: number, uf: number, cargo: number, faixa: number, n: number, e: number];

export interface DadosQ8 {
  ufs: string[];
  cargos: string[];
  q8: LinhaQ8[];
}

export interface Filtros { ano: number; uf: string; cargo: number; corte: number }
export interface Grupo { n: number; e: number }
export interface Comparacao {
  g: { pub: Grupo; out: Grupo };
  tp: number | null;
  to: number | null;
  dif: number | null;
  p: number | null;
  ok: boolean;
  real: boolean;
}
