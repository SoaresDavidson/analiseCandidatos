import { describe, expect, it } from "vitest";
import { FIM, ganhador, novoJogo, reduzir, somarVida } from "../../../src/paineis/arena/duelo";
import type { CartaEleito } from "../../../src/paineis/arena/tipos";

const carta = (nome: string) => ({ nome }) as CartaEleito;
const jogo = () => novoJogo(1, "24-11", "TODAS", carta("A"), carta("B"));

describe("vida", () => {
  it("fica entre 0 e 30", () => {
    expect(somarVida({ a: 2, b: 29 }, "a", -5)).toEqual({ a: 0, b: 29 });
    expect(somarVida({ a: 2, b: 29 }, "b", 5)).toEqual({ a: 2, b: 30 });
  });
  it("ganha quem tem mais vida; igual é empate", () => {
    expect(ganhador({ a: 5, b: 3 })).toBe("a");
    expect(ganhador({ a: 4, b: 4 })).toBeNull();
  });
});

describe("reduzir", () => {
  it("rodada mostra a pergunta, espera o Lutar! e esconde o botão principal", () => {
    const g = jogo();
    const s = reduzir(g, { tipo: "rodada", k: 2 })!;
    expect(s.lutando).toBe(true);
    expect(s.botao).toBeNull();
    expect(s.r).toBe(2);
    expect(s.anuncio).toEqual({ tipo: "rodada", r: g.ordem[2] });
    expect(s.pula).toBe(g.pula + 1);
    expect(s.rodadaTxt).toBe(`Rodada 3 de ${g.ordem.length}`);
  });

  it("depois do Lutar! a rodada entra no topo do registro, sem aposta", () => {
    const g = reduzir(jogo(), { tipo: "rodada", k: 0 })!;
    const e = { r: g.ordem[0], a: g.a, b: g.b, v: "a" as const };
    const s = reduzir(g, { tipo: "lutou", e })!;
    expect(s.lutando).toBe(false);
    expect(s.registro[0]).toBe(e);
    expect(s.vida).toEqual(g.vida);
  });

  it("fim marca a campeã pela vida e encerra o duelo", () => {
    let g = jogo();
    g = reduzir(g, { tipo: "vida", l: "b", d: -5 })!;
    g = reduzir(g, { tipo: "fim" })!;
    expect(g.campea).toBe("a");
    expect(g.r).toBe(FIM);
    expect(g.botao).toBe("↻ Revanche");
    expect(g.anuncio).toEqual({ tipo: "fim", ganhou: "a", a: 20, b: 15 });
  });

  it("não muda o estado anterior", () => {
    const g = jogo();
    reduzir(g, { tipo: "vida", l: "a", d: -3 });
    expect(g.vida.a).toBe(20);
  });
});
