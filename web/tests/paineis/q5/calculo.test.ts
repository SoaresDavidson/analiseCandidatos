import { describe, expect, it } from "vitest";
import {
  anosDoCargo,
  chaveSoma,
  filtrarPartidos,
  porPartido,
  somar,
  somasPorFiltro,
  trocas,
} from "../../../src/paineis/q5/calculo";
import type { DadosQ5 } from "../../../src/paineis/q5/tipos";

const D: DadosQ5 = {
  ufs: ["AM", "RS"],
  cargos: [],
  partidos: [
    // ano, uf, cargo, partido, eleitos, pela legenda, nominais, legenda
    [2024, 0, 0, "MDB", 10, 1, 9_000, 1_000],
    [2024, 1, 0, "MDB", 20, 2, 18_000, 1_000],
    [2024, 1, 0, "PT", 15, 3, 10_000, 2_000],
    [2024, 1, 0, "NOVO", 5, 0, 1_000, 0],
    [2022, 1, 2, "PT", 8, 1, 50_000, 5_000],
  ],
  afetados: [
    [2024, 1, 0, "PORTO ALEGRE", "FULANA", "PT", "PT", 1, 3_000, 1],
    [2024, 1, 0, "PORTO ALEGRE", "BELTRANO", "PL", "PL", 1, 3_200, 0],
    [2024, 0, 0, "MANAUS", "CICLANO", "MDB", "MDB", 1, 2_000, 1],
    [2022, 1, 2, "RS", "DEPUTADA", "PT", "PT / PV / PC do B", 3, 70_000, 1],
  ],
};

describe("somar", () => {
  it("soma os partidos e calcula as duas porcentagens", () => {
    const s = somar(filtrarPartidos(D, 0, 2024, "TODAS"));
    expect(s.eleitos).toBe(50);
    expect(s.eleitosLegenda).toBe(6);
    expect(s.pcEleitos).toBe(12);
    expect(s.pcVotos).toBeCloseTo((100 * 4_000) / 42_000);
  });

  it("filtra o estado e o cargo", () => {
    expect(somar(filtrarPartidos(D, 0, 2024, "AM")).eleitos).toBe(10);
    expect(somar(filtrarPartidos(D, 2, 2022, "TODAS")).eleitosLegenda).toBe(1);
  });

  it("UF desconhecida dá lista vazia, não todas", () => {
    expect(filtrarPartidos(D, 0, 2024, "XX")).toEqual([]);
    expect(trocas(D, 0, 2024, "XX")).toEqual([]);
  });

  it("somasPorFiltro bate com somar(filtrarPartidos)", () => {
    const m = somasPorFiltro(D);
    expect(m.get(chaveSoma(0, 2024, "RS"))).toEqual(somar(filtrarPartidos(D, 0, 2024, "RS")));
    expect(m.get(chaveSoma(0, 2024, "TODAS"))).toEqual(somar(filtrarPartidos(D, 0, 2024, "TODAS")));
  });
});

describe("porPartido", () => {
  it("junta os estados, tira quem não elegeu pela legenda e ordena", () =>
    expect(porPartido(filtrarPartidos(D, 0, 2024, "TODAS"))).toEqual([
      { partido: "MDB", legenda: 3, eleitos: 30 },
      { partido: "PT", legenda: 3, eleitos: 15 },
    ]));
});

describe("trocas", () => {
  it("agrupa quem entrou e quem ficou de fora por UE", () => {
    const t = trocas(D, 0, 2024, "TODAS");
    expect(t.map(x => x.ue)).toEqual(["MANAUS", "PORTO ALEGRE"]);
    expect(t[1].entraram.map(a => a[4])).toEqual(["FULANA"]);
    expect(t[1].ficaramFora.map(a => a[4])).toEqual(["BELTRANO"]);
    expect(t[0].ficaramFora).toEqual([]);
  });
});

it("vereador nas municipais, deputados nas gerais", () => {
  expect(anosDoCargo(0)).toEqual([2020, 2024]);
  expect(anosDoCargo(1)).toEqual([2018, 2022]);
});
