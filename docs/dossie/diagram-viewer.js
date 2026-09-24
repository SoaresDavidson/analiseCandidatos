const diagramPage = document.getElementById('diagram-page');
const viewport = document.getElementById('diagram-viewport');
const image = document.getElementById('diagram-image');
const diagramStatus = document.getElementById('diagram-status');

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let drag = null;

function hasDiagram() {
  return image.complete && image.naturalWidth > 0;
}

function updateView() {
  image.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function fitDiagram() {
  if (!hasDiagram() || !viewport.clientWidth || !viewport.clientHeight) return;
  const padding = 24;
  scale = Math.min(
    1,
    (viewport.clientWidth - padding * 2) / image.naturalWidth,
    (viewport.clientHeight - padding * 2) / image.naturalHeight,
  );
  offsetX = (viewport.clientWidth - image.naturalWidth * scale) / 2;
  offsetY = (viewport.clientHeight - image.naturalHeight * scale) / 2;
  updateView();
}

function zoomAt(factor, x, y) {
  if (!hasDiagram()) return;
  const next = Math.max(0.05, Math.min(4, scale * factor));
  offsetX = x - (x - offsetX) * next / scale;
  offsetY = y - (y - offsetY) * next / scale;
  scale = next;
  updateView();
}

function zoomAtCenter(factor) {
  zoomAt(factor, viewport.clientWidth / 2, viewport.clientHeight / 2);
}

function loadPage() {
  diagramStatus.textContent = 'Carregando DER…';
  image.alt = `DER: ${diagramPage.selectedOptions[0].textContent}`;
  image.src = diagramPage.value;
}

image.addEventListener('load', () => {
  fitDiagram();
  diagramStatus.textContent = `${diagramPage.selectedOptions[0].textContent} — arraste para percorrer; use a roda do mouse ou os botões para ampliar.`;
});
image.addEventListener('error', () => {
  diagramStatus.textContent = 'Não foi possível carregar o SVG do DER.';
});
diagramPage.addEventListener('change', loadPage);
document.getElementById('zoom-in').addEventListener('click', () => zoomAtCenter(1.25));
document.getElementById('zoom-out').addEventListener('click', () => zoomAtCenter(0.8));
document.getElementById('zoom-reset').addEventListener('click', fitDiagram);

viewport.addEventListener('wheel', (event) => {
  if (!hasDiagram()) return;
  event.preventDefault();
  const rect = viewport.getBoundingClientRect();
  zoomAt(Math.exp(-event.deltaY * 0.001), event.clientX - rect.left, event.clientY - rect.top);
}, { passive: false });

viewport.addEventListener('pointerdown', (event) => {
  if (!hasDiagram() || event.button !== 0) return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add('dragging');
  viewport.focus({ preventScroll: true });
});
viewport.addEventListener('pointermove', (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  offsetX += event.clientX - drag.x;
  offsetY += event.clientY - drag.y;
  drag.x = event.clientX;
  drag.y = event.clientY;
  updateView();
});
function stopDrag(event) {
  if (!drag || drag.id !== event.pointerId) return;
  drag = null;
  viewport.classList.remove('dragging');
  if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
}
viewport.addEventListener('pointerup', stopDrag);
viewport.addEventListener('pointercancel', stopDrag);

viewport.addEventListener('keydown', (event) => {
  const moves = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] };
  if (moves[event.key]) {
    [offsetX, offsetY] = [offsetX + moves[event.key][0], offsetY + moves[event.key][1]];
    updateView();
  } else if (event.key === '+' || event.key === '=') {
    zoomAtCenter(1.25);
  } else if (event.key === '-') {
    zoomAtCenter(0.8);
  } else if (event.key === '0' || event.key === 'Home') {
    fitDiagram();
  } else {
    return;
  }
  event.preventDefault();
});

new ResizeObserver(fitDiagram).observe(viewport);
loadPage();
