export const overviewData = {
  vitals: [
    { label: 'Sức chứa hiện tại', value: '87%', valueColor: '#0F6E56', status: '34.800 / 40.000', statusColor: '#854F0B' },
    { label: 'Mái vòm PTFE', value: 'MỞ', valueColor: '#EF9F27', status: '● 100% · Sẵn sàng', statusColor: '#0F6E56' },
    { label: 'Mật độ đám đông', value: '72', valueColor: '#BA7517', status: '● Khu B cao', statusColor: '#854F0B' },
    { label: 'Cơ sở hạ tầng', value: '94', valueColor: '#0F6E56', status: '● HVAC ổn định', statusColor: '#0F6E56' },
    { label: 'Dịch vụ khán giả', value: '91', valueColor: '#0F6E56', status: '● SLA 96%', statusColor: '#0F6E56' },
    { label: 'Cảnh báo đang mở', value: '4', valueColor: '#A32D2D', status: '1 ưu tiên cao', statusColor: '#A32D2D' },
  ],
  kpis: [
    { icon: 'ti-users', label: 'Khán giả trong sân', value: '34.812', delta: '▲ 12% so với trận trước', deltaColor: 'var(--color-text-success)', accent: '#0F6E56' },
    { icon: 'ti-door-enter', label: 'Lưu lượng vào/ra', value: '2.840<span style="font-size:11px;color:var(--color-text-secondary);font-weight:400"> người/h</span>', delta: '● Cổng A, C bận', deltaColor: 'var(--color-text-warning)', accent: '#185FA5' },
    { icon: 'ti-temperature', label: 'Nhiệt độ sân', value: '24°C<span style="font-size:11px;color:var(--color-text-secondary);font-weight:400"> — Bình thường</span>', delta: 'Độ ẩm 58%', deltaColor: 'var(--color-text-success)', accent: '#BA7517' },
    { icon: 'ti-alert-triangle', label: 'Sự cố đang xử lý', value: '4', delta: '1 khẩn cấp — Khu VIP', deltaColor: 'var(--color-text-danger)', accent: '#A32D2D' },
  ],
  modules: [
    { nav: 'security', icon: 'ti-shield-check', iconBg: '#FCEBEB', iconColor: '#A32D2D', badge: 'ONLINE', badgeClass: 'badge-online', name: 'An ninh & Đám đông', meta: '48 camera AI • 8 cổng kiểm soát' },
    { nav: 'events', icon: 'ti-calendar-event', iconBg: '#FAEEDA', iconColor: '#854F0B', badge: 'LIVE', badgeClass: 'badge-live', name: 'Vận hành sự kiện', meta: 'Trận đấu • Lễ hội • Biểu diễn' },
    { nav: 'facilities', icon: 'ti-air-conditioning', iconBg: '#E6F1FB', iconColor: '#185FA5', badge: 'ONLINE', badgeClass: 'badge-online', name: 'Cơ sở hạ tầng', meta: 'HVAC • Chiếu sáng • Thang máy' },
    { nav: 'services', icon: 'ti-parking', iconBg: '#EEEDFE', iconColor: '#534AB7', badge: 'CẢNH BÁO', badgeClass: 'badge-warn', name: 'Bãi đỗ & Giao thông', meta: '2.400 chỗ • 78% đã sử dụng' },
    { nav: 'services', icon: 'ti-tools-kitchen-2', iconBg: '#FBEAF0', iconColor: '#993556', badge: 'ONLINE', badgeClass: 'badge-online', name: 'F&B & Tiện ích', meta: '24 quầy • 6 nhà vệ sinh thông minh' },
    { nav: 'reports', icon: 'ti-report-analytics', iconBg: '#E1F5EE', iconColor: '#0F6E56', badge: 'ONLINE', badgeClass: 'badge-online', name: 'Báo cáo vận hành', meta: 'KPI sự kiện • So sánh trận đấu' },
  ],
};
