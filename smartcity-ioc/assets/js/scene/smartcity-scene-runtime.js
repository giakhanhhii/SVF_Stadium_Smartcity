import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { smartcitySceneData } from '../data/smartcity-scene-data.js';
import { trafficSceneData } from '../data/traffic-scene.js';
import { createBuildingMaterials, disposeSceneEnvironment } from './scene-building-materials.js';
import { setupLighting } from './scene-lighting.js';
import { applyCameraPreset, setSceneHint, showSceneLoading, tweenCamera } from './smartcity-camera.js';

let activeScene = null;
let rendererEl = null;
let sceneRefs = null;
let currentPage = 'overview';
let pmrem = null;

const groupKeys = ['traffic', 'security', 'environment', 'utilities', 'reports'];
const layerGroups = new Map();
const emphasisTargets = new Map();
const animatedObjects = [];
let trafficRuntime = null;

const SPACE_REVERSE_DELAY_SECONDS = 0.1;
const SPACE_REVERSE_MAX_SECONDS = 3;
const SPACE_REVERSE_MIN_SECONDS = 1.5;
const SPACE_REVERSE_SPEED_FACTOR = 0.72;
const SPACE_REVERSE_COOLDOWN_MIN_SECONDS = 1.15;
const SPACE_REVERSE_COOLDOWN_MAX_SECONDS = 1.85;
const GRIDLOCK_RECOVERY_SECONDS = 2.4;

const TRAFFIC_LIGHT_GROUPS = {
  N: ['NS_STRAIGHT_RIGHT', 'NS_LEFT'],
  S: ['NS_STRAIGHT_RIGHT', 'NS_LEFT'],
  E: ['EW_STRAIGHT_RIGHT', 'EW_LEFT'],
  W: ['EW_STRAIGHT_RIGHT', 'EW_LEFT'],
};

function isTrafficDebugEnabled() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('trafficDebug') === '1' || window.localStorage?.getItem('trafficDebug') === '1' || smartcitySceneData.roadLayout?.debug;
}

function createTextSprite(text, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(7, 20, 36, 0.78)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.userData.canvas = canvas;
  sprite.userData.ctx = ctx;
  sprite.userData.color = color;
  sprite.scale.set(4.2, 1.4, 1);
  return sprite;
}

function setTextSprite(sprite, text, color = sprite.userData.color || '#ffffff') {
  const { canvas, ctx } = sprite.userData;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(7, 20, 36, 0.78)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  sprite.material.map.needsUpdate = true;
}

function sampleQuadratic(a, b, c, steps = 10) {
  const points = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const mt = 1 - t;
    points.push([
      mt * mt * a[0] + 2 * mt * t * b[0] + t * t * c[0],
      mt * mt * a[1] + 2 * mt * t * b[1] + t * t * c[1],
    ]);
  }
  return points;
}

