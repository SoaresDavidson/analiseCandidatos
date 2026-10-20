import { fmt, int, nomeProprio, pc } from "../../lib/formato";
import type { DadosQ10, LinhaFin } from "./tipos";

export const UFS = ["AM", "GO", "MA", "MT", "RS", "SE"] as const;
export const UF_NOME: Record<string, string> = {
  AM: "Amazonas",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  RS: "Rio Grande do Sul",
  SE: "Sergipe",
};
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
export const TURMAS: readonly (readonly [number, string, string])[] = [
  [13, "Vereador", "vereadores"],
  [11, "Prefeito", "prefeitos"],
  [7, "Dep. estadual", "deputados estaduais"],
  [6, "Dep. federal", "deputados federais"],
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

export const semAcento = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Valor curto para eixos e rótulos: "1,2 mi", "35 mil". */
export function brlCurto(v: number): string {
  if (v >= 1e9) return `${fmt(v / 1e9, 1)} bi`;
  if (v >= 1e6) return `${fmt(v / 1e6, v >= 1e7 ? 0 : 1)} mi`;
  if (v >= 1e3) return `${fmt(v / 1e3, 0)} mil`;
  return int(v);
}

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

export const ufsSel = (uf: string): readonly string[] => (uf === "TODAS" ? UFS : [uf]);
/** "nos 6 estados", "no Maranhão", "em Goiás". */
export const onde = (uf: string): string =>
  uf === "TODAS" ? "nos 6 estados" : `${["AM", "MA", "MT", "RS"].includes(uf) ? "no" : "em"} ${UF_NOME[uf]}`;
