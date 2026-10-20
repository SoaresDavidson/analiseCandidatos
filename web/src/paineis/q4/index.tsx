import { useMemo, useRef, useState } from "react";
import { Alternador, Campo, Carregando, Etiqueta, Pagina, Seletor, VerMais } from "../../componentes";
import { useDados } from "../../lib/dados";
import { int } from "../../lib/formato";
import { usePersistente } from "../../lib/usePersistente";
import { Cidades } from "./Cidades";
import { chance, prepararEleitos, prepararMunicipios, teste, totaisPorAno } from "./calculo";
import { Graus } from "./Graus";
import { Mapa } from "./Mapa";
import { Moda } from "./Moda";
import { Perfil } from "./Perfil";
import { Resposta } from "./Resposta";
import { CARGO, CARGOS, type DadosQ4, type Filtros, type Metrica, UF_NOME, UFS } from "./tipos";

const PADRAO: Filtros = { ano: 2024, uf: "TODAS", cargo: 13, mapaUf: "MA", metrica: "pop", semCap: false };

function Conteudo({ D }: { D: DadosQ4 }) {
  const [salvo, setFiltros] = usePersistente<Filtros>("q4-tse", PADRAO);
  // valor salvo de uma versão antiga que não combina ano e cargo volta ao padrão
  const f: Filtros = CARGOS[salvo.ano]?.includes(salvo.cargo) ? salvo : { ...salvo, ano: 2024, cargo: 13 };
  const [sel, setSel] = useState<number | null>(null);
  const svgMapa = useRef<SVGSVGElement>(null);

  const MUN = useMemo(() => prepararMunicipios(D), [D]);
  const MUN_BY = useMemo(() => Object.fromEntries(MUN.map(m => [m.cod, m])), [MUN]);
  const ELEITOS = useMemo(() => prepararEleitos(D), [D]);
  const totais = useMemo(() => totaisPorAno(D.chance), [D]);

  const ufs = useMemo(() => (f.uf === "TODAS" ? UFS : [f.uf]), [f.uf]);
  const r = useMemo(() => chance(D.chance, f.ano, ufs, f.cargo), [D, f.ano, ufs, f.cargo]);
  const t = useMemo(() => teste(r), [r]);

  const mudar = (p: Partial<Filtros>) => setFiltros({ ...f, ...p });
  const mudarAno = (ano: number) => mudar({ ano, cargo: CARGOS[ano].includes(f.cargo) ? f.cargo : CARGOS[ano][0] });
  const mudarUf = (uf: string) => {
    if (uf !== "TODAS") {
      mudar({ uf, mapaUf: uf });
      setSel(null);
    } else mudar({ uf });
  };
  const mudarMapaUf = (mapaUf: string) => {
    mudar({ mapaUf });
    setSel(null);
  };

  // clicar numa cidade da dispersão leva o mapa para a vista
  const escolherNaDispersao = (cod: number) => {
    setSel(cod);
    requestAnimationFrame(() => svgMapa.current?.scrollIntoView({ block: "center", behavior: "smooth" }));
  };

  const filtros = (
    <>
      <Campo rotulo="Estado">
        <Seletor value={f.uf} onChange={e => mudarUf(e.target.value)}>
          <option value="TODAS">Todos os 6 estados</option>
          {UFS.map(u => (
            <option key={u} value={u}>
              {UF_NOME[u]}
            </option>
          ))}
        </Seletor>
      </Campo>
      <span className="grid gap-[3px] text-[13px] font-bold">
        Eleição
        <Alternador
          rotulo="Eleição"
          opcoes={
            [
              [2022, "2022"],
              [2024, "2024"],
            ] as const
          }
          valor={f.ano}
          aoMudar={mudarAno}
        />
      </span>
      <span className="grid gap-[3px] text-[13px] font-bold">
        Cargo
        <Alternador
          rotulo="Cargo"
          opcoes={CARGOS[f.ano].map(c => [c, CARGO[c]] as const)}
          valor={f.cargo}
          aoMudar={cargo => mudar({ cargo })}
        />
      </span>
    </>
  );

  return (
    <Pagina filtros={filtros}>
      <Etiqueta>PERGUNTA 4 · ESCOLARIDADE</Etiqueta>
      <h1>Quem estuda mais se elege mais?</h1>
      <p className="texto-enunciado">
        Enunciado: grau de escolaridade do candidato × grau de escolaridade dos votadores; existe relação entre
        escolaridade do candidato e sua chance de ser eleito? Locais com menor escolaridade costumam eleger pessoas de
        semelhante escolaridade? [2022, 2024]
      </p>

      <Resposta D={D} f={f} ufs={ufs} r={r} t={t} />

      <Mapa
        D={D}
        MUN={MUN}
        MUN_BY={MUN_BY}
        ELEITOS={ELEITOS}
        f={f}
        ufs={ufs}
        sel={sel}
        svgRef={svgMapa}
        aoSelecionar={setSel}
        aoMudarMapaUf={mudarMapaUf}
        aoMudarMetrica={(metrica: Metrica) => mudar({ metrica })}
        aoBuscar={m => {
          mudar({ mapaUf: m.u });
          setSel(m.cod);
        }}
      />

      <Perfil D={D} f={f} ufs={ufs} />
      <Graus f={f} ufs={ufs} r={r} t={t} ELEITOS={ELEITOS} MUN_BY={MUN_BY} />
      <Cidades MUN={MUN} f={f} ufs={ufs} aoMudarSemCap={semCap => mudar({ semCap })} aoEscolher={escolherNaDispersao} />
      <Moda MUN={MUN} ufs={ufs} />

      <VerMais titulo="Como calculamos">
        <ul>
          <li>
            <b>Candidatos:</b> TSE, cadastro de candidaturas (<i>consulta_cand</i>) de 2022 e 2024. Escolaridade
            declarada pelo próprio candidato.
          </li>
          <li>
            <b>População:</b> IBGE, Censo 2022, tabela SIDRA 10061: pessoas de 18 anos ou mais por nível de instrução. É
            escolaridade medida, não declarada no título de eleitor.
          </li>
          <li>
            <b>Quem entra:</b> eleições ordinárias, sem presidente, vices e suplentes, só quem foi a voto e informou a
            escolaridade.{" "}
            <span>
              Total: {int(totais.n22)} candidaturas em 2022 ({int(totais.e22)} eleitos) e {int(totais.n24)} em 2024 (
              {int(totais.e24)} eleitos).
            </span>
          </li>
          <li>
            <b>Chance de se eleger:</b> eleitos ÷ candidatos de cada nível, sempre dentro do mesmo cargo. O teste é o
            qui-quadrado.
          </li>
          <li>
            <b>Exceções:</b> 9 cidades sem prefeito eleito na eleição normal de 2024 (eleição anulada); 17 cidades sem
            resultado de vereador no arquivo do TSE; Boa Esperança do Norte (MT) foi criada depois do Censo.
          </li>
          <li>
            <b>Cuidado:</b> isso mostra o que anda junto, não o que causa. E o mapa compara cidades, não pessoas: não
            sabemos em quem cada eleitor votou.
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}

export default function Painel() {
  const { dados, erro } = useDados<DadosQ4>("q4.json");
  if (!dados) return <Carregando erro={erro} />;
  return <Conteudo D={dados} />;
}
