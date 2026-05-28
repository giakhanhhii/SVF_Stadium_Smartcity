export const domeConfig = {
  rimY: 79.2,
  panelY: 140.4,
  panelOpenY: 140.4,
  panelClosedY: 151.4,
  trussOpenY: 143.1,
  trussClosedY: 154.0,
  panelClosedX: 116.2,
  panelOpenX: 168.2,
  ridgeOffset: 106.9,
  panelOpenTilt: 0,
  panelClosedTilt: 0,
};

/** Vòng đèn pha — ellipse khớp khán đài, lõm vào trong bowl */
export const floodRingConfig = {
  y: 75.6,
  rx: 248,
  rz: 198,
  inset: 2.2,
};

export const stadiumSceneData = {
  cameraPresets: {
    overview: { pos: [430, 170, 380], target: [0, 42, 0], fov: 58, hint: 'VOC Dashboard · PVF Stadium tổng thể' },
    exteriorLive: { pos: [480, 175, 420], target: [0, 52, 0], fov: 52, hint: 'Ngoài sân · Tổng thể sân vận động' },
    security: { pos: [0, 48, 152], target: [0, 28, 0], fov: 50, hint: 'Trong sân · Live tổng thể sân cỏ' },
    events: { pos: [0, 48, 152], target: [0, 28, 0], hint: 'Vận hành sự kiện · Sân cỏ & khán đài' },
    facilitiesOverview: { pos: [0, 300, 430], target: [0, 30, 0], fov: 60, hint: 'Hạ tầng · Tổng thể mái vòm & sân' },
    facilities: { pos: [0, 300, 430], target: [0, 30, 0], fov: 60, hint: 'Hạ tầng · Mái vòm PTFE' },
    services: { pos: [430, 170, 380], target: [0, 42, 0], fov: 58, hint: 'Dịch vụ · Bãi đỗ & lưu thông' },
    reports: { pos: [420, 185, 420], target: [0, 46, 0], fov: 58, hint: 'Báo cáo · KPI theo trận' },
  },
  markers: {
    overview: [
      { type: 'event', pos: [0, 1, 0], color: 0xef9f27, label: 'Hiệp 2' },
      { type: 'crowd', pos: [-88, 44, -58], color: 0xe24b4a, label: 'B cao' },
      { type: 'roof', pos: [0, 100, 0], color: 0xef9f27, label: 'Mái vòm' },
    ],
    security: [
      { type: 'camera', pos: [0, 16, -76], color: 0x97c459, label: 'CAM-S1' },
      { type: 'crowd', pos: [-88, 44, -58], color: 0xe24b4a, label: 'B cao' },
      { type: 'camera', pos: [100, 16, 0], color: 0x97c459, label: 'CAM-E2' },
    ],
    events: [
      { type: 'event', pos: [0, 1, 0], color: 0xef9f27, label: 'Hiệp 2' },
      { type: 'crowd', pos: [0, 48, -96], color: 0x1d9e75, label: 'Khán đài A' },
    ],
    facilities: [
      { type: 'hvac', pos: [-136, 28, -96], color: 0x1d9e75, label: 'HVAC-A' },
      { type: 'roof', pos: [0, 100, 0], color: 0xef9f27, label: 'Mái vòm' },
    ],
    services: [
      { type: 'parking', pos: [-325, 2, -229], color: 0x534ab7, label: 'P1 85%' },
      { type: 'parking', pos: [325, 2, -229], color: 0x534ab7, label: 'P2 92%' },
      { type: 'parking', pos: [325, 2, 229], color: 0xba7517, label: 'P4 98%' },
    ],
  },
};

export function getRoofStatusLabel(progress) {
  if (progress >= 0.98) return 'Đã mở';
  if (progress <= 0.02) return 'Đã đóng';
  if (progress > 0.5) return 'Đang mở';
  return 'Đang đóng';
}
