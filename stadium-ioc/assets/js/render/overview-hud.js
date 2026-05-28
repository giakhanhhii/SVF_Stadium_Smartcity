import { hudHead, renderAlerts } from './hud-charts.js';
import {
  renderOpsReportDashboard, indexOpsCases, bindOpsReports,
} from './ops-report.js';

export function renderOverviewLeft(d) {
  indexOpsCases(d.categories);
  return renderOpsReportDashboard(d);
}

export function renderOverviewRight(d) {
  const rollup = d.rollup.map((r) =>
    `<div class="ops-rollup__row${r.tone ? ` ops-rollup__row--${r.tone}` : ''}">
      <span>${r.label}</span><strong>${r.value}</strong>
    </div>`,
  ).join('');
  return `
    <section class="hud-block ops-rollup">${hudHead('Tổng hợp ca')}
      <div class="ops-rollup__grid">${rollup}</div>
      <div class="hud-sub">Chọn case chưa xử lý ở panel trái để báo lại hoặc khiển trách</div>
    </section>
    <section class="hud-block hud-block--alerts ops-rollup__alerts">${hudHead('Cảnh báo VOC')}${renderAlerts(d.alerts)}</section>`;
}

export function mountOverviewOpsBind(root) {
  const left = root?.querySelector('[data-mount="sidebar-left"]');
  if (left) bindOpsReports(left);
}
