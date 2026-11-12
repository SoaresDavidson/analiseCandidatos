import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { GLIFOS, semMovimento } from "./movimento";
import { BANDEIRAS, sorte, type Tema } from "./temas";

const vars = (v: Record<string, string | number>) => v as CSSProperties;

/** Enfeites animados de cada cena. `fundo` fica atrás das palavras; `frente`, por cima (sem pegar clique). */
export function Efeitos({ tema, camada }: { tema: Tema; camada: "fundo" | "frente" }) {
  const cena = CENAS[tema]?.[camada];
  if (!cena) return null;
  return (
    <div className="nuvem-camada" data-camada={camada} aria-hidden="true">
      {cena()}
    </div>
  );
}

const CENAS: Partial<Record<Tema, Partial<Record<"fundo" | "frente", () => ReactNode>>>> = {
  impresso: { frente: () => <Papeis /> },
  rua: { fundo: () => <Fincadas />, frente: () => <Passeata /> },
  internet: {
    fundo: () => <ChuvaDeCodigo />,
    frente: () => (
      <>
        <div className="cena-linhas" />
        {[0, 1, 2].map(k => (
          <i key={k} className="net-barra" style={vars({ "--alt": `${5 + 4 * k}%`, "--espera": `${k * 0.12}s` })} />
        ))}
      </>
    ),
  },
  radiotv: {
    frente: () => (
      <>
        <Chuvisco />
        <div className="cena-linhas" />
        <div className="tv-faixa" />
        <span className="tv-aviso">SEM SINAL</span>
      </>
    ),
  },
};

/** Folhas de santinho atravessando a cena: uma revoada na entrada e algumas soltas depois. */
function Papeis() {
  const folha = (k: number, solta: boolean) => {
    const y0 = 5 + sorte(k, 1) * 75;
    const y1 = 5 + sorte(k, 2) * 75;
    return (
      <i
        key={`${solta}${k}`}
        className="papel-voando"
        style={vars({
          "--y0": `${y0}%`,
          "--ym": `${(y0 + y1) / 2 - 12 - sorte(k, 3) * 18}%`,
          "--y1": `${y1}%`,
          "--larg": `${3.6 + sorte(k, 4) * 2.6}%`,
          "--giro": `${(sorte(k, 5) > 0.5 ? 1 : -1) * (360 + sorte(k, 6) * 540)}deg`,
          "--dur": solta ? `${7 + sorte(k, 7) * 5}s` : `${1.1 + sorte(k, 7) * 1.1}s`,
          "--espera": solta ? `${3 + k * 2.6}s` : `${sorte(k, 8) * 0.7}s`,
          "--vezes": solta ? "infinite" : 1,
        })}
      />
    );
  };
  return (
    <>
      {Array.from({ length: 16 }, (_, k) => folha(k, false))}
      {Array.from({ length: 3 }, (_, k) => folha(k + 20, true))}
    </>
  );
}

const PANO_A = "M9 8 C 22 1, 36 15, 56 8 L 56 36 C 36 43, 22 29, 9 36 Z";
const PANO_B = "M9 8 C 22 15, 36 1, 56 8 L 56 36 C 36 29, 22 43, 9 36 Z";

/** Bandeira no mastro, com o pano tremulando. */
function Bandeira({ cor }: { cor: string }) {
  return (
    <svg viewBox="0 0 60 110">
      <line x1="7" y1="4" x2="7" y2="110" stroke="#7a5a2e" strokeWidth="3.5" strokeLinecap="round" />
      <path d={PANO_A} fill={cor} stroke="rgb(0 0 0 / 0.35)" strokeWidth="1">
        {!semMovimento() && (
          <animate attributeName="d" dur="0.9s" repeatCount="indefinite" values={`${PANO_A};${PANO_B};${PANO_A}`} />
        )}
      </path>
    </svg>
  );
}

function Passeata() {
  return (
    <>
      {Array.from({ length: 9 }, (_, k) => (
        <div
          key={k}
          className="bandeira"
          data-tipo="passeata"
          style={vars({ "--k": k, "--larg": `${6 + sorte(k, 11) * 3.5}%` })}
        >
          <Bandeira cor={BANDEIRAS[k % BANDEIRAS.length]} />
        </div>
      ))}
    </>
  );
}

