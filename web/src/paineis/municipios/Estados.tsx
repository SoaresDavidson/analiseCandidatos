import { Caixa, Empilhada, Etiqueta, Linha } from "../../componentes";
import { urlBandeira } from "../../lib/dados";
import { CORES_ESPECTRO, categoria } from "../../lib/espectro";
import { brl, fmt, int, pc } from "../../lib/formato";
import { ChipCat } from "./Chip";
import { Distribuicao } from "./Reguas";
import type { Municipio, Regua } from "./tipos";
import { ladoDe, mediaPonderada, somar, UF_NOME } from "./util";

/** Barra esquerda × direita; o número só aparece se couber. */
export function EsquerdaDireita({ esq, dir }: { esq: number; dir: number }) {
  const t = esq + dir;
  const partes = [
    [esq, CORES_ESPECTRO[1]],
    [dir, CORES_ESPECTRO[5]],
  ].flatMap(([n, cor]) => {
    const p = pc(n as number, t) || 0;
    return p
      ? [
          {
            pct: p,
            cor: cor as string,
            titulo: `${int(n as number)} cidades (${fmt(p, 0)}%)`,
            rotulo: p >= 9 ? `${fmt(p, 0)}%` : undefined,
          },
        ]
      : [];
  });
  return <Empilhada partes={partes} />;
}

/** Primeiro nível: a resposta, a distribuição das cidades e um cartão por estado. */
export function Estados({
  M,
  ufs,
  regua,
  aoAbrirUf,
}: {
  M: Municipio[];
  ufs: string[];
  regua: Regua;
  aoAbrirUf: (uf: string) => void;
}) {
  const comVoto = M.filter(m => m.voto != null);
  const dir = comVoto.filter(m => ladoDe(m, regua.meio) === "direita").length;
  const ord = comVoto.slice().sort((a, b) => (a.voto ?? 0) - (b.voto ?? 0));
  const maisEsq = ord[0],
    maisDir = ord[ord.length - 1];
  const centro = comVoto.filter(m => categoria(m.voto) === 3).length;
  return (
    <>
      <Etiqueta>MUNICÍPIOS · ESPECTRO E DINHEIRO</Etiqueta>
      <h1>Para que lado cada cidade vota?</h1>
      <p className="texto-enunciado">
        Cada partido tem uma nota de 0 (esquerda) a 10 (direita), dada por cientistas políticos (Bolognesi, Ribeiro,
        Codato e Silva, 2025). A nota de uma cidade é a média das notas dos partidos, pesada pelos votos para vereador
        em 2024.
      </p>
      <Caixa>
        <h2>A resposta</h2>
        <p className="texto-simples">
          Quase todas tendem à direita. Das <b>{int(comVoto.length)}</b> cidades com resultado de vereador,{" "}
          <b>{int(dir)}</b> ({fmt(pc(dir, comVoto.length), 0)}%) ficam à direita do meio da régua e{" "}
          <b>{int(comVoto.length - dir)}</b> à esquerda. A mais à esquerda é{" "}
          <b>
            {maisEsq.nome} ({maisEsq.uf})
          </b>
          , com {fmt(maisEsq.voto, 2)}; a mais à direita,{" "}
          <b>
            {maisDir.nome} ({maisDir.uf})
          </b>
          , com {fmt(maisDir.voto, 2)}. {centro === 0 && "Nenhuma cidade ficou no centro."}
        </p>
        <div className="rolagem-x">
          <Distribuicao comVoto={comVoto} regua={regua} />
        </div>
        <p className="texto-nota">
          Cada barra conta as cidades cuja nota cai naquele trecho da escala. A régua vai do {regua.esq[0]} (
          {fmt(regua.esq[1], 2)}) ao {regua.dir[0]} ({fmt(regua.dir[1], 2)}), o partido mais à esquerda e o mais à
          direita entre os que elegeram alguém em 2024. {int(M.length - comVoto.length)} cidades não têm o resultado de
          vereador no arquivo do TSE.
        </p>
      </Caixa>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-3.5">
        {ufs.map(uf => {
          const ms = M.filter(m => m.uf === uf),
            cv = ms.filter(m => m.voto != null),
            d = cv.filter(m => ladoDe(m, regua.meio) === "direita").length;
          const media = mediaPonderada(cv),
            rec = somar(ms, "receita"),
            pub = somar(ms, "publico");
          return (
            <article key={uf} className="grid gap-1.5 rounded-caixa bg-branco px-4 py-3.5 shadow-cartao">
              <header className="flex items-center gap-2.5">
                <img
                  src={urlBandeira(uf)}
                  alt={`Bandeira de ${UF_NOME[uf]}`}
                  className="h-7 w-[42px] rounded-[3px] border border-linha object-cover"
                />
                <h3 className="flex-1 text-[17px]">{UF_NOME[uf]}</h3>
                <b>{ms.length} cidades</b>
              </header>
              <div className="flex justify-between text-xs text-texto-2">
                <span>Tendem à esquerda</span>
                <span>Tendem à direita</span>
              </div>
              <EsquerdaDireita esq={cv.length - d} dir={d} />
              <Linha
                rotulo="Voto médio para vereador"
                valor={
                  <>
                    {fmt(media, 2)} <ChipCat nota={media} />
                  </>
                }
              />
              <Linha rotulo="Arrecadado nas campanhas" valor={brl(rec)} />
              <Linha rotulo="Do fundo público" valor={`${fmt(pc(pub, rec), 0)}%`} />
              <button
                type="button"
                onClick={() => aoAbrirUf(uf)}
                className="mt-1.5 cursor-pointer rounded-lg border-0 bg-ouro p-2 font-bold hover:bg-[#d9a600]"
              >
                Mais Detalhes
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}
