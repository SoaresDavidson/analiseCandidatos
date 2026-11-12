import type { ReactNode } from "react";
import { Alternador, Campo, Carregando, Etiqueta, Pagina, SeletorUf, VerMais } from "../../componentes";
import { useDados } from "../../lib/dados";
import { brl, fmt, int, maiusculaInicial, pc } from "../../lib/formato";
import { noLugar } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import {
  achar,
  CANAL,
  CARGO,
  CARGO_PLURAL,
  chancePorPatrimonio,
  custoCadeira,
  PROPORCIONAL,
  partesDaPropaganda,
} from "./calculo";
import type { Dados2026, Filtros } from "./tipos";

const PADRAO: Filtros = { uf: "TODAS", cargo: 6 };
const COR_2026 = "var(--color-ouro)",
  COR_2022 = "#b9b6ae";

export default function Painel() {
  const { dados, erro } = useDados<Dados2026>("e2026.json");
  if (!dados) return <Carregando erro={erro} />;
  return <Conteudo D={dados} />;
}

/** O número de 2026 em destaque e o de 2022 ao lado, em duas barras na mesma escala. */
function Par({
  v26,
  v22,
  texto,
  unidade,
}: {
  v26: number | null;
  v22: number | null;
  /** como escrever o valor */
  texto: (v: number) => string;
  /** o que o número mede, em poucas palavras */
  unidade: string;
}) {
  const mx = Math.max(v26 ?? 0, v22 ?? 0) || 1;
  const linha = (ano: number, v: number | null, cor: string, forte?: boolean) => (
    <div className="grid grid-cols-[2.6em_minmax(0,1fr)_auto] items-center gap-2 text-[13.5px]">
      <span className={forte ? "font-extrabold" : "text-texto-2"}>{ano}</span>
      <span className="h-[14px] rounded-[4px] bg-bege">
        <i
          className="block h-full rounded-[4px] transition-[width] duration-700"
          style={{ width: `${(100 * (v ?? 0)) / mx}%`, background: cor }}
        />
      </span>
      <b className={`tabular-nums ${forte ? "font-extrabold" : "font-bold text-texto-2"}`}>
        {v == null ? "sem dado" : texto(v)}
      </b>
    </div>
  );
  return (
    <div className="grid gap-1.5">
      <div className="leading-tight">
        <b className="block text-[clamp(28px,3vw,38px)] leading-none font-extrabold text-verde-esc tabular-nums">
          {v26 == null ? "–" : texto(v26)}
        </b>
        <span className="text-[13px] text-texto-2">{unidade}</span>
      </div>
      {linha(2026, v26, COR_2026, true)}
      {linha(2022, v22, COR_2022)}
    </div>
  );
}

/** Um cartão por pergunta do painel: a pergunta, a resposta de 2026 e o atalho para a página dela. */
function Cartao({
  n,
  assunto,
  pergunta,
  aba,
  atalho = "ver até 2024 ›",
  children,
}: {
  n?: number;
  assunto: string;
  pergunta: string;
  aba?: string;
  /** o texto do atalho para a página da pergunta */
  atalho?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid content-start gap-2.5 rounded-caixa bg-branco px-5 py-[18px]">
      <div className="flex items-center justify-between gap-3 text-[12.5px] font-bold text-texto-2">
        <span className="uppercase tracking-[.04em]">
          {n ? `Pergunta ${n} · ` : ""}
          {assunto}
        </span>
        {aba && (
          <a href={`#${aba}`} className="whitespace-nowrap text-verde-esc no-underline hover:underline">
            {atalho}
          </a>
        )}
      </div>
      <h2 className="text-[17px]!">{pergunta}</h2>
      {children}
    </section>
  );
}

const Nota = ({ children }: { children: ReactNode }) => <p className="texto-nota m-0">{children}</p>;

