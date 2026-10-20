import { useMemo, useState } from "react";
import { Alternador, VerMais } from "../../componentes";
import { fmt, int, pc } from "../../lib/formato";
import { UF_NOME } from "../../lib/uf";
import type { Contagem, Teste } from "./calculo";
import { LinhaEleito, NomeEleito } from "./comum";
import { type Eleito, type Filtros, GRAU, type Municipio, PLURAIS, PLURAL } from "./tipos";

interface Props {
  f: Filtros;
  ufs: readonly string[];
  r: Record<number, Contagem>;
  t: Teste;
  ELEITOS: Eleito[];
  MUN_BY: Record<number, Municipio>;
}

/** Bloco "Ver os 8 graus": tabela por grau, teste qui-quadrado e lista de quem foi eleito em cada grau. */
export function Graus({ f, ufs, r, t, ELEITOS, MUN_BY }: Props) {
  const [grauEscolhido, setGrau] = useState<number | null>(null);
  const geral = pc(t.E, t.N);
  const graus = [1, 2, 3, 4, 5, 6, 7, 8];
  const com = graus.filter(g => r[g].e > 0);
  // se o grau escolhido não tem eleitos neste recorte, cai no primeiro que tem
  const grau = grauEscolhido != null && com.includes(grauEscolhido) ? grauEscolhido : (com[0] ?? null);

  const lista = useMemo(
    () =>
      ELEITOS.filter(e => e.ano === f.ano && e.cargo === f.cargo && e.grau === grau && ufs.includes(e.uf)).sort(
        (a, b) => (MUN_BY[b.cod]?.popTotal ?? 0) - (MUN_BY[a.cod]?.popTotal ?? 0) || a.urna.localeCompare(b.urna, "pt"),
      ),
    [ELEITOS, MUN_BY, f.ano, f.cargo, grau, ufs],
  );

  const ptxt = t.p == null ? "–" : t.p < 0.001 ? "menor que 0,001" : fmt(t.p, 3);
  const plural = lista.length > 1;

  return (
    <VerMais titulo="Ver os 8 graus de escolaridade, o teste estatístico e quem são os eleitos">
      <div className="rolagem-x">
        <table>
          <thead>
            <tr>
              <th>Grau declarado ao TSE</th>
              <th>Candidatos</th>
              <th>Eleitos</th>
              <th>Eleitos em cada 100</th>
            </tr>
          </thead>
          <tbody>
            {graus.map(g => (
              <tr key={g}>
                <td>{GRAU[g]}</td>
                <td>{int(r[g].n)}</td>
                <td>{int(r[g].e)}</td>
                <td>{r[g].n ? fmt(pc(r[g].e, r[g].n)) : "–"}</td>
              </tr>
            ))}
            <tr>
              <td>
                <b>Total</b>
              </td>
              <td>
                <b>{int(t.N)}</b>
              </td>
              <td>
                <b>{int(t.E)}</b>
              </td>
              <td>
                <b>{fmt(geral)}</b>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="texto-nota">
        Teste qui-quadrado (graus 1 a 3 juntos): p = {ptxt}. Abaixo de 0,05, a chance de se eleger não é a mesma em
        todos os graus.
        {t.conf ? "" : " Atenção: poucos candidatos em alguns graus, o teste não é confiável."}
      </p>
      <h3>
        {grau
          ? `Quem são: ${int(lista.length)} ${plural ? PLURAIS[f.cargo] : PLURAL[f.cargo]} eleito${plural ? "s" : ""} que declararam "${GRAU[grau].toLowerCase()}"`
          : "Quem são"}
      </h3>
      {grau != null && (
        <Alternador
          rotulo="Grau de escolaridade"
          opcoes={com.map(g => [g, GRAU[g]] as const)}
          valor={grau}
          aoMudar={setGrau}
        />
      )}
      <div className="lista-rolavel">
        {lista.slice(0, 40).map(e => (
          <LinhaEleito
            key={e.sq}
            esq={
              <span>
                <NomeEleito e={e} />
                <br />
                <small className="text-texto-2">{e.civil || ""}</small>
              </span>
            }
            dir={
              <span className="text-right">
                {e.partido}
                <br />
                <small className="text-texto-2">{e.cod ? `${MUN_BY[e.cod]?.n ?? ""} (${e.uf})` : UF_NOME[e.uf]}</small>
              </span>
            }
          />
        ))}
        {lista.length > 40 && (
          <div className="border-b border-linha px-0.5 py-1.5 text-[13.5px]">
            <small className="text-texto-2">
              Mostrando 40 de {int(lista.length)}, das cidades maiores para as menores.
            </small>
          </div>
        )}
      </div>
    </VerMais>
  );
}
