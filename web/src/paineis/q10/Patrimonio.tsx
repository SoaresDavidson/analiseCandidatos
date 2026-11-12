import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Alternador, Cor, Janela, useDica } from "../../componentes";
import { brl, fmt } from "../../lib/formato";
import type { Foto } from "./logica";
import {
  ABREV,
  type AnoFin,
  anosSuspeitos,
  brlCurto,
  GRUPO_COR,
  GRUPO_NOME,
  type Pessoa,
  receitaComErro,
} from "./logica";
import { Retrato } from "./Retrato";
import type { DadosQ10 } from "./tipos";
import { quadricular, type Ret } from "./treemap";
import type { Financas } from "./useFinancas";

/** Frase de evolução e anos com cara de erro de digitação. */
function analisar(D: DadosQ10, anos: AnoFin[]) {
  const comBens = anos.filter(x => x.temBens);
  // sem o IPCA do ano não há valor corrigido: a frase fica só com os valores declarados
  const fat = (ano: number): number | null => D.fin.fator[ano] ?? null;
  const suspeitos = anosSuspeitos(comBens);
  // a comparação deixa de fora os anos com cara de erro de digitação, e diz isso na frase
  const confiaveis = comBens.filter(x => !suspeitos.includes(x));
  const semContar = suspeitos.length ? ` (sem contar ${lista(suspeitos.map(x => x.ano))})` : "";

  let frase: ReactNode = null;
  if (comBens.length === 1) frase = "É a única declaração disponível (o TSE publica bens a partir de 2006).";
  else if (confiaveis.length < 2) frase = "Não dá para comparar os anos: sobra só uma declaração sem suspeita de erro.";
  else {
    const a = confiaveis[0],
      b = confiaveis[confiaveis.length - 1],
      fa = fat(a.ano),
      fb = fat(b.ano);
    const variacao =
      fa != null && fb != null && a.total > 0 ? (100 * (b.total * fb - a.total * fa)) / (a.total * fa) : null;
    frase = (
      <>
        De {a.ano} a {b.ano}
        {semContar}, o patrimônio declarado foi de {brl(a.total)} para {brl(b.total)}.
        {variacao != null && (
          <>
            {" "}
            Descontada a inflação,{" "}
            {Math.abs(variacao) < 5 ? (
              "ficou praticamente igual"
            ) : variacao > 0 ? (
              <b>cresceu {fmt(variacao, 0)}%</b>
            ) : (
              <b>caiu {fmt(-variacao, 0)}%</b>
            )}
            .
          </>
        )}
      </>
    );
  }
  return { comBens, suspeitos, frase };
}

type Aba = "bens" | "campanha";

/** "2014" ou "2010 e 2014". */
const lista = (anos: number[]): string =>
  anos.length < 2 ? anos.join("") : `${anos.slice(0, -1).join(", ")} e ${anos[anos.length - 1]}`;

/** Pop-up do dinheiro do político: os bens declarados (um retângulo por tipo de bem, a lista completa
 *  ao lado e a evolução de eleição em eleição) e, na outra aba, quanto a campanha arrecadou e gastou. */
