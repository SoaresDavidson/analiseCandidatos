// Efeitos visuais da Arena com a Web Animations API (os keyframes do CSS antigo viraram
// element.animate). Com "reduzir movimento" ligado, nada anima e as esperas encurtam.

export const movimento = (): boolean => !matchMedia("(prefers-reduced-motion: reduce)").matches;
export const espera = (ms: number): Promise<void> => new Promise(r => setTimeout(r, movimento() ? ms : Math.min(ms, 150)));

export type TipoParticula = "voa" | "estoura" | "sobe" | "dano" | "cura" | "confete" | "onda";

const CLASSE: Record<TipoParticula, string> = {
  voa: "text-[30px]",
  estoura: "text-[22px]",
  sobe: "text-[26px]",
  dano: "text-[34px] font-extrabold text-[#ff5a4f] [text-shadow:0_2px_0_#000,0_0_12px_#000]",
  cura: "text-[26px] font-extrabold text-[#8fe36a] [text-shadow:0_2px_0_#000,0_0_12px_#000]",
  confete: "text-[24px]",
  onda: "size-10 rounded-full border-4 border-[#6fb6ff]",
};
const BASE = "translate(-50%, -50%)";

/** Solta um emoji/texto em (x, y) que se desloca (dx, dy) durante `dur` ms e some. */
export function particula(caixa: HTMLElement, x: number, y: number, txt: string, tipo: TipoParticula, dx: number, dy: number, dur: number): void {
  const p = document.createElement("span");
  p.textContent = txt;
  p.className = `absolute ${CLASSE[tipo]}`;
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  p.style.transform = BASE;
  caixa.appendChild(p);
  if (movimento()) {
    const alvo = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const quadros: Keyframe[] =
      tipo === "voa" ? [{ transform: BASE }, { transform: `${alvo} scale(1.3)` }]
      : tipo === "estoura" ? [{ opacity: 1, transform: BASE }, { opacity: 0, transform: `${alvo} scale(.4)` }]
      : tipo === "confete" ? [{ opacity: 1, transform: BASE }, { opacity: 0, transform: `${alvo} rotate(540deg)` }]
      : tipo === "onda" ? [{ opacity: 1, transform: `${BASE} scale(1)` }, { opacity: 0, transform: `${BASE} scale(5)` }]
      : [{ opacity: 1, transform: BASE }, { opacity: 0, transform: alvo }];
    p.animate(quadros, { duration: dur, easing: "ease-out", fill: "forwards" });
  }
  setTimeout(() => p.remove(), dur + 50);
}

/** O raio que cai sobre o alvo (80x180, recortado em zigue-zague). */
export function relampago(caixa: HTMLElement, x: number, y: number): void {
  const r = document.createElement("div");
  r.className = "absolute h-[180px] w-[80px] bg-linear-to-b from-white to-[#ffe14d] [clip-path:polygon(55%_0,20%_52%,46%_52%,30%_100%,82%_40%,55%_40%,75%_0)] [filter:drop-shadow(0_0_14px_#ffe14d)]";
  r.style.left = `${x - 40}px`;
  r.style.top = `${y - 160}px`;
  caixa.appendChild(r);
  r.animate(
    [{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0.2, offset: 0.5 }, { opacity: 1, offset: 0.6 }, { opacity: 0, offset: 1 }],
    { duration: 600, easing: "steps(2)", fill: "forwards" },
  );
  setTimeout(() => r.remove(), 600);
}

/** Clarão branco que cobre a arena por um instante. */
export function clarao(el: HTMLElement | null): void {
  el?.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 260, easing: "ease-out" });
}

export type AnimacaoCarta = "entra" | "ataca" | "apanha" | "brilha";

/** Anima uma carta (entrada, golpe, dano, cura). Sem efeito se o movimento estiver reduzido. */
export function animarCarta(el: Element | null, tipo: AnimacaoCarta, atraso = 0): void {
  if (!el || !movimento()) return;
  const n = "none";
  if (tipo === "entra") {
    el.animate(
      [{ transform: "translateY(60px) rotateY(100deg) scale(.7)", opacity: 0 }, { transform: n, opacity: 1 }],
      { duration: 700, delay: atraso, easing: "cubic-bezier(.2, .9, .3, 1.2)", fill: "both" },
    );
  } else if (tipo === "ataca") {
    el.animate([{ transform: n }, { transform: "translateY(-14px) scale(1.06)", offset: 0.3 }, { transform: n }], { duration: 500, easing: "ease" });
  } else if (tipo === "apanha") {
    el.animate(
      [
        { transform: n, filter: n, offset: 0 },
        { transform: "translateX(-12px) rotate(-3deg)", filter: "brightness(1.8) saturate(2)", offset: 0.2 },
        { transform: "translateX(10px) rotate(2deg)", offset: 0.4 },
        { transform: "translateX(-6px)", offset: 0.6 },
        { transform: "translateX(4px)", offset: 0.8 },
        { transform: n, filter: n, offset: 1 },
      ],
      { duration: 450, easing: "ease" },
    );
  } else {
    el.animate([{}, { boxShadow: "0 0 0 4px #ffe58a, 0 0 40px 12px #ffd86b", offset: 0.4 }, {}], { duration: 900, easing: "ease" });
  }
}

/** A carta campeã flutua sem parar; devolve a função que para a animação. */
export function flutuar(el: Element | null): () => void {
  if (!el || !movimento()) return () => {};
  const a = el.animate([{ transform: "none" }, { transform: "translateY(-8px)" }, { transform: "none" }], { duration: 2400, easing: "ease-in-out", iterations: Infinity });
  return () => a.cancel();
}
