// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { irPara, useHash } from "../../src/lib/useHash";

afterEach(() => {
  cleanup();
  location.hash = "";
});

describe("useHash", () => {
  it("sem # é o início", () => {
    const { result } = renderHook(() => useHash());
    expect(result.current).toEqual(["inicio", undefined]);
  });

  it("separa a página do extra e acompanha a navegação", () => {
    const { result } = renderHook(() => useHash());
    act(() => {
      irPara("municipios/2111300");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(result.current).toEqual(["municipios", "2111300"]);
  });
});
