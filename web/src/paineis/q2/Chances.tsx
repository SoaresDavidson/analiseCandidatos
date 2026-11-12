import { useMemo } from "react";
import { Caixa, useDica } from "../../componentes";
import { fmt, int, pc } from "../../lib/formato";
import { noLugar, UF_NOME } from "../../lib/uf";
import { CARGO_NOME, FAIXA_ROT, faixaValor, taxas, teste, umEm } from "./calculo";
import type { DadosQ2, Faixa, Filtros } from "./tipos";

// "sem bens" em cinza; os 5 quintos num só tom de ouro, do claro (menos patrimônio) ao escuro (mais)
const COR_FAIXA = ["#cfcbc2", "#f7df8f", "#f1cb4d", "#ebb400", "#c79500", "#8f6c00"];

const W = 760,
  H = 380,
  L = 46,
  R = 14,
  T = 64,
  B = 78,
  PASSO = (W - L - R) / 6;

/** Passo "redondo" do eixo para o maior valor caber em até 5 linhas de grade. */
const passoEixo = (mx: number): number => [2, 5, 10, 20, 25, 50].find(p => mx / p <= 5) ?? 50;

/** A resposta numa frase e o gráfico: de cada 100 candidatos de cada faixa, quantos se elegeram. */
export function Chances({ D, f, s }: { D: DadosQ2; f: Filtros; s: Faixa[] }) {
  const { mostrar, esconder } = useDica();
  const tx = useMemo(() => taxas(s), [s]);
  const t = useMemo(() => teste(s), [s]);
  const lim = D.limites[`${f.cargo}|${f.ano}`];
  const media = pc(t.e, t.n);
  const sobe = tx[5] != null && tx[1] != null && tx[5] > tx[1];
  const vezes = tx[1] && tx[5] != null ? tx[5] / tx[1] : null;
  const mx = Math.max(5, ...tx.filter((v): v is number => v != null));
  const passo = passoEixo(mx * 1.12);
  const topo = Math.ceil((mx * 1.12) / passo) * passo;
  const Y = (v: number) => T + (H - T - B) * (1 - v / topo);
  const chave = `${f.cargo}|${f.ano}|${f.uf}`;

  if (!t.n)
    return (
      <Caixa>
        <h2>A chance de se eleger sobe com o patrimônio?</h2>
        <p className="texto-nota">Sem candidatos para esta escolha.</p>
      </Caixa>
    );

  return (
    <Caixa>
      <h2>A chance de se eleger sobe com o patrimônio?</h2>
      <p className="texto-simples m-0">
        {sobe ? <b>Sim. </b> : <b>Não neste recorte. </b>}
        Entre os candidatos a {CARGO_NOME[f.cargo]} {noLugar(f.uf)} em {f.ano}, se elegeram <b>{fmt(tx[5])}%</b> dos
        mais ricos e <b>{fmt(tx[1])}%</b> dos mais pobres.
      </p>
      <div className="flex flex-wrap gap-2 text-[13px] font-bold">
        {vezes != null && vezes >= 1.2 && (
          <span className="rounded-full bg-ouro px-3 py-1.5">{fmt(vezes, 1)}× mais chance entre os mais ricos</span>
        )}
        {t.valido ? (
          <span className="rounded-full bg-verde-claro px-3 py-1.5 text-verde-esc">
            ✓ {t.p < 0.05 ? "A diferença é real, não é acaso" : "A diferença pode ser acaso"}
          </span>
        ) : (
          <span className="rounded-full bg-bege px-3 py-1.5">Poucos candidatos: leia com cuidado</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="De cada 100 candidatos de cada faixa de patrimônio, quantos se elegeram"
        className="grafico mt-1"
      >
        {/* grade e eixo */}
        {Array.from({ length: Math.round(topo / passo) + 1 }, (_, k) => k * passo).map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} className={v ? "svg-grade" : "stroke-texto-2"} />
            <text x={L - 8} y={Y(v)} textAnchor="end" dominantBaseline="middle" className="svg-eixo">
              {v}%
            </text>
          </g>
        ))}
        {/* média de todos os candidatos */}
        {media != null && (
          <g>
            <line x1={L} x2={W - R} y1={Y(media)} y2={Y(media)} strokeDasharray="5 4" className="stroke-texto-2" />
            <text
              x={L + 8}
              y={Y(media) - 7}
              className="svg-eixo font-bold [paint-order:stroke] stroke-white stroke-[4px]"
            >
              média de todos: {fmt(media)}%
            </text>
          </g>
        )}
        {s.map(([c, e], i) => {
          const v = tx[i];
          if (v == null) return null;
          const bw = PASSO * 0.62,
            x = L + i * PASSO + (PASSO - bw) / 2,
            cx = x + bw / 2,
            h = Math.max(2, H - B - Y(v));
          return (
            <g key={`${chave}|${i}`}>
              <path
                d={`M${x},${H - B}v${-(h - Math.min(8, h))}q0,${-Math.min(8, h)} ${Math.min(8, h)},${-Math.min(8, h)}h${bw - 2 * Math.min(8, h)}q${Math.min(8, h)},0 ${Math.min(8, h)},${Math.min(8, h)}v${h - Math.min(8, h)}Z`}
                fill={COR_FAIXA[i]}
                className="anima-cresce-y cursor-default"
                style={{ animationDelay: `${i * 70}ms` }}
                onMouseMove={ev =>
                  mostrar(
                    ev,
                    <>
                      <b>{FAIXA_ROT[i]}</b>
                      {i ? ` · ${faixaValor(lim, i)}` : " · nada declarado"}
                      <br />
                      {int(e)} eleitos de {int(c)} candidatos
                      <br />
                      <b>{fmt(v)}%</b> se elegeram ({umEm(v)})
                    </>,
                  )
                }
                onMouseLeave={esconder}
              />
              <text x={cx} y={Y(v) - 24} textAnchor="middle" className="fill-texto text-[19px] font-extrabold">
                {fmt(v)}%
              </text>
              <text x={cx} y={Y(v) - 8} textAnchor="middle" className="svg-eixo">
                {umEm(v)}
              </text>
              <text x={cx} y={H - B + 20} textAnchor="middle" className="svg-rotulo font-bold">
                {i === 0 ? "Sem bens" : i === 1 ? "Mais pobres" : i === 5 ? "Mais ricos" : `${i}º quinto`}
              </text>
              <text x={cx} y={H - B + 37} textAnchor="middle" className="svg-eixo">
                {i ? faixaValor(lim, i) : "nada declarado"}
              </text>
              <text x={cx} y={H - B + 54} textAnchor="middle" className="svg-eixo">
                {int(c)} candidatos
              </text>
            </g>
          );
        })}
        <text x={L} y={18} className="svg-rotulo font-bold">
          De cada 100 candidatos de cada faixa, quantos se elegeram
        </text>
        <text x={L} y={36} className="svg-eixo">
          Os candidatos que declararam bens foram divididos em 5 grupos do mesmo tamanho, do menor ao maior patrimônio.
        </text>
      </svg>

      <p className="texto-nota m-0">
        {int(t.n)} candidatos, {int(t.e)} eleitos; {fmt(pc(s[0][0], t.n), 0)}% não declararam nenhum bem. Patrimônio em
        reais de 2024. Os 5 grupos são cortados no Brasil inteiro
        {f.uf === "TODAS" ? "" : `; em ${UF_NOME[f.uf]} cada grupo pode ter mais ou menos gente`}. Ter mais patrimônio
        não prova que o dinheiro elege: ele anda junto com idade, carreira e mandato anterior.
      </p>
    </Caixa>
  );
}
