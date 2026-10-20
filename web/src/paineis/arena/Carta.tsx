import { useState, type CSSProperties } from "react";
import { urlFoto } from "../../lib/dados";
import { brl, CARGO, EL, fmt, GRAU_CURTO, vitoriasTexto } from "./jogo";
import type { CartaEleito, ElementoId, Lado } from "./tipos";

// Fundo "pergaminho" tingido pela cor do elemento (--cor) e moldura mais escura da mesma cor.
const PAPEL = "bg-[linear-gradient(160deg,color-mix(in_srgb,var(--cor)_55%,#f6efdc),color-mix(in_srgb,var(--cor)_30%,#e9dfc4))]";
const MOLDURA = "border-2 border-[color:color-mix(in_srgb,var(--cor)_70%,#000)]";

function Poder({ el, rotulo, valor, destaque }: { el: ElementoId; rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <li className={`grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-1 ${destaque ? "rounded bg-[#ffe9a6]" : ""}`}>
      <span>{EL[el].ico}</span>
      <span>{rotulo}</span>
      <b>{valor}</b>
    </li>
  );
}

/** Carta no estilo de Magic: o eleito como criatura política. `campea` marca a vencedora. */
export function Carta({ t, lado, vida, campea }: { t: CartaEleito; lado: Lado; vida: number; campea: boolean }) {
  const e = EL[t.el];
  const [semFoto, setSemFoto] = useState(false);
  return (
    <article
      data-lado={lado}
      style={{ "--cor": e.cor } as CSSProperties}
      className={`grid w-[260px] max-w-full transform-3d gap-1.5 rounded-[14px] bg-[#15181c] p-[9px] ${campea ? "shadow-[0_0_0_4px_#ffd86b,0_0_50px_14px_rgb(255_216_107/.55)]" : "shadow-[0_10px_24px_rgb(0_0_0/.45)]"}`}
    >
      <header className={`flex items-center justify-between gap-1.5 rounded-[8px_8px_4px_4px] px-[9px] py-[5px] ${PAPEL} ${MOLDURA}`}>
        <b className="overflow-hidden text-sm text-ellipsis whitespace-nowrap text-[#1b1b1b]">{t.nome}</b>
        <span className="text-[13px] tracking-[1px] whitespace-nowrap text-[color:var(--cor)] [text-shadow:0_0_1px_#000]">{"●".repeat(t.mana)}</span>
      </header>
      <div className={`relative h-[150px] overflow-hidden rounded-[3px] bg-[radial-gradient(circle_at_50%_35%,color-mix(in_srgb,var(--cor)_25%,#fff),color-mix(in_srgb,var(--cor)_60%,#222))] ${MOLDURA}`}>
        {!semFoto && (
          <img src={urlFoto(t.ano, t.sq)} alt={`Foto de ${t.nome}`} onError={() => setSemFoto(true)} className="mx-auto block h-full object-cover" />
        )}
        <span title={`Elemento: ${e.nome}`} className="absolute right-1.5 bottom-1.5 text-[22px] [filter:drop-shadow(0_0_4px_#fff)]">{e.ico}</span>
      </div>
      <div className={`overflow-hidden rounded px-2 py-1 text-[11.5px] font-bold text-ellipsis whitespace-nowrap text-[#1b1b1b] ${PAPEL} ${MOLDURA}`}>
        Criatura Política — {CARGO[t.cargo]} · {t.partido}
      </div>
      <ul className="m-0 grid list-none gap-[3px] rounded bg-[#f6f0e1] px-2 py-1.5 text-[11.5px] text-[#222]">
        <Poder el="raio" rotulo="Voto de confiança" valor={`${fmt(t.votos)} votos`} />
        <Poder el="fogo" rotulo="Fogo da campanha" valor={brl(t.receita)} />
        <Poder el="agua" rotulo="Custo do voto" valor={t.porVoto == null ? "sem dado" : `R$ ${fmt(t.porVoto, 2)}`} />
        <Poder el="terra" rotulo="Raízes" valor={vitoriasTexto(t.vit)} />
        <Poder el="luz" rotulo="Luz do saber" valor={t.grau >= 0 ? GRAU_CURTO[t.grau] : "–"} />
      </ul>
      <p className={`m-0 rounded px-2 py-[3px] text-[11px] text-[#333] italic ${PAPEL}`}>{t.local} ({t.uf}), {t.ano}</p>
      <footer className={`flex justify-self-end gap-2.5 rounded-md px-2.5 py-[3px] text-sm font-extrabold text-[#1b1b1b] ${PAPEL} ${MOLDURA}`}>
        <span>⚔ {t.atq}</span>
        <span>❤ <b>{vida}</b></span>
      </footer>
    </article>
  );
}
