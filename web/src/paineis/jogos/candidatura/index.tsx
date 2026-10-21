import { Alternador, Botao, Caixa, Etiqueta } from "../../../componentes";
import { usePersistente } from "../../../lib/usePersistente";
import { calcularNota, NIVEIS, PROPOSTAS } from "./logica";
import { Resultado } from "./Resultado";

// Jogo "Monte sua candidatura": perfil, dez propostas (uma por tela) e o resultado.

const N = PROPOSTAS.length;
const DIRECOES = PROPOSTAS.map(p => p.direcao);

interface Estado {
  nome: string;
  cargo: 11 | 13;
  /** −2..+2, ou null se ainda não respondeu */
  respostas: (number | null)[];
  /** −1 = perfil, 0..N−1 = proposta, N = resultado */
  etapa: number;
}

const INICIAL: Estado = { nome: "", cargo: 11, respostas: Array(N).fill(null), etapa: -1 };
const CARGOS = [
  [11, "Prefeito"],
  [13, "Vereador"],
] as const;

export default function Jogo() {
  const [s, setS] = usePersistente<Estado>("jogo-candidatura", INICIAL);
  // dado salvo de uma versão antiga ou corrompido: volta ao início
  const valido = Array.isArray(s.respostas) && s.respostas.length === N && s.etapa >= -1 && s.etapa <= N;
  const e = valido ? s : INICIAL;
  const cargo = e.cargo === 13 ? "vereador" : "prefeito";

  const ir = (etapa: number) => setS({ ...e, etapa });
  const responder = (i: number, v: number) => {
    const respostas = e.respostas.slice();
    respostas[i] = v;
    setS({ ...e, respostas, etapa: i + 1 });
  };

  if (e.etapa === N && e.respostas.every(r => r != null)) {
    const nota = calcularNota(
      DIRECOES,
      e.respostas.map(r => r ?? 0),
    );
    return (
      <main className="mx-auto max-w-pagina px-5 pt-4 pb-16">
        <Resultado nota={nota} nome={e.nome.trim()} cargo={cargo} aoRefazer={() => setS(INICIAL)} />
      </main>
    );
  }

  if (e.etapa < 0 || e.etapa >= N) {
    return (
      <main className="mx-auto grid max-w-[620px] gap-4 px-5 pt-[22px] pb-16">
        <Caixa className="motion-safe:animate-sobe">
          <Etiqueta>MONTE SUA CANDIDATURA</Etiqueta>
          <h1 className="m-0">Quem é você na urna?</h1>
          <p className="m-0 text-texto-2">
            Responda a {N} propostas e descubra seu lugar no espectro, o partido que combina com você e as cidades onde
            você seria eleito em 2024. Esta parte é só sabor e pode ficar em branco.
          </p>
          <label className="grid gap-1 text-[13px] font-bold">
            Nome de urna
            <input
              type="text"
              value={e.nome}
              maxLength={30}
              placeholder="Ex.: Dona Maria da Padaria"
              onChange={ev => setS({ ...e, nome: ev.target.value })}
              className="rounded-lg border-2 border-ouro bg-white px-3 py-2 text-[15px] font-normal"
            />
          </label>
          <div className="grid gap-1 text-[13px] font-bold">
            Cargo pretendido
            <Alternador
              rotulo="Cargo pretendido"
              opcoes={CARGOS}
              valor={e.cargo}
              aoMudar={c => setS({ ...e, cargo: c })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Botao
              onClick={() =>
                ir(e.respostas.findIndex(r => r == null) < 0 ? N - 1 : e.respostas.findIndex(r => r == null))
              }
            >
              {e.respostas.some(r => r != null) ? "Continuar" : "Começar"}
            </Botao>
            {e.respostas.some(r => r != null) && (
              <Botao className="bg-bege hover:bg-bege" onClick={() => setS(INICIAL)}>
                Recomeçar
              </Botao>
            )}
          </div>
        </Caixa>
      </main>
    );
  }

  const i = e.etapa;
  const p = PROPOSTAS[i];
  const atual = e.respostas[i];
  const ultima = i === N - 1;
  return (
    <main className="mx-auto grid max-w-[620px] gap-4 px-5 pt-[22px] pb-16">
      <div
        role="progressbar"
        aria-label="Progresso"
        aria-valuemin={0}
        aria-valuemax={N}
        aria-valuenow={i}
        className="h-2.5 overflow-hidden rounded-full bg-bege"
      >
        <div
          className="h-full rounded-full bg-verde-esc motion-safe:transition-[width] motion-safe:duration-300"
          style={{ width: `${(100 * i) / N}%` }}
        />
      </div>
      <Caixa key={p.id} className="motion-safe:animate-sobe">
        <Etiqueta>
          PROPOSTA {i + 1} DE {N} · {p.tema.toUpperCase()}
        </Etiqueta>
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden="true"
            className="grid size-16 flex-none place-items-center rounded-full bg-bege text-[34px]"
          >
            {p.icone}
          </span>
          <h2 id="proposta" className="m-0">
            {p.texto}
          </h2>
        </div>
        <div role="radiogroup" aria-labelledby="proposta" className="grid gap-2 min-[560px]:grid-cols-5">
          {NIVEIS.map(n => (
            <button
              key={n.valor}
              type="button"
              role="radio"
              aria-checked={atual === n.valor}
              onClick={() => responder(i, n.valor)}
              className="grid cursor-pointer place-items-center gap-0.5 rounded-lg border-2 border-ouro bg-white px-2 py-2.5 text-[14px] font-bold hover:bg-ouro-claro aria-checked:bg-ouro motion-safe:transition-transform motion-safe:active:scale-95"
            >
              <span className="text-[18px] tabular-nums">{n.curto}</span>
              <span className="text-center text-[12.5px]">{n.rotulo}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <Botao className="bg-bege hover:bg-bege" onClick={() => ir(i - 1)}>
            ‹ Voltar
          </Botao>
          {atual != null && <Botao onClick={() => ir(i + 1)}>{ultima ? "Ver resultado" : "Próxima ›"}</Botao>}
        </div>
      </Caixa>
    </main>
  );
}
