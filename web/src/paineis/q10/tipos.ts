/** Formato de public/dados/q10.json (o que vale para o país) e de q10/<UF>.json (as pessoas de cada
 *  estado; q10/BR.json = quem já se elegeu governador, senador ou deputado). */

/** [nome de urna, nome civil, linhas planas de 6 em 6: ano-2000, cargo, ue, partido, resultado, reeleição,
 *  e a foto da vitória mais recente em 2022 ou 2024 ([ano-2000, número sequencial do TSE]), quando há] */
export type PessoaBruta = [string, string, number[], [number, number]?];

/** [ano, UF, cargo, eleitos, tentaram de novo, reeleitos, sem reeleição na conta] */
export type LinhaSobrevivencia = [number, string, number, number, number, number, number];

/** [UF da 1ª vitória, cargo, ciclo (0..4), turma, ainda eleitos, ainda disputando] */
export type LinhaCurva = [string, number, number, number, number, number];

/** Um arquivo q10/<UF>.json ou q10/BR.json. */
export interface PessoasQ10 {
  pessoas: PessoaBruta[];
  partidos: string[];
  /** "LOCAL|UF" */
  ues: string[];
}

export interface DadosQ10 {
  /** as 27 siglas */
  ufs: string[];
  cargos: Record<string, string>;
  sobrevivencia: LinhaSobrevivencia[];
  curva: LinhaCurva[];
  totais: { participacoes: number; pessoas: number; eleitos: number };
  fin: {
    /** [nome do tipo de bem, grupo 0..6] */
    tipos: [string, number][];
    /** em quantos arquivos q10-financas/<UF>-NN.json as pessoas de cada estado se dividem */
    partes: number;
    /** IPCA acumulado até ago/2024, por ano */
    fator: Record<string, number>;
  };
}

/** [ano-2000, receita, fundo público, despesa, bens] ; bens = [tipo, valor, tipo, valor...] ou null */
export type LinhaFin = [number, number | null, number | null, number | null, number[] | null];
/** Um arquivo q10-financas/<UF>-NN.json: a pessoa i do estado fica no arquivo i % partes. */
export type ParteFin = Record<string, LinhaFin[]>;

/** Filtros lembrados no navegador (localStorage "q10-brasil"). `sel` vale dentro do estado escolhido. */
export interface Filtros {
  uf: string;
  sel: number | null;
  medida: "mandato" | "disputa";
  cargoRe: number;
  ordem: "vit" | "anos" | "reel";
}
