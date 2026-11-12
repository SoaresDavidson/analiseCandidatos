import { describe, expect, it } from "vitest";
import {
  comparar,
  dependenciaPorUf,
  grupos,
  inicioFaixa,
  panorama,
  rotFaixa,
  ufIdx,
} from "../../../src/paineis/q8/estatistica";
import type { DadosQ8, Grupo } from "../../../src/paineis/q8/tipos";

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

describe("país inteiro", () => {
  // AC: 40 de 100 dependem do fundo; SP: 10 de 100
  const D: DadosQ8 = {
    ufs: ["AC", "SP"],
    cargos: [],
    q8: [
      [2024, 0, 0, 0, 60, 30],
      [2024, 0, 0, 21, 40, 4],
      [2024, 1, 0, 0, 90, 30],
      [2024, 1, 0, 11, 10, 1],
    ],
  };
  it("TODAS vale para todas as UFs do arquivo", () => {
    expect(ufIdx(D.ufs, "TODAS")).toEqual([0, 1]);
    expect(ufIdx(D.ufs, "SP")).toEqual([1]);
  });
  it("dependência por estado: de cada 100 candidatos, quantos têm metade ou mais do fundo", () => {
    expect(dependenciaPorUf(D, 2024, 0)).toEqual([
      { uf: "AC", n: 100, pub: 40 },
      { uf: "SP", n: 100, pub: 10 },
    ]);
    expect(dependenciaPorUf(D, 2022, 2)[0]).toEqual({ uf: "AC", n: 0, pub: null });
  });
  it("panorama: uma comparação por cargo e eleição, com a contagem dos resultados", () => {
    const p = panorama(D, [0, 1]);
    expect(p.itens).toHaveLength(12);
    expect(p.itens[0]).toMatchObject({ a: 2024, c: 0 });
    // vereador 2024: 5 eleitos de 50 (fundo) contra 60 de 150: diferença real, para menos
    expect(p.menos).toBe(1);
    expect(p.mais + p.igual).toBe(0);
  });
});
