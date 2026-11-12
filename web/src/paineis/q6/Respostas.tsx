import { useMemo } from "react";
import { Caixa } from "../../componentes";
import { fmt, int } from "../../lib/formato";
import { linhasEleitos, troca, votoGrupo } from "./calculo";
import { COR_CANDIDATOS, COR_ELEITORES } from "./Regua";
import type { DadosQ6, Filtros, Municipio } from "./tipos";

/** Duas barras para comparar a mesma faixa de idade entre os eleitores e entre os votos. */
function Par({
  titulo,
  eleitores,
  votos,
  max,
}: {
  titulo: string;
  eleitores: number | null;
  votos: number | null;
  max: number;
}) {
  const linha = (rotulo: string, v: number | null, cor: string) => (
    <div className="grid grid-cols-[5.4em_minmax(0,1fr)_3em] items-center gap-2 text-[13.5px]">
      <span>{rotulo}</span>
      <span className="h-[18px] rounded-[4px] bg-bege">
        <i
          className="block h-full rounded-[4px] transition-[width] duration-700"
          style={{ width: `${(100 * (v ?? 0)) / max}%`, background: cor }}
        />
      </span>
      <b className="text-right text-[15px] font-extrabold tabular-nums">{v == null ? "–" : `${fmt(v, 0)}%`}</b>
    </div>
  );
  return (
    <div className="grid gap-1">
      <b className="text-[13px]">{titulo}</b>
      {linha("eleitores", eleitores, COR_ELEITORES)}
      {linha("votos", votos, COR_CANDIDATOS)}
    </div>
  );
}

function Cartao({ pergunta, resposta, children }: { pergunta: string; resposta: string; children: React.ReactNode }) {
  return (
    <Caixa className="content-start">
      <div className="text-[13px] font-bold text-texto-2">{pergunta}</div>
      <div className="text-[clamp(28px,3.2vw,38px)] leading-none font-extrabold text-verde-esc">{resposta}</div>
      {children}
    </Caixa>
  );
}

/** As três perguntas do enunciado: a resposta em uma palavra e o número que a sustenta. */
export function Respostas({ D, escopo, f }: { D: DadosQ6; escopo: Municipio[]; f: Filtros }) {
  const iu = f.uf ? D.ufs.indexOf(f.uf) : -1;
  const linhas = useMemo(() => linhasEleitos(D.eleitos, iu), [D, iu]);
  const ver = linhas.find(l => l.cargo === 0 && l.ano === 2024);
  const pref = linhas.find(l => l.cargo === 1 && l.ano === 2024);

  const vg = votoGrupo(escopo);
  const max = Math.max(10, vg.aj ?? 0, vg.ai ?? 0, vg.vj ?? 0, vg.vi ?? 0) * 1.08;
  const jovemVotaEmJovem = vg.aj != null && vg.vj != null && vg.vj >= 0.75 * vg.aj;
  const tr = troca(escopo);

  return (
    <div className="grid gap-[18px] min-[901px]:grid-cols-3">
      <Cartao pergunta="Jovem vota em jovem?" resposta={jovemVotaEmJovem ? "Sim" : "Não"}>
        <Par titulo="Até 29 anos" eleitores={vg.aj} votos={vg.vj} max={max} />
        <Par titulo="60 anos ou mais" eleitores={vg.ai} votos={vg.vi} max={max} />
      </Cartao>

      <Cartao pergunta="Qual a idade média dos eleitos?" resposta={ver ? `${fmt(ver.idadeEleitos, 0)} anos` : "–"}>
        <p className="m-0">
          os <b>vereadores</b> de 2024. Os <b>prefeitos</b>: <b>{fmt(pref?.idadeEleitos, 0)} anos</b>.
        </p>
      </Cartao>

      <Cartao pergunta="Há alternância de poder?" resposta={tr.pc == null ? "–" : `${fmt(tr.pc, 0)}%`}>
        <p className="m-0">
          das cidades trocaram o partido do prefeito de 2020 para 2024 ({int(tr.t)} de {int(tr.n)}).
        </p>
      </Cartao>
    </div>
  );
}
