const DEFAULT_STORAGE_PREFIX = 'iocHudBlockOrder';
const DRAG_THRESHOLD = 5;
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, label, [role="button"], [data-sidebar-resize]';

let activeDrag = null;

function dragIdFor(block, index) {
  const explicit = block.dataset.hudDragId;
  if (explicit) return explicit;

  const title = block.querySelector('.hud-head span')?.textContent?.trim() || `block-${index + 1}`;
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const classKey = [...block.classList]
    .filter((name) => name !== 'hud-block')
    .join('-');

  block.dataset.hudDragId = classKey || slug || `block-${index + 1}`;
  return block.dataset.hudDragId;
}

function storageKey(root, panel) {
  const pageId = root?.id || 'stadium-page';
  const mount = panel.dataset.mount || 'sidebar';
  const namespace = panel.dataset.hudDragNamespace || root?.dataset.hudDragNamespace || 'ioc';
  return `${DEFAULT_STORAGE_PREFIX}:${namespace}:${pageId}:${mount}`;
}

function directBlocks(panel) {
  return [...panel.children].filter((child) =>
    child.classList?.contains('hud-block')
    || Object.hasOwn(child.dataset || {}, 'securityModePanel')
    || Object.hasOwn(child.dataset || {}, 'securityExteriorModePanel')
    || Object.hasOwn(child.dataset || {}, 'servicesModePanel'),
  );
}

function saveOrder(root, panel) {
  const order = directBlocks(panel).map((block, index) => dragIdFor(block, index));
  localStorage.setItem(storageKey(root, panel), JSON.stringify(order));
}

function restoreOrder(root, panel) {
  let order = [];
  try {
    order = JSON.parse(localStorage.getItem(storageKey(root, panel)) || '[]');
  } catch {
    order = [];
  }
  if (!Array.isArray(order) || !order.length) return;

  const blocks = directBlocks(panel);
  const byId = new Map(blocks.map((block, index) => [dragIdFor(block, index), block]));
  order.forEach((id) => {
    const block = byId.get(id);
    if (block) panel.appendChild(block);
  });
}

function closestBlock(target, panel) {
  const block = target.closest?.('.hud-block, [data-security-mode-panel], [data-security-exterior-mode-panel], [data-services-mode-panel]');
  return block?.parentElement === panel ? block : null;
}

function canStartDrag(target, block) {
  if (target.closest(INTERACTIVE_SELECTOR)) return false;
  return block.contains(target);
}

function createPlaceholder(block) {
  const rect = block.getBoundingClientRect();
  const placeholder = document.createElement('div');
  placeholder.className = 'hud-block-drag-placeholder';
  placeholder.style.height = `${Math.round(rect.height)}px`;
  return placeholder;
}

function blockAfterPointer(panel, y) {
  const candidates = directBlocks(panel).filter((block) => block !== activeDrag?.block);
  return candidates.find((block) => {
    const rect = block.getBoundingClientRect();
    return y < rect.top + rect.height / 2;
  }) || null;
}

function movePlaceholder(panel, pointerY) {
  const scrollTop = panel.scrollTop;
  const after = blockAfterPointer(panel, pointerY);
  if (after) {
    panel.insertBefore(activeDrag.placeholder, after);
  } else {
    panel.appendChild(activeDrag.placeholder);
  }
  panel.scrollTop = scrollTop;
}

function autoScrollPanel(panel, pointerY) {
  const rect = panel.getBoundingClientRect();
  const edge = 54;
  if (pointerY < rect.top + edge) {
    panel.scrollTop -= Math.round((rect.top + edge - pointerY) / 5);
  } else if (pointerY > rect.bottom - edge) {
    panel.scrollTop += Math.round((pointerY - (rect.bottom - edge)) / 5);
  }
}

