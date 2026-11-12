import { VerMais } from "../../componentes";

/** Bloco "De onde vêm os dados". */
export function Metodo() {
  return (
    <VerMais titulo="De onde vêm os dados e como calculamos">
      <ul>
        <li>
          <b>Quem mora:</b> IBGE, Censo 2022 (SIDRA 9606): idade média da população de cada cidade, cada faixa de 5 anos
          pelo meio dela. Conta as crianças, por isso é menor que a dos eleitores.
        </li>
        <li>
          <b>Eleitores:</b> TSE, perfil do eleitorado de 2024 por faixa de idade, 1º turno. Jovem = 16 a 29 anos
          (Estatuto da Juventude); idoso = 60 anos ou mais (Estatuto da Pessoa Idosa).
        </li>
        <li>
          <b>Candidatos:</b> TSE, votação para vereador em 2024 em cada cidade. É a idade de quem recebeu os votos: a de
          cada candidato conta pelos votos que ele teve. Só entram idades de 18 a 100 anos (o TSE tem datas de
          nascimento erradas).
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
