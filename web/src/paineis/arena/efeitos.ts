// Efeitos visuais da Arena com a Web Animations API. Com "reduzir movimento" ligado, nada anima e as
// esperas encurtam. Os desenhos (ícones, cores da raridade) ficam em sprites.ts e arena.css.

export const movimento = (): boolean => !matchMedia("(prefers-reduced-motion: reduce)").matches;
export const espera = (ms: number): Promise<void> =>
  new Promise(r => setTimeout(r, movimento() ? ms : Math.min(ms, 150)));

/** Centro de `el` medido a partir do canto de `caixa`. */
export function centroEm(caixa: HTMLElement, el: Element): [number, number] {
  const b = el.getBoundingClientRect(),
    a = caixa.getBoundingClientRect();
  return [b.left - a.left + b.width / 2, b.top - a.top + b.height / 2];
}

/** Número que sobe e some sobre a carta: "-5" vermelho no dano, "+3" verde na cura. */
export function numero(caixa: HTMLElement, x: number, y: number, txt: string, tipo: "dano" | "cura"): void {
  const p = document.createElement("span");
  p.textContent = txt;
  p.className = `fonte-pixel pointer-events-none absolute z-[6] text-[20px] ${tipo === "dano" ? "text-[#ff5a4f]" : "text-[#8fe36a]"} [text-shadow:3px_0_#111,-3px_0_#111,0_3px_#111,0_-3px_#111,3px_3px_#111]`;
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  p.style.transform = "translate(-50%, -50%)";
  caixa.appendChild(p);
  if (movimento()) {
    p.animate(
      [
        { transform: "translate(-50%, -50%)", opacity: 1 },
        { transform: "translate(-50%, calc(-50% - 80px))", opacity: 0 },
      ],
      { duration: 1000, easing: "steps(8)", fill: "forwards" },
    );
  }
  setTimeout(() => p.remove(), 1050);
}

/** Um quadradinho de pixel que se desloca (dx, dy) e some. */
function pixel(
  caixa: HTMLElement,
  x: number,
  y: number,
  cor: string,
  dx: number,
  dy: number,
  dur: number,
  tam: number,
) {
  const s = document.createElement("i");
  s.className = "pointer-events-none absolute z-[8] shadow-[0_0_0_1px_#111]";
  Object.assign(s.style, { left: `${x}px`, top: `${y}px`, width: `${tam}px`, height: `${tam}px`, background: cor });
  caixa.appendChild(s);
  s.animate(
    [
      { transform: "translate(-50%, -50%)", opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, opacity: 0 },
    ],
    { duration: dur, easing: "steps(6)", fill: "forwards" },
  );
  setTimeout(() => s.remove(), dur + 50);
}

/** Quanto cada ícone gira no voo: a moeda, a folha e o livro rodopiam; o resto voa reto. */
const GIRO: Record<string, number> = { moeda: 720, folha: 540, livro: 360 };

/** O canhão: o ícone do ladrilho `origem` sai voando em arco até `alvo`, com rastro de pixels na cor do
 * poder, e explode num anel de pixels. Resolve quando a explosão começa. */
