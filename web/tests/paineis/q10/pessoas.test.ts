import { describe, expect, it } from "vitest";
import { montarPessoas } from "../../../src/paineis/q10/logica";
import type { PessoasQ10 } from "../../../src/paineis/q10/tipos";

const P: PessoasQ10 = {
  partidos: ["PT", "MDB"],
  ues: ["TERESINA|PI", "PI|PI"],
  pessoas: [
    // vereadora em 2020 (eleita) e deputada estadual em 2022 (eleita), com a foto de 2022
    ["MARIA", "MARIA DA SILVA", [20, 13, 0, 0, 0, 0, 22, 7, 1, 1, 0, 0], [22, 180001234567]],
    // só venceu em 2012: sem foto
    ["JOSE", "", [12, 13, 0, 1, 0, 0, 16, 13, 0, 1, 1, 2]],
  ],
};

describe("montarPessoas", () => {
  const [maria, jose] = montarPessoas(P);
  it("desempacota as participações e faz as contas da carreira", () => {
    expect(maria.r.map(x => [x.ano, x.cargo, x.uf, x.partido])).toEqual([
      [2020, 13, "PI", "PT"],
      [2022, 7, "PI", "MDB"],
    ]);
    expect(maria).toMatchObject({ vit: 2, der: 0, partidos: 2, anos: 2, ufs: ["PI"] });
    expect(jose).toMatchObject({ vit: 1, der: 1, reel: 0 });
    expect(jose.r[1].tentou).toBe(true);
  });
  it("a foto vem junto da pessoa; quem só venceu antes de 2022 fica sem", () => {
    expect(maria.foto).toEqual({ ano: 2022, sq: 180001234567 });
    expect(jose.foto).toBeNull();
  });
});
