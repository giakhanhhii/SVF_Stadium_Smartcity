import { SCREEN_VIEWS, getRoomById } from '../data/control-rooms.js';
import { applyPageView, refreshControlRoomVisibility, setControlRoomMode, setRoofProgress } from '../scene/stadium-scene.js';
import { setControlRoomsVisible } from '../scene/stadium-control-rooms.js';
import {
  renderSecurityShell, bindSecurityShell, resetSecurityRoomState,
} from './security-room-ui.js';
import { hydrateSecuritySidebars } from '../pages/init.js';
import { navigateTo } from '../../../../shared-ioc/assets/js/router.js';

let mountEl = null;
let pageRoot = null;
let activeRoomId = null;
let mode = 'exterior';
let bound = false;

const VIEW_LABELS = {
  overview: 'Tổng quan · Ngoài sân',
  exteriorLive: 'Ngoài sân · Tổng thể',
  security: 'An ninh · Trong sân',
  events: 'Sự kiện',
  facilities: 'Cơ sở hạ tầng',
  services: 'Dịch vụ',
  reports: 'Báo cáo',
};

let afterNavigate = null;

function setupPageContext(pageId) {
  pageRoot = document.getElementById(`page-${pageId}`);
  mountEl = pageRoot?.querySelector('[data-mount="control-room"]');
}

export function setNavHandler(fn) {
  afterNavigate = fn;
}

export function activateSecurityTab() {
  bindGlobalEvents();
  setupPageContext('security');
  if (!mountEl) return;
  enterControlRoom('security');
}

export function deactivateSecurityTab() {
  if (activeRoomId !== 'security') return;
  document.dispatchEvent(new CustomEvent('voc-exit-security-interior', { detail: {} }));
  pageRoot?.classList.remove('voc-security-interior', 'voc-stadium-focus');
  if (mountEl) mountEl.innerHTML = '';
  activeRoomId = null;
  mode = 'exterior';
  setControlRoomMode('exterior');
}

function sceneMount() {
  return pageRoot?.querySelector('[data-mount="stadium-scene"]');
}

function goOverviewTab() {
  navigateTo('overview', afterNavigate);
}

function renderRoom(room) {
  const utils = room.utilities.map((u) =>
    `<button type="button" class="voc-room__util" disabled>${u}</button>`,
  ).join('');
  const screens = SCREEN_VIEWS.map((v) =>
    `<button type="button" class="voc-room__screen" data-voc-screen="${v.id}">
      <span class="voc-room__screen-label">${v.label}</span>
      <span class="voc-room__screen-hint">Nhấn để mở sân 3D</span>
    </button>`,
  ).join('');

  return `<div class="voc-room" data-voc-room="${room.id}">
    <header class="voc-room__head">
      <div>
        <span class="voc-room__badge" style="--room-accent:${room.accent}">${room.badge}</span>
        <h2 class="voc-room__title">${room.label}</h2>
      </div>
      <button type="button" class="voc-room__back" data-voc-exit-room><i class="ti ti-arrow-left"></i> Ra ngoài</button>
    </header>
    <div class="voc-room__body">
      <section class="voc-room__panel">
        <h3>Tiện ích điều khiển</h3>
        <div class="voc-room__utils">${utils}</div>
      </section>
      <section class="voc-room__panel voc-room__panel--screens">
        <h3>Màn hình giám sát sân</h3>
        <div class="voc-room__screens">${screens}</div>
      </section>
    </div>
  </div>`;
}

function setMode(next) {
  mode = next;
  setControlRoomMode(next === 'stadium-focus' ? 'room' : next);
  pageRoot?.classList.toggle('voc-room-mode', next === 'room' && activeRoomId !== 'security');
  pageRoot?.classList.toggle('voc-security-interior', next === 'room' && activeRoomId === 'security');
  pageRoot?.classList.toggle('voc-screen-mode', next === 'screen');
  pageRoot?.classList.toggle('voc-stadium-focus', next === 'stadium-focus');
}

function showExteriorHint() {
  if (!mountEl || mode !== 'exterior') return;
  mountEl.innerHTML = '<p class="voc-room-hint">Nhấn phòng điều khiển quanh sân để vào · 5 phòng VOC</p>';
}

