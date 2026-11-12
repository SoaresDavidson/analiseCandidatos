import { Barra, Barras, Chip, VerMais } from "../../componentes";
import { mediana } from "../../lib/estatistica";
import { fmt, int, pc } from "../../lib/formato";
import { brl, contarPref, maiusculaInicial, PERFIL, spearman } from "./calculo";
import type { Municipio } from "./tipos";

interface Props {
  xs: Municipio[];
  onde: string;
  corPartido: (sg: string) => string;
}

const resposta = "texto-simples text-[15.5px] [&_b]:font-extrabold";

/** Blocos "Ver mais": perfil econômico, isentos e excesso de eleitores. */
export function VerMaisQ3({ xs, onde, corPartido }: Props) {
  return (
    <>
      <Perfil xs={xs} onde={onde} corPartido={corPartido} />
      <Isentos xs={xs} />
      <Excesso xs={xs} onde={onde} />
    </>
  );
}

function Perfil({ xs, onde, corPartido }: Props) {
  const grupos = PERFIL.map((p, i) => ({ p, ms: xs.filter(m => m.perfil === i) }))
    .filter(g => g.ms.length)
    .sort((a, b) => b.ms.length - a.ms.length);
  const pobre = grupos.slice().sort((a, b) => mediana(a.ms.map(m => m.pib))! - mediana(b.ms.map(m => m.pib))!)[0];
  const lidera = contarPref(grupos.find(g => g.p === "Administração pública")?.ms || [])[0]?.[0] || "–";
  const agro =
    contarPref(grupos.find(g => g.p === "Agropecuária")?.ms || [])
      .slice(0, 2)
      .map(p => p[0])
      .join(" e ") || "–";
  return (
    <VerMais titulo="O perfil econômico separa melhor quem vence">
      <p className={resposta}>
        {maiusculaInicial(onde)}, onde o setor público é a maior atividade (as cidades mais pobres), lidera o{" "}
        <b>{lidera}</b>; nas do agronegócio, <b>{agro}</b>. O grupo de PIB per capita mais baixo é o de{" "}
        {pobre.p.toLowerCase()}.
      </p>
      <div className="rolagem-x">
        <table>
          <thead>
            <tr>
              <th>Perfil econômico</th>
              <th>Cidades</th>
              <th>PIB per capita (mediana)</th>
              <th>Prefeitos mais eleitos</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map(g => (
              <tr key={g.p}>
                <td>
                  <b>{g.p}</b>
                </td>
                <td>{g.ms.length}</td>
                <td>{brl(mediana(g.ms.map(m => m.pib)))}</td>
                <td>
                  {contarPref(g.ms)
                    .slice(0, 3)
                    .map(([p, n], i) => (
                      <span key={p}>
                        {i > 0 && " "}
                        <Chip cor={corPartido(p)}>
                          {p} {n}
                        </Chip>
                      </span>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="texto-nota">
        Perfil = atividade com maior valor adicionado no PIB da cidade (IBGE, 2021, o último ano publicado com essa
        informação).
      </p>
    </VerMais>
  );
}

function Isentos({ xs }: { xs: Municipio[] }) {
  const ys = xs.filter(m => m.aptos && m.isentos != null).sort((a, b) => a.aptos - b.aptos);
  const q: Municipio[][] = [[], [], [], [], []];
  ys.forEach((m, i) => q[Math.min(4, Math.floor((5 * i) / ys.length))].push(m));
  const rho = spearman(
    ys.map(m => m.aptos),
    ys.map(m => m.isentos),
  );
  const meds = q.map(g => mediana(g.map(m => m.isentos))!),
    mx = Math.max(...meds) * 1.15;
  return (
    <VerMais titulo="Isentos (abstenção + brancos + nulos) andam com o tamanho da cidade">
      <p className={resposta}>
        Quanto maior a cidade, mais gente não escolhe ninguém (correlação de postos {fmt(rho, 2)} entre o número de
        eleitores e a taxa de isentos). Nas cidades menores a mediana é {fmt(meds[0])}%; nas maiores, {fmt(meds[4])}%.
      </p>
      <Barras>
        {q.map((g, i) => (
          <Barra
            key={i}
            rotulo={
              <>
                {i === 0 ? "Menores" : i === 4 ? "Maiores" : `${i + 1}º quinto`}{" "}
                <small>
                  ({int(g[0].aptos)} a {int(g[g.length - 1].aptos)} eleitores)
                </small>
              </>
            }
            pct={(100 * meds[i]) / mx}
            cor="var(--color-verde-esc)"
            valor={`${fmt(meds[i])}%`}
          />
        ))}
      </Barras>
    </VerMais>
  );
}

function Excesso({ xs, onde }: { xs: Municipio[]; onde: string }) {
  const com = xs.filter(m => m.eleitHab != null);
  const ex = com.filter(m => m.eleitHab! > 1).sort((a, b) => b.eleitHab! - a.eleitHab!);
  const porUf: Record<string, number> = {};
  ex.forEach(m => {
    porUf[m.uf] = (porUf[m.uf] || 0) + 1;
  });
  return (
    <VerMais titulo="Cidades com mais eleitores que habitantes">
      <p className={resposta}>
        {maiusculaInicial(onde)}, <b>{int(ex.length)}</b> das {int(com.length)} cidades (
        {fmt(pc(ex.length, com.length), 0)}%) têm mais eleitores aptos que habitantes estimados
        {ex.length > 0 &&
          `, ${ex.every(m => (m.pop ?? 0) < 20000) ? "todas" : "quase todas"} com menos de 20 mil habitantes (${Object.entries(
            porUf,
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([u, n]) => `${u} ${n}`)
            .join(", ")}${Object.keys(porUf).length > 6 ? "…" : ""})`}
        .
      </p>
      {ex.length > 0 && (
        <>
          <div className="rolagem-x">
            <table>
              <thead>
                <tr>
                  <th>Cidade</th>
                  <th>Eleitores aptos</th>
                  <th>Habitantes estimados</th>
                  <th>Eleitores por habitante</th>
                </tr>
              </thead>
              <tbody>
                {ex.slice(0, 15).map(m => (
                  <tr key={m.cod}>
                    <td>
                      <b>{m.nome}</b> <small>({m.uf})</small>
                    </td>
                    <td>{int(m.aptos)}</td>
                    <td>{int(m.pop ?? 0)}</td>
                    <td>{fmt(m.eleitHab, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ex.length > 15 && <p className="texto-nota">Mostrando 15 de {ex.length}.</p>}
        </>
      )}
      <p className="texto-nota">
        Eleitores aptos do TSE (2024) ÷ população estimada pelo IBGE (2024). Não é erro da estimativa: no país, 840 das
        845 cidades nessa situação têm mais eleitores até que a população <b>contada</b> no Censo 2022 (SIDRA 4709). É o
        cadastro eleitoral: a lei deixa votar onde a pessoa tem vínculo (trabalho, família, imóvel), mesmo sem morar lá
        (Res. TSE 23.659/2021, art. 23). Nessas cidades, o número mede o vínculo eleitoral, não a participação dos
        moradores.
      </p>
    </VerMais>
  );
}
