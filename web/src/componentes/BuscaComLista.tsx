import { type Key, type ReactNode, useEffect, useRef, useState } from "react";

/** Campo de busca com a lista de achados embaixo. O texto fica com quem usa (pode filtrar
 *  outra coisa também); a lista abre ao digitar e fecha ao escolher, com Esc ou ao clicar
 *  fora. Enter escolhe o primeiro achado. */
export function BuscaComLista<T>({
  texto,
  aoDigitar,
  achados,
  chave,
  rotulo,
  aoEscolher,
  vazio,
  id,
  placeholder,
  ariaLabel,
  className = "",
  campoClassName = "entrada w-full",
  alturaLista = "max-h-80",
}: {
  texto: string;
  aoDigitar: (texto: string) => void;
  /** null mantém a lista fechada (ex.: menos de 3 letras) */
  achados: readonly T[] | null;
  chave: (t: T) => Key;
  rotulo: (t: T) => ReactNode;
  aoEscolher: (t: T) => void;
  /** o que mostrar sem achados; sem ele, a lista vazia nem abre */
  vazio?: ReactNode;
  id?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  campoClassName?: string;
  alturaLista?: string;
}) {
  const [aberta, setAberta] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fora = (ev: MouseEvent) => {
      if (!raiz.current?.contains(ev.target as Node)) setAberta(false);
    };
    document.addEventListener("click", fora);
    return () => document.removeEventListener("click", fora);
  }, []);

  const escolher = (t: T) => {
    aoEscolher(t);
    aoDigitar("");
    setAberta(false);
  };
  const mostra = aberta && achados != null && (achados.length > 0 || vazio != null);

  return (
    <div ref={raiz} className={`relative ${className}`}>
      <input
        id={id}
        type="search"
        value={texto}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        className={campoClassName}
        onChange={e => {
          aoDigitar(e.target.value);
          setAberta(true);
        }}
        onKeyDown={e => {
          if (e.key === "Enter" && mostra && achados?.[0] !== undefined) escolher(achados[0]);
          if (e.key === "Escape") setAberta(false);
        }}
      />
      {mostra && (
        <div
          className={`absolute inset-x-0 top-[calc(100%+4px)] z-[6] overflow-y-auto rounded-lg border-2 border-ouro bg-white shadow-[0_8px_20px_rgb(0_0_0/.12)] ${alturaLista}`}
        >
          {achados.length ? (
            achados.map(t => (
              <button
                key={chave(t)}
                type="button"
                onClick={() => escolher(t)}
                className="block w-full cursor-pointer border-0 border-b border-linha bg-white px-3 py-2 text-left hover:bg-ouro-claro focus-visible:bg-ouro-claro"
              >
                {rotulo(t)}
              </button>
            ))
          ) : (
            <p className="p-2.5">{vazio}</p>
          )}
        </div>
      )}
    </div>
  );
}