function bindGlobalEvents() {
  if (bound) return;
  bound = true;
  document.addEventListener('voc-room-pick', (e) => onControlRoomPick(e.detail));
  document.addEventListener('voc-room-init', () => initControlRoomUI('overview'));
  document.addEventListener('voc-room-hint', () => showExteriorHint());
  document.addEventListener('voc-open-stadium-screen', (e) => openScreen(e.detail));
}

export function initControlRoomUI(pageId) {
  bindGlobalEvents();
  if (pageId !== 'overview') return;
  setupPageContext('overview');
  if (!mountEl) return;
  mountEl.innerHTML = '';
  activeRoomId = null;
  setMode('exterior');
  pageRoot?.classList.remove('voc-security-interior', 'voc-stadium-focus');
  showExteriorHint();
}

export function enterControlRoom(roomId) {
  const room = getRoomById(roomId);
  if (!room || !mountEl) return;

  activeRoomId = roomId;
  setControlRoomsVisible(false);

  if (roomId === 'security') {
    resetSecurityRoomState();
    setMode('room');
    mountEl.innerHTML = renderSecurityShell(room);
    document.dispatchEvent(new CustomEvent('voc-enter-security-interior'));
    bindSecurityShell(mountEl, { onExitRoom: exitControlRoom, openScreen });
    return;
  }

  mountEl.innerHTML = renderRoom(room);
  setMode('room');
  bindRoomEvents();
}

export function exitControlRoom() {
  const onSecurityPage = pageRoot?.id === 'page-security';
  if (activeRoomId === 'security') {
    document.dispatchEvent(new CustomEvent('voc-exit-security-interior', {
      detail: { restoreView: onSecurityPage ? 'overview' : 'overview' },
    }));
    pageRoot?.classList.remove('voc-security-interior', 'voc-stadium-focus');
  } else {
    const container = sceneMount();
    if (container) applyPageView('overview', container);
  }
  if (mountEl) mountEl.innerHTML = '';
  activeRoomId = null;
  setMode('exterior');
  if (onSecurityPage) {
    goOverviewTab();
    return;
  }
  refreshControlRoomVisibility();
  showExteriorHint();
}

function openScreen(viewId) {
  const container = sceneMount();
  if (!container) return;
  if (activeRoomId === 'security') {
    document.dispatchEvent(new CustomEvent('voc-security-screen-open'));
    setMode('stadium-focus');
    const monitorMode = viewId === 'exteriorLive' ? 'exterior' : 'interior';
    document.dispatchEvent(new CustomEvent('voc-security-view-changed', { detail: monitorMode }));
  } else {
    setMode('screen');
  }
  mountEl.innerHTML = `<button type="button" class="voc-screen-exit" data-voc-exit-screen>
    <i class="ti ti-arrow-left"></i> Thoát · ${VIEW_LABELS[viewId] || viewId}
  </button>`;
  applyPageView(viewId, container);
  if (viewId === 'security') setRoofProgress(1);
  if (activeRoomId === 'security') {
    hydrateSecuritySidebars(viewId === 'exteriorLive' ? 'exterior' : 'interior');
  }
  mountEl.querySelector('[data-voc-exit-screen]')?.addEventListener('click', closeScreen);
}

function closeScreen() {
  const room = getRoomById(activeRoomId);
  if (!room) return exitControlRoom();

  if (activeRoomId === 'security') {
    setMode('room');
    mountEl.innerHTML = renderSecurityShell(room);
    bindSecurityShell(mountEl, { onExitRoom: exitControlRoom, openScreen });
    hydrateSecuritySidebars('interior');
    document.dispatchEvent(new CustomEvent('voc-reenter-security-interior'));
    return;
  }

  mountEl.innerHTML = renderRoom(room);
  setMode('room');
  bindRoomEvents();
}

function bindRoomEvents() {
  mountEl.querySelector('[data-voc-exit-room]')?.addEventListener('click', exitControlRoom);
  mountEl.querySelectorAll('[data-voc-screen]').forEach((btn) => {
    btn.addEventListener('click', () => openScreen(btn.dataset.vocScreen));
  });
}

export function onControlRoomPick(roomId) {
  if (mode !== 'exterior') return;
  if (roomId === 'security') {
    navigateTo('security', afterNavigate);
    return;
  }
  enterControlRoom(roomId);
}

bindGlobalEvents();
