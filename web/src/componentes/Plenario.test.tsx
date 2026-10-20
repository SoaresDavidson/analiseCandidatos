// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProvedorDica } from "./Dica";
import { type Assento, Plenario } from "./Plenario";

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
});
