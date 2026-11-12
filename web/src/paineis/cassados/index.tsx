import { useMemo } from "react";
import {
  Alternador,
  Caixa,
  Campo,
  Carregando,
  Etiqueta,
  FotoEleito,
  Pagina,
  SeletorUf,
  VerMais,
} from "../../componentes";
import { useDados } from "../../lib/dados";
import { int } from "../../lib/formato";
import { useNavegacao } from "../../lib/navegacao";
import { UF_NOME } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import {
  chaveEleito,
  type DadosDecisoes,
  type Decisao,
  explicarMotivo,
  lerDecisoes,
  tipoDecisao,
} from "../candidatos/decisoes";
import { CARGO, CARGO_CURTO, useEleitos } from "../candidatos/modelo";
import type { Eleito } from "../candidatos/tipos";

// Os eleitos com decisão da Justiça Eleitoral contra alguma candidatura (a bola preta da aba
// Candidatos), juntos numa página para ir direto neles. Os dados são os mesmos da ficha.

type Filtro = "todas" | "cassacao" | "ilicito" | "inelegibilidade";
const FILTROS: readonly (readonly [Filtro, string])[] = [
  ["todas", "Todos"],
  ["cassacao", "Cassados nesta eleição"],
  ["ilicito", "Ilícito na campanha"],
  ["inelegibilidade", "Inelegibilidade"],
];
const passa = (f: Filtro, ds: Decisao[]): boolean =>
  f === "todas" ||
  (f === "cassacao" && ds.some(d => d.cassacao && d.propria)) ||
  (f === "ilicito" && ds.some(d => d.familia === 1)) ||
  (f === "inelegibilidade" && ds.some(d => d.familia === 2));

interface Linha {
  e: Eleito;
  ds: Decisao[];
}

export default function Painel() {
  const { modelo, erro } = useEleitos();
  const { dados, erro: erroD } = useDados<DadosDecisoes>("candidatos-decisoes.json");
  if (!modelo || !dados) return <Carregando erro={erro ?? erroD} />;
  return <Conteudo eleitos={modelo.eleitos} D={dados} />;
}

