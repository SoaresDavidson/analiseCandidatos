import { useMemo } from "react";
import { Caixa, Chip, MapaBrasil } from "../../componentes";
import { fmt, int } from "../../lib/formato";
import { noLugar, UF_NOME, UFS_BR } from "../../lib/uf";
import { brl, contarPref } from "./calculo";
import { Pote } from "./Pote";
import { COR_OUTROS, COR_PARTIDO, COR_SEM_PREFEITO, corPartido, PARTIDOS_COM_COR } from "./partidos";
import type { Municipio } from "./tipos";

/** O mapa: no país, cada estado na cor do partido com mais prefeituras; ao clicar, o zoom mostra
 *  cada cidade na cor do partido do prefeito. Ao lado, o resumo do lugar ou o relatório da cidade. */
export function MapaPartidos({
  todos,
  uf,
  sel,
  aoEscolherUf,
  aoEscolherCidade,
}: {
  todos: Municipio[];
  uf: string;
  sel: Municipio | null;
  aoEscolherUf: (uf: string | null) => void;
  aoEscolherCidade: (cod: number | null) => void;
}) {
  const porCod = useMemo(() => new Map(todos.map(m => [m.cod, m])), [todos]);
  // o partido com mais prefeituras em cada estado
  const liderUf = useMemo(() => {
    const out: Record<string, [string, number, number] | undefined> = {};
    for (const u of UFS_BR) {
      const xs = todos.filter(m => m.uf === u && m.pref);
      const l = contarPref(xs)[0];
      out[u] = l ? [l[0], l[1], xs.length] : undefined;
    }
    return out;
  }, [todos]);
  const xs = useMemo(() => todos.filter(m => uf === "TODAS" || m.uf === uf), [todos, uf]);

  return (
    <Caixa>
      <h2>
        {uf === "TODAS"
          ? "De que partido é o prefeito de cada cidade?"
          : `${UF_NOME[uf]}: de que partido é o prefeito de cada cidade?`}
      </h2>
      <div className="grid items-start gap-5 min-[861px]:grid-cols-[minmax(0,1.3fr)_minmax(270px,1fr)]">
        <div className="grid gap-2.5">
          <MapaBrasil
            corUf={u => corPartido(liderUf[u]?.[0])}
            uf={uf === "TODAS" ? null : uf}
            aoEscolherUf={aoEscolherUf}
            rotulo="Mapa do Brasil: partido do prefeito eleito em 2024"
            dicaUf={u => {
              const l = liderUf[u];
              return (
                <>
                  <b>{UF_NOME[u]}</b>
                  <br />
                  {l ? (
                    <>
                      mais prefeituras: <b>{l[0]}</b> ({int(l[1])} de {int(l[2])})
                      <br />
                      clique para ver as cidades
                    </>
                  ) : (
                    "sem eleição de prefeito"
                  )}
                </>
              );
            }}
            municipios={{
              cor: cod => corPartido(porCod.get(cod)?.pref),
              sel: sel?.cod ?? null,
              aoEscolher: aoEscolherCidade,
              dica: cod => {
                const m = porCod.get(cod);
                if (!m) return "sem dados";
                return (
                  <>
                    <b>{m.nome}</b>
                    <br />
                    prefeito: <b>{m.pref || "sem resultado"}</b>
                    <br />
                    PIB por habitante: {brl(m.pib)}
                  </>
                );
              },
            }}
          />
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[12.5px] text-texto-2">
            {PARTIDOS_COM_COR.map(sg => (
              <span key={sg} className="inline-flex items-center gap-1.5">
                <i className="size-3 rounded-[3px]" style={{ background: COR_PARTIDO[sg] }} />
                {sg}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <i className="size-3 rounded-[3px]" style={{ background: COR_OUTROS }} />
              outros partidos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="size-3 rounded-[3px] border border-linha" style={{ background: COR_SEM_PREFEITO }} />
              sem resultado
            </span>
          </div>
        </div>
        {sel ? <Cidade m={sel} todos={todos} aoFechar={() => aoEscolherCidade(null)} /> : <Resumo xs={xs} uf={uf} />}
      </div>
    </Caixa>
  );
}

/** Quem venceu as prefeituras do lugar (país ou estado): os partidos em ordem, com barras. */
function Resumo({ xs, uf }: { xs: Municipio[]; uf: string }) {
  const com = xs.filter(m => m.pref);
  const lista = contarPref(com);
  const mx = lista[0]?.[1] ?? 1;
  return (
    <div className="grid gap-2.5">
      <h3 className="m-0">Quem venceu mais prefeituras {noLugar(uf)} em 2024</h3>
      {lista.length === 0 ? (
        <p className="texto-nota m-0">
          {uf === "DF" ? "O Distrito Federal não tem eleição de prefeito." : "Sem prefeitos eleitos nos dados."}
        </p>
      ) : (
        <>
          <ol className="m-0 grid list-none gap-1.5 p-0">
            {lista.slice(0, 7).map(([sg, n], i) => (
              <li key={sg} className="grid grid-cols-[20px_124px_minmax(0,1fr)_auto] items-center gap-2 text-[14px]">
                <span className="text-right text-[12px] text-texto-2 tabular-nums">{i + 1}º</span>
                <b className="truncate">{sg}</b>
                <span className="h-3.5 rounded-[3px] bg-bege">
                  <i
                    className="block h-full rounded-[3px]"
                    style={{ width: `${(100 * n) / mx}%`, background: corPartido(sg) }}
                  />
                </span>
                <span className="tabular-nums">
                  <b>{int(n)}</b> <span className="text-texto-2">({fmt((100 * n) / com.length, 0)}%)</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="texto-nota m-0">
            {int(com.length)} prefeituras, {int(lista.length)} partidos.{" "}
            {uf === "TODAS"
              ? "Clique num estado para aproximar o mapa e ver cidade por cidade."
              : "Clique numa cidade do mapa para ver o relatório dela."}
          </p>
        </>
      )}
    </div>
  );
}

/** Relatório de uma cidade: quem venceu, o quanto ela é rica no país e quem vence nas cidades parecidas. */
function Cidade({ m, todos, aoFechar }: { m: Municipio; todos: Municipio[]; aoFechar: () => void }) {
  const { posicao, parecidas } = useMemo(() => {
    const comPib = todos.filter(x => x.pib != null).sort((a, b) => a.pib! - b.pib!);
    const i = m.pib == null ? -1 : comPib.findIndex(x => x.cod === m.cod);
    if (i < 0) return { posicao: null, parecidas: [] as [string, number, number][] };
    const k = Math.min(4, Math.floor((5 * i) / comPib.length));
    const grupo = comPib.filter((x, j) => Math.min(4, Math.floor((5 * j) / comPib.length)) === k && x.pref);
    return {
      posicao: (100 * i) / (comPib.length - 1),
      parecidas: contarPref(grupo)
        .slice(0, 3)
        .map(([sg, n]) => [sg, n, grupo.length] as [string, number, number]),
    };
  }, [m, todos]);
  return (
    <div className="grid gap-2.5 rounded-xl border-2 border-ouro p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-[19px]">
            {m.nome} <span className="font-semibold text-texto-2">({m.uf})</span>
          </h3>
          <span className="texto-nota">
            {m.cap ? "capital · " : ""}
            {m.pop == null ? "" : `${int(m.pop)} habitantes`}
          </span>
        </div>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar o relatório da cidade"
          className="cursor-pointer border-0 bg-transparent text-[24px] leading-none text-texto-2"
        >
          ×
        </button>
      </div>
      <div className="grid gap-1.5 text-[14.5px]">
        <div className="flex items-center justify-between gap-3 border-b border-linha pb-1.5">
          <span>Prefeito eleito em 2024</span>
          {m.pref ? <Chip cor={corPartido(m.pref)}>{m.pref}</Chip> : <b>sem resultado</b>}
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-linha pb-1.5">
          <span>Maior bancada de vereadores</span>
          {m.banc ? (
            <span>
              <Chip cor={corPartido(m.banc)}>{m.banc}</Chip>{" "}
              <span className="texto-nota">
                {int(m.qtBanc)} {m.qtBanc === 1 ? "cadeira" : "cadeiras"}
                {m.empate ? ", empatada" : ""}
              </span>
            </span>
          ) : (
            <b>sem resultado</b>
          )}
        </div>
      </div>
      <div className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3.5">
        <Pote nivel={posicao == null ? 0 : 0.08 + 0.88 * (posicao / 100)} titulo="Pote de dinheiro da cidade" />
        <div className="grid gap-1 text-[14px]">
          <span>
            PIB por habitante: <b>{brl(m.pib)}</b>
          </span>
          {posicao != null && (
            <span>
              Mais rica que <b>{fmt(posicao, 0)}%</b> das cidades do Brasil.
            </span>
          )}
          {m.renda != null && (
            <span className="texto-nota">Renda por pessoa: R$ {int(m.renda)} ao mês (Censo 2022).</span>
          )}
        </div>
      </div>
      {parecidas.length > 0 && (
        <p className="m-0 text-[14px]">
          Nas cidades do país com riqueza parecida, quem mais elegeu prefeitos:{" "}
          {parecidas.map(([sg, n, t], i) => (
            <span key={sg}>
              {i ? ", " : ""}
              <b>{sg}</b> ({fmt((100 * n) / t, 0)}%)
            </span>
          ))}
          .
        </p>
      )}
    </div>
  );
}
