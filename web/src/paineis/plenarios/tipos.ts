/** Trecho do candidatos-eleitos.json que este painel usa. Cada linha de `eleitos` é uma
 *  tupla: [ano-2000, uf, cargo, ue, partido, nome de urna, nome completo, idade, gênero, ...,
 *  votos na posição 13, ...]; `sq[i]` é o número sequencial da linha `i`. */
export type LinhaEleito = [number, number, number, number, number, string, string, number, number, ...unknown[]];

export interface DadosEleitos {
  ufs: string[];
  partidos: string[];
  generos: string[];
  eleitos: LinhaEleito[];
  sq: number[];
  /** "2022|PARTIDO" -> [nota, categoria, ...] */
  espectro: Record<string, [number, ...unknown[]]>;
  /** [partido da extrema esquerda, nota, partido da extrema direita, nota] */
  regua: [string, number, string, number];
}

export interface Eleito {
  sq: number;
  uf: string;
  cargo: number;
  partido: string;
  nome: string;
  genero: string;
  votos: number;
  nota: number | null;
  cor: string;
  foto: string;
  rotulo: string;
}
