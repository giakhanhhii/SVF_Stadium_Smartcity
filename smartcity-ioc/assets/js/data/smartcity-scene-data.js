import { buildingSceneData } from './building-scene.js';
import { trafficSceneData } from './traffic-scene.js';

const buildingPositionOverrides = {
  A1: [-16.5, 0, -14.5],
  B2: [-9.8, 0, -17.2],
  B3: [14.2, 0, -16.4],
  C2: [17.2, 0, 13.8],
  D7: [-17.4, 0, 18.2],
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
  roadLayout: trafficSceneData.roadLayout,
  signalCycle: trafficSceneData.signalCycle,
  cameraPresets: {
    overview: { pos: [24, 26, 34], target: [0, 3, 0], fov: 42, hint: 'Tổng quan thành phố' },
    traffic: { pos: [0, 42, 18], target: [0, 0.8, 0], fov: 43, hint: 'Theo dõi giao thông tại vòng xuyến' },
    security: { pos: [0, 52, 0.01], target: [0, 0, 0], fov: 55, hint: 'Camera an ninh và đội xử lý' },
    environment: { pos: [-30, 26, 48], target: [-10, 3, 10], fov: 46, hint: 'Toàn cảnh hạ tầng và công viên' },
    utilities: { pos: [-28, 20, 48], target: [-12, 3, 18], fov: 40, hint: 'Dịch vụ cư dân Vin' },
    reports: { pos: [0, 34, 38], target: [0, 2, 0], fov: 48, hint: 'Báo cáo tổng hợp' },
  },
  roads: [
    { id: 'road-main-ew', pos: [0, 0, 0], size: [72, 14], rotation: 0, type: 'primary' },
    { id: 'road-main-ns', pos: [0, 0, 0], size: [14, 72], rotation: 0, type: 'primary' },
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
    [-18, -9.8], [-13.5, -10.4], [-8.8, -12.2],
    [9.2, -10.8], [14.2, -11.6], [18.5, -15.8],
    [-18, 9.8], [-14.5, 13.8], [-9.8, 14.6],
    [9.4, 13.8], [12.2, 17.4], [18.5, 15.6],
    [-26, -10.5], [-27, 10.5], [26, -10.5], [27, 11.5],
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
    { id: 'veh-10', type: 'car', color: '#e24b4a', routeId: 'S-left', speed: 4.4, startDelay: 45, group: 'traffic' },
    { id: 'veh-11', type: 'car', color: '#ffffff', routeId: 'W-right', speed: 4.8, startDelay: 50, group: 'traffic' },
    { id: 'veh-12', type: 'bus', color: '#f0b429', routeId: 'E-left', speed: 3.5, startDelay: 55, group: 'traffic' },
    { id: 'veh-13', type: 'car', color: '#1f2937', routeId: 'N-straight', speed: 4.7, startDelay: 60, group: 'traffic' },
    { id: 'veh-14', type: 'moto', color: '#2a2a2a', routeId: 'E-straight', speed: 5.2, startDelay: 65, group: 'traffic' },
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
    { id: 'cam-traffic-01', group: 'security', linkedGroup: 'traffic', pos: [-9.2, 4.2, -9.2], rot: Math.PI / 4, label: 'Camera giao thông A4' },
    { id: 'cam-traffic-02', group: 'security', linkedGroup: 'traffic', pos: [9.2, 4.2, 9.2], rot: -Math.PI * 0.75, label: 'Camera an ninh giao lộ' },
    { id: 'cam-park-01', group: 'security', linkedGroup: 'environment', pos: [-24, 3.2, 29], rot: Math.PI / 3, label: 'Camera công viên' },
  ],
  sensors: [
    { id: 'sensor-pm25-01', group: 'environment', pos: [-24.5, 2.2, 21], metric: 'PM2.5', value: '32 µg/m³', label: 'Cảm biến PM2.5' },
    { id: 'sensor-temp-01', group: 'environment', pos: [-18, 2.4, 31], metric: 'Nhiệt độ', value: '31°C', label: 'Cảm biến nhiệt độ' },
    { id: 'sensor-humidity-01', group: 'environment', pos: [-11.5, 2.1, 22], metric: 'Độ ẩm', value: '72%', label: 'Cảm biến độ ẩm' },
  ],
  utilities: [
    { id: 'utility-power-01', group: 'utilities', pos: [15.8, 0, -14.5], type: 'power', status: 'active', label: 'Trạm điện thông minh' },
    { id: 'utility-water-01', group: 'utilities', pos: [13.5, 0, -10.2], type: 'water', status: 'warning', label: 'Trạm bơm nước' },
    { id: 'utility-light-01', group: 'utilities', pos: [18.2, 0, -10.4], type: 'lighting', status: 'active', label: 'Tủ chiếu sáng' },
    { id: 'utility-iot-01', group: 'utilities', pos: [21.2, 0, -14.2], type: 'iot', status: 'active', label: 'Gateway IoT' },
  ],
  incidents: [
    { id: 'incident-traffic-01', group: 'traffic', pos: [11.4, 0.7, -9.8], color: '#E24B4A', label: 'Sự cố giao thông' },
    { id: 'incident-security-01', group: 'security', pos: [12.9, 9.8, 9.8], color: '#E24B4A', label: 'Cảnh báo truy cập' },
    { id: 'incident-utility-01', group: 'utilities', pos: [13.5, 1.4, -10.2], color: '#EF9F27', label: 'Áp suất bất thường' },
  ],
  densityMarkers: [
    { id: 'density-green', group: 'traffic', pos: [-12.2, 0.35, 3.2], color: '#1D9E75', label: 'Mật độ thấp' },
    { id: 'density-yellow', group: 'traffic', pos: [0, 0.35, -12.2], color: '#EF9F27', label: 'Mật độ trung bình' },
    { id: 'density-red', group: 'traffic', pos: [12.2, 0.35, -3.2], color: '#E24B4A', label: 'Mật độ cao' },
  ],
  reportBars: [
    { id: 'report-traffic', group: 'reports', pos: [-9, 0, -10], height: 4.5, color: '#185FA5', label: 'Giao thông' },
    { id: 'report-security', group: 'reports', pos: [-3, 0, -10], height: 5.8, color: '#85B7EB', label: 'An ninh' },
    { id: 'report-energy', group: 'reports', pos: [3, 0, -10], height: 3.6, color: '#EF9F27', label: 'Năng lượng' },
  { id: 'report-environment', group: 'reports', pos: [9, 0, -10], height: 4.9, color: '#1D9E75', label: 'Hạ tầng' },
  ],
};
