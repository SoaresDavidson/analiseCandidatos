import { Linha } from "../../componentes";
import { fmt, int, pc } from "../../lib/formato";
import { CANAL, TODOS_CANAIS, grupoT, reais, totalT } from "./dominio";
import type { DadosQ9, Filtros } from "./tipos";

/** Barra fina com rótulo e valor, usada no detalhe da palavra. */
function BarraFina({ rotulo, pct, cor, valor }: { rotulo: string; pct: number; cor: string; valor: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,13em)_minmax(0,1fr)_3.4em] items-center gap-2.5 text-sm">
      <span>{rotulo}</span>
      <span className="relative h-2.5 rounded-[3px] bg-bege">
        <i className="block h-full rounded-[3px]" style={{ width: `${pct.toFixed(1)}%`, background: cor }} />
      </span>
      <b className="text-right text-[12.5px] font-extrabold tabular-nums">{valor}</b>
    </div>
  );
}

/** Painel ao lado da nuvem: o dinheiro por trás da palavra escolhida. */
export function DetalhePalavra({ d, f, termo, eleito, canal }: { d: DadosQ9; f: Filtros; termo: number | null; eleito: number; canal: number }) {
  if (termo == null) {
    return <p className="text-texto-2">Clique numa palavra para ver quanto dinheiro há por trás dela, em que tipo de gasto aparece e se os eleitos a usam mais.</p>;
  }
  const nome = d.termos[termo];
  const acha = (e: number, c: number) => grupoT(d, f, e, c).find(w => w.t === termo);
  const w = acha(eleito, canal);
  const tot = totalT(d, f, eleito, canal);
  if (!w) return <p className="text-texto-2">"{nome}" não está entre as {d.top} palavras deste recorte.</p>;

  const uso = (e: number) => {
    const x = acha(e, canal);
    const t = totalT(d, f, e, canal);
    return x && t ? `${fmt(pc(x.n, t), 0)}% das despesas` : "fora das mais citadas";
  };
  const por: [number, number][] = [];
  if (canal === TODOS_CANAIS) {
    for (let c = 0; c < 8; c++) { const x = acha(eleito, c); if (x) por.push([c, x.n]); }
  }
  por.sort((a, b) => b[1] - a[1]);
  const mx = por.length ? por[0][1] : 1;

  return (
    <div className="grid gap-2.5">
      <h3>"{nome}"</h3>
      <Linha rotulo="Despesas que citam" valor={`${int(w.n)} (${fmt(pc(w.n, tot), 0)}%)`} />
      <Linha rotulo="Valor dessas despesas" valor={reais(w.vr)} />
      <Linha rotulo="Valor médio por despesa" valor={reais(w.vr / w.n)} />
      <Linha rotulo="Entre os eleitos" valor={uso(1)} />
      <Linha rotulo="Entre os não eleitos" valor={uso(0)} />
      {por.length > 0 && (
        <div className="mt-1.5 grid gap-2.5">
          {por.map(([c, n]) => <BarraFina key={c} rotulo={CANAL[c]} pct={(100 * n) / mx} cor="var(--color-verde)" valor={int(n)} />)}
        </div>
      )}
    </div>
  );
}
