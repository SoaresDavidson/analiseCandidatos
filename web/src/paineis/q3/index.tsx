import { useMemo } from "react";
import { Alternador, Campo, Carregando, Etiqueta, Pagina, Seletor } from "../../componentes";
import { COR_SEM_NOTA, corEspectro } from "../../lib/espectro";
import { useDados } from "../../lib/dados";
import { usePersistente } from "../../lib/usePersistente";
import type { PainelProps } from "../tipos";
import { INDICES, montarMunicipios, UF_NOME } from "./calculo";
import { Dispersao } from "./Dispersao";
import { Resposta } from "./Resposta";
import type { ChaveIndice, DadosQ3, Filtros } from "./tipos";
import { VerMaisQ3 } from "./VerMaisQ3";

const OPCOES_INDICE: readonly (readonly [ChaveIndice, string])[] = [
  ["pib", "PIB per capita"], ["renda", "Renda (Censo)"], ["isentos", "Isentos"], ["eleitores", "Eleitores por habitante"],
];

export default function Painel(_: PainelProps) {
  const { dados } = useDados<DadosQ3>("q3.json");
  if (!dados) return <Carregando />;
  return <Q3 D={dados} />;
}

function Q3({ D }: { D: DadosQ3 }) {
  const [st, setSt] = usePersistente<Filtros>("q3-tse", { uf: "TODAS", indice: "pib", sel: null });
  const todos = useMemo(() => montarMunicipios(D), [D]);
  const xs = useMemo(() => todos.filter(m => st.uf === "TODAS" || m.uf === st.uf), [todos, st.uf]);
  const indice = INDICES[st.indice] ?? INDICES.pib;
  const corPartido = (sg: string) => { const p = D.partidos[sg]; return p ? corEspectro(p[0]) : COR_SEM_NOTA; };
  const onde = st.uf === "TODAS" ? "nos 6 estados" : (["AM", "MA", "MT", "RS"].includes(st.uf) ? "no " : "em ") + UF_NOME[st.uf];

  const filtros = (
    <>
      <Campo rotulo="Estado">
        <Seletor value={st.uf} onChange={ev => setSt(s => ({ ...s, uf: ev.target.value, sel: null }))}>
          <option value="TODAS">Todos os 6 estados</option>
          {D.ufs.map(u => <option key={u} value={u}>{UF_NOME[u]}</option>)}
        </Seletor>
      </Campo>
      <span className="grid gap-[3px] text-[13px] font-bold">
        Índice da cidade
        <Alternador rotulo="Índice da cidade" opcoes={OPCOES_INDICE} valor={st.indice} aoMudar={v => setSt(s => ({ ...s, indice: v }))} />
      </span>
    </>
  );

  return (
    <Pagina filtros={filtros}>
      <Etiqueta>PERGUNTA 3 · ÍNDICES DO MUNICÍPIO</Etiqueta>
      <h1>A cidade mais rica vota diferente?</h1>
      <p className="texto-enunciado">Enunciado: quais os índices de dado município (PIB per capita, IDHM, eleitores por população total, isentos = votos brancos + nulos + abstenções) com relação aos eleitos/partidos mais vitoriosos? [2024]</p>

      <Resposta xs={xs} indice={indice} onde={onde} corPartido={corPartido} />
      <Dispersao
        indice={indice} chaveIndice={st.indice} todos={todos} filtrados={xs} sel={st.sel} meio={D.regua[2]}
        aoSelecionar={cod => setSt(s => ({ ...s, sel: cod }))} corPartido={corPartido}
      />
      <VerMaisQ3 xs={xs} onde={onde} corPartido={corPartido} />
    </Pagina>
  );
}