function normalizeAngle(angle) {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

function ccwAngleDistance(from, to) {
  return normalizeAngle(to - from);
}

function sampleArc(radius, from, to, steps = 18) {
  const span = ccwAngleDistance(from, to);
  const points = [];
  for (let i = 1; i <= steps; i += 1) {
    const angle = from + (span * i) / steps;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return points;
}

function makeRoute(id, approach, turn, movement, points, layout) {
  const samples = points.map(([x, z]) => ({ x, z }));
  const lengths = [0];
  for (let i = 1; i < samples.length; i += 1) {
    lengths[i] = lengths[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z);
  }
  const route = {
    id,
    approach,
    turn,
    movement,
    mode: 'signal',
    points: samples,
    lengths,
    length: lengths[lengths.length - 1],
    safeGap: turn === 'straight' ? 4.6 : 5.2,
    turnSlowdown: turn === 'straight' ? 1 : 0.74,
  };
  route.stopS = findRouteDistance(route, (p) => (
    (approach === 'N' && p.z >= -layout.stopOffset)
    || (approach === 'S' && p.z <= layout.stopOffset)
    || (approach === 'W' && p.x >= -layout.stopOffset)
    || (approach === 'E' && p.x <= layout.stopOffset)
  ));
  route.entryS = findRouteDistance(route, (p) => Math.abs(p.x) <= layout.intersectionHalf && Math.abs(p.z) <= layout.intersectionHalf);
  route.exitS = findRouteDistance(route, (p) => route.entryS !== null && route.lengths[route.points.indexOf(p)] > route.entryS && (Math.abs(p.x) > layout.intersectionHalf || Math.abs(p.z) > layout.intersectionHalf));
  if (route.stopS === null) route.stopS = Math.max(0, route.entryS - 3);
  if (route.entryS === null) route.entryS = route.stopS + 3;
  if (route.exitS === null) route.exitS = route.entryS + 14;
  return route;
}

function findRouteDistance(route, predicate) {
  for (let i = 0; i < route.points.length; i += 1) {
    if (predicate(route.points[i])) return route.lengths[i];
  }
  return null;
}

function buildTrafficRoutes(layout) {
  if (trafficSceneData.roundabout?.enabled) return buildRoundaboutRoutes(layout, trafficSceneData.roundabout);
  const limit = layout.mapLimit;
  const inner = layout.laneWidth * 0.5;
  const outer = layout.laneWidth * 1.5;
  const j = layout.intersectionHalf;
  const routes = [
    ['N-straight', 'N', 'straight', 'NS_STRAIGHT_RIGHT', [[-outer, -limit], [-outer, limit]]],
    ['S-straight', 'S', 'straight', 'NS_STRAIGHT_RIGHT', [[outer, limit], [outer, -limit]]],
    ['W-straight', 'W', 'straight', 'EW_STRAIGHT_RIGHT', [[-limit, outer], [limit, outer]]],
    ['E-straight', 'E', 'straight', 'EW_STRAIGHT_RIGHT', [[limit, -outer], [-limit, -outer]]],
    ['N-left', 'N', 'left', 'NS_LEFT', [[-inner, -limit], [-inner, -j], ...sampleQuadratic([-inner, -j], [-inner, inner], [j, inner]), [limit, inner]]],
    ['S-left', 'S', 'left', 'NS_LEFT', [[inner, limit], [inner, j], ...sampleQuadratic([inner, j], [inner, -inner], [-j, -inner]), [-limit, -inner]]],
    ['W-left', 'W', 'left', 'EW_LEFT', [[-limit, inner], [-j, inner], ...sampleQuadratic([-j, inner], [inner, inner], [inner, -j]), [inner, -limit]]],
    ['E-left', 'E', 'left', 'EW_LEFT', [[limit, -inner], [j, -inner], ...sampleQuadratic([j, -inner], [-inner, -inner], [-inner, j]), [-inner, limit]]],
    ['N-right', 'N', 'right', 'NS_STRAIGHT_RIGHT', [[-outer, -limit], [-outer, -j], ...sampleQuadratic([-outer, -j], [-outer, -outer], [-j, -outer]), [-limit, -outer]]],
    ['S-right', 'S', 'right', 'NS_STRAIGHT_RIGHT', [[outer, limit], [outer, j], ...sampleQuadratic([outer, j], [outer, outer], [j, outer]), [limit, outer]]],
    ['W-right', 'W', 'right', 'EW_STRAIGHT_RIGHT', [[-limit, outer], [-j, outer], ...sampleQuadratic([-j, outer], [-outer, outer], [-outer, j]), [-outer, limit]]],
    ['E-right', 'E', 'right', 'EW_STRAIGHT_RIGHT', [[limit, -outer], [j, -outer], ...sampleQuadratic([j, -outer], [outer, -outer], [outer, -j]), [outer, -limit]]],
  ];
  return new Map(routes.map((route) => {
    const built = makeRoute(route[0], route[1], route[2], route[3], route[4], layout);
    return [built.id, built];
  }));
}

function makeRoundaboutRoute(id, approach, turn, points, meta) {
  const samples = points.map(([x, z]) => ({ x, z }));
  const lengths = [0];
  for (let i = 1; i < samples.length; i += 1) {
    lengths[i] = lengths[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z);
  }
  return {
    id,
    approach,
    turn,
    mode: 'roundabout',
    points: samples,
    lengths,
    length: lengths[lengths.length - 1],
    entryS: meta.entryS,
    exitS: meta.exitS,
    exitPoint: meta.exitPoint,
    entryPoint: meta.entryPoint,
    entryAngle: meta.entryAngle,
    exitAngle: meta.exitAngle,
    safeGap: trafficSceneData.roundabout?.circulatingSafeGap || 5.8,
    turnSlowdown: 0.82,
  };
}

function buildRoundaboutRoutes(layout, roundabout) {
  const limit = layout.mapLimit;
  const laneWidth = layout.laneWidth;
  const outer = laneWidth * 1.5;
  const radius = roundabout.laneRadius;
  const entryAngles = {
    N: -Math.PI / 2,
    E: 0,
    S: Math.PI / 2,
    W: Math.PI,
  };
  const starts = {
    N: [[-outer, -limit], [-outer, -13], [-1.4, -8.4], [0, -radius]],
    E: [[limit, -outer], [13, -outer], [8.4, -1.4], [radius, 0]],
    S: [[outer, limit], [outer, 13], [1.4, 8.4], [0, radius]],
    W: [[-limit, outer], [-13, outer], [-8.4, 1.4], [-radius, 0]],
  };
  const exits = {
    N: [[0, -radius], [1.4, -8.4], [outer, -13], [outer, -limit]],
    E: [[radius, 0], [8.4, 1.4], [13, outer], [limit, outer]],
    S: [[0, radius], [-1.4, 8.4], [-outer, 13], [-outer, limit]],
    W: [[-radius, 0], [-8.4, -1.4], [-13, -outer], [-limit, -outer]],
  };
  const approachOrder = ['N', 'E', 'S', 'W'];
  const turnToExitCount = { right: 1, straight: 2, left: 3 };
  const routeDefs = [
    ['N-straight', 'N', 'straight'],
    ['S-straight', 'S', 'straight'],
    ['W-straight', 'W', 'straight'],
    ['E-straight', 'E', 'straight'],
    ['N-left', 'N', 'left'],
    ['S-right', 'S', 'right'],
    ['W-left', 'W', 'left'],
    ['E-right', 'E', 'right'],
    ['N-right', 'N', 'right'],
    ['S-left', 'S', 'left'],
    ['W-right', 'W', 'right'],
    ['E-left', 'E', 'left'],
  ];

  return new Map(routeDefs.map(([id, approach, turn]) => {
    const entryIndex = approachOrder.indexOf(approach);
    const exitApproach = approachOrder[(entryIndex + turnToExitCount[turn]) % approachOrder.length];
    const entryAngle = entryAngles[approach];
    const exitAngle = entryAngles[exitApproach];
    const approachPoints = starts[approach];
    const arcPoints = sampleArc(radius, entryAngle, exitAngle, turn === 'right' ? 10 : turn === 'straight' ? 16 : 24);
    const exitPoints = exits[exitApproach].slice(1);
    const points = [...approachPoints, ...arcPoints, ...exitPoints];
    const entryS = approachPoints.reduce((sum, point, index) => {
      if (index === 0) return 0;
      const prev = approachPoints[index - 1];
      return sum + Math.hypot(point[0] - prev[0], point[1] - prev[1]);
    }, 0);
    const arcLength = ccwAngleDistance(entryAngle, exitAngle) * radius;
    const route = makeRoundaboutRoute(id, approach, turn, points, {
      entryS,
      exitS: entryS + arcLength,
      entryPoint: approachPoints[approachPoints.length - 1],
      exitPoint: exits[exitApproach][0],
      entryAngle,
      exitAngle,
    });
    return [route.id, route];
  }));
}

function getRouteSample(route, distance) {
  const s = Math.max(0, Math.min(route.length, distance));
  let i = 1;
  while (i < route.lengths.length - 1 && route.lengths[i] < s) i += 1;
  const prev = route.points[i - 1];
  const next = route.points[i];
  const span = Math.max(0.001, route.lengths[i] - route.lengths[i - 1]);
  const t = (s - route.lengths[i - 1]) / span;
  const x = prev.x + (next.x - prev.x) * t;
  const z = prev.z + (next.z - prev.z) * t;
  return { x, z, heading: Math.atan2(next.x - prev.x, next.z - prev.z) };
}

function getSignalState(cycle, t) {
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

function addTrafficDebugLayer(parent) {
  trafficRuntime.routes.forEach((route) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(route.points.map((p) => new THREE.Vector3(p.x, 0.16, p.z)));
    const material = new THREE.LineBasicMaterial({ color: route.turn === 'left' ? 0x85b7eb : route.turn === 'right' ? 0x1d9e75 : 0xef9f27 });
    parent.add(new THREE.Line(geometry, material));
    const markerDistances = route.mode === 'roundabout' ? [route.entryS, route.exitS] : [route.stopS, route.entryS, route.exitS];
    markerDistances.forEach((distance, index) => {
      const sample = getRouteSample(route, distance);
      const marker = new THREE.Mesh(
        new THREE.RingGeometry(0.22 + index * 0.08, 0.28 + index * 0.08, 16),
        new THREE.MeshBasicMaterial({ color: index === 0 ? 0xffffff : index === 1 ? 0xe24b4a : 0x1d9e75, side: THREE.DoubleSide }),
      );
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(sample.x, 0.18, sample.z);
      parent.add(marker);
    });
  });
  trafficRuntime.phaseSprite = createTextSprite('traffic phase', '#EF9F27');
  trafficRuntime.phaseSprite.position.set(0, 5.2, -15);
  parent.add(trafficRuntime.phaseSprite);
}

function canSpawnVehicle(vehicle, t) {
  if (!vehicle.route || t < vehicle.respawnAt) return false;
  const roundabout = trafficSceneData.roundabout;
  const activeVehicles = trafficRuntime?.vehicles.filter((other) => other.mesh.visible) || [];
  const maxActiveVehicles = roundabout?.maxActiveVehicles || 9;
  const maxActivePerApproach = roundabout?.maxActivePerApproach || 2;
  const spawnInterval = roundabout?.spawnIntervalSeconds || 1.5;
  if (activeVehicles.length >= maxActiveVehicles) return false;
  if (t - (trafficRuntime?.lastSpawnAt || 0) < spawnInterval) return false;
  if (vehicle.route.mode === 'roundabout') {
    const sameApproachActive = activeVehicles.filter((other) => other.route?.approach === vehicle.route.approach && other.distance < other.route.entryS + 3).length;
    if (sameApproachActive >= maxActivePerApproach) return false;
  }
  const spawnSample = getRouteSample(vehicle.route, 0);
  return !animatedObjects.some((other) => {
    if (other === vehicle || other.type !== 'vehicle' || !other.mesh.visible) return false;
    if (other.route === vehicle.route && other.distance < vehicle.route.safeGap + 2) return true;
    if (vehicle.route.mode !== 'roundabout') return false;
    const minGap = getVehicleFootprintGap(vehicle, other);
    return Math.hypot(spawnSample.x - other.mesh.position.x, spawnSample.z - other.mesh.position.z) < minGap;
  });
}

function resetVehicleOnRoute(vehicle, t = 0) {
  const sample = getRouteSample(vehicle.route, 0);
  vehicle.distance = 0;
  vehicle.velocity = 0;
  vehicle.blockedFor = 0;
  vehicle.spaceRequestFrom = null;
  vehicle.spaceRequestUntil = 0;
  vehicle.reverseUntil = 0;
  vehicle.reverseStartedAt = 0;
  vehicle.reverseRequestedAt = 0;
  vehicle.reverseReason = null;
  vehicle.reverseBlockedBy = null;
  vehicle.reverseBlockedAt = 0;
  vehicle.state = vehicle.route.mode === 'roundabout' ? 'APPROACHING' : 'queued';
  vehicle.enteredIntersection = false;
  vehicle.exitedIntersection = false;
  vehicle.mesh.visible = true;
  vehicle.mesh.position.set(sample.x, 0, sample.z);
  vehicle.mesh.rotation.y = sample.heading;
  if (trafficRuntime) trafficRuntime.lastSpawnAt = t;
  if (trafficRuntime?.debug) console.info('[traffic-debug] spawn', vehicle.id, vehicle.routeId);
}

function despawnVehicle(vehicle, t, state = 'despawned') {
  vehicle.mesh.visible = false;
  vehicle.velocity = 0;
  vehicle.blockedFor = 0;
  vehicle.spaceRequestFrom = null;
  vehicle.spaceRequestUntil = 0;
  vehicle.reverseUntil = 0;
  vehicle.reverseStartedAt = 0;
  vehicle.reverseRequestedAt = 0;
  vehicle.reverseReason = null;
  vehicle.reverseBlockedBy = null;
  vehicle.reverseBlockedAt = 0;
  vehicle.state = state;
  vehicle.respawnAt = t + 4 + Math.random() * 8;
  if (vehicle.label) vehicle.label.visible = false;
  if (trafficRuntime?.debug) console.info('[traffic-debug] despawn', vehicle.id, vehicle.routeId);
}

function isIntersectionReserved(vehicle) {
  return animatedObjects.some((other) => (
    other !== vehicle
    && other.type === 'vehicle'
    && other.route
    && other.mesh.visible
    && other.distance >= other.route.stopS - 0.2
    && other.distance <= other.route.exitS + 1.5
  ));
}

function isOutgoingBlocked(vehicle) {
  return animatedObjects.some((other) => (
    other !== vehicle
    && other.type === 'vehicle'
    && other.route
    && other.mesh.visible
    && other.route.id !== vehicle.route.id
    && other.distance > other.route.exitS
    && Math.hypot(other.mesh.position.x - vehicle.mesh.position.x, other.mesh.position.z - vehicle.mesh.position.z) < 4.2
  ));
}

function findVehicleAhead(vehicle) {
  let nearest = null;
  animatedObjects.forEach((other) => {
    if (other === vehicle || other.type !== 'vehicle' || other.route !== vehicle.route || !other.mesh.visible) return;
    const gap = other.distance - vehicle.distance;
    if (gap > 0 && (!nearest || gap < nearest.gap)) nearest = { other, gap };
  });
  return nearest;
}

function isRoundaboutCirculating(vehicle) {
  return vehicle.route?.mode === 'roundabout'
    && vehicle.mesh.visible
    && vehicle.distance >= vehicle.route.entryS
    && vehicle.distance <= vehicle.route.exitS + 0.6;
}

function getRoundaboutAngle(vehicle) {
  return normalizeAngle(Math.atan2(vehicle.mesh.position.z, vehicle.mesh.position.x));
}

function findCirculatingVehicleAhead(vehicle) {
  if (!isRoundaboutCirculating(vehicle)) return null;
  const radius = trafficSceneData.roundabout?.laneRadius || 5.35;
  const angle = getRoundaboutAngle(vehicle);
  let nearest = null;
  animatedObjects.forEach((other) => {
    if (other === vehicle || other.type !== 'vehicle' || !isRoundaboutCirculating(other)) return;
    const gap = ccwAngleDistance(angle, getRoundaboutAngle(other)) * radius;
    if (gap > 0.05 && (!nearest || gap < nearest.gap)) nearest = { other, gap };
  });
  return nearest;
}

function isRoundaboutEntryClear(vehicle) {
  const roundabout = trafficSceneData.roundabout;
  const radius = roundabout?.laneRadius || 5.35;
  const yieldGap = roundabout?.entryYieldGap || 8.5;
  const entryAngle = normalizeAngle(vehicle.route.entryAngle);
  return !animatedObjects.some((other) => {
    if (other === vehicle || other.type !== 'vehicle' || !isRoundaboutCirculating(other)) return false;
    const otherAngle = getRoundaboutAngle(other);
    const gapBehindEntry = ccwAngleDistance(otherAngle, entryAngle) * radius;
    const gapAheadOfEntry = ccwAngleDistance(entryAngle, otherAngle) * radius;
    const nearEntryPoint = Math.hypot(other.mesh.position.x - vehicle.route.entryPoint[0], other.mesh.position.z - vehicle.route.entryPoint[1]) < (roundabout?.entryConflictRadius || 3.8);
    return nearEntryPoint || gapBehindEntry < yieldGap || gapAheadOfEntry < yieldGap * 0.45;
  });
}

function isRoundaboutExitClear(vehicle) {
  const roundabout = trafficSceneData.roundabout;
  return !animatedObjects.some((other) => {
    if (other === vehicle || other.type !== 'vehicle' || other.route?.mode !== 'roundabout' || !other.mesh.visible) return false;
    if (other.distance <= other.route.exitS) return false;
    return Math.hypot(other.mesh.position.x - vehicle.route.exitPoint[0], other.mesh.position.z - vehicle.route.exitPoint[1]) < (roundabout?.exitConflictRadius || 3.4);
  });
}

function getVehicleFootprintGap(vehicle, other) {
  const baseGap = trafficSceneData.roundabout?.minimumVehicleGap || 4.9;
  const busExtra = vehicle.vehicleKind === 'bus' || other.vehicleKind === 'bus' ? 1.9 : 0;
  const motoReduction = (vehicle.vehicleKind === 'moto' ? 1.25 : 0) + (other.vehicleKind === 'moto' ? 1.25 : 0);
  return baseGap + busExtra - motoReduction;
}

function getVehicleFootprintSize(vehicle) {
  if (vehicle.vehicleKind === 'bus') return { width: 2.1, length: 5.2 };
  if (vehicle.vehicleKind === 'moto') return { width: 0.55, length: 1.65 };
  return { width: 1.8, length: 3.65 };
}

function getVehicleFootprintBox(vehicle, sample = null, padding = null) {
  const size = getVehicleFootprintSize(vehicle);
  const bodyPadding = padding ?? (vehicle.vehicleKind === 'moto' ? 0.08 : 0.22);
  const heading = sample?.heading ?? vehicle.mesh.rotation.y;
  return {
    center: {
      x: sample?.x ?? vehicle.mesh.position.x,
      z: sample?.z ?? vehicle.mesh.position.z,
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

function vehicleFootprintsOverlap(a, b) {
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

function hasTrafficConflictPriority(vehicle, other) {
  const vehicleRank = getRoundaboutPriorityRank(vehicle);
  const otherRank = getRoundaboutPriorityRank(other);
  if (vehicleRank !== otherRank) return vehicleRank > otherRank;

  const distanceLead = vehicle.distance - other.distance;
  if (Math.abs(distanceLead) > 0.7) return distanceLead > 0;

  const vehicleIndex = trafficRuntime?.vehicles.indexOf(vehicle) ?? 0;
  const otherIndex = trafficRuntime?.vehicles.indexOf(other) ?? 0;
  return vehicleIndex < otherIndex;
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

function findGlobalProximityBlocker(vehicle, candidateDistance) {
  const sample = getRouteSample(vehicle.route, candidateDistance);
  const candidateBox = getVehicleFootprintBox(vehicle, sample);
  let nearest = null;
  animatedObjects.forEach((other) => {
    if (other === vehicle || other.type !== 'vehicle' || other.route?.mode !== 'roundabout' || !other.mesh.visible) return;
    if (other.distance >= other.route.length + 0.8) return;
    const otherBox = getVehicleFootprintBox(other, null, 0.16);
    if (!isRelevantBodyBlocker(candidateBox, otherBox)) return;
    if (!vehicleFootprintsOverlap(candidateBox, otherBox)) return;
    const contactBox = getVehicleFootprintBox(vehicle, sample, 0.03);
    const otherContactBox = getVehicleFootprintBox(other, null, 0.03);
    const bodiesWouldTouch = vehicleFootprintsOverlap(contactBox, otherContactBox);
    if (!bodiesWouldTouch && hasTrafficConflictPriority(vehicle, other)) return;
    const centerDistance = Math.hypot(sample.x - other.mesh.position.x, sample.z - other.mesh.position.z);
    const minGap = Math.max(1.2, getVehicleFootprintGap(vehicle, other) * 0.35);
    const distance = Math.min(centerDistance, minGap * 0.25);
    if (!nearest || distance < nearest.distance) {
      nearest = { other, distance, minGap };
    }
  });
  return nearest;
}

function hasActualBodyContact(vehicle, candidateDistance, ignoredVehicle = null) {
  const sample = getRouteSample(vehicle.route, candidateDistance);
  const candidateBox = getVehicleFootprintBox(vehicle, sample, 0);
  return animatedObjects.some((other) => {
    if (other === ignoredVehicle) return false;
    if (other === vehicle || other.type !== 'vehicle' || other.route?.mode !== 'roundabout' || !other.mesh.visible) return false;
    if (other.distance >= other.route.length + 0.8) return false;
    const otherBox = getVehicleFootprintBox(other, null, 0);
    if (!isRelevantBodyBlocker(candidateBox, otherBox)) return false;
    return vehicleFootprintsOverlap(candidateBox, otherBox);
  });
}

function findBodyContactBlocker(vehicle, candidateDistance) {
  const sample = getRouteSample(vehicle.route, candidateDistance);
  const candidateBox = getVehicleFootprintBox(vehicle, sample, 0);
  let blocker = null;
  animatedObjects.forEach((other) => {
    if (other === vehicle || other.type !== 'vehicle' || other.route?.mode !== 'roundabout' || !other.mesh.visible) return;
    if (other.distance >= other.route.length + 0.8) return;
    const otherBox = getVehicleFootprintBox(other, null, 0);
    if (!vehicleFootprintsOverlap(candidateBox, otherBox)) return;
    const distance = Math.hypot(sample.x - other.mesh.position.x, sample.z - other.mesh.position.z);
    if (!blocker || distance < blocker.distance) blocker = { other, distance, minGap: 0 };
  });
  return blocker;
}

function getClearanceScoreAt(vehicle, candidateDistance, ignoredVehicle = null) {
  const sample = getRouteSample(vehicle.route, candidateDistance);
  const candidateBox = getVehicleFootprintBox(vehicle, sample, 0);
  let closest = Infinity;
  let blocked = false;
  animatedObjects.forEach((other) => {
    if (blocked || other === ignoredVehicle) return;
    if (other === vehicle || other.type !== 'vehicle' || other.route?.mode !== 'roundabout' || !other.mesh.visible) return;
    if (other.distance >= other.route.length + 0.8) return;
    const otherContactBox = getVehicleFootprintBox(other, null, 0);
    if (vehicleFootprintsOverlap(candidateBox, otherContactBox)) {
      blocked = true;
      closest = -Infinity;
      return;
    }
    const otherSafeBox = getVehicleFootprintBox(other, null, 0.18);
    if (vehicleFootprintsOverlap(getVehicleFootprintBox(vehicle, sample, 0.18), otherSafeBox)) {
      closest = Math.min(closest, 0.1);
      return;
    }
    closest = Math.min(closest, Math.hypot(sample.x - other.mesh.position.x, sample.z - other.mesh.position.z));
  });
  return blocked ? -Infinity : closest;
}

function getEscapeScoreAt(vehicle, candidateDistance, targetVehicle = null) {
  const sample = getRouteSample(vehicle.route, candidateDistance);
  const candidateBox = getVehicleFootprintBox(vehicle, sample, 0);
  const candidateSafeBox = getVehicleFootprintBox(vehicle, sample, 0.16);
  let closest = Infinity;
  let targetScore = 0;
  let targetDistance = Infinity;

  animatedObjects.forEach((other) => {
    if (other === vehicle || other.type !== 'vehicle' || other.route?.mode !== 'roundabout' || !other.mesh.visible) return;
    if (other.distance >= other.route.length + 0.8) return;

    const otherContactBox = getVehicleFootprintBox(other, null, 0);
    const otherSafeBox = getVehicleFootprintBox(other, null, 0.16);
    const centerDistance = Math.hypot(sample.x - other.mesh.position.x, sample.z - other.mesh.position.z);

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
    ? Math.hypot(vehicle.mesh.position.x - targetVehicle.mesh.position.x, vehicle.mesh.position.z - targetVehicle.mesh.position.z)
    : 0;
  const separationGain = targetVehicle && Number.isFinite(targetDistance) ? Math.max(-2, targetDistance - currentTargetDistance) : 0;
  return (targetVehicle ? targetScore + separationGain * 4 : 0) + Math.min(closest, 10);
}

function chooseEscapeDistance(vehicle, delta, targetVehicle = null) {
  const step = Math.max(0.18, (vehicle.speed || 5) * delta * 1.35);
  const candidates = [
    Math.min(vehicle.route.length + 1.5, vehicle.distance + step),
    Math.max(0, vehicle.distance - step),
    Math.min(vehicle.route.length + 1.5, vehicle.distance + step * 1.8),
    Math.max(0, vehicle.distance - step * 1.8),
    Math.min(vehicle.route.length + 1.5, vehicle.distance + step * 2.7),
    Math.max(0, vehicle.distance - step * 2.7),
    Math.min(vehicle.route.length + 1.5, vehicle.distance + step * 4.2),
    Math.max(0, vehicle.distance - step * 4.2),
    Math.min(vehicle.route.length + 1.5, vehicle.distance + step * 5.8),
    Math.max(0, vehicle.distance - step * 5.8),
  ];
  const currentScore = getEscapeScoreAt(vehicle, vehicle.distance, targetVehicle);
  let best = { distance: vehicle.distance, score: currentScore };
  candidates.forEach((distance) => {
    if (Math.abs(distance - vehicle.distance) < 0.01) return;
    const score = getEscapeScoreAt(vehicle, distance, targetVehicle);
    if (score === -Infinity) return;
    const directionBonus = distance > vehicle.distance ? 0.15 : 0;
    const option = { distance, score: score + directionBonus };
    if (!best || option.score > best.score) best = option;
  });
  if (best.score > currentScore + 0.05) return best.distance;
  if (targetVehicle && best.distance !== vehicle.distance && best.score > currentScore - 0.2) return best.distance;
  return vehicle.distance;
}

function requestVehicleSpace(vehicle, requester, t, depth = 0) {
  if (!vehicle || !requester || depth > 3) return;
  if (!vehicle.mesh?.visible || vehicle.type !== 'vehicle' || vehicle.route?.mode !== 'roundabout') return;
  if (vehicle.distance >= vehicle.route.length + 0.8) return;
  vehicle.spaceRequestFrom = requester;
  vehicle.spaceRequestUntil = Math.max(vehicle.spaceRequestUntil || 0, t + SPACE_REVERSE_MAX_SECONDS + SPACE_REVERSE_MIN_SECONDS);
  vehicle.reverseRequestedAt = vehicle.reverseRequestedAt || t;
}

function getReverseCooldownSeconds(vehicle) {
  const vehicleIndex = Math.max(0, trafficRuntime?.vehicles.indexOf(vehicle) ?? 0);
  const spread = SPACE_REVERSE_COOLDOWN_MAX_SECONDS - SPACE_REVERSE_COOLDOWN_MIN_SECONDS;
  return SPACE_REVERSE_COOLDOWN_MIN_SECONDS + ((vehicleIndex % 5) / 4) * spread;
}

function clearReverseCoordinatorIfIdle(t) {
  if (!trafficRuntime) return;
  const active = trafficRuntime.activeReverseVehicle;
  if (!active) return;
  if (!active.mesh?.visible || active.reverseUntil <= t || active.route?.mode !== 'roundabout') {
    trafficRuntime.activeReverseVehicle = null;
  }
}

function getReversePriority(vehicle) {
  const requestAge = vehicle.reverseRequestedAt || vehicle.spaceRequestUntil || 0;
  const outerDistanceScore = Math.max(0, vehicle.route?.entryS ?? 0) - vehicle.distance;
  const rearScore = vehicle.distance < (vehicle.route?.entryS ?? 0) ? 8 : 0;
  return rearScore + outerDistanceScore * 0.4 + (vehicle.blockedFor || 0) * 1.6 + requestAge * 0.02;
}

function getBestReverseCandidate() {
  if (!trafficRuntime) return null;
  let best = null;
  trafficRuntime.vehicles.forEach((vehicle) => {
    if (!vehicle.mesh?.visible || vehicle.type !== 'vehicle' || vehicle.route?.mode !== 'roundabout') return;
    if (vehicle.distance <= 0.05 || vehicle.distance >= vehicle.route.length + 0.8) return;
    if (!vehicle.spaceRequestFrom && !vehicle.reverseRequestedAt && (vehicle.blockedFor || 0) < SPACE_REVERSE_DELAY_SECONDS) return;
    const probeDistance = Math.max(0, vehicle.distance - 0.45);
    if (findBodyContactBlocker(vehicle, probeDistance)) return;
    const priority = getReversePriority(vehicle);
    if (!best || priority > best.priority) best = { vehicle, priority };
  });
  return best?.vehicle || null;
}

function canAcquireReverseSlot(vehicle, t) {
  clearReverseCoordinatorIfIdle(t);
  if (!trafficRuntime) return true;
  if (trafficRuntime.activeReverseVehicle && trafficRuntime.activeReverseVehicle !== vehicle) return false;
  if (!trafficRuntime.activeReverseVehicle && (trafficRuntime.reverseCooldownUntil || 0) > t) return false;
  const bestCandidate = getBestReverseCandidate();
  if (bestCandidate && bestCandidate !== vehicle) return false;
  trafficRuntime.activeReverseVehicle = vehicle;
  return true;
}

function releaseReverseSlot(vehicle, t, withCooldown = true) {
  if (!trafficRuntime || trafficRuntime.activeReverseVehicle !== vehicle) return;
  trafficRuntime.activeReverseVehicle = null;
  if (withCooldown) {
    trafficRuntime.reverseCooldownUntil = Math.max(trafficRuntime.reverseCooldownUntil || 0, t + getReverseCooldownSeconds(vehicle));
  }
}

function clearSpaceRequest(vehicle) {
  vehicle.spaceRequestFrom = null;
  vehicle.spaceRequestUntil = 0;
  vehicle.reverseRequestedAt = 0;
  vehicle.reverseBlockedBy = null;
  vehicle.reverseBlockedAt = 0;
}

function startSpaceReverse(vehicle, t, reason = 'blocked') {
  if (vehicle.reverseUntil > t) return true;
  if (!canAcquireReverseSlot(vehicle, t)) {
    vehicle.state = 'SPACE_READY';
    return false;
  }
  if (vehicle.distance <= 0.05) {
    vehicle.reverseBlockedBy = null;
    vehicle.reverseBlockedAt = t;
    releaseReverseSlot(vehicle, t, false);
    return false;
  }
  const probeDistance = Math.max(0, vehicle.distance - 0.45);
  const rearBlocker = findBodyContactBlocker(vehicle, probeDistance);
  if (rearBlocker) {
    vehicle.reverseBlockedBy = rearBlocker.other;
    vehicle.reverseBlockedAt = t;
    requestVehicleSpace(rearBlocker.other, vehicle, t);
    releaseReverseSlot(vehicle, t, false);
    return false;
  }
  vehicle.reverseBlockedBy = null;
  vehicle.reverseBlockedAt = 0;
  vehicle.reverseUntil = t + SPACE_REVERSE_MAX_SECONDS;
  vehicle.reverseStartedAt = t;
  vehicle.reverseReason = reason;
  vehicle.velocity = 0;
  return true;
}

function hasEnoughSpaceToStopReversing(vehicle, t) {
  if (!vehicle.reverseUntil || t - (vehicle.reverseStartedAt || t) < SPACE_REVERSE_MIN_SECONDS) return false;
  const requester = vehicle.spaceRequestFrom;
  if (requester?.mesh?.visible && requester.route?.mode === 'roundabout') {
    return isYieldTargetClear(requester, vehicle);
  }
  const forwardCheck = Math.min(vehicle.route.length, vehicle.distance + Math.max(0.75, (vehicle.speed || 5) * 0.18));
  return !hasActualBodyContact(vehicle, vehicle.distance) && !findGlobalProximityBlocker(vehicle, forwardCheck);
}

function stopSpaceReverse(vehicle, t = 0) {
  vehicle.reverseUntil = 0;
  vehicle.reverseStartedAt = 0;
  vehicle.reverseReason = null;
  vehicle.reverseBlockedBy = null;
  vehicle.reverseBlockedAt = 0;
  vehicle.velocity = 0;
  releaseReverseSlot(vehicle, t, true);
}

function abortSpaceReverse(vehicle, t) {
  vehicle.reverseUntil = 0;
  vehicle.reverseStartedAt = 0;
  vehicle.reverseReason = null;
  vehicle.velocity = 0;
  releaseReverseSlot(vehicle, t, false);
}

function resolveSpaceReverse(vehicle, delta, t) {
  if (vehicle.reverseUntil <= t) {
    if (vehicle.reverseUntil) {
      const shouldKeepReversing = !hasEnoughSpaceToStopReversing(vehicle, t) && vehicle.distance > 0.05;
      const reverseReason = vehicle.reverseReason || 'continue';
      stopSpaceReverse(vehicle, t);
      if (shouldKeepReversing && startSpaceReverse(vehicle, t, reverseReason)) {
        return resolveSpaceReverse(vehicle, delta, t);
      }
    }
    return false;
  }

  if (hasEnoughSpaceToStopReversing(vehicle, t)) {
    stopSpaceReverse(vehicle, t);
    clearSpaceRequest(vehicle);
    return false;
  }

  const reverseStep = Math.min((vehicle.speed || 5) * SPACE_REVERSE_SPEED_FACTOR * delta, (vehicle.speed || 5) * delta);
  const reverseDistance = Math.max(0, vehicle.distance - reverseStep);
  const rearBlocker = findBodyContactBlocker(vehicle, reverseDistance);
  if (rearBlocker) {
    requestVehicleSpace(rearBlocker.other, vehicle, t);
    abortSpaceReverse(vehicle, t);
    vehicle.velocity = 0;
    vehicle.state = 'SPACE_WAIT_REAR';
    applyVehicleRoutePose(vehicle, delta);
    return true;
  }

  vehicle.distance = reverseDistance;
  vehicle.velocity = 0;
  vehicle.blockedFor = Math.max(vehicle.blockedFor || 0, SPACE_REVERSE_DELAY_SECONDS);
  vehicle.state = 'SPACE_REVERSE';
  applyVehicleRoutePose(vehicle, delta);
  return true;
}

function resolveSpaceRequest(vehicle, delta, t) {
  const requester = vehicle.spaceRequestFrom;
  if (!requester || !requester.mesh?.visible) {
    clearSpaceRequest(vehicle);
    return false;
  }
  const requesterStillNeedsSpace = requester.route?.mode === 'roundabout' && !isYieldTargetClear(requester, vehicle);
  if (requesterStillNeedsSpace) {
    vehicle.spaceRequestUntil = Math.max(vehicle.spaceRequestUntil || 0, t + SPACE_REVERSE_MAX_SECONDS);
  } else if (t > (vehicle.spaceRequestUntil || 0)) {
    clearSpaceRequest(vehicle);
    return false;
  }

  if (!vehicle.reverseRequestedAt) vehicle.reverseRequestedAt = t;
  if (t - vehicle.reverseRequestedAt < SPACE_REVERSE_DELAY_SECONDS) {
    vehicle.velocity = 0;
    vehicle.state = 'SPACE_READY';
    return true;
  }

  if (startSpaceReverse(vehicle, t, 'requested')) {
    return resolveSpaceReverse(vehicle, delta, t);
  }

  if (vehicle.distance <= 0.05) {
    clearSpaceRequest(vehicle);
    vehicle.blockedFor = 0;
    return false;
  }

  vehicle.velocity = 0;
  vehicle.state = 'SPACE_WAIT_REAR';
  return true;
}

function tryCrawlOutWhenReverseBlocked(vehicle, delta, t, state = 'CLEARING_GRIDLOCK') {
  if (vehicle.distance > 0.05 || vehicle.reverseBlockedBy) return false;
  const crawlDistance = Math.min(vehicle.route.length + 1.5, vehicle.distance + Math.max(0.08, (vehicle.speed || 5) * delta * 0.45));
  if (hasActualBodyContact(vehicle, crawlDistance)) return false;
  vehicle.distance = crawlDistance;
  vehicle.velocity = 0;
  vehicle.blockedFor = SPACE_REVERSE_DELAY_SECONDS;
  vehicle.state = state;
  applyVehicleRoutePose(vehicle, delta);
  return true;
}

function applyVehicleRoutePose(vehicle, delta) {
  const sample = getRouteSample(vehicle.route, vehicle.distance);
  vehicle.mesh.position.set(sample.x, 0, sample.z);
  vehicle.mesh.rotation.y += Math.atan2(Math.sin(sample.heading - vehicle.mesh.rotation.y), Math.cos(sample.heading - vehicle.mesh.rotation.y)) * Math.min(1, delta * 8);
  if (vehicle.label) {
    vehicle.label.visible = vehicle.mesh.visible;
    vehicle.label.position.set(sample.x, 2.1, sample.z);
    const isSpaceState = vehicle.state?.startsWith('SPACE_');
    setTextSprite(vehicle.label, `${vehicle.route.id} ${vehicle.state}`, vehicle.state === 'WAITING_TO_ENTER' || isSpaceState ? '#EF9F27' : vehicle.state === 'CIRCULATING' ? '#E24B4A' : '#85B7EB');
  }
}

function isYieldTargetClear(vehicle, target) {
  if (!target || !target.mesh?.visible || !target.route) return true;
  const forwardCheck = Math.min(vehicle.route.length, vehicle.distance + 0.9);
  if (hasActualBodyContact(vehicle, vehicle.distance) || hasActualBodyContact(vehicle, forwardCheck)) return false;
  const minClearance = Math.max(2.4, getVehicleFootprintGap(vehicle, target) * 0.65);
  return Math.hypot(vehicle.mesh.position.x - target.mesh.position.x, vehicle.mesh.position.z - target.mesh.position.z) > minClearance;
}

function hasHigherPriorityEntryVehicle(vehicle) {
  const vehicleIndex = trafficRuntime?.vehicles.indexOf(vehicle) ?? -1;
  return trafficRuntime?.vehicles.some((other, otherIndex) => (
    other !== vehicle
    && otherIndex < vehicleIndex
    && other.type === 'vehicle'
    && other.route?.mode === 'roundabout'
    && other.mesh.visible
    && other.distance >= other.route.entryS - 1.2
    && other.distance <= other.route.entryS + 3.2
  ));
}

function releaseRoundaboutReservations(t) {
  if (!trafficRuntime?.entryReservations) return;
  trafficRuntime.entryReservations.forEach((reservation, approach) => {
    if (!reservation.vehicle.mesh.visible || reservation.vehicle.distance > reservation.vehicle.route.entryS + 5 || reservation.expiresAt < t) {
      trafficRuntime.entryReservations.delete(approach);
    }
  });
}

function canReserveRoundaboutEntry(vehicle, t) {
  releaseRoundaboutReservations(t);
  const existing = trafficRuntime.entryReservations.get(vehicle.route.approach);
  return !existing || existing.vehicle === vehicle;
}

function reserveRoundaboutEntry(vehicle, t) {
  trafficRuntime.entryReservations.set(vehicle.route.approach, {
    vehicle,
    expiresAt: t + 4,
  });
}

function updateRoundaboutVehicle(vehicle, delta, t) {
  if (!vehicle.mesh.visible) {
    if (canSpawnVehicle(vehicle, t)) resetVehicleOnRoute(vehicle, t);
    return true;
  }

  const route = vehicle.route;
  if (resolveSpaceReverse(vehicle, delta, t)) return true;

  const bodyContactBlocker = findBodyContactBlocker(vehicle, vehicle.distance);
  if (bodyContactBlocker) {
    vehicle.velocity = 0;
    vehicle.blockedFor = (vehicle.blockedFor || 0) + delta;
    if (vehicle.blockedFor >= SPACE_REVERSE_DELAY_SECONDS && startSpaceReverse(vehicle, t, 'body-contact')) {
      return resolveSpaceReverse(vehicle, delta, t);
    }
    if (vehicle.blockedFor >= SPACE_REVERSE_DELAY_SECONDS && tryCrawlOutWhenReverseBlocked(vehicle, delta, t)) {
      return true;
    }
    vehicle.state = 'SPACE_BLOCKED';
    applyVehicleRoutePose(vehicle, delta);
    return true;
  }

  if (vehicle.yieldingTo) {
    vehicle.yieldingTo = null;
    vehicle.yieldUntil = 0;
  }

  if (resolveSpaceRequest(vehicle, delta, t)) return true;

  const atEntryGate = vehicle.distance < route.entryS && vehicle.distance >= route.entryS - 3.2;
  const canEnter = canReserveRoundaboutEntry(vehicle, t) && !trafficRuntime.entryGrantedThisStep;
  const sameRouteAhead = findVehicleAhead(vehicle);
  const circulatingAhead = findCirculatingVehicleAhead(vehicle);
  const safeGap = route.safeGap + (vehicle.vehicleKind === 'bus' ? 2 : 0);
  let desiredSpeed = (vehicle.speed || 5) * (vehicle.distance >= route.entryS && vehicle.distance <= route.exitS ? route.turnSlowdown : 1);

  if (atEntryGate && !canEnter) {
    desiredSpeed = Math.min(desiredSpeed, Math.max(0, (route.entryS - 0.6 - vehicle.distance) * 2.4));
    vehicle.state = 'WAITING_TO_ENTER';
  } else if (vehicle.distance < route.entryS) {
    vehicle.state = 'APPROACHING';
  } else if (vehicle.distance <= route.exitS) {
    vehicle.state = 'CIRCULATING';
  } else {
    vehicle.state = 'EXITING';
  }

  [sameRouteAhead, circulatingAhead].forEach((ahead) => {
    if (!ahead || ahead.gap >= safeGap) return;
    desiredSpeed = Math.min(desiredSpeed, Math.max(0, (ahead.gap - safeGap * 0.55) * 1.55));
    if (vehicle.distance < route.entryS) vehicle.state = 'WAITING_TO_ENTER';
  });

  if (vehicle.distance < route.entryS) {
    const lookAheadDistance = Math.min(route.length, vehicle.distance + Math.max(1.4, desiredSpeed * Math.max(delta, 0.05)));
    const nearBlocker = findGlobalProximityBlocker(vehicle, lookAheadDistance);
    if (nearBlocker) {
      desiredSpeed = Math.min(desiredSpeed, Math.max(0, (nearBlocker.distance - nearBlocker.minGap * 0.78) * 1.8));
      vehicle.state = 'WAITING_TO_ENTER';
    }
  }

  if (vehicle.distance < route.entryS && vehicle.distance + desiredSpeed * delta >= route.entryS - 0.2) {
    reserveRoundaboutEntry(vehicle, t);
    trafficRuntime.entryGrantedThisStep = true;
  }

  vehicle.velocity += (desiredSpeed - vehicle.velocity) * Math.min(1, delta * 6);
  const despawnDistance = route.length + 1.5;
  const nextDistance = Math.min(despawnDistance, vehicle.distance + vehicle.velocity * delta);
  const hardBlocker = findGlobalProximityBlocker(vehicle, nextDistance);
  if (hardBlocker) {
    vehicle.velocity = 0;
    vehicle.blockedFor = (vehicle.blockedFor || 0) + delta;
    if (vehicle.blockedFor >= SPACE_REVERSE_DELAY_SECONDS && startSpaceReverse(vehicle, t, 'forward-blocked')) {
      return resolveSpaceReverse(vehicle, delta, t);
    } else if (vehicle.blockedFor >= SPACE_REVERSE_DELAY_SECONDS) {
      if (tryCrawlOutWhenReverseBlocked(vehicle, delta, t)) return true;
      vehicle.state = 'SPACE_WAIT_REAR';
    } else {
      const crawlDistance = Math.min(despawnDistance, vehicle.distance + Math.max(0.05, (vehicle.speed || 5) * delta * 0.35));
      const canCrawlOut = vehicle.blockedFor > 1.4
        && hasTrafficConflictPriority(vehicle, hardBlocker.other)
        && !hasActualBodyContact(vehicle, crawlDistance);
      if (canCrawlOut) {
        vehicle.distance = crawlDistance;
        vehicle.blockedFor = 0.5;
        vehicle.state = 'CLEARING_GRIDLOCK';
      } else if (vehicle.distance < route.entryS) {
        vehicle.state = 'WAITING_TO_ENTER';
      } else {
        vehicle.state = 'YIELDING';
      }
    }
  } else {
    vehicle.blockedFor = 0;
    vehicle.yieldingTo = null;
    vehicle.yieldUntil = 0;
    vehicle.distance = nextDistance;
  }
  vehicle.enteredIntersection = vehicle.distance >= route.entryS;
  vehicle.exitedIntersection = vehicle.distance >= route.exitS;

  if (vehicle.distance >= despawnDistance) {
    despawnVehicle(vehicle, t, 'EXITING');
    return true;
  }

  applyVehicleRoutePose(vehicle, delta);
  return true;
}

function updateTrafficVehicle(vehicle, delta, t, signal) {
  if (!vehicle.route) return false;
  if (vehicle.route.mode === 'roundabout') return updateRoundaboutVehicle(vehicle, delta, t);
  if (!vehicle.mesh.visible) {
    if (canSpawnVehicle(vehicle, t)) resetVehicleOnRoute(vehicle, t);
    return true;
  }

  const route = vehicle.route;
  const beforeStop = vehicle.distance < route.stopS - 0.1;
  const atStopGate = vehicle.distance < route.entryS && vehicle.distance >= route.stopS - 0.2;
  const signalAllowsEntry = signal.color === 'green' && signal.movement === route.movement;
  const mustWaitForSignal = !vehicle.enteredIntersection && (beforeStop || atStopGate) && !signalAllowsEntry;
  const mustWaitForReservation = !vehicle.enteredIntersection && vehicle.distance >= route.stopS - 2.5 && (isIntersectionReserved(vehicle) || isOutgoingBlocked(vehicle));
  const ahead = findVehicleAhead(vehicle);
  const safeGap = route.safeGap + (vehicle.vehicleKind === 'bus' ? 1.8 : 0);
  const targetSpeed = (vehicle.speed || 5) * route.turnSlowdown;
  let desiredSpeed = targetSpeed;

  if (mustWaitForSignal || mustWaitForReservation) {
    desiredSpeed = Math.min(desiredSpeed, Math.max(0, (route.stopS - vehicle.distance) * 2.2));
    vehicle.state = mustWaitForSignal ? 'red-wait' : 'reserved-wait';
  } else {
    vehicle.state = route.turn === 'straight' ? 'moving' : `${route.turn}-turn`;
  }

  if (ahead && ahead.gap < safeGap) {
    desiredSpeed = Math.min(desiredSpeed, Math.max(0, (ahead.gap - safeGap * 0.55) * 1.7));
    vehicle.state = 'queue';
  }

  vehicle.velocity += (desiredSpeed - vehicle.velocity) * Math.min(1, delta * 5.5);
  vehicle.distance += vehicle.velocity * delta;
  if (vehicle.distance >= route.entryS) vehicle.enteredIntersection = true;
  if (vehicle.distance >= route.exitS) vehicle.exitedIntersection = true;

  if (vehicle.distance >= route.length + 1.5) {
    despawnVehicle(vehicle, t);
    return true;
  }

  const sample = getRouteSample(route, vehicle.distance);
  vehicle.mesh.position.set(sample.x, 0, sample.z);
  vehicle.mesh.rotation.y += Math.atan2(Math.sin(sample.heading - vehicle.mesh.rotation.y), Math.cos(sample.heading - vehicle.mesh.rotation.y)) * Math.min(1, delta * 8);
  if (vehicle.label) {
    vehicle.label.visible = vehicle.mesh.visible;
    vehicle.label.position.set(sample.x, 2.1, sample.z);
    setTextSprite(vehicle.label, `${route.id} ${vehicle.state}`, vehicle.enteredIntersection && !vehicle.exitedIntersection ? '#E24B4A' : '#85B7EB');
  }
  return true;
}

function recoverRoundaboutGridlock(delta, t) {
  if (!trafficRuntime) return;
  const blockedVehicles = trafficRuntime.vehicles.filter((vehicle) => (
    vehicle.mesh?.visible
    && vehicle.type === 'vehicle'
    && vehicle.route?.mode === 'roundabout'
    && vehicle.distance < vehicle.route.length + 0.8
    && Math.abs(vehicle.velocity || 0) < 0.04
    && ((vehicle.blockedFor || 0) >= SPACE_REVERSE_DELAY_SECONDS || ['SPACE_BLOCKED', 'SPACE_WAIT_REAR', 'SPACE_READY', 'WAITING_TO_ENTER', 'YIELDING'].includes(vehicle.state))
  ));

  if (blockedVehicles.length < 3) {
    trafficRuntime.gridlockSince = 0;
    return;
  }

  trafficRuntime.gridlockSince ||= t;
  if (t - trafficRuntime.gridlockSince < GRIDLOCK_RECOVERY_SECONDS) return;

  clearReverseCoordinatorIfIdle(t);
  if (trafficRuntime.activeReverseVehicle?.reverseUntil > t) return;
  trafficRuntime.reverseCooldownUntil = Math.min(trafficRuntime.reverseCooldownUntil || 0, t + 0.25);

  const candidate = blockedVehicles
    .slice()
    .sort((a, b) => {
      if (hasTrafficConflictPriority(a, b)) return -1;
      if (hasTrafficConflictPriority(b, a)) return 1;
      return b.distance - a.distance;
    })[0];
  if (!candidate) return;

  const blocker = findBodyContactBlocker(candidate, candidate.distance) || findGlobalProximityBlocker(candidate, candidate.distance);
  const escapeDistance = chooseEscapeDistance(candidate, delta, blocker?.other || null);
  const crawlDistance = Math.min(candidate.route.length + 1.5, candidate.distance + Math.max(0.12, (candidate.speed || 5) * delta * 0.55));
  const nextDistance = escapeDistance > candidate.distance + 0.02 ? escapeDistance : crawlDistance;

  if (nextDistance > candidate.distance && !hasActualBodyContact(candidate, nextDistance)) {
    candidate.distance = nextDistance;
    candidate.velocity = 0;
    candidate.blockedFor = 0.4;
    candidate.state = 'CLEARING_GRIDLOCK';
    candidate.enteredIntersection = candidate.distance >= candidate.route.entryS;
    candidate.exitedIntersection = candidate.distance >= candidate.route.exitS;
    applyVehicleRoutePose(candidate, delta);
    trafficRuntime.gridlockSince = t + 0.6;
  }
}

function updateRoundaboutFleet(delta, t) {
  releaseRoundaboutReservations(t);
  trafficRuntime.entryGrantedThisStep = false;
  const roundaboutVehicles = trafficRuntime.vehicles.filter((vehicle) => vehicle.route?.mode === 'roundabout');
  const circulating = roundaboutVehicles
    .filter((vehicle) => vehicle.mesh.visible && vehicle.distance >= vehicle.route.entryS && vehicle.distance <= vehicle.route.exitS)
    .sort((a, b) => ccwAngleDistance(0, getRoundaboutAngle(b)) - ccwAngleDistance(0, getRoundaboutAngle(a)));
  const exiting = roundaboutVehicles
    .filter((vehicle) => vehicle.mesh.visible && vehicle.distance > vehicle.route.exitS)
    .sort((a, b) => b.distance - a.distance);
  const approaching = roundaboutVehicles
    .filter((vehicle) => vehicle.mesh.visible && vehicle.distance < vehicle.route.entryS)
    .sort((a, b) => b.distance - a.distance);
  const hidden = roundaboutVehicles.filter((vehicle) => !vehicle.mesh.visible);

  [...circulating, ...exiting, ...approaching, ...hidden].forEach((vehicle) => updateRoundaboutVehicle(vehicle, delta, t));
  recoverRoundaboutGridlock(delta, t);
}

function getLayer(name) {
  if (!layerGroups.has(name)) {
    const group = new THREE.Group();
    group.name = `smartcity-layer-${name}`;
    layerGroups.set(name, group);
  }
  return layerGroups.get(name);
}

function makeMaterial(color, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.12,
    ...options,
  });
  material.userData.baseOpacity = material.opacity;
  return material;
}

function lockOpacityForVehicle(root) {
  root.traverse((obj) => {
    if (!obj.material) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach((material) => {
      material.userData.lockOpacity = true;
      material.userData.baseOpacity = material.opacity;
    });
  });
}

function addLabel(parent, text, position, color = '#185FA5', scale = [2.8, 0.76, 1]) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 112;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(7, 20, 36, 0.82)';
  ctx.beginPath();
  ctx.roundRect(12, 12, 360, 74, 12);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 192, 50);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true }));
  sprite.position.set(...position);
  sprite.scale.set(...scale);
  parent.add(sprite);
  return sprite;
}

function findSceneBuilding(buildingId) {
  return smartcitySceneData.buildings.find((building) => building.id === buildingId);
}

function getBuildingAttachmentPosition(buildingId, preferredPos = null) {
  const building = findSceneBuilding(buildingId);
  if (!building) return preferredPos;
  const [w, h, d] = building.size;
  const [x, , z] = building.pos;
  const sideX = preferredPos ? Math.sign(preferredPos[0] - x) || 1 : 1;
  const sideZ = preferredPos ? Math.sign(preferredPos[2] - z) || 1 : 1;
  const useXFace = preferredPos ? Math.abs(preferredPos[0] - x) / Math.max(w, 0.1) >= Math.abs(preferredPos[2] - z) / Math.max(d, 0.1) : true;
  return useXFace
    ? [x + sideX * (w / 2 + 0.08), Math.max(2.8, h - 0.75), z + sideZ * Math.min(d * 0.25, 0.9)]
    : [x + sideX * Math.min(w * 0.25, 0.9), Math.max(2.8, h - 0.75), z + sideZ * (d / 2 + 0.08)];
}

function addGround(scene) {
  scene.background = new THREE.Color(0xb8dcf2);
  scene.fog = new THREE.Fog(0xb8dcf2, 70, 130);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(86, 86),
    makeMaterial(0x78af63, { roughness: 0.94 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const park = smartcitySceneData.park;
  const parkMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(park.size[0], park.size[1]),
    makeMaterial(0x52a861, { roughness: 0.92 }),
  );
  parkMesh.rotation.x = -Math.PI / 2;
  parkMesh.position.set(park.pos[0], 0.018, park.pos[2]);
  parkMesh.receiveShadow = true;
  scene.add(parkMesh);

  const water = smartcitySceneData.water;
  const waterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(water.size[0], water.size[1]),
    makeMaterial(0x72c8e8, {
      metalness: 0.35,
      roughness: 0.18,
      transparent: true,
      opacity: 0.78,
      emissive: 0x1c7ea5,
      emissiveIntensity: 0.08,
    }),
  );
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(water.pos[0], 0.04, water.pos[2]);
  scene.add(waterMesh);
  animatedObjects.push({ type: 'pulseOpacity', mesh: waterMesh, base: 0.7, amp: 0.12, speed: 1.25 });

  smartcitySceneData.grassPatches.forEach(([x, z, radius = 2.4]) => {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(radius, 18), makeMaterial(0x63b957, { roughness: 0.9 }));
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, 0.032, z);
    scene.add(patch);
  });
}

