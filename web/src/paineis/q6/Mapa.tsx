import { memo, useMemo, useState } from "react";
import { BuscaComLista, Caixa, Campo, Linha, Rampa, Seletor, useDica } from "../../componentes";
import { fmt, int } from "../../lib/formato";
import { semAcento, UF_NOME } from "../../lib/uf";
import { corIdade, MAPA_COR, TERCO_CURTO, tercoDe } from "./calculo";
import type { Corte, Ctx, DadosQ6, Municipio } from "./tipos";

interface Props extends Ctx {
  /** Troca o estado do mapa (limpa a seleção). */
  aoMudarUf(uf: string): void;
  /** Seleciona uma cidade pelo código (e leva o mapa ao estado dela). */
  aoSelecionar(m: Municipio): void;
}

const GRADIENTE = `linear-gradient(90deg,${MAPA_COR.map((c, i) => `${c} ${((i / 5) * 100).toFixed(0)}%,${c} ${(((i + 1) / 5) * 100).toFixed(0)}%`).join(",")})`;
const MARCAS_RAMPA = ["", "32", "35", "38", "41", ""];

/** Seção 3: mapa coroplético da idade média, busca e detalhe da cidade escolhida. */
export function Mapa({ D, M, f, aoMudarUf, aoSelecionar }: Props) {
  const uf = f.mapaUf;
  const [texto, setTexto] = useState("");
  const porCod = useMemo(() => new Map(M.map(m => [m.cod, m])), [M]);
  const ms = useMemo(
    () => M.filter(m => m.uf === uf && m.idade != null).sort((a, b) => (a.idade ?? 0) - (b.idade ?? 0)),
    [M, uf],
  );
  const sel = f.sel != null ? porCod.get(f.sel) : undefined;
  const q = semAcento(texto.trim());
  const achados = q.length >= 2 ? M.filter(m => m.busca.includes(q)).slice(0, 30) : null;

  return (
    <Caixa>
      <h2>Cidade por cidade: {UF_NOME[uf]}</h2>
      <div className="flex flex-wrap items-end gap-x-[18px] gap-y-2.5">
        <Campo rotulo="Mapa do estado">
          <Seletor value={uf} onChange={e => aoMudarUf(e.target.value)}>
            {D.ufs.map(u => (
              <option key={u} value={u}>
                {UF_NOME[u]}
              </option>
            ))}
          </Seletor>
        </Campo>
        <BuscaComLista
          className="min-w-[200px]"
          texto={texto}
          aoDigitar={setTexto}
          achados={achados}
          chave={m => m.cod}
          rotulo={m => `${m.nome} (${m.uf})`}
          aoEscolher={aoSelecionar}
          vazio="Nenhuma cidade encontrada."
          placeholder="Buscar cidade"
          ariaLabel="Buscar cidade"
        />
      </div>
      <div className="grade-mapa">
        <div>
          <Caminhos G={D.mapas[uf]} porCod={porCod} corte={f.corte} sel={f.sel} aoSelecionar={aoSelecionar} />
          <div className="mt-2 grid gap-1.5">
            <div className="grid gap-1">
              <b className="text-[12.5px] text-texto">Idade média da população (anos)</b>
              <Rampa gradiente={GRADIENTE} marcas={MARCAS_RAMPA} />
            </div>
            <p className="texto-nota">
              {ms.length > 0 && (
                <>
                  A mais jovem: {ms[0].nome} ({fmt(ms[0].idade)}); a mais velha: {ms[ms.length - 1].nome} (
                  {fmt(ms[ms.length - 1].idade)}).{" "}
                </>
              )}
              Clique numa cidade.
            </p>
          </div>
        </div>
        <div className="grid gap-2.5">
          {sel && sel.uf === uf ? (
            <Detalhe m={sel} />
          ) : (
            <p className="text-texto-2">
              Clique numa cidade do mapa ou busque pelo nome para ver a idade de quem mora, de quem vota e de quem foi
              eleito, e os partidos dos prefeitos.
            </p>
          )}
        </div>
      </div>
    </Caixa>
  );
}

