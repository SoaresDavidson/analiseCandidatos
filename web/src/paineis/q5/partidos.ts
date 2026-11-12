// Nome por extenso e número de urna dos partidos de 2018 a 2024, para as figurinhas.
// Partidos com a figurinha desenhada (imagem em public/img/figurinhas) e os demais, que
// ganham uma figurinha no mesmo estilo, montada na página.

/** sigla como vem do TSE -> [número, nome por extenso] */
export const PARTIDO: Record<string, readonly [number, string]> = {
  AGIR: [36, "Agir"],
  AVANTE: [70, "Avante"],
  CIDADANIA: [23, "Cidadania"],
  DC: [27, "Democracia Cristã"],
  DEM: [25, "Democratas"],
  MDB: [15, "Movimento Democrático Brasileiro"],
  MOBILIZA: [33, "Mobilização Nacional"],
  NOVO: [30, "Partido Novo"],
  PATRIOTA: [51, "Patriota"],
  "PC do B": [65, "Partido Comunista do Brasil"],
  PCB: [21, "Partido Comunista Brasileiro"],
  PCO: [29, "Partido da Causa Operária"],
  PDT: [12, "Partido Democrático Trabalhista"],
  PHS: [31, "Partido Humanista da Solidariedade"],
  PL: [22, "Partido Liberal"],
  PMB: [35, "Partido da Mulher Brasileira"],
  PMN: [33, "Partido da Mobilização Nacional"],
  PODE: [20, "Podemos"],
  PP: [11, "Progressistas"],
  PPL: [54, "Partido Pátria Livre"],
  PPS: [23, "Partido Popular Socialista"],
  PR: [22, "Partido da República"],
  PRB: [10, "Partido Republicano Brasileiro"],
  PRD: [25, "Partido Renovação Democrática"],
  PROS: [90, "Partido Republicano da Ordem Social"],
  PRP: [44, "Partido Republicano Progressista"],
  PRTB: [28, "Partido Renovador Trabalhista Brasileiro"],
  PSB: [40, "Partido Socialista Brasileiro"],
  PSC: [20, "Partido Social Cristão"],
  PSD: [55, "Partido Social Democrático"],
  PSDB: [45, "Partido da Social Democracia Brasileira"],
  PSL: [17, "Partido Social Liberal"],
  PSOL: [50, "Partido Socialismo e Liberdade"],
  PSTU: [16, "Partido Socialista dos Trabalhadores Unificado"],
  PT: [13, "Partido dos Trabalhadores"],
  PTB: [14, "Partido Trabalhista Brasileiro"],
  PTC: [36, "Partido Trabalhista Cristão"],
  PV: [43, "Partido Verde"],
  REDE: [18, "Rede Sustentabilidade"],
  REPUBLICANOS: [10, "Republicanos"],
  SOLIDARIEDADE: [77, "Solidariedade"],
  UNIÃO: [44, "União Brasil"],
  UP: [80, "Unidade Popular"],
};

/** Partidos com a figurinha pronta: sigla -> arquivo em public/img/figurinhas. */
const IMAGEM: Record<string, string> = {
  AVANTE: "AVANTE",
  CIDADANIA: "CIDADANIA",
  MDB: "MDB",
  NOVO: "NOVO",
  "PC do B": "PCdoB",
  PDT: "PDT",
  PL: "PL",
  PODE: "PODE",
  PP: "PP",
  PRD: "PRD",
  PSB: "PSB",
  PSD: "PSD",
  PSDB: "PSDB",
  PT: "PT",
  PV: "PV",
  REDE: "REDE",
  REPUBLICANOS: "REPUBLICANOS",
  SOLIDARIEDADE: "SOLIDARIEDADE",
  UNIÃO: "UNIAO",
};

/** Imagem da figurinha do partido, se houver. A do Podemos traz o número 20, que ele só passou a
 *  usar em 2023: nas eleições até 2022 (número 19) vale a figurinha montada na página. */
export const urlFigurinha = (sigla: string, ano: number): string | null =>
  IMAGEM[sigla] && !(sigla === "PODE" && ano <= 2022)
    ? `${import.meta.env.BASE_URL}img/figurinhas/${IMAGEM[sigla]}.webp`
    : null;
export const URL_PACOTE = `${import.meta.env.BASE_URL}img/figurinhas/pacote.webp`;

/** Número de urna; o Podemos era 19 até 2022 e passou a 20 ao incorporar o PSC. */
export const numeroDe = (sigla: string, ano: number): number | null =>
  sigla === "PODE" && ano <= 2022 ? 19 : (PARTIDO[sigla]?.[0] ?? null);
export const nomeDe = (sigla: string): string => PARTIDO[sigla]?.[1] ?? sigla;
