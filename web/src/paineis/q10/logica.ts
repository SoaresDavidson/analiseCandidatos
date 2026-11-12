import { nomeProprio, pc } from "../../lib/formato";
import { semAcento, UF_NOME, UFS } from "../../lib/uf";
import type { DadosQ10, LinhaFin } from "./tipos";

export const ANOS = [2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024];
export const RES = ["Eleito", "Não eleito", "Sem resultado"];
export const ABREV: Record<number, string> = {
  1: "Presidente",
  2: "Vice-pres.",
  3: "Governador",
  4: "Vice-gov.",
  5: "Senador",
  6: "Dep. federal",
  7: "Dep. estadual",
  8: "Dep. distrital",
  9: "1º suplente",
  10: "2º suplente",
  11: "Prefeito",
  12: "Vice-prefeito",
  13: "Vereador",
};
/** Faixa da linha do tempo de cada cargo (de baixo para cima: vereador ... presidente). */
export const FAIXA: Record<number, number> = {
  13: 0,
  12: 1,
  11: 2,
  7: 3,
  8: 3,
  6: 4,
  9: 5,
  10: 5,
  4: 5,
  5: 6,
  3: 7,
  2: 8,
  1: 9,
};
export const FAIXA_NOME = [
  "Vereador",
  "Vice-prefeito",
  "Prefeito",
  "Dep. estadual",
  "Dep. federal",
  "Vice ou suplente",
  "Senador",
  "Governador",
  "Vice-presidente",
  "Presidente",
];
/** Último ano do eixo: fim do mandato de quem venceu em 2024. */
export const ANO_FIM = 2028;
// senador e seus suplentes: mandato de 8 anos
const OITO_ANOS = new Set([5, 9, 10]);

export const TURMAS: readonly (readonly [number, string])[] = [
  [13, "Vereador"],
  [11, "Prefeito"],
  [7, "Dep. estadual"],
  [6, "Dep. federal"],
];
export const CARGOS_RE: readonly (readonly [number, string])[] = [
  [13, "Vereador"],
  [11, "Prefeito"],
  [7, "Dep. estadual"],
  [6, "Dep. federal"],
  [5, "Senador"],
  [3, "Governador"],
];

// cores usadas dentro dos SVG (mesmos valores de styles/tema.css)
export const COR_OURO = "#ebb400";
export const COR_VERDE = "#9eb735";
export const COR_VERDE_ESC = "#5e7a12";
export const COR_TEXTO_2 = "#6b6b6b";
export const COR_SEM_DADO = "#d9d6cf";

export const GRUPO_NOME = [
  "Imóveis",
  "Empresas (cotas e participações)",
  "Aplicações e fundos",
  "Dinheiro em conta e poupança",
  "Veículos",
  "Outros bens",
  "Sem tipo (o TSE não separava)",
];
export const GRUPO_COR = ["#5e7a12", "#c58a00", "#2a78d6", "#eb6834", "#4a3aa7", "#b9b6ae", "#d9d6cf"];

export interface Candidatura {
  ano: number;
  cargo: number;
  local: string;
  uf: string;
  partido: string;
  res: number;
  reeleito: boolean;
  tentou: boolean;
}
export interface Pessoa {
  id: number;
  nome: string;
  civil: string;
  busca: string;
  r: Candidatura[];
  vit: number;
  der: number;
  reel: number;
  anos: number;
  partidos: number;
  ufs: string[];
  ult: Candidatura;
}

export interface Mandato {
  faixa: number;
  inicio: number;
  fim: number;
}

/**
 * Mandatos conquistados na urna, para desenhar como barras: cada vitória vale 4 anos (8 para senador)
 * e termina antes se a pessoa vencer outra eleição. Vitórias seguidas na mesma faixa viram uma barra só.
 * É o mandato conquistado, não o exercido: o TSE não informa licença, renúncia ou cassação após a posse.
 */
export function mandatos(r: Candidatura[], anoFim = ANO_FIM): Mandato[] {
  const vitorias = r.filter(x => x.res === 0);
  const saida: Mandato[] = [];
  vitorias.forEach((x, i) => {
    const proxima = vitorias.slice(i + 1).find(y => y.ano > x.ano)?.ano ?? Number.POSITIVE_INFINITY;
    const fim = Math.min(x.ano + (OITO_ANOS.has(x.cargo) ? 8 : 4), proxima, anoFim);
    if (fim <= x.ano) return;
    const faixa = FAIXA[x.cargo];
    const anterior = saida[saida.length - 1];
    if (anterior && anterior.faixa === faixa && anterior.fim >= x.ano) anterior.fim = Math.max(anterior.fim, fim);
    else saida.push({ faixa, inicio: x.ano, fim });
  });
  return saida;
}

