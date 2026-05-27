import { getCrowdSnapshot } from './crowd-state.js';

const snap = getCrowdSnapshot();

export const overviewHud = {
  left: {
    venue: {
      title: 'Trạng thái sân PVF',
      capacity: snap.totalFormatted,
      capacityLabel: `Khán giả / ${snap.capacityFormatted} chỗ`,
      pct: snap.fillPercent,
      event: 'Trận Vòng 12 — Hiệp 2 · 67\'',
      score: '2 : 1',
    },
    roof: { title: 'Mái vòm PTFE', label: 'Trạng thái', value: 'Đã đóng', pct: 0 },
    domains: [
      {
        nav: 'security',
        icon: 'ti-shield-check',
        name: 'An ninh & Đám đông',
        badge: 'ONLINE',
        badgeTone: 'ok',
        metrics: [
          { label: 'Camera AI', value: '46/48' },
          { label: 'Cổng kiểm soát', value: '8/8' },
          { label: 'Mật độ K.B', value: '72%' },
        ],
      },
      {
        nav: 'events',
        icon: 'ti-calendar-event',
        name: 'Vận hành sự kiện',
        badge: 'LIVE',
        badgeTone: 'live',
        metrics: [
          { label: 'PA / LED', value: 'Hoạt động' },
          { label: 'Khán giả', value: snap.totalFormatted },
          { label: 'Sự kiện', value: 'Trận đấu' },
        ],
      },
      {
        nav: 'facilities',
        icon: 'ti-air-conditioning',
        name: 'Cơ sở hạ tầng',
        badge: 'ONLINE',
        badgeTone: 'ok',
        metrics: [
          { label: 'HVAC', value: 'Ổn định' },
          { label: 'Chiếu sáng', value: '100%' },
          { label: 'UPS / Điện', value: '94%' },
        ],
      },
    ],
  },
  right: {
    domains: [
      {
        nav: 'services',
        icon: 'ti-parking',
        name: 'Bãi đỗ & Giao thông',
        badge: 'CẢNH BÁO',
        badgeTone: 'warn',
        metrics: [
          { label: 'Bãi đỗ', value: '78%' },
          { label: 'Lưu lượng', value: '2.840/h' },
          { label: 'Cổng P4', value: 'Gần đầy' },
        ],
      },
      {
        nav: 'services',
        icon: 'ti-tools-kitchen-2',
        name: 'F&B & Tiện ích',
        badge: 'ONLINE',
        badgeTone: 'ok',
        metrics: [
          { label: 'Quầy F&B', value: '24/24' },
          { label: 'Doanh thu', value: '842M' },
          { label: 'SLA dịch vụ', value: '96%' },
        ],
      },
      {
        nav: 'reports',
        icon: 'ti-report-analytics',
        name: 'Báo cáo vận hành',
        badge: 'ONLINE',
        badgeTone: 'ok',
        metrics: [
          { label: 'Closed-loop', value: '97%' },
          { label: 'Phản hồi TB', value: '3,5 ph' },
          { label: 'KPI đạt', value: '11/12' },
        ],
      },
    ],
    alerts: [
      { tag: 'KHẨN CẤP', tagBg: '#401818', tagColor: '#E24B4A', title: 'Mật độ vượt ngưỡng — Khán đài B', time: '3 phút' },
      { tag: 'CẢNH BÁO', tagBg: '#3d3010', tagColor: '#BA7517', title: 'Bãi P4 gần đầy — 98%', time: '5 phút' },
      { tag: 'HẠ TẦNG', tagBg: '#0a2840', tagColor: '#00d4ff', title: 'HVAC-B tải cao 92%', time: '20 phút' },
    ],
  },
};
