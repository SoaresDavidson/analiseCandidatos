import { useMemo, useState } from "react";
import { BuscaComLista, type MalhaBrasil, useDica } from "../../componentes";
import { fmt, pc } from "../../lib/formato";
import { semAcento, UF_NOME } from "../../lib/uf";
import { GRADIENTE, METRICA, naRampa, perfil, rampa } from "./calculo";
import { indiceDoEstado, paginaDe } from "./capitulos";
import { DicaMun } from "./comum";
import type { DadosQ4, EstadoPronto, Metrica, Municipio } from "./tipos";

const SEM_DADO = "#d8ceb4";
const CONTORNO = "#6f5f3f";
const METRICAS: readonly (readonly [Metrica, string])[] = [
  ["pop", "População com faculdade"],
  ["el", "Eleitos com faculdade"],
  ["dist", "Diferença"],
];

/** Botões do que o mapa pinta e a régua de cores, iguais no mapa do país e nos dos estados. */
function Escolha({ metrica, aoMudar }: { metrica: Metrica; aoMudar: (m: Metrica) => void }) {
  return (
    <div role="group" aria-label="O que o mapa mostra" className="flex flex-wrap gap-1.5">
      {METRICAS.map(([m, rot]) => (
        <button key={m} type="button" className="livro-aba" aria-pressed={m === metrica} onClick={() => aoMudar(m)}>
          {rot}
        </button>
      ))}
    </div>
  );
}

function Regua({ metrica, capital, semDado }: { metrica: Metrica; capital?: boolean; semDado?: boolean }) {
  const M = METRICA[metrica];
  const marcas = [0, 0.25, 0.5, 0.75, 1].map(x => fmt(M.dom[0] + x * (M.dom[1] - M.dom[0]), 0) + (M.un ? "" : "%"));
  return (
    <div className="grid gap-1">
      <b className="text-[12px]">
        {metrica === "pop"
          ? "Adultos que terminaram a faculdade (Censo 2022)"
          : metrica === "el"
            ? "Prefeitos e vereadores eleitos em 2024 que têm faculdade"
            : "Diferença: eleitos menos população, em pontos percentuais"}
      </b>
      <div className="grid max-w-[340px] gap-0.5">
        <span className="block h-[10px] rounded-[2px]" style={{ background: GRADIENTE }} />
        <span className="flex justify-between text-[11px] text-tinta-2 tabular-nums">
          {marcas.map(m => (
            <span key={m}>{m}</span>
          ))}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11.5px] text-tinta-2">
        {semDado && (
          <span className="inline-flex items-center gap-1.5">
            <i aria-hidden="true" className="inline-block size-[11px] rounded-[2px]" style={{ background: SEM_DADO }} />
            sem dado
          </span>
        )}
        {capital && (
          <span className="inline-flex items-center gap-1.5">
            <i aria-hidden="true" className="inline-block size-[11px] rounded-full border-[2.5px] border-capital" />
            capital
          </span>
        )}
      </div>
    </div>
  );
}

/** Rosa dos ventos no canto do mapa, como nos atlas. */
function RosaDosVentos() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 70"
      className="pointer-events-none absolute right-1 bottom-1 w-[52px] opacity-70"
    >
      <g fill="none" stroke={CONTORNO} strokeWidth="1">
        <circle cx="30" cy="40" r="17" />
        <path d="M30,16 L35,40 L30,64 L25,40 Z M6,40 L30,35 L54,40 L30,45 Z" fill="#f4ead1" />
        <path
          d="M30,16 L35,40 L30,40 Z M30,64 L25,40 L30,40 Z M6,40 L30,35 L30,40 Z M54,40 L30,45 L30,40 Z"
          fill={CONTORNO}
        />
      </g>
      <text x="30" y="11" textAnchor="middle" className="fill-tinta font-livro text-[12px] font-bold">
        N
      </text>
    </svg>
  );
}

