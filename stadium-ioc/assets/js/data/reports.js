export const reportsData = {
  banner: { title: 'Data Analytics — Báo cáo vận hành sự kiện', chips: [] },
  categories: [
    'Báo cáo trận đấu',
    'So sánh sự kiện',
    'An ninh & Đám đông',
    'Hạ tầng & Năng lượng',
    'Dịch vụ khán giả',
  ],
  rows: [
    { domain: 'An ninh', kpi: 'Thời gian phản ứng TB', actual: '3,5 phút', target: '≤ 5 phút', trend: '▲ Đạt', trendColor: '#0F6E56' },
    { domain: 'Sự kiện', kpi: 'Đúng timeline vận hành', actual: '97%', target: '≥ 95%', trend: '▲ Đạt', trendColor: '#0F6E56' },
    { domain: 'Hạ tầng', kpi: 'HVAC trong ngưỡng', actual: '94%', target: '≥ 98%', trend: '● Gần đạt', trendColor: '#854F0B' },
    { domain: 'Dịch vụ', kpi: 'SLA phản hồi khán giả', actual: '96%', target: '≥ 95%', trend: '▲ Đạt', trendColor: '#0F6E56' },
    { domain: 'Bãi đỗ', kpi: 'Thời gian tìm chỗ TB', actual: '6,2 phút', target: '≤ 8 phút', trend: '▲ Đạt', trendColor: '#0F6E56' },
  ],
  chart: { title: 'So sánh KPI — 4 trận gần nhất', peak: 'Nguồn: Stadium IOC Data Hub', canvasId: 'reportsChart', tall: true },
};
