import type { ReactNode } from "react";
import { fmt, int, pc } from "../../lib/formato";
import { CANAL, grupoT, reais, TODOS_CANAIS, totalT } from "./dominio";
import type { DadosQ9, Filtros } from "./tipos";

function Dado({ valor, rotulo }: { valor: ReactNode; rotulo: string }) {
  return (
    <span className="grid leading-tight">
      <b className="text-[17px] font-extrabold tabular-nums">{valor}</b>
      <span className="text-[12.5px] text-texto-2">{rotulo}</span>
    </span>
  );
}

/** Faixa abaixo da nuvem: o dinheiro por trás da palavra escolhida, em números soltos. */
export function DetalhePalavra({
  d,
  f,
  termo,
  eleito,
  canal,
}: {
  d: DadosQ9;
  f: Filtros;
  termo: number | null;
  eleito: number;
  canal: number;
}) {
  if (termo == null) return <p className="texto-nota">Clique numa palavra para ver o dinheiro por trás dela.</p>;
  const nome = d.termos[termo];
  const acha = (e: number) => grupoT(d, f, e, canal).find(w => w.t === termo);
  const w = acha(eleito);
  if (!w)
    return (
      <p className="texto-nota">
        "{nome}" não está entre as {d.top} palavras deste recorte.
      </p>
    );
  // o arquivo só guarda as palavras mais citadas de cada grupo: fora delas não há número, e isso é dito
  const uso = (e: number, quem: string) => {
    const x = acha(e);
    const t = totalT(d, f, e, canal);
    if (!t) return <Dado valor="sem despesas" rotulo={`dos ${quem} neste recorte`} />;
    if (!x) return <Dado valor="fora da lista" rotulo={`das ${d.top} palavras mais citadas dos ${quem}`} />;
    return <Dado valor={`${fmt(pc(x.n, t), 0)}%`} rotulo={`das despesas dos ${quem}`} />;
  };
  // em "Todos", em que tipo de gasto a palavra mais aparece
  const tipos =
    canal === TODOS_CANAIS
      ? CANAL.map((rotulo, c) => ({ rotulo, n: grupoT(d, f, eleito, c).find(x => x.t === termo)?.n ?? 0 }))
          .filter(x => x.n > 0)
          .sort((a, b) => b.n - a.n)
      : [];

  return (
    <div aria-live="polite" className="grid gap-2 rounded-xl border-l-4 border-ouro bg-ouro-claro px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-7 gap-y-2.5">
        <b className="text-[19px] font-extrabold">"{nome}"</b>
        <Dado valor={`${int(w.n)} (${fmt(pc(w.n, totalT(d, f, eleito, canal)), 0)}%)`} rotulo="despesas que citam" />
        <Dado valor={reais(w.vr)} rotulo="valor dessas despesas" />
        <Dado valor={reais(w.vr / w.n)} rotulo="em média por despesa" />
        {uso(1, "eleitos")}
        {uso(0, "não eleitos")}
      </div>
      {tipos.length > 0 && (
        <p className="text-[13.5px]">
          Onde mais aparece:{" "}
          {tipos.slice(0, 4).map((x, k) => (
            <span key={x.rotulo}>
              {k > 0 && " · "}
              {x.rotulo} <b className="font-extrabold tabular-nums">{int(x.n)}</b>
            </span>
          ))}{" "}
          <span className="text-texto-2">(despesas que citam a palavra, por tipo de gasto)</span>
        </p>
      )}
    </div>
  );
}
