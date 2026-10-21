import { useMemo } from "react";
import { useDica, VerMais } from "../../componentes";
import { fmt } from "../../lib/formato";
import { UF_NOME } from "../../lib/uf";
import { media, pearson, reta, spearman } from "./calculo";
import { DicaMun, Texto } from "./comum";
import { type Filtros, type Municipio } from "./tipos";

interface Props {
  MUN: Municipio[];
  f: Filtros;
  ufs: readonly string[];
  aoMudarSemCap: (v: boolean) => void;
  aoEscolher: (cod: number) => void;
}

// ---------- dispersão: cada ponto é uma cidade ----------
const DW = 560,
  DH = 360,
  DL = 46,
  DB = 42,
  DT = 10,
  DR = 12;

function Dispersao({ MUN, f, aoMudarSemCap, aoEscolher }: Omit<Props, "ufs">) {
  const dica = useDica();
  const pts = useMemo(
    () => MUN.filter(m => m.u === f.mapaUf && m.ok && !(f.semCap && m.cap)),
    [MUN, f.mapaUf, f.semCap],
  );
  const xs = pts.map(m => m.pPop as number);
  const ys = pts.map(m => m.pEl as number);
  const n = xs.length;

  const xmax = Math.max(20, Math.ceil(Math.max(...xs) / 5) * 5);
  const X = (v: number) => DL + (DW - DL - DR) * (v / xmax);
  const Y = (v: number) => DT + (DH - DT - DB) * (1 - v / 100);
  const passoX = xmax > 30 ? 10 : 5;
  const ticksX = Array.from({ length: Math.floor(xmax / passoX) + 1 }, (_, i) => i * passoX);
  const yMeio = (DT + DH - DB) / 2;

  const rt = n > 2 ? reta(xs, ys) : null;
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs);
  const r = pearson(xs, ys),
    rho = spearman(xs, ys);
  const cap = MUN.find(m => m.u === f.mapaUf && m.cap);

  return (
    <div className="grid min-w-0 gap-2">
      <h3>{UF_NOME[f.mapaUf]}: cada ponto é uma cidade</h3>
      <svg
        className="grafico"
        role="img"
        aria-label="Dispersão: população com faculdade × eleitos com faculdade"
        viewBox={`0 0 ${DW} ${DH}`}
      >
        {ticksX.map(t => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={DT} y2={DH - DB} className="svg-grade" />
            <Texto x={X(t)} y={DH - DB + 14} cls="svg-eixo" anchor="middle">
              {t}%
            </Texto>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map(t => (
          <g key={t}>
            <line x1={DL} x2={DW - DR} y1={Y(t)} y2={Y(t)} className="svg-grade" />
            <Texto x={DL - 6} y={Y(t)} cls="svg-eixo" anchor="end">
              {t}%
            </Texto>
          </g>
        ))}
        <Texto x={(DL + DW - DR) / 2} y={DH - 8} cls="svg-eixo" anchor="middle">
          População com faculdade
        </Texto>
        <Texto x={12} y={yMeio} cls="svg-eixo" anchor="middle" transform={`rotate(-90 12 ${yMeio})`}>
          Eleitos com faculdade
        </Texto>
        {rt && (
          <line
            x1={X(x0)}
            x2={X(x1)}
            y1={Y(rt.a * x0 + rt.b)}
            y2={Y(rt.a * x1 + rt.b)}
            className="stroke-verde-esc"
            strokeWidth={2}
          />
        )}
        {pts.map(m => (
          <circle
            key={m.cod}
            cx={X(m.pPop as number)}
            cy={Y(m.pEl as number)}
            r={4.5}
            fillOpacity={0.75}
            strokeWidth={1}
            className={`cursor-pointer stroke-white ${m.cap ? "fill-capital" : "fill-ouro"}`}
            onMouseMove={ev => dica.mostrar(ev, <DicaMun m={m} />)}
            onMouseLeave={dica.esconder}
            onClick={() => aoEscolher(m.cod)}
          />
        ))}
      </svg>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.semCap} onChange={e => aoMudarSemCap(e.target.checked)} /> Tirar a capital
      </label>
      <p className="texto-nota">
        Correlação: r = {fmt(r, 2)} (Spearman {fmt(rho, 2)}), {n} cidades. Perto de 0: sem relação; perto de 1: relação
        forte. Marque "Tirar a capital" ({cap ? cap.n : ""}, em vermelho) para ver quanto da relação vem dela.
      </p>
    </div>
  );
}

