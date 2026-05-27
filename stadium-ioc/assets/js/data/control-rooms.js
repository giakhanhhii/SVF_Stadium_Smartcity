/** Vị trí khớp 4 bãi đỗ + 1 phòng mới (công thức generate-stadium-glb.mjs) */
const ROOM_X = 700;
const ROOM_Z = 585;
const ROOM_Z_FAR = 690;

export const SCREEN_VIEWS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'security', label: 'An ninh' },
  { id: 'events', label: 'Sự kiện' },
  { id: 'facilities', label: 'Cơ sở hạ tầng' },
  { id: 'services', label: 'Dịch vụ' },
  { id: 'reports', label: 'Báo cáo' },
];

export const CONTROL_ROOMS = [
  {
    id: 'overview-reports',
    label: 'Tổng quan & Báo cáo',
    badge: 'VOC',
    accent: '#00d4ff',
    pos: [-ROOM_X, ROOM_Z],
    utilities: ['Trạng thái sân', 'KPI trận', 'Xuất báo cáo', 'PA System'],
  },
  {
    id: 'security',
    label: 'An ninh',
    badge: 'SEC',
    accent: '#97c459',
    pos: [ROOM_X, ROOM_Z],
    building: { profile: 'tower', height: 56, width: 148, depth: 108 },
    utilities: ['Camera wall', 'Cảnh báo', 'Khóa cổng', 'Đám đông'],
  },
  {
    id: 'events',
    label: 'Sự kiện',
    badge: 'EVT',
    accent: '#ef9f27',
    pos: [-ROOM_X, -ROOM_Z],
    utilities: ['Timeline', 'Sân cỏ', 'Khán giả', 'Live score'],
  },
  {
    id: 'facilities',
    label: 'Cơ sở hạ tầng',
    badge: 'INF',
    accent: '#1d9e75',
    pos: [ROOM_X, -ROOM_Z],
    utilities: ['Mái vòm', 'HVAC', 'Điện UPS', 'BMS'],
  },
  {
    id: 'services',
    label: 'Dịch vụ',
    badge: 'SVC',
    accent: '#534ab7',
    pos: [0, -ROOM_Z_FAR],
    utilities: ['Bãi đỗ', 'F&B', 'Nhà vệ sinh', 'Lưu thông'],
  },
];

export function getRoomById(id) {
  return CONTROL_ROOMS.find((r) => r.id === id);
}
