import { chartTickFont } from './chart-font.js';

const charts = {};
const tick = chartTickFont(9);

function initPipeStabilityChart() {
  if (charts.pipeStabilityChart) return;
  const ctx = document.getElementById('pipeStabilityChart');
  if (!ctx) return;
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 130);
  gradient.addColorStop(0, 'rgba(0, 212, 255, 0.34)');
  gradient.addColorStop(1, 'rgba(24, 95, 165, 0.04)');
  charts.pipeStabilityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      datasets: [{
        data: [94.1, 95.2, 93.4, 95.8, 96.9, 96.2, 96.4],
        borderColor: '#00d4ff',
        backgroundColor: gradient,
        pointBackgroundColor: '#185FA5',
        fill: true, tension: 0.4, borderWidth: 1.8, pointRadius: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (item) => `${item.formattedValue}% ổn định` } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: tick, color: '#7fa9cf' } },
        y: { min: 88, max: 100, grid: { color: 'rgba(0, 132, 209, 0.12)' }, ticks: { font: tick, color: '#7fa9cf', callback: (value) => `${value}%` } },
      },
    },
  });
}

export function initEnvChart() {
  initPipeStabilityChart();
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
