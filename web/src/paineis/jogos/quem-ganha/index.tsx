import { useEffect, useMemo, useState } from "react";
import {
  Alternador,
  Botao,
  Caixa,
  Carregando,
  Etiqueta,
  FotoEleito,
  Pagina,
  Seletor,
  SeletorUf,
} from "../../../componentes";
import { Campo } from "../../../componentes/Pagina";
import { useNavegacao } from "../../../lib/navegacao";
import { UF_NOME } from "../../../lib/uf";
import { usePersistente } from "../../../lib/usePersistente";
import { CARGO, useEleitos } from "../../candidatos/modelo";
import type { Eleito } from "../../candidatos/tipos";
import { acertou, CRITERIOS, MISTURADO, novaRodada, type Rodada } from "./regras";

// "Quem ganha?": duas cartas, um critério, e o jogador aponta quem tem mais. A sequência
// de acertos vale como pontuação; errou, acabou. Regras e sorteio ficam em regras.ts.

const DURACAO_CONTAGEM = 900;

interface Config {
  modo: string;
  uf: string;
  /** "sim": quem venceu fica e um desafiante entra */
  classico: "sim" | "nao";
}
const CONFIG_PADRAO: Config = { modo: MISTURADO, uf: "TODAS", classico: "sim" };

/** Número que sobe de 0 até `alvo` (rAF); sem animação com "reduzir movimento" ou `ativo` falso. */
function useContagem(alvo: number, ativo: boolean): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!ativo) return;
    const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let quadro = 0;
    const ini = performance.now();
    const passo = (t: number) => {
      const x = reduzido ? 1 : Math.min(1, (t - ini) / DURACAO_CONTAGEM);
      setP(x);
      if (x < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(quadro);
      setP(0);
    };
  }, [ativo]);
  return ativo ? alvo * (1 - (1 - p) ** 3) : alvo;
}

type Estado = "verde" | "vermelho" | "neutro";

function Carta({
  e,
  rodada,
  revelado,
  estado,
  vencedor,
  desabilitada,
  aoEscolher,
  aoAbrir,
}: {
  e: Eleito;
  rodada: Rodada;
  revelado: boolean;
  estado: Estado;
  vencedor: boolean;
  desabilitada: boolean;
  aoEscolher: () => void;
  aoAbrir: () => void;
}) {
  const valor = rodada.criterio.valor(e) as number;
  const contado = useContagem(valor, revelado);
  const cor =
    estado === "verde"
      ? "border-verde-esc bg-verde-claro"
      : estado === "vermelho"
        ? "border-capital bg-[#fbe6e3]"
        : "border-ouro-borda bg-branco";
  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={aoEscolher}
        disabled={desabilitada}
        aria-label={`Escolher ${e.nome}`}
        className={`grid cursor-pointer justify-items-center gap-2 rounded-caixa border-4 p-4 text-center transition-transform enabled:hover:border-ouro motion-safe:enabled:hover:-translate-y-1 motion-safe:enabled:active:scale-[.98] disabled:cursor-default ${cor} ${vencedor ? "motion-safe:animate-pulse" : ""}`}
      >
        <FotoEleito ano={e.ano} sq={e.sq} nome={e.nome} className="size-32 sm:size-40 text-5xl" />
        <b className="text-lg leading-tight">{e.nome}</b>
        <span className="text-[14px] text-texto-2">
          {CARGO[e.cargo]} · {e.local === UF_NOME[e.uf] ? e.uf : `${e.local}/${e.uf}`} · {e.ano}
        </span>
        <span className="rounded-full bg-bege px-3 py-0.5 text-[13px] font-bold">{e.partido}</span>
        <span
          className={`min-h-9 text-2xl font-extrabold tabular-nums ${revelado ? "" : "text-texto-2"}`}
          aria-hidden={!revelado}
        >
          {revelado ? rodada.criterio.formatar(contado) : "?"}
        </span>
      </button>
      {revelado && (
        <Botao onClick={aoAbrir} className="bg-branco! border-2! border-ouro! text-[14px]">
          Ver a ficha
        </Botao>
      )}
    </div>
  );
}

