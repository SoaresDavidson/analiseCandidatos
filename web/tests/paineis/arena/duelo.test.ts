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
  it("rodada abre a aposta e esconde o botão", () => {
    const g = jogo();
    const r = g.ordem[0];
    const s = reduzir(g, { tipo: "rodada", r })!;
    expect(s.apostando).toBe(true);
    expect(s.botao).toBeNull();
    expect(s.pula).toBe(g.pula + 1);
    expect(s.rodadaTxt).toBe(`Rodada 1 de ${g.ordem.length}`);
  });

  it("aposta certa conta acerto e entra no topo do registro", () => {
    const g = jogo();
    const e = { r: g.ordem[0], a: g.a, b: g.b, v: "a" as const, aposta: "a" as const };
    const s = reduzir(g, { tipo: "apostou", e })!;
    expect(s.acertos).toBe(1);
    expect(s.registro[0]).toBe(e);
    expect(reduzir(g, { tipo: "apostou", e: { ...e, aposta: "b" } })!.acertos).toBe(0);
  });

  it("fim marca a campeã pela vida e encerra o duelo", () => {
    let g = jogo();
    g = reduzir(g, { tipo: "vida", l: "b", d: -5 })!;
    g = reduzir(g, { tipo: "fim" })!;
    expect(g.campea).toBe("a");
    expect(g.r).toBe(FIM);
    expect(g.botao).toBe("↻ Revanche");
  });

  it("não muda o estado anterior", () => {
    const g = jogo();
    reduzir(g, { tipo: "vida", l: "a", d: -3 });
    expect(g.vida.a).toBe(20);
  });
});
