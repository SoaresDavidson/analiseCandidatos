import { useEffect, useRef, useState } from "react";

const semMovimento = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Número que sobe (ou desce) até `valor`, como um contador de dinheiro. `chave` diferente
 *  recomeça do zero; com a mesma chave, anda do valor anterior ao novo. Quem pediu menos
 *  movimento no sistema vê o valor final direto. */
export function Contador({
  valor,
  formato,
  duracao = 1400,
  chave,
}: {
  valor: number | null;
  formato: (v: number) => string;
  duracao?: number;
  chave?: string | number;
}) {
  const [mostrado, setMostrado] = useState(valor ?? 0);
  const de = useRef(0);
  const ultimaChave = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    if (valor == null) return;
    if (semMovimento()) {
      de.current = valor;
      setMostrado(valor);
      return;
    }
    const inicio = chave !== ultimaChave.current ? 0 : de.current;
    ultimaChave.current = chave;
    const t0 = performance.now();
    let quadro = 0;
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / duracao);
      const suave = 1 - (1 - k) ** 4; // rápido no começo, devagar no fim
      const v = inicio + (valor - inicio) * suave;
      de.current = v;
      setMostrado(v);
      if (k < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, duracao, chave]);

  return <>{valor == null ? "–" : formato(mostrado)}</>;
}
