import { SCREEN_VIEWS } from '../data/control-rooms.js';
import { securityRoomData } from '../data/security-room.js';
import {
  getGateState, getGateSummary, resetGateState, setGateOpen, subscribeGateState, toggleGate,
} from '../data/security-gates-state.js';
import { feedToViewId } from '../scene/stadium-security-interior.js';
import { camThumb } from './hud-charts.js';

let gateState = getGateState();
let alertState = securityRoomData.alerts.map((alert) => ({ ...alert }));
let activeMode = 0;
let statusMsg = 'Sẵn sàng · Giám sát trực tiếp';
let shellViewSyncHandler = null;
let gateUnsub = null;

function syncGateState(nextState) {
  gateState = nextState.map((gate) => ({ ...gate }));
}

function gatesHtml() {
  return gateState.map((gate) =>
    `<button type="button" class="sec-room__gate${gate.open ? ' sec-room__gate--open' : ' sec-room__gate--locked'}"
      data-sec-gate="${gate.id}" aria-pressed="${gate.open}">
      <i class="ti ${gate.open ? 'ti-lock-open' : 'ti-lock'}"></i>${gate.id}
    </button>`,
  ).join('');
}

function camsHtml() {
  return securityRoomData.cameras.map((cam) =>
    `<button type="button" class="sec-room__cam${cam.online ? '' : ' sec-room__cam--off'}" data-sec-cam="${cam.id}">
      ${camThumb(cam.label)}
    </button>`,
  ).join('');
}

function actionsHtml() {
  return securityRoomData.actions.map((action) =>
    `<button type="button" class="sec-room__action" data-sec-action="${action.id}">
      <i class="ti ${action.icon}"></i>${action.label}
    </button>`,
  ).join('');
}

function alertsHtml() {
  const live = alertState.filter((alert) => !alert.ack);
  if (!live.length) return '<p class="sec-room__empty">Không còn cảnh báo chưa xử lý</p>';
  return live.map((alert) =>
    `<div class="sec-room__alert-item">
      <div class="hud-alert">
        <span class="hud-alert__tag" style="background:${alert.tagBg};color:${alert.tagColor}">${alert.tag}</span>
        <div class="hud-alert__title">${alert.title}</div>
        <div class="hud-alert__time">${alert.time}</div>
      </div>
      <button type="button" class="sec-room__ack" data-sec-ack="${alert.id}">Xác nhận</button>
    </div>`,
  ).join('');
}

function screensHtml() {
  return SCREEN_VIEWS.map((view) =>
    `<button type="button" class="voc-room__screen" data-voc-screen="${view.id}">
      <span class="voc-room__screen-label">${view.label}</span>
      <span class="voc-room__screen-hint">Nhấn để mở sân 3D</span>
    </button>`,
  ).join('');
}

function setStatus(root, msg) {
  statusMsg = msg;
  root.querySelectorAll('.sec-room__status').forEach((el) => {
    el.textContent = msg;
  });
}

function refreshAlerts(root) {
  const el = root.querySelector('[data-sec-alerts]');
  if (el) el.innerHTML = alertsHtml();
}

function refreshGates(root) {
  root.querySelectorAll('.sec-room__gates').forEach((el) => {
    el.innerHTML = gatesHtml();
  });
  const count = getGateSummary();
  root.querySelectorAll('[data-sec-gate-count]').forEach((el) => {
    el.textContent = count;
  });
}

function syncMonitorTabs(root, mode) {
  root.querySelectorAll('[data-sec-monitor-view]').forEach((btn) => {
    btn.classList.toggle('sec-room-shell__tab--active', btn.dataset.secMonitorView === mode);
  });
}

function bindGateButtons(root) {
  root.querySelectorAll('[data-sec-gate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const gate = toggleGate(btn.dataset.secGate);
      if (!gate) return;
      refreshGates(root);
      bindGateButtons(root);
      setStatus(root, `Cổng ${gate.id} · ${gate.open ? 'Đã mở' : 'Đã khóa'}`);
    });
  });
}

function runAction(root, actionId) {
  const action = securityRoomData.actions.find((item) => item.id === actionId);
  if (actionId === 'act-0') {
    setGateOpen('B2', true);
    refreshGates(root);
    bindGateButtons(root);
    setStatus(root, 'Đã gửi lệnh · Mở cổng B2');
    return;
  }
  setStatus(root, `Đã gửi lệnh · ${action?.label || 'Thao tác'}`);
}

function attachCommonHandlers(root, { openScreen, onExitRoom }) {
  root.querySelector('[data-voc-exit-room]')?.addEventListener('click', onExitRoom);

  root.querySelectorAll('[data-sec-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      runAction(root, btn.dataset.secAction);
      btn.classList.add('sec-room__action--sent');
      setTimeout(() => btn.classList.remove('sec-room__action--sent'), 1200);
    });
  });

  bindGateButtons(root);

  root.querySelectorAll('[data-sec-cam]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cam = securityRoomData.cameras.find((item) => item.id === btn.dataset.secCam);
      setStatus(root, `Live · ${cam?.label || 'Camera'}`);
      openScreen('security');
    });
  });

  root.querySelectorAll('[data-sec-ack]').forEach((btn) => {
    btn.addEventListener('click', () => {
      alertState = alertState.map((alert) => (alert.id === btn.dataset.secAck ? { ...alert, ack: true } : alert));
      refreshAlerts(root);
      setStatus(root, 'Cảnh báo đã xác nhận · Tiếp tục giám sát');
    });
  });
}

