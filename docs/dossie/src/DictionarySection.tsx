import { useMemo, useState } from 'react';
import Markdown from './Markdown';

// O dicionário é "### grupo" seguido de entidades "#### `TABELA`" (descrição + uma tabela de atributos).
// O filtro trabalha nas linhas Markdown: cada linha de tabela é um atributo.
type Block =
  | { kind: 'text'; md: string }
  | { kind: 'group'; md: string }
  | { kind: 'entity'; name: string; before: string[]; header: string[]; rows: string[]; after: string[] };

const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function parse(body: string): Block[] {
  const blocks: Block[] = [];
  let chunk: string[] = [];
  const flush = () => {
    if (!chunk.length) return;
    const [first] = chunk;
    if (first.startsWith('#### ')) {
      const table = chunk.filter((line) => line.startsWith('|'));
      const start = chunk.findIndex((line) => line.startsWith('|'));
      blocks.push({
        kind: 'entity',
        name: first,
        before: start < 0 ? chunk : chunk.slice(0, start),
        header: table.slice(0, 2),
        rows: table.slice(2),
        after: start < 0 ? [] : chunk.slice(start + table.length),
      });
    } else if (first.startsWith('### ')) {
      blocks.push({ kind: 'group', md: first });
      if (chunk.length > 1) blocks.push({ kind: 'text', md: chunk.slice(1).join('\n') });
    } else {
      blocks.push({ kind: 'text', md: chunk.join('\n') });
    }
    chunk = [];
  };
  for (const line of body.split('\n')) {
    if (line.startsWith('### ') || line.startsWith('#### ')) flush();
    chunk.push(line);
  }
  flush();
  return blocks;
}

export default function DictionarySection({ body }: { body: string }) {
  const blocks = useMemo(() => parse(body), [body]);
  const [query, setQuery] = useState('');
  const q = fold(query.trim());

  const entities = blocks.filter((block) => block.kind === 'entity');
  const totalRows = entities.reduce((sum, entity) => sum + entity.rows.length, 0);
  let shownEntities = 0;
  let shownRows = 0;

  // Sem filtro, tudo aparece. Com filtro, só entidades com acerto (no nome ou em algum atributo)
  // e o título do grupo que ainda tem entidade visível; convenções e pendências somem.
  const rendered: { key: number; md: string; entity?: boolean }[] = [];
  let pendingGroup: { key: number; md: string } | null = null;
  blocks.forEach((block, key) => {
    if (block.kind === 'group') {
      pendingGroup = { key, md: block.md };
      if (!q) rendered.push(pendingGroup);
      return;
    }
    if (block.kind === 'text') {
      if (!q) rendered.push({ key, md: block.md });
      return;
    }
    const whole = !q || fold(block.name).includes(q);
    const rows = whole ? block.rows : block.rows.filter((row) => fold(row).includes(q));
    if (!whole && !rows.length) return;
    shownEntities++;
    shownRows += rows.length;
    if (q && pendingGroup) {
      rendered.push(pendingGroup);
      pendingGroup = null;
    }
    rendered.push({ key, md: [...block.before, ...block.header, ...rows, ...block.after].join('\n'), entity: true });
  });

  const status = q
    ? `${shownEntities} de ${entities.length} tabelas · ${shownRows} de ${totalRows} atributos`
    : `${entities.length} tabelas · ${totalRows} atributos`;

  return (
    <>
      <div className="sticky top-14 z-[3] mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[9px] border border-line bg-pale px-4 py-3 print:hidden">
        <label htmlFor="dict-search" className="font-semibold text-ufpi">Filtrar por tabela ou atributo</label>
        <input
          id="dict-search"
          type="search"
          className="min-w-[220px] flex-1 rounded-md border border-line bg-white px-2.5 py-[7px]"
          placeholder="ex.: MUNICIPIO, cod_ibge, CD_FAIXA_ETARIA"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="text-[.85rem] text-muted" role="status">{status}</span>
      </div>
      {rendered.map(({ key, md, entity }) => entity
        ? <div key={key} className="[&_td:nth-child(-n+3)]:whitespace-nowrap"><Markdown>{md}</Markdown></div>
        : <Markdown key={key}>{md}</Markdown>)}
    </>
  );
}
