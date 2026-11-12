import { useEffect, useState } from "react";
import { carregarDados } from "../../lib/dados";
import { type AnoFin, anosFin, type Pessoa } from "./logica";
import type { DadosQ10, ParteFin } from "./tipos";

export interface Financas {
  /** null enquanto carrega (ou se falhar) */
  anos: AnoFin[] | null;
  falhou: boolean;
}

/** Patrimônio e campanha da pessoa aberta. Os dados vêm de q10-financas/NN.json, buscado só quando preciso. */
export function useFinancas(D: DadosQ10, p: Pessoa): Financas {
  const [estado, setEstado] = useState<{ id: number; anos: AnoFin[] | null; erro: boolean }>({
    id: -1,
    anos: null,
    erro: false,
  });
  useEffect(() => {
    let vivo = true;
    const nn = String(p.id % D.fin.partes).padStart(2, "0");
    carregarDados<ParteFin>(`q10-financas/${nn}.json`).then(
      parte => vivo && setEstado({ id: p.id, anos: anosFin(D, parte[p.id] || []), erro: false }),
      () => vivo && setEstado({ id: p.id, anos: null, erro: true }),
    );
    return () => {
      vivo = false;
    };
  }, [D, p.id]);
  return estado.id === p.id ? { anos: estado.anos, falhou: estado.erro } : { anos: null, falhou: false };
}
