import { useEffect, useMemo, useRef, useState } from "react";
import { CARGO, semAcento } from "./jogo";
import type { CartaEleito } from "./tipos";

/** Campo de busca de eleito pelo nome (3 letras ou mais) com lista de até 8 achados. */
export function Busca({ cartas, aoEscolher }: { cartas: CartaEleito[]; aoEscolher: (t: CartaEleito) => void }) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  // clicar fora da busca fecha a lista
  useEffect(() => {
    const fora = (ev: MouseEvent) => { if (!raiz.current?.contains(ev.target as Node)) setAberto(false); };
    document.addEventListener("click", fora);
    return () => document.removeEventListener("click", fora);
  }, []);

  const achados = useMemo(() => {
    const q = semAcento(texto.trim());
    if (q.length < 3) return null;
    const partes = q.split(/\s+/);
    return cartas.filter(t => partes.every(p => t.busca.includes(p))).sort((x, y) => (y.votos || 0) - (x.votos || 0)).slice(0, 8);
  }, [texto, cartas]);

  return (
    <div ref={raiz} className="relative">
      <input
        type="search"
        value={texto}
        placeholder="Buscar eleito pelo nome"
        autoComplete="off"
        onChange={e => { setTexto(e.target.value); setAberto(true); }}
        className="entrada w-full"
      />
      {aberto && achados && (
        <div className="absolute inset-x-0 top-[calc(100%+4px)] z-[6] max-h-[300px] overflow-y-auto rounded-lg border-2 border-ouro bg-white shadow-[0_8px_20px_rgb(0_0_0/.12)]">
          {achados.length ? achados.map(t => (
            <button
              key={t.i}
              type="button"
              onClick={() => { aoEscolher(t); setTexto(""); setAberto(false); }}
              className="block w-full cursor-pointer border-0 border-b border-linha bg-white px-3 py-2 text-left hover:bg-ouro-claro"
            >
              <b>{t.nome}</b> <small className="text-texto-2">{CARGO[t.cargo]} · {t.partido} · {t.uf} · {t.ano}</small>
            </button>
          )) : <p className="p-2">Ninguém com esse nome entre os eleitos.</p>}
        </div>
      )}
    </div>
  );
}
