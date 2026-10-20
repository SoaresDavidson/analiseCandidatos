import { useMemo } from "react";
import { Alternador, Barra, Barras, Caixa, Campo, Carregando, Etiqueta, Linha, Pagina, Selo, Seletor, VerMais } from "../../componentes";
import { useDados } from "../../lib/dados";
import { fmt, int, pc } from "../../lib/formato";
import { usePersistente } from "../../lib/usePersistente";
import type { PainelProps } from "../tipos";
import { Bonecos } from "./Bonecos";
import { GraficoHalteres, calcularHalteres } from "./Halteres";
import { GraficoSensibilidade } from "./Sensibilidade";
import { ANOS, CARGO, N_MIN, SING, UF_NOME, cargosDoAno, comparar, faixas, onde, rotFaixa, ufIdx } from "./estatistica";
import type { DadosQ8, Filtros } from "./tipos";

const PADRAO: Filtros = { ano: 2024, uf: "TODAS", cargo: 0, corte: 50 };

export default function Painel(_: PainelProps) {
  const { dados } = useDados<DadosQ8>("q8.json");
  return dados ? <Conteudo D={dados} /> : <Carregando />;
}

function Conteudo({ D }: { D: DadosQ8 }) {
  const [f, setF] = usePersistente<Filtros>("q8-tse", PADRAO);
  // cargo salvo que não existe naquele ano cai no primeiro cargo do ano
  const cargo = cargosDoAno(f.ano).includes(f.cargo) ? f.cargo : cargosDoAno(f.ano)[0];
  const { ano, uf, corte } = f;
  const us = useMemo(() => ufIdx(D.ufs, uf), [D, uf]);
  const lugar = onde(uf);

  const r = useMemo(() => faixas(D, ano, cargo, us), [D, ano, cargo, us]);
  const c = useMemo(() => comparar(r, 50), [r]);
  const cc = useMemo(() => comparar(r, corte), [r, corte]);
  const pan = useMemo(() => calcularHalteres(D, us), [D, us]);

  const N = r.reduce((s, b) => s + b.n, 0), E = r.reduce((s, b) => s + b.e, 0), geral = pc(E, N);
  const pPub = pc(c.g.pub.n, N);

  // 4 faixas fáceis de ler
  const soma = (fs: number[]) => fs.reduce((s, i) => ({ n: s.n + r[i].n, e: s.e + r[i].e }), { n: 0, e: 0 });
  const FX = ([["Nada do fundo (0%)", [0]], ["Menos da metade", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]], ["Metade ou mais", [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]], ["Tudo do fundo (100%)", [21]]] as [string, number[]][])
    .map(([rot, fs]) => { const g = soma(fs); return { rot, n: g.n, e: g.e, t: pc(g.e, g.n) }; });
  const valido = (x: (typeof FX)[number]) => (x.n >= N_MIN ? x.t ?? 0 : 0);
  const mx = Math.max(5, ...FX.map(valido), geral || 0) * 1.15, melhor = Math.max(...FX.map(valido));

  const escolher = (a: number, cg: number) => {
    setF(s => ({ ...s, ano: a, cargo: cg }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const mudarAno = (a: number) => setF(s => ({ ...s, ano: a, cargo: cargosDoAno(a).includes(cargo) ? cargo : cargosDoAno(a)[0] }));

  const dadoLugar = `${SING[cargo]} em ${ano} ${lugar}`;
  const pano = lugar[0].toUpperCase() + lugar.slice(1);

  return (
    <Pagina filtros={
      <>
        <Campo rotulo="Estado">
          <Seletor value={uf} onChange={e => setF(s => ({ ...s, uf: e.target.value }))}>
            <option value="TODAS">Todos os 6 estados</option>
            {D.ufs.map(u => <option key={u} value={u}>{UF_NOME[u]}</option>)}
          </Seletor>
        </Campo>
        <span className="grid gap-[3px] text-[13px] font-bold">Eleição<Alternador rotulo="Eleição" opcoes={ANOS} valor={ano} aoMudar={mudarAno} /></span>
        <span className="grid gap-[3px] text-[13px] font-bold">
          Cargo
          <Alternador rotulo="Cargo" opcoes={cargosDoAno(ano).map(x => [x, CARGO[x]] as const)} valor={cargo} aoMudar={x => setF(s => ({ ...s, cargo: x }))} />
        </span>
      </>
    }>
      <Etiqueta>PERGUNTA 8 · DINHEIRO PÚBLICO</Etiqueta>
      <h1>Depender do fundo público ajuda a vencer?</h1>
      <p className="texto-enunciado">Enunciado: qual a diferença de sucesso entre candidatos que dependem mais de repasses públicos em relação àqueles que são financiados por outras fontes? [2018, 2020, 2022, 2024]</p>

      <Caixa>
        <h2>O que é o fundo público?</h2>
        <div className="grid gap-2.5 min-[761px]:grid-cols-3">
          {[
            ["Fundo Eleitoral", "Dinheiro do orçamento da União dividido entre os partidos só para as campanhas. Os partidos escolhem quais candidatos recebem."],
            ["Fundo Partidário", "Dinheiro público que os partidos recebem todo mês e que também pode ir para as campanhas."],
            ["Outras fontes", "Doações de pessoas, dinheiro do próprio candidato e vaquinhas pela internet."],
          ].map(([t, d]) => (
            <div key={t} className="grid gap-1 rounded-[10px] bg-fundo px-3 py-2.5 text-sm"><b className="text-verde-esc">{t}</b><span>{d}</span></div>
          ))}
        </div>
        <p className="texto-simples !text-[15.5px]">
          Aqui, <b>depende do fundo público</b> quem teve <b>metade ou mais</b> da campanha paga com os dois fundos.{" "}
          {N > 0 && <>Para {dadoLugar}, <b>{fmt(pPub, 0)}%</b> dos candidatos estavam nessa situação.</>}
        </p>
      </Caixa>

      <div className="grade-duas">
        <Caixa>
          <h2>A resposta</h2>
          <p className="texto-simples">
            {!N ? "Não há candidatos com receita declarada neste recorte."
              : !c.ok ? `Para ${dadoLugar}, um dos grupos tem poucos candidatos: não dá para comparar com segurança.`
              : !c.real ? <>Para {dadoLugar}, <b>não faz diferença</b>: quem teve metade ou mais da campanha paga com dinheiro público se elegeu {fmt(c.tp, 0)} vezes em cada 100, e os outros, {fmt(c.to, 0)}.</>
              : <>Para {dadoLugar}, quem teve metade ou mais da campanha paga com dinheiro público se elegeu <b>{c.dif! < 0 ? "menos" : "mais"}</b>: {fmt(c.tp, 0)} em cada 100, contra {fmt(c.to, 0)} entre os financiados por outras fontes.</>}
          </p>
          <div>
            <Linha rotulo="Candidatos com receita declarada" valor={int(N)} />
            <Linha rotulo="Dependem do fundo (metade ou mais)" valor={`${fmt(pPub, 0)}%`} />
            <Linha rotulo="Chance média de se eleger" valor={`${fmt(geral, 0)} em 100`} />
          </div>
        </Caixa>
        <div className="grid min-w-0 gap-3.5">
          <Caixa>
            <h2>De cada 100 candidatos a {SING[cargo]}, quantos se elegeram?</h2>
            <div className="grid gap-[18px] min-[601px]:grid-cols-2">
              <Bonecos t={c.tp} cor="var(--color-ouro)" nome="Dependem do fundo público" g={c.g.pub} />
              <Bonecos t={c.to} cor="var(--color-verde-esc)" nome="Outras fontes" g={c.g.out} />
            </div>
            <Selo tipo={c.real ? "sim" : "nao"}>
              {c.p == null || !c.ok ? "Poucos candidatos: o teste não é confiável" : c.real ? "Diferença real (teste estatístico, p < 0,05)" : "Sem diferença real (teste estatístico)"}
            </Selo>
          </Caixa>
          <Caixa>
            <h2>De cada 100 candidatos a {SING[cargo]}, quantos se elegem, conforme a parte da campanha paga pelo fundo público?</h2>
            <Barras>
              {FX.map(x => x.n ? (
                <div key={x.rot} title={`${int(x.e)} eleitos de ${int(x.n)} candidatos`}>
                  <Barra
                    rotulo={x.rot}
                    pct={100 * Math.min(x.t ?? 0, mx) / mx}
                    valor={fmt(x.t, (x.t ?? 0) < 10 ? 1 : 0)}
                    cor={x.n < N_MIN ? "var(--color-sem-dado)" : x.t === melhor ? "var(--color-verde-esc)" : "var(--color-verde)"}
                    media={geral != null ? 100 * geral / mx : undefined}
                  />
                </div>
              ) : (
                <div key={x.rot} className="grid grid-cols-[minmax(0,13em)_minmax(0,1fr)_3.4em] items-center gap-2.5 text-sm">
                  <span>{x.rot}</span><span className="texto-nota">sem candidatos</span><b />
                </div>
              ))}
            </Barras>
            <p className="texto-nota">Candidatos a {dadoLugar} que declararam receita. A linha tracejada é a média do cargo ({fmt(geral, 0)} em cada 100). Barra cinza: menos de 30 candidatos.</p>
          </Caixa>
        </div>
      </div>

      <Caixa>
        <h2>Em todos os cargos e eleições, o padrão se repete?</h2>
        <p className="texto-simples !text-base">
          {pano}, nos cargos e anos com diferença real, quem depende do fundo público se elege <b>menos em {pan.menos}</b> e <b>mais em {pan.mais}</b>{pan.igual ? `; em ${pan.igual}, não há diferença` : ""}.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-texto-2">
          <span className="inline-flex items-center gap-1.5"><i className="inline-block size-3 rounded-full bg-ouro" />dependem do fundo público</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block size-3 rounded-full bg-verde-esc" />outras fontes</span>
          <span className="inline-flex items-center gap-1.5">Linha apagada: sem diferença real no teste estatístico, ou poucos candidatos.</span>
        </div>
        <div className="rolagem-x">
          <GraficoHalteres calc={pan} ano={ano} cargo={cargo} aoEscolher={escolher} />
        </div>
        <p className="texto-nota">Cada linha: de cada 100 candidatos daquele cargo e eleição, quantos se elegeram em cada grupo. "Menos chance": quem depende do fundo se elegeu menos que os outros, com diferença real no teste estatístico. Clique numa linha para ver aquele cargo e ano no alto da página.</p>
      </Caixa>

      <VerMais titulo={`Mudar o que conta como "depender" do fundo público`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label htmlFor="f-corte" className="font-bold">Depende do fundo público quem recebeu</label>
          <output htmlFor="f-corte" className="min-w-[3em] text-xl font-extrabold text-ouro-esc">{corte}%</output>
          <input id="f-corte" type="range" min={5} max={100} step={5} value={corte} onChange={e => setF(s => ({ ...s, corte: +e.target.value }))} className="w-[min(320px,100%)] accent-ouro" />
          <span className="font-bold">ou mais da campanha</span>
        </div>
        <p className="texto-simples !text-[15.5px]">
          {!cc.ok ? "Com esse corte, um dos grupos fica com poucos candidatos."
            : `Com esse corte, quem depende do fundo se elege ${fmt(cc.tp, 0)} vezes em 100 e os outros ${fmt(cc.to, 0)}: diferença de ${cc.dif! > 0 ? "+" : "−"}${fmt(Math.abs(cc.dif!), 1)} pontos${cc.real ? "" : " (sem diferença real no teste)"}.`}
        </p>
        <h3>A conclusão muda com o corte?</h3>
        <GraficoSensibilidade r={r} corte={corte} />
        <p className="texto-nota">Cada ponto: a diferença (em pontos) entre os dois grupos se o corte fosse aquele. Acima da linha do zero, quem depende do fundo público se elege mais; abaixo, menos. Se a linha cruza o zero, a resposta depende de onde se põe o corte.</p>
      </VerMais>

      <VerMais titulo="Ver a chance de vitória em cada faixa de 5%">
        <div className="rolagem-x">
          <table>
            <thead><tr><th>Parte da campanha paga pelo fundo público</th><th>Candidatos</th><th>Eleitos</th><th>Eleitos em cada 100</th></tr></thead>
            <tbody>
              {r.map((b, i) => (
                <tr key={i}><td>{rotFaixa(i)}</td><td>{int(b.n)}</td><td>{int(b.e)}</td><td>{b.n ? fmt(pc(b.e, b.n)) : "–"}</td></tr>
              ))}
              <tr><td><b>Total</b></td><td><b>{int(N)}</b></td><td><b>{int(E)}</b></td><td><b>{fmt(pc(E, N))}</b></td></tr>
            </tbody>
          </table>
        </div>
      </VerMais>

      <VerMais titulo="Como calculamos">
        <ul>
          <li><b>Fonte:</b> TSE, prestação de contas das campanhas e cadastro de candidaturas (<i>consulta_cand</i>), 2018 a 2024.</li>
          <li><b>Dinheiro público:</b> Fundo Especial de Financiamento de Campanha (FEFC) mais Fundo Partidário, venha de onde vier (partido ou outro candidato). O resto (pessoas físicas, recursos próprios, vaquinha) são "outras fontes".</li>
          <li><b>Quanto depende:</b> dinheiro público ÷ tudo o que o candidato arrecadou. O corte padrão é metade (50%); dá para mudar no bloco acima.</li>
          <li><b>Quem entra:</b> eleições ordinárias, sem vices e suplentes, só quem foi a voto e declarou alguma receita. 2026 fica de fora até o resultado final.</li>
          <li><b>Chance de se eleger:</b> eleitos ÷ candidatos de cada grupo, sempre dentro do mesmo cargo. O teste é o qui-quadrado.</li>
          <li><b>Cuidado:</b> isso mostra o que anda junto, não o que causa. O partido decide quem recebe o fundo, e quem se banca sozinho costuma ter mais renda e mais doadores.</li>
        </ul>
      </VerMais>
    </Pagina>
  );
}