function Conteudo({ eleitos, D }: { eleitos: Eleito[]; D: DadosDecisoes }) {
  const { abrirCandidato } = useNavegacao();
  const [f, setF] = usePersistente<{ uf: string; tipo: Filtro }>("cassados-tse", { uf: "TODAS", tipo: "todas" });
  const todas = useMemo<Linha[]>(
    () =>
      eleitos
        .map(e => ({ e, ds: lerDecisoes(D.eleitos[chaveEleito(e.ano, e.sq)]) }))
        .filter(x => x.ds.length > 0)
        // os cassados nesta eleição primeiro, depois a decisão mais recente
        .sort(
          (a, b) =>
            Number(b.ds.some(d => d.cassacao && d.propria)) - Number(a.ds.some(d => d.cassacao && d.propria)) ||
            Math.max(...b.ds.map(d => d.ano)) - Math.max(...a.ds.map(d => d.ano)) ||
            a.e.nome.localeCompare(b.e.nome, "pt-BR"),
        ),
    [eleitos, D],
  );
  const doEstado = todas.filter(x => f.uf === "TODAS" || x.e.uf === f.uf);
  const xs = doEstado.filter(x => passa(f.tipo, x.ds));
  const conta = (t: Filtro) => doEstado.filter(x => passa(t, x.ds)).length;
  const onde = f.uf === "TODAS" ? "nos 6 estados" : `em ${UF_NOME[f.uf]}`;

  const filtros = (
    <>
      <Campo rotulo="Estado">
        <SeletorUf value={f.uf} onChange={ev => setF(s => ({ ...s, uf: ev.target.value }))} />
      </Campo>
      <Campo rotulo="Decisão" grupo>
        <Alternador rotulo="Decisão" opcoes={FILTROS} valor={f.tipo} aoMudar={v => setF(s => ({ ...s, tipo: v }))} />
      </Campo>
    </>
  );

  return (
    <Pagina filtros={filtros}>
      <Etiqueta>POLÍTICOS · DECISÕES DA JUSTIÇA ELEITORAL</Etiqueta>
      <h1>Cassados e barrados pela Justiça Eleitoral</h1>
      <p className="texto-enunciado">
        Os eleitos de 2022 e 2024 que tiveram uma candidatura cassada ou barrada pela Justiça Eleitoral de 2018 a 2024,
        por ilícito na campanha ou por inelegibilidade. São decisões já tomadas, não investigações. Clique num nome para
        abrir a ficha.
      </p>

      <Caixa>
        <h2>A resposta</h2>
        <p className="texto-simples">
          {onde[0].toUpperCase() + onde.slice(1)}, <b>{int(doEstado.length)}</b> dos eleitos têm decisão da Justiça
          Eleitoral contra alguma candidatura: <b>{conta("cassacao")}</b> foram cassados na própria eleição em que se
          elegeram, <b>{conta("ilicito")}</b> tiveram decisão por ilícito na campanha e{" "}
          <b>{conta("inelegibilidade")}</b> por inelegibilidade (a mesma pessoa pode ter mais de uma). Nos outros{" "}
          {int(doEstado.length - conta("cassacao"))}, a decisão foi sobre uma candidatura anterior, não sobre o mandato
          de 2022 ou 2024.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
          {FILTROS.map(([t, rot]) => (
            <div key={t} className="grid gap-0.5 rounded-xl border-2 border-[#111] px-3 py-2.5">
              <b className="text-[22px] leading-tight font-extrabold tabular-nums">
                {t === "todas" ? doEstado.length : conta(t)}
              </b>
              <span className="text-[13px] text-texto-2">
                {t === "todas" ? "eleitos com decisão" : rot.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </Caixa>

      <Caixa>
        <h2>
          {xs.length} {xs.length === 1 ? "eleito" : "eleitos"}
          {f.tipo === "todas" ? "" : ` · ${FILTROS.find(x => x[0] === f.tipo)?.[1].toLowerCase()}`}
        </h2>
        {xs.length === 0 ? (
          <p className="texto-nota">Nenhum eleito com essa decisão {onde}.</p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {xs.map(({ e, ds }) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => abrirCandidato(e.ano, e.sq)}
                  className="grid w-full cursor-pointer grid-cols-[72px_minmax(0,1fr)] gap-3.5 rounded-xl border-0 bg-[#111] p-3 text-left text-[#f4f1ea] hover:shadow-[0_0_0_3px_var(--color-ouro)] focus-visible:shadow-[0_0_0_3px_var(--color-ouro)] max-[560px]:grid-cols-[56px_minmax(0,1fr)]"
                >
                  <FotoEleito
                    ano={e.ano}
                    sq={e.sq}
                    nome={e.nome}
                    className="w-full aspect-[81/113] rounded-lg! text-[24px]"
                  />
                  <span className="grid min-w-0 gap-1.5">
                    <span>
                      <b className="text-[17px] text-white">{e.nome}</b>
                      <span className="block text-[13px] text-[#d8d3c6]">
                        {CARGO[e.cargo]} · {e.local}
                        {e.cargo >= 11 ? ` (${e.uf})` : ""} · {e.partido} · eleito em {e.ano}
                      </span>
                    </span>
                    {ds.map((d, i) => (
                      <span key={i} className="grid gap-0.5 rounded-lg bg-white/[.07] px-2.5 py-2 text-[13px]">
                        <b className="text-[#ffd86b]">
                          {tipoDecisao(d)} · {d.ano}
                          {d.propria ? " (o mandato atual)" : ` · ${CARGO_CURTO[d.cargo] ?? "candidatura"}`}
                        </b>
                        <span>
                          <b className="text-white">Motivo:</b> {d.motivo}
                        </span>
                        <span className="text-[12.5px] text-[#c9c3b4]">{explicarMotivo(d.motivo)}</span>
                      </span>
                    ))}
                    <span className="text-[12.5px] font-bold text-[#f2d36b] underline">Abrir a ficha</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Caixa>

      <VerMais titulo="De onde vêm os dados e o que eles não dizem">
        <ul>
          <li>
            <b>Fonte:</b> TSE, dados abertos, arquivo de motivos de cassação e de indeferimento do registro de
            candidatura (motivo_cassacao, 2018 a 2024), ligado às candidaturas pelo número do candidato e à pessoa pelo
            título de eleitor.
          </li>
          <li>
            <b>O que entra:</b> cassação, e registro negado por ilícito na campanha (abuso de poder, compra de voto,
            conduta vedada, gasto ilícito, fraude à cota de gênero) ou por inelegibilidade (Ficha Limpa e outras).
          </li>
          <li>
            <b>O que não entra:</b> registro negado por falha de papelada ou do partido (documento faltando, partido
            inválido, falta de quitação eleitoral), que não é cassação nem inelegibilidade.
          </li>
          <li>
            <b>Limites:</b> são decisões, não investigações, e o arquivo não informa recursos posteriores. Quem perde o
            mandato depois de eleito costuma sair da lista de eleitos do TSE (como a senadora Selma Arruda, de Mato
            Grosso, cassada em 2019), por isso não aparece aqui. A Ficha Limpa não diz qual caso da lei se aplicou.
          </li>
          <li>
            <b>Consulta no banco:</b> view <i>cassacao_decisao</i> em <i>sql/24_motivo_cassacao.sql</i>; arquivo{" "}
            <i>candidatos-decisoes.json</i> (<i>scripts/gerar_painel_decisoes.py</i>).
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}
