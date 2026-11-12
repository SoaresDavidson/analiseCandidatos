import { describe, expect, it } from "vitest";
import { type AnoFin, anosSuspeitos } from "../../../src/paineis/q10/logica";

const a = (ano: number, total: number): AnoFin => ({
  ano,
  receita: null,
  publico: null,
  despesa: null,
  temBens: true,
  total,
  grupos: [],
  itens: [],
});
const anos = (xs: AnoFin[]) => anosSuspeitos(xs).map(x => x.ano);

describe("anosSuspeitos", () => {
  it("marca o ano 50 vezes acima da mediana dos outros", () => {
    expect(anos([a(2010, 300_000), a(2014, 90_000_000), a(2018, 400_000), a(2022, 500_000)])).toEqual([2014]);
  });

  it("com só duas declarações não marca nenhuma: crescimento grande pode ser real", () => {
    expect(anos([a(2006, 150_000), a(2022, 12_000_000)])).toEqual([]);
  });

  it("declaração zerada não serve de referência", () => {
    expect(anos([a(2010, 0), a(2014, 0), a(2022, 11_000_000)])).toEqual([]);
    expect(anos([a(2010, 0), a(2014, 8_000_000), a(2018, 9_000_000), a(2022, 11_000_000)])).toEqual([]);
  });

  it("valor alto mas abaixo de R$ 10 milhões não é suspeito", () => {
    expect(anos([a(2010, 10_000), a(2014, 12_000), a(2022, 9_000_000)])).toEqual([]);
  });
});
