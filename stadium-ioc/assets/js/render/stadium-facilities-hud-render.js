import { hudHead, ringSvg, areaChartSvg } from './hud-charts.js';
import { setRoofProgress, getRoofProgress } from '../scene/stadium-scene-registry.js';

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

function thermalMap(groups = []) {
  const cells = [
    { label: 'A', tone: 'ok' },
    { label: 'B', tone: 'warn' },
    { label: 'VIP', tone: 'ok' },
    { label: 'F&B', tone: 'warn' },
    { label: 'Sân', tone: 'ok' },
    { label: 'LED', tone: 'ok' },
    { label: 'PA', tone: 'ok' },
    { label: 'UPS', tone: 'ok' },
  ];
  const codes = ['A', 'B', 'S'];
  const minis = groups.map((g, index) =>
    `<span class="fac-mini fac-mini--${g.tone}"><b>${g.value}°</b><em>${codes[index] || 'Z'}</em></span>`,
  ).join('');
  return `<div class="fac-thermal">
    <div class="fac-thermal__dial">${ringSvg(82, 'OK')}</div>
    <div class="fac-thermal__grid">${cells.map((c) =>
    `<i class="fac-thermal__cell fac-thermal__cell--${c.tone}">${c.label}</i>`,
  ).join('')}</div>
    <div class="fac-mini-grid">${minis}</div>
  </div>`;
}

