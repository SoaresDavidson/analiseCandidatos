import { describe, expect, it } from "vitest";
import { explicarMotivo, type LinhaDecisao, lerDecisoes, tipoDecisao } from "../../../src/paineis/candidatos/decisoes";

const linha = (tipo: string, motivo: string, propria = 0): LinhaDecisao => [
  2024,
  11,
  "RIO PARDO",
  "RS",
  "MDB",
  tipo,
  motivo,
  "",
  1,
  propria,
];

describe("decisões da Justiça Eleitoral", () => {
  it("separa cassação de registro negado", () => {
    const [c] = lerDecisoes([linha("Fundamentos legais de cassação", "Abuso de poder político", 1)]);
    const [r] = lerDecisoes([linha("Fundamentos legais de julgamento", "Ficha limpa (LC 64/90)")]);
    expect(tipoDecisao(c)).toBe("Cassação");
    expect(c.propria).toBe(true);
    expect(tipoDecisao(r)).toBe("Registro de candidatura negado");
    expect(r.propria).toBe(false);
  });
  it("tira o ponto final do motivo do TSE", () => {
    expect(lerDecisoes([linha("Fundamentos legais de julgamento", "Compra de voto (Lei 9.504/97).")])[0].motivo).toBe(
      "Compra de voto (Lei 9.504/97)",
    );
  });
  it("explica cada motivo com a lei de referência", () => {
    expect(explicarMotivo("Ficha limpa (LC 64/90)")).toMatch(/Ficha Limpa/);
    expect(explicarMotivo("Captação ilícita de sufrágio")).toMatch(/41-A/);
    expect(explicarMotivo("Abuso de poder político")).toMatch(/art\. 22/);
    expect(explicarMotivo("Fraude à cota de gênero no DRAP")).toMatch(/chapa inteira/);
    expect(explicarMotivo("Inelegibilidade constitucional")).toMatch(/Constituição/);
    expect(explicarMotivo("Outros")).toMatch(/sem outro detalhe/);
  });
  it("sem decisão, lista vazia", () => {
    expect(lerDecisoes(undefined)).toEqual([]);
  });
});
