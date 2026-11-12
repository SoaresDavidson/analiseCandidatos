import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import { Caixa, Campo, Carregando, Etiqueta, Pagina, Seletor, SeletorUf, VerMais } from "../../componentes";
import { useDados } from "../../lib/dados";
import { useNavegacao } from "../../lib/navegacao";

import { Busca } from "./Busca";
import { Carta } from "./Carta";
import { type Entrada, FIM, type Jogo, novoJogo, reduzir, somarVida } from "./duelo";
import { animarCarta, brilhos, canhao, carregar, centroEm, espera, movimento, numero, tremer } from "./efeitos";
import {
  BARALHOS,
  COR_PODER,
  danoRodada,
  EL,
  grupo,
  montarCartas,
  outroLado,
  PODER_ICONE,
  sortearDe,
  valorRodada,
  vencedor,
} from "./jogo";
import { ICONE } from "./sprites";
import type { CartaEleito, DadosEleitos, Lado, Rodada } from "./tipos";
import "@fontsource/press-start-2p/latin.css";
import "@fontsource/press-start-2p/latin-ext.css";
import "./arena.css";

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

export default function Painel() {
  const { dados, erro } = useDados<DadosEleitos>("candidatos-eleitos.json");
  if (!dados) return <Carregando erro={erro} />;
  return <Arena dados={dados} />;
}

