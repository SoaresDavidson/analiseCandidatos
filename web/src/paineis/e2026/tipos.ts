// Formato de public/dados/e2026.json (scripts/gerar_painel_2026.py). Em todas as tabelas a 2ª coluna
// é a posição da UF em `ufs`, ou -1 para o país; o cargo é o código do TSE (3, 5, 6 ou 7).

/** [ano, uf, cargo, candidatos, eleitos, cand. com faculdade, eleitos com faculdade, idade média dos
 *  candidatos, idade média dos eleitos, candidatas mulheres, eleitas mulheres] */
export type LinhaPerfil = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number | null,
  number | null,
  number,
  number,
];
/** [ano, uf, cargo, vagas, despesa de todos os candidatos, fator para reais de 2024 (ou null)] */
export type LinhaCusto = [number, number, number, number, number, number | null];
/** [ano, uf, cargo, dependem do fundo, eleitos entre eles, não dependem, eleitos entre eles] */
export type LinhaFundo = [number, number, number, number, number, number, number];
/** [ano, uf, cargo, quinto (0 = sem bens, 1 = mais pobres ... 5 = mais ricos), candidatos, eleitos] */
export type LinhaPatrimonio = [number, number, number, number, number, number];
/** [ano, uf, cargo, valor gasto em cada tipo de propaganda (na ordem de `canais`)] */
export type LinhaPropaganda = [number, number, number, number[]];
/** [ano, uf, cargo, eleitos, eleitos pela legenda, votos nominais, votos de legenda] */
export type LinhaLegenda = [number, number, number, number, number, number, number];
/** [ano, uf, nota do voto para deputado federal, % dos votos em partidos com nota] */
export type LinhaVies = [number, number, number | null, number | null];
/** [ano da nova eleição, uf, cargo, eleitos no ciclo anterior, tentaram de novo, reeleitos] */
export type LinhaReeleicao = [number, number, number, number, number, number];

export interface Dados2026 {
  ufs: string[];
  anos: number[];
  cargos: number[];
  canais: string[];
  /** data da coleta no TSE (AAAA-MM-DD) */
  coleta: string;
  tem: { resultado: boolean; contas: number; votos: number };
  perfil: LinhaPerfil[];
  custo: LinhaCusto[];
  fundo: LinhaFundo[];
  patrimonio: LinhaPatrimonio[];
  propaganda: LinhaPropaganda[];
  legenda: LinhaLegenda[];
  vies: LinhaVies[];
  reeleicao: LinhaReeleicao[];
}

export interface Filtros {
  /** "TODAS" = Brasil */
  uf: string;
  cargo: number;
}
