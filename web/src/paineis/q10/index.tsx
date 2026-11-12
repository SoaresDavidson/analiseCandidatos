import { useCallback, useMemo, useRef, useState } from "react";
import { Campo, Carregando, Etiqueta, Pagina, SeletorUf } from "../../componentes";
import { useDados } from "../../lib/dados";
import { semAcento } from "../../lib/uf";
import { usePersistente } from "../../lib/usePersistente";
import type { DadosCandidatos } from "../candidatos/tipos";
import type { PainelProps } from "../tipos";
import { Campanha } from "./Campanha";
import { Carreira } from "./Carreira";
import { Comparar, Metodo, Ranking, Reeleicao } from "./Detalhes";
import { fotoDe, indiceFotos } from "./fotos";
import { montarPessoas } from "./logica";
import { Patrimonio } from "./Patrimonio";
import type { DadosQ10, Filtros } from "./tipos";
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
  const [f, setF] = usePersistente<Filtros>("q10-tse", PADRAO);
  const escada = useRef<HTMLDivElement>(null);
  const pessoas = useMemo(() => montarPessoas(D), [D]);
  const mudar = useCallback(<K extends keyof Filtros>(k: K, v: Filtros[K]) => setF(a => ({ ...a, [k]: v })), [setF]);

  // quem aparece aberto: o salvo, ou (se não existir mais) Ronaldo Caiado
  const sel = useMemo(() => {
    if (f.sel != null && pessoas[f.sel]) return f.sel;
    return pessoas.find(p => p.busca.includes(semAcento("ronaldo ramos caiado")))?.id ?? 0;
  }, [f.sel, pessoas]);

  const doEstado = useMemo(
    () => (f.uf === "TODAS" ? pessoas : pessoas.filter(p => p.ufs.includes(f.uf))),
    [pessoas, f.uf],
  );

  // patrimônio e campanha de quem está aberto; a foto vem da lista de eleitos de 2022 e 2024
  const p = pessoas[sel];
  const fin = useFinancas(D, p);
  const { dados: eleitos } = useDados<DadosCandidatos>("candidatos-eleitos.json");
  const fotos = useMemo(() => (eleitos ? indiceFotos(eleitos) : null), [eleitos]);
  const foto = useMemo(() => (fotos ? fotoDe(p, fotos) : null), [fotos, p]);
  const [patrimonioAberto, setPatrimonioAberto] = useState(false);
  const fecharPatrimonio = useCallback(() => setPatrimonioAberto(false), []);

  const abrir = (id: number) => {
    mudar("sel", id);
    escada.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const filtros = (
    <>
      <Campo rotulo="Estado">
        <SeletorUf id="f-uf" value={f.uf} onChange={e => mudar("uf", e.target.value)} />
      </Campo>
    </>
  );

  return (
    <Pagina filtros={filtros}>
      <Etiqueta>PERGUNTA 10 · CARREIRA</Etiqueta>
      <h1>Quanto dura a carreira de um político?</h1>
      <p className="texto-enunciado">
        Enunciado: dado certo político, como foi a sobrevivência de sua carreira (linha do tempo de participações,
        vitórias, derrotas e reeleições)? [máximo possível: 2002 a 2024]
      </p>

      <Carreira
        pessoas={pessoas}
        doEstado={doEstado}
        uf={f.uf}
        sel={sel}
        foto={foto}
        fotosProntas={fotos != null}
        aoEscolher={id => mudar("sel", id)}
        aoPatrimonio={() => setPatrimonioAberto(true)}
        raiz={escada}
      />
      {patrimonioAberto && <Patrimonio D={D} p={p} fin={fin} foto={foto} aoFechar={fecharPatrimonio} />}
      <Campanha p={p} fin={fin} />

      <Comparar D={D} f={f} mudar={mudar} />
      <Reeleicao D={D} f={f} mudar={mudar} />
      <Ranking pessoas={doEstado} f={f} mudar={mudar} aoAbrir={abrir} />
      <Metodo D={D} />
    </Pagina>
  );
}
