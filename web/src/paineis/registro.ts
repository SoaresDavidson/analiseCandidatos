import { type ComponentType, type LazyExoticComponent, lazy } from "react";
import type { PainelProps } from "./tipos";

// Cada painel é carregado só quando aberto (um chunk por painel).
// PARA COLOCAR UMA PERGUNTA NOVA: crie src/paineis/<id>/index.tsx com export default,
// acrescente a página no tema certo aqui e marque `aba` no cartão dela em inicio/cartoes.ts.

export interface PaginaPainel {
  id: string;
  n?: number;
  nome: string;
  Componente: LazyExoticComponent<ComponentType<PainelProps>>;
}
export interface Tema {
  id: string;
  nome: string;
  paginas: PaginaPainel[];
}

export const TEMAS: Tema[] = [
  {
    id: "cidades",
    nome: "Cidades",
    paginas: [
      { id: "q7", n: 7, nome: "Para que lado vota", Componente: lazy(() => import("./q7")) },
      { id: "q3", n: 3, nome: "Riqueza × quem vence", Componente: lazy(() => import("./q3")) },
      { id: "q4", n: 4, nome: "Escolaridade", Componente: lazy(() => import("./q4")) },
      { id: "q6", n: 6, nome: "Idade e alternância", Componente: lazy(() => import("./q6")) },
      { id: "municipios", nome: "Explorar municípios", Componente: lazy(() => import("./municipios")) },
    ],
  },
  {
    id: "dinheiro",
    nome: "Dinheiro",
    paginas: [
      { id: "q8", n: 8, nome: "Fundo público", Componente: lazy(() => import("./q8")) },
      { id: "q9", n: 9, nome: "Propaganda", Componente: lazy(() => import("./q9")) },
      { id: "q2", n: 2, nome: "Patrimônio", Componente: lazy(() => import("./q2")) },
    ],
  },
  {
    id: "politicos",
    nome: "Políticos",
    paginas: [
      { id: "q10", n: 10, nome: "Carreira", Componente: lazy(() => import("./q10")) },
      { id: "candidatos", nome: "Quem são os eleitos", Componente: lazy(() => import("./candidatos")) },
      { id: "plenarios", nome: "Plenários", Componente: lazy(() => import("./plenarios")) },
    ],
  },
];

/** Páginas fora das abas de tema: a Arena abre pela aba ⚔ na faixa do topo, por link ou pelo
 *  segredo (código Konami ou 5 cliques no logo). */
export const ESCONDIDAS: PaginaPainel[] = [{ id: "arena", nome: "Arena", Componente: lazy(() => import("./arena")) }];

export const PAGINAS = TEMAS.flatMap(t => t.paginas.map(p => ({ ...p, tema: t })));
export type PaginaComTema = (typeof PAGINAS)[number];

/** A ficha de um eleito, aberta por cima de qualquer página (exportada pelo painel de candidatos). */
export const FichaEleito = lazy(() => import("./candidatos/FichaEleito"));
