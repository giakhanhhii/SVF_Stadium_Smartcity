import { SCREEN_VIEWS } from '../data/control-rooms.js';
import { securityRoomData } from '../data/security-room.js';
import { feedToViewId } from '../scene/stadium-security-interior.js';
import { camThumb } from './hud-charts.js';

let gateState = securityRoomData.gates.map((g) => ({ ...g }));
let alertState = securityRoomData.alerts.map((a) => ({ ...a }));
let activeMode = 0;
let statusMsg = 'Sẵn sàng · Giám sát trực tiếp';

function gatesHtml() {
  return gateState.map((g) =>
    `<button type="button" class="sec-room__gate${g.open ? ' sec-room__gate--open' : ' sec-room__gate--locked'}"
      data-sec-gate="${g.id}" aria-pressed="${g.open}">
      <i class="ti ${g.open ? 'ti-lock-open' : 'ti-lock'}"></i>${g.id}
    </button>`,
  ).join('');
}

function camsHtml() {
  return securityRoomData.cameras.map((c) =>
    `<button type="button" class="sec-room__cam${c.online ? '' : ' sec-room__cam--off'}" data-sec-cam="${c.id}">
      ${camThumb(c.label)}
    </button>`,
  ).join('');
}

function actionsHtml() {
  return securityRoomData.actions.map((a) =>
    `<button type="button" class="sec-room__action" data-sec-action="${a.id}">
      <i class="ti ${a.icon}"></i>${a.label}
    </button>`,
  ).join('');
}

function alertsHtml() {
  const live = alertState.filter((a) => !a.ack);
  if (!live.length) return '<p class="sec-room__empty">Không còn cảnh báo chưa xử lý</p>';
  return live.map((a) =>
    `<div class="sec-room__alert-item">
      <div class="hud-alert">
        <span class="hud-alert__tag" style="background:${a.tagBg};color:${a.tagColor}">${a.tag}</span>
        <div class="hud-alert__title">${a.title}</div>
        <div class="hud-alert__time">${a.time}</div>
      </div>
      <button type="button" class="sec-room__ack" data-sec-ack="${a.id}">Xác nhận</button>
    </div>`,
  ).join('');
}

function screensHtml() {
  return SCREEN_VIEWS.map((v) =>
    `<button type="button" class="voc-room__screen" data-voc-screen="${v.id}">
      <span class="voc-room__screen-label">${v.label}</span>
      <span class="voc-room__screen-hint">Nhấn để mở sân 3D</span>
    </button>`,
  ).join('');
}

