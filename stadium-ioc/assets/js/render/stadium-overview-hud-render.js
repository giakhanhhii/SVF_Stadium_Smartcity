import { hudHead, areaChartSvg } from './hud-charts.js';
import {
  renderOpsReportDashboard, indexOpsCases, bindOpsReports,
} from './ops-report.js';

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

const VOC_ALERT_AXIS = {
  INCIDENT: { short: 'Sự cố', name: 'Sự cố', weight: 9 },
  ACCESS: { short: 'Cổng', name: 'Cổng', weight: 6 },
  ENGINEERING: { short: 'KT', name: 'Kỹ thuật', weight: 4 },
};

function vocAlertViz(alerts, closePct) {
  const axes = [
    { label: 'SLA', value: closePct / 100, kpi: `${closePct}%`, name: 'SLA đóng ca' },
    ...alerts.map((alert) => {
      const axis = VOC_ALERT_AXIS[alert.tag] || { short: alert.tag.slice(0, 3), name: alert.tag, weight: 4 };
      return {
        label: axis.short,
        value: axis.weight / 9,
        kpi: alert.time,
        name: axis.name,
        hint: alert.title,
      };
    }),
  ];
  const kpis = axes.map((axis) =>
    `<span title="${axis.hint || axis.name}"><b>${axis.kpi}</b><em>${axis.name}</em></span>`,
  ).join('');
  return `<div class="ops-alert-radar-wrap">
    ${radarChart(axes.map((a) => a.value), axes.map((a) => a.label))}
    <div class="ops-alert-kpis">${kpis}</div>
  </div>`;
}

function shiftTrendChart(lineValues) {
  const max = Math.max(...lineValues);
  const min = Math.min(...lineValues);
  const avg = Math.round(lineValues.reduce((sum, value) => sum + value, 0) / lineValues.length);
  const points = lineValues.map((value, i) => {
    const x = 14 + i * 20;
    const y = 86 - (value / max) * 60;
    return `${x},${y}`;
  }).join(' ');
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return `<div class="overview-combo-wrap">
    <div class="overview-combo-kpis">
      <span><b>${max}</b><em>Đỉnh</em></span>
      <span><b>${avg}</b><em>Trung bình</em></span>
      <span><b>${min}</b><em>Thấp</em></span>
    </div>
    <div class="overview-combo-row overview-combo-row--trend">
      <svg class="overview-combo overview-combo--large" viewBox="0 0 148 104" aria-hidden="true">
        <g class="overview-combo__grid">
          ${[24, 38, 52, 66, 80].map((y) => `<line x1="8" y1="${y}" x2="140" y2="${y}"/>`).join('')}
          ${labels.map((label, i) => `<text x="${14 + i * 20}" y="100" text-anchor="middle">${label}</text>`).join('')}
        </g>
        <polyline class="overview-combo__line" points="${points}"/>
        ${lineValues.map((value, i) => {
    const x = 14 + i * 20;
    const y = 86 - (value / max) * 60;
    return `<circle class="overview-combo__dot" cx="${x}" cy="${y}" r="2.5"/><text class="overview-combo__point-val" x="${x}" y="${y - 7}">${value}</text>`;
  }).join('')}
      </svg>
    </div>
  </div>`;
}

export function renderOverviewLeft(d) {
  indexOpsCases(d.categories);
  return renderOpsReportDashboard(d);
}

export function renderOverviewRight(d) {
  const total = Number(d.rollup[0]?.value || 0);
  const closed = Number(d.rollup[1]?.value || 0);
  const closePct = total ? Math.round((closed / total) * 100) : 0;
  const alertDots = d.alerts.map((alert) =>
    `<button type="button" class="ops-alert-dot" title="${alert.title}" aria-label="${alert.tag}: ${alert.title}">
      <span style="background:${alert.tagColor}"></span><b>${alert.time}</b>
    </button>`,
  ).join('');
  return `
    <section class="hud-block ops-rollup ops-rollup--visual">${hudHead('Tổng hợp ca')}
      <div class="ops-rollup__visual">
        ${shiftTrendChart([22, 31, 28, 35, 48, 44, 38])}
      </div>
    </section>
    <section class="hud-block ops-rollup__alerts ops-alert-viz">${hudHead('Cảnh báo VOC')}
      ${vocAlertViz(d.alerts, closePct)}
      <div class="ops-alert-dot-row">${alertDots}</div>
      ${areaChartSvg([0.18, 0.32, 0.52, 0.48, 0.66, 0.84, 0.62, 0.54], 'overviewAlertGrad')}
    </section>`;
}

export function mountOverviewOpsBind(root) {
  const left = root?.querySelector('[data-mount="sidebar-left"]');
  if (left) bindOpsReports(left);
}
