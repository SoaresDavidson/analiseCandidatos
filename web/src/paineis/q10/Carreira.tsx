import { memo, type RefObject, useMemo, useState } from "react";
import { Botao, BuscaComLista, Caixa, useDica } from "../../componentes";
import { noLugar, semAcento, UF_NOME } from "../../lib/uf";
import type { Foto } from "./fotos";
import {
  ABREV,
  ANO_FIM,
  ANO_PARCIAL,
  ANOS,
  COR_OURO,
  COR_SEM_DADO,
  COR_TEXTO_2,
  COR_VERDE,
  COR_VERDE_ESC,
  FAIXA,
  FAIXA_NOME,
  mandatos,
  type Pessoa,
  RES,
} from "./logica";
import "./q10.css";
import { Retrato } from "./Retrato";

const PONTO = "inline-block size-3.5 flex-none rounded-full";

/** Seção "A carreira de um político": busca por nome, cartão com a foto e os cargos ao longo do tempo. */
export function Carreira({
  pessoas,
  uf,
  sel,
  foto,
  fotosProntas,
  aoEscolher,
  aoPatrimonio,
  raiz,
}: {
  /** as pessoas do estado do filtro (no país: quem já foi governador, senador ou deputado) */
  pessoas: Pessoa[];
  uf: string;
  sel: number;
  /** foto casada com a lista de eleitos; `fotosProntas` = a lista já chegou */
  foto: Foto | null;
  fotosProntas: boolean;
  aoEscolher: (id: number) => void;
  aoPatrimonio: () => void;
  raiz: RefObject<HTMLDivElement | null>;
}) {
  const p = pessoas[sel];

  return (
    <Caixa>
      <h2>A carreira de um político, eleição por eleição</h2>
      <label htmlFor="f-busca" className="text-[13px] font-bold">
        {uf === "TODAS"
          ? "Busque um governador, senador ou deputado do país (para prefeitos e vereadores, escolha o estado no alto)"
          : `Busque qualquer político que já se elegeu ${noLugar(uf)}`}
      </label>
      <Busca pessoas={pessoas} aoEscolher={aoEscolher} />
      <div ref={raiz} className="grid items-start gap-[18px] min-[801px]:grid-cols-[236px_minmax(0,1fr)]">
        <Cartao p={p} foto={foto} fotosProntas={fotosProntas} aoPatrimonio={aoPatrimonio} />
        <div className="grid min-w-0 gap-2.5">
          <h3>Os cargos ao longo do tempo</h3>
          <div className="rolagem-x">
            <LinhaDoTempo key={p.id} p={p} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-texto-2">
            <span className="inline-flex items-center gap-1.5">
              <i aria-hidden="true" className="inline-block h-2.5 w-7 flex-none rounded-full bg-verde" />
              Mandato conquistado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i aria-hidden="true" className={`${PONTO} bg-verde-esc`} />
              Eleito
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i
                aria-hidden="true"
                className={`${PONTO} bg-verde-esc shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--color-verde-esc)]`}
              />
              Reeleito
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i aria-hidden="true" className={`${PONTO} border-[3px] border-ouro bg-white`} />
              Não eleito
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i aria-hidden="true" className={`${PONTO} border-2 border-dashed border-texto-2 bg-white`} />
              Sem resultado
            </span>
          </div>
          <p className="texto-nota">
            Barra = mandato conquistado na urna (4 anos; 8 para senador), até a vitória seguinte. Fonte: TSE, cadastro
            de candidaturas, 2002 a 2026. Em {ANO_PARCIAL}, o resultado é o do 1º turno, como estava no TSE na coleta.
          </p>
        </div>
      </div>
      <details>
        <summary className="cursor-pointer font-bold">Ver todas as candidaturas desta pessoa</summary>
        <div className="rolagem-x mt-2 [&_:is(th,td)]:text-left">
          <table>
            <thead>
              <tr>
                <th>Ano</th>
                <th>Cargo</th>
                <th>Local</th>
                <th>Partido</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {p.r.map((x, i) => (
                <tr key={i}>
                  <td>{x.ano}</td>
                  <td>{ABREV[x.cargo]}</td>
                  <td>
                    {x.local} ({x.uf})
                  </td>
                  <td>{x.partido}</td>
                  <td>
                    {RES[x.res]}
                    {x.reeleito ? " · reeleito" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Caixa>
  );
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="grid rounded-lg bg-branco px-2 py-1.5 leading-tight">
      <b className="text-[22px] font-extrabold tabular-nums">{valor}</b>
      <span className="text-[12px] text-texto-2">{rotulo}</span>
    </div>
  );
}

/** Cartão da esquerda: foto, nome, último mandato, botão do patrimônio e os números da carreira. */
function Cartao({
  p,
  foto,
  fotosProntas,
  aoPatrimonio,
}: {
  p: Pessoa;
  foto: Foto | null;
  fotosProntas: boolean;
  aoPatrimonio: () => void;
}) {
  const vitoria = p.r.findLast(x => x.res === 0) ?? p.ult;
  const estadual = vitoria.local === UF_NOME[vitoria.uf];

  return (
    <aside className="grid gap-2.5 rounded-caixa bg-fundo p-3.5 text-center">
      <Retrato foto={foto} nome={p.nome} className="mx-auto aspect-[3/4] w-full max-w-[208px] !rounded-xl text-6xl" />
      <div className="grid gap-0.5">
        <b className="text-[19px] leading-tight font-extrabold">{p.nome}</b>
        {p.civil && p.civil !== p.nome && <span className="text-[12.5px] text-texto-2">{p.civil}</span>}
        <span className="text-[13.5px]">
          {ABREV[vitoria.cargo]} · {vitoria.local}
          {estadual ? "" : ` (${vitoria.uf})`} · {vitoria.ano}
        </span>
      </div>
      <Botao onClick={aoPatrimonio} aria-haspopup="dialog">
        Patrimônio
      </Botao>
      <div className="grid grid-cols-2 gap-1.5">
        <Numero valor={p.r.length} rotulo={p.r.length > 1 ? "eleições" : "eleição"} />
        <Numero valor={p.vit} rotulo={p.vit > 1 ? "vitórias" : "vitória"} />
        <Numero valor={p.reel} rotulo={p.reel === 1 ? "reeleição" : "reeleições"} />
        <Numero valor={p.partidos} rotulo={p.partidos > 1 ? "partidos" : "partido"} />
      </div>
      <p className="text-[11.5px] leading-snug text-texto-2">
        {foto
          ? `Foto do registro no TSE, ${foto.ano}.`
          : fotosProntas
            ? "Sem foto: o painel tem as dos eleitos de 2022 e 2024."
            : ""}
      </p>
    </aside>
  );
}

/** Campo de busca com lista de achados (mínimo de 3 letras, até 10 resultados). */
function Busca({ pessoas, aoEscolher }: { pessoas: Pessoa[]; aoEscolher: (id: number) => void }) {
  const [texto, setTexto] = useState("");
  const q = semAcento(texto.trim());
  const achados = useMemo(() => {
    if (q.length < 3) return null;
    const termos = q.split(/\s+/);
    return pessoas
      .filter(p => termos.every(t => p.busca.includes(t)))
      .sort((a, b) => b.vit - a.vit || b.r.length - a.r.length)
      .slice(0, 10);
  }, [pessoas, q]);

  return (
    <BuscaComLista
      id="f-busca"
      texto={texto}
      aoDigitar={setTexto}
      achados={achados}
      chave={p => p.id}
      rotulo={p => (
        <>
          <b>{p.nome}</b>{" "}
          <small className="text-texto-2">
            {p.ufs.join(", ")} · {ABREV[p.ult.cargo]} em {p.ult.ano} · {p.vit} vitória{p.vit > 1 ? "s" : ""}
          </small>
        </>
      )}
      aoEscolher={p => aoEscolher(p.id)}
      vazio="Ninguém com esse nome entre os eleitos."
      ariaLabel="Buscar político pelo nome"
      placeholder="Digite um nome (3 letras ou mais)"
      className="max-w-[520px]"
    />
  );
}

const W = 780,
  L = 122,
  R = 22,
  T = 6,
  LH = 56;
// eixo de 2 em 2 anos, até o fim do mandato de quem venceu em 2026
const EIXO = Array.from({ length: (ANO_FIM - ANOS[0]) / 2 + 1 }, (_, k) => ANOS[0] + 2 * k);
const X = (ano: number) => L + ((W - L - R) * (ano - ANOS[0])) / (ANO_FIM - ANOS[0]);
const PASSO = X(ANOS[1]) - X(ANOS[0]);

/** Uma faixa por cargo: barra verde nos mandatos conquistados e um ponto em cada candidatura. */
const LinhaDoTempo = memo(function LinhaDoTempo({ p }: { p: Pessoa }) {
  const dica = useDica();
  const g = useMemo(() => {
    const faixas = [...new Set(p.r.map(x => FAIXA[x.cargo]))].sort((a, b) => b - a);
    const Y = (faixa: number) => T + faixas.indexOf(faixa) * LH + LH / 2 + 7;
    return { faixas, Y, H: T + faixas.length * LH + 28, barras: mandatos(p.r) };
  }, [p]);
  const { faixas, Y, H, barras } = g;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Linha do tempo de ${p.nome}: uma faixa por cargo, com os mandatos conquistados`}
      className="grafico min-w-[620px]"
    >
      {faixas.map((fx, i) => (
        <g key={fx}>
          {i % 2 === 0 && (
            <rect x={L - 16} y={T + i * LH} width={W - L - R + 32} height={LH} rx={8} className="fill-fundo" />
          )}
          <text x={L - 26} y={Y(fx)} textAnchor="end" dominantBaseline="middle" className="svg-rotulo font-bold">
            {FAIXA_NOME[fx]}
          </text>
        </g>
      ))}
      {EIXO.map(a => (
        <g key={a}>
          <line x1={X(a)} x2={X(a)} y1={T} y2={T + faixas.length * LH} className="svg-grade" />
          <text
            x={X(a)}
            y={H - 11}
            textAnchor="middle"
            dominantBaseline="middle"
            className={a === ANO_PARCIAL ? "svg-eixo font-extrabold fill-ouro-esc" : "svg-eixo"}
          >
            {a}
            {a === ANO_PARCIAL ? "*" : ""}
          </text>
        </g>
      ))}
      <polyline
        points={p.r.map(x => `${X(x.ano)},${Y(FAIXA[x.cargo])}`).join(" ")}
        fill="none"
        stroke={COR_SEM_DADO}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {barras.map(b => (
        <rect
          key={`${b.faixa}-${b.inicio}`}
          className="q10-mandato"
          x={X(b.inicio)}
          y={Y(b.faixa) - 7}
          width={X(b.fim) - X(b.inicio)}
          height={14}
          rx={7}
          fill={COR_VERDE}
        />
      ))}
      {p.r.map((x, i) => {
        const cx = X(x.ano),
          cy = Y(FAIXA[x.cargo]);
        const mudouPartido = i === 0 || p.r[i - 1].partido !== x.partido;
        return (
          <g key={i}>
            {x.reeleito && <circle cx={cx} cy={cy} r={14} fill="#fff" stroke={COR_VERDE_ESC} strokeWidth={2} />}
            <circle
              cx={cx}
              cy={cy}
              r={x.res === 0 ? 10 : 8.5}
              fill={x.res === 0 ? COR_VERDE_ESC : "#fff"}
              stroke={x.res === 1 ? COR_OURO : x.res >= 2 ? COR_TEXTO_2 : "#fff"}
              strokeWidth={x.res === 0 ? 2 : 3}
              strokeDasharray={x.res >= 2 ? "4 3" : undefined}
            />
            {mudouPartido && (
              <text x={cx} y={cy - 22} textAnchor="middle" dominantBaseline="middle" className="svg-eixo font-bold">
                {x.partido}
              </text>
            )}
            <rect
              x={cx - PASSO / 2}
              y={cy - LH / 2 - 7}
              width={PASSO}
              height={LH}
              fill="transparent"
              onMouseMove={ev =>
                dica.mostrar(
                  ev,
                  <>
                    <b>
                      {x.ano} · {ABREV[x.cargo]}
                    </b>
                    <br />
                    {x.local} ({x.uf})<br />
                    {x.partido} · {RES[x.res]}
                    {x.reeleito ? " · reeleito" : x.tentou ? " · tentou se reeleger" : ""}
                  </>,
                )
              }
              onMouseLeave={dica.esconder}
            />
          </g>
        );
      })}
    </svg>
  );
});
