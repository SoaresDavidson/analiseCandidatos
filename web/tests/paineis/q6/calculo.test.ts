import { describe, expect, it } from "vitest";
import {
  corIdade,
  doFiltro,
  forcaCorrelacao,
  grupos,
  linhasEleitos,
  MAPA_COR,
  media,
  pearson,
  pesada,
  pontosDispersao,
  reeleicao,
  troca,
  votoGrupo,
} from "../../../src/paineis/q6/calculo";
import type { Municipio, Voto } from "../../../src/paineis/q6/tipos";

const v = (aptos: number, aj: number | null, votos: number, vj: number | null, vi: number | null = 0): Voto => [
  aptos,
  aj,
  10,
  votos,
  vj,
  vi,
  5,
];
const mun = (p: Partial<Municipio>) =>
  ({
    uf: "MA",
    terco: 1,
    tercoUf: 1,
    troca: [null, null],
    conc: [null, null],
    reel: [null, null],
    voto: [],
    ...p,
  }) as Municipio;

describe("médias e correlação", () => {
  it("media ignora nulos", () => {
    expect(media([2, null, 4])).toBe(3);
    expect(media([null])).toBeNull();
  });
  it("pesada ignora nulo e peso zero", () => {
    expect(pesada([10, 20, null, 99], [1, 3, 5, 0])).toBe(17.5);
    expect(pesada([null], [1])).toBeNull();
  });
  it("pearson em conjunto conhecido", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1);
    expect(pearson([1, 2, 3, 4, 5], [2, 1, 4, 3, 5])).toBeCloseTo(0.8);
    expect(pearson([1, 2], [1, 2])).toBeNull();
  });
  it("forcaCorrelacao", () => {
    expect(forcaCorrelacao(0.05)).toBe("nada");
    expect(forcaCorrelacao(-0.2)).toBe("pouco");
    expect(forcaCorrelacao(0.4)).toBe("moderadamente");
    expect(forcaCorrelacao(0.9)).toBe("bastante");
    expect(forcaCorrelacao(null)).toBe("");
  });
});

describe("grupos e alternância", () => {
  const ms = [
    mun({ cod: 1, terco: 1, tercoUf: 3, troca: [1, 1] }),
    mun({ cod: 2, terco: 1, tercoUf: 1, troca: [0, 1] }),
    mun({ cod: 3, terco: 3, tercoUf: 2, troca: [1, 0] }),
    mun({ cod: 4, terco: null, tercoUf: null, troca: [null, null], uf: "GO" }),
  ];
  it("grupos por terço, conforme o corte", () => {
    expect(grupos(ms, "todas").map(g => g.map(m => m.cod))).toEqual([[1, 2], [], [3]]);
    expect(grupos(ms, "uf").map(g => g.map(m => m.cod))).toEqual([[2], [3], [1]]);
  });
  it("filtra por estado", () => {
    expect(doFiltro(ms, "TODAS")).toHaveLength(4);
    expect(doFiltro(ms, "GO").map(m => m.cod)).toEqual([4]);
  });
  it("conta trocas por eleição, sem contar sem dado", () => {
    expect(troca(ms, 2020)).toEqual({ n: 3, t: 2, pc: (100 * 2) / 3 });
    expect(troca(ms, 2024)).toEqual({ n: 3, t: 2, pc: (100 * 2) / 3 });
    expect(troca([], 2024)).toEqual({ n: 0, t: 0, pc: null });
  });
  it("reeleição: tentaram e venceram", () => {
    const rs = [
      mun({ conc: [1, 1], reel: [0, 1] }),
      mun({ conc: [1, 1], reel: [1, 0] }),
      mun({ conc: [1, 0], reel: [null, null] }),
      mun({ conc: [0, 1], reel: [0, 1] }),
    ];
    const r = reeleicao(rs, 2024);
    expect(r.tentou).toBe(75);
    expect(r.venceu).toBeCloseTo(200 / 3, 5);
  });
});

describe("voto por faixa", () => {
  const ms = [
    mun({ voto: [null, v(100, 30, 80, 10, 4)] }),
    mun({ voto: [null, v(300, 10, 120, null, null)] }),
    mun({ voto: [null, null] }),
  ];
  it("pesa pelos aptos e pelos votos; sem candidato conta 0% nos votos", () => {
    const g = votoGrupo(ms, 2024);
    expect(g.aj).toBeCloseTo((30 * 100 + 10 * 300) / 400);
    expect(g.vj).toBeCloseTo((10 * 80 + 0 * 120) / 200);
    expect(g.vi).toBeCloseTo((4 * 80) / 200);
  });
  it("dispersão: pontos completos, cidades sem candidato e correlação", () => {
    const d = [
      mun({ voto: [null, v(1, 10, 1, 20)] }),
      mun({ voto: [null, v(1, 20, 1, 40)] }),
      mun({ voto: [null, v(1, 30, 1, 60)] }),
      mun({ voto: [null, v(1, 5, 1, null)] }),
    ];
    const r = pontosDispersao(d, 2024, "jovem");
    expect(r.pontos).toHaveLength(3);
    expect(r.semCand).toBe(1);
    expect(r.r).toBeCloseTo(1);
  });
});

describe("escala de cor do mapa", () => {
  it("extremos e cortes", () => {
    expect(corIdade(20)).toBe(MAPA_COR[0]);
    expect(corIdade(31.9)).toBe(MAPA_COR[0]);
    expect(corIdade(32)).toBe(MAPA_COR[1]);
    expect(corIdade(40.9)).toBe(MAPA_COR[3]);
    expect(corIdade(41)).toBe(MAPA_COR[4]);
    expect(corIdade(60)).toBe(MAPA_COR[4]);
    expect(corIdade(null)).toBe("var(--color-sem-dado)");
  });
});

describe("idade dos eleitos", () => {
  // [ano, uf, cargo, cand, eleitos, idCand, idEleitos, %candJ, %eleJ, %cand60, %ele60, chanceJ, chanceMeio, chance60]
  const linhas = [
    [2024, 0, 0, 1000, 100, 44, 46, 10, 5, 10, 8, 10, 20, 30],
    [2024, 1, 0, 1000, 300, 42, 40, 20, 15, 0, 0, 30, 30, 0],
    [2022, 1, 3, 10, 2, 50, 52, 0, 0, 10, 50, 0, 20, 100],
  ];
  it("agrega por cargo e ano, no estado escolhido", () => {
    const l = linhasEleitos(linhas, 1);
    expect(l.map(x => [x.cargo, x.ano])).toEqual([
      [0, 2024],
      [3, 2022],
    ]);
    expect(l[0].idadeEleitos).toBe(40);
    expect(l[0].chanceJovem).toBeCloseTo(30);
  });
  it("soma os estados com -1 e pesa as idades", () => {
    const [l] = linhasEleitos(linhas, -1);
    expect(l.idadeCand).toBe(43);
    expect(l.idadeEleitos).toBeCloseTo((46 * 100 + 40 * 300) / 400);
    // jovens: candidatos 100 e 200; eleitos 10 e 60
    expect(l.chanceJovem).toBeCloseTo(((100 * 0.1 + 200 * 0.3) / 300) * 100);
  });
});
