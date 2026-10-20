// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { UIEvent } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { useRecolheAoRolar } from "../../src/lib/useRecolheAoRolar";

afterEach(cleanup);

const rola = (y: number) => ({ currentTarget: { scrollTop: y } }) as unknown as UIEvent<HTMLElement>;

describe("useRecolheAoRolar", () => {
  it("recolhe ao descer, volta ao subir e perto do topo", () => {
    const { result } = renderHook(() => useRecolheAoRolar("q7"));
    act(() => result.current[1](rola(200)));
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](rola(150)));
    expect(result.current[0]).toBe(false);
    act(() => result.current[1](rola(400)));
    act(() => result.current[1](rola(20)));
    expect(result.current[0]).toBe(false);
  });

  it("ignora tremidas pequenas", () => {
    const { result } = renderHook(() => useRecolheAoRolar("q7"));
    act(() => result.current[1](rola(200)));
    act(() => result.current[1](rola(197)));
    expect(result.current[0]).toBe(true);
  });

  it("trocar de página mostra o cabeçalho de novo", () => {
    const { result, rerender } = renderHook(({ p }) => useRecolheAoRolar(p), { initialProps: { p: "q7" } });
    act(() => result.current[1](rola(300)));
    expect(result.current[0]).toBe(true);
    rerender({ p: "q8" });
    expect(result.current[0]).toBe(false);
  });
});
