// Espectro político: a nota do partido (0 = extrema esquerda, 10 = extrema direita)
// cai numa das 7 categorias pelos cortes abaixo.

export const CORTES = [1.5, 3, 4.49, 5.5, 7, 8.5];
export const CATEGORIAS = ["extrema esquerda", "esquerda", "centro-esquerda", "centro", "centro-direita", "direita", "extrema direita"];
/** Mesmas cores de --color-espectro-1..7 em styles/tema.css (SVG e estilos inline precisam do valor). */
export const CORES_ESPECTRO = ["#8a0f16", "#c53d33", "#e57f68", "#dcd9d1", "#73a7d4", "#2f72b4", "#0c3f7c"];
export const COR_SEM_NOTA = "#b9b6ae";

/** Índice da categoria (0..6), ou -1 sem nota. */
export function categoria(nota: number | null | undefined): number {
  if (nota == null) return -1;
  const i = CORTES.findIndex(c => nota <= c);
  return i < 0 ? 6 : i;
}
export const nomeCategoria = (nota: number | null | undefined): string => (nota == null ? "sem nota" : CATEGORIAS[categoria(nota)]);
export const corEspectro = (nota: number | null | undefined): string => (nota == null ? COR_SEM_NOTA : CORES_ESPECTRO[categoria(nota)]);
