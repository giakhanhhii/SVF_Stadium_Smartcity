export function renderChartSection({ title, peak, canvasId, tall = false }) {
  return `
    <div class="chart-section">
      <div class="chart-header">
        <div class="chart-title">${title}</div>
        <span class="chart-peak">${peak}</span>
      </div>
      <div class="chart-wrap${tall ? ' tall' : ''}"><canvas id="${canvasId}"></canvas></div>
    </div>`;
}
