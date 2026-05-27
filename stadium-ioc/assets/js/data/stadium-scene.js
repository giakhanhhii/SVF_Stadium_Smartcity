export const domeConfig = {
  rimY: 79.2,
  panelY: 140.5,
  panelOpenY: 140.5,
  panelClosedY: 151.9,
  trussOpenY: 143.1,
  trussClosedY: 154.5,
  panelClosedX: 105.6,
  panelOpenX: 194.6,
  ridgeOffset: 116.7,
  panelOpenTilt: 0.23,
  panelClosedTilt: 0.18,
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
    overview: { pos: [320, 120, 280], target: [0, 44, 0], hint: 'VOC Dashboard · PVF Stadium tổng thể' },
    exteriorLive: { pos: [480, 175, 420], target: [0, 52, 0], fov: 52, hint: 'Ngoài sân · Tổng thể sân vận động' },
    security: { pos: [0, 48, 152], target: [0, 28, 0], fov: 50, hint: 'Trong sân · Live tổng thể sân cỏ' },
    events: { pos: [0, 48, 152], target: [0, 28, 0], hint: 'Vận hành sự kiện · Sân cỏ & khán đài' },
    facilities: { pos: [-280, 140, -188], target: [0, 76, 0], hint: 'Hạ tầng · Mái vòm PTFE' },
    services: { pos: [330, 76, -220], target: [0, 8, 0], hint: 'Dịch vụ · Bãi đỗ & lưu thông' },
    reports: { pos: [280, 160, 320], target: [0, 50, 0], hint: 'Báo cáo · KPI theo trận' },
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
