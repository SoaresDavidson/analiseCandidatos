import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCAVEIS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Janela por cima da página: fecha com Esc, no X ou clicando fora; o foco fica preso dentro e volta ao sair. */
export function Janela({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: ReactNode }) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const antes = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const el = caixa.current;
    el?.focus();
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") aoFechar();
      if (ev.key !== "Tab" || !el) return;
      const focaveis = [...el.querySelectorAll<HTMLElement>(FOCAVEIS)];
      const primeiro = focaveis[0],
        ultimo = focaveis[focaveis.length - 1];
      if (!primeiro) return;
      if (ev.shiftKey && (document.activeElement === primeiro || document.activeElement === el)) {
        ev.preventDefault();
        ultimo.focus();
      } else if (!ev.shiftKey && document.activeElement === ultimo) {
        ev.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", tecla);
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = rolagem;
      antes?.focus();
    };
  }, [aoFechar]);

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: clicar no véu fecha; o teclado usa Esc e o botão Fechar
    <div
      className="janela-veu fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/55 p-3"
      onMouseDown={ev => {
        if (ev.target === ev.currentTarget) aoFechar();
      }}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="janela-caixa relative grid w-full max-w-[900px] gap-3.5 rounded-caixa bg-branco px-5 pt-6 pb-5 shadow-[0_20px_60px_rgb(0_0_0/0.35)] outline-none"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={aoFechar}
          className="absolute top-3 right-3 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-bege text-[22px] leading-none font-bold hover:bg-ouro"
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