/** Página da esquerda do capítulo do Brasil: o país por estado; clicar num estado abre o capítulo dele. */
export function MapaPais({
  D,
  B,
  metrica,
  aoMudarMetrica,
  aoEscolherUf,
}: {
  D: DadosQ4;
  B: MalhaBrasil;
  metrica: Metrica;
  aoMudarMetrica: (m: Metrica) => void;
  aoEscolherUf: (uf: string) => void;
}) {
  const dica = useDica();
  // os mesmos dois números do mapa das cidades, para o estado inteiro (eleitos de 2024)
  const porUf = useMemo(() => {
    const r: Record<string, { pPop: number | null; pEl: number | null }> = {};
    for (const uf of D.ufs) {
      const q = perfil(D.perfil, 2024, [uf]);
      r[uf] = {
        pPop: pc(
          q[0][3],
          q[0].reduce((a, b) => a + b, 0),
        ),
        pEl: pc(
          q[2][3],
          q[2].reduce((a, b) => a + b, 0),
        ),
      };
    }
    return r;
  }, [D]);
  const M = METRICA[metrica];
  const valor = (uf: string): number | null => {
    const { pPop, pEl } = porUf[uf];
    if (metrica === "pop") return pPop;
    if (pEl == null || pPop == null) return null;
    return metrica === "el" ? pEl : pEl - pPop;
  };

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-2">
      <div className="grid gap-1.5">
        <h3 className="livro-secao">Mapa do Brasil · escolha um estado</h3>
        <Escolha metrica={metrica} aoMudar={aoMudarMetrica} />
      </div>
      <div className="relative min-h-0">
        <svg
          viewBox={`0 0 ${B.w} ${B.h}`}
          role="img"
          aria-label="Mapa do Brasil por estado"
          className="livro-mapa block size-full"
        >
          {Object.entries(B.ufs).map(([uf, e]) => {
            const v = valor(uf);
            return (
              <path
                key={uf}
                d={e.d}
                role="button"
                tabIndex={0}
                aria-label={`${UF_NOME[uf]}: abrir o capítulo`}
                fill={v == null ? SEM_DADO : rampa((v - M.dom[0]) / (M.dom[1] - M.dom[0]))}
                stroke={CONTORNO}
                strokeWidth={0.8}
                className="cursor-pointer outline-none hover:brightness-[.9] focus-visible:brightness-[.8]"
                onClick={() => aoEscolherUf(uf)}
                onKeyDown={ev => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    aoEscolherUf(uf);
                  }
                }}
                onMouseMove={ev =>
                  dica.mostrar(
                    ev,
                    <>
                      <b>{UF_NOME[uf]}</b> · página {paginaDe(indiceDoEstado(uf))}
                      <br />
                      População com faculdade: {fmt(porUf[uf].pPop, 0)}%<br />
                      Eleitos de 2024 com faculdade: {fmt(porUf[uf].pEl, 0)}%
                    </>,
                  )
                }
                onMouseLeave={dica.esconder}
              />
            );
          })}
          {Object.entries(B.ufs).map(([uf, e]) =>
            (e.bb[2] - e.bb[0]) * (e.bb[3] - e.bb[1]) > 1500 ? (
              <text
                key={uf}
                x={e.c[0]}
                y={e.c[1]}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none fill-tinta text-[27px] font-extrabold [paint-order:stroke] stroke-[#fbf5e3]/85 stroke-[6px]"
              >
                {uf}
              </text>
            ) : null,
          )}
        </svg>
        <RosaDosVentos />
      </div>
      <Regua metrica={metrica} />
    </div>
  );
}

