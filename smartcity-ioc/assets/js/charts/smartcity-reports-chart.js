import { chartTickFont } from './chart-font.js';

const charts = {};
const tick = chartTickFont(9);
const legendFont = chartTickFont(10);

export function initReportsChart() {
  if (charts.reportsChart) return;
  const ctx = document.getElementById('reportsChart');
  if (!ctx) return;
  charts.reportsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
      datasets: [
        { label: 'Giao thông', data: [78, 82, 80, 85], backgroundColor: '#185FA5' },
        { label: 'An ninh', data: [88, 90, 91, 92], backgroundColor: '#A32D2D' },
        { label: 'Hạ tầng', data: [80, 78, 82, 85], backgroundColor: '#1D9E75' },
        { label: 'Dịch vụ', data: [70, 72, 68, 71], backgroundColor: '#BA7517' },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: legendFont } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: tick } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, max: 100, ticks: { font: tick } },
      },
    },
  });
}
