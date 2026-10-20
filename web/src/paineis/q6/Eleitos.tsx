import { VerMais } from "../../componentes";
import { fmt, maiusculaInicial } from "../../lib/formato";
import { noEstado } from "../../lib/uf";
import { CARGOS_TABELA, linhasEleitos } from "./calculo";
import type { Ctx } from "./tipos";

/** Bloco "Ver mais": idade média dos eleitos, cargo por cargo. */
export function Eleitos({ D, f }: Pick<Ctx, "D" | "f">) {
  const iu = f.uf === "TODAS" ? -1 : D.ufs.indexOf(f.uf);
  const linhas = linhasEleitos(D.eleitos, iu);
  const v24 = linhas.find(l => l.cargo === 0 && l.ano === 2024);

  return (
    <VerMais titulo="Idade média dos eleitos, cargo por cargo">
      {v24 && (
        <p className="texto-simples text-[15.5px]!">
          {maiusculaInicial(noEstado(f.uf))}, a idade média dos vereadores eleitos em 2024 é de{" "}
          <b>{fmt(v24.idadeEleitos)} anos</b>; só {fmt(v24.eleitosJovens)}% têm até 29 anos. Quem tem de 30 a 59 anos
          tem mais chance de vencer ({fmt(v24.chanceMeio)}% dos candidatos dessa faixa se elegeram, contra{" "}
          {fmt(v24.chanceJovem)}% dos jovens e {fmt(v24.chance60)}% dos de 60+).
        </p>
      )}
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
        Idade na data da eleição. Jovem = 18 a 29 anos (no candidato); idoso = 60 anos ou mais. "Chance de vencer" =
        eleitos ÷ candidatos da faixa.
      </p>
    </VerMais>
  );
}

/** Bloco "Ver mais": método e limites dos dados. */
export function Metodo() {
  return (
    <VerMais titulo="Como calculamos e o que os dados não dizem">
      <ul>
        <li>
          <b>Idade da cidade:</b> idade média da população no Censo 2022 (IBGE, SIDRA 9606), cada faixa de 5 anos pelo
          meio dela. As cidades foram divididas em <b>terços</b>: mais jovens, intermediárias e mais velhas.
        </li>
        <li>
          <b>Por que comparar dentro do estado:</b> a idade da cidade é quase o estado. Quase todas as cidades do
          Amazonas e do Maranhão estão no terço mais jovem, e dois terços das do Rio Grande do Sul no mais velho. "Do
          mesmo estado" refaz os terços dentro de cada estado.
        </li>
        <li>
          <b>Eleitorado:</b> perfil do eleitor do TSE por faixa de idade (perfil_comparecimento_abstencao), 1º turno.
          Jovem = 16 a 29 anos no eleitorado (Estatuto da Juventude, Lei 12.852/2013); idoso = 60 anos ou mais (Lei
          10.741/2003).
        </li>
        <li>
          <b>Alternância:</b> o partido do prefeito eleito mudou de 2016 para 2020 e de 2020 para 2024. Renomeações e
          fusões não contam (dados/referencia/partido_sucessao.csv). A reeleição segue a pessoa pelo título de eleitor.
        </li>
        <li>
          <b>Médias dos grupos:</b> as idades (população, eleitorado, vereadores, prefeito) são a média das cidades,
          cada cidade contando uma vez, para a capital não puxar o grupo; a parcela de votos e de eleitores jovens é
          pesada pelos votos e pelos eleitores.
        </li>
        <li>
          <b>Correlação:</b> de Pearson, cidade a cidade (de −1 a 1; perto de 0, uma coisa não acompanha a outra).
        </li>
        <li>
          <b>O que não dá para dizer:</b> é medido por cidade, não por eleitor (falácia ecológica). Só 7% a 10% dos
          candidatos a vereador são jovens: o eleitor jovem tem pouco em quem votar. E correlação não é causa.
        </li>
        <li>
          <b>Consulta no banco:</b> views <i>q6_municipio</i>, <i>q6_voto_idade</i>, <i>q6_idade_eleitos</i> e{" "}
          <i>q6_voto_idade_correlacao</i> em <i>sql/20_q6_idade.sql</i>; tabelas CENSO_FAIXA_ETARIA e
          COMPARECIMENTO_PERFIL (<i>sql/19_faixa_etaria.sql</i>). Análise: Eduardo, <i>docs/q6-idade.md</i>.
        </li>
      </ul>
    </VerMais>
  );
}
