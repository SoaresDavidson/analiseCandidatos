// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { UIEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRecolheAoRolar } from "../../src/lib/useRecolheAoRolar";

afterEach(cleanup);

// página alta por padrão (rola 2.000 px); `max` simula página curta
const rola = (y: number, max = 2000) =>
  ({ currentTarget: { scrollTop: y, scrollHeight: max + 800, clientHeight: 800 } }) as unknown as UIEvent<HTMLElement>;

// cada mudança abre uma janela de 350 ms em que a rolagem é ignorada (o layout se ajustando)
beforeEach(() => vi.useFakeTimers({ toFake: ["performance"] }));
afterEach(() => vi.useRealTimers());
const passa = () => vi.advanceTimersByTime(400);

describe("useRecolheAoRolar", () => {
  it("recolhe ao descer, volta ao subir e perto do topo", () => {
    const { result } = renderHook(() => useRecolheAoRolar("q7"));
    act(() => result.current[1](rola(200)));
    expect(result.current[0]).toBe(true);
    passa();
    act(() => result.current[1](rola(150)));
    expect(result.current[0]).toBe(false);
    passa();
    act(() => result.current[1](rola(400)));
    passa();
    act(() => result.current[1](rola(20)));
    expect(result.current[0]).toBe(false);
  });

  it("ignora tremidas pequenas", () => {
    const { result } = renderHook(() => useRecolheAoRolar("q7"));
    act(() => result.current[1](rola(200)));
    act(() => result.current[1](rola(197)));
    expect(result.current[0]).toBe(true);
  });

  it("ignora o ajuste de posição logo depois de recolher", () => {
    const { result } = renderHook(() => useRecolheAoRolar("q7"));
    act(() => result.current[1](rola(200)));
    // o navegador puxa a posição para cima quando a área cresce: não pode reabrir
    act(() => result.current[1](rola(120)));
    expect(result.current[0]).toBe(true);
  });

  it("página curta nunca recolhe", () => {
    const { result } = renderHook(() => useRecolheAoRolar("q7"));
    act(() => result.current[1](rola(200, 300)));
    expect(result.current[0]).toBe(false);
  });

  it("trocar de página mostra o cabeçalho de novo", () => {
    const { result, rerender } = renderHook(({ p }) => useRecolheAoRolar(p), { initialProps: { p: "q7" } });
    act(() => result.current[1](rola(300)));
    expect(result.current[0]).toBe(true);
    rerender({ p: "q8" });
    expect(result.current[0]).toBe(false);
  });
});
