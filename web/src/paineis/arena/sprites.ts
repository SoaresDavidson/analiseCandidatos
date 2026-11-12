// Desenhos em pixel-art da Arena: cada sprite é uma grade de letras, e cada letra é uma cor da paleta
// ("." é transparente). Viram SVG em data URI, para servir de <img> e de background-image no CSS.
import type { Raridade } from "./tipos";

type Paleta = Record<string, string>;

/** Grade de letras -> SVG com um <rect> por trecho contínuo da mesma cor. */
export function sprite(linhas: readonly string[], paleta: Paleta): string {
  const largura = Math.max(...linhas.map(l => l.length));
  let rects = "";
  linhas.forEach((l, y) => {
    for (let x = 0; x < l.length; ) {
      const c = l[x];
      let fim = x + 1;
      while (fim < l.length && l[fim] === c) fim++;
      if (c !== ".") rects += `<rect x="${x}" y="${y}" width="${fim - x}" height="1" fill="${paleta[c]}"/>`;
      x = fim;
    }
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${linhas.length}" ` +
    `shape-rendering="crispEdges">${rects}</svg>`
  );
}

export const dataUri = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`;

/** Os ícones dos seis poderes, mais espada e coração do rodapé (9x9). */
export type IconeId = "raio" | "fogo" | "moeda" | "gota" | "folha" | "livro" | "espada" | "coracao";

const ICONES: Record<IconeId, [readonly string[], Paleta]> = {
  raio: [
    [
      "....yy...",
      "...yy....",
      "..yy.....",
      ".yyyyyy..",
      "....yy...",
      "...yy....",
      "..yy.....",
      ".yy......",
      ".........",
    ],
    { y: "#ffd84a" },
  ],
  fogo: [
    [
      "....r....",
      "...rr....",
      "...rrr.r.",
      "..rroorr.",
      ".rrooyorr",
      ".rroyyorr",
      ".rroyyorr",
      "..rrooor.",
      "...rrrr..",
    ],
    { r: "#d7402a", o: "#ff8a2a", y: "#ffe066" },
  ],
  moeda: [
    [
      "..kkkkk..",
      ".kyyyyyk.",
      "kyywyyyyk",
      "kyyykyyyk",
      "kyyykyyyk",
      "kyyykyyyk",
      "kyyyyyyyk",
      ".kyyyyyk.",
      "..kkkkk..",
    ],
    { k: "#7a5a00", y: "#f2c230", w: "#fff3b0" },
  ],
  gota: [
    [
      "....b....",
      "...bb....",
      "...bbb...",
      "..bbbbb..",
      "..bwbbb..",
      ".bbwbbbb.",
      ".bbbbbbb.",
      "..bbbbb..",
      "...bbb...",
    ],
    { b: "#3b8fe0", w: "#cfe8ff" },
  ],
  folha: [
    [
      "......gg.",
      "....ggGg.",
      "...gGGgg.",
      "..gGGgg..",
      ".gGgggg..",
      ".gGgg....",
      ".gg......",
      "b........",
      ".........",
    ],
    { g: "#5fa62e", G: "#9edb5a", b: "#6b4a1e" },
  ],
  livro: [
    [
      "kkkkkkkk.",
      "kppppppk.",
      "kpwwwwpk.",
      "kppppppk.",
      "kpwwwwpk.",
      "kppppppk.",
      "kpwwwwpk.",
      "kppppppkk",
      "kkkkkkkk.",
    ],
    { k: "#2b1a4a", p: "#7b5cc9", w: "#e6ddff" },
  ],
  espada: [
    [
      "......kw.",
      ".....kwk.",
      "....kwk..",
      "...kwk...",
      "k.kwk....",
      "kkwk.....",
      ".kk......",
      "kkkk.....",
      "k........",
    ],
    { k: "#222222", w: "#dfe6ee" },
  ],
  coracao: [
    [
      ".rr.rr...",
      "rwrrrrr..",
      "rrrrrrr..",
      "rrrrrrr..",
      ".rrrrr...",
      "..rrr....",
      "...r.....",
      ".........",
      ".........",
    ],
    { r: "#e23b3b", w: "#ffb3b3" },
  ],
};

export const ICONE: Record<IconeId, string> = Object.fromEntries(
  (Object.keys(ICONES) as IconeId[]).map(id => [id, dataUri(sprite(...ICONES[id]))]),
) as Record<IconeId, string>;

const ESTRELA = ["..y..", ".yyy.", "yyyyy", ".yyy.", "y...y"];
export const ESTRELA_ACESA = dataUri(sprite(ESTRELA, { y: "#ffd84a" }));
export const ESTRELA_APAGADA = dataUri(sprite(ESTRELA, { y: "rgba(0,0,0,.35)" }));

const GEMA = ["..kkk..", ".kclck.", "kclccck", "kcccdck", "kccddck", ".kcddk.", "..kkk.."];

// Texturas do fundo (16x16, repetem): pedra, vinhas, cristal, runas e filigrana de ouro.
const TEXTURA: Record<Raridade, readonly string[]> = {
  comum: [
    "aaaaaaaaaaaaaaaa",
    "a......ba......b",
    "a......ba......b",
    "a......ba......b",
    "bbbbbbbbbbbbbbbb",
    "...ba......ba...",
    "...ba......ba...",
    "...ba......ba...",
    "aaaaaaaaaaaaaaaa",
    "a......ba......b",
    "a......ba......b",
    "a......ba......b",
    "bbbbbbbbbbbbbbbb",
    "...ba......ba...",
    "...ba......ba...",
    "...ba......ba...",
  ],
  incomum: [
    "......a.........",
    ".....aba........",
    "......a.....a...",
    "......a....aba..",
    "..a...a.....a...",
    ".aba..a.....a...",
    "..a..aaa....a...",
    "..aaaa.aa..aaa..",
    "......a.aaaa.aa.",
    "......a.........",
    "a.....a.......a.",
    "b.....a......aba",
    "a....aaa......a.",
    "....aa.aa.....a.",
    "...a.....a....a.",
    "aaa.......aaaaa.",
  ],
  rara: [
    "........a.......",
    ".......aba......",
    "......ab.ba.....",
    ".......aba......",
    "........a.......",
    "aa......a.....aa",
    "..aa..aa.aa..a..",
    "....aa.....aa...",
    "................",
    "a...............",
    "ba.............a",
    ".ba...........ab",
    "ab.............a",
    "a......aa.......",
    "aa..aa..aa..aa..",
    "..aa......aa..aa",
  ],
  epica: [
    "a.a.............",
    ".a......b.......",
    "a.a.....b.......",
    "......bbbbb.....",
    "........b.......",
    "........b.......",
    "..aaa...........",
    "..a.a......a....",
    "..aaa.....aaa...",
    "....a......a....",
    "....a...........",
    "...........bbb..",
    "..b.........b...",
    ".bbb.......b.b..",
    "..b.......b...b.",
    "................",
  ],
  lendaria: [
    "a..............a",
    ".a....bbbb....a.",
    "..a..b....b..a..",
    "...ab..aa..ba...",
    "...b..a..a..b...",
    "...b.a.bb.a.b...",
    "...b.a.bb.a.b...",
    "...b..a..a..b...",
    "...ab..aa..ba...",
    "..a..b....b..a..",
    ".a....bbbb....a.",
    "a..............a",
    "................",
    "........a.......",
    ".......aba......",
    "........a.......",
  ],
};
const TINTA_TEXTURA: Record<Raridade, Paleta> = {
  comum: { a: "rgba(255,255,255,.10)", b: "rgba(0,0,0,.22)" },
  incomum: { a: "rgba(20,40,0,.30)", b: "rgba(220,255,160,.30)" },
  rara: { a: "rgba(180,225,255,.28)", b: "rgba(0,20,60,.30)" },
  epica: { a: "rgba(230,215,255,.30)", b: "rgba(255,240,160,.35)" },
  lendaria: { a: "rgba(255,250,210,.40)", b: "rgba(110,60,0,.35)" },
};
// gema dos cantos: cor, brilho e sombra (a lendária leva rubi)
const COR_GEMA: Record<Raridade, [string, string, string]> = {
  comum: ["#b9b9b9", "#ffffff", "#6f6f6f"],
  incomum: ["#7fc23a", "#e4ffbe", "#3d6a12"],
  rara: ["#4aa3ff", "#e1f2ff", "#1a4f99"],
  epica: ["#b06cff", "#f3e6ff", "#5a2aa8"],
  lendaria: ["#ff4d6d", "#ffd6de", "#a3122f"],
};

/** Textura e gema de cada raridade, já em data URI. */
export const DESENHO: Record<Raridade, { textura: string; gema: string }> = Object.fromEntries(
  (Object.keys(TEXTURA) as Raridade[]).map(r => {
    const [c, l, d] = COR_GEMA[r];
    return [
      r,
      {
        textura: dataUri(sprite(TEXTURA[r], TINTA_TEXTURA[r])),
        gema: dataUri(sprite(GEMA, { k: "#111111", c, l, d })),
      },
    ];
  }),
) as Record<Raridade, { textura: string; gema: string }>;
