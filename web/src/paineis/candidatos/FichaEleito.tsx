import { useMemo } from "react";
import { Carregando } from "../../componentes";
import Ficha from "./Ficha";
import { useEleitos } from "./modelo";

/** Só a ficha de um eleito, para abrir por cima de qualquer página (o fundo escuro é do App). */
export default function FichaEleito({ ano, sq, aoFechar }: { ano: number; sq: number; aoFechar: () => void }) {
  const { modelo, erro } = useEleitos();
  const eleito = useMemo(() => modelo?.eleitos.find(e => e.sq === sq && e.ano === ano) ?? null, [modelo, ano, sq]);

  return (
    // clicar fora do cartão fecha
    <div className="flex min-h-full items-center justify-center p-3" onClick={ev => { if (ev.target === ev.currentTarget) aoFechar(); }}>
      <div className="w-full max-w-[760px]">
        {eleito && modelo ? (
          <Ficha e={eleito} regua={modelo.dados.regua} aoFechar={aoFechar} />
        ) : (
          <div className="relative rounded-2xl border-t-[6px] border-ouro bg-branco p-[22px]">
            <button type="button" autoFocus aria-label="Fechar a ficha" onClick={aoFechar} className="absolute top-2.5 right-3 cursor-pointer border-0 bg-transparent text-[30px] leading-none text-texto-2">×</button>
            {modelo ? <p className="font-semibold">Não achamos esse eleito nas fichas.</p> : <Carregando erro={erro} />}
          </div>
        )}
      </div>
    </div>
  );
}
