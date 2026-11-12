import { describe, expect, it } from "vitest";
import { nomeDe, numeroDe, urlFigurinha } from "../../../src/paineis/q5/partidos";

describe("figurinhas dos partidos", () => {
  it("partido com imagem pronta aponta para o arquivo dela", () => {
    expect(urlFigurinha("PSB", 2024)).toMatch(/img\/figurinhas\/PSB\.webp$/);
    expect(urlFigurinha("PC do B", 2020)).toMatch(/img\/figurinhas\/PCdoB\.webp$/);
    expect(urlFigurinha("UNIÃO", 2024)).toMatch(/img\/figurinhas\/UNIAO\.webp$/);
  });
  it("partido sem imagem fica com a figurinha montada na página", () => {
    expect(urlFigurinha("PSOL", 2024)).toBeNull();
  });
  it("o Podemos só usa a imagem (número 20) a partir de 2024; antes era o 19", () => {
    expect(urlFigurinha("PODE", 2022)).toBeNull();
    expect(numeroDe("PODE", 2022)).toBe(19);
    expect(urlFigurinha("PODE", 2024)).toMatch(/PODE\.webp$/);
    expect(numeroDe("PODE", 2024)).toBe(20);
  });
  it("nome por extenso; sigla desconhecida volta como veio", () => {
    expect(nomeDe("PV")).toBe("Partido Verde");
    expect(nomeDe("XYZ")).toBe("XYZ");
  });
});
