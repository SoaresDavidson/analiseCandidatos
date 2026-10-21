import { describe, expect, it } from "vitest";
import {
  CATEGORIAS,
  COR_SEM_NOTA,
  CORES_ESPECTRO,
  categoria,
  corEspectro,
  nomeCategoria,
} from "../../src/lib/espectro";

describe("espectro", () => {
  it("sem nota fica fora das 7 categorias", () => {
    expect(categoria(null)).toBe(-1);
    expect(nomeCategoria(undefined)).toBe("sem nota");
    expect(corEspectro(null)).toBe(COR_SEM_NOTA);
  });

  it("os extremos caem nas pontas", () => {
    expect(nomeCategoria(0)).toBe("extrema esquerda");
    expect(nomeCategoria(10)).toBe("extrema direita");
  });

  it("cor e nome andam juntos", () => {
    for (let i = 0; i < CATEGORIAS.length; i++) expect(CORES_ESPECTRO[i]).toMatch(/^#[0-9a-f]{6}$/);
  });

  // a nota igual ao corte fica na categoria da esquerda (nota <= corte); um centésimo acima já muda
  it.each([
    [1.5, "extrema esquerda"],
    [1.51, "esquerda"],
    [3, "esquerda"],
    [3.01, "centro-esquerda"],
    [4.49, "centro-esquerda"],
    // o corte é 4.49, não 4.5: uma nota 4,50 já conta como centro
    [4.5, "centro"],
    [5.5, "centro"],
    [5.51, "centro-direita"],
    [7, "centro-direita"],
    [7.01, "direita"],
    [8.5, "direita"],
    [8.51, "extrema direita"],
  ])("nota %d -> %s", (nota, nome) => expect(nomeCategoria(nota)).toBe(nome));
});
