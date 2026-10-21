import type { ReactNode } from "react";
import { FotoEleito, Linha, Selo } from "../../componentes";
import { CATEGORIAS, CORES_ESPECTRO } from "../../lib/espectro";
import { brl, fmt, int } from "../../lib/formato";
import { CANAL, CARGO, CARGO_CURTO, frase, RESULTADO } from "./modelo";
import type { Eleito } from "./tipos";

/** Cor da categoria do espectro ("CENTRO-ESQUERDA" no JSON). */
export const corCategoria = (cat: string): string => CORES_ESPECTRO[Math.max(0, CATEGORIAS.indexOf(cat.toLowerCase()))];

/** Grade de números em destaque (perfil de quem está no filtro e topo da ficha). */
export function Numeros({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">{children}</div>;
}

export function Numero({ valor, rotulo }: { valor: ReactNode; rotulo: ReactNode }) {
  return (
    <div className="grid content-start gap-0.5 rounded-xl border-2 border-ouro px-3 py-2.5">
      <b className="text-[22px] leading-[1.15] font-extrabold tabular-nums text-ouro-esc">{valor}</b>
      <span className="text-[13px] text-texto-2">{rotulo}</span>
    </div>
  );
}

/** Barra de uma fonte de receita (mais estreita que a Barra do kit, como na ficha original). */
function BarraFonte({ rotulo, pct }: { rotulo: string; pct: number }) {
  return (
    <div className="grid grid-cols-[minmax(0,11em)_minmax(0,1fr)_3.6em] items-center gap-2.5 text-[13px]">
      <span>{rotulo}</span>
      <span className="relative h-[18px] rounded-[3px] bg-bege">
        <i className="block h-full rounded-[3px] bg-verde-esc" style={{ width: `${pct.toFixed(1)}%` }} />
      </span>
      <b className="text-right font-extrabold tabular-nums">R$ {fmt(pct, 0)}</b>
    </div>
  );
}

// espectro do partido (sql/15_espectro.sql): Bolognesi, Ribeiro, Codato e Silva (2025)
function Espectro({ e, regua }: { e: Eleito; regua: [string, number, string, number] }) {
  if (!e.espectro) {
    return (
      <section className="grid gap-1.5">
        <h3>Espectro do partido</h3>
        <p className="texto-nota">{e.partido} não tem nota na pesquisa usada.</p>
      </section>
    );
  }
  const [v, cat, obs] = e.espectro;
  const [sgE, vE, sgD, vD] = regua;
  const meio = (vE + vD) / 2;
  return (
    <section className="grid gap-1.5">
      <h3>Espectro do partido</h3>
      <p>
        <b>
          {e.partido}: {fmt(v, 2)}
        </b>{" "}
        na escala de 0 (esquerda) a 10 (direita), <b>{cat.toLowerCase()}</b>; {v < meio ? "à esquerda" : "à direita"} do
        meio da régua.
      </p>
      <div
        className="relative mt-2.5 mb-0.5 h-2.5 rounded-[5px]"
        style={{
          background:
            "linear-gradient(90deg, #8a0f16, #c53d33 22%, #e57f68 38%, #dcd9d1 50%, #73a7d4 62%, #2f72b4 78%, #0c3f7c)",
        }}
      >
        <i
          className="absolute -top-[5px] -ml-2.5 size-5 rounded-full border-[3px] border-white shadow-[0_0_0_1px_var(--color-texto)]"
          style={{ left: `${v * 10}%`, background: corCategoria(cat) }}
        />
        <em
          className="absolute -top-1 -bottom-1 border-l-2 border-dashed border-texto"
          style={{ left: `${meio * 10}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-texto-2">
        <span>
          ◂ {sgE} {fmt(vE, 2)}
        </span>
        <span>meio {fmt(meio, 2)}</span>
        <span>
          {sgD} {fmt(vD, 2)} ▸
        </span>
      </div>
      <p className="texto-nota">
        Nota dada por cientistas políticos (Bolognesi, Ribeiro, Codato e Silva, 2025, rodada 2022).
        {obs ? ` ${obs[0].toUpperCase() + obs.slice(1)}.` : ""}
      </p>
    </section>
  );
}

function Campanha({ e }: { e: Eleito }) {
  const R = e.receita || 0;
  if (R <= 0) return <p className="texto-nota">Sem receita registrada na prestação de contas.</p>;
  const fontes: [string, number | null][] = [
    ["Fundo público (FEFC e Fundo Partidário)", e.publico],
    ["Doações de pessoas", e.privado],
    ["Dinheiro do próprio candidato", e.proprio],
    ["Outros repasses do partido", e.partidario],
    ["Repasses de outros candidatos", e.transf],
  ];
  return (
    <>
      <p className="texto-nota">
        De cada R$ 100 arrecadados{e.doadores ? ` (${int(e.doadores)} doador${e.doadores > 1 ? "es" : ""})` : ""}:
      </p>
      <div className="grid gap-2.5">
        {fontes.map(([k, v]) => (
          <BarraFonte key={k} rotulo={k} pct={(100 * (v || 0)) / R} />
        ))}
      </div>
      {e.propaganda ? (
        <Linha
          rotulo="Gasto com propaganda"
          valor={`${brl(e.propaganda)}${e.canal >= 0 ? `, mais em ${CANAL[e.canal][0].toLowerCase() + CANAL[e.canal].slice(1)}` : ""}`}
        />
      ) : null}
    </>
  );
}

function Carreira({ e }: { e: Eleito }) {
  const c = e.carreira;
  const vit = c.filter(x => x.res === 0).length;
  return (
    <section>
      <h3>Carreira</h3>
      <p className="texto-nota">
        {c.length
          ? `${c.length} candidatura${c.length > 1 ? "s" : ""} de ${c[0].ano} a ${c[c.length - 1].ano}, ${vit} vitória${vit > 1 ? "s" : ""}.`
          : ""}
      </p>
      <div className="rolagem-x">
        <ol className="m-0 ml-2.5 grid list-none gap-2 border-l-[3px] border-linha py-0.5 pr-0 pl-[18px]">
          {c.map((x, i) => (
            <li
              key={i}
              className={`relative grid grid-cols-[3.2em_minmax(0,1fr)_auto] items-baseline gap-2.5 text-sm before:absolute before:top-1 before:-left-[27px] before:size-3 before:rounded-full before:content-[''] ${
                x.res === 0
                  ? "before:border-[3px] before:border-verde-esc before:bg-verde-esc"
                  : x.res === 2
                    ? "before:border-2 before:border-dashed before:border-texto-2 before:bg-white"
                    : "before:border-[3px] before:border-ouro before:bg-white"
              }`}
            >
              <b>{x.ano}</b>
              <span>
                {CARGO_CURTO[x.cargo] || ""} · {x.local} ({x.uf}) · {x.partido}
              </span>
              <em className={`text-[12.5px] font-bold not-italic ${x.res === 0 ? "text-verde-esc" : "text-texto-2"}`}>
                {RESULTADO[x.res]}
              </em>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** O cartão da ficha de um eleito: usado na página e na janela aberta por cima de qualquer painel. */
export default function Ficha({
  e,
  regua,
  aoFechar,
}: {
  e: Eleito;
  regua: [string, number, string, number];
  aoFechar: () => void;
}) {
  const situacao = frase(e.situacao)
    .replace(/ por qp$/, " por quociente partidário")
    .replace(/ por media$/, " por média");
  const perfil: [string, string][] = [
    ["Idade na eleição", e.idade == null ? "–" : `${e.idade} anos`],
    ["Gênero", frase(e.genero)],
    ["Cor ou raça", frase(e.cor)],
    ["Escolaridade", frase(e.grau)],
    ["Ocupação declarada", frase(e.ocupacao)],
  ];
  return (
    <article
      aria-labelledby="ficha-nome"
      className="relative grid gap-4 rounded-2xl border-t-[6px] border-ouro bg-branco p-[22px] text-texto shadow-[0_20px_50px_rgb(0_0_0/.3)] [&_h3]:mb-1.5"
    >
      <button
        type="button"
        autoFocus
        aria-label="Fechar a ficha"
        onClick={aoFechar}
        className="absolute top-2.5 right-3 cursor-pointer border-0 bg-transparent text-[30px] leading-none text-texto-2"
      >
        ×
      </button>
      <div className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-4 min-[641px]:grid-cols-[110px_minmax(0,1fr)]">
        <FotoEleito
          ano={e.ano}
          sq={e.sq}
          nome={e.nome}
          className="w-[84px] min-[641px]:w-[110px] aspect-[81/113] rounded-xl! text-[26px]"
        />
        <div>
          <Selo tipo="sim">{situacao}</Selo>
          <h2 id="ficha-nome" className="mt-1.5 text-2xl">
            {e.nome}
          </h2>
          <p className="texto-nota">{e.civil ? `Nome civil: ${e.civil}` : ""}</p>
          <p className="font-bold">
            {CARGO[e.cargo]} · {e.local}
            {e.cargo >= 11 ? ` (${e.uf})` : ""} · {e.partido} · {e.ano}
          </p>
        </div>
      </div>
      <Numeros>
        <Numero
          valor={e.votos == null ? "–" : int(e.votos)}
          rotulo={`votos${e.cargo < 11 && e.munVotos ? `, mais em ${e.munVotos}` : ""}`}
        />
        <Numero
          valor={brl(e.patrimonio || 0)}
          rotulo={`em bens declarados${e.bens ? ` (${e.bens} ${e.bens > 1 ? "itens" : "item"})` : ""}`}
        />
        <Numero valor={brl(e.receita)} rotulo="arrecadados na campanha" />
      </Numeros>
      <Espectro e={e} regua={regua} />
      <div className="grid gap-[18px] min-[641px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section>
          <h3>Perfil</h3>
          <div>
            {perfil.map(([k, v]) => (
              <Linha key={k} rotulo={k} valor={v || "–"} />
            ))}
          </div>
        </section>
        <section>
          <h3>Campanha</h3>
          <div className="grid gap-3">
            <Campanha e={e} />
          </div>
        </section>
      </div>
      <Carreira e={e} />
    </article>
  );
}
