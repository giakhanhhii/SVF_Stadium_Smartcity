// Logic mô phỏng giao thông (tách khỏi smartcity-scene-runtime.js).
//
// Phase 4a — các hàm THUẦN (không state, không scene graph): dùng được cả ở runtime 3D lẫn
// trafficSpawner mà không tạo phụ thuộc vòng.
//
// Phase 2 (microsimulation chuẩn) — thay 3 cơ chế hack cũ (nhường / lùi-theo-lịch-sử /
// đi-xuyên) bằng mô hình kinh điển kiểu SUMO/Vissim:
//   1. Car-following bằng IDM (Intelligent Driver Model): gia tốc là hàm LIÊN TỤC của
//      (khoảng cách, tốc độ tương đối) -> không dao động, không giật.
//   2. Gap-acceptance ở lối vào vòng xuyến: xe vào CHỈ tiến khi đủ khoảng trống; nếu không
//      thì phanh mượt về 0 và ĐỨNG CHỜ (không lùi, không xuyên). Xe trong vòng LUÔN ưu tiên
//      và không bao giờ dừng -> vòng xuyến không deadlock được về mặt cấu trúc.
//   3. Heading luôn bám tangent + rate-limit ở mọi mode, không phụ thuộc dấu vận tốc; giữ
//      hướng cũ khi xe đứng yên (xử lý trong traffic-vehicle-pose.js) -> hết xoay 180°.
// Vận tốc luôn >= 0 (không còn lùi). Đã XÓA HẲN movementHistory / reversePlayback /
// phase-through và toàn bộ cờ state đi kèm.

import * as THREE from 'three';
import { trafficSceneData } from '../../data/traffic-scene.js';
import {
  ccwAngleDistance,
  getRouteStopLineS,
  normalizeAngle,
} from './traffic-lanes.js?v=traffic-sim-idm-20260626d';
import {
  distanceBetweenRouteSamples,
  findBodyContactBlocker,
  findGlobalProximityBlocker,
  getVehicleRouteSample,
} from './traffic-occupancy.js?v=roundabout-replay-20260625a';
import { setVehiclePoseFromLane } from './traffic-vehicle-pose.js?v=roundabout-replay-20260625a';

// ===== Hằng số mô phỏng =====
const ROUNDABOUT_HEADING_TURN_RATE = 4.8;
// Tốc độ giảm nhẹ khi đang chạy trong cung vòng xuyến (bán kính nhỏ) cho êm.
const ROUNDABOUT_CIRCULATING_SPEED_FACTOR = 0.9;
// Phanh khẩn dùng cho stoppingSpeedForDistance (quyết định vàng) — không phải tham số IDM.
const TRAFFIC_BRAKE_METERS_PER_SECOND = 3.0;

// ----- Tham số IDM (Intelligent Driver Model) -----
// a = a_max * ( 1 - (v/v0)^δ - (s*/s)^2 ),  s* = s0 + max(0, v·T + v·Δv / (2·√(a_max·b)))
const IDM_MAX_ACCEL = 1.6;          // a_max — gia tốc thoải mái
const IDM_COMFORT_BRAKE = 2.2;      // b — giảm tốc thoải mái
const IDM_TIME_HEADWAY = 1.1;       // T — giãn cách thời gian an toàn (s)
const IDM_MIN_GAP = 2.2;            // s0 — khoảng cách đầu-đuôi tối thiểu khi đứng yên (m)
const IDM_STOP_LINE_GAP = 0.5;      // s0 cho "vật cản ảo" là vạch dừng/nhường (dừng sát vạch)
const IDM_ACCEL_EXPONENT = 4;       // δ

// ----- Lưới an toàn chống kẹt (thay cho traffic-recovery.js đã xoá) -----
// "Deadlock-free by construction" KHÔNG đủ: clamp thân xe (findBodyContactBlocker) đối xứng và
// bỏ qua quyền ưu tiên, nên 2 xe có thể đông cứng lẫn nhau trong vòng và kéo theo cả hàng kẹt.
// Watchdog: xe ĐÃ vào vòng đứng yên quá lâu mà KHÔNG vì đèn đỏ = deadlock -> bò tới điểm trống
// gần nhất; bí hẳn thì despawn để giải toả (xe sẽ tự spawn lại sau).
const STUCK_RECOVERY_SECONDS = 3.2;   // đứng yên quá lâu trong vòng = kẹt, bắt đầu cứu
const STUCK_DESPAWN_SECONDS = 6.5;    // không tìm được lối thoát -> bỏ xe để hàng chờ chảy tiếp
const STUCK_CRAWL_SPEED = 1.6;        // m/s — tốc độ bò nhẹ khi được gỡ kẹt

