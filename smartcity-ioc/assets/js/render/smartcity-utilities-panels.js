// Panel + modal trang Utilities (dịch vụ cư dân Vin). Tách từ smartcity-domain-command-panels.js.
import { vinServiceModalData } from '../data/smartcity-domain-panels-data.js';
import { hudHead, infraPiePoint, infraPiePath } from './smartcity-domain-panel-helpers.js';

export function utilityResidentHero({ points }) {
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${points[0].x},64 ${line} ${points[points.length - 1].x},64`;
  return `<section class="hud-block smartcity-hud-accent sc-diagram vin-service-hero" data-diagram-family="vin-service-hero">
    ${hudHead('Dịch vụ cư dân Vin')}
    <div class="vin-service-hero__line">
      <svg viewBox="0 0 152 76" aria-hidden="true">
        <defs><linearGradient id="vinResidentArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="#185fa5" stop-opacity="0.16"/>
        </linearGradient></defs>
        <path class="vin-service-hero__gridline" d="M16 18H136M16 42H136M16 64H136"/>
        <polygon class="vin-service-hero__area" points="${area}"/>
        <polyline class="vin-service-hero__polyline" points="${line}"/>
        ${points.map((point) => `<g class="vin-service-hero__point">
          <text class="vin-service-hero__pct" x="${point.x}" y="${Math.max(10, point.y - 8)}">${point.value}%</text>
          <circle cx="${point.x}" cy="${point.y}" r="3.1"/>
          <text class="vin-service-hero__label" x="${point.x}" y="74">${point.label}</text>
        </g>`).join('')}
      </svg>
    </div>
    <div class="vin-service-hero__actions">
      <button type="button" data-vin-service-open="fee"><i class="ti ti-home-dollar"></i><span>Phí</span></button>
      <button type="button" data-vin-service-open="waterpark"><i class="ti ti-swimming"></i><span>Waterpark</span></button>
      <button type="button" data-vin-service-open="vinbus"><i class="ti ti-bus"></i><span>VinBus</span></button>
    </div>
  </section>`;
}

export function utilityServiceAlertsChart({ alerts, summary }) {
  const peak = Math.max(...alerts.map((item) => item.value));
  return `<section class="hud-block sc-diagram vin-service-alerts" data-diagram-family="vin-service-alerts">
    ${hudHead('Cảnh báo dịch vụ Vin')}
    <div class="vin-service-alerts__chart">
      ${alerts.map((item) => `<span>
        <b>${item.label}</b>
        <i><em style="width:${Math.max(12, item.value / peak * 100)}%"></em></i>
        <strong>${item.value}</strong>
      </span>`).join('')}
    </div>
    <div class="vin-service-alerts__summary">
      ${summary.map(([value, label]) => `<span><b>${value}</b><em>${label}</em></span>`).join('\n      ')}
    </div>
  </section>`;
}

export function utilityNodeMap({ nodes: nodeData }) {
  const nodes = nodeData.map((node, index, arr) => {
    const angle = (-90 + index * (360 / arr.length)) * Math.PI / 180;
    return { ...node, x: 50 + Math.cos(angle) * 37, y: 50 + Math.sin(angle) * 32 };
  });
  return `<section class="hud-block sc-diagram" data-diagram-family="utility-node-map">
    ${hudHead('Mạng dịch vụ Vin')}
    <div class="sc-node-map sc-node-map--utility">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect class="sc-node-map__pitch" x="35" y="37" width="30" height="26" rx="13"/>
        <circle class="sc-node-map__hub" cx="50" cy="50" r="7"/>
        ${nodes.map((n) => `<path class="sc-node-map__line sc-node-map__line--${n.tone}" d="M50 50L${n.x.toFixed(1)} ${n.y.toFixed(1)}"/>`).join('')}
        ${nodes.map((n) => `<circle class="sc-node-map__node sc-node-map__node--${n.tone}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5.2"/>`).join('')}
      </svg>
      <div class="sc-node-map__labels">
        ${nodes.map((n) => `<button type="button" class="sc-node-label sc-node-label--${n.tone}" data-vin-service-open="${n.id}">
          <i class="ti ${n.icon}"></i><span class="sc-node-label__text"><b>${n.label}</b><em>${n.value}</em></span>
        </button>`).join('')}
      </div>
    </div>
  </section>`;
}

function renderVinServiceModal(service) {
  return `<div class="vin-service-modal" data-vin-service-modal>
    <div class="vin-service-modal__panel" role="dialog" aria-modal="true" aria-label="${service.title}">
      <button type="button" class="vin-service-modal__close" data-vin-service-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="vin-service-modal__head">
        <span><i class="ti ${service.icon}"></i></span>
        <div><small>${service.tag}</small><h3>${service.title}</h3></div>
      </header>
      <p class="vin-service-modal__summary">${service.summary}</p>
      <div class="vin-service-modal__stats">
        ${service.stats.map(([label, value]) => `<span><b>${value}</b><em>${label}</em></span>`).join('')}
      </div>
      <section class="vin-service-modal__steps">
        ${service.steps.map((step, index) => `<span><i>${index + 1}</i><b>${step}</b></span>`).join('')}
      </section>
      <footer class="vin-service-modal__foot">
        <span>Đã đồng bộ dữ liệu dịch vụ tháng hiện tại.</span>
        <button type="button" data-vin-service-close>Đóng</button>
      </footer>
    </div>
  </div>`;
}

function showVinServiceModal(id) {
  const service = vinServiceModalData[id];
  if (!service) return;
  document.querySelector('[data-vin-service-modal]')?.remove();
  document.body.insertAdjacentHTML('beforeend', renderVinServiceModal(service));
}

export function utilityServiceMap({ residentPct, lots }) {
  return `<section class="hud-block sc-diagram" data-diagram-family="service-map">
    ${hudHead('Cư dân / khách theo tháng')}
    <div class="sc-service-map">
      <div class="sc-service-map__top">
        <div class="sc-service-map__ring" style="--pct:${residentPct}"><strong>${residentPct}%</strong><span>cư dân</span></div>
        <div class="sc-service-map__bars">
          ${lots.map((lot) => `<span><b>${lot.label}</b><em><i style="width:${lot.value}%"></i></em><strong>${lot.metric}</strong></span>`).join('')}
        </div>
      </div>
      <svg viewBox="0 0 100 82" aria-hidden="true">
        <path class="sc-service-map__road" d="M8 40h84M50 8v66"/>
        <rect class="sc-service-map__core" x="35" y="27" width="30" height="26" rx="13"/>
        ${lots.map((lot, index) => {
    const x = [10, 60, 10, 60][index];
    const y = [10, 10, 52, 52][index];
    return `<g class="sc-service-lot sc-service-lot--${lot.tone}">
      <rect x="${x}" y="${y}" width="28" height="18" rx="3"/>
      <text x="${x + 14}" y="${y + 11}">${lot.label.replace('GrandWorld', 'G.World').replace('WaterPark', 'Water')}</text>
    </g>`;
  }).join('')}
      </svg>
    </div>
  </section>`;
}

export function utilityFlow({ checks }) {
  return `<section class="hud-block sc-diagram" data-diagram-family="route-flow">
    ${hudHead('Luồng vào dịch vụ cư dân')}
    <div class="sc-route-flow">
      <svg viewBox="0 0 160 68" aria-hidden="true">
        <path class="sc-route-flow__route" d="M12 18h54l20 16h62"/>
        <path class="sc-route-flow__route sc-route-flow__route--alt" d="M12 50h58l16-16"/>
        <circle class="sc-route-flow__node" cx="20" cy="18" r="7"/>
        <circle class="sc-route-flow__node sc-route-flow__node--warn" cx="86" cy="34" r="7"/>
        <circle class="sc-route-flow__node sc-route-flow__node--ok" cx="140" cy="34" r="7"/>
        <text x="20" y="21">APP</text><text x="86" y="37">QR</text><text x="140" y="37">VIN</text>
      </svg>
      <div class="sc-route-flow__checks">
        ${checks.map((check) => `<span class="sc-route-check sc-route-check--${check.tone}"><b>${check.label}</b><em>${check.value}</em></span>`).join('')}
      </div>
    </div>
  </section>`;
}

export function utilityLoadTowers({ bars, services }) {
  return `<section class="hud-block sc-diagram" data-diagram-family="queue-bars">
    ${hudHead('Lượt sử dụng 6 tháng')}
    <div class="vin-usage-summary">
      <span>Chỉ số tổng hợp từ các dịch vụ cư dân</span>
      <strong>T5 cao nhất</strong>
    </div>
    <div class="sc-queue-bars">
      ${bars.map((bar) => `<span class="sc-queue-bar sc-queue-bar--${bar.value >= 84 ? 'warn' : 'ok'}">
        <em>${bar.label}</em><i style="height:${bar.value}%"></i><b>${bar.value}%</b><small>${bar.note}</small>
      </span>`).join('')}
    </div>
    <div class="vin-usage-legend">
      ${services.map(([label, value]) => `<span><b>${label}</b><em>${value}</em></span>`).join('')}
    </div>
    <button type="button" class="vin-usage-open" data-vin-service-open="usage">
      <i class="ti ti-chart-line"></i><span>Xem chi tiết lượt dùng</span>
    </button>
  </section>`;
}

function vinServiceRadar(values, labels) {
  const cx = 56;
  const cy = 52;
  const sides = labels.length;
  const point = (i, r) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  };
  const ring = (r) => labels.map((_, i) => point(i, r)).join(' ');
  const data = values.map((v, i) => point(i, 42 * v)).join(' ');
  return `<svg class="vin-service-radar" viewBox="0 0 112 108" aria-hidden="true">
    <defs><linearGradient id="vinServiceRadarFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7edfff" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#386dff" stop-opacity="0.58"/>
    </linearGradient></defs>
    <g class="vin-service-radar__grid">
      <polygon points="${ring(16)}"/><polygon points="${ring(29)}"/><polygon points="${ring(42)}"/>
      ${labels.map((label, i) => {
    const [x, y] = point(i, 50).split(',');
    const [ax, ay] = point(i, 42).split(',');
    return `<line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}"/><text x="${x}" y="${y}">${label}</text>`;
  }).join('')}
    </g>
    <polygon class="vin-service-radar__shadow" points="${data}"/>
    <polygon class="vin-service-radar__shape" points="${data}"/>
  </svg>`;
}

export function utilityRulesRadar({ violations }) {
  const peak = Math.max(...violations.map((item) => item.value));
  return `<section class="hud-block sc-diagram" data-diagram-family="lux-grid">
    ${hudHead('Vi phạm quy định / tháng')}
    <div class="vin-service-rules">
      ${vinServiceRadar(violations.map((item) => item.value / peak), violations.map((item) => item.label))}
      <div class="vin-service-rules__meter">
        <strong>${peak}</strong>
        <span>WaterPark cao nhất</span>
      </div>
    </div>
    <div class="vin-service-rules__lanes">
      ${violations.map((item) => `<span class="vin-service-rules__lane vin-service-rules__lane--${item.tone}">
        <b>${item.label}</b><i style="width:${Math.max(12, item.value / peak * 100)}%"></i><em>${item.value} VP</em>
      </span>`).join('')}
    </div>
  </section>`;
}

function vinServicePie(items) {
  let angle = -22;
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const slices = items.map((item) => {
    const span = item.value / total * 360;
    const path = infraPiePath(58, 58, 46, angle, angle + span - 3);
    const mid = angle + span / 2;
    const dot = infraPiePoint(58, 58, 34, mid).split(' ');
    const pin = infraPiePoint(58, 58, 58, mid).split(' ');
    angle += span;
    return { ...item, path, dot, pin };
  });
  return `<div class="traffic-viz-pie resident-viz-pie vin-service-pie">
    <svg viewBox="0 0 122 122" aria-hidden="true">
      <ellipse class="traffic-viz-pie__shadow" cx="58" cy="66" rx="45" ry="35"/>
      ${slices.map((s) => `<path class="traffic-viz-pie__slice" d="${s.path}" fill="${s.color}"/>`).join('')}
      ${slices.map((s) => `<line class="traffic-viz-pie__pin" x1="${s.dot[0]}" y1="${s.dot[1]}" x2="${s.pin[0]}" y2="${s.pin[1]}"/>
        <circle class="traffic-viz-pie__dot" cx="${s.pin[0]}" cy="${s.pin[1]}" r="2.2"/>
        <circle class="traffic-viz-pie__dot traffic-viz-pie__dot--inner" cx="${s.dot[0]}" cy="${s.dot[1]}" r="1.8"/>`).join('')}
      <circle class="traffic-viz-pie__core" cx="58" cy="58" r="18"/>
      <circle class="traffic-viz-pie__core-light" cx="58" cy="58" r="9"/>
    </svg>
    <div class="traffic-viz-legend">
      ${items.map((item) => `<span><i style="background:${item.color}"></i><b>${item.label}</b><em>${item.pct}%</em></span>`).join('')}
    </div>
  </div>`;
}

export function utilityVinStandard({ items }) {
  return `<section class="hud-block sc-diagram" data-diagram-family="vin-service-pie">
    ${hudHead('Chuẩn dịch vụ Vin')}
    ${vinServicePie(items)}
  </section>`;
}

export function bindVinServiceModal() {
  if (document.body.dataset.vinServiceModalBound === 'true') return;
  document.body.dataset.vinServiceModalBound = 'true';

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-vin-service-open]');
    if (opener) {
      showVinServiceModal(opener.dataset.vinServiceOpen);
      return;
    }

    const modal = event.target.closest('[data-vin-service-modal]');
    if (event.target.closest('[data-vin-service-close]') || event.target === modal) {
      modal?.remove();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') document.querySelector('[data-vin-service-modal]')?.remove();
  });
}
