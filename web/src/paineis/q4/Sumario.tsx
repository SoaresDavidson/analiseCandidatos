import { UF_NOME } from "../../lib/uf";
import { romano } from "./calculo";
import { ESTADOS_POR_REGIAO, INDICE_BRASIL, INDICE_NOTAS, indiceDoEstado, paginaDe } from "./capitulos";

/** Uma linha do sumário: nome, pontilhado e a página. Clicar vira o livro até lá. */
function Entrada({
  numero,
  nome,
  indice,
  aoIr,
  forte,
}: {
  numero?: string;
  nome: string;
  indice: number;
  aoIr: (indice: number) => void;
  forte?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => aoIr(indice)}
      className={`group flex w-full cursor-pointer items-baseline gap-1.5 rounded-[3px] border-0 bg-transparent px-1 py-px text-left leading-[1.32] font-livro text-tinta hover:bg-[#f3e3ad] focus-visible:bg-[#f3e3ad] ${
        forte ? "text-[17.5px] font-bold" : "text-[16px]"
      }`}
    >
      {numero && <span className="w-[3.1em] flex-none text-[12px] text-tinta-2 tabular-nums">{numero}</span>}
      <span className="group-hover:underline">{nome}</span>
      <span aria-hidden="true" className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-tinta-2/70" />
      <span className="text-[14px] tabular-nums">{paginaDe(indice)}</span>
    </button>
  );
}

/** A página da direita da primeira abertura: os capítulos do livro, um por estado. */
export function Sumario({ aoIr }: { aoIr: (indice: number) => void }) {
  return (
    <div className="grid content-start gap-1.5">
      <div className="text-center">
        <h2 className="livro-titulo">Sumário</h2>
        <p className="livro-nota italic">Clique num capítulo: o livro vira as páginas até ele.</p>
      </div>
      <Entrada numero="I" nome="O Brasil: a resposta" indice={INDICE_BRASIL} aoIr={aoIr} forte />
      <div className="columns-2 gap-x-7">
        {ESTADOS_POR_REGIAO.map(([regiao, ufs]) => (
          <section key={regiao} className="mb-1.5 break-inside-avoid">
            <h3 className="livro-sobre border-b border-papel-linha pb-0.5">{regiao}</h3>
            {ufs.map(uf => {
              const i = indiceDoEstado(uf);
              return <Entrada key={uf} numero={romano(i)} nome={UF_NOME[uf]} indice={i} aoIr={aoIr} />;
            })}
          </section>
        ))}
      </div>
      <Entrada nome="Notas e fontes: como calculamos" indice={INDICE_NOTAS} aoIr={aoIr} forte />
    </div>
  );
}
