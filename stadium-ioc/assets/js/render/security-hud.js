import { hudHead, areaChartSvg } from './hud-charts.js';
import { distributionChart } from './radial3d-chart.js';

function aquaBarChart(bars) {
  const max = Math.max(...bars.map((b) => b.value));
  const cols = bars.map((b, i) => {
    const h = (b.value / max) * 38;
    const opacity = 0.42 + i * 0.08;
    return `<rect x="${4 + i * 18}" y="${42 - h}" width="12" height="${h}" fill="#00d4ff" opacity="${Math.min(opacity, 0.95)}" rx="2"/>`;
  }).join('');
  const labels = bars.map((b, i) =>
    `<text x="${10 + i * 18}" y="50" fill="#7ab0d0" font-size="5" text-anchor="middle">${b.time}</text>`,
  ).join('');
  return `<svg viewBox="0 0 112 54" class="hud-chart stad-sec-line-chart">${cols}${labels}</svg>`;
}

function aquaDonut(pct, label) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return `<svg viewBox="0 0 56 56" class="stad-sec-donut">
    <circle cx="28" cy="28" r="${r}" fill="none" stroke="rgba(0,212,255,0.14)" stroke-width="7"/>
    <circle cx="28" cy="28" r="${r}" fill="none" stroke="#00d4ff" stroke-width="7"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 28 28)"/>
    <text x="28" y="26" text-anchor="middle" fill="#7ab0d0" font-size="5">${label}</text>
    <text x="28" y="36" text-anchor="middle" fill="#00d4ff" font-size="10" font-weight="700">${pct}%</text>
  </svg>`;
}

function renderModeView(view) {
  return `
    <section class="hud-block">${hudHead(view.statTitle)}
      <div class="stad-sec-gauge">
        <i class="ti ${view.icon}"></i>
        <strong>${view.value}</strong>
        <span>${view.label}</span>
      </div>
    </section>
    <section class="hud-block">${hudHead(view.chartTitle)}${aquaBarChart(view.bars)}</section>`;
}

function renderMetricBars(metrics) {
  return `<div class="stad-sec-bars">${metrics.map((m) =>
    `<div class="stad-sec-bar" title="${m.label}: ${m.value}">
      <span style="width:${m.pct}%"></span><strong>${m.value}</strong>
    </div>`,
  ).join('')}</div>`;
}

function renderAccessView(block, key) {
  const values = ['main', 'secondary'];
  const view = block.views[key] || block.views.main;
  const tabs = block.tabs.map((t, i) => {
    const value = values[i];
    return `<button class="hud-tab${value === key ? ' hud-tab--active' : ''}" data-security-access="${value}" aria-pressed="${value === key}">${t}</button>`;
  }).join('');
  return `${hudHead(block.title)}<div class="hud-tabs" data-security-access-tabs>${tabs}</div>
    <div class="hud-env-row">${aquaDonut(view.ringPct, view.ringLabel)}${renderMetricBars(view.metrics)}</div>`;
}

function renderZonesView(block, key) {
  const values = ['live', 'forecast', 'history'];
  const view = block.views[key] || block.views.live;
  const zTabs = block.tabs.map((t, i) => {
    const value = values[i];
    return `<button class="hud-tab hud-tab--sm${value === key ? ' hud-tab--active' : ''}" data-security-zone="${value}" aria-pressed="${value === key}">${t}</button>`;
  }).join('');
  return `${hudHead(block.title)}<div class="hud-tabs hud-tabs--wrap" data-security-zone-tabs>${zTabs}</div>
    ${zoneMatrix(view.quantity, view.status)}
    <div class="hud-vent-row">${view.lanes.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('')}</div>`;
}

function renderParkingView(block, key) {
  const values = ['parking', 'bus', 'taxi'];
  const view = block.views[key] || block.views.parking;
  const tabs = block.tabs.map((t, i) => {
    const value = values[i];
    return `<button class="hud-tab${value === key ? ' hud-tab--active' : ''}" data-security-parking="${value}" aria-pressed="${value === key}">${t}</button>`;
  }).join('');
  return `${hudHead(block.title)}<div class="hud-tabs" data-security-parking-tabs>${tabs}</div>
    <div class="hud-env-row">${aquaDonut(view.ringPct, view.ringLabel)}${renderMetricBars(view.metrics)}</div>`;
}

function cameraChart(feeds) {
  return `<div class="stad-sec-camera-grid">${feeds.map((f, i) =>
    `<button class="stad-sec-camera" title="${f.label}" aria-label="${f.label}">
      <svg viewBox="0 0 80 44">
        <rect width="80" height="44" rx="3" fill="#101d2b"/>
        <path d="M8 32h64M16 25h48M24 18h32" stroke="#1a7ea8" stroke-width="1"/>
        <circle cx="${18 + (i % 3) * 21}" cy="${15 + Math.floor(i / 3) * 10}" r="4" fill="#00d4ff" opacity="${0.55 + i * 0.06}"/>
      </svg>
      <span></span>
    </button>`,
  ).join('')}</div>`;
}

function alertChart(alerts) {
  return `<div class="stad-sec-alert-chart">${alerts.map((a, i) =>
    `<div class="stad-sec-alert-bar" title="${a.tag}: ${a.title}">
      <span style="height:${78 - i * 18}%;opacity:${0.95 - i * 0.16}"></span>
      <i>${a.tag}</i>
    </div>`,
  ).join('')}</div>`;
}

