import { describe, expect, it } from "vitest";
import { type Candidatura, FAIXA, mandatos } from "../../../src/paineis/q10/logica";

const c = (ano: number, cargo: number, res = 0): Candidatura => ({
  ano,
  cargo,
  local: "Goiás",
  uf: "GO",
  partido: "X",
  res,
  reeleito: false,
  tentou: false,
});

describe("mandatos", () => {
  it("vitórias seguidas no mesmo cargo viram uma barra só", () => {
    expect(mandatos([c(2004, 13), c(2008, 13), c(2012, 13)])).toEqual([{ faixa: FAIXA[13], inicio: 2004, fim: 2016 }]);
  });

  it("senador vale 8 anos, mas a barra para na vitória seguinte", () => {
    // caso Caiado: senador em 2014, governador em 2018 e 2022
    expect(mandatos([c(2014, 5), c(2018, 3), c(2022, 3)])).toEqual([
      { faixa: FAIXA[5], inicio: 2014, fim: 2018 },
      { faixa: FAIXA[3], inicio: 2018, fim: 2026 },
    ]);
    expect(mandatos([c(2010, 5)])).toEqual([{ faixa: FAIXA[5], inicio: 2010, fim: 2018 }]);
  });

  it("derrota não gera barra nem encurta o mandato em curso", () => {
    expect(mandatos([c(2016, 13), c(2018, 7, 1), c(2020, 13, 1)])).toEqual([
      { faixa: FAIXA[13], inicio: 2016, fim: 2020 },
    ]);
  });

  it("intervalo sem mandato separa as barras", () => {
    expect(mandatos([c(2004, 11), c(2012, 11)])).toEqual([
      { faixa: FAIXA[11], inicio: 2004, fim: 2008 },
      { faixa: FAIXA[11], inicio: 2012, fim: 2016 },
    ]);
  });

  it("o eixo termina em 2030, o fim do mandato de quem venceu em 2026", () => {
    expect(mandatos([c(2022, 5)])).toEqual([{ faixa: FAIXA[5], inicio: 2022, fim: 2030 }]);
    expect(mandatos([c(2026, 7)])).toEqual([{ faixa: FAIXA[7], inicio: 2026, fim: 2030 }]);
  });
});
