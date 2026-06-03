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

function modeInsight(view) {
  if (!view.statTitle.includes('Chu vi')) return '';
  return `<div class="security-mode-insight">
    <div class="security-mode-ring">
      <strong>100%</strong>
      <span>Phủ cảm biến</span>
    </div>
    <div class="security-mode-metrics">
      <span><b>8</b><em>Điểm gác</em></span>
      <span><b>0</b><em>Mất tín hiệu</em></span>
      <span><b>4 ph</b><em>Tuần tra</em></span>
    </div>
  </div>
  <div class="security-mode-rail"><span style="width: 100%"></span></div>`;
}

function trafficModeDetail(view) {
  if (!view.routes?.length) return '';
  const routes = view.routes.map((route) => `
    <div class="security-traffic-route security-traffic-route--${route.tone}">
      <div class="security-traffic-route__head">
        <span>${route.label}</span><strong>${route.value}</strong>
      </div>
      <div class="security-traffic-route__track"><i style="width:${route.pct}%"></i></div>
    </div>
  `).join('');
  const hotspots = (view.hotspots || []).map((spot) => `
    <span class="security-traffic-hotspot">
      <b>${spot.zone}</b><strong>${spot.wait}</strong><em>${spot.note}</em>
    </span>
  `).join('');
  const actions = (view.actions || []).map((action) =>
    `<button type="button" class="hud-vent-btn">${action}</button>`,
  ).join('');
  return `<div class="security-traffic-panel">
    <div class="security-traffic-summary">${view.summary}</div>
    <div class="security-traffic-map" aria-hidden="true">
      <svg viewBox="0 0 160 76">
        <path class="security-traffic-map__road" d="M8 18h100l24 18-24 18H8"/>
        <path class="security-traffic-map__road security-traffic-map__road--alt" d="M38 68V44h84"/>
        <circle class="security-traffic-map__node security-traffic-map__node--ok" cx="28" cy="18" r="5"/>
        <circle class="security-traffic-map__node security-traffic-map__node--warn" cx="92" cy="18" r="6"/>
        <circle class="security-traffic-map__node security-traffic-map__node--hot" cx="124" cy="36" r="7"/>
        <circle class="security-traffic-map__node security-traffic-map__node--ok" cx="38" cy="68" r="5"/>
      </svg>
      <div class="security-traffic-hotspots">${hotspots}</div>
    </div>
    <div class="security-traffic-routes">${routes}</div>
    <div class="hud-vent-row security-traffic-actions">${actions}</div>
  </div>`;
}

function renderModeView(view) {
  return `
    <section class="hud-block">${hudHead(view.statTitle)}
      <div class="stad-sec-gauge">
        <i class="ti ${view.icon}"></i>
        <strong>${view.value}</strong>
        <span>${view.label}</span>
      </div>
      ${modeInsight(view)}
      ${trafficModeDetail(view)}
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
      <i>${a.label ?? a.tag}</i>
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
  return `<div class="stad-sec-zone-chart security-patrol-chart" title="${d.status}" data-security-patrol-chart>
    <div class="stad-sec-zone-total"><i class="ti ti-walk"></i><strong data-security-patrol-quantity>${d.quantity}</strong></div>
    <div class="stad-sec-matrix stad-sec-matrix--patrol">${cells}</div>
  </div>
  <div class="security-patrol-stats" data-security-patrol-stats>
    <span><b data-security-patrol-route>${d.status}</b><em>Tuyến ưu tiên</em></span>
    <span><b data-security-patrol-lanes>1</b><em>Làn mở</em></span>
    <span><b data-security-patrol-led>Chờ</b><em>LED</em></span>
  </div>
  <div class="security-patrol-status" data-security-patrol-status>Đội tuần tra đang giữ nhịp kiểm soát quanh ${d.status}.</div>`;
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
    <section class="hud-block">${hudHead('Cảnh báo')}${alertChart(d.alerts)}</section>
    <section class="hud-block hud-block--security-access" data-security-access-panel>${renderAccessView(d.access, 'main')}</section>
    <section class="hud-block hud-block--security-zones" data-security-zone-panel>${renderZonesView(d.zones, 'live')}</section>
    <section class="hud-block hud-block--grow hud-block--security-response">${hudHead(d.response.title)}
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
    <section class="hud-block">${hudHead('Cảnh báo ngoại vi')}${alertChart(d.alerts)}</section>
    <section class="hud-block" data-security-parking-panel>${renderParkingView(d.parking, 'parking')}</section>
    <section class="hud-block hud-block--security-patrol">${hudHead(d.patrol.title)}
      ${patrolChart(d.patrol)}
      <div class="hud-vent-row">${d.patrol.lanes.map((v, index) => `<button class="hud-vent-btn" data-security-patrol-action="${index}">${v}</button>`).join('')}</div>
    </section>
    <section class="hud-block hud-block--grow hud-block--traffic-24h">${hudHead(d.traffic.title)}
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

  root.querySelectorAll('[data-security-patrol-action]').forEach((button) => {
    if (button.dataset.securityPatrolBound === 'true') return;
    button.dataset.securityPatrolBound = 'true';
    button.addEventListener('click', () => {
      const action = Number(button.dataset.securityPatrolAction || 0);
      const card = button.closest('.hud-block');
      const quantityEl = card?.querySelector('[data-security-patrol-quantity]');
      const routeEl = card?.querySelector('[data-security-patrol-route]');
      const lanesEl = card?.querySelector('[data-security-patrol-lanes]');
      const ledEl = card?.querySelector('[data-security-patrol-led]');
      const statusEl = card?.querySelector('[data-security-patrol-status]');
      const cells = [...(card?.querySelectorAll('.stad-sec-matrix--patrol .stad-sec-cell') || [])];
      const configs = [
        { quantity: 15, route: 'Khu B', lanes: 1, led: 'Giữ', status: 'Đã tăng 3 tổ tuần tra tại khu B, ưu tiên quét hàng rào và cổng phụ.' },
        { quantity: 13, route: 'P3', lanes: 2, led: 'Mở P3', status: 'Đã mở làn P3 và chuyển một tổ tuần tra sang điều tiết xe vào.' },
        { quantity: 12, route: 'LED', lanes: 1, led: 'Đã cập nhật', status: 'Đã cập nhật LED hướng dẫn, giữ đội tuần tra hiện tại quanh P4.' },
      ];
      const next = configs[action] || configs[0];
      if (quantityEl) quantityEl.textContent = String(next.quantity);
      if (routeEl) routeEl.textContent = next.route;
      if (lanesEl) lanesEl.textContent = String(next.lanes);
      if (ledEl) ledEl.textContent = next.led;
      if (statusEl) statusEl.textContent = next.status;
      cells.forEach((cell, index) => {
        cell.classList.toggle('stad-sec-cell--ok', index < next.quantity);
        cell.classList.toggle('stad-sec-cell--idle', index >= next.quantity);
      });
      card?.querySelectorAll('[data-security-patrol-action]').forEach((el) => el.classList.remove('hud-vent-btn--active'));
      button.classList.add('hud-vent-btn--active');
    });
  });
}
