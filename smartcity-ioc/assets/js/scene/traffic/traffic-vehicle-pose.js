import { getLaneTangentHeading, getRouteSample, normalizeAngle } from './traffic-lanes.js';

// Dưới tốc độ này coi như xe đứng yên: GIỮ NGUYÊN hướng hiển thị thay vì bám tangent.
// Lý do: khi xe gần dừng (chờ vào vòng, kẹt, vừa lùi xong) tangent ±0.85m có thể lệch tại
// các mối nối polyline (approach→arc→exit) hoặc ngay sau khi lùi, gây lật ~180° trong 1 frame.
// Xe đứng yên không có lý do gì để tự xoay; khi chạy lại (velocity tăng) sẽ mượt về tangent.
const STOPPED_HEADING_HOLD_SPEED = 0.12;

function shortestAngleDelta(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function moveAngleToward(current, target, maxStep) {
  const delta = shortestAngleDelta(current, target);
  if (Math.abs(delta) <= maxStep) return target;
  return current + Math.sign(delta) * maxStep;
}

export function getVehiclePoseFromLane(route, s, velocity = 0, options = {}) {
  const sample = getRouteSample(route, s);
  const heading = options.holdApproachHeading && Number.isFinite(route?.direction?.heading)
    ? route.direction.heading
    : getLaneTangentHeading(route, s, velocity);
  return {
    x: sample.x,
    y: 0,
    z: sample.z,
    heading: normalizeAngle(heading),
  };
}

export function setVehiclePoseFromLane(vehicle, options = {}) {
  if (!vehicle?.route || !vehicle?.mesh) return null;
  const s = options.s ?? vehicle.s ?? vehicle.distance ?? 0;
  const velocity = options.velocity ?? vehicle.velocity ?? 0;
  const y = options.y ?? 0;
  const pose = getVehiclePoseFromLane(vehicle.route, s, velocity, options);
  const previousHeading = Number.isFinite(vehicle.displayHeading)
    ? vehicle.displayHeading
    : vehicle.mesh.rotation.y;
  // Xe đứng yên (đã có hướng cũ hợp lệ) -> giữ nguyên hướng, không bám tangent (chống lật 180°).
  const holdWhileStopped = Number.isFinite(previousHeading)
    && Math.abs(velocity) < STOPPED_HEADING_HOLD_SPEED
    && !options.holdApproachHeading;
  const shouldSmoothHeading = options.smoothHeading && Number.isFinite(previousHeading) && options.delta > 0;
  let heading;
  if (holdWhileStopped) {
    heading = previousHeading;
  } else if (shouldSmoothHeading) {
    heading = moveAngleToward(previousHeading, pose.heading, (options.maxHeadingTurnRate || 5.2) * options.delta);
  } else {
    heading = pose.heading;
  }
  const displayHeading = normalizeAngle(heading);
  vehicle.mesh.position.set(pose.x, y, pose.z);
  vehicle.mesh.rotation.set(0, displayHeading, 0);
  vehicle.mesh.updateMatrix();
  vehicle.mesh.updateWorldMatrix(false, true);
  vehicle.displayHeading = displayHeading;
  vehicle.s = s;
  vehicle.distance = s;
  return { ...pose, heading: displayHeading };
}
