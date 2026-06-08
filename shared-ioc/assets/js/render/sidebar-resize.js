const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 280;
const MAX_WIDTH = 460;
const MIN_CENTER_WIDTH = 520;

let activeDrag = null;
let pendingFrame = null;

function pageIdFromCommand(command) {
  const page = command?.closest('.page-view');
  return page?.id?.replace(/^page-/, '') || 'default';
}

function defaultWidthForPage(pageId) {
  return pageId === 'overview' ? 320 : DEFAULT_WIDTH;
}

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

function storageKeyFor(options = {}) {
  return `${options.storageNamespace || 'ioc'}:sidebarWidths`;
}

function readSavedWidths(pageId = 'default', options = {}) {
  const fallback = defaultWidthForPage(pageId);
  try {
    const saved = JSON.parse(localStorage.getItem(storageKeyFor(options)) || '{}');
    const pageSaved = saved?.[pageId];
    if (pageSaved && typeof pageSaved === 'object') {
      return {
        left: Number(pageSaved.left) || fallback,
        right: Number(pageSaved.right) || fallback,
      };
    }

    // Backward compatibility for the previous shared { left, right } shape.
    if (Number.isFinite(Number(saved.left)) || Number.isFinite(Number(saved.right))) {
      return {
        left: Math.max(Number(saved.left) || fallback, fallback),
        right: Math.max(Number(saved.right) || fallback, fallback),
      };
    }

    return {
      left: fallback,
      right: fallback,
    };
  } catch {
    return { left: fallback, right: fallback };
  }
}

function saveWidths(pageId, widths) {
  let saved = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKeyFor(activeDrag?.options)) || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = parsed;
  } catch {
    saved = {};
  }

  saved[pageId] = widths;
  delete saved.left;
  delete saved.right;
  localStorage.setItem(storageKeyFor(activeDrag?.options), JSON.stringify(saved));
}

function clampWidth(value, command, otherWidth) {
  const minWidth = MIN_WIDTH;
  const maxByCenter = command.clientWidth - otherWidth - MIN_CENTER_WIDTH;
  const max = Math.max(minWidth, Math.min(MAX_WIDTH, maxByCenter));
  return Math.round(Math.min(Math.max(value, minWidth), max));
}

function applyWidths(command, widths = readSavedWidths(pageIdFromCommand(command), command?.__sidebarResizeOptions)) {
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
  let left = activeDrag.startLeft;
  let right = activeDrag.startRight;

  if (activeDrag.side === 'left') {
    left = clampWidth(activeDrag.startLeft + dx, activeDrag.command, activeDrag.startRight);
  } else {
    right = clampWidth(activeDrag.startRight - dx, activeDrag.command, activeDrag.startLeft);
  }

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
    left: Number(activeDrag.command.dataset.sidebarLeftWidth) || defaultWidthForPage(activeDrag.pageId),
    right: Number(activeDrag.command.dataset.sidebarRightWidth) || defaultWidthForPage(activeDrag.pageId),
  };
  saveWidths(activeDrag.pageId, widths);
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
    pageId: pageIdFromCommand(command),
    command,
    options: command.__sidebarResizeOptions,
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

export function initSidebarResize(pageId, options = {}) {
  const root = document.getElementById(`page-${pageId}`) || document;
  root.querySelectorAll('.page-view--stadium-cmd .security-command, .security-command').forEach((command) => {
    command.__sidebarResizeOptions = options;
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
