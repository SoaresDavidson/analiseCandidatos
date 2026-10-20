import { memo, type RefObject, useMemo, useState } from "react";
import { BuscaComLista, Caixa, useDica } from "../../componentes";
import { semAcento } from "../../lib/uf";
import { ABREV, ANOS, COR_OURO, COR_TEXTO_2, COR_VERDE, COR_VERDE_ESC, type Pessoa, RES } from "./logica";

const RANK: Record<number, number> = {
  13: 0,
  12: 1,
  11: 2,
  7: 3,
  8: 3,
  6: 4,
  9: 5,
  10: 5,
  4: 5,
  5: 6,
  3: 7,
  2: 8,
  1: 9,
};
const LANE: Record<number, string> = {
  0: "Vereador",
  1: "Vice-prefeito",
  2: "Prefeito",
  3: "Dep. estadual",
  4: "Dep. federal",
  5: "Vice ou suplente",
  6: "Senador",
  7: "Governador",
  8: "Vice-presidente",
  9: "Presidente",
};

const PONTO = "inline-block size-3.5 flex-none rounded-full";

/** Seção "A carreira de um político": busca por nome, linha do tempo por cargo e tabela. */
export function Carreira({
  pessoas,
  sel,
  aoEscolher,
  raiz,
}: {
  pessoas: Pessoa[];
  sel: number;
  aoEscolher: (id: number) => void;
  raiz: RefObject<HTMLDivElement | null>;
}) {
  const p = pessoas[sel];
  const cargos = [...new Set(p.r.filter(x => x.res === 0).map(x => ABREV[x.cargo].toLowerCase()))];
  const tent = p.r.filter(x => x.tentou).length;
  const n = p.r.length;

  return (
    <Caixa>
      <h2>A carreira de um político, eleição por eleição</h2>
      <label htmlFor="f-busca" className="text-[13px] font-bold">
        Busque qualquer político que já se elegeu nos 6 estados
      </label>
      <Busca pessoas={pessoas} aoEscolher={aoEscolher} />
      <p className="texto-simples text-base">
        <b>{p.nome}</b>
        {p.civil && p.civil !== p.nome ? ` (${p.civil})` : ""} disputou{" "}
        <b>
          {n} eleiç{n > 1 ? "ões" : "ão"}
        </b>{" "}
        de {p.r[0].ano} a {p.ult.ano} e venceu <b>{p.vit}</b>
        {cargos.length > 0 && ` (${cargos.join(", ")})`}.{" "}
        {tent
          ? `Tentou se reeleger ${tent} ${tent > 1 ? "vezes" : "vez"} e conseguiu ${p.reel}.`
          : "Nunca tentou se reeleger para o mesmo cargo."}{" "}
        {p.partidos > 1 ? `Passou por ${p.partidos} partidos.` : "Ficou no mesmo partido."}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-texto-2">
        <span className="inline-flex items-center gap-1.5">
          <i aria-hidden="true" className={`${PONTO} bg-verde-esc`} />
          Eleito
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i aria-hidden="true" className={`${PONTO} border-[3px] border-ouro bg-white`} />
          Não eleito
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i aria-hidden="true" className={`${PONTO} border-2 border-dashed border-texto-2 bg-white`} />
          Sem resultado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i
            aria-hidden="true"
            className={`${PONTO} bg-verde-esc shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--color-verde-esc)]`}
          />
          Reeleito
        </span>
        <span>Cada faixa é um cargo; a linha liga as candidaturas em ordem.</span>
      </div>
      <div ref={raiz} className="rolagem-x">
        <Escada p={p} />
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
      placeholder="Digite um nome: Flávio Dino, Caiado, Eduardo Leite, o vereador da sua cidade…"
      className="max-w-[520px]"
    />
  );
}

const W = 1080,
  L = 130,
  R = 30,
  T = 16,
  LH = 60;

/** Linha do tempo: uma faixa por cargo, um ponto por candidatura, ligados em ordem. */
const Escada = memo(function Escada({ p }: { p: Pessoa }) {
  const dica = useDica();
  const g = useMemo(() => {
    const lanes = [...new Set(p.r.map(x => RANK[x.cargo]))].sort((a, b) => b - a);
    const H = T + lanes.length * LH + 36,
      step = (W - L - R) / (ANOS.length - 1);
    const X = (a: number) => L + ANOS.indexOf(a) * step,
      Yl = (rk: number) => T + lanes.indexOf(rk) * LH + LH / 2;
    return { lanes, H, step, X, Yl };
  }, [p]);
  const { lanes, H, step, X, Yl } = g;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Linha do tempo da carreira, uma faixa por cargo"
      className="grafico min-w-[760px]"
    >
      {lanes.map((rk, i) => (
        <g key={rk}>
          {i % 2 === 0 && (
            <rect x={L - 22} y={T + i * LH} width={W - L - R + 44} height={LH} rx={6} className="fill-fundo" />
          )}
          <text x={L - 34} y={Yl(rk)} textAnchor="end" dominantBaseline="middle" className="svg-rotulo font-bold">
            {LANE[rk]}
          </text>
        </g>
      ))}
      {ANOS.map(a => (
        <g key={a}>
          <line x1={X(a)} x2={X(a)} y1={T} y2={T + lanes.length * LH} className="svg-grade" />
          <text x={X(a)} y={H - 12} textAnchor="middle" dominantBaseline="middle" className="svg-eixo">
            {a}
          </text>
        </g>
      ))}
      <polyline
        points={p.r.map(x => `${X(x.ano)},${Yl(RANK[x.cargo])}`).join(" ")}
        fill="none"
        stroke={COR_VERDE}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {p.r.map((x, i) => {
        const cx = X(x.ano),
          cy = Yl(RANK[x.cargo]);
        return (
          <g key={i}>
            {x.reeleito && <circle cx={cx} cy={cy} r={16} fill="none" stroke={COR_VERDE_ESC} strokeWidth={2} />}
            <circle
              cx={cx}
              cy={cy}
              r={11}
              fill={x.res === 0 ? COR_VERDE_ESC : "#fff"}
              stroke={x.res === 1 ? COR_OURO : x.res === 2 ? COR_TEXTO_2 : "#fff"}
              strokeWidth={x.res === 0 ? 2 : 3}
              strokeDasharray={x.res === 2 ? "4 3" : undefined}
            />
            <text x={cx} y={cy - 23} textAnchor="middle" dominantBaseline="middle" className="svg-eixo">
              {x.partido}
            </text>
            <rect
              x={cx - step / 2}
              y={cy - LH / 2}
              width={step}
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
