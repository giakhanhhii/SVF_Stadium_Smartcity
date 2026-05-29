import { hudHead, barChartSvg, ringSvg, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';
import {
  renderDispatchPanel, renderDispatchDialog, MEDICAL_DISPATCH,
} from './emergency-dispatch.js';

function renderServiceModeView(view) {
  return `
    <section class="hud-block">${hudHead(view.statTitle)}
      <div class="hud-inline-stat"><i class="ti ${view.icon}"></i><span>${view.label}</span><strong>${view.value}</strong></div>
    </section>
    <section class="hud-block">${hudHead(view.chartTitle)}
      <div class="hud-sub">${view.subtitle}</div>${barChartSvg(view.bars)}
    </section>`;
}

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
    <div class="hud-tabs hud-tabs--dual" data-services-mode-tabs>
      <button class="hud-tab hud-tab--active" data-services-mode="parking">${d.modeTabs[0]}</button>
      <button class="hud-tab" data-services-mode="commerce">${d.modeTabs[1]}</button>
    </div>
    <div data-services-mode-panel>${renderServiceModeView(d.modeViews.parking)}</div>`;
}

function renderVocOpsBlock(block, icon) {
  const stats = block.stats.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div>
    <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.change}</div></div>`,
  ).join('');
  return `<section class="hud-block">
    ${hudHead(block.title)}
    <div class="hud-inline-stat"><i class="ti ${icon}"></i><span>VOC / FIFA</span><strong>${block.status}</strong></div>
    <div class="hud-energy-grid">${stats}</div>
  </section>`;
}

export function renderServicesRight(d) {
  const tabs = d.fb.tabs.map((t, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}" data-services-fb="${['fb', 'parking', 'wifi'][i]}">${t}</button>`,
  ).join('');
  const fbView = d.fb.views.fb;
  const bars = fbView.metrics.map((m) =>
    `<div class="hud-bar-item"><div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div></div>`,
  ).join('');
  const stats = d.revenue.stats.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div>
    <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '▲' : '▼'} ${s.change}</div></div>`,
  ).join('');
  return `
    <section class="hud-block">${hudHead('Dịch vụ & Phản hồi')}${renderAlerts(d.alerts)}</section>
    ${renderDispatchPanel({
      id: 'medical',
      title: hudHead('Gọi Y tế / Cứu hỏa'),
      buttonLabel: 'Gọi Y tế / Cứu hỏa',
      metaLines: [
        '<i class="ti ti-first-aid-kit"></i> Y tế: 115 / VOC-11',
        '<i class="ti ti-flame"></i> Cứu hỏa: 114 / VOC-12',
      ],
    })}
    ${renderVocOpsBlock(d.medical, 'ti-first-aid-kit')}
    ${renderVocOpsBlock(d.fire, 'ti-flame')}
    <section class="hud-block" data-services-fb-panel>${hudHead(d.fb.title)}<div class="hud-tabs" data-services-fb-tabs>${tabs}</div>
      <div class="hud-env-row">${ringSvg(fbView.ringPct, fbView.ringLabel)}<div class="hud-env-bars">${bars}</div></div>
    </section>
    <section class="hud-block">${hudHead(d.traffic.title)}
      <div class="hud-device-status">Cảnh báo: <span class="hud-badge">${d.traffic.status}</span></div>
      <div class="hud-vent-row">${d.traffic.lanes.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('')}</div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.revenue.title)}
      <div class="hud-energy-grid">${stats}</div>${areaChartSvg(d.revenue.chart, 'svcGrad')}
    </section>
    ${renderDispatchDialog(MEDICAL_DISPATCH)}`;
}

function renderFbView(d, key) {
  const values = ['fb', 'parking', 'wifi'];
  const view = d.fb.views[key] || d.fb.views.fb;
  const tabs = d.fb.tabs.map((t, i) => {
    const value = values[i];
    return `<button class="hud-tab${value === key ? ' hud-tab--active' : ''}" data-services-fb="${value}" aria-pressed="${value === key}">${t}</button>`;
  }).join('');
  const bars = view.metrics.map((m) =>
    `<div class="hud-bar-item"><div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div></div>`,
  ).join('');
  return `${hudHead(d.fb.title)}<div class="hud-tabs" data-services-fb-tabs>${tabs}</div>
    <div class="hud-env-row">${ringSvg(view.ringPct, view.ringLabel)}<div class="hud-env-bars">${bars}</div></div>`;
}

export function bindServicesHudTabs(root, data) {
  root.querySelector('[data-services-mode-tabs]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-services-mode]');
    if (!tab) return;
    const panel = root.querySelector('[data-services-mode-panel]');
    const view = data.left.modeViews[tab.dataset.servicesMode];
    if (panel && view) panel.innerHTML = renderServiceModeView(view);
  });

  root.querySelector('[data-services-fb-panel]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-services-fb]');
    if (!tab) return;
    const panel = root.querySelector('[data-services-fb-panel]');
    if (panel) panel.innerHTML = renderFbView(data.right, tab.dataset.servicesFb);
  });
}
