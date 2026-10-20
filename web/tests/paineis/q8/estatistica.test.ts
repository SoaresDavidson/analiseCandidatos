import { describe, expect, it } from "vitest";
import { comparar, grupos, inicioFaixa, rotFaixa } from "../../../src/paineis/q8/estatistica";
import type { Grupo } from "../../../src/paineis/q8/tipos";

// 22 faixas: 0 = nada do fundo, 1..20 = de 5 em 5 pontos, 21 = tudo
const vazias = (): Grupo[] => Array.from({ length: 22 }, () => ({ n: 0, e: 0 }));

describe("faixas", () => {
  it("rótulos das pontas e do meio", () => {
    expect(rotFaixa(0)).toBe("0% (nada)");
    expect(rotFaixa(21)).toBe("100% (tudo)");
    expect(rotFaixa(11)).toBe("50% a 55%");
    expect(inicioFaixa(1)).toBe(0);
  });
});

describe("grupos", () => {
  it("separa pelo corte: faixa que começa no corte já conta como dependente", () => {
    const r = vazias();
    r[0] = { n: 10, e: 1 };
    r[11] = { n: 20, e: 4 }; // começa em 50%
    r[21] = { n: 5, e: 2 };
    expect(grupos(r, 50)).toEqual({ out: { n: 10, e: 1 }, pub: { n: 25, e: 6 } });
  });
});

describe("comparar", () => {
  it("não conclui com grupos pequenos", () => {
    const r = vazias();
    r[0] = { n: 10, e: 1 };
    r[21] = { n: 10, e: 5 };
    const c = comparar(r, 50);
    expect(c.ok).toBe(false);
    expect(c.real).toBe(false);
    expect(c.dif).toBeCloseTo(40);
  });

  it("aponta diferença real com grupos grandes e taxas distantes", () => {
    const r = vazias();
    r[0] = { n: 1000, e: 100 };
    r[21] = { n: 1000, e: 300 };
    const c = comparar(r, 50);
    expect(c.ok).toBe(true);
    expect(c.real).toBe(true);
    expect(c.p).toBeLessThan(0.001);
  });
});
