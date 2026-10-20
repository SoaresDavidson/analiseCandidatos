// Tipos do JSON de public/dados/q4.json e constantes do painel de escolaridade.

/** [ano, uf, grupo (0 população, 1 candidatos, 2 eleitos), nível 1-4, quantidade] */
export type LinhaPerfil = [ano: number, uf: string, grupo: number, nivel: number, valor: number];
/** [ano, uf, cargo, grau 1-8, candidatos, eleitos] */
export type LinhaChance = [ano: number, uf: string, cargo: number, grau: number, candidatos: number, eleitos: number];
/** [ano, uf, código IBGE (0 = cargo estadual), cargo, grau, nome de urna, partido, nome civil, sq] */
export type LinhaEleito = [ano: number, uf: string, cod: number, cargo: number, grau: number, urna: string, partido: string, civil: string, sq: number];

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
  pref: number;
  emp: boolean;
  cap?: boolean;
}

export interface MapaUf { w: number; h: number; p: Record<string, string> }

export interface DadosQ4 {
  eleitos: LinhaEleito[];
  perfil: LinhaPerfil[];
  chance: LinhaChance[];
  mun: Record<string, MunicipioBruto>;
  mapas: Record<string, MapaUf>;
  cap: Record<string, string>;
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

export interface Filtros {
  ano: number;
  uf: string;
  cargo: number;
  mapaUf: string;
  metrica: Metrica;
  semCap: boolean;
}

export const UFS = ["AM", "GO", "MA", "MT", "RS", "SE"];
export const UF_NOME: Record<string, string> = { AM: "Amazonas", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", RS: "Rio Grande do Sul", SE: "Sergipe" };
/** Nomes simples dos 4 níveis do Censo (a nota explica o que cada um inclui). */
export const NIVEL: Record<number, string> = { 1: "Sem fundamental completo", 2: "Fundamental completo", 3: "Médio completo", 4: "Faculdade completa" };
export const GRAU: Record<number, string> = { 1: "Analfabeto", 2: "Lê e escreve", 3: "Fundamental incompleto", 4: "Fundamental completo", 5: "Médio incompleto", 6: "Médio completo", 7: "Superior incompleto", 8: "Superior completo" };
export const GRAU_NIVEL: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 3, 8: 4 };
export const CARGOS: Record<number, number[]> = { 2022: [7, 6, 5, 3], 2024: [13, 11] };
export const CARGO: Record<number, string> = { 3: "Governador", 5: "Senador", 6: "Dep. federal", 7: "Dep. estadual", 11: "Prefeito", 13: "Vereador" };
export const PLURAL: Record<number, string> = { 3: "governador", 5: "senador", 6: "deputado federal", 7: "deputado estadual", 11: "prefeito", 13: "vereador" };
export const PLURAIS: Record<number, string> = { 3: "governadores", 5: "senadores", 6: "deputados federais", 7: "deputados estaduais", 11: "prefeitos", 13: "vereadores" };
/** Cor de cada nível (tokens de styles/tema.css). */
export const COR_NIVEL = (n: number): string => `var(--color-nivel-${n})`;