// ===== State singleton (gán bởi createTrafficSimulation, reset bởi dispose) =====
let animatedObjects = [];
let trafficRuntime = null;
let trafficSpawner = null;
let createTextSprite = null;
let setTextSprite = null;

// Gắn các phụ thuộc runtime vào cụm mô phỏng. Gọi MỘT LẦN sau buildCity (lúc trafficRuntime
// & trafficSpawner đã được addTrafficLayer tạo). Trả về 2 hàm cập nhật cho vòng animate.
export function createTrafficSimulation({ getAnimatedObjects, getRuntime, getSpawner, sprites }) {
  animatedObjects = getAnimatedObjects();
  trafficRuntime = getRuntime();
  trafficSpawner = getSpawner();
  createTextSprite = sprites?.createTextSprite || null;
  setTextSprite = sprites?.setTextSprite || null;
  return {
    updateRoundaboutFleet,
    updateTrafficVehicle,
    dispose() {
      animatedObjects = [];
      trafficRuntime = null;
      trafficSpawner = null;
      createTextSprite = null;
      setTextSprite = null;
    },
  };
}

// ===== Hàm thuần stateless (Phase 4a) — runtime & trafficSpawner import trực tiếp =====
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

// ===== Helper toán học thuần =====
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function stoppingSpeedForDistance(distance, brake = TRAFFIC_BRAKE_METERS_PER_SECOND) {
  return Math.sqrt(Math.max(0, 2 * brake * Math.max(0, distance)));
}

// Gia tốc IDM cho MỘT "lead" (xe trước, hoặc vật cản ảo là vạch dừng). gap là khoảng cách
// đầu-đuôi (bumper-to-bumper) tới lead; gap = Infinity nghĩa là đường thoáng (chỉ free term).
// Trả về gia tốc (m/s^2), có thể âm (phanh). Lấy MIN trên mọi lead để ra ràng buộc chặt nhất.
function idmAcceleration(velocity, desiredSpeed, gap = Infinity, leadSpeed = 0, minGap = IDM_MIN_GAP) {
  const v0 = Math.max(0.1, desiredSpeed);
  const v = Math.max(0, velocity);
  const freeTerm = 1 - (v / v0) ** IDM_ACCEL_EXPONENT;
  if (!Number.isFinite(gap)) return IDM_MAX_ACCEL * freeTerm;
  const approachRate = v - Math.max(0, leadSpeed || 0);
  const desiredGap = minGap + Math.max(
    0,
    v * IDM_TIME_HEADWAY + (v * approachRate) / (2 * Math.sqrt(IDM_MAX_ACCEL * IDM_COMFORT_BRAKE)),
  );
  const s = Math.max(0.2, gap);
  return IDM_MAX_ACCEL * (freeTerm - (desiredGap / s) ** 2);
}

// Áp một loạt "lead" vào gia tốc hiện tại, trả về gia tốc nhỏ nhất (chặt nhất).
function applyLeaderAccel(accel, vehicle, desiredSpeed, leaders) {
  let result = accel;
  leaders.forEach((lead) => {
    if (!lead?.other) return;
    const bumper = (getVehicleLengthAllowance(vehicle) + getVehicleLengthAllowance(lead.other)) / 2;
    const gap = lead.gap - bumper;
    result = Math.min(result, idmAcceleration(vehicle.velocity, desiredSpeed, gap, lead.other.velocity || 0));
  });
  return result;
}

