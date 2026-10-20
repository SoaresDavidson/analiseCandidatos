import { useMemo, useState } from "react";
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
  Legenda,
  Linha,
  Pagina,
  Seletor,
  VerMais,
} from "../../componentes";
import { useDados } from "../../lib/dados";
import { fmt, int, pc } from "../../lib/formato";
import { usePersistente } from "../../lib/usePersistente";
import {
  ANOS,
  CANAL,
  CARGO,
  cargosDoAno,
  grupoT,
  maiuscula,
  onde,
  PLUR,
  participacoes,
  reais,
  TODOS_CANAIS,
  totalT,
  UF_NOME,
} from "./dominio";
import { Nuvem } from "./Nuvem";
import { DetalhePalavra } from "./Palavra";
import type { DadosQ9, Filtros } from "./tipos";

const ELEITO_OPCOES = [
  [2, "Todos"],
  [1, "Eleitos"],
  [0, "Não eleitos"],
] as const;
const CANAL_OPCOES = [
  [8, "Todos"],
  [0, "Impresso"],
  [1, "Rua"],
  [4, "Internet"],
  [2, "Rádio e TV"],
  [3, "Adesivos"],
] as const;
const FILTROS_PADRAO: Filtros = { ano: 2024, uf: "TODAS", cargo: 0, eleito: 2 };

export default function Painel() {
  const { dados, erro } = useDados<DadosQ9>("q9.json");
  if (!dados) return <Carregando erro={erro} />;
  return <Q9 d={dados} />;
}

