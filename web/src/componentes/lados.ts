import { lado } from "../lib/espectro";

// Fundo do plenário com lados: em que ângulo começa e termina cada bloco (esquerda, centro,
// direita). Fica fora de Plenario.tsx porque o arquivo do componente só exporta componentes.

/** Ângulos do arco inteiro do carpete (graus no sistema do SVG; 180 = esquerda). */
export const ARCO_INI = 6,
  ARCO_FIM = 174;

/** Ângulos de cada lado no arco: a fronteira fica entre a última cadeira de um lado e a
 *  primeira do seguinte (as posições já vêm da esquerda, ângulo maior, para a direita). */
export function setoresDosLados(
  xs: readonly { nota: number | null }[],
  pos: readonly { a: number }[],
): { lado: 0 | 1 | 2; a0: number; a1: number }[] {
  const out: { lado: 0 | 1 | 2; a0: number; a1: number }[] = [];
  let ini = 0;
  for (let i = 1; i <= xs.length; i++) {
    if (i < xs.length && lado(xs[i].nota) === lado(xs[ini].nota)) continue;
    const a1 = ini === 0 ? ARCO_FIM : (pos[ini - 1].a + pos[ini].a) / 2;
    const a0 = i === xs.length ? ARCO_INI : (pos[i - 1].a + pos[i].a) / 2;
    out.push({ lado: lado(xs[ini].nota), a0, a1 });
    ini = i;
  }
  return out;
}
