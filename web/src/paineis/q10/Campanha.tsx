import { VerMais } from "../../componentes";
import { brl, fmt } from "../../lib/formato";
import { ABREV, type Pessoa, receitaComErro } from "./logica";
import type { Financas } from "./useFinancas";

/** Receita, fundo público e despesa de campanha da pessoa aberta (2018 em diante). */
export function Campanha({ p, fin }: { p: Pessoa; fin: Financas }) {
  const camp = (fin.anos ?? []).filter(y => y.receita != null);
  const cargoDo = (ano: number) => {
    const c = p.r.find(r => r.ano === ano);
    return c ? `${ABREV[c.cargo]}${c.res === 0 ? " · eleito" : c.res === 1 ? " · não eleito" : ""}` : "";
  };
  const comErro = camp.filter(y => receitaComErro(y.receita));

  return (
    <VerMais titulo={`Campanha de ${p.nome}: quanto arrecadou e gastou`}>
      {fin.falhou ? (
        <p className="texto-nota">
          Para ver a campanha, abra o painel pelo site local: na pasta do projeto, rode{" "}
          <code>uv run python -m scripts.servir_painel</code>.
        </p>
      ) : !camp.length ? (
        <p className="texto-nota">
          Sem prestação de contas carregada para esta pessoa: o painel tem receita e gasto de campanha de 2018 em
          diante.
        </p>
      ) : (
        <div className="rolagem-x">
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
                    {receitaComErro(y.receita) || !y.receita || y.receita <= 0
                      ? "–"
                      : `${fmt((100 * (y.publico || 0)) / y.receita, 0)}%`}
                  </td>
                  <td>{brl(y.despesa || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {comErro.length > 0 && (
        <p className="texto-nota">
          * Em {comErro.map(y => y.ano).join(" e ")}, a prestação de contas publicada pelo TSE traz{" "}
          {comErro.map(y => brl(y.receita)).join(", ")} arrecadados, mais do que qualquer campanha dos 6 estados (a
          maior não chega a R$ 20 milhões). É erro de digitação no arquivo do TSE; o valor fica fora da tabela.
        </p>
      )}
      <p className="texto-nota">
        Fonte: TSE, prestação de contas das campanhas, de 2018 em diante. O dinheiro arrecadado é da campanha, não do
        patrimônio pessoal.
      </p>
    </VerMais>
  );
}
