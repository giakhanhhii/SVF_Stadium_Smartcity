import { trafficSceneData } from '../../data/traffic-scene.js';
import { getLaneTangentHeading, getRouteSample } from './traffic-lanes.js';

export function getVehicleFootprintGap(vehicle, other) {
  const baseGap = trafficSceneData.roundabout?.minimumVehicleGap || 4.9;
  const busExtra = vehicle.vehicleKind === 'bus' || other.vehicleKind === 'bus' ? 1.9 : 0;
  const bothMoto = vehicle.vehicleKind === 'moto' && other.vehicleKind === 'moto';
  const mixedMoto = !bothMoto && (vehicle.vehicleKind === 'moto' || other.vehicleKind === 'moto');
  const motoAdjustment = bothMoto ? -0.65 : mixedMoto ? 0.85 : 0;
  return Math.max(3.6, baseGap + busExtra + motoAdjustment);
}

export function getVehicleFootprintSize(vehicle) {
  if (vehicle.vehicleKind === 'bus') return { width: 2.1, length: 5.2 };
  if (vehicle.vehicleKind === 'moto') return { width: 0.85, length: 2.25 };
  return { width: 1.8, length: 3.65 };
}

export function getVehicleRouteSample(vehicle, distance = vehicle?.distance ?? vehicle?.s ?? 0) {
  if (vehicle?.route) {
    const sample = getRouteSample(vehicle.route, distance);
    return {
      ...sample,
      heading: getLaneTangentHeading(vehicle.route, distance, vehicle.velocity || 0),
    };
  }
  return {
    x: vehicle?.mesh?.position?.x ?? vehicle?.x ?? 0,
    z: vehicle?.mesh?.position?.z ?? vehicle?.z ?? 0,
    heading: vehicle?.mesh?.rotation?.y ?? vehicle?.rot ?? 0,
  };
}

export function distanceBetweenRouteSamples(a, aDistance, b, bDistance) {
  const sampleA = getVehicleRouteSample(a, aDistance);
  const sampleB = getVehicleRouteSample(b, bDistance);
  return Math.hypot(sampleA.x - sampleB.x, sampleA.z - sampleB.z);
}

export function getVehicleFootprintBox(vehicle, sample = null, padding = null) {
  const size = getVehicleFootprintSize(vehicle);
  const bodyPadding = padding ?? (vehicle.vehicleKind === 'moto' ? 0.18 : 0.22);
  const resolvedSample = typeof sample === 'number'
    ? getVehicleRouteSample(vehicle, sample)
    : sample ?? getVehicleRouteSample(vehicle);
  const heading = resolvedSample.heading ?? getVehicleRouteSample(vehicle).heading;
  return {
    center: {
      x: resolvedSample.x,
      z: resolvedSample.z,
    },
    forward: { x: Math.sin(heading), z: Math.cos(heading) },
    right: { x: Math.cos(heading), z: -Math.sin(heading) },
    halfLength: size.length / 2 + bodyPadding,
    halfWidth: size.width / 2 + bodyPadding,
  };
}

function dot2(a, b) {
  return a.x * b.x + a.z * b.z;
}

function projectionRadius(box, axis) {
  return Math.abs(dot2(box.forward, axis)) * box.halfLength + Math.abs(dot2(box.right, axis)) * box.halfWidth;
}

export function vehicleFootprintsOverlap(a, b) {
  const centerDelta = { x: b.center.x - a.center.x, z: b.center.z - a.center.z };
  return [a.forward, a.right, b.forward, b.right].every((axis) => (
    Math.abs(dot2(centerDelta, axis)) <= projectionRadius(a, axis) + projectionRadius(b, axis)
  ));
}

function getRoundaboutPriorityRank(vehicle) {
  if (!vehicle.route) return 0;
  if (vehicle.distance > vehicle.route.exitS) return 4;
  if (vehicle.distance >= vehicle.route.entryS) return 3;
  if (vehicle.distance >= vehicle.route.entryS - 3.5) return 2;
  return 1;
}

