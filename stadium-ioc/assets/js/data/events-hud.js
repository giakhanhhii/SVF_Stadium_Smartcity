import { getCrowdSnapshot } from './crowd-state.js';

const snap = getCrowdSnapshot();

export const eventsHud = {
  left: {
    match: {
      title: 'Trạng thái trận đấu',
      total: 67,
      totalLabel: 'Phút — Hiệp 2',
      groups: [
        { label: 'Bàn thắng H', value: 2, tone: 'cyan' },
        { label: 'Bàn thắng A', value: 1, tone: 'purple' },
        { label: 'Thẻ vàng', value: 3, tone: 'blue' },
      ],
    },
    broadcast: {
      title: 'Hệ thống phát sóng',
      feeds: [
        { label: 'LED chính' },
        { label: 'Màn hình A' },
        { label: 'Màn hình B' },
        { label: 'PA System' },
        { label: 'OB Van' },
        { label: 'Streaming' },
      ],
    },
    modeTabs: ['Trực tiếp', 'Trước trận'],
    attendance: {
      title: 'Khán giả',
      label: `Sức chứa ${snap.capacityFormatted}`,
      value: `${snap.fillPercent}%`,
    },
    entryBars: {
      title: 'Lưu lượng vào sân',
      subtitle: 'người/15 phút',
      bars: [
        { time: '16h', value: 4 },
        { time: '17h', value: 7 },
        { time: '18h', value: 9 },
        { time: '19h', value: 10 },
        { time: '19:30', value: 6 },
        { time: 'HT', value: 3 },
      ],
    },
  },
  right: {
    pa: {
      title: 'Điều khiển PA & LED',
      tabs: ['PA', 'LED Score'],
      metrics: [
        { label: 'PA System', value: 'ON', pct: 100 },
        { label: 'LED Scoreboard', value: '12/12', pct: 100 },
      ],
    },
    timeline: {
      title: 'Mốc vận hành',
      tabs: ['Trực tiếp', 'Trước trận', 'Sau trận'],
      quantity: 5,
      status: 'Kick-off 19:30',
      lanes: ['Thông báo giải lao', 'Cảnh báo an ninh', 'Tạm dừng PA'],
    },
    ops: {
      title: 'Chỉ số vận hành sự kiện',
      tabs: ['Khán giả', 'F&B', 'An ninh'],
      stats: [
        { label: 'Khán giả hiện tại', value: snap.totalFormatted, trend: 'up', change: `${snap.fillPercent}%` },
        { label: 'Thời gian mở cổng', value: '16:00', trend: 'up', change: 'Đúng KH' },
        { label: 'Kick-off', value: '19:30', trend: 'up', change: 'Đúng giờ' },
        { label: 'Dự kiến kết thúc', value: '21:45', trend: 'up', change: '+2 ph' },
      ],
      chart: [0.1, 0.25, 0.45, 0.72, 0.95, 0.88, 0.65, 0.55, 0.48, 0.42, 0.38, 0.35],
    },
    alerts: [
      { tag: 'SỰ KIỆN', tagBg: '#0a2840', tagColor: '#00d4ff', title: 'Bàn thắng — Khán đài B sôi động', time: '8 phút' },
      { tag: 'CẢNH BÁO', tagBg: '#3d3010', tagColor: '#BA7517', title: 'Mật độ tăng — Mở cổng phụ B2', time: '15 phút' },
      { tag: 'THÔNG TIN', tagBg: '#0a3028', tagColor: '#1D9E75', title: 'Giải lao hiệp 1 — F&B tăng 340%', time: '22 phút' },
    ],
  },
};
