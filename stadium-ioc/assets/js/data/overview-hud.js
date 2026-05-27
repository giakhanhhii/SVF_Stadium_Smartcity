import { getCrowdSnapshot } from './crowd-state.js';

const snap = getCrowdSnapshot();

export const overviewHud = {
  left: {
    venue: {
      title: 'Trạng thái sân PVF',
      capacity: snap.totalFormatted,
      capacityLabel: `Khán giả / ${snap.capacityFormatted} chỗ`,
      pct: snap.fillPercent,
      event: "Trận Vòng 12 - Hiệp 2 - 67'",
      score: '2 : 1',
    },
    roof: {
      title: 'Mái vòm PTFE',
      label: 'Trạng thái',
      value: 'Đã đóng',
      pct: 0,
    },
    domains: [
      {
        nav: 'security',
        icon: 'ti-shield-check',
        name: 'An ninh VOC',
        badge: 'ONLINE',
        badgeTone: 'ok',
        metrics: [
          { label: 'CCTV', value: '46/48' },
          { label: 'Kiểm soát vào', value: '8/8' },
          { label: 'Khán đài B', value: '72%' },
        ],
      },
      {
        nav: 'events',
        icon: 'ti-speakerphone',
        name: 'PA / Broadcast',
        badge: 'ACTIVE',
        badgeTone: 'live',
        metrics: [
          { label: 'PA / Voice', value: 'Sẵn sàng' },
          { label: 'LED / IPTV', value: 'Đồng bộ' },
          { label: 'Livestream', value: 'On-air' },
        ],
      },
      {
        nav: 'facilities',
        icon: 'ti-air-conditioning',
        name: 'Kỹ thuật công trình',
        badge: 'ONLINE',
        badgeTone: 'ok',
        metrics: [
          { label: 'HVAC', value: 'Ổn định' },
          { label: 'Điện dự phòng', value: '94%' },
          { label: 'Chiếu sáng', value: '100%' },
        ],
      },
    ],
  },
  right: {
    domains: [
      {
        nav: 'services',
        icon: 'ti-parking',
        name: 'Kiểm soát cổng & luồng',
        badge: 'WATCH',
        badgeTone: 'warn',
        metrics: [
          { label: 'Gate A/B', value: '8/8 mở' },
          { label: 'Lưu lượng', value: '2.840/h' },
          { label: 'P4 buffer', value: 'Cao' },
        ],
      },
      {
        nav: 'services',
        icon: 'ti-first-aid-kit',
        name: 'Y tế / Cứu hỏa',
        badge: 'ONLINE',
        badgeTone: 'ok',
        metrics: [
          { label: 'Medical post', value: '3/3' },
          { label: 'Fire panel', value: 'Normal' },
          { label: 'EMS standby', value: '2 đội' },
        ],
      },
      {
        nav: 'reports',
        icon: 'ti-report-analytics',
        name: 'Incident & Báo cáo',
        badge: 'ONLINE',
        badgeTone: 'ok',
        metrics: [
          { label: 'Incident log', value: '04 mở' },
          { label: 'Response TB', value: '3,5 ph' },
          { label: 'Closed-loop', value: '97%' },
        ],
      },
    ],
    alerts: [
      {
        tag: 'INCIDENT',
        tagBg: '#401818',
        tagColor: '#E24B4A',
        title: 'Mật độ vượt ngưỡng - Khán đài B',
        time: '3 phút',
      },
      {
        tag: 'ACCESS',
        tagBg: '#3d3010',
        tagColor: '#BA7517',
        title: 'Gate P4 cần điều tiết xe vào',
        time: '5 phút',
      },
      {
        tag: 'ENGINEERING',
        tagBg: '#0a2840',
        tagColor: '#00d4ff',
        title: 'HVAC-B tải cao 92%',
        time: '20 phút',
      },
    ],
  },
};
