import { useMemo } from "react";
import { Aneis, Anel, Caixa, Linha, Selo, useDica } from "../../componentes";
import { fmt, int, maiusculaInicial, pc } from "../../lib/formato";
import { noEstado, UF_NOME } from "../../lib/uf";
import { CARGO_NOME, CARGO_ROT, FAIXA_ROT, faixaValor, pTexto, taxas, teste, umEm } from "./calculo";
import type { DadosQ2, Faixa, Filtros } from "./tipos";

/** A resposta em linguagem simples, as três linhas de números e o selo do teste. */
export function Resposta({ f, s }: { f: Filtros; s: Faixa[] }) {
  const tx = taxas(s),
    t = teste(s),
    lugar = maiusculaInicial(noEstado(f.uf));
  const sobe = tx[5] != null && tx[1] != null && tx[5] > tx[1];
  const vezes = tx[1] && tx[5] != null ? tx[5] / tx[1] : null;
  return (
    <Caixa>
      <h2>A resposta</h2>
      <p className="texto-simples">
        {!t.n ? (
          "Sem candidatos neste filtro."
        ) : (
          <>
            {sobe ? "Sim." : "Não neste recorte."} {lugar}, entre os candidatos a {CARGO_NOME[f.cargo]} em {f.ano},{" "}
            <b>{fmt(tx[5])}%</b> dos que estão no quinto mais rico se elegeram, contra <b>{fmt(tx[1])}%</b> no quinto
            mais pobre{vezes && vezes >= 1.5 ? ` (${fmt(vezes, 1)} vezes mais)` : ""}. Quem não declarou nenhum bem se
            elegeu {tx[0] != null && tx[1] != null && tx[0] < tx[1] ? "menos ainda" : "assim"}: <b>{fmt(tx[0])}%</b>.
            Isso não prova que o dinheiro elege: patrimônio anda junto com idade, carreira e mandato anterior.
          </>
        )}
      </p>
      <div>
        <Linha rotulo="Candidatos que foram a voto" valor={int(t.n)} />
        <Linha rotulo="Eleitos" valor={`${int(t.e)} (${fmt(pc(t.e, t.n))}%)`} />
        <Linha rotulo="Não declararam bens" valor={`${fmt(pc(s[0][0], t.n), 0)}% dos candidatos`} />
      </div>
      {t.valido ? (
        <Selo tipo="sim">
          ✓ A chance depende do patrimônio: a chance de ser acaso é {pTexto(t.p)} (qui-quadrado {fmt(t.chi, 1)})
        </Selo>
      ) : (
        <Selo tipo="nao">Poucos candidatos para o teste ({int(t.n)}): leia as taxas com cuidado</Selo>
      )}
    </Caixa>
  );
}

/** Os dois anéis (quinto mais rico e mais pobre) e a escada da taxa de eleição por faixa. */
export function Escada({ D, f, s }: { D: DadosQ2; f: Filtros; s: Faixa[] }) {
  const tx = useMemo(() => taxas(s), [s]);
  const pouco = teste(s).n < 300;
  return (
    <div className="grid min-w-0 gap-3.5">
      <Aneis>
        <Anel pct={tx[5]} legenda="do quinto mais rico" nome="se elegeram" />
        <Anel pct={tx[1]} legenda="do quinto mais pobre" nome="se elegeram" variante="verde" />
      </Aneis>
      <Caixa>
        <h2>
          {CARGO_ROT[f.cargo]}, {f.ano}: a taxa de eleição sobe com o patrimônio?
        </h2>
        <GraficoEscada D={D} f={f} s={s} tx={tx} />
        <p className="texto-nota">
          Patrimônio declarado em reais de 2024. Os quintos são cortados nos 6 estados juntos
          {f.uf === "TODAS" ? "" : `; em ${UF_NOME[f.uf]} cada quinto pode ter mais ou menos gente`}.
          {pouco ? " Poucos candidatos: as taxas oscilam muito." : ""}
        </p>
      </Caixa>
    </div>
  );
}

const W = 680,
  H = 330,
  L = 10,
  R = 10,
  T = 46,
  B = 70,
  LARG = (W - L - R) / 6;

function GraficoEscada({ D, f, s, tx }: { D: DadosQ2; f: Filtros; s: Faixa[]; tx: (number | null)[] }) {
  const { mostrar, esconder } = useDica();
  const lim = D.limites[`${f.cargo}|${f.ano}`];
  const mx = Math.max(5, ...tx.filter((v): v is number => v != null)) * 1.08;
  const Y = (v: number) => T + (H - T - B) * (1 - v / mx);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Taxa de eleição por faixa de patrimônio" className="grafico">
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} className="stroke-texto-2" />
      {s.map(([c, e], i) => {
        const v = tx[i];
        if (v == null) return null;
        const x = L + i * LARG + 10,
          bw = LARG - 20,
          cx = x + bw / 2;
        return (
          <g key={i}>
            <rect
              x={x}
              y={Y(v)}
              width={bw}
              height={Math.max(1, H - B - Y(v))}
              rx={4}
              fill={i === 0 ? "var(--color-sem-dado)" : "var(--color-ouro)"}
              onMouseMove={ev =>
                mostrar(
                  ev,
                  <>
                    <b>{FAIXA_ROT[i]}</b>
                    {i ? ` · ${faixaValor(lim, i)}` : ""}
                    <br />
                    {int(e)} eleitos de {int(c)} candidatos
                    <br />
                    <b>{fmt(v)}%</b> se elegeram ({umEm(v)})
                  </>,
                )
              }
              onMouseLeave={esconder}
            />
            <text
              x={cx}
              y={Y(v) - 26}
              textAnchor="middle"
              dominantBaseline="middle"
              className="svg-rotulo font-extrabold"
            >
              {fmt(v)}%
            </text>
            <text x={cx} y={Y(v) - 10} textAnchor="middle" dominantBaseline="middle" className="svg-eixo">
              {umEm(v)}
            </text>
            <text x={cx} y={H - B + 16} textAnchor="middle" dominantBaseline="middle" className="svg-rotulo font-bold">
              {FAIXA_ROT[i]}
            </text>
            <text x={cx} y={H - B + 33} textAnchor="middle" dominantBaseline="middle" className="svg-eixo">
              {i ? faixaValor(lim, i) : "nada declarado"}
            </text>
            <text x={cx} y={H - B + 50} textAnchor="middle" dominantBaseline="middle" className="svg-eixo">
              {int(c)} cand.
            </text>
          </g>
        );
      })}
      <text x={L} y={14} dominantBaseline="middle" className="svg-eixo">
        Taxa de eleição: de cada 100 candidatos da faixa, quantos se elegeram
      </text>
    </svg>
  );
}