const CANTOS = [0.5, 5, 10, 85, 90, 94.5];
function Fincadas() {
  return (
    <>
      {CANTOS.map((x, k) => (
        <div
          key={k}
          className="bandeira"
          data-tipo="fincada"
          style={vars({ "--k": k, "--x": `${x}%`, "--larg": `${5 + sorte(k, 12) * 2}%` })}
        >
          <Bandeira cor={BANDEIRAS[(k * 2 + 1) % BANDEIRAS.length]} />
        </div>
      ))}
    </>
  );
}

/** Depois da entrada da cena o enfeite fica de fundo, quase transparente: pinta na metade do ritmo. */
const ENTRADA_MS = 1800;

/**
 * Repete `pintar` a cada `intervalo` ms. Para poupar bateria, o laço só roda com a tela à vista
 * (IntersectionObserver) e desacelera depois da entrada; parado para quem reduz movimento.
 * Com `acompanhaTamanho`, a cena é remontada quando a tela muda de tamanho (girar o celular).
 */
function useQuadros(
  pintar: (ctx: CanvasRenderingContext2D, tela: HTMLCanvasElement) => () => void,
  intervalo: number,
  acompanhaTamanho = false,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const tela = ref.current;
    const ctx = tela?.getContext("2d");
    if (!tela || !ctx) return;
    const parado = semMovimento();
    let quadro = () => {};
    const montar = () => {
      quadro = pintar(ctx, tela);
      // parado: uma imagem pronta, já com a tela "cheia"
      for (let k = parado ? 40 : 1; k > 0; k--) quadro();
    };
    montar();

    let id = 0,
      rodando = false,
      ultimo = 0,
      inicio = 0;
    const passo = (t: number) => {
      inicio ||= t;
      if (t - ultimo >= (t - inicio > ENTRADA_MS ? 2 * intervalo : intervalo)) {
        ultimo = t;
        quadro();
      }
      id = requestAnimationFrame(passo);
    };
    const ligar = (sim: boolean) => {
      if (parado || sim === rodando) return;
      rodando = sim;
      if (sim) id = requestAnimationFrame(passo);
      else cancelAnimationFrame(id);
    };

    const vista =
      typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([e]) => ligar(e.isIntersecting));
    if (vista) vista.observe(tela);
    else ligar(true);

    let larg = tela.clientWidth,
      alt = tela.clientHeight;
    const tamanho =
      !acompanhaTamanho || typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (tela.clientWidth === larg && tela.clientHeight === alt) return;
            larg = tela.clientWidth;
            alt = tela.clientHeight;
            montar();
          });
    tamanho?.observe(tela);

    return () => {
      ligar(false);
      vista?.disconnect();
      tamanho?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

/** Chuvisco de TV fora do ar: ruído branco em baixa resolução, ampliado. */
function Chuvisco() {
  const ref = useQuadros(ctx => {
    const img = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    const px = new Uint32Array(img.data.buffer);
    return () => {
      for (let i = 0; i < px.length; i++) {
        const v = (Math.random() * 256) | 0;
        px[i] = 0xff000000 | (v << 16) | (v << 8) | v;
      }
      ctx.putImageData(img, 0, 0);
    };
  }, 66);
  return <canvas ref={ref} width={220} height={96} className="tv-chuvisco" />;
}

/** Colunas de caracteres caindo, como tela de terminal. */
function ChuvaDeCodigo() {
  const ref = useQuadros(
    (ctx, tela) => {
      const w = (tela.width = tela.clientWidth || 1000);
      const h = (tela.height = tela.clientHeight || 430);
      const fs = 15;
      const colunas = Array.from({ length: Math.ceil(w / fs) }, () => Math.random() * -40);
      return () => {
        ctx.fillStyle = "rgb(6 18 11 / 0.16)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#35d06f";
        ctx.font = `${fs}px ui-monospace, Menlo, Consolas, monospace`;
        colunas.forEach((y, i) => {
          ctx.fillText(GLIFOS[(Math.random() * GLIFOS.length) | 0], i * fs, y * fs);
          colunas[i] = y * fs > h && Math.random() > 0.97 ? 0 : y + 1;
        });
      };
    },
    55,
    true,
  );
  return <canvas ref={ref} className="net-chuva" />;
}
