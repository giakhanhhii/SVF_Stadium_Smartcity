import { hudHead, barChartSvg, ringSvg, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';

export function renderEventsLeft(d) {
  const groups = d.match.groups.map((g) =>
    `<div class="hud-pill hud-pill--${g.tone}"><span class="hud-pill__lbl">${g.label}</span><span class="hud-pill__val">${g.value}</span></div>`,
  ).join('');
  const feeds = d.broadcast.feeds.map((f) => camThumb(f.label)).join('');
  return `
    <section class="hud-block">${hudHead(d.match.title)}
      <div class="hud-metric-lbl">${d.match.totalLabel}</div>
      <div class="hud-metric-big">${d.match.total}'</div>
      <div class="hud-pill-row">${groups}</div>
    </section>
    <section class="hud-block">${hudHead(d.broadcast.title)}<div class="hud-cam-grid">${feeds}</div></section>
    <div class="hud-tabs hud-tabs--dual">
      <button class="hud-tab hud-tab--active">${d.modeTabs[0]}</button>
      <button class="hud-tab">${d.modeTabs[1]}</button>
    </div>
    <section class="hud-block">${hudHead(d.attendance.title)}
      <div class="hud-inline-stat"><i class="ti ti-users"></i><span>${d.attendance.label}</span><strong>${d.attendance.value}</strong></div>
    </section>
    <section class="hud-block">${hudHead(d.entryBars.title)}
      <div class="hud-sub">${d.entryBars.subtitle}</div>${barChartSvg(d.entryBars.bars)}
    </section>`;
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
    <section class="hud-block">${hudHead('Sự kiện gần đây')}${renderAlerts(d.alerts)}</section>
    <section class="hud-block">${hudHead(d.pa.title)}<div class="hud-tabs">${tabs}</div>
      <div class="hud-env-row">${ringSvg(100, 'PA ON')}<div class="hud-env-bars">${bars}</div></div>
    </section>
    <section class="hud-block">${hudHead(d.timeline.title)}
      <div class="hud-device-status">Mốc: <span class="hud-badge">${d.timeline.status}</span></div>
      <div class="hud-vent-row">${d.timeline.lanes.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('')}</div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.ops.title)}
      <div class="hud-energy-grid">${stats}</div>${areaChartSvg(d.ops.chart, 'evtGrad')}
    </section>`;
}
