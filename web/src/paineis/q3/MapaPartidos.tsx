import { useMemo } from "react";
import { Chip, MapaBrasil } from "../../componentes";
import { fmt, int } from "../../lib/formato";
import { noLugar, UF_NOME, UFS_BR } from "../../lib/uf";
import { brl, contarPref } from "./calculo";
import { Pote } from "./Pote";
import { COR_OUTROS, COR_PARTIDO, corPartido, PARTIDOS_COM_COR } from "./partidos";
import type { Municipio } from "./tipos";

/** O mapa em relevo: o país já abre com as 5.570 cidades, cada uma na cor do partido do prefeito.
 *  Clicar numa cidade aproxima o estado dela. Ao lado, quem venceu no lugar ou a cidade escolhida. */
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
  const cores = useMemo(() => new Map(todos.map(m => [m.cod, corPartido(m.pref)])), [todos]);
  // o partido com mais prefeituras em cada estado (a cor do estado enquanto as cidades carregam)
  const liderUf = useMemo(() => {
    const out: Record<string, string | undefined> = {};
    for (const u of UFS_BR) out[u] = contarPref(todos.filter(m => m.uf === u && m.pref))[0]?.[0];
    return out;
  }, [todos]);
  const xs = useMemo(() => todos.filter(m => uf === "TODAS" || m.uf === uf), [todos, uf]);

  return (
    <section className="grid items-center gap-x-8 gap-y-5 min-[901px]:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)]">
      <div className="px-2 pt-1 pb-6">
        <MapaBrasil
          relevo
          pais={cores}
          corUf={u => corPartido(liderUf[u])}
          uf={uf === "TODAS" ? null : uf}
          aoEscolherUf={aoEscolherUf}
          rotulo="Mapa do Brasil: partido do prefeito eleito em 2024 em cada cidade"
          dicaUf={u => <b>{UF_NOME[u]}</b>}
          municipios={{
            cor: cod => corPartido(porCod.get(cod)?.pref),
            sel: sel?.cod ?? null,
            aoEscolher: aoEscolherCidade,
            dica: cod => {
              const m = porCod.get(cod);
              if (!m) return "sem dados";
              return (
                <>
                  <b>
                    {m.nome} ({m.uf})
                  </b>
                  <br />
                  prefeito: <b>{m.pref || "sem resultado"}</b> · {brl(m.pib)} por habitante
                </>
              );
            },
          }}
        />
      </div>

      <div className="grid content-start gap-4 rounded-caixa bg-branco px-5 py-[18px] shadow-cartao">
        {sel ? <Cidade m={sel} todos={todos} aoFechar={() => aoEscolherCidade(null)} /> : <Resumo xs={xs} uf={uf} />}
        <div className="flex flex-wrap gap-x-3.5 gap-y-1 border-t border-linha pt-3 text-[12.5px] text-texto-2">
          {PARTIDOS_COM_COR.map(sg => (
            <span key={sg} className="inline-flex items-center gap-1.5">
              <i className="size-3 rounded-[3px]" style={{ background: COR_PARTIDO[sg] }} />
              {sg}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <i className="size-3 rounded-[3px]" style={{ background: COR_OUTROS }} />
            outros
          </span>
        </div>
      </div>
    </section>
  );
}

/** Quem venceu as prefeituras do lugar (país ou estado): os 5 primeiros partidos, com barras. */
function Resumo({ xs, uf }: { xs: Municipio[]; uf: string }) {
  const com = xs.filter(m => m.pref);
  const lista = contarPref(com);
  const mx = lista[0]?.[1] ?? 1;
  return (
    <div className="grid gap-2.5">
      <h2>Prefeitos eleitos {noLugar(uf)} em 2024</h2>
      {lista.length === 0 ? (
        <p className="texto-nota m-0">
          {uf === "DF" ? "O Distrito Federal não tem eleição de prefeito." : "Sem prefeitos eleitos nos dados."}
        </p>
      ) : (
        <ol className="m-0 grid list-none gap-2 p-0">
          {lista.slice(0, 5).map(([sg, n]) => (
            <li key={sg} className="grid grid-cols-[104px_minmax(0,1fr)_auto] items-center gap-2.5 text-[14.5px]">
              <b className="truncate">{sg}</b>
              <span className="h-4 rounded-[4px] bg-bege">
                <i
                  className="block h-full rounded-[4px] transition-[width] duration-500"
                  style={{ width: `${(100 * n) / mx}%`, background: corPartido(sg) }}
                />
              </span>
              <span className="tabular-nums">
                <b>{int(n)}</b> <span className="text-texto-2">({fmt((100 * n) / com.length, 0)}%)</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** A cidade escolhida: quem venceu e o quanto ela é rica no país. */
function Cidade({ m, todos, aoFechar }: { m: Municipio; todos: Municipio[]; aoFechar: () => void }) {
  const posicao = useMemo(() => {
    const comPib = todos.filter(x => x.pib != null).sort((a, b) => a.pib! - b.pib!);
    const i = m.pib == null ? -1 : comPib.findIndex(x => x.cod === m.cod);
    return i < 0 ? null : (100 * i) / (comPib.length - 1);
  }, [m, todos]);
  const linha = "flex items-center justify-between gap-3 border-b border-linha pb-1.5";
  return (
    <div className="grid gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2>
            {m.nome} <span className="font-semibold text-texto-2">({m.uf})</span>
          </h2>
          <span className="texto-nota">
            {m.cap ? "capital · " : ""}
            {m.pop == null ? "" : `${int(m.pop)} habitantes`}
          </span>
        </div>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar a cidade"
          className="cursor-pointer border-0 bg-transparent text-[24px] leading-none text-texto-2"
        >
          ×
        </button>
      </div>
      <div className="grid gap-1.5 text-[14.5px]">
        <div className={linha}>
          <span>Prefeito eleito</span>
          {m.pref ? <Chip cor={corPartido(m.pref)}>{m.pref}</Chip> : <b>sem resultado</b>}
        </div>
        <div className={linha}>
          <span>Maior bancada de vereadores</span>
          {m.banc ? (
            <span>
              <Chip cor={corPartido(m.banc)}>{m.banc}</Chip>{" "}
              <span className="texto-nota">
                {int(m.qtBanc)}
                {m.empate ? ", empatada" : ""}
              </span>
            </span>
          ) : (
            <b>sem resultado</b>
          )}
        </div>
      </div>
      <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3.5">
        <Pote nivel={posicao == null ? 0 : 0.08 + 0.88 * (posicao / 100)} titulo="Pote de dinheiro da cidade" />
        <div className="grid gap-0.5 text-[14.5px]">
          <span>
            <b className="text-[19px]">{brl(m.pib)}</b> por habitante
          </span>
          {posicao != null && (
            <span>
              mais rica que <b>{fmt(posicao, 0)}%</b> das cidades do país
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
