import { useMemo, useState } from "react";
import {
  Alternador,
  Aneis,
  Anel,
  Barra,
  Barras,
  Botao,
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
import { fmt, int, maiusculaInicial, nomeLugar, nomeProprio } from "../../lib/formato";
import { noEstado } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import {
  anoAoTrocarCargo,
  anosDoCargo,
  CARGO_NOME,
  CARGO_PLURAL,
  CARGO_ROT,
  chaveSoma,
  filtrarPartidos,
  porPartido,
  somar,
  somasPorFiltro,
  trocas,
} from "./calculo";
import type { AfetadoQ5, DadosQ5, Filtros, Soma } from "./tipos";

const PADRAO: Filtros = { uf: "TODAS", cargo: 0, ano: 2024 };
const VAZIA = somar([]);
const PRIMEIRAS = 12;

export default function Painel() {
  const { dados } = useDados<DadosQ5>("q5.json");
  return dados ? <Conteudo D={dados} /> : <Carregando />;
}

function Conteudo({ D }: { D: DadosQ5 }) {
  const [salvo, setF] = usePersistente<Filtros>("q5-tse", PADRAO);
  // ano ou UF salvos que não existem (dado antigo no localStorage) voltam ao padrão: UF desconhecida vira "TODAS"
  const f: Filtros = {
    ...salvo,
    uf: salvo.uf === "TODAS" || D.ufs.includes(salvo.uf) ? salvo.uf : "TODAS",
    ano: anosDoCargo(salvo.cargo).includes(salvo.ano) ? salvo.ano : anosDoCargo(salvo.cargo)[1],
  };
  const somas = useMemo(() => somasPorFiltro(D), [D]);
  const ps = useMemo(() => filtrarPartidos(D, f.cargo, f.ano, f.uf), [D, f.cargo, f.ano, f.uf]);
  const s = useMemo(() => somar(ps), [ps]);
  const lugar = maiusculaInicial(noEstado(f.uf));

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
      <Etiqueta>PERGUNTA 5 · VOTO DE LEGENDA</Etiqueta>
      <h1>Quantos se elegem graças ao voto no partido?</h1>
      <p className="texto-enunciado">
        Enunciado: quantos candidatos se elegem por causa dos votos de legenda, e de quais partidos? [2018, 2020, 2022,
        2024]
      </p>

      <Caixa>
        <h2>O que é o voto de legenda?</h2>
        <p className="texto-simples !text-[15.5px]">
          Na eleição para vereador e deputado, dá para votar só no número do partido (os dois primeiros dígitos). Esse
          voto não vai para ninguém em particular: ele entra na conta do partido para decidir <b>quantas cadeiras</b> o
          partido ganha. Quem ocupa as cadeiras são os candidatos mais votados dele.
        </p>
      </Caixa>

      <div className="grade-duas">
        <Caixa>
          <h2>A resposta</h2>
          <p className="texto-simples">
            {!s.eleitos ? (
              "Sem dados neste filtro."
            ) : (
              <>
                {s.pcEleitos != null && s.pcEleitos < 5 ? "Poucos." : "Uma parte."} {lugar}, em {f.ano},{" "}
                <b>
                  {int(s.eleitosLegenda)} dos {int(s.eleitos)}
                </b>{" "}
                {CARGO_PLURAL[f.cargo]} eleitos ({fmt(s.pcEleitos)}%) só ganharam a cadeira por causa dos votos de
                legenda: sem eles, o partido teria uma cadeira a menos e a vaga iria para outro partido.{" "}
                <b>{fmt(s.pcVotos)}%</b> dos votos foram dados só ao número do partido.
              </>
            )}
          </p>
          <div>
            <Linha rotulo={`${maiusculaInicial(CARGO_PLURAL[f.cargo])} eleitos`} valor={int(s.eleitos)} />
            <Linha rotulo="Eleitos pela legenda" valor={int(s.eleitosLegenda)} />
            <Linha rotulo="Votos de legenda" valor={`${int(s.legenda)} (${fmt(s.pcVotos)}%)`} />
          </div>
        </Caixa>
        <div className="grid min-w-0 gap-3.5">
          <Aneis>
            <Anel pct={s.pcVotos} legenda="dos votos foram" nome="só no partido" />
            <Anel pct={s.pcEleitos} legenda="dos eleitos entraram" nome="pela legenda" variante="verde" />
          </Aneis>
          <PorPartido ps={ps} f={f} />
        </div>
      </div>

      <Trocas key={`${f.cargo}|${f.ano}|${f.uf}`} D={D} f={f} />
      <Todas f={f} somas={somas} escolher={escolher} />

      <VerMais titulo="Como calculamos e o que os dados não dizem">
        <ul>
          <li>
            <b>A conta:</b> refizemos a distribuição das cadeiras duas vezes, com as regras do Código Eleitoral (arts.
            106 a 111): com os votos de legenda, como o TSE fez, e sem eles. A cadeira que um partido (ou coligação, ou
            federação) tem na primeira conta e não tem na segunda foi ganha pela legenda; quem a ocupa é o eleito menos
            votado da lista.
          </li>
          <li>
            <b>A conta com legenda reproduz o TSE:</b> elege exatamente os 26.043 eleitos oficiais dos 6 estados. Isso
            confere o método antes de tirar a legenda.
          </li>
          <li>
            <b>Regras de cada ano:</b> quociente eleitoral, quociente partidário, sobras e a fase 3, com as regras de
            2018–2020 (Lei 13.488/2017) e as de 2022–2024 (Lei 14.211/2021: só disputa as sobras a lista com 80% do
            quociente e o candidato com 20%). Coligação para vereador e deputado só existe em 2018; federação, em 2022 e
            2024.
          </li>
          <li>
            <b>Partido do eleito:</b> numa coligação ou federação, a cadeira pode ter vindo da legenda do parceiro. O
            eleito conta no partido dele.
          </li>
          <li>
            <b>O que não dá para dizer:</b> a conta supõe que quem votou na legenda não votaria em ninguém. Parte desse
            eleitor votaria num candidato do mesmo partido, então o número é o teto do efeito. Em 2024, 17 câmaras
            ficaram sem resultado publicado pelo TSE.
          </li>
          <li>
            <b>Consulta no banco:</b> views <i>q5_partido</i> e <i>q5_eleito_legenda</i> em{" "}
            <i>sql/23_q5_voto_legenda.sql</i>; tabela VOTACAO_LEGENDA_MUNICIPIO. Análise: <i>docs/q5-voto-legenda.md</i>
            .
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}

/** Eleitos pela legenda por partido no filtro (os 10 maiores). */
function PorPartido({ ps, f }: { ps: ReturnType<typeof filtrarPartidos>; f: Filtros }) {
  const linhas = porPartido(ps).slice(0, 10);
  return (
    <Caixa>
      <h2>Quais partidos mais elegeram pela legenda?</h2>
      {!linhas.length ? (
        <p className="texto-nota">Nenhum {CARGO_NOME[f.cargo]} foi eleito pela legenda neste filtro.</p>
      ) : (
        <Barras>
          {linhas.map(x => (
            <Barra
              key={x.partido}
              rotulo={x.partido}
              titulo={`${x.legenda} de ${x.eleitos} eleitos do partido`}
              pct={(100 * x.legenda) / linhas[0].legenda}
              valor={int(x.legenda)}
            />
          ))}
        </Barras>
      )}
      <p className="texto-nota">
        {CARGO_ROT[f.cargo]}, {f.ano}, {noEstado(f.uf)}. Número de eleitos de cada partido que só entraram pela legenda.
      </p>
    </Caixa>
  );
}

const pessoa = (a: AfetadoQ5) => (
  <span key={a[4]} className="block">
    <b>{nomeProprio(a[4])}</b> ({a[5]}
    {a[6] !== a[5] ? `, lista ${a[6]}` : ""}) · {int(a[8])} votos
  </span>
);

/** Quem entrou pela legenda e quem ficaria com a vaga sem ela, por cidade ou estado. */
function Trocas({ D, f }: { D: DadosQ5; f: Filtros }) {
  const t = useMemo(() => trocas(D, f.cargo, f.ano, f.uf), [D, f.cargo, f.ano, f.uf]);
  const [todas, setTodas] = useState(false);
  if (!t.length) return null;
  const vistas = todas ? t : t.slice(0, PRIMEIRAS);
  return (
    <Caixa>
      <h2>Quem entrou pela legenda, e quem ficaria com a vaga sem ela?</h2>
      <div className="rolagem-x">
        <table className="[&_:is(th,td)]:text-left">
          <thead>
            <tr>
              <th>{f.cargo === 0 ? "Cidade" : "Estado"}</th>
              <th>Entrou pela legenda</th>
              <th>Sem a legenda, a vaga iria para</th>
            </tr>
          </thead>
          <tbody>
            {vistas.map(x => (
              <tr key={`${x.uf}|${x.ue}`}>
                <td>{f.cargo === 0 ? `${nomeLugar(x.ue)} (${D.ufs[x.uf]})` : D.ufs[x.uf]}</td>
                <td>{x.entraram.map(pessoa)}</td>
                <td>{x.ficaramFora.length ? x.ficaramFora.map(pessoa) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {t.length > PRIMEIRAS && (
        <Botao className="justify-self-start" onClick={() => setTodas(v => !v)}>
          {todas ? "Mostrar menos" : `Mostrar todas as ${int(t.length)} cidades`}
        </Botao>
      )}
      <p className="texto-nota">
        Quem entrou pela legenda é o eleito menos votado da lista que ganhou a cadeira por causa dela. "Iria para" é o
        candidato de outra lista que levaria essa cadeira na conta sem os votos de legenda. "Lista" é a coligação ou a
        federação, quando o partido não concorreu sozinho.
      </p>
    </Caixa>
  );
}

/** Todos os cargos e eleições; clicar numa linha escolhe o cargo e o ano. */
function Todas({
  f,
  somas,
  escolher,
}: {
  f: Filtros;
  somas: Map<string, Soma>;
  escolher: (cargo: number, ano: number) => void;
}) {
  const linhas = CARGO_ROT.flatMap((_, c) => anosDoCargo(c).map(a => [c, a] as const)).sort((x, y) => x[1] - y[1]);
  return (
    <VerMais titulo="Em todos os cargos e eleições" aberto>
      <p className="texto-simples !text-[15.5px]">
        {maiusculaInicial(noEstado(f.uf))}, o peso do voto de legenda e os eleitos por ele em cada eleição:
      </p>
      <div className="rolagem-x">
        <table>
          <thead>
            <tr>
              <th>Cargo</th>
              <th>Eleitos</th>
              <th>Pela legenda</th>
              <th>Votos de legenda</th>
              <th>% dos votos</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(([c, a]) => {
              const s = somas.get(chaveSoma(c, a, f.uf)) ?? VAZIA,
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
                  <td>{int(s.eleitos)}</td>
                  <td>
                    <b>{int(s.eleitosLegenda)}</b> ({fmt(s.pcEleitos)}%)
                  </td>
                  <td>{int(s.legenda)}</td>
                  <td>{fmt(s.pcVotos)}%</td>
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
