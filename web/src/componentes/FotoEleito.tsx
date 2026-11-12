import { useState } from "react";
import { urlFoto, urlFotoGrande } from "../lib/dados";

/** Foto 3x4 do registro no TSE; sem foto, mostra a inicial do nome. */
export function FotoEleito({
  ano,
  sq,
  nome,
  className = "size-11",
  grande,
}: {
  ano: number;
  sq: number | string;
  nome: string;
  className?: string;
  /** retrato em destaque: usa a foto no tamanho do TSE e, se ela não foi baixada, a pequena */
  grande?: boolean;
}) {
  // 0 = a foto pedida; 1 = a pequena no lugar da grande; 2 = sem foto (a inicial)
  const [tentativa, setTentativa] = useState(grande ? 0 : 1);
  const falhou = tentativa > 1;
  return (
    <div
      className={`grid flex-none place-items-center overflow-hidden rounded-full bg-bege font-extrabold text-texto-2 ${className}`}
    >
      {falhou ? (
        (nome[0] || "?").toUpperCase()
      ) : (
        <img
          src={tentativa === 0 ? urlFotoGrande(ano, sq) : urlFoto(ano, sq)}
          alt={`Foto de ${nome}`}
          loading="lazy"
          className="size-full object-cover object-top"
          onError={() => setTentativa(t => t + 1)}
        />
      )}
    </div>
  );
}