function networkDiagram(feeds = []) {
  const icons = ['ti-air-conditioning', 'ti-air-conditioning', 'ti-bulb', 'ti-bolt', 'ti-elevator', 'ti-building-arch'];
  const codes = ['HA', 'HB', 'FL', 'UP', 'TM', 'RF'];
  const nodes = feeds.map((feed, index) => {
    const angle = (-90 + index * (360 / feeds.length)) * Math.PI / 180;
    const tone = index === 1 ? 'warn' : index === 5 ? 'roof' : 'ok';
    return {
      ...feed,
      code: codes[index] || `S${index + 1}`,
      icon: icons[index] || 'ti-cpu',
      tone,
      x: 50 + Math.cos(angle) * 36,
      y: 50 + Math.sin(angle) * 30,
    };
  });
  return `<div class="fac-network">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="fac-network__hub-glow" cx="50" cy="50" r="21"/>
      <circle class="fac-network__hub" cx="50" cy="50" r="8"/>
      ${nodes.map((n) =>
    `<line class="fac-network__line fac-network__line--${n.tone}" x1="50" y1="50" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}"/>`,
  ).join('')}
      ${nodes.map((n) =>
    `<circle class="fac-network__node fac-network__node--${n.tone}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5.6"/>`,
  ).join('')}
    </svg>
    <div class="fac-network__labels">${nodes.map((n) =>
    `<span class="fac-node-label fac-node-label--${n.tone}">
      <i class="ti ${n.icon}"></i><b>${n.code}</b><em></em>
    </span>`,
  ).join('')}</div>
  </div>`;
}

function loadMatrix(bars = []) {
  const cells = bars.map((bar) => {
    const active = Math.max(1, Math.round(bar.value / 2));
    return `<div class="fac-load__col">
      ${Array.from({ length: 5 }, (_, i) => {
    const on = i >= 5 - active;
    const tone = !on ? 'idle' : bar.value >= 9 ? 'hot' : bar.value >= 7 ? 'warn' : 'ok';
    return `<i class="fac-load-cell fac-load-cell--${tone}"></i>`;
  }).join('')}
      <span>${bar.time}</span>
    </div>`;
  }).join('');
  return `<div class="fac-load">${cells}</div>`;
}

function infraTrendActions() {
  const points = [46, 52, 58, 66, 62, 74, 69];
  const polyline = points.map((y, index) => `${8 + index * 15},${76 - y}`).join(' ');
  return `<div class="fac-trend-actions">
    <svg class="fac-trend-line" viewBox="0 0 100 56" aria-hidden="true">
      <g class="fac-trend-line__grid">
        <line x1="6" y1="12" x2="96" y2="12"/><line x1="6" y1="30" x2="96" y2="30"/><line x1="6" y1="48" x2="96" y2="48"/>
      </g>
      <polyline points="${polyline}"/>
      ${points.map((y, index) => `<circle cx="${8 + index * 15}" cy="${76 - y}" r="2.2"/>`).join('')}
    </svg>
    <div class="fac-action-row">
      <button type="button"><i class="ti ti-air-conditioning"></i><span>Tăng HVAC-B</span></button>
      <button type="button"><i class="ti ti-bolt"></i><span>Chuyển UPS</span></button>
      <button type="button"><i class="ti ti-bulb"></i><span>Giảm tải đèn</span></button>
    </div>
  </div>`;
}

function sensorBars() {
  const sensors = [
    { label: 'HVAC', value: 76, tone: 'cyan' },
    { label: 'UPS', value: 58, tone: 'blue' },
    { label: 'Đèn', value: 88, tone: 'cyan' },
    { label: 'Thang', value: 64, tone: 'blue' },
  ];
  return `<div class="fac-sensor-bars">
    <div class="fac-sensor-bars__labels">${sensors.map((s) => `<span>${s.label}</span>`).join('')}</div>
    <div class="fac-sensor-bars__chart">${sensors.map((s) =>
    `<div class="fac-sensor-bar fac-sensor-bar--${s.tone}">
      <i style="height:${s.value}%"></i><b>${s.value}%</b>
    </div>`,
  ).join('')}</div>
  </div>`;
}

function statusRail(alerts = []) {
  const icons = ['ti-air-conditioning', 'ti-building-arch', 'ti-tool'];
  const levels = [92, 100, 68];
  return `<div class="fac-status-rail">${alerts.map((alert, index) =>
    `<div class="fac-status fac-status--${index === 0 ? 'warn' : index === 1 ? 'info' : 'ok'}">
      <i class="ti ${icons[index] || 'ti-alert-triangle'}"></i>
      <strong>${index === 0 ? '92%' : index === 1 ? '100%' : 'OK'}</strong>
      <b><span style="width:${levels[index] || 72}%"></span></b>
      <span>${alert.time}</span>
    </div>`,
  ).join('')}</div>`;
}

function infraDiagram(stats = []) {
  const icons = ['ti-temperature', 'ti-bulb', 'ti-elevator', 'ti-building-arch'];
  const items = stats.map((item, index) => ({ ...item, icon: icons[index] || 'ti-cpu', tone: index === 2 ? 'warn' : 'ok' }));
  return `<div class="fac-infra-diagram">
    <div class="fac-infra-diagram__core"><i class="ti ti-building-factory-2"></i><strong>BMS</strong></div>
    <div class="fac-infra-diagram__items">${items.map((item) =>
    `<span class="fac-infra-item fac-infra-item--${item.tone}">
      <i class="ti ${item.icon}"></i><b>${item.value}</b>
    </span>`,
  ).join('')}</div>
  </div>`;
}

export function renderFacilitiesLeft(d) {
  return `
    <section class="hud-block">${hudHead(d.env.title)}${thermalMap(d.env.groups)}</section>
    <section class="hud-block">${hudHead('Tải hạ tầng 24h')}${infraTrendActions()}</section>
    <section class="hud-block">${hudHead(d.systems.title)}${networkDiagram(d.systems.feeds)}</section>
    <div class="hud-tabs hud-tabs--dual">
      <button class="hud-tab hud-tab--active">${d.modeTabs[0]}</button>
      <button class="hud-tab">${d.modeTabs[1]}</button>
    </div>
    <section class="hud-block">${hudHead(d.loadBars.title)}${loadMatrix(d.loadBars.bars)}</section>`;
}

export function renderFacilitiesRight(d) {
  const bars = `
    <div class="hud-bar-item"><div class="hud-bar-head"><span>Tiến trình</span><strong data-roof-pct>0%</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" data-roof-bar style="width:0%"></div></div></div>
    <div class="hud-inline-stat"><i class="ti ti-building-arch"></i><span>Trạng thái</span><strong data-roof-status>Đã đóng</strong></div>`;
  const html = `
    <section class="hud-block">${hudHead('Cảnh báo hạ tầng')}${statusRail(d.alerts)}</section>
    <section class="hud-block">${hudHead('Tải thiết bị BMS')}${sensorBars()}</section>
    <section class="hud-block hud-block--roof">${hudHead(d.roofCtrl.title)}
      <div class="hud-env-row">${ringSvg(100, 'Mái mở')}<div class="hud-env-bars">${bars}</div></div>
      <div class="hud-vent-row">
        <button class="hud-vent-btn" data-roof="open">Mở mái</button>
        <button class="hud-vent-btn" data-roof="close">Đóng mái</button>
        <button class="hud-vent-btn hud-vent-btn--danger" data-roof="stop">Dừng khẩn cấp</button>
      </div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.infra.title)}
      ${infraDiagram(d.infra.stats)}${areaChartSvg(d.infra.chart, 'facGrad')}
    </section>`;
  requestAnimationFrame(() => {
    const root = document.querySelector('#page-facilities [data-mount="sidebar-right"]');
    if (root) bindRoofControls(root);
  });
  return html;
}
