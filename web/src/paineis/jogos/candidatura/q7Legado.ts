// Formato do public/dados/q7.json antigo (6 estados), que só o jogo da candidatura ainda lê.
// A Pergunta 7 passou a usar o país inteiro (q7-brasil.json, tipos em paineis/q7/tipos.ts).

type Notas = (number | null)[];
type Prefeito = [string | null, number | null, string | null, number | null, number];

/** [cod, nome, índice da UF, região imediata, capital (0/1), notas da régua de cada ano,
 *  notas da régua fixa de 2018, prefeito] */
type LinhaMunicipio = [number, string, number, number, number, Notas, Notas, Prefeito];

export interface DadosQ7Legado {
  ufs: string[];
  anos: number[];
  municipios: LinhaMunicipio[];
  /** por UF: tamanho do desenho e o contorno SVG de cada município */
  mapas: Record<string, { w: number; h: number; p: Record<string, string> }>;
}
