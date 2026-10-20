import { afterEach, describe, expect, it, vi } from "vitest";
import { carregarDados, urlDados, urlFoto } from "../../src/lib/dados";

afterEach(() => vi.unstubAllGlobals());

const resposta = (corpo: unknown, ok = true) =>
  Promise.resolve({ ok, status: ok ? 200 : 404, json: () => Promise.resolve(corpo) });

describe("endereços", () => {
  it("ficam relativos à base do app", () => {
    expect(urlDados("q8.json")).toBe(`${import.meta.env.BASE_URL}dados/q8.json`);
    expect(urlFoto(2024, 123)).toBe(`${import.meta.env.BASE_URL}fotos/2024/123.jpg`);
  });
});

describe("carregarDados", () => {
  it("busca cada arquivo uma vez só", async () => {
    const fetch = vi.fn(() => resposta({ a: 1 }));
    vi.stubGlobal("fetch", fetch);
    const [x, y] = await Promise.all([carregarDados("um.json"), carregarDados("um.json")]);
    expect(x).toEqual({ a: 1 });
    expect(y).toBe(x);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("não guarda o erro: a próxima chamada tenta de novo", async () => {
    const fetch = vi
      .fn()
      .mockReturnValueOnce(resposta(null, false))
      .mockReturnValueOnce(resposta([1]));
    vi.stubGlobal("fetch", fetch);
    await expect(carregarDados("dois.json")).rejects.toThrow("dois.json: HTTP 404");
    await expect(carregarDados("dois.json")).resolves.toEqual([1]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
