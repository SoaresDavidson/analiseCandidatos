import { useCallback, useMemo, useRef, useState } from "react";
import { Caixa, Campo, Carregando, Etiqueta, Pagina, SeletorUf } from "../../componentes";
import { useDados } from "../../lib/dados";
import { semAcento } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import type { DadosCandidatos } from "../candidatos/tipos";
import type { PainelProps } from "../tipos";
import { Carreira } from "./Carreira";
import { Comparar, Metodo, Ranking, Reeleicao } from "./Detalhes";
import { fotoDe, indiceFotos } from "./fotos";
import { montarPessoas } from "./logica";
import { Patrimonio } from "./Patrimonio";
import type { DadosQ10, Filtros, PessoasQ10 } from "./tipos";
import { useFinancas } from "./useFinancas";

const PADRAO: Filtros = {
  uf: "TODAS",
  sel: null,
  medida: "mandato",
  cargoRe: 13,
  ordem: "vit",
};

export default function Painel(_props: PainelProps) {
  const { dados, erro } = useDados<DadosQ10>("q10.json");
  if (!dados) return <Carregando erro={erro} />;
  return <Conteudo D={dados} />;
}

function Conteudo({ D }: { D: DadosQ10 }) {
  const [salvo, setF] = usePersistente<Filtros>("q10-brasil", PADRAO);
  // valor salvo de outra versão: estado que não existe volta para o Brasil
  const f: Filtros = salvo.uf !== "TODAS" && !D.ufs.includes(salvo.uf) ? PADRAO : salvo;
  const escada = useRef<HTMLDivElement>(null);
  const mudar = useCallback(<K extends keyof Filtros>(k: K, v: Filtros[K]) => setF(a => ({ ...a, [k]: v })), [setF]);

  // as pessoas vêm de um arquivo por estado; no país, só quem já foi governador, senador ou deputado
  const escopo = f.uf === "TODAS" ? "BR" : f.uf;
  const { dados: P, erro } = useDados<PessoasQ10>(`q10/${escopo}.json`);
  const pessoas = useMemo(() => (P ? montarPessoas(P) : null), [P]);

  // quem aparece aberto: o salvo; senão Ronaldo Caiado (no país) ou quem mais venceu no estado
  const sel = useMemo(() => {
    if (!pessoas?.length) return -1;
    if (f.sel != null && pessoas[f.sel]) return f.sel;
    const caiado = pessoas.find(p => p.busca.includes(semAcento("ronaldo ramos caiado")));
    return (caiado ?? pessoas.reduce((a, b) => (b.vit > a.vit ? b : a))).id;
  }, [f.sel, pessoas]);
  const p = pessoas && sel >= 0 ? pessoas[sel] : undefined;

  // patrimônio e campanha de quem está aberto; a foto vem das fichas dos eleitos de 2022 e 2024 do estado dele
  const fin = useFinancas(D, escopo, p);
  const ufDaFoto = p ? (p.r.findLast(x => x.res === 0) ?? p.ult).uf : null;
  const { dados: eleitos } = useDados<DadosCandidatos>(ufDaFoto ? `candidatos/${ufDaFoto}.json` : null);
  const fotos = useMemo(() => (eleitos ? indiceFotos(eleitos) : null), [eleitos]);
  const foto = useMemo(() => (fotos && p ? fotoDe(p, fotos) : null), [fotos, p]);
  const [patrimonioAberto, setPatrimonioAberto] = useState(false);
  const fecharPatrimonio = useCallback(() => setPatrimonioAberto(false), []);

  const abrir = (id: number) => {
    mudar("sel", id);
    escada.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const filtros = (
    <Campo rotulo="Estado">
      <SeletorUf brasil id="f-uf" value={f.uf} onChange={e => setF(a => ({ ...a, uf: e.target.value, sel: null }))} />
    </Campo>
  );

  return (
    <Pagina filtros={filtros}>
      <Etiqueta>PERGUNTA 10 · CARREIRA</Etiqueta>
      <h1>Quanto dura a carreira de um político?</h1>

      {pessoas && p ? (
        <>
          <Carreira
            pessoas={pessoas}
            uf={f.uf}
            sel={sel}
            foto={foto}
            fotosProntas={fotos != null}
            aoEscolher={id => mudar("sel", id)}
            aoPatrimonio={() => setPatrimonioAberto(true)}
            raiz={escada}
          />
          {patrimonioAberto && <Patrimonio D={D} p={p} fin={fin} foto={foto} aoFechar={fecharPatrimonio} />}
        </>
      ) : (
        <Caixa>
          <Carregando erro={erro} />
        </Caixa>
      )}

      <Comparar D={D} f={f} mudar={mudar} />
      <Reeleicao D={D} f={f} mudar={mudar} />
      {pessoas && <Ranking pessoas={pessoas} f={f} mudar={mudar} aoAbrir={abrir} />}
      <Metodo D={D} />
    </Pagina>
  );
}
