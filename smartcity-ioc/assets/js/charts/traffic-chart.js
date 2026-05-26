const charts = {};

export function initTrafficChart() {
  if (charts.trafficChart) return;
  const ctx = document.getElementById('trafficChart');
  if (!ctx) return;
  charts.trafficChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['00','02','04','06','08','10','12','14','16','18','20','22'],
      datasets: [{
        data: [320, 180, 240, 920, 2180, 1680, 1820, 1540, 1980, 2840, 2120, 980],
        borderColor: '#185FA5',
        backgroundColor: 'rgba(24, 95, 165, 0.12)',
        fill: true, tension: 0.35, borderWidth: 1.5, pointRadius: 0,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#888780' } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 9 }, color: '#888780' } },
      },
    },
  });
}
