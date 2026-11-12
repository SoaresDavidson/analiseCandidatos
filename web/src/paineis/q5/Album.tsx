import { useEffect, useMemo, useState } from "react";
import { fmt, int, nomeLugar, nomeProprio, pc } from "../../lib/formato";
import { noLugar } from "../../lib/uf";
import { CARGO_NOME, CARGO_PLURAL, type ResumoPartido } from "./calculo";
import { Figurinha } from "./Figurinha";
import { nomeDe, URL_PACOTE } from "./partidos";
import type { AfetadoQ5, DadosQ5, Filtros } from "./tipos";

type Fase = "fechado" | "abrindo" | "aberto";
const semMovimento = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Quanto do alto do pacote é a "ponta" que rasga (a parte serrilhada). */
const PONTA = 13;
/** A foto do pacote tem um fundo claro em volta: estas margens (em %) ficam de fora. */
const BORDA_X = 3.7,
  BORDA_Y = 2.2;

/** O pacote de figurinhas: fechado, ele flutua; ao abrir, treme, a ponta rasga e sobe a figurinha do
 *  partido que mais elegeu pela legenda. Depois a figurinha fica à esquerda e os números do partido,
 *  à direita; embaixo, as figurinhas dos outros partidos para trocar. */
export function Album({ D, f, partidos }: { D: DadosQ5; f: Filtros; partidos: ResumoPartido[] }) {
  const [fase, setFase] = useState<Fase>("fechado");
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const atual = partidos.find(p => p.partido === escolhido) ?? partidos[0];
  const posicao = atual ? partidos.indexOf(atual) : -1;

  // a animação de abrir dura 2,3 s; depois a figurinha vai para o lado
  useEffect(() => {
    if (fase !== "abrindo") return;
    const t = setTimeout(() => setFase("aberto"), semMovimento() ? 0 : 2300);
    return () => clearTimeout(t);
  }, [fase]);

  const abrir = (sigla: string | null) => {
    setEscolhido(sigla);
    setFase("abrindo");
  };

  if (!atual)
    return (
      <section className="rounded-caixa bg-[radial-gradient(ellipse_at_50%_20%,#1c2a7a,#070b26)] px-6 py-10 text-center text-[17px] font-semibold text-white">
        Nenhum {CARGO_NOME[f.cargo]} se elegeu só pela legenda {noLugar(f.uf)} em {f.ano}.
      </section>
    );

  return (
    <section className="overflow-hidden rounded-caixa bg-[radial-gradient(ellipse_at_50%_15%,#1c2a7a_0%,#0b1140_55%,#060920_100%)] text-white">
      {fase !== "aberto" ? (
        <div className="grid justify-items-center gap-4 px-5 pt-8 pb-7 text-center">
          <div className="text-[13px] font-bold tracking-[.12em] text-[#c7d0ff] uppercase">
            Figurinhas · {CARGO_PLURAL[f.cargo]} · {f.ano}
          </div>
          <div className="relative h-[min(430px,62vw)] w-[min(344px,50vw)]">
            {fase === "abrindo" && (
              <div className="figurinha-sobe absolute inset-x-[9%] top-[8%] z-0">
                <Figurinha sigla={atual.partido} ano={f.ano} />
              </div>
            )}
            <div className={`absolute inset-0 ${fase === "fechado" ? "pacote-flutua" : "pacote-treme"}`}>
              {/* o pacote em duas partes da mesma imagem: a ponta, que rasga, e o corpo, que cai */}
              <img
                src={URL_PACOTE}
                alt=""
                className={`absolute inset-0 z-[2] size-full object-contain drop-shadow-[0_20px_30px_rgb(0_0_0/.5)] ${fase === "abrindo" ? "pacote-rasga" : ""}`}
                style={{ clipPath: `inset(${BORDA_Y}% ${BORDA_X}% ${100 - PONTA}% ${BORDA_X}%)` }}
              />
              <img
                src={URL_PACOTE}
                alt="Pacote fechado de figurinhas Partidos do Brasil"
                className={`absolute inset-0 z-[1] size-full object-contain drop-shadow-[0_20px_30px_rgb(0_0_0/.5)] ${fase === "abrindo" ? "pacote-cai" : ""}`}
                style={{ clipPath: `inset(${PONTA}% ${BORDA_X}% ${BORDA_Y}% ${BORDA_X}%)` }}
              />
            </div>
          </div>
          <p className="m-0 max-w-[46ch] text-[16px] text-[#e3e7ff]">
            Qual partido mais elegeu {CARGO_PLURAL[f.cargo]} graças ao voto de legenda {noLugar(f.uf)}?
          </p>
          <button
            type="button"
            disabled={fase === "abrindo"}
            onClick={() => abrir(null)}
            className="cursor-pointer rounded-[10px] border-0 bg-linear-to-b from-[#ffd86b] to-[#e3a400] px-7 py-2.5 text-[17px] font-extrabold text-[#1b222b] shadow-[0_4px_0_#8f6c00] active:translate-y-[3px] active:shadow-[0_1px_0_#8f6c00] disabled:opacity-60"
          >
            {fase === "abrindo" ? "Abrindo…" : "Abrir o pacote"}
          </button>
        </div>
      ) : (
        <div className="grid gap-5 px-5 py-6 min-[761px]:px-8">
          <div className="grid items-center gap-x-8 gap-y-5 min-[761px]:grid-cols-[minmax(220px,330px)_minmax(0,1fr)]">
            <div key={atual.partido} className="figurinha-chega justify-self-center w-[min(330px,70vw)]">
              <Figurinha sigla={atual.partido} ano={f.ano} viva />
            </div>
            <Numeros D={D} f={f} p={atual} posicao={posicao} total={partidos.length} />
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13px] font-bold tracking-[.08em] text-[#c7d0ff] uppercase">
                As figurinhas deste pacote: {partidos.length} partidos com eleitos pela legenda
              </span>
              <button
                type="button"
                onClick={() => abrir(partidos[(posicao + 1) % partidos.length].partido)}
                className="cursor-pointer rounded-lg border-2 border-[#ffd86b] bg-transparent px-3.5 py-1.5 text-[13.5px] font-bold text-white hover:bg-[#ffd86b] hover:text-[#1b222b]"
              >
                Abrir outro pacote ›
              </button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pt-1 pb-2">
              {partidos.map((p, i) => (
                <button
                  key={p.partido}
                  type="button"
                  onClick={() => setEscolhido(p.partido)}
                  aria-pressed={p.partido === atual.partido}
                  aria-label={`${p.partido}: ${p.legenda} eleitos pela legenda`}
                  className="grid w-[84px] flex-none cursor-pointer justify-items-center gap-1 rounded-lg border-0 bg-transparent p-1 text-white opacity-75 hover:opacity-100 aria-pressed:bg-white/15 aria-pressed:opacity-100"
                >
                  <Figurinha sigla={p.partido} ano={f.ano} className="w-full" />
                  <span className="text-[11.5px] leading-tight">
                    {i + 1}º · <b>{int(p.legenda)}</b>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/** À direita da figurinha: quantos do partido se elegeram pela legenda, e quem são. */
function Numeros({
  D,
  f,
  p,
  posicao,
  total,
}: {
  D: DadosQ5;
  f: Filtros;
  p: ResumoPartido;
  posicao: number;
  total: number;
}) {
  const quem = useMemo<AfetadoQ5[]>(() => {
    const iu = f.uf === "TODAS" ? -1 : D.ufs.indexOf(f.uf);
    return D.afetados
      .filter(a => a[0] === f.ano && a[2] === f.cargo && a[9] === 1 && a[5] === p.partido && (iu < 0 || a[1] === iu))
      .sort((a, b) => b[8] - a[8]);
  }, [D, f, p.partido]);
  const votos = p.votosNominais + p.votosLegenda;
  return (
    <div key={p.partido} className="anima-surge grid gap-3.5">
      <div>
        <div className="text-[13px] font-bold tracking-[.08em] text-[#c7d0ff] uppercase">
          {posicao + 1}º de {total} partidos · {CARGO_PLURAL[f.cargo]} · {f.ano}
        </div>
        <h2 className="m-0 text-[clamp(24px,3.4vw,34px)] leading-tight text-white">{nomeDe(p.partido)}</h2>
      </div>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="text-[clamp(52px,8vw,84px)] leading-[.9] font-extrabold text-[#ffd86b] tabular-nums">
          {int(p.legenda)}
        </span>
        <span className="max-w-[26ch] pb-1.5 text-[16px] leading-snug text-[#e3e7ff]">
          {p.legenda === 1 ? "eleito" : "eleitos"} que só {p.legenda === 1 ? "entrou" : "entraram"} por causa dos votos
          de legenda
        </span>
      </div>
      <div className="grid gap-2.5 min-[561px]:grid-cols-3">
        <Fato valor={int(p.eleitos)} rotulo={`${CARGO_PLURAL[f.cargo]} eleitos pelo partido`} />
        <Fato valor={`${fmt(pc(p.legenda, p.eleitos), 1)}%`} rotulo="deles dependeram da legenda para entrar" />
        <Fato
          valor={`${fmt(pc(p.votosLegenda, votos), 1)}%`}
          rotulo={`dos votos do partido foram só no número (${int(p.votosLegenda)})`}
        />
      </div>
      {quem.length > 0 && (
        <div className="grid gap-1">
          <div className="text-[13px] font-bold text-[#c7d0ff]">Quem entrou pela legenda</div>
          <ul className="m-0 grid list-none gap-1 p-0 text-[13.5px]">
            {quem.slice(0, 4).map(a => (
              <li key={`${a[1]}|${a[3]}|${a[4]}`} className="flex justify-between gap-3 border-b border-white/10 pb-1">
                <span className="min-w-0 truncate">
                  <b>{nomeProprio(a[4])}</b> · {nomeLugar(a[3])}
                  {f.cargo === 0 ? ` (${D.ufs[a[1]]})` : ""}
                </span>
                <span className="flex-none text-[#c7d0ff] tabular-nums">{int(a[8])} votos</span>
              </li>
            ))}
          </ul>
          {quem.length > 4 && <span className="text-[12.5px] text-[#aab3e6]">e mais {int(quem.length - 4)}.</span>}
        </div>
      )}
    </div>
  );
}

function Fato({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="grid content-start gap-0.5 rounded-xl bg-white/[.08] px-3.5 py-3">
      <b className="text-[22px] leading-tight font-extrabold tabular-nums">{valor}</b>
      <span className="text-[13px] leading-snug text-[#d5dbff]">{rotulo}</span>
    </div>
  );
}
