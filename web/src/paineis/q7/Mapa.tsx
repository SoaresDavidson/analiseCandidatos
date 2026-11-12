import { useMemo, useState } from "react";
import { BuscaComLista, Chip, Linha, MapaBrasil } from "../../componentes";
import { fmt, int, pc } from "../../lib/formato";
import { semAcento, UF_NOME } from "../../lib/uf";
import type { Ctx, Filtros, Municipio } from "./tipos";
import { anoDe, comMudanca, corDif, corNota, f2, mudanca, naCategoria, PARES, resumo, sinal } from "./util";

function Fato({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="grid content-start gap-0.5 rounded-xl bg-fundo px-3 py-2.5">
      <b className="text-[21px] leading-tight font-extrabold tabular-nums">{valor}</b>
      <span className="text-[12.5px] leading-snug text-texto-2">{rotulo}</span>
    </div>
  );
}

/** O mapa do país (clicar num estado aproxima e mostra as cidades) e, ao lado, os números do
 *  lugar escolhido. A cor de cada lugar é a do chão na nota dele, na eleição marcada. */
export function Mapa({ D, M, f, aoMudar }: Ctx & { aoMudar: (p: Partial<Filtros>) => void }) {
  const [texto, setTexto] = useState("");
  const porCod = useMemo(() => new Map(M.map(m => [m.cod, m])), [M]);
  const [a, b, cargo, aa, ab] = PARES[f.par],
    i = anoDe(f);
  const cidade = f.sel != null ? porCod.get(f.sel) : undefined;

  const q = semAcento(texto.trim());
  const achados = useMemo(
    () =>
      q.length < 2
        ? null
        : M.filter(m => m.busca.includes(q))
            .sort((x, y) => +y.busca.startsWith(q) - +x.busca.startsWith(q) || +y.cap - +x.cap)
            .slice(0, 12),
    [M, q],
  );

  const dica = (nome: string, x: { notas: (number | null)[] } | undefined) => (
    <>
      <b>{nome}</b>
      <br />
      {x ? (
        <>
          {aa}: {f2(x.notas[a])} · {ab}: {f2(x.notas[b])}
        </>
      ) : (
        "sem votos no arquivo do TSE"
      )}
    </>
  );
  const media = (uf: string) => (D.media[uf] ? { notas: D.media[uf] } : undefined);

  return (
    <section className="grid items-start gap-[18px] min-[981px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* em tela larga o mapa cabe embaixo dos filtros e do chão, que ficam presos no alto */}
      <div className="min-w-0 min-[981px]:[&_svg]:max-h-[max(330px,calc(100dvh-480px))]">
        <MapaBrasil
          rotulo={`Mapa do Brasil pelo lado do voto para ${cargo}`}
          uf={f.uf}
          aoEscolherUf={uf => aoMudar({ uf, sel: null })}
          corUf={uf => corNota(media(uf)?.notas[i])}
          dicaUf={uf => dica(UF_NOME[uf], media(uf))}
          municipios={{
            cor: cod => corNota(porCod.get(cod)?.notas[i]),
            dica: cod => dica(porCod.get(cod)?.nome ?? "Município", porCod.get(cod)),
            sel: f.sel,
            aoEscolher: sel => aoMudar({ sel }),
          }}
        />
      </div>

      <div className="grid min-w-0 content-start gap-3.5">
        <BuscaComLista
          texto={texto}
          aoDigitar={setTexto}
          achados={achados}
          chave={m => m.cod}
          rotulo={m => `${m.nome} (${m.uf})`}
          aoEscolher={m => aoMudar({ uf: m.uf, sel: m.cod })}
          vazio="Nenhuma cidade encontrada."
          placeholder="Buscar uma cidade do Brasil"
          ariaLabel="Buscar cidade"
        />
        <div className="grid content-start gap-3.5 rounded-caixa bg-branco px-5 py-[18px]">
          {cidade ? <Cidade D={D} f={f} m={cidade} /> : <Lugar D={D} M={M} f={f} aoMudar={aoMudar} />}
        </div>
      </div>
    </section>
  );
}

