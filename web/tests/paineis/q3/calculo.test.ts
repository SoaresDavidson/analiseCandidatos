import { describe, expect, it } from "vitest";
import { spearman } from "../../../src/paineis/q3/calculo";

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
