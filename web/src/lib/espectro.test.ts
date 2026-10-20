import { describe, expect, it } from "vitest";
import { CATEGORIAS, COR_SEM_NOTA, CORES_ESPECTRO, categoria, corEspectro, nomeCategoria } from "./espectro";

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

  // TODO(human): casos nos cortes [1.5, 3, 4.49, 5.5, 7, 8.5]
});
