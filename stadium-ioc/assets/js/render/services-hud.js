import { hudHead, barChartSvg, ringSvg, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';

export function renderServicesLeft(d) {
  const groups = d.parking.groups.map((g) =>
    `<div class="hud-pill hud-pill--${g.tone}"><span class="hud-pill__lbl">${g.label}</span><span class="hud-pill__val">${g.value}%</span></div>`,
  ).join('');
  const feeds = d.services.feeds.map((f) => camThumb(f.label)).join('');
  return `
    <section class="hud-block">${hudHead(d.parking.title)}
      <div class="hud-metric-lbl">${d.parking.totalLabel}</div>
      <div class="hud-metric-big">${d.parking.total}%</div>
      <div class="hud-pill-row">${groups}</div>
    </section>
    <section class="hud-block">${hudHead(d.services.title)}<div class="hud-cam-grid">${feeds}</div></section>
    <div class="hud-tabs hud-tabs--dual">
      <button class="hud-tab hud-tab--active">${d.modeTabs[0]}</button>
      <button class="hud-tab">${d.modeTabs[1]}</button>
    </div>
    <section class="hud-block">${hudHead(d.tickets.title)}
      <div class="hud-inline-stat"><i class="ti ti-ticket"></i><span>${d.tickets.label}</span><strong>${d.tickets.value}</strong></div>
    </section>
    <section class="hud-block">${hudHead(d.queueBars.title)}
      <div class="hud-sub">${d.queueBars.subtitle}</div>${barChartSvg(d.queueBars.bars)}
    </section>`;
}

export function renderServicesRight(d) {
  const tabs = d.fb.tabs.map((t, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');
  const bars = d.fb.metrics.map((m) =>
    `<div class="hud-bar-item"><div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div></div>`,
  ).join('');
  const stats = d.revenue.stats.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div>
    <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '▲' : '▼'} ${s.change}</div></div>`,
  ).join('');
  return `
    <section class="hud-block">${hudHead('Dịch vụ & Phản hồi')}${renderAlerts(d.alerts)}</section>
    <section class="hud-block">${hudHead(d.fb.title)}<div class="hud-tabs">${tabs}</div>
      <div class="hud-env-row">${ringSvg(78, 'Bãi đỗ')}<div class="hud-env-bars">${bars}</div></div>
    </section>
    <section class="hud-block">${hudHead(d.traffic.title)}
      <div class="hud-device-status">Cảnh báo: <span class="hud-badge">${d.traffic.status}</span></div>
      <div class="hud-vent-row">${d.traffic.lanes.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('')}</div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.revenue.title)}
      <div class="hud-energy-grid">${stats}</div>${areaChartSvg(d.revenue.chart, 'svcGrad')}
    </section>`;
}
