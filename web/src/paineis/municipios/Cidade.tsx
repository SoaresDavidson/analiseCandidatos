import { useMemo, useState, type ReactNode } from "react";
import { Caixa, Etiqueta, Legenda, Plenario } from "../../componentes";
import { CATEGORIAS, CORES_ESPECTRO, corEspectro, nomeCategoria } from "../../lib/espectro";
import { brl, fmt, int, nomeProprio } from "../../lib/formato";
import { urlBandeira, urlFoto } from "../../lib/dados";
import { useNavegacao } from "../../lib/navegacao";
import { ListaBancadas, Semicirculo, bancadas } from "./Camara";
import { Chip } from "./Chip";
import { ReguaCidade } from "./Reguas";
import type { DadosCandidatos, DadosMunicipios, Municipio } from "./tipos";
import { CANAL, UF_NOME, ladoDe, pcPublico } from "./util";

const ANO = 2024;
const CARGO_PREFEITO = 11, CARGO_VEREADOR = 13;

interface Eleito { sq: number; nome: string; cargo: number; sg: string; nota: number | null; votos: number }

/** Os eleitos de 2024 da cidade: prefeito primeiro, depois por votos. */
function eleitosDa(C: DadosCandidatos, cod: number): Eleito[] {
  const idx: number[] = [];
  C.eleitos.forEach((r, i) => { if (r[27] === cod && r[0] === 24) idx.push(i); });
  const n = (i: number, c: number) => Number(C.eleitos[i][c]) || 0;
  idx.sort((a, b) => (n(a, 2) - n(b, 2)) || (n(b, 13) - n(a, 13)));
  return idx.map(i => {
    const r = C.eleitos[i], sg = C.partidos[Number(r[4])];
    return { sq: C.sq[i], nome: nomeProprio(String(r[5])), cargo: Number(r[2]), sg, nota: (C.espectro[`${ANO}|${sg}`] || [null])[0], votos: Number(r[13]) || 0 };
  });
}

/** Foto 81:113 do cartão do eleito; sem foto, a inicial do nome. */
function Foto({ sq, nome }: { sq: number; nome: string }) {
  const [falhou, setFalhou] = useState(false);
  return (
    <div className="grid aspect-[81/113] w-14 place-items-center overflow-hidden rounded-lg bg-bege text-2xl font-extrabold text-texto-2">
      {falhou ? (nome[0] || "?") : <img src={urlFoto(ANO, sq)} alt="" loading="lazy" className="block size-full object-cover" onError={() => setFalhou(true)} />}
    </div>
  );
}

function Resposta({ m, meio, meia }: { m: Municipio; meio: number; meia: number }) {
  if (m.voto == null) return <>O arquivo do TSE não traz o resultado de vereador de {m.nome} em 2024, então não dá para calcular a nota do voto da cidade.</>;
  const dist = Math.abs(m.voto - meio), forca = dist < meia * 0.15 ? "levemente" : dist < meia * 0.45 ? "" : "fortemente";
  let dif: ReactNode = null;
  if (m.voto22 != null) {
    const d = Math.abs(m.voto - m.voto22);
    dif = <> Em 2022, o voto para deputado federal na cidade ficou em {fmt(m.voto22, 2)}{d >= 0.3 ? `: em 2024 a cidade votou ${fmt(d, 1)} ponto${d >= 1.95 ? "s" : ""} mais à ${m.voto > m.voto22 ? "direita" : "esquerda"} (cargos diferentes: compare com cuidado)` : ", quase igual"}.</>;
  }
  return (
    <>
      Em {m.nome}, o voto para vereador em 2024 ficou em <b>{fmt(m.voto, 2)}</b> na escala de 0 a 10: <b>{nomeCategoria(m.voto)}</b>, {forca ? `${forca} ` : ""}à <b>{ladoDe(m, meio)}</b> do meio da régua ({fmt(meio, 2)}).
      {m.camara != null && <> A câmara eleita ({m.qtVer} vereadores) fica em {fmt(m.camara, 2)}.</>}
      {m.sgPref && <> O prefeito eleito é do {m.sgPref} ({fmt(m.vlPref, 2)}, {nomeCategoria(m.vlPref)}).</>}
      {dif}
    </>
  );
}

interface Props { M: Municipio; D: DadosMunicipios; cand: DadosCandidatos | null; aoVoltar: () => void }

