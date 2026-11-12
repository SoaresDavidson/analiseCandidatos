import { describe, expect, it } from "vitest";
import { COR_OUTROS, COR_PARTIDO, COR_SEM_PREFEITO, corPartido, fatias } from "../../../src/paineis/q3/partidos";
import type { Municipio } from "../../../src/paineis/q3/tipos";

const cidade = (pref: string) => ({ pref }) as Municipio;

describe("cores dos partidos no mapa", () => {
  it("só 5 partidos têm cor própria; os demais são 'outros' e sem prefeito fica claro", () => {
    expect(Object.keys(COR_PARTIDO)).toHaveLength(5);
    expect(corPartido("PSD")).toBe(COR_PARTIDO.PSD);
    expect(corPartido("PT")).toBe(COR_OUTROS);
    expect(corPartido("")).toBe(COR_SEM_PREFEITO);
    expect(corPartido(null)).toBe(COR_SEM_PREFEITO);
  });
  it("a cor é do partido, não da posição: não depende de quem lidera", () => {
    const a = fatias([cidade("PL"), cidade("PL"), cidade("PSD")]);
    const b = fatias([cidade("PSD"), cidade("PSD"), cidade("PL")]);
    expect(a.find(x => x.sg === "PL")?.cor).toBe(b.find(x => x.sg === "PL")?.cor);
  });
});

describe("fatias", () => {
  it("soma 100% e junta os partidos sem cor em Outros; cidade sem prefeito não conta", () => {
    const f = fatias([cidade("PSD"), cidade("MDB"), cidade("PT"), cidade("PSB"), cidade("")]);
    expect(f.map(x => [x.sg, x.n])).toEqual([
      ["PSD", 1],
      ["MDB", 1],
      ["Outros", 2],
    ]);
    expect(f.reduce((s, x) => s + x.pct, 0)).toBeCloseTo(100);
  });
  it("sem nenhum prefeito, lista vazia", () => {
    expect(fatias([cidade("")])).toEqual([]);
  });
});
