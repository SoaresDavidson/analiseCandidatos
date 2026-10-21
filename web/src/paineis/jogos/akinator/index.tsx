import { type ReactNode, useMemo, useState } from "react";
import {
  Alternador,
  Botao,
  BuscaComLista,
  Caixa,
  Carregando,
  Etiqueta,
  FotoEleito,
  Pagina,
} from "../../../componentes";
import { fmt } from "../../../lib/formato";
import { useNavegacao } from "../../../lib/navegacao";
import { semAcento } from "../../../lib/uf";
import { usePersistente } from "../../../lib/usePersistente";
import { CARGO, useEleitos } from "../../candidatos/modelo";
import type { Eleito } from "../../candidatos/tipos";
import { conhecido } from "../comum";
import {
  deveChutar,
  discordancias,
  ERROS_PARA_REVELAR,
  gerarPerguntas,
  melhorChute,
  melhorPergunta,
  type Pergunta,
  penalidades,
  RESPOSTAS,
  type Resposta,
  vivos,
} from "./logica";

type Baralho = "conhecidos" | "todos";
type Fase = "jogando" | "acertou" | "revelar" | "revelado";

interface Partida {
  respostas: Resposta[];
  /** ids de eleitos já chutados e descartados */
  excluidos: number[];
  /** quantas respostas havia no último chute (o próximo vem 20 perguntas depois) */
  ultimoChute: number;
  errados: number;
  fase: Fase;
  revelado: Eleito | null;
}

const NOVA: Partida = { respostas: [], excluidos: [], ultimoChute: 0, errados: 0, fase: "jogando", revelado: null };

const ROTULO_RESPOSTA = new Map<number, string>(RESPOSTAS.map(r => [r.valor, r.rotulo]));

/** Cor do botão pela resposta: verde para sim, bege neutro, vermelho-terra para não. */
const COR_RESPOSTA: Record<number, string> = {
  1: "border-verde-esc bg-verde-esc text-white hover:bg-[#4b6410]",
  0.5: "border-verde bg-verde-claro hover:bg-[#e2edbb]",
  0: "border-linha bg-bege hover:bg-[#dedbd5]",
  [-0.5]: "border-[#e0a79f] bg-[#fbeceb] hover:bg-[#f6d9d6]",
  [-1]: "border-capital bg-capital text-white hover:bg-[#a53125]",
};

function Genio({ children, vivo }: { children: ReactNode; vivo?: boolean }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-5">
      <div
        aria-hidden="true"
        className={`grid size-20 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff6d6,#ebb400)] text-5xl shadow-cartao sm:size-28 sm:text-7xl ${vivo ? "motion-safe:animate-pulse" : ""}`}
      >
        🔮
      </div>
      <div className="relative rounded-2xl border-2 border-ouro bg-ouro-claro px-4 py-3.5 before:absolute before:top-1/2 before:-left-[9px] before:size-4 before:-translate-y-1/2 before:rotate-45 before:border-b-2 before:border-l-2 before:border-ouro before:bg-ouro-claro motion-safe:animate-sobe">
        {children}
      </div>
    </div>
  );
}

function Ficha({ e }: { e: Eleito }) {
  return (
    <div className="flex items-center gap-4">
      <FotoEleito ano={e.ano} sq={e.sq} nome={e.nome} className="size-28 text-4xl sm:size-36" />
      <div className="grid min-w-0 gap-0.5">
        <b className="text-xl">{e.nome}</b>
        <span>{CARGO[e.cargo]}</span>
        <span className="text-texto-2">
          {e.local} ({e.uf}) · {e.ano}
        </span>
        <span className="font-bold text-verde-esc">{e.partido}</span>
      </div>
    </div>
  );
}

