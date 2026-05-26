export const facilitiesHud = {
  left: {
    env: {
      title: 'Môi trường trong sân',
      total: 24,
      totalLabel: 'Nhiệt độ TB (°C)',
      groups: [
        { label: 'Khán đài A', value: 23, tone: 'cyan' },
        { label: 'Khán đài B', value: 26, tone: 'purple' },
        { label: 'Sân cỏ', value: 22, tone: 'blue' },
      ],
    },
    systems: {
      title: 'Hệ thống kỹ thuật',
      feeds: [
        { label: 'HVAC-A' },
        { label: 'HVAC-B' },
        { label: 'Floodlight' },
        { label: 'UPS/Gen' },
        { label: 'Thang máy' },
        { label: 'Mái vòm PTFE' },
      ],
    },
    modeTabs: ['Giám sát', 'Điều khiển mái'],
    roof: { title: 'Mái vòm PTFE', label: 'Trạng thái', value: 'Đang mở' },
    loadBars: {
      title: 'Tải hệ thống',
      subtitle: '% công suất — realtime',
      bars: [
        { time: 'HVAC', value: 9 },
        { time: 'Đèn', value: 10 },
        { time: 'UPS', value: 6 },
        { time: 'Mái', value: 4 },
        { time: 'Nước', value: 5 },
        { time: 'Thang', value: 7 },
      ],
    },
  },
  right: {
    roofCtrl: {
      title: 'Điều khiển mái vòm',
      tabs: ['Mở', 'Đóng'],
      metrics: [
        { label: 'Tiến trình', value: '100%', pct: 100 },
        { label: 'Thời gian còn lại', value: '0 ph', pct: 5 },
      ],
    },
    hvac: {
      title: 'HVAC & Chiếu sáng',
      tabs: ['HVAC', 'Đèn sân', 'Thang máy', 'Cảnh báo'],
      quantity: 48,
      status: 'HVAC-B cao tải',
      lanes: ['Mở mái', 'Đóng mái', 'Dừng khẩn cấp'],
    },
    infra: {
      title: 'Chỉ số hạ tầng 24h',
      tabs: ['Nhiệt độ', 'Điện', 'Nước'],
      stats: [
        { label: 'Nhiệt độ TB', value: '24°C', trend: 'up', change: 'Trong ngưỡng' },
        { label: 'Chiếu sáng sân', value: '1200 lux', trend: 'up', change: '100%' },
        { label: 'Thang máy', value: '14/16', trend: 'down', change: '2 bảo trì' },
        { label: 'Mái vòm', value: 'Mở', trend: 'up', change: '12–20 ph' },
      ],
      chart: [0.55, 0.58, 0.62, 0.68, 0.72, 0.75, 0.78, 0.82, 0.85, 0.8, 0.72, 0.65],
    },
    alerts: [
      { tag: 'CẢNH BÁO', tagBg: '#3d3010', tagColor: '#BA7517', title: 'HVAC Khán đài B — Tải 92%', time: '20 phút' },
      { tag: 'THÔNG TIN', tagBg: '#0a2840', tagColor: '#00d4ff', title: 'Mái vòm mở hoàn toàn — 14 phút', time: '45 phút' },
      { tag: 'BẢO TRÌ', tagBg: '#0a3028', tagColor: '#1D9E75', title: 'TM-3, TM-7 — Sau trận', time: '1 giờ' },
    ],
  },
};
