import { Barra, Barras, Caixa } from "../../componentes";
import { fmt, int, maiusculaInicial } from "../../lib/formato";
import { noEstado } from "../../lib/uf";
import { anoAnterior, doFiltro, grupos, TERCO, TERCO_COR, troca } from "./calculo";
import type { Corte, Ctx, Municipio } from "./tipos";

/** Seção 2: alternância de poder por terço de idade, com os terços dos 6 estados e os do mesmo estado. */
export function Alternancia({ M, f }: Ctx) {
  const xs = doFiltro(M, f.uf);
  const a = grupos(xs, "todas").map(g => troca(g, f.ano)),
    b = grupos(xs, "uf").map(g => troca(g, f.ano));
  const onde = noEstado(f.uf);
  const difUf = b[0].pc != null && b[2].pc != null ? Math.abs(b[0].pc - b[2].pc) : null;

  return (
    <Caixa>
      <h2>
        Há alternância? O partido do prefeito mudou de {anoAnterior(f.ano)} para {f.ano}
      </h2>
      <p className="texto-simples text-[15.5px]!">
        {f.uf === "TODAS" ? (
          <>
            Nos 6 estados juntos, a cidade jovem troca mais de partido que a velha ({fmt(a[0].pc, 0)}% ×{" "}
            {fmt(a[2].pc, 0)}%). Mas, comparando cidades do <b>mesmo estado</b>, a diferença{" "}
            {difUf != null && difUf < 5 ? "some" : "diminui"} ({fmt(b[0].pc, 0)}% × {fmt(b[2].pc, 0)}%): quem troca mais
            são os estados jovens, Maranhão e Amazonas, não a cidade jovem.
          </>
        ) : (
          <>
            {maiusculaInicial(onde)}, comparando as cidades do estado entre si (à direita), {fmt(b[0].pc, 0)}% das mais
            jovens e {fmt(b[2].pc, 0)}% das mais velhas trocaram o partido do prefeito. À esquerda, os terços são os dos
            6 estados juntos, por isso os grupos têm tamanhos diferentes.
          </>
        )}
      </p>
      <div className="grid gap-[18px] min-[701px]:grid-cols-2">
        <Grupo titulo="Comparando todas as cidades dos 6 estados" xs={xs} corte="todas" ano={f.ano} uf={f.uf} />
        <Grupo titulo="Comparando cidades do mesmo estado" xs={xs} corte="uf" ano={f.ano} uf={f.uf} />
      </div>
      <p className="texto-nota">
        Partido do prefeito eleito mudou de uma eleição para a outra? Fusões e renomeações não contam como troca (PSL →
        União, PMDB → MDB…). Cidades com eleição anulada ficam de fora.
      </p>
    </Caixa>
  );
}

function Grupo({
  titulo,
  xs,
  corte,
  ano,
  uf,
}: {
  titulo: string;
  xs: Municipio[];
  corte: Corte;
  ano: 2020 | 2024;
  uf: string;
}) {
  const r = grupos(xs, corte).map(g => troca(g, ano));
  return (
    <div className="grid content-start gap-2">
      <h3>{titulo}</h3>
      <Barras>
        {r.map((x, i) => (
          <Barra
            key={TERCO[i]}
            rotulo={
              <>
                {TERCO[i]} <small className="text-texto-2">({int(x.n)})</small>
              </>
            }
            pct={x.pc || 0}
            valor={x.n ? `${fmt(x.pc, 0)}%` : "–"}
            cor={TERCO_COR[i]}
          />
        ))}
      </Barras>
      {r.some(x => !x.n) && (
        <p className="texto-nota">“–”: nenhuma cidade {uf === "TODAS" ? "" : `${noEstado(uf)} `}neste grupo.</p>
      )}
    </div>
  );
}