export default function Jogo() {
  const { modelo, erro } = useEleitos();
  const { abrirCandidato } = useNavegacao();
  const [cfg, setCfg] = usePersistente("jogo-akinator", {
    baralho: "conhecidos" as Baralho,
    genio: 0,
    jogador: 0,
    contagem: true,
  });
  const [partida, setPartida] = useState<Partida>(NOVA);
  const [busca, setBusca] = useState("");

  const pool = useMemo(
    () => (modelo ? (cfg.baralho === "todos" ? modelo.eleitos : modelo.eleitos.filter(conhecido)) : []),
    [modelo, cfg.baralho],
  );
  const perguntas = useMemo(() => gerarPerguntas(pool), [pool]);
  const porId = useMemo(() => new Map(perguntas.map(p => [p.id, p])), [perguntas]);

  const { respostas, excluidos, ultimoChute } = partida;
  const proposta = useMemo(() => {
    const pens = penalidades(pool, porId, respostas, new Set(excluidos));
    const vs = vivos(pool, pens);
    if (!vs.length) return { vivos: 0, pergunta: null, chute: null };
    const pergunta = melhorPergunta(vs, perguntas, new Set(respostas.map(r => r.id)));
    const chuta = deveChutar({
      vivos: vs.length,
      haPergunta: pergunta !== null,
      respondidas: respostas.length,
      ultimoChute,
    });
    return { vivos: vs.length, pergunta: chuta ? null : pergunta, chute: chuta ? melhorChute(pool, pens, vs) : null };
  }, [pool, porId, perguntas, respostas, excluidos, ultimoChute]);

  if (erro) return <p className="p-5">Não foi possível carregar os dados dos eleitos.</p>;
  if (!modelo) return <Carregando />;

  const mudar = (p: Partial<Partida>) => setPartida(a => ({ ...a, ...p }));
  const responder = (valor: number) => {
    if (proposta.pergunta) mudar({ respostas: [...respostas, { id: proposta.pergunta.id, valor }] });
  };
  const desfazer = () => {
    const rs = respostas.slice(0, -1);
    mudar({ respostas: rs, ultimoChute: Math.min(ultimoChute, rs.length), fase: "jogando" });
  };
  const recomecar = () => {
    setPartida(NOVA);
    setBusca("");
  };
  const acertou = () => {
    mudar({ fase: "acertou" });
    setCfg(c => ({ ...c, genio: c.genio + 1 }));
  };
  const errou = (e: Eleito) =>
    mudar({ excluidos: [...excluidos, e.id], ultimoChute: respostas.length, errados: partida.errados + 1 });
  const revelar = (e: Eleito) => {
    mudar({ fase: "revelado", revelado: e });
    setCfg(c => ({ ...c, jogador: c.jogador + 1 }));
  };

  const achados = (() => {
    const q = semAcento(busca.trim());
    if (q.length < 3) return null;
    const partes = q.split(/\s+/);
    return pool
      .filter(e => partes.every(p => e.busca.includes(p)))
      .sort((a, b) => (b.votos ?? 0) - (a.votos ?? 0))
      .slice(0, 8);
  })();

  const jogando = partida.fase === "jogando";
  const semOpcoes = jogando && !proposta.pergunta && !proposta.chute;
  const podeRevelar = jogando && (partida.errados >= ERROS_PARA_REVELAR || semOpcoes);
  const progresso = Math.round((1 - proposta.vivos / pool.length) * 100);

  const filtros = (
    <>
      <label className="grid gap-[3px] text-[13px] font-bold">
        <span>Baralho</span>
        <Alternador
          rotulo="Baralho"
          valor={cfg.baralho}
          aoMudar={baralho => {
            setCfg(c => ({ ...c, baralho }));
            recomecar();
          }}
          opcoes={[
            ["conhecidos", "Prefeitos, deputados, governadores e senadores"],
            ["todos", "Todos, com vereadores"],
          ]}
        />
      </label>
      <label className="flex items-center gap-2 pb-2 text-[13px] font-bold">
        <input
          type="checkbox"
          checked={cfg.contagem}
          onChange={ev => setCfg(c => ({ ...c, contagem: ev.target.checked }))}
        />
        Mostrar candidatos possíveis
      </label>
    </>
  );

  return (
    <Pagina filtros={filtros}>
      <Caixa className="gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Etiqueta>
            {jogando ? `PERGUNTA ${respostas.length + 1}` : partida.fase === "acertou" ? "ACERTEI" : "FIM DE JOGO"}
          </Etiqueta>
          <span className="text-[13.5px] font-bold" aria-label="Placar">
            🔮 Gênio {cfg.genio} × {cfg.jogador} Você
          </span>
        </div>

        {cfg.contagem && jogando && proposta.vivos > 0 && (
          <div className="grid gap-1">
            <div
              className="h-2 overflow-hidden rounded-full bg-bege"
              role="progressbar"
              aria-label="Candidatos eliminados"
              aria-valuenow={progresso}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-verde transition-[width] duration-500" style={{ width: `${progresso}%` }} />
            </div>
            <small className="text-texto-2">Candidatos possíveis: {fmt(proposta.vivos, 0)}</small>
          </div>
        )}

        {respostas.length === 0 && jogando && (
          <p className="m-0 text-texto-2">
            Pense em um eleito do baralho escolhido e responda com sinceridade. Se errar uma resposta, o gênio tolera.
          </p>
        )}

        <div aria-live="polite">
          {jogando && proposta.pergunta && (
            <Genio vivo>
              <p key={proposta.pergunta.id} className="m-0 text-lg font-bold">
                {proposta.pergunta.texto}
              </p>
            </Genio>
          )}

          {jogando && proposta.chute && (
            <div className="grid gap-4">
              <Genio vivo>
                <p className="m-0 text-lg font-bold">Acho que é este eleito. Acertei?</p>
              </Genio>
              <Ficha e={proposta.chute} />
            </div>
          )}

          {semOpcoes && (
            <Genio>
              <p className="m-0 text-lg font-bold">Desisto! Não sobrou ninguém que combine com as suas respostas.</p>
            </Genio>
          )}

          {partida.fase === "acertou" && proposta.chute && (
            <div className="grid gap-4">
              <Genio>
                <p className="m-0 text-lg font-bold">Acertou! Eu sabia.</p>
              </Genio>
            </div>
          )}

          {partida.fase === "revelado" && partida.revelado && (
            <Genio>
              <p className="m-0 text-lg font-bold">Você venceu o gênio! Era {partida.revelado.nome}.</p>
            </Genio>
          )}
        </div>

        {jogando && proposta.pergunta && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {RESPOSTAS.map(r => (
              <button
                key={r.valor}
                type="button"
                onClick={() => responder(r.valor)}
                className={`cursor-pointer rounded-lg border-2 px-2 py-2.5 font-bold motion-safe:transition-transform motion-safe:active:scale-95 ${COR_RESPOSTA[r.valor]} ${r.valor === 0 ? "col-span-2 sm:col-span-1" : ""}`}
              >
                {r.rotulo}
              </button>
            ))}
          </div>
        )}

        {jogando && proposta.chute && (
          <div className="flex flex-wrap gap-2">
            <Botao onClick={acertou}>Acertou!</Botao>
            <Botao className="bg-bege hover:bg-[#dedbd5]" onClick={() => errou(proposta.chute as Eleito)}>
              Não é
            </Botao>
          </div>
        )}

        {partida.fase === "acertou" && proposta.chute && (
          <div className="grid gap-4">
            <Ficha e={proposta.chute} />
            <div className="flex flex-wrap gap-2">
              <Botao onClick={() => abrirCandidato((proposta.chute as Eleito).ano, (proposta.chute as Eleito).sq)}>
                Abrir a ficha
              </Botao>
              <Botao className="bg-bege hover:bg-[#dedbd5]" onClick={recomecar}>
                Jogar de novo
              </Botao>
            </div>
          </div>
        )}

        {(podeRevelar || partida.fase === "revelar") && (
          <div className="grid gap-2 rounded-xl bg-fundo p-4">
            <b>Quem era? Busque o eleito para ver onde as respostas discordaram dos dados.</b>
            <BuscaComLista
              texto={busca}
              aoDigitar={setBusca}
              achados={achados}
              chave={e => e.id}
              rotulo={e => (
                <>
                  <b>{e.nome}</b>{" "}
                  <small className="text-texto-2">
                    {CARGO[e.cargo]} · {e.partido} · {e.local} ({e.uf}) · {e.ano}
                  </small>
                </>
              )}
              aoEscolher={revelar}
              vazio="Ninguém com esse nome no baralho."
              placeholder="Buscar eleito pelo nome"
              ariaLabel="Buscar quem era o eleito"
              alturaLista="max-h-[300px]"
            />
          </div>
        )}

        {partida.fase === "revelado" && partida.revelado && (
          <div className="grid gap-4">
            <Ficha e={partida.revelado} />
            <Discordancias e={partida.revelado} porId={porId} respostas={respostas} />
            <div className="flex flex-wrap gap-2">
              <Botao onClick={() => abrirCandidato(partida.revelado?.ano ?? 0, partida.revelado?.sq ?? 0)}>
                Abrir a ficha
              </Botao>
              <Botao className="bg-bege hover:bg-[#dedbd5]" onClick={recomecar}>
                Jogar de novo
              </Botao>
            </div>
          </div>
        )}

        {jogando && (
          <div className="flex flex-wrap gap-2 border-t border-linha pt-3">
            <button
              type="button"
              disabled={respostas.length === 0}
              onClick={desfazer}
              className="cursor-pointer rounded-lg border-2 border-ouro bg-white px-3 py-1.5 font-bold enabled:hover:bg-ouro-claro disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↶ Desfazer última resposta
            </button>
            <button
              type="button"
              onClick={recomecar}
              className="cursor-pointer rounded-lg border-2 border-ouro bg-white px-3 py-1.5 font-bold hover:bg-ouro-claro"
            >
              Recomeçar
            </button>
            {!podeRevelar && respostas.length > 0 && (
              <button
                type="button"
                onClick={() => mudar({ fase: "revelar" })}
                className="cursor-pointer border-0 bg-transparent px-2 py-1.5 text-texto-2 underline"
              >
                Desisto, quem era?
              </button>
            )}
          </div>
        )}
      </Caixa>
    </Pagina>
  );
}

function Discordancias({
  e,
  porId,
  respostas,
}: {
  e: Eleito;
  porId: ReadonlyMap<string, Pergunta>;
  respostas: Resposta[];
}) {
  const lista = discordancias(e, porId, respostas);
  if (!lista.length)
    return <p className="m-0">As suas respostas combinam com {e.nome}: o gênio é que se enrolou nas perguntas.</p>;
  return (
    <div className="grid gap-1.5">
      <b>Onde as respostas discordaram dos dados:</b>
      <ul className="m-0 grid gap-1 pl-5">
        {lista.map(d => (
          <li key={d.pergunta.id}>
            {d.pergunta.texto} Você disse <b>{ROTULO_RESPOSTA.get(d.valor)}</b>; nos dados, a resposta é{" "}
            <b>{d.correta ? "sim" : "não"}</b>.
          </li>
        ))}
      </ul>
    </div>
  );
}
