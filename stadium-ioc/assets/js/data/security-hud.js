export const securityHud = {
  left: {
    crowd: {
      title: 'Mật độ đám đông',
      total: 34812,
      totalLabel: 'Khán giả hiện tại',
      groups: [
        { label: 'Khán đài A', value: 9200, tone: 'cyan' },
        { label: 'Khán đài B', value: 9800, tone: 'purple' },
        { label: 'Khán đài C', value: 8500, tone: 'blue' },
      ],
    },
    cameras: {
      title: 'Camera sân PVF',
      feeds: [
        { label: 'Sân cỏ CAM-S1' },
        { label: 'Cổng A' },
        { label: 'Khán đài B' },
        { label: 'Khu VIP' },
        { label: 'Hậu trường C' },
        { label: 'Quảng trường' },
      ],
    },
    modeTabs: ['Giám sát trực tiếp', 'Phân tích AI'],
    gates: { title: 'Cổng kiểm soát', label: 'Hoạt động / Tổng', value: '8/8' },
    densityBars: {
      title: 'Mật độ theo khán đài',
      subtitle: 'người/m² — cập nhật 5s',
      bars: [
        { time: 'A', value: 8 },
        { time: 'B', value: 10 },
        { time: 'C', value: 7 },
        { time: 'VIP', value: 5 },
        { time: 'Plaza', value: 4 },
        { time: 'P4', value: 9 },
      ],
    },
  },
  right: {
    access: {
      title: 'Kiểm soát ra vào',
      tabs: ['Cổng chính', 'Cổng phụ'],
      metrics: [
        { label: 'Vé quét thành công', value: '98,2%', pct: 98 },
        { label: 'Từ chối / nghi vấn', value: '142', pct: 12 },
      ],
    },
    zones: {
      title: 'Vùng cảnh báo',
      tabs: ['Trực tiếp', 'Dự báo', 'Lịch sử'],
      quantity: 46,
      status: 'Khán đài B',
      lanes: ['Mở cổng B2', 'Tăng tuần tra', 'PA thông báo'],
    },
    response: {
      title: 'Phản ứng an ninh 24h',
      tabs: ['Sự cố', 'Tuần tra', 'VIP'],
      stats: [
        { label: 'Thời gian phản ứng TB', value: '3,5 ph', trend: 'down', change: '0,8 ph' },
        { label: 'Camera online', value: '46/48', trend: 'down', change: '2 offline' },
        { label: 'Cảnh báo khẩn', value: '1', trend: 'up', change: 'B-12' },
        { label: 'Đội tuần tra', value: '12/12', trend: 'up', change: 'Sẵn sàng' },
      ],
      chart: [0.2, 0.15, 0.35, 0.55, 0.72, 0.68, 0.85, 0.92, 0.78, 0.45, 0.3, 0.22],
    },
    alerts: [
      { tag: 'KHẨN CẤP', tagBg: '#401818', tagColor: '#E24B4A', title: 'Mật độ vượt ngưỡng — Khán đài B', time: '3 phút' },
      { tag: 'CẢNH BÁO', tagBg: '#3d3010', tagColor: '#BA7517', title: 'Vật thể lạ — Hậu trường C', time: '12 phút' },
      { tag: 'XỬ LÝ', tagBg: '#0a3028', tagColor: '#1D9E75', title: 'Tranh cãi cổng A — Đã giải quyết', time: '28 phút' },
    ],
  },
};
