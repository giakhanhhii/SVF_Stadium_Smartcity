import { hudHead } from './hud-charts.js';
import {
  distributionMinis, distributionStack, radial3dChart,
} from './radial3d-chart.js';

function radarChart(values, labels) {
  const cx = 74;
  const cy = 66;
  const maxR = 46;
  const labelR = 58;
  const sides = labels.length;
  const point = (i, r) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  };
  const labelStyle = (i) => {
    const angleDeg = (-90 + i * (360 / sides) + 360) % 360;
    if (angleDeg >= 315 || angleDeg < 45) return { anchor: 'middle', extraR: 5 };
    if (angleDeg >= 45 && angleDeg < 135) return { anchor: 'start', extraR: 14 };
    if (angleDeg >= 135 && angleDeg < 225) return { anchor: 'middle', extraR: 5 };
    return { anchor: 'end', extraR: 8 };
  };
  const ring = (r) => labels.map((_, i) => point(i, r)).join(' ');
  const data = values.map((v, i) => point(i, maxR * v)).join(' ');
  const axes = labels.map((label, i) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    const style = labelStyle(i);
    const r = labelR + style.extraR;
    const tx = cx + Math.cos(angle) * r;
    const ty = cy + Math.sin(angle) * r;
    const [x2, y2] = point(i, maxR).split(',');
    return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}"/>
      <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${style.anchor}">${label}</text>`;
  }).join('');
  return `<svg class="overview-radar3d" viewBox="0 0 148 132" aria-hidden="true">
    <defs><linearGradient id="overviewRadarFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7edfff" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#386dff" stop-opacity="0.58"/>
    </linearGradient></defs>
    <g class="overview-radar3d__grid">
      <polygon points="${ring(16)}"/><polygon points="${ring(31)}"/><polygon points="${ring(maxR)}"/>
      ${axes}
    </g>
    <polygon class="overview-radar3d__shadow" points="${data}"/>
    <polygon class="overview-radar3d__shape" points="${data}"/>
    ${values.map((v, i) => {
    const [x, y] = point(i, maxR * v).split(',');
    return `<circle cx="${x}" cy="${y}" r="2.3"/>`;
  }).join('')}
  </svg>`;
}

function compactLineChart(values, labels, id = 'overviewMiniLine') {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, i) => {
    const x = 8 + i * (104 / (values.length - 1));
    const y = 58 - ((value - min) / range) * 42;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `8,62 ${points.join(' ')} 112,62`;
  return `<svg class="overview-domain-line" viewBox="0 0 120 72" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="#2f6dff" stop-opacity="0.04"/>
    </linearGradient></defs>
    <g class="overview-domain-line__grid">
      ${[16, 30, 44, 58].map((y) => `<line x1="8" y1="${y}" x2="112" y2="${y}"/>`).join('')}
      ${labels.map((label, i) => `<text x="${8 + i * (104 / (labels.length - 1))}" y="70" text-anchor="middle">${label}</text>`).join('')}
    </g>
    <polygon points="${area}" fill="url(#${id})"/>
    <polyline points="${points.join(' ')}" class="overview-domain-line__stroke"/>
    ${values.map((value, i) => {
    const [x, y] = points[i].split(',');
    return `<circle cx="${x}" cy="${y}" r="2.3"/><text x="${x}" y="${Number(y) - 6}" class="overview-domain-line__value">${value}</text>`;
  }).join('')}
  </svg>`;
}

function serviceFlowChart(items) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return `<div class="overview-service-flow">
    ${items.map((item) => `<div class="overview-service-flow__row">
      <span>${item.label}</span>
      <i><b style="width:${Math.round((item.value / max) * 100)}%"></b></i>
      <strong>${item.meta}</strong>
    </div>`).join('')}
  </div>`;
}

function facilityBars(items) {
  return `<div class="overview-facility-line">
    ${compactLineChart(items.map((item) => item.value), items.map((item) => item.time), 'overviewFacilityLine')
    .replace(/class="overview-domain-line__value">(\d+)<\/text>/g, 'class="overview-domain-line__value">$1%</text>')}
  </div>`;
}

