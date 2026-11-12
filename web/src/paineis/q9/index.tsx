import { useMemo, useState } from "react";
import {
  Alternador,
  Barras,
  Caixa,
  Campo,
  Carregando,
  Etiqueta,
  Legenda,
  Pagina,
  SeletorUf,
  VerMais,
} from "../../componentes";
import { useDados } from "../../lib/dados";
import { fmt, maiusculaInicial, pc } from "../../lib/formato";
import { noLugar } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import {
  ANOS,
  CANAL,
  CANAL_FRASE,
  CARGO,
  cargosDoAno,
  grupoT,
  PLUR,
  participacoes,
  reais,
  TODOS_CANAIS,
  totalT,
} from "./dominio";
import { Nuvem } from "./Nuvem";
import { DetalhePalavra } from "./Palavra";
import { temaDoCanal } from "./temas";
import type { DadosQ9, Filtros, NuvemUf } from "./tipos";

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

function Q9({ d: pais }: { d: DadosQ9 }) {
  const [gravado, setSalvo] = usePersistente<Filtros>("q9-brasil", FILTROS_PADRAO);
  // valor salvo de outra versão: estado que não existe volta para o Brasil
  const salvo: Filtros = gravado.uf !== "TODAS" && !pais.ufs.includes(gravado.uf) ? FILTROS_PADRAO : gravado;
  // a nuvem do país vem no q9.json; a de um estado, do arquivo dele (vazia enquanto carrega)
  const { dados: nuvemUf } = useDados<NuvemUf>(salvo.uf === "TODAS" ? null : `q9/${salvo.uf}.json`);
  const d = useMemo<DadosQ9>(
    () => (salvo.uf === "TODAS" ? pais : { ...pais, q9t: nuvemUf?.q9t ?? {}, q9tot: nuvemUf?.q9tot ?? {} }),
    [pais, salvo.uf, nuvemUf],
  );
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
        <SeletorUf brasil value={f.uf} onChange={e => mudarUf(e.target.value)} />
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

/** Ordem dos tipos de gasto, do maior para o menor. */
function ordenar(p: (number | null)[]): [number, number][] {
  return p.map((x, k): [number, number] => [k, x || 0]).sort((a, b) => b[1] - a[1]);
}

const QUEM = ["não eleitos", "eleitos", ""];

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

  // o dinheiro por tipo de gasto do mesmo grupo da nuvem (todos, eleitos ou não eleitos)
  const { v, tot: todos } = participacoes(d, f.uf, [f.ano], [f.cargo]);
  const valores = f.eleito === 2 ? todos : v[f.eleito];
  const soma = valores.reduce((a, b) => a + b, 0);
  const de100 = (k: number) => fmt(pc(valores[k], soma), 0);
  const ordem = ordenar(valores);
  const quem = `${PLUR[f.cargo]} ${QUEM[f.eleito]}`.trim();

  return (
    <Caixa>
      <p className="texto-simples">
        {!soma ? (
          "Sem despesas de propaganda neste recorte."
        ) : canal === TODOS_CANAIS ? (
          <>
            Os {quem} de {f.ano} {noLugar(f.uf)} gastaram <b>{reais(soma)}</b> com propaganda. De cada R$ 100,{" "}
            <b>R$ {de100(ordem[0][0])}</b> foram para {CANAL_FRASE[ordem[0][0]]} e <b>R$ {de100(ordem[1][0])}</b> para{" "}
            {CANAL_FRASE[ordem[1][0]]}.
          </>
        ) : (
          <>
            De cada R$ 100 que os {quem} de {f.ano} {noLugar(f.uf)} gastaram com propaganda, <b>R$ {de100(canal)}</b>{" "}
            foram para {CANAL_FRASE[canal]}: <b>{reais(valores[canal])}</b>.
          </>
        )}
      </p>
      <div className="flex flex-wrap items-end gap-x-[18px] gap-y-2.5">
        <Campo rotulo="Tipo de gasto" grupo>
          <Alternador rotulo="Tipo de gasto" opcoes={CANAL_OPCOES} valor={canal} aoMudar={aoCanal} />
        </Campo>
        <Campo rotulo="Quem" grupo>
          <Alternador rotulo="Quem" opcoes={ELEITO_OPCOES} valor={f.eleito} aoMudar={aoEleito} />
        </Campo>
      </div>
      {ws.length ? (
        <Nuvem
          palavras={ws}
          total={tot}
          termo={termo}
          aoEscolher={aoTermo}
          tema={temaDoCanal(canal)}
          recorte={`${f.ano}|${f.cargo}|${f.uf}|${f.eleito}`}
        />
      ) : (
        <p className="texto-nota">Sem despesas com descrição neste recorte.</p>
      )}
      <DetalhePalavra d={d} f={f} termo={termo} eleito={f.eleito} canal={canal} />
      <p className="texto-nota">
        As palavras são as que o próprio candidato escreveu ao declarar cada despesa. Tamanho = em quantas despesas a
        palavra aparece (frequência, não valor). Fonte: TSE, prestação de contas das campanhas.
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
        <b>{CANAL_FRASE[k]}</b> (R$ {fmt(par[0][k], 0)} → R$ {fmt(par[1][k], 0)})
      </>
    );
  };

  return (
    <>
      <p className="texto-simples !text-[15.5px]">
        {maiusculaInicial(noLugar(f.uf))}, a internet foi de R$ {fmt(mun[0][4], 0)} para R$ {fmt(mun[1][4], 0)} em cada
        R$ 100 nas municipais e de R$ {fmt(ger[0][4], 0)} para R$ {fmt(ger[1][4], 0)} nas estaduais e federais. O que
        mais cresceu nas municipais: {cresceu(mun)}; nas estaduais e federais: {cresceu(ger)}.
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