function addRoad(scene, road) {
  const roadMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(road.size[0], road.size[1]),
    makeMaterial(road.type === 'primary' ? 0x343b42 : 0x46515a, { roughness: 0.95 }),
  );
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.rotation.z = road.rotation || 0;
  roadMesh.position.set(road.pos[0], 0.06, road.pos[2]);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);
}

function addLaneMarking(scene, x, z, w, h, color = 0xffffff) {
  const stripe = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color }),
  );
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(x, 0.083, z);
  scene.add(stripe);
}

function addCrosswalkBars(scene, axis, side, roadWidth, intersectionHalfSize) {
  const barCount = 6;
  const barWidth = 0.34;
  const barGap = 0.42;
  const barSpan = Math.min(roadWidth * 0.72, 6.2);
  const start = intersectionHalfSize + 0.65;
  const verticalRoadStart = intersectionHalfSize + 4.2;

  if (axis === 'z') {
    const z = side * (verticalRoadStart + barSpan / 2);
    const startX = -((barCount - 1) * (barWidth + barGap)) / 2;
    for (let i = 0; i < barCount; i += 1) {
      const x = startX + i * (barWidth + barGap);
      addLaneMarking(scene, x, z, barWidth, barSpan);
    }
    return;
  }

  for (let i = 0; i < barCount; i += 1) {
    const offset = side * (start + i * (barWidth + barGap));
    addLaneMarking(scene, offset, 0, barSpan, barWidth);
  }
}

