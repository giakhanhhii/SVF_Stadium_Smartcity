import { overviewOpsReports } from './overview-ops-reports.js';

export const overviewHud = {
  left: overviewOpsReports,
  right: {
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
    rollup: [
      { label: 'Tổng yêu cầu gửi', value: '28' },
      { label: 'Đã đóng', value: '21' },
      { label: 'Đang chờ xử lý', value: '6', tone: 'warn' },
    ],
  },
};
