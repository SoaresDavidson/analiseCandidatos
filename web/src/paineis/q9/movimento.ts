// Movimento feito em JavaScript (o de CSS está em nuvem.css).

/** Quem pediu "reduzir movimento" no sistema vê a cena parada. */
export const semMovimento = (): boolean =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Caracteres do "ruído de terminal" da cena internet. */
export const GLIFOS = "01<>/{}[]#$%&=+*;:_";

/** Embaralha as letras das palavras e vai revelando da esquerda para a direita (entrada da cena "internet"). */
export function decifrar(textos: SVGTextElement[]): () => void {
  const finais = textos.map(t => t.textContent ?? "");
  const repor = () => {
    textos.forEach((t, i) => {
      t.textContent = finais[i];
    });
  };
  if (semMovimento()) return repor;
  const inicio = performance.now();
  let id = 0;
  const passo = (agora: number) => {
    let falta = false;
    textos.forEach((t, i) => {
      const p = Math.min(1, Math.max(0, (agora - inicio - 150 - i * 14) / 650));
      if (p < 1) falta = true;
      const visiveis = Math.floor(p * finais[i].length);
      let s = finais[i].slice(0, visiveis);
      for (let k = visiveis; k < finais[i].length; k++)
        s += finais[i][k] === " " ? " " : GLIFOS[(Math.random() * GLIFOS.length) | 0];
      t.textContent = s;
    });
    if (falta) id = requestAnimationFrame(passo);
  };
  id = requestAnimationFrame(passo);
  return () => {
    cancelAnimationFrame(id);
    repor();
  };
}