function overviewVenueChart(total, groups, capacityLabel) {
  const groupTotal = groups.reduce((sum, g) => sum + g.value, 0) || total;
  return `<div class="stad-sec-total overview-venue-total">
    <div class="stad-sec-total__top">
      ${radial3dChart(groups, { idSuffix: 'OverviewVenue' })}
      <div class="overview-venue-total__main">
        <strong>${total.toLocaleString('vi-VN')}</strong>
        <span>${capacityLabel}</span>
      </div>
    </div>
    ${distributionStack(groups, groupTotal)}
    <div class="overview-venue-badges">
      <span><b>87%</b><em>Lấp đầy</em></span>
      <span><b>4</b><em>Khán đài</em></span>
      <span><b>VOC</b><em>Online</em></span>
    </div>
    ${distributionMinis(groups)}
  </div>`;
}

function overviewRouteDiagram(items) {
  const [start, middle, end] = items;
  return `<div class="overview-route-diagram" aria-hidden="true">
    <span class="overview-route-diagram__node overview-route-diagram__node--hot">
      <b>${start.label}</b><em>${start.value}</em>
    </span>
    <span class="overview-route-diagram__line"></span>
    <span class="overview-route-diagram__node overview-route-diagram__node--mid">
      <b>${middle.label}</b><em>${middle.value}</em>
    </span>
    <span class="overview-route-diagram__line overview-route-diagram__line--ok"></span>
    <span class="overview-route-diagram__node overview-route-diagram__node--ok">
      <b>${end.label}</b><em>${end.value}</em>
    </span>
  </div>`;
}

function overviewNodeMap(nodes) {
  const center = { x: 50, y: 50 };
  const left = [nodes[0], nodes[1]];
  const right = [nodes[2], nodes[4]];
  const metric = (node) => `<span class="overview-node-map__metric overview-node-map__metric--${node.tone}">
    <b>${node.value}</b><em>${node.name}</em>
  </span>`;
  return `<div class="overview-node-map" aria-hidden="true">
    <div class="overview-node-map__side overview-node-map__side--left">
      ${left.map(metric).join('')}
    </div>
    <svg viewBox="0 0 100 100">
      <circle class="overview-node-map__ring" cx="50" cy="50" r="30"/>
      <circle class="overview-node-map__axis" cx="50" cy="50" r="18"/>
      ${nodes.map((node) => `<line class="overview-node-map__line overview-node-map__line--${node.tone}" x1="${center.x}" y1="${center.y}" x2="${node.x}" y2="${node.y}"/>`).join('')}
      <circle class="overview-node-map__core" cx="50" cy="50" r="9"/>
      ${nodes.map((node) => `<g class="overview-node-map__node overview-node-map__node--${node.tone}" transform="translate(${node.x} ${node.y})">
        <circle r="7"/><text y="2.7">${node.label}</text>
      </g>`).join('')}
    </svg>
    <div class="overview-node-map__side overview-node-map__side--right">
      ${right.map(metric).join('')}
    </div>
  </div>`;
}

function overviewInfoList(items) {
  return `<div class="overview-info-list">
    ${items.map((item) => `<span>
      <i class="ti ${item.icon}"></i>
      <b>${item.label}</b>
      <strong>${item.value}</strong>
    </span>`).join('')}
  </div>`;
}

function overviewMetricDiagram(items) {
  return `<div class="overview-metric-diagram" aria-hidden="true">
    ${items.map((item, index) => `<span class="overview-metric-diagram__node">
      <b>${item.value}</b><em>${item.label}</em>
      ${index < items.length - 1 ? '<i></i>' : ''}
    </span>`).join('')}
  </div>`;
}

function domainCard(card) {
  return `<section class="hud-block overview-domain overview-domain--${card.id}">
    ${hudHead(card.title)}
    <div class="overview-domain__body">${card.chart}</div>
    ${card.diagram || ''}
  </section>`;
}

