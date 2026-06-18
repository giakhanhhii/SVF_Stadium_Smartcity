import { getLaneTangentHeading, getRouteSample, normalizeAngle } from './traffic-lanes.js';

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
  const shouldSmoothHeading = options.smoothHeading && Number.isFinite(previousHeading) && options.delta > 0;
  const heading = shouldSmoothHeading
    ? moveAngleToward(previousHeading, pose.heading, (options.maxHeadingTurnRate || 5.2) * options.delta)
    : pose.heading;
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
