import { describe, expect, it } from "vitest";
import {
  afastar,
  corIdade,
  doFiltro,
  entre,
  grupos,
  idadesDe,
  linhasEleitos,
  MAPA_COR,
  media,
  pesada,
  troca,
  votoGrupo,
} from "../../../src/paineis/q6/calculo";
import type { Municipio, Voto } from "../../../src/paineis/q6/tipos";

const v = (
  aptos: number,
  aj: number | null,
  votos: number,
  vj: number | null,
  vi: number | null = 0,
  idade: number | null = 45,
): Voto => [aptos, aj, 10, votos, vj, vi, 5, idade];
const mun = (p: Partial<Municipio>) =>
  ({
    uf: "MA",
    terco: 1,
    tercoUf: 1,
    pop: 1000,
    aptos: 800,
    troca: null,
    conc: null,
    reel: null,
    voto: null,
    ...p,
  }) as Municipio;

describe("médias", () => {
  it("media ignora nulos", () => {
    expect(media([1, null, 3])).toBe(2);
    expect(media([null, undefined])).toBeNull();
  });
  it("pesada ignora nulo e peso zero", () => {
    expect(pesada([10, 20, null, 99], [1, 3, 5, 0])).toBe(17.5);
    expect(pesada([null], [1])).toBeNull();
  });
});

describe("grupos e alternância", () => {
  const ms = [
    mun({ uf: "MA", terco: 1, tercoUf: 3, troca: 1 }),
    mun({ uf: "MA", terco: 2, tercoUf: 1, troca: 0 }),
    mun({ uf: "RS", terco: 3, tercoUf: 1, troca: 1 }),
    mun({ uf: "RS", terco: null, tercoUf: null, troca: null }),
  ];
  it("grupos por terço: os do país ou os de dentro do estado", () => {
    expect(grupos(ms, false).map(g => g.length)).toEqual([1, 1, 1]);
    expect(grupos(ms, true).map(g => g.length)).toEqual([2, 0, 1]);
  });
  it("filtra por estado; sem estado, é o país", () => {
    expect(doFiltro(ms, "RS")).toHaveLength(2);
    expect(doFiltro(ms, null)).toHaveLength(4);
  });
  it("conta as trocas de partido, sem contar cidade sem dado", () => {
    expect(troca(ms)).toEqual({ n: 3, t: 2, pc: (100 * 2) / 3 });
    expect(troca([]).pc).toBeNull();
  });
});

describe("voto por faixa e idades", () => {
  const ms = [
    mun({ pop: 100, idade: 30, aptos: 100, idEl: 40, voto: v(100, 30, 50, 10, 0, 44) }),
    mun({ pop: 300, idade: 38, aptos: 300, idEl: 48, voto: v(300, 10, 150, null, 20, 48) }),
    mun({ pop: 50, idade: 35, aptos: null, idEl: null, voto: null }),
  ];
  it("pesa pelos aptos e pelos votos; sem candidato da faixa conta 0% nos votos", () => {
    const g = votoGrupo(ms);
    expect(g.aj).toBe(15);
    expect(g.vj).toBe(2.5);
    expect(g.vi).toBe(15);
  });
  it("idades do conjunto: pela população, pelos eleitores e pelos votos", () => {
    const id = idadesDe(ms);
    expect(id.mora).toBeCloseTo((30 * 100 + 38 * 300 + 35 * 50) / 450);
    expect(id.vota).toBe(46);
    expect(id.votado).toBe(47);
  });
  it("uma cidade sem votação fica sem a idade do voto", () => {
    expect(idadesDe([ms[2]])).toEqual({ mora: 35, vota: null, votado: null });
  });
});

describe("escala de cor do mapa", () => {
  it("extremos e cortes", () => {
    expect(corIdade(20)).toBe(MAPA_COR[0]);
    expect(corIdade(32.9)).toBe(MAPA_COR[0]);
    expect(corIdade(33)).toBe(MAPA_COR[1]);
    expect(corIdade(38.9)).toBe(MAPA_COR[3]);
    expect(corIdade(39)).toBe(MAPA_COR[4]);
    expect(corIdade(60)).toBe(MAPA_COR[4]);
    expect(corIdade(null)).toBe("var(--color-sem-dado)");
  });
});

describe("rótulos do gráfico", () => {
  it("afasta os que ficariam um em cima do outro e mantém a ordem de entrada", () => {
    expect(afastar([100, 104, 200], 16, 0, 400)).toEqual([100, 116, 200]);
    expect(afastar([104, 100], 16, 0, 400)).toEqual([116, 100]);
  });
  it("não passa do fim: empurra o grupo para cima", () => {
    expect(afastar([390, 395, 398], 16, 0, 400)).toEqual([368, 384, 400]);
  });
});

describe("rosto", () => {
  it("cada traço entra aos poucos entre duas idades", () => {
    expect(entre(30, 36, 50)).toBe(0);
    expect(entre(43, 36, 50)).toBe(0.5);
    expect(entre(70, 36, 50)).toBe(1);
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
