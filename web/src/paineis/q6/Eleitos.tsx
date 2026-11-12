import { VerMais } from "../../componentes";
import { fmt } from "../../lib/formato";
import { CARGOS_TABELA, linhasEleitos } from "./calculo";
import type { DadosQ6, Filtros } from "./tipos";

/** Bloco "Ver mais": idade média dos eleitos, cargo por cargo, de 2018 a 2024. */
export function Eleitos({ D, f }: { D: DadosQ6; f: Filtros }) {
  const linhas = linhasEleitos(D.eleitos, f.uf ? D.ufs.indexOf(f.uf) : -1);
  return (
    <VerMais titulo="Idade dos eleitos, cargo por cargo (2018 a 2024)">
      <div className="rolagem-x">
        <table>
          <thead>
            <tr>
              <th>Cargo</th>
              <th>Idade dos candidatos</th>
              <th>dos eleitos</th>
              <th>Eleitos jovens</th>
              <th>Eleitos de 60+</th>
              <th>Chance de vencer: jovem</th>
              <th>30–59</th>
              <th>60+</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(l => (
              <tr key={`${l.cargo}-${l.ano}`}>
                <td>
                  <b>{CARGOS_TABELA[l.cargo]}</b> {l.ano}
                </td>
                <td>{fmt(l.idadeCand)}</td>
                <td>{fmt(l.idadeEleitos)}</td>
                <td>{fmt(l.eleitosJovens)}%</td>
                <td>{fmt(l.eleitos60)}%</td>
                <td>{fmt(l.chanceJovem)}%</td>
                <td>{fmt(l.chanceMeio)}%</td>
                <td>{fmt(l.chance60)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="texto-nota">
        Idade na data da eleição. Jovem = 18 a 29 anos; "chance de vencer" = eleitos ÷ candidatos da faixa. Fonte: TSE,
        registro de candidaturas.
      </p>
    </VerMais>
  );
}

/** Bloco "Ver mais": de onde vêm os dados e o que eles não dizem. */
export function Metodo() {
  return (
    <VerMais titulo="De onde vêm os dados e como calculamos">
      <ul>
        <li>
          <b>Quem mora:</b> IBGE, Censo 2022 (SIDRA 9606): idade média da população de cada cidade, cada faixa de 5 anos
          pelo meio dela. Conta as crianças, por isso é menor que a dos eleitores.
        </li>
        <li>
          <b>Quem vota:</b> TSE, perfil do eleitorado de 2024 por faixa de idade, 1º turno. Jovem = 16 a 29 anos
          (Estatuto da Juventude); idoso = 60 anos ou mais (Estatuto da Pessoa Idosa).
        </li>
        <li>
          <b>Em quem vota:</b> TSE, votação para vereador em 2024 em cada cidade. A idade de cada candidato conta pelos
          votos que ele recebeu. Só entram idades de 18 a 100 anos (o TSE tem datas de nascimento erradas).
        </li>
        <li>
          <b>Cidades mais jovens e mais velhas:</b> as cidades em três grupos do mesmo tamanho pela idade de quem mora:
          entre todas as do país, ou, ao escolher um estado, entre as dele.
        </li>
        <li>
          <b>Alternância:</b> o partido do prefeito eleito mudou de 2020 para 2024. Mudança de nome e fusão não contam
          (dados/referencia/partido_sucessao.csv).
        </li>
        <li>
          <b>O que não dá para dizer:</b> o voto é secreto. Os números são da cidade, não de cada eleitor: sabemos a
          idade de quem vota e de quem foi votado ali, não quem votou em quem.
        </li>
        <li>
          <b>Consulta no banco:</b> views <i>q6_municipio</i>, <i>q6_voto_idade</i> e <i>q6_idade_eleitos</i> em{" "}
          <i>sql/20_q6_idade.sql</i>. Análise: Eduardo, <i>docs/q6-idade.md</i>.
        </li>
      </ul>
    </VerMais>
  );
}
