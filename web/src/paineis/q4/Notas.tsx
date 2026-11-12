import { int } from "../../lib/formato";
import { totaisPorAno } from "./calculo";
import { LegendaNiveis } from "./comum";
import type { DadosQ4 } from "./tipos";

/** Última abertura, página da esquerda: de onde vêm os números e como a conta é feita. */
export function NotasFontes({ D }: { D: DadosQ4 }) {
  const t = totaisPorAno(D.chance);
  return (
    <div className="grid content-start gap-3">
      <div>
        <div className="livro-sobre">Notas e fontes</div>
        <h2 className="livro-titulo">Como calculamos</h2>
      </div>
      <ul className="m-0 grid list-none gap-2.5 p-0 text-[14px] leading-snug">
        <li>
          <b>Candidatos e eleitos.</b> TSE, cadastro de candidaturas (arquivo <i>consulta_cand</i>) de 2022 e 2024; a de
          2026 entra à parte, com o resultado do 1º turno. A escolaridade é a declarada pelo próprio candidato no
          registro.
        </li>
        <li>
          <b>População.</b> IBGE, Censo 2022, tabela SIDRA 10061: pessoas de 18 anos ou mais por nível de instrução. É
          escolaridade medida pelo Censo, não a declarada no título de eleitor.
        </li>
        <li>
          <b>Quem entra na conta.</b> Eleições ordinárias dos 27 estados, sem presidente, vices e suplentes; só quem foi
          a voto e informou a escolaridade. São {int(t.n22)} candidaturas em 2022 ({int(t.e22)} eleitos) e {int(t.n24)}{" "}
          em 2024 ({int(t.e24)} eleitos).
        </li>
        <li>
          <b>Chance de se eleger.</b> Eleitos ÷ candidatos de cada nível, sempre dentro do mesmo cargo. O teste
          estatístico é o qui-quadrado: abaixo de 5% de chance de acaso, dizemos que a diferença é real.
        </li>
        <li>
          <b>Cidades.</b> Só 2024, a eleição em que prefeito e vereadores são da própria cidade. As cidades são
          ordenadas pela parcela de adultos com faculdade e divididas em 5 grupos do mesmo tamanho; comparamos o grupo
          menos formado com o mais formado.
        </li>
      </ul>
      <h3 className="livro-secao">Os 4 níveis</h3>
      <LegendaNiveis />
      <p className="livro-nota">
        São os níveis do Censo. Cada um inclui quem começou a etapa seguinte sem terminar: "médio completo" inclui
        faculdade incompleta. Os 8 graus que o candidato declara ao TSE foram agrupados nesses 4.
      </p>
    </div>
  );
}

/** Última abertura, página da direita: o que os números não dizem. */
export function NotasCuidados({ D }: { D: DadosQ4 }) {
  const x = D.excecoes;
  return (
    <div className="grid content-start gap-3">
      <div>
        <div className="livro-sobre">Antes de fechar o livro</div>
        <h2 className="livro-titulo">Cuidados na leitura</h2>
      </div>
      <ul className="m-0 grid list-none gap-2.5 p-0 text-[14px] leading-snug">
        <li>
          <b>Andar junto não é causar.</b> Quem estudou mais também costuma ter mais renda, mais rede de contatos e mais
          tempo de carreira. Os números mostram o que anda junto com a eleição, não o que a causa.
        </li>
        <li>
          <b>O mapa compara cidades, não pessoas.</b> Sabemos quanto a cidade estudou e quanto estudaram os eleitos
          dela. Não sabemos em quem cada eleitor votou.
        </li>
        <li>
          <b>Declaração do candidato.</b> O TSE não confere o diploma: vale o que foi informado no registro.
        </li>
        <li>
          <b>Distrito Federal.</b> Não tem municípios: não elege prefeito nem vereador. O capítulo dele só traz 2022,
          com deputados distritais no lugar dos estaduais.
        </li>
      </ul>
      <h3 className="livro-secao">Exceções nos dados de 2024</h3>
      <ul className="m-0 grid list-none gap-1.5 p-0 text-[13.5px] leading-snug">
        <li>
          <b>{int(x.semPrefeito)} cidades</b> sem prefeito eleito no arquivo do TSE: eleição anulada ou pendente na
          Justiça, e Fernando de Noronha (PE), que não elege prefeito.
        </li>
        <li>
          <b>{int(x.semVereador)} cidades</b> sem resultado de vereador no arquivo do TSE. Ficam em cinza no mapa.
        </li>
        {x.semCenso.length > 0 && (
          <li>
            <b>{x.semCenso.map(nome => nome.replace(/ (D[aeo]s?|E) /g, m => m.toLowerCase())).join(", ")}</b>:{" "}
            {x.semCenso.length === 1 ? "criada" : "criadas"} depois do Censo 2022, sem dado de escolaridade.
          </li>
        )}
      </ul>
      <p className="livro-nota">
        Os mapas usam as malhas municipais do IBGE. Todos os números deste livro saem do banco de dados do projeto, que
        qualquer pessoa pode refazer a partir dos arquivos públicos do TSE e do IBGE.
      </p>
    </div>
  );
}