/** Desempacota as linhas planas do JSON em pessoas com as contas já feitas. */
export function montarPessoas(D: DadosQ10): Pessoa[] {
  return D.pessoas.map((p, id) => {
    const r: Candidatura[] = [];
    for (let i = 0; i < p[2].length; i += 6) {
      const [a, cargo, ue, part, res, flag] = p[2].slice(i, i + 6);
      const [local, uf] = D.ues[ue].split("|");
      r.push({
        ano: 2000 + a,
        cargo,
        local:
          local === uf || semAcento(local) === semAcento(UF_NOME[uf] || "") ? UF_NOME[uf] || uf : nomeProprio(local),
        uf,
        partido: D.partidos[part],
        res,
        reeleito: flag === 1,
        tentou: flag > 0,
      });
    }
    return {
      id,
      nome: nomeProprio(p[0]),
      civil: nomeProprio(p[1]),
      busca: semAcento(`${p[0]} ${p[1]}`),
      r,
      vit: r.filter(x => x.res === 0).length,
      der: r.filter(x => x.res === 1).length,
      reel: r.filter(x => x.reeleito).length,
      anos: r[r.length - 1].ano - r[0].ano,
      partidos: new Set(r.map(x => x.partido)).size,
      ufs: [...new Set(r.map(x => x.uf))],
      ult: r[r.length - 1],
    };
  });
}

/** Curva da view q10_curva_sobrevivencia: % ainda eleitos (ou disputando) a cada ciclo; null com menos de 30 casos. */
export function curva(
  D: DadosQ10,
  ufs: readonly string[],
  cargo: number,
  medida: "mandato" | "disputa",
): (number | null)[] {
  const out = Array.from({ length: 5 }, () => [0, 0]);
  for (const [uf, c, k, n, eleitos, disp] of D.curva) {
    if (c === cargo && ufs.includes(uf)) {
      out[k][0] += n;
      out[k][1] += medida === "mandato" ? eleitos : disp;
    }
  }
  return out.map(([n, ok], k) => (k === 0 ? 100 : n >= 30 ? pc(ok, n) : null));
}

// Receita acima disso é erro de digitação na prestação de contas do TSE: nenhuma campanha das 6 UFs
// passa de R$ 20 milhões (a maior, de governador em 2022, fica abaixo). Caso conhecido: 12 vereadores
// do AM em 2020 com R$ 207 milhões cada (V5 de sql/validacao/q8_q9.sql).
export const RECEITA_MAXIMA = 20_000_000;
export const receitaComErro = (receita: number | null): boolean => receita != null && receita > RECEITA_MAXIMA;

export interface AnoFin {
  ano: number;
  receita: number | null;
  publico: number | null;
  despesa: number | null;
  temBens: boolean;
  total: number;
  grupos: number[];
  itens: { nome: string; g: number; v: number }[];
}

export function anosFin(D: DadosQ10, linhas: LinhaFin[]): AnoFin[] {
  return linhas.map(([a, receita, publico, despesa, bens]) => {
    const grupos: number[] = Array(7).fill(0),
      itens: AnoFin["itens"] = [];
    if (bens) {
      for (let i = 0; i < bens.length; i += 2) {
        const [nome, g] = D.fin.tipos[bens[i]];
        grupos[g] += bens[i + 1];
        itens.push({ nome, g, v: bens[i + 1] });
      }
    }
    return {
      ano: 2000 + a,
      receita,
      publico,
      despesa,
      temBens: !!bens,
      total: grupos.reduce((x, y) => x + y, 0),
      grupos,
      itens,
    };
  });
}

/**
 * Declarações de bens com cara de erro de digitação: pelo menos R$ 10 milhões e 50 vezes a mediana
 * das outras. Só vale com duas outras declarações de valor positivo para comparar: com uma só não
 * dá para saber qual das duas está errada (e um patrimônio pode mesmo crescer muito em 16 anos).
 */
export function anosSuspeitos(comBens: AnoFin[]): AnoFin[] {
  return comBens.filter(x => {
    const outros = comBens
      .filter(y => y !== x && y.total > 0)
      .map(y => y.total)
      .sort((a, b) => a - b);
    if (outros.length < 2) return false;
    const mediana = outros[outros.length >> 1];
    return x.total >= 1e7 && x.total >= 50 * mediana;
  });
}

export const ufsSel = (uf: string): readonly string[] => (uf === "TODAS" ? UFS : [uf]);
