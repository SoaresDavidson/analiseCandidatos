import { useMemo } from "react";
import { Anel, Aneis, Barra, Barras, Caixa, Linha } from "../../componentes";
import { fmt, int, pc } from "../../lib/formato";
import { COR_SEM_DADO, COR_VERDE_ESC, TURMAS, curva, onde, ufsSel, type Pessoa } from "./logica";
import type { DadosQ10, Filtros } from "./tipos";

const ROTULOS = ["Na estreia", "4 anos depois", "8 anos depois", "12 anos depois", "16 anos depois"];

/** Topo da página: a resposta em linguagem simples, os dois anéis e a curva de sobrevivência. */
export function Resposta({ D, pessoas, f }: { D: DadosQ10; pessoas: Pessoa[]; f: Filtros }) {
  const t = TURMAS.find(x => x[0] === f.turma) ?? TURMAS[0];
  const c = useMemo(() => curva(D, ufsSel(f.uf), f.turma, "mandato"), [D, f.uf, f.turma]);
  const quatro = useMemo(() => pessoas.filter(p => p.vit >= 4).length, [pessoas]);
  const lugar = onde(f.uf);
  const lugarMaiusculo = lugar[0].toUpperCase() + lugar.slice(1);

  return (
    <div className="grade-duas">
      <Caixa>
        <h2>A resposta</h2>
        <p className="texto-simples">
          {c[2] == null ? (
            "Poucos casos para este filtro."
          ) : (
            <>
              A maioria das carreiras é curta. {lugarMaiusculo}, de cada 100 {t[2]} que ganham a primeira eleição, <b>{fmt(c[1], 0)}</b> ainda estão eleitos 4 anos depois e só <b>{fmt(c[2], 0)}</b> depois de 8.
              {f.turma === 11 && " Para prefeito, parte da queda aos 8 anos vem da regra: a lei só permite uma reeleição seguida."}
            </>
          )}
        </p>
        <div>
          <Linha rotulo="Pessoas que se elegeram ao menos uma vez" valor={int(pessoas.length)} />
          <Linha rotulo="Venceram 4 eleições ou mais" valor={`${int(quatro)} (${fmt(pc(quatro, pessoas.length), 0)}%)`} />
          <Linha rotulo="Ainda eleitos 16 anos depois" valor={c[4] == null ? "–" : `${fmt(c[4], 0)}%`} />
        </div>
      </Caixa>
      <div className="grid min-w-0 gap-3.5">
        <Aneis>
          <Anel pct={c[1]} legenda="ainda eleitos" nome="4 anos depois" />
          <Anel pct={c[2]} legenda="ainda eleitos" nome="8 anos depois" variante="verde" />
        </Aneis>
        <Caixa>
          <h2>De cada 100 {t[2]} que ganham a primeira eleição, quantos seguem eleitos?</h2>
          <Barras>
            {c.map((v, k) => (
              <Barra key={k} rotulo={ROTULOS[k]} pct={v || 0} valor={v == null ? "–" : fmt(v, 0)} cor={k === 0 ? COR_SEM_DADO : COR_VERDE_ESC} />
            ))}
          </Barras>
          <p className="texto-nota">
            Políticos que estrearam de 2006 em diante {lugar} (estado da primeira vitória). "Seguem eleitos" conta mandato em qualquer cargo: quem saiu de vereador para deputado continua na conta. Cada marco só conta quem já chegou a ele: 16 anos depois, só quem venceu em 2006 ou 2008.
          </p>
        </Caixa>
      </div>
    </div>
  );
}
