// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { usePersistente } from "../../src/lib/usePersistente";

// sem globals no Vitest, a Testing Library não desmonta sozinha entre os testes
afterEach(cleanup);

beforeEach(() => localStorage.clear());

describe("usePersistente", () => {
  it("começa do padrão e grava cada mudança", () => {
    const { result } = renderHook(() => usePersistente("t", { uf: "TODAS", ano: 2024 }));
    expect(result.current[0]).toEqual({ uf: "TODAS", ano: 2024 });
    act(() => result.current[1](f => ({ ...f, uf: "MA" })));
    expect(JSON.parse(localStorage.getItem("t")!)).toEqual({ uf: "MA", ano: 2024 });
  });

  it("junta o salvo com campos novos do padrão", () => {
    localStorage.setItem("t", JSON.stringify({ uf: "RS" }));
    const { result } = renderHook(() => usePersistente("t", { uf: "TODAS", ano: 2024 }));
    expect(result.current[0]).toEqual({ uf: "RS", ano: 2024 });
  });

  it("ignora JSON quebrado", () => {
    localStorage.setItem("t", "{quebrado");
    const { result } = renderHook(() => usePersistente("t", { uf: "TODAS" }));
    expect(result.current[0]).toEqual({ uf: "TODAS" });
  });
});
