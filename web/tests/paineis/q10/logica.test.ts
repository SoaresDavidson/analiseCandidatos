import { describe, expect, it } from "vitest";
import { RECEITA_MAXIMA, receitaComErro } from "../../../src/paineis/q10/logica";

describe("receitaComErro", () => {
  it("marca a receita digitada errada (vereadores do AM em 2020, R$ 207 milhões)", () => {
    expect(receitaComErro(207_177_206.66)).toBe(true);
  });
  it("aceita campanhas reais, até a maior de governador", () => {
    expect(receitaComErro(8_600)).toBe(false);
    expect(receitaComErro(RECEITA_MAXIMA)).toBe(false);
  });
  it("sem prestação de contas não é erro", () => {
    expect(receitaComErro(null)).toBe(false);
  });
});
