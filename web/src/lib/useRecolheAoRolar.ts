import { type UIEvent, useCallback, useRef, useState } from "react";

const TOPO = 60; // perto do topo o cabeçalho sempre aparece
const FOLGA = 6; // movimento mínimo (px) para mudar: evita piscar com o trackpad
// página que rola pouco não recolhe: sem o cabeçalho (~150 px) a rolagem acabaria e ele voltaria
const ROLAGEM_MINIMA = 400;
// recolher ou abrir muda a altura da área que rola, e o navegador ajusta a posição sozinho;
// durante a transição (300 ms no App) esses ajustes não contam como rolagem de quem lê
const ESPERA_TRANSICAO = 350;

/** Recolhe algo (o cabeçalho) ao rolar para baixo e mostra de novo ao rolar para cima.
 *  Devolve se está recolhido e o onScroll para pôr no elemento que rola. Quando `pagina`
 *  muda, a rolagem recomeça do topo e o cabeçalho volta. */
export function useRecolheAoRolar(pagina: string): [boolean, (ev: UIEvent<HTMLElement>) => void] {
  const [recolhido, setRecolhido] = useState(false);
  const [paginaAntes, setPaginaAntes] = useState(pagina);
  const antes = useRef(0);
  const ignorarAte = useRef(0);
  if (pagina !== paginaAntes) {
    // ajuste durante o render (padrão do React para estado que depende de prop)
    setPaginaAntes(pagina);
    setRecolhido(false);
  }

  const aoRolar = useCallback(
    (ev: UIEvent<HTMLElement>) => {
      const el = ev.currentTarget;
      const y = el.scrollTop;
      const agora = performance.now();
      if (agora < ignorarAte.current) {
        antes.current = y;
        return;
      }
      const d = y - antes.current;
      let v = recolhido;
      if (y < TOPO || el.scrollHeight - el.clientHeight < ROLAGEM_MINIMA) v = false;
      else if (d > FOLGA) v = true;
      else if (d < -FOLGA) v = false;
      if (v !== recolhido) {
        ignorarAte.current = agora + ESPERA_TRANSICAO;
        setRecolhido(v);
      }
      if (Math.abs(d) > FOLGA || y < TOPO) antes.current = y;
    },
    [recolhido],
  );

  return [recolhido, aoRolar];
}
