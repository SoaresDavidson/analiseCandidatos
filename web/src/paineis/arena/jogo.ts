import { fmt as fmtKit, nomeProprio } from "../../lib/formato";
import type { CartaEleito, DadosEleitos, ElementoId, Lado, Rodada } from "./tipos";

// Regras da Arena (funções puras): cartas, posições, vencedor de cada rodada.

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
export const BARALHOS: readonly (readonly [string, string])[] = [
  ["24-11", "Prefeitos de 2024"],
  ["24-13", "Vereadores de 2024"],
  ["22-7", "Deputados estaduais de 2022"],
  ["22-6", "Deputados federais de 2022"],
  ["22-3", "Governadores e senadores de 2022"],
];
const GRAU = [
  "LÊ E ESCREVE",
  "ENSINO FUNDAMENTAL INCOMPLETO",
  "ENSINO FUNDAMENTAL COMPLETO",
  "ENSINO MÉDIO INCOMPLETO",
  "ENSINO MÉDIO COMPLETO",
  "SUPERIOR INCOMPLETO",
  "SUPERIOR COMPLETO",
];
export const GRAU_CURTO = [
  "Lê e escreve",
  "Fund. incompleto",
  "Fund. completo",
  "Médio incompleto",
  "Médio completo",
  "Superior incompleto",
  "Superior completo",
];

/** Os cinco elementos (cor da moldura e efeito do golpe). */
export const EL: Record<ElementoId, { ico: string; nome: string; cor: string }> = {
  raio: { ico: "⚡", nome: "Raio", cor: "#7b5cc9" },
  fogo: { ico: "🔥", nome: "Fogo", cor: "#c4441d" },
  agua: { ico: "💧", nome: "Água", cor: "#2c6fb5" },
  terra: { ico: "🌿", nome: "Natureza", cor: "#4b7a22" },
  luz: { ico: "✨", nome: "Luz", cor: "#b58a2c" },
};
export const RODADAS: readonly Rodada[] = [
  {
    id: "voto",
    el: "raio",
    nome: "Voto de confiança",
    pergunta: "Quem teve mais votos (comparado com o próprio cargo)?",
  },
  {
    id: "fogo",
    el: "fogo",
    nome: "Fogo da campanha",
    pergunta: "Quem arrecadou MENOS? (quem arrecadou mais se queima)",
  },
  { id: "agua", el: "agua", nome: "Onda da economia", pergunta: "Quem gastou menos por voto?" },
  { id: "terra", el: "terra", nome: "Raízes", pergunta: "Quem tem mais vitórias na carreira?" },
  { id: "luz", el: "luz", nome: "Luz do saber", pergunta: "Quem estudou mais?" },
];

export const VIDA_INICIAL = 20;

/** fmt da Arena: sem casas decimais por padrão (o do kit usa 1). */
export const fmt = (x: number | null | undefined, casas = 0): string => fmtKit(x, casas);
/** brl da Arena: "R$ 1,2 mi" / "R$ 35 mil" (o do kit escreve "milhão" e "–" sem dado). */
export const brl = (v: number | null): string =>
  v == null
    ? "sem dado"
    : v >= 1e6
      ? `R$ ${fmt(v / 1e6, 1)} mi`
      : v >= 1e3
        ? `R$ ${fmt(v / 1e3, 0)} mil`
        : `R$ ${fmt(v)}`;

export const semAcento = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const vitoriasTexto = (n: number): string => `${n} vitória${n === 1 ? "" : "s"}`;
/** Governadores e senadores ficam no mesmo baralho. */
export const grupo = (t: CartaEleito): string => `${t.ano % 100}-${t.cargo === 5 ? 3 : t.cargo}`;

type Campo = "votos" | "receita" | "porVoto";
/** Posição de 1 a 10 de cada carta da lista em `campo` (invertida quando menor é melhor). */
function posicoes(lista: CartaEleito[], campo: Campo, menorMelhor = false): void {
  const v = lista.filter(t => t[campo] != null).sort((a, b) => (a[campo] as number) - (b[campo] as number));
  v.forEach((t, k) => {
    const p = 1 + Math.floor((10 * k) / v.length);
    const pos = menorMelhor ? 11 - p : p;
    if (campo === "votos") t.p_votos = pos;
    else if (campo === "receita") t.p_receita = pos;
    else t.p_porVoto = pos;
  });
}

