import { useMemo, useRef } from "react";
import { Caixa, Campo, Legenda, Linha, Rampa, Seletor, useDica, Chip } from "../../componentes";
import { int } from "../../lib/formato";
import { useNavegacao } from "../../lib/navegacao";
import type { Ctx, Municipio } from "./tipos";
import { catDe, CAT_COR, corDif, degraus, DIF_COR, escalas, f2, mudanca, notasDe, PARES, pontos, semAcento, sinal, UF_NOME } from "./util";

interface Props extends Ctx {
  /** Troca o estado do mapa (limpa a seleção). */
  aoMudarUf(uf: string): void;
  /** Seleciona uma cidade pelo código. */
  aoSelecionar(cod: number): void;
}

const ROTULOS_RAMPA = ["−0,75", "−0,25", "−0,05", "+0,05", "+0,25", "+0,75"];
const GRADIENTE = `linear-gradient(90deg,${DIF_COR.map((c, i) => `${c} ${(i / 7 * 100).toFixed(0)}%,${c} ${((i + 1) / 7 * 100).toFixed(0)}%`).join(",")})`;

/** Seção 3: mapa coroplético da mudança, busca e detalhe da cidade escolhida. */
export function Mapa(p: Props) {
  const { D, M, f, aoMudarUf, aoSelecionar } = p;
  const dica = useDica();
  const busca = useRef<HTMLInputElement>(null);
  const [a, b, cargo, aa, ab] = PARES[f.par], uf = f.mapaUf, G = D.mapas[uf];
  const doUf = useMemo(() => M.filter(m => m.uf === uf), [M, uf]);
  const porCod = useMemo(() => new Map(doUf.map(m => [m.cod, m])), [doUf]);
  const cv = doUf.filter(m => mudanca(m, f) != null);
  const dir = cv.filter(m => mudanca(m, f)! > 0).length;
  const ord = cv.slice().sort((x, y) => mudanca(y, f)! - mudanca(x, f)!);
  const no = ["AM", "MA", "MT", "RS"].includes(uf) ? "No" : "Em";
  const sel = M.find(x => x.cod === f.sel && x.uf === uf);

  // a busca só vale ao confirmar (Enter ou sair do campo), como o evento "change" do original
  const buscar = () => {
    const el = busca.current;
    if (!el) return;
    const q = semAcento(el.value.trim());
    const m = q && M.find(x => x.uf === uf && x.busca.includes(q));
    if (m) { aoSelecionar(m.cod); el.value = ""; }
  };

  return (
    <Caixa>
      <h2>A mudança cidade por cidade: {UF_NOME[uf]}, {cargo}, {aa} → {ab}</h2>
      <p className="texto-simples text-base!">
        {cv.length ? (
          <>
            {no} {UF_NOME[uf]}, {int(dir)} das {int(cv.length)} cidades votaram mais à direita. A que mais foi à direita: <b>{ord[0].nome}</b> ({sinal(mudanca(ord[0], f))}); a que mais foi à esquerda:{" "}
            <b>{ord[ord.length - 1].nome}</b> ({sinal(mudanca(ord[ord.length - 1], f))}). Em cidade pequena, com poucos partidos na disputa, a nota oscila muito de uma eleição para outra.
          </>
        ) : "Sem dados para esta comparação."}
      </p>
      <div className="flex flex-wrap items-end gap-x-[18px] gap-y-2.5">
        <Campo rotulo="Mapa de">
          <Seletor value={uf} onChange={e => aoMudarUf(e.target.value)}>
            {D.ufs.map(u => <option key={u} value={u}>{UF_NOME[u]}</option>)}
          </Seletor>
        </Campo>
        <input ref={busca} className="entrada" type="search" placeholder="Buscar cidade no mapa" aria-label="Buscar cidade no mapa" autoComplete="off"
          onBlur={buscar} onKeyDown={e => { if (e.key === "Enter") buscar(); }} />
      </div>
      <div className="grade-mapa">
        <div>
          <svg className="mapa" viewBox={`0 0 ${G.w} ${G.h}`} role="img" aria-label="Mapa dos municípios, cor pela mudança do voto">
            {Object.entries(G.p).map(([cod, d]) => {
              const m = porCod.get(+cod), dd = m ? mudanca(m, f) : null;
              if (!m) return <path key={cod} d={d} fill={corDif(dd)} />;
              return (
                <path key={cod} d={d} fill={corDif(dd)} className={f.sel === m.cod ? "sel" : ""}
                  onMouseMove={ev => dica.mostrar(ev, <><b>{m.nome}</b><br />{aa}: {f2(notasDe(m, f)[a])} · {ab}: {f2(notasDe(m, f)[b])}<br />mudança: {sinal(dd)}</>)}
                  onMouseLeave={dica.esconder}
                  onClick={() => aoSelecionar(m.cod)} />
              );
            })}
          </svg>
          <div className="grid gap-1.5">
            <div className="grid gap-1">
              <b className="text-[12.5px] text-texto">Mudança na nota ({aa} → {ab})</b>
              <Rampa gradiente={GRADIENTE} marcas={["à esquerda", ...ROTULOS_RAMPA, "à direita"]} />
            </div>
            <p className="texto-nota">Clique numa cidade para ver a linha do tempo dela.</p>
          </div>
        </div>
        <div className="grid gap-2.5">
          {sel ? <Detalhe D={D} f={f} m={sel} /> : <p className="text-texto-2">Clique numa cidade do mapa (ou busque pelo nome) para ver a linha do tempo dela.</p>}
        </div>
      </div>
    </Caixa>
  );
}


