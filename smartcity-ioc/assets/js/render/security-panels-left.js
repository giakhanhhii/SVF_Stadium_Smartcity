import { SMARTCITY_DEVICE_PRESETS } from './security-panels-right.js';

function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function piePoint(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return `${(cx + Math.cos(rad) * r).toFixed(1)} ${(cy + Math.sin(rad) * r).toFixed(1)}`;
}

function piePath(cx, cy, r, start, end) {
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${piePoint(cx, cy, r, start)} A ${r} ${r} 0 ${large} 1 ${piePoint(cx, cy, r, end)} Z`;
}

function residentPie3d(items) {
  let angle = -22;
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const slices = items.map((item) => {
    const span = item.value / total * 360;
    const path = piePath(58, 58, 46, angle, angle + span - 3);
    const mid = angle + span / 2;
    const dot = piePoint(58, 58, 34, mid).split(' ');
    const pin = piePoint(58, 58, 58, mid).split(' ');
    angle += span;
    return { ...item, path, dot, pin };
  });
  return `<div class="traffic-viz-pie resident-viz-pie">
    <svg viewBox="0 0 122 122" aria-hidden="true">
      <ellipse class="traffic-viz-pie__shadow" cx="58" cy="66" rx="45" ry="35"/>
      ${slices.map((s) => `<path class="traffic-viz-pie__slice" d="${s.path}" fill="${s.color}"/>`).join('')}
      ${slices.map((s) => `<line class="traffic-viz-pie__pin" x1="${s.dot[0]}" y1="${s.dot[1]}" x2="${s.pin[0]}" y2="${s.pin[1]}"/>
        <circle class="traffic-viz-pie__dot" cx="${s.pin[0]}" cy="${s.pin[1]}" r="2.2"/>
        <circle class="traffic-viz-pie__dot traffic-viz-pie__dot--inner" cx="${s.dot[0]}" cy="${s.dot[1]}" r="1.8"/>`).join('')}
      <circle class="traffic-viz-pie__core" cx="58" cy="58" r="18"/>
      <circle class="traffic-viz-pie__core-light" cx="58" cy="58" r="9"/>
    </svg>
    <div class="traffic-viz-legend">
      ${items.map((item) => `<span><i style="background:${item.color}"></i><b>${item.label}</b><em>${item.pct}%</em></span>`).join('')}
    </div>
  </div>`;
}

function lineTrendSvg(bars, className = 'security-mini-line') {
  const max = Math.max(...bars.map((b) => b.value));
  const w = 168;
  const h = 58;
  const step = w / (bars.length - 1);
  const pts = bars.map((b, i) => `${Math.round(i * step)},${Math.round(h - (b.value / max) * (h - 10) - 5)}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  const labelX = (i) => Math.min(w - 12, Math.max(12, Math.round(i * step)));
  return `<svg viewBox="0 0 ${w} ${h + 16}" class="${className}" aria-hidden="true">
    <polygon points="${area}"/>
    <polyline points="${pts}"/>
    ${bars.map((b, i) => `<circle cx="${Math.round(i * step)}" cy="${Math.round(h - (b.value / max) * (h - 10) - 5)}" r="2.4"/>`).join('')}
    ${bars.map((b, i) => i === 0 || i === bars.length - 1 || i % 2 === 0
    ? `<text x="${labelX(i)}" y="${h + 12}">${b.time}</text>`
    : '').join('')}
  </svg>`;
}

function blacklistBars(values) {
  const max = Math.max(...values.map((item) => item.value), 1);
  return `<div class="security-blacklist-chart">
    <div class="security-blacklist-bars" aria-hidden="true">
      ${values.map((item, index) => {
        const height = 42 + (item.value / max) * 58;
        return `<span class="security-blacklist-bar security-blacklist-bar--${index % 2 ? 'blue' : 'cyan'}" title="${item.label}: ${item.value}" style="height:${height.toFixed(0)}%"></span>`;
      }).join('')}
    </div>
    <div class="security-blacklist-labels">
      ${values.map((item) => `<span><b>${item.value}</b><em>${item.label}</em></span>`).join('')}
    </div>
  </div>`;
}

