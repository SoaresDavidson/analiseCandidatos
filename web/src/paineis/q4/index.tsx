import { useCallback, useEffect, useRef, useState } from "react";
import { Carregando, type MalhaBrasil, type MalhaUf } from "../../componentes";
import { carregarDados, useDados } from "../../lib/dados";
import { usePersistente } from "../../lib/usePersistente";
import { Capa, Guarda } from "./Capa";
import { Cidade } from "./Cidade";
import { prepararEleitos, prepararMunicipios } from "./calculo";
import { CAPITULOS, INDICE_BRASIL, indiceDoEstado, nomeDoCapitulo } from "./capitulos";
import { type Abertura, Livro } from "./Livro";
import { MapaEstado, MapaPais } from "./MapaLivro";
import { NotasCuidados, NotasFontes } from "./Notas";
import { Resumo } from "./Resumo";
import { Sumario } from "./Sumario";
import type { DadosQ4, DadosUf, EstadoPronto, Filtros } from "./tipos";

const TITULO = "Quem estuda mais se elege mais?";
const PADRAO: Filtros = { cargo: 13, metrica: "pop" };

/** Busca os dados e o mapa de um estado (uma vez só) e deixa prontos para as páginas dele. */
async function prepararEstado(uf: string): Promise<EstadoPronto> {
  const [dados, malha] = await Promise.all([
    carregarDados<DadosUf>(`q4/${uf}.json`),
    carregarDados<MalhaUf>(`malhas/${uf}.json`),
  ]);
  const MUN = prepararMunicipios(dados);
  return { uf, MUN, MUN_BY: Object.fromEntries(MUN.map(m => [m.cod, m])), ELEITOS: prepararEleitos(dados), malha };
}

function Conteudo({ D, B }: { D: DadosQ4; B: MalhaBrasil }) {
  const [aberto, setAberto] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [f, setF] = usePersistente<Filtros>("q4-livro", PADRAO);
  const [estados, setEstados] = useState<Record<string, EstadoPronto>>({});
  // espelho de `estados` para as funções que não podem depender dele (irPara, garantir)
  const prontos = useRef(estados);
  useEffect(() => {
    prontos.current = estados;
  }, [estados]);
  const [erro, setErro] = useState<Error | null>(null);

  const garantir = useCallback(async (uf: string) => {
    if (prontos.current[uf]) return;
    const pronto = await prepararEstado(uf);
    setEstados(antes => (antes[uf] ? antes : { ...antes, [uf]: pronto }));
  }, []);

  /** Vai para uma abertura; se for um estado ainda não carregado, busca antes de virar as folhas.
   *  Só vira (ou mostra o erro) se este ainda for o último destino pedido: a resposta atrasada de
   *  um estado lento não traz o livro de volta para ele. */
  const destino = useRef(0);
  const irPara = useCallback(
    (indice: number) => {
      const c = CAPITULOS[indice];
      if (!c) return;
      destino.current = indice;
      setErro(null);
      const virar = () => {
        if (destino.current !== indice) return;
        setSel(null);
        setPagina(indice);
      };
      if (c.tipo === "estado" && !prontos.current[c.uf])
        garantir(c.uf).then(virar, e => {
          if (destino.current === indice) setErro(e);
        });
      else virar();
    },
    [garantir],
  );

  // deixa os capítulos vizinhos carregados, para a seta de "próxima" virar na hora
  useEffect(() => {
    for (const i of [pagina - 1, pagina + 1]) {
      const c = CAPITULOS[i];
      if (c?.tipo === "estado") garantir(c.uf).catch(() => {});
    }
  }, [pagina, garantir]);

  const fechar = () => {
    setAberto(false);
    setSel(null);
    setPagina(0);
  };
  const mudar = (p: Partial<Filtros>) => setF(antes => ({ ...antes, ...p }));

  const desenhar = (indice: number): Abertura => {
    const c = CAPITULOS[indice];
    const cabeca = nomeDoCapitulo(c);
    if (c.tipo === "sumario") return { cabeca, esquerda: null, direita: <Sumario aoIr={irPara} /> };
    if (c.tipo === "brasil")
      return {
        cabeca,
        esquerda: (
          <MapaPais
            D={D}
            B={B}
            metrica={f.metrica}
            aoMudarMetrica={metrica => mudar({ metrica })}
            aoEscolherUf={uf => irPara(indiceDoEstado(uf))}
          />
        ),
        direita: <Resumo D={D} escopo="BR" indice={INDICE_BRASIL} f={f} aoMudar={mudar} />,
      };
    if (c.tipo === "notas") return { cabeca, esquerda: <NotasFontes D={D} />, direita: <NotasCuidados D={D} /> };

    const P = estados[c.uf];
    // a cidade escolhida só vale na abertura em que o livro está
    const cidade = indice === pagina && P && sel != null && P.MUN_BY[sel] ? sel : null;
    return {
      cabeca,
      esquerda: P ? (
        <MapaEstado
          P={P}
          metrica={f.metrica}
          sel={cidade}
          aoMudarMetrica={metrica => mudar({ metrica })}
          aoSelecionar={setSel}
        />
      ) : (
        <Carregando />
      ),
      direita:
        P && cidade != null ? (
          <Cidade P={P} cod={cidade} indice={indice} aoVoltar={() => setSel(null)} />
        ) : (
          <Resumo D={D} escopo={c.uf} indice={indice} regiao={c.regiao} f={f} aoMudar={mudar} />
        ),
    };
  };

  return (
    <div className="livro-palco">
      <Livro
        aberto={aberto}
        aoAbrir={() => setAberto(true)}
        pagina={pagina}
        desenhar={desenhar}
        titulo={TITULO}
        capa={<Capa />}
        guarda={<Guarda aoFechar={fechar} />}
        aoIrAoSumario={() => irPara(0)}
      />
      <div className="livro-barra">
        {aberto ? (
          <>
            <button type="button" className="livro-botao" disabled={pagina === 0} onClick={() => irPara(pagina - 1)}>
              ‹ Página anterior
            </button>
            <button type="button" className="livro-botao" disabled={pagina === 0} onClick={() => irPara(0)}>
              Sumário
            </button>
            <button
              type="button"
              className="livro-botao"
              disabled={pagina === CAPITULOS.length - 1}
              onClick={() => irPara(pagina + 1)}
            >
              Próxima página ›
            </button>
            <button type="button" className="livro-botao ml-3" onClick={fechar}>
              Fechar o livro
            </button>
            {erro && <span role="alert">Não deu para carregar este capítulo ({erro.message}).</span>}
          </>
        ) : (
          <span className="font-livro text-[17px] italic motion-safe:animate-[livro-chama_2.2s_ease-in-out_infinite]">
            Clique no livro para abrir
          </span>
        )}
      </div>
    </div>
  );
}

export default function Painel() {
  const { dados: D, erro } = useDados<DadosQ4>("q4.json");
  const { dados: B, erro: erroB } = useDados<MalhaBrasil>("malhas/brasil.json");
  if (!D || !B) return <Carregando erro={erro ?? erroB} />;
  return <Conteudo D={D} B={B} />;
}
