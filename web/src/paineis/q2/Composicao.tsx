import { Legenda, VerMais } from "../../componentes";
import { fmt } from "../../lib/formato";
import { CARGO_NOME, CARGO_ROT, GRUPO_ROT } from "./calculo";
import type { DadosQ2, Filtros } from "./tipos";

const CINZA = "#9a968c";

/** Que tipos de bem os eleitos declaram a mais que os não eleitos (6 estados). */
export function Composicao({ D, f }: { D: DadosQ2; f: Filtros }) {
  const C = D.composicao[`${f.cargo}|${f.ano}`];
  const gs = C ? D.grupos.filter(g => C[g]) : [];
  const mx = C ? Math.max(...gs.map(g => Math.max(C[g][0] || 0, C[g][1] || 0)), 1) : 1;
  const ap = C?.APLICACOES,
    em = C?.EMPRESAS;
  return (
    <VerMais titulo="O que os eleitos têm a mais: aplicações e empresas">
      {ap && em && (
        <p className="texto-simples !text-[15.5px]">
          Entre os candidatos a {CARGO_NOME[f.cargo]} em {f.ano} que declararam bens (6 estados), <b>{fmt(ap[0])}%</b>{" "}
          dos eleitos têm aplicações financeiras, contra {fmt(ap[1])}% dos não eleitos; <b>{fmt(em[0])}%</b> têm
          participação em empresas, contra {fmt(em[1])}%. Imóveis quase todos têm.
        </p>
      )}
      {C ? (
        <div className="grid gap-2.5">
          {gs.map(g => (
            <div
              key={g}
              className="grid grid-cols-[minmax(0,9em)_minmax(0,1fr)_3.4em] items-center gap-x-2.5 gap-y-1 text-sm"
            >
              <span className="row-span-2 font-bold">{GRUPO_ROT[g]}</span>
              <Trilho pct={(100 * (C[g][0] || 0)) / mx} cor="var(--color-ouro)" />
              <b className="text-right tabular-nums">{fmt(C[g][0])}%</b>
              <Trilho pct={(100 * (C[g][1] || 0)) / mx} cor={CINZA} />
              <b className="text-right tabular-nums">{fmt(C[g][1])}%</b>
            </div>
          ))}
        </div>
      ) : (
        <p className="texto-nota">
          Sem dados para {CARGO_ROT[f.cargo]} {f.ano}.
        </p>
      )}
      <Legenda
        itens={[
          { cor: "var(--color-ouro)", rotulo: "eleitos" },
          { cor: CINZA, rotulo: "não eleitos" },
        ]}
      />
      <p className="texto-nota">
        Só quem declarou algum bem, nos 6 estados. Porcentagem de candidatos que declararam ao menos um bem do grupo. Os
        cerca de 50 tipos de bem do TSE foram juntados em 6 grupos (a mesma regra da Pergunta 10).
      </p>
    </VerMais>
  );
}

function Trilho({ pct, cor }: { pct: number; cor: string }) {
  return (
    <span className="h-[13px] rounded-[3px] bg-bege">
      <i className="block h-full rounded-[3px]" style={{ width: `${pct.toFixed(1)}%`, background: cor }} />
    </span>
  );
}
