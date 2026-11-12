/** Retângulo em unidades da área de desenho. */
export interface Ret {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Divide `area` em retângulos de área proporcional a cada valor, o mais quadrados possível
 * (treemap "squarified", de Bruls, Huizing e van Wijk). Devolve na mesma ordem de `valores`;
 * valor zero ou negativo vira retângulo vazio.
 */
export function quadricular(valores: number[], area: Ret): Ret[] {
  const saida: Ret[] = valores.map(() => ({ x: area.x, y: area.y, w: 0, h: 0 }));
  const total = valores.reduce((a, v) => a + Math.max(0, v), 0);
  if (total <= 0 || area.w <= 0 || area.h <= 0) return saida;
  const escala = (area.w * area.h) / total;
  const a = valores.map(v => Math.max(0, v) * escala);
  const ordem = a
    .map((_, i) => i)
    .filter(i => a[i] > 0)
    .sort((i, j) => a[j] - a[i]);

  let livre = { ...area };
  let i = 0;
  while (i < ordem.length) {
    const lado = Math.min(livre.w, livre.h);
    // pior proporção da fila se ela tiver soma `s`, com o maior e o menor item dados
    const pior = (s: number, maior: number, menor: number) =>
      Math.max((lado * lado * maior) / (s * s), (s * s) / (lado * lado * menor));
    const maior = a[ordem[i]];
    let soma = maior;
    let j = i + 1;
    while (j < ordem.length && pior(soma + a[ordem[j]], maior, a[ordem[j]]) <= pior(soma, maior, a[ordem[j - 1]])) {
      soma += a[ordem[j]];
      j++;
    }
    const espessura = soma / lado;
    let pos = 0;
    for (let k = i; k < j; k++) {
      const comprimento = a[ordem[k]] / espessura;
      saida[ordem[k]] =
        livre.w >= livre.h
          ? { x: livre.x, y: livre.y + pos, w: espessura, h: comprimento }
          : { x: livre.x + pos, y: livre.y, w: comprimento, h: espessura };
      pos += comprimento;
    }
    livre =
      livre.w >= livre.h
        ? { x: livre.x + espessura, y: livre.y, w: livre.w - espessura, h: livre.h }
        : { x: livre.x, y: livre.y + espessura, w: livre.w, h: livre.h - espessura };
    i = j;
  }
  return saida;
}
