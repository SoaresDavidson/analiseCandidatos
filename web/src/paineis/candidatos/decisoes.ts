import { useDados } from "../../lib/dados";

// Decisões da Justiça Eleitoral sobre as candidaturas de cada eleito (registro negado por
// ilícito na campanha ou inelegibilidade, e cassação), de candidatos-decisoes.json
// (scripts/gerar_painel_decisoes.py, sql/24_motivo_cassacao.sql). Falha formal ou do
// partido fica fora do arquivo: não é cassação nem inelegibilidade.

/** [ano, cargo, lugar, UF, partido, tipo do motivo, motivo, processo, família, é a candidatura da ficha] */
export type LinhaDecisao = [number, number, string, string, string, string, string, string, number, number];

export interface DadosDecisoes {
  fonte: string;
  eleitos: Record<string, LinhaDecisao[]>;
}

export interface Decisao {
  ano: number;
  cargo: number;
  lugar: string;
  uf: string;
  partido: string;
  cassacao: boolean;
  motivo: string;
  processo: string;
  /** 1 = ilícito na campanha, 2 = inelegibilidade */
  familia: number;
  /** a decisão é sobre a mesma candidatura que a ficha mostra */
  propria: boolean;
}

export const chaveEleito = (ano: number, sq: number): string => `${ano}-${sq}`;

export function lerDecisoes(linhas: readonly LinhaDecisao[] | undefined): Decisao[] {
  return (linhas ?? []).map(([ano, cargo, lugar, uf, partido, tipo, motivo, processo, familia, propria]) => ({
    ano,
    cargo,
    lugar,
    uf,
    partido,
    cassacao: /cassa/i.test(tipo),
    motivo: motivo.trim().replace(/\.$/, ""),
    processo,
    familia,
    propria: propria === 1,
  }));
}

/** Título da decisão: cassação ou registro negado. */
export const tipoDecisao = (d: Decisao): string => (d.cassacao ? "Cassação" : "Registro de candidatura negado");

/** O motivo em palavras simples, com a lei de referência. */
export function explicarMotivo(motivo: string): string {
  const m = motivo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  if (m.includes("ficha limpa"))
    return "Inelegível pela Lei da Ficha Limpa (LC 64/90, alterada pela LC 135/2010): por exemplo, condenação por órgão colegiado, contas rejeitadas ou cassação anterior. O arquivo do TSE não diz qual desses casos.";
  if (m.includes("inelegibilidade constitucional"))
    return "Inelegível por uma regra da Constituição (art. 14), como parentesco com o chefe do Executivo ou limite de mandatos seguidos.";
  if (m.includes("inelegibilidade")) return "Inelegível por um dos casos da Lei das Inelegibilidades (LC 64/90).";
  if (m.includes("abuso de poder") && m.includes("lc 64"))
    return "Inelegível por condenação anterior por abuso de poder (LC 64/90, art. 1º, I, d e h): o registro foi negado por causa dessa condenação, não por algo feito nesta campanha.";
  if (m.includes("abuso de poder"))
    return "Abuso de poder: uso indevido do poder político ou econômico para influenciar a eleição (LC 64/90, art. 22).";
  if (m.includes("compra de voto") || m.includes("captacao ilicita"))
    return "Compra de voto (captação ilícita de sufrágio): oferecer ou dar vantagem ao eleitor em troca do voto (Lei 9.504/97, art. 41-A).";
  if (m.includes("conduta vedada"))
    return "Conduta vedada: uso da máquina pública na campanha, proibido a agentes públicos (Lei 9.504/97, art. 73).";
  if (m.includes("gasto ilicito")) return "Arrecadação ou gasto de campanha fora das regras (Lei 9.504/97, art. 30-A).";
  if (m.includes("cota de genero"))
    return "Fraude à cota de gênero: candidaturas femininas fictícias para cumprir a cota de 30%. A decisão vale para a chapa inteira do partido, não só para esta pessoa.";
  return "Motivo registrado pela Justiça Eleitoral sem outro detalhe no arquivo do TSE.";
}

/** As decisões de cada eleito, pela chave "<ano>-<sq>"; vazio enquanto carrega ou se o arquivo faltar. */
export function useDecisoes(): (ano: number, sq: number) => Decisao[] {
  const { dados } = useDados<DadosDecisoes>("candidatos-decisoes.json");
  return (ano, sq) => lerDecisoes(dados?.eleitos[chaveEleito(ano, sq)]);
}
