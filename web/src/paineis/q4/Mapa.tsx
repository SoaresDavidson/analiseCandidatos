import { type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Alternador, Caixa, Campo, Cor, Empilhada, Legenda, Rampa, useDica } from "../../componentes";
import { fmt } from "../../lib/formato";
import { noEstado, UF_NOME, UFS } from "../../lib/uf";
import { GRADIENTE, METRICA, media, pearson, rampa } from "./calculo";
import { DicaMun, LinhaEleito, NomeEleito } from "./comum";
import {
  COR_NIVEL,
  type DadosQ4,
  type Eleito,
  type Filtros,
  GRAU,
  GRAU_NIVEL,
  type Metrica,
  type Municipio,
  NIVEL,
} from "./tipos";

interface Props {
  D: DadosQ4;
  MUN: Municipio[];
  MUN_BY: Record<number, Municipio>;
  ELEITOS: Eleito[];
  f: Filtros;
  ufs: readonly string[];
  sel: number | null;
  svgRef: RefObject<SVGSVGElement | null>;
  aoSelecionar: (cod: number | null) => void;
  aoMudarMapaUf: (uf: string) => void;
  aoMudarMetrica: (m: Metrica) => void;
  aoBuscar: (m: Municipio) => void;
}

const LEGENDA_NIVEIS = [1, 2, 3, 4].map(n => ({ cor: COR_NIVEL(n), rotulo: NIVEL[n] }));

/** Faixa empilhada com o título em cima (população x eleitos). */
function BarraNiveis({ vals, titulo }: { vals: number[]; titulo: string }) {
  const tot = vals.reduce((a, b) => a + b, 0);
  const partes = vals
    .map((v, i) => ({ w: tot ? (100 * v) / tot : 0, i }))
    .filter(x => x.w > 0)
    .map(({ w, i }) => ({
      pct: w,
      cor: COR_NIVEL(i + 1),
      titulo: `${NIVEL[i + 1]}: ${fmt(w, 0)}%`,
      rotulo: w >= 12 ? `${fmt(w, 0)}%` : "",
    }));
  return (
    <div className="grid gap-1">
      <span className="text-[13px] text-texto-2">{titulo}</span>
      <Empilhada partes={partes} />
    </div>
  );
}

/** Painel à direita do mapa: a cidade escolhida ou, sem escolha, o estado inteiro. */
function Detalhe({ f, MUN, MUN_BY, ELEITOS, sel }: Pick<Props, "f" | "MUN" | "MUN_BY" | "ELEITOS" | "sel">) {
  const m = sel != null ? MUN_BY[sel] : null;
  const leg = <Legenda itens={LEGENDA_NIVEIS} />;

  const lista = useMemo(() => {
    if (!m) return [];
    return ELEITOS.filter(e => e.ano === 2024 && e.cod === m.cod).sort(
      (x, y) => (x.cargo === 11 ? -1 : y.cargo === 11 ? 1 : 0) || y.grau - x.grau || x.urna.localeCompare(y.urna, "pt"),
    );
  }, [ELEITOS, m]);

  if (!m) {
    const uf = MUN.filter(x => x.u === f.mapaUf && x.ok);
    const pp = [0, 1, 2, 3].map(i => uf.reduce((a, x) => a + (x.pop as number[])[i], 0));
    const ee = [0, 1, 2, 3].map(i => uf.reduce((a, x) => a + x.el[i], 0));
    return (
      <div className="grid gap-2.5">
        <h3>{UF_NOME[f.mapaUf]}</h3>
        <p className="text-texto-2">Passe o mouse ou clique numa cidade. Abaixo, o estado inteiro.</p>
        <BarraNiveis vals={pp} titulo="População adulta (Censo 2022)" />
        <BarraNiveis vals={ee} titulo="Eleitos em 2024 (prefeitos e vereadores)" />
        {leg}
      </div>
    );
  }

  const titulo = (
    <h3>
      {m.n}
      {m.cap ? " · capital" : ""}
    </h3>
  );
  if (!m.pop) {
    return (
      <div className="grid gap-2.5">
        {titulo}
        <p className="text-texto-2">Cidade criada depois do Censo 2022: sem dado de escolaridade.</p>
      </div>
    );
  }
  if (!m.ok) {
    return (
      <div className="grid gap-2.5">
        {titulo}
        <p className="text-texto-2">O arquivo do TSE não traz o resultado de vereador desta cidade.</p>
        <BarraNiveis vals={m.pop} titulo="População adulta (Censo 2022)" />
        {leg}
      </div>
    );
  }
  return (
    <div className="grid gap-2.5">
      {titulo}
      <p>
        Na população predomina <b>{NIVEL[m.modaPop as number].toLowerCase()}</b>; entre os {m.te} eleitos,{" "}
        <b>{NIVEL[m.modaEl as number].toLowerCase()}</b>
        {m.emp ? " (empate)" : ""}.
      </p>
      <BarraNiveis vals={m.pop} titulo="População adulta (Censo 2022)" />
      <BarraNiveis vals={m.el} titulo={`Eleitos em 2024 · ${m.te} pessoas`} />
      {leg}
      <div className="lista-rolavel">
        {lista.map(e => (
          <LinhaEleito
            key={e.sq}
            esq={
              <span>
                <NomeEleito e={e} />
                {e.cargo === 11 ? " · prefeito(a)" : ""}
                <br />
                <small className="text-texto-2">
                  {e.partido}
                  {e.civil ? ` · ${e.civil}` : ""}
                </small>
              </span>
            }
            dir={
              <span className="inline-flex items-center gap-1.5 text-right">
                <Cor cor={COR_NIVEL(GRAU_NIVEL[e.grau])} />
                {GRAU[e.grau]}
              </span>
            }
          />
        ))}
      </div>
    </div>
  );
}

