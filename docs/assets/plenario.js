// Plenário visto de cima, no formato da Câmara dos Deputados: a mesa diretora no alto,
// com o painel atrás e os telões dos lados; as bancadas em arcos voltados para a mesa,
// cortadas pelos corredores. Cada cadeira é um eleito, com a foto e um anel na cor do
// espectro do partido, da esquerda para a direita pela nota do partido.
//
// Uso: Plenario.desenhar(svg, assentos, { aoClicar, dica })
//   assentos: [{ nome, partido, nota, cor, foto, rotulo }] (a ordem é feita aqui, pela nota)
//   aoClicar(assento): chamado no clique de uma cadeira
//   dica(ev, html) / dica(null): mostra e esconde o balão
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg", XL = "http://www.w3.org/1999/xlink";
  let contador = 0;
  function el(tag, attrs, pai) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (pai) pai.appendChild(e); return e; }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // arco entre dois ângulos (graus; 0 = direita, 90 = para baixo, no sistema do SVG)
  function arco(cx, cy, r, a0, a1) {
    const p = a => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0.toFixed(1)},${y0.toFixed(1)}A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }

  function desenhar(svg, assentos, op) {
    op = op || {};
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const id = "plen" + (++contador);
    const xs = assentos.slice().sort((a, b) => (a.nota ?? 99) - (b.nota ?? 99) || String(a.partido).localeCompare(String(b.partido)));
    const n = xs.length;
    // fileiras: mais cadeiras, mais fileiras; cadeiras por fileira proporcionais ao raio
    const filas = Math.max(2, Math.min(7, Math.round(Math.sqrt(n / 2.4))));
    const W = 960, cx = W / 2, cy = 150, r0 = 190, dr = Math.min(70, 300 / filas);
    const raios = Array.from({ length: filas }, (_, i) => r0 + i * dr), soma = raios.reduce((a, b) => a + b, 0);
    let resto = n;
    const porFila = raios.map((r, i) => { const k = i === filas - 1 ? resto : Math.max(1, Math.round(n * r / soma)); resto -= k; return k; });
    const rExt = raios[filas - 1] + dr * 0.55, H = cy + rExt + 30;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    // corredores: 3 fendas que dividem a plateia em 4 setores, como no plenário
    const A0 = 12, A1 = 168, FENDA = 4.5, cortes = [51, 90, 129];
    const setores = [[A0, cortes[0] - FENDA / 2], [cortes[0] + FENDA / 2, cortes[1] - FENDA / 2], [cortes[1] + FENDA / 2, cortes[2] - FENDA / 2], [cortes[2] + FENDA / 2, A1]];
    const util = setores.reduce((s, [a, b]) => s + (b - a), 0);

    // piso (carpete) e paredes
    const defs = el("defs", {}, svg);
    const piso = el("radialGradient", { id: id + "-piso", cx: "50%", cy: "0%", r: "100%" }, defs);
    el("stop", { offset: "0%", "stop-color": "#4c6b3a" }, piso); el("stop", { offset: "100%", "stop-color": "#2f4527" }, piso);
    // carpete só na área das bancadas (um anel em leque), com a tribuna livre perto da mesa
    const rIn = raios[0] - dr * 0.75, pIn = a => [cx + rIn * Math.cos(a * Math.PI / 180), cy + rIn * Math.sin(a * Math.PI / 180)];
    const [ix, iy] = pIn(A0 - 6);
    el("path", { d: `${arco(cx, cy, rExt, A0 - 6, A1 + 6)}L${pIn(A1 + 6).join(",")}A${rIn},${rIn} 0 0 0 ${ix},${iy}Z`, fill: `url(#${id}-piso)` }, svg);
    el("path", { d: arco(cx, cy, rExt + 8, A0 - 6, A1 + 6), fill: "none", stroke: "#cfc6b4", "stroke-width": 14 }, svg);

    // mesa diretora: painel com as lâminas verticais, telões dos lados e a mesa em curva
    const painel = el("g", {}, svg);
    el("rect", { x: cx - 230, y: 8, width: 460, height: 64, rx: 6, fill: "#d9d2c3" }, painel);
    for (let i = 0; i < 46; i++) el("rect", { x: cx - 226 + i * 10, y: 12, width: 5, height: 56, fill: i % 2 ? "#bfb5a1" : "#e8e1d2" }, painel);
    [[cx - 330, "#1d3f72"], [cx + 230, "#1d3f72"]].forEach(([x, c]) => { el("rect", { x, y: 18, width: 100, height: 48, rx: 4, fill: c }, painel); for (let k = 0; k < 4; k++) el("rect", { x: x + 8, y: 24 + k * 10, width: 84, height: 4, fill: "#5f86c2", opacity: 0.8 }, painel); });
    el("path", { d: `M${cx - 150},${cy - 42}Q${cx},${cy + 2} ${cx + 150},${cy - 42}L${cx + 135},${cy - 62}Q${cx},${cy - 22} ${cx - 135},${cy - 62}Z`, fill: "#a87a45", stroke: "#7d5a31", "stroke-width": 2 }, painel);
    el("text", { x: cx, y: cy - 70, "text-anchor": "middle", class: "eixo", fill: "#5a5446" }, painel).textContent = "MESA DIRETORA";

    // bancadas (mesas em arco, na frente de cada fileira), cortadas nos corredores
    raios.forEach(r => setores.forEach(([a, b]) => el("path", { d: arco(cx, cy, r - dr * 0.36, a, b), fill: "none", stroke: "#b78a55", "stroke-width": Math.max(6, dr * 0.16), "stroke-linecap": "butt" }, svg)));

    // posições das cadeiras, da esquerda (ângulo maior) para a direita
    const pos = [];
    raios.forEach((r, i) => {
      const k = porFila[i];
      for (let j = 0; j < k; j++) {
        let t = util * (k === 1 ? 0.5 : (j + 0.5) / k), a = A0;   // anda pelos setores pulando as fendas
        for (const [s0, s1] of setores) { if (t <= s1 - s0) { a = s0 + t; break; } t -= s1 - s0; }
        pos.push({ a, x: cx + r * Math.cos(a * Math.PI / 180), y: cy + r * Math.sin(a * Math.PI / 180) });
      }
    });
    pos.sort((p, q) => q.a - p.a);
    const raio = Math.max(7, Math.min(26, dr * 0.34, Math.PI * raios[0] * (util / 180) / porFila[0] * 0.42));

    xs.forEach((s, i) => {
      const p = pos[i], g = el("g", { class: "cadeira", tabindex: 0, role: "button", "aria-label": `${s.nome}, ${s.partido}` }, svg);
      const clip = el("clipPath", { id: `${id}-c${i}` }, defs); el("circle", { cx: p.x, cy: p.y, r: raio }, clip);
      el("circle", { cx: p.x, cy: p.y, r: raio + 3.5, fill: s.cor || "#b9b6ae" }, g);
      el("circle", { cx: p.x, cy: p.y, r: raio, fill: "#e8e5de" }, g);
      el("text", { x: p.x, y: p.y + raio * 0.35, "text-anchor": "middle", "font-size": raio, "font-weight": 800, fill: "#8a8578" }, g).textContent = (s.nome || "?")[0];
      if (s.foto) {
        const im = el("image", { x: p.x - raio, y: p.y - raio, width: 2 * raio, height: 2 * raio * 113 / 81, "clip-path": `url(#${id}-c${i})`, preserveAspectRatio: "xMidYMin slice" }, g);
        im.setAttributeNS(XL, "href", s.foto); im.setAttribute("href", s.foto);
        im.addEventListener("error", () => im.remove());
      }
      const ativa = () => op.aoClicar && op.aoClicar(s);
      g.addEventListener("click", ativa);
      g.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); ativa(); } });
      if (op.dica) { g.addEventListener("mousemove", ev => op.dica(ev, `<b>${esc(s.nome)}</b><br>${esc(s.partido)}${s.rotulo ? "<br>" + esc(s.rotulo) : ""}`)); g.addEventListener("mouseleave", () => op.dica(null)); }
    });
    return { filas, porFila, raio };
  }
  window.Plenario = { desenhar };
})();
