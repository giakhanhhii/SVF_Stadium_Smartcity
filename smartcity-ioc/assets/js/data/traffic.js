export const trafficData = {
  left: {
    flow: {
      title: 'Thống kê lưu lượng',
      total: 2840,
      totalLabel: 'Xe/giờ — Ngã tư A4',
      groups: [
        { label: 'Ô tô', value: 1680, tone: 'cyan' },
        { label: 'Xe máy', value: 980, tone: 'purple' },
        { label: 'Xe buýt', value: 180, tone: 'blue' },
      ],
    },
    cameras: {
      title: 'Camera ngã tư',
      feeds: [
        { label: 'Hướng Bắc' },
        { label: 'Hướng Nam' },
        { label: 'Hướng Đông' },
        { label: 'Hướng Tây' },
        { label: 'Làn rẽ trái' },
        { label: 'Vạch sang đường' },
      ],
    },
    modeTabs: ['Giám sát trực tiếp', 'Phân tích sự cố'],
    incidents: { title: 'Sự cố hôm nay', label: 'Va chạm / ùn tắc', value: 14 },
    speedBars: {
      title: 'Phân bố tốc độ',
      subtitle: 'Tốc độ trung bình theo làn',
      bars: [
        { time: 'Làn 1', value: 9 },
        { time: 'Làn 2', value: 6 },
        { time: 'Làn 3', value: 8 },
        { time: 'Làn 4', value: 5 },
        { time: 'Moto', value: 10 },
        { time: 'Bus', value: 4 },
      ],
    },
    signals: {
      title: 'Tín hiệu đèn',
      segments: [
        { label: 'Xanh', color: '#1D9E75', pct: 45 },
        { label: 'Vàng', color: '#EF9F27', pct: 15 },
        { label: 'Đỏ', color: '#E24B4A', pct: 30 },
        { label: 'Ưu tiên', color: '#00d4ff', pct: 10 },
      ],
    },
  },
  right: {
    signals: {
      title: 'Điều khiển đèn tín hiệu',
      tabs: ['Ngã tư A4', 'Ngã tư B2'],
      online: 12,
      metrics: [
        { label: 'Chu kỳ hiện tại', value: '90s', pct: 75 },
        { label: 'Độ trễ phản hồi', value: '1,2s', pct: 20 },
      ],
    },
    congestion: {
      title: 'Mức độ ùn tắc',
      tabs: ['Trực tiếp', 'Dự báo', 'Lịch sử', 'Cảnh báo'],
      quantity: 224,
      status: 'Trung bình',
      lanes: ['Làn ưu tiên 1', 'Làn ưu tiên 2', 'Chế độ đêm'],
    },
    flow: {
      title: 'Lưu lượng 24 giờ',
      tabs: ['Lưu lượng', 'Tốc độ', 'Sự cố'],
      stats: [
        { label: 'Đỉnh cao (18h)', value: '2.840', trend: 'up', change: '12%' },
        { label: 'Trung bình ngày', value: '1.620', trend: 'up', change: '3%' },
        { label: 'Thấp nhất (03h)', value: '180', trend: 'down', change: '5%' },
        { label: 'Camera online', value: '224/230', trend: 'down', change: '2 offline' },
        { label: 'Cảm biến IoT', value: '1.842', trend: 'up', change: '0,1%' },
        { label: 'Xử lý sự cố', value: '94%', trend: 'up', change: '2%' },
      ],
      chart: [0.15, 0.12, 0.18, 0.45, 0.72, 0.68, 0.75, 0.95, 0.88, 0.65, 0.42, 0.25],
    },
    alerts: [
      { tag: 'KHẨN CẤP', tagBg: '#401818', tagColor: '#E24B4A', title: 'Va chạm — Ngã tư A4', time: '2 phút' },
      { tag: 'CẢNH BÁO', tagBg: '#3d3010', tagColor: '#BA7517', title: 'AQI vượt ngưỡng — Trạm B2', time: '8 phút' },
    ],
  },
};
