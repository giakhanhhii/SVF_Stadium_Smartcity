import { hudHead, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';
import { distributionChart, distributionMinis, distributionStack, radial3dChart } from './radial3d-chart.js';
import {
  renderDispatchPanel, renderDispatchDialog, MEDICAL_DISPATCH, SECURITY_DISPATCH,
} from './emergency-dispatch.js';

function eventRadarChart(values, labels) {
  const cx = 56;
  const cy = 52;
  const sides = labels.length;
  const point = (i, r) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  };
  const ring = (r) => labels.map((_, i) => point(i, r)).join(' ');
  const data = values.map((v, i) => point(i, 42 * v)).join(' ');
  return `<svg class="event-radar3d" viewBox="0 0 112 108" aria-hidden="true">
    <defs><linearGradient id="eventRadarFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7edfff" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#386dff" stop-opacity="0.58"/>
    </linearGradient></defs>
    <g class="event-radar3d__grid">
      <polygon points="${ring(16)}"/><polygon points="${ring(29)}"/><polygon points="${ring(42)}"/>
      ${labels.map((label, i) => {
    const [x, y] = point(i, 50).split(',');
    const [ax, ay] = point(i, 42).split(',');
    return `<line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}"/><text x="${x}" y="${y}">${label}</text>`;
  }).join('')}
    </g>
    <polygon class="event-radar3d__shadow" points="${data}"/>
    <polygon class="event-radar3d__shape" points="${data}"/>
  </svg>`;
}

function eventLineDonutCombo(bars, centerValue) {
  const max = Math.max(...bars.map((b) => b.value));
  const points = bars.map((b, i) => {
    const x = 8 + i * 12;
    const y = 52 - (b.value / max) * 38;
    return `${x},${y}`;
  }).join(' ');
  const pct = Math.max(0, Math.min(100, Number.parseInt(centerValue, 10) || 0));
  const groups = [
    { label: 'Vào', value: pct },
    { label: 'Còn lại', value: Math.max(100 - pct, 1) },
    { label: 'Dự phòng', value: 18 },
  ];
  const flowTotal = groups.reduce((sum, g) => sum + g.value, 0);
  return `<div class="overview-combo-wrap">
    <div class="overview-combo-row">
      <svg class="overview-combo event-combo" viewBox="0 0 88 72" aria-hidden="true">
        <g class="overview-combo__grid">
          ${[14, 24, 34, 44, 54].map((y) => `<line x1="4" y1="${y}" x2="82" y2="${y}"/>`).join('')}
          ${bars.map((b, i) => `<text x="${8 + i * 12}" y="68" text-anchor="middle">${b.time}</text>`).join('')}
        </g>
        <polyline class="overview-combo__line event-combo__line" points="${points}"/>
        ${bars.map((b, i) => {
    const x = 8 + i * 12;
    const y = 52 - (b.value / max) * 38;
    return `<circle class="overview-combo__dot event-combo__dot" cx="${x}" cy="${y}" r="1.8"/>`;
  }).join('')}
      </svg>
      ${distributionChart(flowTotal, groups, { idSuffix: 'EvtAttend' })}
    </div>
  </div>`;
}

function paGroups(view) {
  return [
    { label: view.ringLabel, value: view.ringPct },
    { label: 'Kênh A', value: view.metrics[0]?.pct || 0 },
    { label: 'Kênh B', value: view.metrics[1]?.pct || 0 },
    { label: 'Chờ', value: Math.max(100 - view.ringPct, 1) },
  ];
}

function renderPaStatus(items = []) {
  return `<div class="hud-pa-status">${items.map((item) =>
    `<div class="hud-pa-status__item">
      <i class="ti ${item.icon}"></i><span>${item.label}</span><strong>${item.value}</strong>
    </div>`,
  ).join('')}</div>`;
}

function paDistributionPanel(view, key) {
  const groups = paGroups(view);
  const total = groups.reduce((sum, g) => sum + g.value, 0);
  const groupTotal = total || 1;
  return `<div class="hud-pa-viz">
    <div class="hud-pa-viz__main">
      <div class="hud-pa-viz__top">
        ${radial3dChart(groups, { idSuffix: `EvtPa-${key}` })}
        <strong>${total.toLocaleString('vi-VN')}</strong>
      </div>
      <div class="hud-pa-viz__side">
        <div class="hud-env-bars">${renderMetricBars(view.metrics)}</div>
        ${renderPaStatus(view.status)}
      </div>
    </div>
    ${distributionStack(groups, groupTotal)}
    ${distributionMinis(groups)}
  </div>`;
}

function sectorRow(s) {
  return `<div class="hud-crowd-sector hud-crowd-sector--${s.tone}">
    <div class="hud-crowd-sector__track">
      <div class="hud-crowd-sector__fill" style="width:${s.pct}%"></div>
      <div class="hud-crowd-sector__content">
        <span class="hud-crowd-sector__lbl">${s.label}</span>
        <span class="hud-crowd-sector__pct">${s.pct}%</span>
      </div>
    </div>
  </div>`;
}

function renderAttendanceView(view) {
  return `
    <section class="hud-block">${hudHead(view.title)}
      <div class="hud-inline-stat hud-inline-stat--${view.tone}">
        <i class="ti ti-users"></i><span>${view.label}</span><strong>${view.value}</strong>
      </div>
    </section>
    <section class="hud-block">${hudHead(view.barsTitle)}
      ${eventLineDonutCombo(view.bars, view.value)}
    </section>`;
}

function evacuationRoutePanel() {
  return `<section class="hud-block event-route">
    ${hudHead('Lối thoát dẫm đạp')}
    <div class="event-route__diagram">
      <span class="event-route__node event-route__node--hot">B12</span>
      <span class="event-route__line event-route__line--a"></span>
      <span class="event-route__node event-route__node--exit">B2</span>
      <span class="event-route__line event-route__line--b"></span>
      <span class="event-route__node event-route__node--exit">C1</span>
    </div>
    <svg class="event-route-flow" viewBox="0 0 160 38" aria-hidden="true">
      <g class="event-route-flow__grid">
        ${[8, 16, 24, 32].map((y) => `<line x1="4" y1="${y}" x2="156" y2="${y}"/>`).join('')}
      </g>
      <polyline points="6,28 28,22 52,18 76,12 104,16 130,10 154,14"/>
      ${[6, 28, 52, 76, 104, 130, 154].map((x, i) => `<circle cx="${x}" cy="${[28, 22, 18, 12, 16, 10, 14][i]}" r="2"/>`).join('')}
    </svg>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn" data-dispatch-open="security" data-dispatch-type-preset="evac">
        <i class="ti ti-door-exit"></i><span>Mở B2/C1</span>
      </button>
      <button type="button" class="event-risk__btn">
        <i class="ti ti-arrow-guide"></i><span>Đảo luồng</span>
      </button>
      <button type="button" class="event-risk__btn">
        <i class="ti ti-speakerphone"></i><span>PA hướng dẫn</span>
      </button>
    </div>
  </section>`;
}

function fireSensorTrendPanel() {
  const bars = [
    { label: 'Nhiệt', value: 82 },
    { label: 'Khói', value: 64 },
    { label: 'Gas', value: 38 },
    { label: 'Điện', value: 52 },
  ];
  return `<section class="hud-block event-fire-trend">
    ${hudHead('Cảm biến cháy nổ')}
    <div class="event-fire-bars">${bars.map((b) =>
    `<div class="event-fire-bar event-fire-bar--${b.value > 70 ? 'hot' : b.value > 45 ? 'warn' : 'ok'}">
      <span>${b.label}</span><i style="height:${b.value}%"></i><b>${b.value}%</b>
    </div>`,
  ).join('')}</div>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn event-risk__btn--hot" data-dispatch-open="medical" data-dispatch-type-preset="fire">
        <i class="ti ti-flame"></i><span>Báo cháy</span>
      </button>
      <button type="button" class="event-risk__btn">
        <i class="ti ti-wind"></i><span>Hút khói</span>
      </button>
      <button type="button" class="event-risk__btn">
        <i class="ti ti-power"></i><span>Cắt điện</span>
      </button>
    </div>
  </section>`;
}

export function renderEventsLeft(d) {
  return `
    ${overloadPressurePanel(d.crowd)}
    ${evacuationRoutePanel()}
    ${fireSensorTrendPanel()}`;
}

function overloadPressurePanel(crowd) {
  const sectors = crowd.sectors.map((s, i) => ({
    label: s.label.replace('Khán đài ', '').replace('KhÃ¡n Ä‘Ã i ', ''),
    value: s.pct,
    tone: i === 1 ? 'hot' : s.pct >= 88 ? 'warn' : 'ok',
  }));
  return `<section class="hud-block event-overload">
    ${hudHead('Quá tải & dẫm đạp')}
    <div class="event-overload__main">
      ${eventRadarChart([0.86, 0.92, 0.74, 0.68, 0.81, 0.58], ['B12', 'DEN', 'FLOW', 'EXIT', 'PA', 'SEC'])}
      <div class="event-overload__meter">
        <strong>92%</strong>
        <span>điểm nóng B12</span>
      </div>
    </div>
    <div class="event-overload__lanes">${sectors.map((s) =>
    `<div class="event-overload__lane event-overload__lane--${s.tone}">
      <span>${s.label}</span><i style="width:${s.value}%"></i><b>${s.value}%</b>
    </div>`,
  ).join('')}</div>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn event-risk__btn--hot" data-dispatch-open="security" data-dispatch-type-preset="crowd">
        <i class="ti ti-shield-exclamation"></i><span>Báo an ninh</span>
      </button>
      <button type="button" class="event-risk__btn" data-dispatch-open="security" data-dispatch-type-preset="evac">
        <i class="ti ti-door-exit"></i><span>Mở lối thoát</span>
      </button>
      <button type="button" class="event-risk__btn">
        <i class="ti ti-arrows-split"></i><span>Chia luồng</span>
      </button>
    </div>
  </section>`;
}

function stampedePanel(stampede) {
  if (!stampede?.active) return '';
  return `${renderDispatchPanel({
    id: 'security',
    title: hudHead('Báo an ninh — Dẫm đạp'),
    buttonLabel: 'Báo an ninh & gửi báo cáo',
    buttonClass: 'hud-emergency__call--security',
    metaLines: [
      '<i class="ti ti-alert-triangle"></i> ' + stampede.zone + ' — ' + stampede.pct + '%',
      '<i class="ti ti-shield"></i> An ninh: 113 / VOC-21',
      '<i class="ti ti-door-exit"></i> Sơ tán: VOC-22 — PA khẩn',
    ],
  })}`;
}

function stampedeDetailPanel(stampede) {
  const cells = Array.from({ length: 24 }, (_, i) => {
    const hot = [6, 7, 11, 12, 13].includes(i);
    const warn = [2, 5, 8, 10, 14, 17, 18].includes(i);
    const exit = [0, 4, 19, 23].includes(i);
    const cls = exit ? 'exit' : hot ? 'hot' : warn ? 'warn' : 'ok';
    const label = exit ? 'EXIT' : hot ? 'B12' : warn ? 'DENSE' : '';
    return `<span class="event-risk-cell event-risk-cell--${cls}">${label}</span>`;
  }).join('');
  return `<section class="hud-block event-risk event-risk--stampede">
    ${hudHead('Dẫm đạp / quá tải')}
    <div class="event-risk__radar">${eventRadarChart([0.92, 0.78, 0.64, 0.86, 0.58, 0.72], ['DEN', 'GATE', 'FLOW', 'B12', 'PA', 'EXIT'])}</div>
    <div class="event-risk__map">
      <div class="event-risk__pitch">SÂN</div>
      <div class="event-risk__grid">${cells}</div>
    </div>
    <div class="event-risk__kpis">
      <span><b>${stampede?.pct || 0}%</b><em>Mật độ B12</em></span>
      <span><b>02</b><em>Cổng phụ mở</em></span>
      <span><b>04'</b><em>ETA sơ tán</em></span>
    </div>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn event-risk__btn--hot" data-dispatch-open="security" data-dispatch-type-preset="crowd">
        <i class="ti ti-shield-exclamation"></i><span>Báo an ninh</span>
      </button>
      <button type="button" class="event-risk__btn" data-dispatch-open="security" data-dispatch-type-preset="evac">
        <i class="ti ti-door-exit"></i><span>Mở lối thoát</span>
      </button>
      <button type="button" class="event-risk__btn">
        <i class="ti ti-volume"></i><span>PA phân luồng</span>
      </button>
    </div>
  </section>`;
}

function fireRiskPanel() {
  const sensors = [
    { label: 'F&B Bếp B', temp: '68°C', smoke: '42%', tone: 'hot' },
    { label: 'Kho LED', temp: '41°C', smoke: '18%', tone: 'warn' },
    { label: 'Máy phát', temp: '54°C', smoke: '25%', tone: 'warn' },
    { label: 'VIP pantry', temp: '31°C', smoke: '4%', tone: 'ok' },
  ];
  const cells = Array.from({ length: 20 }, (_, i) => {
    const hot = [6, 7, 11].includes(i);
    const warn = [2, 5, 10, 12, 16].includes(i);
    const cls = hot ? 'hot' : warn ? 'warn' : 'ok';
    return `<span class="event-fire-cell event-fire-cell--${cls}"></span>`;
  }).join('');
  const fireGroups = [
    { label: 'Nhiệt', value: 68 },
    { label: 'Khói', value: 42 },
    { label: 'Gas', value: 18 },
    { label: 'Điện', value: 54 },
  ];
  return `<section class="hud-block event-risk event-risk--fire">
    ${hudHead('Nguy cơ cháy nổ')}
    <div class="event-fire-layout">
      <div class="event-fire-radial">
        ${radial3dChart(fireGroups, { idSuffix: 'EvtFireRisk' })}
        <strong>F&B B</strong>
      </div>
      <div class="event-fire-core">
        <i class="ti ti-flame"></i>
        <strong>F&B B</strong>
        <span>khói + nhiệt tăng</span>
      </div>
      <div class="event-fire-matrix">${cells}</div>
    </div>
    <div class="event-fire-sensors">${sensors.map((s) =>
    `<div class="event-fire-sensor event-fire-sensor--${s.tone}">
      <span>${s.label}</span><b>${s.temp}</b><em>${s.smoke}</em>
    </div>`,
  ).join('')}</div>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn event-risk__btn--hot" data-dispatch-open="medical" data-dispatch-type-preset="fire">
        <i class="ti ti-flame"></i><span>Gọi cứu hỏa</span>
      </button>
      <button type="button" class="event-risk__btn">
        <i class="ti ti-power"></i><span>Cắt điện khu B</span>
      </button>
      <button type="button" class="event-risk__btn">
        <i class="ti ti-wind"></i><span>Mở hút khói</span>
      </button>
    </div>
  </section>`;
}

function renderMetricBars(metrics) {
  return metrics.map((m) =>
    `<div class="hud-bar-item"><div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div></div>`,
  ).join('');
}

function renderPaPanel(d, key) {
  const view = d.pa.views[key] || d.pa.views.pa;
  const tabs = d.pa.tabs.map((t, i) => {
    const value = i === 0 ? 'pa' : 'led';
    return `<button class="hud-tab${value === key ? ' hud-tab--active' : ''}" data-events-pa="${value}" aria-pressed="${value === key}">${t}</button>`;
  }).join('');
  return `${hudHead(d.pa.title)}<div class="hud-tabs" data-events-pa-tabs>${tabs}</div>
    ${paDistributionPanel(view, key)}`;
}

export function renderEventsRight(d) {
  return `
    ${stampedeDetailPanel(d.stampede)}
    ${fireRiskPanel()}
    ${renderDispatchDialog(SECURITY_DISPATCH)}
    ${renderDispatchDialog(MEDICAL_DISPATCH)}`;

  const stats = d.ops.stats.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div>
    <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '+' : '-'} ${s.change}</div></div>`,
  ).join('');
  return `
    <section class="hud-block">${hudHead('Cảnh báo vận hành')}
      ${eventRadarChart([0.92, 0.76, 0.58, 0.84, 0.68, 0.48], ['DEN', 'PA', 'LED', 'F&B', 'SEC', 'VIP'])}
      ${renderAlerts(d.alerts)}
    </section>
    ${stampedePanel(d.stampede)}
    <section class="hud-block" data-events-pa-panel>${renderPaPanel(d, 'pa')}</section>
    <section class="hud-block">${hudHead(d.timeline.title)}
      <div class="hud-device-status">Mốc: <span class="hud-badge">${d.timeline.status}</span></div>
      <div class="hud-vent-row">${d.timeline.lanes.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('')}</div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.ops.title)}
      <div class="hud-energy-grid">${stats}</div>${areaChartSvg(d.ops.chart, 'evtGrad')}
    </section>
    ${d.stampede?.active ? renderDispatchDialog(SECURITY_DISPATCH) : ''}`;
}

export function bindEventsHudTabs(root, data) {
  root.querySelector('[data-events-attendance-tabs]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-events-attendance]');
    if (!tab) return;
    const panel = root.querySelector('[data-events-attendance-panel]');
    const view = data.left.attendanceViews[tab.dataset.eventsAttendance];
    if (panel && view) panel.innerHTML = renderAttendanceView(view);
  });

  root.querySelector('[data-events-pa-panel]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-events-pa]');
    if (!tab) return;
    const panel = root.querySelector('[data-events-pa-panel]');
    if (panel) panel.innerHTML = renderPaPanel(data.right, tab.dataset.eventsPa);
  });
}
