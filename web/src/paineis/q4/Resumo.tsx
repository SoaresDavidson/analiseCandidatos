import { useMemo } from "react";
import { fmt, int, maiusculaInicial, pc } from "../../lib/formato";
import { noLugar, UF_NOME } from "../../lib/uf";
import { chance, perfil, porNivel, romano, teste } from "./calculo";
import {
  ANO_2026,
  ANO_DO_CARGO,
  CARGO,
  COR_NIVEL,
  type DadosQ4,
  type Filtros,
  NIVEL,
  ORDEM_CARGOS,
  PLURAL,
} from "./tipos";

const CIRC = 2 * Math.PI * 25;

/** Um número grande com o anel ao lado: quantos em cada 100 têm faculdade. */
function Medalha({
  pct,
  titulo,
  fonte,
  escura,
}: {
  pct: number | null;
  titulo: string;
  fonte: string;
  escura?: boolean;
}) {
  const v = Math.max(0, Math.min(100, pct ?? 0));
  const cor = escura ? "#2f5220" : "#b88a12";
  return (
    <div className="grid grid-cols-[62px_minmax(0,1fr)] items-center gap-2.5">
      <svg viewBox="0 0 62 62" aria-hidden="true">
        <circle cx="31" cy="31" r="25" fill="none" stroke="#e2d6b4" strokeWidth="7" />
        <circle
          cx="31"
          cy="31"
          r="25"
          fill="none"
          stroke={cor}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${((CIRC * v) / 100).toFixed(1)} ${CIRC.toFixed(1)}`}
          transform="rotate(-90 31 31)"
        />
      </svg>
      <div className="min-w-0">
        <div className="text-[30px] leading-none font-extrabold tabular-nums" style={{ color: cor }}>
          {pct == null ? "–" : `${fmt(pct, 0)}%`}
        </div>
        <div className="text-[13px] leading-tight font-bold">{titulo}</div>
        <div className="text-[11.5px] leading-tight text-tinta-2">{fonte}</div>
      </div>
    </div>
  );
}

/** A página da direita de um capítulo: a resposta para o Brasil ou para um estado. */
export function Resumo({
  D,
  escopo,
  indice,
  regiao,
  f,
  aoMudar,
}: {
  D: DadosQ4;
  /** "BR" ou a sigla do estado */
  escopo: string;
  indice: number;
  regiao?: string;
  f: Filtros;
  aoMudar: (p: Partial<Filtros>) => void;
}) {
  const brasil = escopo === "BR";
  const ufs = useMemo(() => (brasil ? D.ufs : [escopo]), [D, brasil, escopo]);

  // os cargos com candidato neste lugar (o DF não elege prefeito nem vereador)
  const disponiveis = useMemo(
    () => ORDEM_CARGOS.filter(c => teste(chance(D.chance, ANO_DO_CARGO[c], ufs, c)).N > 0),
    [D, ufs],
  );
  const cargo = disponiveis.includes(f.cargo)
    ? f.cargo
    : (disponiveis.find(c => ANO_DO_CARGO[c] === 2022) ?? disponiveis[0]);
  // nos cargos de eleição geral dá para trocar 2022 por 2026, se o lugar tem candidato em 2026
  const eleicaoGeral = ANO_DO_CARGO[cargo] === 2022;
  const tem2026 = useMemo(
    () => eleicaoGeral && teste(chance(D.chance, ANO_2026, ufs, cargo)).N > 0,
    [D, eleicaoGeral, ufs, cargo],
  );
  const ano = tem2026 && f.geral === ANO_2026 ? ANO_2026 : ANO_DO_CARGO[cargo];

  const q = useMemo(() => perfil(D.perfil, ano, ufs), [D, ano, ufs]);
  const p = q.map(l => {
    const tot = l.reduce((a, b) => a + b, 0);
    return pc(l[3], tot);
  });
  const r = useMemo(() => chance(D.chance, ano, ufs, cargo), [D, ano, ufs, cargo]);
  const t = useMemo(() => teste(r), [r]);
  const niv = porNivel(r);
  const geral = pc(t.E, t.N);
  const varia = t.p != null && t.p < 0.05 && t.conf;
  const vezes = niv[3].t && niv[0].t ? niv[3].t / niv[0].t : null;
  const mx = Math.max(5, ...niv.map(x => x.t ?? 0), geral ?? 0) * 1.12;
  const distrital = escopo === "DF";
  const nomeCargo = (c: number) => (c === 7 && distrital ? "Dep. distrital" : CARGO[c]);
  const cargoTexto = cargo === 7 && distrital ? "deputado distrital" : PLURAL[cargo];

  const [nCid, q1, q5, rr, r80] = D.cidades[escopo] ?? [0, null, null, null, null];
  const abre =
    rr == null
      ? "Há poucas cidades para medir."
      : rr >= 0.2
        ? r80 != null && r80 < rr / 2
          ? "Sim, mas a relação vem quase toda das cidades mais formadas."
          : "Sim: cidades mais formadas elegem mais gente formada."
        : "Quase não há relação.";

  return (
    <div className="grid content-start gap-2">
      <div>
        <div className="livro-sobre">
          Capítulo {romano(indice)}
          {regiao ? ` · ${regiao}` : ""}
        </div>
        <h2 className="livro-titulo">{brasil ? "O Brasil" : UF_NOME[escopo]}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Medalha pct={p[0]} titulo="dos adultos têm faculdade" fonte="IBGE, Censo 2022" />
        <Medalha pct={p[2]} titulo={`dos eleitos de ${ano} têm faculdade`} fonte="TSE, candidaturas" escura />
      </div>
      <p className="livro-prosa">
        {maiusculaInicial(noLugar(brasil ? "TODAS" : escopo))}, quem chega ao poder <b>estudou bem mais</b> que a
        população.
      </p>

      <h3 className="livro-secao">
        De cada 100 candidatos a {cargoTexto} ({ano}), quantos se elegem?
      </h3>
      <div role="group" aria-label="Cargo" className="flex flex-wrap items-center gap-1">
        {ORDEM_CARGOS.map(c => (
          <button
            key={c}
            type="button"
            className="livro-aba"
            aria-pressed={c === cargo}
            disabled={!disponiveis.includes(c)}
            title={`Eleição de ${ANO_DO_CARGO[c]}`}
            onClick={() => aoMudar({ cargo: c })}
          >
            {nomeCargo(c)}
          </button>
        ))}
        {tem2026 && (
          <span role="group" aria-label="Eleição" className="ml-auto flex items-center gap-1">
            {[2022, ANO_2026].map(a => (
              <button
                key={a}
                type="button"
                className="livro-aba"
                aria-pressed={a === ano}
                onClick={() => aoMudar({ geral: a })}
              >
                {a}
              </button>
            ))}
          </span>
        )}
      </div>

      <div className="grid gap-[7px]">
        {niv.map((x, i) => (
          <div
            key={i}
            className="grid grid-cols-[172px_minmax(0,1fr)_2.6em] items-center gap-2.5 text-[13px]"
            title={x.n ? `${int(x.e)} eleitos de ${int(x.n)} candidatos` : undefined}
          >
            <span className="whitespace-nowrap">{NIVEL[i + 1]}</span>
            {x.n ? (
              <span className="relative h-[17px] rounded-[3px] bg-[#e7dcbd]">
                <i
                  className="block h-full rounded-[3px]"
                  style={{ width: `${(100 * (x.t ?? 0)) / mx}%`, background: COR_NIVEL(i + 1) }}
                />
                {geral != null && (
                  <span
                    className="absolute -top-1 -bottom-1 w-0 border-l-2 border-dashed border-tinta"
                    style={{ left: `${(100 * geral) / mx}%` }}
                  />
                )}
              </span>
            ) : (
              <span className="livro-nota">sem candidatos</span>
            )}
            <b className="text-right text-[15px] font-extrabold tabular-nums">
              {x.n ? fmt(x.t, (x.t ?? 0) < 10 ? 1 : 0) : ""}
            </b>
          </div>
        ))}
      </div>
      <p className="livro-nota">
        <b className="text-tinta">
          {t.p == null
            ? "Sem candidatos suficientes para comparar."
            : !t.conf
              ? "Poucos candidatos: leia com cuidado."
              : varia
                ? `Quanto mais estudo, maior a chance${vezes && vezes >= 1.2 ? `: com faculdade, ${fmt(vezes, 1)} vez${vezes >= 2 ? "es" : ""} mais que sem o fundamental` : ""}.`
                : "Aqui a escolaridade não muda a chance de se eleger."}
        </b>{" "}
        {t.N > 0 && (
          <>
            {int(t.N)} candidatos, {int(t.E)} eleitos. Linha tracejada: a média ({fmt(geral, (geral ?? 0) < 10 ? 1 : 0)}{" "}
            em 100).{brasil && cargo === 7 ? " Inclui os deputados distritais do DF." : ""}
          </>
        )}
      </p>

      <h3 className="livro-secao">Lugar que estudou menos elege gente parecida?</h3>
      {nCid > 0 ? (
        <p className="livro-prosa !text-[16px]">
          {abre} Nas cidades com menos gente formada, <b>{fmt(q1, 0)}%</b> dos eleitos de 2024 têm faculdade; nas com
          mais, <b>{fmt(q5, 0)}%</b>. Nos dois grupos é bem mais que a população: não é "semelhante".
          <span className="livro-nota block pt-1 not-italic">
            {int(nCid)} cidades, prefeitos e vereadores de 2024.{" "}
            {brasil
              ? "Clique num estado do mapa para abrir o capítulo dele."
              : "Clique numa cidade do mapa para ver quem foi eleito."}
          </span>
        </p>
      ) : (
        <p className="livro-prosa !text-[16px]">
          O Distrito Federal não tem municípios: não elege prefeito nem vereador, então não há cidades para comparar.
        </p>
      )}
    </div>
  );
}
