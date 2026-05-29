import { hudHead, barChartSvg, ringSvg, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';
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

function eventPieLegend(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const colors = ['#00d4ff', '#3c8cff', '#7bdcff', '#176f9d'];
  const polar = (r, deg) => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: 56 + Math.cos(rad) * r, y: 56 + Math.sin(rad) * r };
  };
  const sector = (start, end, innerR, outerR) => {
    const a = polar(outerR, start);
    const b = polar(outerR, end);
    const c = polar(innerR, end);
    const d = polar(innerR, start);
    const large = end - start > 180 ? 1 : 0;
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${outerR} ${outerR} 0 ${large} 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)} L ${c.x.toFixed(1)} ${c.y.toFixed(1)} A ${innerR} ${innerR} 0 ${large} 0 ${d.x.toFixed(1)} ${d.y.toFixed(1)} Z`;
  };
  let angle = -18;
  const slices = items.map((item, i) => {
    const sweep = Math.max(26, (item.value / total) * 318);
    const start = angle + 3;
    const end = angle + sweep - 3;
    angle = end;
    const pin = polar(41, start + sweep / 2);
    return `<path class="event-radial-gauge__slice" d="${sector(start, end, 16, 43)}" fill="${colors[i]}" opacity="${0.96 - i * 0.12}"/>
      <circle cx="${pin.x.toFixed(1)}" cy="${pin.y.toFixed(1)}" r="2" fill="#bdf7ff" opacity="0.75"/>`;
  }).join('');
  const legend = items.map((item, i) =>
    `<span style="--legend-pct:${Math.round((item.value / total) * 100)}%;--legend-color:${colors[i]}">
      <i></i><b>${item.label}</b><small></small><em>${Math.round((item.value / total) * 100)}%</em>
    </span>`,
  ).join('');
  const mainValue = Math.round((items[0]?.value || 0) / total * 100);
  return `<div class="event-pie3d-card event-radial-card">
    <div class="event-radial-card__top">
      <svg class="event-radial-gauge" viewBox="0 0 112 112" aria-hidden="true">
        <circle cx="56" cy="56" r="44" fill="rgba(0,212,255,0.08)"/>
        ${slices}
        <circle cx="56" cy="56" r="15" fill="#092064" stroke="#00d4ff" stroke-width="3"/>
        <circle cx="56" cy="56" r="7" fill="#173cff"/>
      </svg>
      <strong>${mainValue}%</strong>
    </div>
    <div class="event-radial-card__track">${items.map((item, i) =>
    `<span style="width:${Math.round((item.value / total) * 100)}%;background:${colors[i]}"></span>`,
  ).join('')}</div>
    <div class="event-pie3d-card__legend">${legend}</div>
  </div>`;
}

function eventLineDonutCombo(bars, centerValue) {
  const max = Math.max(...bars.map((b) => b.value));
  const points = bars.map((b, i) => {
    const x = 8 + i * 12;
    const y = 52 - (b.value / max) * 38;
    return `${x},${y}`;
  }).join(' ');
  const pct = Math.max(0, Math.min(100, Number.parseInt(centerValue, 10) || 0));
  const items = [pct, Math.max(100 - pct, 1), 18];
  const colors = ['#00d4ff', '#3c8cff', '#7bdcff'];
  let angle = -40;
  const polar = (r, deg, cx = 128, cy = 34) => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
  };
  const sector = (start, end, r, cx = 128, cy = 34) => {
    const a = polar(r, start, cx, cy);
    const b = polar(r, end, cx, cy);
    const large = end - start > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)} Z`;
  };
  const total = items.reduce((sum, value) => sum + value, 0);
  const donut = items.map((value, i) => {
    const sweep = (value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return `<path class="event-combo__slice" d="${sector(start, end, 24)}" fill="${colors[i]}" opacity="${0.95 - i * 0.12}"/>`;
  }).join('');
  return `<svg class="event-combo" viewBox="0 0 176 72" aria-hidden="true">
    <g class="event-combo__grid">
      ${[14, 24, 34, 44, 54].map((y) => `<line x1="4" y1="${y}" x2="82" y2="${y}"/>`).join('')}
      ${bars.map((b, i) => `<text x="${8 + i * 12}" y="68" transform="rotate(-36 ${8 + i * 12} 68)">${b.time}</text>`).join('')}
    </g>
    <polyline class="event-combo__line" points="${points}"/>
    ${bars.map((b, i) => {
    const x = 8 + i * 12;
    const y = 52 - (b.value / max) * 38;
    return `<circle class="event-combo__dot" cx="${x}" cy="${y}" r="1.8"/>`;
  }).join('')}
    <circle cx="128" cy="34" r="25" fill="rgba(0,212,255,0.1)"/>
    ${donut}
    <text x="128" y="36" class="event-combo__num">${pct}%</text>
  </svg>`;
}

function crowdPieItems(sectors) {
  const vals = sectors.slice(0, 4).map((sector) => sector?.pct || 0);
  const min = Math.min(...vals);
  return vals.map((value, i) => ({
    label: String.fromCharCode(65 + i),
    value: Math.max(8, Math.round((value - min + 10) ** 1.35)),
  }));
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
      ${eventPieLegend(crowdPieItems(c.sectors))}
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
    title: hudHead('Bao an ninh - Dam dap'),
    buttonLabel: 'Bao an ninh & gui bao cao',
    buttonClass: 'hud-emergency__call--security',
    metaLines: [
      '<i class="ti ti-alert-triangle"></i> ' + stampede.zone + ' - ' + stampede.pct + '%',
      '<i class="ti ti-shield"></i> An ninh: 113 / VOC-21',
      '<i class="ti ti-door-exit"></i> So tan: VOC-22 - PA khan',
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
  const bars = renderMetricBars(view.metrics);
  return `${hudHead(d.pa.title)}<div class="hud-tabs" data-events-pa-tabs>${tabs}</div>
    <div class="hud-env-row">${eventPieLegend([
    { label: view.ringLabel, value: view.ringPct },
    { label: 'A', value: view.metrics[0]?.pct || 0 },
    { label: 'B', value: view.metrics[1]?.pct || 0 },
    { label: 'C', value: Math.max(100 - view.ringPct, 1) },
  ])}<div class="hud-env-bars">${bars}</div></div>`;
}

export function renderEventsRight(d) {
  const stats = d.ops.stats.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div>
    <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '+' : '-'} ${s.change}</div></div>`,
  ).join('');
  return `
    <section class="hud-block">${hudHead('Canh bao van hanh')}
      ${eventRadarChart([0.92, 0.76, 0.58, 0.84, 0.68, 0.48], ['DEN', 'PA', 'LED', 'F&B', 'SEC', 'VIP'])}
      ${renderAlerts(d.alerts)}
    </section>
    ${stampedePanel(d.stampede)}
    <section class="hud-block" data-events-pa-panel>${renderPaPanel(d, 'pa')}</section>
    <section class="hud-block">${hudHead(d.timeline.title)}
      <div class="hud-device-status">Moc: <span class="hud-badge">${d.timeline.status}</span></div>
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
