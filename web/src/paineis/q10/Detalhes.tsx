import { useMemo } from "react";
import { Alternador, Campo, Legenda, VerMais } from "../../componentes";
import { fmt, int, pc } from "../../lib/formato";
import {
  ABREV,
  CARGOS_RE,
  COR_OURO,
  COR_TEXTO_2,
  COR_VERDE,
  COR_VERDE_ESC,
  curva,
  type Pessoa,
  TURMAS,
  ufsSel,
} from "./logica";
import type { DadosQ10, Filtros } from "./tipos";

type Mudar = <K extends keyof Filtros>(k: K, v: Filtros[K]) => void;

const W = 640,
  H = 320,
  L = 44,
  R = 150,
  T = 12,
  B = 34;
const CORES = [COR_VERDE_ESC, COR_OURO, COR_VERDE, COR_TEXTO_2];

export function Comparar({ D, f, mudar }: { D: DadosQ10; f: Filtros; mudar: Mudar }) {
  const g = useMemo(() => {
    const X = (k: number) => L + ((W - L - R) * k) / 4,
      Y = (v: number) => T + (H - T - B) * (1 - v / 100);
    const rotulos: [number, number, string][] = [];
    const linhas = TURMAS.map(([c], i) => {
      const pts = curva(D, ufsSel(f.uf), c, f.medida)
        .map((v, k) => [k, v] as const)
        .filter((p): p is readonly [number, number] => p[1] != null);
      if (pts.length) {
        const [lk, lv] = pts[pts.length - 1];
        rotulos.push([X(lk) + 10, Y(lv), `${TURMAS[i][1]} ${fmt(lv, 0)}%`]);
      }
      return pts;
    });
    // afasta rótulos que ficariam um em cima do outro
    rotulos.sort((a, b) => a[1] - b[1]);
    for (let i = 1; i < rotulos.length; i++)
      if (rotulos[i][1] - rotulos[i - 1][1] < 14) rotulos[i][1] = rotulos[i - 1][1] + 14;
    return { X, Y, linhas, rotulos };
  }, [D, f.uf, f.medida]);

  return (
    <VerMais titulo="Comparar os cargos de estreia">
      <Campo grupo rotulo="Mostrar">
        <Alternador
          rotulo="Mostrar"
          opcoes={[
            ["mandato", "Ainda eleitos"],
            ["disputa", "Ainda disputando"],
          ]}
          valor={f.medida}
          aoMudar={v => mudar("medida", v)}
        />
      </Campo>
      <Legenda itens={TURMAS.map(([, n], i) => ({ cor: CORES[i], rotulo: n }))} />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Curvas de sobrevivência por cargo da primeira vitória"
        className="grafico max-w-[760px]"
      >
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={g.Y(v)} y2={g.Y(v)} className="svg-grade" />
            <text x={L - 6} y={g.Y(v)} textAnchor="end" dominantBaseline="middle" className="svg-eixo">
              {v}%
            </text>
          </g>
        ))}
        {["estreia", "+4 anos", "+8", "+12", "+16"].map((r, k) => (
          <text key={k} x={g.X(k)} y={H - B + 16} textAnchor="middle" dominantBaseline="middle" className="svg-eixo">
            {r}
          </text>
        ))}
        {g.linhas.map((pts, i) => (
          <g key={i}>
            <polyline
              points={pts.map(([k, v]) => `${g.X(k)},${g.Y(v)}`).join(" ")}
              fill="none"
              stroke={CORES[i]}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {pts.map(([k, v]) => (
              <circle key={k} cx={g.X(k)} cy={g.Y(v)} r={4} fill={CORES[i]} stroke="#fff" strokeWidth={2} />
            ))}
          </g>
        ))}
        {g.rotulos.map(([x, y, s]) => (
          <text key={s} x={x} y={y} dominantBaseline="middle" className="svg-eixo">
            {s}
          </text>
        ))}
      </svg>
      <p className="texto-nota">
        Cada linha acompanha quem ganhou a primeira eleição naquele cargo. "Ainda eleito" conta mandato em qualquer
        cargo; "ainda disputando" conta quem continua se candidatando, mesmo perdendo. A queda dos prefeitos aos 8 anos
        é a regra do jogo: só uma reeleição seguida.
      </p>
    </VerMais>
  );
}