/** Frase de abertura do mapa: compara as cidades menos e mais formadas. */
function respostaMapa(MUN: Municipio[], ufs: readonly string[], uf: string) {
  const sel = MUN.filter(m => ufs.includes(m.u) && m.ok);
  const ord = [...sel].sort((a, b) => (a.pPop as number) - (b.pPop as number));
  const k = Math.floor(ord.length / 5);
  const q1 = media(ord.slice(0, k).map(m => m.pEl as number));
  const q5 = media(ord.slice(ord.length - k).map(m => m.pEl as number));
  const r = pearson(
    sel.map(m => m.pPop as number),
    sel.map(m => m.pEl as number),
  );
  const resto = ord.slice(0, ord.length - k);
  const r80 = pearson(
    resto.map(m => m.pPop as number),
    resto.map(m => m.pEl as number),
  );
  const onde = noEstado(uf);
  const abre =
    r == null
      ? "Poucas cidades para medir."
      : r >= 0.2
        ? r80 != null && r80 < r / 2
          ? "Sim, mas a relação vem quase toda das cidades mais formadas."
          : "Sim, cidades mais formadas elegem mais gente formada."
        : "Quase não há relação.";
  return { abre, Onde: onde[0].toUpperCase() + onde.slice(1), q1, q5 };
}