export function renderOverviewLeft(d) {
  const cards = [
    {
      id: 'venue',
      title: 'Tổng quan sân',
      chart: `<div class="overview-domain__stack overview-domain__stack--venue">
        ${overviewVenueChart(d.venue.total, d.venue.groups, d.venue.capacityLabel)}
      </div>`,
      kpis: [
        { value: `${d.venue.pct}%`, label: 'Lấp đầy' },
        { value: '4', label: 'Khán đài' },
        { value: 'VOC', label: 'Online' },
      ],
    },
    {
      id: 'security',
      title: 'An ninh',
      chart: `<div class="overview-domain__stack">
        ${radarChart([0.88, 0.76, 0.64, 0.72, 0.94], ['SLA', 'Cổng', 'KT', 'VIP', 'Đám'])}
        ${overviewInfoList([
          { icon: 'ti-camera', label: 'Camera', value: '32/32' },
          { icon: 'ti-bell-ringing', label: 'Cảnh báo', value: '2' },
          { icon: 'ti-clock-check', label: 'Phản ứng', value: '<4p' },
        ])}
      </div>`,
      kpis: [
        { value: '32/32', label: 'Camera' },
        { value: '2', label: 'Cảnh báo' },
        { value: '<4p', label: 'Phản ứng' },
      ],
    },
    {
      id: 'services',
      title: 'Dịch vụ',
      chart: serviceFlowChart([
        { label: 'Bãi xe P4', value: 88, meta: 'Cao' },
        { label: 'F&B C12', value: 72, meta: '6p' },
        { label: 'Y tế', value: 79, meta: 'SLA' },
        { label: 'Vé', value: 98, meta: 'OK' },
      ]),
      diagram: overviewMetricDiagram([
        { value: '88%', label: 'P4' },
        { value: '6p', label: 'F&B' },
        { value: '3/3', label: 'Y tế' },
      ]),
    },
  ];
  return cards.map(domainCard).join('');
}

export function renderOverviewRight(d) {
  const total = Number(d.rollup[0]?.value || 0);
  const closed = Number(d.rollup[1]?.value || 0);
  const closePct = total ? Math.round((closed / total) * 100) : 0;
  const cards = [
    {
      id: 'events',
      title: 'Sự kiện',
      chart: `<div class="overview-domain__stack">
        ${overviewRouteDiagram([
          { label: 'B12', value: '48 ca' },
          { label: 'B2', value: '84%' },
          { label: 'C1', value: 'OK' },
        ])}
        ${overviewInfoList([
          { icon: 'ti-route', label: 'Luồng khán giả', value: 'Gate B cao' },
          { icon: 'ti-clock-bolt', label: 'SLA điều phối', value: '3 phút' },
          { icon: 'ti-map-pin-exclamation', label: 'Điểm nóng', value: '2' },
        ])}
      </div>`,
      kpis: [
        { value: '48', label: 'Đỉnh ca' },
        { value: '84%', label: 'Ổn định' },
        { value: '2', label: 'Điểm nóng' },
      ],
    },
    {
      id: 'facilities',
      title: 'Cơ sở hạ tầng',
      chart: facilityBars([
        { time: 'HVAC', value: 92, unit: '%' },
        { time: 'UPS', value: 61, unit: '%' },
        { time: 'Lux', value: 80, unit: '%' },
        { time: 'Mái', value: 100, unit: '%' },
      ]),
      diagram: overviewMetricDiagram([
        { value: '92%', label: 'HVAC-B' },
        { value: '38p', label: 'UPS' },
        { value: 'Mở', label: 'Mái vòm' },
      ]),
    },
    {
      id: 'reports',
      title: 'Báo cáo',
      chart: `<div class="overview-domain__stack">
        ${overviewNodeMap([
          { x: 50, y: 16, tone: 'live', label: '28', value: total, name: 'Tổng gửi' },
          { x: 78, y: 34, tone: 'ok', label: '21', value: closed, name: 'Đã đóng' },
          { x: 70, y: 74, tone: 'warn', label: '6', value: d.rollup[2]?.value || '0', name: 'Theo dõi' },
          { x: 30, y: 74, tone: 'ok', label: '75', value: `${closePct}%`, name: 'SLA' },
          { x: 22, y: 34, tone: 'warn', label: '2', value: '2', name: 'Ưu tiên' },
        ])}
        ${overviewInfoList([
          { icon: 'ti-inbox', label: 'Hàng chờ VOC', value: `${d.rollup[2]?.value || '0'} việc` },
          { icon: 'ti-circle-check', label: 'Đã đóng', value: `${closed}/${total}` },
          { icon: 'ti-alert-triangle', label: 'Ưu tiên', value: '2 ticket' },
        ])}
      </div>`,
      kpis: [
        { value: `${closePct}%`, label: 'Đã đóng' },
        { value: total, label: 'Tổng gửi' },
        { value: d.rollup[2]?.value || '0', label: 'Theo dõi' },
      ],
    },
  ];
  return cards.map(domainCard).join('');
}

export function mountOverviewOpsBind(root) {
  root?.querySelectorAll('.overview-domain').forEach((card) => {
    card.setAttribute('data-overview-domain-ready', 'true');
  });
}
