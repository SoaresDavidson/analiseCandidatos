import { useEffect, useMemo, useState } from "react";
import { Alternador, Campo, Caixa, Carregando, Etiqueta, Pagina, Seletor, VerMais } from "../../componentes";
import { brl, fmt, int } from "../../lib/formato";
import { usePersistente } from "../../lib/usePersistente";
import type { PainelProps } from "../tipos";
import Ficha, { Numero, Numeros } from "./Ficha";
import Lista, { ORDENS, type Ordem } from "./Lista";
import { CARGO, CARGOS_ANO, lerExtra, mediana, PLURAL, semAcento, UF_NOME, useEleitos } from "./modelo";
import type { Eleito } from "./tipos";

const PASSO_INICIAL = 48;
const PASSO_MAIS = 96;

interface Filtros { uf: string; ano: number; cargo: number; ordem: Ordem }
const PADRAO: Filtros = { uf: "TODAS", ano: 2024, cargo: 11, ordem: "votos" };

export default function Painel({ extra }: PainelProps) {
  const { modelo, erro } = useEleitos();
  // a busca e o "mostrar mais" não são lembrados: só uf, ano, cargo e ordem
  const [salvo, setSalvo] = usePersistente<Filtros>("cand-tse", PADRAO);
  const [busca, setBusca] = useState("");
  const [n, setN] = useState(PASSO_INICIAL);
  const [aberto, setAberto] = useState<Eleito | null>(null);

  // o cargo precisa existir na eleição escolhida
  const cargosAno = CARGOS_ANO[salvo.ano] ?? CARGOS_ANO[2024];
  const f: Filtros = { ...salvo, cargo: cargosAno.includes(salvo.cargo) ? salvo.cargo : cargosAno[0] };
  const mudar = (parcial: Partial<Filtros>) => { setSalvo({ ...f, ...parcial }); setN(PASSO_INICIAL); };

  // vindo de #candidatos/<ano>-<sq>: ajusta o filtro para essa pessoa e abre a ficha
  useEffect(() => {
    const alvo = lerExtra(extra);
    if (!alvo || !modelo) return;
    const e = modelo.eleitos.find(x => x.sq === alvo.sq && x.ano === alvo.ano);
    if (!e) return;
    setSalvo(s => ({ ...s, ano: e.ano, cargo: e.cargo, uf: e.uf }));
    setBusca("");
    setN(PASSO_INICIAL);
    setAberto(e);
  }, [extra, modelo, setSalvo]);

  const doFiltro = useMemo(
    () => modelo?.eleitos.filter(e => e.ano === f.ano && e.cargo === f.cargo && (f.uf === "TODAS" || e.uf === f.uf)) ?? [],
    [modelo, f.ano, f.cargo, f.uf],
  );

  const termos = useMemo(() => { const t = semAcento(busca.trim()); return t ? t.split(/\s+/) : []; }, [busca]);
  const achados = useMemo(
    () => doFiltro.filter(e => termos.every(t => e.busca.includes(t))).sort(ORDENS[f.ordem]),
    [doFiltro, termos, f.ordem],
  );

  if (!modelo) return <Carregando erro={erro} />;

  const onde = f.uf === "TODAS" ? "nos 6 estados" : `${["AM", "MA", "MT", "RS"].includes(f.uf) ? "no " : "em "}${UF_NOME[f.uf]}`;
  const [, vE, , vD] = modelo.dados.regua;

  // ---------- 1. o perfil de quem está no filtro ----------
  const total = doFiltro.length;
  const pct = (fn: (e: Eleito) => boolean) => (total ? `${fmt((100 * doFiltro.filter(fn).length) / total, 0)}%` : "–");
  const comReceita = doFiltro.filter(e => (e.receita ?? 0) > 0);
  const publico = comReceita.length ? (100 * comReceita.filter(e => (e.publico ?? 0) >= 0.5 * (e.receita ?? 0)).length) / comReceita.length : null;
  const titulo = total === 1 ? `O ${CARGO[f.cargo].toLowerCase()} eleito em ${f.ano} ${onde}` : `Os ${int(total)} ${PLURAL[f.cargo]} eleitos em ${f.ano} ${onde}`;
  const perfil: [string, string][] = [
    [pct(e => e.genero === "FEMININO"), "são mulheres"],
    [`${fmt(mediana(doFiltro.map(e => e.idade)), 0)} anos`, "idade típica (mediana)"],
    [pct(e => /SUPERIOR COMPLETO/.test(e.grau)), "têm faculdade completa"],
    [brl(mediana(doFiltro.map(e => e.patrimonio || 0))), "patrimônio típico declarado"],
    [brl(mediana(comReceita.map(e => e.receita))), "campanha típica (arrecadado)"],
    [publico == null ? "–" : `${fmt(publico, 0)}%`, "tiveram metade ou mais da campanha paga pelo fundo público"],
    [pct(e => e.espectro != null && e.espectro[0] > (vE + vD) / 2), "são de partidos à direita do meio da régua do espectro"],
  ];

  return (
    <Pagina
      filtros={
        <>
          <Campo rotulo="Estado">
            <Seletor value={f.uf} onChange={ev => mudar({ uf: ev.target.value })}>
              <option value="TODAS">Todos os 6 estados</option>
              {modelo.dados.ufs.map(u => <option key={u} value={u}>{UF_NOME[u]}</option>)}
            </Seletor>
          </Campo>
          <span className="grid gap-[3px] text-[13px] font-bold">
            Eleição
            <Alternador rotulo="Eleição" opcoes={[[2024, "2024"], [2022, "2022"]]} valor={f.ano} aoMudar={ano => mudar({ ano, cargo: CARGOS_ANO[ano][0] })} />
          </span>
          <span className="grid gap-[3px] text-[13px] font-bold">
            Cargo
            <Alternador rotulo="Cargo" opcoes={cargosAno.map(c => [c, CARGO[c]] as const)} valor={f.cargo} aoMudar={cargo => mudar({ cargo })} />
          </span>
        </>
      }
    >
      <Etiqueta>CANDIDATOS ELEITOS</Etiqueta>
      <h1>Quem são os eleitos?</h1>
      <p className="texto-enunciado">
        Todos os eleitos de 2022 e 2024 nos 6 estados, com foto, votos, patrimônio declarado, campanha e carreira. Clique em um eleito para ver a ficha completa.
      </p>

      <Caixa>
        <h2>{titulo}</h2>
        <Numeros>{perfil.map(([v, r]) => <Numero key={r} valor={v} rotulo={r} />)}</Numeros>
        <p className="texto-nota">
          Mediana: metade dos eleitos está acima e metade abaixo. Patrimônio e campanha como foram declarados ao TSE; quem não declarou bens conta como zero.
        </p>
      </Caixa>

      <Caixa>
        <div className="flex flex-wrap items-end gap-x-[18px] gap-y-2.5">
          <input
            type="search"
            className="entrada flex-[1_1_320px]"
            placeholder="Buscar por nome, cidade ou partido"
            aria-label="Buscar eleito por nome, cidade ou partido"
            autoComplete="off"
            value={busca}
            onChange={ev => { setBusca(ev.target.value); setN(PASSO_INICIAL); }}
          />
          <span className="grid gap-[3px] text-[13px] font-bold">
            Ordenar por
            <Alternador
              rotulo="Ordenar por"
              opcoes={[["votos", "Votos"], ["nome", "Nome"], ["patrimonio", "Patrimônio"], ["receita", "Campanha"]] as const}
              valor={f.ordem}
              aoMudar={ordem => mudar({ ordem })}
            />
          </span>
        </div>
        <p className="texto-nota" aria-live="polite">
          {achados.length
            ? `${int(achados.length)} eleito${achados.length > 1 ? "s" : ""}${termos.length ? " encontrados" : ""}. Mostrando ${int(Math.min(n, achados.length))}.`
            : "Ninguém encontrado com essa busca neste filtro."}
        </p>
        <Lista eleitos={achados.slice(0, n)} ordem={f.ordem} todosEstados={f.uf === "TODAS"} aoAbrir={setAberto} />
        {achados.length > n && (
          <button
            type="button"
            onClick={() => setN(x => x + PASSO_MAIS)}
            className="cursor-pointer justify-self-center rounded-lg border-2 border-ouro bg-white px-[22px] py-2 font-bold hover:bg-ouro-claro"
          >
            Mostrar mais
          </button>
        )}
      </Caixa>

      <VerMais titulo="Como calculamos">
        <ul>
          <li><b>Quem entra:</b> eleitos de 2022 (governador, senador, deputados federal e estadual) e de 2024 (prefeito e vereador) nos 6 estados. Sem vices e suplentes.</li>
          <li><b>Foto:</b> a que o candidato entregou ao TSE no registro (dados abertos do TSE, um arquivo por estado e eleição), reduzida para caber no painel.</li>
          <li><b>Votos:</b> votos nominais no turno que decidiu a eleição (TSE, votação por município e zona), carregados na tabela VOTACAO_CANDIDATO_MUNICIPIO.</li>
          <li><b>Patrimônio:</b> soma dos bens declarados ao TSE no registro (tabela BEM_CANDIDATO). É o que o candidato declarou, não uma avaliação.</li>
          <li><b>Campanha:</b> receitas da prestação de contas, separadas pela mesma regra da Pergunta 8: dinheiro público = Fundo Especial + Fundo Partidário. Propaganda: despesas contratadas, pelos canais da Pergunta 9.</li>
          <li><b>Carreira:</b> todas as candidaturas da pessoa de 2002 a 2024 nos 6 estados, ligadas pelo título de eleitor (a mesma linha do tempo da Pergunta 10).</li>
          <li><b>Consulta no banco:</b> view <i>ficha_eleito</i> em <i>sql/13_ficha_candidato.sql</i>.</li>
        </ul>
      </VerMais>

      {aberto && (
        // a ficha abre por cima da página; Esc, o botão × e o clique fora fecham
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/45"
          role="dialog"
          aria-modal="true"
          aria-label="Ficha do eleito"
          onKeyDown={ev => ev.key === "Escape" && setAberto(null)}
        >
          <div className="flex min-h-full items-center justify-center p-3" onClick={ev => { if (ev.target === ev.currentTarget) setAberto(null); }}>
            <div className="w-full max-w-[760px]">
              <Ficha key={aberto.id} e={aberto} regua={modelo.dados.regua} aoFechar={() => setAberto(null)} />
            </div>
          </div>
        </div>
      )}
    </Pagina>
  );
}
