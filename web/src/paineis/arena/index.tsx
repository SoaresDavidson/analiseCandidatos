import { type ReactNode, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import { Caixa, Campo, Carregando, Etiqueta, Pagina, Seletor, VerMais } from "../../componentes";
import { useDados } from "../../lib/dados";
import { useNavegacao } from "../../lib/navegacao";
import type { PainelProps } from "../tipos";
import { Busca } from "./Busca";
import { Carta } from "./Carta";
import { animarCarta, clarao, espera, flutuar, movimento, particula, relampago } from "./efeitos";
import {
  BARALHOS,
  danoRodada,
  EL,
  embaralhar,
  grupo,
  montarCartas,
  outroLado,
  sortearDe,
  UF_NOME,
  VIDA_INICIAL,
  valorRodada,
  vencedor,
} from "./jogo";
import type { CartaEleito, DadosEleitos, ElementoId, Lado, Rodada } from "./tipos";

type Anuncio =
  | { tipo: "duelo" }
  | { tipo: "rodada"; r: Rodada }
  | { tipo: "fim"; ganhou: Lado | null; a: number; b: number; acertos: number; total: number };

interface Entrada {
  r: Rodada;
  a: CartaEleito;
  b: CartaEleito;
  v: Lado | "empate" | null;
  aposta: Lado;
}

/** Estado do duelo. Fica numa ref porque as rodadas são assíncronas (esperam a aposta e as animações). */
interface Jogo {
  n: number; // número do duelo; quem espera uma animação confere se ainda é o mesmo
  baralho: string;
  uf: string;
  a: CartaEleito;
  b: CartaEleito;
  vida: Record<Lado, number>;
  r: number; // rodada atual (99 = duelo acabou)
  ordem: Rodada[];
  acertos: number;
  rodadaTxt: string;
  anuncio: Anuncio;
  pula: number; // contador que dispara a animação do anúncio
  apostando: boolean;
  registro: Entrada[];
  botao: string | null; // texto do botão principal; null = escondido
  campea: Lado | null;
  apostar: ((l: Lado) => void) | null;
}

const FIM = 99;
const TOTAL_UFS = 6;

/** Escolhe as duas cartas do duelo. `manter` conserva as que o jogador já tinha. */
function escolherCartas(
  T: CartaEleito[],
  baralho: string,
  uf: string,
  manter?: { a?: CartaEleito | null; b?: CartaEleito | null },
): { a: CartaEleito; b: CartaEleito } | null {
  const bar = T.filter(t => grupo(t) === baralho && (uf === "TODAS" || t.uf === uf));
  let a = manter?.a ?? sortearDe(bar);
  let b = manter?.b && manter.b !== a ? manter.b : sortearDe(bar, a);
  // baralho pequeno demais no estado (ex.: 2 governadores): o adversário vem dos 6 estados
  if (!a || !b) {
    const g = T.filter(t => grupo(t) === baralho);
    a = a ?? g[0];
    b = b ?? g.find(t => t !== a);
  }
  return a && b ? { a, b } : null;
}

function novoJogo(n: number, baralho: string, uf: string, a: CartaEleito, b: CartaEleito): Jogo {
  return {
    n,
    baralho,
    uf,
    a,
    b,
    vida: { a: VIDA_INICIAL, b: VIDA_INICIAL },
    r: 0,
    ordem: embaralhar(),
    acertos: 0,
    rodadaTxt: "Pronto para o duelo",
    anuncio: { tipo: "duelo" },
    pula: 0,
    apostando: false,
    registro: [],
    botao: "⚔ Lutar!",
    campea: null,
    apostar: null,
  };
}

export default function Painel(_: PainelProps) {
  const { dados, erro } = useDados<DadosEleitos>("candidatos-eleitos.json");
  if (!dados) return <Carregando erro={erro} />;
  return <Arena dados={dados} />;
}

function Arena({ dados }: { dados: DadosEleitos }) {
  const { abrirCandidato } = useNavegacao();
  const T = useMemo(() => montarCartas(dados), [dados]);
  const [, redesenhar] = useReducer((x: number) => x + 1, 0);
  const jogo = useRef<Jogo | null>(null);
  const arena = useRef<HTMLElement>(null);
  const efeitos = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const anuncioEl = useRef<HTMLDivElement>(null);

  if (jogo.current === null) {
    const c = escolherCartas(T, "24-11", "TODAS");
    if (c) jogo.current = novoJogo(0, "24-11", "TODAS", c.a, c.b);
  }
  const g = jogo.current;

  const atualizar = (p: Partial<Jogo>) => {
    if (jogo.current) {
      Object.assign(jogo.current, p);
      redesenhar();
    }
  };

  /** Recomeça o duelo; `manter` conserva as cartas que o jogador escolheu. */
  function novoDuelo(baralho: string, uf: string, manter?: { a?: CartaEleito | null; b?: CartaEleito | null }) {
    const c = escolherCartas(T, baralho, uf, manter);
    if (!c) return;
    jogo.current = novoJogo((jogo.current?.n ?? 0) + 1, baralho, uf, c.a, c.b);
    redesenhar();
  }

  // a entrada das cartas a cada duelo novo (a da direita chega um pouco depois)
  const duelo = g?.n;
  useLayoutEffect(() => {
    if (duelo == null || !arena.current) return;
    animarCarta(arena.current.querySelector('[data-lado="a"]'), "entra");
    animarCarta(arena.current.querySelector('[data-lado="b"]'), "entra", 150);
  }, [duelo]);

  // o anúncio da rodada "pula" para dentro
  const pula = g?.pula ?? 0;
  useEffect(() => {
    if (pula && movimento()) {
      anuncioEl.current?.animate(
        [
          { transform: "scale(.4)", opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 500, easing: "cubic-bezier(.2, 1.6, .4, 1)" },
      );
    }
  }, [pula]);

  // a campeã flutua
  const campea = g?.campea ?? null;
  useEffect(() => {
    if (!campea || !arena.current) return;
    return flutuar(arena.current.querySelector(`[data-lado="${campea}"]`));
  }, [campea, duelo]);

  if (!g) return <Carregando erro={new Error("nenhuma carta encontrada")} />;

  const carta = (l: Lado) => arena.current?.querySelector<HTMLElement>(`[data-lado="${l}"]`) ?? null;
  const centroDe = (l: Lado): [number, number] => {
    const r = carta(l)?.getBoundingClientRect(),
      a = arena.current?.getBoundingClientRect();
    return r && a ? [r.left - a.left + r.width / 2, r.top - a.top + r.height / 2] : [0, 0];
  };
  const solta = (
    x: number,
    y: number,
    txt: string,
    tipo: Parameters<typeof particula>[4],
    dx: number,
    dy: number,
    dur: number,
  ) => {
    if (efeitos.current) particula(efeitos.current, x, y, txt, tipo, dx, dy, dur);
  };
  const mudaVida = (l: Lado, d: number) => {
    const jg = jogo.current!;
    atualizar({ vida: { ...jg.vida, [l]: Math.max(0, Math.min(30, jg.vida[l] + d)) } });
  };

  async function golpe(de: Lado, para: Lado, el: ElementoId, dano: number, n: number) {
    const [x0, y0] = centroDe(de),
      [x1, y1] = centroDe(para),
      ico = EL[el].ico;
    animarCarta(carta(de), "ataca");
    if (movimento()) {
      // o projétil atravessa a arena
      const q = el === "fogo" ? 7 : el === "agua" ? 6 : 4;
      for (let k = 0; k < q; k++)
        setTimeout(() => solta(x0, y0 + (k - q / 2) * 8, ico, "voa", x1 - x0, y1 - y0 + (k - q / 2) * 6, 520), k * 45);
      await espera(520);
      if (jogo.current?.n !== n) return;
      if (el === "raio") {
        clarao(flash.current);
        if (efeitos.current) relampago(efeitos.current, x1, y1);
      }
      if (el === "agua") for (let k = 0; k < 3; k++) setTimeout(() => solta(x1, y1, "", "onda", 0, 0, 700), k * 140);
      // a explosão no alvo
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        solta(x1, y1, el === "terra" ? "🍃" : ico, "estoura", Math.cos(a) * 90, Math.sin(a) * 90, 650);
      }
    }
    animarCarta(carta(para), "apanha");
    solta(x1, y1 - 60, `−${dano}`, "dano", 0, -70, 1100);
    mudaVida(para, -dano);
    await espera(700);
  }

  async function cura(l: Lado, valor: number) {
    const [x, y] = centroDe(l);
    animarCarta(carta(l), "brilha");
    if (movimento())
      for (let k = 0; k < 10; k++)
        solta(x + (Math.random() - 0.5) * 140, y + 60, "✨", "sobe", (Math.random() - 0.5) * 30, -160, 900);
    solta(x, y - 60, `+${valor}`, "cura", 0, -70, 1100);
    mudaVida(l, valor);
    await espera(700);
  }

  function fim() {
    const jg = jogo.current!,
      { a, b } = jg.vida,
      ganhou: Lado | null = a === b ? null : a > b ? "a" : "b";
    atualizar({
      rodadaTxt: "Fim do duelo",
      anuncio: { tipo: "fim", ganhou, a, b, acertos: jg.acertos, total: jg.ordem.length },
      campea: ganhou,
      botao: "↻ Revanche",
      r: FIM,
    });
    if (ganhou && movimento()) {
      const [x, y] = centroDe(ganhou);
      for (let k = 0; k < 28; k++)
        solta(
          x,
          y - 120,
          ["🎉", "⭐", "✨", "🎊"][k % 4],
          "confete",
          (Math.random() - 0.5) * 420,
          160 + Math.random() * 200,
          1600,
        );
    }
  }

  async function rodada() {
    const jg = jogo.current!,
      n = jg.n,
      { a, b } = jg;
    atualizar({ botao: null });
    if (jg.r >= jg.ordem.length || jg.vida.a <= 0 || jg.vida.b <= 0) return fim();
    const r = jg.ordem[jg.r];
    atualizar({
      rodadaTxt: `Rodada ${jg.r + 1} de ${jg.ordem.length}`,
      anuncio: { tipo: "rodada", r },
      pula: jg.pula + 1,
      apostando: true,
    });
    const aposta = await new Promise<Lado>(res => {
      jg.apostar = res;
    });
    if (jogo.current?.n !== n) return; // o duelo foi recomeçado enquanto esperava
    const v = vencedor(r, a, b);
    if (v && v !== "empate" && v === aposta) jg.acertos++;
    atualizar({ apostando: false, apostar: null, registro: [{ r, a, b, v, aposta }, ...jg.registro] });
    if (v && v !== "empate") {
      if (r.id === "luz") await cura(v, 3);
      else await golpe(v, outroLado(v), r.el, danoRodada(r, a, b), n); // no fogo, v é quem arrecadou menos: o outro se queima
    } else if (v === "empate" && r.id === "luz") {
      await Promise.all([cura("a", 1), cura("b", 1)]);
    }
    if (jogo.current?.n !== n) return;
    if (v && v !== "empate" && v === aposta) {
      const [x, y] = centroDe("a");
      solta(x, y + 40, "+1 aposta", "cura", 0, -60, 1100);
      mudaVida("a", 1);
      await espera(400);
      if (jogo.current?.n !== n) return;
    }
    jg.r++;
    if (jg.r >= jg.ordem.length || jg.vida.a <= 0 || jg.vida.b <= 0) return fim();
    atualizar({ botao: "Próxima rodada ›" });
  }

  const escolher = (l: Lado, t: CartaEleito) => {
    // a carta escolhida define o baralho: o adversário vem do mesmo cargo e eleição
    const bar = grupo(t);
    const outro = l === "a" ? g.b : g.a;
    const baralho = T.filter(x => grupo(x) === bar && (g.uf === "TODAS" || x.uf === g.uf));
    const par = outro && grupo(outro) === bar ? outro : sortearDe(baralho, t);
    novoDuelo(bar, g.uf, l === "a" ? { a: t, b: par } : { a: par, b: t });
  };
  const sortear = (l: Lado) => {
    const baralho = T.filter(t => grupo(t) === g.baralho && (g.uf === "TODAS" || t.uf === g.uf));
    const nova = sortearDe(baralho, l === "a" ? g.b : g.a);
    novoDuelo(g.baralho, g.uf, l === "a" ? { a: nova, b: g.b } : { a: g.a, b: nova });
  };

  const filtros = (
    <>
      <Campo rotulo="Cartas de">
        <Seletor value={g.baralho} onChange={e => novoDuelo(e.target.value, g.uf)}>
          {BARALHOS.map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </Seletor>
      </Campo>
      <Campo rotulo="Estado">
        <Seletor value={g.uf} onChange={e => novoDuelo(g.baralho, e.target.value)}>
          <option value="TODAS">Todos os {TOTAL_UFS} estados</option>
          {dados.ufs.map(u => (
            <option key={u} value={u}>
              {UF_NOME[u]}
            </option>
          ))}
        </Seletor>
      </Campo>
    </>
  );

  const lutador = (l: Lado) => {
    const t = g[l],
      v = g.vida[l];
    return (
      <div className="grid justify-items-center gap-2">
        <div className="relative h-[18px] w-[260px] max-w-full overflow-hidden rounded-[9px] border-2 border-[#c9a400] bg-[#0d1116]">
          <i
            className="absolute inset-y-0 left-0 transition-[width,background] duration-[600ms] ease-[ease]"
            style={{
              width: `${Math.min(100, (100 * v) / 20)}%`,
              background: v > 12 ? "var(--color-verde-esc)" : v > 6 ? "var(--color-ouro)" : "#c53d33",
            }}
          />
          <span className="relative block text-center text-[11.5px] leading-[14px] font-extrabold text-white">
            {v} de vida
          </span>
        </div>
        <Carta key={`${g.n}-${l}`} t={t} lado={l} vida={v} campea={g.campea === l} />
        <button
          type="button"
          onClick={() => abrirCandidato(t.ano, t.sq)}
          className="cursor-pointer border-0 bg-transparent font-bold text-[#f2d36b] underline"
        >
          Ver a ficha
        </button>
      </div>
    );
  };

  return (
    <Pagina filtros={filtros}>
      <Etiqueta>ARENA · MODO SECRETO</Etiqueta>
      <h1>Duelo Eleitoral</h1>
      <p className="texto-enunciado">
        Dois eleitos, cinco rodadas, só dados reais do TSE. Em cada rodada, aposte em quem vence: acertar dá +1 de vida
        para a sua carta. Quem terminar com mais vida ganha. É um jogo: os poderes medem números de campanha, não
        caráter.
      </p>

      <Caixa className="grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start max-[760px]:grid-cols-[minmax(0,1fr)]">
        <div className="grid gap-2">
          <h2>Sua carta</h2>
          <Busca cartas={T} aoEscolher={t => escolher("a", t)} />
          <button
            type="button"
            onClick={() => sortear("a")}
            className="cursor-pointer justify-self-start rounded-lg border-2 border-ouro bg-white px-3.5 py-1.5 font-bold hover:bg-ouro-claro"
          >
            🎲 Sortear
          </button>
        </div>
        <div aria-hidden="true" className="self-center text-[34px] font-extrabold text-ouro-esc">
          VS
        </div>
        <div className="grid gap-2">
          <h2>Adversário</h2>
          <Busca cartas={T} aoEscolher={t => escolher("b", t)} />
          <button
            type="button"
            onClick={() => sortear("b")}
            className="cursor-pointer justify-self-start rounded-lg border-2 border-ouro bg-white px-3.5 py-1.5 font-bold hover:bg-ouro-claro"
          >
            🎲 Sortear
          </button>
        </div>
      </Caixa>

      <section
        ref={arena}
        className="relative overflow-hidden rounded-[18px] bg-[radial-gradient(ellipse_at_50%_30%,#3d4a57_0%,#1b222b_70%)] px-[18px] py-[22px]"
      >
        <div ref={flash} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-white opacity-0" />
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,300px)_minmax(0,1fr)] items-center gap-[18px] max-[900px]:grid-cols-[minmax(0,1fr)]">
          {lutador("a")}
          <div className="grid justify-items-center gap-2.5 text-center text-[#f4f1ea]">
            <div className="text-[12.5px] tracking-[.08em] text-[#c9c3b4] uppercase">{g.rodadaTxt}</div>
            <div
              ref={anuncioEl}
              className="grid min-h-[92px] content-center justify-items-center gap-1 text-sm [&_b]:text-[21px] [&_b]:text-[#ffd86b]"
            >
              <AnuncioTexto g={g} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[13px]">
              {g.apostando && (
                <>
                  <span>Sua aposta:</span>
                  {(["a", "b"] as const).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => g.apostar?.(l)}
                      className="cursor-pointer rounded-lg border-2 border-[#ffd86b] bg-[#2a333d] px-3 py-1.5 font-bold text-white hover:bg-[#ffd86b] hover:text-[#1b222b]"
                    >
                      {g[l].nome}
                    </button>
                  ))}
                </>
              )}
            </div>
            {g.botao && (
              <button
                type="button"
                onClick={() => (g.r === FIM ? novoDuelo(g.baralho, g.uf, { a: g.a, b: g.b }) : void rodada())}
                className="cursor-pointer rounded-[10px] border-0 bg-linear-to-b from-[#ffd86b] to-[#e3a400] px-[26px] py-2.5 text-[17px] font-extrabold text-[#1b222b] shadow-[0_4px_0_#8f6c00] active:translate-y-[3px] active:shadow-[0_1px_0_#8f6c00]"
              >
                {g.botao}
              </button>
            )}
            <ol className="m-0 grid max-h-[210px] list-none gap-1.5 overflow-y-auto p-0 text-left text-[12.5px] text-[#d8d3c6]">
              {g.registro.map((e, i) => (
                <li key={g.registro.length - i} className="rounded-lg bg-white/[.06] px-2 py-1.5 [&_b]:text-white">
                  <Registro e={e} />
                </li>
              ))}
            </ol>
          </div>
          {lutador("b")}
        </div>
        <div ref={efeitos} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      </section>

      <VerMais titulo="Regras e de onde vêm os poderes">
        <ul>
          <li>
            <b>Vida:</b> as duas cartas começam com 20.
          </li>
          <li>
            <b>⚡ Voto de confiança:</b> quem teve mais votos, comparado com os eleitos do mesmo cargo (posição de 1 a
            10), ataca: 3 de dano mais a diferença de posição dividida por 3.
          </li>
          <li>
            <b>🔥 Fogo da campanha:</b> quem arrecadou mais se queima: 3 de dano. Sem prestação de contas, a rodada
            empata.
          </li>
          <li>
            <b>💧 Onda da economia:</b> quem gastou menos por voto (arrecadado ÷ votos) ataca: 4 de dano.
          </li>
          <li>
            <b>🌿 Raízes:</b> quem tem mais vitórias na carreira (desde 2002) ataca: 2 de dano mais 1 por vitória de
            diferença (até 6).
          </li>
          <li>
            <b>✨ Luz do saber:</b> quem estudou mais se cura em 3 de vida; empate, os dois em 1.
          </li>
          <li>
            <b>Aposta:</b> acertou quem vence a rodada, sua carta (a da esquerda) ganha +1 de vida.
          </li>
          <li>
            <b>Dados:</b> as fichas da aba "Quem são os eleitos" (TSE: votos, prestação de contas, cadastro e carreira).
            A carta compara eleitos do mesmo cargo e eleição.
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}

