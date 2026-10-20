import { Chip as ChipBase } from "../../componentes";
import { corEspectro, nomeCategoria } from "../../lib/espectro";
import { fmt } from "../../lib/formato";

/** Sigla do partido na cor do espectro, com a nota no title. */
export function Chip({
  texto,
  nota,
  comTitulo = true,
}: {
  texto: string;
  nota: number | null | undefined;
  comTitulo?: boolean;
}) {
  const titulo = comTitulo ? (nota == null ? "sem nota" : `${fmt(nota, 2)} · ${nomeCategoria(nota)}`) : undefined;
  return (
    <ChipBase cor={corEspectro(nota)} titulo={titulo}>
      {texto}
    </ChipBase>
  );
}

export const ChipCat = ({ nota }: { nota: number | null | undefined }) => (
  <Chip texto={nomeCategoria(nota)} nota={nota} comTitulo={false} />
);
