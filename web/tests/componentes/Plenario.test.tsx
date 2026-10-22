// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProvedorDica } from "../../src/componentes/Dica";
import { setoresDosLados } from "../../src/componentes/lados";
import { type Assento, Plenario } from "../../src/componentes/Plenario";

// sem globals no Vitest, a Testing Library não desmonta sozinha entre os testes
afterEach(cleanup);

const assento = (nome: string, partido: string, nota: number | null): Assento => ({ nome, partido, nota });

describe("Plenario", () => {
  it("desenha uma cadeira por eleito, da esquerda para a direita pela nota", () => {
    const xs = [
      assento("Cid", "DIR", 9),
      assento("Ana", "ESQ", 1),
      assento("Bia", "CEN", 5),
      assento("Dan", "SEM", null),
    ];
    render(
      <ProvedorDica>
        <Plenario assentos={xs} titulo="teste" />
      </ProvedorDica>,
    );
    const cadeiras = screen.getAllByRole("button");
    expect(cadeiras.map(c => c.getAttribute("aria-label"))).toEqual(["Ana, ESQ", "Bia, CEN", "Cid, DIR", "Dan, SEM"]);
  });

  it("clique e Enter abrem o eleito", () => {
    const aoClicar = vi.fn();
    render(
      <ProvedorDica>
        <Plenario assentos={[assento("Ana", "ESQ", 1)]} aoClicar={aoClicar} />
      </ProvedorDica>,
    );
    const cadeira = screen.getByRole("button", { name: "Ana, ESQ" });
    fireEvent.click(cadeira);
    fireEvent.keyDown(cadeira, { key: "Enter" });
    expect(aoClicar).toHaveBeenCalledTimes(2);
    expect(aoClicar).toHaveBeenCalledWith(expect.objectContaining({ nome: "Ana" }));
  });

  it("com lados, junta esquerda, centro e direita, e o partido sem nota fica no centro", () => {
    const xs = [
      assento("Cid", "DIR", 9),
      assento("Eva", "CD", 6),
      assento("Ana", "ESQ", 1),
      assento("Bia", "CEN", 5),
      assento("Dan", "SEM", null),
    ];
    render(
      <ProvedorDica>
        <Plenario assentos={xs} lados titulo="teste" />
      </ProvedorDica>,
    );
    const cadeiras = screen.getAllByRole("button");
    expect(cadeiras.map(c => c.getAttribute("aria-label"))).toEqual([
      "Ana, ESQ",
      "Bia, CEN",
      "Dan, SEM",
      "Eva, CD",
      "Cid, DIR",
    ]);
  });

  it("os fundos dos lados cobrem o arco sem buraco, da esquerda (ângulo maior) para a direita", () => {
    const xs = [assento("A", "E", 1), assento("B", "E", 2), assento("C", "C", 5), assento("D", "D", 8)];
    const pos = [{ a: 160 }, { a: 120 }, { a: 80 }, { a: 20 }];
    const s = setoresDosLados(xs, pos);
    expect(s.map(x => x.lado)).toEqual([0, 1, 2]);
    expect(s[0].a1).toBeGreaterThan(160);
    expect(s[0].a0).toBe(100);
    expect(s[1]).toEqual({ lado: 1, a0: 50, a1: 100 });
    expect(s[2].a1).toBe(50);
    expect(s[2].a0).toBeLessThan(20);
  });
});
