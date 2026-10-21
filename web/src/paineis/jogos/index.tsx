import { type ComponentType, type LazyExoticComponent, lazy, Suspense } from "react";
import { Carregando } from "../../componentes";
import type { PainelProps } from "../tipos";

// Hub dos jogos (inspirado no pokedle.net): um cartão grande por jogo. Cada jogo mora na
// própria pasta e abre por #jogos/<id>; sem id (ou id desconhecido), mostra o hub.

interface Jogo {
  id: string;
  nome: string;
  chamada: string;
  icone: string;
  /** null: jogo só na ideia (aparece bloqueado) */
  Componente: LazyExoticComponent<ComponentType> | null;
}

const JOGOS: Jogo[] = [
  {
    id: "politicodle",
    nome: "Politicodle",
    chamada: "Adivinhe o eleito do dia com pistas a cada tentativa",
    icone: "🗳️",
    Componente: lazy(() => import("./politicodle")),
  },
  {
    id: "akinator",
    nome: "Akinator",
    chamada: "Pense num eleito: eu adivinho em poucas perguntas",
    icone: "🔮",
    Componente: lazy(() => import("./akinator")),
  },
  {
    id: "quem-ganha",
    nome: "Quem ganha?",
    chamada: "Dois eleitos, um número: aposte em quem tem mais",
    icone: "⚖️",
    Componente: lazy(() => import("./quem-ganha")),
  },
  {
    id: "candidatura",
    nome: "Monte sua candidatura",
    chamada: "Escolha suas propostas e veja onde você seria eleito",
    icone: "📣",
    Componente: lazy(() => import("./candidatura")),
  },
  {
    id: "roubou",
    nome: "Quem roubou mais?",
    chamada: "Em breve: falta uma base de processos e condenações",
    icone: "🕵️",
    Componente: null,
  },
];

export default function Painel({ extra }: PainelProps) {
  const jogo = JOGOS.find(j => j.id === extra && j.Componente);
  if (jogo?.Componente) {
    return (
      <div className="pagina">
        <div className="mx-auto max-w-pagina px-5 pt-4">
          <a href="#jogos" className="text-[13.5px] font-bold text-verde-esc no-underline hover:underline">
            ‹ todos os jogos
          </a>
        </div>
        <Suspense fallback={<Carregando />}>
          <jogo.Componente />
        </Suspense>
      </div>
    );
  }
  return <Hub />;
}

function Hub() {
  return (
    <div className="mx-auto grid max-w-[620px] gap-4 px-5 pt-[26px] pb-14">
      <h1 className="text-center motion-safe:animate-sobe">Jogos com os eleitos</h1>
      <p className="text-center text-texto-2 motion-safe:animate-sobe motion-safe:[animation-delay:.06s]">
        Os mesmos 14 mil eleitos de 2022 e 2024 dos painéis, agora para brincar.
      </p>
      {JOGOS.map((j, i) => {
        const corpo = (
          <>
            <span className="text-[26px] font-extrabold tracking-[.04em] uppercase">{j.nome}</span>
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid size-9 flex-none place-items-center rounded-full bg-bege text-xl"
              >
                {j.icone}
              </span>
              <span
                className={`flex-1 rounded-full border-2 px-3.5 py-1 text-[14px] font-bold ${j.Componente ? "border-verde-esc bg-verde-claro text-verde-esc" : "border-linha bg-bege text-texto-2"}`}
              >
                {j.chamada}
              </span>
            </span>
          </>
        );
        const classe =
          "grid gap-2 rounded-caixa border-4 px-6 py-4 no-underline shadow-cartao motion-safe:animate-sobe";
        const atraso = { animationDelay: `${0.1 + i * 0.06}s` };
        return j.Componente ? (
          <a
            key={j.id}
            href={`#jogos/${j.id}`}
            style={atraso}
            className={`${classe} border-verde-esc bg-ouro-claro transition-[transform,box-shadow] duration-200 hover:shadow-[0_0_0_3px_var(--color-ouro)] motion-safe:hover:-translate-y-[3px]`}
          >
            {corpo}
          </a>
        ) : (
          <div key={j.id} style={atraso} className={`${classe} border-linha bg-branco opacity-70`} aria-disabled="true">
            {corpo}
          </div>
        );
      })}
    </div>
  );
}
