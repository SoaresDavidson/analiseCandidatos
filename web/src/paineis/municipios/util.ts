import { nomeLugar, pc } from "../../lib/formato";
import type { Lado, LinhaMunicipio, Municipio, Ordem } from "./tipos";

export const UF_NOME: Record<string, string> = {
  AM: "Amazonas",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  RS: "Rio Grande do Sul",
  SE: "Sergipe",
};
export const CANAL = [
  "material impresso",
  "campanha de rua",
  "rádio e TV",
  "adesivos",
  "internet",
  "jingle",
  "carro de som",
  "jornal e revista",
];

export const semAcento = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Como o IBGE escreve: "São João d'Aliança", "Glória d'Oeste", "Itatiba do Sul". */

export function lerMunicipios(linhas: LinhaMunicipio[], ufs: string[]): Municipio[] {
  return linhas.map(r => ({
    cod: r[0],
    nome: nomeLugar(r[1]),
    uf: ufs[r[2]],
    cap: !!r[3],
    voto: r[4],
    votos: r[6],
    qtVer: r[7],
    camara: r[8],
    sgPref: r[9],
    vlPref: r[10],
    voto22: r[11],
    qtCand: r[12],
    receita: r[13],
    publico: r[14],
    propaganda: r[15],
    canal: r[16],
    cadeiras: r[17],
    busca: semAcento(r[1]),
  }));
}

export const ladoDe = (m: Municipio, meio: number): Exclude<Lado, "todos"> | null =>
  m.voto == null ? null : m.voto < meio ? "esquerda" : "direita";

/** Porcentagem do fundo público na arrecadação (null sem arrecadação). */
export const pcPublico = (m: Municipio): number | null => pc(m.publico ?? 0, m.receita ?? 0);

export const ORDENS: Record<Ordem, (a: Municipio, b: Municipio) => number> = {
  nome: (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
  esq: (a, b) => (a.voto ?? 99) - (b.voto ?? 99),
  dir: (a, b) => (b.voto ?? -1) - (a.voto ?? -1),
  publico: (a, b) => (pcPublico(b) ?? -1) - (pcPublico(a) ?? -1),
  voto: (a, b) => (b.receita || 0) / (b.votos || 1) - (a.receita || 0) / (a.votos || 1),
};

/** Média do voto de um conjunto de cidades, pesada pelos votos para vereador. */
export function mediaPonderada(cv: Municipio[]): number {
  const votos = cv.reduce((s, m) => s + m.votos, 0);
  return cv.reduce((s, m) => s + (m.voto ?? 0) * m.votos, 0) / (votos || 1);
}

export const somar = (ms: Municipio[], campo: "receita" | "publico"): number =>
  ms.reduce((s, m) => s + (m[campo] || 0), 0);