function Arena({ dados }: { dados: DadosEleitos }) {
  const { abrirCandidato } = useNavegacao();
  const T = useMemo(() => montarCartas(dados), [dados]);
  const [g, despachar] = useReducer(reduzir, null, () => {
    const c = escolherCartas(T, "24-11", "TODAS");
    return c ? novoJogo(0, "24-11", "TODAS", c.a, c.b) : null;
  });
  // as rodadas são assíncronas (esperam o clique em "Lutar!" e as animações): estas refs dizem
  // a elas qual duelo está valendo e como entregar o clique, sem ler o estado no meio do caminho
  const dueloAtual = useRef(0);
  const lutar = useRef<(() => void) | null>(null);
  const arena = useRef<HTMLElement>(null);
  const efeitos = useRef<HTMLDivElement>(null);
  const anuncioEl = useRef<HTMLDivElement>(null);

  /** Recomeça o duelo; `manter` conserva as cartas que o jogador escolheu. */
  function novoDuelo(baralho: string, uf: string, manter?: { a?: CartaEleito | null; b?: CartaEleito | null }) {
    const c = escolherCartas(T, baralho, uf, manter);
    if (!c) return;
    dueloAtual.current += 1;
    lutar.current = null;
    despachar({ tipo: "novo", jogo: novoJogo(dueloAtual.current, baralho, uf, c.a, c.b) });
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

  if (!g) return <Carregando erro={new Error("nenhuma carta encontrada")} />;

  /** A caixa da carta (é ela que anima); a carta em si fica livre para inclinar com o holo. */
  const caixa = (l: Lado) => arena.current?.querySelector<HTMLElement>(`[data-lado="${l}"]`) ?? null;
  const centroDe = (l: Lado): [number, number] => {
    const c = caixa(l);
    return c && efeitos.current ? centroEm(efeitos.current, c) : [0, 0];
  };

  /** Mudança de vida durante uma rodada: atualiza o estado e a conta que a rodada acompanha. */
  type MudaVida = (l: Lado, d: number) => void;

  /** O ladrilho do poder da rodada carrega, o ícone sai voando em arco até a outra carta e explode. */
  async function golpe(de: Lado, para: Lado, r: Rodada, dano: number, n: number, mudaVida: MudaVida) {
    const origem = caixa(de)?.querySelector(`[data-poder="${r.id}"]`) ?? null,
      alvo = caixa(para)?.querySelector(".carta-px") ?? null,
      cor = COR_PODER[r.id],
      icone = PODER_ICONE[r.id];
    carregar(origem, cor);
    await espera(260);
    if (dueloAtual.current !== n) return;
    animarCarta(caixa(de), "ataca", 0, de);
    if (efeitos.current && origem && alvo)
      await canhao(efeitos.current, origem, alvo, { id: icone, src: ICONE[icone] }, cor);
    if (dueloAtual.current !== n) return;
    tremer(arena.current);
    animarCarta(caixa(para), "apanha");
    const [x, y] = centroDe(para);
    if (efeitos.current) numero(efeitos.current, x, y - 60, `-${dano}`, "dano");
    mudaVida(para, -dano);
    await espera(700);
  }

  async function cura(l: Lado, valor: number, mudaVida: MudaVida) {
    const [x, y] = centroDe(l);
    carregar(caixa(l)?.querySelector('[data-poder="luz"]') ?? null, COR_PODER.luz);
    if (efeitos.current) {
      brilhos(efeitos.current, x, y, COR_PODER.luz);
      numero(efeitos.current, x, y - 60, `+${valor}`, "cura");
    }
    mudaVida(l, valor);
    await espera(700);
  }

  /** Fecha o duelo: o palco treme e os carimbos descem (eles são desenhados a partir do estado). */
  function fim() {
    despachar({ tipo: "fim" });
    tremer(arena.current);
  }

  /** O duelo inteiro: cada rodada mostra a pergunta, espera o "Lutar!" e os dados decidem o golpe. */
  async function duelar(jg: Jogo) {
    const n = jg.n,
      { a, b } = jg;
    // o estado só muda no próximo render; esta cópia da vida decide o fim do duelo.
    // Toda mudança passa por mudaVida, que atualiza as duas juntas.
    let vida = jg.vida;
    const mudaVida: MudaVida = (l, d) => {
      vida = somarVida(vida, l, d);
      despachar({ tipo: "vida", l, d });
    };
    for (let k = 0; k < jg.ordem.length && vida.a > 0 && vida.b > 0; k++) {
      const r = jg.ordem[k];
      despachar({ tipo: "rodada", k });
      await new Promise<void>(res => {
        lutar.current = res;
      });
      lutar.current = null;
      if (dueloAtual.current !== n) return; // o duelo foi recomeçado enquanto esperava
      const v = vencedor(r, a, b);
      despachar({ tipo: "lutou", e: { r, a, b, v } });
      if (v && v !== "empate") {
        if (r.id === "luz") await cura(v, 3, mudaVida);
        // no fogo e na verba, v é quem arrecadou ou usou menos: o outro leva o golpe
        else await golpe(v, outroLado(v), r, danoRodada(r, a, b), n, mudaVida);
      } else if (v === "empate" && r.id === "luz") {
        await Promise.all([cura("a", 1, mudaVida), cura("b", 1, mudaVida)]);
      }
      if (dueloAtual.current !== n) return;
      await espera(300);
      if (dueloAtual.current !== n) return;
    }
    fim();
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
        <SeletorUf value={g.uf} onChange={e => novoDuelo(g.baralho, e.target.value)} />
      </Campo>
    </>
  );

  const destaque = g.anuncio.tipo === "rodada" ? g.anuncio.r.id : null;
  const acabou = g.r === FIM;

  /** Carimbo do fim: VENCEU na campeã, DERROTADO(A) na outra, EMPATE nas duas. */
  const carimbo = (l: Lado): ReactNode => {
    if (!acabou) return null;
    if (!g.campea) return <span className="carimbo-pixel empate fonte-pixel">EMPATE</span>;
    if (g.campea === l) return <span className="carimbo-pixel venceu fonte-pixel">VENCEU</span>;
    return (
      <span className="carimbo-pixel perdeu fonte-pixel" style={{ "--atraso": ".28s" } as CSSProperties}>
        {g[l].fem ? "DERROTADA" : "DERROTADO"}
      </span>
    );
  };

  const lutador = (l: Lado) => {
    const t = g[l],
      v = g.vida[l];
    const resultado = acabou && g.campea ? (g.campea === l ? "venceu" : "perdeu") : "";
    return (
      <div className="grid justify-items-center gap-3.5">
        <div className="vida-pixel" role="img" aria-label={`${v} de vida`}>
          <i
            style={
              {
                width: `${Math.min(100, (100 * v) / 20)}%`,
                "--cor-vida": v > 12 ? "var(--color-verde)" : v > 6 ? "var(--color-ouro)" : "var(--color-capital)",
              } as CSSProperties
            }
          />
          <span className="fonte-pixel">{v} DE VIDA</span>
        </div>
        <div data-lado={l} className={`arena-slot ${resultado}`}>
          <Carta key={`${g.n}-${l}`} t={t} vida={v} destaque={destaque} />
          {carimbo(l)}
        </div>
        <button
          type="button"
          onClick={() => abrirCandidato(t.ano, t.sq)}
          className="cursor-pointer border-0 bg-transparent font-bold text-ouro-claro underline"
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
        Dois eleitos, seis rodadas, só dados reais do TSE. Cada rodada faz uma pergunta: clique em Lutar! e os números
        decidem quem ataca e quem leva o golpe. Quem terminar com mais vida ganha. É um jogo: os poderes medem números
        de campanha, não caráter.
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

      <section ref={arena} className="arena-palco">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,280px)_minmax(0,1fr)] items-center justify-items-center gap-[22px] max-[900px]:grid-cols-[minmax(0,1fr)]">
          {lutador("a")}
          <div className="arena-centro">
            <div ref={anuncioEl} className="arena-placa fonte-pixel contorno-pixel">
              <div className="rodada">{g.rodadaTxt.toUpperCase()}</div>
              <AnuncioTexto g={g} />
            </div>
            {/* sempre um botão no mesmo lugar: Lutar!, Começar/Revanche, ou Lutar! apagado durante o golpe */}
            {g.lutando ? (
              <button type="button" onClick={() => lutar.current?.()} className="botao-pixel fonte-pixel">
                LUTAR!
              </button>
            ) : g.botao ? (
              <button
                type="button"
                onClick={() => (g.r === FIM ? novoDuelo(g.baralho, g.uf, { a: g.a, b: g.b }) : void duelar(g))}
                className="botao-pixel fonte-pixel"
              >
                {g.botao}
              </button>
            ) : (
              <button type="button" disabled className="botao-pixel fonte-pixel">
                LUTAR!
              </button>
            )}
            <ol className="arena-registro">
              {g.registro.map((e, i) => (
                <li key={g.registro.length - i}>
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
            <b>💰 Verba pública:</b> quem usou mais dinheiro público na campanha (fundo eleitoral e fundo partidário,
            pela prestação de contas) leva o golpe: 4 de dano. Sem prestação de contas, a rodada empata.
          </li>
          <li>
            <b>Ordem:</b> as seis rodadas vêm sorteadas. Não há aposta: quem ataca sai sempre dos números.
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
        <div className="titulo">{g.a.nome}</div>
        <div className="pergunta">contra</div>
        <div className="titulo">{g.b.nome}</div>
      </>
    );
  if (an.tipo === "rodada")
    return (
      <>
        <div className="titulo flex items-center gap-2">
          <img src={ICONE[PODER_ICONE[an.r.id]]} alt="" className="size-[18px] [image-rendering:pixelated]" />
          {an.r.nome.toUpperCase()}
        </div>
        <div className="pergunta">{an.r.pergunta}</div>
      </>
    );
  if (an.ganhou)
    return (
      <>
        <div className="titulo">🏆 {g[an.ganhou].nome.toUpperCase()}</div>
        <div className="pergunta">
          venceu por {an[an.ganhou]} × {an[outroLado(an.ganhou)]} de vida
        </div>
      </>
    );
  return (
    <>
      <div className="titulo">🤝 EMPATE TÉCNICO</div>
      <div className="pergunta">
        {an.a} × {an.b} de vida
      </div>
    </>
  );
}

/** Uma linha do registro: valores de cada lado e quem venceu. */
function Registro({ e }: { e: Entrada }) {
  const { r, a, b, v } = e;
  const resultado: ReactNode =
    v == null ? (
      "Sem dado: empate."
    ) : v === "empate" ? (
      "Empate."
    ) : r.id === "fogo" ? (
      <>
        <b>{(v === "a" ? b : a).nome}</b> arrecadou mais e se queimou.
      </>
    ) : r.id === "verba" ? (
      <>
        <b>{(v === "a" ? b : a).nome}</b> usou mais dinheiro público e levou o golpe.
      </>
    ) : (
      <>
        Venceu <b>{(v === "a" ? a : b).nome}</b>.
      </>
    );
  return (
    <>
      {EL[r.el].ico} <b>{r.nome}</b>: {a.nome} {valorRodada(a, r)} × {b.nome} {valorRodada(b, r)}. {resultado}
    </>
  );
}