function addSideCrosswalkBars(scene, side, roadWidth, intersectionHalfSize) {
  const barCount = 6;
  const barWidth = 0.34;
  const barGap = 0.48;
  const barSpan = Math.min(roadWidth * 0.72, 6.2);
  const x = side * (intersectionHalfSize + 4.2 + barSpan / 2);
  const start = -((barCount - 1) * (barWidth + barGap)) / 2;

  for (let i = 0; i < barCount; i += 1) {
    const z = start + i * (barWidth + barGap);
    addLaneMarking(scene, x, z, barSpan, barWidth);
  }
}

function addLaneArrow(scene, x, z, rotation, kind) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.35), mat);
  shaft.rotation.x = -Math.PI / 2;
  group.add(shaft);

  const headShape = new THREE.Shape();
  headShape.moveTo(0, 0.52);
  headShape.lineTo(-0.45, -0.18);
  headShape.lineTo(0.45, -0.18);
  headShape.lineTo(0, 0.52);
  const head = new THREE.Mesh(new THREE.ShapeGeometry(headShape), mat);
  head.rotation.x = -Math.PI / 2;
  head.position.z = 0.86;
  group.add(head);

  if (kind === 'left') {
    const bend = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.95), mat);
    bend.rotation.x = -Math.PI / 2;
    bend.rotation.z = Math.PI / 2;
    bend.position.set(-0.38, 0, 0.55);
    group.add(bend);
  } else if (kind === 'right') {
    const bend = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.95), mat);
    bend.rotation.x = -Math.PI / 2;
    bend.rotation.z = Math.PI / 2;
    bend.position.set(0.38, 0, 0.55);
    group.add(bend);
  }

  group.position.set(x, 0.09, z);
  group.rotation.y = rotation;
  scene.add(group);
}

