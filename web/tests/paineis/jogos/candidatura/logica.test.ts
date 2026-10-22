import { describe, expect, it } from "vitest";
import {
  type Cidade,
  calcularNota,
  contarPorUf,
  favoraveis,
  LIMITE,
  nivelDe,
  PROPOSTAS,
  partidosProximos,
  prefeitoParecido,
  ranquear,
} from "../../../../src/paineis/jogos/candidatura/logica";

const dirs = PROPOSTAS.map(p => p.direcao);
const alinhadas = (v: number) => dirs.map(d => d * v);

describe("calcularNota", () => {
  it("neutro dá 5", () =>
    expect(
      calcularNota(
        dirs,
        dirs.map(() => 0),
      ),
    ).toBe(5));
  it("extremos dão 0 e 10", () => {
    expect(calcularNota(dirs, alinhadas(-2))).toBe(0);
    expect(calcularNota(dirs, alinhadas(2))).toBe(10);
  });
  it("é simétrica em torno de 5", () => {
    const r = dirs.map((_, i) => [-2, -1, 0, 1, 2][i % 5]);
    expect(
      calcularNota(dirs, r) +
        calcularNota(
          dirs,
          r.map(x => -x),
        ),
    ).toBeCloseTo(10);
  });
  it("limita a [0, 10] com respostas fora da escala", () => {
    expect(calcularNota([1, 1], [9, 9])).toBe(10);
    expect(calcularNota([1, 1], [-9, -9])).toBe(0);
  });
});

const cidades: Cidade[] = [
  { cod: 1, nome: "A", uf: "GO", cap: false, nota: 6.0 },
  { cod: 2, nome: "B", uf: "GO", cap: true, nota: 6.3 },
  { cod: 3, nome: "C", uf: "MA", cap: false, nota: 6.9 },
  { cod: 4, nome: "D", uf: "MA", cap: false, nota: 6.1 },
  { cod: 5, nome: "E", uf: "RS", cap: false, nota: 4.0 },
];

describe("ranquear e favoraveis", () => {
  const r = ranquear(cidades, 6.1);
  it("ordena pela distância", () => expect(r.map(c => c.nome)).toEqual(["D", "A", "B", "C", "E"]));
  it("filtra pelo limite (inclusive)", () => {
    expect(favoraveis(r).map(c => c.nome)).toEqual(["D", "A", "B"]);
    expect(nivelDe(LIMITE)).toBe("forte");
    expect(nivelDe(LIMITE * 2)).toBe("perto");
    expect(nivelDe(LIMITE * 2 + 0.01)).toBe("longe");
  });
  it("conta por estado", () =>
    expect(contarPorUf(favoraveis(r))).toEqual([
      ["GO", 2],
      ["MA", 1],
    ]));
  it("sem cidade dentro do limite, a lista é vazia", () => expect(favoraveis(ranquear(cidades, 1))).toEqual([]));
});

const esp = {
  "2024|PT": [2.7, "x", ""],
  "2024|PL": [8.8, "x", ""],
  "2024|MDB": [6.5, "x", ""],
  "2022|PT": [2.6, "x", ""],
} as const;

describe("partidosProximos", () => {
  it("usa só o ano pedido e ordena por distância", () => {
    expect(partidosProximos(esp, 2024, 3, 3).map(p => p.partido)).toEqual(["PT", "MDB", "PL"]);
    expect(partidosProximos(esp, 2024, 9, 1)[0].partido).toBe("PL");
  });
});

describe("prefeitoParecido", () => {
  const e = (cod: number, sq: number, nota: number, cargo = 11) => ({
    ano: 2024,
    cargo,
    cod,
    sq,
    nome: `p${sq}`,
    partido: "X",
    espectro: [nota] as const,
  });
  it("escolhe a nota mais próxima dentro das cidades favoráveis", () => {
    const r = prefeitoParecido([e(1, 1, 8), e(2, 2, 6.4), e(3, 3, 6.1), e(2, 4, 6.2, 13)], new Set([1, 2]), 6.1);
    expect(r?.eleito.sq).toBe(2);
  });
  it("sem candidato elegível devolve null", () => expect(prefeitoParecido([e(9, 1, 6)], new Set([1]), 6)).toBeNull());
});
