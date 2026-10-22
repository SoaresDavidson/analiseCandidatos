import { useEffect, useMemo, useState } from "react";
import { Botao, Caixa, Carregando, FotoEleito, Legenda, SeletorUf } from "../../../componentes";
import { useDados } from "../../../lib/dados";
import { CORES_ESPECTRO, CORTES, categoria, corEspectro, nomeCategoria } from "../../../lib/espectro";
import { fmt, maiusculaInicial, nomeLugar } from "../../../lib/formato";
import { useNavegacao } from "../../../lib/navegacao";
import { noEstado, UF_NOME } from "../../../lib/uf";
import { useEleitos } from "../../candidatos/modelo";
import type { DadosQ7 } from "../../q7/tipos";
import {
  type Cidade,
  contarPorUf,
  FATOR_PERTO,
  favoraveis,
  LIMITE,
  partidosDoAno,
  prefeitoParecido,
  ranquear,
  textoResultado,
} from "./logica";

const COR_FORTE = "var(--color-verde-esc)";
const COR_PERTO = "var(--color-verde-claro)";
const COR_LONGE = "var(--color-sem-dado, #d9d6ce)";

interface Props {
  nota: number;
  nome: string;
  cargo: string;
  aoRefazer(): void;
}

const f1 = (x: number) => fmt(x, 1);
const f2 = (x: number) => fmt(x, 2);

export function Resultado({ nota, nome, cargo, aoRefazer }: Props) {
  const { dados: q7, erro } = useDados<DadosQ7>("q7.json");
  const { modelo } = useEleitos();
  if (erro) return <p role="alert">Não foi possível carregar os dados: {erro.message}</p>;
  if (!q7 || !modelo) return <Carregando />;
  return <Corpo q7={q7} modelo={modelo} nota={nota} nome={nome} cargo={cargo} aoRefazer={aoRefazer} />;
}

type Modelo = NonNullable<ReturnType<typeof useEleitos>["modelo"]>;

