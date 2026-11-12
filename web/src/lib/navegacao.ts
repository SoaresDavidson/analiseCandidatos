import { createContext, useContext } from "react";

// Antes, cada painel era um iframe e pedia ao painel principal por postMessage.
// Agora os painéis chamam estas funções direto; o App as fornece.
export interface Navegacao {
  /** Abre a ficha de um eleito por cima da página atual. Com `uf`, busca nas fichas do país
   *  (um arquivo por estado); sem, nas dos 6 estados das páginas ainda no recorte original. */
  abrirCandidato(ano: number, sq: number, uf?: string): void;
  /** Vai para a página do município (código IBGE de 7 dígitos). */
  abrirMunicipio(cod: number | string): void;
  /** Volta à lista de municípios de um estado. */
  abrirEstado(uf: string): void;
}

export const NavegacaoContexto = createContext<Navegacao | null>(null);

export function useNavegacao(): Navegacao {
  const nav = useContext(NavegacaoContexto);
  if (!nav) throw new Error("useNavegacao fora do <NavegacaoContexto.Provider>");
  return nav;
}
