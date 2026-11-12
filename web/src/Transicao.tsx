import { useEffect, useState } from "react";

const DURACAO = 900;
const semMovimento = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const IMAGEM = `${import.meta.env.BASE_URL}img/transicao/caricatura.webp`;

/** A cortina entre as telas: fundo branco e a caricatura no meio, pulando para perto de quem
 *  assiste. Aparece quando `chave` (a página) muda e some sozinha em menos de 1 segundo. */
export function Transicao({ chave }: { chave: string }) {
  const [vista, setVista] = useState({ chave, ligada: false, vez: 0 });
  // ajuste durante o render (padrão do React para estado que depende de prop)
  if (vista.chave !== chave) setVista({ chave, ligada: !semMovimento(), vez: vista.vez + 1 });

  useEffect(() => {
    if (!vista.ligada) return;
    const t = setTimeout(() => setVista(v => ({ ...v, ligada: false })), DURACAO);
    return () => clearTimeout(t);
  }, [vista.ligada, vista.vez]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[80] grid place-items-center bg-white transition-opacity duration-200 ${
        vista.ligada ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* a imagem só entra na página na primeira troca; depois fica pronta para as próximas */}
      {vista.vez > 0 && (
        <img
          key={vista.vez}
          src={IMAGEM}
          alt=""
          width={1100}
          height={733}
          className={`h-auto w-[min(52vw,560px)] ${vista.ligada ? "transicao-pula" : ""}`}
        />
      )}
    </div>
  );
}
