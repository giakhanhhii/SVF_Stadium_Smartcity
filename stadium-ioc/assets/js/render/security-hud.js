import { hudHead, areaChartSvg } from './hud-charts.js';

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

function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function sectorPath(cx, cy, innerR, outerR, startDeg, endDeg) {
  const gap = 2;
  const start = startDeg + gap;
  const end = endDeg - gap;
  const outerStart = polar(cx, cy, outerR, start);
  const outerEnd = polar(cx, cy, outerR, end);
  const innerEnd = polar(cx, cy, innerR, end);
  const innerStart = polar(cx, cy, innerR, start);
  const largeArc = end - start > 180 ? 1 : 0;
  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function radial3dChart(groups) {
  const total = groups.reduce((sum, g) => sum + g.value, 0) || 1;
  let angle = -22;
  const palette = ['#00d4ff', '#27b8ff', '#5aa7ff', '#7cdcff', '#1a8fca'];
  const slices = groups.map((g, i) => {
    const sweep = Math.max(34, (g.value / total) * 300);
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const mid = (start + end) / 2;
    const pin = polar(56, 56, 42, mid);
    const dot = polar(56, 56, 58, mid);
    const color = palette[i % palette.length];
    return `
      <path class="stad-sec-radial3d__depth" d="${sectorPath(56, 61, 14, 45, start, end)}"/>
      <path class="stad-sec-radial3d__slice" d="${sectorPath(56, 56, 14, 45, start, end)}" fill="${color}" opacity="${0.92 - i * 0.08}"/>
      <circle cx="${pin.x.toFixed(2)}" cy="${pin.y.toFixed(2)}" r="2" fill="#b9f5ff" opacity="0.8"/>
      <line x1="${pin.x.toFixed(2)}" y1="${pin.y.toFixed(2)}" x2="${dot.x.toFixed(2)}" y2="${dot.y.toFixed(2)}" stroke="#4aaed1" stroke-width="0.8" opacity="0.5"/>
      <circle cx="${dot.x.toFixed(2)}" cy="${dot.y.toFixed(2)}" r="2.2" fill="#7ff3ff" opacity="0.82"/>`;
  }).join('');

  return `<svg class="stad-sec-radial3d" viewBox="0 0 112 112" aria-hidden="true">
    <defs>
      <radialGradient id="stadSecRadialCore" cx="50%" cy="45%" r="70%">
        <stop offset="0%" stop-color="#0de6ff"/>
        <stop offset="72%" stop-color="#123bdb"/>
        <stop offset="100%" stop-color="#061852"/>
      </radialGradient>
      <filter id="stadSecRadialShadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#00192c" flood-opacity="0.65"/>
      </filter>
    </defs>
    <circle cx="56" cy="56" r="42" fill="rgba(0,212,255,0.05)" filter="url(#stadSecRadialShadow)"/>
    ${slices}
    <circle cx="56" cy="56" r="14" fill="#061446" stroke="#3c5cff" stroke-width="3"/>
    <circle cx="56" cy="56" r="7" fill="url(#stadSecRadialCore)"/>
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

function distributionChart(total, groups) {
  const groupTotal = groups.reduce((sum, g) => sum + g.value, 0) || total;
  const pct = Math.min(100, Math.round((groupTotal / Math.max(total, groupTotal)) * 100));
  const stack = groups.map((g) => {
    const segPct = Math.max(8, Math.round((g.value / groupTotal) * 100));
    return `<span class="stad-sec-stack__seg" style="width:${segPct}%" title="${g.label}: ${g.value.toLocaleString('vi-VN')}"></span>`;
  }).join('');
  const values = groups.map((g) =>
    `<div class="stad-sec-mini"><span>${g.label}</span><strong>${g.value.toLocaleString('vi-VN')}</strong></div>`,
  ).join('');
  return `<div class="stad-sec-total">
    <div class="stad-sec-total__top">
      ${radial3dChart(groups)}
      <strong>${total.toLocaleString('vi-VN')}</strong>
    </div>
    <div class="stad-sec-stack">${stack}</div>
    <div class="stad-sec-mini-grid">${values}</div>
  </div>`;
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
      ${distributionChart(d.crowd.total, d.crowd.groups)}
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
      ${distributionChart(d.ingress.total, d.ingress.groups)}
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
