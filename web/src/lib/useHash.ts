import { useSyncExternalStore } from "react";

// O endereço fica no # (#q7, #municipios/2111300...): funciona aberto de qualquer
// pasta, sem servidor reescrever rotas, e o botão voltar do navegador anda entre páginas.
const assinar = (aviso: () => void) => {
  window.addEventListener("hashchange", aviso);
  return () => window.removeEventListener("hashchange", aviso);
};

/** [id, extra] do endereço: "#municipios/MA" -> ["municipios", "MA"]; vazio -> ["inicio", undefined]. */
export function useHash(): [string, string | undefined] {
  const hash = useSyncExternalStore(assinar, () => location.hash);
  const [id, extra] = (hash || "#inicio").slice(1).split("/");
  return [id || "inicio", extra];
}

export const irPara = (destino: string) => { location.hash = `#${destino}`; };
