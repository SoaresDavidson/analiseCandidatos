import { useMemo } from "react";
import { Alternador, Campo, Carregando, Etiqueta, Pagina, SeletorUf } from "../../componentes";
import { useDados } from "../../lib/dados";
import { semAcento } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import { Metodo, Partidos, Prefeitos, Regioes } from "./Detalhes";
import { Mapa } from "./Mapa";
import { Resposta } from "./Resposta";
import type { Ctx, DadosQ7, Filtros, Par, Regua } from "./tipos";
import { nomeLugar } from "./util";

const PADRAO: Filtros = { uf: "TODAS", par: "mun", regua: "fixa", mapaUf: "MA", sel: null };

export default function Painel() {
  const { dados } = useDados<DadosQ7>("q7.json");
  if (!dados) return <Carregando />;
  return <Conteudo D={dados} />;
}

function Conteudo({ D }: { D: DadosQ7 }) {
  const [f, setF] = usePersistente<Filtros>("q7-tse", PADRAO);
  const M = useMemo<Ctx["M"]>(
    () =>
      D.municipios.map(r => ({
        cod: r[0],
        nome: nomeLugar(r[1]),
        uf: D.ufs[r[2]],
        reg: r[3],
        cap: !!r[4],
        rodada: r[5],
        fixa: r[6],
        pref: r[7],
        busca: semAcento(r[1]),
      })),
    [D],
  );
  const R = useMemo<Ctx["R"]>(
    () => D.regioes.map(r => ({ cd: r[0], nome: r[1], uf: D.ufs[r[2]], n: r[3], rodada: r[4], fixa: r[5] })),
    [D],
  );
  const ctx: Ctx = { D, M, R, f };

  // trocar de estado no filtro leva o mapa junto e limpa a cidade escolhida
  const mudarUf = (uf: string) => setF(s => ({ ...s, uf, mapaUf: uf !== "TODAS" ? uf : s.mapaUf, sel: null }));

  const filtros = (
    <>
      <Campo rotulo="Estado">
        <SeletorUf value={f.uf} onChange={e => mudarUf(e.target.value)} />
      </Campo>
      <span className="grid gap-[3px] text-[13px] font-bold">
        Comparar
        <Alternador<Par>
          rotulo="Comparar"
          valor={f.par}
          aoMudar={par => setF(s => ({ ...s, par }))}
          opcoes={[
            ["mun", "Vereador: 2020 → 2024"],
            ["ger", "Dep. federal: 2018 → 2022"],
          ]}
        />
      </span>
      <span className="grid gap-[3px] text-[13px] font-bold">
        Régua
        <Alternador<Regua>
          rotulo="Régua"
          valor={f.regua}
          aoMudar={regua => setF(s => ({ ...s, regua }))}
          opcoes={[
            ["fixa", "Só o eleitor"],
            ["rodada", "Régua de cada ano"],
          ]}
        />
      </span>
    </>
  );

  return (
    <Pagina filtros={filtros}>
      <Etiqueta>PERGUNTA 7 · VIÉS POLÍTICO</Etiqueta>
      <h1>Para que lado as cidades foram?</h1>
      <p className="texto-enunciado">
        Enunciado: viés político de um município/região na linha do tempo? [2018, 2020, 2022, 2024]
      </p>
      <div className="grade-duas">
        <Resposta {...ctx} />
      </div>
      <Mapa
        {...ctx}
        aoMudarUf={mapaUf => setF(s => ({ ...s, mapaUf, sel: null }))}
        aoSelecionar={sel => setF(s => ({ ...s, sel }))}
      />
      <Regioes {...ctx} />
      <Partidos {...ctx} />
      <Prefeitos {...ctx} />
      <Metodo />
    </Pagina>
  );
}
