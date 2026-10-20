import { useCallback, useMemo } from "react";
import { Alternador, Campo, Carregando, Etiqueta, Pagina, SeletorUf } from "../../componentes";
import { useDados } from "../../lib/dados";
import { nomeLugar } from "../../lib/formato";
import { semAcento } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import { Alternancia } from "./Alternancia";
import { Dispersao } from "./Dispersao";
import { Eleitos, Metodo } from "./Eleitos";
import { Mapa } from "./Mapa";
import { Resposta } from "./Resposta";
import type { Ano, Corte, DadosQ6, Faixa, Filtros, Municipio } from "./tipos";

const PADRAO: Filtros = { uf: "TODAS", corte: "uf", ano: 2024, faixa: "jovem", mapaUf: "MA", sel: null };

export default function Painel() {
  const { dados } = useDados<DadosQ6>("q6.json");
  if (!dados) return <Carregando />;
  return <Conteudo D={dados} />;
}

function Conteudo({ D }: { D: DadosQ6 }) {
  const [f, setF] = usePersistente<Filtros>("q6-tse", PADRAO);
  const M = useMemo<Municipio[]>(
    () =>
      D.municipios.map(r => ({
        cod: r[0],
        nome: nomeLugar(r[1]),
        uf: D.ufs[r[2]],
        cap: !!r[3],
        pop: r[4],
        idade: r[5],
        pj: r[6],
        pi: r[7],
        terco: r[8],
        tercoUf: r[9],
        aptos: r[10],
        idEl: r[11],
        pjEl: r[12],
        absJ: r[13],
        absNJ: r[14],
        idVer: r[15],
        pjVer: r[16],
        idPref: r[17],
        sg: r[18],
        troca: r[19],
        conc: r[20],
        reel: r[21],
        voto: r[22],
        busca: semAcento(r[1]),
      })),
    [D],
  );
  const ctx = { D, M, f };

  // escolher a cidade leva o mapa ao estado dela; clicar num ponto também rola até o mapa
  const selecionar = useCallback((m: Municipio) => setF(s => ({ ...s, sel: m.cod, mapaUf: m.uf })), [setF]);
  const selecionarERolar = useCallback(
    (m: Municipio) => {
      selecionar(m);
      document.getElementById("q6-mapa")?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [selecionar],
  );

  const filtros = (
    <>
      <Campo rotulo="Estado">
        <SeletorUf
          value={f.uf}
          onChange={e => {
            const uf = e.target.value;
            setF(s => ({ ...s, uf, mapaUf: uf !== "TODAS" ? uf : s.mapaUf, sel: null }));
          }}
        />
      </Campo>
      <Campo rotulo="Comparar cada cidade com" grupo>
        <Alternador<Corte>
          rotulo="Comparar cada cidade com"
          valor={f.corte}
          aoMudar={corte => setF(s => ({ ...s, corte }))}
          opcoes={[
            ["uf", "cidades do mesmo estado"],
            ["todas", "todas as cidades"],
          ]}
        />
      </Campo>
      <Campo rotulo="Eleição municipal" grupo>
        <Alternador<Ano>
          rotulo="Eleição municipal"
          valor={f.ano}
          aoMudar={ano => setF(s => ({ ...s, ano }))}
          opcoes={[
            [2020, "2016 → 2020"],
            [2024, "2020 → 2024"],
          ]}
        />
      </Campo>
    </>
  );

  return (
    <Pagina filtros={filtros}>
      <Etiqueta>PERGUNTA 6 · IDADE E ALTERNÂNCIA DE PODER</Etiqueta>
      <h1>Cidade velha, cidade jovem: muda quem governa?</h1>
      <p className="texto-enunciado">
        Enunciado: idade média do município (mais velho × mais jovem): há alternância de poder? Qual a idade média dos
        eleitos? Jovem vota em jovem e velho em velho? [2018–2024]
      </p>
      <div className="grade-duas">
        <Resposta {...ctx} />
      </div>
      <Alternancia {...ctx} />
      <div id="q6-mapa" className="grid min-w-0">
        <Mapa {...ctx} aoMudarUf={mapaUf => setF(s => ({ ...s, mapaUf, sel: null }))} aoSelecionar={selecionar} />
      </div>
      <Dispersao
        {...ctx}
        aoMudarFaixa={(faixa: Faixa) => setF(s => ({ ...s, faixa }))}
        aoSelecionar={selecionarERolar}
      />
      <Eleitos D={D} f={f} />
      <Metodo />
    </Pagina>
  );
}
