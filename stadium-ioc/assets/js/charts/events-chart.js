import { chartTickFont } from './chart-font.js';

const charts = {};
const tick = chartTickFont(9);

export function initEventsChart() {
  if (charts.eventsChart) return;
  const ctx = document.getElementById('eventsChart');
  if (!ctx) return;
  charts.eventsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:15','19:30','20:00'],
      datasets: [{
        data: [120, 280, 520, 680, 890, 1020, 1180, 1240, 340, 180],
        borderColor: '#0F6E56',
        backgroundColor: 'rgba(15, 110, 86, 0.12)',
        fill: true, tension: 0.35, borderWidth: 1.5, pointRadius: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { ...tick }, color: '#888780' } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { ...tick }, color: '#888780' } },
      },
    },
  });
}
