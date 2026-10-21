import { useState } from "react";
import { urlFoto } from "../lib/dados";

/** Foto 3x4 do registro no TSE; sem foto, mostra a inicial do nome. */
export function FotoEleito({
  ano,
  sq,
  nome,
  className = "size-11",
}: {
  ano: number;
  sq: number | string;
  nome: string;
  className?: string;
}) {
  const [falhou, setFalhou] = useState(false);
  return (
    <div
      className={`grid flex-none place-items-center overflow-hidden rounded-full bg-bege font-extrabold text-texto-2 ${className}`}
    >
      {falhou ? (
        (nome[0] || "?").toUpperCase()
      ) : (
        <img
          src={urlFoto(ano, sq)}
          alt={`Foto de ${nome}`}
          loading="lazy"
          className="size-full object-cover object-top"
          onError={() => setFalhou(true)}
        />
      )}
    </div>
  );
}
