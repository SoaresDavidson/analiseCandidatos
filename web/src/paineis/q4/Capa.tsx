import { useId } from "react";

/** Um ramo de louro: folhas aos pares ao longo de um arco, do pé (embaixo) à ponta (em cima). */
function Louro({ espelho }: { espelho?: boolean }) {
  const cx = 80,
    cy = 56,
    raio = 44;
  const ponto = (graus: number, r: number): [number, number] => {
    const a = (graus * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  return (
    <g transform={espelho ? "translate(160 0) scale(-1 1)" : undefined}>
      <path d="M72,99 A44,44 0 0 1 43,32" fill="none" strokeWidth="1.5" />
      {Array.from({ length: 7 }, (_, k) => {
        const graus = 108 + k * 17;
        const [xf, yf] = ponto(graus, raio + 5.5);
        const [xd, yd] = ponto(graus, raio - 5.5);
        return (
          <g key={k} stroke="none">
            <ellipse cx={xf} cy={yf} rx="8.6" ry="3.3" transform={`rotate(${graus + 90 + 32} ${xf} ${yf})`} />
            <ellipse cx={xd} cy={yd} rx="8.6" ry="3.3" transform={`rotate(${graus + 90 - 32} ${xd} ${yd})`} />
          </g>
        );
      })}
    </g>
  );
}

/** A arte da capa: o título em letra de carta, em arco, gravado em dourado sobre o couro. */
export function Capa() {
  const id = "capa" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ouro = `url(#${id}o)`;
  return (
    <span className="absolute inset-0 flex flex-col items-center justify-between px-[9%] py-[7%] text-center">
      {/* moldura dourada dupla com cantoneiras */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[3.2%] rounded-[6px] border-[1.5px] border-[#d9b24c]/80"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[4.6%] rounded-[3px] border border-[#d9b24c]/45"
      />
      {[
        "top-[3.2%] left-[3.2%]",
        "top-[3.2%] right-[3.2%] -scale-x-100",
        "bottom-[3.2%] left-[3.2%] -scale-y-100",
        "right-[3.2%] bottom-[3.2%] -scale-100",
      ].map(pos => (
        <svg key={pos} aria-hidden="true" viewBox="0 0 60 60" className={`pointer-events-none absolute w-[11%] ${pos}`}>
          <path
            d="M4,56 V22 Q4,4 22,4 H56 M12,56 V26 Q12,12 26,12 H56 M4,30 Q20,30 20,14 M30,4 Q30,20 14,20"
            fill="none"
            stroke="#e3c064"
            strokeWidth="1.6"
          />
          <circle cx="20" cy="20" r="3" fill="#e3c064" />
        </svg>
      ))}

      <span className="relative mt-[4%] font-livro text-[clamp(11px,1.15cqw,17px)] font-semibold tracking-[.34em] text-[#e3c064] uppercase">
        Pergunta 4 · Escolaridade
      </span>

      <svg viewBox="0 0 600 372" role="img" aria-label="Quem estuda mais se elege mais?" className="relative w-full">
        <defs>
          <linearGradient id={`${id}o`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbeeb0" />
            <stop offset=".28" stopColor="#d9a93a" />
            <stop offset=".5" stopColor="#fff4c4" />
            <stop offset=".74" stopColor="#c8962a" />
            <stop offset="1" stopColor="#f6dd8c" />
          </linearGradient>
          <path id={`${id}a`} d="M24,186 Q300,44 576,186" />
          <path id={`${id}b`} d="M70,322 Q300,214 530,322" />
          <filter id={`${id}s`} x="-10%" y="-20%" width="120%" height="150%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="1.6" floodColor="#04100a" floodOpacity=".8" />
          </filter>
        </defs>
        <g fill={ouro} filter={`url(#${id}s)`} textAnchor="middle">
          <text fontSize="90" className="font-carta">
            <textPath href={`#${id}a`} startOffset="50%">
              Quem estuda mais
            </textPath>
          </text>
          <text fontSize="90" className="font-carta">
            <textPath href={`#${id}b`} startOffset="50%">
              se elege mais?
            </textPath>
          </text>
        </g>
      </svg>

      {/* emblema: o capelo de formatura entre dois ramos de louro */}
      <svg aria-hidden="true" viewBox="0 0 160 116" className="relative w-[34%]">
        <g fill="#e3c064" stroke="#e3c064">
          <Louro />
          <Louro espelho />
          <path d="M80,30 L110,43 L80,56 L50,43 Z" stroke="none" />
          <path d="M62,52 V64 Q80,76 98,64 V52 L80,60 Z" stroke="none" opacity=".85" />
          <path d="M110,43 V62" fill="none" strokeWidth="1.8" />
          <circle cx="110" cy="65" r="3.2" stroke="none" />
        </g>
      </svg>

      <span className="relative font-livro text-[clamp(13px,1.35cqw,20px)] leading-snug text-[#f1e2ad] italic">
        Um atlas do Brasil: quanto estudou
        <br />
        quem vota e quem se elege
      </span>

      <span className="relative mb-[3%] grid gap-1 font-livro text-[clamp(10.5px,1cqw,15px)] font-semibold tracking-[.28em] text-[#e3c064] uppercase">
        <span>Eleições de 2022 e 2024</span>
        <span className="text-[#f1e2ad]/70">Politicagem · Brasil</span>
      </span>
    </span>
  );
}

/** O verso da capa: o enunciado e de onde vêm os dados, como um ex-líbris colado na guarda. */
export function Guarda({ aoFechar }: { aoFechar: () => void }) {
  return (
    <div className="relative grid max-h-full w-full max-w-[520px] gap-3 overflow-y-auto rounded-[4px] border border-[#b9a678] bg-[#fbf5e3] px-[7%] py-[6%] text-tinta shadow-[0_10px_26px_rgb(0_0_0/.35)]">
      <div className="livro-sobre text-center">Pergunta 4 · Escolaridade</div>
      <h2 className="livro-titulo text-center !text-[clamp(30px,2.6cqw,44px)]">Quem estuda mais se elege mais?</h2>
      <p className="livro-nota text-center italic">
        Enunciado: grau de escolaridade do candidato × grau de escolaridade dos votadores; existe relação entre
        escolaridade do candidato e sua chance de ser eleito? Locais com menor escolaridade costumam eleger pessoas de
        semelhante escolaridade? [2022, 2024]
      </p>
      <div className="h-px bg-papel-linha" />
      <h3 className="livro-secao">De onde vêm os dados</h3>
      <ul className="m-0 grid list-none gap-2 p-0 text-[13.5px] leading-snug">
        <li>
          <b>Quem se candidatou e quem se elegeu:</b> TSE, registro de candidaturas de 2022 e 2024. A escolaridade é a
          que o próprio candidato declarou.
        </li>
        <li>
          <b>Quanto a população estudou:</b> IBGE, Censo 2022: adultos de 18 anos ou mais, por nível de instrução, em
          cada município.
        </li>
        <li>
          <b>Os mapas:</b> malhas municipais do IBGE, os 27 estados.
        </li>
      </ul>
      <div className="h-px bg-papel-linha" />
      <p className="livro-prosa text-center !text-[16px] italic">
        Escolha um estado no sumário ao lado: o livro vira as páginas até o mapa dele.
      </p>
      <button type="button" onClick={aoFechar} className="livro-aba justify-self-center">
        Fechar o livro
      </button>
    </div>
  );
}
