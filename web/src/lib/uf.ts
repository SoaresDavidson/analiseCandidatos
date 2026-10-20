// Os 6 estados sorteados e como o texto se refere a cada um.

export const UFS = ["AM", "GO", "MA", "MT", "RS", "SE"] as const;

export const UF_NOME: Record<string, string> = {
  AM: "Amazonas",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  RS: "Rio Grande do Sul",
  SE: "Sergipe",
};

// "no Amazonas" mas "em Goiás"; "do Maranhão" mas "de Mato Grosso" (como no painel antigo)
const NO: Record<string, string> = { AM: "no", GO: "em", MA: "no", MT: "no", RS: "no", SE: "em" };
const DO: Record<string, string> = { AM: "do", GO: "de", MA: "do", MT: "de", RS: "do", SE: "de" };

/** "no Amazonas", "em Goiás"; "TODAS" -> "nos 6 estados". */
export const noEstado = (uf: string): string => (uf === "TODAS" ? "nos 6 estados" : `${NO[uf]} ${UF_NOME[uf]}`);

/** "do Amazonas", "de Goiás". */
export const doEstado = (uf: string): string => `${DO[uf]} ${UF_NOME[uf]}`;

/** Para busca: sem acento e minúsculo ("São José" -> "sao jose"). */
export const semAcento = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
