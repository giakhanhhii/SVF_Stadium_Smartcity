export const securityData = {
  banner: {
    title: 'Security Situation Awareness — An ninh & Kiểm soát đám đông',
    chips: [
      { label: 'Video AI', active: true },
      { label: 'GIS', active: true },
      { label: 'Access Control', active: true },
    ],
  },
  kpis: [
    { icon: 'ti-camera', label: 'Camera trực tuyến', value: '46', suffix: '<span style="font-size:12px;color:var(--color-text-secondary)">/48</span>', sub: '2 offline — Khán đài B', accent: '#A32D2D' },
    { icon: 'ti-users', label: 'Mật độ đám đông TB', value: '4,2', suffix: '<span style="font-size:12px;font-weight:400"> ng/m²</span>', sub: 'Khu B: 6,1 ng/m²', subClass: 'color:var(--color-text-warning)', accent: '#BA7517' },
    { icon: 'ti-door', label: 'Cổng kiểm soát', value: '8', suffix: '<span style="font-size:12px;color:var(--color-text-secondary)">/8</span>', sub: 'Tất cả hoạt động', accent: '#185FA5' },
    { icon: 'ti-clock', label: 'Thời gian phản ứng', value: '3,5', suffix: '<span style="font-size:12px;font-weight:400"> phút</span>', sub: '▼ 0,8 phút', subClass: 'color:var(--color-text-success)', accent: '#0F6E56' },
  ],
  severity: [
    { label: 'Khẩn cấp', count: 1, bg: '#FCEBEB', color: '#A32D2D' },
    { label: 'Cảnh báo', count: 2, bg: '#FAEEDA', color: '#854F0B' },
    { label: 'Thông tin', count: 1, bg: '#E6F1FB', color: '#185FA5' },
  ],
  alerts: [
    { danger: true, accent: '#A32D2D', tag: 'KHẨN CẤP', tagBg: '#FCEBEB', tagColor: '#A32D2D', time: '3 phút trước', title: 'Mật độ vượt ngưỡng — Khán đài B, lối 12', desc: '6,1 ng/m² • Đội an ninh #02 đang điều phối • Mở cổng phụ B2' },
    { accent: '#BA7517', tag: 'CẢNH BÁO', tagBg: '#FAEEDA', tagColor: '#854F0B', time: '12 phút trước', title: 'Vật thể lạ — Khu hậu trường C', desc: 'Camera AI phát hiện • Nhân viên kiểm tra' },
    { accent: '#0F6E56', tag: 'XỬ LÝ XONG', tagBg: '#E1F5EE', tagColor: '#0F6E56', time: '28 phút trước', title: 'Tranh cãi nhỏ — Cổng A — Đã giải quyết', desc: 'Thời gian xử lý: 5 phút' },
  ],
};
