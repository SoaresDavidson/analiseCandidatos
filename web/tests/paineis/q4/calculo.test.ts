import { describe, expect, it } from "vitest";
import { pearson, reta, spearman } from "../../../src/paineis/q4/calculo";

describe("pearson", () => {
  it("relação linear perfeita", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(pearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1);
  });
  it("null com menos de 3 pontos ou sem variação", () => {
    expect(pearson([1, 2], [1, 2])).toBeNull();
    expect(pearson([1, 2, 3], [5, 5, 5])).toBeNull();
  });
});

describe("spearman", () => {
  it("só olha a ordem", () => expect(spearman([1, 2, 3, 4], [1, 8, 27, 64])).toBeCloseTo(1));
});

describe("reta", () => {
  it("acha y = 2x + 1", () => {
    const { a, b } = reta([0, 1, 2, 3], [1, 3, 5, 7]);
    expect(a).toBeCloseTo(2);
    expect(b).toBeCloseTo(1);
  });
});
