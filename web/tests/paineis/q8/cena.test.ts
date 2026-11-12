import { describe, expect, it } from "vitest";
import { BONECO, CENA, lugaresNaCumbuca, lugaresNaCupula } from "../../../src/paineis/q8/cena";

const semSobrepor = (ps: [number, number][]) =>
  ps.every(([x, y], i) => ps.every(([a, b], j) => i === j || y !== b || Math.abs(x - a) >= BONECO.passoX - 1e-9));

describe("lugares dos 100 bonecos", () => {
  it("cabem 100 na cúpula e 100 na cumbuca, sem um em cima do outro", () => {
    const cupula = lugaresNaCupula(),
      cumbuca = lugaresNaCumbuca();
    expect(cupula).toHaveLength(100);
    expect(cumbuca).toHaveLength(100);
    expect(semSobrepor(cupula)).toBe(true);
    expect(semSobrepor(cumbuca)).toBe(true);
  });

  it("ninguém fica para fora da cúpula", () => {
    const { cx, rx, ry } = CENA.cupula;
    for (const [x, y] of lugaresNaCupula()) {
      const topo = CENA.laje - y + BONECO.h; // altura da cabeça acima da laje
      const meia = rx * Math.sqrt(1 - (topo / ry) ** 2);
      expect(Math.abs(x - cx) + BONECO.w / 2).toBeLessThanOrEqual(meia);
    }
  });

  it("ninguém fica para fora da cumbuca nem acima da boca", () => {
    const { cx, rx, ry, borda } = CENA.cumbuca;
    for (const [x, y] of lugaresNaCumbuca()) {
      expect(y - BONECO.h).toBeGreaterThanOrEqual(borda);
      const meia = rx * Math.sqrt(1 - ((y - borda) / ry) ** 2);
      expect(Math.abs(x - cx) + BONECO.w / 2).toBeLessThanOrEqual(meia);
    }
  });

  it("enchem de baixo para cima, do meio para as pontas", () => {
    const cumbuca = lugaresNaCumbuca();
    expect(cumbuca[0][1]).toBeGreaterThan(cumbuca[99][1]);
    expect(Math.abs(cumbuca[0][0] - CENA.cumbuca.cx)).toBeLessThan(BONECO.passoX);
    const cupula = lugaresNaCupula();
    expect(cupula[0][1]).toBeGreaterThan(cupula[99][1]);
  });
});
