// Estatística usada por mais de um painel.

/** Mediana dos valores presentes (nulos ficam de fora); null se não sobrar nenhum. */
export function mediana(xs: readonly (number | null | undefined)[]): number | null {
  const v = xs.filter((x): x is number => x != null).sort((a, b) => a - b);
  if (!v.length) return null;
  const k = v.length >> 1;
  return v.length % 2 ? v[k] : (v[k - 1] + v[k]) / 2;
}
