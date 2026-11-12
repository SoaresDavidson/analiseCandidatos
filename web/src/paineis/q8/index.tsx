import { useMemo } from "react";
import {
  Alternador,
  Barra,
  Barras,
  Caixa,
  Campo,
  Carregando,
  Etiqueta,
  Pagina,
  SeletorUf,
  Selo,
  VerMais,
} from "../../componentes";
import { useDados } from "../../lib/dados";
import { fmt, int, pc } from "../../lib/formato";
import { noLugar } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import { Congresso } from "./Congresso";
import { Estados } from "./Estados";
import {
  ANOS,
  CARGO,
  cargosDoAno,
  comparar,
  dependenciaPorUf,
  faixas,
  N_MIN,
  panorama,
  rotFaixa,
  SING,
  ufIdx,
} from "./estatistica";
import { GraficoSensibilidade } from "./Sensibilidade";
import type { DadosQ8, Filtros } from "./tipos";

const PADRAO: Filtros = { ano: 2024, uf: "TODAS", cargo: 0, corte: 50 };

export default function Painel() {
  const { dados } = useDados<DadosQ8>("q8.json");
  return dados ? <Conteudo D={dados} /> : <Carregando />;
}

function Conteudo({ D }: { D: DadosQ8 }) {
  const [salvo, setF] = usePersistente<Filtros>("q8-brasil", PADRAO);
  // valor salvo de outra versão: estado que não existe volta para o Brasil
  const f: Filtros = salvo.uf !== "TODAS" && !D.ufs.includes(salvo.uf) ? { ...salvo, uf: "TODAS" } : salvo;
  // cargo salvo que não existe naquele ano cai no primeiro cargo do ano
  const cargo = cargosDoAno(f.ano).includes(f.cargo) ? f.cargo : cargosDoAno(f.ano)[0];
  const { ano, uf, corte } = f;
  const us = useMemo(() => ufIdx(D.ufs, uf), [D, uf]);
  const lugar = noLugar(uf);

  const r = useMemo(() => faixas(D, ano, cargo, us), [D, ano, cargo, us]);
  const c = useMemo(() => comparar(r, 50), [r]);
  const cc = useMemo(() => comparar(r, corte), [r, corte]);
  const pan = useMemo(() => panorama(D, us), [D, us]);
  const porUf = useMemo(() => dependenciaPorUf(D, ano, cargo), [D, ano, cargo]);

  const N = r.reduce((s, b) => s + b.n, 0),
    E = r.reduce((s, b) => s + b.e, 0),
    geral = pc(E, N);
  const pPub = pc(c.g.pub.n, N);

  // 4 faixas fáceis de ler
  const soma = (fs: number[]) => fs.reduce((s, i) => ({ n: s.n + r[i].n, e: s.e + r[i].e }), { n: 0, e: 0 });
  const FX = (
    [
      ["Nada do fundo (0%)", [0]],
      ["Menos da metade", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
      ["Metade ou mais", [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]],
      ["Tudo do fundo (100%)", [21]],
    ] as [string, number[]][]
  ).map(([rot, fs]) => {
    const g = soma(fs);
    return { rot, n: g.n, e: g.e, t: pc(g.e, g.n) };
  });
  const valido = (x: (typeof FX)[number]) => (x.n >= N_MIN ? (x.t ?? 0) : 0);
  const mx = Math.max(5, ...FX.map(valido), geral || 0) * 1.15,
    melhor = Math.max(...FX.map(valido));

  const escolher = (a: number, cg: number) => {
    setF(s => ({ ...s, ano: a, cargo: cg }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const mudarAno = (a: number) =>
    setF(s => ({ ...s, ano: a, cargo: cargosDoAno(a).includes(cargo) ? cargo : cargosDoAno(a)[0] }));

  const dadoLugar = `${SING[cargo]} em ${ano} ${lugar}`;
  const pano = lugar[0].toUpperCase() + lugar.slice(1);

  return (
    <Pagina
      filtros={
        <>
          <Campo rotulo="Estado">
            <SeletorUf brasil value={uf} onChange={e => setF(s => ({ ...s, uf: e.target.value }))} />
          </Campo>
          <Campo rotulo="Eleição" grupo>
            <Alternador rotulo="Eleição" opcoes={ANOS} valor={ano} aoMudar={mudarAno} />
          </Campo>
          <Campo rotulo="Cargo" grupo>
            <Alternador
              rotulo="Cargo"
              opcoes={cargosDoAno(ano).map(x => [x, CARGO[x]] as const)}
              valor={cargo}
              aoMudar={x => setF(s => ({ ...s, cargo: x }))}
            />
          </Campo>
        </>
      }
    >
      <Etiqueta>PERGUNTA 8 · DINHEIRO PÚBLICO</Etiqueta>
      <h1>Depender do fundo público ajuda a vencer?</h1>
      <p className="texto-enunciado">
        Enunciado: qual a diferença de sucesso entre candidatos que dependem mais de repasses públicos em relação
        àqueles que são financiados por outras fontes? [2018, 2020, 2022, 2024]
      </p>

      <Caixa>
        <h2>
          {N ? (
            <>
              De cada 100 candidatos a {dadoLugar}, {fmt(pPub, 0)} dependeram do fundo público
            </>
          ) : (
            "Não há candidatos com receita declarada neste recorte"
          )}
        </h2>
        {N > 0 && (
          <p className="texto-simples m-0">
            {!c.ok ? (
              "Um dos grupos tem poucos candidatos: não dá para comparar com segurança."
            ) : !c.real ? (
              <>
                E <b>não faz diferença</b> na urna: se elegeram {fmt(c.tp, 0)} em cada 100 dos que dependem do fundo e{" "}
                {fmt(c.to, 0)} em cada 100 dos outros.
              </>
            ) : (
              <>
                E quem depende do fundo se elegeu <b>{c.dif! < 0 ? "menos" : "mais"}</b>: {fmt(c.tp, 0)} em cada 100,
                contra {fmt(c.to, 0)} em cada 100 dos financiados por outras fontes.
              </>
            )}
          </p>
        )}
        <Congresso
          c={c}
          descricao={`O Congresso Nacional como gráfico: de cada 100 candidatos a ${dadoLugar}, ${fmt(pPub, 0)} estão dentro da cumbuca, a dos que dependem do fundo público. Eleitos em cada 100: ${fmt(c.tp, 0)} entre eles e ${fmt(c.to, 0)} entre os outros.`}
        />
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <p className="texto-nota m-0 max-w-[88ch]">
            <b>Na cumbuca</b> entra quem teve metade ou mais da campanha paga com dinheiro público (Fundo Eleitoral e
            Fundo Partidário); <b>na cúpula</b>, os outros. <b>Nas torres</b>, cada janela acesa é um eleito em cada 100
            do grupo ao lado. Fonte: TSE, prestação de contas das campanhas.
          </p>
          {N > 0 && (
            <Selo tipo={c.real ? "sim" : "nao"}>
              {c.p == null || !c.ok
                ? "Poucos candidatos: o teste não é confiável"
                : c.real
                  ? "Diferença real (2 pontos ou mais, e não é acaso)"
                  : "Sem diferença real (menos de 2 pontos, ou pode ser acaso)"}
            </Selo>
          )}
        </div>
        <Estados itens={porUf} uf={uf} cargo={SING[cargo]} ano={ano} aoMudar={u => setF(s => ({ ...s, uf: u }))} />
      </Caixa>

      <Caixa>
        <h2>O que é o fundo público?</h2>
        <div className="grid gap-2.5 min-[761px]:grid-cols-3">
          {[
            [
              "Fundo Eleitoral",
              "Dinheiro do orçamento da União dividido entre os partidos só para as campanhas. Os partidos escolhem quais candidatos recebem.",
            ],
            [
              "Fundo Partidário",
              "Dinheiro público que os partidos recebem todo mês e que também pode ir para as campanhas.",
            ],
            ["Outras fontes", "Doações de pessoas, dinheiro do próprio candidato e vaquinhas pela internet."],
          ].map(([t, d]) => (
            <div key={t} className="grid gap-1 rounded-[10px] bg-fundo px-3 py-2.5 text-sm">
              <b className="text-verde-esc">{t}</b>
              <span>{d}</span>
            </div>
          ))}
        </div>
      </Caixa>

      <div className="grid items-start gap-[18px] min-[901px]:grid-cols-2">
        <Caixa>
          <h2>Quanto mais fundo público na campanha, mais chance?</h2>
          <Barras>
            {FX.map(x =>
              x.n ? (
                <Barra
                  key={x.rot}
                  titulo={`${int(x.e)} eleitos de ${int(x.n)} candidatos`}
                  rotulo={x.rot}
                  pct={(100 * Math.min(x.t ?? 0, mx)) / mx}
                  valor={fmt(x.t, (x.t ?? 0) < 10 ? 1 : 0)}
                  cor={
                    x.n < N_MIN
                      ? "var(--color-sem-dado)"
                      : x.t === melhor
                        ? "var(--color-verde-esc)"
                        : "var(--color-verde)"
                  }
                  media={geral != null ? (100 * geral) / mx : undefined}
                />
              ) : (
                <div
                  key={x.rot}
                  className="grid grid-cols-[minmax(0,13em)_minmax(0,1fr)_3.4em] items-center gap-2.5 text-sm"
                >
                  <span>{x.rot}</span>
                  <span className="texto-nota">sem candidatos</span>
                  <b />
                </div>
              ),
            )}
          </Barras>
          <p className="texto-nota">
            De cada 100 candidatos a {dadoLugar}, quantos se elegeram, conforme a parte da campanha paga pelo fundo. A
            linha tracejada é a média do cargo ({fmt(geral, 0)} em cada 100). Barra cinza: menos de 30 candidatos.
          </p>
        </Caixa>

        <Caixa>
          <h2>Em todos os cargos e eleições, o padrão se repete?</h2>
          <p className="texto-simples !text-base">
            {pano}, nos cargos e anos com diferença real, quem depende do fundo público se elege{" "}
            <b>menos em {pan.menos}</b> e <b>mais em {pan.mais}</b>
            {pan.igual ? `; em ${pan.igual}, não há diferença` : ""}.
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-1.5">
            {pan.itens.map(({ a, c: cg, k }) => {
              const atual = a === ano && cg === cargo;
              const [rot, cor] = !k.ok
                ? ["poucos candidatos", "bg-fundo text-texto-2"]
                : !k.real
                  ? ["sem diferença", "bg-bege text-texto"]
                  : k.dif! < 0
                    ? ["menos chance", "bg-ouro-claro text-ouro-esc"]
                    : ["mais chance", "bg-verde-claro text-verde-esc"];
              return (
                <button
                  key={`${a}|${cg}`}
                  type="button"
                  aria-pressed={atual}
                  onClick={() => escolher(a, cg)}
                  title={
                    k.ok
                      ? `${fmt(k.tp, 0)} em cada 100 (fundo) × ${fmt(k.to, 0)} em cada 100 (outras fontes)`
                      : undefined
                  }
                  className={`grid cursor-pointer gap-0.5 rounded-lg border-2 px-2.5 py-1.5 text-left hover:border-ouro ${atual ? "border-texto" : "border-transparent"} ${cor}`}
                >
                  <span className="text-[13px] font-extrabold text-texto">
                    {CARGO[cg]} · {a}
                  </span>
                  <span className="text-[12.5px] font-bold">{rot}</span>
                </button>
              );
            })}
          </div>
          <p className="texto-nota">
            "Menos chance": quem depende do fundo se elegeu menos que os outros, com diferença real (2 pontos ou mais e
            teste estatístico). Clique num cargo e ano para vê-lo no Congresso, no alto da página.
          </p>
        </Caixa>
      </div>

      <VerMais titulo={`Mudar o que conta como "depender" do fundo público`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label htmlFor="f-corte" className="font-bold">
            Depende do fundo público quem recebeu
          </label>
          <output htmlFor="f-corte" className="min-w-[3em] text-xl font-extrabold text-ouro-esc">
            {corte}%
          </output>
          <input
            id="f-corte"
            type="range"
            min={5}
            max={100}
            step={5}
            value={corte}
            onChange={e => setF(s => ({ ...s, corte: +e.target.value }))}
            className="w-[min(320px,100%)] accent-ouro"
          />
          <span className="font-bold">ou mais da campanha</span>
        </div>
        <p className="texto-simples !text-[15.5px]">
          {!cc.ok
            ? "Com esse corte, um dos grupos fica com poucos candidatos."
            : `Com esse corte, quem depende do fundo se elege ${fmt(cc.tp, 0)} vezes em 100 e os outros ${fmt(cc.to, 0)}: diferença de ${cc.dif! > 0 ? "+" : "−"}${fmt(Math.abs(cc.dif!), 1)} pontos${cc.real ? "" : " (sem diferença real)"}.`}
        </p>
        <h3>A conclusão muda com o corte?</h3>
        <GraficoSensibilidade r={r} corte={corte} />
        <p className="texto-nota">
          Cada ponto: a diferença (em pontos) entre os dois grupos se o corte fosse aquele. Acima da linha do zero, quem
          depende do fundo público se elege mais; abaixo, menos. Se a linha cruza o zero, a resposta depende de onde se
          põe o corte.
        </p>
      </VerMais>

      <VerMais titulo="Ver a chance de vitória em cada faixa de 5%">
        <div className="rolagem-x">
          <table>
            <thead>
              <tr>
                <th>Parte da campanha paga pelo fundo público</th>
                <th>Candidatos</th>
                <th>Eleitos</th>
                <th>Eleitos em cada 100</th>
              </tr>
            </thead>
            <tbody>
              {r.map((b, i) => (
                <tr key={i}>
                  <td>{rotFaixa(i)}</td>
                  <td>{int(b.n)}</td>
                  <td>{int(b.e)}</td>
                  <td>{b.n ? fmt(pc(b.e, b.n)) : "–"}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>Total</b>
                </td>
                <td>
                  <b>{int(N)}</b>
                </td>
                <td>
                  <b>{int(E)}</b>
                </td>
                <td>
                  <b>{fmt(pc(E, N))}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </VerMais>

      <VerMais titulo="Como calculamos">
        <ul>
          <li>
            <b>Fonte:</b> TSE, prestação de contas das campanhas e cadastro de candidaturas (<i>consulta_cand</i>), 2018
            a 2024.
          </li>
          <li>
            <b>Dinheiro público:</b> Fundo Especial de Financiamento de Campanha (FEFC) mais Fundo Partidário, venha de
            onde vier (partido ou outro candidato). O resto (pessoas físicas, recursos próprios, vaquinha) são "outras
            fontes".
          </li>
          <li>
            <b>Quanto depende:</b> dinheiro público ÷ tudo o que o candidato arrecadou. O corte padrão é metade (50%);
            dá para mudar no bloco acima.
          </li>
          <li>
            <b>Quem entra:</b> eleições ordinárias, sem vices e suplentes, só quem foi a voto e declarou alguma receita.
            2026 fica de fora até o resultado final.
          </li>
          <li>
            <b>Chance de se eleger:</b> eleitos ÷ candidatos de cada grupo, sempre dentro do mesmo cargo. A diferença só
            conta como real se for de 2 pontos ou mais e passar no teste do qui-quadrado (p &lt; 0,05): com o país
            inteiro os grupos são tão grandes que o teste sozinho aprova até meio ponto.
          </li>
          <li>
            <b>Cuidado:</b> isso mostra o que anda junto, não o que causa. O partido decide quem recebe o fundo, e quem
            se banca sozinho costuma ter mais renda e mais doadores.
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}
