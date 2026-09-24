import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

// Classes Tailwind para o HTML gerado a partir de secoes/*.md.
const components: Components = {
  h3: ({ node, ...props }) => <h3 className="mt-7 mb-2 text-[1.34rem] print:text-[13pt]" {...props} />,
  h4: ({ node, ...props }) => <h4 className="mt-[30px] mb-1 text-[1.08rem] font-bold" {...props} />,
  p: ({ node, ...props }) => <p className="mt-2.5 mb-4" {...props} />,
  ul: ({ node, ...props }) => <ul className="mb-4 list-disc pl-6" {...props} />,
  ol: ({ node, ...props }) => <ol className="mb-4 list-decimal pl-6" {...props} />,
  a: ({ node, ...props }) => <a className="text-ufpi underline hover:decoration-gold" {...props} />,
  code: ({ node, ...props }) => <code className="rounded-[3px] bg-[#f0f4f8] px-[3px] py-px text-[.88em] wrap-anywhere" {...props} />,
  table: ({ node, ...props }) => (
    <div className="mb-4 overflow-x-auto print:overflow-visible">
      <table className="w-full border-collapse text-[.9rem] print:text-[7.7pt]" {...props} />
    </div>
  ),
  tr: ({ node, ...props }) => <tr className="even:bg-[#fbfdff]" {...props} />,
  th: ({ node, ...props }) => <th className="border-b border-line bg-pale px-3 py-2.5 text-left align-top font-bold text-ufpi print:px-[5px] print:py-1" {...props} />,
  td: ({ node, ...props }) => <td className="border-b border-line px-3 py-2.5 text-left align-top print:break-inside-avoid print:px-[5px] print:py-1" {...props} />,
};

export default function Markdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>;
}
