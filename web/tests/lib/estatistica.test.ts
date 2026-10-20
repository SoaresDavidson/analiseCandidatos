import { describe, expect, it } from "vitest";
import { mediana } from "../../src/lib/estatistica";

describe("mediana", () => {
  it("ímpar, par e com nulos", () => {
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
    expect(mediana([null, 5, undefined, 1])).toBe(3);
  });
  it("sem valores é null", () => expect(mediana([null, undefined])).toBeNull());
});
