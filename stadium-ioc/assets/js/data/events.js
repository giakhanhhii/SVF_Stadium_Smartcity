export const eventsData = {
  banner: {
    title: 'Event Operations — Vận hành sự kiện & Trận đấu',
    chips: [
      { label: 'Live Match', active: true },
      { label: 'Timeline', active: true },
      { label: 'Broadcast', active: false },
    ],
  },
  kpis: [
    { icon: 'ti-live-photo', label: 'Trạng thái trận', value: '<span style="font-size:15px">Hiệp 2 — 67\'</span>', sub: 'Tỉ số 2 : 1', accent: '#A32D2D' },
    { icon: 'ti-users', label: 'Khán giả', value: '34.812', sub: '87% sức chứa', accent: '#0F6E56' },
    { icon: 'ti-microphone', label: 'PA System', value: 'ON', sub: '3 thông báo hôm nay', accent: '#185FA5' },
    { icon: 'ti-broadcast', label: 'LED & Màn hình', value: '12', suffix: '<span style="font-size:12px;color:var(--color-text-secondary)">/12</span>', sub: 'Tất cả hoạt động', accent: '#BA7517' },
  ],
  timeline: [
    { time: '19:30', title: 'Kick-off — Trận đấu bắt đầu', desc: '34.812 khán giả • Tất cả hệ thống hoạt động' },
    { time: '20:15', title: 'Bàn thắng — Khán đài B sôi động', desc: 'Mật độ tăng • An ninh tăng cường lối 12' },
    { time: '20:45', title: 'Giải lao hiệp 1', desc: 'F&B tăng 340% • Nhà vệ sinh B3 bận' },
    { time: '21:00', title: 'Hiệp 2 bắt đầu', desc: 'PA thông báo quy định an ninh' },
    { time: '21:07', title: 'Cảnh báo mật độ — Khán đài B', desc: 'Đang xử lý • Mở cổng phụ B2', highlight: '#0F6E56' },
  ],
  miniStats: [
    { label: 'Thời gian mở cổng', value: '16:00' },
    { label: 'Kick-off', value: '19:30' },
    { label: 'Dự kiến kết thúc', value: '21:45' },
  ],
  chart: { title: 'Lưu lượng vào sân theo thời gian', peak: 'Đỉnh: 19:15 — 1.240 người/15 phút', canvasId: 'eventsChart' },
};
