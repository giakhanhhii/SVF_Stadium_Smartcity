import { chartTickFont } from './chart-font.js';

const charts = {};
const tick = chartTickFont(9);

export function initEnvChart() {
  if (charts.envChart) return;
  const ctx = document.getElementById('envChart');
  if (!ctx) return;
  charts.envChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['T2','T3','T4','T5','T6','T7','CN'],
      datasets: [{
        data: [72, 68, 82, 75, 70, 65, 68],
        borderColor: '#1D9E75',
        backgroundColor: 'rgba(29, 158, 117, 0.12)',
        fill: true, tension: 0.35, borderWidth: 1.5, pointRadius: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: tick, color: '#888780' } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: tick, color: '#888780' } },
      },
    },
  });
}
