// Formato de public/dados/q7-brasil.json (scripts/gerar_painel_q3_q7.py, views de sql/17_q7_vies.sql).

/** Uma nota por eleição (2018, 2020, 2022, 2024); null quando o lugar não tem voto. */
export type Notas = (number | null)[];

/** Prefeito: [sigla 2020, nota, sigla 2024, nota, mesmo partido (0/1)]. */
export type Prefeito = [string, number | null, string, number | null, number];

/** [cod, nome, índice da UF, índice da região imediata, capital (0/1), notas, prefeito] */
export type LinhaMunicipio = [number, string, number, number, number, Notas, Prefeito];

/** [código, nome, índice da UF, nº de cidades, notas] */
export type LinhaRegiao = [number, string, number, number, Notas];

export interface DadosQ7 {
  ufs: string[];
  anos: number[];
  /** notas das duas pontas e do meio da régua */
  regua: [number, number, number];
  /** nota do PT e do PL, os dois marcos do chão */
  marcos: { pt: number; pl: number };
  municipios: LinhaMunicipio[];
  regioes: LinhaRegiao[];
  /** "BR" ou a sigla da UF -> média pesada pelos votos */
  media: Record<string, Notas>;
  /** "BR" ou a sigla da UF -> família de partidos -> votos nas 4 eleições */
  familias: Record<string, Record<string, number[]>>;
}

/** O cargo comparado: vereador (2020 e 2024) ou deputado federal (2018 e 2022). */
export type Par = "mun" | "ger";
/** O que o mapa pinta: de que lado está o voto, ou para que lado ele foi. */
export type Modo = "lado" | "mudou";

export interface Filtros {
  /** estado em foco no mapa; null = Brasil */
  uf: string | null;
  /** cidade escolhida */
  sel: number | null;
  par: Par;
  /** 0 = a primeira eleição do par, 1 = a segunda */
  quando: 0 | 1;
  modo: Modo;
}

export interface Municipio {
  cod: number;
  nome: string;
  uf: string;
  cap: boolean;
  notas: Notas;
  pref: Prefeito;
  busca: string;
}

export interface Regiao {
  cd: number;
  nome: string;
  uf: string;
  n: number;
  notas: Notas;
}

/** O que cada seção recebe: dados já preparados e filtros atuais. */
export interface Ctx {
  D: DadosQ7;
  M: Municipio[];
  R: Regiao[];
  f: Filtros;
}
