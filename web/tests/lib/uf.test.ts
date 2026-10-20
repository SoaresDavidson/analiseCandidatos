import { describe, expect, it } from "vitest";
import { doEstado, noEstado, semAcento } from "../../src/lib/uf";

describe("uf", () => {
  it("preposição de cada estado", () => {
    expect(noEstado("TODAS")).toBe("nos 6 estados");
    expect(noEstado("MA")).toBe("no Maranhão");
    expect(noEstado("GO")).toBe("em Goiás");
    expect(doEstado("RS")).toBe("do Rio Grande do Sul");
    expect(doEstado("MT")).toBe("de Mato Grosso");
  });
  it("semAcento normaliza para busca", () => expect(semAcento("São JOSÉ d'Aliança")).toBe("sao jose d'alianca"));
});
