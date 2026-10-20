// Formato de public/dados/q7.json (gerado pelo SQL 17_q7_vies.sql).

/** Uma nota por eleição (2018, 2020, 2022, 2024); null quando o lugar não tem voto. */
export type Notas = (number | null)[];

/** Prefeito: [sigla 2020, nota, sigla 2024, nota, mesmo partido (0/1)]. */
export type Prefeito = [string | null, number | null, string | null, number | null, number];

/** [cod, nome, índice da UF, região imediata, capital (0/1), notas da régua de cada ano,
 *  notas da régua fixa de 2018, prefeito] */
export type LinhaMunicipio = [number, string, number, number, number, Notas, Notas, Prefeito];

/** [código, nome, índice da UF, nº de cidades, notas da régua de cada ano, notas da régua fixa] */
export type LinhaRegiao = [number, string, number, number, Notas, Notas];

export interface MapaUf {
  w: number;
  h: number;
  /** código do município -> contorno SVG */
  p: Record<string, string>;
}

export interface DadosQ7 {
  ufs: string[];
  anos: number[];
  /** notas das duas pontas e do meio da régua */
  regua: [number, number, number];
  municipios: LinhaMunicipio[];
  regioes: LinhaRegiao[];
  /** por UF (ou TODAS): [média pela régua de cada ano, média pela régua fixa] */
  media: Record<string, [Notas, Notas]>;
  /** por UF (ou TODAS): família de partidos -> votos nas 4 eleições */
  familias: Record<string, Record<string, number[]>>;
  mapas: Record<string, MapaUf>;
}

export type Par = "mun" | "ger";
export type Regua = "fixa" | "rodada";

export interface Filtros {
  uf: string;
  par: Par;
  regua: Regua;
  mapaUf: string;
  sel: number | null;
}

export interface Municipio {
  cod: number;
  nome: string;
  uf: string;
  reg: number;
  cap: boolean;
  rodada: Notas;
  fixa: Notas;
  pref: Prefeito;
  busca: string;
}

/** O que cada seção recebe: dados já preparados e filtros atuais. */
export interface Ctx {
  D: DadosQ7;
  M: Municipio[];
  R: Regiao[];
  f: Filtros;
}

export interface Regiao {
  cd: number;
  nome: string;
  uf: string;
  n: number;
  rodada: Notas;
  fixa: Notas;
}
