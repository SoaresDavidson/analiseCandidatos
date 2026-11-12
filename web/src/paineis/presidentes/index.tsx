import { useMemo, useState } from "react";
import { Alternador, Campo, Carregando, Chip, Etiqueta, MapaBrasil, Pagina, VerMais } from "../../componentes";
import { useDados } from "../../lib/dados";
import { brl, fmt, int, nomeLugar } from "../../lib/formato";
import { UF_NOME } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import { type Candidato, COR_OUTROS, candidato, type Linha, patrimonio, placar, turnoFinal } from "./calculo";
import type { DadosPresidentes, Eleicao, Filtros, Turno } from "./tipos";

const PADRAO: Filtros = { ano: 2022, turno: 2, uf: null, sel: null };
const urlFoto = (ano: number, sq: number) => `${import.meta.env.BASE_URL}img/presidentes/${ano}/${sq}.jpg`;
const pct = (v: number) => `${fmt(v, 1)}%`;

export default function Painel() {
  const { dados, erro } = useDados<DadosPresidentes>("presidentes.json");
  if (!dados) return <Carregando erro={erro} />;
  return <Conteudo D={dados} />;
}

function Conteudo({ D }: { D: DadosPresidentes }) {
  const [salvo, setF] = usePersistente<Filtros>("presidentes", PADRAO);
  const E = D.eleicoes.find(e => e.ano === salvo.ano) ?? D.eleicoes[D.eleicoes.length - 1];
  const T = E.turnos.find(t => t.turno === salvo.turno) ?? E.turnos[E.turnos.length - 1];
  const f: Filtros = { ...salvo, ano: E.ano, turno: T.turno };
  const mudar = (p: Partial<Filtros>) => setF(s => ({ ...s, ...p }));

  const cands = useMemo(() => E.cands.map(candidato), [E]);
  const pais = useMemo(() => placar(cands, T.total), [cands, T]);
  const decidiu = T.turno === turnoFinal(E);
  // a posição de cada município nas listas do turno
  const posicao = useMemo(() => new Map(D.municipios.map((m, i) => [m[0], i])), [D]);
  const cores = useMemo(
    () => new Map(D.municipios.map((m, i) => [m[0], T.venc[i] < 0 ? "var(--color-sem-dado)" : cands[T.venc[i]].cor])),
    [D, T, cands],
  );
  const iuf = f.uf ? D.ufs.indexOf(f.uf) : -1;
  const lugar = useMemo(() => (iuf < 0 ? pais : placar(cands, T.uf[iuf])), [iuf, pais, cands, T]);
  const cidade = f.sel != null && posicao.has(f.sel) ? D.municipios[posicao.get(f.sel)!] : null;
  const vencedorEm = (cod: number): { c: Candidato; pct: number } | null => {
    const i = posicao.get(cod);
    return i == null || T.venc[i] < 0 ? null : { c: cands[T.venc[i]], pct: T.pct[i] };
  };
  const [a, b] = pais;

  return (
    <Pagina
      filtros={
        <>
          <Campo rotulo="Eleição" grupo>
            <Alternador
              rotulo="Eleição"
              opcoes={D.eleicoes.map(e => [e.ano, String(e.ano)] as const)}
              valor={f.ano}
              aoMudar={ano => {
                const e = D.eleicoes.find(x => x.ano === ano)!;
                mudar({ ano, turno: turnoFinal(e) });
              }}
            />
          </Campo>
          {E.turnos.length > 1 && (
            <Campo rotulo="Turno" grupo>
              <Alternador
                rotulo="Turno"
                opcoes={E.turnos.map(t => [t.turno, `${t.turno}º turno`] as const)}
                valor={f.turno}
                aoMudar={turno => mudar({ turno })}
              />
            </Campo>
          )}
        </>
      }
    >
      <Etiqueta>PRESIDÊNCIA DA REPÚBLICA</Etiqueta>
      <h1>
        Quem o Brasil escolheu para presidente em {E.ano}
        {E.turnos.length > 1 ? `, no ${T.turno}º turno` : ""}?
      </h1>

      <section className="grid gap-4 rounded-caixa bg-branco px-5 py-5 min-[761px]:px-8">
        <div className="grid items-center gap-x-4 gap-y-4 min-[761px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          {a && <Lado l={a} ano={E.ano} selo={selo(a, E, T, decidiu, 0)} />}
          {b && (
            <span aria-hidden="true" className="justify-self-center text-[28px] font-extrabold text-texto-2">
              ×
            </span>
          )}
          {b && <Lado l={b} ano={E.ano} selo={selo(b, E, T, decidiu, 1)} direita />}
        </div>
        <Faixa linhas={pais} />
        {pais.length > 2 && (
          <div className="flex flex-wrap gap-1.5 text-[13px]">
            {pais.slice(2).map(l => (
              <span key={l.c.sq} className="rounded-full bg-fundo px-3 py-1">
                <b>{l.c.nome}</b> · {l.c.partido} · {pct(l.pct)}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="grid items-center gap-x-8 gap-y-5 min-[901px]:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)]">
        <div className="px-2 pt-1 pb-6">
          <MapaBrasil
            relevo
            pais={cores}
            rotulo={`Mapa do Brasil: quem venceu em cada cidade para presidente em ${E.ano}`}
            uf={f.uf}
            aoEscolherUf={uf => mudar({ uf, sel: null })}
            corUf={uf => placar(cands, T.uf[D.ufs.indexOf(uf)])[0]?.c.cor ?? COR_OUTROS}
            dicaUf={uf => <b>{UF_NOME[uf]}</b>}
            municipios={{
              cor: cod => vencedorEm(cod)?.c.cor ?? "var(--color-sem-dado)",
              sel: f.sel,
              aoEscolher: cod => {
                const i = posicao.get(cod);
                mudar({ sel: cod, uf: i == null ? f.uf : D.ufs[D.municipios[i][2]] });
              },
              dica: cod => {
                const i = posicao.get(cod),
                  v = vencedorEm(cod);
                if (i == null) return "sem dados";
                return (
                  <>
                    <b>
                      {nomeLugar(D.municipios[i][1])} ({D.ufs[D.municipios[i][2]]})
                    </b>
                    <br />
                    {v ? `${v.c.nome} venceu com ${v.pct}% dos votos válidos` : "sem votos no arquivo do TSE"}
                  </>
                );
              },
            }}
          />
        </div>

        <div className="grid content-start gap-3.5 rounded-caixa bg-branco px-5 py-[18px] shadow-cartao">
          <Trilha f={f} cidade={cidade ? nomeLugar(cidade[1]) : null} aoMudar={mudar} />
          {cidade ? (
            <NaCidade nome={nomeLugar(cidade[1])} uf={D.ufs[cidade[2]]} v={vencedorEm(cidade[0])} />
          ) : (
            <Placar titulo={f.uf ? UF_NOME[f.uf] : "Brasil"} linhas={lugar} />
          )}
        </div>
      </section>

      <Eleitos
        D={D}
        ano={E.ano}
        aoEscolher={ano => mudar({ ano, turno: turnoFinal(D.eleicoes.find(e => e.ano === ano)!) })}
      />

      <VerMais titulo="O patrimônio que os mais votados declararam">
        <Bens cands={pais.slice(0, 4).map(l => l.c)} ano={E.ano} />
      </VerMais>
      <VerMais titulo="De onde vêm os dados e como calculamos">
        <ul>
          <li>
            <b>Votos:</b> TSE, votação nominal por município e zona (<i>votacao_candidato_munzona</i>), o arquivo
            nacional de cada eleição, de 2002 a 2026. As porcentagens são sobre os votos válidos: brancos e nulos ficam
            fora.
          </li>
          <li>
            <b>Mapa:</b> cada cidade leva a cor do partido de quem teve mais votos ali, no turno escolhido. O voto de
            quem mora fora do país entra no total do Brasil, não no mapa.
          </li>
          <li>
            <b>Eleito:</b> o mais votado do último turno.
          </li>
          <li>
            <b>Patrimônio:</b> a declaração de bens do registro da candidatura (o TSE publica de 2006 em diante). É o
            valor que o próprio candidato declarou.
          </li>
          <li>
            <b>Fotos:</b> as do registro da candidatura no TSE (não há as de 2002).
          </li>
          <li>
            <b>Fora do banco:</b> a coleta do projeto é por estado, e a eleição de presidente vem num arquivo nacional à
            parte. O script <i>scripts/gerar_painel_presidentes.py</i> busca esses arquivos e faz as contas com SQL
            direto neles.
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}

/** O selo embaixo do nome: eleito, foi ao 2º turno ou nada. */
function selo(l: Linha, E: Eleicao, T: Turno, decidiu: boolean, posicao: number): string | null {
  if (decidiu) return l.c.eleito ? "Eleito" : null;
  return T.turno === 1 && E.turnos.length > 1 && posicao < 2 ? "Foi ao 2º turno" : null;
}

/** Foto do registro no TSE; sem foto, a inicial do nome. */
function Foto({ c, ano, className }: { c: Candidato; ano: number; className: string }) {
  const [falhou, setFalhou] = useState(false);
  return (
    <div
      className={`grid flex-none place-items-center overflow-hidden bg-bege font-extrabold text-texto-2 ${className}`}
      style={{ boxShadow: `0 0 0 3px #fff, 0 0 0 7px ${c.cor}` }}
    >
      {c.foto && !falhou ? (
        <img
          key={c.sq}
          src={urlFoto(ano, c.sq)}
          alt={`Foto de ${c.nome}`}
          className="size-full object-cover object-top"
          onError={() => setFalhou(true)}
        />
      ) : (
        (c.nome[0] || "?").toUpperCase()
      )}
    </div>
  );
}

/** Um dos dois mais votados: a foto, o nome, a parte dos votos válidos e os votos. */
function Lado({ l, ano, selo, direita }: { l: Linha; ano: number; selo: string | null; direita?: boolean }) {
  const bens = patrimonio(l.c);
  return (
    <div className={`flex items-center gap-4 ${direita ? "min-[761px]:flex-row-reverse min-[761px]:text-right" : ""}`}>
      <Foto c={l.c} ano={ano} className="aspect-[3/4] w-[clamp(92px,11vw,138px)] rounded-xl text-5xl" />
      <div className="grid min-w-0 gap-0.5">
        <span className="text-[clamp(20px,2.4vw,28px)] leading-tight font-extrabold">{l.c.nome}</span>
        <span className="text-[13.5px] font-bold text-texto-2">
          {l.c.partido} · {l.c.numero}
        </span>
        <b
          className="text-[clamp(40px,5.6vw,68px)] leading-none font-extrabold tabular-nums"
          style={{ color: l.c.cor }}
        >
          {pct(l.pct)}
        </b>
        <span className="text-[14px] tabular-nums">{int(l.votos)} votos</span>
        {selo && (
          <span
            className={`mt-1 w-fit rounded-full px-3 py-0.5 text-[13px] font-bold ${
              selo === "Eleito" ? "bg-verde-esc text-white" : "bg-ouro-claro text-ouro-esc"
            } ${direita ? "min-[761px]:justify-self-end" : ""}`}
          >
            {selo}
          </span>
        )}
        {bens != null && <span className="text-[12.5px] text-texto-2">declarou {brl(bens)} em bens</span>}
      </div>
    </div>
  );
}

/** Os votos válidos numa faixa só: o mais votado à esquerda, o segundo à direita e os demais no meio. */
function Faixa({ linhas }: { linhas: Linha[] }) {
  if (linhas.length < 2) return null;
  const [a, b, ...resto] = linhas;
  const outros = resto.reduce((s, l) => s + l.pct, 0);
  return (
    <div
      role="img"
      aria-label={`${a.c.nome} ${pct(a.pct)}, ${b.c.nome} ${pct(b.pct)}${outros > 0 ? `, os demais ${pct(outros)}` : ""}`}
      className="relative flex h-7 overflow-hidden rounded-full"
    >
      <i className="h-full transition-[width] duration-700" style={{ width: `${a.pct}%`, background: a.c.cor }} />
      <i className="h-full bg-[#d9d6cf] transition-[width] duration-700" style={{ width: `${outros}%` }} />
      <i className="h-full transition-[width] duration-700" style={{ width: `${b.pct}%`, background: b.c.cor }} />
      {/* a marca da metade dos votos válidos */}
      <span className="absolute inset-y-0 left-1/2 w-0.5 bg-white" />
    </div>
  );
}

function Trilha({ f, cidade, aoMudar }: { f: Filtros; cidade: string | null; aoMudar: (p: Partial<Filtros>) => void }) {
  const passo =
    "cursor-pointer rounded-full border-2 border-ouro bg-white px-2.5 py-0.5 hover:bg-ouro-claro disabled:cursor-default disabled:bg-ouro";
  return (
    <nav aria-label="Lugar escolhido" className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold">
      <button type="button" disabled={!f.uf} onClick={() => aoMudar({ uf: null, sel: null })} className={passo}>
        Brasil
      </button>
      {f.uf && (
        <>
          <span className="text-texto-2">›</span>
          <button type="button" disabled={!cidade} onClick={() => aoMudar({ sel: null })} className={passo}>
            {UF_NOME[f.uf]}
          </button>
        </>
      )}
      {cidade && (
        <>
          <span className="text-texto-2">›</span>
          <span className="rounded-full border-2 border-ouro bg-ouro px-2.5 py-0.5">{cidade}</span>
        </>
      )}
    </nav>
  );
}

/** Os mais votados do país ou de um estado, com barras. */
function Placar({ titulo, linhas }: { titulo: string; linhas: Linha[] }) {
  const mx = linhas[0]?.pct ?? 1;
  return (
    <div className="grid gap-2.5">
      <h2>{titulo}</h2>
      {linhas.length === 0 ? (
        <p className="texto-nota m-0">Sem votos no arquivo do TSE.</p>
      ) : (
        <ol className="m-0 grid list-none gap-2 p-0">
          {linhas.slice(0, 5).map(l => (
            <li key={l.c.sq} className="grid gap-0.5 text-[14.5px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate">
                  <b>{l.c.nome}</b> <span className="text-texto-2">{l.c.partido}</span>
                </span>
                <span className="flex-none tabular-nums">
                  <b>{pct(l.pct)}</b> <span className="text-[12.5px] text-texto-2">{int(l.votos)}</span>
                </span>
              </div>
              <span className="h-3 rounded-[4px] bg-bege">
                <i
                  className="block h-full rounded-[4px] transition-[width] duration-500"
                  style={{ width: `${(100 * l.pct) / mx}%`, background: l.c.cor }}
                />
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function NaCidade({ nome, uf, v }: { nome: string; uf: string; v: { c: Candidato; pct: number } | null }) {
  return (
    <div className="grid gap-2">
      <h2>
        {nome} <span className="font-semibold text-texto-2">({uf})</span>
      </h2>
      {v ? (
        <p className="texto-simples m-0">
          <Chip cor={v.c.cor}>{v.c.partido}</Chip> <b>{v.c.nome}</b> venceu aqui com{" "}
          <b style={{ color: v.c.cor }}>{v.pct}%</b> dos votos válidos.
        </p>
      ) : (
        <p className="texto-nota m-0">Sem votos desta cidade no arquivo do TSE.</p>
      )}
    </div>
  );
}

/** Quem venceu cada eleição: um cartão por ano; clicar troca a eleição da página. */
function Eleitos({ D, ano, aoEscolher }: { D: DadosPresidentes; ano: number; aoEscolher: (ano: number) => void }) {
  return (
    <section className="grid gap-2.5 rounded-caixa bg-branco px-5 py-[18px]">
      <h2>
        Os eleitos, de {D.eleicoes[0].ano} a {D.eleicoes[D.eleicoes.length - 1].ano}
      </h2>
      <div className="rolagem-x">
        <div className="grid min-w-[720px] grid-flow-col auto-cols-fr gap-2.5">
          {D.eleicoes.map(e => {
            const cands = e.cands.map(candidato);
            const final = e.turnos[e.turnos.length - 1];
            const v = placar(cands, final.total)[0];
            const sel = e.ano === ano;
            return (
              <button
                key={e.ano}
                type="button"
                aria-pressed={sel}
                onClick={() => aoEscolher(e.ano)}
                className={`grid cursor-pointer justify-items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-center hover:border-ouro ${
                  sel ? "border-texto bg-fundo" : "border-linha bg-transparent"
                }`}
              >
                <b className="text-[15px]">{e.ano}</b>
                <Foto c={v.c} ano={e.ano} className="size-[62px] rounded-full text-2xl" />
                <span className="text-[13.5px] leading-tight font-extrabold">{v.c.nome}</span>
                <span className="text-[12.5px] text-texto-2">
                  {v.c.partido} · {pct(v.pct)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Os bens declarados pelos mais votados: o total e os três maiores tipos. */
function Bens({ cands, ano }: { cands: Candidato[]; ano: number }) {
  const com = cands.filter(c => c.bens?.length);
  if (!com.length)
    return <p className="texto-nota m-0">O TSE publica a declaração de bens de 2006 em diante: não há a de {ano}.</p>;
  return (
    <div className="grid gap-3 min-[761px]:grid-cols-2">
      {com.map(c => (
        <div key={c.sq} className="grid content-start gap-1 rounded-xl bg-fundo px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <b>
              {c.nome} <span className="font-semibold text-texto-2">{c.partido}</span>
            </b>
            <b className="tabular-nums">{brl(patrimonio(c))}</b>
          </div>
          <ul className="m-0 grid list-none gap-0.5 p-0 text-[13.5px]">
            {c.bens!.slice(0, 3).map(([tipo, valor]) => (
              <li key={tipo} className="flex justify-between gap-3 border-t border-linha pt-0.5">
                <span className="min-w-0 truncate">{tipo || "Sem tipo"}</span>
                <span className="flex-none tabular-nums">{brl(valor)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
