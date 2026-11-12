import { useMemo, useState } from "react";
import { Alternador, BuscaComLista, Chip, Linha, MapaBrasil, Rampa } from "../../componentes";
import { fmt, int, maiusculaInicial, pc } from "../../lib/formato";
import { noLugar, semAcento, UF_NOME } from "../../lib/uf";
import type { Ctx, Filtros, Modo, Municipio } from "./tipos";
import {
  anoDe,
  comMudanca,
  corDif,
  corNota,
  DIF_COR,
  f2,
  mudanca,
  naCategoria,
  PARADAS,
  PARES,
  resumo,
  sinal,
} from "./util";

const RAMPA_LADO = `linear-gradient(90deg,${PARADAS.map(p => `${p.cor} ${p.em * 100}%`).join(",")})`;
const RAMPA_MUDOU = `linear-gradient(90deg,${DIF_COR.map((c, i) => `${c} ${((i / 7) * 100).toFixed(0)}%,${c} ${(((i + 1) / 7) * 100).toFixed(0)}%`).join(",")})`;
const MARCAS_MUDOU = ["à esquerda", "−0,75", "−0,25", "−0,05", "+0,05", "+0,25", "+0,75", "à direita"];

function Fato({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="grid content-start gap-0.5 rounded-xl bg-fundo px-3 py-2.5">
      <b className="text-[19px] leading-tight font-extrabold tabular-nums">{valor}</b>
      <span className="text-[12.5px] leading-snug text-texto-2">{rotulo}</span>
    </div>
  );
}

/** O mapa do país (clicar num estado aproxima e mostra as cidades) e, ao lado, os números do
 *  lugar escolhido. A cor é a mesma do chão: de que lado está o voto, ou para que lado ele foi. */
export function Mapa({ D, M, f, aoMudar }: Ctx & { aoMudar: (p: Partial<Filtros>) => void }) {
  const [texto, setTexto] = useState("");
  const porCod = useMemo(() => new Map(M.map(m => [m.cod, m])), [M]);
  const [a, b, cargo, aa, ab] = PARES[f.par],
    i = anoDe(f),
    ano = D.anos[i];
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

  const cor = (x: { notas: (number | null)[] } | undefined) =>
    !x ? "var(--color-sem-dado)" : f.modo === "lado" ? corNota(x.notas[i]) : corDif(mudanca(x, f.par));
  const dica = (nome: string, x: { notas: (number | null)[] } | undefined) => (
    <>
      <b>{nome}</b>
      <br />
      {x ? (
        <>
          {aa}: {f2(x.notas[a])} · {ab}: {f2(x.notas[b])}
          <br />
          mudança: {sinal(mudanca(x, f.par))}
        </>
      ) : (
        "sem votos no arquivo do TSE"
      )}
    </>
  );
  const media = (uf: string) => (D.media[uf] ? { notas: D.media[uf] } : undefined);

  return (
    <section className="grid items-start gap-[18px] min-[981px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <BuscaComLista
            className="min-w-[220px] flex-1"
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
          <Alternador<Modo>
            rotulo="O que o mapa pinta"
            valor={f.modo}
            aoMudar={modo => aoMudar({ modo })}
            opcoes={[
              ["lado", `De que lado está (${ano})`],
              ["mudou", `Para que lado foi (${aa} → ${ab})`],
            ]}
          />
        </div>
        {/* em tela larga o mapa cabe embaixo do chão, que fica preso no alto */}
        <div className="min-[981px]:[&_svg]:max-h-[max(330px,calc(100dvh-455px))]">
          <MapaBrasil
            rotulo={`Mapa do Brasil pelo lado do voto para ${cargo}`}
            uf={f.uf}
            aoEscolherUf={uf => aoMudar({ uf, sel: null })}
            corUf={uf => cor(media(uf))}
            dicaUf={uf => dica(UF_NOME[uf], media(uf))}
            municipios={{
              cor: cod => cor(porCod.get(cod)),
              dica: cod => dica(porCod.get(cod)?.nome ?? "Município", porCod.get(cod)),
              sel: f.sel,
              aoEscolher: sel => aoMudar({ sel }),
            }}
          />
        </div>
        <div className="grid items-center gap-x-5 gap-y-1.5 min-[561px]:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          {f.modo === "lado" ? (
            <Rampa gradiente={RAMPA_LADO} marcas={["0", "esquerda", "5", "direita", "10"]} />
          ) : (
            <Rampa gradiente={RAMPA_MUDOU} marcas={MARCAS_MUDOU} />
          )}
          <span className="texto-nota min-[561px]:text-right">
            {f.uf ? "Clique numa cidade: a urninha corre até a nota dela." : "Clique num estado para ver as cidades."}
          </span>
        </div>
      </div>

      <div className="grid min-w-0 content-start gap-3.5 rounded-caixa bg-branco px-5 py-[18px]">
        {cidade ? <Cidade D={D} f={f} m={cidade} /> : <Lugar D={D} M={M} f={f} aoMudar={aoMudar} />}
      </div>
    </section>
  );
}

