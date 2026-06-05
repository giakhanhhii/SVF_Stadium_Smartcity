const BLUE = '#00d4ff';
const BLUE_DARK = '#185FA5';
const BLUE_SOFT = '#69c7e8';
const GREEN = '#1D9E75';
const AMBER = '#EF9F27';
const RED = '#E24B4A';

function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function piePoint(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return `${(cx + Math.cos(rad) * r).toFixed(1)} ${(cy + Math.sin(rad) * r).toFixed(1)}`;
}

function piePath(cx, cy, r, start, end) {
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${piePoint(cx, cy, r, start)} A ${r} ${r} 0 ${large} 1 ${piePoint(cx, cy, r, end)} Z`;
}

function trafficPie3d(items) {
  let angle = -22;
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const slices = items.map((item) => {
    const span = item.value / total * 360;
    const path = piePath(58, 58, 46, angle, angle + span - 3);
    const mid = angle + span / 2;
    const dot = piePoint(58, 58, 34, mid).split(' ');
    const pin = piePoint(58, 58, 58, mid).split(' ');
    angle += span;
    return { ...item, path, dot, pin };
  });
  return `<div class="traffic-viz-pie">
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

function flowLineChart(chart) {
  const values = chart.values;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, i) => {
    const x = 8 + i * (118 / (values.length - 1));
    const y = 74 - ((value - min) / range) * 48;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `8,78 ${points.join(' ')} 126,78`;
  return `<div class="traffic-viz-flow">
    <svg viewBox="0 0 136 86" aria-hidden="true">
      <defs><linearGradient id="trafficFlowGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${BLUE}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${BLUE_DARK}" stop-opacity="0.04"/>
      </linearGradient></defs>
      <g class="traffic-viz-flow__grid">
        ${[24, 42, 60, 78].map((y) => `<line x1="8" y1="${y}" x2="126" y2="${y}"/>`).join('')}
        ${chart.labels.map((label, i) => `<text x="${8 + i * (118 / (chart.labels.length - 1))}" y="84" text-anchor="middle">${label}</text>`).join('')}
      </g>
      <polygon points="${area}" fill="url(#trafficFlowGrad)"/>
      <polyline class="traffic-viz-flow__line" points="${points.join(' ')}"/>
      ${points.map((point, i) => {
    const [x, y] = point.split(',');
    return `<circle cx="${x}" cy="${y}" r="${i === points.length - 1 ? 3.4 : 2.4}"/>`;
  }).join('')}
    </svg>
    <div class="traffic-viz-flow__metric"><i class="ti ti-road"></i><strong>${chart.current}</strong><span>${chart.label}</span></div>
  </div>`;
}

function compactCameraGrid(feeds) {
  return `<div class="traffic-viz-camera-grid">
    ${feeds.map((f, index) => `<span class="traffic-viz-camera traffic-viz-camera--${index === 2 ? 'warn' : 'ok'}">
      <i class="ti ti-camera"></i><b>${f.label}</b><em>${index === 2 ? '72%' : 'OK'}</em>
    </span>`).join('')}
  </div>`;
}

function incidentMatrix(incidents) {
  return `<div class="traffic-viz-matrix">
    ${incidents.items.map((item) => `<span class="traffic-viz-matrix__cell traffic-viz-matrix__cell--${item.tone}">
      <b>${item.value}</b><em>${item.label}</em>
    </span>`).join('')}
  </div>`;
}

export function renderTrafficLeftSidebar(d) {
  return `
    <section class="hud-block traffic-viz-block">${hudHead(d.flow.title)}
      ${trafficPie3d(d.flow.groups)}
    </section>
    <section class="hud-block traffic-viz-block">${hudHead(d.flow.trend.title)}
      ${flowLineChart(d.flow.trend)}
    </section>
    <section class="hud-block traffic-viz-block">${hudHead(d.cameras.title)}
      ${compactCameraGrid(d.cameras.feeds)}
    </section>`;
}
