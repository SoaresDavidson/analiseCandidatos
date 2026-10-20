import { useMemo } from "react";
import { Alternador, Campo, Carregando, Etiqueta, Pagina, SeletorUf, VerMais } from "../../componentes";
import { useDados } from "../../lib/dados";
import { int } from "../../lib/formato";
import { usePersistente } from "../../lib/usePersistente";
import { Composicao } from "./Composicao";
import { anoAoTrocarCargo, anosDoCargo, CARGO_ROT, somarFaixas } from "./calculo";
import { Escada, Resposta } from "./Resposta";
import { Todos } from "./Todos";
import type { DadosQ2, Filtros } from "./tipos";

const PADRAO: Filtros = { uf: "TODAS", cargo: 0, ano: 2024 };

export default function Painel() {
  const { dados } = useDados<DadosQ2>("q2.json");
  return dados ? <Conteudo D={dados} /> : <Carregando />;
}

function Conteudo({ D }: { D: DadosQ2 }) {
  const [salvo, setF] = usePersistente<Filtros>("q2-tse", PADRAO);
  // ano salvo que não existe para o cargo cai na eleição mais recente dele
  const f = anosDoCargo(salvo.cargo).includes(salvo.ano) ? salvo : { ...salvo, ano: anosDoCargo(salvo.cargo)[1] };
  const s = useMemo(() => somarFaixas(D, f.cargo, f.ano, f.uf), [D, f.cargo, f.ano, f.uf]);

  const escolher = (cargo: number, ano: number) => {
    setF(x => ({ ...x, cargo, ano }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Pagina
      filtros={
        <>
          <Campo rotulo="Estado">
            <SeletorUf value={f.uf} onChange={e => setF(x => ({ ...x, uf: e.target.value }))} />
          </Campo>
          <Campo rotulo="Cargo" grupo>
            <Alternador
              rotulo="Cargo"
              opcoes={CARGO_ROT.map((r, i) => [i, r] as const)}
              valor={f.cargo}
              aoMudar={c => setF(x => ({ ...x, cargo: c, ano: anoAoTrocarCargo(f.cargo, f.ano, c) }))}
            />
          </Campo>
          <Campo rotulo="Eleição" grupo>
            <Alternador
              rotulo="Eleição"
              opcoes={anosDoCargo(f.cargo).map(a => [a, String(a)] as const)}
              valor={f.ano}
              aoMudar={a => setF(x => ({ ...x, ano: a }))}
            />
          </Campo>
        </>
      }
    >
      <Etiqueta>PERGUNTA 2 · PATRIMÔNIO × SUCESSO</Etiqueta>
      <h1>Quem tem mais patrimônio se elege mais?</h1>
      <p className="texto-enunciado">
        Enunciado: qual a taxa de sucesso eleitoral por patrimônio declarado? [2018–2024]
      </p>

      <div className="grade-duas">
        <Resposta f={f} s={s} />
        <Escada D={D} f={f} s={s} />
      </div>

      <Todos D={D} f={f} escolher={escolher} />
      <Composicao D={D} f={f} />

      <VerMais titulo="Como calculamos e o que os dados não dizem">
        <ul>
          <li>
            <b>Patrimônio:</b> soma dos bens que o candidato declarou ao TSE no registro da candidatura. Para comparar
            anos, em reais de agosto de 2024 (IPCA de agosto, IBGE, SIDRA 1737).
          </li>
          <li>
            <b>Faixas:</b> "sem bens" (nada declarado) e os <b>quintos</b> do patrimônio, cortados dentro de cada cargo
            e eleição, nos 6 estados juntos: cada quinto tem 20% dos candidatos que declararam bens. Faixas fixas em
            reais não serviriam, porque o patrimônio típico de um senador é 10 vezes o de um vereador.
          </li>
          <li>
            <b>Taxa de eleição:</b> eleitos ÷ candidatos que foram a voto. Com um estado escolhido, a página soma os
            eleitos e os candidatos daquele estado (os limites dos quintos continuam os dos 6 estados).
          </li>
          <li>
            <b>O teste:</b> qui-quadrado de independência (6 faixas × eleito ou não), refeito na página para o filtro.
            Só vale com pelo menos 5 casos esperados em cada célula; governador e senador quase nunca passam.
          </li>
          <li>
            <b>Erro de digitação:</b> candidaturas com algum bem de R$ 100 milhões ou mais ficam fora das faixas (
            {int(D.suspeitos[0])} de {int(D.suspeitos[1])} candidaturas). Devolvê-las ao quinto mais rico não muda
            nenhuma taxa em mais de 0,5 ponto.
          </li>
          <li>
            <b>O que não dá para dizer:</b> é o patrimônio <b>declarado</b>, não o real (imóvel costuma ir pelo valor de
            compra). E é associação, não causa: quem já tem mandato tende a ser mais velho, mais conhecido e a ter
            acumulado mais bens.
          </li>
          <li>
            <b>Consulta no banco:</b> views <i>q2_faixa</i>, <i>q2_limite</i>, <i>q2_quiquadrado</i> e{" "}
            <i>q2_composicao</i> em <i>sql/18_q2_patrimonio.sql</i>; tabela BEM_CANDIDATO. Análise: Enrico,{" "}
            <i>docs/q2-patrimonio.md</i>.
          </li>
        </ul>
      </VerMais>
    </Pagina>
  );
}
