/** Uma linha de `eleitos` em candidatos-eleitos.json. Só os campos que a Arena lê têm nome. */
export type Eleito = [
  ano: number, // 0: ano da eleição menos 2000
  uf: number, // 1: índice em `ufs`
  cargo: number, // 2: código do cargo do TSE
  ue: number, // 3: índice em `ues` ("NOME|UF")
  partido: number, // 4: índice em `partidos`
  nome: string, // 5: nome de urna
  nomeCompleto: string, // 6
  ...resto: unknown[],
];
// Posições lidas por índice (a tupla acima não as nomeia): 10 = grau (índice em `graus`),
// 13 = votos, 17 = receita, 26 = carreira (blocos de 5; o 5º é 0 quando o resultado foi vitória).

export interface DadosEleitos {
  ufs: string[];
  ues: string[];
  partidos: string[];
  graus: string[];
  eleitos: Eleito[];
  sq: number[];
}

export type ElementoId = "raio" | "fogo" | "agua" | "terra" | "luz";
export type Lado = "a" | "b";

/** Um eleito transformado em carta. Os poderes são a posição (1 a 10) dentro do mesmo cargo e eleição. */
export interface CartaEleito {
  i: number;
  sq: number;
  ano: number;
  uf: string;
  cargo: number;
  partido: string;
  nome: string;
  local: string;
  votos: number;
  receita: number;
  porVoto: number | null;
  vit: number;
  grau: number;
  busca: string;
  p_votos: number;
  p_receita: number;
  p_porVoto: number;
  poder: Record<ElementoId, number>;
  el: ElementoId;
  atq: number;
  mana: number;
}

export interface Rodada {
  id: "voto" | "fogo" | "agua" | "terra" | "luz";
  el: ElementoId;
  nome: string;
  pergunta: string;
}