export function renderSecurityShell(room) {
  const d = securityRoomData;
  const gates = gatesHtml();
  const actions = actionsHtml();
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
      <div class="sec-room__gates">${gates}</div>
      <div class="sec-room__actions">${actions}</div>
    </aside>
  </div>`;
}

function syncMonitorTabs(root, mode) {
  root.querySelectorAll('[data-sec-monitor-view]').forEach((btn) => {
    btn.classList.toggle('sec-room-shell__tab--active', btn.dataset.secMonitorView === mode);
  });
}

let shellViewSyncHandler = null;

export function bindSecurityShell(root, { onExitRoom, openScreen }) {
  root.querySelector('[data-voc-exit-room]')?.addEventListener('click', onExitRoom);

  if (shellViewSyncHandler) {
    document.removeEventListener('voc-security-view-changed', shellViewSyncHandler);
  }
  shellViewSyncHandler = (e) => {
    if (root.isConnected) syncMonitorTabs(root, e.detail);
  };
  document.addEventListener('voc-security-view-changed', shellViewSyncHandler);

  root.querySelectorAll('[data-sec-monitor-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncMonitorTabs(root, btn.dataset.secMonitorView);
      openScreen(feedToViewId(btn.dataset.secMonitorView));
    });
  });

  root.querySelectorAll('[data-sec-gate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.secGate;
      gateState = gateState.map((g) => (g.id === id ? { ...g, open: !g.open } : g));
      root.querySelector('.sec-room__gates').innerHTML = gatesHtml();
      const g = gateState.find((x) => x.id === id);
      setStatus(root, `Cổng ${id} · ${g.open ? 'Đã mở' : 'Đã khóa'}`);
    });
  });

  root.querySelectorAll('[data-sec-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const act = securityRoomData.actions.find((a) => a.id === btn.dataset.secAction);
      setStatus(root, `Đã gửi lệnh · ${act?.label || 'Thao tác'}`);
      btn.classList.add('sec-room__action--sent');
      setTimeout(() => btn.classList.remove('sec-room__action--sent'), 1200);
    });
  });
}

export function renderSecurityRoom(room) {
  const d = securityRoomData;
  const tabs = d.modeTabs.map((t, i) =>
    `<button type="button" class="sec-room__tab${i === activeMode ? ' sec-room__tab--active' : ''}" data-sec-mode="${i}">${t}</button>`,
  ).join('');

  return `<div class="voc-room voc-room--security" data-voc-room="${room.id}">
    <header class="voc-room__head voc-room__head--security">
      <div>
        <span class="voc-room__badge" style="--room-accent:${room.accent}">${room.badge}</span>
        <h2 class="voc-room__title">${room.label}</h2>
        <span class="sec-room__status">${statusMsg}</span>
      </div>
      <div class="sec-room__kpis">
        <span><i class="ti ti-camera"></i> ${d.status.camerasOnline}</span>
        <span><i class="ti ti-door"></i> ${d.status.gatesActive}</span>
        <span><i class="ti ti-flame"></i> ${d.status.hotZone}</span>
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
          <h3>Khóa cổng · ${gateState.filter((g) => g.open).length}/8 mở</h3>
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

function refreshAlerts(root) {
  const el = root.querySelector('[data-sec-alerts]');
  if (el) el.innerHTML = alertsHtml();
}

function refreshGates(root) {
  const el = root.querySelector('.sec-room__gates');
  if (!el) return;
  el.innerHTML = gatesHtml();
  const h = root.querySelector('.sec-room__block:nth-child(3) h3');
  if (h) h.textContent = `Khóa cổng · ${gateState.filter((g) => g.open).length}/8 mở`;
}

function setStatus(root, msg) {
  statusMsg = msg;
  const el = root.querySelector('.sec-room__status');
  if (el) el.textContent = msg;
}

export function bindSecurityRoom(root, { openScreen, onExitRoom }) {
  root.querySelector('[data-voc-exit-room]')?.addEventListener('click', onExitRoom);
  root.querySelectorAll('[data-voc-screen]').forEach((btn) => {
    btn.addEventListener('click', () => openScreen(btn.dataset.vocScreen));
  });

  root.querySelectorAll('[data-sec-gate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.secGate;
      gateState = gateState.map((g) => (g.id === id ? { ...g, open: !g.open } : g));
      refreshGates(root);
      const g = gateState.find((x) => x.id === id);
      setStatus(root, `Cổng ${id} · ${g.open ? 'Đã mở' : 'Đã khóa'}`);
    });
  });

  root.querySelectorAll('[data-sec-cam]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cam = securityRoomData.cameras.find((c) => c.id === btn.dataset.secCam);
      setStatus(root, `Live · ${cam?.label || 'Camera'}`);
      openScreen('security');
    });
  });

  root.querySelectorAll('[data-sec-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const act = securityRoomData.actions.find((a) => a.id === btn.dataset.secAction);
      setStatus(root, `Đã gửi lệnh · ${act?.label || 'Thao tác'}`);
      btn.classList.add('sec-room__action--sent');
      setTimeout(() => btn.classList.remove('sec-room__action--sent'), 1200);
    });
  });

  root.querySelectorAll('[data-sec-ack]').forEach((btn) => {
    btn.addEventListener('click', () => {
      alertState = alertState.map((a) => (a.id === btn.dataset.secAck ? { ...a, ack: true } : a));
      refreshAlerts(root);
      setStatus(root, 'Cảnh báo đã xác nhận · Tiếp tục giám sát');
    });
  });

  root.querySelectorAll('[data-sec-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeMode = Number(btn.dataset.secMode);
      root.querySelectorAll('.sec-room__tab').forEach((t) => t.classList.remove('sec-room__tab--active'));
      btn.classList.add('sec-room__tab--active');
      setStatus(root, securityRoomData.modeTabs[activeMode] + ' · Đang hoạt động');
    });
  });
}

export function resetSecurityRoomState() {
  gateState = securityRoomData.gates.map((g) => ({ ...g }));
  alertState = securityRoomData.alerts.map((a) => ({ ...a }));
  activeMode = 0;
  statusMsg = 'Sẵn sàng · Giám sát trực tiếp';
}