/** Painel do país ou de um estado: quantas cidades foram para cada lado e quem mais andou. */
function Lugar({ D, M, f, aoMudar }: Pick<Ctx, "D" | "M" | "f"> & { aoMudar: (p: Partial<Filtros>) => void }) {
  const [, , , aa, ab] = PARES[f.par];
  const ms = useMemo(() => comMudanca(M, f.uf, f.par), [M, f.uf, f.par]);
  const r = useMemo(() => resumo(ms, f.par), [ms, f.par]);
  // quem mais andou: no país, os estados; no estado, as cidades
  const pontas = useMemo(() => {
    const itens = f.uf
      ? ms.map(m => ({ nome: m.nome, d: mudanca(m, f.par)!, ir: { sel: m.cod } as Partial<Filtros> }))
      : D.ufs.flatMap(uf => {
          const d = D.media[uf] ? mudanca({ notas: D.media[uf] }, f.par) : null;
          return d == null ? [] : [{ nome: UF_NOME[uf], d, ir: { uf, sel: null } as Partial<Filtros> }];
        });
    itens.sort((x, y) => y.d - x.d);
    return itens.length < 2 ? null : { direita: itens[0], esquerda: itens[itens.length - 1] };
  }, [D, ms, f.uf, f.par]);
  const titulo = (
    <h2>
      {f.uf ? UF_NOME[f.uf] : "Brasil"}, de {aa} a {ab}
    </h2>
  );

  if (!r.n)
    return (
      <>
        {titulo}
        <p className="texto-nota m-0">
          {f.uf === "DF" && f.par === "mun" ? "O Distrito Federal não elege vereador." : "Sem votos nas duas eleições."}
        </p>
      </>
    );

  return (
    <>
      {titulo}
      <div className="grid gap-2 min-[521px]:grid-cols-3">
        <Fato valor={`${fmt(pc(r.direita, r.n), 0)}%`} rotulo={`das ${int(r.n)} cidades foram para a direita`} />
        <Fato valor={int(r.forteDireita)} rotulo="andaram mais de 0,25 para a direita" />
        <Fato valor={int(r.forteEsquerda)} rotulo="andaram mais de 0,25 para a esquerda" />
      </div>
      {pontas && (
        <div className="grid gap-1.5">
          {[
            { p: pontas.direita, titulo: "mais para a direita" },
            { p: pontas.esquerda, titulo: "mais para a esquerda" },
          ].map(({ p, titulo: lado }) => (
            <button
              key={lado}
              type="button"
              onClick={() => aoMudar(p.ir)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 border-linha bg-transparent px-3 py-2 text-left hover:border-ouro hover:bg-ouro-claro"
            >
              <span className="min-w-0 truncate">
                <b>{p.nome}</b> <span className="text-texto-2">· {lado}</span>
              </span>
              <Chip cor={corDif(p.d)}>{sinal(p.d)}</Chip>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function ChipLado({ sg, v }: { sg: string; v: number | null }) {
  if (!sg) return <>–</>;
  return (
    <Chip cor={corNota(v)}>
      {sg}
      {v == null ? "" : ` · ${f2(v)}`}
    </Chip>
  );
}

/** Painel da cidade: as duas notas, a mudança e o partido do prefeito nas duas eleições. */
function Cidade({ f, m }: { D: Ctx["D"]; f: Filtros; m: Municipio }) {
  const [a, b, , aa, ab] = PARES[f.par],
    [s20, v20, s24, v24] = m.pref,
    d = mudanca(m, f.par);
  const nota = (v: number | null) => (v == null ? "–" : f2(v));
  return (
    <>
      <h2>
        {m.nome} ({m.uf}){m.cap ? " · capital" : ""}
      </h2>
      <div className="grid gap-2 min-[521px]:grid-cols-3">
        <Fato
          valor={nota(m.notas[a])}
          rotulo={m.notas[a] == null ? aa : `${aa} · ${naCategoria(m.notas[a]).slice(3)}`}
        />
        <Fato
          valor={nota(m.notas[b])}
          rotulo={m.notas[b] == null ? ab : `${ab} · ${naCategoria(m.notas[b]).slice(3)}`}
        />
        <Fato
          valor={sinal(d)}
          rotulo={
            d == null ? "sem as duas eleições" : d > 0 ? "para a direita" : d < 0 ? "para a esquerda" : "sem mudança"
          }
        />
      </div>
      {(s20 || s24) && (
        <div>
          <Linha rotulo="Partido do prefeito eleito em 2020" valor={<ChipLado sg={s20} v={v20} />} />
          <Linha rotulo="Partido do prefeito eleito em 2024" valor={<ChipLado sg={s24} v={v24} />} />
        </div>
      )}
    </>
  );
}