function addRoundabout(scene, layout) {
  const roundabout = trafficSceneData.roundabout;
  if (!roundabout?.enabled) return;

  const island = new THREE.Mesh(
    new THREE.CircleGeometry(roundabout.islandRadius, 48),
    makeMaterial(0x54a85f, { roughness: 0.9 }),
  );
  island.rotation.x = -Math.PI / 2;
  island.position.y = 0.11;
  island.receiveShadow = true;
  scene.add(island);

  const curb = new THREE.Mesh(
    new THREE.RingGeometry(roundabout.islandRadius, roundabout.islandRadius + 0.22, 56),
    new THREE.MeshBasicMaterial({ color: 0xe8ecef, side: THREE.DoubleSide }),
  );
  curb.rotation.x = -Math.PI / 2;
  curb.position.y = 0.125;
  scene.add(curb);

  const outerGuide = new THREE.Mesh(
    new THREE.RingGeometry(roundabout.laneRadius + roundabout.laneHalfWidth, roundabout.laneRadius + roundabout.laneHalfWidth + 0.08, 64),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
  );
  outerGuide.rotation.x = -Math.PI / 2;
  outerGuide.position.y = 0.12;
  scene.add(outerGuide);

  const yieldMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  [
    [0, -layout.stopOffset + 1.1, 0, 2.8, 0.14],
    [layout.stopOffset - 1.1, 0, Math.PI / 2, 2.8, 0.14],
    [0, layout.stopOffset - 1.1, Math.PI, 2.8, 0.14],
    [-layout.stopOffset + 1.1, 0, -Math.PI / 2, 2.8, 0.14],
  ].forEach(([x, z, rot, w, h]) => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(w, h), yieldMat);
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = rot;
    line.position.set(x, 0.13, z);
    scene.add(line);
  });

  [
    [roundabout.laneRadius, 0, Math.PI],
    [0, roundabout.laneRadius, -Math.PI / 2],
    [-roundabout.laneRadius, 0, 0],
    [0, -roundabout.laneRadius, Math.PI / 2],
  ].forEach(([x, z, rot]) => addLaneArrow(scene, x, z, rot, 'straight'));
}

