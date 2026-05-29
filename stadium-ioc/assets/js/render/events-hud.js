import { hudHead, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';
import { distributionChart, distributionMinis, distributionStack, radial3dChart } from './radial3d-chart.js';
import {
  renderDispatchPanel, renderDispatchDialog, SECURITY_DISPATCH,
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
          ${bars.map((b, i) => `<text x="${8 + i * 12}" y="68" transform="rotate(-36 ${8 + i * 12} 68)">${b.time}</text>`).join('')}
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

export function renderEventsLeft(d) {
  const c = d.crowd;
  const sectors = c.sectors.map(sectorRow).join('');
  const feeds = d.broadcast.feeds.map((f) => camThumb(f.label)).join('');
  const liveView = d.attendanceViews.live;
  return `
    <section class="hud-block hud-block--crowd">
      ${hudHead(c.title)}
      ${distributionChart(c.total, c.groups, { idSuffix: 'EvtCrowd' })}
      <div class="hud-inline-stat"><i class="ti ti-users"></i><span>${c.capacityLabel}</span><strong>${c.totalFormatted}</strong></div>
      <div class="hud-crowd-sectors">${sectors}</div>
    </section>
    <section class="hud-block">${hudHead(d.broadcast.title)}<div class="hud-cam-grid">${feeds}</div></section>
    <div class="hud-tabs hud-tabs--dual" data-events-attendance-tabs>
      <button class="hud-tab hud-tab--active" data-events-attendance="live">${d.modeTabs[0]}</button>
      <button class="hud-tab" data-events-attendance="stands">${d.modeTabs[1]}</button>
    </div>
    <div data-events-attendance-panel>${renderAttendanceView(liveView)}</div>`;
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
