import { type CSSProperties, type ReactNode, useEffect, useState } from "react";

// O livro: a capa que abre girando na lombada e as folhas que viram. Quem usa diz em que
// abertura o livro está (`pagina`) e como desenhar cada uma (`desenhar`); ao mudar a abertura,
// o livro vira as folhas até lá, no máximo MAX_FOLHAS de uma vez (as do meio passam em branco).

export interface Abertura {
  /** página da esquerda; null na primeira abertura, em que aparece o verso da capa */
  esquerda: ReactNode | null;
  direita: ReactNode;
  /** nome do capítulo, no alto da página da direita */
  cabeca: string;
}

const MAX_FOLHAS = 5;
const DURACAO = 950,
  PASSO = 115;
const semMovimento = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Uma página de papel: número e nome no alto, as fontes embaixo. */
function Pag({
  lado,
  indice,
  cabeca,
  titulo,
  children,
}: {
  lado: "esq" | "dir";
  indice: number;
  cabeca: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className={`pag pag-${lado}`}>
      <div className="pag-cabeca">
        {lado === "esq" ? (
          <>
            <b>{2 * indice}</b>
            <span>{titulo}</span>
          </>
        ) : (
          <>
            <span>{cabeca}</span>
            <b>{2 * indice + 1}</b>
          </>
        )}
      </div>
      <div className="pag-corpo">{children}</div>
      <div className="pag-rodape">Fontes: TSE, candidaturas de 2022 e 2024 · IBGE, Censo 2022</div>
    </div>
  );
}

const Branca = ({ lado }: { lado: "esq" | "dir" }) => <div className={`pag pag-${lado} pag-branca`} />;

export function Livro({
  aberto,
  aoAbrir,
  pagina,
  desenhar,
  titulo,
  capa,
  guarda,
  aoIrAoSumario,
}: {
  aberto: boolean;
  aoAbrir: () => void;
  /** abertura em que o livro está (0 = sumário) */
  pagina: number;
  desenhar: (indice: number) => Abertura;
  /** título do livro, no alto das páginas da esquerda */
  titulo: string;
  capa: ReactNode;
  /** verso da capa: o que se vê à esquerda na primeira abertura */
  guarda: ReactNode;
  aoIrAoSumario: () => void;
}) {
  // `mostrada` é a abertura em que o livro parou; enquanto difere de `pagina`, as folhas estão virando
  const [mostrada, setMostrada] = useState(pagina);
  if (mostrada !== pagina && (!aberto || semMovimento())) setMostrada(pagina);
  const virando = aberto && mostrada !== pagina && !semMovimento();
  const de = mostrada,
    para = pagina,
    ida = para > de;
  const n = virando ? Math.min(MAX_FOLHAS, Math.abs(para - de)) : 0;

  // se o navegador não avisar o fim da animação (aba em segundo plano), o relógio termina a virada
  useEffect(() => {
    if (!virando) return;
    const t = setTimeout(() => setMostrada(para), DURACAO + (n - 1) * PASSO + 500);
    return () => clearTimeout(t);
  }, [virando, para, n]);

  const pagEsq = (i: number) => {
    const a = desenhar(i);
    return a.esquerda == null ? null : (
      <Pag lado="esq" indice={i} cabeca={a.cabeca} titulo={titulo}>
        {a.esquerda}
      </Pag>
    );
  };
  const pagDir = (i: number) => {
    const a = desenhar(i);
    return (
      <Pag lado="dir" indice={i} cabeca={a.cabeca} titulo={titulo}>
        {a.direita}
      </Pag>
    );
  };

  // durante a virada: embaixo, à esquerda, a página que vai sendo coberta (ou descoberta) e, à
  // direita, a que aparece (ou some); as folhas levam a página antiga numa face e a nova na outra
  const baseEsq = virando ? (ida ? de : para) : pagina;
  const baseDir = virando ? (ida ? para : de) : pagina;

  return (
    <div className="livro" data-aberto={aberto}>
      <div className="livro-tampa" />
      {pagDir(baseDir)}
      {aberto && pagEsq(baseEsq)}

      {virando &&
        Array.from({ length: n }, (_, i) => {
          const primeira = i === 0,
            ultima = i === n - 1;
          const frente = ida ? (primeira ? pagDir(de) : null) : ultima ? pagDir(para) : null;
          const verso = ida ? (ultima ? pagEsq(para) : null) : primeira ? pagEsq(de) : null;
          return (
            <div
              key={`${de}>${para}|${i}`}
              className={`folha ${ida ? "folha-ida" : "folha-volta"}`}
              style={{ "--i": i } as CSSProperties}
              onAnimationEnd={ev => {
                if (ultima && ev.target === ev.currentTarget && ev.animationName.startsWith("vira")) setMostrada(para);
              }}
            >
              {frente ?? <Branca lado="dir" />}
              {verso ?? <Branca lado="esq" />}
            </div>
          );
        })}

      <div className="capa">
        <button
          type="button"
          className="capa-frente"
          onClick={aoAbrir}
          tabIndex={aberto ? -1 : 0}
          aria-hidden={aberto}
          aria-label={`Abrir o livro: ${titulo}`}
        >
          {capa}
        </button>
        <div className="capa-verso">
          <div className="guarda">{guarda}</div>
        </div>
      </div>

      <div className="livro-sulco" />
      {aberto && pagina > 0 && (
        <button
          type="button"
          className="livro-fita"
          onClick={aoIrAoSumario}
          title="Voltar ao sumário"
          aria-label="Voltar ao sumário"
        />
      )}
    </div>
  );
}
