export const overviewData = {
  city: {
    activeResidents: '42.318',
    capacity: '60.000',
    capacityLabel: 'Cư dân hiện diện',
    flowNow: '1.247',
    flowLabel: 'Xe / giờ',
    groups: [
      { label: 'Cư dân', value: 71, color: '#00aee8' },
      { label: 'Khách', value: 12, color: '#6ec8f2' },
      { label: 'Nhân sự', value: 9, color: '#278fd0' },
      { label: 'Dịch vụ', value: 8, color: '#0b63a7' },
    ],
    badges: [
      { value: '71%', label: 'Cư trú' },
      { value: '128', label: 'Camera' },
      { value: '7', label: 'Cảnh báo' },
    ],
    flow: {
      labels: ['16h', '17h', '18h', '19h', '20h', 'Hiện'],
      values: [920, 1040, 1110, 1180, 1210, 1247],
    },
  },
  traffic: {
    routes: [
      { label: 'A4', value: '78%', tone: 'hot', nav: 'traffic' },
      { label: 'B2', value: '64%', tone: 'mid', nav: 'traffic' },
      { label: 'C1', value: 'OK', tone: 'ok', nav: 'traffic' },
    ],
    kpis: [
      { value: '128', label: 'Camera' },
      { value: '64', label: 'Đèn tín hiệu' },
      { value: '12p', label: 'Chu kỳ xanh' },
    ],
  },
  security: {
    radar: {
      labels: ['AI', 'Cổng', 'PCCC', 'Đội', 'SLA'],
      values: [0.92, 0.86, 0.78, 0.88, 0.94],
    },
    metrics: [
      { label: 'Camera AI', value: 96, meta: '96/96' },
      { label: 'Cứu hộ', value: 12, meta: '12 đội' },
      { label: 'SLA', value: 94, meta: '94%' },
    ],
    kpis: [
      { value: '96', label: 'Camera' },
      { value: '2', label: 'Ưu tiên' },
      { value: '<4p', label: 'Phản ứng' },
    ],
  },
  environment: {
    trend: {
      labels: ['S1', 'S2', 'S3', 'S4'],
      values: [82, 88, 85, 91],
    },
    metrics: [
      { label: 'Tòa nhà', value: 24, meta: '24' },
      { label: 'PCCC', value: 96, meta: '96%' },
      { label: 'Tác vụ', value: 12, meta: '12' },
    ],
    kpis: [
      { value: '24', label: 'Tòa nhà' },
      { value: '96%', label: 'PCCC' },
      { value: '12', label: 'Tác vụ' },
    ],
  },
  utilities: {
    trend: {
      labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
      values: [52, 61, 73, 79, 88, 67],
    },
    metrics: [
      { label: 'App cư dân', value: 99, meta: '99.2%' },
      { label: 'WaterPark', value: 86, meta: '64k' },
      { label: 'Phản ánh', value: 74, meta: '146' },
    ],
    kpis: [
      { value: '99.2%', label: 'QR vé' },
      { value: '64k', label: 'Lượt dùng' },
      { value: '146', label: 'Phản ánh' },
    ],
  },
  reports: {
    nodes: [
      { x: 50, y: 16, tone: 'live', label: '28', value: '28', name: 'Tổng gửi', nav: 'reports' },
      { x: 78, y: 34, tone: 'ok', label: '21', value: '21', name: 'Đã đóng', nav: 'reports' },
      { x: 70, y: 74, tone: 'warn', label: '6', value: '6', name: 'Theo dõi', nav: 'reports' },
      { x: 30, y: 74, tone: 'ok', label: '75', value: '75%', name: 'Hoàn tất', nav: 'reports' },
      { x: 22, y: 34, tone: 'warn', label: '2', value: '2', name: 'Ưu tiên', nav: 'reports' },
    ],
    kpis: [
      { value: '28', label: 'Tổng gửi' },
      { value: '21', label: 'Đã đóng' },
      { value: '2', label: 'Ưu tiên' },
    ],
  },
};
