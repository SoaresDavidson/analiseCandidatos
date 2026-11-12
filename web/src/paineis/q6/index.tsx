import { useMemo } from "react";
import { Carregando, Etiqueta, Pagina } from "../../componentes";
import { useDados } from "../../lib/dados";
import { nomeLugar } from "../../lib/formato";
import { semAcento } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import { doFiltro } from "./calculo";
import { Metodo } from "./Metodo";
import { Palco } from "./Palco";
import { Respostas } from "./Respostas";
import type { DadosQ6, Filtros, Municipio } from "./tipos";

const PADRAO: Filtros = { uf: null, sel: null };

export default function Painel() {
  const { dados, erro } = useDados<DadosQ6>("q6.json");
  if (!dados) return <Carregando erro={erro} />;
  return <Conteudo D={dados} />;
}

function Conteudo({ D }: { D: DadosQ6 }) {
  const [salvo, setF] = usePersistente<Filtros>("q6-brasil", PADRAO);
  const M = useMemo<Municipio[]>(
    () =>
      D.municipios.map(r => ({
        cod: r[0],
        nome: nomeLugar(r[1]),
        uf: D.ufs[r[2]],
        cap: !!r[3],
        pop: r[4],
        idade: r[5],
        terco: r[6],
        tercoUf: r[7],
        aptos: r[8],
        idEl: r[9],
        idVer: r[10],
        pjVer: r[11],
        idPref: r[12],
        sg: r[13],
        troca: r[14],
        conc: r[15],
        reel: r[16],
        voto: r[17],
        busca: semAcento(r[1]),
      })),
    [D],
  );
  // valor salvo de outra versão: estado que não existe volta para o Brasil
  const f: Filtros = salvo.uf && !D.ufs.includes(salvo.uf) ? PADRAO : salvo;
  const escopo = useMemo(() => doFiltro(M, f.uf), [M, f.uf]);

  return (
    <Pagina>
      <Etiqueta>PERGUNTA 6 · IDADE</Etiqueta>
      <h1>Jovem vota em jovem? E velho, em velho?</h1>
      <Palco D={D} M={M} f={f} aoMudar={p => setF(s => ({ ...s, ...p }))} />
      <Respostas D={D} escopo={escopo} f={f} />
      <Metodo />
    </Pagina>
  );
}