export function Patrimonio({
  D,
  p,
  fin,
  foto,
  aoFechar,
}: {
  D: DadosQ10;
  p: Pessoa;
  fin: Financas;
  foto: Foto | null;
  aoFechar: () => void;
}) {
  const analise = useMemo(() => (fin.anos ? analisar(D, fin.anos) : null), [D, fin.anos]);
  const comBens = analise?.comBens ?? [];
  const campanhas = (fin.anos ?? []).filter(y => y.receita != null);
  const [aba, setAba] = useState<Aba>("bens");
  const [escolhido, setEscolhido] = useState<number | null>(null);
  // abre no ano mais recente, até a pessoa escolher outro
  const x = comBens.find(y => y.ano === escolhido) ?? comBens[comBens.length - 1];
  const suspeitos = analise?.suspeitos ?? [];
  const fator: number | null = x ? (D.fin.fator[x.ano] ?? null) : null;
  const vitoria = p.r.findLast(c => c.res === 0) ?? p.ult;

  return (
    <Janela larga titulo={`Patrimônio e campanha de ${p.nome}`} aoFechar={aoFechar}>
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 pr-10">
        <Retrato
          foto={foto}
          nome={p.nome}
          className="aspect-[3/4] w-[92px] !rounded-xl text-4xl shadow-[0_0_0_3px_#fff,0_0_0_6px_var(--color-ouro)]"
        />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h2 className="text-[22px]!">{p.nome}</h2>
          <span className="text-[13.5px] text-texto-2">
            {ABREV[vitoria.cargo]} · {vitoria.local} · {vitoria.ano}
          </span>
          <div className="mt-1.5">
            <Alternador<Aba>
              rotulo="O que ver"
              valor={aba}
              aoMudar={setAba}
              opcoes={[
                ["bens", "Patrimônio declarado"],
                ["campanha", "Dinheiro da campanha"],
              ]}
            />
          </div>
        </div>
        {aba === "bens" && x && (
          <p className="text-right leading-tight">
            <b className="block text-[clamp(26px,4vw,38px)] font-extrabold tabular-nums">{brl(x.total)}</b>
            <span className="text-[13px] text-texto-2">
              declarados ao TSE em {x.ano}
              {fator != null && fator !== 1 && (
                <>
                  <br />
                  {brl(x.total * fator)} em reais de 2024
                </>
              )}
            </span>
          </p>
        )}
      </header>

      {aba === "campanha" ? (
        <Campanha p={p} fin={fin} campanhas={campanhas} />
      ) : !x ? (
        <p className="py-6 text-center text-texto-2">
          {fin.falhou
            ? "Não deu para carregar a declaração de bens."
            : fin.anos
              ? "Sem declaração de bens no TSE nos anos da carreira (o TSE publica bens a partir de 2006)."
              : "Carregando…"}
        </p>
      ) : (
        <>
          {comBens.length > 1 && (
            <Evolucao anos={comBens} fator={D.fin.fator} suspeitos={suspeitos} ano={x.ano} aoEscolher={setEscolhido} />
          )}
          <div className="grid items-start gap-4 min-[861px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Mapa key={x.ano} x={x} fator={fator} />
            <Lista x={x} />
          </div>
          {suspeitos.length > 0 && (
            <p className="rounded-md border-l-4 border-ouro bg-ouro-claro px-3 py-2 text-sm">
              Atenção: o valor de {lista(suspeitos.map(y => y.ano))} (⚠) é muito maior que o dos outros anos. Pode ser
              erro de digitação na declaração ao TSE; o painel mostra o valor como foi publicado e deixa{" "}
              {suspeitos.length > 1 ? "esses anos" : "esse ano"} fora da comparação abaixo.
            </p>
          )}
          {analise?.frase && <p className="text-center text-[15px]">{analise.frase}</p>}
          <p className="texto-nota text-center">
            Fonte: TSE, declaração de bens no registro da candidatura (2006 e 2008 sem o tipo do bem). Inflação: IPCA,
            IBGE.
          </p>
        </>
      )}
    </Janela>
  );
}