// ===== Cụm mô phỏng có state — tham chiếu state singleton =====
function getLaneSignalState(vehicle, t) {
  const state = getSignalState(trafficRuntime.cycle, t);
  const signalGroup = vehicle.route?.signalGroup || vehicle.route?.movement;
  return {
    ...state,
    signalGroup,
    allowsEntry: state.color === 'green' && state.movement === signalGroup,
  };
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

// Gap-acceptance: lối vào có đủ trống để nhập vòng không? Xe trong vòng LUÔN ưu tiên — ta chỉ
// vào nếu không có xe nào sắp tới điểm xung đột trong < minTimeToConflict giây.
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

// Tìm điểm tiến gần nhất KHÔNG chạm thân xe nào (quét bước nhỏ về phía trước). Dùng để gỡ kẹt:
// nhích xe khỏi thế đông cứng tới chỗ trống thật sự. Trả về null nếu không có lối trong cửa sổ.
function findClearForwardDistance(vehicle) {
  const maxScan = Math.min(vehicle.route.length + 1.0, vehicle.distance + 6);
  for (let d = vehicle.distance + 0.4; d <= maxScan; d += 0.4) {
    if (!findBodyContactBlocker(vehicle, d, animatedObjects)) return d;
  }
  return null;
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
    // Phase 2: làm mượt heading ở MỌI mode (vận tốc luôn >= 0 nên không còn lật theo dấu).
    smoothHeading: true,
    delta,
    maxHeadingTurnRate: ROUNDABOUT_HEADING_TURN_RATE,
  });
  syncVehicleLaneState(vehicle);
  auditVehicleHeadingError(vehicle, pose.heading);
  auditVehicleLightDirection(vehicle, pose.heading);
  if (vehicle.label) {
    vehicle.label.visible = vehicle.mesh.visible;
    vehicle.label.position.set(pose.x, 2.1, pose.z);
    setTextSprite(
      vehicle.label,
      `${vehicle.route.id} ${vehicle.state}`,
      vehicle.state === 'WAITING_TO_ENTER' ? '#EF9F27' : vehicle.state === 'CIRCULATING' ? '#E24B4A' : '#85B7EB',
    );
  }
}

