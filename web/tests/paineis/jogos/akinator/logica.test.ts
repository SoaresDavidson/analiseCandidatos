import { describe, expect, it } from "vitest";
import type { Eleito } from "../../../../src/paineis/candidatos/tipos";
import {
  deveChutar,
  discordancias,
  ERRO,
  gerarPerguntas,
  melhorChute,
  melhorPergunta,
  type Pergunta,
  plausiveis,
  probabilidades,
  verossimilhanca,
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

describe("verossimilhanca", () => {
  const f = eleito({});
  const h = eleito({ genero: "MASCULINO" });
  it("pesa conforme a certeza da resposta", () => {
    expect(verossimilhanca(mulher, 1, f)).toBeCloseTo(1 - ERRO);
    expect(verossimilhanca(mulher, 1, h)).toBeCloseTo(ERRO);
    expect(verossimilhanca(mulher, 0.5, f)).toBeCloseTo(0.7);
    expect(verossimilhanca(mulher, 0.5, h)).toBeCloseTo(0.3);
    expect(verossimilhanca(mulher, -1, f)).toBeCloseTo(ERRO);
  });
  it("'não sei' e dado ausente são neutros", () => {
    expect(verossimilhanca(mulher, 0, h)).toBe(1);
    expect(verossimilhanca({ id: "x", texto: "", teste: () => null }, 1, f)).toBe(1);
  });
});

describe("probabilidades", () => {
  const es = [eleito({}), eleito({}), eleito({}), eleito({ genero: "MASCULINO" })];
  it("começa uniforme e soma 1", () => {
    expect(probabilidades(es, mapa(), [])).toEqual([0.25, 0.25, 0.25, 0.25]);
  });
  it("quem contradiz perde peso, mas não zera", () => {
    const ps = probabilidades(es, mapa(mulher), [{ id: "m", valor: 1 }]);
    expect(ps.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(ps[3]).toBeGreaterThan(0);
    expect(ps[0] / ps[3]).toBeCloseTo((1 - ERRO) / ERRO);
    expect(plausiveis(ps)).toBe(4);
  });
  it("excluídos valem 0; sem ninguém, tudo 0", () => {
    const ps = probabilidades(es, mapa(), [], new Set([es[0].id]));
    expect(ps[0]).toBe(0);
    expect(ps[1]).toBeCloseTo(1 / 3);
    const nada = probabilidades(es, mapa(), [], new Set(es.map(e => e.id)));
    expect(nada).toEqual([0, 0, 0, 0]);
    expect(plausiveis(nada)).toBe(0);
    expect(melhorChute(es, nada)).toBeNull();
  });
  it("tolera uma resposta errada do jogador", () => {
    const alvo = eleito({ uf: "GO" });
    const lote = [alvo, eleito({ genero: "MASCULINO", uf: "RS" }), eleito({ genero: "MASCULINO", uf: "RS" })];
    const ps = probabilidades(lote, mapa(mulher, am), [
      { id: "m", valor: 1 },
      { id: "uf", valor: 1 }, // errado: o alvo é de GO
    ]);
    expect(melhorChute(lote, ps)).toBe(alvo);
  });
  it("não estoura com muitas respostas", () => {
    const rs = Array.from({ length: 400 }, () => ({ id: "m", valor: 1 }));
    const ps = probabilidades(es, mapa(mulher), rs);
    expect(ps.every(Number.isFinite)).toBe(true);
    expect(ps[0]).toBeCloseTo(1 / 3);
  });
});

describe("melhorPergunta", () => {
  const todos = [
    eleito({ genero: "FEMININO", uf: "AM" }),
    eleito({ genero: "FEMININO", uf: "GO" }),
    eleito({ genero: "MASCULINO", uf: "AM" }),
    eleito({ genero: "MASCULINO", uf: "AM" }),
  ];
  const uni = [0.25, 0.25, 0.25, 0.25];
  const go: Pergunta = { id: "go", texto: "", teste: e => e.uf === "GO" };
  it("escolhe a de maior ganho (a mais equilibrada)", () => {
    expect(melhorPergunta(todos, uni, [am, mulher, go], new Set())?.id).toBe("m");
  });
  it("pondera pela probabilidade", () => {
    // quase toda a massa nas duas de AM: separar AM de GO quase não informa, gênero sim
    const ps = [0.45, 0.01, 0.45, 0.09];
    expect(melhorPergunta(todos, ps, [go, mulher], new Set())?.id).toBe("m");
  });
  it("prefere a pergunta com dado a uma cheia de lacunas", () => {
    const lacunas: Pergunta = { id: "l", texto: "", teste: e => (e.uf === "GO" ? null : e.genero === "FEMININO") };
    expect(melhorPergunta(todos, uni, [lacunas, mulher], new Set())?.id).toBe("m");
  });
  it("ignora as já feitas e as que não dividem", () => {
    expect(melhorPergunta(todos, uni, [am, mulher], new Set(["m"]))?.id).toBe("uf");
    const iguais = [eleito({}), eleito({})];
    expect(melhorPergunta(iguais, [0.5, 0.5], [am, mulher], new Set())).toBeNull();
  });
  it("empate vai a sorteio entre as melhores", () => {
    const a: Pergunta = { id: "a", texto: "", teste: e => e.genero === "FEMININO" };
    const b: Pergunta = { id: "b", texto: "", teste: e => e.genero === "MASCULINO" };
    expect(melhorPergunta(todos, uni, [a, b], new Set(), () => 0)?.id).toBe("a");
    expect(melhorPergunta(todos, uni, [a, b], new Set(), () => 0.9)?.id).toBe("b");
  });
});

describe("deveChutar", () => {
  const base = { topo: 0.3, haPergunta: true, respondidas: 5, ultimoChute: 0 };
  it("só chuta quando há motivo", () => {
    expect(deveChutar(base)).toBe(false);
    expect(deveChutar({ ...base, topo: 0.85 })).toBe(true);
    expect(deveChutar({ ...base, haPergunta: false })).toBe(true);
    expect(deveChutar({ ...base, respondidas: 20 })).toBe(true);
    expect(deveChutar({ ...base, respondidas: 25, ultimoChute: 10 })).toBe(false);
  });
});

describe("melhorChute", () => {
  it("maior probabilidade, desempate pelos votos", () => {
    const es = [eleito({ votos: 5 }), eleito({ votos: 50 }), eleito({ votos: 500 })];
    expect(melhorChute(es, [0.4, 0.4, 0.2])).toBe(es[1]);
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
