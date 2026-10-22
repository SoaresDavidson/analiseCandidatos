import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Alternador, Caixa, Campo, Legenda, useDica } from "../../componentes";
import { carregarDados } from "../../lib/dados";
import { brl, fmt } from "../../lib/formato";
import { ABREV, type AnoFin, anosFin, brlCurto, GRUPO_COR, GRUPO_NOME, type Pessoa, receitaComErro } from "./logica";
import type { DadosQ10, Filtros, ParteFin } from "./tipos";

type Estado = { id: number; anos: AnoFin[] | null; erro: boolean };

/** Frase da resposta e aviso de erro de digitação (os dois dependem só dos anos, não do tipo de valor). */
function analisar(D: DadosQ10, p: Pessoa, anos: AnoFin[]) {
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
  const anosSusp = suspeitos.map(x => x.ano).join(" e ");

  let frase: ReactNode;
  if (!comBens.length)
    frase = (
      <>
        <b>{p.nome}</b> não tem declaração de bens no TSE nos anos da carreira (o TSE publica bens a partir de 2006).
      </>
    );
  else if (confiaveis.length < 2) {
    frase =
      comBens.length === 1 ? (
        <>
          <b>{p.nome}</b> declarou <b>{brl(comBens[0].total)}</b> em bens em {comBens[0].ano}. É a única declaração
          disponível (o TSE publica bens a partir de 2006).
        </>
      ) : (
        <>
          Não dá para comparar o patrimônio de <b>{p.nome}</b> entre os anos: sobra só uma declaração sem suspeita de
          erro.
        </>
      );
  } else {
    const a = confiaveis[0],
      b = confiaveis[confiaveis.length - 1],
      ra = a.total * fat(a.ano),
      rb = b.total * fat(b.ano);
    const variacao = ra > 0 ? (100 * (rb - ra)) / ra : null;
    let verbo: ReactNode = "";
    if (variacao != null)
      verbo =
        Math.abs(variacao) < 5 ? (
          "ficou praticamente igual"
        ) : variacao > 0 ? (
          <b>cresceu {fmt(variacao, 0)}%</b>
        ) : (
          <b>caiu {fmt(-variacao, 0)}%</b>
        );
    // o que mais mudou, entre a primeira e a última declaração com tipo (2010 em diante)
    let mudou = "";
    const det = confiaveis.filter(x => x.ano >= 2010);
    if (det.length >= 2) {
      const x = det[0],
        y = det[det.length - 1];
      const dif = [0, 1, 2, 3, 4, 5]
        .map(g => ({ g, d: y.grupos[g] * fat(y.ano) - x.grupos[g] * fat(x.ano) }))
        .sort((u, v) => Math.abs(v.d) - Math.abs(u.d));
      if (Math.abs(dif[0].d) >= 1000)
        mudou = ` O que mais mudou de ${x.ano} a ${y.ano}: ${GRUPO_NOME[dif[0].g].toLowerCase()} (${dif[0].d > 0 ? "+" : "−"}${brl(Math.abs(dif[0].d))}, corrigido).`;
    }
    frase = (
      <>
        De {a.ano} a {b.ano}, o patrimônio declarado de <b>{p.nome}</b> foi de {brl(a.total)} para {brl(b.total)}
        {suspeitos.length > 0 && ` (sem contar ${anosSusp}: ver o aviso abaixo do gráfico)`}.
        {variacao != null && (
          <>
            {" "}
            Descontada a inflação, {verbo}: de {brl(ra)} para {brl(rb)} em reais de 2024.
          </>
        )}
        {mudou}
      </>
    );
  }
  return { comBens, suspeitos, frase };
}

