import { type ReactNode, useRef, useState } from "react";
import { Contador } from "../../componentes";
import { urlDados } from "../../lib/dados";
import { brl, int, nomeLugar, nomeProprio } from "../../lib/formato";
import { UF_NOME } from "../../lib/uf";
import { CARGO_NOME, larguraEm, linhasDoNome } from "./calculo";
import type { DadosQ2, Filtros, LinhaDestaque } from "./tipos";

/** Reais por extenso com os centavos de fora: "R$ 35.789.886". */
const reais = (v: number): string => `R$ ${int(v)}`;

/** Tamanho de letra que faz um texto de `larg` (em múltiplos da fonte) caber na largura da coluna
 *  (100cqi), com 6% de folga para a fonte reserva, sem passar de `teto` px. */
const cabe = (larg: number, teto: number): string => `min(${teto}px, calc(100cqi / ${(larg * 1.06).toFixed(2)}))`;

/** A faixa de abertura, com o degradê de ponta a ponta da tela: o candidato de maior patrimônio
 *  declarado do cargo, da eleição e do lugar escolhidos. Começa escondido (silhueta e "?"): quem
 *  assiste escolhe revelar, e o contador sobe até o valor. `children` é o selo e o título da página. */
export function Destaque({ D, f, children }: { D: DadosQ2; f: Filtros; children: ReactNode }) {
  const chave = `${f.cargo}|${f.ano}|${f.uf === "TODAS" ? "BR" : D.ufs.indexOf(f.uf)}`;
  const d = D.destaques[chave];
  // a revelação vale para a escolha atual: mudou o filtro, volta o mistério
  const [revelada, setRevelada] = useState<string | null>(null);
  const aberto = revelada === chave;
  const lugar = f.uf === "TODAS" ? "Brasil" : UF_NOME[f.uf];
  const faixa = useRef<HTMLElement>(null);

  /** Desce até a resposta, logo abaixo da faixa, descontando a barra de filtros presa no topo. */
  const verResposta = () => {
    const el = faixa.current;
    if (!el) return;
    const barra = el.previousElementSibling instanceof HTMLElement ? el.previousElementSibling.offsetHeight : 0;
    window.scrollTo({ top: el.getBoundingClientRect().bottom + window.scrollY - barra, behavior: "smooth" });
  };

  const primeiro = d?.top[0];

  return (
    // sobe 18px para o degradê preencher os cantos arredondados da barra de filtros
    <section
      ref={faixa}
      className="relative -mt-[18px] overflow-hidden bg-[linear-gradient(115deg,#d3e394_0%,#f4f0b8_46%,#ffe680_100%)] pt-[18px]"
    >
      <div className="mx-auto grid max-w-pagina gap-y-5 px-5 pt-[22px] pb-4 min-[861px]:min-h-[calc(100dvh-236px)] min-[861px]:grid-rows-[auto_1fr_auto]">
        <header className="grid gap-[14px]">{children}</header>

        {primeiro ? (
          <Palco
            linha={primeiro}
            f={f}
            lugar={lugar}
            chave={chave}
            aberto={aberto}
            aoMudar={v => setRevelada(v ? chave : null)}
          />
        ) : (
          <p className="m-0 self-center text-[clamp(20px,2.6vw,30px)] leading-tight font-extrabold text-[#2c5a12]">
            Nenhum candidato a {CARGO_NOME[f.cargo]} declarou bens em {lugar} em {f.ano}.
          </p>
        )}

        <footer className="grid gap-3">
          {aberto && d && d.top.length > 1 && <Lista top={d.top} />}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-black/10 pt-3">
            <p className="m-0 max-w-[820px] text-[12.5px] text-[#4a4a35]">
              Fonte: declaração de bens no registro da candidatura (TSE). Valor declarado pelo próprio candidato, sem
              conferência.
              {d &&
                d.fora > 0 &&
                ` ${int(d.fora)} ${d.fora === 1 ? "declaração ficou" : "declarações ficaram"} de fora por ter um bem de R$ 100 milhões ou mais, sinal de erro de digitação.`}
            </p>
            <button
              type="button"
              onClick={verResposta}
              className="cursor-pointer rounded-full border-0 bg-white/75 px-4 py-2 text-[13.5px] font-bold text-[#15181c] shadow-[0_2px_0_rgb(0_0_0/.12)] hover:bg-white"
            >
              Ver a resposta <span aria-hidden="true">↓</span>
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}

/** Nome à esquerda, retrato no meio, dinheiro à direita. O nome e o valor medem a própria coluna
 *  (cqi) e encolhem até caber: nenhum dos dois entra embaixo da foto, com qualquer nome. */
function Palco({
  linha,
  f,
  lugar,
  chave,
  aberto,
  aoMudar,
}: {
  linha: LinhaDestaque;
  f: Filtros;
  lugar: string;
  chave: string;
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
}) {
  const [urna, civil, partido, uf, lugarCand, sq, patrimonio, bens, eleito] = linha;
  const nome = nomeProprio(urna || civil);
  const linhas = aberto ? linhasDoNome(nome.toUpperCase()) : ["QUEM", "É?"];
  const onde = lugarCand ? `${nomeLugar(lugarCand)} (${uf})` : UF_NOME[uf];
  const valor = reais(patrimonio);

  return (
    <div className="grid items-center gap-x-9 gap-y-6 min-[861px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      {/* esquerda: quem é */}
      <div className="@container grid gap-3.5">
        <div className="text-[12.5px] font-bold tracking-[.1em] text-[#3d4a16] uppercase">
          O maior patrimônio declarado · {CARGO_NOME[f.cargo]} · {lugar} · {f.ano}
        </div>
        <div
          key={`${chave}${aberto}`}
          className="anima-surge leading-[.98] font-extrabold tracking-[-.01em]"
          style={{ fontSize: cabe(Math.max(...linhas.map(larguraEm)), 72) }}
        >
          {linhas.map((l, i) => (
            <span key={l + String(i)} className={`block whitespace-nowrap ${i ? "text-[#15181c]" : "text-[#2c5a12]"}`}>
              {l}
            </span>
          ))}
        </div>
        {aberto && (
          <div className="anima-surge flex flex-wrap items-center gap-2 text-[13.5px] font-bold">
            <span className="rounded-full bg-white/70 px-3 py-1">{partido}</span>
            <span className="rounded-full bg-white/70 px-3 py-1">{onde}</span>
            <span className={`rounded-full px-3 py-1 text-white ${eleito ? "bg-[#2c5a12]" : "bg-[#15181c]"}`}>
              {eleito ? "Eleito" : "Não eleito"}
            </span>
          </div>
        )}
        <label className="inline-flex w-fit cursor-pointer items-center gap-2.5 rounded-full bg-[#15181c] py-2 pr-4 pl-2.5 text-[14px] font-bold text-white shadow-[0_3px_0_rgb(0_0_0/.25)] select-none has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-white">
          <input
            type="checkbox"
            checked={aberto}
            onChange={ev => aoMudar(ev.target.checked)}
            className="size-[18px] cursor-pointer accent-ouro"
          />
          Revelar quem é
        </label>
      </div>

      {/* centro: o retrato num arco, sobre um halo de luz; antes de revelar, só a silhueta */}
      <div className="relative justify-self-center">
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-[168%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_255_255/.6)_0_36%,rgb(255_255_255/.3)_36%_52%,rgb(255_255_255/.14)_52%_70%,transparent_70%)]"
        />
        <div className="relative aspect-[3/4] w-[clamp(190px,20vw,264px)] overflow-hidden rounded-t-full bg-[radial-gradient(circle_at_50%_30%,#3a4750,#15181c)] shadow-[0_18px_40px_rgb(0_0_0/.28)] ring-4 ring-white/85">
          <img
            key={sq}
            src={urlDados(`q2-fotos/${f.ano}-${sq}.jpg`)}
            alt={aberto ? `Foto de ${nome}` : "Silhueta do candidato escondido"}
            className="size-full object-cover object-top transition-[filter] duration-[900ms] ease-out"
            style={{ filter: aberto ? "none" : "brightness(.2) contrast(1.5) saturate(0) blur(7px)" }}
            onError={ev => {
              ev.currentTarget.style.visibility = "hidden";
            }}
          />
          {!aberto && (
            <span
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center pb-10 text-[110px] font-extrabold text-white/90"
            >
              ?
            </span>
          )}
        </div>
      </div>

      {/* direita: o contador de dinheiro */}
      <div className="@container grid gap-1.5 min-[861px]:justify-items-end min-[861px]:text-right">
        <div className="text-[12.5px] font-bold tracking-[.1em] text-[#3d4a16] uppercase">
          Patrimônio declarado em {f.ano}
        </div>
        <div
          className="leading-none font-extrabold whitespace-nowrap text-[#b35a00] tabular-nums"
          style={{ fontSize: cabe(larguraEm(valor), 62) }}
        >
          {aberto ? <Contador valor={patrimonio} formato={reais} duracao={2200} chave={chave} /> : "R$ ? ? ?"}
        </div>
        {aberto ? (
          <div className="anima-surge text-[14px] text-[#3a3a2a]">
            em <b>{int(bens)}</b> {bens === 1 ? "bem declarado" : "bens declarados"} ao TSE
          </div>
        ) : (
          <div className="text-[14px] text-[#3a3a2a]">Marque a caixa para revelar</div>
        )}
      </div>
    </div>
  );
}

/** Do 2º ao 5º maior patrimônio, numa fileira discreta abaixo do destaque. */
function Lista({ top }: { top: LinhaDestaque[] }) {
  return (
    <ol className="anima-surge m-0 grid list-none gap-2.5 p-0 text-[13.5px] min-[561px]:grid-cols-2 min-[1081px]:grid-cols-4">
      {top.slice(1).map(([urna, civil, partido, uf, , sq, patrimonio, , eleito], i) => (
        <li key={sq} className="flex min-w-0 items-center gap-2.5 rounded-xl bg-white/55 px-3 py-2">
          <span className="font-extrabold text-[#3d4a16] tabular-nums">{i + 2}º</span>
          <span className="grid min-w-0 flex-1">
            <b className="truncate">{nomeProprio(urna || civil)}</b>
            <span className="truncate text-[12.5px] text-[#4a4a35]">
              {partido}-{uf}
              {eleito ? " · eleito" : ""}
            </span>
          </span>
          <b className="tabular-nums">{brl(patrimonio)}</b>
        </li>
      ))}
    </ol>
  );
}
