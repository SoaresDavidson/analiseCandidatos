import { describe, expect, it } from "vitest";
import { mediana, spearman } from "./calculo";

describe("mediana", () => {
  it("ímpar, par e com nulos", () => {
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
    expect(mediana([null, 5, undefined, 1])).toBe(3);
  });
  it("sem valores é null", () => expect(mediana([null, undefined])).toBeNull());
});

describe("spearman", () => {
  it("ordem igual dá 1, ordem invertida dá -1, mesmo sem relação linear", () => {
    expect(spearman([1, 2, 3, 4], [1, 4, 9, 16])).toBeCloseTo(1);
    expect(spearman([1, 2, 3, 4], [40, 30, 20, 10])).toBeCloseTo(-1);
  });
  it("empates recebem a média dos postos", () => {
    // postos de a: 1,2.5,2.5,4; de b: 1,2,3,4
    expect(spearman([1, 2, 2, 3], [1, 2, 3, 4])).toBeCloseTo(0.9487, 4);
  });
});
