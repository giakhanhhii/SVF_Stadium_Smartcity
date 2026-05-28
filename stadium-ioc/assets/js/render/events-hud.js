import { hudHead, barChartSvg, ringSvg, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';
import {
  renderDispatchPanel, renderDispatchDialog, SECURITY_DISPATCH,
} from './emergency-dispatch.js';

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

export function renderEventsLeft(d) {
  const c = d.crowd;
  const sectors = c.sectors.map(sectorRow).join('');
  const feeds = d.broadcast.feeds.map((f) => camThumb(f.label)).join('');
  return `
    <section class="hud-block hud-block--crowd">
      ${hudHead(c.title)}
      <div class="hud-metric-lbl">${c.totalLabel}</div>
      <div class="hud-crowd-fill hud-crowd-fill--${c.fillTone}">
        <div class="hud-metric-big" style="color:${c.fillColor}">${c.fillPercent}%</div>
        <div class="hud-crowd-fill__status">${c.fillLabel}</div>
        <div class="hud-crowd-sector__track hud-crowd-sector__track--main">
          <div class="hud-crowd-sector__fill" style="width:${c.fillPercent}%"></div>
        </div>
      </div>
      <div class="hud-inline-stat"><i class="ti ti-users"></i><span>${c.capacityLabel}</span><strong>${c.totalFormatted}</strong></div>
      <div class="hud-crowd-sectors">${sectors}</div>
    </section>
    <section class="hud-block">${hudHead(d.broadcast.title)}<div class="hud-cam-grid">${feeds}</div></section>
    <div class="hud-tabs hud-tabs--dual">
      <button class="hud-tab hud-tab--active">${d.modeTabs[0]}</button>
      <button class="hud-tab">${d.modeTabs[1]}</button>
    </div>
    <section class="hud-block">${hudHead(d.attendance.title)}
      <div class="hud-inline-stat hud-inline-stat--${d.attendance.tone}">
        <i class="ti ti-users"></i><span>${d.attendance.label}</span><strong>${d.attendance.value}</strong>
      </div>
    </section>
    <section class="hud-block">${hudHead(d.entryBars.title)}
      <div class="hud-sub">${d.entryBars.subtitle}</div>${barChartSvg(d.entryBars.bars)}
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
      '<i class="ti ti-alert-triangle"></i> ' + stampede.zone + ' · ' + stampede.pct + '%',
      '<i class="ti ti-shield"></i> An ninh: 113 / VOC-21',
      '<i class="ti ti-door-exit"></i> Sơ tán: VOC-22 · PA khẩn',
    ],
  })}`;
}

export function renderEventsRight(d) {
  const tabs = d.pa.tabs.map((t, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');
  const bars = d.pa.metrics.map((m) =>
    `<div class="hud-bar-item"><div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div></div>`,
  ).join('');
  const stats = d.ops.stats.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div>
    <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '▲' : '▼'} ${s.change}</div></div>`,
  ).join('');
  return `
    <section class="hud-block">${hudHead('Cảnh báo vận hành')}${renderAlerts(d.alerts)}</section>
    ${stampedePanel(d.stampede)}
    <section class="hud-block">${hudHead(d.pa.title)}<div class="hud-tabs">${tabs}</div>
      <div class="hud-env-row">${ringSvg(100, 'PA ON')}<div class="hud-env-bars">${bars}</div></div>
    </section>
    <section class="hud-block">${hudHead(d.timeline.title)}
      <div class="hud-device-status">Mốc: <span class="hud-badge">${d.timeline.status}</span></div>
      <div class="hud-vent-row">${d.timeline.lanes.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('')}</div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.ops.title)}
      <div class="hud-energy-grid">${stats}</div>${areaChartSvg(d.ops.chart, 'evtGrad')}
    </section>
    ${d.stampede?.active ? renderDispatchDialog(SECURITY_DISPATCH) : ''}`;
}