// ---------- quintis: as cidades em 5 grupos ----------
const QW = 520,
  QH = 300,
  QL = 40,
  QB = 46,
  QT = 18;
const ROTULOS_GRUPO = ["Menos formadas", "", "", "", "Mais formadas"];

function Quintis({ MUN, ufs }: { MUN: Municipio[]; ufs: readonly string[] }) {
  const vals = useMemo(() => {
    const sel = MUN.filter(m => ufs.includes(m.u) && m.ok);
    const ord = [...sel].sort((a, b) => (a.pPop as number) - (b.pPop as number));
    const n = ord.length;
    const grupos = [0, 1, 2, 3, 4].map(i => ord.slice(Math.round((i * n) / 5), Math.round(((i + 1) * n) / 5)));
    return grupos.map(g => [media(g.map(m => m.pPop as number)), media(g.map(m => m.pEl as number))]);
  }, [MUN, ufs]);

  const ymax = Math.max(50, Math.ceil(Math.max(...vals.flat()) / 10) * 10);
  const Y = (v: number) => QT + (QH - QT - QB) * (1 - v / ymax);
  const cw = (QW - QL) / 5;
  const passo = ymax > 50 ? 20 : 10;
  const ticks = Array.from({ length: Math.floor(ymax / passo) + 1 }, (_, i) => i * passo);

  return (
    <div className="grid min-w-0 gap-2">
      <h3>Cidades em 5 grupos, da menos à mais formada</h3>
      <svg
        className="grafico"
        role="img"
        aria-label="Média de população e eleitos com faculdade em cada quinto das cidades"
        viewBox={`0 0 ${QW} ${QH}`}
      >
        {ticks.map(t => (
          <g key={t}>
            <line x1={QL} x2={QW} y1={Y(t)} y2={Y(t)} className="svg-grade" />
            <Texto x={QL - 6} y={Y(t)} cls="svg-eixo" anchor="end">
              {t}%
            </Texto>
          </g>
        ))}
        {vals.map(([p, e], i) => {
          const x0 = QL + i * cw + cw * 0.14,
            bw = cw * 0.34;
          return (
            <g key={i}>
              <rect x={x0} y={Y(p)} width={bw} height={Y(0) - Y(p)} rx={3} className="fill-ouro" />
              <rect x={x0 + bw + 3} y={Y(e)} width={bw} height={Y(0) - Y(e)} rx={3} className="fill-verde-esc" />
              <Texto x={x0 + bw / 2} y={Y(p) - 9} cls="svg-eixo" anchor="middle">
                {fmt(p, 0)}%
              </Texto>
              <Texto x={x0 + bw * 1.5 + 3} y={Y(e) - 9} cls="svg-eixo" anchor="middle">
                {fmt(e, 0)}%
              </Texto>
              <Texto x={QL + i * cw + cw / 2} y={QH - QB + 16} cls="svg-eixo" anchor="middle">
                {i + 1}º grupo
              </Texto>
              {ROTULOS_GRUPO[i] && (
                <Texto x={QL + i * cw + cw / 2} y={QH - QB + 31} cls="svg-eixo" anchor="middle">
                  {ROTULOS_GRUPO[i]}
                </Texto>
              )}
            </g>
          );
        })}
        <rect x={QL} y={0} width={11} height={11} rx={2} className="fill-ouro" />
        <Texto x={QL + 16} y={6} cls="svg-eixo">
          população
        </Texto>
        <rect x={QL + 100} y={0} width={11} height={11} rx={2} className="fill-verde-esc" />
        <Texto x={QL + 116} y={6} cls="svg-eixo">
          eleitos
        </Texto>
      </svg>
      <p className="texto-nota">
        Cada grupo tem o mesmo número de cidades. Em cada um: a média da população com faculdade e a dos eleitos com
        faculdade.
      </p>
    </div>
  );
}

/** Bloco "Ver cada cidade num gráfico e a comparação por faixas". */
export function Cidades({ MUN, f, ufs, aoMudarSemCap, aoEscolher }: Props) {
  return (
    <VerMais titulo="Ver cada cidade num gráfico e a comparação por faixas">
      <div className="grade-mapa">
        <Dispersao MUN={MUN} f={f} aoMudarSemCap={aoMudarSemCap} aoEscolher={aoEscolher} />
        <Quintis MUN={MUN} ufs={ufs} />
      </div>
    </VerMais>
  );
}