/** Painel do país ou de um estado: quantas cidades foram para cada lado e quem mais andou. */
function Lugar({ D, M, f, aoMudar }: Pick<Ctx, "D" | "M" | "f"> & { aoMudar: (p: Partial<Filtros>) => void }) {
  const [, , cargo, aa, ab] = PARES[f.par];
  const ms = useMemo(() => comMudanca(M, f.uf, f.par), [M, f.uf, f.par]);
  const r = useMemo(() => resumo(ms, f.par), [ms, f.par]);
  const onde = noLugar(f.uf ?? "TODAS");
  // quem mais andou: no país, os estados; no estado, as cidades
  const pontas = useMemo(() => {
    const itens = f.uf
      ? ms.map(m => ({ chave: String(m.cod), nome: m.nome, d: mudanca(m, f.par)!, ir: { sel: m.cod } }))
      : D.ufs.flatMap(uf => {
          const d = D.media[uf] ? mudanca({ notas: D.media[uf] }, f.par) : null;
          return d == null ? [] : [{ chave: uf, nome: UF_NOME[uf], d, ir: { uf, sel: null } }];
        });
    itens.sort((x, y) => y.d - x.d);
    return itens.length < 2 ? null : { direita: itens[0], esquerda: itens[itens.length - 1] };
  }, [D, ms, f.uf, f.par]);

  if (!r.n)
    return (
      <>
        <h2>{f.uf ? UF_NOME[f.uf] : "Brasil"}</h2>
        <p className="texto-simples m-0">
          {f.uf === "DF" && f.par === "mun"
            ? "O Distrito Federal não elege vereador nem prefeito. Veja o voto para deputado federal."
            : `Sem votos para ${cargo} nas duas eleições aqui.`}
        </p>
      </>
    );

  return (
    <>
      <h2>
        {f.uf ? UF_NOME[f.uf] : "Brasil"}: para que lado as cidades foram, de {aa} a {ab}?
      </h2>
      <p className="texto-simples m-0">
        {maiusculaInicial(onde)}, <b>{fmt(pc(r.direita, r.n), 0)}%</b> das cidades votaram mais à direita para {cargo}{" "}
        em {ab} do que em {aa}: {int(r.direita)} de {int(r.n)}.
      </p>
      <div className="grid gap-2 min-[521px]:grid-cols-3">
        <Fato valor={`${fmt(pc(r.direita, r.n), 0)}%`} rotulo="das cidades foram para a direita" />
        <Fato valor={int(r.forteDireita)} rotulo="andaram mais de 0,25 ponto para a direita" />
        <Fato valor={int(r.forteEsquerda)} rotulo="andaram mais de 0,25 ponto para a esquerda" />
      </div>
      {pontas && (
        <div className="grid gap-1.5">
          <b className="text-[13.5px]">{f.uf ? "As cidades que mais andaram" : "Os estados que mais andaram"}</b>
          {[
            { p: pontas.direita, titulo: "mais para a direita" },
            { p: pontas.esquerda, titulo: "mais para a esquerda" },
          ].map(({ p, titulo }) => (
            <button
              key={titulo}
              type="button"
              onClick={() => aoMudar(p.ir)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 border-linha bg-transparent px-3 py-2 text-left hover:border-ouro hover:bg-ouro-claro"
            >
              <span className="min-w-0 truncate">
                <b>{p.nome}</b> <span className="text-texto-2">· {titulo}</span>
              </span>
              <Chip cor={corDif(p.d)}>{sinal(p.d)}</Chip>
            </button>
          ))}
        </div>
      )}
      <p className="texto-nota m-0">
        Só entram as cidades com votos nas duas eleições.
        {f.uf
          ? " Em cidade pequena, com poucos partidos na disputa, a nota oscila muito de uma eleição para outra."
          : ""}
      </p>
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
function Cidade({ D, f, m }: { D: Ctx["D"]; f: Filtros; m: Municipio }) {
  const [a, b, cargo, aa, ab] = PARES[f.par],
    [s20, v20, s24, v24, mesmo] = m.pref,
    d = mudanca(m, f.par),
    meio = D.regua[2];
  const lado = (v: number | null) => (v == null ? "" : v < meio ? "esquerda" : "direita");
  const aviso =
    !s20 || !s24
      ? ""
      : s20 === s24
        ? "O partido do prefeito não mudou."
        : mesmo
          ? `O partido do prefeito não mudou: o ${s20} virou ${s24}.`
          : lado(v20) === lado(v24)
            ? `A prefeitura trocou de partido, mas ficou do mesmo lado (${lado(v24)}).`
            : `A prefeitura trocou de lado: da ${lado(v20)} para a ${lado(v24)}.`;
  const nota = (v: number | null) => (v == null ? "–" : f2(v));
  return (
    <>
      <h2>
        {m.nome} ({m.uf}){m.cap ? " · capital" : ""}
      </h2>
      <div className="grid gap-2 min-[521px]:grid-cols-3">
        <Fato
          valor={nota(m.notas[a])}
          rotulo={`${cargo} em ${aa}${m.notas[a] == null ? "" : `: ${naCategoria(m.notas[a])}`}`}
        />
        <Fato
          valor={nota(m.notas[b])}
          rotulo={`${cargo} em ${ab}${m.notas[b] == null ? "" : `: ${naCategoria(m.notas[b])}`}`}
        />
        <Fato
          valor={sinal(d)}
          rotulo={
            d == null
              ? "sem as duas eleições para comparar"
              : d > 0
                ? "ponto para a direita"
                : d < 0
                  ? "ponto para a esquerda"
                  : "sem mudança"
          }
        />
      </div>
      {(s20 || s24) && (
        <div>
          <Linha rotulo="Prefeito eleito em 2020" valor={<ChipLado sg={s20} v={v20} />} />
          <Linha rotulo="Prefeito eleito em 2024" valor={<ChipLado sg={s24} v={v24} />} />
        </div>
      )}
      <p className="texto-nota m-0">
        {aviso} A nota ao lado da sigla é a do partido. Em cidade pequena, com poucos partidos na disputa, a nota do
        voto oscila muito de uma eleição para outra.
      </p>
    </>
  );
}