function Corpo({ q7, modelo, nota, nome, cargo, aoRefazer }: Props & { q7: DadosQ7; modelo: Modelo }) {
  const nav = useNavegacao();
  const [copiado, setCopiado] = useState(false);
  const [ufEscolhida, setUfEscolhida] = useState<string | null>(null);

  const cidades = useMemo<Cidade[]>(
    () =>
      q7.municipios.flatMap(m =>
        m[5][3] == null
          ? []
          : [{ cod: m[0], nome: nomeLugar(m[1]), uf: q7.ufs[m[2]], cap: m[4] === 1, nota: m[5][3] as number }],
      ),
    [q7],
  );
  const ranque = useMemo(() => ranquear(cidades, nota), [cidades, nota]);
  const fav = useMemo(() => favoraveis(ranque), [ranque]);
  const porUf = useMemo(() => contarPorUf(fav), [fav]);
  const partidos = useMemo(() => partidosDoAno(modelo.dados.espectro, 2024, nota), [modelo, nota]);
  const top3 = partidos.slice(0, 3);
  const parecido = useMemo(
    () => prefeitoParecido(modelo.eleitos, new Set(fav.map(c => c.cod)), nota),
    [modelo, fav, nota],
  );
  const capitais = useMemo(() => ranque.filter(c => c.cap).sort((a, b) => a.dist - b.dist), [ranque]);

  const uf = ufEscolhida ?? porUf[0]?.[0] ?? ranque[0]?.uf ?? q7.ufs[0];
  const topo = ranque.slice(0, 10);
  const cat = nomeCategoria(nota);
  const maxUf = Math.max(1, ...porUf.map(p => p[1]));

  // some o aviso de "copiado" depois de um tempo
  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2500);
    return () => clearTimeout(t);
  }, [copiado]);

  const copiar = async () => {
    const texto = textoResultado({
      nome,
      cargo,
      nota,
      categoria: cat,
      partidos: top3.map(p => p.partido),
      ganharia: fav.length,
      total: cidades.length,
      topo: fav.slice(0, 3).map(c => `${c.nome} (${c.uf})`),
    });
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      window.prompt("Copie o resultado:", texto);
    }
  };

  return (
    <div className="grid gap-[18px]">
      <Caixa className="motion-safe:animate-sobe">
        <div aria-live="polite" className="grid gap-1">
          <span className="text-[13px] font-bold tracking-[.03em] text-texto-2 uppercase">
            {nome ? `${nome}, ${cargo} em 2024` : `Candidatura a ${cargo} em 2024`}
          </span>
          <h2 className="m-0 flex flex-wrap items-baseline gap-x-3">
            <span className="text-[44px] leading-none font-extrabold tabular-nums" style={{ color: corEspectro(nota) }}>
              {f1(nota)}
            </span>
            <span>{maiusculaInicial(cat)}</span>
          </h2>
          {top3[0] && (
            <p className="m-0 text-texto-2">
              Seu partido seria o <b className="text-texto">{top3[0].partido}</b> (nota {f2(top3[0].nota)}); também
              combinam com você {top3[1]?.partido} e {top3[2]?.partido}.
            </p>
          )}
        </div>
        <Regua nota={nota} partidos={partidos} destaque={top3.map(p => p.partido)} />
        <div className="flex flex-wrap gap-2">
          <Botao onClick={aoRefazer}>Refazer</Botao>
          <Botao onClick={copiar} className="bg-verde-claro hover:bg-verde-claro">
            Copiar resultado
          </Botao>
          <span role="status" className="self-center text-[13.5px] font-bold text-verde-esc">
            {copiado ? "Copiado!" : ""}
          </span>
        </div>
      </Caixa>

      <Caixa className="motion-safe:animate-sobe">
        <h3 className="m-0">Onde você seria eleito</h3>
        <p className="m-0 text-[28px] font-extrabold" aria-live="polite">
          {fav.length > 0 ? (
            <>
              {fav.length} <span className="text-[16px] font-bold text-texto-2">de {cidades.length} cidades</span>
            </>
          ) : (
            <span className="text-[18px]">Nenhuma cidade com voto parecido com o seu</span>
          )}
        </p>
        <p className="texto-nota m-0">
          Você ganharia onde a nota da cidade em 2024 fica a até {f2(LIMITE)} ponto da sua. Escolhemos 0,35 porque a
          maioria das cidades fica entre 5,7 e 7,8: um limite maior pegaria quase todo o centro, um menor deixaria
          poucas. {fav.length === 0 && "Abaixo, as cidades mais próximas, mesmo fora do limite."}
        </p>

        {porUf.length > 0 && (
          <ul className="m-0 grid list-none gap-1.5 p-0" aria-label="Cidades favoráveis por estado">
            {porUf.map(([u, n]) => (
              <li key={u} className="grid grid-cols-[110px_1fr_40px] items-center gap-2 text-[14px]">
                <span>{UF_NOME[u]}</span>
                <span className="h-3.5 rounded-full bg-bege">
                  <span
                    className="block h-full rounded-full bg-verde-esc motion-safe:transition-[width] motion-safe:duration-500"
                    style={{ width: `${(100 * n) / maxUf}%` }}
                  />
                </span>
                <b className="text-right tabular-nums">{n}</b>
              </li>
            ))}
          </ul>
        )}
      </Caixa>

      <div className="grade-mapa">
        <Caixa>
          <h3 className="m-0">As dez cidades mais parecidas com você</h3>
          <ol className="m-0 grid list-none gap-1 p-0">
            {topo.map((c, i) => (
              <li key={c.cod}>
                <button
                  type="button"
                  onClick={() => nav.abrirMunicipio(c.cod)}
                  className="grid w-full cursor-pointer grid-cols-[22px_1fr_auto] items-center gap-2 rounded-lg border-0 bg-transparent px-1.5 py-1.5 text-left text-[14.5px] hover:bg-ouro-claro"
                >
                  <span className="text-texto-2 tabular-nums">{i + 1}</span>
                  <span>
                    <b>{c.nome}</b> · {c.uf}
                  </span>
                  <span className="text-texto-2 tabular-nums">{f2(c.nota)}</span>
                </button>
              </li>
            ))}
          </ol>
          <h3 className="m-0 mt-2">Nas capitais</h3>
          <ul className="m-0 grid list-none gap-1 p-0">
            {capitais.map(c => (
              <li key={c.cod} className="flex items-center justify-between gap-2 text-[14.5px]">
                <button
                  type="button"
                  onClick={() => nav.abrirMunicipio(c.cod)}
                  className="cursor-pointer border-0 bg-transparent p-0 font-bold text-verde-esc underline"
                >
                  {c.nome}
                </button>
                <span className={c.nivel === "forte" ? "font-bold text-verde-esc" : "text-texto-2"}>
                  {c.nivel === "forte" ? "você ganharia" : c.nivel === "perto" ? "perto" : "longe"} · {f2(c.nota)}
                </span>
              </li>
            ))}
          </ul>
        </Caixa>

        <Caixa>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="m-0">Mapa {noEstado(uf)}</h3>
            <SeletorUf
              aria-label="Estado do mapa"
              value={uf}
              onChange={e => setUfEscolhida(e.target.value === "TODAS" ? null : e.target.value)}
            />
          </div>
          <MapaUf q7={q7} uf={uf} ranque={ranque} onAbrir={cod => nav.abrirMunicipio(cod)} />
          <Legenda
            itens={[
              { cor: COR_FORTE, rotulo: "você ganharia" },
              { cor: COR_PERTO, rotulo: `perto (até ${f2(LIMITE * FATOR_PERTO)})` },
              { cor: COR_LONGE, rotulo: "longe" },
            ]}
          />
        </Caixa>
      </div>

      {parecido && (
        <Caixa className="motion-safe:animate-sobe">
          <h3 className="m-0">Um prefeito parecido com você</h3>
          <div className="flex items-center gap-3.5">
            <FotoEleito
              ano={parecido.eleito.ano}
              sq={parecido.eleito.sq}
              nome={parecido.eleito.nome}
              className="size-16"
            />
            <div className="grid gap-0.5">
              <b>{parecido.eleito.nome}</b>
              <span className="text-texto-2">
                {parecido.eleito.partido} · {nomeLugar(parecido.eleito.local)} ({parecido.eleito.uf})
              </span>
              <span className="text-[13px] text-texto-2">
                nota do partido {f2(parecido.eleito.espectro?.[0] ?? 0)} · {categoria(parecido.eleito.espectro?.[0])}
              </span>
            </div>
            <Botao className="ml-auto" onClick={() => nav.abrirCandidato(parecido.eleito.ano, parecido.eleito.sq)}>
              Ver ficha
            </Botao>
          </div>
        </Caixa>
      )}

      <p className="texto-nota m-0">
        É uma brincadeira, não uma pesquisa de opinião. A nota de cada cidade é a média ponderada do espectro dos
        partidos que ela votou em 2024 (painel Q7, vereador), não o que os moradores pensam sobre as propostas.
      </p>
    </div>
  );
}