function updateRoundaboutVehicle(vehicle, delta, t) {
  if (!vehicle.mesh.visible) {
    if (trafficSpawner?.canSpawnVehicle(vehicle, t)) trafficSpawner.resetVehicleOnRoute(vehicle, t);
    return true;
  }

  const route = vehicle.route;
  // Hai vạch dừng KHÁC nhau:
  //  - signalStopS: vạch ĐÈN ĐỎ, đặt ở mép ngoài VẠCH ĐI BỘ (xa vòng) — dừng đèn ở đây.
  //  - yieldLineS:  vạch NHƯỜNG sát vòng (entryS-3.4) — chỉ dùng cho gap-acceptance nhập vòng.
  const yieldLineS = getRouteStopLineS(route);
  const signalStopS = Number.isFinite(route.signalStopS) ? route.signalStopS : yieldLineS;
  const beforeEntry = vehicle.distance < route.entryS;
  const inRing = !beforeEntry && vehicle.distance <= route.exitS;
  const desiredSpeed = (vehicle.speed || 5) * (inRing ? ROUNDABOUT_CIRCULATING_SPEED_FACTOR : 1);

  // ----- Đèn tín hiệu: DỪNG TRƯỚC VẠCH ĐI BỘ (signalStopS), không phải sát vòng -----
  let signalStop = false;
  const signalCfg = trafficRuntime.roundaboutSignal;
  if (signalCfg?.enabled && !vehicle.enteredIntersection) {
    const signalColor = getRoundaboutApproachSignal(route.approach, t, signalCfg);
    if (vehicle.runsRedLight) {
      // Xe vi phạm: KHÔNG dừng đèn. Đánh dấu vượt đèn đỏ khi cán vạch đi bộ lúc đèn không xanh.
      if (signalColor !== 'green' && vehicle.distance >= signalStopS - 0.4) vehicle.redLightViolation = true;
    } else if (vehicle.distance < signalStopS - 0.02) {
      if (signalColor === 'red') {
        signalStop = true;
      } else if (signalColor === 'yellow') {
        const distToStop = signalStopS - vehicle.distance;
        signalStop = (vehicle.velocity || 0) <= stoppingSpeedForDistance(distToStop) + 0.05;
      }
    }
  }

  // ----- Gap-acceptance vào vòng xuyến (có hysteresis chống tự-nhường giữa lúc nhập vòng) -----
  const entryBrakingDistance = Math.max(2.5, desiredSpeed * 0.9);
  const atEntryGate = beforeEntry && vehicle.distance >= yieldLineS - entryBrakingDistance;
  // Đã "được phép vào" gần đây thì giữ quyền vào trong cửa sổ ngắn để không phanh giật ở mép vòng.
  const committedClearance = (vehicle.entryClearUntil || 0) >= t && vehicle.distance < route.entryS + 0.7;
  const entryClear = committedClearance || (isRoundaboutEntryClear(vehicle) && isRoundaboutExitClear(vehicle));
  if (beforeEntry && entryClear && atEntryGate) {
    vehicle.entryClearUntil = Math.max(vehicle.entryClearUntil || 0, t + 1.2);
  } else if (beforeEntry && !entryClear) {
    vehicle.entryClearUntil = 0;
  }
  const mustYieldAtEntry = beforeEntry && atEntryGate && !entryClear;

  // ----- IDM: gom mọi ràng buộc thành gia tốc nhỏ nhất -----
  let accel = idmAcceleration(vehicle.velocity, desiredSpeed); // đường thoáng

  // Vật cản ảo 1 = vạch ĐÈN ĐỎ (mép vạch đi bộ) khi đèn đỏ/vàng.
  if (signalStop) {
    accel = Math.min(
      accel,
      idmAcceleration(vehicle.velocity, desiredSpeed, signalStopS - vehicle.distance, 0, IDM_STOP_LINE_GAP),
    );
  }
  // Vật cản ảo 2 = vạch NHƯỜNG sát vòng khi gap-acceptance chưa cho nhập vòng.
  if (mustYieldAtEntry) {
    accel = Math.min(
      accel,
      idmAcceleration(vehicle.velocity, desiredSpeed, yieldLineS - vehicle.distance, 0, IDM_STOP_LINE_GAP),
    );
  }

  // Car-following: xe cùng làn / cùng hướng tiếp cận / cùng vòng phía trước.
  accel = applyLeaderAccel(accel, vehicle, desiredSpeed, [
    findVehicleAhead(vehicle),
    findApproachVehicleAhead(vehicle),
    findCirculatingVehicleAhead(vehicle),
  ]);

  // Safety: xung đột chéo trong vòng (không cùng làn/đường) — coi như lead đứng yên để phanh
  // mượt. findGlobalProximityBlocker tôn trọng quyền ưu tiên: trả null cho xe ưu tiên hơn, nên
  // xe trong vòng KHÔNG phanh vì xe đang vào -> giữ nguyên tắc "xe trong vòng không nhường".
  if (!beforeEntry) {
    const lookahead = Math.min(route.length, vehicle.distance + Math.max(0.5, (vehicle.velocity || 0) * 0.6));
    const blocker = findGlobalProximityBlocker(vehicle, lookahead, animatedObjects, trafficRuntime?.vehicles);
    if (blocker?.other) {
      const bumper = (getVehicleLengthAllowance(vehicle) + getVehicleLengthAllowance(blocker.other)) / 2;
      const centerGap = distanceBetweenRouteSamples(vehicle, vehicle.distance, blocker.other, blocker.other.distance);
      accel = Math.min(accel, idmAcceleration(vehicle.velocity, desiredSpeed, centerGap - bumper, blocker.other.velocity || 0));
    }
  }

  // Tích phân vận tốc (luôn >= 0, cap ở tốc độ mong muốn).
  vehicle.velocity = clamp(vehicle.velocity + accel * delta, 0, desiredSpeed);

  // ----- State (cho debug + nhãn) -----
  if (signalStop || mustYieldAtEntry) vehicle.state = 'WAITING_TO_ENTER';
  else if (beforeEntry) vehicle.state = 'APPROACHING';
  else if (inRing) vehicle.state = 'CIRCULATING';
  else vehicle.state = 'EXITING';

  // ----- Tiến + chốt vạch dừng đang áp dụng (gần nhất) + đảm bảo không chồng lấn thân xe -----
  const despawnDistance = route.length + 1.5;
  let nextDistance = Math.min(despawnDistance, vehicle.distance + vehicle.velocity * delta);
  let holdLineS = Infinity;
  if (signalStop) holdLineS = Math.min(holdLineS, signalStopS);
  if (mustYieldAtEntry) holdLineS = Math.min(holdLineS, yieldLineS);
  if (Number.isFinite(holdLineS) && nextDistance > holdLineS) {
    nextDistance = holdLineS;
    vehicle.velocity = 0;
  }
  // Chốt cứng cuối cùng: nếu tiến tới nextDistance sẽ CHẠM THÂN xe khác thì đứng yên (không
  // bao giờ chồng lấn). Chỉ kích hoạt khi va chạm thật -> không gây giật trong luồng bình thường.
  if (!beforeEntry && findBodyContactBlocker(vehicle, nextDistance, animatedObjects)) {
    nextDistance = vehicle.distance;
    vehicle.velocity = 0;
  }

  // ----- Watchdog chống kẹt -----
  // Xe đã vào vòng đứng yên quá lâu mà KHÔNG vì đèn đỏ = deadlock (clamp thân xe đối xứng có thể
  // khoá 2 xe lẫn nhau). Bò tới điểm trống gần nhất; bí hẳn thì despawn để cả hàng chờ chảy tiếp.
  // Chỉ áp cho xe đã qua entryS -> không bao giờ "teleport" xe qua vạch nhường/đèn đỏ.
  if (!beforeEntry && vehicle.velocity < 0.05 && !signalStop) {
    vehicle.stuckFor = (vehicle.stuckFor || 0) + delta;
  } else {
    vehicle.stuckFor = 0;
  }
  if (vehicle.stuckFor > STUCK_RECOVERY_SECONDS) {
    const clear = findClearForwardDistance(vehicle);
    if (clear !== null) {
      nextDistance = clear;
      vehicle.velocity = STUCK_CRAWL_SPEED;
      vehicle.stuckFor = 0;
      vehicle.state = 'RECOVERING';
    } else if (vehicle.stuckFor > STUCK_DESPAWN_SECONDS) {
      trafficSpawner?.despawnVehicle(vehicle, t, 'RECOVERED');
      return true;
    }
  }

  vehicle.distance = nextDistance;
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
  const desiredSpeed = (vehicle.speed || 5) * route.turnSlowdown;

  if (mustWaitForSignal || mustWaitForReservation) {
    vehicle.state = mustWaitForSignal ? 'red-wait' : 'reserved-wait';
  } else {
    vehicle.state = route.turn === 'straight' ? 'moving' : `${route.turn}-turn`;
  }

  // IDM: đường thoáng + (nếu phải dừng) vật cản ảo tại vạch + xe trước cùng làn.
  let accel = idmAcceleration(vehicle.velocity, desiredSpeed);
  if (mustWaitForSignal || mustWaitForReservation) {
    accel = Math.min(accel, idmAcceleration(vehicle.velocity, desiredSpeed, stopLineS - vehicle.distance, 0, IDM_STOP_LINE_GAP));
  }
  if (ahead) {
    const bumper = (getVehicleLengthAllowance(vehicle) + getVehicleLengthAllowance(ahead.other)) / 2;
    accel = Math.min(accel, idmAcceleration(vehicle.velocity, desiredSpeed, ahead.gap - bumper, ahead.other.velocity || 0));
    if (accel < 0) vehicle.state = 'queue';
  }
  vehicle.velocity = clamp(vehicle.velocity + accel * delta, 0, desiredSpeed);

  let nextDistance = vehicle.distance + vehicle.velocity * delta;
  if ((mustWaitForSignal || mustWaitForReservation) && nextDistance > stopLineS) {
    nextDistance = Math.min(nextDistance, stopLineS);
    vehicle.velocity = Math.min(vehicle.velocity, 0);
  }
  vehicle.distance = nextDistance;
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
  const roundaboutVehicles = trafficRuntime.vehicles.filter((vehicle) => vehicle.route?.mode === 'roundabout');
  // Cập nhật theo thứ tự ưu tiên: xe trong vòng trước (chúng không bao giờ nhường), rồi xe ra,
  // xe vào, cuối cùng xe ẩn (chờ spawn). Nhờ vậy gap-acceptance đọc đúng vị trí xe ưu tiên.
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

  // Bọc try/catch từng xe: một xe lỗi (NaN, state hỏng...) KHÔNG được phép ném ra ngoài và làm
  // chết vòng animate -> nếu không, cả cảnh đứng hình ("1 xe lỗi là kẹt hết").
  [...circulating, ...exiting, ...approaching, ...hidden].forEach((vehicle) => {
    try {
      updateRoundaboutVehicle(vehicle, delta, t);
    } catch (error) {
      if (trafficRuntime?.debug) console.error('[traffic] lỗi cập nhật xe, bỏ qua khung này', vehicle?.id, error);
    }
  });
}

// ===== Audit hướng xe / hướng đèn (chỉ chạy khi ?directionAudit=1) =====
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
