import { useEffect, useMemo, useState } from "react";
import {
  Alternador,
  Botao,
  BuscaComLista,
  Caixa,
  Carregando,
  Etiqueta,
  FotoEleito,
  Pagina,
  SeletorUf,
} from "../../../componentes";
import { nomeProprio } from "../../../lib/formato";
import { useNavegacao } from "../../../lib/navegacao";
import { semAcento, UF_NOME } from "../../../lib/uf";
import { usePersistente } from "../../../lib/usePersistente";
import { CARGO, useEleitos } from "../../candidatos/modelo";
import type { Eleito } from "../../candidatos/tipos";
import { conhecido, hoje, sortear } from "../comum";
import {
  alvoDiario,
  type Casa,
  COLUNAS,
  type Coluna,
  comecouJogo,
  comparar,
  desfoque,
  ESTATISTICAS_ZERO,
  type Estatisticas,
  mediaTentativas,
  msAteAmanha,
  type Resultado,
  relogio,
  TENTATIVAS_FOTO,
  TENTATIVAS_LOCAL,
  textoResultado,
  venceuJogo,
  votosCurto,
} from "./regras";

// Politicodle: o Wordle do eleito. Cada palpite vira uma linha de casas coloridas; verde é
// igual, amarelo é parcial e vermelho é diferente, com seta quando o número do alvo é maior
// ou menor. As regras ficam em ./regras.ts; aqui só a interface.

const CORES_STATUS = {
  igual: "bg-[#5e9e3a] text-white",
  parcial: "bg-ouro text-texto",
  diferente: "bg-[#c0392b] text-white",
} as const;
const TEXTO_STATUS = { igual: "igual ao alvo", parcial: "parcialmente igual", diferente: "diferente do alvo" } as const;

const CABECALHO: Record<Coluna, string> = {
  cargo: "Cargo",
  partido: "Partido",
  uf: "Estado",
  genero: "Gênero",
  cor: "Cor/raça",
  grau: "Escolaridade",
  idade: "Idade",
  votos: "Votos",
};

const chaveDia = (d: string) => `politicodle-dia-${d}`;

export default function Jogo() {
  const { modelo, erro } = useEleitos();
  if (!modelo) return <Carregando erro={erro} />;
  return <Politicodle eleitos={modelo.eleitos} />;
}

function valorCasa(e: Eleito, c: Coluna): string {
  switch (c) {
    case "cargo":
      return CARGO[e.cargo] ?? String(e.cargo);
    case "partido":
      return e.partido;
    case "uf":
      return e.uf;
    case "genero":
      return nomeProprio(e.genero);
    case "cor":
      return nomeProprio(e.cor);
    case "grau":
      return nomeProprio(e.grau);
    case "idade":
      return e.idade == null ? "—" : `${e.idade} anos`;
    case "votos":
      return votosCurto(e.votos);
  }
}

function Politicodle({ eleitos }: { eleitos: Eleito[] }) {
  const [modo, setModo] = useState<"diario" | "livre">("diario");
  const [stats, setStats] = usePersistente<Estatisticas>("politicodle-stats", ESTATISTICAS_ZERO);
  const porId = useMemo(() => new Map(eleitos.map(e => [e.id, e])), [eleitos]);
  const baralho = useMemo(() => eleitos.filter(conhecido), [eleitos]);

  return (
    <Pagina
      filtros={
        <Alternador
          rotulo="Modo de jogo"
          opcoes={[
            ["diario", "Diário"],
            ["livre", "Livre"],
          ]}
          valor={modo}
          aoMudar={setModo}
        />
      }
    >
      <Caixa>
        <Etiqueta>POLITICODLE</Etiqueta>
        <h1 className="m-0 text-[22px] font-extrabold">Quem é o eleito?</h1>
        <p className="m-0 text-texto-2">
          Digite o nome de um eleito. Cada palpite mostra o que ele tem em comum com o escondido: verde é igual, amarelo
          é parecido, vermelho é diferente.
        </p>
        <Placar stats={stats} />
      </Caixa>
      {modo === "diario" ? (
        <Diario eleitos={eleitos} baralho={baralho} porId={porId} setStats={setStats} />
      ) : (
        <Livre baralho={baralho} porId={porId} setStats={setStats} />
      )}
    </Pagina>
  );
}

