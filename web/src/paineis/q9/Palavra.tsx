import type { ReactNode } from "react";
import { fmt, int, pc } from "../../lib/formato";
import { grupoT, reais, totalT } from "./dominio";
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
  const uso = (e: number) => {
    const x = acha(e);
    const t = totalT(d, f, e, canal);
    return x && t ? `${fmt(pc(x.n, t), 0)}%` : "–";
  };

  return (
    <div
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-7 gap-y-2.5 rounded-xl border-l-4 border-ouro bg-ouro-claro px-4 py-3"
    >
      <b className="text-[19px] font-extrabold">"{nome}"</b>
      <Dado valor={`${int(w.n)} (${fmt(pc(w.n, totalT(d, f, eleito, canal)), 0)}%)`} rotulo="despesas que citam" />
      <Dado valor={reais(w.vr)} rotulo="valor dessas despesas" />
      <Dado valor={reais(w.vr / w.n)} rotulo="em média por despesa" />
      <Dado valor={uso(1)} rotulo="das despesas dos eleitos" />
      <Dado valor={uso(0)} rotulo="das despesas dos não eleitos" />
    </div>
  );
}