function routeDiagram(items) {
  return `<div class="security-route-diagram">
    ${items.map((item, index) => `
      <span class="security-route-node security-route-node--${item.tone}">
        <b>${item.label}</b><em>${item.value}</em>
      </span>
      ${index < items.length - 1 ? '<i class="security-route-line"></i>' : ''}
    `).join('')}
  </div>`;
}

const SECURITY_MODE_PANEL_CONFIG = {
  standby: {
    title: 'Trực ban 24h',
    icon: 'ti-shield-check',
    total: '08',
    totalLabel: 'Ca đang trực',
    metrics: [
      { label: 'Ca đủ quân số', value: '06' },
      { label: 'Patrol online', value: '03' },
      { label: 'Checkin đúng giờ', value: '98%' },
    ],
    trend: [
      { time: '16h', value: 4 },
      { time: '18h', value: 5 },
      { time: '20h', value: 6 },
      { time: '22h', value: 7 },
      { time: 'Hiện', value: 8 },
    ],
  },
  incident: {
    title: 'Sự cố 24h',
    icon: 'ti-bell-ringing',
    total: '05',
    totalLabel: 'Case cần xử lý',
    metrics: [
      { label: 'Mức cao', value: '01' },
      { label: 'Đang theo dõi', value: '02' },
      { label: 'Đóng trong 30p', value: '92%' },
    ],
    trend: [
      { time: '16h', value: 1 },
      { time: '18h', value: 2 },
      { time: '20h', value: 3 },
      { time: '22h', value: 4 },
      { time: 'Hiện', value: 5 },
    ],
  },
};

function modeMetricGrid(metrics) {
  return `<div class="security-mode-metrics">
    ${metrics.map((metric) => `<div class="security-mode-metric">
      <span>${metric.label}</span>
      <strong>${metric.value}</strong>
    </div>`).join('')}
  </div>`;
}

function modePanel(panel, isActive) {
  return `<div class="security-mode-panel" data-security-mode-panel="${panel.key}"${isActive ? '' : ' hidden'}>
    <div class="security-mode-summary">
      <div class="hud-risk-gauge">
        <i class="ti ${panel.icon}"></i>
        <strong>${panel.total}</strong>
        <span>${panel.totalLabel}</span>
      </div>
      ${modeMetricGrid(panel.metrics)}
    </div>
    ${lineTrendSvg(panel.trend, 'security-soft-line')}
  </div>`;
}

function renderModePanels() {
  return Object.entries(SECURITY_MODE_PANEL_CONFIG).map(([key, panel]) =>
    modePanel({ ...panel, key }, key === 'standby')).join('');
}

function devicePanel(activeKey = 'camera') {
  const device = SMARTCITY_DEVICE_PRESETS[activeKey] || SMARTCITY_DEVICE_PRESETS.camera;
  const cells = device.tones.map((tone, index) =>
    `<button type="button" class="hud-matrix-cell hud-matrix-cell--${tone}" data-smartcity-device-cell="${index + 1}" aria-label="${device.label} điểm ${index + 1}"></button>`,
  ).join('');
  return `<div class="hud-device-chart" data-smartcity-device-panel data-device-mode="${activeKey}">
    <div class="hud-device-total"><i class="ti ${device.icon}"></i><strong data-smartcity-device-total>${device.quantity}</strong><span data-smartcity-device-status>${device.status}</span></div>
    <p class="hud-device-summary" data-smartcity-device-summary>${device.summary}</p>
    <div class="hud-matrix" data-smartcity-device-matrix>${cells}</div>
    <div class="hud-vent-row hud-device-zones" data-smartcity-device-zones>
      ${device.zones.map((zone) => `<button class="hud-vent-btn" data-smartcity-device-zone="${zone.key}"><b>${zone.key}</b><span>${zone.note}</span></button>`).join('')}
    </div>
  </div>`;
}

