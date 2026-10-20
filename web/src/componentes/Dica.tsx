import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Balão que segue o mouse sobre gráficos e mapas. Um só para o app inteiro:
// os painéis chamam useDica().mostrar(evento, conteúdo) e .esconder().

interface Ponto {
  clientX: number;
  clientY: number;
}
export interface DicaApi {
  mostrar(ev: Ponto, conteudo: ReactNode): void;
  esconder(): void;
}

const DicaContexto = createContext<DicaApi | null>(null);

export function useDica(): DicaApi {
  const api = useContext(DicaContexto);
  if (!api) throw new Error("useDica fora do <ProvedorDica>");
  return api;
}

export function ProvedorDica({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<{ conteudo: ReactNode; x: number; y: number } | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const mostrar = useCallback(
    (ev: Ponto, conteudo: ReactNode) => setEstado({ conteudo, x: ev.clientX, y: ev.clientY }),
    [],
  );
  const esconder = useCallback(() => setEstado(null), []);
  const api = useMemo(() => ({ mostrar, esconder }), [mostrar, esconder]);

  // posiciona depois de medir: vira para o outro lado do cursor se fosse sair da tela
  useLayoutEffect(() => {
    const el = caixa.current;
    if (!el || !estado) return;
    const w = el.offsetWidth,
      h = el.offsetHeight;
    let x = estado.x + 14,
      y = estado.y + 14;
    if (x + w > innerWidth - 8) x = estado.x - w - 14;
    if (y + h > innerHeight - 8) y = estado.y - h - 14;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, [estado]);

  return (
    <DicaContexto.Provider value={api}>
      {children}
      {estado && (
        <div
          ref={caixa}
          role="tooltip"
          className="pointer-events-none fixed z-[70] max-w-[280px] rounded-lg bg-texto px-[11px] py-2 text-[13px] leading-[1.45] text-white shadow-dica"
        >
          {estado.conteudo}
        </div>
      )}
    </DicaContexto.Provider>
  );
}
