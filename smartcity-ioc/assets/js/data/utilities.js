export const utilitiesData = {
  banner: {
    title: 'Urban Public Utilities — Tiện ích & Hạ tầng đô thị',
    chips: [
      { label: 'Điện', active: true },
      { label: 'Chiếu sáng', active: true },
      { label: 'Cấp nước', active: true },
      { label: 'Cư dân', active: false },
    ],
  },
  kpis: [
    { icon: 'ti-bolt', label: 'Tải lưới điện', value: '74', suffix: '<span style="font-size:12px;font-weight:400">%</span>', sub: '18 trạm biến áp', accent: '#854F0B' },
    { icon: 'ti-bulb', label: 'Đèn LED hoạt động', value: '3.812', suffix: '<span style="font-size:12px;color:var(--color-text-secondary)">/3840</span>', sub: '28 đèn lỗi', subClass: 'color:var(--color-text-danger)', accent: '#BA7517' },
    { icon: 'ti-droplet', label: 'Trạm bơm online', value: '23', suffix: '<span style="font-size:12px;color:var(--color-text-secondary)">/24</span>', sub: '#07 cảnh báo áp suất', accent: '#185FA5' },
    { icon: 'ti-headset', label: 'Phản ánh cư dân', value: '47', sub: '12 đang xử lý', accent: '#993556' },
  ],
};
