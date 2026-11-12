import { describe, expect, it } from "vitest";
import {
  anoAoTrocarCargo,
  contarMaisRicosGanham,
  faixaValor,
  intervalo,
  larguraEm,
  linhasDoNome,
  pQui2,
  pTexto,
  somarFaixas,
  taxas,
  teste,
  umEm,
} from "../../../src/paineis/q2/calculo";
import type { DadosQ2, Faixa } from "../../../src/paineis/q2/tipos";

const D: DadosQ2 = {
  ufs: ["AM", "GO"],
  cargos: [],
  grupos: [],
  qui: {},
  destaques: {},
  composicao: {},
  suspeitos: [0, 0],
  limites: {},
  faixas: [
    [2024, 0, 0, 0, 100, 5],
    [2024, 1, 0, 0, 50, 1],
    [2024, 0, 0, 1, 80, 4],
    [2024, 0, 1, 0, 9, 9], // outro cargo
    [2020, 0, 0, 0, 7, 7], // outro ano
  ],
};

describe("somarFaixas", () => {
  it("soma os 2 estados com TODAS", () => {
    const s = somarFaixas(D, 0, 2024, "TODAS");
    expect(s[0]).toEqual([150, 6]);
    expect(s[1]).toEqual([80, 4]);
  });
  it("filtra por estado", () => expect(somarFaixas(D, 0, 2024, "GO")[0]).toEqual([50, 1]));
  it("sem linhas, tudo zero", () => expect(somarFaixas(D, 5, 2018, "TODAS")).toEqual(Array(6).fill([0, 0])));
});

describe("taxas", () => {
  it("null onde não há candidatos", () =>
    expect(
      taxas([
        [200, 50],
        [0, 0],
      ]),
    ).toEqual([25, null]));
});

describe("qui-quadrado", () => {
  it("p-valores conhecidos", () => {
    expect(pQui2(3.841459, 1)).toBeCloseTo(0.05, 4);
    expect(pQui2(11.0705, 5)).toBeCloseTo(0.05, 4);
    expect(pQui2(0, 5)).toBe(1);
  });
  it("tabela 2×k sem associação dá p alto e é válida", () => {
    const s: Faixa[] = Array.from({ length: 6 }, () => [100, 20] as Faixa);
    const t = teste(s);
    expect(t.chi).toBeCloseTo(0, 10);
    expect(t.p).toBeCloseTo(1, 6);
    expect(t.valido).toBe(true);
  });
  it("associação forte dá p minúsculo", () => {
    const s: Faixa[] = [
      [100, 2],
      [100, 10],
      [100, 20],
      [100, 30],
      [100, 45],
      [100, 60],
    ];
    const t = teste(s);
    expect(t.n).toBe(600);
    expect(t.e).toBe(167);
    expect(t.p).toBeLessThan(1e-9);
  });
  it("grupos vazios ou poucos casos invalidam o teste", () => {
    expect(teste(Array.from({ length: 6 }, () => [0, 0] as Faixa)).valido).toBe(false);
    expect(teste(Array.from({ length: 6 }, () => [3, 1] as Faixa)).valido).toBe(false);
  });
});

describe("textos", () => {
  it("pTexto", () => {
    expect(pTexto(1e-12)).toBe("menos de 1 em 1 bilhão");
    expect(pTexto(1e-7)).toBe("menos de 1 em 1 milhão");
    expect(pTexto(1e-4)).toBe("menos de 1 em mil");
    expect(pTexto(0.5)).toBe("50,0%");
  });
  it("umEm", () => {
    expect(umEm(0)).toBe("nenhum");
    expect(umEm(25)).toBe("1 em cada 4");
  });
  it("intervalo e faixaValor", () => {
    expect(intervalo(169000, 386000)).toBe("R$ 169–386 mil");
    expect(intervalo(734000, 1600000)).toBe("R$ 734 mil–1,6 mi");
    const lim: [number, number, number][] = [
      [0, 25000, 1],
      [25000, 80000, 1],
      [80000, 1e5, 1],
      [1e5, 2e5, 1],
      [385000, 9e7, 1],
    ];
    expect(faixaValor(lim, 1)).toBe("até R$ 25 mil");
    expect(faixaValor(lim, 5)).toBe("acima de R$ 385 mil");
    expect(faixaValor(undefined, 2)).toBe("");
  });
});

describe("filtros", () => {
  it("troca de cargo mantém a posição do ano", () => {
    expect(anoAoTrocarCargo(0, 2020, 2)).toBe(2018);
    expect(anoAoTrocarCargo(2, 2022, 1)).toBe(2024);
  });
  it("sem dados nenhuma combinação é contada", () => {
    expect(contarMaisRicosGanham({ ...D, faixas: [] }, "TODAS")).toEqual({ favoraveis: 0, total: 0 });
  });
});

describe("o nome em destaque", () => {
  it("mede a largura pelas letras, sem contar os acentos", () => {
    expect(larguraEm("I")).toBeLessThan(larguraEm("M"));
    expect(larguraEm("MARANHÃO")).toBe(larguraEm("MARANHAO"));
    expect(larguraEm("R$ 1.000")).toBeCloseTo(0.68 + 0.59 + 0.26 + 0.59 + 0.29 + 3 * 0.59, 5);
  });

  it("põe uma palavra por linha quando o nome é curto", () => {
    expect(linhasDoNome("JUAREZ LEINHO")).toEqual(["JUAREZ", "LEINHO"]);
    expect(linhasDoNome("  ZECA   VIANA ")).toEqual(["ZECA", "VIANA"]);
    expect(linhasDoNome("TIRIRICA")).toEqual(["TIRIRICA"]);
  });

  it("nunca passa de 3 linhas nem quebra uma palavra", () => {
    const nome = "DR SANDOVAL CHEIRO DO POVO DA SILVA";
    const linhas = linhasDoNome(nome);
    expect(linhas.length).toBeLessThanOrEqual(3);
    expect(linhas.join(" ")).toBe(nome);
  });

  it("não deixa preposição no fim da linha", () => {
    expect(linhasDoNome("FRANCIS MARIS DA COMETA")).toEqual(["FRANCIS", "MARIS", "DA COMETA"]);
    expect(linhasDoNome("PAULINHO DE CARACARAÍ")).toEqual(["PAULINHO", "DE CARACARAÍ"]);
  });

  it("devolve uma linha vazia para um nome vazio", () => {
    expect(linhasDoNome("")).toEqual([""]);
  });
});
