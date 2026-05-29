const charts = {};

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
        { label: 'Môi trường', data: [80, 78, 82, 85], backgroundColor: '#1D9E75' },
        { label: 'Tiện ích', data: [70, 72, 68, 71], backgroundColor: '#BA7517' },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, max: 100, ticks: { font: { size: 9 } } },
      },
    },
  });
}
