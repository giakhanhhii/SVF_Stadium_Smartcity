import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { smartcitySceneData } from '../data/smartcity-scene-data.js';
import { trafficSceneData } from '../data/traffic-scene.js';
import { disposeSceneEnvironment } from './scene-building-materials.js';
import { setupLighting } from './scene-lighting.js';
import { applyCameraPreset, isCameraTweening, setSceneHint, showSceneLoading, tweenCamera, tweenCameraTo } from './smartcity-camera.js';
import { addProceduralCityFallback } from './smartcity-procedural-scene.js';
import {
  buildTrafficRoutes,
  ccwAngleDistance,
  getLaneTangentHeading as getVehiclePoseHeading,
  getRouteSample,
  getRouteSpawnS,
  getRouteStopLineS,
  normalizeAngle,
} from './traffic/traffic-lanes.js?v=roundabout-replay-20260625a';
import {
  distanceBetweenRouteSamples,
  findBodyContactBlocker,
  findGlobalProximityBlocker,
  getVehicleFootprintGap,
  getVehicleRouteSample,
} from './traffic/traffic-occupancy.js?v=roundabout-replay-20260625a';
import { createTrafficSpawner } from './traffic/traffic-spawn.js?v=roundabout-replay-20260625a';
import { createTextSprite, setTextSprite } from './smartcity-scene-sprites.js?v=sprites-20260626a';
import { createWorldMap } from './smartcity-world-map.js?v=worldmap-20260626a';
import { createIfcPicking } from './smartcity-ifc-picking.js?v=ifc-picking-20260626a';
import { setVehiclePoseFromLane } from './traffic/traffic-vehicle-pose.js?v=roundabout-replay-20260625a';
import {
  VEHICLE_MODEL_RELOAD_INTERVAL_SECONDS,
  cloneVehicleModel,
  loadVehicleModelTemplates,
  readVehicleModelAssetSignature,
  resetVehicleModelOpacity,
} from './traffic/traffic-vehicle-models.js?v=roundabout-reverse-20260625b';

let activeScene = null;
let activeScenePromise = null;
let rendererEl = null;
let sceneRefs = null;
let currentPage = 'overview';
let pmrem = null;

const groupKeys = ['traffic', 'security', 'environment', 'utilities', 'reports'];
const layerGroups = new Map();
const emphasisTargets = new Map();
const animatedObjects = [];
let trafficRuntime = null;
let trafficSpawner = null;
let cityPicking = null; // controller mạng ống + tòa TecnoPark (loader + picking) — tạo mỗi cảnh

// ===== Bản đồ thế giới georeferenced (toggle "Bật bản đồ" ở tab Tổng quan) =====
// State + dựng bản đồ đã tách sang ./smartcity-world-map.js (createWorldMap). Runtime chỉ
// giữ vị trí tòa TecnoPark cho "Đến TechnoPark" bằng camera 3D (focusTechnopark).
// Vị trí tòa TecnoPark trong cảnh (lấy từ technopark-transform.json) — đích "Đến TechnoPark"
// và là điểm neo của mô hình lên tọa độ thật (đáy tòa nhà nằm đúng pin trên bản đồ).
const TECHNOPARK_SCENE_POS = [29.78, 6, -38.3];

const ROUNDABOUT_MAX_SMOOTH_VEHICLES = 7;
const ROUNDABOUT_MAX_ACTIVE_PER_APPROACH = 3;
const ROUNDABOUT_MIN_SPAWN_INTERVAL_SECONDS = 0.7;
const ROUNDABOUT_HEADING_TURN_RATE = 4.8;
const ROUNDABOUT_MODEL_START_STAGGER_SECONDS = 0.75;
const REVERSE_HISTORY_SECONDS = 10;
const REVERSE_HISTORY_SAMPLE_SECONDS = 0.05;
// Lùi "từ từ": mỗi nhịp chỉ lùi một đoạn ngắn rồi kiểm tra lại đã thoát chưa.
// Cần thì lùi nhiều (lặp nhiều nhịp), không cần thì lùi ít (1 nhịp rồi dừng).
const REVERSE_PLAYBACK_CHUNK_SECONDS = 0.5;
// Còn ít hơn thế này trong lịch sử thì coi như hết đường lùi (không lùi xuyên / ra ngoài làn).
const REVERSE_PLAYBACK_MIN_DURATION = 0.15;
// Chạm thân + kẹt cứng quá lâu mới chủ động lùi (xe nhường trước, chỉ lùi khi thật sự kẹt).
const REVERSE_TRIGGER_BLOCKED_SECONDS = 2.2;
const REVERSE_PLAYBACK_STOP_SPEED = 0.45;
// "Đi xuyên": xe spawn TRƯỚC (ưu tiên) không bao giờ lùi. Nếu bị chặn đứng yên quá
// PHASE_THROUGH_TRIGGER_SECONDS thì luôn đi tiếp, đi xuyên qua xe cản trong
// PHASE_THROUGH_DURATION_SECONDS để phá thế kẹt, sau đó nếu lại bị chặn thì lặp lại.
const PHASE_THROUGH_TRIGGER_SECONDS = 2.5;
const PHASE_THROUGH_DURATION_SECONDS = 3;
const TRAFFIC_FIXED_STEP_SECONDS = 0.05;
const TRAFFIC_MAX_FIXED_STEPS = 5;
const TRAFFIC_ACCELERATION_METERS_PER_SECOND = 1.5;
const TRAFFIC_BRAKE_METERS_PER_SECOND = 3.0;
const SMARTCITY_TRAFFIC_RUNTIME_VERSION = 'roundabout-reverse-20260626a';
const SMARTCITY_MODEL_VERSION = 'technopark-20260625e';

function smartcityModelUrl(name) {
  return new URL(`../../models/smartcity/${name}.glb?v=${SMARTCITY_MODEL_VERSION}`, import.meta.url).href;
}

const STATIC_SCENE_ASSETS = ['terrain', 'roads', 'buildings', 'landscape'].map((name) => ({
  name,
  url: smartcityModelUrl(name),
}));
const TRAFFIC_LIGHTS_GLB_URL = smartcityModelUrl('traffic-lights');
const PIPES_GLB_URL = smartcityModelUrl('pipes');
let vehicleModelAssetSignature = null;
let vehicleModelReloadInFlight = false;
let trafficLightTransformsFromBlender = null;

// Mạng đường ống ngầm (twin.glb) + điều khiển làm mờ thành phố để lộ đường ống.
const PIPES_IFC_MAP_URL = new URL(
  `../../models/smartcity/pipes-ifc-map.json?v=${SMARTCITY_MODEL_VERSION}`,
  import.meta.url,
).href;

// Tòa TecnoPark (thay cho trung tâm thương mại cũ) — GLB nén Draco, đã đặt sẵn
// vị trí + tỉ lệ trong Blender (master) nên chỉ cần add vào gốc cảnh. Mỗi phần tử
// IFC bấm được để xem IOC info, giống mạng đường ống.
const TECHNOPARK_GLB_URL = smartcityModelUrl('technopark');
const TECHNOPARK_IFC_MAP_URL = new URL(
  `../../models/smartcity/technopark-ifc-map.json?v=${SMARTCITY_MODEL_VERSION}`,
  import.meta.url,
).href;
// Vị trí/tỉ lệ/xoay của tòa nhà (cập nhật mỗi lần lưu Blender) — áp lên GLB
// (GLB chỉ chứa hình học gốc) nên di chuyển/thu phóng trong Blender đồng bộ real-time.
const TECHNOPARK_TRANSFORM_URL = new URL(
  `../../models/smartcity/technopark-transform.json?v=${SMARTCITY_MODEL_VERSION}&t=${Date.now()}`,
  import.meta.url,
).href;
const cityFadeRoots = []; // các GLB tĩnh (terrain/roads/buildings/landscape)
let cityRevealAmount = 0; // 0 = thành phố đầy đủ, 1 = chỉ còn đường ống
let cityRevealDisplayed = 0; // giá trị đã làm mượt mỗi khung hình

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

function isDirectionAuditEnabled() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('directionAudit') === '1' || window.localStorage?.getItem('directionAudit') === '1';
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

function syncVehicleLaneState(vehicle) {
  if (!vehicle?.route) return;
  vehicle.laneId = vehicle.route.laneId || vehicle.route.id;
  vehicle.s = vehicle.distance;
  vehicle.signalGroup = vehicle.route.signalGroup || vehicle.route.movement || null;
}

