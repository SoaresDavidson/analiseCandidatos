// Estados: os 6 sorteados (páginas ainda no recorte original) e os 27 do país (páginas já
// com a base do Brasil inteiro), e como o texto se refere a cada um.

export const UFS = ["AM", "GO", "MA", "MT", "RS", "SE"] as const;

/** As 27 UFs em ordem alfabética da sigla (a mesma ordem de `ufs` nos JSON do Brasil). */
export const UFS_BR = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const; // biome-ignore format: a lista fica legível em três linhas

export const UF_NOME: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AM: "Amazonas",
  AP: "Amapá",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MG: "Minas Gerais",
  MS: "Mato Grosso do Sul",
  MT: "Mato Grosso",
  PA: "Pará",
  PB: "Paraíba",
  PE: "Pernambuco",
  PI: "Piauí",
  PR: "Paraná",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RO: "Rondônia",
  RR: "Roraima",
  RS: "Rio Grande do Sul",
  SC: "Santa Catarina",
  SE: "Sergipe",
  SP: "São Paulo",
  TO: "Tocantins",
};

export const REGIOES: readonly (readonly [string, readonly string[]])[] = [
  ["Norte", ["AC", "AM", "AP", "PA", "RO", "RR", "TO"]],
  ["Nordeste", ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"]],
  ["Centro-Oeste", ["DF", "GO", "MS", "MT"]],
  ["Sudeste", ["ES", "MG", "RJ", "SP"]],
  ["Sul", ["PR", "RS", "SC"]],
];
export const regiaoDe = (uf: string): string => REGIOES.find(([, ufs]) => ufs.includes(uf))?.[0] ?? "";

// "no Amazonas" mas "em Goiás"; "do Maranhão" mas "de Mato Grosso" (como no painel antigo)
const NO: Record<string, string> = {
  AC: "no", AL: "em", AM: "no", AP: "no", BA: "na", CE: "no", DF: "no", ES: "no", GO: "em",
  MA: "no", MG: "em", MS: "no", MT: "no", PA: "no", PB: "na", PE: "em", PI: "no", PR: "no",
  RJ: "no", RN: "no", RO: "em", RR: "em", RS: "no", SC: "em", SE: "em", SP: "em", TO: "no",
}; // biome-ignore format: tabela
const DO: Record<string, string> = {
  AC: "do", AL: "de", AM: "do", AP: "do", BA: "da", CE: "do", DF: "do", ES: "do", GO: "de",
  MA: "do", MG: "de", MS: "de", MT: "de", PA: "do", PB: "da", PE: "de", PI: "do", PR: "do",
  RJ: "do", RN: "do", RO: "de", RR: "de", RS: "do", SC: "de", SE: "de", SP: "de", TO: "do",
}; // biome-ignore format: tabela

/** "no Amazonas", "em Goiás"; "TODAS" -> "nos 6 estados". */
export const noEstado = (uf: string): string => (uf === "TODAS" ? "nos 6 estados" : `${NO[uf]} ${UF_NOME[uf]}`);

/** Como `noEstado`, para as páginas com a base do país: "TODAS" -> "no Brasil". */
export const noLugar = (uf: string): string => (uf === "TODAS" ? "no Brasil" : `${NO[uf]} ${UF_NOME[uf]}`);

/** "do Amazonas", "de Goiás". */
export const doEstado = (uf: string): string => `${DO[uf]} ${UF_NOME[uf]}`;

/** Para busca: sem acento e minúsculo ("São José" -> "sao jose"). */
export const semAcento = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
