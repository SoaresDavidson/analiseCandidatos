// Tipos de public/dados/q6.json (o país inteiro, eleição municipal de 2024) e da página.

/** Voto para vereador em 2024 numa cidade: [aptos, % aptos jovens, % aptos 60+, votos, % votos em jovens,
 *  % votos em 60+, % candidatos jovens, idade média de quem recebeu os votos]. */
export type Voto = [
  aptos: number,
  aptosJovem: number | null,
  aptos60: number | null,
  votos: number,
  votosJovem: number | null,
  votos60: number | null,
  candJovem: number | null,
  idadeVoto: number | null,
];

/** Linha crua de `municipios` (a ordem das colunas está em `Municipio`). */
export type LinhaMunicipio = [
  cod: number,
  nome: string,
  uf: number,
  capital: number,
  populacao: number,
  idade: number | null,
  terco: number | null,
  tercoUf: number | null,
  aptos2024: number | null,
  idadeEleitorado: number | null,
  idadeVereadores: number | null,
  pctVereadoresJovens: number | null,
  idadePrefeito: number | null,
  partidos: [string, string],
  troca: number | null,
  concorreu: number | null,
  reeleito: number | null,
  voto: Voto | null,
];

/** Linha de `eleitos`: [ano, uf, cargo, candidatos, eleitos, idade cand., idade eleitos, % cand. jovens, % eleitos jovens,
 *  % cand. 60+, % eleitos 60+, chance jovem, chance 30-59, chance 60+]. */
export type LinhaEleitos = (number | null)[];

export interface DadosQ6 {
  ufs: string[];
  cargos: string[];
  municipios: LinhaMunicipio[];
  eleitos: LinhaEleitos[];
}

export interface Municipio {
  cod: number;
  nome: string;
  uf: string;
  cap: boolean;
  pop: number;
  /** idade média de quem mora (Censo 2022) */
  idade: number | null;
  /** terço de idade entre as cidades do país (1 = mais jovens ... 3 = mais velhas) */
  terco: number | null;
  /** terço dentro do estado */
  tercoUf: number | null;
  aptos: number | null;
  /** idade média dos eleitores (2024) */
  idEl: number | null;
  /** idade média dos vereadores eleitos (2024) */
  idVer: number | null;
  pjVer: number | null;
  idPref: number | null;
  /** partido do prefeito eleito em 2020 e em 2024 */
  sg: [string, string];
  /** de 2020 para 2024: o partido mudou, o prefeito tentou de novo, se reelegeu (1, 0 ou null = sem dado) */
  troca: number | null;
  conc: number | null;
  reel: number | null;
  voto: Voto | null;
  busca: string;
}

/** O que o leitor escolheu: o estado em foco no mapa (null = Brasil) e a cidade. */
export interface Filtros {
  uf: string | null;
  sel: number | null;
}
