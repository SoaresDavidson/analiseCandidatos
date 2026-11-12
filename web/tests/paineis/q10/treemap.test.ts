import { describe, expect, it } from "vitest";
import { quadricular } from "../../../src/paineis/q10/treemap";

const AREA = { x: 0, y: 0, w: 800, h: 400 };

describe("quadricular", () => {
  it("dá a cada valor uma área proporcional e preenche tudo", () => {
    const valores = [600, 250, 100, 50];
    const rets = quadricular(valores, AREA);
    const total = AREA.w * AREA.h;
    rets.forEach((r, i) => expect(r.w * r.h).toBeCloseTo((total * valores[i]) / 1000, 3));
    expect(rets.reduce((s, r) => s + r.w * r.h, 0)).toBeCloseTo(total, 3);
  });

  it("não sobrepõe retângulos nem sai da área", () => {
    const rets = quadricular([9, 7, 5, 4, 3, 2, 1, 1], AREA);
    for (const r of rets) {
      expect(r.x).toBeGreaterThanOrEqual(-1e-9);
      expect(r.y).toBeGreaterThanOrEqual(-1e-9);
      expect(r.x + r.w).toBeLessThanOrEqual(AREA.w + 1e-6);
      expect(r.y + r.h).toBeLessThanOrEqual(AREA.h + 1e-6);
    }
    for (let i = 0; i < rets.length; i++)
      for (let j = i + 1; j < rets.length; j++) {
        const a = rets[i],
          b = rets[j];
        const cruza =
          a.x < b.x + b.w - 1e-6 && a.x + a.w > b.x + 1e-6 && a.y < b.y + b.h - 1e-6 && a.y + a.h > b.y + 1e-6;
        expect(cruza).toBe(false);
      }
  });

  it("devolve na ordem de entrada, com retângulo vazio para valor zero", () => {
    const rets = quadricular([1, 0, 3], AREA);
    expect(rets[1].w * rets[1].h).toBe(0);
    expect(rets[2].w * rets[2].h).toBeCloseTo(3 * rets[0].w * rets[0].h, 3);
  });

  it("um bem só ocupa a área inteira", () => {
    expect(quadricular([42], AREA)).toEqual([AREA]);
  });

  it("sem valor nenhum, nada é desenhado", () => {
    expect(quadricular([0, 0], AREA).every(r => r.w === 0 && r.h === 0)).toBe(true);
  });
});
