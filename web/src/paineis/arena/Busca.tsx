import { useMemo, useState } from "react";
import { BuscaComLista } from "../../componentes";
import { semAcento } from "../../lib/uf";
import { CARGO } from "./jogo";
import type { CartaEleito } from "./tipos";

/** Campo de busca de eleito pelo nome (3 letras ou mais) com lista de até 8 achados. */
export function Busca({ cartas, aoEscolher }: { cartas: CartaEleito[]; aoEscolher: (t: CartaEleito) => void }) {
  const [texto, setTexto] = useState("");
  const achados = useMemo(() => {
    const q = semAcento(texto.trim());
    if (q.length < 3) return null;
    const partes = q.split(/\s+/);
    return cartas
      .filter(t => partes.every(p => t.busca.includes(p)))
      .sort((x, y) => (y.votos || 0) - (x.votos || 0))
      .slice(0, 8);
  }, [texto, cartas]);

  return (
    <BuscaComLista
      texto={texto}
      aoDigitar={setTexto}
      achados={achados}
      chave={t => t.i}
      rotulo={t => (
        <>
          <b>{t.nome}</b>{" "}
          <small className="text-texto-2">
            {CARGO[t.cargo]} · {t.partido} · {t.uf} · {t.ano}
          </small>
        </>
      )}
      aoEscolher={aoEscolher}
      vazio="Ninguém com esse nome entre os eleitos."
      placeholder="Buscar eleito pelo nome"
      alturaLista="max-h-[300px]"
    />
  );
}
