import { useEffect, useId, useState } from "react";
import { Alternador } from "../../componentes";
import { CATEGORIAS, CORTES } from "../../lib/espectro";
import { Mascote } from "./Mascote";
import type { DadosQ7, Filtros, Notas, Par } from "./tipos";
import { anoDe, corNota, f2, naCategoria, PARADAS, PARES, paraOnde, sinal } from "./util";

const W = 1200,
  H = 252,
  X0 = 80,
  X1 = 1120,
  /** altura do chão (onde o personagem pisa) */
  CHAO = 174,
  ESPESSURA = 16;
const X = (v: number) => X0 + ((X1 - X0) * v) / 10;
const semMovimento = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const FOTO = (nome: string) => `${import.meta.env.BASE_URL}img/q7/${nome}.jpg`;

/** O chão da esquerda à direita: a régua de 0 a 10 pintada do vermelho ao azul, com o PT de Lula e
 *  o PL de Bolsonaro plantados nas notas dos dois partidos. A urninha corre até a nota do lugar
 *  escolhido no mapa; as setas embaixo marcam as duas eleições do mesmo cargo. */
export function Chao({
  D,
  nome,
  notas,
  f,
  aoMudar,
  children,
}: {
  D: DadosQ7;
  /** o lugar na tela: "Brasil", "Piauí" ou "Teresina (PI)" */
  nome: string;
  notas: Notas;
  f: Filtros;
  aoMudar: (p: Partial<Filtros>) => void;
  /** a trilha (Brasil › estado › cidade), no alto à esquerda */
  children?: React.ReactNode;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [a, b, cargo, aa, ab] = PARES[f.par];
  const i = anoDe(f),
    ano = D.anos[i],
    nota = notas[i],
    na = notas[a],
    nb = notas[b];
  const d = na != null && nb != null ? nb - na : null;

  return (
    <section className="relative grid gap-1.5 rounded-caixa bg-branco px-5 pt-3 pb-2.5 shadow-[0_6px_18px_rgb(27_34_43/.1)]">
      {/* em tela larga, a trilha e os controles ficam sobre os cantos vazios do desenho */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2.5 min-[981px]:pointer-events-none min-[981px]:absolute min-[981px]:inset-x-5 min-[981px]:top-3 min-[981px]:z-[1]">
        <div className="pointer-events-auto max-w-[min(100%,330px)]">{children}</div>
        <div className="pointer-events-auto flex flex-wrap gap-2 min-[981px]:flex-col min-[981px]:items-end">
          <Alternador<Par>
            rotulo="Voto para"
            valor={f.par}
            aoMudar={par => aoMudar({ par })}
            opcoes={[
              ["mun", "Vereador"],
              ["ger", "Dep. federal"],
            ]}
          />
          <Alternador<0 | 1>
            rotulo="Eleição"
            valor={f.quando}
            aoMudar={quando => aoMudar({ quando })}
            opcoes={[
              [0, aa],
              [1, ab],
            ]}
          />
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Régua de 0 (esquerda) a 10 (direita). ${nome}: ${nota == null ? "sem nota" : `nota ${f2(nota)}, ${naCategoria(nota)}`} em ${ano}.`}
        className="block h-auto w-full"
      >
        <defs>
          <linearGradient id={`${id}chao`} x1="0" x2="1" y1="0" y2="0">
            {PARADAS.map(p => (
              <stop key={p.em} offset={p.em} stopColor={p.cor} />
            ))}
          </linearGradient>
          <clipPath id={`${id}pt`}>
            <circle cx={X(D.marcos.pt)} cy={RETRATO_Y} r={RETRATO_R} />
          </clipPath>
          <clipPath id={`${id}pl`}>
            <circle cx={X(D.marcos.pl)} cy={RETRATO_Y} r={RETRATO_R} />
          </clipPath>
        </defs>

        {/* os dois marcos: o partido de cada um, na nota que os cientistas políticos deram */}
        <Marco x={X(D.marcos.pt)} recorte={`${id}pt`} foto={FOTO("lula")} nome="Lula" nota={D.marcos.pt} sigla="PT" />
        <Marco
          x={X(D.marcos.pl)}
          recorte={`${id}pl`}
          foto={FOTO("bolsonaro")}
          nome="Bolsonaro"
          nota={D.marcos.pl}
          sigla="PL"
          aDireita
        />

        {/* o chão */}
        <rect x={X0} y={CHAO} width={X1 - X0} height={ESPESSURA} rx={ESPESSURA / 2} fill={`url(#${id}chao)`} />
        <text x={X0 - 12} y={CHAO + 9} textAnchor="end" dominantBaseline="middle" className="svg-rotulo font-extrabold">
          0
        </text>
        <text x={X1 + 12} y={CHAO + 9} dominantBaseline="middle" className="svg-rotulo font-extrabold">
          10
        </text>

        {/* as 7 faixas do artigo, embaixo */}
        {CATEGORIAS.map((c, k) => {
          const de = k ? CORTES[k - 1] : 0,
            ate = k < 6 ? CORTES[k] : 10;
          return (
            <g key={c}>
              {k > 0 && <line x1={X(de)} x2={X(de)} y1={H - 24} y2={H - 3} className="svg-grade" />}
              <text
                x={X((de + ate) / 2)}
                y={H - 13}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-texto-2 text-[13.5px] font-bold"
              >
                {c}
              </text>
            </g>
          );
        })}

        {/* onde o lugar estava nas duas eleições do cargo */}
        <Setas
          itens={[
            { x: na == null ? null : X(na), rotulo: aa, ativa: f.quando === 0 },
            { x: nb == null ? null : X(nb), rotulo: ab, ativa: f.quando === 1 },
          ]}
        />

        <Corredor
          x={nota == null ? null : X(nota)}
          titulo={nome}
          sub={nota == null ? `sem votos em ${ano}` : f2(nota)}
          cor={corNota(nota)}
        />
      </svg>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="texto-simples m-0">
          {d != null ? (
            <>
              <b>{nome}</b> {paraOnde(d)}: de <b>{f2(na)}</b> em {aa} para <b>{f2(nb)}</b> em {ab}
              {Math.abs(d) >= 0.005 ? ` (${sinal(d)} ponto)` : ""}.
            </>
          ) : nota != null ? (
            <>
              Em {ano}, o voto para {cargo} em <b>{nome}</b> ficou em <b>{f2(nota)}</b>, {naCategoria(nota)}.
            </>
          ) : (
            <>
              <b>{nome}</b> não tem votos para {cargo} em {ano} no arquivo do TSE.
            </>
          )}
        </p>
        <p className="texto-nota m-0">
          0 = esquerda, 10 = direita. A nota é a média dos partidos votados para {cargo} (TSE).
        </p>
      </div>
    </section>
  );
}

const RETRATO_Y = 34,
  RETRATO_R = 30;

/** Um retrato num poste, plantado na nota do partido. */
function Marco({
  x,
  recorte,
  foto,
  nome,
  nota,
  sigla,
  aDireita,
}: {
  x: number;
  recorte: string;
  foto: string;
  nome: string;
  nota: number;
  sigla: string;
  aDireita?: boolean;
}) {
  // a legenda fica do lado de dentro: os cantos do desenho são da trilha e dos controles
  const tx = x + (aDireita ? -1 : 1) * (RETRATO_R + 14);
  const ancora = aDireita ? "end" : "start";
  return (
    <g>
      <line x1={x} x2={x} y1={RETRATO_Y + RETRATO_R} y2={CHAO + 2} stroke="#aab2bb" strokeWidth="4" />
      <circle cx={x} cy={RETRATO_Y} r={RETRATO_R + 4} fill={corNota(nota)} />
      <circle cx={x} cy={RETRATO_Y} r={RETRATO_R} fill="#e9edf1" />
      <image
        href={foto}
        x={x - RETRATO_R}
        y={RETRATO_Y - RETRATO_R}
        width={RETRATO_R * 2}
        height={RETRATO_R * 2}
        preserveAspectRatio="xMidYMin slice"
        clipPath={`url(#${recorte})`}
      >
        <title>
          {nome}, candidato a presidente pelo {sigla} em 2022 (foto do registro no TSE)
        </title>
      </image>
      <text x={tx} y={RETRATO_Y - 4} textAnchor={ancora} className="fill-texto text-[18px] font-extrabold">
        {nome}
      </text>
      <text x={tx} y={RETRATO_Y + 15} textAnchor={ancora} className="fill-texto-2 text-[13.5px] font-bold">
        {sigla} · nota {f2(nota)}
      </text>
    </g>
  );
}

/** As setas embaixo do chão: uma por eleição. A de valor menor escreve o ano para a esquerda e a
 *  outra para a direita, para os dois anos não se encostarem quando as notas são vizinhas. */
function Setas({ itens }: { itens: { x: number | null; rotulo: string; ativa: boolean }[] }) {
  const [p, q] = itens;
  const juntas = p.x != null && q.x != null && Math.abs(p.x - q.x) < 44;
  return (
    <>
      {itens.map((s, k) => {
        if (s.x == null) return null;
        const outra = itens[1 - k].x;
        const ancora =
          !juntas || outra == null ? "middle" : s.x < outra || (s.x === outra && k === 0) ? "end" : "start";
        const tx = ancora === "middle" ? s.x : ancora === "end" ? s.x - 3 : s.x + 3;
        return (
          <g key={s.rotulo}>
            <path
              d={`M${s.x},${CHAO + ESPESSURA + 3} l-7,10 h14 z`}
              className={s.ativa ? "fill-texto" : "fill-[#9aa3ad]"}
            />
            <text
              x={tx}
              y={CHAO + ESPESSURA + 28}
              textAnchor={ancora}
              className={`text-[14px] ${s.ativa ? "fill-texto font-extrabold" : "fill-[#7d8791] font-bold"}`}
            >
              {s.rotulo}
            </text>
          </g>
        );
      })}
    </>
  );
}

/** A urninha e o balão com o nome do lugar. Quando a nota muda, ela corre até a nova posição:
 *  mais longe, mais tempo. Sem nota, fica onde estava. */
function Corredor({ x, titulo, sub, cor }: { x: number | null; titulo: string; sub: string; cor: string }) {
  const [alvo, setAlvo] = useState(x ?? X(5));
  const [mov, setMov] = useState<{ dir: 1 | -1; dur: number; correndo: boolean }>({ dir: 1, dur: 0, correndo: false });
  // ajuste durante o render (padrão do React para estado que depende de prop)
  if (x != null && Math.abs(x - alvo) > 0.01) {
    const dur = semMovimento() ? 0 : Math.round(Math.min(1800, 420 + Math.abs(x - alvo) * 2.4));
    setAlvo(x);
    setMov({ dir: x > alvo ? 1 : -1, dur, correndo: dur > 0 });
  }
  useEffect(() => {
    if (!mov.correndo) return;
    const t = setTimeout(() => setMov(s => ({ ...s, correndo: false })), mov.dur + 60);
    return () => clearTimeout(t);
  }, [mov]);

  const texto = `${titulo} · ${sub}`;
  const largura = Math.min(420, texto.length * 8 + 44);
  return (
    <g
      style={{
        transform: `translate(${alvo.toFixed(1)}px, ${CHAO}px)`,
        transition: `transform ${mov.dur}ms cubic-bezier(.45,.05,.3,1)`,
      }}
    >
      <g>
        <rect x={-largura / 2} y={-104} width={largura} height={25} rx={12.5} className="fill-texto" />
        <path d="M-7,-80 L0,-73 L7,-80 Z" className="fill-texto" />
        <circle cx={-largura / 2 + 14} cy={-91.5} r={5.5} fill={cor} stroke="#fff" strokeWidth="1.2" />
        <text x={9} y={-86.5} textAnchor="middle" className="fill-white text-[14.5px] font-extrabold">
          {texto}
        </text>
      </g>
      <Mascote correndo={mov.correndo} dir={mov.dir} />
    </g>
  );
}
