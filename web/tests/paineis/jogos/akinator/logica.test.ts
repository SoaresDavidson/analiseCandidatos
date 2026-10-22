import { describe, expect, it } from "vitest";
import type { Eleito } from "../../../../src/paineis/candidatos/tipos";
import {
  deveChutar,
  discordancias,
  gerarPerguntas,
  melhorChute,
  melhorPergunta,
  type Pergunta,
  penalidade,
  penalidades,
  vivos,
} from "../../../../src/paineis/jogos/akinator/logica";

let n = 0;
const eleito = (o: Partial<Eleito>): Eleito =>
  ({
    id: n++,
    nome: "Ana",
    genero: "FEMININO",
    partido: "PT",
    uf: "AM",
    cargo: 11,
    ano: 2024,
    cod: 1,
    grau: "",
    cor: "PARDA",
    carreira: [],
    votos: 10,
    idade: 40,
    espectro: null,
    ...o,
  }) as Eleito;

const mulher: Pergunta = { id: "m", texto: "", teste: e => e.genero === "FEMININO" };
const am: Pergunta = { id: "uf", texto: "", teste: e => e.uf === "AM" };
const mapa = (...ps: Pergunta[]) => new Map(ps.map(p => [p.id, p]));

describe("penalidade", () => {
  const f = eleito({});
  const h = eleito({ genero: "MASCULINO" });
  it("pesa o erro conforme a certeza", () => {
    expect(penalidade(mulher, 1, f)).toBe(0);
    expect(penalidade(mulher, 1, h)).toBe(1);
    expect(penalidade(mulher, 0.5, h)).toBe(0.5);
    expect(penalidade(mulher, -1, f)).toBe(1);
    expect(penalidade(mulher, -0.5, f)).toBe(0.5);
    expect(penalidade(mulher, 0, h)).toBe(0);
  });
  it("dado ausente não pesa", () => {
    expect(penalidade({ id: "x", texto: "", teste: () => null }, 1, f)).toBe(0);
  });
});

describe("vivos", () => {
  const es = [eleito({}), eleito({}), eleito({}), eleito({ genero: "MASCULINO" })];
  it("fica com os de penalidade mínima", () => {
    const pens = penalidades(es, mapa(mulher), [{ id: "m", valor: 1 }]);
    expect(pens).toEqual([0, 0, 0, 1]);
    expect(vivos(es, pens)).toHaveLength(3);
  });
  it("abre a margem de 0,5 quando sobram poucos", () => {
    const pens = [0, 0.5, 1, 1];
    expect(vivos(es, pens).map(e => e.id)).toEqual([es[0].id, es[1].id]);
  });
  it("excluídos nunca voltam", () => {
    const pens = penalidades(es, mapa(), [], new Set([es[0].id]));
    expect(pens[0]).toBe(Number.POSITIVE_INFINITY);
    expect(vivos(es, pens)).not.toContain(es[0]);
  });
  it("tolera uma resposta errada do jogador", () => {
    const alvo = eleito({ uf: "GO" });
    const lote = [alvo, eleito({ genero: "MASCULINO", uf: "RS" }), eleito({ genero: "MASCULINO", uf: "RS" })];
    const pens = penalidades(lote, mapa(mulher, am), [
      { id: "m", valor: 1 },
      { id: "uf", valor: 1 }, // errado: o alvo é de GO
    ]);
    expect(pens).toEqual([1, 2, 2]);
    expect(melhorChute(lote, pens, vivos(lote, pens))).toBe(alvo);
  });
});

describe("melhorPergunta", () => {
  const todos = [
    eleito({ genero: "FEMININO", uf: "AM" }),
    eleito({ genero: "FEMININO", uf: "GO" }),
    eleito({ genero: "MASCULINO", uf: "AM" }),
    eleito({ genero: "MASCULINO", uf: "AM" }),
  ];
  const go: Pergunta = { id: "go", texto: "", teste: e => e.uf === "GO" };
  it("escolhe a mais próxima de 50/50", () => {
    expect(melhorPergunta(todos, [am, mulher, go], new Set())?.id).toBe("m");
  });
  it("ignora as já feitas e as que não dividem", () => {
    expect(melhorPergunta(todos, [am, mulher], new Set(["m"]))?.id).toBe("uf");
    const iguais = [eleito({}), eleito({})];
    expect(melhorPergunta(iguais, [am, mulher], new Set())).toBeNull();
  });
  it("empate vai a sorteio entre as melhores", () => {
    const a: Pergunta = { id: "a", texto: "", teste: e => e.genero === "FEMININO" };
    const b: Pergunta = { id: "b", texto: "", teste: e => e.genero === "MASCULINO" };
    expect(melhorPergunta(todos, [a, b], new Set(), () => 0)?.id).toBe("a");
    expect(melhorPergunta(todos, [a, b], new Set(), () => 0.9)?.id).toBe("b");
  });
});

describe("deveChutar", () => {
  const base = { vivos: 50, haPergunta: true, respondidas: 5, ultimoChute: 0 };
  it("só chuta quando há motivo", () => {
    expect(deveChutar(base)).toBe(false);
    expect(deveChutar({ ...base, vivos: 1 })).toBe(true);
    expect(deveChutar({ ...base, haPergunta: false })).toBe(true);
    expect(deveChutar({ ...base, respondidas: 20 })).toBe(true);
    expect(deveChutar({ ...base, respondidas: 25, ultimoChute: 10 })).toBe(false);
  });
});

describe("perguntas e discordâncias", () => {
  it("gera uma pergunta por partido presente, ids únicos", () => {
    const ps = gerarPerguntas([eleito({ partido: "PT" }), eleito({ partido: "PL" })]);
    expect(ps.filter(p => p.id.startsWith("partido-")).map(p => p.id)).toEqual(["partido-PL", "partido-PT"]);
    expect(new Set(ps.map(p => p.id)).size).toBe(ps.length);
  });
  it("lista onde o eleito contradiz o jogador", () => {
    const h = eleito({ genero: "MASCULINO" });
    const d = discordancias(h, mapa(mulher, am), [
      { id: "m", valor: 1 },
      { id: "uf", valor: 1 },
    ]);
    expect(d.map(x => x.pergunta.id)).toEqual(["m"]);
    expect(d[0].correta).toBe(false);
  });
});
