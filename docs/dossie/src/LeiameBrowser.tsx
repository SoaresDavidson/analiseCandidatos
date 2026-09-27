import { useEffect, useRef, useState } from 'react';

// Lista os PDFs de leia-me a partir de public/leiames/indice.md e abre a prévia em um <dialog>.
export default function LeiameBrowser() {
  const [paths, setPaths] = useState<string[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [openPath, setOpenPath] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null!);

  useEffect(() => {
    fetch('leiames/indice.md')
      .then((response) => {
        if (!response.ok) throw Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((text) => setPaths([...text.matchAll(/^- \[[^\]]+\]\(([^)]+)\)/gm)].map((match) => match[1])))
      .catch(() => setError(true));
  }, []);

  function open(path: string) {
    setOpenPath(path);
    dialogRef.current.showModal();
  }

  const needle = query.toLocaleLowerCase('pt-BR');
  const rows = paths?.filter((path) => path.toLocaleLowerCase('pt-BR').includes(needle)) ?? [];
  const status = error
    ? 'Não foi possível carregar o índice de leia-mes.'
    : paths === null ? 'Carregando índice de leia-mes…' : `${rows.length} de ${paths.length} PDF(s)`;

  return (
    <div className="mt-6 rounded-[9px] border border-dashed border-ufpi-2 bg-pale p-[22px] print:hidden">
      <strong>Consultar PDFs de leia-me</strong>
      <p className="mt-2.5 mb-4">
        Lista carregada de <code>docs/dossie/public/leiames/indice.md</code>.{' '}
        <a className="text-ufpi underline hover:decoration-gold" href="leiames/indice.md">Ver índice em Markdown</a>. Clique em um arquivo para abrir a prévia.
      </p>
      <input className="my-2.5 min-w-[260px] rounded-md border border-line bg-white px-2.5 py-[7px]" type="search" placeholder="Filtrar por caminho" value={query} onChange={(event) => setQuery(event.target.value)} />
      <p className="mt-2.5 mb-4" role="status">{status}</p>
      <ul className="mt-2.5 max-h-[420px] overflow-auto rounded-lg border border-line bg-white">
        {rows.map((path) => (
          <li key={path} className="border-b border-line last:border-b-0"><button type="button" className="block w-full bg-white px-3.5 py-[9px] text-left text-[.85rem] text-ink hover:bg-pale" onClick={() => open(path)}>{path}</button></li>
        ))}
      </ul>
      <dialog
        ref={dialogRef}
        className="m-auto h-[min(760px,90vh)] w-[min(920px,calc(100%-48px))] overflow-hidden rounded-[10px] bg-white p-0 shadow-[0_20px_60px_#0006] backdrop:bg-[#0b1a2eb3]"
        aria-label="Prévia do PDF de leia-me"
        onClose={() => setOpenPath('')}
        onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
            <span className="text-[.85rem] font-semibold wrap-anywhere text-ufpi">{openPath}</span>
            <button type="button" className="px-2 py-1 text-[1.3rem] leading-none text-muted hover:text-ufpi" aria-label="Fechar prévia" onClick={() => dialogRef.current.close()}>×</button>
          </div>
          {openPath && <iframe className="flex-1 border-0" src={`leiames/${openPath}`} title="Prévia do PDF de leia-me" />}
        </div>
      </dialog>
    </div>
  );
}
