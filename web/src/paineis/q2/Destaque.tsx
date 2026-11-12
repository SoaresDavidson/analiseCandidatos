import { useState } from "react";
import { Contador } from "../../componentes";
import { urlDados } from "../../lib/dados";
import { brl, int, nomeLugar, nomeProprio } from "../../lib/formato";
import { UF_NOME } from "../../lib/uf";
import { CARGO_NOME } from "./calculo";
import type { DadosQ2, Filtros, LinhaDestaque } from "./tipos";

/** Reais por extenso com os centavos de fora: "R$ 35.789.886". */
const reais = (v: number): string => `R$ ${int(v)}`;

/** O candidato de maior patrimônio declarado do cargo, da eleição e do lugar escolhidos. Começa
 *  escondido (silhueta e "?"): quem assiste escolhe revelar, e o contador sobe até o valor. */
export function Destaque({ D, f }: { D: DadosQ2; f: Filtros }) {
  const chave = `${f.cargo}|${f.ano}|${f.uf === "TODAS" ? "BR" : D.ufs.indexOf(f.uf)}`;
  const d = D.destaques[chave];
  // a revelação vale para a escolha atual: mudou o filtro, volta o mistério
  const [revelada, setRevelada] = useState<string | null>(null);
  const aberto = revelada === chave;
  const lugar = f.uf === "TODAS" ? "Brasil" : UF_NOME[f.uf];

  if (!d?.top.length)
    return (
      <section className="rounded-caixa bg-[linear-gradient(115deg,#d9e7a0_0%,#f4f0b8_48%,#ffe680_100%)] px-6 py-8 text-[17px] font-semibold">
        Nenhum candidato a {CARGO_NOME[f.cargo]} declarou bens em {lugar} em {f.ano}.
      </section>
    );

  const [urna, civil, partido, uf, lugarCand, sq, patrimonio, bens, eleito] = d.top[0];
  const nome = nomeProprio(urna || civil).toUpperCase();
  const [primeiro, ...resto] = nome.split(" ");
  const onde = lugarCand ? `${nomeLugar(lugarCand)} (${uf})` : UF_NOME[uf];

  return (
    <section className="relative overflow-hidden rounded-caixa bg-[linear-gradient(115deg,#d9e7a0_0%,#f4f0b8_48%,#ffe680_100%)]">
      <div className="grid items-center gap-x-6 gap-y-5 px-6 pt-6 min-[861px]:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,1fr)] min-[861px]:px-9">
        {/* esquerda: quem é */}
        <div className="grid gap-3 self-center pb-6">
          <div className="text-[12.5px] font-bold tracking-[.1em] text-[#3d4a16] uppercase">
            🏛 O maior patrimônio declarado · {CARGO_NOME[f.cargo]} · {lugar} · {f.ano}
          </div>
          <div
            key={`${chave}${aberto}`}
            className="anima-surge text-[clamp(34px,5.2vw,62px)] leading-[.95] font-extrabold tracking-[-.01em] break-words"
          >
            {aberto ? (
              <>
                <span className="block text-[#2c5a12]">{primeiro}</span>
                <span className="block text-[#15181c]">{resto.join(" ")}</span>
              </>
            ) : (
              <>
                <span className="block text-[#2c5a12]">QUEM</span>
                <span className="block text-[#15181c]">É?</span>
              </>
            )}
          </div>
          {aberto && (
            <div className="anima-surge flex flex-wrap items-center gap-2 text-[13.5px] font-bold">
              <span className="rounded-full bg-white/70 px-3 py-1">{partido}</span>
              <span className="rounded-full bg-white/70 px-3 py-1">{onde}</span>
              <span
                className={`rounded-full px-3 py-1 ${eleito ? "bg-[#2c5a12] text-white" : "bg-[#15181c] text-white"}`}
              >
                {eleito ? "Eleito" : "Não eleito"}
              </span>
            </div>
          )}
          <label className="mt-1 inline-flex w-fit cursor-pointer items-center gap-2.5 rounded-full bg-[#15181c] py-2 pr-4 pl-2.5 text-[14px] font-bold text-white shadow-[0_3px_0_rgb(0_0_0/.25)] select-none has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-white">
            <input
              type="checkbox"
              checked={aberto}
              onChange={ev => setRevelada(ev.target.checked ? chave : null)}
              className="size-[18px] cursor-pointer accent-ouro"
            />
            Mostrar quem é o candidato de maior patrimônio
          </label>
        </div>

        {/* centro: o retrato num arco; antes de revelar, só a silhueta */}
        <div className="relative justify-self-center self-end">
          <div className="relative h-[300px] w-[224px] overflow-hidden rounded-t-[112px] bg-[radial-gradient(circle_at_50%_30%,#3a4750,#15181c)] shadow-[0_18px_40px_rgb(0_0_0/.28)] ring-4 ring-white/80">
            <img
              key={sq}
              src={urlDados(`q2-fotos/${f.ano}-${sq}.jpg`)}
              alt={aberto ? `Foto de ${nomeProprio(urna || civil)}` : "Silhueta do candidato escondido"}
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
        <div className="grid gap-1.5 self-center pb-6 min-[861px]:justify-items-end min-[861px]:text-right">
          <div className="text-[13px] font-bold tracking-[.1em] text-[#3d4a16] uppercase">
            ↗ Patrimônio declarado em {f.ano}
          </div>
          <div className="text-[clamp(30px,4.3vw,50px)] leading-none font-extrabold text-[#b35a00] tabular-nums">
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

      {aberto && d.top.length > 1 && <Lista top={d.top} />}
      <p className="m-0 border-t border-black/10 px-6 py-2.5 text-[12.5px] text-[#4a4a35] min-[861px]:px-9">
        Fonte: declaração de bens no registro da candidatura (TSE). É o valor que o próprio candidato declarou, sem
        conferência.
        {d.fora > 0 &&
          ` ${int(d.fora)} ${d.fora === 1 ? "declaração ficou" : "declarações ficaram"} de fora por ter um bem de R$ 100 milhões ou mais, sinal de erro de digitação.`}
      </p>
    </section>
  );
}

/** Do 2º ao 5º maior patrimônio, numa linha discreta abaixo do destaque. */
function Lista({ top }: { top: LinhaDestaque[] }) {
  return (
    <ol className="anima-surge m-0 grid list-none gap-x-6 gap-y-1 px-6 pt-1 pb-4 text-[13.5px] min-[761px]:grid-cols-2 min-[861px]:px-9">
      {top.slice(1).map(([urna, civil, partido, uf, , sq, patrimonio, , eleito], i) => (
        <li key={sq} className="flex items-baseline gap-2 border-b border-black/10 py-1">
          <span className="w-5 text-right font-bold text-[#3d4a16] tabular-nums">{i + 2}º</span>
          <span className="min-w-0 flex-1 truncate">
            <b>{nomeProprio(urna || civil)}</b> · {partido}-{uf}
            {eleito ? " · eleito" : ""}
          </span>
          <b className="tabular-nums">{brl(patrimonio)}</b>
        </li>
      ))}
    </ol>
  );
}