export function renderSecurityShell(room) {
  return `<div class="sec-room-shell">
    <button type="button" class="sec-room-shell__exit" data-voc-exit-room>
      <i class="ti ti-arrow-left"></i> Ra ngoài
    </button>
    <div class="sec-room-shell__monitors">
      <button type="button" class="sec-room-shell__tab sec-room-shell__tab--active" data-sec-monitor-view="interior">
        <i class="ti ti-device-desktop"></i> Trái · Trong sân
      </button>
      <button type="button" class="sec-room-shell__tab" data-sec-monitor-view="exterior">
        <i class="ti ti-device-desktop"></i> Phải · Ngoài sân
      </button>
      <span class="sec-room-shell__hint">Nhấn màn hình 3D để giám sát</span>
    </div>
    <aside class="sec-room-shell__panel">
      <div class="sec-room-shell__head">
        <span class="voc-room__badge" style="--room-accent:${room.accent}">${room.badge}</span>
        <strong>${room.label}</strong>
        <span class="sec-room__status">${statusMsg}</span>
      </div>
      <div class="sec-room__gates">${gatesHtml()}</div>
      <div class="sec-room__actions">${actionsHtml()}</div>
    </aside>
  </div>`;
}

export function bindSecurityShell(root, { onExitRoom, openScreen }) {
  gateUnsub?.();
  gateUnsub = subscribeGateState((state) => {
    syncGateState(state);
    if (root.isConnected) {
      refreshGates(root);
      bindGateButtons(root);
    }
  });

  if (shellViewSyncHandler) {
    document.removeEventListener('voc-security-view-changed', shellViewSyncHandler);
  }
  shellViewSyncHandler = (e) => {
    if (root.isConnected) syncMonitorTabs(root, e.detail);
  };
  document.addEventListener('voc-security-view-changed', shellViewSyncHandler);

  attachCommonHandlers(root, { openScreen, onExitRoom });

  root.querySelectorAll('[data-sec-monitor-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncMonitorTabs(root, btn.dataset.secMonitorView);
      openScreen(feedToViewId(btn.dataset.secMonitorView));
    });
  });
}

export function renderSecurityRoom(room) {
  const tabs = securityRoomData.modeTabs.map((tab, i) =>
    `<button type="button" class="sec-room__tab${i === activeMode ? ' sec-room__tab--active' : ''}" data-sec-mode="${i}">${tab}</button>`,
  ).join('');

  return `<div class="voc-room voc-room--security" data-voc-room="${room.id}">
    <header class="voc-room__head voc-room__head--security">
      <div>
        <span class="voc-room__badge" style="--room-accent:${room.accent}">${room.badge}</span>
        <h2 class="voc-room__title">${room.label}</h2>
        <span class="sec-room__status">${statusMsg}</span>
      </div>
      <div class="sec-room__kpis">
        <span><i class="ti ti-camera"></i> ${securityRoomData.status.camerasOnline}</span>
        <span><i class="ti ti-door"></i> <span data-sec-gate-count>${getGateSummary()}</span></span>
        <span><i class="ti ti-flame"></i> ${securityRoomData.status.hotZone}</span>
      </div>
      <button type="button" class="voc-room__back" data-voc-exit-room><i class="ti ti-arrow-left"></i> Ra ngoài</button>
    </header>
    <div class="voc-room__body voc-room__body--security">
      <section class="sec-room__utilities">
        <div class="sec-room__tabs">${tabs}</div>
        <div class="sec-room__block">
          <h3>Camera wall</h3>
          <div class="sec-room__cams">${camsHtml()}</div>
        </div>
        <div class="sec-room__block">
          <h3>Khóa cổng · <span data-sec-gate-count>${getGateSummary()}</span> mở</h3>
          <div class="sec-room__gates">${gatesHtml()}</div>
        </div>
        <div class="sec-room__block">
          <h3>Phản ứng nhanh</h3>
          <div class="sec-room__actions">${actionsHtml()}</div>
        </div>
        <div class="sec-room__block sec-room__block--alerts">
          <h3>Cảnh báo trực tiếp</h3>
          <div class="sec-room__alerts" data-sec-alerts>${alertsHtml()}</div>
        </div>
      </section>
      <section class="voc-room__panel voc-room__panel--screens">
        <h3>Màn hình giám sát sân</h3>
        <div class="voc-room__screens">${screensHtml()}</div>
      </section>
    </div>
  </div>`;
}

export function bindSecurityRoom(root, { openScreen, onExitRoom }) {
  gateUnsub?.();
  gateUnsub = subscribeGateState((state) => {
    syncGateState(state);
    if (root.isConnected) {
      refreshGates(root);
      bindGateButtons(root);
    }
  });

  attachCommonHandlers(root, { openScreen, onExitRoom });

  root.querySelectorAll('[data-voc-screen]').forEach((btn) => {
    btn.addEventListener('click', () => openScreen(btn.dataset.vocScreen));
  });

  root.querySelectorAll('[data-sec-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeMode = Number(btn.dataset.secMode);
      root.querySelectorAll('.sec-room__tab').forEach((tab) => tab.classList.remove('sec-room__tab--active'));
      btn.classList.add('sec-room__tab--active');
      setStatus(root, `${securityRoomData.modeTabs[activeMode]} · Đang hoạt động`);
    });
  });
}

export function resetSecurityRoomState() {
  resetGateState();
  gateState = getGateState();
  alertState = securityRoomData.alerts.map((alert) => ({ ...alert }));
  activeMode = 0;
  statusMsg = 'Sẵn sàng · Giám sát trực tiếp';
}
