const STORAGE_KEY = 'stadiumSidebarWidths';
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 240;
const MAX_WIDTH = 460;
const MIN_CENTER_WIDTH = 520;

let activeDrag = null;

function readSavedWidths() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      left: Number(saved.left) || DEFAULT_WIDTH,
      right: Number(saved.right) || DEFAULT_WIDTH,
    };
  } catch {
    return { left: DEFAULT_WIDTH, right: DEFAULT_WIDTH };
  }
}

function saveWidths(widths) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
}

function clampWidth(value, command, otherWidth) {
  const maxByCenter = command.clientWidth - otherWidth - MIN_CENTER_WIDTH;
  const max = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, maxByCenter));
  return Math.round(Math.min(Math.max(value, MIN_WIDTH), max));
}

function applyWidths(command, widths = readSavedWidths()) {
  if (!command) return;
  if (command.clientWidth < 960) {
    command.style.gridTemplateColumns = '';
    return;
  }

  const left = clampWidth(widths.left, command, widths.right);
  const right = clampWidth(widths.right, command, left);
  command.style.gridTemplateColumns = `${left}px minmax(0, 1fr) ${right}px`;
  command.dataset.sidebarLeftWidth = String(left);
  command.dataset.sidebarRightWidth = String(right);
}

function createHandle(side) {
  const handle = document.createElement('div');
  handle.className = `sidebar-resize-handle sidebar-resize-handle--${side}`;
  handle.dataset.sidebarResize = side;
  handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-orientation', 'vertical');
  handle.setAttribute('aria-label', side === 'left' ? 'Kéo đổi độ rộng sidebar trái' : 'Kéo đổi độ rộng sidebar phải');
  return handle;
}

function onPointerMove(event) {
  if (!activeDrag) return;

  const dx = event.clientX - activeDrag.startX;
  const rawLeft = activeDrag.side === 'left' ? activeDrag.startLeft + dx : activeDrag.startLeft;
  const rawRight = activeDrag.side === 'right' ? activeDrag.startRight - dx : activeDrag.startRight;
  const left = clampWidth(rawLeft, activeDrag.command, rawRight);
  const right = clampWidth(rawRight, activeDrag.command, left);

  applyWidths(activeDrag.command, { left, right });
}

function stopDrag() {
  if (!activeDrag) return;

  const widths = {
    left: Number(activeDrag.command.dataset.sidebarLeftWidth) || DEFAULT_WIDTH,
    right: Number(activeDrag.command.dataset.sidebarRightWidth) || DEFAULT_WIDTH,
  };
  saveWidths(widths);
  document.body.classList.remove('sidebar-resizing');
  activeDrag = null;
}

function startDrag(event) {
  const handle = event.currentTarget;
  const command = handle.closest('.security-command');
  if (!command) return;

  const side = handle.dataset.sidebarResize;
  activeDrag = {
    side,
    command,
    startX: event.clientX,
    startLeft: Number(command.dataset.sidebarLeftWidth) || command.querySelector('.security-sidebar--left')?.getBoundingClientRect().width || DEFAULT_WIDTH,
    startRight: Number(command.dataset.sidebarRightWidth) || command.querySelector('.security-sidebar--right')?.getBoundingClientRect().width || DEFAULT_WIDTH,
  };

  document.body.classList.add('sidebar-resizing');
  event.preventDefault();
  event.stopPropagation();
}

function ensureHandle(sidebar, side) {
  if (!sidebar || sidebar.querySelector(`.sidebar-resize-handle--${side}`)) return;
  const handle = createHandle(side);
  handle.addEventListener('pointerdown', startDrag);
  sidebar.appendChild(handle);
}

export function initSidebarResize(pageId) {
  const root = document.getElementById(`page-${pageId}`) || document;
  root.querySelectorAll('.page-view--stadium-cmd .security-command, .security-command').forEach((command) => {
    ensureHandle(command.querySelector('.security-sidebar--left'), 'left');
    ensureHandle(command.querySelector('.security-sidebar--right'), 'right');
    applyWidths(command);
  });
}

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', stopDrag);
window.addEventListener('pointercancel', stopDrag);
window.addEventListener('resize', () => {
  document.querySelectorAll('.page-view--stadium-cmd .security-command').forEach((command) => applyWidths(command));
});