function beginFloatingDrag(event) {
  const { block, panel } = activeDrag;
  const rect = block.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const placeholder = createPlaceholder(block);
  const scrollTop = panel.scrollTop;

  activeDrag.placeholder = placeholder;
  activeDrag.offsetX = event.clientX - rect.left;
  activeDrag.offsetY = event.clientY - rect.top;
  activeDrag.width = rect.width;
  activeDrag.height = rect.height;
  activeDrag.panelLeft = panelRect.left;
  activeDrag.panelTop = panelRect.top;

  panel.insertBefore(placeholder, block);
  panel.classList.add('sidebar-hud--dragging');
  block.classList.add('hud-block--dragging');
  block.style.position = 'absolute';
  block.style.left = `${Math.round(rect.left - panelRect.left)}px`;
  block.style.top = `${Math.round(rect.top - panelRect.top + panel.scrollTop)}px`;
  block.style.width = `${rect.width}px`;
  block.style.height = `${rect.height}px`;
  block.style.zIndex = '120';
  block.style.pointerEvents = 'none';
  block.style.margin = '0';
  panel.scrollTop = scrollTop;
}

function updateFloatingBlock(event) {
  const { block, panel, offsetX, offsetY, panelLeft, panelTop } = activeDrag;
  block.style.left = `${Math.round(event.clientX - panelLeft - offsetX)}px`;
  block.style.top = `${Math.round(event.clientY - panelTop - offsetY + panel.scrollTop)}px`;
}

function resetFloatingStyles(block) {
  block.classList.remove('hud-block--dragging');
  block.style.position = '';
  block.style.left = '';
  block.style.top = '';
  block.style.width = '';
  block.style.height = '';
  block.style.zIndex = '';
  block.style.pointerEvents = '';
  block.style.margin = '';
}

function finishDrag(commit = true) {
  if (!activeDrag) return;
  const { root, panel, block, placeholder, pointerId, started } = activeDrag;

  if (started && placeholder) {
    if (commit) panel.insertBefore(block, placeholder);
    placeholder.remove();
    resetFloatingStyles(block);
    panel.classList.remove('sidebar-hud--dragging');
    saveOrder(root, panel);
  }

  try {
    panel.releasePointerCapture(pointerId);
  } catch {
    // The pointer may already have been released by the browser.
  }
  document.documentElement.classList.remove('hud-block-drag-active');
  activeDrag = null;
}

function onPointerDown(root, panel, event) {
  if (activeDrag) return;
  if (event.button !== undefined && event.button !== 0) return;

  const block = closestBlock(event.target, panel);
  if (!block || !canStartDrag(event.target, block)) return;

  activeDrag = {
    root,
    panel,
    block,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    started: false,
  };

  panel.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event) {
  if (!activeDrag) return;
  if (event.pointerId !== activeDrag.pointerId) return;

  const distance = Math.hypot(event.clientX - activeDrag.startX, event.clientY - activeDrag.startY);
  if (!activeDrag.started && distance < DRAG_THRESHOLD) return;

  event.preventDefault();
  if (!activeDrag.started) {
    activeDrag.started = true;
    document.documentElement.classList.add('hud-block-drag-active');
    beginFloatingDrag(event);
  }

  updateFloatingBlock(event);
  autoScrollPanel(activeDrag.panel, event.clientY);
  movePlaceholder(activeDrag.panel, event.clientY);
}

function onPointerUp(event) {
  if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
  finishDrag(true);
}

function onPointerCancel(event) {
  if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
  finishDrag(false);
}

function bindPanel(root, panel) {
  if (!panel) return;

  restoreOrder(root, panel);

  directBlocks(panel).forEach((block, index) => {
    dragIdFor(block, index);
    block.removeAttribute('draggable');
    block.setAttribute('aria-roledescription', 'Có thể giữ và kéo để đổi vị trí');
    block.querySelector('.hud-head')?.setAttribute('title', 'Giữ và kéo thẻ để đổi vị trí');
  });

  if (panel.dataset.hudDragBound === 'true') return;
  panel.dataset.hudDragBound = 'true';

  panel.addEventListener('pointerdown', (event) => onPointerDown(root, panel, event));
  panel.addEventListener('pointermove', onPointerMove);
  panel.addEventListener('pointerup', onPointerUp);
  panel.addEventListener('pointercancel', onPointerCancel);
}

export function initHudBlockDrag(root = document, options = {}) {
  if (root && options.storageNamespace) root.dataset.hudDragNamespace = options.storageNamespace;
  root.querySelectorAll('.sidebar-hud[data-mount]').forEach((panel) => bindPanel(root, panel));
}
