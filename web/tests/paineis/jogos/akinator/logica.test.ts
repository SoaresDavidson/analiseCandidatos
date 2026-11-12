import { describe, expect, it } from "vitest";
import type { Eleito } from "../../../../src/paineis/candidatos/tipos";
import {
  avaliar,
  deveChutar,
  discordancias,
  ERRO,
  GANHO_MINIMO,
  gerarPerguntas,
  melhorPergunta,
  montarTabela,
  type Pergunta,
  TOLERANCIA,
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

const avaliarEm = (es: Eleito[], ps: Pergunta[], rs: { id: string; valor: number }[], excl?: Set<number>) =>
  avaliar(montarTabela(es, ps), rs, excl);

describe("montarTabela", () => {
  it("guarda 1, -1 e 0 (sem dado) por pergunta", () => {
    const lacuna: Pergunta = { id: "x", texto: "", teste: e => (e.uf === "GO" ? null : e.uf === "AM") };
    const es = [eleito({ uf: "AM" }), eleito({ uf: "RS" }), eleito({ uf: "GO" })];
    expect([...(montarTabela(es, [lacuna]).linhas.get("x") ?? [])]).toEqual([1, -1, 0]);
  });
});

describe("avaliar", () => {
  const es = [eleito({}), eleito({}), eleito({}), eleito({ genero: "MASCULINO" })];
  it("começa uniforme e soma 1", () => {
    expect([...avaliarEm(es, [], []).probs]).toEqual([0.25, 0.25, 0.25, 0.25]);
  });
  it("quem contradiz perde peso, mas não zera", () => {
    const { probs } = avaliarEm(es, [mulher], [{ id: "m", valor: 1 }]);
    expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(probs[3]).toBeGreaterThan(0);
    expect(probs[0] / probs[3]).toBeCloseTo((1 - ERRO) / ERRO);
  });
  it("excluídos valem 0; sem ninguém, tudo 0 e sem líder", () => {
    const um = avaliarEm(es, [], [], new Set([es[0].id]));
    expect(um.probs[0]).toBe(0);
    expect(um.probs[1]).toBeCloseTo(1 / 3);
    expect(um.plausiveis).toBe(3);
    const nada = avaliarEm(es, [], [], new Set(es.map(e => e.id)));
    expect([...nada.probs]).toEqual([0, 0, 0, 0]);
    expect(nada).toMatchObject({ lider: -1, topo: 0, plausiveis: 0 });
  });
  it("tolera uma resposta errada do jogador", () => {
    const alvo = eleito({ uf: "GO" });
    const lote = [alvo, eleito({ genero: "MASCULINO", uf: "RS" }), eleito({ genero: "MASCULINO", uf: "RS" })];
    const r = avaliarEm(
      lote,
      [mulher, am],
      [
        { id: "m", valor: 1 },
        { id: "uf", valor: 1 }, // errado: o alvo é de GO
      ],
    );
    expect(r.lider).toBe(0);
  });
  it("não estoura com muitas respostas", () => {
    const rs = Array.from({ length: 400 }, () => ({ id: "m", valor: 1 }));
    const { probs } = avaliarEm(es, [mulher], rs);
    expect(probs.every(Number.isFinite)).toBe(true);
    expect(probs[0]).toBeCloseTo(1 / 3);
  });
  it("líder: maior probabilidade, desempate pelos votos", () => {
    const lote = [eleito({ votos: 5 }), eleito({ votos: 50 }), eleito({ genero: "MASCULINO", votos: 500 })];
    const r = avaliarEm(lote, [mulher], [{ id: "m", valor: 1 }]);
    expect(r.lider).toBe(1);
    expect(r.topo).toBeCloseTo(r.probs[1]);
  });
  it("aguenta um baralho maior que o limite de argumentos do Math.max", () => {
    const grande = Array.from({ length: 200_000 }, (_, i) => eleito({ genero: i % 2 ? "FEMININO" : "MASCULINO" }));
    const r = avaliarEm(grande, [mulher], [{ id: "m", valor: 1 }]);
    expect(r.lider).toBeGreaterThanOrEqual(0);
    expect(melhorPergunta(montarTabela(grande, [mulher, am]), r.probs, new Set(["m"]))).toBeNull();
  });
});

describe("candidatos possíveis", () => {
  const ufs: Pergunta[] = ["AM", "GO", "RS"].map(uf => ({ id: uf, texto: "", teste: e => e.uf === uf }));
  const lote = [
    eleito({ uf: "AM" }),
    eleito({ uf: "GO" }),
    eleito({ uf: "RS" }),
    eleito({ uf: "SE" }),
    eleito({ uf: "SE", genero: "MASCULINO" }),
  ];
  it(`conta quem contradiz no máximo ${TOLERANCIA} respostas, sem depender de ERRO`, () => {
    const rs = [
      { id: "m", valor: 1 },
      { id: "AM", valor: 1 },
    ];
    // SE masculino contradiz as duas e ainda conta; ninguém sai depois de uma contradição
    expect(avaliarEm(lote, [mulher, ...ufs], rs).plausiveis).toBe(5);
    // com mais uma resposta, o SE masculino passa da tolerância
    const mais = [...rs, { id: "RS", valor: 1 }];
    expect(avaliarEm(lote, [mulher, ...ufs], mais).plausiveis).toBe(4);
  });
  it("'provavelmente' pesa meia contradição", () => {
    const rs = ["AM", "GO", "RS"].map(id => ({ id, valor: 0.5 }));
    // cada um contradiz 2 ou 3 "provavelmente": 1 a 1,5 contradição, todos dentro
    expect(avaliarEm(lote, [mulher, ...ufs], rs).plausiveis).toBe(5);
  });
  it("a contagem não sobe quando o líder leva uma contradição", () => {
    const rs = [
      { id: "AM", valor: 1 },
      { id: "GO", valor: -1 },
      { id: "RS", valor: -1 },
    ];
    const antes = avaliarEm(lote, [mulher, ...ufs], rs).plausiveis;
    const depois = avaliarEm(lote, [mulher, ...ufs], [...rs, { id: "m", valor: -1 }]).plausiveis;
    expect(depois).toBeLessThanOrEqual(antes);
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
  const melhor = (es: Eleito[], ps: number[], qs: Pergunta[], feitas = new Set<string>(), rnd?: () => number) =>
    melhorPergunta(montarTabela(es, qs), ps, feitas, rnd);
  it("escolhe a de maior ganho (a mais equilibrada)", () => {
    expect(melhor(todos, uni, [am, mulher, go])?.id).toBe("m");
  });
  it("pondera pela probabilidade", () => {
    // quase toda a massa nas duas de AM: separar AM de GO quase não informa, gênero sim
    const ps = [0.45, 0.01, 0.45, 0.09];
    expect(melhor(todos, ps, [go, mulher])?.id).toBe("m");
  });
  it("prefere a pergunta com dado a uma cheia de lacunas", () => {
    const lacunas: Pergunta = { id: "l", texto: "", teste: e => (e.uf === "GO" ? null : e.genero === "FEMININO") };
    expect(melhor(todos, uni, [lacunas, mulher])?.id).toBe("m");
  });
  it("lacuna pesa menos que uma divisão ruim: quem tem o dado ainda se separa", () => {
    // metade sem o dado, a outra metade dividida 50/50, contra uma pergunta 1/8 x 7/8 com dado
    const oito = Array.from({ length: 8 }, (_, i) =>
      eleito({ uf: i < 4 ? "GO" : "AM", genero: i % 2 ? "FEMININO" : "MASCULINO" }),
    );
    const meia: Pergunta = { id: "meia", texto: "", teste: e => (e.uf === "GO" ? null : e.genero === "FEMININO") };
    const torta: Pergunta = { id: "torta", texto: "", teste: e => e.id === oito[0].id };
    expect(melhor(oito, Array(8).fill(1 / 8), [meia, torta])?.id).toBe("meia");
  });
  it("sem lacunas, o ganho é H(resposta) - H(resposta | eleito)", () => {
    // com a pergunta mulher em 4 eleitos 2 x 2, o ganho é 1 - h(ERRO); acima do mínimo, então sai
    const h = (q: number) => -q * Math.log2(q) - (1 - q) * Math.log2(1 - q);
    expect(1 - h(ERRO)).toBeGreaterThan(GANHO_MINIMO);
    expect(melhor(todos, uni, [mulher])?.id).toBe("m");
  });
  it("ignora as já feitas e as que não dividem", () => {
    expect(melhor(todos, uni, [am, mulher], new Set(["m"]))?.id).toBe("uf");
    const iguais = [eleito({}), eleito({})];
    expect(melhor(iguais, [0.5, 0.5], [am, mulher])).toBeNull();
  });
  it("devolve null quando a pergunta só separa eleitos improváveis", () => {
    // dois gêmeos com quase toda a massa; a pergunta só tira um eleito com 1e-6
    const lote = [eleito({}), eleito({}), eleito({ uf: "GO" })];
    expect(melhor(lote, [0.4999995, 0.4999995, 1e-6], [am])).toBeNull();
  });
  it("empate vai a sorteio entre as melhores", () => {
    const a: Pergunta = { id: "a", texto: "", teste: e => e.genero === "FEMININO" };
    const b: Pergunta = { id: "b", texto: "", teste: e => e.genero === "MASCULINO" };
    expect(melhor(todos, uni, [a, b], new Set(), () => 0)?.id).toBe("a");
    expect(melhor(todos, uni, [a, b], new Set(), () => 0.9)?.id).toBe("b");
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
  it("depois de um chute errado, pergunta de novo antes de chutar pelo limiar", () => {
    expect(deveChutar({ ...base, topo: 0.85, ultimoChute: 5 })).toBe(false);
    expect(deveChutar({ ...base, topo: 0.85, respondidas: 6, ultimoChute: 5 })).toBe(true);
    // sem pergunta útil, chuta mesmo assim
    expect(deveChutar({ ...base, topo: 0.85, ultimoChute: 5, haPergunta: false })).toBe(true);
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
