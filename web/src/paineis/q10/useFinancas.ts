import { useEffect, useState } from "react";
import { carregarDados } from "../../lib/dados";
import { type AnoFin, anosFin, type Pessoa } from "./logica";
import type { DadosQ10, ParteFin } from "./tipos";

export interface Financas {
  /** null enquanto carrega (ou se falhar) */
  anos: AnoFin[] | null;
  falhou: boolean;
}

/** Patrimônio e campanha da pessoa aberta. Os dados vêm de q10-financas/<escopo>-NN.json (escopo = a
 *  sigla do estado, ou BR), buscado só quando preciso. */
export function useFinancas(D: DadosQ10, escopo: string, p: Pessoa | undefined): Financas {
  const id = p?.id ?? -1;
  const chave = id < 0 ? "" : `${escopo}|${id}`;
  const [estado, setEstado] = useState<{ id: string; anos: AnoFin[] | null; erro: boolean }>({
    id: "",
    anos: null,
    erro: false,
  });
  useEffect(() => {
    if (id < 0) return;
    let vivo = true;
    const chave = `${escopo}|${id}`;
    const nn = String(id % D.fin.partes).padStart(2, "0");
    carregarDados<ParteFin>(`q10-financas/${escopo}-${nn}.json`).then(
      parte => vivo && setEstado({ id: chave, anos: anosFin(D, parte[id] || []), erro: false }),
      () => vivo && setEstado({ id: chave, anos: null, erro: true }),
    );
    return () => {
      vivo = false;
    };
  }, [D, escopo, id]);
  return chave && estado.id === chave ? { anos: estado.anos, falhou: estado.erro } : { anos: null, falhou: false };
}