/** Página da esquerda de um estado: o mapa das cidades. Clicar numa cidade mostra, na página ao lado, quem foi eleito. */
export function MapaEstado({
  P,
  metrica,
  sel,
  aoMudarMetrica,
  aoSelecionar,
}: {
  P: EstadoPronto;
  metrica: Metrica;
  sel: number | null;
  aoMudarMetrica: (m: Metrica) => void;
  aoSelecionar: (cod: number | null) => void;
}) {
  const dica = useDica();
  const [busca, setBusca] = useState("");
  // o Distrito Federal é um só "município", sem prefeito nem vereador: o mapa fica na população
  const semCidades = P.MUN.length <= 1;
  const pinta: Metrica = semCidades ? "pop" : metrica;
  const [x0, y0, x1, y1] = P.malha.bb;
  const folga = Math.max(x1 - x0, y1 - y0) * 0.03;
  // a cidade escolhida é desenhada por último, para o contorno não ficar escondido
  const ordem = useMemo(() => {
    const todos = P.MUN.filter(m => P.malha.p[m.cod]);
    const escolhida = todos.find(m => m.cod === sel);
    return escolhida ? [...todos.filter(m => m !== escolhida), escolhida] : todos;
  }, [P, sel]);
  const capital = P.MUN.find(m => m.cap && P.malha.p[m.cod]);
  const achados = useMemo<Municipio[] | null>(() => {
    const t = semAcento(busca.trim());
    if (t.length < 2) return null;
    return P.MUN.filter(m => semAcento(m.n).includes(t))
      .sort((a, b) => +semAcento(b.n).startsWith(t) - +semAcento(a.n).startsWith(t) || b.popTotal - a.popTotal)
      .slice(0, 8);
  }, [P, busca]);

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-2">
      <div className="grid gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <h3 className="livro-secao min-w-[12em] flex-1">
            {semCidades ? "Mapa" : "Mapa das cidades"} · {UF_NOME[P.uf]}
          </h3>
          {!semCidades && (
            <BuscaComLista
              texto={busca}
              aoDigitar={setBusca}
              achados={achados}
              chave={m => m.cod}
              rotulo={m => m.n}
              aoEscolher={m => aoSelecionar(m.cod)}
              vazio="Nenhuma cidade com esse nome"
              placeholder="Buscar cidade"
              ariaLabel={`Buscar cidade em ${UF_NOME[P.uf]}`}
              className="w-[190px]"
              campoClassName="w-full rounded-full border border-[#b9a678] bg-white/50 px-3 py-1 text-[13px]"
              alturaLista="max-h-64"
            />
          )}
        </div>
        {semCidades ? (
          <p className="livro-nota">Sem municípios, o mapa mostra só quanto a população adulta estudou.</p>
        ) : (
          <Escolha metrica={metrica} aoMudar={aoMudarMetrica} />
        )}
      </div>
      <div className="relative min-h-0">
        <svg
          viewBox={`${x0 - folga} ${y0 - folga} ${x1 - x0 + 2 * folga} ${y1 - y0 + 2 * folga}`}
          role="img"
          aria-label={`Mapa dos municípios de ${UF_NOME[P.uf]}`}
          className="livro-mapa block size-full"
        >
          {ordem.map(m => {
            const t = naRampa(pinta, m);
            const escolhida = m.cod === sel;
            return (
              <path
                key={m.cod}
                d={P.malha.p[m.cod][0]}
                fill={t == null ? SEM_DADO : rampa(t)}
                stroke={escolhida ? "#1d1509" : CONTORNO}
                strokeWidth={escolhida ? 2.6 : 0.45}
                className="cursor-pointer hover:brightness-[.88]"
                onMouseMove={ev => dica.mostrar(ev, <DicaMun m={m} />)}
                onMouseLeave={dica.esconder}
                onClick={() => aoSelecionar(escolhida ? null : m.cod)}
              />
            );
          })}
          {capital && (
            <circle
              cx={P.malha.p[capital.cod][1]}
              cy={P.malha.p[capital.cod][2]}
              r={Math.max(x1 - x0, y1 - y0) / 70}
              fill="none"
              strokeWidth={2.5}
              className="pointer-events-none stroke-capital [vector-effect:non-scaling-stroke]"
            />
          )}
        </svg>
        <RosaDosVentos />
      </div>
      <Regua metrica={pinta} capital={!!capital} semDado={P.MUN.some(m => naRampa(pinta, m) == null)} />
    </div>
  );
}
