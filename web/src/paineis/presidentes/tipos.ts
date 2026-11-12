// Formato de public/dados/presidentes.json (scripts/gerar_painel_presidentes.py).

/** [sq, número, nome de urna, nome civil, partido, eleito (0/1), tem foto (0/1), bens ([tipo, valor]...) ou null] */
export type LinhaCandidato = [number, number, string, string, string, number, number, [string, number][] | null];

export interface Turno {
  turno: number;
  /** votos válidos de cada candidato (na ordem de `cands`) no país */
  total: number[];
  /** o mesmo em cada estado, na ordem de `ufs` */
  uf: number[][];
  /** votos de quem mora fora do país; null quando o arquivo não traz */
  exterior: number[] | null;
  /** em cada município (na ordem de `municipios`): o índice de quem venceu, ou -1 sem voto */
  venc: number[];
  /** e a parte dos votos válidos que o vencedor teve, em % */
  pct: number[];
}

export interface Eleicao {
  ano: number;
  /** do mais votado no 1º turno ao menos votado */
  cands: LinhaCandidato[];
  turnos: Turno[];
}

export interface DadosPresidentes {
  ufs: string[];
  /** [código IBGE, nome, índice da UF] */
  municipios: [number, string, number][];
  eleicoes: Eleicao[];
}

export interface Filtros {
  ano: number;
  turno: number;
  /** estado em foco no mapa; null = Brasil */
  uf: string | null;
  /** cidade escolhida */
  sel: number | null;
}
