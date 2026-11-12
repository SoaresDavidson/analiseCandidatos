import { describe, expect, it } from "vitest";
import { atribuirRaridade, RARIDADE, raridadeDe } from "../../../src/paineis/arena/jogo";
import type { CartaEleito } from "../../../src/paineis/arena/tipos";

describe("raridadeDe", () => {
  it("corta nos 40%, 70%, 90% e 98% dos votos do baralho", () => {
    expect(raridadeDe(0)).toBe("comum");
    expect(raridadeDe(0.399)).toBe("comum");
    expect(raridadeDe(0.4)).toBe("incomum");
    expect(raridadeDe(0.699)).toBe("incomum");
    expect(raridadeDe(0.7)).toBe("rara");
    expect(raridadeDe(0.899)).toBe("rara");
    expect(raridadeDe(0.9)).toBe("epica");
    expect(raridadeDe(0.979)).toBe("epica");
    expect(raridadeDe(0.98)).toBe("lendaria");
    expect(raridadeDe(1)).toBe("lendaria");
  });
  it("cada raridade tem nome e de 1 a 5 estrelas", () => {
    expect(RARIDADE.comum.estrelas).toBe(1);
    expect(RARIDADE.lendaria.estrelas).toBe(5);
    expect(RARIDADE.epica.nome).toBe("Épica");
  });
});

describe("atribuirRaridade", () => {
  const cartas = (votos: (number | null)[]) => votos.map(v => ({ votos: v }) as unknown as CartaEleito);

  it("o mais votado do baralho é lendário e o menos votado é comum", () => {
    const l = cartas(Array.from({ length: 100 }, (_, i) => i + 1));
    atribuirRaridade(l);
    expect(l[99].raridade).toBe("lendaria");
    expect(l[0].raridade).toBe("comum");
  });
  it("segue as proporções: 40 comuns, 30 incomuns, 20 raras, 8 épicas e 2 lendárias em 100", () => {
    const l = cartas(Array.from({ length: 100 }, (_, i) => (i * 37) % 100)); // fora de ordem de propósito
    atribuirRaridade(l);
    const conta = (r: string) => l.filter(t => t.raridade === r).length;
    expect([conta("comum"), conta("incomum"), conta("rara"), conta("epica"), conta("lendaria")]).toEqual([
      40, 30, 20, 8, 2,
    ]);
  });
  it("sem votos registrados a carta é comum", () => {
    const l = cartas([null, 10, 20]);
    atribuirRaridade(l);
    expect(l[0].raridade).toBe("comum");
  });
  it("baralho de uma carta só: ela é lendária", () => {
    const l = cartas([500]);
    atribuirRaridade(l);
    expect(l[0].raridade).toBe("lendaria");
  });
});
