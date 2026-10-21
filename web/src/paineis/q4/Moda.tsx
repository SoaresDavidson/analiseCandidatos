import { VerMais } from "../../componentes";
import { int } from "../../lib/formato";
import { type Municipio, NIVEL } from "./tipos";

/** Bloco "Ver o nível mais comum em cada cidade (moda)": quantas cidades em cada combinação. */
export function Moda({ MUN, ufs }: { MUN: Municipio[]; ufs: readonly string[] }) {
  const sel = MUN.filter(m => ufs.includes(m.u) && m.ok);
  const t: Record<string, number> = {};
  for (const m of sel) {
    const k = `${m.modaPop}-${m.modaEl}`;
    t[k] = (t[k] || 0) + 1;
  }
  const lin = [1, 2, 3, 4].filter(a => sel.some(m => m.modaPop === a));
  const col = [1, 2, 3, 4].filter(b => sel.some(m => m.modaEl === b));

  return (
    <VerMais titulo="Ver o nível mais comum em cada cidade (moda)">
      <div className="rolagem-x">
        <table>
          <thead>
            <tr>
              <th>Mais comum na população ↓ · entre os eleitos →</th>
              {col.map(b => (
                <th key={b}>{NIVEL[b]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lin.map(a => (
              <tr key={a}>
                <td>{NIVEL[a]}</td>
                {col.map(b => (
                  <td key={b}>{int(t[`${a}-${b}`] || 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="texto-nota">
        Quantas cidades em cada combinação. A moda é boa para uma frase, mas com 4 níveis se repete demais; a resposta
        vem do mapa e do gráfico de cidades.
      </p>
    </VerMais>
  );
}
