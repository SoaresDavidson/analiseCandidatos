import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, PointerEvent } from 'react';

const DER_PAGES = [
  { title: 'Entidades e relacionamentos', src: 'diagramas/der-geral-relacoes.drawio.svg' },
  { title: 'Entidades e atributos', src: 'diagramas/der-geral-atributos.drawio.svg' },
];

// Navegação por arrasto, zoom e ajuste à tela do DER.
// A transformação vive em ref e é aplicada direto no estilo: arrastar não re-renderiza.
export default function DiagramViewer() {
  const [pageIndex, setPageIndex] = useState(0);
  const [status, setStatus] = useState('Carregando DER…');
  // Os dois elementos estão sempre montados; null! evita checagens em cada uso.
  const viewportRef = useRef<HTMLDivElement>(null!);
  const imageRef = useRef<HTMLImageElement>(null!);
  const view = useRef({ scale: 1, x: 0, y: 0 });
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const page = DER_PAGES[pageIndex];

  function hasDiagram() {
    const image = imageRef.current;
    return image.complete && image.naturalWidth > 0;
  }

  function updateView() {
    const { scale, x, y } = view.current;
    imageRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }

  function fitDiagram() {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!hasDiagram() || !viewport.clientWidth || !viewport.clientHeight) return;
    const padding = 24;
    const scale = Math.min(
      1,
      (viewport.clientWidth - padding * 2) / image.naturalWidth,
      (viewport.clientHeight - padding * 2) / image.naturalHeight,
    );
    view.current = {
      scale,
      x: (viewport.clientWidth - image.naturalWidth * scale) / 2,
      y: (viewport.clientHeight - image.naturalHeight * scale) / 2,
    };
    updateView();
  }

  function zoomAt(factor: number, px: number, py: number) {
    if (!hasDiagram()) return;
    const { scale, x, y } = view.current;
    const next = Math.max(0.05, Math.min(4, scale * factor));
    view.current = { scale: next, x: px - (px - x) * next / scale, y: py - (py - y) * next / scale };
    updateView();
  }

  function zoomAtCenter(factor: number) {
    const viewport = viewportRef.current;
    zoomAt(factor, viewport.clientWidth / 2, viewport.clientHeight / 2);
  }

  function panBy(dx: number, dy: number) {
    view.current.x += dx;
    view.current.y += dy;
    updateView();
  }

  // Refs dão aos listeners nativos abaixo sempre a versão atual das funções.
  const fitRef = useRef(fitDiagram);
  const zoomRef = useRef(zoomAt);
  fitRef.current = fitDiagram;
  zoomRef.current = zoomAt;

  useEffect(() => {
    const viewport = viewportRef.current;
    // React registra wheel como passivo; preventDefault exige listener nativo.
    const onWheel = (event: WheelEvent) => {
      if (!hasDiagram()) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      zoomRef.current(Math.exp(-event.deltaY * 0.001), event.clientX - rect.left, event.clientY - rect.top);
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    // Também ajusta quando a seção deixa de estar oculta.
    const observer = new ResizeObserver(() => fitRef.current());
    observer.observe(viewport);
    return () => {
      viewport.removeEventListener('wheel', onWheel);
      observer.disconnect();
    };
  }, []);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!hasDiagram() || event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = '';
    event.currentTarget.focus({ preventScroll: true });
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    panBy(event.clientX - current.x, event.clientY - current.y);
    current.x = event.clientX;
    current.y = event.clientY;
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, [number, number]> = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] };
    if (moves[event.key]) panBy(...moves[event.key]);
    else if (event.key === '+' || event.key === '=') zoomAtCenter(1.25);
    else if (event.key === '-') zoomAtCenter(0.8);
    else if (event.key === '0' || event.key === 'Home') fitDiagram();
    else return;
    event.preventDefault();
  }

  function selectPage(event: ChangeEvent<HTMLSelectElement>) {
    setStatus('Carregando DER…');
    setPageIndex(Number(event.target.value));
  }

  return (
    <>
      <div className="my-5 flex flex-wrap items-center gap-2 print:hidden">
        <label htmlFor="diagram-page">Página</label>
        <select id="diagram-page" className="btn max-w-full" aria-label="Página do DER" value={pageIndex} onChange={selectPage}>
          {DER_PAGES.map(({ title }, index) => <option key={title} value={index}>{title}</option>)}
        </select>
        <button type="button" className="btn" aria-label="Diminuir diagrama" onClick={() => zoomAtCenter(0.8)}>−</button>
        <button type="button" className="btn" onClick={fitDiagram}>Ajustar</button>
        <button type="button" className="btn" aria-label="Ampliar diagrama" onClick={() => zoomAtCenter(1.25)}>+</button>
        <a className="text-ufpi underline hover:decoration-gold" href="diagramas/der-geral-separado.drawio" download>Baixar .drawio</a>
      </div>
      <div
        className="relative h-[clamp(340px,65vh,750px)] cursor-grab touch-none overflow-hidden border border-line bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold data-dragging:cursor-grabbing print:hidden"
        ref={viewportRef}
        role="region"
        aria-label="DER: arraste para percorrer; use a roda do mouse para ampliar"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onKeyDown={onKeyDown}
      >
        <img
          className="pointer-events-none absolute top-0 left-0 block max-w-none origin-top-left select-none [-webkit-user-drag:none]"
          ref={imageRef}
          src={page.src}
          alt={`DER: ${page.title}`}
          onLoad={() => {
            fitDiagram();
            setStatus(`${page.title} — arraste para percorrer; use a roda do mouse ou os botões para ampliar.`);
          }}
          onError={() => setStatus('Não foi possível carregar o SVG do DER.')}
        />
      </div>
      <div className="hidden print:block">
        {DER_PAGES.map(({ title, src }) => (
          <section key={src} className="break-inside-avoid break-after-page last:break-after-auto">
            <h3 className="my-[7mm] text-[12pt]">{title}</h3>
            <img className="block h-auto max-h-[205mm] w-full object-contain" src={src} alt={`DER: ${title}`} />
          </section>
        ))}
      </div>
      <p className="text-[.85rem] text-muted print:hidden" role="status">{status}</p>
    </>
  );
}
