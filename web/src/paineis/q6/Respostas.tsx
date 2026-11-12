import { useMemo } from "react";
import { Caixa } from "../../componentes";
import { fmt, int, pc } from "../../lib/formato";
import { grupos, linhasEleitos, troca, votoGrupo } from "./calculo";
import type { DadosQ6, Filtros, Municipio } from "./tipos";

/** Duas barras para comparar a mesma faixa de idade entre os eleitores e entre os votos. */
function Par({
  titulo,
  eleitores,
  votos,
  rotuloVotos,
  max,
}: {
  titulo: string;
  eleitores: number | null;
  votos: number | null;
  rotuloVotos: string;
  max: number;
}) {
  const linha = (rotulo: string, v: number | null, cor: string) => (
    <div className="grid grid-cols-[9.6em_minmax(0,1fr)_3.2em] items-center gap-2 text-[13.5px]">
      <span className="whitespace-nowrap">{rotulo}</span>
      <span className="h-[18px] rounded-[4px] bg-bege">
        <i className="block h-full rounded-[4px]" style={{ width: `${(100 * (v ?? 0)) / max}%`, background: cor }} />
      </span>
      <b className="text-right text-[15px] font-extrabold tabular-nums">{v == null ? "–" : `${fmt(v, 0)}%`}</b>
    </div>
  );
  return (
    <div className="grid gap-1">
      <b className="text-[13px]">{titulo}</b>
      {linha("dos eleitores", eleitores, "var(--color-verde)")}
      {linha(rotuloVotos, votos, "var(--color-ouro)")}
    </div>
  );
}

function Cartao({ pergunta, resposta, children }: { pergunta: string; resposta: string; children: React.ReactNode }) {
  return (
    <Caixa className="content-start">
      <div className="text-[13px] font-bold text-texto-2">{pergunta}</div>
      <div className="text-[clamp(26px,3vw,34px)] leading-none font-extrabold text-verde-esc">{resposta}</div>
      {children}
    </Caixa>
  );
}

/** As três perguntas do enunciado, cada uma com a resposta em uma palavra e o número que a sustenta. */
export function Respostas({ D, escopo, f }: { D: DadosQ6; escopo: Municipio[]; f: Filtros }) {
  const iu = f.uf ? D.ufs.indexOf(f.uf) : -1;
  const linhas = useMemo(() => linhasEleitos(D.eleitos, iu), [D, iu]);
  const ver = linhas.find(l => l.cargo === 0 && l.ano === 2024);
  const pref = linhas.find(l => l.cargo === 1 && l.ano === 2024);
  // parcela de jovens entre os candidatos a vereador de 2024: o que o eleitor tinha para escolher
  const candJovens = useMemo(() => {
    const rs = D.eleitos.filter(r => r[0] === 2024 && r[2] === 0 && (iu < 0 || r[1] === iu));
    return pc(
      rs.reduce((s, r) => s + ((r[3] ?? 0) * (r[7] ?? 0)) / 100, 0),
      rs.reduce((s, r) => s + (r[3] ?? 0), 0),
    );
  }, [D, iu]);

  const vg = votoGrupo(escopo);
  const max = Math.max(10, vg.aj ?? 0, vg.ai ?? 0, vg.vj ?? 0, vg.vi ?? 0) * 1.08;
  const jovemVotaEmJovem = vg.aj != null && vg.vj != null && vg.vj >= 0.75 * vg.aj;

  const tr = troca(escopo);
  const g = grupos(escopo, !!f.uf);
  const tj = troca(g[0]).pc,
    tv = troca(g[2]).pc;

  return (
    <div className="grid gap-[18px] min-[901px]:grid-cols-3">
      <Cartao pergunta="Qual a idade média dos eleitos?" resposta={ver ? `${fmt(ver.idadeEleitos, 0)} anos` : "–"}>
        <p className="m-0">
          É a idade média dos <b>vereadores</b> eleitos em 2024. Os <b>prefeitos</b> têm{" "}
          <b>{fmt(pref?.idadeEleitos, 0)} anos</b>.
        </p>
        <p className="m-0">
          Só <b>{fmt(ver?.eleitosJovens, 0)}%</b> dos vereadores eleitos têm até 29 anos.
        </p>
      </Cartao>

      <Cartao pergunta="Jovem vota em jovem?" resposta={jovemVotaEmJovem ? "Sim" : "Não"}>
        <Par
          titulo="Quem tem até 29 anos é:"
          eleitores={vg.aj}
          votos={vg.vj}
          rotuloVotos="dos votos recebidos"
          max={max}
        />
        <Par
          titulo="Quem tem 60 anos ou mais é:"
          eleitores={vg.ai}
          votos={vg.vi}
          rotuloVotos="dos votos recebidos"
          max={max}
        />
        <p className="texto-nota m-0">
          Votos para vereador em 2024. Só {fmt(candJovens, 0)}% dos candidatos eram jovens: sobra pouco em quem votar.
        </p>
      </Cartao>

      <Cartao pergunta="Há alternância de poder?" resposta={tr.pc == null ? "–" : tr.pc >= 50 ? "Sim" : "Pouca"}>
        <p className="m-0">
          O partido do prefeito mudou em <b>{fmt(tr.pc, 0)}%</b> das cidades de 2020 para 2024 ({int(tr.t)} de{" "}
          {int(tr.n)}).
        </p>
        {tj != null && tv != null && (
          <p className="m-0">
            {Math.abs(tj - tv) < 8
              ? "Cidade jovem ou velha, tanto faz: "
              : `As cidades mais jovens trocam ${tj > tv ? "mais" : "menos"}: `}
            <b>{fmt(tj, 0)}%</b> nas mais jovens, <b>{fmt(tv, 0)}%</b> nas mais velhas.
          </p>
        )}
        <p className="texto-nota m-0">Mudança de nome e fusão de partidos não contam como troca.</p>
      </Cartao>
    </div>
  );
}