export function hasTrafficConflictPriority(vehicle, other, runtimeVehicles = []) {
  const vehicleRank = getRoundaboutPriorityRank(vehicle);
  const otherRank = getRoundaboutPriorityRank(other);
  if (vehicleRank !== otherRank) return vehicleRank > otherRank;

  const distanceLead = vehicle.distance - other.distance;
  if (Math.abs(distanceLead) > 0.7) return distanceLead > 0;

  const vehicleIndex = runtimeVehicles.indexOf(vehicle);
  const otherIndex = runtimeVehicles.indexOf(other);
  return (vehicleIndex === -1 ? 0 : vehicleIndex) < (otherIndex === -1 ? 0 : otherIndex);
}

function isRelevantBodyBlocker(candidateBox, otherBox) {
  const centerDelta = {
    x: otherBox.center.x - candidateBox.center.x,
    z: otherBox.center.z - candidateBox.center.z,
  };
  const forwardGap = dot2(centerDelta, candidateBox.forward);
  const sideGap = Math.abs(dot2(centerDelta, candidateBox.right));
  const rearTolerance = -candidateBox.halfLength * 0.55;
  const sideTolerance = candidateBox.halfWidth + otherBox.halfWidth * 0.45;

  if (forwardGap < rearTolerance) return false;
  return forwardGap > 0 || sideGap <= sideTolerance;
}

function visibleRoundaboutVehicle(other, vehicle) {
  return other !== vehicle
    && other.type === 'vehicle'
    && other.route?.mode === 'roundabout'
    && other.mesh.visible
    && other.distance < other.route.length + 0.8;
}

export function findGlobalProximityBlocker(vehicle, candidateDistance, vehicles = [], runtimeVehicles = vehicles) {
  const sample = getVehicleRouteSample(vehicle, candidateDistance);
  const candidateBox = getVehicleFootprintBox(vehicle, sample);
  let nearest = null;
  vehicles.forEach((other) => {
    if (!visibleRoundaboutVehicle(other, vehicle)) return;
    const otherSample = getVehicleRouteSample(other, other.distance);
    const otherBox = getVehicleFootprintBox(other, otherSample, 0.16);
    if (!isRelevantBodyBlocker(candidateBox, otherBox)) return;
    if (!vehicleFootprintsOverlap(candidateBox, otherBox)) return;
    const contactBox = getVehicleFootprintBox(vehicle, sample, 0.03);
    const otherContactBox = getVehicleFootprintBox(other, otherSample, 0.03);
    const bodiesWouldTouch = vehicleFootprintsOverlap(contactBox, otherContactBox);
    if (!bodiesWouldTouch && hasTrafficConflictPriority(vehicle, other, runtimeVehicles)) return;
    const centerDistance = Math.hypot(sample.x - otherSample.x, sample.z - otherSample.z);
    const minGap = Math.max(1.2, getVehicleFootprintGap(vehicle, other) * 0.35);
    const distance = Math.min(centerDistance, minGap * 0.25);
    if (!nearest || distance < nearest.distance) {
      nearest = { other, distance, minGap };
    }
  });
  return nearest;
}

export function hasActualBodyContact(vehicle, candidateDistance, ignoredVehicle = null, vehicles = []) {
  const sample = getVehicleRouteSample(vehicle, candidateDistance);
  const candidateBox = getVehicleFootprintBox(vehicle, sample, 0);
  return vehicles.some((other) => {
    if (other === ignoredVehicle || !visibleRoundaboutVehicle(other, vehicle)) return false;
    const otherBox = getVehicleFootprintBox(other, getVehicleRouteSample(other, other.distance), 0);
    if (!isRelevantBodyBlocker(candidateBox, otherBox)) return false;
    return vehicleFootprintsOverlap(candidateBox, otherBox);
  });
}

export function hasAnyBodyOverlap(vehicle, candidateDistance, ignoredVehicle = null, vehicles = []) {
  const sample = getVehicleRouteSample(vehicle, candidateDistance);
  const candidateBox = getVehicleFootprintBox(vehicle, sample, 0);
  return vehicles.some((other) => {
    if (other === ignoredVehicle || !visibleRoundaboutVehicle(other, vehicle)) return false;
    const otherBox = getVehicleFootprintBox(other, getVehicleRouteSample(other, other.distance), 0);
    return vehicleFootprintsOverlap(candidateBox, otherBox);
  });
}

