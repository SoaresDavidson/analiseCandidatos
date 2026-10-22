import { describe, expect, it } from "vitest";
import { aleatorio, hoje, sortear } from "../../../src/paineis/jogos/comum";

describe("aleatorio", () => {
  it("repete a sequência para a mesma semente e muda para outra", () => {
    const a = aleatorio("2026-10-21"),
      b = aleatorio("2026-10-21"),
      c = aleatorio("2026-10-22");
    const sa = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(sa);
    expect([c(), c(), c()]).not.toEqual(sa);
    expect(sa.every(x => x >= 0 && x < 1)).toBe(true);
  });
});

describe("hoje", () => {
  it("usa a data local com zeros à esquerda", () => {
    expect(hoje(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("sortear", () => {
  it("pega pelo número sorteado e devolve undefined na lista vazia", () => {
    expect(sortear(["a", "b", "c"], () => 0.99)).toBe("c");
    expect(sortear([], () => 0.5)).toBeUndefined();
  });
});
