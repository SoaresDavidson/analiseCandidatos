import { describe, expect, it } from "vitest";
import { achar, chancePorPatrimonio, custoCadeira, partesDaPropaganda } from "../../../src/paineis/e2026/calculo";
import type { Dados2026, LinhaPatrimonio } from "../../../src/paineis/e2026/tipos";

describe("achar", () => {
  const t: [number, number, number, number][] = [
    [2022, -1, 6, 10],
    [2026, -1, 6, 20],
    [2026, 3, 6, 30],
    [2026, 3, 7, 40],
  ];
  it("acha pelo ano, pelo lugar e pelo cargo", () => {
    expect(achar(t, 2026, -1, 6)?.[3]).toBe(20);
    expect(achar(t, 2026, 3, 7)?.[3]).toBe(40);
    expect(achar(t, 2026, 5, 6)).toBeUndefined();
  });
});

describe("custo da cadeira", () => {
  const D = {
    custo: [
      [2022, -1, 6, 10, 1000, 1.1],
      [2026, -1, 6, 10, 1000, null],
      [2026, -1, 5, 0, 500, 1],
    ],
  } as unknown as Dados2026;
  it("é a despesa dividida pelas vagas, corrigida quando há fator", () => {
    expect(custoCadeira(D, 2022, -1, 6)).toBeCloseTo(110);
    expect(custoCadeira(D, 2026, -1, 6)).toBe(100);
  });
  it("sem vaga ou sem linha não há custo", () => {
    expect(custoCadeira(D, 2026, -1, 5)).toBeNull();
    expect(custoCadeira(D, 2026, 2, 6)).toBeNull();
  });
});

describe("chance por patrimônio", () => {
  const t: LinhaPatrimonio[] = [
    [2026, -1, 6, 0, 50, 1],
    [2026, -1, 6, 1, 100, 2],
    [2026, -1, 6, 5, 100, 20],
  ];
  it("compara o quinto mais pobre com o mais rico", () => {
    const c = chancePorPatrimonio(t, 2026, -1, 6);
    expect(c.pobres.taxa).toBe(2);
    expect(c.ricos.taxa).toBe(20);
  });
  it("sem dados devolve vazio", () => {
    expect(chancePorPatrimonio(t, 2022, -1, 6).ricos).toEqual({ n: 0, taxa: null });
  });
});

describe("propaganda", () => {
  it("ordena os tipos pela parte no gasto", () => {
    expect(partesDaPropaganda([10, 30, 60])).toEqual([
      { canal: 2, pct: 60 },
      { canal: 1, pct: 30 },
      { canal: 0, pct: 10 },
    ]);
  });
  it("sem gasto não há partes", () => {
    expect(partesDaPropaganda([0, 0])).toEqual([]);
    expect(partesDaPropaganda(undefined)).toEqual([]);
  });
});
