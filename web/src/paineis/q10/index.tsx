import { useCallback, useMemo, useRef } from "react";
import { Alternador, Campo, Carregando, Etiqueta, Pagina, Seletor } from "../../componentes";
import { useDados } from "../../lib/dados";
import { usePersistente } from "../../lib/usePersistente";
import type { PainelProps } from "../tipos";
import { Carreira } from "./Carreira";
import { Comparar, Metodo, Ranking, Reeleicao } from "./Detalhes";
import { Financas } from "./Financas";
import { Resposta } from "./Resposta";
import { TURMAS, UFS, UF_NOME, montarPessoas, semAcento } from "./logica";
import type { DadosQ10, Filtros } from "./tipos";

const PADRAO: Filtros = { uf: "TODAS", turma: 13, sel: null, medida: "mandato", cargoRe: 13, ordem: "vit", valor: "real" };

export default function Painel(_props: PainelProps) {
  const { dados, erro } = useDados<DadosQ10>("q10.json");
  if (!dados) return <Carregando erro={erro} />;
  return <Conteudo D={dados} />;
}

function Conteudo({ D }: { D: DadosQ10 }) {
  const [f, setF] = usePersistente<Filtros>("q10-tse", PADRAO);
  const escada = useRef<HTMLDivElement>(null);
  const pessoas = useMemo(() => montarPessoas(D), [D]);
  const mudar = useCallback(<K extends keyof Filtros>(k: K, v: Filtros[K]) => setF(a => ({ ...a, [k]: v })), [setF]);

  // quem aparece aberto: o salvo, ou (se não existir mais) Ronaldo Caiado
  const sel = useMemo(() => {
    if (f.sel != null && pessoas[f.sel]) return f.sel;
    return pessoas.find(p => p.busca.includes(semAcento("ronaldo ramos caiado")))?.id ?? 0;
  }, [f.sel, pessoas]);

  const doEstado = useMemo(() => (f.uf === "TODAS" ? pessoas : pessoas.filter(p => p.ufs.includes(f.uf))), [pessoas, f.uf]);

  const abrir = (id: number) => {
    mudar("sel", id);
    escada.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const filtros = (
    <>
      <Campo rotulo="Estado">
        <Seletor id="f-uf" value={f.uf} onChange={e => mudar("uf", e.target.value)}>
          <option value="TODAS">Todos os 6 estados</option>
          {UFS.map(u => <option key={u} value={u}>{UF_NOME[u]}</option>)}
        </Seletor>
      </Campo>
      <span className="grid gap-[3px] text-[13px] font-bold">
        Primeira vitória como
        <Alternador rotulo="Primeira vitória como" opcoes={TURMAS.map(([c, n]) => [c, n] as const)} valor={f.turma} aoMudar={v => mudar("turma", v)} />
      </span>
    </>
  );

  return (
    <Pagina filtros={filtros}>
      <Etiqueta>PERGUNTA 10 · CARREIRA</Etiqueta>
      <h1>Quanto dura a carreira de um político?</h1>
      <p className="texto-enunciado">Enunciado: dado certo político, como foi a sobrevivência de sua carreira (linha do tempo de participações, vitórias, derrotas e reeleições)? [máximo possível: 2002 a 2024]</p>

      <Resposta D={D} pessoas={doEstado} f={f} />
      <Carreira pessoas={pessoas} sel={sel} aoEscolher={id => mudar("sel", id)} raiz={escada} />
      <Financas D={D} p={pessoas[sel]} f={f} aoMudarValor={v => mudar("valor", v)} />

      <Comparar D={D} f={f} mudar={mudar} />
      <Reeleicao D={D} f={f} mudar={mudar} />
      <Ranking pessoas={doEstado} f={f} mudar={mudar} aoAbrir={abrir} />
      <Metodo D={D} />
    </Pagina>
  );
}
