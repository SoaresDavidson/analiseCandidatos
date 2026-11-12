import { describe, expect, it } from "vitest";
import type { Municipio } from "../../../src/paineis/q7/tipos";
import {
  anoDe,
  comMudanca,
  corDif,
  corNota,
  mudanca,
  naCategoria,
  paraOnde,
  resumo,
} from "../../../src/paineis/q7/util";

const cidade = (uf: string, notas: (number | null)[]): Municipio => ({
  cod: 1,
  nome: "X",
  uf,
  cap: false,
  notas,
  pref: ["", null, "", null, 0],
  busca: "x",
});

describe("cor do lado", () => {
  it("vermelho na esquerda, cinza no centro, azul na direita", () => {
    expect(corNota(0)).toBe("rgb(109 11 18)");
    expect(corNota(5)).toBe("rgb(228 225 217)");
    expect(corNota(10)).toBe("rgb(6 38 77)");
  });
  it("interpola entre as âncoras e segura nas pontas", () => {
    // meio do caminho entre 6,5 (#73a7d4) e 7,5 (#2f72b4)
    expect(corNota(7)).toBe("rgb(81 141 196)");
    expect(corNota(-3)).toBe(corNota(0));
    expect(corNota(12)).toBe(corNota(10));
  });
  it("sem nota fica cinza de sem dado", () => {
    expect(corNota(null)).toBe("var(--color-sem-dado)");
  });
});

describe("categoria por extenso", () => {
  it("usa as faixas do artigo", () => {
    expect(naCategoria(2.97)).toBe("na esquerda");
    expect(naCategoria(5)).toBe("no centro");
    expect(naCategoria(6.66)).toBe("na centro-direita");
    expect(naCategoria(7.78)).toBe("na direita");
    expect(naCategoria(null)).toBe("sem nota");
  });
});

describe("mudança entre as duas eleições do mesmo cargo", () => {
  const m = cidade("PI", [6, 6.5, 5.8, 7]);
  it("vereador compara 2020 com 2024; deputado federal, 2018 com 2022", () => {
    expect(mudanca(m, "mun")).toBeCloseTo(0.5);
    expect(mudanca(m, "ger")).toBeCloseTo(-0.2);
  });
  it("sem uma das duas eleições não há mudança", () => {
    expect(mudanca(cidade("DF", [6, null, 6.2, null]), "mun")).toBeNull();
  });
  it("a eleição na tela vem do cargo e de qual das duas está marcada", () => {
    expect(anoDe({ par: "mun", quando: 0 })).toBe(1);
    expect(anoDe({ par: "mun", quando: 1 })).toBe(3);
    expect(anoDe({ par: "ger", quando: 1 })).toBe(2);
  });
  it("descreve o lado, e quase nada abaixo de 0,05", () => {
    expect(paraOnde(0.3)).toBe("foi para a direita");
    expect(paraOnde(-0.3)).toBe("foi para a esquerda");
    expect(paraOnde(0.02)).toBe("quase não saiu do lugar");
    expect(corDif(0.02)).toBe("#e8e5de");
    expect(corDif(null)).toBe("var(--color-sem-dado)");
  });
});

describe("resumo das cidades", () => {
  const M = [
    cidade("PI", [null, 6, null, 6.5]),
    cidade("PI", [null, 6, null, 5.5]),
    cidade("PI", [null, 6, null, 6.1]),
    cidade("MA", [null, 6, null, 7]),
    cidade("DF", [6, null, 6, null]),
  ];
  it("só entram as cidades do estado com as duas eleições", () => {
    expect(comMudanca(M, "PI", "mun")).toHaveLength(3);
    expect(comMudanca(M, null, "mun")).toHaveLength(4);
    expect(comMudanca(M, null, "ger")).toHaveLength(1);
  });
  it("conta quem foi para a direita e quem andou mais de 0,25", () => {
    expect(resumo(comMudanca(M, "PI", "mun"), "mun")).toEqual({ n: 3, direita: 2, forteDireita: 1, forteEsquerda: 1 });
  });
});