function ChipLado({ sg, v }: { sg: string | null; v: number | null }) {
  if (!sg) return <>–</>;
  return <Chip cor={v == null ? "var(--color-sem-nota)" : CAT_COR[catDe(v)]}>{sg}{v == null ? "" : " · " + f2(v)}</Chip>;
}

function Detalhe({ D, f, m }: { D: Ctx["D"]; f: Ctx["f"]; m: Municipio }) {
  const nav = useNavegacao();
  const [a, b, cargo, aa, ab] = PARES[f.par], [s20, v20, s24, v24, mesmo] = m.pref, d = mudanca(m, f), meio = D.regua[2];
  const lado = (v: number | null) => v == null ? "" : v < meio ? "esquerda" : "direita";
  const n = notasDe(m, f);
  let aviso = "";
  if (s20 && s24) {
    aviso = s20 === s24 ? "O partido do prefeito não mudou."
      : mesmo ? `O partido do prefeito não mudou: o ${s20} virou ${s24}.`
      : lado(v20) === lado(v24) ? `Trocou de partido, mas ficou do mesmo lado (${lado(v24)}).`
      : `Trocou de lado: da ${lado(v20)} para a ${lado(v24)}.`;
  }
  return (
    <>
      <h3>{m.nome}{m.cap ? " · capital" : ""}</h3>
      <p>Voto para {cargo}: <b>{f2(n[a])}</b> em {aa} → <b>{f2(n[b])}</b> em {ab} ({sinal(d)}, {d! > 0 ? "mais à direita" : d! < 0 ? "mais à esquerda" : "igual"}).</p>
      <MiniLinha D={D} m={m} />
      <Legenda itens={[{ cor: "var(--color-verde-esc)", rotulo: "só o eleitor" }, { cor: "var(--color-ouro)", rotulo: "régua de cada ano" }]} />
      <Linha rotulo="Prefeito eleito em 2020" valor={<ChipLado sg={s20} v={v20} />} />
      <Linha rotulo="Prefeito eleito em 2024" valor={<ChipLado sg={s24} v={v24} />} />
      <p className="texto-nota">{aviso} Notas dos prefeitos na régua fixa.</p>
      <button type="button" onClick={() => nav.abrirMunicipio(m.cod)}
        className="mt-1.5 cursor-pointer justify-self-start rounded-lg border-0 bg-ouro px-4 py-2 font-bold hover:bg-[#d9a600]">
        Ver tudo sobre {m.nome}
      </button>
    </>
  );
}

const MW = 300, MH = 120, ML = 34, MR = 12, MT = 12, MB = 24;
const MINI = [{ k: "rodada", cor: "var(--color-ouro)", traco: "6 4" }, { k: "fixa", cor: "var(--color-verde-esc)", traco: undefined }] as const;

/** Linha do tempo pequena da cidade escolhida. */
function MiniLinha({ D, m }: { D: Ctx["D"]; m: Municipio }) {
  const vs = [...m.fixa, ...m.rodada].filter((v): v is number => v != null);
  if (!vs.length) return null;
  const lo = Math.floor(Math.min(...vs) * 2) / 2 - 0.5, hi = Math.ceil(Math.max(...vs) * 2) / 2 + 0.5;
  const { X, Y } = escalas(MW, MH, ML, MR, MT, MB, lo, hi);
  return (
    <svg className="grafico max-w-[340px]" viewBox={`0 0 ${MW} ${MH}`}>
      {degraus(lo, hi).map(v => (
        <g key={v}>
          <line x1={ML} x2={MW - MR} y1={Y(v)} y2={Y(v)} className="svg-grade" />
          <text x={ML - 4} y={Y(v)} className="svg-eixo" textAnchor="end" dominantBaseline="middle">{f2(v, 1)}</text>
        </g>
      ))}
      {D.anos.map((a, i) => <text key={a} x={X(i)} y={MH - 8} className="svg-eixo" textAnchor="middle">{a}</text>)}
      {MINI.map(({ k, cor, traco }) => {
        const pts = pontos(m[k], X, Y);
        return (
          <g key={k}>
            <polyline points={pts.map(q => `${q.x},${q.y}`).join(" ")} fill="none" stroke={cor} strokeWidth={2.5} strokeDasharray={traco} />
            {pts.map(q => <circle key={q.i} cx={q.x} cy={q.y} r={4} fill={cor} stroke="#fff" strokeWidth={1.5} />)}
          </g>
        );
      })}
    </svg>
  );
}