function Q9({ d }: { d: DadosQ9 }) {
  const [salvo, setSalvo] = usePersistente<Filtros>("q9-tse", FILTROS_PADRAO);
  const [canal, setCanal] = useState(TODOS_CANAIS);
  const [termo, setTermo] = useState<number | null>(null);

  // o cargo salvo pode não existir no ano escolhido (municipais x gerais)
  const f: Filtros = {
    ...salvo,
    cargo: cargosDoAno(salvo.ano).includes(salvo.cargo) ? salvo.cargo : cargosDoAno(salvo.ano)[0],
  };

  const zerar = () => {
    setTermo(null);
    setCanal(TODOS_CANAIS);
  };
  const mudarAno = (ano: number) => {
    setSalvo({ ...f, ano, cargo: cargosDoAno(ano).includes(f.cargo) ? f.cargo : cargosDoAno(ano)[0] });
    zerar();
  };
  const mudarCargo = (cargo: number) => {
    setSalvo({ ...f, cargo });
    zerar();
  };
  const mudarUf = (uf: string) => {
    setSalvo({ ...f, uf });
    setTermo(null);
  };
  const mudarEleito = (eleito: number) => {
    setSalvo({ ...f, eleito });
    setTermo(null);
  };
  const mudarCanal = (c: number) => {
    setCanal(c);
    setTermo(null);
  };

  const filtros = (
    <>
      <Campo rotulo="Estado">
        <Seletor value={f.uf} onChange={e => mudarUf(e.target.value)}>
          <option value="TODAS">Todos os 6 estados</option>
          {d.ufs.map(u => (
            <option key={u} value={u}>
              {UF_NOME[u]}
            </option>
          ))}
        </Seletor>
      </Campo>
      <Campo rotulo="Eleição" grupo>
        <Alternador rotulo="Eleição" opcoes={ANOS} valor={f.ano} aoMudar={mudarAno} />
      </Campo>
      <Campo rotulo="Cargo" grupo>
        <Alternador
          rotulo="Cargo"
          opcoes={cargosDoAno(f.ano).map(c => [c, CARGO[c]] as const)}
          valor={f.cargo}
          aoMudar={mudarCargo}
        />
      </Campo>
    </>
  );

  return (
    <Pagina filtros={filtros}>
      <Etiqueta>PERGUNTA 9 · PROPAGANDA</Etiqueta>
      <h1>Onde o candidato gasta com propaganda?</h1>
      <p className="texto-enunciado">
        Enunciado: onde o candidato investe em propaganda (nuvem de palavras)? [2018, 2020, 2022, 2024]
      </p>

      <Resposta d={d} f={f} />

      <SecaoNuvem
        d={d}
        f={f}
        canal={canal}
        termo={termo}
        aoEleito={mudarEleito}
        aoCanal={mudarCanal}
        aoTermo={t => setTermo(x => (x === t ? null : t))}
      />

      <VerMais titulo="Comparar eleitos e não eleitos">
        <Comparar d={d} f={f} />
      </VerMais>
      <VerMais titulo="Comparar com a eleição anterior">
        <Tendencia d={d} f={f} />
      </VerMais>

      <VerMais titulo="Como calculamos">
        <ul>
          <li>
            <b>Fonte:</b> TSE, prestação de contas das campanhas (despesas contratadas) e cadastro de candidaturas, 2018
            a 2024.
          </li>
          <li>
            <b>Tipo de gasto:</b> o tipo de despesa que o TSE registra, agrupado em 8 (material impresso, rua, rádio e
            TV, adesivos, internet, jingle, carro de som, jornal e revista).
          </li>
          <li>
            <b>Palavras:</b> a descrição livre que o candidato escreveu, sem acento, no singular, juntando expressões
            como "cabo eleitoral". Ficam de fora palavras que não dizem onde se gastou ("serviço", "campanha").
          </li>
          <li>
            <b>Valor de uma palavra:</b> soma das despesas que a citam. Uma despesa com três palavras entra nas três,
            então esses valores não se somam.
          </li>
          <li>
            <b>Quem entra:</b> eleições ordinárias, sem vices e suplentes. 2026 fica de fora até a prestação final.
          </li>
          <li>
            <b>Cuidado:</b> a nuvem mostra frequência, não dinheiro. "Cabo eleitoral" aparece em muitas despesas
            pequenas; rádio e TV, em poucas e caras.
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}

/** Ordem dos canais do maior para o menor gasto. */
function ordenar(p: (number | null)[]): [number, number][] {
  return p.map((x, k): [number, number] => [k, x || 0]).sort((a, b) => b[1] - a[1]);
}

function Resposta({ d, f }: { d: DadosQ9; f: Filtros }) {
  const { nd, tot, T, p } = participacoes(d, f.uf, [f.ano], [f.cargo]);
  const ordem = ordenar(p);
  const ir = (p[0] || 0) + (p[1] || 0);
  const top = grupoT(d, f, 2, TODOS_CANAIS);
  const mx = Math.max(...p.map(x => x || 0)) * 1.12;

  return (
    <div className="grade-duas">
      <Caixa>
        <h2>A resposta</h2>
        <p className="texto-simples">
          {!T ? (
            "Sem despesas de propaganda neste recorte."
          ) : (
            <>
              Os {PLUR[f.cargo]} de {f.ano} {onde(f.uf)} gastaram <b>{reais(T)}</b> com propaganda. De cada R$ 100,{" "}
              <b>R$ {fmt(p[0], 0)}</b> foram para material impresso e <b>R$ {fmt(p[1], 0)}</b> para campanha de rua. A
              internet ficou com R$ {fmt(p[4], 0)}.
            </>
          )}
        </p>
        <div>
          <Linha rotulo="Gasto total com propaganda" valor={reais(T)} />
          <Linha rotulo="Despesas declaradas" valor={int(nd[0] + nd[1])} />
          <Linha rotulo="Palavra mais escrita" valor={top.length ? `"${top[0].termo}"` : "–"} />
        </div>
      </Caixa>
      <div className="grid min-w-0 gap-3.5">
        <Aneis>
          <Anel pct={ir} legenda="do gasto" nome="Impresso e rua" />
          <Anel pct={p[4]} legenda="do gasto" nome="Internet" variante="verde" />
        </Aneis>
        <Caixa>
          <h2>Para onde vai cada R$ 100 gastos com propaganda</h2>
          <Barras>
            {ordem.map(([k, x]) => (
              <Barra
                key={k}
                titulo={reais(tot[k])}
                rotulo={CANAL[k]}
                pct={(100 * x) / mx}
                valor={`R$ ${fmt(x, 0)}`}
                cor={k === ordem[0][0] ? "var(--color-verde-esc)" : "var(--color-verde)"}
              />
            ))}
          </Barras>
          <p className="texto-nota">
            {maiuscula(PLUR[f.cargo])} em {f.ano} {onde(f.uf)}, todos os candidatos. Passe o mouse para ver o valor em
            reais.
          </p>
        </Caixa>
      </div>
    </div>
  );
}

function SecaoNuvem({
  d,
  f,
  canal,
  termo,
  aoEleito,
  aoCanal,
  aoTermo,
}: {
  d: DadosQ9;
  f: Filtros;
  canal: number;
  termo: number | null;
  aoEleito: (e: number) => void;
  aoCanal: (c: number) => void;
  aoTermo: (t: number) => void;
}) {
  const ws = useMemo(() => grupoT(d, f, f.eleito, canal), [d, f.ano, f.cargo, f.uf, f.eleito, canal]); // eslint-disable-line react-hooks/exhaustive-deps
  const tot = totalT(d, f, f.eleito, canal);
  const quem = ["os não eleitos", "os eleitos", "os candidatos"][f.eleito];

  return (
    <Caixa>
      <h2>O que os candidatos escrevem quando declaram o gasto</h2>
      <p className="texto-simples !text-base">
        {ws.length ? (
          <>
            Entre {quem}
            {canal === TODOS_CANAIS ? "" : ` (só ${CANAL[canal].toLowerCase()})`}, as palavras mais escritas são{" "}
            <b>"{ws[0].termo}"</b>
            {ws[1] && (
              <>
                , <b>"{ws[1].termo}"</b>
              </>
            )}
            {ws[2] && (
              <>
                {" "}
                e <b>"{ws[2].termo}"</b>
              </>
            )}
            : a primeira aparece em {fmt(pc(ws[0].n, tot), 0)}% das despesas.
          </>
        ) : (
          "Sem despesas com descrição neste recorte."
        )}
      </p>
      <div className="flex flex-wrap items-end gap-x-[18px] gap-y-2.5">
        <Campo rotulo="Quem" grupo>
          <Alternador rotulo="Quem" opcoes={ELEITO_OPCOES} valor={f.eleito} aoMudar={aoEleito} />
        </Campo>
        <Campo rotulo="Só um tipo de gasto" grupo>
          <Alternador rotulo="Só um tipo de gasto" opcoes={CANAL_OPCOES} valor={canal} aoMudar={aoCanal} />
        </Campo>
      </div>
      <div className="grade-mapa">
        <Nuvem palavras={ws} total={tot} termo={termo} aoEscolher={aoTermo} />
        <div className="grid gap-2.5">
          <DetalhePalavra d={d} f={f} termo={termo} eleito={f.eleito} canal={canal} />
        </div>
      </div>
      <p className="texto-nota">
        Tamanho da palavra = em quantas despesas ela aparece (frequência, não valor). Clique numa palavra para ver o
        dinheiro por trás dela.
      </p>
    </Caixa>
  );
}

function Comparar({ d, f }: { d: DadosQ9; f: Filtros }) {
  const { v, p } = participacoes(d, f.uf, [f.ano], [f.cargo]);
  const ordem = ordenar(p);
  const te = v.map(g => g.reduce((a, b) => a + b, 0));
  const cmx = Math.max(...[0, 1].flatMap(e => v[e].map(x => pc(x, te[e]) || 0))) * 1.12;

  return (
    <>
      <Legenda
        itens={[
          { cor: "var(--color-verde-esc)", rotulo: "eleitos" },
          { cor: "var(--color-ouro)", rotulo: "não eleitos" },
        ]}
      />
      <Barras>
        {ordem.map(([k]) => {
          const a = pc(v[1][k], te[1]) || 0;
          const b = pc(v[0][k], te[0]) || 0;
          return (
            <div key={k} className="grid grid-cols-[minmax(0,13em)_minmax(0,1fr)_3.4em] items-start gap-2.5 text-sm">
              <span>{CANAL[k]}</span>
              <span className="grid gap-[3px]">
                <span className="h-[11px] rounded-[3px] bg-bege">
                  <i
                    className="block h-full rounded-[3px]"
                    style={{ width: `${((100 * a) / cmx).toFixed(1)}%`, background: "var(--color-verde-esc)" }}
                  />
                </span>
                <span className="h-[11px] rounded-[3px] bg-bege">
                  <i
                    className="block h-full rounded-[3px]"
                    style={{ width: `${((100 * b) / cmx).toFixed(1)}%`, background: "var(--color-ouro)" }}
                  />
                </span>
              </span>
              <b className="text-right text-[12.5px] leading-[14px] font-extrabold tabular-nums">
                {fmt(a, 0)}
                <br />
                {fmt(b, 0)}
              </b>
            </div>
          );
        })}
      </Barras>
      <p className="texto-nota">De cada R$ 100 que cada grupo gastou em propaganda, quanto foi para cada tipo.</p>
    </>
  );
}

const seta = (a: number | null, b: number | null) =>
  b == null || a == null ? "" : Math.abs(b - a) < 1 ? "≈" : b > a ? "▲" : "▼";

function Tendencia({ d, f }: { d: DadosQ9; f: Filtros }) {
  const linha = (anos: number[], cargos: number[]) => anos.map(a => participacoes(d, f.uf, [a], cargos).p);
  const mun = linha([2020, 2024], [0, 1]);
  const ger = linha([2018, 2022], [2, 3, 4, 5]);
  const ks = [0, 1, 4, 2];

  const cresceu = (par: (number | null)[][]) => {
    let k = -1,
      dif = 0;
    par[1].forEach((x, i) => {
      const antes = par[0][i];
      if (x != null && antes != null && x - antes > dif) {
        dif = x - antes;
        k = i;
      }
    });
    return k < 0 ? (
      "nenhum canal cresceu"
    ) : (
      <>
        <b>{CANAL[k].toLowerCase()}</b> (R$ {fmt(par[0][k], 0)} → R$ {fmt(par[1][k], 0)})
      </>
    );
  };

  return (
    <>
      <p className="texto-simples !text-[15.5px]">
        {maiuscula(onde(f.uf))}, a internet foi de R$ {fmt(mun[0][4], 0)} para R$ {fmt(mun[1][4], 0)} em cada R$ 100 nas
        municipais e de R$ {fmt(ger[0][4], 0)} para R$ {fmt(ger[1][4], 0)} nas estaduais e federais. O que mais cresceu
        nas municipais: {cresceu(mun)}; nas estaduais e federais: {cresceu(ger)}.
      </p>
      <div className="rolagem-x">
        <table>
          <thead>
            <tr>
              <th>De cada R$ 100</th>
              <th>Municipais 2020</th>
              <th>Municipais 2024</th>
              <th>Estaduais e federais 2018</th>
              <th>Estaduais e federais 2022</th>
            </tr>
          </thead>
          <tbody>
            {ks.map(k => (
              <tr key={k}>
                <td>{CANAL[k]}</td>
                <td>R$ {fmt(mun[0][k], 0)}</td>
                <td>
                  R$ {fmt(mun[1][k], 0)} {seta(mun[0][k], mun[1][k])}
                </td>
                <td>R$ {fmt(ger[0][k], 0)}</td>
                <td>
                  R$ {fmt(ger[1][k], 0)} {seta(ger[0][k], ger[1][k])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="texto-nota">
        Municipais (vereador e prefeito) e estaduais e federais (deputados, senador, governador) ficam separadas porque
        os cargos são diferentes. Soma todos os cargos da eleição no estado escolhido.
      </p>
    </>
  );
}
