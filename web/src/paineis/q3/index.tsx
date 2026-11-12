import { useMemo, useState } from "react";
import { BuscaComLista, Campo, Carregando, Etiqueta, Pagina, SeletorUf, VerMais } from "../../componentes";
import { useDados } from "../../lib/dados";
import { noLugar, semAcento } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import { montarMunicipios } from "./calculo";
import { MapaPartidos } from "./MapaPartidos";
import { Potes, type Riqueza } from "./Potes";
import { corPartido } from "./partidos";
import type { DadosQ3, Municipio } from "./tipos";
import { VerMaisQ3 } from "./VerMaisQ3";

interface Estado {
  uf: string;
  sel: number | null;
  riqueza: Riqueza;
}

export default function Painel() {
  const { dados } = useDados<DadosQ3>("q3.json");
  if (!dados) return <Carregando />;
  return <Q3 D={dados} />;
}

function Q3({ D }: { D: DadosQ3 }) {
  const [st, setSt] = usePersistente<Estado>("q3-brasil", { uf: "TODAS", sel: null, riqueza: "pib" });
  const [busca, setBusca] = useState("");
  const todos = useMemo(() => montarMunicipios(D), [D]);
  const xs = useMemo(() => todos.filter(m => st.uf === "TODAS" || m.uf === st.uf), [todos, st.uf]);
  const sel = useMemo(() => (st.sel == null ? null : (todos.find(m => m.cod === st.sel) ?? null)), [todos, st.sel]);
  const achados = useMemo(() => {
    const q = semAcento(busca.trim());
    if (q.length < 3) return null;
    // nome igual ao digitado primeiro, depois os que começam com ele; no empate, a cidade maior
    const ordem = (m: Municipio) => (m.busca === q ? 0 : m.busca.startsWith(q) ? 1 : 2);
    return todos
      .filter(m => m.busca.includes(q))
      .sort((a, b) => ordem(a) - ordem(b) || (b.pop ?? 0) - (a.pop ?? 0))
      .slice(0, 12);
  }, [todos, busca]);
  const onde = noLugar(st.uf);

  return (
    <Pagina
      filtros={
        <>
          <Campo rotulo="Onde">
            <SeletorUf brasil value={st.uf} onChange={ev => setSt(s => ({ ...s, uf: ev.target.value, sel: null }))} />
          </Campo>
          <Campo rotulo="Ir para uma cidade" grupo>
            <BuscaComLista<Municipio>
              texto={busca}
              aoDigitar={setBusca}
              achados={achados}
              chave={m => m.cod}
              rotulo={m => (
                <>
                  <b>{m.nome}</b> ({m.uf})
                </>
              )}
              aoEscolher={m => setSt(s => ({ ...s, uf: m.uf, sel: m.cod }))}
              vazio="Nenhuma cidade com esse nome"
              placeholder="Digite o nome (3 letras ou mais)"
              ariaLabel="Buscar cidade pelo nome"
              className="w-[min(320px,80vw)]"
            />
          </Campo>
        </>
      }
    >
      <Etiqueta>PERGUNTA 3 · ÍNDICES DO MUNICÍPIO</Etiqueta>
      <h1>A cidade mais rica vota diferente?</h1>

      <MapaPartidos
        todos={todos}
        uf={st.uf}
        sel={sel}
        aoEscolherUf={uf => setSt(s => ({ ...s, uf: uf ?? "TODAS", sel: null }))}
        aoEscolherCidade={cod => setSt(s => ({ ...s, sel: cod }))}
      />
      <Potes xs={xs} onde={onde} riqueza={st.riqueza} aoMudar={r => setSt(s => ({ ...s, riqueza: r }))} />

      <VerMaisQ3 xs={xs} onde={onde} corPartido={corPartido} />
      <VerMais titulo="De onde vêm os dados e como calculamos">
        <ul>
          <li>
            <b>Quem venceu:</b> o partido do prefeito eleito e o partido com mais vereadores em 2024 (TSE, cadastro de
            candidaturas e resultado da eleição). Cidades com a eleição anulada ou sem resultado publicado aparecem como
            "sem resultado".
          </li>
          <li>
            <b>Riqueza da cidade:</b> PIB por habitante de 2023 (IBGE, PIB dos Municípios), o ano mais próximo da
            eleição, ou a renda domiciliar por pessoa do Censo 2022 (IBGE, SIDRA 10295).
          </li>
          <li>
            <b>No lugar do IDHM:</b> o IDHM municipal só existe até o Censo 2010. Usamos a renda domiciliar por pessoa e
            os anos de estudo do Censo 2022, duas das três dimensões dele.
          </li>
          <li>
            <b>Isentos e eleitores por habitante</b> (nos blocos "ver mais"): isentos = (abstenções + brancos + nulos) ÷
            eleitores aptos, na eleição para prefeito, 1º turno; eleitores por habitante = aptos (TSE) ÷ população
            estimada (IBGE, SIDRA 6579), os dois de 2024.
          </li>
          <li>
            <b>Os 5 potes:</b> as cidades em ordem de riqueza, divididas em 5 grupos do mesmo tamanho. O valor do pote é
            a mediana do grupo: metade das cidades está acima, metade abaixo.
          </li>
          <li>
            <b>Cores:</b> os 5 partidos com mais prefeituras no país têm cor própria; os demais entram como "outros
            partidos", porque num mapa mais de 5 cores vizinhas deixam de ser distinguíveis. O nome do partido aparece
            ao passar o mouse e no relatório da cidade.
          </li>
          <li>
            <b>O que não dá para dizer:</b> é a riqueza da cidade, não o dinheiro das campanhas (esse está nas Perguntas
            1 e 8), e partido igual não quer dizer política igual.
          </li>
          <li>
            <b>Consulta no banco:</b> view <i>q3_municipio</i> em <i>sql/21_q3_indices.sql</i>. Mapas: malhas do IBGE (
            <i>scripts/gerar_malhas_web.py</i>).
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}
