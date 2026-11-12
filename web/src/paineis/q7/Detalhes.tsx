import { Chip, VerMais } from "../../componentes";
import { int, maiusculaInicial, pc } from "../../lib/formato";
import { noLugar } from "../../lib/uf";
import type { Ctx, Regiao } from "./tipos";
import { corDif, f2, mudanca, PARES, sinal } from "./util";

/** Bloco "As regiões que mais mudaram": duas tabelas, as 8 mais à direita e as 5 mais à esquerda. */
export function Regioes({ R, f }: Ctx) {
  const [a, b, cargo, aa, ab] = PARES[f.par];
  const rs = R.filter(r => (!f.uf || r.uf === f.uf) && mudanca(r, f.par) != null).sort(
    (x, y) => mudanca(y, f.par)! - mudanca(x, f.par)!,
  );
  const tabela = (itens: Regiao[]) => (
    <table>
      <thead>
        <tr>
          <th>Região imediata</th>
          <th>Cidades</th>
          <th>{aa}</th>
          <th>{ab}</th>
          <th>Mudança</th>
        </tr>
      </thead>
      <tbody>
        {itens.map(r => (
          <tr key={r.cd}>
            <td>
              <b>{r.nome}</b> <small>({r.uf})</small>
            </td>
            <td>{r.n}</td>
            <td>{f2(r.notas[a])}</td>
            <td>{f2(r.notas[b])}</td>
            <td>
              <Chip cor={corDif(mudanca(r, f.par))}>{sinal(mudanca(r, f.par))}</Chip>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <VerMais titulo={`As regiões que mais mudaram ${noLugar(f.uf ?? "TODAS")}`}>
      <p className="texto-nota">
        Regiões geográficas imediatas do IBGE: grupos de cidades em torno de um centro urbano. Votos somados da região.
      </p>
      <div className="rolagem-x">
        <h3>Mais à direita</h3>
        {tabela(rs.slice(0, 8))}
        <h3 className="mt-3">Mais à esquerda</h3>
        {tabela(rs.slice(-5).reverse())}
        <p className="texto-nota">
          {rs.filter(r => mudanca(r, f.par)! > 0).length} de {rs.length} regiões foram à direita ({cargo}, {aa} → {ab}).
        </p>
      </div>
    </VerMais>
  );
}

const PW = 760,
  LH = 30,
  PL = 210,
  PR = 120;

/** Bloco "O que puxou": mudança na fatia de votos das famílias de partidos. */
export function Partidos({ D, f }: Ctx) {
  const [a, b, cargo, aa, ab] = PARES[f.par],
    F = D.familias[f.uf ?? "BR"] ?? {};
  const tot = (i: number) => Object.values(F).reduce((s, v) => s + v[i], 0),
    ta = tot(a),
    tb = tot(b);
  const xs = Object.entries(F)
    .map(([nome, v]) => {
      const pa = pc(v[a], ta),
        pb = pc(v[b], tb);
      return { nome, pa, pb, d: (pb ?? NaN) - (pa ?? NaN) };
    })
    .sort((x, y) => Math.abs(y.d) - Math.abs(x.d))
    .slice(0, 10)
    .sort((x, y) => y.d - x.d);
  const H = xs.length * LH + 30;
  const mx = Math.max(...xs.map(x => Math.abs(x.d)), 1),
    X0 = PL + (PW - PL - PR) / 2,
    K = (PW - PL - PR) / 2 / mx;
  // sem votos numa das duas eleições (o Distrito Federal não elege vereador) não há o que comparar
  if (!ta || !tb)
    return (
      <VerMais titulo="O que puxou: os partidos que mais ganharam e perderam votos">
        <p className="texto-nota">
          Sem votos para {cargo} {noLugar(f.uf ?? "TODAS")} em {aa} e {ab}.
        </p>
      </VerMais>
    );
  return (
    <VerMais titulo="O que puxou: os partidos que mais ganharam e perderam votos">
      <p className="texto-nota">
        Fatia dos votos para {cargo} {noLugar(f.uf ?? "TODAS")}, {aa} → {ab}, em pontos percentuais. Partidos que se
        fundiram ou mudaram de nome aparecem juntos.
      </p>
      <svg
        className="grafico max-w-[760px]"
        viewBox={`0 0 ${PW} ${H}`}
        role="img"
        aria-label="Mudança na fatia de votos de cada partido"
      >
        <line x1={X0} x2={X0} y1={4} y2={H - 20} className="stroke-texto-2" />
        {xs.map((x, i) => {
          const y = 10 + i * LH;
          return (
            <g key={x.nome}>
              <text x={PL - 10} y={y + 10} className="svg-rotulo" textAnchor="end" dominantBaseline="middle">
                {x.nome}
              </text>
              <rect
                x={x.d >= 0 ? X0 : X0 + x.d * K}
                y={y}
                width={Math.max(1, Math.abs(x.d) * K)}
                height={20}
                rx={3}
                className={x.d >= 0 ? "fill-verde-esc" : "fill-ouro"}
              />
              {/* o número fica sempre do lado direito: depois da barra que ganhou, logo depois do zero na que perdeu */}
              <text x={x.d >= 0 ? X0 + x.d * K + 6 : X0 + 6} y={y + 10} className="svg-eixo" dominantBaseline="middle">
                {sinal(x.d, 1)} ({f2(x.pa, 1)}% → {f2(x.pb, 1)}%)
              </text>
            </g>
          );
        })}
        <text x={X0} y={H - 8} className="svg-eixo" textAnchor="middle" dominantBaseline="middle">
          perdeu fatia ◂ ▸ ganhou fatia
        </text>
      </svg>
    </VerMais>
  );
}

/** Bloco "Os prefeitos": a cidade trocou de lado em 2024? */
export function Prefeitos({ D, M, f }: Ctx) {
  const meio = D.regua[2];
  const ms = M.filter(
    m => (!f.uf || m.uf === f.uf) && m.pref[0] && m.pref[2] && m.pref[1] != null && m.pref[3] != null,
  );
  const lado = (v: number | null) => (v! < meio ? "e" : "d");
  const igual = ms.filter(m => m.pref[4]).length,
    troca = ms.filter(m => !m.pref[4]);
  const ed = troca.filter(m => lado(m.pref[1]) === "e" && lado(m.pref[3]) === "d").length;
  const de = troca.filter(m => lado(m.pref[1]) === "d" && lado(m.pref[3]) === "e").length;
  const mesmoLado = ms.length - igual - ed - de;
  const numeros: [string, string][] = [
    [int(igual), "mesmo partido"],
    [int(mesmoLado), "outro partido, mesmo lado"],
    [int(ed), "da esquerda para a direita"],
    [int(de), "da direita para a esquerda"],
  ];
  return (
    <VerMais titulo="Os prefeitos: a cidade trocou de lado em 2024?">
      <p className="texto-simples text-[15.5px]!">
        {maiusculaInicial(noLugar(f.uf ?? "TODAS"))}, em {int(ms.length - igual)} das {int(ms.length)} cidades o partido
        do prefeito mudou de 2020 para 2024. <b>{int(ed)}</b> passaram de um partido à esquerda do meio da régua para um
        à direita; <b>{int(de)}</b>, o contrário.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
        {numeros.map(([v, r]) => (
          <div key={r} className="grid content-start gap-0.5 rounded-xl border-2 border-ouro px-3 py-2.5">
            <b className="text-[22px] leading-[1.15] font-extrabold text-ouro-esc tabular-nums">{v}</b>
            <span className="text-[13px] text-texto-2">{r}</span>
          </div>
        ))}
      </div>
      <p className="texto-nota">
        Lado = posição do partido do prefeito em relação ao meio da régua. Fusão ou renomeação não conta como troca de
        partido (PSL → União, PTB → PRD, PSC → Podemos…; tabela <i>dados/referencia/partido_sucessao.csv</i>, a mesma da
        Pergunta 6).
      </p>
    </VerMais>
  );
}

/** Bloco "Como calculamos". */
export function Metodo() {
  return (
    <VerMais titulo="Como calculamos">
      <ul>
        <li>
          <b>Nota de um lugar:</b> média das notas dos partidos (0 = esquerda, 10 = direita), cada voto pesando a nota
          do partido do candidato votado. 1º turno. Fonte dos votos: TSE.
        </li>
        <li>
          <b>Mesmo cargo para comparar:</b> deputado federal nas eleições gerais (2018 × 2022) e vereador nas municipais
          (2020 × 2024). Os dois são proporcionais: todos os partidos aparecem. Não comparamos deputado com vereador.
        </li>
        <li>
          <b>Notas dos partidos:</b> pesquisa com cientistas políticos, de Bolognesi, Ribeiro e Codato (2023),{" "}
          <i>Dados</i> 66(2), rodada de 2018. Tabela sem alteração em <i>dados/referencia/</i>. As 7 faixas (de extrema
          esquerda a extrema direita) são as do artigo.
        </li>
        <li>
          <b>A mesma régua nos quatro anos:</b> os especialistas reavaliaram os partidos em 2022 (o PL foi de 7,78 para
          8,80). Aqui cada partido fica com a nota de 2018 em todas as eleições, então o que muda de um ano para o outro
          é só o voto. Por isso o PL aparece em 7,78.
        </li>
        <li>
          <b>Fusões:</b> o partido novo recebe a média dos que se fundiram (União = DEM e PSL), a mesma regra dos
          autores; renomeações mantêm a nota (PR → PL, PRB → Republicanos).
        </li>
        <li>
          <b>Lula e Bolsonaro:</b> marcam a nota do PT e do PL, os partidos pelos quais disputaram o 2º turno de 2022.
          Fotos do registro de candidatura no TSE.
        </li>
        <li>
          <b>Região:</b> região geográfica imediata do IBGE (510 no país).
        </li>
        <li>
          <b>Consulta no banco:</b> views <i>q7_vies_municipio</i>, <i>q7_vies_regiao</i>, <i>q7_prefeito</i> e{" "}
          <i>q7_voto_familia</i> em <i>sql/17_q7_vies.sql</i>.
        </li>
      </ul>
    </VerMais>
  );
}
