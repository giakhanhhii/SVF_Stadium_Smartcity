import { getCrowdSnapshot } from './crowd-state.js';
import { getCrowdFillLevel } from './crowd-fill-level.js';

const snap = getCrowdSnapshot();
const fill = getCrowdFillLevel(snap.fillPercent);

export const eventsData = {
  banner: {
    title: 'Event Operations — Vận hành sự kiện',
    chips: [
      { label: 'Mật độ khán giả', active: true },
      { label: 'Timeline', active: true },
      { label: 'Broadcast', active: false },
    ],
  },
  kpis: [
    {
      icon: 'ti-users',
      label: 'Lấp đầy sân',
      value: `<span class="text-metric-sm" style="color:${fill.color}">${snap.fillPercent}%</span>`,
      sub: fill.label,
      accent: fill.color,
    },
    { icon: 'ti-users-group', label: 'Khán giả', value: snap.totalFormatted, sub: `${snap.fillPercent}% sức chứa`, accent: '#0F6E56' },
    { icon: 'ti-microphone', label: 'PA System', value: 'ON', sub: '3 thông báo hôm nay', accent: '#185FA5' },
    { icon: 'ti-broadcast', label: 'LED & Màn hình', value: '12', suffix: '<span class="text-secondary">/12</span>', sub: 'Tất cả hoạt động', accent: '#BA7517' },
  ],
  timeline: [
    { time: '19:30', title: 'Mở sự kiện — Khán giả vào sân', desc: `${snap.totalFormatted} khán giả • Hệ thống hoạt động` },
    { time: '20:15', title: 'Mật độ tăng — Khán đài B', desc: '87% toàn sân • An ninh tăng cường lối 12' },
    { time: '20:45', title: 'Giải lao', desc: 'F&B tăng 340% • Nhà vệ sinh B3 bận' },
    { time: '21:07', title: 'Cảnh báo quá tải — Khán đài B', desc: '92% khu vực • Mở cổng phụ B2', highlight: '#E24B4A' },
  ],
  miniStats: [
    { label: 'Thời gian mở cổng', value: '16:00' },
    { label: 'Bắt đầu chương trình', value: '19:30' },
    { label: 'Dự kiến kết thúc', value: '21:45' },
  ],
  chart: { title: 'Lưu lượng vào sân theo thời gian', peak: 'Đỉnh: 19:15 — 1.240 người/15 phút', canvasId: 'eventsChart' },
};
