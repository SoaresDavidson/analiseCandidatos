import { useEffect, useMemo, useState } from "react";
import { useDica } from "../../componentes";
import { fmt, int } from "../../lib/formato";
import { BONECO, CENA, lugaresNaCumbuca, lugaresNaCupula } from "./cena";
import type { Comparacao } from "./tipos";

const FIGURA = "M5 3.2a2.2 2.2 0 1 1 0.01 0zM1.6 13.5v-4.2a3.4 3.4 0 0 1 6.8 0v4.2z";
const COR_FUNDO = "#d99a00",
  COR_OUTRAS = "#5e7a12";
const { w: W, h: H, laje: LAJE, cupula: CUP, cumbuca: CUM } = CENA;
// as duas torres: 4 janelas por andar, 25 andares = 100 janelas cada
const TORRE = { y: 62, w: 46, esq: 546, dir: 608 };

/** O Congresso Nacional como gráfico. De cada 100 candidatos, os que dependem do fundo público
 *  ficam dentro da cumbuca (à direita) e os outros, na cúpula (à esquerda). As janelas acesas de
 *  cada torre contam quantos de cada 100 daquele grupo se elegeram. */
export function Congresso({ c, descricao }: { c: Comparacao; descricao: string }) {
  const dica = useDica();
  const N = c.g.pub.n + c.g.out.n;
  const k = N ? Math.round((100 * c.g.pub.n) / N) : 0;
  const naCupula = useMemo(() => lugaresNaCupula(), []);
  const naCumbuca = useMemo(() => lugaresNaCumbuca(), []);

  // na chegada, todos começam na cúpula e os do fundo público atravessam para a cumbuca
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    const q = requestAnimationFrame(() => setPronto(true));
    return () => cancelAnimationFrame(q);
  }, []);
  const alvo = pronto ? k : 0;
  // de onde veio a contagem: quem atravessa sai em fila, um logo depois do outro
  const [conta, setConta] = useState({ de: 0, para: 0 });
  if (alvo !== conta.para) setConta({ de: conta.para, para: alvo });
  const { de, para } = conta;

  const dicaGrupo = (nome: string, g: { n: number; e: number }, t: number | null) => (
    <>
      <b>{nome}</b>
      <br />
      {int(g.n)} candidatos ({fmt((100 * g.n) / (N || 1), 0)} em cada 100)
      <br />
      {int(g.e)} eleitos: {t == null ? "–" : fmt(t, 1)} em cada 100
    </>
  );
  const pub = (ev: React.MouseEvent) => dica.mostrar(ev, dicaGrupo("Dependem do fundo público", c.g.pub, c.tp));
  const out = (ev: React.MouseEvent) => dica.mostrar(ev, dicaGrupo("Outras fontes", c.g.out, c.to));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={descricao} className="block h-auto w-full rounded-xl">
      <defs>
        <linearGradient id="q8-ceu" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#d6ebf7" />
          <stop offset="1" stopColor="#f6fafc" />
        </linearGradient>
        <linearGradient id="q8-concreto" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9ecee" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#q8-ceu)" />
      {/* gramado e espelho d'água */}
      <rect y={346} width={W} height={H - 346} fill="#e4dfbf" />
      <rect x={110} y={364} width={980} height={20} rx={3} fill="#bcd9e8" />
      <rect x={110} y={364} width={980} height={5} rx={2.5} fill="#d8eaf3" />

      {/* a laje e a faixa de vidro embaixo dela */}
      <rect x={90} y={LAJE + 14} width={1020} height={32} fill="#45525d" />
      {Array.from({ length: 72 }, (_, i) => (
        <line
          key={i}
          x1={97 + i * 14.2}
          x2={97 + i * 14.2}
          y1={LAJE + 15}
          y2={LAJE + 46}
          stroke="#5d6b77"
          strokeWidth="1.2"
        />
      ))}
      <rect x={70} y={LAJE} width={1060} height={15} rx={2} fill="#fbfbf9" stroke="#cfd4d8" />
      {/* a rampa */}
      <path d={`M574,${LAJE + 15} H626 L662,372 H538 Z`} fill="#f4f5f3" stroke="#cfd4d8" />

      {/* as torres: a da esquerda conta os eleitos das outras fontes; a da direita, os do fundo */}
      <Torre x={TORRE.esq} acesas={c.to} cor={COR_OUTRAS} aoPassar={out} aoSair={dica.esconder} />
      <Torre x={TORRE.dir} acesas={c.tp} cor={COR_FUNDO} aoPassar={pub} aoSair={dica.esconder} />
      <rect x={TORRE.esq + TORRE.w} y={176} width={TORRE.dir - TORRE.esq - TORRE.w} height={9} fill="#dfe3e6" />
      <rect x={TORRE.esq + TORRE.w} y={191} width={TORRE.dir - TORRE.esq - TORRE.w} height={9} fill="#dfe3e6" />
      <text x={600} y={18} textAnchor="middle" className="pointer-events-none fill-texto-2 text-[13.5px] font-bold">
        eleitos em cada 100 do grupo
      </text>
      <Placar x={TORRE.esq + TORRE.w / 2} valor={c.to} cor={COR_OUTRAS} />
      <Placar x={TORRE.dir + TORRE.w / 2} valor={c.tp} cor="#8f6c00" />

      {/* a cúpula (outras fontes) e a cumbuca (fundo público) */}
      <path
        d={`M${CUP.cx - CUP.rx},${LAJE} A${CUP.rx},${CUP.ry} 0 0 1 ${CUP.cx + CUP.rx},${LAJE} Z`}
        fill="url(#q8-concreto)"
        onMouseMove={out}
        onMouseLeave={dica.esconder}
      />
      <path
        d={`M${CUM.cx - CUM.rx},${CUM.borda} A${CUM.rx},${CUM.ry} 0 0 0 ${CUM.cx + CUM.rx},${CUM.borda} Z`}
        fill="url(#q8-concreto)"
        onMouseMove={pub}
        onMouseLeave={dica.esconder}
      />

      {/* os 100 candidatos */}
      <g className="pointer-events-none">
        {Array.from({ length: 100 }, (_, i) => {
          const dentro = i < para;
          const [x, y] = dentro ? naCumbuca[i] : naCupula[99 - i];
          // só quem troca de lado nesta mudança pula, em fila
          const mexeu = i >= Math.min(de, para) && i < Math.max(de, para);
          const atraso = mexeu ? (para > de ? i - de : de - 1 - i) * 16 : 0;
          return (
            <g
              key={i}
              className="boneco"
              style={{
                transform: `translate(${(x - BONECO.w / 2).toFixed(1)}px, ${(y - BONECO.h).toFixed(1)}px)`,
                transitionDelay: `${atraso}ms`,
              }}
            >
              <g
                key={dentro ? "fundo" : "outras"}
                className={mexeu ? "boneco-pulo" : undefined}
                style={mexeu ? { animationDelay: `${atraso}ms` } : undefined}
              >
                <path d={FIGURA} transform={`scale(${BONECO.escala})`} fill={dentro ? COR_FUNDO : COR_OUTRAS} />
              </g>
            </g>
          );
        })}
      </g>

      {/* os contornos por cima dos bonecos, para eles ficarem "dentro" */}
      <path
        d={`M${CUP.cx - CUP.rx},${LAJE} A${CUP.rx},${CUP.ry} 0 0 1 ${CUP.cx + CUP.rx},${LAJE}`}
        fill="none"
        stroke="#b9c0c6"
        strokeWidth="3"
        className="pointer-events-none"
      />
      <path
        d={`M${CUM.cx - CUM.rx},${CUM.borda} A${CUM.rx},${CUM.ry} 0 0 0 ${CUM.cx + CUM.rx},${CUM.borda}`}
        fill="none"
        stroke="#b9c0c6"
        strokeWidth="3"
        className="pointer-events-none"
      />
      <line
        x1={CUM.cx - CUM.rx - 5}
        x2={CUM.cx + CUM.rx + 5}
        y1={CUM.borda}
        y2={CUM.borda}
        stroke="#b9c0c6"
        strokeWidth="4"
        strokeLinecap="round"
        className="pointer-events-none"
      />

      <Rotulo x={CUP.cx} valor={N ? 100 - k : null} cor={COR_OUTRAS} texto="pagam a campanha com outras fontes" />
      <Rotulo x={CUM.cx} valor={N ? k : null} cor="#8f6c00" texto="dependem do fundo público" />
    </svg>
  );
}

