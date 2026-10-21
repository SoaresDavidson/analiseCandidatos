/** Formato de public/dados/q10.json (extraído de docs/teste/q10-painel). */

/** [nome de urna, nome civil, linhas planas de 6 em 6: ano-2000, cargo, ue, partido, resultado, reeleição] */
export type PessoaBruta = [string, string, number[]];

/** [ano, UF, cargo, eleitos, tentaram de novo, reeleitos, sem reeleição na conta] */
export type LinhaSobrevivencia = [number, string, number, number, number, number, number];

/** [UF da 1ª vitória, cargo, ciclo (0..4), turma, ainda eleitos, ainda disputando] */
export type LinhaCurva = [string, number, number, number, number, number];

export interface DadosQ10 {
  pessoas: PessoaBruta[];
  cargos: Record<string, string>;
  partidos: string[];
  /** "LOCAL|UF" */
  ues: string[];
  sobrevivencia: LinhaSobrevivencia[];
  curva: LinhaCurva[];
  totais: { participacoes: number; pessoas: number; eleitos: number };
  fin: {
    /** [nome do tipo de bem, grupo 0..6] */
    tipos: [string, number][];
    /** quantos arquivos q10-financas/NN.json existem */
    partes: number;
    /** IPCA acumulado até ago/2024, por ano */
    fator: Record<string, number>;
  };
}

/** [ano-2000, receita, fundo público, despesa, bens] ; bens = [tipo, valor, tipo, valor...] ou null */
export type LinhaFin = [number, number | null, number | null, number | null, number[] | null];
/** Um arquivo q10-financas/NN.json: pessoa i fica no arquivo i % partes. */
export type ParteFin = Record<string, LinhaFin[]>;

/** Filtros lembrados no navegador (localStorage "q10-tse"). */
export interface Filtros {
  uf: string;
  turma: number;
  sel: number | null;
  medida: "mandato" | "disputa";
  cargoRe: number;
  ordem: "vit" | "anos" | "reel";
  valor: "real" | "nominal";
}
