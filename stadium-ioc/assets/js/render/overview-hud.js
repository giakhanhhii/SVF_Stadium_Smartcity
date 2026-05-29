import { hudHead, ringSvg, barChartSvg, areaChartSvg } from './hud-charts.js';
import {
  renderOpsReportDashboard, indexOpsCases, bindOpsReports,
} from './ops-report.js';

function radarChart(values, labels) {
  const cx = 56;
  const cy = 52;
  const sides = labels.length;
  const point = (i, r) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  };
  const ring = (r) => labels.map((_, i) => point(i, r)).join(' ');
  const data = values.map((v, i) => point(i, 42 * v)).join(' ');
  const axes = labels.map((label, i) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    const tx = cx + Math.cos(angle) * 50;
    const ty = cy + Math.sin(angle) * 50;
    return `<line x1="${cx}" y1="${cy}" x2="${point(i, 42).split(',')[0]}" y2="${point(i, 42).split(',')[1]}"/>
      <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}">${label}</text>`;
  }).join('');
  return `<svg class="overview-radar3d" viewBox="0 0 112 108" aria-hidden="true">
    <defs><linearGradient id="overviewRadarFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7edfff" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#386dff" stop-opacity="0.58"/>
    </linearGradient></defs>
    <g class="overview-radar3d__grid">
      <polygon points="${ring(16)}"/><polygon points="${ring(29)}"/><polygon points="${ring(42)}"/>
      ${axes}
    </g>
    <polygon class="overview-radar3d__shadow" points="${data}"/>
    <polygon class="overview-radar3d__shape" points="${data}"/>
    ${values.map((v, i) => {
    const [x, y] = point(i, 42 * v).split(',');
    return `<circle cx="${x}" cy="${y}" r="2.3"/>`;
  }).join('')}
  </svg>`;
}

function pie3dChart(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const colors = ['#00d4ff', '#3c8cff', '#7bdcff', '#176f9d'];
  const polar = (r, deg) => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: 56 + Math.cos(rad) * r, y: 56 + Math.sin(rad) * r };
  };
  const sector = (start, end, r) => {
    const a = polar(r, start);
    const b = polar(r, end);
    const large = end - start > 180 ? 1 : 0;
    return `M 56 56 L ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)} Z`;
  };
  let angle = -35;
  const slices = items.map((item, i) => {
    const sweep = (item.value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return `<path class="overview-pie3d__slice" d="${sector(start, end, 40)}" fill="${colors[i % colors.length]}" opacity="${0.95 - i * 0.1}"/>`;
  }).join('');
  return `<svg class="overview-pie3d" viewBox="0 0 112 112" aria-hidden="true">
    <circle cx="56" cy="56" r="41" fill="rgba(0,212,255,0.1)"/>
    ${slices}
  </svg>`;
}

