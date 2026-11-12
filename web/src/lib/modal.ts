/**
 * Há um diálogo modal aberto por cima da página? Enquanto houver, os atalhos de teclado da
 * página (setas que trocam de pergunta, código da Arena) ficam desligados: as teclas são dele.
 */
export const modalAberto = (): boolean => !!document.querySelector('[role="dialog"][aria-modal="true"]');
