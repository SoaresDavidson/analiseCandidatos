import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Alternador, Cor, useDica } from "../../componentes";
import { brl, fmt } from "../../lib/formato";
import type { Foto } from "./fotos";
import { type AnoFin, GRUPO_COR, GRUPO_NOME, type Pessoa } from "./logica";
import { Retrato } from "./Retrato";
import type { DadosQ10 } from "./tipos";
import { quadricular, type Ret } from "./treemap";
import type { Financas } from "./useFinancas";

/** Frase de evolução e anos com cara de erro de digitação. */
function analisar(D: DadosQ10, anos: AnoFin[]) {
  const comBens = anos.filter(x => x.temBens);
  const fat = (ano: number) => D.fin.fator[ano] || 1;
  // um ano 50 vezes acima da mediana dos outros (e acima de R$ 10 milhões) tem cara de erro de digitação
  const suspeitos = comBens.filter(x => {
    const outros = comBens
      .filter(y => y !== x)
      .map(y => y.total)
      .sort((a, b) => a - b);
    if (!outros.length) return false;
    const med = outros[outros.length >> 1];
    return x.total >= 1e7 && x.total >= 50 * Math.max(med, 1);
  });
  // a comparação deixa de fora os anos com cara de erro de digitação
  const confiaveis = comBens.filter(x => !suspeitos.includes(x));

  let frase: ReactNode = null;
  if (comBens.length === 1) frase = "É a única declaração disponível (o TSE publica bens a partir de 2006).";
  else if (confiaveis.length < 2) frase = "Não dá para comparar os anos: sobra só uma declaração sem suspeita de erro.";
  else {
    const a = confiaveis[0],
      b = confiaveis[confiaveis.length - 1],
      ra = a.total * fat(a.ano),
      rb = b.total * fat(b.ano);
    const variacao = ra > 0 ? (100 * (rb - ra)) / ra : null;
    frase = (
      <>
        De {a.ano} a {b.ano}, o patrimônio declarado foi de {brl(a.total)} para {brl(b.total)}.
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

/** Pop-up do patrimônio: o rosto em cima e, embaixo, um retângulo por bem, do tamanho do valor declarado. */
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
  const [escolhido, setEscolhido] = useState<number | null>(null);
  // abre no ano mais recente, até a pessoa escolher outro
  const x = comBens.find(y => y.ano === escolhido) ?? comBens[comBens.length - 1];
  const suspeito = x != null && analise?.suspeitos.includes(x);
  const fator = x ? D.fin.fator[x.ano] || 1 : 1;

  return (
    <Janela titulo={`Patrimônio declarado de ${p.nome}`} aoFechar={aoFechar}>
      <header className="grid justify-items-center gap-1 text-center">
        <Retrato
          foto={foto}
          nome={p.nome}
          className="size-[104px] text-4xl shadow-[0_0_0_4px_#fff,0_0_0_7px_var(--color-ouro)]"
        />
        <h2 className="mt-2">{p.nome}</h2>
        {x ? (
          <p className="leading-tight">
            <b className="block text-[clamp(26px,5vw,36px)] font-extrabold tabular-nums">{brl(x.total)}</b>
            <span className="text-[13.5px] text-texto-2">
              em bens declarados ao TSE em {x.ano}
              {x.ano < 2024 && fator !== 1 && ` · ${brl(x.total * fator)} em reais de 2024`}
            </span>
          </p>
        ) : (
          <p className="max-w-[46ch] text-texto-2">
            {fin.falhou
              ? "Não deu para carregar a declaração de bens."
              : fin.anos
                ? "Sem declaração de bens no TSE nos anos da carreira (o TSE publica bens a partir de 2006)."
                : "Carregando…"}
          </p>
        )}
      </header>

      {x && (
        <>
          {comBens.length > 1 && (
            <div className="justify-self-center">
              <Alternador
                rotulo="Eleição da declaração"
                opcoes={comBens.map(y => [y.ano, `${analise?.suspeitos.includes(y) ? "⚠ " : ""}${y.ano}`] as const)}
                valor={x.ano}
                aoMudar={setEscolhido}
              />
            </div>
          )}
          <Mapa key={x.ano} x={x} fator={fator} />
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[13px]">
            {x.grupos
              .map((v, g) => ({ v, g }))
              .filter(it => it.v > 0)
              .sort((a, b) => b.v - a.v)
              .map(({ v, g }) => (
                <span key={g} className="inline-flex items-center gap-1.5">
                  <Cor cor={GRUPO_COR[g]} />
                  {GRUPO_NOME[g]} <b className="font-extrabold tabular-nums">{pctDe(v, x.total)}</b>
                </span>
              ))}
          </div>
          {suspeito && (
            <p className="rounded-md border-l-4 border-ouro bg-ouro-claro px-3 py-2 text-sm">
              Atenção: o valor de {x.ano} é muito maior que o dos outros anos. Pode ser erro de digitação na declaração
              ao TSE; o painel mostra o valor como foi publicado.
            </p>
          )}
          {analise?.frase && <p className="text-center text-[15px]">{analise.frase}</p>}
        </>
      )}
      <p className="texto-nota text-center">
        Cada retângulo é um tipo de bem; a área é o valor declarado. Fonte: TSE, declaração de bens no registro da
        candidatura (2006 e 2008 sem o tipo do bem). Inflação: IPCA, IBGE.
      </p>
    </Janela>
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
function Mapa({ x, fator }: { x: AnoFin; fator: number }) {
  const dica = useDica();
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
      const k = `${it.g}|${it.nome}`;
      const ja = porTipo.get(k);
      if (ja) ja.v += it.v;
      else porTipo.set(k, { nome: nomeBem(it.nome), g: it.g, v: it.v });
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
                  {fator !== 1 && (
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

const FOCAVEIS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Janela por cima da página: fecha com Esc, no X ou clicando fora; o foco fica preso dentro e volta ao sair. */
function Janela({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: ReactNode }) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const antes = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const el = caixa.current;
    el?.focus();
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") aoFechar();
      if (ev.key !== "Tab" || !el) return;
      const focaveis = [...el.querySelectorAll<HTMLElement>(FOCAVEIS)];
      const primeiro = focaveis[0],
        ultimo = focaveis[focaveis.length - 1];
      if (!primeiro) return;
      if (ev.shiftKey && (document.activeElement === primeiro || document.activeElement === el)) {
        ev.preventDefault();
        ultimo.focus();
      } else if (!ev.shiftKey && document.activeElement === ultimo) {
        ev.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", tecla);
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = rolagem;
      antes?.focus();
    };
  }, [aoFechar]);

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: clicar no véu fecha; o teclado usa Esc e o botão Fechar
    <div
      className="q10-veu fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/55 p-3"
      onMouseDown={ev => {
        if (ev.target === ev.currentTarget) aoFechar();
      }}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="q10-janela relative grid w-full max-w-[900px] gap-3.5 rounded-caixa bg-branco px-5 pt-6 pb-5 shadow-[0_20px_60px_rgb(0_0_0/0.35)] outline-none"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={aoFechar}
          className="absolute top-3 right-3 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-bege text-[22px] leading-none font-bold hover:bg-ouro"
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
