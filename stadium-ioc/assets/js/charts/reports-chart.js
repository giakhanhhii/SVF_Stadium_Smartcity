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
      labels: ['Trận 9', 'Trận 10', 'Trận 11', 'Trận 12'],
      datasets: [
        { label: 'An ninh', data: [92, 94, 95, 96], backgroundColor: '#A32D2D' },
        { label: 'Sự kiện', data: [94, 95, 96, 97], backgroundColor: '#0F6E56' },
        { label: 'Hạ tầng', data: [96, 95, 93, 94], backgroundColor: '#185FA5' },
        { label: 'Dịch vụ', data: [91, 93, 95, 96], backgroundColor: '#534AB7' },
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