function smartcityDeviceModal() {
  return `<div class="smartcity-device-modal" data-smartcity-device-modal hidden>
    <div class="smartcity-device-modal__panel" role="dialog" aria-modal="true" aria-label="Điều khiển thiết bị">
      <button type="button" class="smartcity-modal__close" data-smartcity-device-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-modal__head">
        <span class="smartcity-modal__icon"><i class="ti ti-device-desktop-analytics" data-smartcity-device-modal-icon></i></span>
        <div><small data-smartcity-device-modal-tag>DEVICE CONTROL</small><h3 data-smartcity-device-modal-title>Thiết bị khu A1</h3></div>
      </div>
      <p class="smartcity-device-modal__summary" data-smartcity-device-modal-summary>Đang tải trạng thái thiết bị.</p>
      <div class="smartcity-device-modal__grid" data-smartcity-device-modal-stats></div>
      <div class="smartcity-modal__steps" data-smartcity-device-modal-actions>
        <button type="button" data-smartcity-device-modal-action="focus"><b>01</b>Tập trung sơ đồ</button>
        <button type="button" data-smartcity-device-modal-action="check"><b>02</b>Kiểm tra trạng thái</button>
        <button type="button" data-smartcity-device-modal-action="dispatch"><b>03</b>Gửi đội trực</button>
      </div>
      <div class="smartcity-modal__status"><i class="ti ti-activity"></i><span data-smartcity-device-modal-status>Chọn thao tác để cập nhật sơ đồ thiết bị.</span></div>
    </div>
  </div>`;
}

export function renderLeftSidebar(d) {
  return `
    <section class="hud-block">${hudHead(d.personnel.title)}
      ${residentPie3d(d.personnel.groups)}
    </section>
    <section class="hud-block">${hudHead(d.cameras.title)}
      ${routeDiagram(d.cameras.feeds)}
      <div class="hud-tabs hud-tabs--dual security-mode-tabs" data-security-mode-tabs>
        <button class="hud-tab hud-tab--active" data-security-mode="standby">${d.modeTabs[0]}</button>
        <button class="hud-tab" data-security-mode="incident">${d.modeTabs[1]}</button>
      </div>
      ${renderModePanels()}
    </section>
    <section class="hud-block hud-block--devices">${hudHead(d.devices.title)}
      <div class="hud-tabs hud-tabs--wrap" data-smartcity-device-tabs>
        ${Object.entries(SMARTCITY_DEVICE_PRESETS).map(([key, item], i) =>
          `<button class="hud-tab hud-tab--sm${i === 0 ? ' hud-tab--active' : ''}" data-smartcity-device-tab="${key}">${item.label}</button>`,
        ).join('')}
      </div>
      ${devicePanel('camera')}
    </section>
    ${smartcityDeviceModal()}
    <section class="hud-block">${hudHead(d.blacklist.title)}
      <div class="hud-risk-gauge">
        <i class="ti ti-user-minus"></i>
        <strong>${d.blacklist.value}</strong>
        <span>đối tượng trong danh sách chặn</span>
      </div>
      ${blacklistBars([
        { label: 'VIP', value: 26 },
        { label: 'Cấm vào', value: 20 },
        { label: 'Theo dõi', value: 12 },
        { label: 'Tái cảnh báo', value: 17 },
      ])}
    </section>`;
}

let securityModeTabsBound = false;

export function bindSecurityModeTabs(root = document) {
  const updateModePanel = (scope, mode) => {
    scope.querySelectorAll('[data-security-mode-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.securityModePanel !== mode;
    });
  };

  root.querySelectorAll('[data-security-mode-tabs]').forEach((tabsRoot) => {
    const activeTab = tabsRoot.querySelector('.hud-tab--active[data-security-mode]') || tabsRoot.querySelector('[data-security-mode]');
    if (activeTab?.dataset.securityMode) updateModePanel(root, activeTab.dataset.securityMode);
  });

  if (securityModeTabsBound) return;
  securityModeTabsBound = true;

  root.addEventListener('click', (event) => {
    const tab = event.target.closest?.('[data-security-mode]');
    if (!tab || !root.contains(tab)) return;
    updateModePanel(root, tab.dataset.securityMode);
  });
}