function getLaneSignalState(vehicle, t) {
  const state = getSignalState(trafficRuntime.cycle, t);
  const signalGroup = vehicle.route?.signalGroup || vehicle.route?.movement;
  return {
    ...state,
    signalGroup,
    allowsEntry: state.color === 'green' && state.movement === signalGroup,
  };
}

// Đèn điều tiết lối vào vòng xuyến: cặp đối diện cùng pha (N+S, rồi E+W),
// xen kẽ vàng và toàn đỏ. Trả về 'green' | 'yellow' | 'red' cho từng hướng.
function getRoundaboutApproachSignal(approach, t, cfg) {
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

// Đặt đèn ngay trước vạch dừng của làn vào, lệch ra mép vỉa hè bên làn tới,
// mặt đèn quay về phía xe đang chạy tới để tài xế thấy trước khi tới vạch.
function computeRoundaboutLightTransforms() {
  const approaches = ['N', 'E', 'S', 'W'];
  const lateral = 2.6; // dịch ra mép đường, không nằm trên làn xe
  const backFromLine = 0.6; // nhích về phía trước vạch dừng một chút
  const out = [];
  approaches.forEach((approach) => {
    const route = trafficRuntime.routes.get(`${approach}-straight`)
      || [...trafficRuntime.routes.values()].find((r) => r.approach === approach);
    if (!route) return;
    const stopS = getRouteStopLineS(route);
    const stop = getRouteSample(route, stopS);
    const back = getRouteSample(route, Math.max(0, stopS - 1.2));
    let dx = stop.x - back.x;
    let dz = stop.z - back.z;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    // Vuông góc hướng tới, hướng ra xa tâm (mép vỉa hè bên làn vào).
    const ox = -dz;
    const oz = dx;
    out.push({
      approach,
      x: stop.x + ox * lateral - dx * backFromLine,
      z: stop.z + oz * lateral - dz * backFromLine,
      rot: Math.atan2(-dx, -dz),
    });
  });
  return out;
}

function getVehicleLengthAllowance(vehicle) {
  if (vehicle.vehicleKind === 'bus') return 5.2;
  if (vehicle.vehicleKind === 'moto') return 2.25;
  return 3.65;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function approachVehicleSpeed(currentSpeed, desiredSpeed, delta) {
  const current = Math.max(0, currentSpeed || 0);
  const target = Math.max(0, desiredSpeed || 0);
  const limit = (target >= current ? TRAFFIC_ACCELERATION_METERS_PER_SECOND : TRAFFIC_BRAKE_METERS_PER_SECOND) * delta;
  return clamp(current + clamp(target - current, -limit, limit), 0, target >= current ? target : current);
}

function stoppingSpeedForDistance(distance, brake = TRAFFIC_BRAKE_METERS_PER_SECOND) {
  return Math.sqrt(Math.max(0, 2 * brake * Math.max(0, distance)));
}

function findNearestVehicleAheadOnLane(vehicle, maxDistance = Infinity) {
  let nearest = null;
  animatedObjects.forEach((other) => {
    if (other === vehicle || other.type !== 'vehicle' || other.route !== vehicle.route || !other.mesh.visible) return;
    const gap = other.distance - vehicle.distance;
    if (gap <= 0 || gap > maxDistance) return;
    if (!nearest || gap < nearest.gap) nearest = { other, gap };
  });
  return nearest;
}

function applyCarFollowingSpeed(vehicle, desiredSpeed, ahead, safeGap, delta) {
  if (!ahead) return desiredSpeed;
  const vehicleLength = getVehicleLengthAllowance(ahead.other);
  const currentSpeed = Math.max(0, vehicle.velocity || 0);
  const leadSpeed = Math.max(0, ahead.other.velocity || 0);
  const closingSpeed = Math.max(0, currentSpeed - leadSpeed);
  const desiredGap = safeGap
    + vehicleLength * 0.45
    + currentSpeed * 0.7
    + (closingSpeed * closingSpeed) / (2 * TRAFFIC_BRAKE_METERS_PER_SECOND);
  if (ahead.gap >= desiredGap) return desiredSpeed;
  const gapRatio = clamp((ahead.gap - vehicleLength * 0.25) / Math.max(0.1, desiredGap), 0, 1);
  const smoothSpeed = desiredSpeed * gapRatio * gapRatio;
  const leadBound = leadSpeed + Math.max(0, ahead.gap - safeGap) * 0.35;
  return Math.min(desiredSpeed, Math.max(0, Math.min(smoothSpeed, leadBound)));
}

function addTrafficDebugLayer(parent) {
  trafficRuntime.routes.forEach((route) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(route.points.map((p) => new THREE.Vector3(p.x, 0.16, p.z)));
    const material = new THREE.LineBasicMaterial({ color: route.turn === 'left' ? 0x85b7eb : route.turn === 'right' ? 0x1d9e75 : 0xef9f27 });
    parent.add(new THREE.Line(geometry, material));
    const spawn = getRouteSample(route, getRouteSpawnS(route));
    const spawnHeading = getVehiclePoseHeading(route, getRouteSpawnS(route), 0);
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(Math.sin(spawnHeading), 0, Math.cos(spawnHeading)).normalize(),
      new THREE.Vector3(spawn.x, 0.34, spawn.z),
      2.2,
      route.mode === 'roundabout' ? 0x1d9e75 : 0x85b7eb,
      0.55,
      0.32,
    );
    parent.add(arrow);
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
    const label = createTextSprite(`${route.laneId || route.id} ${route.signalGroup || ''}`, '#85B7EB');
    label.scale.set(2.6, 0.72, 1);
    label.position.set(spawn.x, 1.6, spawn.z);
    parent.add(label);
  });
  trafficRuntime.phaseSprite = createTextSprite('traffic phase', '#EF9F27');
  trafficRuntime.phaseSprite.position.set(0, 5.2, -15);
  parent.add(trafficRuntime.phaseSprite);
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
    && distanceBetweenRouteSamples(other, other.distance, vehicle, vehicle.distance) < 4.2
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

function findApproachVehicleAhead(vehicle) {
  if (vehicle.route?.mode !== 'roundabout' || vehicle.distance >= vehicle.route.entryS) return null;
  let nearest = null;
  animatedObjects.forEach((other) => {
    if (
      other === vehicle
      || other.type !== 'vehicle'
      || other.route?.mode !== 'roundabout'
      || other.route.approach !== vehicle.route.approach
      || !other.mesh.visible
      || other.distance >= other.route.entryS + 0.3
    ) return;
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
  const sample = getVehicleRouteSample(vehicle, vehicle.distance);
  return normalizeAngle(Math.atan2(sample.z, sample.x));
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
  const radius = roundabout?.laneRadius || 6;
  const safeGap = roundabout?.entryYieldGap || 11.5;
  const minTimeToConflict = roundabout?.entryMinTimeToConflictSeconds || 2.3;
  const entryAngle = normalizeAngle(vehicle.route.entryAngle);
  return !animatedObjects.some((other) => {
    if (other === vehicle || other.type !== 'vehicle' || !isRoundaboutCirculating(other)) return false;
    const otherAngle = getRoundaboutAngle(other);
    const arcGapToEntry = ccwAngleDistance(otherAngle, entryAngle) * radius;
    const otherSpeed = Math.max(other.velocity || 0, other.speed || 4.5, 0.1);
    const timeToConflict = arcGapToEntry / otherSpeed;
    const requiredGap = getVehicleLengthAllowance(other) + safeGap;
    return arcGapToEntry < requiredGap && timeToConflict <= minTimeToConflict;
  });
}

function isRoundaboutExitClear(vehicle) {
  const roundabout = trafficSceneData.roundabout;
  return !animatedObjects.some((other) => {
    if (other === vehicle || other.type !== 'vehicle' || other.route?.mode !== 'roundabout' || !other.mesh.visible) return false;
    if (other.distance <= other.route.exitS) return false;
    const otherSample = getVehicleRouteSample(other, other.distance);
    return Math.hypot(otherSample.x - vehicle.route.exitPoint[0], otherSample.z - vehicle.route.exitPoint[1]) < (roundabout?.exitConflictRadius || 3.4);
  });
}

function shouldHoldRoundaboutApproachHeading(vehicle) {
  return vehicle.route?.mode !== 'roundabout'
    && Number.isFinite(vehicle.route?.entryS)
    && vehicle.distance < vehicle.route.entryS - 0.15
    && Math.abs(vehicle.velocity || 0) < 0.05;
}

function applyVehicleRoutePose(vehicle, delta) {
  const pose = setVehiclePoseFromLane(vehicle, {
    s: vehicle.distance,
    velocity: vehicle.velocity,
    holdApproachHeading: shouldHoldRoundaboutApproachHeading(vehicle),
    smoothHeading: vehicle.route?.mode === 'roundabout',
    delta,
    maxHeadingTurnRate: ROUNDABOUT_HEADING_TURN_RATE,
  });
  syncVehicleLaneState(vehicle);
  auditVehicleHeadingError(vehicle, pose.heading);
  auditVehicleLightDirection(vehicle, pose.heading);
  if (vehicle.label) {
    vehicle.label.visible = vehicle.mesh.visible;
    vehicle.label.position.set(pose.x, 2.1, pose.z);
    const isSpaceState = vehicle.state?.startsWith('SPACE_');
    setTextSprite(vehicle.label, `${vehicle.route.id} ${vehicle.state}`, vehicle.state === 'WAITING_TO_ENTER' || isSpaceState ? '#EF9F27' : vehicle.state === 'CIRCULATING' ? '#E24B4A' : '#85B7EB');
  }
  recordVehicleHistory(vehicle, delta);
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

function makeVehicleHistoryFrame(vehicle) {
  return {
    time: vehicle.historyTravelTime || 0,
    distance: vehicle.distance,
    speed: Math.max(0, vehicle.velocity || 0),
    position: vehicle.mesh.position.toArray(),
    quaternion: vehicle.mesh.quaternion.toArray(),
    rotation: [vehicle.mesh.rotation.x, vehicle.mesh.rotation.y, vehicle.mesh.rotation.z],
  };
}

function recordVehicleHistory(vehicle, delta, force = false) {
  if (!vehicle?.mesh?.visible || vehicle.reversePlayback) return;
  vehicle.historyElapsed = (vehicle.historyElapsed || 0) + delta;
  if (Math.max(0, vehicle.velocity || 0) > 0.05) {
    vehicle.historyTravelTime = (vehicle.historyTravelTime || 0) + delta;
  }
  vehicle.historySampleElapsed = (vehicle.historySampleElapsed || 0) + delta;
  if (!force && vehicle.historySampleElapsed < REVERSE_HISTORY_SAMPLE_SECONDS) return;
  vehicle.historySampleElapsed = 0;
  const frame = makeVehicleHistoryFrame(vehicle);
  const history = vehicle.movementHistory || (vehicle.movementHistory = []);
  const previous = history[history.length - 1];
  if (previous && Math.abs(previous.time - frame.time) < 0.0001) history[history.length - 1] = frame;
  else history.push(frame);
  const cutoff = frame.time - REVERSE_HISTORY_SECONDS;
  while (history.length > 2 && history[1].time < cutoff) history.shift();
}

function chooseSpawnPriorityVehicles(vehicle, other) {
  const vehicleOrder = Number.isFinite(vehicle.spawnOrder) ? vehicle.spawnOrder : Infinity;
  const otherOrder = Number.isFinite(other.spawnOrder) ? other.spawnOrder : Infinity;
  if (vehicleOrder !== otherOrder) {
    return vehicleOrder < otherOrder
      ? { priorityVehicle: vehicle, yielder: other }
      : { priorityVehicle: other, yielder: vehicle };
  }
  const vehicleIndex = trafficRuntime?.vehicles.indexOf(vehicle) ?? 0;
  const otherIndex = trafficRuntime?.vehicles.indexOf(other) ?? 0;
  return vehicleIndex <= otherIndex
    ? { priorityVehicle: vehicle, yielder: other }
    : { priorityVehicle: other, yielder: vehicle };
}

function isYieldingToPriority(vehicle, priorityVehicle) {
  return vehicle?.reversePriorityVehicle === priorityVehicle;
}

function getReversePlaybackFrame(history, targetTime) {
  if (!history.length) return null;
  if (targetTime <= history[0].time) return history[0];
  let upperIndex = history.length - 1;
  while (upperIndex > 0 && history[upperIndex - 1].time >= targetTime) upperIndex -= 1;
  const upper = history[upperIndex];
  const lower = history[Math.max(0, upperIndex - 1)];
  if (upper === lower || upper.time <= lower.time) return lower;
  const alpha = clamp((targetTime - lower.time) / (upper.time - lower.time), 0, 1);
  return {
    time: targetTime,
    distance: lower.distance + (upper.distance - lower.distance) * alpha,
    speed: lower.speed + (upper.speed - lower.speed) * alpha,
    position: lower.position.map((value, index) => value + (upper.position[index] - value) * alpha),
    quaternion: new THREE.Quaternion(...lower.quaternion)
      .slerp(new THREE.Quaternion(...upper.quaternion), alpha)
      .toArray(),
  };
}

function applyReversePlaybackFrame(vehicle, frame) {
  vehicle.distance = frame.distance;
  vehicle.s = frame.distance;
  vehicle.velocity = -Math.max(0.1, frame.speed || vehicle.speed || 0);
  vehicle.mesh.position.fromArray(frame.position);
  vehicle.mesh.quaternion.fromArray(frame.quaternion);
  vehicle.mesh.updateMatrix();
  vehicle.mesh.updateWorldMatrix(false, true);
  vehicle.displayHeading = vehicle.mesh.rotation.y;
  syncVehicleLaneState(vehicle);
  if (vehicle.label) {
    vehicle.label.visible = true;
    vehicle.label.position.set(frame.position[0], 2.1, frame.position[2]);
    setTextSprite(vehicle.label, `${vehicle.route.id} REVERSING_${vehicle.reverseAttempt}`, '#EF9F27');
  }
}

// Còn đủ lịch sử di chuyển để lùi tiếp một đoạn hay chưa (lùi theo đúng vệt đã đi
// nên không bao giờ đi xuyên xe khác hay lệch ra ngoài làn).
function hasReversibleHistory(vehicle) {
  const history = vehicle.movementHistory || [];
  if (history.length < 2) return false;
  return (history[history.length - 1].time - history[0].time) >= REVERSE_PLAYBACK_MIN_DURATION;
}

function beginReversePlayback(yielder, priorityVehicle, t) {
  if (!yielder?.route || !yielder.mesh?.visible) return false;
  if (yielder.reversePlayback) return true;
  if ((yielder.reverseCooldownUntil || 0) > t) return false;
  if (!hasReversibleHistory(yielder)) return false;
  const history = yielder.movementHistory;
  const attempt = (yielder.reverseAttempt || 0) + 1;
  const endTime = history[history.length - 1].time;
  const availableDuration = endTime - history[0].time;
  // Lùi từng nhịp ngắn (CHUNK) rồi kiểm tra lại; số nhịp không giới hạn nên xe có thể
  // lùi đến khi xe trước đi mới thôi, không bị kẹt vĩnh viễn như cách cũ (chỉ 3 lần).
  const duration = Math.min(REVERSE_PLAYBACK_CHUNK_SECONDS, availableDuration);
  if (duration < REVERSE_PLAYBACK_MIN_DURATION) return false;
  yielder.reverseAttempt = attempt;
  yielder.reversePriorityVehicle = priorityVehicle;
  yielder.reversePlayback = { attempt, duration, elapsed: 0, endTime, targetTime: endTime - duration };
  yielder.velocity = 0;
  yielder.state = 'REVERSING';
  if (trafficRuntime?.debug) console.info('[traffic-debug] reverse playback start', yielder.id, `attempt=${attempt}`, `duration=${duration.toFixed(2)}`, `priority=${priorityVehicle?.id}`);
  return true;
}

function hasReverseClearance(vehicle, priorityVehicle) {
  if (!priorityVehicle?.mesh?.visible) return true;
  const centerGap = distanceBetweenRouteSamples(vehicle, vehicle.distance, priorityVehicle, priorityVehicle.distance);
  const requiredGap = getVehicleFootprintGap(vehicle, priorityVehicle) + 0.8;
  const blocker = findGlobalProximityBlocker(
    vehicle,
    Math.min(vehicle.route.length, vehicle.distance + 0.35),
    animatedObjects,
    trafficRuntime?.vehicles,
  );
  return centerGap >= requiredGap && (!blocker || blocker.other !== priorityVehicle);
}

function finishReversePlayback(vehicle, t) {
  const playback = vehicle.reversePlayback;
  const priorityVehicle = vehicle.reversePriorityVehicle;
  const finalTime = playback?.targetTime ?? 0;
  vehicle.movementHistory = (vehicle.movementHistory || []).filter((frame) => frame.time <= finalTime + 0.0001);
  vehicle.historyTravelTime = finalTime;
  vehicle.historySampleElapsed = 0;
  vehicle.reversePlayback = null;
  vehicle.velocity = 0;
  const clear = hasReverseClearance(vehicle, priorityVehicle);
  // Chưa thoát mà vẫn còn lịch sử để lùi -> lùi tiếp nhịp nữa (không giới hạn số nhịp),
  // nên xe lùi đến khi xe trước đi mới thôi thay vì bỏ cuộc và kẹt cứng.
  if (!clear && hasReversibleHistory(vehicle)) {
    recordVehicleHistory(vehicle, 0, true);
    if (beginReversePlayback(vehicle, priorityVehicle, t)) return;
  }
  vehicle.reverseCooldownUntil = t + 0.3;
  vehicle.state = vehicle.distance < vehicle.route.entryS ? 'WAITING_TO_ENTER' : 'YIELDING';
  if (clear) {
    vehicle.reverseAttempt = 0;
    vehicle.reversePriorityVehicle = null;
  }
  recordVehicleHistory(vehicle, 0, true);
  if (trafficRuntime?.debug) console.info('[traffic-debug] reverse playback end', vehicle.id, `clear=${clear}`, `attempt=${vehicle.reverseAttempt || 0}`);
}

function resolveReversePlayback(vehicle, delta, t) {
  const playback = vehicle.reversePlayback;
  if (!playback || !vehicle.mesh.visible) return false;
  playback.elapsed = Math.min(playback.duration, playback.elapsed + delta);
  const targetTime = playback.endTime - playback.elapsed;
  const frame = getReversePlaybackFrame(vehicle.movementHistory || [], targetTime);
  if (frame) applyReversePlaybackFrame(vehicle, frame);
  vehicle.blockedFor = 0;
  vehicle.bodyContactFor = 0;
  vehicle.state = 'REVERSING';
  if (playback.elapsed >= playback.duration - 0.0001) finishReversePlayback(vehicle, t);
  return true;
}

// Xe ưu tiên (spawn trước, không lùi) bị chặn đứng yên quá lâu -> bật chế độ "đi xuyên".
// Trong lúc đi xuyên xe bỏ qua mọi vật cản và luôn tiến tới; xe đang lùi (spawn sau) thì
// không kích hoạt vì nó nhường đường bằng cách lùi chứ không đi xuyên.
function maybeStartPhaseThrough(vehicle, t) {
  if ((vehicle.phaseThroughUntil || 0) > t) return true;
  if (vehicle.reversePlayback || vehicle.reversePriorityVehicle) return false;
  if ((vehicle.blockedFor || 0) < PHASE_THROUGH_TRIGGER_SECONDS) return false;
  vehicle.phaseThroughUntil = t + PHASE_THROUGH_DURATION_SECONDS;
  vehicle.blockedFor = 0;
  vehicle.continuousReverse = false;
  if (trafficRuntime?.debug) console.info('[traffic-debug] phase-through start', vehicle.id, vehicle.routeId);
  return true;
}

function updateRoundaboutVehicle(vehicle, delta, t) {
  if (!vehicle.mesh.visible) {
    if (trafficSpawner?.canSpawnVehicle(vehicle, t)) trafficSpawner.resetVehicleOnRoute(vehicle, t);
    return true;
  }

  const route = vehicle.route;
  const yieldLineS = getRouteStopLineS(route);
  const beforeRoundaboutEntry = vehicle.distance < route.entryS - 0.15;

  if (resolveReversePlayback(vehicle, delta, t)) return true;
  if (vehicle.reversePriorityVehicle && hasReverseClearance(vehicle, vehicle.reversePriorityVehicle)) {
    vehicle.reversePriorityVehicle = null;
    vehicle.reverseAttempt = 0;
  }

  // Đang trong cửa sổ "đi xuyên": bỏ qua mọi xử lý nhường/lùi/chạm, chỉ đi tiếp.
  const phasingThrough = (vehicle.phaseThroughUntil || 0) > t;

  const bodyContactBlocker = phasingThrough ? null : findBodyContactBlocker(vehicle, vehicle.distance, animatedObjects);
  const stoppedNearBlocker = !phasingThrough && Math.abs(vehicle.velocity || 0) <= REVERSE_PLAYBACK_STOP_SPEED
    ? findGlobalProximityBlocker(
      vehicle,
      Math.min(route.length, vehicle.distance + 0.35),
      animatedObjects,
      trafficRuntime?.vehicles,
    )
    : null;
  const mutualBlocker = bodyContactBlocker || stoppedNearBlocker;
  if (mutualBlocker) {
    let { yielder, priorityVehicle } = chooseSpawnPriorityVehicles(vehicle, mutualBlocker.other);
    // Dây chuyền: nếu xe phía trước đang LÙI và chạm vào ta, ta phải lùi theo nó
    // (bất kể quyền ưu tiên) rồi sẽ tiến lại khi nó đi — lan truyền tự nhiên về phía sau.
    const blockerReversingIntoUs = Boolean(bodyContactBlocker) && Boolean(mutualBlocker.other.reversePlayback);
    if (blockerReversingIntoUs) {
      yielder = vehicle;
      priorityVehicle = mutualBlocker.other;
    }
    // Giống giao thông thật: gặp xe phía trước thì NHƯỜNG (dừng chờ), không lùi.
    // Chỉ chủ động lùi khi đã chạm thân VÀ kẹt cứng đủ lâu (cần thì lùi, không cần thì
    // chỉ nhường) — lùi từng nhịp ngắn tới khi thoát.
    const contactDeadlock = Boolean(bodyContactBlocker)
      && (yielder.blockedFor || 0) >= REVERSE_TRIGGER_BLOCKED_SECONDS
      && Math.abs(yielder.velocity || 0) <= REVERSE_PLAYBACK_STOP_SPEED;
    if ((blockerReversingIntoUs || contactDeadlock) && beginReversePlayback(yielder, priorityVehicle, t)) {
      if (yielder === vehicle) return resolveReversePlayback(vehicle, delta, t);
    } else if (yielder === vehicle) {
      vehicle.velocity = approachVehicleSpeed(vehicle.velocity, 0, delta);
      vehicle.state = beforeRoundaboutEntry ? 'WAITING_TO_ENTER' : 'YIELDING';
      vehicle.blockedFor = (vehicle.blockedFor || 0) + delta;
      // KHÔNG despawn giữa đường: nếu chưa thoát thì cứ nhường/lùi tiếp, không bao giờ
      // biến mất giữa đường. Lùi không giới hạn số nhịp đã đủ phá mọi thế kẹt thực tế.
      applyVehicleRoutePose(vehicle, delta);
      return true;
    }
  }
  vehicle.bodyContactFor = 0;

  if (vehicle.yieldingTo) {
    vehicle.yieldingTo = null;
    vehicle.yieldUntil = 0;
  }

  const entryBrakingDistance = Math.max(2.5, (vehicle.speed || 5) * 0.9);
  const atEntryGate = vehicle.distance < route.entryS
    && vehicle.distance >= yieldLineS - entryBrakingDistance;
  const existingReservation = trafficRuntime.entryReservations.get(route.approach);
  const hasOwnReservation = existingReservation?.vehicle === vehicle && existingReservation.expiresAt >= t;
  const hasRecentEntryClearance = atEntryGate && (vehicle.entryClearUntil || 0) >= t && vehicle.distance < route.entryS + 0.7;
  const entryClear = hasRecentEntryClearance || isRoundaboutEntryClear(vehicle);
  const canEnter = canReserveRoundaboutEntry(vehicle, t)
    && (!trafficRuntime.entryGrantedThisStep || hasOwnReservation)
    && entryClear
    && isRoundaboutExitClear(vehicle);
  const ignoreYieldingVehicle = (ahead) => (ahead && isYieldingToPriority(ahead.other, vehicle) ? null : ahead);
  const sameRouteAhead = ignoreYieldingVehicle(findVehicleAhead(vehicle));
  const approachAhead = ignoreYieldingVehicle(findApproachVehicleAhead(vehicle));
  const circulatingAhead = ignoreYieldingVehicle(findCirculatingVehicleAhead(vehicle));
  const safeGap = route.safeGap + (vehicle.vehicleKind === 'bus' ? 2 : 0);
  let desiredSpeed = vehicle.speed || 5;

  // Đèn tín hiệu CHỈ áp dụng trước vạch dừng, trước khi vào vòng xuyến.
  // Đã qua vạch / đã vào vòng xuyến => bỏ qua đèn, không bao giờ dừng trong vòng.
  const signalCfg = trafficRuntime.roundaboutSignal;
  let signalStop = false;
  if (signalCfg?.enabled && !vehicle.enteredIntersection) {
    const signalColor = getRoundaboutApproachSignal(route.approach, t, signalCfg);
    if (vehicle.runsRedLight) {
      // Xe vi phạm: KHÔNG dừng đèn. Đánh dấu vượt đèn đỏ khi cán vạch lúc đèn không xanh.
      // Cờ giữ tới khi xe despawn (reset ở resetVehicleOnRoute) để map 2D báo liên tục.
      if (signalColor !== 'green' && vehicle.distance >= yieldLineS - 0.4) {
        vehicle.redLightViolation = true;
      }
    } else if (vehicle.distance < yieldLineS - 0.02) {
      if (signalColor === 'red') {
        signalStop = true;
      } else if (signalColor === 'yellow') {
        // Vàng: dừng nếu còn phanh kịp trước vạch, nếu không thì đi tiếp.
        const distToStop = yieldLineS - vehicle.distance;
        signalStop = (vehicle.velocity || 0) <= stoppingSpeedForDistance(distToStop) + 0.05;
      }
    }
  }

  if (!atEntryGate && vehicle.distance < route.entryS - 0.4) {
    vehicle.entryClearUntil = 0;
  } else if (canEnter && vehicle.distance < route.entryS + 0.7) {
    vehicle.entryClearUntil = Math.max(vehicle.entryClearUntil || 0, t + 1.4);
  } else if (vehicle.distance < route.entryS - 0.4 && !entryClear) {
    vehicle.entryClearUntil = 0;
  }

  // Đang đi xuyên: luôn chạy hết tốc độ, bỏ qua cổng vào / đèn / giữ khoảng cách xe trước.
  if (phasingThrough) {
    vehicle.state = 'PHASING_THROUGH';
  } else if ((atEntryGate && !canEnter) || signalStop) {
    desiredSpeed = Math.min(desiredSpeed, stoppingSpeedForDistance(yieldLineS - vehicle.distance));
    vehicle.state = 'WAITING_TO_ENTER';
  } else if (vehicle.distance < route.entryS) {
    vehicle.state = 'APPROACHING';
  } else if (vehicle.distance <= route.exitS) {
    vehicle.state = 'CIRCULATING';
  } else {
    vehicle.state = 'EXITING';
  }

  if (!phasingThrough) {
    [sameRouteAhead, approachAhead, circulatingAhead].forEach((ahead) => {
      const followedSpeed = applyCarFollowingSpeed(vehicle, desiredSpeed, ahead, safeGap, delta);
      if (followedSpeed >= desiredSpeed) return;
      desiredSpeed = followedSpeed;
      if (vehicle.distance < route.entryS) vehicle.state = 'WAITING_TO_ENTER';
    });
  }

  if (vehicle.distance < route.entryS && vehicle.distance + desiredSpeed * delta >= route.entryS - 0.2) {
    reserveRoundaboutEntry(vehicle, t);
    trafficRuntime.entryGrantedThisStep = true;
  }

  vehicle.velocity = approachVehicleSpeed(vehicle.velocity, desiredSpeed, delta);
  const despawnDistance = route.length + 1.5;
  let nextDistance = Math.min(despawnDistance, vehicle.distance + vehicle.velocity * delta);
  const shouldHoldAtYieldLine = !phasingThrough
    && vehicle.state === 'WAITING_TO_ENTER'
    && vehicle.distance < route.entryS
    && (vehicle.distance > yieldLineS || (atEntryGate && !canEnter) || signalStop);
  if (shouldHoldAtYieldLine) {
    nextDistance = Math.min(nextDistance, yieldLineS);
    if (nextDistance >= yieldLineS - 0.001) vehicle.velocity = approachVehicleSpeed(vehicle.velocity, 0, delta);
  }
  const detectedHardBlocker = (phasingThrough || beforeRoundaboutEntry)
    ? null
    : findGlobalProximityBlocker(vehicle, nextDistance, animatedObjects, trafficRuntime?.vehicles);
  const hardBlocker = detectedHardBlocker && isYieldingToPriority(detectedHardBlocker.other, vehicle)
    ? null
    : detectedHardBlocker;
  if (hardBlocker) {
    vehicle.blockedFor = (vehicle.blockedFor || 0) + delta;
    // Bị chặn đứng yên quá lâu -> đi xuyên: từ frame này luôn đi tiếp (xuyên qua xe cản).
    if (maybeStartPhaseThrough(vehicle, t)) {
      vehicle.continuousReverse = false;
      vehicle.yieldingTo = null;
      vehicle.yieldUntil = 0;
      vehicle.state = 'PHASING_THROUGH';
      vehicle.distance = nextDistance;
    } else {
      vehicle.velocity = approachVehicleSpeed(vehicle.velocity, 0, delta);
      vehicle.continuousReverse = false;
      vehicle.state = beforeRoundaboutEntry ? 'WAITING_TO_ENTER' : 'YIELDING';
    }
  } else {
    if (!phasingThrough) vehicle.blockedFor = 0;
    vehicle.bodyContactFor = 0;
    vehicle.continuousReverse = false;
    vehicle.yieldingTo = null;
    vehicle.yieldUntil = 0;
    if (phasingThrough) vehicle.state = 'PHASING_THROUGH';
    vehicle.distance = nextDistance;
  }
  vehicle.enteredIntersection = vehicle.distance >= route.entryS;
  vehicle.exitedIntersection = vehicle.distance >= route.exitS;

  if (vehicle.distance >= despawnDistance) {
    trafficSpawner?.despawnVehicle(vehicle, t, 'EXITING');
    return true;
  }

  applyVehicleRoutePose(vehicle, delta);
  return true;
}

function updateTrafficVehicle(vehicle, delta, t, signal) {
  if (!vehicle.route) return false;
  if (vehicle.route.mode === 'roundabout') return updateRoundaboutVehicle(vehicle, delta, t);
  if (!vehicle.mesh.visible) {
    if (trafficSpawner?.canSpawnVehicle(vehicle, t)) trafficSpawner.resetVehicleOnRoute(vehicle, t);
    return true;
  }

  const route = vehicle.route;
  const laneSignal = getLaneSignalState(vehicle, t);
  const stopLineS = getRouteStopLineS(route);
  const beforeStop = vehicle.distance < stopLineS - 0.1;
  const atStopGate = vehicle.distance < route.entryS && vehicle.distance >= stopLineS - 0.2;
  const signalAllowsEntry = laneSignal.allowsEntry;
  const mustWaitForSignal = !vehicle.enteredIntersection && (beforeStop || atStopGate) && !signalAllowsEntry;
  const mustWaitForReservation = !vehicle.enteredIntersection && vehicle.distance >= stopLineS - 2.5 && (isIntersectionReserved(vehicle) || isOutgoingBlocked(vehicle));
  const ahead = findNearestVehicleAheadOnLane(vehicle);
  const safeGap = route.safeGap + (vehicle.vehicleKind === 'bus' ? 1.8 : 0);
  const targetSpeed = (vehicle.speed || 5) * route.turnSlowdown;
  let desiredSpeed = targetSpeed;

  if (mustWaitForSignal || mustWaitForReservation) {
    desiredSpeed = Math.min(desiredSpeed, Math.max(0, (stopLineS - vehicle.distance) * 2.2));
    vehicle.state = mustWaitForSignal ? 'red-wait' : 'reserved-wait';
  } else {
    vehicle.state = route.turn === 'straight' ? 'moving' : `${route.turn}-turn`;
  }

  const followedSpeed = applyCarFollowingSpeed(vehicle, desiredSpeed, ahead, safeGap, delta);
  if (followedSpeed < desiredSpeed) {
    desiredSpeed = followedSpeed;
    vehicle.state = 'queue';
  }

  vehicle.velocity += (desiredSpeed - vehicle.velocity) * Math.min(1, delta * 5.5);
  vehicle.distance += vehicle.velocity * delta;
  if (vehicle.distance >= route.entryS) vehicle.enteredIntersection = true;
  if (vehicle.distance >= route.exitS) vehicle.exitedIntersection = true;

  if (vehicle.distance >= route.length + 1.5) {
    trafficSpawner?.despawnVehicle(vehicle, t);
    return true;
  }

  applyVehicleRoutePose(vehicle, delta);
  if (vehicle.label) {
    vehicle.label.visible = vehicle.mesh.visible;
    setTextSprite(vehicle.label, `${route.id} ${laneSignal.signalGroup} ${vehicle.state}`, vehicle.enteredIntersection && !vehicle.exitedIntersection ? '#E24B4A' : '#85B7EB');
  }
  return true;
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

function getAverageNamedMeshWorldCenter(root, pattern) {
  const points = [];
  root.updateWorldMatrix(true, true);
  root.traverse((object) => {
    if (!object.isMesh || !pattern.test((object.name || '').toLowerCase())) return;
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;
    points.push(box.getCenter(new THREE.Vector3()));
  });
  if (!points.length) return null;
  return points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / points.length);
}

function getVehicleLightRouteAlignment(vehicle, routeHeading) {
  if (!vehicle?.mesh?.userData || vehicle.mesh.userData.vehicleModelSource !== 'glb') return null;
  const white = getAverageNamedMeshWorldCenter(vehicle.mesh, /(headlight|headlamp|front-head|front-lamp|scooter-front-headlamp)/);
  const red = getAverageNamedMeshWorldCenter(vehicle.mesh, /(taillight|tail-light|rear-light|brake-light)/);
  if (!white || !red) return null;
  const routeForward = new THREE.Vector3(Math.sin(routeHeading), 0, Math.cos(routeHeading));
  const lightForward = white.clone().sub(red).setY(0);
  if (lightForward.lengthSq() < 0.0001) return null;
  return lightForward.normalize().dot(routeForward);
}

function auditVehicleLightDirection(vehicle, routeHeading) {
  if (!trafficRuntime?.directionAudit) return;
  const alignment = getVehicleLightRouteAlignment(vehicle, routeHeading);
  if (alignment === null) return;
  const rounded = Math.round(alignment * 1000) / 1000;
  const currentMin = Number(document.documentElement.dataset.smartcityVehicleDirectionMinAlignment || 1);
  if (rounded < currentMin) {
    document.documentElement.dataset.smartcityVehicleDirectionMinAlignment = String(rounded);
    document.documentElement.dataset.smartcityVehicleDirectionWorst = `${vehicle.id}:${vehicle.routeId}:${vehicle.state}:${Math.round(vehicle.distance * 10) / 10}`;
  }
  if (rounded < 0.15) {
    document.documentElement.dataset.smartcityVehicleDirectionLastBad = `${vehicle.id}:${vehicle.routeId}:${vehicle.state}:${rounded}`;
  }
}

function auditVehicleHeadingError(vehicle, routeHeading) {
  if (!trafficRuntime?.directionAudit || vehicle.route?.mode !== 'roundabout') return;
  if (vehicle.mesh?.userData?.vehicleModelSource === 'glb') return;
  const error = Math.abs(Math.atan2(
    Math.sin(routeHeading - vehicle.mesh.rotation.y),
    Math.cos(routeHeading - vehicle.mesh.rotation.y),
  ));
  const rounded = Math.round(error * 1000) / 1000;
  const currentMax = Number(document.documentElement.dataset.smartcityVehicleRoundaboutMaxHeadingError || 0);
  if (rounded > currentMax) {
    document.documentElement.dataset.smartcityVehicleRoundaboutMaxHeadingError = String(rounded);
    document.documentElement.dataset.smartcityVehicleRoundaboutHeadingWorst = `${vehicle.id}:${vehicle.routeId}:${vehicle.state}:${Math.round(vehicle.distance * 10) / 10}`;
  }
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

function replaceMovingVehicleModels() {
  if (!trafficRuntime?.vehicles?.length) return;
  trafficRuntime.vehicles.forEach((vehicle) => refreshVehicleModelForSpawn(vehicle));
}

function refreshVehicleModelForSpawn(vehicle) {
  if (!vehicle?.mesh) return;
  const trafficLayer = getLayer('traffic');
  const replacement = cloneVehicleModel(vehicle);
  if (!replacement) return;
  replacement.position.copy(vehicle.mesh.position);
  replacement.quaternion.copy(vehicle.mesh.quaternion);
  replacement.visible = vehicle.mesh.visible;
  lockOpacityForVehicle(replacement);
  trafficLayer.add(replacement);
  trafficLayer.remove(vehicle.mesh);
  vehicle.mesh = replacement;
}

function updateVehicleModelHotReload(t) {
  if (!trafficRuntime || vehicleModelReloadInFlight || typeof fetch !== 'function') return;
  if (t - (trafficRuntime.lastVehicleModelCheckAt || 0) < VEHICLE_MODEL_RELOAD_INTERVAL_SECONDS) return;
  trafficRuntime.lastVehicleModelCheckAt = t;
  vehicleModelReloadInFlight = true;
  readVehicleModelAssetSignature()
    .then(async (signature) => {
      if (!vehicleModelAssetSignature) {
        vehicleModelAssetSignature = signature;
        return;
      }
      if (signature === vehicleModelAssetSignature) return;
      const reloaded = await loadVehicleModelTemplates(new GLTFLoader(), Date.now(), trafficRuntime.debug);
      if (!reloaded) return;
      vehicleModelAssetSignature = signature;
      replaceMovingVehicleModels();
      if (trafficRuntime.debug) console.info('[traffic-debug] reloaded vehicle models from vehicles.glb');
    })
    .catch(() => { })
    .finally(() => {
      vehicleModelReloadInFlight = false;
    });
}

function createVehicle(vehicle) {
  const route = trafficRuntime?.routes.get(vehicle.routeId);
  const spawnFromOutside = Boolean(route);
  const initialDistance = route ? getRouteSpawnS(route) : 0;
  const group = cloneVehicleModel(vehicle);
  if (!group) {
    if (trafficRuntime?.debug) console.info('[traffic-debug] skip vehicle without Blender model', vehicle.id, vehicle.routeId);
    return;
  }

  lockOpacityForVehicle(group);

  if (route) {
    setVehiclePoseFromLane({ route, mesh: group, distance: initialDistance, s: initialDistance, velocity: vehicle.speed || 0 });
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
    speed: vehicle.speed || 5,
    route,
    laneId: route?.laneId || route?.id || null,
    signalGroup: route?.signalGroup || route?.movement || null,
    routeId: route?.id || vehicle.routeId,
    distance: initialDistance,
    s: initialDistance,
    velocity: spawnFromOutside ? 0 : vehicle.speed || 0,
    blockedFor: 0,
    spaceRequestFrom: null,
    spaceRequestUntil: 0,
    reverseRequestedAt: 0,
    reverseUntil: 0,
    reverseStartedAt: 0,
    reverseReason: null,
    reverseBlockedBy: null,
    reverseBlockedAt: 0,
    continuousReverse: false,
    bodyContactFor: 0,
    entryClearUntil: 0,
    movementHistory: [],
    historyElapsed: 0,
    historyTravelTime: 0,
    historySampleElapsed: 0,
    spawnOrder: Infinity,
    reverseAttempt: 0,
    reversePlayback: null,
    reversePriorityVehicle: null,
    reverseCooldownUntil: 0,
    phaseThroughUntil: 0,
    redLightViolation: false,
    respawnAt: spawnFromOutside
      ? Math.max(vehicle.startDelay ?? 0, (trafficRuntime?.vehicles?.length || 0) * ROUNDABOUT_MODEL_START_STAGGER_SECONDS)
      : 0,
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
  animatedObjects.push({ type: 'trafficLight', bulbs, approach: light.approach });
}

function addCamera() { }

function addTrafficLayer() {
  const layout = smartcitySceneData.roadLayout || trafficSceneData.roadLayout || {};
  const cycle = trafficSceneData.signalCycle || { phases: [], yellowSeconds: 3, allRedSeconds: 1 };
  trafficRuntime = {
    layout,
    cycle,
    mode: trafficSceneData.roundabout?.enabled ? 'roundabout' : 'signal',
    roundabout: trafficSceneData.roundabout,
    roundaboutSignal: trafficSceneData.roundabout?.signal || null,
    routes: buildTrafficRoutes(layout),
    debug: isTrafficDebugEnabled(),
    directionAudit: isDirectionAuditEnabled(),
    vehicles: [],
    entryReservations: new Map(),
    entryGrantedThisStep: false,
    lastSpawnAt: -Infinity,
    lastSpawnAtByLane: new Map(),
    lastSpawnAtByApproach: new Map(),
    spawnSequence: 0,
    phaseSprite: null,
  };
  trafficSpawner = createTrafficSpawner({
    getVehicles: () => animatedObjects,
    getRuntime: () => trafficRuntime,
    getVehicleLengthAllowance,
    refreshVehicleModelForSpawn,
    resetVehicleModelOpacity,
    setVehiclePoseFromLane,
    syncVehicleLaneState,
    constants: {
      ROUNDABOUT_MAX_SMOOTH_VEHICLES,
      ROUNDABOUT_MAX_ACTIVE_PER_APPROACH,
      ROUNDABOUT_MIN_SPAWN_INTERVAL_SECONDS,
    },
  });
  if (typeof window !== 'undefined') {
    // Luôn chia sẻ runtime để camera 2D thời gian thực đọc đúng xe trong model 3D.
    window.__smartcityTrafficRuntime = trafficRuntime;
    document.documentElement.__smartcityTrafficRuntime = trafficRuntime;
    document.documentElement.dataset.smartcityTrafficRuntimeVersion = SMARTCITY_TRAFFIC_RUNTIME_VERSION;
  }
  if (trafficRuntime.debug && typeof window !== 'undefined') {
    if (trafficRuntime.directionAudit) {
      document.documentElement.dataset.smartcityVehicleDirectionMinAlignment = '1';
      delete document.documentElement.dataset.smartcityVehicleDirectionWorst;
      delete document.documentElement.dataset.smartcityVehicleDirectionLastBad;
    }
  }
  smartcitySceneData.vehicles.forEach(createVehicle);
  if (trafficRuntime.debug) {
    console.info('[traffic-debug] routes/vehicles', trafficRuntime.routes.size, JSON.stringify(trafficRuntime.vehicles.map((vehicle) => ({
      id: vehicle.id,
      routeId: vehicle.routeId,
      hasRoute: Boolean(vehicle.route),
      state: vehicle.state,
    }))));
  }
  // Ưu tiên transform từ smartcity-master.blend (traffic-lights.glb). Nếu chưa có,
  // dùng cách dựng cũ: vòng xuyến tính theo vạch dừng, ngã tư đèn dùng cấu hình tĩnh.
  const lightDefs = trafficLightTransformsFromBlender && trafficLightTransformsFromBlender.length
    ? trafficLightTransformsFromBlender
    : (trafficRuntime.mode === 'roundabout'
      ? computeRoundaboutLightTransforms()
      : smartcitySceneData.trafficLights);
  lightDefs.forEach(addTrafficLight);
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
  // Utility status blocks are kept out of the 3D city view for a cleaner map.
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
  // Incident rings are shown in the UI panels, not as colored 3D dots on the road.
}

function addReportsLayer() {
  // Report metrics stay in the UI panels; avoid adding 3D columns over the city map.
}

// Đọc 4 vị trí đèn tín hiệu từ traffic-lights.glb (xuất từ smartcity-master.blend).
// Trả về [{ approach, x, z, rot }] hoặc null nếu file chưa có / không có node nào hợp lệ.
async function loadTrafficLightTransforms(loader) {
  try {
    const gltf = await loader.loadAsync(TRAFFIC_LIGHTS_GLB_URL);
    const out = [];
    const fallbackApproaches = ['N', 'E', 'S', 'W'];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((node) => {
      const extras = node.userData || {};
      let approach = extras.approach || extras.Approach;
      if (!approach && typeof node.name === 'string') {
        const match = node.name.match(/traffic-light-([NESW])$/i);
        if (match) approach = match[1].toUpperCase();
      }
      if (!approach) return;
      if (out.some((entry) => entry.approach === approach)) return;
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      node.getWorldPosition(worldPos);
      node.getWorldQuaternion(worldQuat);
      const euler = new THREE.Euler().setFromQuaternion(worldQuat, 'YXZ');
      out.push({
        approach: approach.toUpperCase(),
        x: worldPos.x,
        z: worldPos.z,
        rot: euler.y,
      });
    });
    if (!out.length) return null;
    out.sort((a, b) => fallbackApproaches.indexOf(a.approach) - fallbackApproaches.indexOf(b.approach));
    return out;
  } catch (error) {
    console.warn('[smartcity-scene] Chưa có traffic-lights.glb, dùng vị trí đèn mặc định.', error);
    return null;
  }
}

async function loadStaticCity(scene) {
  const loader = new GLTFLoader();
  const assets = await Promise.all(
    STATIC_SCENE_ASSETS.map(async ({ name, url }) => {
      const gltf = await loader.loadAsync(url);
      gltf.scene.name = `smartcity-static-asset-${name}`;
      gltf.scene.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = name === 'buildings' || name === 'landscape';
        object.receiveShadow = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (!material) return;
          material.userData.baseOpacity = material.opacity;
        });
      });
      return gltf.scene;
    }),
  );

  assets.forEach((asset) => {
    scene.add(asset);
    cityFadeRoots.push(asset);
  });
  // Tải mạng đường ống ở chế độ nền (74MB) — không chặn việc dựng thành phố.
  cityPicking.loadPipeNetwork(scene, loader);
  // Tải tòa TecnoPark ở chế độ nền (Draco ~27MB) — thay cho trung tâm thương mại.
  cityPicking.loadTechnopark(scene);
  await loadVehicleModelTemplates(loader, Date.now(), isTrafficDebugEnabled());
  trafficLightTransformsFromBlender = await loadTrafficLightTransforms(loader);
  const water = scene.getObjectByName('terrain-water');
  if (water?.material) {
    animatedObjects.push({ type: 'pulseOpacity', mesh: water, base: 0.7, amp: 0.12, speed: 1.25 });
  }
}

async function buildCity(scene) {
  scene.background = new THREE.Color(0xb8dcf2);

  try {
    await loadStaticCity(scene);
  } catch (error) {
    console.warn('[smartcity-scene] Không tải được GLB tĩnh, dùng cảnh procedural dự phòng.', error);
    addProceduralCityFallback(scene, animatedObjects);
  }

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
  setGroupEmphasis('traffic', true);
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
  const cityFactor = 1 - cityRevealDisplayed;
  emphasisTargets.forEach((target, group) => {
    group.scale.lerp(new THREE.Vector3(target.targetScale, target.targetScale, target.targetScale), Math.min(1, delta * 5));
    group.visible = cityFactor > 0.015;
    group.traverse((obj) => {
      if (!obj.material || obj.isSprite) return;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((material) => {
        if (material.opacity === undefined) return;
        const baseOpacity = material.userData.baseOpacity ?? 1;
        // Vật liệu xe khoá opacity (lockOpacity) bỏ qua việc dim theo emphasis, NHƯNG
        // vẫn phải mờ theo cityFactor để cả xe cũng mờ dần khi hiện đường ống.
        const desiredOpacity = material.userData.lockOpacity
          ? baseOpacity * cityFactor
          : baseOpacity * target.targetOpacity * cityFactor;
        if (cityFactor < 0.995) {
          material.transparent = true;
          material.depthWrite = false;
        } else {
          material.depthWrite = true;
        }
        // Gán trực tiếp (không lerp) để mọi vật liệu mờ đồng đều theo thanh trượt.
        material.opacity = desiredOpacity;
      });
    });
  });
}

// 0 = thành phố đầy đủ, 1 = mờ hẳn thành phố và chỉ còn mạng đường ống dưới lòng đất.
export function setCityPipeReveal(amount) {
  cityRevealAmount = Math.max(0, Math.min(1, Number(amount) || 0));
}

function fadeRootMaterials(root, factor) {
  const fading = factor < 0.995;
  root.traverse((obj) => {
    if (obj.isSprite || !obj.material) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach((material) => {
      if (material.opacity === undefined) return;
      const baseOpacity = material.userData.baseOpacity ?? 1;
      // Vật liệu mặt đường/nền vốn đục: phải bật transparent VÀ tắt depthWrite khi
      // đang mờ, nếu không chúng vẫn ghi chiều sâu và trông như không hề mờ đi.
      if (fading) {
        material.transparent = true;
        material.depthWrite = false;
      } else {
        material.depthWrite = true;
      }
      // Gán trực tiếp opacity theo factor — mọi vật liệu mờ đồng đều, không trễ.
      material.opacity = baseOpacity * factor;
    });
  });
}

function updatePipeReveal(delta) {
  cityRevealDisplayed += (cityRevealAmount - cityRevealDisplayed) * Math.min(1, delta * 8);
  if (Math.abs(cityRevealAmount - cityRevealDisplayed) < 0.004) cityRevealDisplayed = cityRevealAmount;
  const cityFactor = 1 - cityRevealDisplayed;

  // Làm mờ các GLB tĩnh (mặt đất, đường, toà nhà, cảnh quan) theo cityFactor.
  cityFadeRoots.forEach((root) => {
    fadeRootMaterials(root, cityFactor);
    root.visible = cityFactor > 0.01;
  });

  // Hiện dần mạng đường ống theo mức reveal (gán trực tiếp).
  const pipeGroup = cityPicking?.getPipeGroup();
  const pipeMaterials = cityPicking?.getPipeMaterials() || [];
  if (pipeGroup && pipeMaterials.length) {
    for (const mat of pipeMaterials) mat.opacity = cityRevealDisplayed;
    pipeGroup.visible = cityRevealDisplayed > 0.01;
  }
}

function updateAnimations(clock, delta) {
  const t = clock.getElapsedTime();
  updateVehicleModelHotReload(t);
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
        const cfg = trafficRuntime.roundaboutSignal;
        if (cfg?.enabled) {
          const color = getRoundaboutApproachSignal(item.approach, t, cfg);
          // bulbs: 0 = đỏ (trên), 1 = vàng (giữa), 2 = xanh (dưới).
          const onIndex = color === 'green' ? 2 : color === 'yellow' ? 1 : 0;
          item.bulbs.forEach((bulb, i) => {
            const on = i === onIndex;
            bulb.material.emissive.setHex(on ? bulb.userData.signalColor : 0x111111);
            bulb.material.emissiveIntensity = on ? 0.95 : 0.05;
          });
        } else {
          item.bulbs.forEach((bulb) => {
            bulb.material.emissive.setHex(0x111111);
            bulb.material.emissiveIntensity = 0.04;
          });
        }
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
      item.mesh.material.opacity = (item.base + Math.sin(t * item.speed) * item.amp) * (1 - cityRevealDisplayed);
    }
  });
}

