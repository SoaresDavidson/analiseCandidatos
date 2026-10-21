/** Linha de q9c: [ano, uf, cargo, eleito (0/1), canal, nº candidatos, nº despesas, valor em R$]. */
export type LinhaCanal = [number, number, number, number, number, number, number, number];

/** Palavras de um recorte: [índices em `termos`, nº de despesas, valor em R$], na mesma ordem. */
export type GrupoTermos = [number[], number[], number[]];

export interface DadosQ9 {
  ufs: string[];
  cargos: string[];
  canais: string[];
  q9c: LinhaCanal[];
  termos: string[];
  /** chave: "ano|cargo|uf (6 = todas)|eleito (0/1/2)|canal (0-7, 8 = todos)" */
  q9t: Record<string, GrupoTermos>;
  /** total de despesas com descrição no mesmo recorte de q9t */
  q9tot: Record<string, number>;
  top: number;
}

export interface Palavra {
  t: number;
  termo: string;
  n: number;
  vr: number;
}

export interface Filtros {
  ano: number;
  uf: string;
  cargo: number;
  eleito: number;
}