function addRoadNetwork(scene) {
  smartcitySceneData.roads.forEach((road) => addRoad(scene, road));
  const eastWestRoad = smartcitySceneData.roads.find((road) => road.id === 'road-main-ew');
  const northSouthRoad = smartcitySceneData.roads.find((road) => road.id === 'road-main-ns');
  const halfEastWest = (eastWestRoad?.size[0] || 46) / 2;
  const halfNorthSouth = (northSouthRoad?.size[1] || 46) / 2;

  const layout = smartcitySceneData.roadLayout || {};
  const laneWidth = layout.laneWidth || 3.5;
  const roadHalf = laneWidth * 2;
  const stop = layout.stopOffset || 10.1;
  const noMarkingZone = roadHalf + 1.2;
  const inner = laneWidth * 0.5;
  const outer = laneWidth * 1.5;

  [-0.18, 0.18].forEach((offset) => {
    addLaneMarking(scene, 0, offset, eastWestRoad?.size[0] || 72, 0.08, 0xffcf4a);
    addLaneMarking(scene, offset, 0, 0.08, northSouthRoad?.size[1] || 72, 0xffcf4a);
  });

  for (let z = -halfNorthSouth + 2; z <= halfNorthSouth - 2; z += 2.2) {
    if (Math.abs(z) > noMarkingZone) {
      addLaneMarking(scene, -laneWidth, z, 0.1, 0.95);
      addLaneMarking(scene, laneWidth, z, 0.1, 0.95);
    }
  }
  for (let x = -halfEastWest + 2; x <= halfEastWest - 2; x += 2.2) {
    if (Math.abs(x) > noMarkingZone) {
      addLaneMarking(scene, x, -laneWidth, 0.95, 0.1);
      addLaneMarking(scene, x, laneWidth, 0.95, 0.1);
    }
  }

  addLaneMarking(scene, 0, -stop, roadHalf * 2, 0.18);
  addLaneMarking(scene, 0, stop, roadHalf * 2, 0.18);
  addLaneMarking(scene, -stop, 0, 0.18, roadHalf * 2);
  addLaneMarking(scene, stop, 0, 0.18, roadHalf * 2);

  const eastWestWidth = eastWestRoad?.size[1] || 8.8;
  const northSouthWidth = northSouthRoad?.size[0] || 8.8;
  addCrosswalkBars(scene, 'z', -1, northSouthWidth, eastWestWidth / 2);
  addCrosswalkBars(scene, 'z', 1, northSouthWidth, eastWestWidth / 2);
  addSideCrosswalkBars(scene, -1, eastWestWidth, northSouthWidth / 2);
  addSideCrosswalkBars(scene, 1, eastWestWidth, northSouthWidth / 2);

  addLaneArrow(scene, -inner, -16, 0, 'left');
  addLaneArrow(scene, -outer, -16, 0, 'right');
  addLaneArrow(scene, inner, 16, Math.PI, 'left');
  addLaneArrow(scene, outer, 16, Math.PI, 'right');
  addLaneArrow(scene, -16, inner, Math.PI / 2, 'left');
  addLaneArrow(scene, -16, outer, Math.PI / 2, 'right');
  addLaneArrow(scene, 16, -inner, -Math.PI / 2, 'left');
  addLaneArrow(scene, 16, -outer, -Math.PI / 2, 'right');
  addRoundabout(scene, layout);
}

function addBuilding(scene, data, muted = false) {
  const [w, h, d] = data.size;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    muted ? makeMaterial(0x9cc5d3, { transparent: true, opacity: 0.64 }) : createBuildingMaterials(data, w, h, d),
  );
  mesh.position.set(data.pos[0], h / 2, data.pos[2]);
  mesh.castShadow = !muted;
  mesh.receiveShadow = true;
  scene.add(mesh);

  if (data.roof) {
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.18, 0.22, d + 0.18),
      makeMaterial(0x56b45a, { roughness: 0.86 }),
    );
    roof.position.set(data.pos[0], h + 0.11, data.pos[2]);
    roof.castShadow = true;
    scene.add(roof);
  }

  if (data.accent && !muted) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, h * 0.54),
      makeMaterial(data.accent, { roughness: 0.62 }),
    );
    panel.position.set(data.pos[0] + w / 2 + 0.03, h * 0.46, data.pos[2]);
    panel.rotation.y = Math.PI / 2;
    scene.add(panel);
  }

  // Building labels were visually floating above the skyline; keep buildings clean.
}

function addCityStructures(scene) {
  smartcitySceneData.buildings.forEach((building) => addBuilding(scene, building, !building.label));
  smartcitySceneData.skybridges.forEach((bridge) => {
    const [w, h, d] = bridge.size;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      makeMaterial(0x70c6e6, { metalness: 0.6, roughness: 0.12, transparent: true, opacity: 0.72 }),
    );
    mesh.position.set(...bridge.pos);
    mesh.castShadow = true;
    scene.add(mesh);
  });
}

function addTree(scene, [x, z], scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 0.7 * scale, 7),
    makeMaterial(0x6b4423, { roughness: 0.82 }),
  );
  trunk.position.set(x, 0.35 * scale, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.55 * scale, 1.35 * scale, 9),
    makeMaterial(0x2f8f49, { roughness: 0.84 }),
  );
  crown.position.set(x, 1.12 * scale, z);
  crown.castShadow = true;
  scene.add(crown);
}

function addBench(scene, bench) {
  const group = new THREE.Group();
  const woodMat = makeMaterial(0x8a5a2b, { roughness: 0.78 });
  const metalMat = makeMaterial(0x475569, { metalness: 0.25, roughness: 0.55 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.42), woodMat);
  seat.position.y = 0.42;
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.36), woodMat);
  back.position.set(0, 0.78, -0.28);
  back.rotation.x = -0.18;
  group.add(back);

  [-0.62, 0.62].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.08), metalMat);
    leg.position.set(x, 0.2, 0.12);
    group.add(leg);
    const backLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.08), metalMat);
    backLeg.position.set(x, 0.36, -0.28);
    group.add(backLeg);
  });

  group.position.set(...bench.pos);
  group.rotation.y = bench.rot || 0;
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(group);
}

function addLandscape(scene) {
  smartcitySceneData.trees.forEach((tree, i) => addTree(scene, tree, i < 3 ? 0.72 : 1));
  smartcitySceneData.parkBenches?.forEach((bench) => addBench(scene, bench));

  const parking = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), makeMaterial(0x55606b, { roughness: 0.92 }));
  parking.rotation.x = -Math.PI / 2;
  parking.position.set(13, 0.065, 13);
  scene.add(parking);
}

function addWheel(group, x, y, z) {
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.14, 10),
    makeMaterial(0x16191d, { roughness: 0.6 }),
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  group.add(wheel);
  return wheel;
}