/** Número grande sobre a cúpula ou a cumbuca: quantos de cada 100 candidatos estão ali. */
function Rotulo({ x, valor, cor, texto }: { x: number; valor: number | null; cor: string; texto: string }) {
  return (
    <g className="pointer-events-none">
      <text x={x} y={104} textAnchor="middle" fill={cor} className="text-[58px] font-extrabold tabular-nums">
        {valor == null ? "–" : valor}
      </text>
      <text x={x} y={130} textAnchor="middle" className="fill-texto text-[16px] font-extrabold">
        {texto}
      </text>
      <text x={x} y={149} textAnchor="middle" className="fill-texto-2 text-[13.5px] font-bold">
        de cada 100 candidatos
      </text>
    </g>
  );
}

/** Em cima de cada torre: quantos de cada 100 do grupo se elegeram. */
function Placar({ x, valor, cor }: { x: number; valor: number | null; cor: string }) {
  return (
    <text
      x={x}
      y={54}
      textAnchor="middle"
      fill={cor}
      className="pointer-events-none text-[34px] font-extrabold tabular-nums"
    >
      {valor == null ? "–" : fmt(valor, 0)}
    </text>
  );
}

/** Uma torre com 100 janelas; as acesas (de baixo para cima) são os eleitos de cada 100. */
function Torre({
  x,
  acesas,
  cor,
  aoPassar,
  aoSair,
}: {
  x: number;
  acesas: number | null;
  cor: string;
  aoPassar: (ev: React.MouseEvent) => void;
  aoSair: () => void;
}) {
  const n = acesas == null ? 0 : Math.round(acesas);
  return (
    <g onMouseMove={aoPassar} onMouseLeave={aoSair}>
      <rect x={x} y={TORRE.y} width={TORRE.w} height={LAJE - TORRE.y} fill="#f1f3f4" stroke="#cfd4d8" />
      {Array.from({ length: 100 }, (_, i) => {
        // a janela 0 é a de baixo, à esquerda
        const andar = Math.floor(i / 4),
          col = i % 4;
        return (
          <rect
            key={i}
            className="janela"
            x={x + 3.6 + col * 10.2}
            y={LAJE - 11.5 - andar * 9.3}
            width={8.2}
            height={6.8}
            rx={1}
            fill={i < n ? cor : "#c3cad0"}
          />
        );
      })}
    </g>
  );
}
