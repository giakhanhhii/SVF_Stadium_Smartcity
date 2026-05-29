import { getCrowdSnapshot } from './crowd-state.js';

const snap = getCrowdSnapshot();

export const securityHud = {
  left: {
    crowd: {
      title: 'Mật độ đám đông',
      total: snap.total,
      totalLabel: 'Khán giả hiện tại',
      fillPercent: snap.fillPercent,
      groups: snap.groups,
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
    modeViews: {
      live: {
        statTitle: 'Cổng kiểm soát',
        icon: 'ti-door',
        label: 'Hoạt động / Tổng',
        value: '8/8',
        chartTitle: 'Mật độ theo khán đài',
        subtitle: 'người/m² — cập nhật 5s',
        bars: snap.sectors.map((s) => ({
          time: s.label.replace('Khán đài ', ''),
          value: Math.round(4 + s.fillPercent * 0.08),
        })),
      },
      ai: {
        statTitle: 'Phân tích AI',
        icon: 'ti-brain',
        label: 'Sự kiện nghi vấn',
        value: '6',
        chartTitle: 'Rủi ro theo khu vực',
        subtitle: 'điểm rủi ro — dự báo 10 phút',
        bars: [
          { time: 'A', value: 42 },
          { time: 'B', value: 86 },
          { time: 'C', value: 55 },
          { time: 'D', value: 61 },
          { time: 'VIP', value: 28 },
          { time: 'Cổng', value: 72 },
        ],
      },
    },
  },
  right: {
    access: {
      title: 'Kiểm soát ra vào',
      tabs: ['Cổng chính', 'Cổng phụ'],
      views: {
        main: {
          ringPct: 98,
          ringLabel: 'Vé OK',
          metrics: [
            { label: 'Vé quét thành công', value: '98,2%', pct: 98 },
            { label: 'Từ chối / nghi vấn', value: '142', pct: 12 },
          ],
        },
        secondary: {
          ringPct: 91,
          ringLabel: 'Cổng phụ',
          metrics: [
            { label: 'Cổng phụ mở', value: '2/3', pct: 67 },
            { label: 'Hàng chờ TB', value: '6 ph', pct: 54 },
          ],
        },
      },
    },
    zones: {
      title: 'Vùng cảnh báo',
      tabs: ['Trực tiếp', 'Dự báo', 'Lịch sử'],
      views: {
        live: { quantity: 46, status: 'Khán đài B', lanes: ['Mở cổng B2', 'Tăng tuần tra', 'PA thông báo'] },
        forecast: { quantity: 8, status: 'B-12 sau 10 phút', lanes: ['Giảm mật độ B', 'Điều tiết C1', 'Theo dõi heatmap'] },
        history: { quantity: 23, status: '3 điểm lặp lại', lanes: ['Xem ca trước', 'So sánh heatmap', 'Xuất biên bản'] },
      },
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
      { tag: 'KHẨN CẤP', label: 'Khẩn cấp', tagBg: '#401818', tagColor: '#E24B4A', title: 'Mật độ vượt ngưỡng — Khán đài B', time: '3 phút' },
      { tag: 'CẢNH BÁO', label: 'Cảnh báo', tagBg: '#3d3010', tagColor: '#BA7517', title: 'Vật thể lạ — Hậu trường C', time: '12 phút' },
      { tag: 'XỬ LÝ', label: 'Xử lý', tagBg: '#0a3020', tagColor: '#1D9E75', title: 'Tranh cãi cổng A — Đã giải quyết', time: '28 phút' },
    ],
  },
};
