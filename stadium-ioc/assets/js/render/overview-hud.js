import { hudHead, ringSvg, renderAlerts } from './hud-charts.js';

const BADGE_CLASS = { ok: 'hud-domain__badge--ok', live: 'hud-domain__badge--live', warn: 'hud-domain__badge--warn' };

function renderDomainBlock(domain) {
  const metrics = domain.metrics.map((m) =>
    `<div class="hud-domain__metric"><span>${m.label}</span><strong>${m.value}</strong></div>`,
  ).join('');
  const badgeCls = BADGE_CLASS[domain.badgeTone] || BADGE_CLASS.ok;
  return `<button type="button" class="hud-block hud-block--domain" data-nav="${domain.nav}">
    <div class="hud-domain__head">
      <span class="hud-domain__badge ${badgeCls}">${domain.badge}</span>
      <span class="hud-domain__title"><i class="ti ${domain.icon}" aria-hidden="true"></i>${domain.name}</span>
      <i class="ti ti-chevron-right hud-domain__go" aria-hidden="true"></i>
    </div>
    <div class="hud-domain__metrics">${metrics}</div>
  </button>`;
}

export function renderOverviewLeft(d) {
  const domains = d.domains.map(renderDomainBlock).join('');
  return `
    <section class="hud-block">${hudHead(d.venue.title)}
      <div class="hud-metric-lbl">${d.venue.capacityLabel}</div>
      <div class="hud-metric-big">${d.venue.capacity}</div>
      <div class="hud-inline-stat"><i class="ti ti-live-photo"></i><span>${d.venue.event}</span><strong>${d.venue.score}</strong></div>
    </section>
    <section class="hud-block hud-block--roof">${hudHead(d.roof.title)}
      <div class="hud-env-row">${ringSvg(d.roof.pct, 'Mái vòm')}
        <div class="hud-env-bars">
          <div class="hud-inline-stat"><span>${d.roof.label}</span><strong data-roof-status>${d.roof.value}</strong></div>
          <div class="hud-bar-item"><div class="hud-bar-head"><span>Tiến trình</span><strong data-roof-pct>${d.roof.pct}%</strong></div>
          <div class="hud-bar-track"><div class="hud-bar-fill" data-roof-bar style="width:${d.roof.pct}%"></div></div></div>
        </div>
      </div>
    </section>
    ${domains}`;
}

export function renderOverviewRight(d) {
  const domains = d.domains.map(renderDomainBlock).join('');
  return `
    ${domains}
    <section class="hud-block hud-block--alerts">${hudHead('Cảnh báo VOC')}${renderAlerts(d.alerts)}</section>`;
}