/** Os caminhos do mapa: centenas de <path>, refeitos só quando muda estado, seleção ou corte (não ao passar o mouse). */
const Caminhos = memo(function Caminhos({
  G,
  porCod,
  corte,
  sel,
  aoSelecionar,
}: {
  G: DadosQ6["mapas"][string];
  porCod: Map<number, Municipio>;
  corte: Corte;
  sel: number | null;
  aoSelecionar(m: Municipio): void;
}) {
  const dica = useDica();
  const caminhos = useMemo(
    () =>
      Object.entries(G.p).map(([cod, d]) => {
        const m = porCod.get(+cod);
        if (!m) return <path key={cod} d={d} fill={corIdade(null)} />;
        const t = tercoDe(m, corte);
        return (
          <path
            key={cod}
            d={d}
            fill={corIdade(m.idade)}
            className={sel === m.cod ? "sel" : ""}
            onMouseMove={ev =>
              dica.mostrar(
                ev,
                <>
                  <b>{m.nome}</b>
                  <br />
                  idade média: {fmt(m.idade)} anos
                  <br />
                  {t ? TERCO_CURTO[t - 1] : ""}
                  {corte === "uf" ? " do estado" : " dos 6 estados"}
                </>,
              )
            }
            onMouseLeave={dica.esconder}
            onClick={() => aoSelecionar(m)}
          />
        );
      }),
    [G, porCod, corte, sel, dica, aoSelecionar],
  );
  return (
    <svg
      className="mapa"
      viewBox={`0 0 ${G.w} ${G.h}`}
      role="img"
      aria-label="Mapa das cidades pela idade média da população"
    >
      {caminhos}
    </svg>
  );
});

function Detalhe({ m }: { m: Municipio }) {
  const v = m.voto[1];
  const sigla = (ano: number, i: number) => (
    <span className="inline-block rounded border border-linha bg-fundo px-[7px] py-px text-[12.5px] font-bold">
      {ano} · {m.sg[i] || "–"}
    </span>
  );
  const passo = (i: number) => {
    const t = m.troca[i];
    if (t == null) return null;
    return t ? (
      <span className="text-xs font-bold text-ouro-esc">trocou</span>
    ) : (
      <span className="text-xs font-bold text-verde-esc">
        {m.sg[i] === m.sg[i + 1] ? "manteve" : "manteve (fusão ou novo nome)"}
      </span>
    );
  };
  const seta = <span className="text-texto-2">→</span>;
  const pref =
    m.conc[1] == null
      ? ""
      : m.conc[1]
        ? m.reel[1]
          ? "O prefeito de 2020 tentou a reeleição em 2024 e venceu."
          : "O prefeito de 2020 tentou a reeleição em 2024 e perdeu."
        : "O prefeito de 2020 não concorreu em 2024.";
  return (
    <>
      <h3>
        {m.nome}
        {m.cap ? " · capital" : ""}
      </h3>
      <p className="texto-nota">
        {int(m.pop)} habitantes · {m.terco ? TERCO_CURTO[m.terco - 1] : "–"} dos 6 estados ·{" "}
        {m.tercoUf ? TERCO_CURTO[m.tercoUf - 1] : "–"} do estado
      </p>
      <div>
        <Linha rotulo="Idade média da população" valor={`${fmt(m.idade)} anos`} />
        <Linha rotulo="do eleitorado (2024)" valor={`${fmt(m.idEl)} anos`} />
        <Linha rotulo="dos vereadores eleitos (2024)" valor={`${fmt(m.idVer)} anos`} />
        <Linha rotulo="do prefeito eleito (2024)" valor={m.idPref == null ? "–" : `${m.idPref} anos`} />
        <Linha rotulo="Eleitorado jovem (16–29)" valor={`${fmt(m.pjEl)}%`} />
        {v && <Linha rotulo="Votos em vereador jovem (2024)" valor={`${fmt(v[4])}%`} />}
        {v && <Linha rotulo="Candidatos jovens a vereador" valor={`${fmt(v[6])}%`} />}
        <Linha rotulo="Abstenção: jovens × demais" valor={`${fmt(m.absJ)}% × ${fmt(m.absNJ)}%`} />
      </div>
      <h3 className="mt-1.5">Partido do prefeito</h3>
      <div className="flex flex-wrap items-center gap-1.5 text-[13.5px]">
        {sigla(2016, 0)}
        {seta}
        {passo(0)}
        {seta}
        {sigla(2020, 1)}
        {seta}
        {passo(1)}
        {seta}
        {sigla(2024, 2)}
      </div>
      <p className="texto-nota">
        {pref}
        {m.troca[1] && m.reel[1] ? " Mesma pessoa, outro partido." : ""}
      </p>
    </>
  );
}
