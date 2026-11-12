// Tipos dos JSON de public/dados/q4.json (o país) e q4/<UF>.json (cada estado), e constantes do livro.

/** [ano, uf, grupo (0 população, 1 candidatos, 2 eleitos), nível 1-4, quantidade] */
export type LinhaPerfil = [ano: number, uf: string, grupo: number, nivel: number, valor: number];
/** [ano, uf, cargo, grau 1-8, candidatos, eleitos] */
export type LinhaChance = [ano: number, uf: string, cargo: number, grau: number, candidatos: number, eleitos: number];
/** [ano, uf, código IBGE (0 = cargo estadual), cargo, grau, nome de urna, partido, nome civil, sq] */
export type LinhaEleito = [
  ano: number,
  uf: string,
  cod: number,
  cargo: number,
  grau: number,
  urna: string,
  partido: string,
  civil: string,
  sq: number,
];

export interface MunicipioBruto {
  n: string;
  u: string;
  ver: number;
  /** População de 18+ por nível (null: cidade criada depois do Censo). */
  pop: number[] | null;
  /** Eleitos de 2024 por nível. */
  el: number[];
  /** Eleitos de 2024 por grau (1-8). */
  g: number[];
  pref: number | null;
  emp: boolean;
  cap?: boolean;
}

/** O país: perfil e chance por estado, e a comparação entre cidades já resumida. */
export interface DadosQ4 {
  ufs: string[];
  perfil: LinhaPerfil[];
  chance: LinhaChance[];
  /** "BR" ou a sigla -> [nº de cidades, % de eleitos com faculdade no quinto de cidades menos formado,
   *  no quinto mais formado, correlação, correlação sem o quinto mais formado] */
  cidades: Record<string, ResumoCidades>;
  excecoes: { semPrefeito: number; semVereador: number; semCenso: string[] };
}
export type ResumoCidades = [n: number, q1: number | null, q5: number | null, r: number | null, r80: number | null];

/** Um estado: os municípios e os eleitos de 2022 e 2024. */
export interface DadosUf {
  uf: string;
  mun: Record<string, MunicipioBruto>;
  eleitos: LinhaEleito[];
}

/** Município com os campos derivados que o painel usa. */
export interface Municipio extends MunicipioBruto {
  cod: number;
  ok: boolean;
  te: number;
  popTotal: number;
  pPop: number | null;
  pEl: number | null;
  modaPop: number | null;
  modaEl: number | null;
}

export interface Eleito {
  ano: number;
  uf: string;
  cod: number;
  cargo: number;
  grau: number;
  urna: string;
  civil: string;
  partido: string;
  sq: number;
}

export type Metrica = "pop" | "el" | "dist";

/** O que o leitor escolheu e o livro lembra: o cargo (que já diz a eleição) e o que o mapa pinta. */
export interface Filtros {
  cargo: number;
  metrica: Metrica;
  /** a eleição geral na tela: 2022 ou 2026 */
  geral?: number;
}

/** A eleição geral mais nova: entra numa caixinha à parte, ao lado de 2022. */
export const ANO_2026 = 2026;

/** Nomes simples dos 4 níveis do Censo (a nota explica o que cada um inclui). */
export const NIVEL: Record<number, string> = {
  1: "Sem fundamental completo",
  2: "Fundamental completo",
  3: "Médio completo",
  4: "Faculdade completa",
};
export const GRAU: Record<number, string> = {
  1: "Analfabeto",
  2: "Lê e escreve",
  3: "Fundamental incompleto",
  4: "Fundamental completo",
  5: "Médio incompleto",
  6: "Médio completo",
  7: "Superior incompleto",
  8: "Superior completo",
};
export const GRAU_NIVEL: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 3, 8: 4 };
/** Os cargos na ordem dos botões; o 7 (deputado estadual) inclui o distrital do DF (8). */
export const ORDEM_CARGOS: readonly number[] = [13, 11, 7, 6, 5, 3];
export const ANO_DO_CARGO: Record<number, number> = { 13: 2024, 11: 2024, 7: 2022, 8: 2022, 6: 2022, 5: 2022, 3: 2022 };
export const CARGO: Record<number, string> = {
  3: "Governador",
  5: "Senador",
  6: "Dep. federal",
  7: "Dep. estadual",
  8: "Dep. distrital",
  11: "Prefeito",
  13: "Vereador",
};
export const PLURAL: Record<number, string> = {
  3: "governador",
  5: "senador",
  6: "deputado federal",
  7: "deputado estadual",
  8: "deputado distrital",
  11: "prefeito",
  13: "vereador",
};
/** Cor de cada nível (tokens de styles/tema.css). */
export const COR_NIVEL = (n: number): string => `var(--color-nivel-${n})`;

/** Um estado já carregado e pronto para as páginas dele. */
export interface EstadoPronto {
  uf: string;
  MUN: Municipio[];
  MUN_BY: Record<number, Municipio>;
  ELEITOS: Eleito[];
  /** contornos dos municípios: código IBGE -> [caminho, x do centro, y do centro] */
  malha: { bb: [number, number, number, number]; p: Record<string, [string, number, number]> };
}
