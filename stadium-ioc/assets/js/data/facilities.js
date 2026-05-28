export const facilitiesData = {
  banner: {
    title: 'Facilities Operations — Vận hành cơ sở hạ tầng',
    chips: [
      { label: 'HVAC', active: true },
      { label: 'Lighting', active: true },
      { label: 'Elevator', active: false },
    ],
  },
  kpis: [
    { icon: 'ti-temperature', label: 'Nhiệt độ TB', value: '24°C', sub: 'Mục tiêu: 22–26°C', accent: '#0F6E56' },
    { icon: 'ti-bulb', label: 'Chiếu sáng sân', value: '100%', sub: '1.200 lux — Đạt chuẩn', accent: '#185FA5' },
    { icon: 'ti-elevator', label: 'Thang máy', value: '14', suffix: '<span class="text-secondary">/16</span>', sub: '2 bảo trì', accent: '#BA7517' },
    { icon: 'ti-droplet', label: 'Cấp thoát nước', value: 'OK', sub: 'Áp suất ổn định', accent: '#534AB7' },
  ],
  panels: [
    { icon: 'ti-air-conditioning', title: 'HVAC — Khán đài A', badge: 'Ổn định', badgeClass: 'badge-online', detail: 'Nhiệt độ: 23°C • Độ ẩm: 55%', load: 78 },
    { icon: 'ti-air-conditioning', title: 'HVAC — Khán đài B', badge: 'Cao tải', badgeClass: 'badge-warn', detail: 'Nhiệt độ: 26°C • Độ ẩm: 62%', load: 92, loadColor: '#BA7517', loadNote: 'Tải hệ thống: 92%', loadNoteClass: 'color:var(--color-text-warning)' },
    { icon: 'ti-bulb', title: 'Chiếu sáng sân cỏ', badge: 'ON', badgeClass: 'badge-online', detail: '1.200 lux • 48 đèn floodlight', load: 100 },
    { icon: 'ti-bolt', title: 'Nguồn điện dự phòng', badge: 'Sẵn sàng', badgeClass: 'badge-online', detail: 'UPS: 100% • Generator: Standby', load: 100 },
  ],
  alerts: [
    { accent: '#BA7517', tag: 'CẢNH BÁO', tagBg: '#FAEEDA', tagColor: '#854F0B', time: '20 phút trước', title: 'HVAC Khán đài B — Tải cao 92%', desc: 'Đề xuất tăng công suất • Kỹ thuật viên đã thông báo' },
    { accent: '#185FA5', tag: 'THÔNG TIN', tagBg: '#E6F1FB', tagColor: '#185FA5', time: '1 giờ trước', title: 'Thang máy TM-3, TM-7 — Bảo trì định kỳ', desc: 'Dự kiến hoàn thành sau trận đấu' },
  ],
};