// Kéo camera về tòa TecnoPark. onDone chạy sau khi tween xong (để khôi phục far/limit).
function focusTechnopark(onDone = null, duration = 1100) {
  const refs = sceneRefs;
  if (!refs) { onDone?.(); return; }
  const [tx, ty, tz] = TECHNOPARK_SCENE_POS;
  tweenCameraTo(
    refs.camera,
    refs.controls,
    [tx + 30, 34, tz + 46],
    [tx, ty, tz],
    duration,
  ).then(() => onDone?.());
}

async function createScene(container, pageId) {
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
  controls.maxDistance = 105;
  applyCameraPreset(camera, controls, pageId);

  // Controller mạng ống ngầm + tòa TecnoPark (loader + picking). Tạo TRƯỚC buildCity vì
  // buildCity gọi loadPipeNetwork/loadTechnopark. State nằm trong closure của module; runtime
  // chỉ đọc qua getter (getPipeGroup/getPipeMaterials) và inject mức reveal qua getCityReveal.
  cityPicking = createIfcPicking({
    getCityReveal: () => cityRevealDisplayed,
    urls: {
      pipesGlb: PIPES_GLB_URL,
      pipesIfcMap: PIPES_IFC_MAP_URL,
      technoparkGlb: TECHNOPARK_GLB_URL,
      technoparkIfcMap: TECHNOPARK_IFC_MAP_URL,
      technoparkTransform: TECHNOPARK_TRANSFORM_URL,
    },
  });

  await buildCity(scene);
  applyLayerFocus(pageId);
  showSceneLoading(container, false);
  setSceneHint(container, smartcitySceneData.cameraPresets[pageId]?.hint || smartcitySceneData.cameraPresets.overview.hint);

  // Bản đồ thế giới 3D georeferenced — controller sở hữu state bản đồ trong closure, đọc
  // sceneRefs qua getRefs (runtime gán sceneRefs ở cuối hàm này nên luôn đọc live đúng).
  const worldMap = createWorldMap({ getRefs: () => sceneRefs });

  const clock = new THREE.Clock();
  let frameId;
  function animate() {
    frameId = requestAnimationFrame(animate);
    const delta = Math.min(0.05, clock.getDelta());
    updateAnimations(clock, delta);
    updatePipeReveal(delta);
    updateGroupMaterials(delta);
    // Khi bật bản đồ: MapLibre tự vẽ scene qua custom layer (map.triggerRepaint) → bỏ
    // render bằng canvas Three.js độc lập, nhưng VẪN chạy update để xe cộ/animation
    // tiếp tục di chuyển và hiện đúng trên bản đồ.
    if (worldMap.isEnabled()) return;
    if (!isCameraTweening(controls)) controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const ro = new ResizeObserver(() => sceneRefs?.onResize?.());
  ro.observe(container);

  if (typeof window !== 'undefined') {
    window.__smartcityScene = scene;
    window.__smartcitySetPipeReveal = setCityPipeReveal;
    window.__smartcityClearPipeHighlight = () => cityPicking.clearPipeHighlight();
    window.__smartcityClearTechnoHighlight = () => cityPicking.clearTechnoHighlight();
    window.__smartcitySetWorldMap = (on) => worldMap.setMode(on);
    // "Đến TechnoPark": khi bản đồ đang mở → canh lại tâm bản đồ về TechnoPark;
    // ngược lại → kéo camera 3D về tòa nhà như trước.
    window.__smartcityFocusTechnopark = () => {
      if (worldMap.isEnabled()) {
        worldMap.flyToTechnopark();
      } else {
        focusTechnopark();
      }
    };
  }
  // Đồng bộ với thanh trượt nếu người dùng đã kéo trước khi cảnh 3D sẵn sàng.
  const revealSlider = document.querySelector('[data-pipe-reveal]');
  if (revealSlider) setCityPipeReveal((Number(revealSlider.value) || 0) / 100);

  cityPicking.attachPipePicking(renderer.domElement, camera);
  cityPicking.attachTechnoPicking(renderer.domElement, camera);
  sceneRefs = {
    camera,
    controls,
    container,
    renderer,
    scene,
    onResize() {
      const host = rendererEl?.parentElement || container;
      const nw = host.clientWidth || 640;
      const nh = host.clientHeight || 480;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      worldMap.resize();
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
      cityPicking.dispose();
      cityPicking = null;
      cityFadeRoots.length = 0;
      cityRevealAmount = 0;
      cityRevealDisplayed = 0;
      worldMap.dispose();
      if (typeof window !== 'undefined') {
        window.__smartcitySetPipeReveal = null;
        window.__smartcityClearPipeHighlight = null;
        window.__smartcitySetWorldMap = null;
        window.__smartcityFocusTechnopark = null;
      }
      trafficRuntime = null;
      trafficSpawner = null;
      vehicleModelAssetSignature = null;
      vehicleModelReloadInFlight = false;
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

export async function initSmartcityScene(pageId) {
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

  if (activeScenePromise) {
    try {
      activeScene = await activeScenePromise;
      if (rendererEl?.parentElement !== container) container.appendChild(rendererEl);
      activeScene.container = container;
      activeScene.onResize?.();
      applyPageView(pageId, container);
    } catch {
      // The original scene initialization reports the error.
    }
    return;
  }

  try {
    activeScenePromise = createScene(container, pageId);
    activeScene = await activeScenePromise;
    if (currentPage !== pageId) {
      const currentContainer = document.querySelector(`#page-${currentPage} [data-mount="smartcity-scene"]`);
      if (currentContainer && rendererEl?.parentElement !== currentContainer) {
        currentContainer.appendChild(rendererEl);
        activeScene.container = currentContainer;
        activeScene.onResize?.();
        applyPageView(currentPage, currentContainer);
      }
    }
  } catch (err) {
    console.error('[smartcity-scene] Không khởi tạo được mô hình 3D:', err);
    showSceneLoading(container, false);
    activeScene = null;
  } finally {
    activeScenePromise = null;
  }
}

export function disposeSmartcityScene() {
  activeScene?.dispose();
  activeScene = null;
  if (typeof window !== 'undefined' && window.__smartcityTrafficRuntime) {
    window.__smartcityTrafficRuntime = null;
    if (document.documentElement) document.documentElement.__smartcityTrafficRuntime = null;
  }
}
