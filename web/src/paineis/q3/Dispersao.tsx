import { useMemo, useState } from "react";
import { Botao, Caixa, Chip, Linha, useDica } from "../../componentes";
import { mediana } from "../../lib/estatistica";
import { fmt, int } from "../../lib/formato";
import { useNavegacao } from "../../lib/navegacao";
import { semAcento } from "../../lib/uf";
import { brl, PERFIL } from "./calculo";
import type { Indice, Municipio } from "./tipos";

const W = 640,
  H = 420,
  L = 46,
  R = 16,
  T = 12,
  B = 40;

interface Props {
  indice: Indice;
  chaveIndice: string;
  todos: Municipio[];
  filtrados: Municipio[];
  sel: number | null;
  aoSelecionar: (cod: number) => void;
  meio: number;
  corPartido: (sg: string) => string;
}

/** Eixos e marcas do gráfico, calculados à parte do JSX. */
function geometria(xs: Municipio[], indice: Indice, chaveIndice: string) {
  const vx = xs.map(m => indice.v(m)!);
  const lo = Math.min(...vx),
    hi = Math.max(...vx),
    lg = indice.log && lo > 0;
  const X = (v: number) =>
    L + (W - L - R) * (lg ? (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (v - lo) / (hi - lo || 1));
  const y0 = Math.floor(Math.min(...xs.map(m => m.voto!))),
    y1 = Math.ceil(Math.max(...xs.map(m => m.voto!)));
  const Y = (v: number) => T + (H - T - B) * (1 - (v - y0) / (y1 - y0));
  const yMarcas = Array.from({ length: y1 - y0 + 1 }, (_, i) => y0 + i);
  const marcas = lg
    ? [1, 2, 5].flatMap(k => [1e2, 1e3, 1e4, 1e5, 1e6].map(p => k * p)).filter(v => v >= lo && v <= hi)
    : Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const rotulo = (v: number) =>
    chaveIndice === "pib" ? `R$ ${int(v / 1e3)} mil` : chaveIndice === "renda" ? `R$ ${int(v)}` : indice.f(v);
  return { lg, X, Y, yMarcas, marcas, rotulo };
}

export function Dispersao({ indice, chaveIndice, todos, filtrados, sel, aoSelecionar, meio, corPartido }: Props) {
  const dica = useDica();
  const [busca, setBusca] = useState("");
  const xs = useMemo(() => filtrados.filter(m => indice.v(m) != null && m.voto != null), [filtrados, indice]);
  const g = useMemo(() => (xs.length ? geometria(xs, indice, chaveIndice) : null), [xs, indice, chaveIndice]);

  // "Cidade (UF)" vem da lista de sugestões; também aceita só parte do nome
  const procurar = (valor: string, parcial: boolean) => {
    const q = semAcento(valor.replace(/\s*\([A-Z]{2}\)$/, "").trim());
    if (!q) return;
    const m = filtrados.find(x => x.busca === q) || (parcial ? filtrados.find(x => x.busca.includes(q)) : undefined);
    if (m) {
      aoSelecionar(m.cod);
      setBusca("");
    }
  };

  return (
    <Caixa>
      <h2>Cada cidade: {indice.rot} × para que lado votou</h2>
      <div className="flex flex-wrap items-end gap-x-[18px] gap-y-2.5">
        <input
          className="entrada"
          type="search"
          placeholder="Buscar cidade"
          aria-label="Buscar cidade no gráfico"
          autoComplete="off"
          list="cidades-lista"
          value={busca}
          onChange={ev => {
            setBusca(ev.target.value);
            if (/\([A-Z]{2}\)$/.test(ev.target.value)) procurar(ev.target.value, false);
          }}
          onBlur={ev => procurar(ev.target.value, true)}
          onKeyDown={ev => {
            if (ev.key === "Enter") procurar(ev.currentTarget.value, true);
          }}
        />
        <datalist id="cidades-lista">
          {xs.map(m => (
            <option key={m.cod} value={`${m.nome} (${m.uf})`} />
          ))}
        </datalist>
      </div>
      <div className="grade-mapa">
        {g && (
          <svg
            className="grafico max-h-[520px]"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label="Cada cidade: índice × nota do voto para vereador"
          >
            {g.yMarcas.map(v => (
              <g key={v}>
                <line x1={L} x2={W - R} y1={g.Y(v)} y2={g.Y(v)} className="svg-grade" />
                <text x={L - 6} y={g.Y(v)} className="svg-eixo" textAnchor="end" dominantBaseline="middle">
                  {v}
                </text>
              </g>
            ))}
            {g.marcas.map(v => (
              <g key={v}>
                <line x1={g.X(v)} x2={g.X(v)} y1={T} y2={H - B} className="svg-grade" />
                <text x={g.X(v)} y={H - B + 14} className="svg-eixo" textAnchor="middle" dominantBaseline="middle">
                  {g.rotulo(v)}
                </text>
              </g>
            ))}
            <text x={(L + W) / 2} y={H - 6} className="svg-eixo" textAnchor="middle" dominantBaseline="middle">
              {indice.rot + (g.lg ? " (escala logarítmica)" : "")}
            </text>
            <line x1={L} x2={W - R} y1={g.Y(meio)} y2={g.Y(meio)} className="stroke-texto" strokeDasharray="4 3" />
            <text x={W - R} y={g.Y(meio) - 8} className="svg-eixo" textAnchor="end" dominantBaseline="middle">
              meio da régua
            </text>
            {xs.map(m => {
              const escolhida = m.cod === sel;
              return (
                <circle
                  key={m.cod}
                  cx={g.X(indice.v(m)!)}
                  cy={g.Y(m.voto!)}
                  r={escolhida ? 7 : m.cap ? 5 : 3.2}
                  fill={corPartido(m.pref)}
                  fillOpacity={escolhida ? 1 : 0.75}
                  className={escolhida ? "stroke-texto" : "stroke-white"}
                  strokeWidth={escolhida ? 2.5 : 0.6}
                  onMouseMove={ev =>
                    dica.mostrar(
                      ev,
                      <>
                        <b>{m.nome}</b> ({m.uf})<br />
                        {indice.curto}: {indice.f(indice.v(m))}
                        <br />
                        nota do voto: {fmt(m.voto, 2)}
                        <br />
                        prefeito: {m.pref || "–"}
                      </>,
                    )
                  }
                  onMouseLeave={dica.esconder}
                  onClick={() => aoSelecionar(m.cod)}
                />
              );
            })}
          </svg>
        )}
        <Detalhe todos={todos} sel={sel} corPartido={corPartido} />
      </div>
      <p className="texto-nota">
        Cada ponto é uma cidade; a cor é o espectro do partido do prefeito eleito. Eixo vertical: nota do voto para
        vereador (0 = esquerda, 10 = direita).
      </p>
    </Caixa>
  );
}

function Detalhe({
  todos,
  sel,
  corPartido,
}: {
  todos: Municipio[];
  sel: number | null;
  corPartido: (sg: string) => string;
}) {
  const nav = useNavegacao();
  const m = todos.find(x => x.cod === sel);
  if (!m)
    return (
      <div className="grid gap-2.5">
        <p className="text-texto-2">
          Clique num ponto (ou busque a cidade) para ver os índices dela comparados com os do estado.
        </p>
      </div>
    );

  const doUf = todos.filter(x => x.uf === m.uf);
  const med = (f: (x: Municipio) => number | null) => mediana(doUf.map(f));
  const linha = (rotulo: string, valor: string, mv: string) => (
    <Linha
      rotulo={rotulo}
      valor={
        <>
          {valor} <small className="font-semibold text-texto-2">(mediana do estado: {mv})</small>
        </>
      }
    />
  );
  return (
    <div className="grid gap-2.5">
      <h3 className="mb-0.5">
        {m.nome} ({m.uf}){m.cap ? " · capital" : ""}
      </h3>
      {linha("PIB per capita (2023)", brl(m.pib), brl(med(x => x.pib)))}
      {linha(
        "Renda per capita (Censo 2022)",
        m.renda == null ? "–" : `R$ ${int(m.renda)}`,
        (r => (r == null ? "R$ –" : `R$ ${int(r)}`))(med(x => x.renda)),
      )}
      {linha("Anos de estudo (Censo 2022)", fmt(m.estudo), fmt(med(x => x.estudo)))}
      {linha(
        "Eleitores por habitante",
        fmt(m.eleitHab, 2),
        fmt(
          med(x => x.eleitHab),
          2,
        ),
      )}
      {linha("Isentos (prefeito, 1º turno)", `${fmt(m.isentos)}%`, `${fmt(med(x => x.isentos))}%`)}
      <Linha rotulo="Perfil econômico (2021)" valor={m.perfil >= 0 ? PERFIL[m.perfil] : "–"} />
      <Linha rotulo="Prefeito eleito em 2024" valor={<Chip cor={corPartido(m.pref)}>{m.pref || "–"}</Chip>} />
      <Linha
        rotulo="Maior bancada de vereadores"
        valor={
          <>
            <Chip cor={corPartido(m.banc)}>{m.banc || "–"}</Chip>{" "}
            {m.qtBanc ? `${m.qtBanc} cadeiras${m.empate ? " (empatada)" : ""}` : ""}
          </>
        }
      />
      <Linha rotulo="Nota do voto para vereador" valor={fmt(m.voto, 2)} />
      <Botao onClick={() => nav.abrirMunicipio(m.cod)} className="mt-1.5 justify-self-start">
        Ver tudo sobre {m.nome}
      </Botao>
    </div>
  );
}
