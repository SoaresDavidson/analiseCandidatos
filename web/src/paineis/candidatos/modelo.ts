import { useMemo } from "react";
import { useDados } from "../../lib/dados";
import { nomeProprio } from "../../lib/formato";
import type { Candidatura, DadosCandidatos, Eleito, Modelo } from "./tipos";

export const UF_NOME: Record<string, string> = {
  AM: "Amazonas",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  RS: "Rio Grande do Sul",
  SE: "Sergipe",
};
export const CARGO: Record<number, string> = {
  3: "Governador",
  5: "Senador",
  6: "Deputado federal",
  7: "Deputado estadual",
  11: "Prefeito",
  13: "Vereador",
};
export const CARGO_CURTO: Record<number, string> = {
  1: "Presidente",
  2: "Vice-presidente",
  3: "Governador",
  4: "Vice-governador",
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
export const PLURAL: Record<number, string> = {
  3: "governadores",
  5: "senadores",
  6: "deputados federais",
  7: "deputados estaduais",
  11: "prefeitos",
  13: "vereadores",
};
export const CARGOS_ANO: Record<number, number[]> = { 2022: [3, 5, 6, 7], 2024: [11, 13] };
export const CANAL = [
  "Material impresso",
  "Campanha de rua",
  "Rádio e TV",
  "Adesivos",
  "Internet",
  "Jingle",
  "Carro de som",
  "Jornal e revista",
];
export const RESULTADO = ["Eleito", "Não eleito", "Sem resultado"];

export const frase = (s: string | null | undefined): string => {
  const t = (s || "").toLowerCase();
  return t ? t[0].toUpperCase() + t.slice(1) : "";
};
export const semAcento = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function mediana(xs: (number | null | undefined)[]): number | null {
  const v = xs.filter((x): x is number => x != null).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/** Local e estado: nome oficial com acento (o TSE grava "GOIAS" em alguns anos). */
function lugar(D: DadosCandidatos, i: number): [string, string] {
  if (i < 0) return ["", ""];
  const [l, u] = D.ues[i].split("|");
  return [l === u || semAcento(l) === semAcento(UF_NOME[u] || "") ? UF_NOME[u] || u : nomeProprio(l), u];
}

function preparar(D: DadosCandidatos): Modelo {
  const eleitos = D.eleitos.map((r, id): Eleito => {
    const [local] = lugar(D, r[3]);
    const uf = D.ufs[r[1]];
    const partido = D.partidos[r[4]];
    const ano = 2000 + r[0];
    const carreira: Candidatura[] = [];
    for (let i = 0; i < r[26].length; i += 5) {
      const [a, cargo, ue, part, res] = r[26].slice(i, i + 5);
      const [l, u] = lugar(D, ue);
      carreira.push({ ano: 2000 + a, cargo, local: l, uf: u, partido: D.partidos[part], res });
    }
    const nome = nomeProprio(r[5]);
    const civil = nomeProprio(r[6]);
    return {
      id,
      sq: D.sq[id],
      ano,
      uf,
      cargo: r[2],
      local,
      partido,
      nome,
      civil,
      idade: r[7],
      genero: D.generos[r[8]],
      cor: D.cores[r[9]],
      grau: D.graus[r[10]],
      ocupacao: D.ocupacoes[r[11]],
      situacao: r[12],
      votos: r[13],
      munVotos: lugar(D, r[14])[0],
      patrimonio: r[15],
      bens: r[16],
      receita: r[17],
      publico: r[18],
      privado: r[19],
      proprio: r[20],
      partidario: r[21],
      transf: r[22],
      doadores: r[23],
      propaganda: r[24],
      canal: r[25],
      carreira,
      cod: r[27],
      espectro: D.espectro[`${ano}|${partido}`] || null,
      busca: semAcento([nome, civil, local, partido, UF_NOME[uf] || ""].join(" ")),
    };
  });
  return { eleitos, dados: D };
}

// os 14 mil registros são montados uma vez só, mesmo que a página e a ficha em janela peçam
const montados = new WeakMap<DadosCandidatos, Modelo>();

/** Carrega o JSON e monta os eleitos; modelo = null enquanto carrega. */
export function useEleitos() {
  const { dados, erro } = useDados<DadosCandidatos>("candidatos-eleitos.json");
  const modelo = useMemo(() => {
    if (!dados) return null;
    let m = montados.get(dados);
    if (!m) {
      m = preparar(dados);
      montados.set(dados, m);
    }
    return m;
  }, [dados]);
  return { modelo, erro };
}

/** "2024-123" -> { ano: 2024, sq: 123 } */
export function lerExtra(extra: string | undefined): { ano: number; sq: number } | null {
  const m = /^(\d{4})-(\d+)$/.exec(extra ?? "");
  return m ? { ano: +m[1], sq: +m[2] } : null;
}
