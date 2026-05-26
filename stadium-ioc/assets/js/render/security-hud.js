import { hudHead, barChartSvg, ringSvg, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';

export function renderSecurityLeft(d) {
  const groups = d.crowd.groups.map((g) =>
    `<div class="hud-pill hud-pill--${g.tone}"><span class="hud-pill__lbl">${g.label}</span><span class="hud-pill__val">${g.value.toLocaleString('vi-VN')}</span></div>`,
  ).join('');
  const cams = d.cameras.feeds.map((f) => camThumb(f.label)).join('');
  return `
    <section class="hud-block">${hudHead(d.crowd.title)}
      <div class="hud-metric-lbl">${d.crowd.totalLabel}</div>
      <div class="hud-metric-big">${d.crowd.total.toLocaleString('vi-VN')}</div>
      <div class="hud-pill-row">${groups}</div>
    </section>
    <section class="hud-block">${hudHead(d.cameras.title)}<div class="hud-cam-grid">${cams}</div></section>
    <div class="hud-tabs hud-tabs--dual">
      <button class="hud-tab hud-tab--active">${d.modeTabs[0]}</button>
      <button class="hud-tab">${d.modeTabs[1]}</button>
    </div>
    <section class="hud-block">${hudHead(d.gates.title)}
      <div class="hud-inline-stat"><i class="ti ti-door"></i><span>${d.gates.label}</span><strong>${d.gates.value}</strong></div>
    </section>
    <section class="hud-block">${hudHead(d.densityBars.title)}
      <div class="hud-sub">${d.densityBars.subtitle}</div>${barChartSvg(d.densityBars.bars)}
    </section>`;
}

export function renderSecurityRight(d) {
  const tabs = d.access.tabs.map((t, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');
  const bars = d.access.metrics.map((m) =>
    `<div class="hud-bar-item"><div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div></div>`,
  ).join('');
  const zTabs = d.zones.tabs.map((t, i) =>
    `<button class="hud-tab hud-tab--sm${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');
  const stats = d.response.stats.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div>
    <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '▲' : '▼'} ${s.change}</div></div>`,
  ).join('');
  return `
    <section class="hud-block">${hudHead('Cảnh báo an ninh')}${renderAlerts(d.alerts)}</section>
    <section class="hud-block">${hudHead(d.access.title)}<div class="hud-tabs">${tabs}</div>
      <div class="hud-env-row">${ringSvg(98, 'Vé OK')}<div class="hud-env-bars">${bars}</div></div>
    </section>
    <section class="hud-block">${hudHead(d.zones.title)}<div class="hud-tabs hud-tabs--wrap">${zTabs}</div>
      <div class="hud-congestion-info">
        <div class="hud-device-row"><i class="ti ti-camera"></i><span>Camera <strong>${d.zones.quantity}</strong></span></div>
        <div class="hud-device-status">Vùng nóng: <span class="hud-badge">${d.zones.status}</span></div>
      </div>
      <div class="hud-vent-row">${d.zones.lanes.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('')}</div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.response.title)}
      <div class="hud-energy-grid">${stats}</div>${areaChartSvg(d.response.chart, 'secGrad')}
    </section>`;
}
