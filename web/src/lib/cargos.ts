// Cargos e eleições dos painéis que seguem a ordem de `cargos` do q1.json e do q2.json.

export const CARGO_ROT = ["Vereador", "Prefeito", "Dep. estadual", "Dep. federal", "Governador", "Senador"];
export const CARGO_NOME = ["vereador", "prefeito", "deputado estadual", "deputado federal", "governador", "senador"];

/** Eleições de cada cargo: municipais (vereador e prefeito) ou gerais. */
export const anosDoCargo = (cargo: number): number[] => (cargo <= 1 ? [2020, 2024] : [2018, 2022]);

/** Ao trocar de cargo, mantém a posição do ano (1ª ou 2ª eleição do cargo). */
export function anoAoTrocarCargo(cargoAntigo: number, ano: number, cargoNovo: number): number {
  const k = anosDoCargo(cargoAntigo).indexOf(ano);
  return anosDoCargo(cargoNovo)[k < 0 ? 1 : k];
}
