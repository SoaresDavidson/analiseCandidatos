import { useMemo, useState } from "react";
import { BuscaComLista, MapaBrasil, Rampa } from "../../componentes";
import { fmt, int, maiusculaInicial } from "../../lib/formato";
import { noLugar, semAcento, UF_NOME } from "../../lib/uf";
import { corIdade, doFiltro, idadesDe, linhasEleitos, MAPA_COR, PASSOS, TERCO_CURTO } from "./calculo";
import { Rosto } from "./Rosto";
import type { DadosQ6, Filtros, Municipio } from "./tipos";

const GRADIENTE = `linear-gradient(90deg,${MAPA_COR.map((c, i) => `${c} ${i * 20}%,${c} ${(i + 1) * 20}%`).join(",")})`;
const MARCAS = ["", ...PASSOS.map(String), ""];
const anos = (v: number | null, casas = 1) => (v == null ? "–" : `${fmt(v, casas)} anos`);

/** Um rosto com a idade embaixo. */
function Retrato({ idade, titulo, fonte }: { idade: number | null; titulo: string; fonte: string }) {
  return (
    <figure className="m-0 grid justify-items-center gap-1 text-center">
      <Rosto
        idade={idade}
        rotulo={idade == null ? `${titulo}: sem dado` : `${titulo}: rosto de ${fmt(idade, 0)} anos`}
        className="w-full max-w-[210px]"
      />
      <figcaption className="grid gap-0.5">
        <b className="text-[clamp(26px,3vw,36px)] leading-none font-extrabold text-verde-esc tabular-nums">
          {anos(idade)}
        </b>
        <span className="text-[15px] leading-tight font-extrabold">{titulo}</span>
        <span className="text-[12.5px] leading-tight text-texto-2">{fonte}</span>
      </figcaption>
    </figure>
  );
}

function Fato({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="grid content-start gap-0.5 rounded-xl bg-fundo px-3 py-2.5">
      <b className="text-[19px] leading-tight font-extrabold tabular-nums">{valor}</b>
      <span className="text-[12.5px] leading-snug text-texto-2">{rotulo}</span>
    </div>
  );
}

/** O mapa do país (clicar num estado aproxima e mostra as cidades) e, ao lado, os dois rostos:
 *  a idade de quem vota e a de quem recebeu os votos, no lugar escolhido. */
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
  const idVer = cidade ? cidade.idVer : eleitos.ver;
  const idPref = cidade ? cidade.idPref : eleitos.pref;

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

  const onde = cidade ? `em ${cidade.nome}` : noLugar(f.uf ?? "TODAS");
  const dif = id.vota != null && id.votado != null ? id.votado - id.vota : null;
  const frase =
    dif == null ? (
      cidade ? (
        "Sem resultado de vereador desta cidade em 2024 no arquivo do TSE."
      ) : (
        "Sem votação para vereador aqui."
      )
    ) : Math.abs(dif) < 1 ? (
      <>
        {maiusculaInicial(onde)}, quem vota e quem recebe o voto têm <b>quase a mesma idade</b>.
      </>
    ) : (
      <>
        {maiusculaInicial(onde)}, o voto vai para gente{" "}
        <b>
          {fmt(Math.abs(dif))} {Math.abs(dif) < 2 ? "ano" : "anos"} mais {dif > 0 ? "velha" : "nova"}
        </b>{" "}
        que o eleitor médio.
      </>
    );

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
              quem mora: {anos(idadeUf[uf])} em média
              <br />
              clique para ver as cidades
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
                  {m.cap ? " · capital" : ""}
                  <br />
                  quem mora: {anos(m.idade)}
                  <br />
                  quem vota: {anos(m.idEl)}
                  <br />
                  em quem vota: {anos(m.voto?.[7] ?? null)}
                </>
              ) : null;
            },
          }}
        />
        <div className="grid gap-1">
          <b className="text-[12.5px]">Idade média de quem mora, em anos (IBGE, Censo 2022)</b>
          <Rampa gradiente={GRADIENTE} marcas={MARCAS} />
          <span className="texto-nota">
            {f.uf ? "Clique numa cidade: os rostos passam a ser os dela." : "Clique num estado para ver as cidades."}
          </span>
        </div>
      </div>

      <div className="grid min-w-0 gap-3.5 rounded-caixa bg-branco px-5 py-[18px] shadow-cartao">
        <div className="grid gap-1">
          <nav aria-label="Lugar escolhido" className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold">
            <button
              type="button"
              disabled={!f.uf}
              onClick={() => aoMudar({ uf: null, sel: null })}
              className="cursor-pointer rounded-full border-2 border-ouro bg-white px-2.5 py-0.5 hover:bg-ouro-claro disabled:cursor-default disabled:bg-ouro"
            >
              Brasil
            </button>
            {f.uf && (
              <>
                <span className="text-texto-2">›</span>
                <button
                  type="button"
                  disabled={!cidade}
                  onClick={() => aoMudar({ sel: null })}
                  className="cursor-pointer rounded-full border-2 border-ouro bg-white px-2.5 py-0.5 hover:bg-ouro-claro disabled:cursor-default disabled:bg-ouro"
                >
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
          <h2 className="text-[22px]!">
            {cidade ? `${cidade.nome} (${cidade.uf})` : f.uf ? UF_NOME[f.uf] : "Brasil"}: a idade do voto
          </h2>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2">
          <Retrato idade={id.vota} titulo="Quem vota" fonte="os eleitores · TSE, 2024" />
          <div aria-hidden="true" className="grid justify-items-center pb-16 text-[13px] font-bold text-texto-2">
            vota em
            <span className="text-[30px] leading-none text-ouro">→</span>
          </div>
          <Retrato idade={id.votado} titulo="Em quem vota" fonte="candidatos a vereador, pelos votos · 2024" />
        </div>

        <p className="texto-simples m-0 text-center">{frase}</p>

        <div className="grid gap-2 min-[521px]:grid-cols-3">
          <Fato valor={anos(id.mora)} rotulo="quem mora (Censo 2022, com as crianças)" />
          <Fato
            valor={anos(idVer)}
            rotulo={cidade ? "vereadores eleitos em 2024" : "vereadores eleitos em 2024, em média"}
          />
          <Fato
            valor={anos(idPref, cidade ? 0 : 1)}
            rotulo={cidade ? "prefeito eleito em 2024" : "prefeitos eleitos em 2024, em média"}
          />
        </div>

        {cidade && (
          <p className="texto-nota m-0">
            {int(cidade.pop)} habitantes
            {cidade.tercoUf ? ` · entre as ${TERCO_CURTO[cidade.tercoUf - 1]} do estado` : ""}.
            {cidade.sg[1] &&
              ` Prefeitura: ${cidade.sg[0] || "–"} em 2020, ${cidade.sg[1]} em 2024${
                cidade.troca == null ? "" : cidade.troca ? " (trocou de partido)" : " (manteve)"
              }.`}
          </p>
        )}
        <p className="texto-nota m-0">
          Cada rosto tem a idade do número embaixo dele. "Em quem vota" é a idade média dos candidatos a vereador, cada
          um contando pelos votos que recebeu.
        </p>
      </div>
    </section>
  );
}
