import { useMemo, useState } from "react";
import { BuscaComLista, MapaBrasil } from "../../componentes";
import { fmt } from "../../lib/formato";
import { semAcento, UF_NOME } from "../../lib/uf";
import { corIdade, doFiltro, idadesDe, linhasEleitos } from "./calculo";
import { COR_CANDIDATOS, COR_ELEITORES, Regua } from "./Regua";
import { Rosto } from "./Rosto";
import type { DadosQ6, Filtros, Municipio } from "./tipos";

const anos = (v: number | null, casas = 1) => (v == null ? "–" : `${fmt(v, casas)} anos`);

/** Um rosto com o nome do grupo e a idade embaixo. */
function Retrato({ idade, titulo, cor, nota }: { idade: number | null; titulo: string; cor: string; nota: string }) {
  return (
    <figure className="m-0 grid justify-items-center gap-0.5 text-center" title={nota}>
      <Rosto
        idade={idade}
        rotulo={idade == null ? `${titulo}: sem dado` : `${titulo}: rosto de ${fmt(idade, 0)} anos`}
        className="w-full max-w-[290px]"
      />
      <figcaption className="grid gap-0.5">
        <span className="inline-flex items-center justify-center gap-1.5 text-[17px] leading-tight font-extrabold">
          <i aria-hidden="true" className="inline-block size-3.5 rounded-full" style={{ background: cor }} />
          {titulo}
        </span>
        <b className="text-[clamp(28px,3.2vw,40px)] leading-none font-extrabold tabular-nums">{anos(idade)}</b>
      </figcaption>
    </figure>
  );
}

/** O mapa do país (clicar num estado aproxima e mostra as cidades) e, ao lado, os dois rostos:
 *  os eleitores e os candidatos em quem eles votaram, no lugar escolhido. */
export function Palco({
  D,
  M,
  f,
  aoMudar,
}: {
  D: DadosQ6;
  M: Municipio[];
  f: Filtros;
  aoMudar: (p: Partial<Filtros>) => void;
}) {
  const [texto, setTexto] = useState("");
  const porCod = useMemo(() => new Map(M.map(m => [m.cod, m])), [M]);
  // idade média de quem mora em cada estado, para pintar o mapa do país
  const idadeUf = useMemo(() => {
    const r: Record<string, number | null> = {};
    for (const uf of D.ufs) r[uf] = idadesDe(doFiltro(M, uf)).mora;
    return r;
  }, [D, M]);

  const cidade = f.sel != null ? porCod.get(f.sel) : undefined;
  const escopo = useMemo(() => doFiltro(M, f.uf), [M, f.uf]);
  const id = useMemo(() => idadesDe(cidade ? [cidade] : escopo), [cidade, escopo]);
  // idade de quem foi eleito: na cidade, a dos vereadores e do prefeito dela; no estado ou no país, a média de todos
  const eleitos = useMemo(() => {
    const linhas = linhasEleitos(D.eleitos, f.uf ? D.ufs.indexOf(f.uf) : -1);
    const de = (cargo: number) => linhas.find(l => l.cargo === cargo && l.ano === 2024)?.idadeEleitos ?? null;
    return { ver: de(0), pref: de(1) };
  }, [D, f.uf]);

  const q = semAcento(texto.trim());
  const achados = useMemo(
    () =>
      q.length < 2
        ? null
        : M.filter(m => m.busca.includes(q))
            .sort((a, b) => +b.busca.startsWith(q) - +a.busca.startsWith(q) || b.pop - a.pop)
            .slice(0, 12),
    [M, q],
  );

  const dif = id.vota != null && id.votado != null ? id.votado - id.vota : null;
  const passo =
    "cursor-pointer rounded-full border-2 border-ouro bg-white px-2.5 py-0.5 hover:bg-ouro-claro disabled:cursor-default disabled:bg-ouro";

  return (
    <section className="grid items-start gap-[18px] min-[981px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 gap-2.5">
        <BuscaComLista
          texto={texto}
          aoDigitar={setTexto}
          achados={achados}
          chave={m => m.cod}
          rotulo={m => `${m.nome} (${m.uf})`}
          aoEscolher={m => aoMudar({ uf: m.uf, sel: m.cod })}
          vazio="Nenhuma cidade encontrada."
          placeholder="Buscar uma cidade do Brasil"
          ariaLabel="Buscar cidade"
        />
        <MapaBrasil
          rotulo="Mapa do Brasil pela idade média de quem mora"
          uf={f.uf}
          aoEscolherUf={uf => aoMudar({ uf, sel: null })}
          corUf={uf => corIdade(idadeUf[uf])}
          dicaUf={uf => (
            <>
              <b>{UF_NOME[uf]}</b>
              <br />
              quem mora: {anos(idadeUf[uf])}
            </>
          )}
          municipios={{
            cor: cod => corIdade(porCod.get(cod)?.idade ?? null),
            sel: cidade?.cod ?? null,
            aoEscolher: cod => aoMudar({ sel: f.sel === cod ? null : cod }),
            dica: cod => {
              const m = porCod.get(cod);
              return m ? (
                <>
                  <b>{m.nome}</b>
                  <br />
                  eleitores: {anos(m.idEl)} · candidatos: {anos(m.voto?.[7] ?? null)}
                </>
              ) : null;
            },
          }}
        />
      </div>

      <div className="grid min-w-0 gap-3 rounded-caixa bg-branco px-5 py-[18px] shadow-cartao">
        <nav aria-label="Lugar escolhido" className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold">
          <button type="button" disabled={!f.uf} onClick={() => aoMudar({ uf: null, sel: null })} className={passo}>
            Brasil
          </button>
          {f.uf && (
            <>
              <span className="text-texto-2">›</span>
              <button type="button" disabled={!cidade} onClick={() => aoMudar({ sel: null })} className={passo}>
                {UF_NOME[f.uf]}
              </button>
            </>
          )}
          {cidade && (
            <>
              <span className="text-texto-2">›</span>
              <span className="rounded-full border-2 border-ouro bg-ouro px-2.5 py-0.5">{cidade.nome}</span>
            </>
          )}
        </nav>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-1">
          <Retrato
            idade={id.vota}
            titulo="Eleitores"
            cor={COR_ELEITORES}
            nota="Idade média dos eleitores em 2024 (TSE)"
          />
          <div aria-hidden="true" className="grid justify-items-center gap-0.5 pb-20">
            <span className="text-[34px] leading-none text-ouro">→</span>
            {dif != null && (
              <b className="rounded-full bg-texto px-2.5 py-0.5 text-[13.5px] whitespace-nowrap text-white tabular-nums">
                {dif > 0 ? "+" : "−"}
                {fmt(Math.abs(dif))} {Math.abs(dif) < 2 ? "ano" : "anos"}
              </b>
            )}
          </div>
          <Retrato
            idade={id.votado}
            titulo="Candidatos"
            cor={COR_CANDIDATOS}
            nota="Idade média dos candidatos a vereador em 2024, cada um contando pelos votos que recebeu (TSE)"
          />
        </div>

        <Regua
          eleitores={id.vota}
          candidatos={id.votado}
          outras={[
            { rotulo: "quem mora", valor: id.mora },
            {
              rotulo: cidade ? "vereadores eleitos" : "vereadores eleitos",
              valor: cidade ? cidade.idVer : eleitos.ver,
            },
            { rotulo: cidade ? "prefeito" : "prefeitos", valor: cidade ? cidade.idPref : eleitos.pref },
          ]}
        />
      </div>
    </section>
  );
}
