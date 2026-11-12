import { describe, expect, it } from "vitest";
import { candidato, corPartido, patrimonio, placar, turnoFinal } from "../../../src/paineis/presidentes/calculo";
import type { Eleicao, LinhaCandidato } from "../../../src/paineis/presidentes/tipos";

const linhas: LinhaCandidato[] = [
  [
    1,
    13,
    "LULA",
    "LUIZ INÁCIO LULA DA SILVA",
    "PT",
    1,
    1,
    [
      ["Apartamento", 300],
      ["Veículo", 100],
    ],
  ],
  [2, 22, "JAIR BOLSONARO", "JAIR MESSIAS BOLSONARO", "PL", 0, 1, null],
  [3, 15, "SIMONE TEBET", "SIMONE NASSAR TEBET", "MDB", 0, 0, null],
];
const cands = linhas.map(candidato);

describe("candidatos", () => {
  it("o nome vem em maiúscula inicial e a cor é a do partido", () => {
    expect(cands[0]).toMatchObject({
      i: 0,
      nome: "Lula",
      partido: "PT",
      eleito: true,
      foto: true,
      cor: corPartido("PT"),
    });
    expect(corPartido("PARTIDO NOVO DEMAIS")).toBe("#9aa3ad");
  });
  it("patrimônio soma os bens; sem declaração fica vazio", () => {
    expect(patrimonio(cands[0])).toBe(400);
    expect(patrimonio(cands[1])).toBeNull();
  });
});

describe("placar", () => {
  it("ordena pelos votos, tira quem não teve voto e calcula a parte dos válidos", () => {
    const p = placar(cands, [60, 30, 0]);
    expect(p.map(l => l.c.nome)).toEqual(["Lula", "Jair Bolsonaro"]);
    expect(p[0].pct).toBeCloseTo(66.67, 1);
  });
  it("sem voto nenhum não divide por zero", () => {
    expect(placar(cands, [0, 0, 0])).toEqual([]);
  });
});

describe("turno que decide", () => {
  const turno = (t: number) => ({ turno: t, total: [], uf: [], exterior: null, venc: [], pct: [] });
  it("é o último da eleição", () => {
    expect(turnoFinal({ ano: 2022, cands: linhas, turnos: [turno(1), turno(2)] } as Eleicao)).toBe(2);
    expect(turnoFinal({ ano: 1998, cands: linhas, turnos: [turno(1)] } as Eleicao)).toBe(1);
  });
});