function Partida({
  eleitos,
  config,
  recorde,
  aoBater,
}: {
  eleitos: readonly Eleito[];
  config: Config;
  recorde: number;
  aoBater: (n: number) => void;
}) {
  const { abrirCandidato } = useNavegacao();
  const classico = config.classico === "sim";
  const pedir = (sequencia: number, fixo?: Eleito) =>
    novaRodada({ eleitos, modo: config.modo, uf: config.uf, sequencia, fixo });
  const [rodada, setRodada] = useState<Rodada | null>(() => pedir(0));
  const [sequencia, setSequencia] = useState(0);
  const [escolha, setEscolha] = useState<"a" | "b" | null>(null);
  const [partida, setPartida] = useState(0);

  if (!rodada) return <Caixa>Não há eleitos suficientes para este filtro.</Caixa>;

  const va = rodada.criterio.valor(rodada.a) as number;
  const vb = rodada.criterio.valor(rodada.b) as number;
  const revelado = escolha != null;
  const certo = escolha != null && acertou(va, vb, escolha);
  const fim = revelado && !certo;
  const lado = va > vb ? "a" : "b";

  function escolher(l: "a" | "b") {
    if (escolha) return;
    setEscolha(l);
    if (acertou(va, vb, l)) {
      const nova = sequencia + 1;
      setSequencia(nova);
      if (nova > recorde) aoBater(nova);
    }
  }

  function proxima() {
    if (!rodada) return;
    const vencedor = lado === "a" ? rodada.a : rodada.b;
    const nova = pedir(sequencia, classico ? vencedor : undefined) ?? pedir(sequencia);
    setRodada(nova);
    setEscolha(null);
  }

  function reiniciar() {
    setRodada(pedir(0));
    setSequencia(0);
    setEscolha(null);
    setPartida(p => p + 1);
  }

  const estadoDe = (l: "a" | "b"): Estado => (!revelado ? "neutro" : l === lado ? "verde" : "vermelho");

  return (
    <>
      <Caixa className="justify-items-center text-center">
        <Etiqueta>{rodada.grupo.rotulo.toUpperCase()}</Etiqueta>
        <h2 className="m-0 text-2xl font-extrabold sm:text-3xl">{rodada.criterio.pergunta}</h2>
        <p className="m-0 text-[15px] font-bold" aria-label="Placar">
          Sequência {sequencia} · Recorde {recorde}
        </p>
      </Caixa>

      <div key={partida} className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
        <Carta
          e={rodada.a}
          rodada={rodada}
          revelado={revelado}
          estado={estadoDe("a")}
          vencedor={revelado && lado === "a"}
          desabilitada={revelado}
          aoEscolher={() => escolher("a")}
          aoAbrir={() => abrirCandidato(rodada.a.ano, rodada.a.sq)}
        />
        <span
          aria-hidden="true"
          className="grid size-12 place-items-center self-center justify-self-center rounded-full bg-verde-esc font-extrabold text-white"
        >
          VS
        </span>
        <Carta
          e={rodada.b}
          rodada={rodada}
          revelado={revelado}
          estado={estadoDe("b")}
          vencedor={revelado && lado === "b"}
          desabilitada={revelado}
          aoEscolher={() => escolher("b")}
          aoAbrir={() => abrirCandidato(rodada.b.ano, rodada.b.sq)}
        />
      </div>

      <div role="status" aria-live="polite" className="grid justify-items-center gap-3 text-center">
        {!revelado && <p className="m-0 text-texto-2">Clique na carta que você acha que ganha.</p>}
        {certo && (
          <>
            <p className="m-0 text-xl font-extrabold text-verde-esc">Acertou! Sequência {sequencia}.</p>
            <Botao onClick={proxima} autoFocus>
              Próxima
            </Botao>
          </>
        )}
        {fim && (
          <Caixa className="w-full max-w-md justify-items-center">
            <p className="m-0 text-xl font-extrabold text-capital">Errou! Fim de jogo.</p>
            <p className="m-0">
              Você fez <b>{sequencia}</b> {sequencia === 1 ? "acerto" : "acertos"} seguidos. Recorde: <b>{recorde}</b>.
            </p>
            <Botao onClick={reiniciar} autoFocus>
              Jogar de novo
            </Botao>
          </Caixa>
        )}
      </div>
    </>
  );
}

export default function Jogo() {
  const { modelo, erro } = useEleitos();
  const [config, setConfig] = usePersistente<Config>("quem-ganha:config", CONFIG_PADRAO);
  const [rec, setRec] = usePersistente<{ porModo: Record<string, number> }>("quem-ganha:recordes", { porModo: {} });
  const eleitos = useMemo(() => modelo?.eleitos ?? [], [modelo]);

  if (erro) return <Pagina>{<Caixa>Não foi possível carregar os dados.</Caixa>}</Pagina>;
  if (!modelo) return <Carregando />;

  const recorde = rec.porModo[config.modo] ?? 0;
  const filtros = (
    <>
      <Campo rotulo="Critério">
        <Seletor value={config.modo} onChange={e => setConfig(c => ({ ...c, modo: e.target.value }))}>
          <option value={MISTURADO}>Misturado</option>
          {CRITERIOS.map(c => (
            <option key={c.id} value={c.id}>
              {c.pergunta.replace("Quem ", "").replace("?", "").replace("MAIS ", "mais ")}
            </option>
          ))}
        </Seletor>
      </Campo>
      <Campo rotulo="Estado">
        <SeletorUf value={config.uf} onChange={e => setConfig(c => ({ ...c, uf: e.target.value }))} />
      </Campo>
      <Campo rotulo="Quem acerta" grupo>
        <Alternador
          rotulo="Quem acerta"
          valor={config.classico}
          aoMudar={classico => setConfig(c => ({ ...c, classico }))}
          opcoes={[
            ["sim", "Fica na mesa"],
            ["nao", "Dois novos"],
          ]}
        />
      </Campo>
    </>
  );

  return (
    <Pagina filtros={filtros}>
      <Partida
        key={`${config.modo}|${config.uf}|${config.classico}`}
        eleitos={eleitos}
        config={config}
        recorde={recorde}
        aoBater={n => setRec(r => ({ porModo: { ...r.porModo, [config.modo]: n } }))}
      />
    </Pagina>
  );
}
