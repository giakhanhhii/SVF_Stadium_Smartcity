const STORAGE_KEY = 'stadiumSidebarWidths';
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 240;
const MAX_WIDTH = 460;
const MIN_CENTER_WIDTH = 520;

let activeDrag = null;
let pendingFrame = null;

function setLiveWidths(command, left, right) {
  command.style.gridTemplateColumns = `${left}px minmax(0, 1fr) ${right}px`;
  command.style.setProperty('--sidebar-left-width', `${left}px`);
  command.style.setProperty('--sidebar-right-width', `${right}px`);
  command.dataset.sidebarLeftWidth = String(left);
  command.dataset.sidebarRightWidth = String(right);
}

function createDragShield() {
  const shield = document.createElement('div');
  shield.className = 'sidebar-resize-shield';
  const guide = document.createElement('div');
  guide.className = 'sidebar-resize-guide';
  shield.appendChild(guide);
  shield.addEventListener('mousemove', onDragMove);
  shield.addEventListener('mouseup', stopDrag);
  shield.addEventListener('mouseleave', preventDragSelection);
  shield.addEventListener('pointermove', onDragMove);
  shield.addEventListener('pointerup', stopDrag);
  shield.addEventListener('mousedown', preventDragSelection);
  shield.addEventListener('mousemove', preventDragSelection);
  shield.addEventListener('dragstart', preventDragSelection);
  document.body.appendChild(shield);
  return { shield, guide };
}

function preventDragSelection(event) {
  if (!activeDrag) return;
  event.preventDefault();
  event.stopPropagation();
}

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
  const minWidth = command.closest('#page-overview') ? 340 : MIN_WIDTH;
  const maxByCenter = command.clientWidth - otherWidth - MIN_CENTER_WIDTH;
  const max = Math.max(minWidth, Math.min(MAX_WIDTH, maxByCenter));
  return Math.round(Math.min(Math.max(value, minWidth), max));
}

function applyWidths(command, widths = readSavedWidths()) {
  if (!command) return;
  if (command.clientWidth < 960) {
    command.style.gridTemplateColumns = '';
    return;
  }

  const left = clampWidth(widths.left, command, widths.right);
  const right = clampWidth(widths.right, command, left);
  setLiveWidths(command, left, right);
}

function createHandle(side) {
  const handle = document.createElement('div');
  handle.className = `sidebar-resize-handle sidebar-resize-handle--${side}`;
  handle.dataset.sidebarResize = side;
  handle.draggable = false;
  handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-orientation', 'vertical');
  handle.setAttribute('aria-label', side === 'left' ? 'Kéo đổi độ rộng sidebar trái' : 'Kéo đổi độ rộng sidebar phải');
  return handle;
}

function onDragMove(event) {
  if (!activeDrag) return;
  event.preventDefault();
  event.stopPropagation();

  const dx = event.clientX - activeDrag.startX;
  const rawLeft = activeDrag.side === 'left' ? activeDrag.startLeft + dx : activeDrag.startLeft;
  const rawRight = activeDrag.side === 'right' ? activeDrag.startRight - dx : activeDrag.startRight;
  const left = clampWidth(rawLeft, activeDrag.command, rawRight);
  const right = clampWidth(rawRight, activeDrag.command, left);
  const commandRect = activeDrag.command.getBoundingClientRect();
  const guideX = activeDrag.side === 'left' ? commandRect.left + left : commandRect.right - right;

  activeDrag.nextLeft = left;
  activeDrag.nextRight = right;
  activeDrag.nextGuideX = guideX;

  if (pendingFrame) return;
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = null;
    if (!activeDrag) return;
    setLiveWidths(activeDrag.command, activeDrag.nextLeft, activeDrag.nextRight);
    activeDrag.guide.style.transform = `translateX(${Math.round(activeDrag.nextGuideX)}px)`;
  });
}

function stopDrag() {
  if (!activeDrag) return;

  const { shield, previousSelectStart, previousDragStart } = activeDrag;
  const left = activeDrag.nextLeft ?? activeDrag.startLeft;
  const right = activeDrag.nextRight ?? activeDrag.startRight;
  if (pendingFrame) {
    cancelAnimationFrame(pendingFrame);
    pendingFrame = null;
  }
  applyWidths(activeDrag.command, { left, right });
  const widths = {
    left: Number(activeDrag.command.dataset.sidebarLeftWidth) || DEFAULT_WIDTH,
    right: Number(activeDrag.command.dataset.sidebarRightWidth) || DEFAULT_WIDTH,
  };
  saveWidths(widths);
  shield?.remove();
  window.getSelection()?.removeAllRanges();
  document.onselectstart = previousSelectStart;
  document.ondragstart = previousDragStart;
  document.documentElement.classList.remove('sidebar-resizing');
  document.body.classList.remove('sidebar-resizing');
  document.documentElement.style.userSelect = '';
  document.body.style.userSelect = '';
  activeDrag = null;
}

function startDrag(event) {
  if (activeDrag) return;
  if (event.button !== undefined && event.button !== 0) return;

  const handle = event.currentTarget;
  const command = handle.closest('.security-command');
  if (!command) return;

  event.preventDefault();
  event.stopPropagation();

  const side = handle.dataset.sidebarResize;
  const { shield, guide } = createDragShield();
  const startLeft = Number(command.dataset.sidebarLeftWidth) || command.querySelector('.security-sidebar--left')?.getBoundingClientRect().width || DEFAULT_WIDTH;
  const startRight = Number(command.dataset.sidebarRightWidth) || command.querySelector('.security-sidebar--right')?.getBoundingClientRect().width || DEFAULT_WIDTH;
  const commandRect = command.getBoundingClientRect();
  const guideX = side === 'left' ? commandRect.left + startLeft : commandRect.right - startRight;
  guide.style.transform = `translateX(${Math.round(guideX)}px)`;

  activeDrag = {
    side,
    command,
    handle,
    shield,
    guide,
    startX: event.clientX,
    startLeft,
    startRight,
    nextLeft: startLeft,
    nextRight: startRight,
    previousSelectStart: document.onselectstart,
    previousDragStart: document.ondragstart,
  };

  document.onselectstart = () => false;
  document.ondragstart = () => false;
  window.getSelection()?.removeAllRanges();
  document.documentElement.classList.add('sidebar-resizing');
  document.body.classList.add('sidebar-resizing');
  document.documentElement.style.userSelect = 'none';
  document.body.style.userSelect = 'none';
}

function ensureHandle(sidebar, side) {
  if (!sidebar || sidebar.querySelector(`.sidebar-resize-handle--${side}`)) return;
  const handle = createHandle(side);
  handle.addEventListener('pointerdown', startDrag);
  handle.addEventListener('mousedown', startDrag);
  handle.addEventListener('dragstart', preventDragSelection);
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

window.addEventListener('mousemove', onDragMove, true);
window.addEventListener('mouseup', stopDrag, true);
window.addEventListener('blur', stopDrag);
window.addEventListener('pointermove', onDragMove, true);
window.addEventListener('pointerup', stopDrag, true);
window.addEventListener('selectstart', preventDragSelection, true);
window.addEventListener('dragstart', preventDragSelection, true);
window.addEventListener('resize', () => {
  document.querySelectorAll('.page-view--stadium-cmd .security-command').forEach((command) => applyWidths(command));
});
