import { VerMais } from "../../componentes";

/** Bloco "Como calculamos". */
export function Metodo() {
  return (
    <VerMais titulo="De onde vêm os dados e como calculamos">
      <ul>
        <li>
          <b>Nota de um lugar:</b> média das notas dos partidos (0 = esquerda, 10 = direita), cada voto pesando a nota
          do partido do candidato votado. 1º turno. Fonte dos votos: TSE.
        </li>
        <li>
          <b>Mesmo cargo para comparar:</b> deputado federal nas eleições gerais (2018 × 2022) e vereador nas municipais
          (2020 × 2024). Os dois são proporcionais: todos os partidos aparecem. Não comparamos deputado com vereador.
        </li>
        <li>
          <b>Notas dos partidos:</b> pesquisa com cientistas políticos, de Bolognesi, Ribeiro e Codato (2023),{" "}
          <i>Dados</i> 66(2), rodada de 2018. Tabela sem alteração em <i>dados/referencia/</i>. As 7 faixas (de extrema
          esquerda a extrema direita) são as do artigo.
        </li>
        <li>
          <b>A mesma régua nos quatro anos:</b> os especialistas reavaliaram os partidos em 2022 (o PL foi de 7,78 para
          8,80). Aqui cada partido fica com a nota de 2018 em todas as eleições, então o que muda de um ano para o outro
          é só o voto. Por isso o PL aparece em 7,78.
        </li>
        <li>
          <b>Fusões:</b> o partido novo recebe a média dos que se fundiram (União = DEM e PSL), a mesma regra dos
          autores; renomeações mantêm a nota (PR → PL, PRB → Republicanos).
        </li>
        <li>
          <b>Lula e Bolsonaro:</b> marcam a nota do PT e do PL, os partidos pelos quais disputaram o 2º turno de 2022.
          Fotos do registro de candidatura no TSE.
        </li>
        <li>
          <b>Cidade pequena:</b> com poucos partidos na disputa, a nota oscila muito de uma eleição para outra.
        </li>
        <li>
          <b>Consulta no banco:</b> views <i>q7_vies_municipio</i> e <i>q7_prefeito</i> em <i>sql/17_q7_vies.sql</i>.
        </li>
      </ul>
    </VerMais>
  );
}
