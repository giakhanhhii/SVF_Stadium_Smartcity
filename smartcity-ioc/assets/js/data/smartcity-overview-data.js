export const overviewData = {
  vitals: [
    { label: 'An toàn công cộng', value: '92', valueColor: '#1D9E75', status: '● Ổn định', statusColor: '#1D9E75' },
    { label: 'Giao thông', value: '78', valueColor: '#185FA5', status: '● Hơi tắc', statusColor: '#854F0B' },
    { label: 'Môi trường', value: '85', valueColor: '#1D9E75', status: '● Khá tốt', statusColor: '#1D9E75' },
    { label: 'Tiện ích', value: '71', valueColor: '#BA7517', status: '● 3 cảnh báo', statusColor: '#854F0B' },
    { label: 'Dịch vụ cư dân', value: '88', valueColor: '#1D9E75', status: '● SLA 94%', statusColor: '#1D9E75' },
    { label: 'Sự kiện đang xử lý', value: '7', valueColor: '#A32D2D', status: '2 ưu tiên cao', statusColor: '#A32D2D' },
  ],
  kpis: [
    { icon: 'ti-users', label: 'Dân cư đang hoạt động', value: '42.318', delta: '▲ 2.4% so với hôm qua', deltaColor: 'var(--color-text-success)', accent: '#185FA5' },
    { icon: 'ti-car', label: 'Lưu lượng giao thông', value: '1.247<span style="font-size:11px;color:var(--color-text-secondary);font-weight:400"> xe/h</span>', delta: '● Mức bình thường', deltaColor: 'var(--color-text-warning)', accent: '#1D9E75' },
    { icon: 'ti-leaf', label: 'Chỉ số AQI', value: '68<span style="font-size:11px;color:var(--color-text-secondary);font-weight:400"> — Trung bình</span>', delta: '▼ 5 điểm', deltaColor: 'var(--color-text-success)', accent: '#BA7517' },
    { icon: 'ti-alert-triangle', label: 'Cảnh báo đang mở', value: '7', delta: '2 ưu tiên cao', deltaColor: 'var(--color-text-danger)', accent: '#A32D2D' },
  ],
  modules: [
    { nav: 'traffic', icon: 'ti-traffic-lights', iconBg: '#E6F1FB', iconColor: '#185FA5', badge: 'ONLINE', badgeClass: 'badge-online', name: 'Giao thông', meta: '128 camera • 64 đèn tín hiệu' },
    { nav: 'security', icon: 'ti-shield-check', iconBg: '#FCEBEB', iconColor: '#A32D2D', badge: 'ONLINE', badgeClass: 'badge-online', name: 'An ninh — Cứu hộ', meta: '96 camera AI • 12 đội ứng phó' },
    { nav: 'environment', icon: 'ti-tree', iconBg: '#E1F5EE', iconColor: '#0F6E56', badge: 'ONLINE', badgeClass: 'badge-online', name: 'Môi trường', meta: '42 trạm quan trắc • AQI, nước, ồn' },
    { nav: 'utilities', icon: 'ti-bolt', iconBg: '#FAEEDA', iconColor: '#854F0B', badge: 'CẢNH BÁO', badgeClass: 'badge-warn', name: 'Năng lượng — Chiếu sáng', meta: '3.840 đèn LED • 18 trạm điện' },
    { nav: 'utilities', icon: 'ti-droplet', iconBg: '#EEEDFE', iconColor: '#534AB7', badge: 'ONLINE', badgeClass: 'badge-online', name: 'Cấp thoát nước', meta: '24 trạm bơm • 156 cảm biến' },
    { nav: 'utilities', icon: 'ti-headset', iconBg: '#FBEAF0', iconColor: '#993556', badge: 'ONLINE', badgeClass: 'badge-online', name: 'Dịch vụ cư dân', meta: 'Phản ánh • Tổng đài • Tiện ích' },
    { href: '../stadium-ioc/stadium-index.html', icon: 'ti-ball-football', iconBg: '#E1F5EE', iconColor: '#0F6E56', badge: 'ONLINE', badgeClass: 'badge-online', name: 'Sân vận động', meta: 'Trung tâm điều hành sự kiện • 48 camera • 40.000 chỗ', linkText: 'Chuyển sang IOC Sân vận động →', borderStyle: 'border-color:#0F6E56' },
  ],
};