/** Patrimônio e campanha da pessoa aberta. Os dados vêm de q10-financas/NN.json, buscado só quando preciso. */
export function Financas({
  D,
  p,
  f,
  aoMudarValor,
}: {
  D: DadosQ10;
  p: Pessoa;
  f: Filtros;
  aoMudarValor: (v: Filtros["valor"]) => void;
}) {
  const [estado, setEstado] = useState<Estado>({ id: -1, anos: null, erro: false });
  const [ano, setAno] = useState<{ id: number; ano: number | null }>({ id: -1, ano: null });

  useEffect(() => {
    let vivo = true;
    const nn = String(p.id % D.fin.partes).padStart(2, "0");
    carregarDados<ParteFin>(`q10-financas/${nn}.json`).then(
      parte => vivo && setEstado({ id: p.id, anos: anosFin(D, parte[p.id] || []), erro: false }),
      () => vivo && setEstado({ id: p.id, anos: null, erro: true }),
    );
    return () => {
      vivo = false;
    };
  }, [D, p.id]);

  const anos = estado.id === p.id ? estado.anos : null;
  const falhou = estado.id === p.id && estado.erro;
  const analise = useMemo(() => (anos ? analisar(D, p, anos) : null), [D, p, anos]);

  // o ano aberto no detalhe é o último, até a pessoa clicar em outra barra
  const comBens = analise?.comBens ?? [];
  const selecionado =
    ano.id === p.id && comBens.some(x => x.ano === ano.ano)
      ? ano.ano
      : comBens.length
        ? comBens[comBens.length - 1].ano
        : null;

  return (
    <Caixa id="fin">
      <h2>Patrimônio e campanha de {p.nome}, eleição por eleição</h2>
      <p className="texto-simples text-base">
        {falhou ? (
          <>
            Para ver patrimônio e campanha, abra o painel pelo site local: na pasta do projeto, rode{" "}
            <code>uv run python -m scripts.servir_painel</code>.
          </>
        ) : (
          analise?.frase
        )}
      </p>
      <div className="flex flex-wrap items-end gap-x-[18px] gap-y-2.5">
        <Campo rotulo="Valores" grupo>
          <Alternador
            rotulo="Valores"
            opcoes={[
              ["real", "Corrigidos pela inflação"],
              ["nominal", "Como declarados"],
            ]}
            valor={f.valor}
            aoMudar={aoMudarValor}
          />
        </Campo>
      </div>
      {analise && anos && (
        <>
          <Legenda
            itens={[0, 1, 2, 3, 4, 5, 6]
              .filter(g => comBens.some(x => x.grupos[g] > 0))
              .map(g => ({ cor: GRUPO_COR[g], rotulo: GRUPO_NOME[g] }))}
          />
          <Grafico
            D={D}
            comBens={comBens}
            suspeitos={analise.suspeitos}
            valor={f.valor}
            selecionado={selecionado}
            aoEscolher={a => setAno({ id: p.id, ano: a })}
          />
          {analise.suspeitos.length > 0 && (
            <p className="rounded-md border-l-4 border-ouro bg-ouro-claro px-3 py-2 text-sm">
              Atenção: em {analise.suspeitos.map(x => x.ano).join(" e ")} o valor declarado (
              {analise.suspeitos.map(x => brl(x.total)).join(", ")}) é muito maior que nos outros anos. Pode ser erro de
              digitação na declaração ao TSE; o painel mostra o valor como foi publicado.
            </p>
          )}
          <div className="grid items-start gap-[18px] min-[801px]:grid-cols-2">
            <div className="min-w-0">
              <h3 className="mb-1.5">
                {comBens.find(x => x.ano === selecionado)
                  ? `Em que estavam os bens em ${selecionado}`
                  : "Bens declarados"}
              </h3>
              <DetalheAno D={D} x={comBens.find(y => y.ano === selecionado)} valor={f.valor} />
            </div>
            <div className="min-w-0">
              <h3 className="mb-1.5">Campanha: quanto arrecadou e gastou</h3>
              <div className="rolagem-x">
                <Campanha p={p} anos={anos} />
              </div>
            </div>
          </div>
        </>
      )}
      <p className="texto-nota">
        Patrimônio: o que o candidato declarou ao TSE no registro de cada candidatura (o TSE publica desde 2006; em 2006
        e 2008 sem separar o tipo). "Corrigido pela inflação" leva cada valor a reais de agosto de 2024 pelo IPCA do
        IBGE, para comparar anos diferentes. Campanha: prestação de contas, de 2018 em diante; o dinheiro arrecadado é
        da campanha, não do patrimônio pessoal.
      </p>
    </Caixa>
  );
}

const W = 860,
  H = 300,
  L = 70,
  R = 16,
  T = 24,
  B = 30;