/** Terceiro nível: a nota da cidade, a câmara eleita, o dinheiro e os eleitos. */
export function Cidade({ M: m, D, cand, aoVoltar }: Props) {
  const { abrirCandidato } = useNavegacao();
  const { regua } = D, meio = regua.meio, meia = (regua.dir[1] - regua.esq[1]) / 2;
  const cad = useMemo(() => bancadas(m, D.partidos), [m, D.partidos]);
  const n = cad.reduce((s, c) => s + c.n, 0);
  const eleitos = useMemo(() => (cand ? eleitosDa(cand, m.cod) : null), [cand, m.cod]);
  // o plenário com a foto de cada vereador; sem as fichas, fica o semicírculo de pontos
  const vereadores = useMemo(() => (eleitos ?? []).filter(e => e.cargo === CARGO_VEREADOR).map(e => ({
    sq: e.sq, nome: e.nome, partido: e.sg, nota: e.nota, cor: corEspectro(e.nota), foto: urlFoto(ANO, e.sq),
    rotulo: `${e.nota == null ? "sem nota" : `${fmt(e.nota, 2)} · ${nomeCategoria(e.nota)}`} · ${int(e.votos)} votos`,
  })), [eleitos]);
  const porVoto = m.votos ? (m.receita || 0) / m.votos : null;
  const numeros: [string, string][] = [
    [brl(m.receita), `arrecadados por ${int(m.qtCand)} candidatos`],
    [m.receita ? `${fmt(pcPublico(m), 0)}%` : "–", "veio do fundo público"],
    [m.propaganda ? brl(m.propaganda) : "–", `em propaganda${m.canal >= 0 ? `, mais em ${CANAL[m.canal]}` : ""}`],
    [porVoto == null ? "–" : `R$ ${fmt(porVoto, 2)}`, "arrecadados por voto para vereador"],
  ];

  return (
    <>
      <button type="button" onClick={aoVoltar} className="cursor-pointer justify-self-start border-0 bg-transparent p-0 text-base font-bold text-ouro-esc">← Voltar para {UF_NOME[m.uf]}</button>
      <div className="flex items-center gap-4">
        <img src={urlBandeira(m.uf)} alt={`Bandeira de ${UF_NOME[m.uf]}`} className="h-[52px] w-[78px] rounded border border-linha object-cover" />
        <div>
          <Etiqueta>{UF_NOME[m.uf].toUpperCase()}{m.cap ? " · CAPITAL" : ""}</Etiqueta>
          <h1 className="mt-1.5">{m.nome}</h1>
        </div>
      </div>

      <Caixa>
        <h2>A resposta</h2>
        <p className="texto-simples"><Resposta m={m} meio={meio} meia={meia} /></p>
        <div className="rolagem-x"><ReguaCidade m={m} regua={regua} /></div>
        <Legenda itens={[
          ...CATEGORIAS.map((c, i) => ({ cor: CORES_ESPECTRO[i], rotulo: c })),
        ]} />
        <div className="text-[13px] text-texto-2">● voto 2024 · ◆ câmara · ■ prefeito · ○ dep. federal 2022</div>
      </Caixa>

      <Caixa>
        <h2>{n ? `A câmara eleita em 2024: ${n} vereadores` : "A câmara eleita em 2024"}</h2>
        {n === 0 ? (
          <p className="svg-rotulo text-center text-[12.5px]">Sem vereadores eleitos no arquivo do TSE</p>
        ) : (
          <>
            <div className="w-full max-w-[1000px] justify-self-center">
              {vereadores.length > 0
                ? <Plenario assentos={vereadores} aoClicar={a => abrirCandidato(ANO, a.sq)} titulo="Plenário da câmara de vereadores visto de cima, com a foto de cada eleito na sua cadeira" />
                : <Semicirculo cad={cad} n={n} />}
            </div>
            <ListaBancadas cad={cad} />
          </>
        )}
      </Caixa>

      <Caixa>
        <h2>O dinheiro das campanhas de 2024</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
          {numeros.map(([v, r]) => (
            <div key={r} className="grid content-start gap-0.5 rounded-xl border-2 border-ouro px-3 py-2.5">
              <b className="text-[22px] leading-[1.15] font-extrabold text-ouro-esc tabular-nums">{v}</b>
              <span className="texto-nota">{r}</span>
            </div>
          ))}
        </div>
        <p className="texto-nota">Prefeito e vereador, pela prestação de contas. Dinheiro público = Fundo Especial + Fundo Partidário, a mesma regra da Pergunta 8. "Por voto": arrecadado ÷ votos para vereador.</p>
      </Caixa>

      <Caixa>
        <h2>Quem foi eleito</h2>
        <p className="texto-nota">Clique em um eleito para ver a ficha. Ao fechar, você volta para esta cidade.</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2.5">
          {eleitos == null && <p className="texto-nota">Carregando os eleitos…</p>}
          {eleitos?.length === 0 && <p className="texto-nota">Sem eleitos de 2024 nas fichas.</p>}
          {eleitos?.map(e => (
            <button key={e.sq} type="button" onClick={() => abrirCandidato(ANO, e.sq)}
              className="grid cursor-pointer grid-cols-[56px_minmax(0,1fr)] items-center gap-3 rounded-[10px] border border-linha bg-branco p-2 text-left hover:border-ouro hover:shadow-[0_0_0_2px_var(--color-ouro)] focus-visible:border-ouro focus-visible:shadow-[0_0_0_2px_var(--color-ouro)]">
              <Foto sq={e.sq} nome={e.nome} />
              <span className="grid min-w-0 gap-0.5">
                <b className="text-[14.5px] leading-tight">{e.nome}</b>
                <small className="text-texto-2">{e.cargo === CARGO_PREFEITO && "Prefeito · "}<Chip texto={e.sg} nota={e.nota} /></small>
                <span className="text-[13px] font-bold text-verde-esc">{int(e.votos)} votos</span>
              </span>
            </button>
          ))}
        </div>
      </Caixa>
    </>
  );
}
