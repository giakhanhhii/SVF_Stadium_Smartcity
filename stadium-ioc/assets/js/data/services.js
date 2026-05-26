export const servicesData = {
  banner: {
    title: 'Service Operations — Dịch vụ khán giả & Bãi đỗ',
    chips: [
      { label: 'Parking', active: true },
      { label: 'F&B', active: true },
      { label: 'Ticketing', active: false },
    ],
  },
  kpis: [
    { icon: 'ti-parking', label: 'Bãi đỗ xe', value: '78%', sub: '1.872 / 2.400 chỗ', accent: '#534AB7' },
    { icon: 'ti-tools-kitchen-2', label: 'F&B', value: '24', suffix: '<span style="font-size:12px;color:var(--color-text-secondary)">/24</span>', sub: 'Quầy mở — Hàng chờ TB 4 phút', accent: '#993556' },
    { icon: 'ti-ticket', label: 'Vé điện tử', value: '98,2%', sub: 'Quét thành công', accent: '#0F6E56' },
    { icon: 'ti-wifi', label: 'WiFi khán giả', value: '12.4K', sub: 'Thiết bị kết nối', accent: '#185FA5' },
  ],
  miniStats: [
    { label: 'Thời gian chờ P4', value: '8 ph', valueClass: 'color:var(--color-text-warning)' },
    { label: 'F&B doanh thu', value: '842M' },
    { label: 'Phản hồi khán giả', value: '23' },
  ],
  alerts: [
    { accent: '#BA7517', tag: 'CẢNH BÁO', tagBg: '#FAEEDA', tagColor: '#854F0B', time: '5 phút trước', title: 'Bãi P4 gần đầy — 98% sử dụng', desc: 'Đề xuất chuyển hướng sang P3 • Cập nhật biển LED' },
    { accent: '#185FA5', tag: 'PHẢN HỒI', tagBg: '#E6F1FB', tagColor: '#185FA5', time: '18 phút trước', title: 'Nhà vệ sinh B3 — Hàng chờ dài', desc: 'Khán giả báo qua app • Nhân viên vệ sinh đã cử thêm' },
    { accent: '#0F6E56', tag: 'XỬ LÝ XONG', tagBg: '#E1F5EE', tagColor: '#0F6E56', time: '35 phút trước', title: 'Quầy F&B C12 — Hết nước — Đã bổ sung', desc: 'Thời gian xử lý: 12 phút' },
  ],
};
