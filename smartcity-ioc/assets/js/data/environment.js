export const environmentData = {
  banner: {
    title: 'Infrastructure Monitoring — Hạ tầng đô thị',
    chips: [
      { label: 'AQI', active: true },
      { label: 'Nước', active: true },
      { label: 'Tiếng ồn', active: true },
    ],
  },
  kpis: [
    { icon: 'ti-leaf', label: 'AQI trung bình', value: '68', sub: 'Mức trung bình · ▼ 5 điểm', accent: '#1D9E75' },
    { icon: 'ti-droplet', label: 'Chất lượng nước', value: '96', suffix: '<span style="font-size:12px;font-weight:400">%</span>', sub: 'Đạt chuẩn', subClass: 'color:var(--color-text-success)', accent: '#185FA5' },
    { icon: 'ti-volume-2', label: 'Vùng vượt ngưỡng ồn', value: '12', sub: '/ 42 trạm', accent: '#BA7517' },
    { icon: 'ti-antenna', label: 'Trạm online', value: '41', suffix: '<span style="font-size:12px;color:var(--color-text-secondary)">/42</span>', sub: 'Trạm E3 bảo trì', accent: '#185FA5' },
  ],
  miniStats: [
    { label: 'PM2.5 TB', value: '38<span style="font-size:10px;color:var(--color-text-secondary)"> μg/m³</span>' },
    { label: 'Nhiệt độ', value: '31°C' },
    { label: 'Độ ẩm', value: '72%' },
  ],
  stations: [
    { accent: '#A32D2D', name: 'Trạm B2 — Khu công nghiệp', score: 'AQI 142', scoreColor: '#A32D2D', metrics: ['PM2.5: 82', 'Ồn: 68 dB', 'Vượt ngưỡng'] },
    { accent: '#BA7517', name: 'Trạm C5 — Trung tâm', score: 'AQI 78', scoreColor: '#854F0B', metrics: ['PM2.5: 45', 'Ồn: 55 dB', 'Nước: OK'] },
    { accent: '#1D9E75', name: 'Trạm A1 — Công viên', score: 'AQI 42', scoreColor: '#0F6E56', metrics: ['PM2.5: 18', 'Ồn: 42 dB', 'Tốt'] },
    { accent: '#1D9E75', name: 'Trạm D4 — Ven sông', score: 'AQI 55', scoreColor: '#0F6E56', metrics: ['pH: 7.2', 'DO: 6.8', 'Nước đạt'] },
  ],
  chart: { title: 'Xu hướng AQI — 7 ngày qua', peak: 'Cao nhất: T4 — 82', canvasId: 'envChart', tall: true },
};
