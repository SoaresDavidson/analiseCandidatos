import { describe, expect, it } from "vitest";
import { brl, fmt, int, maiusculaInicial, nomeLugar, nomeProprio, pc } from "../../src/lib/formato";

describe("fmt", () => {
  it("usa vírgula decimal e o número de casas pedido", () => {
    expect(fmt(3.14159)).toBe("3,1");
    expect(fmt(3.14159, 2)).toBe("3,14");
    expect(fmt(1234.5, 0)).toBe("1.235");
  });
  it("marca ausência com traço", () => {
    expect(fmt(null)).toBe("–");
    expect(fmt(undefined)).toBe("–");
    expect(fmt(Number.NaN)).toBe("–");
  });
});

describe("int e pc", () => {
  it("int arredonda e separa milhar", () => expect(int(14193.6)).toBe("14.194"));
  it("pc devolve a porcentagem ou null sem base", () => {
    expect(pc(1, 4)).toBe(25);
    expect(pc(1, 0)).toBeNull();
    expect(pc(1, -3)).toBeNull();
  });
});

describe("brl", () => {
  it.each([
    [870, "R$ 870"],
    [9_999, "R$ 9.999"],
    [35_000, "R$ 35 mil"],
    [1_200_000, "R$ 1,2 milhão"],
    [2_500_000, "R$ 2,5 milhões"],
    [15_000_000, "R$ 15 milhões"],
    [1_500_000_000, "R$ 1,5 bilhão"],
    [-35_000, "R$ -35 mil"],
  ])("%d -> %s", (v, esperado) => expect(brl(v)).toBe(esperado));
  it("traço sem valor", () => expect(brl(null)).toBe("–"));
});

describe("nomes", () => {
  it("nomeProprio deixa as partículas minúsculas, menos no começo", () => {
    expect(nomeProprio("MARIA DA SILVA")).toBe("Maria da Silva");
    expect(nomeProprio("DE PAULA SOUZA")).toBe("De Paula Souza");
    expect(nomeProprio("ANA-MARIA D'ÁVILA")).toBe("Ana-Maria D'Ávila");
    expect(nomeProprio(null)).toBe("");
  });
  it("nomeLugar mantém o d' minúsculo no meio do nome", () => {
    expect(nomeLugar("SÃO JOSÉ D'OESTE")).toBe("São José d'Oeste");
    expect(nomeLugar("SANTANA DO LIVRAMENTO")).toBe("Santana do Livramento");
    expect(nomeLugar("D'ALIANÇA")).toBe("D'Aliança");
  });
  it("maiusculaInicial", () => expect(maiusculaInicial("direita")).toBe("Direita"));
});
