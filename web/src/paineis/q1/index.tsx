import { useMemo } from "react";
import {
  Alternador,
  Barra,
  Barras,
  Caixa,
  Campo,
  Carregando,
  Contador,
  Etiqueta,
  MapaBrasil,
  Pagina,
  SeletorUf,
  VerMais,
} from "../../componentes";
import { useDados } from "../../lib/dados";
import { brl, fmt, int, maiusculaInicial, nomeLugar } from "../../lib/formato";
import { noLugar, UF_NOME } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import {
  anoAoTrocarCargo,
  anosDoCargo,
  CARGO_NOME,
  CARGO_ROT,
  classes,
  curto,
  custoUe,
  em2024,
  filtrar,
  maisCaras,
  municipal,
  RAMPA_CUSTO,
  somar,
} from "./calculo";
import type { DadosQ1, Filtros, Soma, UeQ1 } from "./tipos";

const PADRAO: Filtros = { uf: "TODAS", cargo: 3, ano: 2022 };

export default function Painel() {
  const { dados } = useDados<DadosQ1>("q1.json");
  return dados ? <Conteudo D={dados} /> : <Carregando />;
}

function Conteudo({ D }: { D: DadosQ1 }) {
  const [salvo, setF] = usePersistente<Filtros>("q1-brasil", PADRAO);
  // ano salvo que não existe para o cargo cai na eleição mais recente dele
  const f = anosDoCargo(salvo.cargo).includes(salvo.ano) ? salvo : { ...salvo, ano: anosDoCargo(salvo.cargo)[1] };
  const ues = useMemo(() => filtrar(D, f.cargo, f.ano, f.uf), [D, f.cargo, f.ano, f.uf]);
  const s = useMemo(() => somar(ues), [ues]);
  // o custo em cada estado, para o mapa e as listas ao lado dele
  const porUf = useMemo(() => {
    const m = new Map<string, Soma>();
    for (const uf of D.ufs) {
      const x = somar(filtrar(D, f.cargo, f.ano, uf));
      if (x.custo != null && x.vagas > 0) m.set(uf, x);
    }
    return m;
  }, [D, f.cargo, f.ano]);
  const mun = municipal(f.cargo);

  const escolher = (cargo: number, ano: number) => {
    setF(x => ({ ...x, cargo, ano }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const escolherUf = (uf: string | null) => setF(x => ({ ...x, uf: uf ?? "TODAS" }));

  return (
    <Pagina
      filtros={
        <>
          <Campo rotulo="Onde">
            <SeletorUf brasil value={f.uf} onChange={e => setF(x => ({ ...x, uf: e.target.value }))} />
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

      <Destaque D={D} f={f} s={s} />
      <NoMapa f={f} porUf={porUf} geral={somar(filtrar(D, f.cargo, f.ano, "TODAS")).custo} aoEscolher={escolherUf} />

      {mun && <MaisCaras ues={ues} ufs={D.ufs} f={f} />}
      <Todas D={D} f={f} escolher={escolher} />

      <VerMais titulo="De onde vêm os dados e como calculamos">
        <ul>
          <li>
            <b>Fonte:</b> prestação de contas das campanhas ao TSE (dados abertos), eleições de 2018, 2020, 2022 e 2024,
            e o número de vagas de cada cargo.
          </li>
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
            quem gastou. Em cidades pequenas o fundo recebido pode passar da despesa declarada.
          </li>
          <li>
            <b>Reais de 2024:</b> corrigidos pelo IPCA de agosto (IBGE, SIDRA 1737), para comparar eleições.
          </li>
          <li>
            <b>O que não dá para dizer:</b> é só o que foi declarado ao TSE; caixa 2 não aparece.
          </li>
          <li>
            <b>Consulta no banco:</b> views <i>q1_custo_ue</i> e <i>q1_custo_cargo</i> em{" "}
            <i>sql/22_q1_custo_cadeira.sql</i>. Análise: Davi, <i>docs/q1-custo-cadeira.md</i>.
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}

/** A imagem da cadeira à esquerda e, à direita, a resposta só do que está selecionado. */
function Destaque({ D, f, s }: { D: DadosQ1; f: Filtros; s: Soma }) {
  const lugar = f.uf === "TODAS" ? "Brasil" : UF_NOME[f.uf];
  const chave = `${f.cargo}|${f.ano}`;
  return (
    <section className="grid overflow-hidden rounded-caixa bg-[#15181c] text-white min-[761px]:grid-cols-[minmax(220px,300px)_minmax(0,1fr)]">
      <div className="relative min-h-[220px] bg-[#8d8d8d] max-[760px]:max-h-[300px]">
        <img
          src={`${import.meta.env.BASE_URL}img/cadeira.webp`}
          alt="Homem de terno, com o rosto coberto por um ponto de interrogação, sentado numa cadeira com notas de 100 reais na mão"
          className="absolute inset-0 size-full object-cover object-[50%_18%]"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#15181c] to-transparent min-[761px]:hidden" />
      </div>
      <div className="grid content-center gap-3.5 px-6 py-6 min-[761px]:px-8">
        <div className="flex flex-wrap gap-2 text-[12.5px] font-bold tracking-[.06em] uppercase">
          <span className="rounded-full bg-ouro px-3 py-1 text-[#15181c]">{lugar}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">{CARGO_NOME[f.cargo]}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">{f.ano}</span>
        </div>
        {!s.vagas || s.custo == null ? (
          <p className="m-0 text-[19px]">Sem prestação de contas para esta escolha.</p>
        ) : (
          <>
            <div>
              <div className="text-[13px] font-bold tracking-[.08em] text-[#c9c3b4] uppercase">Cada cadeira custou</div>
              <div className="text-[clamp(38px,6.4vw,66px)] leading-[1.05] font-extrabold text-ouro tabular-nums">
                <Contador valor={s.custo} formato={brl} chave={chave} />
              </div>
              {f.ano < 2024 && (
                <div className="text-[13px] text-[#c9c3b4]">{brl(em2024(D, f.ano, s.custo))} em reais de 2024</div>
              )}
            </div>
            <p className="m-0 max-w-[60ch] text-[16px] leading-[1.55] text-[#ece8dd]">
              É tudo o que os <b>{int(s.candidatos)}</b> candidatos gastaram na campanha (<b>{brl(s.despesa)}</b>),
              dividido pelas <b>{int(s.vagas)}</b> {s.vagas === 1 ? "vaga" : "vagas"} em disputa.
            </p>
            <div className="grid gap-2.5 min-[561px]:grid-cols-3">
              <Fato valor={brl(s.custoEleito)} rotulo="gastou, em média, quem se elegeu" />
              <Fato
                valor={s.pcPublico == null ? "–" : `R$ ${fmt(Math.min(100, s.pcPublico), 0)}`}
                rotulo="de cada R$ 100 gastos vieram de dinheiro público"
              />
              <Fato
                valor={s.vagas ? fmt(s.candidatos / s.vagas, 1) : "–"}
                rotulo={`candidatos por vaga (${int(s.vagas)} ${s.vagas === 1 ? "vaga" : "vagas"})`}
              />
            </div>
          </>
        )}
        <p className="m-0 text-[12.5px] text-[#a8a294]">
          Fonte: prestação de contas das campanhas ao TSE. Dinheiro público = Fundo Eleitoral e Fundo Partidário.
        </p>
      </div>
    </section>
  );
}

function Fato({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="grid content-start gap-0.5 rounded-xl bg-white/[.08] px-3.5 py-3">
      <b className="text-[22px] leading-tight font-extrabold tabular-nums">{valor}</b>
      <span className="text-[13px] leading-snug text-[#d8d3c6]">{rotulo}</span>
    </div>
  );
}

/** O mapa do Brasil pintado pelo custo da cadeira (verde = mais barata, amarelo = mais cara). */
function NoMapa({
  f,
  porUf,
  geral,
  aoEscolher,
}: {
  f: Filtros;
  porUf: Map<string, Soma>;
  geral: number | null;
  aoEscolher: (uf: string | null) => void;
}) {
  const ordem = [...porUf.entries()].sort((a, b) => b[1].custo! - a[1].custo!);
  const cortes = useMemo(() => classes([...porUf.values()].map(x => x.custo!)), [porUf]);
  const classe = (v: number) => cortes.filter(c => v > c).length;
  const cor = (uf: string) => {
    const x = porUf.get(uf);
    return x ? RAMPA_CUSTO[classe(x.custo!)] : "var(--color-sem-dado)";
  };
  const linha = ([uf, x]: [string, Soma], i: number) => (
    <li key={uf}>
      <button
        type="button"
        onClick={() => aoEscolher(f.uf === uf ? null : uf)}
        aria-pressed={f.uf === uf}
        className="grid w-full cursor-pointer grid-cols-[22px_14px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border-0 bg-transparent px-2 py-1.5 text-left text-[14px] hover:bg-ouro-claro aria-pressed:bg-ouro-claro aria-pressed:font-bold"
      >
        <span className="text-right text-[12px] text-texto-2 tabular-nums">{i + 1}º</span>
        <i className="size-3.5 rounded-[4px]" style={{ background: cor(uf) }} />
        <span className="truncate">{UF_NOME[uf]}</span>
        <b className="tabular-nums">{curto(x.custo!)}</b>
      </button>
    </li>
  );
  return (
    <Caixa>
      <h2>
        Onde a cadeira de {CARGO_NOME[f.cargo]} foi mais cara em {f.ano}?
      </h2>
      {ordem.length === 0 ? (
        <p className="texto-nota">Sem dados para este cargo e eleição.</p>
      ) : (
        <div className="grid items-start gap-5 min-[861px]:grid-cols-[minmax(0,1.35fr)_minmax(250px,1fr)]">
          <div className="grid gap-2.5">
            <MapaBrasil
              corUf={cor}
              uf={f.uf === "TODAS" ? null : f.uf}
              aoEscolherUf={aoEscolher}
              rotulo={`Mapa do Brasil: custo da cadeira de ${CARGO_NOME[f.cargo]} em ${f.ano}, por estado`}
              dicaUf={uf => {
                const x = porUf.get(uf);
                return (
                  <>
                    <b>{UF_NOME[uf]}</b>
                    <br />
                    {x ? (
                      <>
                        {brl(x.custo)} por cadeira
                        <br />
                        {brl(x.despesa)} ÷ {int(x.vagas)} {x.vagas === 1 ? "vaga" : "vagas"}
                      </>
                    ) : (
                      "sem dados"
                    )}
                  </>
                );
              }}
            />
            <div className="grid gap-1 text-[12.5px] text-texto-2">
              <div className="flex overflow-hidden rounded-md">
                {RAMPA_CUSTO.map(c => (
                  <i key={c} className="h-3 flex-1" style={{ background: c }} />
                ))}
              </div>
              <div className="flex justify-between">
                <span>mais barata · {curto(ordem[ordem.length - 1][1].custo!)}</span>
                <span>{curto(ordem[0][1].custo!)} · mais cara</span>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <p className="texto-simples m-0 !text-[15.5px]">
              A cadeira mais cara foi a de <b>{UF_NOME[ordem[0][0]]}</b> ({brl(ordem[0][1].custo)}) e a mais barata, a
              de <b>{UF_NOME[ordem[ordem.length - 1][0]]}</b> ({brl(ordem[ordem.length - 1][1].custo)}).
              {geral != null && <> No Brasil todo, {brl(geral)}.</>}
            </p>
            <ol className="m-0 grid max-h-[430px] list-none gap-px overflow-y-auto p-0">{ordem.map(linha)}</ol>
            <p className="texto-nota m-0">
              Clique num estado, no mapa ou na lista, para ver a resposta dele no alto da página.
              {municipal(f.cargo) ? " Em prefeito e vereador, o valor do estado soma todas as cidades dele." : ""}
            </p>
          </div>
        </div>
      )}
    </Caixa>
  );
}

/** As 10 cidades com a cadeira mais cara (cargos municipais). */
function MaisCaras({ ues, ufs, f }: { ues: UeQ1[]; ufs: string[]; f: Filtros }) {
  const top = maisCaras(ues, 10);
  if (!top.length) return null;
  const mx = custoUe(top[0]);
  return (
    <VerMais titulo={`As 10 cidades com a cadeira de ${CARGO_NOME[f.cargo]} mais cara em ${f.ano}`}>
      <Barras>
        {top.map(u => (
          <Barra
            key={u[3]}
            rotulo={`${nomeLugar(u[4])} (${ufs[u[2]]})`}
            titulo={`${brl(u[8])} de gasto ÷ ${int(u[5])} vagas`}
            pct={(100 * custoUe(u)) / mx}
            valor={curto(custoUe(u))}
          />
        ))}
      </Barras>
      <p className="texto-nota">
        Em reais de {f.ano}, {noLugar(f.uf)}.
      </p>
    </VerMais>
  );
}

/** Todos os cargos e eleições em reais de 2024; clicar numa linha escolhe o cargo e o ano. */
function Todas({ D, f, escolher }: { D: DadosQ1; f: Filtros; escolher: (cargo: number, ano: number) => void }) {
  const linhas = CARGO_ROT.flatMap((_, c) => anosDoCargo(c).map(a => [c, a] as const)).reverse();
  return (
    <VerMais titulo="Em todos os cargos e eleições">
      <p className="texto-simples !text-[15.5px]">
        {maiusculaInicial(noLugar(f.uf))}, em reais de 2024 para comparar as eleições:
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