function lineDonutCombo(lineValues, donutItems) {
  const max = Math.max(...lineValues);
  const min = Math.min(...lineValues);
  const avg = Math.round(lineValues.reduce((sum, value) => sum + value, 0) / lineValues.length);
  const points = lineValues.map((value, i) => {
    const x = 8 + i * 10;
    const y = 52 - (value / max) * 38;
    return `${x},${y}`;
  }).join(' ');
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const total = donutItems.reduce((sum, item) => sum + item.value, 0) || 1;
  let angle = -40;
  const colors = ['#00d4ff', '#3c8cff', '#7bdcff'];
  const polar = (r, deg, cx = 128, cy = 34) => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
  };
  const sector = (start, end, r, cx = 128, cy = 34) => {
    const a = polar(r, start, cx, cy);
    const b = polar(r, end, cx, cy);
    const large = end - start > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)} Z`;
  };
  const donut = donutItems.map((item, i) => {
    const sweep = (item.value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return `<path class="overview-combo__slice" d="${sector(start, end, 24)}" fill="${colors[i % colors.length]}" opacity="${0.95 - i * 0.12}"/>`;
  }).join('');
  return `<div class="overview-combo-wrap">
    <div class="overview-combo-kpis">
      <span><b>${max}</b><em>peak</em></span>
      <span><b>${avg}</b><em>avg</em></span>
      <span><b>${min}</b><em>low</em></span>
    </div>
    <svg class="overview-combo" viewBox="0 0 176 72" aria-hidden="true">
      <g class="overview-combo__grid">
        ${[14, 24, 34, 44, 54].map((y) => `<line x1="4" y1="${y}" x2="78" y2="${y}"/>`).join('')}
        ${labels.map((label, i) => `<text x="${8 + i * 10}" y="68" transform="rotate(-36 ${8 + i * 10} 68)">${label}</text>`).join('')}
      </g>
      <polyline class="overview-combo__line" points="${points}"/>
      ${lineValues.map((value, i) => {
    const x = 8 + i * 10;
    const y = 52 - (value / max) * 38;
    return `<circle class="overview-combo__dot" cx="${x}" cy="${y}" r="1.8"/><text class="overview-combo__point-val" x="${x}" y="${y - 5}">${value}</text>`;
  }).join('')}
      <circle cx="128" cy="34" r="25" fill="rgba(0,212,255,0.1)"/>
      ${donut}
      <text x="94" y="34" class="overview-combo__num">${donutItems[0]?.value || 0}</text>
      <text x="158" y="36" class="overview-combo__num">${donutItems[1]?.value || 0}</text>
    </svg>
  </div>`;
}

export function renderOverviewLeft(d) {
  indexOpsCases(d.categories);
  return renderOpsReportDashboard(d);
}

export function renderOverviewRight(d) {
  const total = Number(d.rollup[0]?.value || 0);
  const closed = Number(d.rollup[1]?.value || 0);
  const pending = Number(d.rollup[2]?.value || 0);
  const closePct = total ? Math.round((closed / total) * 100) : 0;
  const rollupBars = [
    { time: 'All', value: total },
    { time: 'OK', value: closed },
    { time: 'Wait', value: pending },
  ];
  const alertBars = d.alerts.map((alert) => {
    const value = alert.tag === 'INCIDENT' ? 9 : alert.tag === 'ACCESS' ? 6 : 4;
    return { time: alert.tag.slice(0, 3), value };
  });
  const radarValues = [closePct / 100, closed / Math.max(total, 1), pending / Math.max(total, 1), 0.68, 0.82, 0.54];
  const alertDots = d.alerts.map((alert) =>
    `<button type="button" class="ops-alert-dot" title="${alert.title}" aria-label="${alert.tag}: ${alert.title}">
      <span style="background:${alert.tagColor}"></span><b>${alert.time}</b>
    </button>`,
  ).join('');
  return `
    <section class="hud-block ops-rollup ops-rollup--visual">${hudHead('Tổng hợp ca')}
      <div class="ops-rollup__visual">
        ${lineDonutCombo([22, 31, 28, 35, 48, 44, 38], [
          { value: closed },
          { value: pending },
          { value: Math.max(total - closed - pending, 1) },
        ])}
        <div class="ops-rollup__nums">
          <span><b>${total}</b><em>all</em></span>
          <span><b>${closed}</b><em>ok</em></span>
          <span class="ops-rollup__warn"><b>${pending}</b><em>wait</em></span>
        </div>
      </div>
      ${barChartSvg(rollupBars)}
    </section>
    <section class="hud-block ops-rollup__alerts ops-alert-viz">${hudHead('Cảnh báo VOC')}
      ${radarChart(radarValues, ['SLA', 'OK', 'Q', 'CAM', 'OPS', 'VIP'])}
      ${barChartSvg(alertBars)}
      <div class="ops-alert-dot-row">${alertDots}</div>
      ${areaChartSvg([0.18, 0.32, 0.52, 0.48, 0.66, 0.84, 0.62, 0.54], 'overviewAlertGrad')}
    </section>`;
}

export function mountOverviewOpsBind(root) {
  const left = root?.querySelector('[data-mount="sidebar-left"]');
  if (left) bindOpsReports(left);
}
