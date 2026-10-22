import { describe, expect, it } from "vitest";
import { danoRodada, RODADAS, valorRodada, vencedor } from "../../../src/paineis/arena/jogo";
import type { CartaEleito } from "../../../src/paineis/arena/tipos";

const verba = RODADAS.find(r => r.id === "verba")!;
const carta = (nome: string, publico: number | null) => ({ nome, publico }) as CartaEleito;

describe("rodada da verba pública", () => {
  it("existe e entra no sorteio das rodadas", () => {
    expect(verba.el).toBe("ouro");
    expect(RODADAS).toHaveLength(6);
  });
  it("quem usou menos dinheiro público ataca; quem usou mais leva o golpe", () => {
    expect(vencedor(verba, carta("A", 50_000), carta("B", 300_000))).toBe("a");
    expect(vencedor(verba, carta("A", 300_000), carta("B", 50_000))).toBe("b");
    expect(vencedor(verba, carta("A", 0), carta("B", 0))).toBe("empate");
  });
  it("sem prestação de contas não decide", () => {
    expect(vencedor(verba, carta("A", null), carta("B", 10))).toBeNull();
    expect(valorRodada(carta("A", null), verba)).toBe("sem prestação de contas");
  });
  it("dá 4 de dano", () => {
    expect(danoRodada(verba, carta("A", 1), carta("B", 2))).toBe(4);
  });
});
