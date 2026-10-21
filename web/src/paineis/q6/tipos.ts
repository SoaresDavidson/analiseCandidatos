/** Voto para vereador numa eleição: [aptos, % aptos jovens, % aptos 60+, votos, % votos jovens, % votos 60+, % candidatos jovens]. */
export type Voto = [
  aptos: number,
  aptosJovem: number | null,
  aptos60: number | null,
  votos: number,
  votosJovem: number | null,
  votos60: number | null,
  candJovem: number | null,
];

/** Linha crua de `municipios` em q6.json (a ordem das colunas está em `Municipio`). */
export type LinhaMunicipio = [
  cod: number,
  nome: string,
  uf: number,
  capital: number,
  populacao: number,
  idade: number | null,
  pctJovem: number | null,
  pct60: number | null,
  terco: number | null,
  tercoUf: number | null,
  aptos2024: number | null,
  idadeEleitorado: number | null,
  pctEleitoradoJovem: number | null,
  abstencaoJovem: number | null,
  abstencaoDemais: number | null,
  idadeVereadores: number | null,
  pctVereadoresJovens: number | null,
  idadePrefeito: number | null,
  partidos: (string | null)[],
  troca: (number | null)[],
  concorreu: (number | null)[],
  reeleito: (number | null)[],
  voto: (Voto | null)[],
];

/** Linha de `eleitos`: [ano, uf, cargo, candidatos, eleitos, idade cand., idade eleitos, % cand. jovens, % eleitos jovens,
 *  % cand. 60+, % eleitos 60+, chance jovem, chance 30-59, chance 60+]. */
export type LinhaEleitos = (number | null)[];

export interface DadosQ6 {
  ufs: string[];
  cargos: string[];
  municipios: LinhaMunicipio[];
  eleitos: LinhaEleitos[];
  mapas: Record<string, { w: number; h: number; p: Record<string, string> }>;
}

export interface Municipio {
  cod: number;
  nome: string;
  uf: string;
  cap: boolean;
  pop: number;
  idade: number | null;
  pj: number | null;
  pi: number | null;
  /** terço de idade entre os 6 estados (1 = mais jovens ... 3 = mais velhas) */
  terco: number | null;
  /** terço dentro do estado */
  tercoUf: number | null;
  aptos: number | null;
  idEl: number | null;
  pjEl: number | null;
  absJ: number | null;
  absNJ: number | null;
  idVer: number | null;
  pjVer: number | null;
  idPref: number | null;
  /** partido do prefeito eleito em 2016, 2020 e 2024 */
  sg: (string | null)[];
  /** o partido mudou em 2020 e em 2024 (1 = sim, 0 = não, null = sem dado) */
  troca: (number | null)[];
  conc: (number | null)[];
  reel: (number | null)[];
  voto: (Voto | null)[];
  busca: string;
}

export type Corte = "uf" | "todas";
export type Ano = 2020 | 2024;
export type Faixa = "jovem" | "idoso";

export interface Filtros {
  uf: string;
  corte: Corte;
  ano: Ano;
  faixa: Faixa;
  mapaUf: string;
  sel: number | null;
}

/** O que cada seção recebe: dados, municípios já lidos e filtros. */
export interface Ctx {
  D: DadosQ6;
  M: Municipio[];
  f: Filtros;
}
