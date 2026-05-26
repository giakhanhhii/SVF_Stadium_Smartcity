export const servicesHud = {
  left: {
    parking: {
      title: 'Bãi đỗ xe',
      total: 78,
      totalLabel: '% sử dụng — 2.400 chỗ',
      groups: [
        { label: 'P1', value: 85, tone: 'cyan' },
        { label: 'P2', value: 92, tone: 'purple' },
        { label: 'P4', value: 98, tone: 'blue' },
      ],
    },
    services: {
      title: 'Điểm dịch vụ',
      feeds: [
        { label: 'Bãi P1' },
        { label: 'Bãi P2' },
        { label: 'Bãi P3' },
        { label: 'Bãi P4' },
        { label: 'F&B C12' },
        { label: 'Quầy vé' },
      ],
    },
    modeTabs: ['Bãi đỗ', 'F&B & WC'],
    tickets: { title: 'Vé điện tử', label: 'Quét thành công', value: '98,2%' },
    queueBars: {
      title: 'Thời gian chờ TB',
      subtitle: 'phút — theo khu vực',
      bars: [
        { time: 'P1', value: 3 },
        { time: 'P2', value: 5 },
        { time: 'P3', value: 4 },
        { time: 'P4', value: 8 },
        { time: 'F&B', value: 4 },
        { time: 'WC', value: 6 },
      ],
    },
  },
  right: {
    fb: {
      title: 'F&B & Tiện ích',
      tabs: ['F&B', 'WC', 'WiFi'],
      metrics: [
        { label: 'Quầy mở', value: '24/24', pct: 100 },
        { label: 'Hàng chờ TB', value: '4 ph', pct: 35 },
      ],
    },
    traffic: {
      title: 'Lưu thông quanh sân',
      tabs: ['Trực tiếp', 'Dự báo', 'Sau trận'],
      quantity: 4,
      status: 'P4 gần đầy',
      lanes: ['Chuyển P3', 'Cập nhật LED', 'Mở làn phụ'],
    },
    revenue: {
      title: 'Dịch vụ khán giả 24h',
      tabs: ['Doanh thu', 'Phản hồi', 'WiFi'],
      stats: [
        { label: 'Bãi đỗ sử dụng', value: '78%', trend: 'up', change: '1.872 xe' },
        { label: 'F&B doanh thu', value: '842M', trend: 'up', change: '+18%' },
        { label: 'WiFi thiết bị', value: '12.4K', trend: 'up', change: 'Ổn định' },
        { label: 'Phản hồi app', value: '23', trend: 'down', change: '3 mới' },
      ],
      chart: [0.12, 0.18, 0.35, 0.55, 0.72, 0.85, 0.92, 0.88, 0.75, 0.55, 0.35, 0.2],
    },
    alerts: [
      { tag: 'CẢNH BÁO', tagBg: '#3d3010', tagColor: '#BA7517', title: 'Bãi P4 gần đầy — 98%', time: '5 phút' },
      { tag: 'PHẢN HỒI', tagBg: '#0a2840', tagColor: '#00d4ff', title: 'WC B3 — Hàng chờ dài', time: '18 phút' },
      { tag: 'XỬ LÝ', tagBg: '#0a3028', tagColor: '#1D9E75', title: 'F&B C12 hết nước — Đã bổ sung', time: '35 phút' },
    ],
  },
};
