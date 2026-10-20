import { type ReactNode, useMemo, useState } from "react";
import {
  Alternador,
  Caixa,
  Campo,
  Carregando,
  Etiqueta,
  Legenda,
  Linha,
  Pagina,
  Plenario,
  Seletor,
} from "../../componentes";
import { urlFoto, useDados } from "../../lib/dados";
import { CATEGORIAS, COR_SEM_NOTA, CORES_ESPECTRO, corEspectro, nomeCategoria } from "../../lib/espectro";
import { fmt, int, nomeProprio } from "../../lib/formato";
import { useNavegacao } from "../../lib/navegacao";
import { doEstado, UF_NOME } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import type { DadosEleitos, Eleito } from "./tipos";

const ARTIGO: Record<string, string> = {
  AM: "o Amazonas",
  GO: "Goiás",
  MA: "o Maranhão",
  MT: "Mato Grosso",
  RS: "o Rio Grande do Sul",
  SE: "Sergipe",
};

type Casa = "al" | "cd";
// [cargo no TSE, nome da casa, plural, "da ..." para o título]
const CASAS: Record<Casa, [number, string, string, string]> = {
  al: [7, "Assembleia Legislativa", "deputados estaduais", "da Assembleia Legislativa"],
  cd: [6, "Câmara dos Deputados", "deputados federais", "da bancada na Câmara dos Deputados"],
};
const OPCOES_CASA = (Object.entries(CASAS) as [Casa, (typeof CASAS)[Casa]][]).map(([k, c]) => [k, c[1]] as const);

export default function Painel() {
  const { dados, erro } = useDados<DadosEleitos>("candidatos-eleitos.json");
  if (!dados) return <Carregando erro={erro} />;
  return <Conteudo C={dados} />;
}

