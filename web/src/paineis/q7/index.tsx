import { useMemo } from "react";
import { Alternador, Campo, Carregando, Etiqueta, Pagina } from "../../componentes";
import { useDados } from "../../lib/dados";
import { nomeLugar } from "../../lib/formato";
import { semAcento, UF_NOME } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import { Chao } from "./Chao";
import { Metodo } from "./Detalhes";
import { Mapa } from "./Mapa";
import type { Ctx, DadosQ7, Filtros, Par } from "./tipos";
import { PARES } from "./util";

const PADRAO: Filtros = { uf: null, sel: null, par: "mun", quando: 1 };

export default function Painel() {
  const { dados, erro } = useDados<DadosQ7>("q7-brasil.json");
  if (!dados) return <Carregando erro={erro} />;
  return <Conteudo D={dados} />;
}

function Conteudo({ D }: { D: DadosQ7 }) {
  const [salvo, setF] = usePersistente<Filtros>("q7-brasil", PADRAO);
  const M = useMemo<Ctx["M"]>(
    () =>
      D.municipios.map(r => ({
        cod: r[0],
        nome: nomeLugar(r[1]),
        uf: D.ufs[r[2]],
        cap: !!r[3],
        notas: r[4],
        pref: r[5],
        busca: semAcento(r[1]),
      })),
    [D],
  );
  // valor salvo de outra versão: estado que não existe volta para o Brasil
  const f: Filtros = salvo.uf && !D.ufs.includes(salvo.uf) ? PADRAO : salvo;
  const aoMudar = (p: Partial<Filtros>) => setF(s => ({ ...s, ...p }));
  const [, , , aa, ab] = PARES[f.par];

  const cidade = f.sel != null ? M.find(m => m.cod === f.sel && m.uf === f.uf) : undefined;
  const nome = cidade ? `${cidade.nome} (${cidade.uf})` : f.uf ? UF_NOME[f.uf] : "Brasil";
  const notas = cidade ? cidade.notas : (D.media[f.uf ?? "BR"] ?? [null, null, null, null]);

  const passo =
    "cursor-pointer rounded-full border-2 border-ouro bg-transparent px-3 py-0.5 text-[13px] font-bold hover:bg-ouro-claro";
  const aqui = "rounded-full bg-ouro px-3 py-1 text-[13px] font-bold";

  return (
    <Pagina
      filtros={
        <>
          <Campo rotulo="Cargo" grupo>
            <Alternador<Par>
              rotulo="Cargo"
              valor={f.par}
              aoMudar={par => aoMudar({ par })}
              opcoes={[
                ["mun", "Vereador"],
                ["ger", "Dep. federal"],
              ]}
            />
          </Campo>
          <Campo rotulo="Eleição" grupo>
            <Alternador<0 | 1>
              rotulo="Eleição"
              valor={f.quando}
              aoMudar={quando => aoMudar({ quando })}
              opcoes={[
                [0, aa],
                [1, ab],
              ]}
            />
          </Campo>
        </>
      }
    >
      <Etiqueta>PERGUNTA 7 · VIÉS POLÍTICO</Etiqueta>
      <h1>Para que lado vota cada cidade?</h1>
      <div className="grid gap-[18px]">
        {/* o chão acompanha a rolagem, logo abaixo dos filtros, enquanto o mapa está na tela */}
        <div className="z-[4] min-[981px]:sticky min-[981px]:top-[88px]">
          <Chao D={D} nome={nome} notas={notas} f={f}>
            <nav aria-label="Lugar escolhido" className="flex flex-wrap items-center gap-1.5">
              {f.uf ? (
                <button type="button" className={passo} onClick={() => aoMudar({ uf: null, sel: null })}>
                  Brasil
                </button>
              ) : (
                <span className={aqui}>Brasil</span>
              )}
              {f.uf && <span aria-hidden="true">›</span>}
              {f.uf &&
                (cidade ? (
                  <button type="button" className={passo} onClick={() => aoMudar({ sel: null })}>
                    {UF_NOME[f.uf]}
                  </button>
                ) : (
                  <span className={aqui}>{UF_NOME[f.uf]}</span>
                ))}
              {cidade && <span aria-hidden="true">›</span>}
              {cidade && <span className={aqui}>{cidade.nome}</span>}
            </nav>
          </Chao>
        </div>
        <Mapa D={D} M={M} f={f} aoMudar={aoMudar} />
      </div>
      <Metodo />
    </Pagina>
  );
}
