import { Fragment } from "react";
import { TEMAS } from "../paineis/registro";
import { CARTOES, DESTAQUES, type Cartao } from "./cartoes";

/** "**66%** das cidades" -> 66% em negrito ouro. */
function Negritos({ texto }: { texto: string }) {
  return texto.split("**").map((t, i) => (i % 2 ? <b key={i} className="font-extrabold text-ouro-esc">{t}</b> : <Fragment key={i}>{t}</Fragment>));
}

const CARTAO = "grid overflow-hidden rounded-md bg-branco no-underline shadow-cartao motion-safe:animate-sobe";
const LADO = "grid place-items-center content-center gap-0.5 font-extrabold text-white";
const LINK = "transition-[transform,box-shadow] duration-200 hover:shadow-[0_0_0_2px_var(--color-ouro)] motion-safe:hover:-translate-y-[3px]";

function CartaoPergunta({ c, ordem }: { c: Cartao; ordem: number }) {
  const atraso = { animationDelay: `${0.12 + ordem * 0.05}s` };
  const lado = (
    <span className={`${LADO} ${c.aba ? "bg-ouro" : "bg-breve"}`}>
      <small className="text-[11px] font-bold">{c.aba ? "Pergunta" : "Em breve"}</small>
      <b className="text-2xl leading-none">{c.n}</b>
    </span>
  );
  const corpo = (
    <span className="grid content-center gap-0.5 px-3.5 py-3">
      <span className="text-[13px] text-texto-2">{c.assunto}</span>
      <span className={`text-[15.5px] leading-[1.3] font-bold ${c.aba ? "" : "text-texto-2"}`}>{c.perg}</span>
      {c.resp && <span className="mt-1 text-[13.5px]"><Negritos texto={c.resp} /></span>}
    </span>
  );
  const classe = `${CARTAO} min-h-[118px] grid-cols-[76px_minmax(0,1fr)]`;
  return c.aba
    ? <a className={`${classe} ${LINK}`} style={atraso} href={`#${c.aba}`}>{lado}{corpo}</a>
    : <div className={classe} style={atraso}>{lado}{corpo}</div>;
}

export function Inicio() {
  let ordem = 0;
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto grid max-w-pagina gap-4 px-5 pt-[26px] pb-14">
        <h1 className="motion-safe:animate-sobe">O que os dados das eleições respondem</h1>
        <p className="max-w-[72ch] text-texto-2 motion-safe:animate-sobe motion-safe:[animation-delay:.08s]">
          Candidaturas e resultados do TSE e dados do IBGE, de 2002 a 2024, nos seis estados sorteados. Escolha uma pergunta: cada uma abre com a resposta em linguagem simples e um gráfico. Os detalhes técnicos ficam no fim de cada página.
        </p>
        {TEMAS.map(t => {
          const d = DESTAQUES[t.id];
          // perguntas prontas primeiro, depois as "em breve"
          const cartoes = CARTOES.filter(c => c.tema === t.id).sort((a, b) => Number(!!b.aba) - Number(!!a.aba));
          return (
            <section key={t.id} className="grid gap-2.5">
              <h2 className="mt-2.5 border-l-[5px] border-ouro pl-2.5 text-xl motion-safe:animate-sobe">
                <a href={`#${t.id}`} className="no-underline hover:underline">{t.nome}</a>
              </h2>
              {d && (
                <a className={`${CARTAO} ${LINK} min-h-24 grid-cols-[92px_minmax(0,1fr)]`} href={`#${d.aba}`}>
                  <span className={`${LADO} bg-verde-esc`}><small className="text-[11px] font-bold">{d.lado}</small><b className="text-xl leading-none">{d.numero}</b></span>
                  <span className="grid content-center gap-0.5 px-3.5 py-3">
                    <span className="text-[13px] text-texto-2">{d.assunto}</span>
                    <span className="text-[15.5px] leading-[1.3] font-bold">{d.perg}</span>
                    <span className="mt-1 text-[13.5px]"><Negritos texto={d.resp} /></span>
                  </span>
                </a>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-3">
                {cartoes.map(c => <CartaoPergunta key={c.n} c={c} ordem={ordem++} />)}
              </div>
            </section>
          );
        })}
        <p className="max-w-[90ch] text-[13px] text-texto-2">Os gráficos mostram o que anda junto, não o que causa. Toda comparação de chance de vitória é feita dentro do mesmo cargo.</p>
      </div>
    </div>
  );
}