/** Uma barra empilhada por eleição com declaração, por tipo de bem. */
function Grafico({
  D,
  comBens,
  suspeitos,
  valor,
  selecionado,
  aoEscolher,
}: {
  D: DadosQ10;
  comBens: AnoFin[];
  suspeitos: AnoFin[];
  valor: Filtros["valor"];
  selecionado: number | null;
  aoEscolher: (ano: number) => void;
}) {
  const dica = useDica();
  const corr = valor === "real";
  const g = useMemo(() => {
    const fator = (ano: number) => (corr ? D.fin.fator[ano] || 1 : 1);
    const n = Math.max(comBens.length, 1),
      banda = (W - L - R) / n,
      larg = Math.min(70, banda * 0.6);
    // eixo com valores redondos: passo de 1, 2, 2,5 ou 5 × potência de 10
    const maior = Math.max(1, ...comBens.map(x => x.total * fator(x.ano))),
      bruto = maior / 4,
      pot = 10 ** Math.floor(Math.log10(bruto));
    const passo = pot * ([1, 2, 2.5, 5, 10].find(m => m * pot >= bruto) ?? 10),
      topo = Math.ceil(maior / passo) * passo;
    const mx = topo * 1.08,
      Y = (v: number) => T + (H - T - B) * (1 - v / mx);
    const marcas: number[] = [];
    for (let v = 0; v <= topo + 1e-6; v += passo) marcas.push(v);
    const barras = comBens.map((x, i) => {
      const cx = L + banda * i + banda / 2;
      let base = 0;
      const fatias: { gi: number; vv: number; v: number; y: number; h: number }[] = [];
      x.grupos.forEach((v, gi) => {
        if (v <= 0) return;
        const vv = v * fator(x.ano),
          y0 = Y(base + vv),
          y1 = Y(base);
        fatias.push({ gi, vv, v, y: y0, h: Math.max(1, y1 - y0) });
        base += vv;
      });
      return { x, cx, fatias, base };
    });
    return { banda, larg, Y, marcas, barras };
  }, [D, comBens, corr]);

  return (
    <div className="rolagem-x">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Patrimônio declarado em cada eleição, por tipo de bem"
        className="grafico max-w-[860px]"
      >
        {g.marcas.map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={g.Y(v)} y2={g.Y(v)} className="svg-grade" />
            <text x={L - 8} y={g.Y(v)} textAnchor="end" dominantBaseline="middle" className="svg-eixo">
              {v ? brlCurto(v) : "0"}
            </text>
          </g>
        ))}
        {!comBens.length && (
          <text x={W / 2} y={H / 2} textAnchor="middle" dominantBaseline="middle" className="svg-rotulo">
            Sem declaração de bens
          </text>
        )}
        {g.barras.map(({ x, cx, fatias, base }) => (
          <g key={x.ano} className="cursor-pointer">
            {fatias.map(s => (
              <rect
                key={s.gi}
                x={cx - g.larg / 2}
                y={s.y}
                width={g.larg}
                height={s.h}
                fill={GRUPO_COR[s.gi]}
                stroke="#fff"
                strokeWidth={1.5}
                onMouseMove={ev =>
                  dica.mostrar(
                    ev,
                    <>
                      <b>
                        {x.ano} · {GRUPO_NOME[s.gi]}
                      </b>
                      <br />
                      {brl(s.vv)}
                      {corr ? " (reais de 2024)" : ""}
                      <br />
                      {fmt((100 * s.v) / x.total, 0)}% do patrimônio declarado
                    </>,
                  )
                }
                onMouseLeave={dica.esconder}
              />
            ))}
            <rect
              x={cx - g.larg / 2 - 3}
              y={g.Y(base) - 3}
              width={g.larg + 6}
              height={g.Y(0) - g.Y(base) + 6}
              fill="none"
              rx={4}
              stroke={x.ano === selecionado ? "#333" : "none"}
              strokeWidth={2}
            />
            <text
              x={cx}
              y={g.Y(base) - 12}
              textAnchor="middle"
              dominantBaseline="middle"
              className="svg-rotulo font-bold"
            >
              {suspeitos.includes(x) ? "⚠ " : ""}
              {brlCurto(base)}
            </text>
            <text x={cx} y={H - 12} textAnchor="middle" dominantBaseline="middle" className="svg-eixo">
              {x.ano}
            </text>
            <rect
              x={cx - g.banda / 2}
              y={T}
              width={g.banda}
              height={H - T - B}
              fill="transparent"
              onClick={() => aoEscolher(x.ano)}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

const BEM = "grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-2 border-b border-linha py-1.5 text-sm";

/** Lista dos bens do ano escolhido, do maior para o menor. */
function DetalheAno({ D, x, valor }: { D: DadosQ10; x: AnoFin | undefined; valor: Filtros["valor"] }) {
  if (!x) return <p className="texto-nota">Sem declaração de bens.</p>;
  const corr = valor === "real",
    fator = corr ? D.fin.fator[x.ano] || 1 : 1;
  return (
    <div>
      {x.ano <= 2008 && <p className="texto-nota">Em {x.ano} o TSE publicou os bens sem o tipo: só o total.</p>}
      <div className={BEM}>
        <span />
        <span>
          <b>Total declarado</b>
          {corr && (
            <>
              {" "}
              <small className="text-texto-2">(em reais de 2024)</small>
            </>
          )}
        </span>
        <b className="tabular-nums">{brl(x.total * fator)}</b>
      </div>
      {x.itens
        .slice()
        .sort((u, v) => v.v - u.v)
        .map((it, i) => (
          <div key={i} className={BEM}>
            <i
              aria-hidden="true"
              className="inline-block size-[13px] flex-none rounded-[3px]"
              style={{ background: GRUPO_COR[it.g] }}
            />
            <span>
              {!it.nome
                ? "Sem tipo"
                : it.nome === it.nome.toUpperCase()
                  ? it.nome[0] + it.nome.slice(1).toLowerCase()
                  : it.nome}{" "}
              <small className="text-texto-2">{x.total ? `${fmt((100 * it.v) / x.total, 0)}%` : ""}</small>
            </span>
            <b className="tabular-nums">{brl(it.v * fator)}</b>
          </div>
        ))}
      <p className="texto-nota mt-1.5">Clique em outra barra para ver outro ano.</p>
    </div>
  );
}

/** Receita, fundo público e despesa de campanha (2018 em diante). */
function Campanha({ p, anos }: { p: Pessoa; anos: AnoFin[] }) {
  const camp = anos.filter(y => y.receita != null);
  const cargoDo = (ano: number) => {
    const c = p.r.find(r => r.ano === ano);
    return c ? `${ABREV[c.cargo]}${c.res === 0 ? " · eleito" : c.res === 1 ? " · não eleito" : ""}` : "";
  };
  if (!camp.length)
    return (
      <p className="texto-nota">
        Sem prestação de contas carregada para esta pessoa: o painel tem receita e gasto de campanha de 2018 em diante.
      </p>
    );
  const comErro = camp.filter(y => receitaComErro(y.receita));
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Eleição</th>
            <th>Arrecadou</th>
            <th>Do fundo público</th>
            <th>Gastou</th>
          </tr>
        </thead>
        <tbody>
          {camp.map(y => (
            <tr key={y.ano}>
              <td>
                {y.ano}
                <br />
                <small>{cargoDo(y.ano)}</small>
              </td>
              <td>{receitaComErro(y.receita) ? "erro no TSE*" : brl(y.receita)}</td>
              <td>
                {receitaComErro(y.receita)
                  ? "–"
                  : y.receita! > 0
                    ? `${fmt((100 * (y.publico || 0)) / y.receita!, 0)}%`
                    : "–"}
              </td>
              <td>{brl(y.despesa || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {comErro.length > 0 && (
        <p className="texto-nota mt-1.5">
          * Em {comErro.map(y => y.ano).join(" e ")}, a prestação de contas publicada pelo TSE traz{" "}
          {comErro.map(y => brl(y.receita)).join(", ")} arrecadados, mais do que qualquer campanha dos 6 estados (a
          maior não chega a R$ 20 milhões). É erro de digitação no arquivo do TSE; o valor fica fora da tabela.
        </p>
      )}
    </>
  );
}
