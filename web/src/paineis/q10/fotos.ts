import { semAcento, UF_NOME } from "../../lib/uf";
import type { DadosCandidatos } from "../candidatos/tipos";
import type { Pessoa } from "./logica";

/** Onde está a foto do registro no TSE: public/fotos/<ano>/<sq>.jpg. */
export interface Foto {
  ano: number;
  sq: number;
}

// nas eleições estaduais o local vem ora como a sigla ("GO"), ora como o nome do estado
const chave = (ano: number, cargo: number, uf: string, local: string, civil: string): string =>
  `${ano}|${cargo}|${uf}|${semAcento(local === uf ? UF_NOME[uf] || uf : local)}|${semAcento(civil)}`;

/**
 * O q10.json não traz o número sequencial do TSE (que dá nome ao arquivo da foto); quem traz é a
 * lista de eleitos de 2022 e 2024. O índice casa as duas pela mesma eleição: ano, cargo, estado,
 * cidade e nome civil. Se duas pessoas diferentes caírem na mesma chave, nenhuma leva foto.
 */
export function indiceFotos(d: DadosCandidatos): Map<string, Foto | null> {
  const indice = new Map<string, Foto | null>();
  d.eleitos.forEach((e, i) => {
    const [local, uf] = d.ues[e[3]].split("|");
    const k = chave(2000 + e[0], e[2], uf, local, e[6]);
    const ja = indice.get(k);
    indice.set(k, ja === undefined || ja?.sq === d.sq[i] ? { ano: 2000 + e[0], sq: d.sq[i] } : null);
  });
  return indice;
}

/** Foto da vitória mais recente que estiver no índice; null se não houver. */
export function fotoDe(p: Pessoa, indice: Map<string, Foto | null>): Foto | null {
  for (let i = p.r.length - 1; i >= 0; i--) {
    const x = p.r[i];
    if (x.res !== 0) continue;
    const foto = indice.get(chave(x.ano, x.cargo, x.uf, x.local, p.civil || p.nome));
    if (foto) return foto;
  }
  return null;
}
