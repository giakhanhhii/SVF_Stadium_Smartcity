// Logic mô phỏng giao thông thuần (không giữ state, không chạm scene graph).
// Tách khỏi smartcity-scene-runtime.js (Phase 4a): các hàm ở đây chỉ phụ thuộc tham số
// đầu vào nên dùng được cả ở runtime 3D lẫn ở trafficSpawner (traffic-spawn.js) mà không
// tạo phụ thuộc vòng. Các hàm mô phỏng CÓ state (find*, reverse/history, updateRoundabout*)
// sẽ chuyển sang factory createTrafficSimulation ở Phase 4b.

export function getSignalState(cycle, t) {
  const yellow = cycle.yellowSeconds;
  const allRed = cycle.allRedSeconds;
  const phaseDurations = cycle.phases.map((phase) => phase.greenSeconds + yellow + allRed);
  const cycleSeconds = phaseDurations.reduce((sum, value) => sum + value, 0);
  let cursor = ((t % cycleSeconds) + cycleSeconds) % cycleSeconds;
  for (let i = 0; i < cycle.phases.length; i += 1) {
    const phase = cycle.phases[i];
    if (cursor < phase.greenSeconds) return { phase, color: 'green', movement: phase.movement, label: phase.label };
    cursor -= phase.greenSeconds;
    if (cursor < yellow) return { phase, color: 'yellow', movement: phase.movement, label: `${phase.label} yellow` };
    cursor -= yellow;
    if (cursor < allRed) return { phase, color: 'red', movement: null, label: 'all red' };
    cursor -= allRed;
  }
  return { phase: cycle.phases[0], color: 'red', movement: null, label: 'all red' };
}

export function syncVehicleLaneState(vehicle) {
  if (!vehicle?.route) return;
  vehicle.laneId = vehicle.route.laneId || vehicle.route.id;
  vehicle.s = vehicle.distance;
  vehicle.signalGroup = vehicle.route.signalGroup || vehicle.route.movement || null;
}

// Đèn điều tiết lối vào vòng xuyến: cặp đối diện cùng pha (N+S, rồi E+W),
// xen kẽ vàng và toàn đỏ. Trả về 'green' | 'yellow' | 'red' cho từng hướng.
export function getRoundaboutApproachSignal(approach, t, cfg) {
  const green = cfg?.greenSeconds ?? 8;
  const yellow = cfg?.yellowSeconds ?? 2.5;
  const allRed = cfg?.allRedSeconds ?? 1.5;
  const half = green + yellow + allRed;
  const cycle = half * 2;
  const p = ((t % cycle) + cycle) % cycle;
  const inFirstHalf = p < half;
  const local = inFirstHalf ? p : p - half;
  const phaseColor = local < green ? 'green' : local < green + yellow ? 'yellow' : 'red';
  const groupNS = approach === 'N' || approach === 'S';
  // Nửa đầu chu kỳ ưu tiên nhóm N+S, nửa sau ưu tiên E+W.
  const groupActive = groupNS ? inFirstHalf : !inFirstHalf;
  return groupActive ? phaseColor : 'red';
}

export function getVehicleLengthAllowance(vehicle) {
  if (vehicle.vehicleKind === 'bus') return 5.2;
  if (vehicle.vehicleKind === 'moto') return 2.25;
  return 3.65;
}
