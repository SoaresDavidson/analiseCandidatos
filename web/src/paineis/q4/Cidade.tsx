import { useMemo } from "react";
import { UF_NOME } from "../../lib/uf";
import { romano } from "./calculo";
import { BarraNiveis, LegendaNiveis, NomeEleito } from "./comum";
import { COR_NIVEL, type EstadoPronto, GRAU, GRAU_NIVEL, NIVEL } from "./tipos";

/** A página da direita quando uma cidade está escolhida no mapa: a população, os eleitos e quem são. */
export function Cidade({
  P,
  cod,
  indice,
  aoVoltar,
}: {
  P: EstadoPronto;
  cod: number;
  indice: number;
  aoVoltar: () => void;
}) {
  const m = P.MUN_BY[cod];
  const lista = useMemo(
    () =>
      P.ELEITOS.filter(e => e.ano === 2024 && e.cod === cod).sort(
        (x, y) =>
          (x.cargo === 11 ? -1 : y.cargo === 11 ? 1 : 0) || y.grau - x.grau || x.urna.localeCompare(y.urna, "pt"),
      ),
    [P, cod],
  );

  return (
    <div className="grid h-full grid-rows-[auto_auto_minmax(0,1fr)] gap-2.5">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="livro-sobre">
            Capítulo {romano(indice)} · {UF_NOME[P.uf]}
          </span>
          <button type="button" className="livro-aba flex-none" onClick={aoVoltar}>
            ← Voltar ao estado
          </button>
        </div>
        <h2 className="livro-titulo">{m.n}</h2>
        {m.cap && <span className="livro-nota font-bold">Capital do estado</span>}
      </div>

      {!m.pop ? (
        <p className="livro-prosa">Cidade criada depois do Censo 2022: ainda não há dado de escolaridade.</p>
      ) : (
        <div className="grid gap-2">
          {m.ok ? (
            <p className="livro-prosa">
              Na população, o mais comum é <b>{NIVEL[m.modaPop as number].toLowerCase()}</b>; entre os {m.te} eleitos,{" "}
              <b>{NIVEL[m.modaEl as number].toLowerCase()}</b>
              {m.emp ? " (empate)" : ""}.
            </p>
          ) : (
            <p className="livro-prosa">O arquivo do TSE não traz o resultado de vereador desta cidade em 2024.</p>
          )}
          <BarraNiveis vals={m.pop} titulo="População adulta · IBGE, Censo 2022" />
          {m.te > 0 && (
            <BarraNiveis
              vals={m.el}
              titulo={`Eleitos em 2024 · ${m.te} ${m.te === 1 ? "pessoa" : "pessoas"} (prefeito e vereadores) · TSE`}
            />
          )}
          <LegendaNiveis />
        </div>
      )}

      <div className="grid min-h-[120px] grid-rows-[auto_minmax(0,1fr)] gap-1">
        {lista.length > 0 && <h3 className="livro-secao">Quem foi eleito · clique no nome para abrir a ficha</h3>}
        <div className="overflow-y-auto pr-1 [scrollbar-color:#c9b88f_transparent] [scrollbar-width:thin]">
          {lista.map(e => (
            <div
              key={e.sq}
              className="flex items-center justify-between gap-2.5 border-b border-papel-linha py-[5px] text-[13.5px]"
            >
              <span className="min-w-0">
                <NomeEleito e={e} />
                {e.cargo === 11 ? " · prefeito(a)" : ""}
                <small className="block truncate text-tinta-2">
                  {e.partido}
                  {e.civil ? ` · ${e.civil}` : ""}
                </small>
              </span>
              <span className="inline-flex flex-none items-center gap-1.5 text-right text-[12.5px]">
                <i
                  aria-hidden="true"
                  className="inline-block size-[11px] rounded-[2px]"
                  style={{ background: COR_NIVEL(GRAU_NIVEL[e.grau]) }}
                />
                {GRAU[e.grau]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