function Conteudo({ D }: { D: Dados2026 }) {
  const [salvo, setF] = usePersistente<Filtros>("e2026", PADRAO);
  const f: Filtros = {
    uf: salvo.uf !== "TODAS" && !D.ufs.includes(salvo.uf) ? "TODAS" : salvo.uf,
    cargo: D.cargos.includes(salvo.cargo) ? salvo.cargo : 6,
  };
  const u = f.uf === "TODAS" ? -1 : D.ufs.indexOf(f.uf);
  const c = f.cargo;
  const onde = noLugar(f.uf);
  const plural = CARGO_PLURAL[c];

  const perfil = (ano: number) => achar(D.perfil, ano, u, c);
  const p26 = perfil(2026),
    p22 = perfil(2022);
  const fundo = (ano: number) => achar(D.fundo, ano, u, c);
  const f26 = fundo(2026),
    f22 = fundo(2022);
  const dependem = (l: typeof f26) => (l ? pc(l[3], l[3] + l[5]) : null);
  const pat26 = chancePorPatrimonio(D.patrimonio, 2026, u, c),
    pat22 = chancePorPatrimonio(D.patrimonio, 2022, u, c);
  const prop26 = partesDaPropaganda(achar(D.propaganda, 2026, u, c)?.[3]),
    prop22 = achar(D.propaganda, 2022, u, c)?.[3];
  const total22 = prop22?.reduce((s, v) => s + v, 0) ?? 0;
  const leg = (ano: number) => achar(D.legenda, ano, u, c);
  const l26 = leg(2026),
    l22 = leg(2022);
  const v26 = achar(D.vies, 2026, u)?.[2] ?? null,
    v22 = achar(D.vies, 2022, u)?.[2] ?? null;
  const re = (ano: number) => achar(D.reeleicao, ano, u, c);
  const r26 = re(2026),
    r22 = re(2022);
  const [dia, mes, ano] = D.coleta.split("-").reverse();

  return (
    <Pagina
      filtros={
        <>
          <Campo rotulo="Onde">
            <SeletorUf brasil value={f.uf} onChange={e => setF(s => ({ ...s, uf: e.target.value }))} />
          </Campo>
          <Campo rotulo="Cargo" grupo>
            <Alternador
              rotulo="Cargo"
              opcoes={[6, 7, 5, 3].map(x => [x, CARGO[x]] as const)}
              valor={c}
              aoMudar={cargo => setF(s => ({ ...s, cargo }))}
            />
          </Campo>
        </>
      }
    >
      <Etiqueta>ELEIÇÕES 2026</Etiqueta>
      <h1>O que a eleição de 2026 já mostra?</h1>
      <p className="texto-enunciado">
        As mesmas contas de cada pergunta do painel, para os {plural} de 2026 {onde}, ao lado de 2022. Dados do TSE
        coletados em {dia}/{mes}/{ano}
        {D.tem.resultado ? "" : "; ainda havia disputa de 2º turno sem resultado"}. A prestação de contas de 2026 ainda
        pode receber retificações.
      </p>

      {!p26 ? (
        <section className="rounded-caixa bg-branco px-5 py-6 text-[17px] font-semibold">
          Sem candidatos a {CARGO[c].toLowerCase()} {onde} em 2026.
        </section>
      ) : (
        <div className="grid gap-[18px] min-[761px]:grid-cols-2 min-[1101px]:grid-cols-3">
          <Cartao n={1} assunto="Custo da campanha" pergunta="Quanto custa uma cadeira?" aba="q1">
            <Par
              v26={custoCadeira(D, 2026, u, c)}
              v22={custoCadeira(D, 2022, u, c)}
              texto={brl}
              unidade="gasto de todos os candidatos ÷ vagas, em reais de 2024"
            />
          </Cartao>

          <Cartao n={8} assunto="Dinheiro público" pergunta="Quantos dependem do fundo público?" aba="q8">
            <Par
              v26={dependem(f26)}
              v22={dependem(f22)}
              texto={v => `${fmt(v, 0)} em 100`}
              unidade="candidatos com metade ou mais da campanha paga pelo fundo"
            />
            {f26 && (
              <Nota>
                Em 2026 se elegeram <b>{fmt(pc(f26[4], f26[3]), 0)}</b> em cada 100 dos que dependem do fundo e{" "}
                <b>{fmt(pc(f26[6], f26[5]), 0)}</b> em cada 100 dos outros.
              </Nota>
            )}
          </Cartao>

          <Cartao n={9} assunto="Propaganda" pergunta="Onde foi o dinheiro da propaganda?" aba="q9">
            {prop26.length ? (
              <div className="grid gap-1.5">
                {prop26.slice(0, 4).map(({ canal, pct }) => (
                  <div
                    key={canal}
                    className="grid grid-cols-[8.6em_minmax(0,1fr)_auto] items-center gap-2 text-[13.5px]"
                  >
                    <span>{CANAL[canal]}</span>
                    <span className="h-[14px] rounded-[4px] bg-bege">
                      <i
                        className="block h-full rounded-[4px] transition-[width] duration-700"
                        style={{ width: `${(100 * pct) / prop26[0].pct}%`, background: COR_2026 }}
                      />
                    </span>
                    <span className="tabular-nums">
                      <b>{fmt(pct, 0)}%</b>{" "}
                      <span className="text-[12.5px] text-texto-2">
                        {total22 && prop22 ? `(2022: ${fmt((100 * prop22[canal]) / total22, 0)}%)` : ""}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Nota>Sem despesa de propaganda declarada em 2026 neste recorte.</Nota>
            )}
          </Cartao>

          <Cartao n={2} assunto="Patrimônio" pergunta="Os mais ricos se elegem mais?" aba="q2">
            <Par
              v26={pat26.ricos.taxa}
              v22={pat22.ricos.taxa}
              texto={v => `${fmt(v, 0)} em 100`}
              unidade="eleitos entre os candidatos do quinto de maior patrimônio"
            />
            {pat26.pobres.taxa != null && (
              <Nota>
                No quinto de menor patrimônio, <b>{fmt(pat26.pobres.taxa, 0)}</b> em cada 100 se elegeram em 2026.
              </Nota>
            )}
          </Cartao>

          <Cartao n={4} assunto="Escolaridade" pergunta="Quantos eleitos têm faculdade?" aba="q4">
            <Par
              v26={pc(p26[6], p26[4])}
              v22={p22 ? pc(p22[6], p22[4]) : null}
              texto={v => `${fmt(v, 0)}%`}
              unidade={`dos ${plural} eleitos têm ensino superior completo`}
            />
            <Nota>
              Entre todos os candidatos de 2026, <b>{fmt(pc(p26[5], p26[3]), 0)}%</b>.
            </Nota>
          </Cartao>

          <Cartao n={6} assunto="Idade" pergunta="Qual a idade média dos eleitos?" aba="q6">
            <Par
              v26={p26[8]}
              v22={p22?.[8] ?? null}
              texto={v => `${fmt(v, 1)} anos`}
              unidade={`idade média dos ${plural} eleitos`}
            />
            {p26[7] != null && (
              <Nota>
                Os candidatos de 2026 tinham <b>{fmt(p26[7], 1)} anos</b> em média.
              </Nota>
            )}
          </Cartao>

          <Cartao n={7} assunto="Viés político" pergunta="Para que lado foi o voto?" aba="q7">
            <Par
              v26={v26}
              v22={v22}
              texto={v => fmt(v, 2)}
              unidade="nota do voto para deputado federal (0 = esquerda, 10 = direita)"
            />
            {v26 != null && v22 != null && (
              <Nota>
                {maiusculaInicial(onde)}, o voto{" "}
                <b>
                  {Math.abs(v26 - v22) < 0.05
                    ? "quase não saiu do lugar"
                    : v26 > v22
                      ? "foi para a direita"
                      : "foi para a esquerda"}
                </b>{" "}
                de 2022 para 2026. Vale para qualquer cargo escolhido: a conta usa sempre o voto para deputado federal.
              </Nota>
            )}
          </Cartao>

          <Cartao n={5} assunto="Voto de legenda" pergunta="Quantos entraram pelo voto no partido?" aba="q5">
            {PROPORCIONAL.has(c) ? (
              <>
                <Par
                  v26={l26 ? l26[4] : null}
                  v22={l22 ? l22[4] : null}
                  texto={v => int(v)}
                  unidade={`${plural} que só se elegeram por causa do voto de legenda`}
                />
                {l26 && l26[3] > 0 && (
                  <Nota>
                    São <b>{fmt(pc(l26[4], l26[3]), 1)}%</b> dos {int(l26[3])} eleitos de 2026;{" "}
                    {fmt(pc(l26[6], l26[5] + l26[6]), 1)}% dos votos foram só no número do partido.
                  </Nota>
                )}
              </>
            ) : (
              <Nota>
                Não se aplica a {CARGO[c].toLowerCase()}: o voto de legenda só existe para deputado e vereador.
              </Nota>
            )}
          </Cartao>

          <Cartao n={10} assunto="Carreira" pergunta="Quem tinha mandato conseguiu se reeleger?" aba="q10">
            <Par
              v26={r26 ? pc(r26[5], r26[3]) : null}
              v22={r22 ? pc(r22[5], r22[3]) : null}
              texto={v => `${fmt(v, 0)} em 100`}
              unidade={`${plural} do mandato anterior que se reelegeram`}
            />
            {r26 && r26[3] > 0 && (
              <Nota>
                Dos {int(r26[3])} eleitos {c === 5 ? "em 2018" : "em 2022"}, <b>{fmt(pc(r26[4], r26[3]), 0)}%</b>{" "}
                tentaram de novo em 2026.
              </Nota>
            )}
          </Cartao>

          <Cartao assunto="Quem são os eleitos" pergunta="Quantas mulheres foram eleitas?">
            <Par
              v26={pc(p26[10], p26[4])}
              v22={p22 ? pc(p22[10], p22[4]) : null}
              texto={v => `${fmt(v, 0)}%`}
              unidade={`dos ${plural} eleitos são mulheres`}
            />
            <Nota>
              Entre os candidatos de 2026, <b>{fmt(pc(p26[9], p26[3]), 0)}%</b> eram mulheres ({int(p26[4])} eleitos de{" "}
              {int(p26[3])} candidatos).
            </Nota>
          </Cartao>

          <Cartao assunto="Presidência" pergunta="E para presidente?" aba="presidentes" atalho="abrir a página ›">
            <p className="texto-simples m-0 text-[15.5px]!">
              A eleição de presidente de 2026, com os dois turnos e o mapa de quem venceu em cada cidade, está na página
              dos presidentes.
            </p>
          </Cartao>
        </div>
      )}

      <VerMais titulo="De onde vêm os dados e como calculamos">
        <ul>
          <li>
            <b>Fonte:</b> TSE, dados abertos da eleição geral de 2026: cadastro de candidaturas, votação por município,
            declaração de bens, vagas e prestação de contas das campanhas, coletados em {dia}/{mes}/{ano}.
          </li>
          <li>
            <b>Por que uma aba à parte:</b> as páginas das perguntas vão até 2024, as eleições com resultado e contas
            finais. A prestação de contas de 2026 ainda pode mudar no TSE, então 2026 fica aqui, ao lado de 2022, a
            eleição geral anterior.
          </li>
          <li>
            <b>Mesmas contas:</b> cada cartão repete a conta da pergunta dele (o método está no fim de cada página).
            Reais de 2024 pelo IPCA de agosto (IBGE). O deputado distrital do DF entra como estadual.
          </li>
          <li>
            <b>Viés:</b> nota dos partidos da pesquisa de Bolognesi, Ribeiro e Codato (2023), rodada de 2018, nos três
            anos; partidos criados depois ficam sem nota e fora da média.
          </li>
          <li>
            <b>Reeleição:</b> dos eleitos no ciclo anterior do cargo (2022; senador, 2018), quantos disputaram o mesmo
            cargo de novo e venceram.
          </li>
          <li>
            <b>Consulta no banco:</b> <i>scripts/gerar_painel_2026.py</i>, sobre as mesmas tabelas e views das
            perguntas.
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}
