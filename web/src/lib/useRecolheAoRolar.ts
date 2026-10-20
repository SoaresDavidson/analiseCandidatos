import { type UIEvent, useCallback, useRef, useState } from "react";

const TOPO = 60; // perto do topo o cabeçalho sempre aparece
const FOLGA = 6; // movimento mínimo (px) para mudar: evita piscar com o trackpad

/** Recolhe algo (o cabeçalho) ao rolar para baixo e mostra de novo ao rolar para cima.
 *  Devolve se está recolhido e o onScroll para pôr no elemento que rola. Quando `pagina`
 *  muda, a rolagem recomeça do topo e o cabeçalho volta. */
export function useRecolheAoRolar(pagina: string): [boolean, (ev: UIEvent<HTMLElement>) => void] {
  const [recolhido, setRecolhido] = useState(false);
  const [paginaAntes, setPaginaAntes] = useState(pagina);
  const antes = useRef(0);
  if (pagina !== paginaAntes) {
    // ajuste durante o render (padrão do React para estado que depende de prop)
    setPaginaAntes(pagina);
    setRecolhido(false);
  }
  const aoRolar = useCallback((ev: UIEvent<HTMLElement>) => {
    const y = ev.currentTarget.scrollTop;
    const d = y - antes.current;
    if (y < TOPO) setRecolhido(false);
    else if (d > FOLGA) setRecolhido(true);
    else if (d < -FOLGA) setRecolhido(false);
    if (Math.abs(d) > FOLGA || y < TOPO) antes.current = y;
  }, []);
  return [recolhido, aoRolar];
}
