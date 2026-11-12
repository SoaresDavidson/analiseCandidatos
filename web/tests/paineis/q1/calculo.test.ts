import { describe, expect, it } from "vitest";
import { mediana } from "../../../src/lib/estatistica";
import {
  anoAoTrocarCargo,
  chaveSoma,
  classes,
  em2024,
  filtrar,
  maisCaras,
  RAMPA_CUSTO,
  somar,
  somasPorFiltro,
} from "../../../src/paineis/q1/calculo";
import type { DadosQ1 } from "../../../src/paineis/q1/tipos";

const D: DadosQ1 = {
  ufs: ["AM", "GO"],
  cargos: [],
  ipca: { "2020": 1.3, "2024": 1 },
  ues: [
    // ano, cargo, uf, cod, nome, vagas, cand, eleitos, despesa, despesa eleitos, público
    [2024, 0, 0, 1, "MANAUS", 40, 900, 40, 40_000_000, 8_000_000, 30_000_000],
    [2024, 0, 0, 2, "TEFE", 10, 100, 10, 200_000, 50_000, 100_000],
    [2024, 0, 1, 3, "GOIANIA", 30, 600, 30, 24_000_000, 6_000_000, 12_000_000],
    [2020, 0, 0, 1, "MANAUS", 40, 800, 0, 10_000_000, 0, 5_000_000],
  ],
};

describe("somar", () => {
  it("custo é o gasto total ÷ todas as vagas, não a média dos custos", () => {
    const s = somar(filtrar(D, 0, 2024, "TODAS"));
    expect(s.vagas).toBe(80);
    expect(s.custo).toBeCloseTo(64_200_000 / 80);
    expect(s.custoEleito).toBeCloseTo(14_050_000 / 80);
    expect(s.pcPublico).toBeCloseTo((100 * 42_100_000) / 64_200_000);
    // mediana dos três custos: 20 mil, 800 mil e 1 milhão
    expect(s.mediana).toBe(800_000);
  });

  it("filtra o estado", () => {
    const s = somar(filtrar(D, 0, 2024, "AM"));
    expect(s.ues).toBe(2);
    expect(s.custo).toBe(40_200_000 / 50);
  });

  it("sem eleito o gasto por eleito fica vazio", () => {
    expect(somar(filtrar(D, 0, 2020, "AM")).custoEleito).toBeNull();
  });

  it("a parte dos eleitos ignora a despesa de UE sem eleito", () => {
    // AM 2020 tem R$ 10 mi de despesa e nenhum eleito: não entra no denominador
    const ues = filtrar(D, 0, 2020, "TODAS");
    expect(somar(ues).pcEleitos).toBeNull();
    const mistas = [...filtrar(D, 0, 2024, "AM"), ...ues];
    expect(somar(mistas).pcEleitos).toBeCloseTo((100 * 8_050_000) / 40_200_000);
  });

  it("UF desconhecida dá lista vazia, não todas", () => {
    expect(filtrar(D, 0, 2024, "XX")).toEqual([]);
    expect(filtrar(D, 0, 2024, "TODAS")).toHaveLength(3);
  });

  it("somasPorFiltro bate com somar(filtrar)", () => {
    const m = somasPorFiltro(D);
    expect(m.get(chaveSoma(0, 2024, "AM"))).toEqual(somar(filtrar(D, 0, 2024, "AM")));
    expect(m.get(chaveSoma(0, 2024, "TODAS"))).toEqual(somar(filtrar(D, 0, 2024, "TODAS")));
    expect(m.get(chaveSoma(0, 2024, "XX"))).toBeUndefined();
  });

  it("sem UEs não divide por zero", () => {
    const s = somar([]);
    expect(s.custo).toBeNull();
    expect(s.pcPublico).toBeNull();
    expect(s.mediana).toBeNull();
  });
});

describe("auxiliares", () => {
  it("mediana com quantidade par", () => expect(mediana([4, 1, 3, 2])).toBe(2.5));
  it("corrige para reais de 2024", () => expect(em2024(D, 2020, 100)).toBeCloseTo(130));
  it("sem IPCA do ano não inventa fator 1", () => {
    expect(em2024(D, 2018, 100)).toBeNull();
    expect(em2024(D, 2020, null)).toBeNull();
  });
  it("ordena as cadeiras mais caras", () =>
    expect(maisCaras(filtrar(D, 0, 2024, "TODAS"), 2).map(u => u[4])).toEqual(["MANAUS", "GOIANIA"]));
  it("ao trocar de cargo mantém a posição da eleição", () => {
    expect(anoAoTrocarCargo(0, 2020, 3)).toBe(2018);
    expect(anoAoTrocarCargo(3, 2022, 0)).toBe(2024);
  });
});

describe("classes do mapa", () => {
  it("4 cortes dividem os estados em 5 grupos do mesmo tamanho", () => {
    const cortes = classes([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(cortes).toEqual([30, 50, 70, 90]);
    const classe = (v: number) => cortes.filter(c => v > c).length;
    expect([10, 30, 40, 100].map(classe)).toEqual([0, 0, 1, 4]);
  });
  it("sem valores, sem cortes; a rampa tem uma cor por grupo", () => {
    expect(classes([])).toEqual([]);
    expect(RAMPA_CUSTO).toHaveLength(5);
  });
});
