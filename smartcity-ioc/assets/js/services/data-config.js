// Cấu hình nguồn dữ liệu IOC Smart City. Đổi provider ở ĐÂY là đủ —
// không cần sửa bất kỳ file render/hydration nào (seam Phase 6).
//   'mock'   — dữ liệu tĩnh trong assets/js/data/*.js (mặc định, chạy offline)
//   'rest'   — fetch(`${restBaseUrl}/${domain}`) trả JSON cùng shape với mock
//   'stream' — snapshot đầu qua REST, sau đó nhận cập nhật qua WebSocket
export const dataConfig = {
  provider: 'mock',
  restBaseUrl: '/api',
  streamUrl: `ws://${typeof location !== 'undefined' ? location.host : 'localhost:3457'}/stream`,
};
