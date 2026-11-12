import { useMemo, useState } from "react";
import { Alternador, Botao, Caixa, Campo, Carregando, Etiqueta, Pagina, SeletorUf, VerMais } from "../../componentes";
import { useDados } from "../../lib/dados";
import { fmt, int, maiusculaInicial, nomeLugar, nomeProprio } from "../../lib/formato";
import { noLugar } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import { Album } from "./Album";
import {
  anoAoTrocarCargo,
  anosDoCargo,
  CARGO_PLURAL,
  CARGO_ROT,
  filtrarPartidos,
  resumoPartidos,
  somar,
  trocas,
} from "./calculo";
import type { AfetadoQ5, DadosQ5, Filtros } from "./tipos";

const PADRAO: Filtros = { uf: "TODAS", cargo: 0, ano: 2024 };
const PRIMEIRAS = 10; // as primeiras linhas; a lista inteira abre no botão

export default function Painel() {
  const { dados } = useDados<DadosQ5>("q5.json");
  return dados ? <Conteudo D={dados} /> : <Carregando />;
}

function Conteudo({ D }: { D: DadosQ5 }) {
  const [salvo, setF] = usePersistente<Filtros>("q5-brasil", PADRAO);
  const f = anosDoCargo(salvo.cargo).includes(salvo.ano) ? salvo : { ...salvo, ano: anosDoCargo(salvo.cargo)[1] };
  const ps = useMemo(() => filtrarPartidos(D, f.cargo, f.ano, f.uf), [D, f.cargo, f.ano, f.uf]);
  const s = useMemo(() => somar(ps), [ps]);
  const partidos = useMemo(() => resumoPartidos(ps), [ps]);
  const lugar = maiusculaInicial(noLugar(f.uf));

  const escolher = (cargo: number, ano: number) => {
    setF(x => ({ ...x, cargo, ano }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      <Etiqueta>PERGUNTA 5 · VOTO DE LEGENDA</Etiqueta>
      <h1>Quantos se elegem graças ao voto no partido?</h1>

      <Caixa>
        <p className="texto-simples m-0 !text-[16px]">
          <b>O que é o voto de legenda?</b> Para vereador e deputado, dá para votar só no número do partido. Esse voto
          não vai para um candidato: ele ajuda a decidir <b>quantas cadeiras</b> o partido ganha.{" "}
          {s.eleitos > 0 && (
            <>
              {lugar}, em {f.ano},{" "}
              <b>
                {int(s.eleitosLegenda)} dos {int(s.eleitos)}
              </b>{" "}
              {CARGO_PLURAL[f.cargo]} eleitos ({fmt(s.pcEleitos)}%) só ganharam a cadeira por causa desses votos, que
              foram {fmt(s.pcVotos)}% do total.
            </>
          )}
        </p>
      </Caixa>

      <Album key={`${f.cargo}|${f.ano}|${f.uf}`} D={D} f={f} partidos={partidos} />

      <Trocas D={D} f={f} />
      <Todas D={D} f={f} escolher={escolher} />

      <VerMais titulo="De onde vêm os dados e como calculamos">
        <ul>
          <li>
            <b>Fonte:</b> TSE, dados abertos: votos por candidato e por partido (legenda), vagas e resultado das
            eleições de 2018 a 2024.
          </li>
          <li>
            <b>A conta:</b> refizemos a distribuição das cadeiras duas vezes, com as regras do Código Eleitoral (arts.
            106 a 111): com os votos de legenda, como o TSE fez, e sem eles. A cadeira que um partido (ou coligação, ou
            federação) tem na primeira conta e não tem na segunda foi ganha pela legenda; quem a ocupa é o eleito menos
            votado da lista.
          </li>
          <li>
            <b>A conta com legenda reproduz o TSE</b> em 99,9% dos casos: no país, 87 dos 119 mil eleitos diferem do
            resultado oficial, 85 deles em 2024, onde há câmaras que o TSE recontou depois. Isso confere o método antes
            de tirar a legenda.
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
            eleitor votaria num candidato do mesmo partido, então o número é o teto do efeito. Algumas câmaras de 2024
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
    <VerMais titulo="Quem entrou pela legenda, e quem ficaria com a vaga sem ela">
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
          {todas ? "Mostrar menos" : `Mostrar todas as ${int(t.length)} ${f.cargo === 0 ? "cidades" : "listas"}`}
        </Botao>
      )}
      <p className="texto-nota">
        Quem entrou pela legenda é o eleito menos votado da lista que ganhou a cadeira por causa dela. "Iria para" é o
        candidato de outra lista que levaria essa cadeira na conta sem os votos de legenda. "Lista" é a coligação ou a
        federação, quando o partido não concorreu sozinho.
      </p>
    </VerMais>
  );
}

/** Todos os cargos e eleições; clicar numa linha escolhe o cargo e o ano. */
function Todas({ D, f, escolher }: { D: DadosQ5; f: Filtros; escolher: (cargo: number, ano: number) => void }) {
  const linhas = CARGO_ROT.flatMap((_, c) => anosDoCargo(c).map(a => [c, a] as const)).sort((x, y) => x[1] - y[1]);
  return (
    <VerMais titulo="Em todos os cargos e eleições">
      <p className="texto-simples !text-[15.5px]">
        {maiusculaInicial(noLugar(f.uf))}, o peso do voto de legenda e os eleitos por ele em cada eleição:
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
              const s = somar(filtrarPartidos(D, c, a, f.uf)),
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
