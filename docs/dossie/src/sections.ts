// Cada seção numerada vive em um arquivo próprio em secoes/ (um por integrante).
// A primeira linha é o título ("## N. Título"); o resto é o corpo em Markdown.
const files = import.meta.glob<string>('../secoes/*.md', { query: '?raw', import: 'default', eager: true });

// (slug, arquivo) na ordem em que aparecem na página.
const SECTION_FILES: [id: string, filename: string][] = [
  ['introducao', 'introducao.md'],
  ['perguntas', 'perguntas.md'],
  ['der', 'der.md'],
  ['modelo-relacional', 'modelo-relacional.md'],
  ['dicionario', 'dicionario.md'],
  ['sobre', 'sobre.md'],
  ['fontes', 'fontes.md'],
];

function loadSection(id: string, filename: string) {
  const text = files[`../secoes/${filename}`];
  if (text === undefined) throw new Error(`secoes/${filename} não encontrado`);
  const [heading, ...rest] = text.trim().split('\n');
  if (!heading.startsWith('## ')) {
    throw new Error(`${filename}: primeira linha deve ser um título '## ...'`);
  }
  return { id, title: heading.slice(3).trim(), body: rest.join('\n').trim() };
}

export const SECTIONS = SECTION_FILES.map(([id, filename]) => loadSection(id, filename));
