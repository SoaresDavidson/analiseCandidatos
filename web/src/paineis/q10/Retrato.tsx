import { FotoEleito } from "../../componentes";
import type { Foto } from "./logica";

/** Foto do registro no TSE; sem foto casada (ou se o arquivo faltar), a inicial do nome. */
export function Retrato({ foto, nome, className }: { foto: Foto | null; nome: string; className: string }) {
  if (foto) return <FotoEleito key={foto.sq} grande ano={foto.ano} sq={foto.sq} nome={nome} className={className} />;
  return (
    <div
      aria-hidden="true"
      className={`grid flex-none place-items-center overflow-hidden rounded-full bg-bege font-extrabold text-texto-2 ${className}`}
    >
      {(nome[0] || "?").toUpperCase()}
    </div>
  );
}
