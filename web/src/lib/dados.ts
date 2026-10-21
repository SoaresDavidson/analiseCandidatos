import { useEffect, useState } from "react";

// Os dados de cada painel ficam em public/dados/ e chegam por fetch: assim o JSON grande
// não entra no bundle e o navegador guarda cada arquivo em cache.

const base = import.meta.env.BASE_URL;
export const urlDados = (arquivo: string): string => `${base}dados/${arquivo}`;
/** Foto do registro no TSE; pode faltar (o componente FotoEleito mostra a inicial). */
export const urlFoto = (ano: number, sq: number | string): string => `${base}fotos/${ano}/${sq}.jpg`;
export const urlBandeira = (uf: string): string => `${base}bandeiras/${uf}.svg`;

const cache = new Map<string, Promise<unknown>>();
/** Busca um JSON de public/dados uma vez só, mesmo que vários painéis peçam. */
export function carregarDados<T>(arquivo: string): Promise<T> {
  let p = cache.get(arquivo);
  if (!p) {
    p = fetch(urlDados(arquivo)).then(r => {
      if (!r.ok) throw new Error(`${arquivo}: HTTP ${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(arquivo)); // um erro de rede não fica preso no cache
    cache.set(arquivo, p);
  }
  return p as Promise<T>;
}

export type EstadoDados<T> = { dados: T; erro: null } | { dados: null; erro: Error | null };

/** Carrega public/dados/<arquivo>; dados = null enquanto carrega ou se der erro. Sem arquivo, não busca. */
export function useDados<T>(arquivo: string | null): EstadoDados<T> {
  const [estado, setEstado] = useState<{ arquivo: string | null } & EstadoDados<T>>({
    arquivo,
    dados: null,
    erro: null,
  });
  useEffect(() => {
    if (!arquivo) return;
    let vivo = true;
    carregarDados<T>(arquivo).then(
      dados => vivo && setEstado({ arquivo, dados, erro: null }),
      erro => vivo && setEstado({ arquivo, dados: null, erro }),
    );
    return () => {
      vivo = false;
    };
  }, [arquivo]);
  // ao trocar de arquivo, não mostra os dados do anterior
  return estado.arquivo === arquivo ? estado : { dados: null, erro: null };
}
