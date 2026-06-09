export const reportsData = {
  banner: { title: 'Decision Analytics & Reports — Báo cáo & Hỗ trợ quyết định', chips: [] },
  kpis: [
    { icon: 'ti-file-analytics', label: 'Báo cáo đã tạo', value: '24', sub: 'Tuần này', accent: '#185FA5' },
    { icon: 'ti-circle-check', label: 'Closed-loop Resolution Rate', value: '94', suffix: '<span style="font-size:12px;font-weight:400">%</span>', sub: 'SLA đạt mục tiêu', accent: '#1D9E75' },
    { icon: 'ti-building-community', label: 'Sự kiện liên ban', value: '156', sub: '6 phân hệ tham gia', accent: '#534AB7' },
    { icon: 'ti-chart-arrows', label: 'KPI vượt ngưỡng', value: '8', sub: 'Cần báo cáo lãnh đạo', accent: '#BA7517' },
  ],
  categories: [
    { icon: 'ti-report', label: 'Báo cáo vận hành hàng ngày', suffix: '<i class="ti ti-download" style="color:var(--color-text-info)"></i>' },
    { icon: 'ti-chart-line', label: 'Phân tích KPI đa lĩnh vực', suffix: '<i class="ti ti-download" style="color:var(--color-text-info)"></i>' },
    { icon: 'ti-alert-circle', label: 'Tổng hợp sự cố & cảnh báo', suffix: '<i class="ti ti-download" style="color:var(--color-text-info)"></i>' },
    { icon: 'ti-building-estate', label: 'Báo cáo hạ tầng tuần', suffix: '<i class="ti ti-download" style="color:var(--color-text-info)"></i>' },
    { icon: 'ti-presentation', label: 'Slide trình lãnh đạo', suffix: '<i class="ti ti-download" style="color:var(--color-text-info)"></i>' },
  ],
  rows: [
    { domain: 'Giao thông', kpi: 'Thời gian di chuyển TB', actual: '28 phút', target: '≤ 30 phút', trend: '▲ Đạt', trendColor: '#1D9E75' },
    { domain: 'An ninh', kpi: 'Thời gian phản ứng', actual: '8,2 phút', target: '≤ 10 phút', trend: '▲ Đạt', trendColor: '#1D9E75' },
    { domain: 'Hạ tầng', kpi: 'Tình trạng cảm biến', actual: '85%', target: '≥ 80%', trend: '▲ Đạt', trendColor: '#1D9E75' },
    { domain: 'Dịch vụ', kpi: 'Đèn LED hoạt động', actual: '99,3%', target: '≥ 99,5%', trend: '▼ Chưa đạt', trendColor: '#A32D2D' },
    { domain: 'Dịch vụ cư dân', kpi: 'SLA phản hồi', actual: '94%', target: '≥ 95%', trend: '● Gần đạt', trendColor: '#854F0B' },
  ],
  chart: { title: 'Chỉ số vận hành tổng hợp — 4 tuần', peak: 'Nguồn: City IOC Data Hub', canvasId: 'reportsChart', tall: true },
};
