/** Mock data scene 3D giao thong - nga tu */
export const trafficSceneData = {
  roadLayout: {
    laneWidth: 3.5,
    laneCountPerRoad: 4,
    roadLength: 72,
    intersectionHalf: 7,
    stopOffset: 10.1,
    mapLimit: 36,
    debug: false,
  },
  roundabout: {
    enabled: true,
    islandRadius: 3.15,
    laneRadius: 6.0,
    laneHalfWidth: 1.45,
    entryYieldGap: 11.5,
    entryMinTimeToConflictSeconds: 2.3,
    circulatingSafeGap: 9.2,
    minimumVehicleGap: 6.2,
    entryConflictRadius: 5.2,
    exitConflictRadius: 4.4,
    maxActiveVehicles: 7,
    maxActivePerApproach: 3,
    spawnIntervalSeconds: 2.0,
    spawnApproachIntervalSeconds: 4.5,
    spawnClearance: 16,
    // Đèn tín hiệu điều tiết lối vào vòng xuyến.
    // Cặp đối diện cùng pha: N+S xanh -> E+W xanh, xen kẽ vàng + toàn đỏ.
    signal: {
      enabled: true,
      greenSeconds: 8,
      yellowSeconds: 2.5,
      allRedSeconds: 1.5,
    },
  },
  signalCycle: {
    yellowSeconds: 3,
    allRedSeconds: 1,
    phases: [
      { id: 'ns-through', movement: 'NS_STRAIGHT_RIGHT', label: 'NS straight/right', greenSeconds: 16 },
      { id: 'ns-left', movement: 'NS_LEFT', label: 'NS left', greenSeconds: 8 },
      { id: 'ew-through', movement: 'EW_STRAIGHT_RIGHT', label: 'EW straight/right', greenSeconds: 16 },
      { id: 'ew-left', movement: 'EW_LEFT', label: 'EW left', greenSeconds: 8 },
    ],
  },
  // runsRedLight: xe cố tình vượt đèn đỏ (bỏ qua tín hiệu đỏ ở lối vào).
  // Số còn lại tuân thủ: dừng trước vạch khi đỏ.
  vehicles: [
    { type: 'car', style: 'luxurySedan', color: '#1f2530', routeId: 'N-straight', speed: 5.0, startDelay: 0 },
    { type: 'car', style: 'wedgeSupercar', color: '#f28b18', routeId: 'S-straight', speed: 4.9, startDelay: 0 },
    { type: 'car', style: 'sportCoupe', color: '#c83838', routeId: 'W-straight', speed: 4.8, startDelay: 16, runsRedLight: true },
    { type: 'car', style: 'urbanSuv', color: '#e8e8e8', routeId: 'E-straight', speed: 4.8, startDelay: 32 },
    { type: 'car', style: 'wedgeSupercar', color: '#d4a030', routeId: 'E-straight', speed: 4.6, startDelay: 48, runsRedLight: true },
    { type: 'moto', color: '#222222', routeId: 'W-right', speed: 5.3, startDelay: 64 },
    { type: 'moto', color: '#c02020', routeId: 'W-left', speed: 5.1, startDelay: 80, runsRedLight: true },
    { type: 'moto', color: '#1a1a1a', routeId: 'S-right', speed: 5.2, startDelay: 96 },
    { type: 'moto', color: '#444444', routeId: 'W-left', speed: 5.0, startDelay: 112 },
  ],
  trafficLights: [
    { x: -8.9, z: -8.9, rot: 0, approach: 'N' },
    { x: 8.9, z: -8.9, rot: Math.PI / 2, approach: 'E' },
    { x: 8.9, z: 8.9, rot: Math.PI, approach: 'S' },
    { x: -8.9, z: 8.9, rot: -Math.PI / 2, approach: 'W' },
  ],
};