export async function canhao(
  caixa: HTMLElement,
  origem: Element,
  alvo: Element,
  icone: { id: string; src: string },
  cor: string,
): Promise<void> {
  if (!movimento()) return;
  const [x0, y0] = centroEm(caixa, origem),
    [x1, y1] = centroEm(caixa, alvo);
  const bala = document.createElement("img");
  bala.src = icone.src;
  bala.alt = "";
  bala.className =
    "pointer-events-none absolute top-0 left-0 z-[9] size-10 [image-rendering:pixelated] drop-shadow-[2px_2px_0_#111]";
  caixa.appendChild(bala);

  // parábola de bala de canhão: sobe mais quanto mais longe for o alvo
  const altura = 150 + Math.abs(x1 - x0) * 0.15,
    passos = 28,
    giro = GIRO[icone.id] ?? 0;
  const quadros: Keyframe[] = [];
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const x = x0 + (x1 - x0) * t,
      y = y0 + (y1 - y0) * t - altura * 4 * t * (1 - t);
    quadros.push({
      transform: `translate(${x - 20}px, ${y - 20}px) rotate(${giro * t}deg) scale(${1 + 0.5 * Math.sin(Math.PI * t)})`,
    });
  }
  const voo = bala.animate(quadros, { duration: 720, easing: "linear" });
  const rastro = setInterval(() => {
    const m = new DOMMatrix(getComputedStyle(bala).transform);
    pixel(caixa, m.e + 20, m.f + 20, cor, (Math.random() - 0.5) * 14, 10 + Math.random() * 12, 420, 5);
  }, 35);
  try {
    await voo.finished;
  } finally {
    clearInterval(rastro);
    bala.remove();
  }

  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2,
      r = 60 + Math.random() * 40;
    pixel(caixa, x1, y1, i % 3 ? cor : "#ffffff", Math.cos(ang) * r, Math.sin(ang) * r, 520, 7);
  }
  const anel = document.createElement("i");
  anel.className = "pointer-events-none absolute z-[8] size-5 border-[5px]";
  Object.assign(anel.style, { left: `${x1}px`, top: `${y1}px`, borderColor: cor });
  caixa.appendChild(anel);
  anel.animate(
    [
      { transform: "translate(-50%, -50%) scale(.4)", opacity: 1 },
      { transform: "translate(-50%, -50%) scale(6)", opacity: 0 },
    ],
    { duration: 450, easing: "steps(5)", fill: "forwards" },
  );
  setTimeout(() => anel.remove(), 500);
}

/** Brilhos subindo de um ponto (a cura da rodada "Luz do saber"). */
export function brilhos(caixa: HTMLElement, x: number, y: number, cor: string): void {
  if (!movimento()) return;
  for (let k = 0; k < 12; k++)
    pixel(
      caixa,
      x + (Math.random() - 0.5) * 120,
      y + 40,
      k % 2 ? cor : "#ffffff",
      (Math.random() - 0.5) * 30,
      -150,
      900,
      6,
    );
}

/** O ladrilho do poder "carrega" antes do disparo: pisca na cor da rodada. */
export function carregar(el: Element | null, cor: string): void {
  if (!el || !movimento()) return;
  el.animate(
    [
      { boxShadow: "0 0 0 2px #111" },
      { boxShadow: `0 0 0 2px #111, 0 0 0 5px ${cor}, 0 0 18px 6px ${cor}` },
      { boxShadow: "0 0 0 2px #111" },
    ],
    { duration: 420, easing: "steps(4)" },
  );
}

export type AnimacaoCarta = "entra" | "ataca" | "apanha";

/** Anima a caixa de uma carta (entrada, coice do disparo, golpe). Usa translate/rotate/scale, e não transform,
 * para não brigar com a inclinação do holo, que fica no transform da própria carta. */
export function animarCarta(el: Element | null, tipo: AnimacaoCarta, atraso = 0, lado: "a" | "b" = "a"): void {
  if (!el || !movimento()) return;
  if (tipo === "entra") {
    el.animate(
      [
        { translate: "0 60px", rotate: "y 100deg", scale: ".7", opacity: 0 },
        { translate: "0 0", rotate: "y 0deg", scale: "1", opacity: 1 },
      ],
      { duration: 700, delay: atraso, easing: "cubic-bezier(.2, .9, .3, 1.2)", fill: "backwards" },
    );
  } else if (tipo === "ataca") {
    // o coice do canhão: um passo para trás e para cima
    const dx = lado === "a" ? "-10px" : "10px";
    el.animate(
      [{ translate: "0 0" }, { translate: `${dx} -16px`, scale: "1.06", offset: 0.35 }, { translate: "0 0" }],
      {
        duration: 450,
        easing: "ease",
      },
    );
  } else {
    el.animate(
      [
        { translate: "0 0", rotate: "0deg", filter: "none" },
        { translate: "-10px 0", rotate: "-3deg", filter: "brightness(2) saturate(2)", offset: 0.15 },
        { translate: "8px 0", rotate: "2deg", offset: 0.4 },
        { translate: "-4px 0", rotate: "0deg", offset: 0.65 },
        { translate: "0 0", rotate: "0deg", filter: "none" },
      ],
      { duration: 450, easing: "ease" },
    );
  }
}

/** O palco treme (explosão e carimbo final). */
export function tremer(el: Element | null): void {
  if (!el || !movimento()) return;
  el.classList.remove("arena-treme");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("arena-treme");
}