function Conteudo({ C }: { C: DadosEleitos }) {
  const { abrirCandidato } = useNavegacao();
  const [f, setF] = usePersistente<{ uf: string; casa: Casa }>("plen-tse", { uf: "MA", casa: "al" });
  const [, vE, , vD] = C.regua;
  const MEIO = (vE + vD) / 2;

  // eleitos de 2022 (o arquivo traz outros anos)
  const E = useMemo<Eleito[]>(
    () =>
      C.eleitos.flatMap((r, i) => {
        if (2000 + r[0] !== 2022) return [];
        const partido = C.partidos[r[4]];
        const p = C.espectro[`2022|${partido}`];
        const nota = p ? p[0] : null;
        const sq = C.sq[i];
        const votos = r[13] as number;
        return [
          {
            sq,
            uf: C.ufs[r[1]],
            cargo: r[2],
            partido,
            nome: nomeProprio(r[5]),
            genero: C.generos[r[8]],
            votos,
            nota,
            cor: corEspectro(nota),
            foto: urlFoto(2022, sq),
            rotulo: `${nota == null ? "sem nota" : `${fmt(nota, 2)} · ${nomeCategoria(nota)}`} · ${int(votos)} votos`,
          },
        ];
      }),
    [C],
  );

  const casa: Casa = f.casa in CASAS ? f.casa : "al";
  const uf = f.uf in UF_NOME ? f.uf : "MA";
  const [cargo, , plural, da] = CASAS[casa];
  const xs = useMemo(() => E.filter(e => e.uf === uf && e.cargo === cargo), [E, uf, cargo]);
  const exec = useMemo(
    () => E.filter(e => e.uf === uf && (e.cargo === 3 || e.cargo === 5)).sort((a, b) => a.cargo - b.cargo),
    [E, uf],
  );

  const comNota = xs.filter(e => e.nota != null);
  const dir = comNota.filter(e => e.nota! > MEIO).length;
  const esq = comNota.length - dir;
  const bancadas = new Map<string, number>();
  xs.forEach(e => bancadas.set(e.partido, (bancadas.get(e.partido) || 0) + 1));
  const ord = [...bancadas.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const maior = ord[0];
  const empate = maior ? ord.filter(o => o[1] === maior[1]).map(o => o[0]) : [];
  const mulheres = xs.filter(e => e.genero === "FEMININO").length;
  const media = comNota.reduce((s, e) => s + e.nota!, 0) / (dir + esq || 1);
  const notaPartido = (p: string) => C.espectro[`2022|${p}`]?.[0] ?? null;
  const partidos = [...bancadas.entries()].sort((a, b) => (notaPartido(a[0]) ?? 99) - (notaPartido(b[0]) ?? 99));

  const filtros = (
    <>
      <Campo rotulo="Estado">
        <Seletor value={uf} onChange={ev => setF(s => ({ ...s, uf: ev.target.value }))}>
          {C.ufs.map(u => (
            <option key={u} value={u}>
              {UF_NOME[u]}
            </option>
          ))}
        </Seletor>
      </Campo>
      <Campo rotulo="Casa" grupo>
        <Alternador rotulo="Casa" opcoes={OPCOES_CASA} valor={casa} aoMudar={v => setF(s => ({ ...s, casa: v }))} />
      </Campo>
    </>
  );

  return (
    <Pagina filtros={filtros}>
      <Etiqueta>PLENÁRIOS · ELEIÇÃO DE 2022</Etiqueta>
      <h1>
        {casa === "al"
          ? `Quem senta na Assembleia Legislativa ${doEstado(uf)}?`
          : `Quem ${ARTIGO[uf]} mandou para a Câmara dos Deputados?`}
      </h1>
      <p className="texto-enunciado">
        Os eleitos de 2022, cada um na sua cadeira, da esquerda para a direita pela nota do partido (0 = esquerda, 10 =
        direita; Bolognesi, Ribeiro, Codato e Silva, 2025). Clique numa cadeira para ver a ficha.
      </p>

      <div className="grade-duas">
        <Caixa>
          <h2>A resposta</h2>
          <p className="texto-simples">
            Dos <b>{xs.length}</b> {plural} eleitos em 2022 {doEstado(uf)}, <b>{dir}</b> são de partidos à direita do
            meio da régua e <b>{esq}</b> à esquerda.{" "}
            {maior &&
              (empate.length > 1 ? (
                `As maiores bancadas, empatadas com ${maior[1]} cadeiras: ${empate.join(", ")}.`
              ) : (
                <>
                  A maior bancada é a do <b>{maior[0]}</b>, com {maior[1]} cadeiras.
                </>
              ))}
          </p>
          <div>
            <Linha rotulo="Cadeiras" valor={xs.length} />
            <Linha rotulo="Nota média dos partidos (0 a 10)" valor={fmt(media, 2)} />
            <Linha rotulo="Mulheres eleitas" valor={`${mulheres} (${fmt((100 * mulheres) / (xs.length || 1), 0)}%)`} />
          </div>
        </Caixa>
        <Caixa>
          <h2>Quem governa o estado</h2>
          <div className="grid gap-2.5">
            {exec.map(e => (
              <button
                key={e.sq}
                type="button"
                onClick={() => abrirCandidato(2022, e.sq)}
                className="grid cursor-pointer grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-[10px] border border-linha bg-branco p-2 text-left hover:border-ouro hover:shadow-[0_0_0_2px_var(--color-ouro)] focus-visible:border-ouro focus-visible:shadow-[0_0_0_2px_var(--color-ouro)]"
              >
                <Foto src={e.foto} nome={e.nome} />
                <span className="grid min-w-0 gap-0.5">
                  <small className="text-texto-2">{e.cargo === 3 ? "Governador eleito" : "Senador eleito"}</small>
                  <b>{e.nome}</b>
                  <span>
                    <Chip cor={e.cor}>
                      {e.partido}
                      {e.nota == null ? "" : ` · ${fmt(e.nota, 2)}`}
                    </Chip>
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="texto-nota">
            Governador e senador eleitos em 2022. Para a câmara de vereadores de uma cidade, use Cidades → Explorar
            municípios.
          </p>
        </Caixa>
      </div>

      <Caixa>
        <h2>
          Plenário {da} {doEstado(uf)}: {xs.length} cadeiras
        </h2>
        <div className="w-full max-w-[1000px] justify-self-center">
          <Plenario
            assentos={xs}
            aoClicar={s => abrirCandidato(2022, s.sq)}
            titulo="Plenário visto de cima, com a foto de cada eleito na sua cadeira"
          />
        </div>
        <Legenda itens={CATEGORIAS.map((c, i) => ({ cor: CORES_ESPECTRO[i], rotulo: c })).filter((_, i) => i !== 3)} />
        <div className="flex flex-wrap gap-x-2.5 gap-y-1.5">
          {partidos.map(([p, k]) => {
            const v = notaPartido(p);
            return (
              <span key={p}>
                <Chip cor={v == null ? COR_SEM_NOTA : corEspectro(v)}>{p}</Chip> <b>{k}</b>
              </span>
            );
          })}
        </div>
        <p className="texto-nota">
          Eleitos em 2022 pelo resultado do TSE; quem assumiu depois (suplentes) não aparece. A ordem das cadeiras é a
          do espectro do partido, não a ocupação real do plenário.
        </p>
      </Caixa>
    </Pagina>
  );
}

/** Etiqueta de partido: faixa na cor do espectro e fundo levemente tingido. */
function Chip({ cor, children }: { cor: string; children: ReactNode }) {
  return (
    <span
      className="inline-block whitespace-nowrap rounded border-l-4 px-[7px] py-px text-[12.5px] font-bold"
      style={{ borderLeftColor: cor, background: `color-mix(in srgb, ${cor} 14%, #fff)` }}
    >
      {children}
    </span>
  );
}

/** Foto 81:113 do registro; sem foto, a inicial do nome. */
function Foto({ src, nome }: { src: string; nome: string }) {
  const [falhou, setFalhou] = useState(false);
  return (
    <div className="grid aspect-[81/113] w-16 place-items-center overflow-hidden rounded-lg bg-bege text-2xl font-extrabold text-texto-2">
      {falhou ? (
        nome[0] || "?"
      ) : (
        <img src={src} alt="" loading="lazy" className="block size-full object-cover" onError={() => setFalhou(true)} />
      )}
    </div>
  );
}