function Regua({
  nota,
  partidos,
  destaque,
}: {
  nota: number;
  partidos: { partido: string; nota: number }[];
  destaque: string[];
}) {
  const limites = [0, ...CORTES, 10];
  // os partidos destacados costumam ter notas quase iguais: cada rótulo desce uma linha, na ordem da régua
  const linhaDe = new Map(
    partidos
      .filter(p => destaque.includes(p.partido))
      .sort((a, b) => a.nota - b.nota)
      .map((p, i) => [p.partido, i]),
  );
  return (
    <div className="relative pt-7 pb-14">
      <div
        role="img"
        aria-label={`Régua de 0 a 10. Sua nota: ${f1(nota)}. Partidos mais próximos: ${destaque.join(", ")}.`}
        className="relative flex h-5 overflow-hidden rounded-full"
      >
        {CORES_ESPECTRO.map((cor, i) => (
          <span key={cor} style={{ width: `${((limites[i + 1] - limites[i]) / 10) * 100}%`, background: cor }} />
        ))}
      </div>
      {partidos.map(p => {
        const d = destaque.includes(p.partido);
        return (
          <span
            key={p.partido}
            title={`${p.partido}: ${f2(p.nota)}`}
            aria-hidden="true"
            className={`absolute w-0.5 -translate-x-1/2 rounded-full ${d ? "top-[26px] h-7 bg-texto" : "top-[30px] h-3 bg-texto/50"}`}
            style={{ left: `${p.nota * 10}%` }}
          >
            {d && (
              <span
                className="absolute left-1/2 -translate-x-1/2 text-[11px] leading-[13px] font-bold whitespace-nowrap"
                style={{ top: `calc(100% + ${(linhaDe.get(p.partido) ?? 0) * 13}px)` }}
              >
                {p.partido}
              </span>
            )}
          </span>
        );
      })}
      <span
        aria-hidden="true"
        className="absolute top-0 -translate-x-1/2 rounded-md bg-texto px-2 py-0.5 text-[12px] font-bold text-white motion-safe:transition-[left] motion-safe:duration-700"
        style={{ left: `${nota * 10}%` }}
      >
        você
      </span>
      <div className="absolute inset-x-0 bottom-0 flex justify-between text-[12px] text-texto-2" aria-hidden="true">
        <span>0 · esquerda</span>
        <span>direita · 10</span>
      </div>
    </div>
  );
}

function MapaUf({
  q7,
  uf,
  ranque,
  onAbrir,
}: {
  q7: DadosQ7;
  uf: string;
  ranque: ReturnType<typeof ranquear>;
  onAbrir(cod: number): void;
}) {
  const G = q7.mapas[uf];
  const porCod = useMemo(() => new Map(ranque.map(c => [c.cod, c])), [ranque]);
  if (!G) return <p className="texto-nota">Sem mapa para este estado.</p>;
  return (
    <svg
      className="mapa"
      viewBox={`0 0 ${G.w} ${G.h}`}
      role="img"
      aria-label={`Mapa de ${UF_NOME[uf]} pintado pelas cidades onde você ganharia`}
    >
      {Object.entries(G.p).map(([cod, d]) => {
        const c = porCod.get(+cod);
        const fill = !c ? COR_LONGE : c.nivel === "forte" ? COR_FORTE : c.nivel === "perto" ? COR_PERTO : COR_LONGE;
        return (
          <path key={cod} d={d} style={{ fill }} onClick={() => c && onAbrir(c.cod)}>
            {c && (
              <title>
                {c.nome}: {f2(c.nota)}
              </title>
            )}
          </path>
        );
      })}
    </svg>
  );
}
