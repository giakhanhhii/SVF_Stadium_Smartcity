export const overviewHud = {
  left: {
    venue: {
      title: 'Trạng thái sân PVF',
      capacity: '34.812',
      capacityLabel: 'Khán giả / 60.000 chỗ',
      pct: 87,
      event: 'Trận Vòng 12 — Hiệp 2 · 67\'',
      score: '2 : 1',
    },
    systems: [
      { label: 'Camera AI', value: '46/48', tone: 'cyan' },
      { label: 'Cổng kiểm soát', value: '8/8', tone: 'blue' },
      { label: 'HVAC', value: 'Ổn định', tone: 'purple' },
    ],
    roof: { title: 'Mái vòm PTFE', label: 'Trạng thái', value: 'Đã đóng', pct: 0 },
  },
  right: {
    alerts: [
      { tag: 'KHẨN CẤP', tagBg: '#401818', tagColor: '#E24B4A', title: 'Mật độ vượt ngưỡng — Khán đài B', time: '3 phút' },
      { tag: 'CẢNH BÁO', tagBg: '#3d3010', tagColor: '#BA7517', title: 'Bãi P4 gần đầy — 98%', time: '5 phút' },
      { tag: 'HẠ TẦNG', tagBg: '#0a2840', tagColor: '#00d4ff', title: 'HVAC-B tải cao 92%', time: '20 phút' },
    ],
    ops: [
      { label: 'Thời gian phản ứng', value: '3,5 ph' },
      { label: 'Closed-loop', value: '97%' },
      { label: 'F&B doanh thu', value: '842M' },
      { label: 'Bãi đỗ xe', value: '78%' },
    ],
  },
};
