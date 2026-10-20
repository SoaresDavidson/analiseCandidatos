/** Formato de public/dados/candidatos-eleitos.json (listas paralelas, para o arquivo caber em 2,8 MB). */
export interface DadosCandidatos {
  ufs: string[];
  canais: string[];
  /** "NOME DA CIDADE|UF" */
  ues: string[];
  partidos: string[];
  ocupacoes: string[];
  graus: string[];
  cores: string[];
  generos: string[];
  /**
   * [ano-2000, uf, cargo, ue, partido, urna, civil, idade, gênero, cor, grau, ocupação, situação, votos,
   *  ue com mais votos, patrimônio, nº de bens, receita, público, privado, próprio, partidário,
   *  transferência, doadores, propaganda, canal principal, carreira, código IBGE]
   * A carreira é uma lista plana de 5 em 5: [ano-2000, cargo, ue, partido, resultado].
   */
  eleitos: LinhaEleito[];
  /** número sequencial do TSE de cada eleito (mesma ordem de `eleitos`) */
  sq: number[];
  /** "ano|partido" -> [nota 0-10, categoria, observação] */
  espectro: Record<string, [number, string, string]>;
  /** [sigla da esquerda, nota, sigla da direita, nota]: pontas da régua do espectro */
  regua: [string, number, string, number];
}

export type LinhaEleito = [
  number, number, number, number, number, string, string, number | null, number, number, number, number,
  string, number | null, number, number | null, number | null, number | null, number | null, number | null,
  number | null, number | null, number | null, number | null, number | null, number, number[], number,
];

export interface Candidatura {
  ano: number;
  cargo: number;
  local: string;
  uf: string;
  partido: string;
  /** 0 = eleito, 1 = não eleito, 2 = sem resultado */
  res: number;
}

export interface Eleito {
  id: number;
  sq: number;
  ano: number;
  uf: string;
  cargo: number;
  local: string;
  partido: string;
  nome: string;
  civil: string;
  idade: number | null;
  genero: string;
  cor: string;
  grau: string;
  ocupacao: string;
  situacao: string;
  votos: number | null;
  munVotos: string;
  patrimonio: number | null;
  bens: number | null;
  receita: number | null;
  publico: number | null;
  privado: number | null;
  proprio: number | null;
  partidario: number | null;
  transf: number | null;
  doadores: number | null;
  propaganda: number | null;
  canal: number;
  carreira: Candidatura[];
  cod: number;
  /** [nota 0-10, categoria, observação] do partido naquele ano */
  espectro: [number, string, string] | null;
  /** nome, nome civil, cidade, partido e estado, sem acento e em minúsculas */
  busca: string;
}

export interface Modelo {
  eleitos: Eleito[];
  dados: DadosCandidatos;
}
