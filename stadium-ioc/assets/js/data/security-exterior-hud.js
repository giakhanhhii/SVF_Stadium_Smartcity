export const securityExteriorHud = {
  left: {
    ingress: {
      title: 'Lưu lượng vào sân',
      total: 1842,
      totalLabel: 'Khách/giờ — cổng ngoài',
      groups: [
        { label: 'Cổng A', value: 512, tone: 'cyan' },
        { label: 'Cổng B', value: 628, tone: 'purple' },
        { label: 'Cổng C', value: 402, tone: 'blue' },
        { label: 'VIP', value: 300, tone: 'green' },
      ],
    },
    cameras: {
      title: 'Camera ngoại vi',
      feeds: [
        { label: 'Quảng trường' },
        { label: 'Bãi P1' },
        { label: 'Bãi P2' },
        { label: 'Bãi P4' },
        { label: 'Đường vào A' },
        { label: 'Hàng rào B' },
      ],
    },
    modeTabs: ['Perimeter', 'Giao thông'],
    modeViews: {
      perimeter: {
        statTitle: 'Chu vi an ninh',
        icon: 'ti-shield',
        label: 'Camera / Sensor',
        value: '32/32',
        chartTitle: 'Hàng chờ cổng ngoài',
        subtitle: 'phút — cập nhật 10s',
        bars: [
          { time: 'A', value: 4 },
          { time: 'B', value: 7 },
          { time: 'C', value: 3 },
          { time: 'VIP', value: 2 },
          { time: 'P1', value: 5 },
          { time: 'P4', value: 9 },
        ],
      },
      traffic: {
        statTitle: 'Giao thông ngoại vi',
        icon: 'ti-traffic-lights',
        label: 'Điểm ùn tắc',
        value: '2',
        chartTitle: 'Tải phương tiện',
        subtitle: 'xe/phút — theo trục',
        bars: [
          { time: 'A', value: 32 },
          { time: 'B', value: 46 },
          { time: 'C', value: 25 },
          { time: 'P1', value: 38 },
          { time: 'P3', value: 21 },
          { time: 'P4', value: 58 },
        ],
      },
    },
  },
  right: {
    parking: {
      title: 'Bãi đỗ & phương tiện',
      tabs: ['Bãi đỗ', 'Xe bus', 'Taxi'],
      views: {
        parking: {
          ringPct: 78,
          ringLabel: 'Bãi đỗ',
          metrics: [
            { label: 'Tổng sử dụng', value: '78%', pct: 78 },
            { label: 'P4 gần đầy', value: '98%', pct: 98 },
          ],
        },
        bus: {
          ringPct: 90,
          ringLabel: 'Bus',
          metrics: [
            { label: 'Shuttle hoạt động', value: '18/20', pct: 90 },
            { label: 'Chờ trung bình', value: '5 ph', pct: 42 },
          ],
        },
        taxi: {
          ringPct: 64,
          ringLabel: 'Taxi',
          metrics: [
            { label: 'Làn taxi mở', value: '3/4', pct: 75 },
            { label: 'Xe đang chờ', value: '64', pct: 64 },
          ],
        },
      },
    },
    patrol: {
      title: 'Tuần tra chu vi',
      tabs: ['Trực tiếp', 'Lịch trình', 'Drone'],
      quantity: 12,
      status: 'Khu B — P4',
      lanes: ['Tăng tuần tra B', 'Mở làn P3', 'Cập nhật LED'],
    },
    traffic: {
      title: 'Giao thông 24h',
      tabs: ['Vào', 'Ra', 'Sau trận'],
      stats: [
        { label: 'Xe vào/giờ', value: '420', trend: 'up', change: '+12%' },
        { label: 'Tắc điểm nóng', value: '2', trend: 'down', change: 'P4, B' },
        { label: 'Bus shuttle', value: '18/20', trend: 'up', change: 'Hoạt động' },
        { label: 'Thời gian ra TB', value: '18 ph', trend: 'down', change: '−3 ph' },
      ],
      chart: [0.15, 0.22, 0.38, 0.62, 0.88, 0.95, 0.82, 0.68, 0.55, 0.42, 0.28, 0.18],
    },
    alerts: [
      { tag: 'CẢNH BÁO', label: 'Cảnh báo', tagBg: '#3d3010', tagColor: '#BA7517', title: 'Bãi P4 gần đầy — 98%', time: '5 phút' },
      { tag: 'GIAO THÔNG', label: 'Giao thông', tagBg: '#0a2840', tagColor: '#00d4ff', title: 'Tắc cổng B — Hàng chờ 7 phút', time: '8 phút' },
      { tag: 'NGOẠI VI', label: 'Ngoại vi', tagBg: '#1a1840', tagColor: '#534AB7', title: 'Xe dừng bất thường — Đường vào A', time: '14 phút' },
    ],
  },
};

export const SECURITY_LEGEND = {
  interior: [
    { color: '#97C459', label: 'Camera' },
    { color: '#E24B4A', label: 'Đám đông' },
    { color: '#EF9F27', label: 'Cảnh báo' },
    { color: '#534AB7', label: 'VIP' },
  ],
  exterior: [
    { color: '#97C459', label: 'Camera ngoại vi' },
    { color: '#534AB7', label: 'Bãi đỗ' },
    { color: '#EF9F27', label: 'Giao thông' },
    { color: '#00d4ff', label: 'Ngoại vi' },
  ],
};
