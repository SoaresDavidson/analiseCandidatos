import { pc } from "../../lib/formato";
import type { DadosQ5, PartidoQ5, Soma, Troca } from "./tipos";

// a ordem de `cargos` no q5.json
export const CARGO_ROT = ["Vereador", "Dep. estadual", "Dep. federal"];
export const CARGO_NOME = ["vereador", "deputado estadual", "deputado federal"];
export const CARGO_PLURAL = ["vereadores", "deputados estaduais", "deputados federais"];

/** Eleições de cada cargo: vereador nas municipais, deputados nas gerais. */
export const anosDoCargo = (cargo: number): number[] => (cargo === 0 ? [2020, 2024] : [2018, 2022]);

/** Ao trocar de cargo, mantém a posição do ano (1ª ou 2ª eleição do cargo). */
export function anoAoTrocarCargo(cargoAntigo: number, ano: number, cargoNovo: number): number {
  const k = anosDoCargo(cargoAntigo).indexOf(ano);
  return anosDoCargo(cargoNovo)[k < 0 ? 1 : k];
}

const daUf = (ufs: string[], uf: string) => {
  const todas = uf === "TODAS",
    iu = ufs.indexOf(uf); // UF desconhecida: -1, não casa com nada e a lista fica vazia
  return (u: number) => todas || u === iu;
};

/** As linhas de partido de cargo, ano e estado ("TODAS" = os 6). */
export function filtrarPartidos(D: DadosQ5, cargo: number, ano: number, uf: string): PartidoQ5[] {
  const ok = daUf(D.ufs, uf);
  return D.partidos.filter(p => p[0] === ano && p[2] === cargo && ok(p[1]));
}

export function somar(ps: readonly PartidoQ5[]): Soma {
  let eleitos = 0,
    eleitosLegenda = 0,
    nominais = 0,
    legenda = 0;
  for (const p of ps) {
    eleitos += p[4];
    eleitosLegenda += p[5];
    nominais += p[6];
    legenda += p[7];
  }
  return {
    eleitos,
    eleitosLegenda,
    nominais,
    legenda,
    pcEleitos: pc(eleitosLegenda, eleitos),
    pcVotos: pc(legenda, nominais + legenda),
  };
}

/** Eleitos pela legenda por partido (os estados somados), do maior para o menor; só partidos com algum. */
export function porPartido(ps: readonly PartidoQ5[]): { partido: string; legenda: number; eleitos: number }[] {
  const m = new Map<string, { partido: string; legenda: number; eleitos: number }>();
  for (const p of ps) {
    const x = m.get(p[3]) ?? { partido: p[3], legenda: 0, eleitos: 0 };
    x.legenda += p[5];
    x.eleitos += p[4];
    m.set(p[3], x);
  }
  return [...m.values()]
    .filter(x => x.legenda > 0)
    .sort((a, b) => b.legenda - a.legenda || a.partido.localeCompare(b.partido));
}

/** Quem entrou e quem ficou de fora pela legenda, agrupados por UE (estado e nome). */
export function trocas(D: DadosQ5, cargo: number, ano: number, uf: string): Troca[] {
  const ok = daUf(D.ufs, uf);
  const m = new Map<string, Troca>();
  for (const a of D.afetados) {
    if (a[0] !== ano || a[2] !== cargo || !ok(a[1])) continue;
    const k = `${a[1]}|${a[3]}`;
    let t = m.get(k);
    if (!t) m.set(k, (t = { uf: a[1], ue: a[3], entraram: [], ficaramFora: [] }));
    (a[9] ? t.entraram : t.ficaramFora).push(a);
  }
  return [...m.values()].sort((a, b) => a.uf - b.uf || a.ue.localeCompare(b.ue, "pt-BR"));
}

/** Chave de `somasPorFiltro`: cargo, ano e UF ("TODAS" = os 6). */
export const chaveSoma = (cargo: number, ano: number, uf: string): string => `${cargo}|${ano}|${uf}`;

/** Soma de cada cargo, ano e UF (e "TODAS") de uma vez, para a tabela não refiltrar a cada linha. */
export function somasPorFiltro(D: DadosQ5): Map<string, Soma> {
  const grupos = new Map<string, PartidoQ5[]>();
  const poe = (k: string, p: PartidoQ5) => {
    const g = grupos.get(k);
    if (g) g.push(p);
    else grupos.set(k, [p]);
  };
  for (const p of D.partidos) {
    poe(chaveSoma(p[2], p[0], D.ufs[p[1]]), p);
    poe(chaveSoma(p[2], p[0], "TODAS"), p);
  }
  return new Map([...grupos].map(([k, g]) => [k, somar(g)]));
}
