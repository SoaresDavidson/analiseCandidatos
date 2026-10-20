import { type KeyboardEvent, useMemo, useState } from "react";
import { BuscaComLista, Caixa, Campo, Cor, Empilhada, Linha } from "../../componentes";
import { urlBandeira } from "../../lib/dados";
import { CATEGORIAS, CORES_ESPECTRO, categoria, corEspectro, nomeCategoria } from "../../lib/espectro";
import { brl, fmt, pc } from "../../lib/formato";
import { semAcento, UF_NOME } from "../../lib/uf";
import { Chip, ChipCat } from "./Chip";
import type { Lado, Municipio, Navegou, Ordem } from "./tipos";
import { ladoDe, mediaPonderada, ORDENS, pcPublico, somar } from "./util";

const PASSO = 60;
const MAIS = 120;
const LADOS: readonly (readonly [Lado, string])[] = [
  ["todos", "Mostrar todos"],
  ["esquerda", "Tendem à esquerda"],
  ["direita", "Tendem à direita"],
];
const ORDEM_OPCOES: readonly (readonly [Ordem, string])[] = [
  ["nome", "Ordem alfabética"],
  ["esq", "Mais à esquerda primeiro"],
  ["dir", "Mais à direita primeiro"],
  ["publico", "Mais dinheiro público (%)"],
  ["voto", "Mais caro por voto"],
];
const CAMPO_LINHA =
  "w-full rounded-none border-0 border-b-2 border-texto bg-transparent px-0.5 py-2 text-lg font-semibold";

interface Props {
  M: Municipio[];
  uf: string;
  meio: number;
  nav: Navegou;
  aoMudar: (parcial: Partial<Navegou>) => void;
  aoAbrirCidade: (cod: number) => void;
}

