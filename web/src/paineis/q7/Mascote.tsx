/** A urninha: uma urna eletrônica com pernas, que corre pelo chão até a nota do lugar escolhido.
 *  Desenhada com os pés em (0, 0); `dir` vira o corpo para o lado da corrida. */
export function Mascote({ correndo, dir }: { correndo: boolean; dir: 1 | -1 }) {
  const perna = (x: number) => (
    <>
      <path d={`M${x},-24 V-5`} stroke="#1b222b" strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <path d={`M${x - 2},-3 h11`} stroke="#1b222b" strokeWidth="6.5" strokeLinecap="round" fill="none" />
    </>
  );
  return (
    <g className="urninha" data-correndo={correndo || undefined} style={{ transform: `scaleX(${dir})` }}>
      <ellipse cx="0" cy="1.5" rx="27" ry="4" fill="rgb(0 0 0 / .16)" />
      <g className="urninha-corpo">
        <g className="urninha-perna-a">{perna(-10)}</g>
        <g className="urninha-perna-b">{perna(10)}</g>
        <path
          className="urninha-braco-a"
          d="M-30,-46 q-10,5 -8,16"
          stroke="#1b222b"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          className="urninha-braco-b"
          d="M30,-46 q10,5 8,16"
          stroke="#1b222b"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* a urna: corpo claro, tela escura à esquerda e teclado à direita */}
        <rect x="-31" y="-71" width="62" height="49" rx="9" fill="#f6f7f9" stroke="#aeb6c0" strokeWidth="1.6" />
        <path d="M-31,-33 h62 v2 a9,9 0 0 1 -9,9 h-44 a9,9 0 0 1 -9,-9 z" fill="#dde2e8" />
        <rect x="-25.5" y="-65" width="33" height="27" rx="4.5" fill="#1b2a35" />
        <g className="urninha-olhos">
          <circle cx="-14.5" cy="-53.5" r="3.3" fill="#fff" />
          <circle cx="-3.5" cy="-53.5" r="3.3" fill="#fff" />
        </g>
        <path d="M-14,-45.5 q5,4.5 10,0" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" fill="none" />
        {[0, 1, 2].flatMap(l =>
          [0, 1, 2].map(c => (
            <rect key={`${l}${c}`} x={12 + c * 5.6} y={-64 + l * 5.6} width="4" height="4" rx="1" fill="#39424d" />
          )),
        )}
        {/* branco, corrige e confirma */}
        <rect x="11.6" y="-45.5" width="4.8" height="4.6" rx="1" fill="#fff" stroke="#aeb6c0" strokeWidth=".6" />
        <rect x="17.4" y="-45.5" width="4.8" height="4.6" rx="1" fill="#f08a24" />
        <rect x="23.2" y="-45.5" width="5.2" height="4.6" rx="1" fill="#1aa64b" />
      </g>
    </g>
  );
}