function Placar({ stats }: { stats: Estatisticas }) {
  const media = mediaTentativas(stats);
  return (
    <p className="m-0 text-[13.5px] text-texto-2" aria-label="Estatísticas">
      Jogos <b>{stats.jogos}</b> · Vitórias <b>{stats.vitorias}</b> · Média{" "}
      <b>{media == null ? "—" : media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</b> tentativas
    </p>
  );
}

type Atualizar = React.Dispatch<React.SetStateAction<Estatisticas>>;

function Diario({
  eleitos,
  baralho,
  porId,
  setStats,
}: {
  eleitos: Eleito[];
  baralho: Eleito[];
  porId: Map<number, Eleito>;
  setStats: Atualizar;
}) {
  const data = hoje();
  const alvo = useMemo(() => alvoDiario(eleitos, data), [eleitos, data]);
  const [dia, setDia] = usePersistente<{ palpites: number[] }>(chaveDia(data), { palpites: [] });
  if (!alvo) return null;
  const palpites = dia.palpites.map(id => porId.get(id)).filter((e): e is Eleito => e != null);

  function palpitar(e: Eleito) {
    const n = dia.palpites.length + 1;
    if (n === 1) setStats(comecouJogo);
    if (e.id === alvo?.id) setStats(s => venceuJogo(s, n));
    setDia({ palpites: [...dia.palpites, e.id] });
  }

  return (
    <Partida
      alvo={alvo}
      palpites={palpites}
      baralho={baralho}
      aoPalpitar={palpitar}
      titulo={`Politicodle ${data}`}
      diario
    />
  );
}

function Livre({ baralho, porId, setStats }: { baralho: Eleito[]; porId: Map<number, Eleito>; setStats: Atualizar }) {
  const [uf, setUf] = useState("TODAS");
  const pool = useMemo(() => baralho.filter(e => uf === "TODAS" || e.uf === uf), [baralho, uf]);
  const [alvoId, setAlvoId] = useState<number | null>(() => sortear(baralho)?.id ?? null);
  const [ids, setIds] = useState<number[]>([]);
  const [desistiu, setDesistiu] = useState(false);

  /** Sorteia outro alvo; ao trocar de estado, passa o novo baralho (o estado ainda não atualizou). */
  function novo(de = pool) {
    setAlvoId(sortear(de)?.id ?? null);
    setIds([]);
    setDesistiu(false);
  }

  const alvo = alvoId == null ? undefined : porId.get(alvoId);
  if (!alvo) return null;
  const palpites = ids.map(id => porId.get(id)).filter((e): e is Eleito => e != null);

  function palpitar(e: Eleito) {
    const n = ids.length + 1;
    if (n === 1) setStats(comecouJogo);
    if (e.id === alvo?.id) setStats(s => venceuJogo(s, n));
    setIds([...ids, e.id]);
  }

  return (
    <>
      <Caixa className="flex flex-wrap items-end gap-3">
        <label className="grid gap-[3px] text-[13px] font-bold">
          Estado do eleito escondido
          <SeletorUf
            value={uf}
            onChange={e => {
              const v = e.target.value;
              setUf(v);
              novo(baralho.filter(t => v === "TODAS" || t.uf === v));
            }}
          />
        </label>
        <Botao onClick={() => novo()}>Novo eleito</Botao>
      </Caixa>
      <Partida
        alvo={alvo}
        palpites={palpites}
        baralho={pool}
        aoPalpitar={palpitar}
        desistiu={desistiu}
        aoDesistir={() => setDesistiu(true)}
        aoRecomecar={() => novo()}
        titulo="Politicodle livre"
      />
    </>
  );
}

function Partida({
  alvo,
  palpites,
  baralho,
  aoPalpitar,
  titulo,
  diario = false,
  desistiu = false,
  aoDesistir,
  aoRecomecar,
}: {
  alvo: Eleito;
  palpites: Eleito[];
  baralho: Eleito[];
  aoPalpitar: (e: Eleito) => void;
  titulo: string;
  diario?: boolean;
  desistiu?: boolean;
  aoDesistir?: () => void;
  aoRecomecar?: () => void;
}) {
  const [texto, setTexto] = useState("");
  // só a linha acabada de chegar vira as casas; as restauradas do dia aparecem prontas
  const [recente, setRecente] = useState<number | null>(null);
  const resultados = useMemo(() => palpites.map(p => comparar(p, alvo)), [palpites, alvo]);
  const venceu = palpites.some(p => p.id === alvo.id);
  const fim = venceu || desistiu;
  const n = palpites.length;
  const borrao = desfoque(n);

  const achados = useMemo(() => {
    const q = semAcento(texto.trim());
    if (q.length < 3) return null;
    const partes = q.split(/\s+/);
    const usados = new Set(palpites.map(p => p.id));
    return baralho
      .filter(e => !usados.has(e.id) && partes.every(p => e.busca.includes(p)))
      .sort((a, b) => (b.votos || 0) - (a.votos || 0))
      .slice(0, 8);
  }, [texto, baralho, palpites]);

  return (
    <>
      <Caixa>
        <Pistas alvo={alvo} n={n} borrao={borrao} fim={fim} />
        {!fim && (
          <>
            <BuscaComLista
              texto={texto}
              aoDigitar={setTexto}
              achados={achados}
              chave={e => e.id}
              rotulo={e => (
                <>
                  <b>{nomeProprio(e.nome)}</b>{" "}
                  <small className="text-texto-2">
                    {CARGO[e.cargo]} · {e.partido} · {e.uf} · {e.ano}
                  </small>
                </>
              )}
              aoEscolher={e => {
                setRecente(e.id);
                aoPalpitar(e);
              }}
              vazio="Ninguém com esse nome entre os eleitos."
              placeholder="Digite o nome de um eleito (3 letras ou mais)"
              ariaLabel="Buscar eleito pelo nome"
              alturaLista="max-h-[300px]"
            />
            {aoDesistir && n > 0 && (
              <Botao className="justify-self-start bg-bege hover:bg-linha" onClick={aoDesistir}>
                Desistir
              </Botao>
            )}
          </>
        )}
        <p className="m-0 text-[13.5px] text-texto-2" aria-live="polite">
          {n === 0 ? "Sem limite de tentativas." : `${n} ${n === 1 ? "tentativa" : "tentativas"}.`}
        </p>
      </Caixa>

      {fim && (
        <Vitoria
          alvo={alvo}
          venceu={venceu}
          n={n}
          diario={diario}
          texto={textoResultado(titulo, resultados)}
          aoRecomecar={aoRecomecar}
        />
      )}

      {palpites.length > 0 && <Grade palpites={palpites} resultados={resultados} recente={recente} />}
      <Legenda />
    </>
  );
}

function Pistas({ alvo, n, borrao, fim }: { alvo: Eleito; n: number; borrao: number | null; fim: boolean }) {
  const local = n >= TENTATIVAS_LOCAL;
  return (
    <div className="flex flex-wrap items-center gap-4" aria-live="polite">
      <div
        className="overflow-hidden rounded-full"
        style={{ filter: fim ? "none" : borrao == null ? undefined : `blur(${borrao}px)` }}
      >
        {borrao != null || fim ? (
          <FotoEleito ano={alvo.ano} sq={alvo.sq} nome={fim ? alvo.nome : "Eleito escondido"} className="size-24" />
        ) : (
          <div className="grid size-24 place-items-center rounded-full bg-bege text-[34px] font-extrabold text-texto-2">
            ?
          </div>
        )}
      </div>
      <ul className="m-0 grid list-none gap-1.5 p-0 text-[14px]">
        <li className={local ? "font-bold" : "text-texto-2"}>
          {local
            ? `Pista 1: eleito em ${alvo.local}`
            : `Pista 1: o município aparece em ${TENTATIVAS_LOCAL - n} ${TENTATIVAS_LOCAL - n === 1 ? "tentativa" : "tentativas"}`}
        </li>
        <li className={borrao != null ? "font-bold" : "text-texto-2"}>
          {borrao != null
            ? "Pista 2: a foto desfoca menos a cada tentativa"
            : `Pista 2: a foto aparece em ${TENTATIVAS_FOTO - n} tentativas`}
        </li>
      </ul>
    </div>
  );
}

const ANIMACAO = `@keyframes pcd-vira{from{transform:rotateX(90deg);opacity:0}60%{transform:rotateX(-12deg);opacity:1}to{transform:rotateX(0)}}`;

function Grade({
  palpites,
  resultados,
  recente,
}: {
  palpites: Eleito[];
  resultados: Resultado[];
  recente: number | null;
}) {
  // palpite mais novo no topo
  const ordem = palpites.map((_, i) => palpites.length - 1 - i);
  return (
    <Caixa className="overflow-x-auto">
      <style>{ANIMACAO}</style>
      <table className="w-full min-w-[820px] border-separate border-spacing-1 text-center text-[13.5px]">
        <thead>
          <tr className="text-[12px] text-texto-2">
            <th className="px-1 text-left">Eleito</th>
            {COLUNAS.map(c => (
              <th key={c} scope="col" className="px-1">
                {CABECALHO[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordem.map(i => {
            const p = palpites[i];
            const anima = p.id === recente;
            return (
              <tr key={p.id}>
                <th scope="row" className="min-w-[150px] px-1 text-left font-bold">
                  <span className="flex items-center gap-2">
                    <FotoEleito ano={p.ano} sq={p.sq} nome={p.nome} className="size-10" />
                    <span className="leading-tight">{nomeProprio(p.nome)}</span>
                  </span>
                </th>
                {COLUNAS.map((c, k) => (
                  <CasaCelula
                    key={c}
                    casa={resultados[i][c]}
                    valor={valorCasa(p, c)}
                    atraso={anima ? k * 0.35 : null}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Caixa>
  );
}

function CasaCelula({ casa, valor, atraso }: { casa: Casa; valor: string; atraso: number | null }) {
  const seta = casa.seta === "cima" ? "↑" : casa.seta === "baixo" ? "↓" : "";
  const dica = casa.seta ? `, o alvo é ${casa.seta === "cima" ? "maior" : "menor"}` : "";
  return (
    <td className="p-0 [perspective:600px]">
      <div
        className={`grid h-14 place-items-center rounded-md px-1 font-bold leading-tight ${CORES_STATUS[casa.status]} ${atraso == null ? "" : "motion-safe:animate-[pcd-vira_.55s_ease-out_both]"}`}
        style={atraso == null ? undefined : { animationDelay: `${atraso}s` }}
        aria-label={`${valor}: ${TEXTO_STATUS[casa.status]}${dica}`}
      >
        <span>
          {valor} {seta && <span className="text-[17px]">{seta}</span>}
        </span>
      </div>
    </td>
  );
}

function Legenda() {
  const itens: [keyof typeof CORES_STATUS, string][] = [
    ["igual", "Igual"],
    ["parcial", "Parcial (mesma esfera, mesma ala, ±5 anos, até 2× nos votos)"],
    ["diferente", "Diferente"],
  ];
  return (
    <Caixa>
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[13.5px]">
        {itens.map(([s, t]) => (
          <li key={s} className="flex items-center gap-2">
            <span className={`inline-block size-4 rounded ${CORES_STATUS[s]}`} aria-hidden="true" />
            {t}
          </li>
        ))}
        <li>↑ o alvo é maior · ↓ o alvo é menor</li>
      </ul>
    </Caixa>
  );
}

function Vitoria({
  alvo,
  venceu,
  n,
  diario,
  texto,
  aoRecomecar,
}: {
  alvo: Eleito;
  venceu: boolean;
  n: number;
  diario: boolean;
  texto: string;
  aoRecomecar?: () => void;
}) {
  const { abrirCandidato } = useNavegacao();
  const [copiado, setCopiado] = useState<"sim" | "erro" | null>(null);
  const [falta, setFalta] = useState(msAteAmanha());
  useEffect(() => {
    if (!diario) return;
    const t = setInterval(() => setFalta(msAteAmanha()), 1000);
    return () => clearInterval(t);
  }, [diario]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado("sim");
    } catch {
      setCopiado("erro");
    }
  }

  return (
    <Caixa
      className="border-2 border-ouro motion-safe:animate-[pcd-vira_.5s_ease-out_both]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-4">
        <FotoEleito ano={alvo.ano} sq={alvo.sq} nome={alvo.nome} className="size-24" />
        <div className="grid gap-1">
          <b className="text-[19px]">
            {venceu ? `Acertou em ${n} ${n === 1 ? "tentativa" : "tentativas"}!` : "Era este eleito"}
          </b>
          <span className="text-[17px] font-extrabold">{nomeProprio(alvo.nome)}</span>
          <span className="text-texto-2">
            {CARGO[alvo.cargo]} · {alvo.partido} · {alvo.local}, {UF_NOME[alvo.uf] ?? alvo.uf} · {alvo.ano}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Botao onClick={() => abrirCandidato(alvo.ano, alvo.sq)}>Abrir a ficha</Botao>
        {diario && venceu && <Botao onClick={copiar}>Copiar resultado</Botao>}
        {!diario && aoRecomecar && <Botao onClick={aoRecomecar}>Novo eleito</Botao>}
        {copiado && (
          <span className="text-[13.5px]" aria-live="polite">
            {copiado === "sim" ? "Copiado!" : "Não deu para copiar."}
          </span>
        )}
      </div>
      {diario && (
        <p className="m-0 text-texto-2">
          Próximo eleito do dia em <b className="tabular-nums">{relogio(falta)}</b>.
        </p>
      )}
    </Caixa>
  );
}
