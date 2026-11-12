import { type CSSProperties, type PointerEvent, useState } from "react";
import { urlFoto } from "../../lib/dados";
import { brl, CARGO, EL, fmt, GRAU_CURTO, PODER_ICONE, RARIDADE, vitoriasTexto } from "./jogo";
import { DESENHO, ESTRELA_ACESA, ESTRELA_APAGADA, ICONE } from "./sprites";
import type { CartaEleito, Rodada } from "./tipos";

/** Os seis poderes da carta, na ordem dos ladrilhos. `id` é a rodada que usa aquele poder. */
const PODERES: readonly { id: Rodada["id"]; rotulo: string; valor: (t: CartaEleito) => string }[] = [
  { id: "voto", rotulo: "Votos", valor: t => fmt(t.votos) },
  { id: "fogo", rotulo: "Campanha", valor: t => brl(t.receita) },
  { id: "verba", rotulo: "Verba pública", valor: t => (t.publico == null ? "sem dado" : brl(t.publico)) },
  { id: "agua", rotulo: "Custo do voto", valor: t => (t.porVoto == null ? "sem dado" : `R$ ${fmt(t.porVoto, 2)}`) },
  { id: "terra", rotulo: "Vitórias", valor: t => String(t.vit) },
  { id: "luz", rotulo: "Estudo", valor: t => (t.grau >= 0 ? GRAU_CURTO[t.grau] : "–") },
];

/** Quanto a carta inclina com o mouse: só as holográficas, e mais quanto mais rara. */
const INCLINACAO: Partial<Record<CartaEleito["raridade"], number>> = { rara: 6, epica: 12, lendaria: 18 };
const reduzMovimento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function moveHolo(e: PointerEvent<HTMLElement>, forca: number | undefined) {
  const c = e.currentTarget,
    b = c.getBoundingClientRect();
  const x = (e.clientX - b.left) / b.width,
    y = (e.clientY - b.top) / b.height;
  c.style.setProperty("--mx", `${x * 100}%`);
  c.style.setProperty("--my", `${y * 100}%`);
  if (forca && !reduzMovimento()) {
    c.style.setProperty("--ry", `${(x - 0.5) * forca}deg`);
    c.style.setProperty("--rx", `${(0.5 - y) * forca}deg`);
  }
}
function soltaHolo(e: PointerEvent<HTMLElement>) {
  const c = e.currentTarget;
  for (const v of ["--mx", "--my"]) c.style.setProperty(v, "50%");
  for (const v of ["--rx", "--ry"]) c.style.setProperty(v, "0deg");
}

/** Carta em pixel-art: a cor e a textura vêm da raridade (votos no próprio cargo); da rara para cima, holográfica.
 * `destaque` marca o ladrilho do poder da rodada em jogo. */
export function Carta({ t, vida, destaque }: { t: CartaEleito; vida: number; destaque?: Rodada["id"] | null }) {
  const [semFoto, setSemFoto] = useState(false);
  const rar = RARIDADE[t.raridade],
    desenho = DESENHO[t.raridade],
    forca = INCLINACAO[t.raridade];
  const gema = <img src={desenho.gema} alt="" />;
  return (
    <article
      className={`carta-px ${t.raridade}`}
      style={{ "--textura": `url("${desenho.textura}")` } as CSSProperties}
      aria-label={`Carta ${rar.nome.toLowerCase()} de ${t.nome}`}
      onPointerMove={e => moveHolo(e, forca)}
      onPointerLeave={soltaHolo}
    >
      <span className="holo" />
      <span className="purpurina" />
      <span className="reflexo" />
      {["g1", "g2", "g3", "g4"].map(g => (
        <span key={g} className={`gema ${g}`} aria-hidden="true">
          {gema}
        </span>
      ))}
      <div className="miolo">
        <header className="fita">
          <span className="nome fonte-pixel">{t.nome}</span>
        </header>
        <div className="meio">
          <div className="moldura-foto">
            <div className="foto">
              {semFoto ? (
                (t.nome[0] || "?").toUpperCase()
              ) : (
                <img src={urlFoto(t.ano, t.sq)} alt={`Foto de ${t.nome}`} onError={() => setSemFoto(true)} />
              )}
              <span className="holo-foto" />
            </div>
            <span className="elemento" title={`Elemento: ${EL[t.el].nome}`}>
              <img src={ICONE[PODER_ICONE[t.el]]} alt="" />
            </span>
          </div>
          <div className="lado">
            <div className="estrelas" title={`${rar.estrelas} de 5 estrelas`}>
              {[1, 2, 3, 4, 5].map(n => (
                <img key={n} src={n <= rar.estrelas ? ESTRELA_ACESA : ESTRELA_APAGADA} alt="" />
              ))}
            </div>
            <span className="selo fonte-pixel">{rar.nome.toUpperCase()}</span>
            <p className="info m-0">
              <b>{CARGO[t.cargo]}</b>
              <br />
              {t.partido} · {t.local} ({t.uf})
              <br />
              {t.ano}
            </p>
            <span className="tipo fonte-pixel">{EL[t.el].nome.toUpperCase()}</span>
          </div>
        </div>
        <div className="poderes">
          {PODERES.map(p => (
            <div key={p.id} data-poder={p.id} className={`poder ${destaque === p.id ? "destaque" : ""}`}>
              <img src={ICONE[PODER_ICONE[p.id]]} alt="" />
              <span className="rotulo">{p.rotulo}</span>
              <b title={p.id === "terra" ? vitoriasTexto(t.vit) : undefined}>{p.valor(t)}</b>
            </div>
          ))}
        </div>
        <footer className="pe">
          <span className="placa-pe" title="Ataque">
            <img src={ICONE.espada} alt="" />
            <b className="fonte-pixel">{t.atq}</b>
          </span>
          <span className="placa-pe" title="Vida">
            <img src={ICONE.coracao} alt="" />
            <b className="fonte-pixel">{vida}</b>
          </span>
        </footer>
      </div>
    </article>
  );
}
