export const domeConfig = {
  rimY: 30,
  panelY: 73.6,
  panelSlide: 42,
  panelRestX: 22,
};

export const stadiumSceneData = {
  cameraPresets: {
    overview: { pos: [148, 58, 125], target: [0, 22, 0], hint: 'VOC Dashboard · PVF Stadium tổng thể' },
    security: { pos: [68, 26, 62], target: [0, 16, -18], hint: 'Giám sát an ninh · Camera & đám đông' },
    events: { pos: [0, 22, 72], target: [0, 14, 0], hint: 'Vận hành sự kiện · Sân cỏ & khán đài' },
    facilities: { pos: [-132, 68, -88], target: [0, 38, 0], hint: 'Hạ tầng · Mái vòm PTFE' },
    services: { pos: [155, 38, -105], target: [0, 4, 0], hint: 'Dịch vụ · Bãi đỗ & lưu thông' },
  },
  markers: {
    overview: [
      { type: 'event', pos: [0, 1, 0], color: 0xef9f27, label: 'Hiệp 2' },
      { type: 'crowd', pos: [-42, 22, -28], color: 0xe24b4a, label: 'B cao' },
      { type: 'roof', pos: [0, 48, 0], color: 0xef9f27, label: 'Mái vòm' },
    ],
    security: [
      { type: 'camera', pos: [0, 8, -38], color: 0x97c459, label: 'CAM-S1' },
      { type: 'crowd', pos: [-42, 22, -28], color: 0xe24b4a, label: 'B cao' },
      { type: 'camera', pos: [48, 8, 0], color: 0x97c459, label: 'CAM-E2' },
    ],
    events: [
      { type: 'event', pos: [0, 1, 0], color: 0xef9f27, label: 'Hiệp 2' },
      { type: 'crowd', pos: [0, 24, -48], color: 0x1d9e75, label: 'Khán đài A' },
    ],
    facilities: [
      { type: 'hvac', pos: [-68, 14, -48], color: 0x1d9e75, label: 'HVAC-A' },
      { type: 'roof', pos: [0, 48, 0], color: 0xef9f27, label: 'Mái vòm' },
    ],
    services: [
      { type: 'parking', pos: [-145, 2, -95], color: 0x534ab7, label: 'P1 85%' },
      { type: 'parking', pos: [145, 2, -95], color: 0x534ab7, label: 'P2 92%' },
      { type: 'parking', pos: [145, 2, 95], color: 0xba7517, label: 'P4 98%' },
    ],
  },
};

export function getRoofStatusLabel(progress) {
  if (progress >= 0.98) return 'Đã mở';
  if (progress <= 0.02) return 'Đã đóng';
  if (progress > 0.5) return 'Đang mở';
  return 'Đang đóng';
}