export function Mapa(props: Props) {
  const { D, MUN, f, ufs, sel, svgRef, aoSelecionar, aoMudarMapaUf, aoMudarMetrica, aoBuscar } = props;
  const dica = useDica();
  const mp = D.mapas[f.mapaUf];
  const M = METRICA[f.metrica];
  const ufMun = useMemo(() => MUN.filter(m => m.u === f.mapaUf), [MUN, f.mapaUf]);
  const comPath = useMemo(() => ufMun.filter(m => mp.p[m.cod]), [ufMun, mp]);
  const resp = useMemo(() => respostaMapa(MUN, ufs, f.uf), [MUN, ufs, f.uf]);
  const nomes = useMemo(() => [...comPath].sort((a, b) => a.n.localeCompare(b.n, "pt")), [comPath]);

  // a capital leva um círculo vermelho no centro da caixa do contorno (só dá para medir depois de desenhar)
  const [centro, setCentro] = useState<{ x: number; y: number } | null>(null);
  const cap = comPath.find(m => m.cap);
  useLayoutEffect(() => {
    const p = cap && svgRef.current?.querySelector<SVGPathElement>(`path[data-cod="${cap.cod}"]`);
    if (!p) {
      setCentro(null);
      return;
    }
    const b = p.getBBox();
    setCentro({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
  }, [cap, svgRef, mp]);

  // busca por nome: dispara quando a escolha termina (Enter, sair do campo ou item da lista)
  const busca = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = busca.current;
    if (!el) return;
    const quando = () => {
      const v = el.value.trim().toLowerCase();
      const m = MUN.find(x => x.u === f.mapaUf && x.n.toLowerCase() === v) || MUN.find(x => x.n.toLowerCase() === v);
      if (m) {
        el.value = "";
        aoBuscar(m);
      }
    };
    el.addEventListener("change", quando);
    return () => el.removeEventListener("change", quando);
  }, [MUN, f.mapaUf, aoBuscar]);

  // o município escolhido é desenhado por último, para o contorno não ficar escondido
  const selecionado = comPath.find(m => m.cod === sel);
  const ordem = selecionado ? [...comPath.filter(m => m !== selecionado), selecionado] : comPath;

  const marcas = [0, 0.25, 0.5, 0.75, 1].map(x => fmt(M.dom[0] + x * (M.dom[1] - M.dom[0]), 0) + (M.un ? "" : "%"));

  return (
    <Caixa>
      <h2>No mapa: cidades com mais gente formada elegem mais gente formada?</h2>
      <p className="texto-simples !text-base">
        {resp.abre} {resp.Onde}, nas cidades com menos gente formada, <b>{fmt(resp.q1, 0)}%</b> dos eleitos têm
        faculdade; nas com mais, <b>{fmt(resp.q5, 0)}%</b>. Em todas, os eleitos estudaram bem mais que a população: não
        é "semelhante".
      </p>
      <div className="flex flex-wrap items-end gap-x-[18px] gap-y-2.5">
        <span className="grid gap-[3px] text-[13px] font-bold">
          Estado do mapa
          <Alternador
            rotulo="Estado do mapa"
            opcoes={UFS.map(u => [u, u] as const)}
            valor={f.mapaUf}
            aoMudar={aoMudarMapaUf}
          />
        </span>
        <span className="grid gap-[3px] text-[13px] font-bold">
          O mapa mostra
          <Alternador
            rotulo="O mapa mostra"
            opcoes={
              [
                ["pop", "População com faculdade"],
                ["el", "Eleitos com faculdade"],
                ["dist", "Diferença"],
              ] as const
            }
            valor={f.metrica}
            aoMudar={aoMudarMetrica}
          />
        </span>
        <Campo rotulo="Buscar cidade">
          <input ref={busca} className="entrada" type="search" list="lista-mun" placeholder="Digite o nome" />
        </Campo>
        <datalist id="lista-mun">
          {nomes.map(m => (
            <option key={m.cod} value={m.n} />
          ))}
        </datalist>
      </div>
      <div className="grade-mapa">
        <div className="grid min-w-0 gap-2.5">
          <svg
            ref={svgRef}
            className="mapa"
            role="img"
            aria-label="Mapa dos municípios"
            viewBox={`-4 -4 ${mp.w + 8} ${mp.h + 8}`}
          >
            {ordem.map(m => (
              <path
                key={m.cod}
                d={mp.p[m.cod]}
                data-cod={m.cod}
                className={sel === m.cod ? "sel" : undefined}
                style={{ fill: m.ok ? rampa((M.v(m) - M.dom[0]) / (M.dom[1] - M.dom[0])) : "var(--color-sem-dado)" }}
                onMouseMove={ev => dica.mostrar(ev, <DicaMun m={m} />)}
                onMouseLeave={dica.esconder}
                onClick={() => aoSelecionar(sel === m.cod ? null : m.cod)}
              />
            ))}
            {centro && (
              <circle
                cx={centro.x}
                cy={centro.y}
                r={5}
                fill="none"
                className="pointer-events-none stroke-capital"
                strokeWidth={2.5}
              />
            )}
          </svg>
          <div>
            <b className="mb-1 block text-[12.5px] text-texto">
              {M.rot}
              {M.un ? " (eleitos − população, em pontos)" : ""}
            </b>
            <Rampa gradiente={GRADIENTE} marcas={marcas} />
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-texto-2">
              <span className="inline-flex items-center gap-1.5">
                <Cor cor="var(--color-sem-dado)" />
                sem dado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i
                  aria-hidden="true"
                  className="inline-block size-[13px] flex-none rounded-full border-[2.5px] border-capital"
                />
                capital
              </span>
              <span>Clique numa cidade para ver quem foi eleito.</span>
            </div>
          </div>
        </div>
        <Detalhe f={f} MUN={MUN} MUN_BY={props.MUN_BY} ELEITOS={props.ELEITOS} sel={sel} />
      </div>
      <p className="texto-nota">
        Só 2024: é a eleição em que prefeito e vereadores são da própria cidade. A escolaridade da cidade é a do Censo
        2022 (pessoas de 18 anos ou mais).
      </p>
    </Caixa>
  );
}
