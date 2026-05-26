import { hudHead, barChartSvg, ringSvg, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';
import { setRoofProgress, getRoofProgress } from '../scene/index.js';

let roofAnim = null;

function bindRoofControls(container) {
  container.querySelectorAll('[data-roof]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.roof;
      if (roofAnim) cancelAnimationFrame(roofAnim);
      const target = action === 'open' ? 1 : action === 'close' ? 0 : getRoofProgress();
      const start = getRoofProgress();
      const startTime = performance.now();
      const duration = action === 'stop' ? 0 : 12000;
      function tick(now) {
        if (action === 'stop') return;
        const t = Math.min(1, (now - startTime) / duration);
        setRoofProgress(start + (target - start) * t);
        const bar = container.querySelector('[data-roof-bar]');
        if (bar) bar.style.width = `${Math.round(getRoofProgress() * 100)}%`;
        if (t < 1) roofAnim = requestAnimationFrame(tick);
      }
      if (duration) requestAnimationFrame(tick);
    });
  });
}

export function renderFacilitiesLeft(d) {
  const groups = d.env.groups.map((g) =>
    `<div class="hud-pill hud-pill--${g.tone}"><span class="hud-pill__lbl">${g.label}</span><span class="hud-pill__val">${g.value}°C</span></div>`,
  ).join('');
  const feeds = d.systems.feeds.map((f) => camThumb(f.label)).join('');
  return `
    <section class="hud-block">${hudHead(d.env.title)}
      <div class="hud-metric-lbl">${d.env.totalLabel}</div>
      <div class="hud-metric-big">${d.env.total}°C</div>
      <div class="hud-pill-row">${groups}</div>
    </section>
    <section class="hud-block">${hudHead(d.systems.title)}<div class="hud-cam-grid">${feeds}</div></section>
    <div class="hud-tabs hud-tabs--dual">
      <button class="hud-tab hud-tab--active">${d.modeTabs[0]}</button>
      <button class="hud-tab">${d.modeTabs[1]}</button>
    </div>
    <section class="hud-block">${hudHead(d.roof.title)}
      <div class="hud-inline-stat"><i class="ti ti-building-arch"></i><span>${d.roof.label}</span><strong>${d.roof.value}</strong></div>
    </section>
    <section class="hud-block">${hudHead(d.loadBars.title)}
      <div class="hud-sub">${d.loadBars.subtitle}</div>${barChartSvg(d.loadBars.bars)}
    </section>`;
}

export function renderFacilitiesRight(d) {
  const bars = `
    <div class="hud-bar-item"><div class="hud-bar-head"><span>Tiến trình</span><strong data-roof-pct>0%</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" data-roof-bar style="width:0%"></div></div></div>
    <div class="hud-inline-stat"><i class="ti ti-building-arch"></i><span>Trạng thái</span><strong data-roof-status>Đã đóng</strong></div>`;
  const stats = d.infra.stats.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div>
    <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.change}</div></div>`,
  ).join('');
  const html = `
    <section class="hud-block">${hudHead('Cảnh báo hạ tầng')}${renderAlerts(d.alerts)}</section>
    <section class="hud-block hud-block--roof">${hudHead(d.roofCtrl.title)}
      <div class="hud-env-row">${ringSvg(100, 'Mái mở')}<div class="hud-env-bars">${bars}</div></div>
      <div class="hud-vent-row">
        <button class="hud-vent-btn" data-roof="open">Mở mái</button>
        <button class="hud-vent-btn" data-roof="close">Đóng mái</button>
        <button class="hud-vent-btn hud-vent-btn--danger" data-roof="stop">Dừng khẩn cấp</button>
      </div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.infra.title)}
      <div class="hud-energy-grid">${stats}</div>${areaChartSvg(d.infra.chart, 'facGrad')}
    </section>`;
  requestAnimationFrame(() => {
    const root = document.querySelector('#page-facilities [data-mount="sidebar-right"]');
    if (root) bindRoofControls(root);
  });
  return html;
}
