// Formato dos JSON de public/dados/municipios-cidades.json e candidatos-eleitos.json.

/** [partido, nota] do extremo esquerdo e do direito, e o meio da régua. */
export interface Regua {
  esq: [string, number];
  dir: [string, number];
  meio: number;
}

/** Linha bruta de um município: posições fixas, para o arquivo ficar pequeno. */
export type LinhaMunicipio = [
  cod: number,
  nome: string,
  uf: number,
  capital: number,
  voto: number | null,
  pcNota: number | null,
  votos: number,
  qtVer: number,
  camara: number | null,
  sgPref: string | null,
  vlPref: number | null,
  voto22: number | null,
  qtCand: number,
  receita: number | null,
  publico: number | null,
  propaganda: number | null,
  canal: number,
  cadeiras: (string | number)[],
];

/** Partido: [nota, categoria, observação (nota estimada ou herdada)]. */
export type NotaPartido = [nota: number, categoria: string, obs: string];

export interface DadosMunicipios {
  ufs: string[];
  canais: string[];
  regua: Regua;
  partidos: Record<string, NotaPartido>;
  municipios: LinhaMunicipio[];
}

/** Linha bruta de um eleito (só as posições usadas aqui: 0 ano, 2 cargo, 4 partido, 5 nome, 13 votos, 27 município). */
export type LinhaEleito = readonly (number | string | number[])[];

export interface DadosCandidatos {
  partidos: string[];
  eleitos: LinhaEleito[];
  sq: number[];
  /** "2024|PT" -> [nota, categoria, observação] */
  espectro: Record<string, [number | null, ...unknown[]]>;
}

/** Município já lido, com o nome em caixa de título e o texto de busca sem acento. */
export interface Municipio {
  cod: number;
  nome: string;
  uf: string;
  cap: boolean;
  voto: number | null;
  votos: number;
  qtVer: number;
  camara: number | null;
  sgPref: string | null;
  vlPref: number | null;
  voto22: number | null;
  qtCand: number;
  receita: number | null;
  publico: number | null;
  propaganda: number | null;
  canal: number;
  cadeiras: (string | number)[];
  busca: string;
}

export type Nivel = "estados" | "uf" | "cidade";
export type Ordem = "nome" | "esq" | "dir" | "publico" | "voto";
export type Lado = "todos" | "esquerda" | "direita";

/** O que fica salvo no navegador para a página voltar ao mesmo ponto. */
export interface Navegou {
  nivel: Nivel;
  uf: string | null;
  cod: number | null;
  ordem: Ordem;
  vis: "lista" | "grade";
  lado: Lado;
}