export function findBodyContactBlocker(vehicle, candidateDistance, vehicles = []) {
  const sample = getVehicleRouteSample(vehicle, candidateDistance);
  const candidateBox = getVehicleFootprintBox(vehicle, sample, 0);
  let blocker = null;
  vehicles.forEach((other) => {
    if (!visibleRoundaboutVehicle(other, vehicle)) return;
    const otherSample = getVehicleRouteSample(other, other.distance);
    const otherBox = getVehicleFootprintBox(other, otherSample, 0);
    if (!vehicleFootprintsOverlap(candidateBox, otherBox)) return;
    const distance = Math.hypot(sample.x - otherSample.x, sample.z - otherSample.z);
    if (!blocker || distance < blocker.distance) blocker = { other, distance, minGap: 0 };
  });
  return blocker;
}

export function getClearanceScoreAt(vehicle, candidateDistance, ignoredVehicle = null, vehicles = []) {
  const sample = getVehicleRouteSample(vehicle, candidateDistance);
  const candidateBox = getVehicleFootprintBox(vehicle, sample, 0);
  let closest = Infinity;
  let blocked = false;
  vehicles.forEach((other) => {
    if (blocked || other === ignoredVehicle || !visibleRoundaboutVehicle(other, vehicle)) return;
    const otherSample = getVehicleRouteSample(other, other.distance);
    const otherContactBox = getVehicleFootprintBox(other, otherSample, 0);
    if (vehicleFootprintsOverlap(candidateBox, otherContactBox)) {
      blocked = true;
      closest = -Infinity;
      return;
    }
    const otherSafeBox = getVehicleFootprintBox(other, otherSample, 0.18);
    if (vehicleFootprintsOverlap(getVehicleFootprintBox(vehicle, sample, 0.18), otherSafeBox)) {
      closest = Math.min(closest, 0.1);
      return;
    }
    closest = Math.min(closest, Math.hypot(sample.x - otherSample.x, sample.z - otherSample.z));
  });
  return blocked ? -Infinity : closest;
}

export function getEscapeScoreAt(vehicle, candidateDistance, targetVehicle = null, vehicles = []) {
  const sample = getVehicleRouteSample(vehicle, candidateDistance);
  const candidateBox = getVehicleFootprintBox(vehicle, sample, 0);
  const candidateSafeBox = getVehicleFootprintBox(vehicle, sample, 0.16);
  let closest = Infinity;
  let targetScore = 0;
  let targetDistance = Infinity;

  vehicles.forEach((other) => {
    if (!visibleRoundaboutVehicle(other, vehicle)) return;
    const otherSample = getVehicleRouteSample(other, other.distance);
    const otherContactBox = getVehicleFootprintBox(other, otherSample, 0);
    const otherSafeBox = getVehicleFootprintBox(other, otherSample, 0.16);
    const centerDistance = Math.hypot(sample.x - otherSample.x, sample.z - otherSample.z);

    if (other === targetVehicle) {
      const touchingTarget = vehicleFootprintsOverlap(candidateBox, otherContactBox);
      targetDistance = centerDistance;
      targetScore = centerDistance * 2.2 + (touchingTarget ? -4 : 10);
      closest = Math.min(closest, centerDistance);
      return;
    }

    if (vehicleFootprintsOverlap(candidateBox, otherContactBox)) {
      closest = -Infinity;
      return;
    }
    if (vehicleFootprintsOverlap(candidateSafeBox, otherSafeBox)) {
      closest = Math.min(closest, 0.1);
      return;
    }
    closest = Math.min(closest, centerDistance);
  });

  if (closest === -Infinity) return -Infinity;
  const currentTargetDistance = targetVehicle
    ? distanceBetweenRouteSamples(vehicle, vehicle.distance, targetVehicle, targetVehicle.distance)
    : 0;
  const separationGain = targetVehicle && Number.isFinite(targetDistance) ? Math.max(-2, targetDistance - currentTargetDistance) : 0;
  return (targetVehicle ? targetScore + separationGain * 4 : 0) + Math.min(closest, 10);
}

export function isYieldTargetClear(vehicle, target, vehicles = []) {
  if (!target || !target.mesh?.visible || !target.route) return true;
  const forwardCheck = Math.min(vehicle.route.length, vehicle.distance + 0.9);
  if (hasActualBodyContact(vehicle, vehicle.distance, null, vehicles) || hasActualBodyContact(vehicle, forwardCheck, null, vehicles)) return false;
  const minClearance = Math.max(2.4, getVehicleFootprintGap(vehicle, target) * 0.65);
  return distanceBetweenRouteSamples(vehicle, vehicle.distance, target, target.distance) > minClearance;
}
