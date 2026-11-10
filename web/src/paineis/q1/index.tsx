import { useMemo } from "react";
import {
  Alternador,
  Aneis,
  Anel,
  Barra,
  Barras,
  Caixa,
  Campo,
  Carregando,
  Etiqueta,
  Linha,
  Pagina,
  SeletorUf,
  VerMais,
} from "../../componentes";
import { useDados } from "../../lib/dados";
import { brl, fmt, int, maiusculaInicial, nomeLugar } from "../../lib/formato";
import { noEstado, UF_NOME } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import {
  anoAoTrocarCargo,
  anosDoCargo,
  CARGO_NOME,
  CARGO_ROT,
  curto,
  custoUe,
  em2024,
  filtrar,
  maisCaras,
  municipal,
  somar,
} from "./calculo";
import type { DadosQ1, Filtros, UeQ1 } from "./tipos";

const PADRAO: Filtros = { uf: "TODAS", cargo: 3, ano: 2022 };

export default function Painel() {
  const { dados } = useDados<DadosQ1>("q1.json");
  return dados ? <Conteudo D={dados} /> : <Carregando />;
}

function Conteudo({ D }: { D: DadosQ1 }) {
  const [salvo, setF] = usePersistente<Filtros>("q1-tse", PADRAO);
  // ano salvo que não existe para o cargo cai na eleição mais recente dele
  const f = anosDoCargo(salvo.cargo).includes(salvo.ano) ? salvo : { ...salvo, ano: anosDoCargo(salvo.cargo)[1] };
  const ues = useMemo(() => filtrar(D, f.cargo, f.ano, f.uf), [D, f.cargo, f.ano, f.uf]);
  const s = useMemo(() => somar(ues), [ues]);
  const lugar = noEstado(f.uf);
  const mun = municipal(f.cargo);
  const nome = CARGO_NOME[f.cargo];

  const escolher = (cargo: number, ano: number) => {
    setF(x => ({ ...x, cargo, ano }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Pagina
      filtros={
        <>
          <Campo rotulo="Estado">
            <SeletorUf value={f.uf} onChange={e => setF(x => ({ ...x, uf: e.target.value }))} />
          </Campo>
          <Campo rotulo="Cargo" grupo>
            <Alternador
              rotulo="Cargo"
              opcoes={CARGO_ROT.map((r, i) => [i, r] as const)}
              valor={f.cargo}
              aoMudar={c => setF(x => ({ ...x, cargo: c, ano: anoAoTrocarCargo(f.cargo, f.ano, c) }))}
            />
          </Campo>
          <Campo rotulo="Eleição" grupo>
            <Alternador
              rotulo="Eleição"
              opcoes={anosDoCargo(f.cargo).map(a => [a, String(a)] as const)}
              valor={f.ano}
              aoMudar={a => setF(x => ({ ...x, ano: a }))}
            />
          </Campo>
        </>
      }
    >
      <Etiqueta>PERGUNTA 1 · CUSTO DA CAMPANHA</Etiqueta>
      <h1>Quanto custa uma cadeira?</h1>
      <p className="texto-enunciado">
        Enunciado: quanto custa uma cadeira, somando as despesas de campanha e dividindo pelas vagas em disputa? [2018,
        2020, 2022, 2024]
      </p>

      <div className="grade-duas">
        <Caixa>
          <h2>A resposta</h2>
          <p className="texto-simples">
            {!s.vagas ? (
              "Sem dados neste filtro."
            ) : (
              <>
                {maiusculaInicial(lugar)}, uma cadeira de {nome} custou <b>{brl(s.custo)}</b> em {f.ano}: é o gasto de
                todos os candidatos dividido pelas vagas
                {f.ano < 2024 ? <> ({brl(em2024(D, f.ano, s.custo))} em reais de 2024)</> : null}. Quem ganhou gastou
                bem menos, <b>{brl(s.custoEleito)}</b> em média; o resto foi gasto por quem perdeu.
                {s.pcPublico != null && (
                  <>
                    {" "}
                    O dinheiro público (Fundo Eleitoral e Fundo Partidário) pagaria <b>{fmt(s.pcPublico, 0)}%</b> do
                    gasto.
                  </>
                )}
              </>
            )}
          </p>
          <div>
            <Linha rotulo="Vagas" valor={int(s.vagas)} />
            <Linha rotulo="Candidatos" valor={int(s.candidatos)} />
            <Linha rotulo="Gasto de todos os candidatos" valor={brl(s.despesa)} />
            <Linha rotulo="Gasto por eleito" valor={brl(s.custoEleito)} />
            {mun && s.ues > 1 && (
              <Linha rotulo={`Custo típico entre as ${int(s.ues)} cidades (mediana)`} valor={brl(s.mediana)} />
            )}
          </div>
        </Caixa>
        <div className="grid min-w-0 gap-3.5">
          <Aneis>
            <Anel pct={s.pcPublico} legenda="do gasto" nome="dinheiro público" />
            <Anel pct={s.pcEleitos} legenda="do gasto foi de quem" nome="se elegeu" variante="verde" />
          </Aneis>
          <PorEstado D={D} f={f} />
        </div>
      </div>

      {mun && <MaisCaras ues={ues} ufs={D.ufs} f={f} />}
      <Todas D={D} f={f} escolher={escolher} />

      <VerMais titulo="Como calculamos e o que os dados não dizem">
        <ul>
          <li>
            <b>Custo da cadeira:</b> despesa de campanha de todos os candidatos do cargo ÷ vagas. Para governador,
            senador e deputados a disputa é no estado; para prefeito e vereador, no município. Somando estados ou
            cidades, é o gasto total ÷ todas as vagas. Presidente fica fora.
          </li>
          <li>
            <b>Gasto por eleito:</b> despesa dos eleitos ÷ eleitos, o quanto gastou quem ganhou.
          </li>
          <li>
            <b>Despesa contratada, não receita:</b> é o que a campanha comprou. A receita tem erros de digitação grandes
            (vereadores de um município do AM em 2020 com R$ 207 milhões de receita cada).
          </li>
          <li>
            <b>Sem dupla contagem:</b> as doações a outros candidatos e partidos saem da conta de quem doou, porque
            entram na despesa de quem recebeu. Vice e suplentes contam junto com o titular.
          </li>
          <li>
            <b>Dinheiro público:</b> Fundo Especial de Financiamento de Campanha (FEFC) + Fundo Partidário, contado em
            quem gastou: o fundo que o candidato a prefeito repassa aos vereadores conta uma vez, nos vereadores. Em
            cidades pequenas o fundo recebido pode passar da despesa declarada.
          </li>
          <li>
            <b>Reais de 2024:</b> corrigidos pelo IPCA de agosto (IBGE, SIDRA 1737), para comparar eleições.
          </li>
          <li>
            <b>O que não dá para dizer:</b> é só o que foi declarado ao TSE; caixa 2 não aparece. 31% das candidaturas
            não declararam despesa nenhuma, quase todas de vereador.
          </li>
          <li>
            <b>Consulta no banco:</b> views <i>q1_custo_ue</i> e <i>q1_custo_cargo</i> em{" "}
            <i>sql/22_q1_custo_cadeira.sql</i>; tabelas de despesa, receita e VAGA. Análise:{" "}
            <i>docs/q1-custo-cadeira.md</i>.
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}

/** Custo da cadeira em cada estado, para o cargo e o ano do filtro. */
function PorEstado({ D, f }: { D: DadosQ1; f: Filtros }) {
  const linhas = D.ufs
    .map(uf => ({ uf, s: somar(filtrar(D, f.cargo, f.ano, uf)) }))
    .filter(x => x.s.custo != null)
    .sort((a, b) => b.s.custo! - a.s.custo!);
  const mx = Math.max(...linhas.map(x => x.s.custo!), 1);
  const geral = somar(filtrar(D, f.cargo, f.ano, "TODAS")).custo;
  return (
    <Caixa>
      <h2>
        {CARGO_ROT[f.cargo]}, {f.ano}: quanto custou a cadeira em cada estado?
      </h2>
      <Barras>
        {linhas.map(({ uf, s }) => (
          <Barra
            key={uf}
            rotulo={UF_NOME[uf]}
            titulo={`${brl(s.despesa)} de gasto ÷ ${int(s.vagas)} vagas`}
            pct={(100 * s.custo!) / mx}
            valor={curto(s.custo!)}
            cor={f.uf === uf ? "var(--color-verde-esc)" : "var(--color-ouro)"}
            media={geral != null ? (100 * geral) / mx : undefined}
          />
        ))}
      </Barras>
      <p className="texto-nota">
        Em reais de {f.ano}. A linha tracejada é o custo nos 6 estados juntos ({brl(geral)}).
        {municipal(f.cargo)
          ? " As capitais puxam o valor do estado para cima: a cidade típica gasta bem menos."
          : " Estado com mais vagas tende a ter a cadeira mais barata."}
      </p>
    </Caixa>
  );
}

/** As 10 cidades com a cadeira mais cara (cargos municipais). */
function MaisCaras({ ues, ufs, f }: { ues: UeQ1[]; ufs: string[]; f: Filtros }) {
  const top = maisCaras(ues, 10);
  if (!top.length) return null;
  const mx = custoUe(top[0]);
  return (
    <Caixa>
      <h2>
        Onde a cadeira de {CARGO_NOME[f.cargo]} foi mais cara em {f.ano}?
      </h2>
      <Barras>
        {top.map(u => (
          <Barra
            key={u[3]}
            rotulo={
              <a href={`#municipios/${u[3]}`} className="underline decoration-ouro underline-offset-2">
                {nomeLugar(u[4])} ({ufs[u[2]]})
              </a>
            }
            titulo={`${brl(u[8])} de gasto ÷ ${int(u[5])} vagas`}
            pct={(100 * custoUe(u)) / mx}
            valor={curto(custoUe(u))}
          />
        ))}
      </Barras>
      <p className="texto-nota">
        Em reais de {f.ano}, {noEstado(f.uf)}. Clique no nome para ver tudo sobre a cidade.
      </p>
    </Caixa>
  );
}

/** Todos os cargos e eleições em reais de 2024; clicar numa linha escolhe o cargo e o ano. */
function Todas({ D, f, escolher }: { D: DadosQ1; f: Filtros; escolher: (cargo: number, ano: number) => void }) {
  const linhas = CARGO_ROT.flatMap((_, c) => anosDoCargo(c).map(a => [c, a] as const)).reverse();
  return (
    <VerMais titulo="Em todos os cargos e eleições" aberto>
      <p className="texto-simples !text-[15.5px]">
        {maiusculaInicial(noEstado(f.uf))}, em reais de 2024 para comparar as eleições:
      </p>
      <div className="rolagem-x">
        <table>
          <thead>
            <tr>
              <th>Cargo</th>
              <th>Vagas</th>
              <th>Gasto total</th>
              <th>Custo da cadeira</th>
              <th>Gasto por eleito</th>
              <th>Dinheiro público</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(([c, a]) => {
              const s = somar(filtrar(D, c, a, f.uf)),
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
                  <td>{int(s.vagas)}</td>
                  <td>{brl(em2024(D, a, s.despesa))}</td>
                  <td>
                    <b>{brl(em2024(D, a, s.custo))}</b>
                  </td>
                  <td>{brl(em2024(D, a, s.custoEleito))}</td>
                  <td>{s.pcPublico == null ? "–" : `${fmt(s.pcPublico, 0)}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="texto-nota">Clique numa linha para ver o cargo e a eleição em detalhe.</p>
    </VerMais>
  );
}
