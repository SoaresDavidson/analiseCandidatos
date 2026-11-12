import { describe, expect, it } from "vitest";
import type { DadosCandidatos, LinhaEleito } from "../../../src/paineis/candidatos/tipos";
import { fotoDe, indiceFotos } from "../../../src/paineis/q10/fotos";
import type { Candidatura, Pessoa } from "../../../src/paineis/q10/logica";

// só os campos que o índice lê: ano-2000, uf, cargo, ue, partido, urna, civil
const eleito = (ano: number, cargo: number, ue: number, civil: string) =>
  [ano - 2000, 0, cargo, ue, 0, "URNA", civil] as unknown as LinhaEleito;

const dados = (eleitos: LinhaEleito[], sq: number[]) =>
  ({ ues: ["GO|GO", "ANÁPOLIS|GO", "GOIÂNIA|GO"], eleitos, sq }) as unknown as DadosCandidatos;

const pessoa = (civil: string, r: Partial<Candidatura>[]): Pessoa =>
  ({ nome: "Urna", civil, r: r.map(x => ({ uf: "GO", res: 0, ...x })) }) as unknown as Pessoa;

describe("fotoDe", () => {
  it("casa eleição estadual, em que a lista de eleitos traz a sigla e a carreira traz o nome do estado", () => {
    const indice = indiceFotos(dados([eleito(2022, 3, 0, "RONALDO RAMOS CAIADO")], [90001646326]));
    const p = pessoa("Ronaldo Ramos Caiado", [{ ano: 2022, cargo: 3, local: "Goiás" }]);
    expect(fotoDe(p, indice)).toEqual({ ano: 2022, sq: 90001646326 });
  });

  it("ignora acento e caixa no nome e na cidade", () => {
    const indice = indiceFotos(dados([eleito(2024, 13, 1, "JOSÉ DA SILVA")], [7]));
    expect(fotoDe(pessoa("Jose da Silva", [{ ano: 2024, cargo: 13, local: "Anapolis" }]), indice)).toEqual({
      ano: 2024,
      sq: 7,
    });
  });

  it("homônimo de outra cidade não leva a foto", () => {
    const indice = indiceFotos(dados([eleito(2024, 13, 1, "JOSÉ DA SILVA")], [7]));
    expect(fotoDe(pessoa("José da Silva", [{ ano: 2024, cargo: 13, local: "Goiânia" }]), indice)).toBeNull();
  });

  it("dois eleitos diferentes na mesma chave: ninguém leva foto", () => {
    const indice = indiceFotos(
      dados([eleito(2024, 13, 1, "JOSÉ DA SILVA"), eleito(2024, 13, 1, "JOSÉ DA SILVA")], [7, 8]),
    );
    expect(fotoDe(pessoa("José da Silva", [{ ano: 2024, cargo: 13, local: "Anápolis" }]), indice)).toBeNull();
  });

  it("derrota não vale: a foto é a de uma vitória", () => {
    const indice = indiceFotos(dados([eleito(2024, 13, 1, "JOSÉ DA SILVA")], [7]));
    const p = pessoa("José da Silva", [{ ano: 2024, cargo: 13, local: "Anápolis", res: 1 }]);
    expect(fotoDe(p, indice)).toBeNull();
  });

  it("sem nome civil separado, usa o nome de urna (são iguais no TSE)", () => {
    const indice = indiceFotos(dados([eleito(2024, 13, 2, "URNA")], [9]));
    expect(fotoDe(pessoa("", [{ ano: 2024, cargo: 13, local: "Goiânia" }]), indice)).toEqual({ ano: 2024, sq: 9 });
  });
});