/** A evolução do patrimônio: uma coluna por eleição com declaração, em reais de 2024. Clicar troca o ano. */
function Evolucao({
  anos,
  fator,
  suspeitos,
  ano,
  aoEscolher,
}: {
  anos: AnoFin[];
  fator: Record<string, number>;
  suspeitos: AnoFin[];
  ano: number;
  aoEscolher: (ano: number) => void;
}) {
  const real = (y: AnoFin) => y.total * (fator[y.ano] || 1);
  // um ano com cara de erro de digitação não achata as outras colunas
  const mx = Math.max(1, ...anos.filter(y => !suspeitos.includes(y)).map(real));
  return (
    <div className="grid gap-1">
      <b className="text-[13px]">De eleição em eleição (em reais de 2024). Clique num ano para ver os bens.</b>
      <div className="grid grid-flow-col auto-cols-fr items-end gap-2 rounded-xl bg-fundo px-3 pt-3 pb-2">
        {anos.map(y => {
          const sel = y.ano === ano,
            erro = suspeitos.includes(y);
          return (
            <button
              key={y.ano}
              type="button"
              aria-pressed={sel}
              onClick={() => aoEscolher(y.ano)}
              title={`${y.ano}: ${brl(y.total)} declarados (${brl(real(y))} em reais de 2024)`}
              className="group grid cursor-pointer justify-items-center gap-0.5 border-0 bg-transparent p-0"
            >
              <span className={`text-[12px] tabular-nums ${sel ? "font-extrabold" : "text-texto-2"}`}>
                {erro ? "⚠ " : ""}
                R$ {brlCurto(real(y))}
              </span>
              <span className="flex h-[64px] w-full max-w-[84px] items-end">
                <span
                  className={`block w-full rounded-t-[5px] transition-[height] duration-500 group-hover:brightness-90 ${
                    sel ? "bg-verde-esc" : "bg-verde"
                  }`}
                  style={{ height: `${Math.max(4, Math.min(100, (100 * real(y)) / mx))}%` }}
                />
              </span>
              <span
                className={`w-full max-w-[84px] rounded-[5px] py-px text-center text-[13px] font-bold ${sel ? "bg-texto text-white" : ""}`}
              >
                {y.ano}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Todos os bens declarados no ano, do maior para o menor, com o valor e a parte do total. */
function Lista({ x }: { x: AnoFin }) {
  const itens = useMemo(() => {
    // o mesmo tipo de bem pode aparecer mais de uma vez: soma
    const porTipo = new Map<string, { nome: string; g: number; v: number }>();
    for (const it of x.itens) {
      if (it.v <= 0) continue;
      const k = `${it.g}|${it.nome}`;
      const ja = porTipo.get(k);
      if (ja) ja.v += it.v;
      else porTipo.set(k, { nome: nomeBem(it.nome), g: it.g, v: it.v });
    }
    return [...porTipo.values()].sort((a, b) => b.v - a.v);
  }, [x]);
  const mx = itens[0]?.v ?? 1;
  return (
    <div className="grid gap-1.5">
      <b className="text-[13px]">
        Tudo o que declarou em {x.ano}: {itens.length} {itens.length === 1 ? "tipo de bem" : "tipos de bem"}
      </b>
      <ol className="m-0 grid max-h-[360px] list-none gap-px overflow-y-auto overscroll-contain p-0 pr-1 text-[13.5px]">
        {itens.map(it => (
          <li key={`${it.g}|${it.nome}`} className="grid gap-0.5 border-b border-linha py-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="inline-flex min-w-0 items-baseline gap-1.5">
                <Cor cor={GRUPO_COR[it.g]} />
                <span className="truncate" title={`${it.nome} · ${GRUPO_NOME[it.g]}`}>
                  {it.nome}
                </span>
              </span>
              <span className="flex-none tabular-nums">
                <b>{brl(it.v)}</b> <span className="text-texto-2">{pctDe(it.v, x.total)}</span>
              </span>
            </div>
            <span className="h-1.5 rounded-full bg-bege">
              <i
                className="block h-full rounded-full"
                style={{ width: `${Math.max(1.5, (100 * it.v) / mx)}%`, background: GRUPO_COR[it.g] }}
              />
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[12.5px] text-texto-2">
        {x.grupos
          .map((v, g) => ({ v, g }))
          .filter(it => it.v > 0)
          .sort((a, b) => b.v - a.v)
          .map(({ v, g }) => (
            <span key={g} className="inline-flex items-center gap-1.5">
              <Cor cor={GRUPO_COR[g]} />
              {GRUPO_NOME[g]} <b className="font-extrabold text-texto tabular-nums">{pctDe(v, x.total)}</b>
            </span>
          ))}
      </div>
    </div>
  );
}

/** A campanha: quanto arrecadou, quanto veio do fundo público e quanto gastou em cada eleição (2018 em diante). */
function Campanha({ p, fin, campanhas }: { p: Pessoa; fin: Financas; campanhas: AnoFin[] }) {
  const cargoDo = (ano: number) => {
    const c = p.r.find(r => r.ano === ano);
    return c ? `${ABREV[c.cargo]}${c.res === 0 ? " · eleito" : c.res === 1 ? " · não eleito" : ""}` : "";
  };
  const validas = campanhas.filter(y => !receitaComErro(y.receita));
  const mx = Math.max(1, ...validas.flatMap(y => [y.receita ?? 0, y.despesa ?? 0]));
  if (!campanhas.length)
    return (
      <p className="py-6 text-center text-texto-2">
        {fin.falhou
          ? "Não deu para carregar a prestação de contas."
          : fin.anos
            ? "Sem prestação de contas desta pessoa: o painel tem receita e gasto de campanha de 2018 em diante."
            : "Carregando…"}
      </p>
    );
  const barra = (rotulo: string, v: number, cor: string, parte?: number) => (
    <div className="grid grid-cols-[7.2em_minmax(0,1fr)_7.4em] items-center gap-2.5 text-[13.5px]">
      <span>{rotulo}</span>
      <span className="h-[18px] overflow-hidden rounded-[4px] bg-bege">
        <i className="flex h-full rounded-[4px]" style={{ width: `${(100 * v) / mx}%`, background: cor }}>
          {parte != null && parte > 0 && (
            <i className="block h-full bg-ouro-esc" style={{ width: `${Math.min(100, parte)}%` }} />
          )}
        </i>
      </span>
      <b className="text-right tabular-nums">{brl(v)}</b>
    </div>
  );
  return (
    <div className="grid gap-3">
      {campanhas.map(y => {
        const erro = receitaComErro(y.receita);
        const pub = !erro && y.receita ? (100 * (y.publico || 0)) / y.receita : null;
        return (
          <div key={y.ano} className="grid gap-1.5 rounded-xl bg-fundo px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <b className="text-[16px]">
                {y.ano} <span className="text-[13px] font-semibold text-texto-2">{cargoDo(y.ano)}</span>
              </b>
              {pub != null && (
                <span className="text-[13px]">
                  <b>{fmt(pub, 0)}%</b> do que arrecadou veio do fundo público
                </span>
              )}
            </div>
            {erro ? (
              <p className="texto-nota m-0">
                O TSE publicou {brl(y.receita)} arrecadados: é erro de digitação no arquivo, e o valor fica fora.
              </p>
            ) : (
              barra("Arrecadou", y.receita ?? 0, "var(--color-ouro)", pub ?? undefined)
            )}
            {barra("Gastou", y.despesa ?? 0, "var(--color-verde-esc)")}
          </div>
        );
      })}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-texto-2">
        <span className="inline-flex items-center gap-1.5">
          <Cor cor="var(--color-ouro-esc)" /> parte que veio do fundo público
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Cor cor="var(--color-ouro)" /> outras fontes
        </span>
      </div>
      <p className="texto-nota text-center">
        Fonte: TSE, prestação de contas das campanhas, de 2018 em diante. O dinheiro arrecadado é da campanha, não do
        patrimônio pessoal.
      </p>
    </div>
  );
}

/** "71%"; fatias que arredondariam para zero viram "<1%". */
const pctDe = (v: number, total: number): string => {
  const p = (100 * v) / total;
  return p > 0 && p < 0.5 ? "<1%" : `${fmt(p, 0)}%`;
};

const nomeBem = (nome: string): string =>
  !nome ? "Sem tipo" : nome === nome.toUpperCase() ? nome[0] + nome.slice(1).toLowerCase() : nome;

interface Bloco {
  nome: string;
  g: number;
  v: number;
  ret: Ret;
}

/** Treemap dos bens de um ano: primeiro divide a área entre os grupos, depois cada grupo entre os seus bens. */
function Mapa({ x, fator }: { x: AnoFin; fator: number | null }) {
  const dica = useDica();
  // se o mapa sair da tela com o mouse em cima (Esc, troca de ano), o balão vai junto
  useEffect(() => dica.esconder, [dica]);
  const caixa = useRef<HTMLDivElement>(null);
  const [larg, setLarg] = useState(0);
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    setLarg(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(([e]) => setLarg(e.contentRect.width));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  // no celular a área fica em pé, para os retângulos não virarem tiras
  const alt = Math.round(larg < 520 ? larg * 1.1 : larg * 0.48);

  const blocos = useMemo(() => {
    if (!larg) return [];
    // o mesmo tipo de bem pode aparecer mais de uma vez: soma
    const porTipo = new Map<string, { nome: string; g: number; v: number }>();
    for (const it of x.itens) {
      if (it.v <= 0) continue;
      // soma pelo nome já arrumado: "CASA" e "Casa" são o mesmo retângulo
      const nome = nomeBem(it.nome);
      const k = `${it.g}|${nome}`;
      const ja = porTipo.get(k);
      if (ja) ja.v += it.v;
      else porTipo.set(k, { nome, g: it.g, v: it.v });
    }
    const grupos = [...new Set([...porTipo.values()].map(it => it.g))];
    const doGrupo = (g: number) => [...porTipo.values()].filter(it => it.g === g).sort((a, b) => b.v - a.v);
    const areas = quadricular(
      grupos.map(g => doGrupo(g).reduce((s, it) => s + it.v, 0)),
      { x: 0, y: 0, w: larg, h: alt },
    );
    const saida: Bloco[] = [];
    grupos.forEach((g, k) => {
      const itens = doGrupo(g);
      quadricular(
        itens.map(it => it.v),
        areas[k],
      ).forEach((ret, i) => saida.push({ ...itens[i], ret }));
    });
    return saida.sort((a, b) => b.v - a.v);
  }, [x, larg, alt]);

  return (
    <div
      ref={caixa}
      role="img"
      aria-label={`Bens declarados em ${x.ano}: ${blocos
        .slice(0, 6)
        .map(b => `${b.nome}, ${brl(b.v)}`)
        .join("; ")}`}
      className="relative w-full overflow-hidden rounded-xl bg-bege"
      style={{ height: alt || undefined }}
    >
      {blocos.map((b, k) => {
        const { w, h } = b.ret;
        const fs = Math.max(11, Math.min(19, w / 9, h / 3.4));
        // quantas linhas de texto cabem: nome (até 2) + valor; se só couber uma, fica a porcentagem
        const borda = h < 64 ? 3 : 6;
        const linhas = Math.floor((h - 2 * borda - 3) / (fs * 1.25));
        const cheio = w >= 90 && linhas >= 2;
        const pct = pctDe(b.v, x.total);
        return (
          <div
            key={`${b.g}|${b.nome}`}
            className="q10-bem absolute overflow-hidden border-[1.5px] border-white leading-tight"
            style={
              {
                "--k": k,
                left: b.ret.x,
                top: b.ret.y,
                width: w,
                height: h,
                background: GRUPO_COR[b.g],
                color: b.g >= 5 ? "#333" : "#fff",
                fontSize: fs,
                padding: `${borda}px 8px`,
              } as CSSProperties
            }
            onMouseMove={ev =>
              dica.mostrar(
                ev,
                <>
                  <b>{b.nome}</b>
                  <br />
                  {GRUPO_NOME[b.g]}
                  <br />
                  {brl(b.v)} · {pct} do patrimônio de {x.ano}
                  {fator != null && fator !== 1 && (
                    <>
                      <br />
                      {brl(b.v * fator)} em reais de 2024
                    </>
                  )}
                </>,
              )
            }
            onMouseLeave={dica.esconder}
          >
            {cheio ? (
              <>
                <b className={`font-extrabold ${linhas >= 3 ? "line-clamp-2" : "line-clamp-1"}`}>{b.nome}</b>
                <span className="block truncate tabular-nums opacity-90">
                  {brl(b.v)} · {pct}
                </span>
              </>
            ) : (
              w >= 40 && linhas >= 1 && <b className="font-extrabold tabular-nums">{pct}</b>
            )}
          </div>
        );
      })}
    </div>
  );
}
