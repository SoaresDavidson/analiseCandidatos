// Cartões da página inicial. A frase de cada cartão resume os números da página:
// atualize junto quando o gerador mudar os dados.
// números conferidos no banco (6 estados): Q4, Q8 e Q10 em 15/10/2026; Q3 e Q7 em 17/10/2026; Q2 e Q6 em 20/10/2026;
// Q9 em 22/10/2026 (64,2%: a soma exata, não a das partes arredondadas, 36% + 29%)

export interface Cartao {
  n: number;
  tema: string;
  /** id da página; sem aba, o cartão aparece como "Em breve" */
  aba?: string;
  assunto: string;
  perg: string;
  /** resposta curta; **trecho** vira negrito */
  resp?: string;
}

export const CARTOES: Cartao[] = [
  {
    n: 7,
    tema: "cidades",
    aba: "q7",
    assunto: "Viés político",
    perg: "Para que lado as cidades foram?",
    resp: "Para a direita: de 2020 a 2024, **66%** das cidades votaram mais à direita para vereador, mesmo com a régua fixa.",
  },
  {
    n: 3,
    tema: "cidades",
    aba: "q3",
    assunto: "Índices da cidade",
    perg: "A cidade mais rica vota diferente?",
    resp: "Quase não: ricas ou pobres, elegem os mesmos partidos. **59%** das prefeituras ficaram com União, MDB e PP.",
  },
  {
    n: 4,
    tema: "cidades",
    aba: "q4",
    assunto: "Escolaridade",
    perg: "Quem estuda mais se elege mais?",
    resp: "Só **15%** dos adultos têm faculdade; entre os eleitos de 2024, **37%**.",
  },
  {
    n: 6,
    tema: "cidades",
    aba: "q6",
    assunto: "Idade",
    perg: "Jovem vota em jovem? A cidade troca de comando?",
    resp: "Jovem não vota em jovem: só **5,5%** dos votos para vereador em 2024 foram para candidatos de até 29 anos. E **60%** das cidades trocaram o partido do prefeito.",
  },
  {
    n: 8,
    tema: "dinheiro",
    aba: "q8",
    assunto: "Dinheiro público",
    perg: "Depender do fundo público ajuda a vencer?",
    resp: "Em geral, não: vereadores de 2024 que dependem dele se elegem **14%** das vezes; os outros, **20%**.",
  },
  {
    n: 9,
    tema: "dinheiro",
    aba: "q9",
    assunto: "Propaganda",
    perg: "Onde o candidato gasta com propaganda?",
    resp: "Nas eleições de 2024, **64%** foi para papel impresso e campanha de rua. Internet: 7%.",
  },
  { n: 1, tema: "dinheiro", assunto: "Custo da campanha", perg: "Quanto custa uma cadeira?" },
  {
    n: 2,
    tema: "dinheiro",
    aba: "q2",
    assunto: "Patrimônio",
    perg: "Quem é mais rico se elege mais?",
    resp: "Sim: entre os candidatos a vereador em 2024, **27%** do quinto mais rico se elegeram; do mais pobre, **12%**.",
  },
  {
    n: 10,
    tema: "politicos",
    aba: "q10",
    assunto: "Carreira",
    perg: "Quanto dura a carreira de um político?",
    resp: "De cada 100 vereadores novatos, só **27** seguem eleitos 8 anos depois.",
  },
  { n: 5, tema: "politicos", assunto: "Voto de legenda", perg: "Quantos se elegem graças ao voto no partido?" },
];

/** Cartão verde no topo do tema, para as páginas de exploração. */
export const DESTAQUES: Record<
  string,
  { aba: string; lado: string; numero: string; assunto: string; perg: string; resp: string }
> = {
  cidades: {
    aba: "municipios",
    lado: "Cidades",
    numero: "1.239",
    assunto: "Explorar municípios",
    perg: "Tudo sobre cada cidade",
    resp: "A régua do espectro, a câmara eleita cadeira por cadeira, o dinheiro das campanhas e os eleitos com foto.",
  },
  politicos: {
    aba: "candidatos",
    lado: "Fichas",
    numero: "14 mil",
    assunto: "Quem são os eleitos",
    perg: "A ficha de cada eleito",
    resp: "Os **14.194** eleitos de 2022 e 2024 nos 6 estados, com foto, votos, patrimônio, campanha e carreira.",
  },
};