function addMotoWheel(group, z) {
  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.07, 8, 20),
    makeMaterial(0x101317, { roughness: 0.72 }),
  );
  tire.rotation.y = Math.PI / 2;
  tire.position.set(0, 0.28, z);
  tire.castShadow = true;
  group.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.055, 14),
    makeMaterial(0xc8d1d6, { metalness: 0.42, roughness: 0.34 }),
  );
  rim.rotation.z = Math.PI / 2;
  rim.position.set(0, 0.28, z);
  rim.castShadow = true;
  group.add(rim);
}

function createScooterModel(group, color) {
  const paint = makeMaterial(color, { metalness: 0.28, roughness: 0.42 });
  const dark = makeMaterial(0x111418, { roughness: 0.76 });
  const metal = makeMaterial(0xd7e0e5, { metalness: 0.55, roughness: 0.26 });
  const glass = makeMaterial(0xd9f4ff, { metalness: 0.12, roughness: 0.16, emissive: 0x85b7eb, emissiveIntensity: 0.16 });

  addMotoWheel(group, 0.58);
  addMotoWheel(group, -0.58);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.86), dark);
  floor.position.set(0, 0.42, -0.08);
  floor.castShadow = true;
  group.add(floor);

  const frontFairing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.72, 0.28), paint);
  frontFairing.position.set(0, 0.82, 0.43);
  frontFairing.rotation.x = -0.22;
  frontFairing.castShadow = true;
  group.add(frontFairing);

  const frontFender = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.42), paint);
  frontFender.position.set(0, 0.54, 0.62);
  frontFender.rotation.x = -0.18;
  frontFender.castShadow = true;
  group.add(frontFender);

  const rearBody = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.58), paint);
  rearBody.position.set(0, 0.68, -0.43);
  rearBody.rotation.x = 0.08;
  rearBody.castShadow = true;
  group.add(rearBody);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.62), dark);
  seat.position.set(0, 0.96, -0.34);
  seat.rotation.x = 0.05;
  seat.castShadow = true;
  group.add(seat);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.25), paint);
  head.position.set(0, 1.2, 0.62);
  head.rotation.x = -0.08;
  head.castShadow = true;
  group.add(head);

  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.035), glass);
  lamp.position.set(0, 1.2, 0.755);
  group.add(lamp);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.84, 8), metal);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 1.28, 0.62);
  handlebar.castShadow = true;
  group.add(handlebar);

  [-1, 1].forEach((side) => {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8), dark);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(side * 0.49, 1.28, 0.62);
    group.add(grip);

    const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.32, 6), metal);
    mirrorStem.rotation.z = side * 0.46;
    mirrorStem.position.set(side * 0.31, 1.43, 0.58);
    group.add(mirrorStem);

    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.035), dark);
    mirror.position.set(side * 0.42, 1.56, 0.57);
    mirror.rotation.y = side * 0.16;
    group.add(mirror);
  });

  const tailLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.07, 0.035),
    makeMaterial(0xe24b4a, { emissive: 0xe24b4a, emissiveIntensity: 0.18, roughness: 0.36 }),
  );
  tailLight.position.set(0, 0.82, -0.745);
  group.add(tailLight);
}

function addLimbBetween(group, from, to, radius, material) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const limb = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material);
  limb.position.copy(midpoint);
  limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  limb.castShadow = true;
  group.add(limb);
  return limb;
}

function createMotoRider(group, color) {
  const jacket = makeMaterial(0x26384a, { roughness: 0.68 });
  const pants = makeMaterial(0x171b21, { roughness: 0.78 });
  const skin = makeMaterial(0xd6a56f, { roughness: 0.54 });
  const helmet = makeMaterial(color, { metalness: 0.18, roughness: 0.36 });
  const visor = makeMaterial(0x22313f, { metalness: 0.2, roughness: 0.18 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.26), jacket);
  torso.position.set(0, 1.24, -0.12);
  torso.rotation.x = -0.52;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), skin);
  head.position.set(0, 1.58, 0.04);
  head.castShadow = true;
  group.add(head);

  const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), helmet);
  helmetShell.position.set(0, 1.62, 0.04);
  helmetShell.scale.set(1, 0.86, 1.08);
  helmetShell.castShadow = true;
  group.add(helmetShell);

  const helmetVisor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.055, 0.035), visor);
  helmetVisor.position.set(0, 1.63, 0.215);
  group.add(helmetVisor);

  [-1, 1].forEach((side) => {
    const shoulder = [side * 0.17, 1.37, -0.02];
    const grip = [side * 0.49, 1.28, 0.62];
    addLimbBetween(group, shoulder, grip, 0.035, jacket);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), skin);
    hand.position.set(...grip);
    hand.castShadow = true;
    group.add(hand);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.46, 8), pants);
    thigh.rotation.z = side * 0.25;
    thigh.rotation.x = Math.PI / 2.1;
    thigh.position.set(side * 0.12, 0.94, -0.16);
    thigh.castShadow = true;
    group.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.048, 0.42, 8), pants);
    shin.rotation.z = side * 0.18;
    shin.rotation.x = Math.PI / 2.7;
    shin.position.set(side * 0.16, 0.72, 0.14);
    shin.castShadow = true;
    group.add(shin);
  });
}

function createVehicle(vehicle) {
  const route = trafficRuntime?.routes.get(vehicle.routeId);
  const initialGate = route?.mode === 'roundabout' ? route.entryS : route?.stopS;
  const spawnFromOutside = route?.mode === 'roundabout';
  const initialDistance = route
    ? (spawnFromOutside ? 0 : Math.min(Math.max(0, initialGate - route.safeGap * 0.9), Math.max(0, vehicle.startDistance ?? (vehicle.startDelay || 0) * 1.6)))
    : 0;
  const group = new THREE.Group();
  const mat = makeMaterial(vehicle.color, { metalness: 0.35, roughness: 0.48 });
  const isBus = vehicle.type === 'bus';
  const isMoto = vehicle.type === 'moto';
  if (isMoto) {
    createScooterModel(group, vehicle.color);
    createMotoRider(group, vehicle.color);
  } else {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(isBus ? 2.1 : 1.7, 0.58, isBus ? 5.2 : 3.5),
      mat,
    );
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);
  }

  if (!isMoto) {
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(isBus ? 1.85 : 1.45, 0.45, isBus ? 3.8 : 1.55),
      makeMaterial(0xcfeeff, { metalness: 0.15, roughness: 0.22, transparent: true, opacity: 0.85 }),
    );
    cabin.position.set(0, 0.9, isBus ? -0.2 : -0.15);
    group.add(cabin);
  }

  if (!isMoto) {
    const wx = isBus ? 0.95 : 0.75;
    const wz = isBus ? 1.95 : 1.2;
    [[-wx, 0.22, wz], [wx, 0.22, wz], [-wx, 0.22, -wz], [wx, 0.22, -wz]].forEach(([x, y, z]) => addWheel(group, x, y, z));
  }

  lockOpacityForVehicle(group);

  if (route) {
    const sample = getRouteSample(route, initialDistance);
    group.position.set(sample.x, 0, sample.z);
    group.rotation.y = sample.heading;
  } else {
    group.position.set(vehicle.x, 0, vehicle.z);
    group.rotation.y = vehicle.rot;
  }
  getLayer('traffic').add(group);
  const mover = {
    mesh: group,
    ...vehicle,
    type: 'vehicle',
    vehicleKind: vehicle.type,
    route,
    routeId: route?.id || vehicle.routeId,
    distance: initialDistance,
    velocity: 0,
    blockedFor: 0,
    spaceRequestFrom: null,
    spaceRequestUntil: 0,
    reverseRequestedAt: 0,
    reverseUntil: 0,
    reverseStartedAt: 0,
    reverseReason: null,
    reverseBlockedBy: null,
    reverseBlockedAt: 0,
    respawnAt: spawnFromOutside ? (vehicle.startDelay || 0) : 0,
    state: spawnFromOutside ? 'WAITING_TO_SPAWN' : route ? 'queued' : 'moving',
    enteredIntersection: route ? initialDistance >= route.entryS : false,
    exitedIntersection: route ? initialDistance >= route.exitS : false,
    label: null,
    pos: vehicle.axis === 'z' ? vehicle.z : vehicle.x,
  };
  trafficRuntime?.vehicles?.push(mover);
  group.visible = !spawnFromOutside;
  if (route && trafficRuntime.debug) {
    mover.label = createTextSprite(vehicle.id || route.id, '#85B7EB');
    mover.label.scale.set(2.2, 0.72, 1);
    mover.label.visible = !spawnFromOutside;
    getLayer('traffic').add(mover.label);
  }
  animatedObjects.push(mover);
}

function addTrafficLight(light) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.3, 8), makeMaterial(0x424852, { metalness: 0.45 }));
  pole.position.y = 1.65;
  group.add(pole);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.92, 0.28), makeMaterial(0x202329));
  housing.position.y = 3.1;
  group.add(housing);
  const bulbs = [0xff2828, 0xffcc33, 0x25dd62].map((color, i) => {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x111111, emissiveIntensity: 0.08 }),
    );
    bulb.position.set(0, 3.35 - i * 0.28, 0.15);
    bulb.userData.signalColor = color;
    group.add(bulb);
    return bulb;
  });
  group.position.set(light.x, 0, light.z);
  group.rotation.y = light.rot;
  getLayer('traffic').add(group);
  getLayer('security').add(addCoverageCone([light.x, 2.9, light.z], light.rot + Math.PI));
  animatedObjects.push({ type: 'trafficLight', bulbs, approach: light.approach });
}

function addCoverageCone(pos, rotation = 0, radius = 2.35) {
  const spread = Math.PI / 5.4;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  for (let i = 0; i <= 18; i++) {
    const angle = -spread + (spread * 2 * i) / 18;
    shape.lineTo(Math.sin(angle) * radius, Math.cos(angle) * radius);
  }
  shape.lineTo(0, 0);

  const material = new THREE.MeshBasicMaterial({
    color: 0x85b7eb,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  material.userData.baseOpacity = material.opacity;

  const fan = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  fan.position.set(pos[0], Math.min(Math.max(pos[1] * 0.18, 0.75), 2.35), pos[2]);
  fan.rotation.set(-Math.PI / 2, 0, rotation);
  fan.renderOrder = 2;
  return fan;
}

function addCamera(cam) {
  const group = new THREE.Group();
  const isBuildingCamera = Boolean(cam.buildingId);
  if (!isBuildingCamera) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.7, 7), makeMaterial(0x6b7280, { metalness: 0.4 }));
    pole.position.y = 0.35;
    group.add(pole);
  } else {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.36), makeMaterial(0x6b7280, { metalness: 0.35 }));
    bracket.position.z = -0.18;
    group.add(bracket);
  }
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.14, 0.18),
    makeMaterial(0x378add, { emissive: 0x185fa5, emissiveIntensity: 0.28 }),
  );
  body.position.y = isBuildingCamera ? 0 : 0.78;
  group.add(body);
  const mountPos = getBuildingAttachmentPosition(cam.buildingId, cam.pos) || cam.pos;
  group.position.set(...mountPos);
  group.rotation.y = cam.rot || 0;
  getLayer('security').add(group);
  getLayer('security').add(addCoverageCone(mountPos, cam.rot || 0));
}

