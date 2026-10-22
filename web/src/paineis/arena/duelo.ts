// Estado de um duelo da Arena e as ações que o mudam (funções puras, testadas em tests/).
import { embaralhar, VIDA_INICIAL } from "./jogo";
import type { CartaEleito, Lado, Rodada } from "./tipos";

export type Anuncio =
  | { tipo: "duelo" }
  | { tipo: "rodada"; r: Rodada }
  | { tipo: "fim"; ganhou: Lado | null; a: number; b: number };

export interface Entrada {
  r: Rodada;
  a: CartaEleito;
  b: CartaEleito;
  v: Lado | "empate" | null;
}

/** Estado do duelo; muda só pelas ações do `reduzir`. */
export interface Jogo {
  n: number; // número do duelo; quem espera uma animação confere se ainda é o mesmo
  baralho: string;
  uf: string;
  a: CartaEleito;
  b: CartaEleito;
  vida: Record<Lado, number>;
  r: number; // rodada atual (99 = duelo acabou)
  ordem: Rodada[];
  rodadaTxt: string;
  anuncio: Anuncio;
  pula: number; // contador que dispara a animação do anúncio
  /** a rodada mostra a pergunta e espera o clique em "Lutar!" */
  lutando: boolean;
  registro: Entrada[];
  botao: string | null; // texto do botão principal; null = escondido
  campea: Lado | null;
}

export const FIM = 99;

/** Vida nova de um lado, sempre entre 0 e 30. */
export const somarVida = (vida: Record<Lado, number>, l: Lado, d: number): Record<Lado, number> => ({
  ...vida,
  [l]: Math.max(0, Math.min(30, vida[l] + d)),
});
export const ganhador = (vida: Record<Lado, number>): Lado | null =>
  vida.a === vida.b ? null : vida.a > vida.b ? "a" : "b";

export type Acao =
  | { tipo: "novo"; jogo: Jogo }
  | { tipo: "rodada"; k: number }
  | { tipo: "lutou"; e: Entrada }
  | { tipo: "vida"; l: Lado; d: number }
  | { tipo: "fim" };

export function reduzir(g: Jogo | null, a: Acao): Jogo | null {
  if (a.tipo === "novo") return a.jogo;
  if (!g) return g; // sem cartas não há duelo
  switch (a.tipo) {
    case "rodada":
      return {
        ...g,
        r: a.k,
        rodadaTxt: `Rodada ${a.k + 1} de ${g.ordem.length}`,
        anuncio: { tipo: "rodada", r: g.ordem[a.k] },
        pula: g.pula + 1,
        lutando: true,
        botao: null,
      };
    case "lutou":
      return { ...g, lutando: false, registro: [a.e, ...g.registro] };
    case "vida":
      return { ...g, vida: somarVida(g.vida, a.l, a.d) };
    case "fim": {
      const ganhou = ganhador(g.vida);
      return {
        ...g,
        rodadaTxt: "Fim do duelo",
        anuncio: { tipo: "fim", ganhou, a: g.vida.a, b: g.vida.b },
        campea: ganhou,
        botao: "↻ Revanche",
        r: FIM,
      };
    }
  }
}

export function novoJogo(n: number, baralho: string, uf: string, a: CartaEleito, b: CartaEleito): Jogo {
  return {
    n,
    baralho,
    uf,
    a,
    b,
    vida: { a: VIDA_INICIAL, b: VIDA_INICIAL },
    r: 0,
    ordem: embaralhar(),
    rodadaTxt: "Pronto para o duelo",
    anuncio: { tipo: "duelo" },
    pula: 0,
    lutando: false,
    registro: [],
    botao: "⚔ Começar o duelo",
    campea: null,
  };
}
