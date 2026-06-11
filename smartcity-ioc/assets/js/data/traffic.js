export const trafficData = {
  left: {
    flow: {
      title: 'Cơ cấu lưu lượng',
      groups: [
        { label: 'Ô tô', value: 1680, pct: 59, color: '#23c8ee' },
        { label: 'Xe máy', value: 980, pct: 35, color: '#69c7e8' },
        { label: 'Bus', value: 180, pct: 6, color: '#185FA5' },
      ],
      trend: {
        title: 'Xe vào khu / giờ',
        label: 'Xe vào khu / giờ',
        current: '2.840',
        labels: ['16h', '17h', '18h', '19h', '20h', 'Hiện'],
        values: [1220, 1480, 1620, 1840, 2140, 2840],
      },
    },
    cameras: {
      title: 'Camera nút A4',
      feeds: [
        { label: 'Bắc' },
        { label: 'Nam' },
        { label: 'Đông' },
        { label: 'Tây' },
        { label: 'Rẽ' },
        { label: 'Vạch' },
      ],
    },
    modeTabs: ['Live', 'Dự báo'],
    incidents: {
      title: 'Sự cố & làn',
      items: [
        { label: 'Sự cố', value: 2, tone: 'danger' },
        { label: 'Ùn tắc', value: 4, tone: 'warn' },
        { label: 'Làn mở', value: 3, tone: 'ok' },
        { label: 'Camera', value: 224, tone: 'info' },
      ],
    },
  },
  right: {
    kpiRadar: {
      title: 'Tai nạn giao thông',
      labels: ['SLA', 'Tốc', 'Đèn', 'Camera', 'Làn'],
      values: [0.88, 0.72, 0.84, 0.97, 0.76],
    },
    signals: {
      title: 'Đèn tín hiệu',
      tabs: ['A4', 'B2'],
      datasets: {
        A4: {
          label: 'Xanh',
          pct: 75,
          phase: 'Bắc – Nam đang xanh',
          remaining: 18,
          autoMode: 'Tự động thích ứng',
          metrics: [
            { label: 'Chu kỳ', value: '90s', pct: 75 },
            { label: 'Trễ', value: '1.2s', pct: 20 },
            { label: 'Ưu tiên', value: '2 làn', pct: 64 },
          ],
        },
        B2: {
          label: 'Xanh',
          pct: 62,
          phase: 'Đông – Tây đang xanh',
          remaining: 24,
          autoMode: 'Tự động ưu tiên',
          metrics: [
            { label: 'Chu kỳ', value: '74s', pct: 62 },
            { label: 'Trễ', value: '0.8s', pct: 14 },
            { label: 'Ưu tiên', value: '1 làn', pct: 42 },
          ],
        },
      },
      metrics: [
        { label: 'Chu kỳ', value: '90s', pct: 75 },
        { label: 'Trễ', value: '1.2s', pct: 20 },
        { label: 'Ưu tiên', value: '2 làn', pct: 64 },
      ],
    },
    congestion: {
      title: 'Luồng ưu tiên',
      tabs: ['Live', 'Dự báo', 'Lịch sử', 'Cảnh báo'],
      lanes: ['Làn 1', 'Làn 2', 'Đêm'],
    },
    flow: {
      title: 'Chỉ số 24h',
      tabs: ['Lưu lượng', 'Tốc độ', 'Sự cố'],
      datasets: {
        'Lưu lượng': [
          { label: 'Đỉnh 18h', value: '2.840', trend: 'up', pct: 92 },
          { label: 'TB ngày', value: '1.620', trend: 'up', pct: 68 },
          { label: 'Thấp 03h', value: '180', trend: 'down', pct: 22 },
          { label: 'Online', value: '224/230', trend: 'up', pct: 84 },
          { label: 'IoT', value: '1.842', trend: 'up', pct: 78 },
          { label: 'SLA', value: '94%', trend: 'up', pct: 94 },
        ],
        'Tốc độ': [
          { label: 'Đỉnh', value: '46km/h', trend: 'up', pct: 78 },
          { label: 'TB ngày', value: '31km/h', trend: 'up', pct: 58 },
          { label: 'Thấp', value: '12km/h', trend: 'down', pct: 26 },
          { label: 'Ổn định', value: '82%', trend: 'up', pct: 82 },
          { label: 'Trễ', value: '1.2s', trend: 'down', pct: 30 },
          { label: 'SLA', value: '91%', trend: 'up', pct: 91 },
        ],
        'Sự cố': [
          { label: 'Mở', value: '7', trend: 'down', pct: 42 },
          { label: 'Cao', value: '2', trend: 'down', pct: 28 },
          { label: 'Đã xử lý', value: '18', trend: 'up', pct: 76 },
          { label: 'Camera', value: '3', trend: 'down', pct: 36 },
          { label: 'Đèn', value: '1', trend: 'down', pct: 18 },
          { label: 'SLA', value: '89%', trend: 'up', pct: 89 },
        ],
      },
      stats: [
        { label: 'Đỉnh 18h', value: '2.840', trend: 'up', pct: 92 },
        { label: 'TB ngày', value: '1.620', trend: 'up', pct: 68 },
        { label: 'Thấp 03h', value: '180', trend: 'down', pct: 22 },
        { label: 'Online', value: '224/230', trend: 'down', pct: 84 },
        { label: 'IoT', value: '1.842', trend: 'up', pct: 78 },
        { label: 'SLA', value: '94%', trend: 'up', pct: 94 },
      ],
    },
    alerts: [
      { tag: 'A4', value: 'Va chạm', pct: 88, tone: 'danger' },
      { tag: 'B2', value: 'Ùn vừa', pct: 64, tone: 'warn' },
      { tag: 'Đèn', value: '75%', pct: 75, tone: 'ok' },
    ],
  },
};
