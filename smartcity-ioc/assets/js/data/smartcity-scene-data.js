import { buildingSceneData } from './building-scene.js';
import { trafficSceneData } from './traffic-scene.js';

const buildingPositionOverrides = {
  A1: [-11.5, 0, -10.5],
  B2: [-7, 0, -12.4],
  B3: [8.8, 0, -11.2],
  C2: [12.2, 0, 8.6],
  D7: [-13, 0, 14],
};

const buildingCameraPositions = {
  Camera17: [-10.8, 17.5, -9.5],
  Camera22: [-6.2, 13.5, -11.5],
  Camera08: [-12.1, 10.5, 14.8],
  Camera31: [12.9, 9.5, 9.5],
  Camera05: [9.6, 15.5, -10.4],
  Camera12: [-6.2, 12, -9.9],
};

const extraBuildings = [
  { id: 'E1', label: 'T6', name: 'Tháp Bắc Tây', pos: [-24, 0, -13], size: [4.4, 12, 4.2], color: '#eef1f5', accent: '#185FA5', roof: true },
  { id: 'E2', label: 'T7', name: 'Tháp Bắc Đông', pos: [24, 0, -13], size: [4.8, 15, 4.2], color: '#eef1f5', accent: '#1D9E75', roof: true },
  { id: 'E3', label: 'T8', name: 'Khối Nam Tây', pos: [-24, 0, 13], size: [5.2, 9, 4.5], color: '#f0f2f5', accent: '#EF9F27', roof: true },
  { id: 'E4', label: 'T9', name: 'Khối Nam Đông', pos: [24, 0, 13], size: [5.2, 11, 4.5], color: '#f0f2f5', accent: '#85B7EB', roof: true },
  { id: 'E5', label: 'T10', name: 'Trung tâm dịch vụ', pos: [31, 0, 25], size: [6.2, 8, 5.2], color: '#eef1f5', accent: '#E24B4A', roof: true },
];

