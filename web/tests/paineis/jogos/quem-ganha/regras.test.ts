import { describe, expect, it } from "vitest";
import type { Eleito } from "../../../../src/paineis/candidatos/tipos";
import { aleatorio } from "../../../../src/paineis/jogos/comum";
import {
  acertou,
  CRITERIOS,
  criterioPorId,
  GRUPOS,
  grupoDe,
  MISTURADO,
  novaRodada,
  razao,
  razaoMaxima,
  sortearPar,
} from "../../../../src/paineis/jogos/quem-ganha/regras";

let n = 0;
const eleito = (p: Partial<Eleito>): Eleito =>
  ({
    sq: ++n,
    ano: 2024,
    uf: "PI",
    cargo: 11,
    votos: 100,
    receita: 1000,
    patrimonio: 5000,
    propaganda: 10,
    idade: 40,
    carreira: [],
    ...p,
  }) as Eleito;

const base: Eleito[] = [
  ...[100, 200, 400, 800, 1600, null].map(v => eleito({ votos: v, cargo: 11 })),
  ...[10, 20, 30, 40].map(v => eleito({ votos: v, cargo: 13 })),
  ...[1, 2, 3].map(v => eleito({ votos: v * 1000, cargo: 7, ano: 2022 })),
  ...[5, 6, 7].map(v => eleito({ votos: v * 1000, cargo: 6, ano: 2022, uf: "GO" })),
  ...[9, 8].map((v, i) => eleito({ votos: v * 1000, cargo: i ? 3 : 5, ano: 2022 })),
];

describe("novaRodada", () => {
  it("devolve dois do mesmo grupo, com valor não nulo e diferente", () => {
    const rnd = aleatorio("par");
    const votos = criterioPorId("votos");
    for (let i = 0; i < 200; i++) {
      const r = novaRodada({ eleitos: base, modo: "votos", uf: "TODAS", sequencia: i % 10, rnd });
      if (!r) throw new Error("sem rodada");
      expect(r.a.sq).not.toBe(r.b.sq);
      expect(grupoDe(r.a)).toBe(grupoDe(r.b));
      expect(r.criterio).toBe(votos);
      const x = r.criterio.valor(r.a);
      const y = r.criterio.valor(r.b);
      expect(x).not.toBeNull();
      expect(y).not.toBeNull();
      expect(x).not.toBe(y);
    }
  });

  it("no modo clássico o vencedor fica e o desafiante vem do mesmo grupo", () => {
    const fixo = base[2];
    const rnd = aleatorio("fixo");
    for (let i = 0; i < 50; i++) {
      const r = novaRodada({ eleitos: base, modo: MISTURADO, uf: "TODAS", sequencia: 3, fixo, rnd });
      if (!r) throw new Error("sem rodada");
      expect(r.a).toBe(fixo);
      expect(grupoDe(r.b)).toBe(grupoDe(fixo));
    }
  });

  it("estado sem par suficiente cai para todos os estados", () => {
    // só há 1 prefeito no PI com ... e nenhum grupo com 2 em MA: precisa cair para todos
    const r = novaRodada({ eleitos: base, modo: "votos", uf: "MA", sequencia: 0, rnd: aleatorio("uf") });
    expect(r).not.toBeNull();
  });

  it("cobre todos os grupos com pesos iguais", () => {
    const rnd = aleatorio("grupos");
    const vistos = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const r = novaRodada({ eleitos: base, modo: "votos", uf: "TODAS", sequencia: 0, rnd });
      if (r) vistos.add(r.grupo.id);
    }
    expect(vistos.size).toBe(GRUPOS.length);
  });
});

describe("sortearPar", () => {
  it("sem par possível devolve null", () => {
    expect(sortearPar([eleito({})], CRITERIOS[0], 0)).toBeNull();
    expect(sortearPar([eleito({ votos: 5 }), eleito({ votos: 5 })], CRITERIOS[0], 0)).toBeNull();
  });
});

describe("acertou", () => {
  it("vale o lado de maior valor", () => {
    expect(acertou(10, 5, "a")).toBe(true);
    expect(acertou(10, 5, "b")).toBe(false);
    expect(acertou(5, 10, "b")).toBe(true);
  });
});

describe("dificuldade", () => {
  it("a razão máxima cai com a sequência e nunca passa de ~1,05", () => {
    let ant = Number.POSITIVE_INFINITY;
    for (let s = 0; s < 60; s++) {
      const r = razaoMaxima(s);
      expect(r).toBeLessThan(ant);
      expect(r).toBeGreaterThan(1.05);
      ant = r;
    }
    expect(razaoMaxima(0)).toBeGreaterThan(50);
    expect(razaoMaxima(40)).toBeLessThan(1.2);
  });

  it("sequência alta prefere pares próximos", () => {
    const pool = [1, 2, 4, 8, 16, 32, 64, 128, 130].map(v => eleito({ votos: v }));
    const rnd = aleatorio("dif");
    for (let i = 0; i < 50; i++) {
      const par = sortearPar(pool, CRITERIOS[0], 15, rnd, pool[8]);
      if (!par) throw new Error("sem par");
      expect(razao(par[0].votos as number, par[1].votos as number)).toBeLessThanOrEqual(razaoMaxima(15));
    }
  });

  it("razão com zero", () => {
    expect(razao(0, 5)).toBe(Number.POSITIVE_INFINITY);
    expect(razao(2, 8)).toBe(4);
  });
});