export function Reeleicao({ D, f, mudar }: { D: DadosQ10; f: Filtros; mudar: Mudar }) {
  const d = useMemo(() => {
    const ufs = ufsSel(f.uf),
      anos: Record<number, { e: number; t: number; r: number }> = {};
    for (const [ano, uf, cargo, e, t, r] of D.sobrevivencia) {
      if (cargo === f.cargoRe && ufs.includes(uf)) {
        const a = anos[ano] || (anos[ano] = { e: 0, t: 0, r: 0 });
        a.e += e;
        a.t += t;
        a.r += r;
      }
    }
    const xs = Object.keys(anos)
      .map(Number)
      .sort((a, b) => a - b);
    const tot = xs.reduce((s, a) => ({ e: s.e + anos[a].e, t: s.t + anos[a].t, r: s.r + anos[a].r }), {
      e: 0,
      t: 0,
      r: 0,
    });
    return { anos, xs, tot };
  }, [D, f.uf, f.cargoRe]);
  const per = f.cargoRe === 5 ? 8 : 4,
    nome = (CARGOS_RE.find(c => c[0] === f.cargoRe) ?? CARGOS_RE[0])[1].toLowerCase();
  const { anos, xs, tot } = d;

  return (
    <VerMais titulo="Quem se elege tenta de novo? E consegue?">
      <Campo grupo rotulo="Cargo">
        <Alternador rotulo="Cargo" opcoes={CARGOS_RE} valor={f.cargoRe} aoMudar={v => mudar("cargoRe", v)} />
      </Campo>
      <p className="texto-simples text-[15.5px]">
        {tot.e ? (
          <>
            De cada 100 eleitos ({nome}), <b>{fmt(pc(tot.t, tot.e), 0)}</b> tentaram o mesmo cargo na eleição seguinte e{" "}
            <b>{fmt(pc(tot.r, tot.e), 0)}</b> se reelegeram. Entre os que tentaram, {fmt(pc(tot.r, tot.t), 0)} em cada
            100 conseguiram.
          </>
        ) : (
          "Sem eleitos para este filtro."
        )}
      </p>
      <div className="rolagem-x">
        <table>
          <thead>
            <tr>
              <th>Eleitos em</th>
              <th>Disputa seguinte</th>
              <th>Eleitos</th>
              <th>Tentaram de novo</th>
              <th>Reeleitos</th>
              <th>Sucesso de quem tentou</th>
            </tr>
          </thead>
          <tbody>
            {xs.map(a => (
              <tr key={a}>
                <td>{a}</td>
                <td>{a + per}</td>
                <td>{int(anos[a].e)}</td>
                <td>{fmt(pc(anos[a].t, anos[a].e), 0)}%</td>
                <td>{fmt(pc(anos[a].r, anos[a].e), 0)}%</td>
                <td>{fmt(pc(anos[a].r, anos[a].t), 0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="texto-nota">
        "Tentou de novo": disputou o mesmo cargo, na mesma cidade ou estado, na eleição seguinte (8 anos depois para
        senador). Os eleitos de 2022 ainda dependem do resultado de 2026 e ficam de fora.
      </p>
    </VerMais>
  );
}

export function Ranking({
  pessoas,
  f,
  mudar,
  aoAbrir,
}: {
  pessoas: Pessoa[];
  f: Filtros;
  mudar: Mudar;
  aoAbrir: (id: number) => void;
}) {
  const top = useMemo(() => {
    const chave = {
      vit: (p: Pessoa) => [p.vit, p.r.length],
      anos: (p: Pessoa) => [p.anos, p.vit],
      reel: (p: Pessoa) => [p.reel, p.vit],
    }[f.ordem];
    return pessoas
      .slice()
      .sort((a, b) => {
        const x = chave(a),
          y = chave(b);
        return y[0] - x[0] || y[1] - x[1];
      })
      .slice(0, 15);
  }, [pessoas, f.ordem]);

  return (
    <VerMais titulo="Ver as carreiras mais longas">
      <Campo grupo rotulo="Ordenar por">
        <Alternador
          rotulo="Ordenar por"
          opcoes={[
            ["vit", "Vitórias"],
            ["anos", "Anos de carreira"],
            ["reel", "Reeleições"],
          ]}
          valor={f.ordem}
          aoMudar={v => mudar("ordem", v)}
        />
      </Campo>
      <div className="rolagem-x">
        <table>
          <thead>
            <tr>
              <th>Político</th>
              <th>Estado</th>
              <th>Último cargo</th>
              <th>Vitórias</th>
              <th>Eleições</th>
              <th>Reeleições</th>
              <th>Anos</th>
            </tr>
          </thead>
          <tbody>
            {top.map(p => (
              <tr
                key={p.id}
                tabIndex={0}
                className="cursor-pointer hover:bg-ouro-claro"
                onClick={() => aoAbrir(p.id)}
                onKeyDown={e => {
                  if (e.key === "Enter") aoAbrir(p.id);
                }}
              >
                <td>
                  <b>{p.nome}</b>
                </td>
                <td>{p.ufs.join(", ")}</td>
                <td>
                  {ABREV[p.ult.cargo]} {p.ult.ano}
                </td>
                <td>{p.vit}</td>
                <td>{p.r.length}</td>
                <td>{p.reel}</td>
                <td>{p.anos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="texto-nota">Clique numa linha para ver a carreira acima.</p>
    </VerMais>
  );
}

export function Metodo({ D }: { D: DadosQ10 }) {
  return (
    <VerMais titulo="Como calculamos">
      <ul>
        <li>
          <b>Fonte:</b> TSE, cadastro de candidaturas (<i>consulta_cand</i>) de 2002 a 2024, nos 6 estados.
        </li>
        <li>
          <b>Político:</b> uma pessoa = um título de eleitor. Nunca o CPF (em 2024 o TSE gravou todos como -4).
        </li>
        <li>
          <b>Vitória:</b> eleito, eleito por quociente ou por média. <b>Derrota:</b> foi à urna e não se elegeu.{" "}
          <b>Sem resultado:</b> não chegou à urna (registro negado, renúncia, cassação).
        </li>
        <li>
          <b>Reeleição:</b> eleito para o mesmo cargo, na mesma cidade ou estado, no ciclo seguinte. Vereador que vira
          prefeito não é reeleição.
        </li>
        <li>
          <b>Sobrevivência:</b> de quem ganhou a primeira eleição (estreantes de 2006 em diante), quantos ainda estavam
          eleitos 4, 8, 12 e 16 anos depois. Calculada na view <i>q10_curva_sobrevivencia</i>.
        </li>
        <li>
          <b>Busca:</b> quem se elegeu ao menos uma vez, {int(D.totais.eleitos)} pessoas, com todas as candidaturas
          delas ({int(D.totais.participacoes)} candidaturas de {int(D.totais.pessoas)} pessoas no total). 2026 fica de
          fora até o resultado final.
        </li>
        <li>
          <b>Limite:</b> a carreira só aparece dentro dos 6 estados.
        </li>
      </ul>
    </VerMais>
  );
}
