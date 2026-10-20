import { useMemo } from "react";
import { Anel, Aneis, Barra, Barras, Caixa, Linha, Selo } from "../../componentes";
import { fmt, int, pc } from "../../lib/formato";
import { perfil, porNivel, type Contagem, type Teste } from "./calculo";
import { textoOnde } from "./comum";
import { NIVEL, PLURAL, type DadosQ4, type Filtros } from "./tipos";

interface Props {
  D: DadosQ4;
  f: Filtros;
  ufs: string[];
  r: Record<number, Contagem>;
  t: Teste;
}

/** Topo da página: a resposta em linguagem simples, os dois anéis e a chance de se eleger por nível. */
export function Resposta({ D, f, ufs, r, t }: Props) {
  const q = useMemo(() => perfil(D.perfil, f.ano, ufs), [D, f.ano, ufs]);
  const tot = q.map(l => l.reduce((a, b) => a + b));
  const p = q.map((l, i) => l.map(v => pc(v, tot[i])));

  const niv = porNivel(r);
  const geral = pc(t.E, t.N);
  const varia = t.p != null && t.p < 0.05 && t.conf;
  const vezes = niv[3].t && niv[0].t ? niv[3].t / niv[0].t : null;
  const cargo = PLURAL[f.cargo];

  const mx = Math.max(5, ...niv.map(x => x.t || 0), geral || 0) * 1.15;
  const melhor = Math.max(...niv.map(x => x.t || 0));

  const rotuloSelo =
    t.p == null ? "Sem dados suficientes para o teste"
    : !t.conf ? "Poucos candidatos: o teste não é confiável"
    : varia ? "Diferença real (teste estatístico, p < 0,05)"
    : "Sem diferença real (teste estatístico)";

  return (
    <div className="grade-duas">
      <Caixa>
        <h2>A resposta</h2>
        <p className="texto-simples">
          Quem chega ao poder estudou <b>bem mais</b> que a população: {textoOnde(f.uf)}, {fmt(p[0][3], 0)}% dos adultos têm faculdade, mas {fmt(p[2][3], 0)}% dos eleitos de {f.ano} têm.{" "}
          {varia ? (
            <>Para {cargo}, <b>quanto mais estudo, maior a chance de se eleger</b>.</>
          ) : t.p != null && t.conf ? (
            <>Para {cargo}, porém, <b>a escolaridade não muda a chance</b> de se eleger.</>
          ) : (
            <>Para {cargo} há poucos candidatos para medir a chance com segurança.</>
          )}
        </p>
        <div>
          <Linha rotulo="Adultos com faculdade" valor={`${fmt(p[0][3], 0)}%`} />
          <Linha rotulo={`Candidatos com faculdade (${f.ano})`} valor={`${fmt(p[1][3], 0)}%`} />
          <Linha rotulo={`Eleitos com faculdade (${f.ano})`} valor={`${fmt(p[2][3], 0)}%`} />
        </div>
      </Caixa>

      <div className="grid min-w-0 gap-3.5">
        <Aneis>
          <Anel pct={p[0][3]} legenda="têm faculdade" nome="População adulta" />
          <Anel pct={p[2][3]} legenda="têm faculdade" nome={`Eleitos em ${f.ano}`} variante="verde" />
        </Aneis>
        <Caixa>
          <h2>De cada 100 candidatos a {cargo}, quantos se elegem?</h2>
          <Barras>
            {niv.map((x, i) =>
              x.n ? (
                <div key={i} title={`${int(x.e)} eleitos de ${int(x.n)} candidatos`}>
                  <Barra
                    rotulo={NIVEL[i + 1]}
                    pct={(100 * (x.t ?? 0)) / mx}
                    valor={fmt(x.t, (x.t ?? 0) < 10 ? 1 : 0)}
                    cor={x.t === melhor ? "var(--color-verde-esc)" : "var(--color-verde)"}
                    media={geral != null ? (100 * geral) / mx : undefined}
                  />
                </div>
              ) : (
                <div key={i} className="grid grid-cols-[minmax(0,13em)_minmax(0,1fr)_3.4em] items-center gap-2.5 text-sm">
                  <span>{NIVEL[i + 1]}</span>
                  <span className="texto-nota">sem candidatos</span>
                  <b />
                </div>
              ),
            )}
          </Barras>
          <Selo tipo={varia ? "sim" : "nao"}>{rotuloSelo}</Selo>
          <p className="texto-nota">
            Candidatos a {cargo} em {f.ano} {textoOnde(f.uf)}. A linha tracejada é a média do cargo ({fmt(geral, 0)} em cada 100).
            {varia && vezes ? ` Quem tem faculdade se elege ${fmt(vezes, 1)} vez${vezes >= 2 ? "es" : ""} mais que quem não terminou o fundamental.` : ""}
          </p>
        </Caixa>
      </div>
    </div>
  );
}