function addTrafficLayer() {
  const layout = smartcitySceneData.roadLayout || trafficSceneData.roadLayout || {};
  const cycle = trafficSceneData.signalCycle || { phases: [], yellowSeconds: 3, allRedSeconds: 1 };
  trafficRuntime = {
    layout,
    cycle,
    mode: trafficSceneData.roundabout?.enabled ? 'roundabout' : 'signal',
    routes: buildTrafficRoutes(layout),
    debug: isTrafficDebugEnabled(),
    vehicles: [],
    entryReservations: new Map(),
    entryGrantedThisStep: false,
    activeReverseVehicle: null,
    reverseCooldownUntil: 0,
    gridlockSince: 0,
    lastSpawnAt: -Infinity,
    phaseSprite: null,
  };
  if (trafficRuntime.debug && typeof window !== 'undefined') window.__smartcityTrafficRuntime = trafficRuntime;
  smartcitySceneData.vehicles.forEach(createVehicle);
  if (trafficRuntime.debug) {
    console.info('[traffic-debug] routes/vehicles', trafficRuntime.routes.size, JSON.stringify(trafficRuntime.vehicles.map((vehicle) => ({
      id: vehicle.id,
      routeId: vehicle.routeId,
      hasRoute: Boolean(vehicle.route),
      state: vehicle.state,
    }))));
  }
  smartcitySceneData.trafficLights.forEach(addTrafficLight);
  smartcitySceneData.densityMarkers.forEach((marker) => addStatusMarker(marker, 'traffic'));
  if (trafficRuntime.debug) {
    addTrafficDebugLayer(getLayer('traffic'));
  }
}

function addSecurityLayer() {
  smartcitySceneData.cameras.forEach(addCamera);
}

function addEnvironmentLayer() {
  smartcitySceneData.sensors.forEach((sensor) => {
    const station = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 8), makeMaterial(0x46616f));
    pole.position.y = 0.9;
    station.add(pole);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), makeMaterial(0x1d9e75, { emissive: 0x1d9e75, emissiveIntensity: 0.22 }));
    head.position.y = 1.9;
    station.add(head);
    station.position.set(sensor.pos[0], 0, sensor.pos[2]);
    getLayer('environment').add(station);
  });
}

function addUtilitiesLayer() {
  const colors = { power: 0xef9f27, water: 0x2d9cdb, lighting: 0xffdd58, iot: 0x85b7eb };
  smartcitySceneData.utilities.forEach((utility) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.1, 1.15), makeMaterial(colors[utility.type] || 0x85b7eb));
    body.position.y = 0.55;
    group.add(body);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.15, 8), makeMaterial(0xffffff));
    antenna.position.y = 1.68;
    group.add(antenna);
    const statusColor = utility.status === 'warning' ? 0xef9f27 : 0x1d9e75;
    const status = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 10),
      new THREE.MeshBasicMaterial({ color: statusColor }),
    );
    status.position.set(0.48, 1.24, 0.48);
    group.add(status);
    group.position.set(...utility.pos);
    getLayer('utilities').add(group);
  });
}

function addStatusMarker(marker, layerName = marker.group) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.04, 8, 28),
    new THREE.MeshBasicMaterial({ color: marker.color }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), new THREE.MeshBasicMaterial({ color: marker.color }));
  core.position.y = 0.18;
  group.add(core);
  const markerY = marker.pos[1] > 2 ? 0.45 : marker.pos[1];
  group.position.set(marker.pos[0], markerY, marker.pos[2]);
  getLayer(layerName).add(group);
  animatedObjects.push({ type: 'pulseScale', mesh: group, base: 1, amp: 0.18, speed: 2.4 });
}

function addIncidents() {
  smartcitySceneData.incidents.forEach((incident) => addStatusMarker(incident));
}

function addReportsLayer() {
  // Report metrics stay in the UI panels; avoid adding 3D columns over the city map.
}

function buildCity(scene) {
  addGround(scene);
  addRoadNetwork(scene);
  addCityStructures(scene);
  addLandscape(scene);
  addTrafficLayer(scene);
  addSecurityLayer(scene);
  addEnvironmentLayer(scene);
  addUtilitiesLayer(scene);
  addIncidents(scene);
  addReportsLayer(scene);

  groupKeys.forEach((key) => {
    const group = getLayer(key);
    scene.add(group);
    emphasisTargets.set(group, { targetOpacity: 0.62, targetScale: 1 });
  });
}

function setupRenderer(container) {
  const w = container.clientWidth || 640;
  const h = container.clientHeight || 480;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.45));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);
  rendererEl = renderer.domElement;
  return { renderer, w, h };
}

function setupEnvironment(scene, renderer) {
  pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
}

function setGroupEmphasis(groupName, emphasized) {
  const group = getLayer(groupName);
  const target = emphasisTargets.get(group);
  if (!target) return;
  target.targetOpacity = emphasized ? 1 : 0.48;
  target.targetScale = emphasized ? 1.035 : 1;
}

function setReportOverlaysVisible(visible) {
  const group = getLayer('reports');
  group.visible = visible;
}

function applyLayerFocus(pageId) {
  const focused = groupKeys.includes(pageId) ? pageId : null;
  setGroupEmphasis('traffic', pageId === 'traffic' || pageId === 'security');
  setGroupEmphasis('security', pageId === 'security' || pageId === 'traffic');
  setGroupEmphasis('environment', pageId === 'environment');
  setGroupEmphasis('utilities', pageId === 'utilities');
  setGroupEmphasis('reports', pageId === 'reports');
  setReportOverlaysVisible(pageId === 'reports');

  if (!focused && pageId === 'overview') {
    groupKeys.forEach((key) => setGroupEmphasis(key, key !== 'reports'));
    setReportOverlaysVisible(false);
  }
}

function updateGroupMaterials(delta) {
  emphasisTargets.forEach((target, group) => {
    group.scale.lerp(new THREE.Vector3(target.targetScale, target.targetScale, target.targetScale), Math.min(1, delta * 5));
    group.traverse((obj) => {
      if (!obj.material || obj.isSprite) return;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((material) => {
        if (material.userData.lockOpacity) return;
        if (material.opacity === undefined) return;
        const baseOpacity = material.userData.baseOpacity ?? 1;
        const desiredOpacity = baseOpacity * target.targetOpacity;
        if (material.transparent || desiredOpacity < 1) material.transparent = true;
        material.opacity += (desiredOpacity - material.opacity) * Math.min(1, delta * 4);
      });
    });
  });
}

function updateAnimations(clock, delta) {
  const t = clock.getElapsedTime();
  const signal = trafficRuntime?.mode === 'signal' ? getSignalState(trafficRuntime.cycle, t) : null;
  if (trafficRuntime?.debug && !trafficRuntime.loggedFirstTick) {
    trafficRuntime.loggedFirstTick = true;
    console.info('[traffic-debug] first animation tick', JSON.stringify({ delta, mode: trafficRuntime.mode, signal: signal?.label, color: signal?.color }));
  }
  if (trafficRuntime?.phaseSprite && signal) {
    setTextSprite(trafficRuntime.phaseSprite, `${signal.label} / ${signal.color}`, signal.color === 'green' ? '#1D9E75' : signal.color === 'yellow' ? '#EF9F27' : '#E24B4A');
  } else if (trafficRuntime?.phaseSprite && trafficRuntime.mode === 'roundabout') {
    setTextSprite(trafficRuntime.phaseSprite, 'ROUNDABOUT / YIELD', '#1D9E75');
  }
  if (trafficRuntime?.debug && t - (trafficRuntime.lastSummaryAt || 0) > 5) {
    trafficRuntime.lastSummaryAt = t;
    console.info('[traffic-debug] vehicle summary', JSON.stringify(trafficRuntime.vehicles.slice(0, 6).map((vehicle) => ({
      id: vehicle.id,
      routeId: vehicle.routeId,
      state: vehicle.state,
      distance: Math.round(vehicle.distance * 10) / 10,
      velocity: Math.round(vehicle.velocity * 10) / 10,
    }))));
  }
  if (trafficRuntime?.mode === 'roundabout') {
    let remaining = Math.min(delta, 0.08);
    while (remaining > 0) {
      const step = Math.min(remaining, 0.025);
      updateRoundaboutFleet(step, t);
      remaining -= step;
    }
  }
  animatedObjects.forEach((item) => {
    if (item.type === 'trafficLight') {
      if (trafficRuntime?.mode === 'roundabout') {
        item.bulbs.forEach((bulb) => {
          bulb.material.emissive.setHex(0x111111);
          bulb.material.emissiveIntensity = 0.04;
        });
        return;
      }
      const lightGroups = TRAFFIC_LIGHT_GROUPS[item.approach] || [];
      const colorIndex = signal?.color === 'green' && lightGroups.includes(signal.movement) ? 2 : signal?.color === 'yellow' && lightGroups.includes(signal.movement) ? 1 : 0;
      item.bulbs.forEach((bulb, i) => {
        const on = i === colorIndex;
        bulb.material.emissive.setHex(on ? bulb.userData.signalColor : 0x111111);
        bulb.material.emissiveIntensity = on ? 0.95 : 0.06;
      });
      return;
    }

    if (item.type === 'vehicle') {
      if (trafficRuntime?.mode === 'roundabout') return;
      if (trafficRuntime && updateTrafficVehicle(item, delta, t, signal)) return;
      const dir = item.axis === 'z'
        ? (item.rot === 0 ? 1 : -1)
        : (item.rot === Math.PI / 2 ? 1 : -1);
      item.pos += item.speed * dir * delta * 62;
      if (item.pos > item.max) item.pos = item.min;
      if (item.pos < item.min) item.pos = item.max;
      if (item.axis === 'z') item.mesh.position.z = item.pos;
      else item.mesh.position.x = item.pos;
      return;
    }

    if (item.type === 'pulseScale') {
      item.mesh.scale.setScalar(item.base + Math.sin(t * item.speed) * item.amp);
      return;
    }

    if (item.type === 'pulseOpacity') {
      item.mesh.material.opacity = item.base + Math.sin(t * item.speed) * item.amp;
    }
  });
}

function createScene(container, pageId) {
  showSceneLoading(container, true);
  const { renderer, w, h } = setupRenderer(container);
  const scene = new THREE.Scene();
  setupEnvironment(scene, renderer);
  setupLighting(scene, renderer);

  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 220);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2.08;
  controls.minDistance = 8;
  controls.maxDistance = 74;
  applyCameraPreset(camera, controls, pageId);

  buildCity(scene);
  applyLayerFocus(pageId);
  showSceneLoading(container, false);
  setSceneHint(container, smartcitySceneData.cameraPresets[pageId]?.hint || smartcitySceneData.cameraPresets.overview.hint);

  const clock = new THREE.Clock();
  let frameId;
  function animate() {
    frameId = requestAnimationFrame(animate);
    const delta = Math.min(0.05, clock.getDelta());
    updateAnimations(clock, delta);
    updateGroupMaterials(delta);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const ro = new ResizeObserver(() => sceneRefs?.onResize?.());
  ro.observe(container);

  sceneRefs = {
    camera,
    controls,
    container,
    renderer,
    onResize() {
      const host = rendererEl?.parentElement || container;
      const nw = host.clientWidth || 640;
      const nh = host.clientHeight || 480;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    },
    dispose() {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      controls.dispose();
      disposeSceneEnvironment();
      pmrem?.dispose();
      pmrem = null;
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((material) => {
            material.map?.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
      rendererEl?.remove();
      rendererEl = null;
      sceneRefs = null;
      layerGroups.clear();
      emphasisTargets.clear();
      animatedObjects.length = 0;
      trafficRuntime = null;
    },
  };

  return sceneRefs;
}

export function applyPageView(pageId, container = sceneRefs?.container) {
  if (!sceneRefs) return;
  currentPage = pageId;
  applyLayerFocus(pageId);
  tweenCamera(sceneRefs.camera, sceneRefs.controls, pageId).then((hint) => {
    if (hint && currentPage === pageId) setSceneHint(container || sceneRefs.container, hint);
  });
}

export function initSmartcityScene(pageId) {
  currentPage = pageId;
  const container = document.querySelector(`#page-${pageId} [data-mount="smartcity-scene"]`);
  if (!container) return;

  if (activeScene) {
    container.appendChild(rendererEl);
    activeScene.container = container;
    activeScene.onResize?.();
    applyPageView(pageId, container);
    return;
  }

  try {
    activeScene = createScene(container, pageId);
  } catch (err) {
    console.error('[smartcity-scene] Không khởi tạo được mô hình 3D:', err);
    showSceneLoading(container, false);
    activeScene = null;
  }
}

export function disposeSmartcityScene() {
  activeScene?.dispose();
  activeScene = null;
}
