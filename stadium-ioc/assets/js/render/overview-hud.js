import { hudHead, ringSvg, renderAlerts } from './hud-charts.js';

export function renderOverviewLeft(d) {
  const pills = d.systems.map((s) =>
    `<div class="hud-pill hud-pill--${s.tone}"><span class="hud-pill__lbl">${s.label}</span><span class="hud-pill__val">${s.value}</span></div>`,
  ).join('');
  return `
    <section class="hud-block">${hudHead(d.venue.title)}
      <div class="hud-metric-lbl">${d.venue.capacityLabel}</div>
      <div class="hud-metric-big">${d.venue.capacity}</div>
      <div class="hud-inline-stat"><i class="ti ti-live-photo"></i><span>${d.venue.event}</span><strong>${d.venue.score}</strong></div>
      <div class="hud-pill-row">${pills}</div>
    </section>
    <section class="hud-block hud-block--roof">${hudHead(d.roof.title)}
      <div class="hud-env-row">${ringSvg(d.roof.pct, 'Mái vòm')}
        <div class="hud-env-bars">
          <div class="hud-inline-stat"><span>${d.roof.label}</span><strong data-roof-status>${d.roof.value}</strong></div>
          <div class="hud-bar-item"><div class="hud-bar-head"><span>Tiến trình</span><strong data-roof-pct>${d.roof.pct}%</strong></div>
          <div class="hud-bar-track"><div class="hud-bar-fill" data-roof-bar style="width:${d.roof.pct}%"></div></div></div>
        </div>
      </div>
    </section>`;
}

export function renderOverviewRight(d) {
  const stats = d.ops.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div></div>`,
  ).join('');
  return `
    <section class="hud-block">${hudHead('Cảnh báo VOC')}${renderAlerts(d.alerts)}</section>
    <section class="hud-block hud-block--grow">${hudHead('Chỉ số vận hành')}
      <div class="hud-energy-grid">${stats}</div>
    </section>`;
}
