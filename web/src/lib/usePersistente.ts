import { useEffect, useState } from "react";

/** useState que lembra o objeto de filtros no localStorage; campos novos do padrão entram mesmo com valor salvo antigo. */
export function usePersistente<T extends object>(
  chave: string,
  inicial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [valor, setValor] = useState<T>(() => {
    try {
      const salvo = localStorage.getItem(chave);
      return salvo == null ? inicial : { ...inicial, ...JSON.parse(salvo) };
    } catch {
      return inicial; // modo privado ou JSON velho: começa do padrão
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
      /* sem armazenamento: segue sem lembrar */
    }
  }, [chave, valor]);
  return [valor, setValor];
}