function AnuncioTexto({ g }: { g: Jogo }): ReactNode {
  const an = g.anuncio;
  if (an.tipo === "duelo")
    return (
      <>
        <b>{g.a.nome}</b> × <b>{g.b.nome}</b>
      </>
    );
  if (an.tipo === "rodada") {
    return (
      <>
        <span className="text-[38px] leading-none">{EL[an.r.el].ico}</span>
        <b>{an.r.nome}</b>
        <span>{an.r.pergunta}</span>
      </>
    );
  }
  if (an.ganhou) {
    return (
      <>
        <span className="text-[38px] leading-none">🏆</span>
        <b>{g[an.ganhou].nome} venceu!</b>
        <span>
          {an.a} × {an.b} de vida · você acertou {an.acertos} de {an.total} apostas
        </span>
      </>
    );
  }
  return (
    <>
      <span className="text-[38px] leading-none">🤝</span>
      <b>Empate técnico</b>
      <span>
        {an.a} × {an.b} de vida
      </span>
    </>
  );
}

/** Uma linha do registro: valores de cada lado, quem venceu e se a aposta acertou. */
function Registro({ e }: { e: Entrada }) {
  const { r, a, b, v, aposta } = e;
  const resultado: ReactNode =
    v == null ? (
      "Sem dado: empate."
    ) : v === "empate" ? (
      "Empate."
    ) : r.id === "fogo" ? (
      <>
        <b>{(v === "a" ? b : a).nome}</b> arrecadou mais e se queimou.
      </>
    ) : (
      <>
        Venceu <b>{(v === "a" ? a : b).nome}</b>.
      </>
    );
  const acerto = v && v !== "empate" ? (v === aposta ? "Você acertou! +1" : "Você errou.") : "";
  return (
    <>
      {EL[r.el].ico} <b>{r.nome}</b>: {a.nome} {valorRodada(a, r)} × {b.nome} {valorRodada(b, r)}. {resultado} {acerto}
    </>
  );
}
