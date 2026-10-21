import { describe, expect, it } from "vitest";
import type { Eleito } from "../../../../src/paineis/candidatos/tipos";
import {
  acertou,
  alvoDiario,
  comparar,
  type Dados,
  desfoque,
  ESTATISTICAS_ZERO,
  mediaTentativas,
  nivelGrau,
  relogio,
  textoResultado,
  venceuJogo,
  votosCurto,
} from "../../../../src/paineis/jogos/politicodle/regras";

const base: Dados = {
  cargo: 11,
  partido: "PT",
  uf: "PI",
  genero: "FEMININO",
  cor: "PARDA",
  grau: "SUPERIOR COMPLETO",
  idade: 40,
  votos: 10000,
  espectro: [2, "esquerda", ""],
};
const com = (o: Partial<Dados>): Dados => ({ ...base, ...o });

describe("comparar", () => {
  it("tudo igual acerta", () => {
    expect(acertou(comparar(base, base))).toBe(true);
  });
  it("cargo parcial na mesma esfera e partido parcial na mesma categoria", () => {
    const r = comparar(com({ cargo: 13, partido: "PSB", espectro: [2.5, "esquerda", ""] }), base);
    expect(r.cargo.status).toBe("parcial");
    expect(r.partido.status).toBe("parcial");
    const d = comparar(com({ cargo: 6, partido: "PL", espectro: [8, "direita", ""] }), base);
    expect(d.cargo.status).toBe("diferente");
    expect(d.partido.status).toBe("diferente");
  });
  it("escolaridade segue a ordem e indica o sentido", () => {
    expect(comparar(com({ grau: "ENSINO MÉDIO COMPLETO" }), base).grau).toEqual({ status: "diferente", seta: "cima" });
    expect(comparar(com({ grau: "LÊ E ESCREVE" }), com({ grau: "SUPERIOR INCOMPLETO" })).grau.seta).toBe("cima");
    expect(comparar(base, com({ grau: "LÊ E ESCREVE" })).grau.seta).toBe("baixo");
  });
  it("idade: parcial até 5 anos, com seta", () => {
    expect(comparar(com({ idade: 37 }), base).idade).toEqual({ status: "parcial", seta: "cima" });
    expect(comparar(com({ idade: 50 }), base).idade).toEqual({ status: "diferente", seta: "baixo" });
  });
  it("votos: verde a 5%, amarelo até o dobro, vermelho além", () => {
    expect(comparar(com({ votos: 10400 }), base).votos.status).toBe("igual");
    expect(comparar(com({ votos: 15000 }), base).votos).toEqual({ status: "parcial", seta: "baixo" });
    expect(comparar(com({ votos: 5000 }), base).votos).toEqual({ status: "parcial", seta: "cima" });
    expect(comparar(com({ votos: 100 }), base).votos).toEqual({ status: "diferente", seta: "cima" });
  });
  it("dados ausentes não quebram", () => {
    expect(comparar(com({ idade: null, votos: null }), base).idade.status).toBe("diferente");
  });
});

describe("nivelGrau", () => {
  it("ordena os sete níveis", () => {
    const g = [
      "LÊ E ESCREVE",
      "ENSINO FUNDAMENTAL INCOMPLETO",
      "ENSINO FUNDAMENTAL COMPLETO",
      "ENSINO MÉDIO INCOMPLETO",
      "ENSINO MÉDIO COMPLETO",
      "SUPERIOR INCOMPLETO",
      "SUPERIOR COMPLETO",
    ].map(nivelGrau);
    expect(g).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe("alvoDiario", () => {
  const eleitos = Array.from({ length: 50 }, (_, i) => ({ id: i, cargo: i % 5 === 0 ? 13 : 11 }) as Eleito);
  it("é determinístico, ignora a ordem e nunca sorteia vereador", () => {
    const a = alvoDiario(eleitos, "2026-10-21");
    expect(alvoDiario([...eleitos].reverse(), "2026-10-21")?.id).toBe(a?.id);
    expect(a?.cargo).not.toBe(13);
    const outros = new Set(
      ["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"].map(d => alvoDiario(eleitos, d)?.id),
    );
    expect(outros.size).toBeGreaterThan(1);
  });
});

describe("auxiliares", () => {
  it("votosCurto", () => {
    expect(votosCurto(950)).toBe("950");
    expect(votosCurto(12300)).toBe("12,3 mil");
    expect(votosCurto(1_200_000)).toBe("1,2 mi");
  });
  it("textoResultado", () => {
    const t = textoResultado("Politicodle 2026-10-21", [comparar(com({ uf: "MA" }), base), comparar(base, base)]);
    expect(t.split("\n")).toEqual(["Politicodle 2026-10-21 em 2 tentativas", "🟩🟩🟥🟩🟩🟩🟩🟩", "🟩🟩🟩🟩🟩🟩🟩🟩"]);
  });
  it("desfoque só depois de 8 tentativas e diminui", () => {
    expect(desfoque(7)).toBeNull();
    expect(desfoque(8)).toBe(22);
    expect(desfoque(10)).toBeLessThan(desfoque(9) as number);
  });
  it("estatísticas e relógio", () => {
    const e = venceuJogo(venceuJogo(ESTATISTICAS_ZERO, 4), 6);
    expect(mediaTentativas(e)).toBe(5);
    expect(mediaTentativas(ESTATISTICAS_ZERO)).toBeNull();
    expect(relogio(3_729_000)).toBe("01:02:09");
  });
});
