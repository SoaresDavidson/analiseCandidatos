import { VerMais } from "../../componentes";
import { fmt, int, maiusculaInicial } from "../../lib/formato";
import { noEstado } from "../../lib/uf";
import { anosDoCargo, CARGO_ROT, contarMaisRicosGanham, somarFaixas, taxas, teste } from "./calculo";
import type { DadosQ2, Filtros } from "./tipos";

const ALTURA = 26;

/** Tabela de todos os cargos e eleições, com a escada em miniatura; clicar numa linha escolhe o cargo e o ano. */
export function Todos({ D, f, escolher }: { D: DadosQ2; f: Filtros; escolher: (cargo: number, ano: number) => void }) {
  const { favoraveis, total } = contarMaisRicosGanham(D, f.uf);
  const linhas = CARGO_ROT.flatMap((_, c) => anosDoCargo(c).map(a => [c, a] as const));
  return (
    <VerMais titulo="Em todos os cargos e eleições" aberto>
      <p className="texto-simples !text-[15.5px]">
        {maiusculaInicial(noEstado(f.uf))}, em{" "}
        <b>
          {favoraveis} de {total}
        </b>{" "}
        combinações de cargo e eleição com candidatos suficientes para o teste, o quinto mais rico se elege mais que o
        mais pobre. Taxa de eleição (%) por faixa:
      </p>
      <div className="rolagem-x">
        <table>
          <thead>
            <tr>
              <th>Cargo</th>
              <th />
              {["Sem bens", "1º", "2º", "3º", "4º", "5º"].map(r => (
                <th key={r}>{r}</th>
              ))}
              <th>Candidatos</th>
              <th>Teste</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(([c, a]) => {
              const s = somarFaixas(D, c, a, f.uf),
                tx = taxas(s),
                t = teste(s),
                mx = Math.max(...tx.filter((v): v is number => v != null), 1),
                atual = c === f.cargo && a === f.ano;
              return (
                <tr
                  key={`${c}|${a}`}
                  tabIndex={0}
                  aria-label={`Ver ${CARGO_ROT[c]} ${a} em detalhe`}
                  onClick={() => escolher(c, a)}
                  onKeyDown={e => e.key === "Enter" && escolher(c, a)}
                  className={`cursor-pointer ${atual ? "bg-ouro-claro" : ""}`}
                >
                  <td>
                    <b>{CARGO_ROT[c]}</b> {a}
                  </td>
                  <td>
                    <span aria-hidden="true" className="inline-flex h-[26px] items-end gap-0.5 align-middle">
                      {tx.map((v, i) => (
                        <i
                          key={i}
                          className={`block w-[9px] rounded-t-sm ${i ? "bg-ouro" : "bg-sem-dado"}`}
                          style={{ height: v == null ? 0 : Math.max(1, (ALTURA * v) / mx) }}
                        />
                      ))}
                    </span>
                  </td>
                  {tx.map((v, i) => (
                    <td key={i}>{fmt(v)}</td>
                  ))}
                  <td>{int(t.n)}</td>
                  <td>{t.valido ? (t.p < 0.05 ? "✓ depende" : "não dá para dizer") : "poucos casos"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="texto-nota">
        Cada mini gráfico é a escada do cargo: a barra cinza é quem não declarou bens; as amarelas, do quinto mais pobre
        ao mais rico. Clique numa linha para ver em detalhe.
      </p>
    </VerMais>
  );
}
