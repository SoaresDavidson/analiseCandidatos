import { describe, expect, it } from "vitest";
import { chance, porNivel, romano, teste } from "../../../src/paineis/q4/calculo";
import { CAPITULOS, indiceDoEstado, paginaDe } from "../../../src/paineis/q4/capitulos";
import type { LinhaChance } from "../../../src/paineis/q4/tipos";

const LINHAS: LinhaChance[] = [
  [2024, "MA", 13, 3, 100, 5],
  [2024, "MA", 13, 8, 100, 20],
  [2024, "GO", 13, 8, 50, 10],
  [2022, "DF", 8, 8, 40, 4],
  [2022, "GO", 7, 8, 60, 6],
];

describe("chance", () => {
  it("soma candidatos e eleitos por grau no ano, cargo e estados pedidos", () => {
    const r = chance(LINHAS, 2024, ["MA", "GO"], 13);
    expect(r[3]).toEqual({ n: 100, e: 5 });
    expect(r[8]).toEqual({ n: 150, e: 30 });
  });
  it("o deputado distrital do DF conta com os estaduais", () => {
    expect(chance(LINHAS, 2022, ["DF", "GO"], 7)[8]).toEqual({ n: 100, e: 10 });
    expect(chance(LINHAS, 2022, ["DF"], 7)[8]).toEqual({ n: 40, e: 4 });
  });
});

describe("porNivel", () => {
  it("junta os 8 graus nos 4 níveis e dá a taxa de eleição", () => {
    const niv = porNivel(chance(LINHAS, 2024, ["MA"], 13));
    expect(niv[0]).toEqual({ n: 100, e: 5, t: 5 });
    expect(niv[3]).toEqual({ n: 100, e: 20, t: 20 });
    expect(niv[1].t).toBeNull();
  });
});

describe("teste", () => {
  it("acusa diferença real quando as taxas são bem diferentes", () => {
    const t = teste(chance(LINHAS, 2024, ["MA"], 13));
    expect(t.N).toBe(200);
    expect(t.E).toBe(25);
    expect(t.p).toBeLessThan(0.01);
    expect(t.conf).toBe(true);
  });
  it("sem candidatos não há teste", () => {
    expect(teste(chance(LINHAS, 2024, ["RS"], 13)).p).toBeNull();
  });
});

describe("romano", () => {
  it("escreve os números dos capítulos", () => {
    expect([1, 4, 9, 14, 28, 29].map(romano)).toEqual(["I", "IV", "IX", "XIV", "XXVIII", "XXIX"]);
  });
});

describe("capítulos do livro", () => {
  it("são o sumário, o Brasil, os 27 estados e as notas", () => {
    expect(CAPITULOS).toHaveLength(30);
    expect(CAPITULOS.filter(c => c.tipo === "estado")).toHaveLength(27);
  });
  it("começam pelo Norte em ordem alfabética, e a página da esquerda é par", () => {
    expect(indiceDoEstado("AC")).toBe(2);
    expect(indiceDoEstado("AP")).toBe(3);
    expect(paginaDe(indiceDoEstado("AC"))).toBe(4);
    expect(indiceDoEstado("XX")).toBe(-1);
  });
});
