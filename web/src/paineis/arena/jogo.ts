import { fmt as fmtKit, nomeProprio } from "../../lib/formato";
import { semAcento } from "../../lib/uf";
import type { IconeId } from "./sprites";
import type { CartaEleito, DadosEleitos, ElementoId, Lado, Raridade, Rodada } from "./tipos";

// Regras da Arena (funções puras): cartas, posições, vencedor de cada rodada.

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

/** Os elementos: nome e ícone no histórico das rodadas (o ícone em pixel da carta está em PODER_ICONE). */
export const EL: Record<ElementoId, { ico: string; nome: string }> = {
  raio: { ico: "⚡", nome: "Raio" },
  fogo: { ico: "🔥", nome: "Fogo" },
  agua: { ico: "💧", nome: "Água" },
  terra: { ico: "🌿", nome: "Natureza" },
  luz: { ico: "✨", nome: "Luz" },
  ouro: { ico: "💰", nome: "Ouro" },
};
/** Ícone em pixel de cada elemento e de cada rodada (o poder que a rodada usa). */
export const PODER_ICONE: Record<ElementoId | Rodada["id"], IconeId> = {
  raio: "raio",
  voto: "raio",
  fogo: "fogo",
  agua: "gota",
  terra: "folha",
  luz: "livro",
  ouro: "moeda",
  verba: "moeda",
};
/** Cor do rastro e da explosão do projétil de cada rodada. */
export const COR_PODER: Record<Rodada["id"], string> = {
  voto: "#ffd84a",
  fogo: "#ff8a2a",
  verba: "#f2c230",
  agua: "#3b8fe0",
  terra: "#5fa62e",
  luz: "#a98bff",
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
  {
    id: "verba",
    el: "ouro",
    nome: "Verba pública",
    pergunta: "Quem usou mais dinheiro público na campanha? (quem usou mais leva o golpe)",
  },
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

export const vitoriasTexto = (n: number): string => `${n} vitória${n === 1 ? "" : "s"}`;
/** Governadores e senadores ficam no mesmo baralho. */
export const grupo = (t: CartaEleito): string => `${t.ano % 100}-${t.cargo === 5 ? 3 : t.cargo}`;

/** As cinco raridades, da mais comum à mais rara. A cor e o desenho de cada uma ficam em arena.css. */
export const RARIDADE: Record<Raridade, { nome: string; estrelas: number }> = {
  comum: { nome: "Comum", estrelas: 1 },
  incomum: { nome: "Incomum", estrelas: 2 },
  rara: { nome: "Rara", estrelas: 3 },
  epica: { nome: "Épica", estrelas: 4 },
  lendaria: { nome: "Lendária", estrelas: 5 },
};

/** Raridade pela fração (0 a 1) de eleitos do baralho com menos votos: 40% comuns, 30% incomuns, 20% raras,
 * 8% épicas e os 2% mais votados lendários. */
export const raridadeDe = (frac: number): Raridade =>
  frac < 0.4 ? "comum" : frac < 0.7 ? "incomum" : frac < 0.9 ? "rara" : frac < 0.98 ? "epica" : "lendaria";

/** Com quem a carta disputa a raridade: o mesmo cargo, na mesma eleição e no mesmo estado. Mais estreito que o
 * baralho do duelo (`grupo`), que junta governador com senador e os seis estados: lá um deputado de SE nunca
 * passaria de comum ao lado dos de RS. */
export const grupoRaridade = (t: CartaEleito): string => `${t.ano}-${t.cargo}-${t.uf}`;

/** Dá a raridade a cada carta de um grupo pela ordem de votos. Votos iguais ficam na posição do primeiro deles
 * (posição mínima), para o empate não depender da ordem do arquivo. Sem votos, comum. */
export function atribuirRaridade(lista: CartaEleito[]): void {
  const v = lista.filter(t => t.votos != null).sort((a, b) => a.votos - b.votos);
  for (const t of lista) t.raridade = "comum";
  let inicio = 0;
  v.forEach((t, k) => {
    if (k > 0 && t.votos !== v[k - 1].votos) inicio = k;
    t.raridade = raridadeDe(v.length === 1 ? 1 : inicio / (v.length - 1));
  });
}

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
      receita = r[17] as number,
      publico = (r[18] as number | null) ?? null;
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
      publico: receita > 0 ? publico || 0 : null,
      porVoto: receita > 0 && votos ? receita / votos : null,
      vit,
      grau: GRAU.indexOf(C.graus[r[10] as number]),
      busca: semAcento(r[5] + " " + (r[6] || "")),
      p_votos: 0,
      p_receita: 0,
      p_porVoto: 0,
      poder: { raio: 0, fogo: 0, agua: 0, terra: 0, luz: 0, ouro: 0 },
      el: "raio",
      atq: 1,
      raridade: "comum",
      fem: C.generos[r[8] as number] === "FEMININO",
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
  const porRaridade = new Map<string, CartaEleito[]>();
  for (const t of T) {
    const k = grupoRaridade(t);
    const l = porRaridade.get(k);
    if (l) l.push(t);
    else porRaridade.set(k, [t]);
  }
  porRaridade.forEach(atribuirRaridade);
  T.forEach(t => {
    const p: Record<ElementoId, number> = {
      raio: t.p_votos || 1,
      fogo: t.p_receita || 0,
      agua: t.p_porVoto || 0,
      terra: Math.min(10, 2 * t.vit),
      luz: Math.max(1, Math.round(((t.grau + 1) * 10) / 7)),
      ouro: 0, // a verba pública é só uma rodada, não um poder da carta
    };
    t.poder = p;
    // o elemento da carta é o poder mais forte entre raio, fogo, água e natureza (a escolaridade daria Luz a quase todos)
    t.el = (["raio", "fogo", "agua", "terra"] as const).slice().sort((a, b) => p[b] - p[a])[0];
    t.atq = Math.max(1, Math.round((p.raio + p.terra) / 2));
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
            : r.id === "verba"
              ? cmp(a.publico, b.publico, false) // quem usou menos ataca
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
          : r.id === "verba"
            ? t.publico == null
              ? "sem prestação de contas"
              : `${brl(t.publico)} de dinheiro público`
            : t.grau >= 0
              ? GRAU_CURTO[t.grau]
              : "sem dado";

/** Dano do golpe da rodada (a "luz" cura 3 e não passa por aqui). */
export function danoRodada(r: Rodada, a: CartaEleito, b: CartaEleito): number {
  if (r.id === "voto") return 3 + Math.round(Math.abs(a.p_votos - b.p_votos) / 3);
  if (r.id === "fogo") return 3;
  if (r.id === "agua" || r.id === "verba") return 4;
  return Math.min(6, 2 + Math.abs(a.vit - b.vit));
}