/** Cada eleito vira uma carta; os poderes são a posição (1 a 10) dentro do mesmo cargo e eleição. */
export function montarCartas(C: DadosEleitos): CartaEleito[] {
  const T: CartaEleito[] = [];
  C.eleitos.forEach((r, i) => {
    const cargo = r[2];
    if (!(cargo in CARGO)) return;
    const carreira = r[26] as number[];
    let vit = 0;
    for (let k = 0; k < carreira.length; k += 5) if (carreira[k + 4] === 0) vit++;
    const votos = r[13] as number,
      receita = r[17] as number;
    T.push({
      i,
      sq: C.sq[i],
      ano: 2000 + r[0],
      uf: C.ufs[r[1]],
      cargo,
      partido: C.partidos[r[4]],
      nome: nomeProprio(r[5]),
      local: (C.ues[r[3]] || "").split("|")[0],
      votos,
      receita,
      porVoto: receita > 0 && votos ? receita / votos : null,
      vit,
      grau: GRAU.indexOf(C.graus[r[10] as number]),
      busca: semAcento(r[5] + " " + (r[6] || "")),
      p_votos: 0,
      p_receita: 0,
      p_porVoto: 0,
      poder: { raio: 0, fogo: 0, agua: 0, terra: 0, luz: 0 },
      el: "raio",
      atq: 1,
      mana: 1,
    });
  });
  const porGrupo = new Map<string, CartaEleito[]>();
  T.forEach(t => {
    const g = grupo(t);
    const l = porGrupo.get(g);
    if (l) l.push(t);
    else porGrupo.set(g, [t]);
  });
  porGrupo.forEach(g => {
    posicoes(g, "votos");
    posicoes(g, "receita");
    posicoes(g, "porVoto", true);
  });
  T.forEach(t => {
    const p: Record<ElementoId, number> = {
      raio: t.p_votos || 1,
      fogo: t.p_receita || 0,
      agua: t.p_porVoto || 0,
      terra: Math.min(10, 2 * t.vit),
      luz: Math.max(1, Math.round(((t.grau + 1) * 10) / 7)),
    };
    t.poder = p;
    // o elemento da carta é o poder mais forte entre raio, fogo, água e natureza (a escolaridade daria Luz a quase todos)
    t.el = (["raio", "fogo", "agua", "terra"] as const).slice().sort((a, b) => p[b] - p[a])[0];
    t.atq = Math.max(1, Math.round((p.raio + p.terra) / 2));
    t.mana = Math.max(1, Math.min(5, Math.round((t.p_receita || 1) / 2)));
  });
  return T;
}

export const outroLado = (l: Lado): Lado => (l === "a" ? "b" : "a");
export const sortearDe = (baralho: CartaEleito[], evitar?: CartaEleito | null): CartaEleito | undefined => {
  const b = baralho.filter(t => t !== evitar);
  return b[Math.floor(Math.random() * b.length)];
};
export const embaralhar = (): Rodada[] => RODADAS.slice().sort(() => Math.random() - 0.5);

/** Quem vence a rodada: "a", "b", "empate" ou null (sem dado). */
export function vencedor(r: Rodada, a: CartaEleito, b: CartaEleito): Lado | "empate" | null {
  const cmp = (x: number | null, y: number | null, maior: boolean) =>
    x == null || y == null ? null : x === y ? 0 : (maior ? x > y : x < y) ? 1 : -1;
  const c =
    r.id === "voto"
      ? cmp(a.p_votos, b.p_votos, true)
      : r.id === "fogo"
        ? cmp(a.receita, b.receita, false)
        : r.id === "agua"
          ? cmp(a.porVoto, b.porVoto, false)
          : r.id === "terra"
            ? cmp(a.vit, b.vit, true)
            : cmp(a.grau, b.grau, true);
  return c == null ? null : c === 0 ? "empate" : c > 0 ? "a" : "b";
}

export const valorRodada = (t: CartaEleito, r: Rodada): string =>
  r.id === "voto"
    ? `${fmt(t.votos)} votos (posição ${t.p_votos}/10)`
    : r.id === "fogo"
      ? brl(t.receita)
      : r.id === "agua"
        ? t.porVoto == null
          ? "sem dado"
          : `R$ ${fmt(t.porVoto, 2)} por voto`
        : r.id === "terra"
          ? vitoriasTexto(t.vit)
          : t.grau >= 0
            ? GRAU_CURTO[t.grau]
            : "sem dado";

/** Dano do golpe da rodada (a "luz" cura 3 e não passa por aqui). */
export function danoRodada(r: Rodada, a: CartaEleito, b: CartaEleito): number {
  if (r.id === "voto") return 3 + Math.round(Math.abs(a.p_votos - b.p_votos) / 3);
  if (r.id === "fogo") return 3;
  if (r.id === "agua") return 4;
  return Math.min(6, 2 + Math.abs(a.vit - b.vit));
}
