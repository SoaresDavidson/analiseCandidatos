import { useCallback, useLayoutEffect, useMemo } from "react";
import { Carregando, Pagina, VerMais } from "../../componentes";
import { useDados } from "../../lib/dados";
import { usePersistente } from "../../lib/usePersistente";
import type { PainelProps } from "../tipos";
import { Cidade } from "./Cidade";
import { Estado } from "./Estado";
import { Estados } from "./Estados";
import type { DadosCandidatos, DadosMunicipios, Navegou } from "./tipos";
import { lerMunicipios } from "./util";

const PADRAO: Navegou = { nivel: "estados", uf: null, cod: null, ordem: "nome", vis: "grade", lado: "todos" };

export default function Painel({ extra }: PainelProps) {
  const mun = useDados<DadosMunicipios>("municipios-cidades.json");
  const cand = useDados<DadosCandidatos>("candidatos-eleitos.json");  // já busca as fichas, para a cidade abrir na hora
  if (!mun.dados) return <Carregando erro={mun.erro} />;
  return <Corpo D={mun.dados} cand={cand.dados} extra={extra} />;
}

function Corpo({ D, cand, extra }: { D: DadosMunicipios; cand: DadosCandidatos | null; extra?: string }) {
  const M = useMemo(() => lerMunicipios(D.municipios, D.ufs), [D]);
  const porCod = useMemo(() => new Map(M.map(m => [m.cod, m])), [M]);
  // o nível, o estado e os filtros ficam guardados para a página voltar ao mesmo ponto
  const [nav, setNav] = usePersistente<Navegou>("mun-tse", PADRAO);

  // link direto: #municipios/2111300 abre a cidade; #municipios/MA abre o estado
  useLayoutEffect(() => {
    if (!extra) return;
    if (/^\d+$/.test(extra)) {
      const m = porCod.get(Number(extra));
      if (m) setNav(n => ({ ...n, nivel: "cidade", cod: m.cod, uf: m.uf }));
    } else if (D.ufs.includes(extra.toUpperCase())) {
      setNav(n => ({ ...n, nivel: "uf", uf: extra.toUpperCase(), lado: "todos" }));
    }
  }, [extra, porCod, D.ufs, setNav]);

  const ir = useCallback((parcial: Partial<Navegou>) => {
    setNav(n => ({ ...n, ...parcial }));
    if (parcial.nivel) window.scrollTo(0, 0);
  }, [setNav]);

  // estado salvo inválido volta para o primeiro nível
  const cidade = nav.cod != null ? porCod.get(nav.cod) : undefined;
  const nivel = nav.nivel === "uf" && !nav.uf ? "estados" : nav.nivel === "cidade" && !cidade ? "estados" : nav.nivel;

  return (
    <Pagina>
      {nivel === "estados" && <Estados M={M} ufs={D.ufs} regua={D.regua} aoAbrirUf={uf => ir({ nivel: "uf", uf, lado: "todos" })} />}
      {nivel === "uf" && nav.uf && (
        <Estado M={M} uf={nav.uf} meio={D.regua.meio} nav={nav} aoMudar={ir} aoAbrirCidade={cod => ir({ nivel: "cidade", cod })} />
      )}
      {nivel === "cidade" && cidade && <Cidade key={cidade.cod} M={cidade} D={D} cand={cand} aoVoltar={() => ir({ nivel: "uf", uf: cidade.uf })} />}

      <VerMais titulo="Como calculamos">
        <ul>
          <li><b>Nota do partido:</b> média dada por cientistas políticos na rodada de 2022 (Bolognesi, Ribeiro, Codato e Silva, 2025, <i>Opinião Pública</i> 31), de 0 = esquerda a 10 = direita. Tabela do artigo em <i>dados/referencia/</i>.</li>
          <li><b>Categorias:</b> os cortes do próprio artigo (0–1,5 extrema esquerda; até 3 esquerda; até 4,49 centro-esquerda; até 5,5 centro; até 7 centro-direita; até 8,5 direita; acima, extrema direita). Nenhum partido caiu no centro: é a conclusão do artigo.</li>
          <li><b>A régua:</b> vai do partido mais à esquerda que elegeu alguém em 2024 nos 6 estados ao mais à direita; o meio dela separa "tende à esquerda" de "tende à direita".</li>
          <li><b>Nota da cidade:</b> cada voto para vereador (1º turno de 2024) pesa a nota do partido do candidato. Também mostramos a média da câmara eleita, o partido do prefeito e o voto para deputado federal em 2022.</li>
          <li><b>Fora das rodadas:</b> PRD (fusão de PTB e Patriota em 2023) recebe a média dos dois, marcado como estimado; Mobiliza é o PMN renomeado.</li>
          <li><b>Consulta no banco:</b> views <i>espectro_municipio</i>, <i>espectro_regua</i> e <i>dinheiro_municipio</i> em <i>sql/15_espectro.sql</i>; tabela ESPECTRO_PARTIDO do modelo.</li>
        </ul>
      </VerMais>
    </Pagina>
  );
}
