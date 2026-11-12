import { useEffect, useRef, useState } from "react";
import { corEntre as cor, corCabelo, entre, mix } from "./calculo";

// Um rosto desenhado que tem a idade que recebe: liso e de cabelo escuro aos 25, com a primeira
// linha na testa depois dos 40, grisalho perto dos 55 e de cabelo branco e rugas fundas depois dos 70.
// Cada traço entra aos poucos entre duas idades (`entre`), então o rosto muda de forma contínua.

const semMovimento = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
/** A idade que o rosto mostra: vai suave até a nova quando ela muda. */
function useIdadeSuave(alvo: number): number {
  const [idade, setIdade] = useState(alvo);
  const atual = useRef(alvo);
  useEffect(() => {
    const de = atual.current;
    if (de === alvo) return;
    const duracao = semMovimento() ? 0 : 750;
    const t0 = performance.now();
    let quadro = 0;
    const passo = (t: number) => {
      const k = duracao ? Math.min(1, (t - t0) / duracao) : 1;
      const v = de + (alvo - de) * (1 - (1 - k) ** 3);
      atual.current = v;
      setIdade(v);
      if (k < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo]);
  return idade;
}

const RUGA = "#a06f55";

export function Rosto({ idade, rotulo, className = "" }: { idade: number | null; rotulo: string; className?: string }) {
  const a = useIdadeSuave(idade ?? 42);
  const cabelo = corCabelo(a);
  const sobrancelha = corCabelo(a - 7);
  const pele = cor("#e2ae88", "#d2a184", entre(a, 30, 75));
  const sombra = cor("#c98f68", "#b98568", entre(a, 30, 75));

  const papada = entre(a, 48, 78); // o contorno do rosto cede
  const linha = mix(68, 54, entre(a, 34, 76)); // onde o cabelo começa
  const topo = mix(22, 31, entre(a, 46, 78)); // volume do cabelo
  const olho = mix(6.8, 4.9, entre(a, 42, 76)); // pálpebra cai
  const queda = mix(0, 3.2, entre(a, 48, 78)); // sobrancelha cai na ponta
  const nariz = mix(0, 3, entre(a, 40, 76));
  const sorriso = mix(164, 156.5, entre(a, 30, 72));
  const labio = mix(3.7, 2.5, entre(a, 35, 72));

  const testa = [entre(a, 40, 56), entre(a, 48, 62), entre(a, 56, 70)];
  const cenho = entre(a, 52, 66);
  const bigode = entre(a, 36, 58); // o sulco do nariz à boca
  const pes = entre(a, 46, 62); // pés de galinha
  const bolsa = entre(a, 44, 62);
  const bolsa2 = entre(a, 60, 74);
  const boca = entre(a, 58, 72);
  const pescoco = entre(a, 54, 70);
  const manchas = entre(a, 64, 78);
  const face = entre(a, 60, 76);
  const rubor = 0.5 * (1 - entre(a, 28, 50));
  const franja = 1 - entre(a, 26, 42); // a franja encolhe até sumir na linha do cabelo

  return (
    <svg
      viewBox="0 0 200 232"
      role="img"
      aria-label={rotulo}
      className={className}
      style={idade == null ? { filter: "grayscale(1)", opacity: 0.3 } : undefined}
    >
      <circle cx="100" cy="112" r="96" fill="#eef4d8" />
      {/* ombros e pescoço */}
      <path d="M22,232 C26,202 60,193 84,190 L100,207 L116,190 C140,193 174,202 178,232 Z" fill="#5e7a12" />
      <path d="M84,190 L100,207 L116,190" fill="none" stroke="#3f5a08" strokeWidth="3" />
      <path d="M84,166 V192 Q100,206 116,192 V166 Z" fill={sombra} />
      <g fill="none" stroke={RUGA} strokeWidth="1.4" strokeLinecap="round" opacity={pescoco * 0.8}>
        <path d="M88,188 Q100,193 112,188" />
        <path d="M90,181 Q100,185 110,181" />
      </g>

      {/* orelhas e rosto */}
      <ellipse cx="43" cy="113" rx="8.5" ry={mix(13, 15.5, papada)} fill={sombra} />
      <ellipse cx="157" cy="113" rx="8.5" ry={mix(13, 15.5, papada)} fill={sombra} />
      <path
        d={`M45,104 C45,48 155,48 155,104 C155,${138 + 5 * papada} ${136 + 6 * papada},${178 + 3 * papada} 100,${184 + 2 * papada} C${64 - 6 * papada},${178 + 3 * papada} 45,${138 + 5 * papada} 45,104 Z`}
        fill={pele}
      />
      <ellipse cx="66" cy="135" rx="11" ry="7" fill="#ea8f7d" opacity={rubor} />
      <ellipse cx="134" cy="135" rx="11" ry="7" fill="#ea8f7d" opacity={rubor} />

      {/* cabelo: o volume diminui e a linha recua com a idade */}
      <path
        d={`M41,108 C33,${topo} 167,${topo} 159,108 L155,96 C150,${linha + 14} 132,${linha} 100,${linha + 3} C68,${linha} 50,${linha + 14} 45,96 Z`}
        fill={cabelo}
      />
      {franja > 0 && (
        <path
          d={`M48,96 C56,68 94,60 122,69 C104,${mix(66, 72, franja)} 76,${mix(69, 79, franja)} 58,${mix(78, 100, franja)} Z`}
          fill={cabelo}
        />
      )}

      {/* linhas da testa e do cenho */}
      <g fill="none" stroke={RUGA} strokeWidth="1.5" strokeLinecap="round">
        <path d="M71,81 Q100,77 129,81" opacity={testa[0]} />
        <path d="M74,87 Q100,83.5 126,87" opacity={testa[1]} />
        <path d="M77,75 Q100,71.5 123,75" opacity={testa[2]} />
        <path d="M96,91 L95,98 M104,91 L105,98" opacity={cenho} />
      </g>

      {/* sobrancelhas e olhos */}
      <g fill="none" stroke={sobrancelha} strokeWidth={mix(3.5, 4.4, papada)} strokeLinecap="round">
        <path d={`M63,${96 + queda} Q75,${89.5 + queda * 0.3} 89,95.5`} />
        <path d={`M137,${96 + queda} Q125,${89.5 + queda * 0.3} 111,95.5`} />
      </g>
      {[76, 124].map(x => (
        <g key={x}>
          <ellipse cx={x} cy="110" rx="9.6" ry={olho} fill="#fff" />
          <circle cx={x} cy="110" r={Math.min(4.7, olho)} fill="#4a3423" />
          <circle cx={x} cy="110" r="2.1" fill="#1c130d" />
          <circle cx={x + 1.6} cy="108.4" r="1.2" fill="#fff" />
          <path
            d={`M${x - 10.5},109.5 Q${x},${110 - olho - 2} ${x + 10.5},109.5`}
            fill="none"
            stroke="#6d4630"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <g fill="none" stroke={RUGA} strokeLinecap="round">
            <path d={`M${x - 10},119 Q${x},125 ${x + 10},119`} strokeWidth="1.5" opacity={bolsa} />
            <path d={`M${x - 9},123.5 Q${x},128.5 ${x + 9},123.5`} strokeWidth="1.2" opacity={bolsa2} />
          </g>
        </g>
      ))}
      <g fill="none" stroke={RUGA} strokeWidth="1.3" strokeLinecap="round" opacity={pes}>
        <path d="M62,107 L55,102 M61.5,110 L53.5,110 M62,113 L55.5,118" />
        <path d="M138,107 L145,102 M138.5,110 L146.5,110 M138,113 L144.5,118" />
      </g>

      {/* nariz, sulcos e boca */}
      <path
        d={`M100,106 L95.5,${130 + nariz} Q100,${134.5 + nariz} 105.5,${131 + nariz}`}
        fill="none"
        stroke={sombra}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="none" stroke={RUGA} strokeLinecap="round">
        <g strokeWidth={mix(1.2, 2.3, bigode)} opacity={bigode}>
          <path d="M86,132 Q79,142 82,154" />
          <path d="M114,132 Q121,142 118,154" />
        </g>
        <g strokeWidth="1.5" opacity={boca}>
          <path d="M81.5,156 Q78.5,164 81,171" />
          <path d="M118.5,156 Q121.5,164 119,171" />
        </g>
        <g strokeWidth="1.4" opacity={face * 0.7}>
          <path d="M56,128 Q59,143 68,152" />
          <path d="M144,128 Q141,143 132,152" />
        </g>
      </g>
      <path
        d={`M83,151 Q100,${sorriso} 117,151`}
        fill="none"
        stroke="#a2493d"
        strokeWidth={labio}
        strokeLinecap="round"
      />
      <g fill="#a8744f" opacity={manchas * 0.75}>
        <circle cx="60" cy="88" r="2.2" />
        <circle cx="143" cy="93" r="1.8" />
        <circle cx="136" cy="142" r="1.6" />
      </g>
    </svg>
  );
}