/** Segundo nível: resumo do estado na lateral e, ao lado, busca, filtros e a lista de cidades. */
export function Estado({ M, uf, meio, nav, aoMudar, aoAbrirCidade }: Props) {
  const { ordem, vis, lado } = nav;
  const [texto, setTexto] = useState("");
  const [n, setN] = useState(PASSO);
  const busca = semAcento(texto.trim());

  const ms = useMemo(() => M.filter(m => m.uf === uf), [M, uf]);
  const resumo = useMemo(() => {
    const cv = ms.filter(m => m.voto != null),
      d = cv.filter(m => ladoDe(m, meio) === "direita").length;
    const prefCat = CATEGORIAS.map((_, i) => ms.filter(m => m.vlPref != null && categoria(m.vlPref) === i).length);
    return {
      cv: cv.length,
      d,
      media: mediaPonderada(cv),
      rec: somar(ms, "receita"),
      pub: somar(ms, "publico"),
      prefCat,
      np: prefCat.reduce((a, b) => a + b, 0),
    };
  }, [ms, meio]);

  const xs = useMemo(() => {
    const termos = busca ? busca.split(/\s+/) : [];
    return ms
      .filter(m => (lado === "todos" || ladoDe(m, meio) === lado) && termos.every(t => m.busca.includes(t)))
      .sort(ORDENS[ordem]);
  }, [ms, lado, meio, busca, ordem]);
  const mostrados = xs.slice(0, n);

  const achados = useMemo(
    () => (busca.length < 2 ? [] : ms.filter(m => m.busca.includes(busca)).slice(0, 8)),
    [ms, busca],
  );

  const { cv, d, media, rec, pub, prefCat, np } = resumo;
  const aoTeclar = (ev: KeyboardEvent, cod: number) => {
    if (ev.key === "Enter") aoAbrirCidade(cod);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => aoMudar({ nivel: "estados" })}
        className="cursor-pointer justify-self-start border-0 bg-transparent p-0 text-base font-bold text-ouro-esc"
      >
        ← Voltar
      </button>
      <h2 className="text-center">Detalhes - {UF_NOME[uf]}</h2>
      <div className="grid items-start gap-[22px] min-[901px]:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="grid gap-3">
          <Caixa className="gap-1.5">
            <div className="flex items-center gap-2.5">
              <img
                src={urlBandeira(uf)}
                alt=""
                className="h-7 w-[42px] rounded-[3px] border border-linha object-cover"
              />
              <h3>{UF_NOME[uf]}</h3>
            </div>
            <Linha rotulo="Municípios" valor={ms.length} />
            <Linha rotulo="Voto médio para vereador" valor={fmt(media, 2)} />
            <p className="mt-1.5 mb-0.5">
              <ChipCat nota={media} /> {media < meio ? "à esquerda" : "à direita"} do meio da régua
            </p>
            <div className="mt-2 flex justify-between text-xs text-texto-2">
              <span>Esquerda {cv - d}</span>
              <span>Direita {d}</span>
            </div>
            <Empilhada
              partes={[
                { pct: pc(cv - d, cv) ?? 0, cor: CORES_ESPECTRO[1] },
                { pct: pc(d, cv) ?? 0, cor: CORES_ESPECTRO[5] },
              ]}
            />
          </Caixa>
          <Caixa className="gap-1.5">
            <h3>Prefeitos eleitos, por espectro</h3>
            <Empilhada
              partes={prefCat.flatMap((q, i) =>
                q ? [{ pct: q, cor: CORES_ESPECTRO[i], titulo: `${CATEGORIAS[i]}: ${q}` }] : [],
              )}
            />
            {prefCat.map((q, i) =>
              q ? (
                <Linha
                  key={i}
                  rotulo={
                    <>
                      <Cor cor={CORES_ESPECTRO[i]} /> {CATEGORIAS[i]}
                    </>
                  }
                  valor={`${q} (${fmt(pc(q, np), 0)}%)`}
                />
              ) : null,
            )}
          </Caixa>
          <Caixa className="gap-1.5">
            <h3>Dinheiro das campanhas (2024)</h3>
            <Linha rotulo="Arrecadado" valor={brl(rec)} />
            <Linha rotulo="Do fundo público" valor={`${fmt(pc(pub, rec), 0)}%`} />
          </Caixa>
        </aside>

        <div className="grid min-w-0 gap-3">
          <label htmlFor="f-busca" className="grid gap-[3px] text-[13px] font-bold">
            Município(s)
          </label>
          <BuscaComLista
            id="f-busca"
            texto={texto}
            aoDigitar={t => {
              setTexto(t);
              setN(PASSO);
            }}
            achados={achados}
            chave={m => m.cod}
            rotulo={m => (
              <>
                <b>{m.nome}</b>{" "}
                <small className="text-texto-2">
                  {m.voto == null ? "" : `${fmt(m.voto, 2)} · ${nomeCategoria(m.voto)}`}
                </small>
              </>
            )}
            aoEscolher={m => aoAbrirCidade(m.cod)}
            placeholder="Selecione o(s) município(s)"
            ariaLabel="Buscar município"
            campoClassName={CAMPO_LINHA}
          />
          <div className="flex flex-wrap items-end gap-[18px]">
            <div className="flex-1">
              <Campo rotulo="Ordenar por">
                <select
                  value={ordem}
                  onChange={ev => {
                    setN(PASSO);
                    aoMudar({ ordem: ev.target.value as Ordem });
                  }}
                  className={`${CAMPO_LINHA} cursor-pointer`}
                >
                  {ORDEM_OPCOES.map(([v, r]) => (
                    <option key={v} value={v}>
                      {r}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
            <span className="grid gap-[3px] text-[13px] font-bold">
              Visualização
              <span className="inline-flex gap-1.5">
                {(
                  [
                    ["lista", "☰", "Lista"],
                    ["grade", "▦", "Grade"],
                  ] as const
                ).map(([v, simbolo, rotulo]) => (
                  <button
                    key={v}
                    type="button"
                    aria-label={rotulo}
                    aria-pressed={vis === v}
                    onClick={() => aoMudar({ vis: v })}
                    className="h-[38px] w-[42px] cursor-pointer rounded-lg border border-linha bg-white text-lg aria-pressed:border-2 aria-pressed:border-ouro aria-pressed:bg-ouro-claro"
                  >
                    {simbolo}
                  </button>
                ))}
              </span>
            </span>
          </div>
          <div className="flex gap-1 border-b border-linha">
            {LADOS.map(([v, r]) => (
              <button
                key={v}
                type="button"
                aria-pressed={lado === v}
                onClick={() => {
                  setN(PASSO);
                  aoMudar({ lado: v });
                }}
                className="cursor-pointer rounded-t-lg border-0 border-b-[3px] border-transparent bg-white px-4 py-[9px] font-semibold aria-pressed:border-b-ouro"
              >
                {r}
              </button>
            ))}
          </div>

          {vis === "grade" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
              {mostrados.map(m => (
                <button
                  key={m.cod}
                  type="button"
                  onClick={() => aoAbrirCidade(m.cod)}
                  className="grid cursor-pointer gap-1 rounded-[10px] border border-transparent bg-branco px-3.5 pt-3 pb-3.5 text-left shadow-cartao hover:border-ouro hover:shadow-[0_0_0_2px_var(--color-ouro)] focus-visible:border-ouro focus-visible:shadow-[0_0_0_2px_var(--color-ouro)]"
                >
                  <span className="text-[17px] leading-tight font-bold text-texto-2">
                    {m.nome.toUpperCase()}
                    {m.cap && (
                      <>
                        {" "}
                        <small className="text-[11px] text-ouro-esc">capital</small>
                      </>
                    )}
                  </span>
                  <span className="flex justify-between gap-3 py-[3px] text-[13.5px]">
                    <span>Voto para vereador</span>
                    <b className="font-extrabold tabular-nums">{m.voto == null ? "sem resultado" : fmt(m.voto, 2)}</b>
                  </span>
                  <span className="flex justify-between gap-3 py-[3px] text-[13.5px]">
                    <span>Prefeito</span>
                    <b className="font-extrabold tabular-nums">
                      {m.sgPref ? <Chip texto={m.sgPref} nota={m.vlPref} /> : "–"}
                    </b>
                  </span>
                  <span className="flex justify-between gap-3 py-[3px] text-[13.5px]">
                    <span>Do fundo público</span>
                    <b className="font-extrabold tabular-nums">{m.receita ? `${fmt(pcPublico(m), 0)}%` : "–"}</b>
                  </span>
                  <span className="relative mt-1.5 block h-2 rounded bg-[linear-gradient(90deg,#8a0f16,#c53d33_22%,#e57f68_38%,#dcd9d1_50%,#73a7d4_62%,#2f72b4_78%,#0c3f7c)]">
                    {m.voto != null && (
                      <i
                        className="absolute -top-1 -ml-2 size-4 rounded-full border-[3px] border-white shadow-[0_0_0_1px_var(--color-texto)]"
                        style={{ left: `${m.voto * 10}%`, background: corEspectro(m.voto) }}
                      />
                    )}
                    <em
                      className="absolute -top-[3px] -bottom-[3px] w-0 border-l-2 border-dashed border-texto"
                      style={{ left: `${meio * 10}%` }}
                    />
                  </span>
                </button>
              ))}
              {mostrados.length === 0 && <p className="texto-nota">Nenhum município com esse filtro.</p>}
            </div>
          ) : (
            <div className="rolagem-x">
              <table>
                <thead>
                  <tr>
                    <th>Município</th>
                    <th>Voto vereador</th>
                    <th>Câmara</th>
                    <th>Prefeito</th>
                    <th>Arrecadado</th>
                    <th>Público</th>
                  </tr>
                </thead>
                <tbody>
                  {mostrados.map(m => (
                    <tr
                      key={m.cod}
                      tabIndex={0}
                      className="cursor-pointer hover:bg-ouro-claro"
                      onClick={() => aoAbrirCidade(m.cod)}
                      onKeyDown={ev => aoTeclar(ev, m.cod)}
                    >
                      <td>
                        <b>{m.nome}</b>
                        {m.cap && (
                          <>
                            {" "}
                            <small>(capital)</small>
                          </>
                        )}
                      </td>
                      <td>
                        {m.voto == null ? (
                          "–"
                        ) : (
                          <>
                            {fmt(m.voto, 2)} <ChipCat nota={m.voto} />
                          </>
                        )}
                      </td>
                      <td>{fmt(m.camara, 2)}</td>
                      <td>{m.sgPref ? <Chip texto={m.sgPref} nota={m.vlPref} /> : "–"}</td>
                      <td>{brl(m.receita)}</td>
                      <td>{m.receita ? `${fmt(pcPublico(m), 0)}%` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {xs.length > n && (
            <button
              type="button"
              onClick={() => setN(n + MAIS)}
              className="cursor-pointer justify-self-center rounded-lg border-2 border-ouro bg-white px-[22px] py-2 font-bold"
            >
              Mostrar mais
            </button>
          )}
        </div>
      </div>
    </>
  );
}