function zoneMatrix(quantity, status) {
  const cells = Array.from({ length: 24 }, (_, i) => {
    const tone = i < 4 ? 'hot' : i < 11 ? 'warn' : i < 20 ? 'ok' : 'idle';
    return `<span class="stad-sec-cell stad-sec-cell--${tone}"></span>`;
  }).join('');
  return `<div class="stad-sec-zone-chart" title="${status}">
    <div class="stad-sec-zone-total"><i class="ti ti-camera"></i><strong>${quantity}</strong></div>
    <div class="stad-sec-matrix">${cells}</div>
  </div>`;
}

function patrolChart(d) {
  const cells = Array.from({ length: 18 }, (_, i) => {
    const tone = i < d.quantity ? 'ok' : 'idle';
    return `<span class="stad-sec-cell stad-sec-cell--${tone}"></span>`;
  }).join('');
  return `<div class="stad-sec-zone-chart" title="${d.status}">
    <div class="stad-sec-zone-total"><i class="ti ti-walk"></i><strong>${d.quantity}</strong></div>
    <div class="stad-sec-matrix stad-sec-matrix--patrol">${cells}</div>
  </div>`;
}

function statTiles(stats) {
  return `<div class="hud-energy-grid">${stats.map((s) =>
    `<div class="hud-energy-cell" title="${s.label}: ${s.value}">
      <div class="hud-energy-val">${s.value}</div>
      <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '+' : '-'} ${s.change}</div>
    </div>`,
  ).join('')}</div>`;
}

export function renderSecurityLeft(d) {
  return `
    <section class="hud-block">${hudHead(d.crowd.title)}
      ${distributionChart(d.crowd.total, d.crowd.groups, { idSuffix: 'Crowd' })}
    </section>
    <section class="hud-block">${hudHead(d.cameras.title)}${cameraChart(d.cameras.feeds)}</section>
    <div class="hud-tabs hud-tabs--dual" data-security-mode-tabs>
      <button class="hud-tab hud-tab--active" data-security-mode="live">${d.modeTabs[0]}</button>
      <button class="hud-tab" data-security-mode="ai">${d.modeTabs[1]}</button>
    </div>
    <div data-security-mode-panel>${renderModeView(d.modeViews.live)}</div>`;
}

export function renderSecurityRight(d) {
  return `
    <section class="hud-block">${hudHead('Canh bao')}${alertChart(d.alerts)}</section>
    <section class="hud-block" data-security-access-panel>${renderAccessView(d.access, 'main')}</section>
    <section class="hud-block" data-security-zone-panel>${renderZonesView(d.zones, 'live')}</section>
    <section class="hud-block hud-block--grow">${hudHead(d.response.title)}
      ${statTiles(d.response.stats)}${areaChartSvg(d.response.chart, 'secGrad')}
    </section>`;
}

export function renderSecurityExteriorLeft(d) {
  return `
    <section class="hud-block">${hudHead(d.ingress.title)}
      ${distributionChart(d.ingress.total, d.ingress.groups, { idSuffix: 'Ingress' })}
    </section>
    <section class="hud-block">${hudHead(d.cameras.title)}${cameraChart(d.cameras.feeds)}</section>
    <div class="hud-tabs hud-tabs--dual" data-security-exterior-mode-tabs>
      <button class="hud-tab hud-tab--active" data-security-exterior-mode="perimeter">${d.modeTabs[0]}</button>
      <button class="hud-tab" data-security-exterior-mode="traffic">${d.modeTabs[1]}</button>
    </div>
    <div data-security-exterior-mode-panel>${renderModeView(d.modeViews.perimeter)}</div>`;
}

export function renderSecurityExteriorRight(d) {
  return `
    <section class="hud-block">${hudHead('Canh bao ngoai vi')}${alertChart(d.alerts)}</section>
    <section class="hud-block" data-security-parking-panel>${renderParkingView(d.parking, 'parking')}</section>
    <section class="hud-block">${hudHead(d.patrol.title)}
      ${patrolChart(d.patrol)}
      <div class="hud-vent-row">${d.patrol.lanes.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('')}</div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.traffic.title)}
      ${statTiles(d.traffic.stats)}${areaChartSvg(d.traffic.chart, 'secExtGrad')}
    </section>`;
}

export function bindSecurityHudTabs(root, data) {
  root.querySelector('[data-security-mode-tabs]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-security-mode]');
    const panel = root.querySelector('[data-security-mode-panel]');
    const view = data.left.modeViews[tab?.dataset.securityMode];
    if (panel && view) panel.innerHTML = renderModeView(view);
  });

  root.querySelector('[data-security-access-panel]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-security-access]');
    const panel = root.querySelector('[data-security-access-panel]');
    if (tab && panel) panel.innerHTML = renderAccessView(data.right.access, tab.dataset.securityAccess);
  });

  root.querySelector('[data-security-zone-panel]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-security-zone]');
    const panel = root.querySelector('[data-security-zone-panel]');
    if (tab && panel) panel.innerHTML = renderZonesView(data.right.zones, tab.dataset.securityZone);
  });
}

export function bindSecurityExteriorHudTabs(root, data) {
  root.querySelector('[data-security-exterior-mode-tabs]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-security-exterior-mode]');
    const panel = root.querySelector('[data-security-exterior-mode-panel]');
    const view = data.left.modeViews[tab?.dataset.securityExteriorMode];
    if (panel && view) panel.innerHTML = renderModeView(view);
  });

  root.querySelector('[data-security-parking-panel]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-security-parking]');
    const panel = root.querySelector('[data-security-parking-panel]');
    if (tab && panel) panel.innerHTML = renderParkingView(data.right.parking, tab.dataset.securityParking);
  });
}
