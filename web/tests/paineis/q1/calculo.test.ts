import { describe, expect, it } from "vitest";
import { anoAoTrocarCargo, em2024, filtrar, maisCaras, mediana, somar } from "../../../src/paineis/q1/calculo";
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
  it("ordena as cadeiras mais caras", () =>
    expect(maisCaras(filtrar(D, 0, 2024, "TODAS"), 2).map(u => u[4])).toEqual(["MANAUS", "GOIANIA"]));
  it("ao trocar de cargo mantém a posição da eleição", () => {
    expect(anoAoTrocarCargo(0, 2020, 3)).toBe(2018);
    expect(anoAoTrocarCargo(3, 2022, 0)).toBe(2024);
  });
});
