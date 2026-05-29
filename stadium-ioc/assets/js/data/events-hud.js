import { getCrowdSnapshot } from './crowd-state.js';
import { getCrowdFillLevel } from './crowd-fill-level.js';

const snap = getCrowdSnapshot();
const venueFill = getCrowdFillLevel(snap.fillPercent);

export const eventsHud = {
  left: {
    crowd: {
      title: 'Mật độ khán giả',
      totalLabel: 'Lấp đầy toàn sân',
      fillPercent: snap.fillPercent,
      fillTone: venueFill.tone,
      fillLabel: venueFill.label,
      fillColor: venueFill.color,
      capacityLabel: `Sức chứa ${snap.capacityFormatted}`,
      totalFormatted: snap.totalFormatted,
      sectors: snap.sectors.map((s) => {
        const pct = s.id === 'south' ? 92 : s.fillPercent;
        const level = getCrowdFillLevel(pct);
        return { label: s.label, pct, tone: level.tone, color: level.color };
      }),
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
    modeTabs: ['Trực tiếp', 'Theo khán đài'],
    attendanceViews: {
      live: {
        title: 'Khán giả trong sân',
        label: `Sức chứa ${snap.capacityFormatted}`,
        value: `${snap.fillPercent}%`,
        tone: venueFill.tone,
        barsTitle: 'Lưu lượng vào sân',
        barsSubtitle: 'người/15 phút',
        bars: [
          { time: '16h', value: 4 },
          { time: '17h', value: 7 },
          { time: '18h', value: 9 },
          { time: '19h', value: 10 },
          { time: '19:30', value: 6 },
          { time: 'HT', value: 3 },
        ],
      },
      stands: {
        title: 'Theo khán đài',
        label: 'Khu đông nhất: Khán đài B',
        value: '92%',
        tone: 'danger',
        barsTitle: 'Lấp đầy theo khán đài',
        barsSubtitle: '% sức chứa',
        bars: [
          { time: 'A', value: 82 },
          { time: 'B', value: 92 },
          { time: 'C', value: 78 },
          { time: 'D', value: 84 },
          { time: 'VIP', value: 66 },
          { time: 'Nam', value: 88 },
        ],
      },
    },
  },
  right: {
    stampede: {
      active: true,
      zone: 'Khán đài B — Lối 12',
      pct: 92,
    },
    pa: {
      title: 'Điều khiển PA & LED',
      tabs: ['PA', 'LED Info'],
      views: {
        pa: {
          ringPct: 100,
          ringLabel: 'PA ON',
          metrics: [
            { label: 'PA System', value: 'ON', pct: 100 },
            { label: 'Vùng phủ âm thanh', value: '8/8', pct: 100 },
          ],
        },
        led: {
          ringPct: 100,
          ringLabel: 'LED OK',
          metrics: [
            { label: 'LED chính', value: '4/4', pct: 100 },
            { label: 'Màn hình phụ', value: '8/8', pct: 100 },
          ],
        },
      },
    },
    timeline: {
      title: 'Mốc vận hành',
      status: 'Giải lao — F&B cao điểm',
      lanes: ['Thông báo giải lao', 'Cảnh báo an ninh', 'Tạm dừng PA'],
    },
    ops: {
      title: 'Chỉ số vận hành sự kiện',
      stats: [
        { label: 'Khán giả hiện tại', value: snap.totalFormatted, trend: 'up', change: `${snap.fillPercent}%` },
        { label: 'Khu đông nhất', value: 'Khán đài B', trend: 'up', change: '92%' },
        { label: 'Cổng phụ đã mở', value: 'B2, C1', trend: 'up', change: '2 cổng' },
        { label: 'PA hôm nay', value: '3', trend: 'up', change: 'thông báo' },
      ],
      chart: [0.1, 0.25, 0.45, 0.72, 0.95, 0.88, 0.65, 0.55, 0.48, 0.42, 0.38, 0.35],
    },
    alerts: [
      { tag: 'KHẨN', tagBg: '#401818', tagColor: '#E24B4A', title: 'Nguy cơ dẫm đạp — Khán đài B lối 12', time: '2 phút' },
      { tag: 'CẢNH BÁO', tagBg: '#3d3010', tagColor: '#BA7517', title: 'Mật độ 92% — Mở cổng phụ B2', time: '8 phút' },
      { tag: 'THÔNG TIN', tagBg: '#0a3028', tagColor: '#1D9E75', title: 'Giải lao — F&B tăng 340%', time: '22 phút' },
    ],
  },
};
