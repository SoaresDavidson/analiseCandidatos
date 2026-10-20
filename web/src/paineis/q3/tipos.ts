/** Linha de `municipios` em q3.json: cada posição tem um significado fixo (ver `Municipio`). */
export type LinhaMunicipio = [
  cod: number,
  nome: string,
  uf: number,
  capital: number,
  pib: number | null,
  perfil: number,
  pop: number | null,
  aptos: number,
  renda: number | null,
  estudo: number | null,
  prefeito: string,
  bancada: string,
  qtBancada: number,
  empate: number,
  voto: number | null,
  eleitHab: number | null,
  isentos: number,
];

export interface DadosQ3 {
  ufs: string[];
  perfis: string[];
  /** [esquerda extrema, direita extrema, meio] da régua do voto. */
  regua: [number, number, number];
  /** partido -> [nota, categoria] */
  partidos: Record<string, [number, string]>;
  municipios: LinhaMunicipio[];
}

export interface Municipio {
  cod: number;
  nome: string;
  uf: string;
  cap: boolean;
  pib: number | null;
  perfil: number;
  pop: number | null;
  aptos: number;
  renda: number | null;
  estudo: number | null;
  pref: string;
  banc: string;
  qtBanc: number;
  empate: boolean;
  voto: number | null;
  eleitHab: number | null;
  isentos: number;
  busca: string;
}

export type ChaveIndice = "pib" | "renda" | "isentos" | "eleitores";

export interface Indice {
  rot: string;
  curto: string;
  v: (m: Municipio) => number | null;
  f: (v: number | null) => string;
  log: boolean;
  frase: string;
}

export interface Filtros {
  uf: string;
  indice: ChaveIndice;
  sel: number | null;
}