export const smartcitySceneData = {
  cameraPresets: {
    overview: { pos: [24, 26, 34], target: [0, 3, 0], fov: 42, hint: 'Tổng quan thành phố' },
    traffic: { pos: [18, 16, 18], target: [0, 1.2, 0], fov: 38, hint: 'Theo dõi giao thông' },
    security: { pos: [10, 18, 16], target: [4, 8, -3], fov: 36, hint: 'Camera an ninh và đội xử lý' },
    environment: { pos: [-18, 15, 16], target: [-7, 2, 5], fov: 40, hint: 'Cảm biến môi trường' },
    utilities: { pos: [18, 14, -18], target: [8, 2, -8], fov: 38, hint: 'Hạ tầng tiện ích' },
    reports: { pos: [0, 34, 38], target: [0, 2, 0], fov: 48, hint: 'Báo cáo tổng hợp' },
  },
  roads: [
    { id: 'road-main-ew', pos: [0, 0, 0], size: [72, 8.8], rotation: 0, type: 'primary' },
    { id: 'road-main-ns', pos: [0, 0, 0], size: [8.8, 72], rotation: 0, type: 'primary' },
  ],
  intersections: [
    { id: 'A4', pos: [0, 0, 0], label: 'Ngã tư A4' },
  ],
  buildings: [
    ...buildingSceneData.buildings.map((building) => ({
      ...building,
      pos: buildingPositionOverrides[building.id] || building.pos,
    })),
    ...extraBuildings,
  ],
  skyline: [],
  skybridges: [],
  trees: [
    [-14, -7], [-10, -7], [-5.6, -8.8],
    [6.2, -7.2], [11.8, -8.6], [14.5, -13.2],
    [-14, 7.2], [-11.5, 10.5], [-7.2, 11.6],
    [6.2, 10.8], [8.4, 14.2], [14.5, 12.8],
    [-24, -6.5], [-25, 7.5], [24, -7.5], [25, 8.5],
  ],
  grassPatches: buildingSceneData.grassPatches,
  water: { pos: [-18, 0, 25], size: [10, 7], label: 'Hồ cảnh quan' },
  park: { pos: [-18, 0, 25], size: [16, 12], label: 'Công viên ven hồ' },
  parkBenches: [
    { id: 'bench-lake-01', pos: [-24.4, 0, 24.4], rot: Math.PI / 2, label: 'Ghế nghỉ ven hồ' },
    { id: 'bench-lake-02', pos: [-18, 0, 30.2], rot: Math.PI, label: 'Ghế công viên' },
    { id: 'bench-lake-03', pos: [-11.6, 0, 25.4], rot: -Math.PI / 2, label: 'Ghế ngắm hồ' },
  ],
  vehicles: [
    ...trafficSceneData.vehicles.map((v, i) => ({
      ...v,
      id: `veh-${i + 1}`,
      group: 'traffic',
      min: -34,
      max: 34,
      stopRange: 4.8,
    })),
    { id: 'veh-10', type: 'car', color: '#e24b4a', x: -2.2, z: -31, rot: 0, axis: 'z', speed: 0.05, min: -34, max: 34, group: 'traffic', stopRange: 4.8 },
    { id: 'veh-11', type: 'car', color: '#ffffff', x: 2.2, z: 30, rot: Math.PI, axis: 'z', speed: 0.046, min: -34, max: 34, group: 'traffic', stopRange: 4.8 },
    { id: 'veh-12', type: 'bus', color: '#f0b429', x: -31, z: 2.2, rot: Math.PI / 2, axis: 'x', speed: 0.034, min: -34, max: 34, group: 'traffic', stopRange: 4.8 },
    { id: 'veh-13', type: 'car', color: '#1f2937', x: 31, z: -2.2, rot: -Math.PI / 2, axis: 'x', speed: 0.044, min: -34, max: 34, group: 'traffic', stopRange: 4.8 },
    { id: 'veh-14', type: 'moto', color: '#2a2a2a', x: -28, z: -2.2, rot: Math.PI / 2, axis: 'x', speed: 0.075, min: -34, max: 34, group: 'traffic', stopRange: 4.8 },
  ],
  trafficLights: trafficSceneData.trafficLights.map((light, i) => ({
    id: `tl-${i + 1}`,
    group: 'traffic',
    linkedGroup: 'security',
    ...light,
  })),
  cameras: [
    ...buildingSceneData.cameras.map((cam, i) => ({
      id: cam.id || `cam-building-${i + 1}`,
      group: 'security',
      pos: buildingCameraPositions[cam.id] || cam.pos,
      buildingId: cam.buildingId,
      label: 'Camera giám sát',
    })),
    { id: 'cam-traffic-01', group: 'security', linkedGroup: 'traffic', pos: [-5.5, 4.2, -5.5], rot: Math.PI / 4, label: 'Camera giao thông A4' },
    { id: 'cam-traffic-02', group: 'security', linkedGroup: 'traffic', pos: [5.5, 4.2, 5.5], rot: -Math.PI * 0.75, label: 'Camera an ninh giao lộ' },
    { id: 'cam-park-01', group: 'security', linkedGroup: 'environment', pos: [-24, 3.2, 29], rot: Math.PI / 3, label: 'Camera công viên' },
  ],
  sensors: [
    { id: 'sensor-pm25-01', group: 'environment', pos: [-24.5, 2.2, 21], metric: 'PM2.5', value: '32 µg/m³', label: 'Cảm biến PM2.5' },
    { id: 'sensor-temp-01', group: 'environment', pos: [-18, 2.4, 31], metric: 'Nhiệt độ', value: '31°C', label: 'Cảm biến nhiệt độ' },
    { id: 'sensor-humidity-01', group: 'environment', pos: [-11.5, 2.1, 22], metric: 'Độ ẩm', value: '72%', label: 'Cảm biến độ ẩm' },
  ],
  utilities: [
    { id: 'utility-power-01', group: 'utilities', pos: [12, 0, -12], type: 'power', status: 'active', label: 'Trạm điện thông minh' },
    { id: 'utility-water-01', group: 'utilities', pos: [10, 0, -6], type: 'water', status: 'warning', label: 'Trạm bơm nước' },
    { id: 'utility-light-01', group: 'utilities', pos: [15, 0, -6.4], type: 'lighting', status: 'active', label: 'Tủ chiếu sáng' },
    { id: 'utility-iot-01', group: 'utilities', pos: [18, 0, -10], type: 'iot', status: 'active', label: 'Gateway IoT' },
  ],
  incidents: [
    { id: 'incident-traffic-01', group: 'traffic', pos: [3.4, 0.7, -3.2], color: '#E24B4A', label: 'Sự cố giao thông' },
    { id: 'incident-security-01', group: 'security', pos: [12.9, 9.8, 9.8], color: '#E24B4A', label: 'Cảnh báo truy cập' },
    { id: 'incident-utility-01', group: 'utilities', pos: [10, 1.4, -6], color: '#EF9F27', label: 'Áp suất bất thường' },
  ],
  densityMarkers: [
    { id: 'density-green', group: 'traffic', pos: [-9, 0.35, 2.4], color: '#1D9E75', label: 'Mật độ thấp' },
    { id: 'density-yellow', group: 'traffic', pos: [0, 0.35, -7.5], color: '#EF9F27', label: 'Mật độ trung bình' },
    { id: 'density-red', group: 'traffic', pos: [7.2, 0.35, -2.4], color: '#E24B4A', label: 'Mật độ cao' },
  ],
  reportBars: [
    { id: 'report-traffic', group: 'reports', pos: [-9, 0, -10], height: 4.5, color: '#185FA5', label: 'Giao thông' },
    { id: 'report-security', group: 'reports', pos: [-3, 0, -10], height: 5.8, color: '#85B7EB', label: 'An ninh' },
    { id: 'report-energy', group: 'reports', pos: [3, 0, -10], height: 3.6, color: '#EF9F27', label: 'Năng lượng' },
    { id: 'report-environment', group: 'reports', pos: [9, 0, -10], height: 4.9, color: '#1D9E75', label: 'Môi trường' },
  ],
};
