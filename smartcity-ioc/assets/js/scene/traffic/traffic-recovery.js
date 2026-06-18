import {
  distanceBetweenRouteSamples,
  findBodyContactBlocker,
  findGlobalProximityBlocker,
  getEscapeScoreAt,
  hasActualBodyContact,
  hasAnyBodyOverlap,
  hasTrafficConflictPriority,
  isYieldTargetClear,
} from './traffic-occupancy.js';

function moveDistanceToward(current, target, maxStep) {
  const delta = target - current;
  if (Math.abs(delta) <= maxStep) return target;
  return current + Math.sign(delta) * maxStep;
}

export function createTrafficRecovery({
  getVehicles,
  getRuntimeVehicles,
  applyVehicleRoutePose,
  despawnVehicle,
  constants,
}) {
  const {
    SPACE_REVERSE_DELAY_SECONDS,
    SPACE_REVERSE_MAX_SECONDS,
    SPACE_REVERSE_MIN_SECONDS,
    SPACE_REVERSE_SPEED_FACTOR,
    ROUNDABOUT_STALE_RELEASE_SECONDS,
    ROUNDABOUT_STALE_CRAWL_SPEED_FACTOR,
    ROUNDABOUT_CONTINUOUS_REVERSE_SECONDS,
    ROUNDABOUT_CONTINUOUS_CLEARANCE_DISTANCE,
    ROUNDABOUT_REVERSE_BACKOUT_DISTANCE,
    ROUNDABOUT_CONTACT_SEPARATE_SECONDS,
    ROUNDABOUT_CONTACT_DESPAWN_SECONDS,
    ROUNDABOUT_CONTACT_SEPARATION_SPEED_FACTOR,
    ROUNDABOUT_STALE_ESCAPE_SPEED_FACTOR,
  } = constants;

  const vehicles = () => getVehicles?.() || [];
  const runtimeVehicles = () => getRuntimeVehicles?.() || vehicles();

  function isBeforeRoundaboutEntry(vehicle) {
    return vehicle.route?.mode === 'roundabout'
      && Number.isFinite(vehicle.route.entryS)
      && vehicle.distance < vehicle.route.entryS - 0.15;
  }

  function getReverseLimit(vehicle) {
    return vehicle.route?.mode === 'roundabout' ? -ROUNDABOUT_REVERSE_BACKOUT_DISTANCE : 0;
  }

  function chooseEscapeDistance(vehicle, delta, targetVehicle = null) {
    const step = Math.max(0.18, (vehicle.speed || 5) * delta * 1.35);
    const candidates = [
      Math.min(vehicle.route.length + 1.5, vehicle.distance + step),
      Math.max(getReverseLimit(vehicle), vehicle.distance - step),
      Math.min(vehicle.route.length + 1.5, vehicle.distance + step * 1.8),
      Math.max(getReverseLimit(vehicle), vehicle.distance - step * 1.8),
      Math.min(vehicle.route.length + 1.5, vehicle.distance + step * 2.7),
      Math.max(getReverseLimit(vehicle), vehicle.distance - step * 2.7),
      Math.min(vehicle.route.length + 1.5, vehicle.distance + step * 4.2),
      Math.max(getReverseLimit(vehicle), vehicle.distance - step * 4.2),
      Math.min(vehicle.route.length + 1.5, vehicle.distance + step * 5.8),
      Math.max(getReverseLimit(vehicle), vehicle.distance - step * 5.8),
    ];
    const currentScore = getEscapeScoreAt(vehicle, vehicle.distance, targetVehicle, vehicles());
    let best = { distance: vehicle.distance, score: currentScore };
    candidates.forEach((distance) => {
      if (Math.abs(distance - vehicle.distance) < 0.01) return;
      const score = getEscapeScoreAt(vehicle, distance, targetVehicle, vehicles());
      if (score === -Infinity) return;
      const directionBonus = distance > vehicle.distance ? 0.15 : 0;
      const option = { distance, score: score + directionBonus };
      if (!best || option.score > best.score) best = option;
    });
    if (best.score > currentScore + 0.05) return best.distance;
    if (targetVehicle && best.distance !== vehicle.distance && best.score > currentScore - 0.2) return best.distance;
    return vehicle.distance;
  }

  function shouldYieldContact(vehicle, other) {
    if (vehicle.vehicleKind === 'moto' && other.vehicleKind !== 'moto') return true;
    if (other.vehicleKind === 'moto' && vehicle.vehicleKind !== 'moto') return false;
    return !hasTrafficConflictPriority(vehicle, other, runtimeVehicles());
  }

  function findEmergencyContactClearDistance(vehicle, delta, targetVehicle = null) {
    const step = Math.max(0.22, (vehicle.speed || 5) * Math.max(delta, 0.025) * 1.6);
    const limitMin = getReverseLimit(vehicle);
    const limitMax = vehicle.route.length + 1.5;
    const distances = [chooseEscapeDistance(vehicle, delta, targetVehicle)];

    [-1, 1].forEach((direction) => {
      [1.5, 2.8, 4.5, 7, 10, 14, 19, 25].forEach((multiplier) => {
        distances.push(Math.max(limitMin, Math.min(limitMax, vehicle.distance + direction * step * multiplier)));
      });
    });

    let best = null;
    distances.forEach((distance) => {
      if (Math.abs(distance - vehicle.distance) < 0.01) return;
      if (hasAnyBodyOverlap(vehicle, distance, null, vehicles())) return;
      const targetDistance = targetVehicle?.mesh?.visible
        ? distanceBetweenRouteSamples(vehicle, distance, targetVehicle, targetVehicle.distance)
        : 0;
      const routeMove = Math.abs(distance - vehicle.distance);
      const score = targetDistance * 2 - routeMove * 0.15 + (distance < vehicle.distance ? 1 : 0);
      const option = { distance, score };
      if (!best || option.score > best.score) best = option;
    });

    return best?.distance ?? null;
  }

  function forceContactRecovery(vehicle, t, targetVehicle = null) {
    const shouldYield = !targetVehicle || shouldYieldContact(vehicle, targetVehicle);
    const victim = shouldYield ? vehicle : targetVehicle;
    const other = shouldYield ? targetVehicle : vehicle;
    if (!victim?.mesh?.visible || victim.route?.mode !== 'roundabout') return false;
    const forwardDistance = Math.min(
      victim.route.length + 1.5,
      victim.distance + Math.max(1.25, (victim.speed || 5) * 0.7),
    );
    const canMoveForward = !hasAnyBodyOverlap(victim, forwardDistance, other, vehicles());
    const emergencyDistance = canMoveForward ? forwardDistance : findEmergencyContactClearDistance(victim, 0.05, other);
    if (emergencyDistance === null || !Number.isFinite(emergencyDistance)) return false;
    victim.distance = emergencyDistance;
    victim.velocity = Math.max(victim.velocity || 0, (victim.speed || 5) * 0.45);
    victim.blockedFor = 0.2;
    victim.bodyContactFor = 0;
    victim.continuousReverse = false;
    victim.reverseUntil = 0;
    victim.reverseStartedAt = 0;
    victim.reverseReason = null;
    victim.state = 'CONTACT_RECOVERY';
    victim.enteredIntersection = victim.distance >= victim.route.entryS;
    victim.exitedIntersection = victim.distance >= victim.route.exitS;
    applyVehicleRoutePose(victim, 0.05);
    return true;
  }

  function requestVehicleSpace(vehicle, requester, t, depth = 0) {
    if (!vehicle || !requester || depth > 3) return;
    if (!vehicle.mesh?.visible || vehicle.type !== 'vehicle' || vehicle.route?.mode !== 'roundabout') return;
    if (vehicle.distance >= vehicle.route.length + 0.8) return;
    vehicle.spaceRequestFrom = requester;
    vehicle.spaceRequestUntil = Math.max(vehicle.spaceRequestUntil || 0, t + SPACE_REVERSE_MAX_SECONDS + SPACE_REVERSE_MIN_SECONDS);
    vehicle.reverseRequestedAt = vehicle.reverseRequestedAt || t;
    if (requester.continuousReverse || (requester.blockedFor || 0) >= ROUNDABOUT_CONTINUOUS_REVERSE_SECONDS) {
      vehicle.continuousReverse = true;
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
    if (isBeforeRoundaboutEntry(vehicle)) return false;
    if (vehicle.reverseUntil > t) return true;
    if ((vehicle.blockedFor || 0) >= ROUNDABOUT_CONTINUOUS_REVERSE_SECONDS) {
      vehicle.continuousReverse = true;
    }
    if (vehicle.distance <= getReverseLimit(vehicle) + 0.05) {
      vehicle.reverseBlockedBy = null;
      vehicle.reverseBlockedAt = t;
      return false;
    }
    const probeDistance = Math.max(getReverseLimit(vehicle), vehicle.distance - 0.45);
    const rearBlocker = findBodyContactBlocker(vehicle, probeDistance, vehicles());
    if (rearBlocker) {
      vehicle.reverseBlockedBy = rearBlocker.other;
      vehicle.reverseBlockedAt = t;
      requestVehicleSpace(rearBlocker.other, vehicle, t);
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

  function hasStableForwardClearance(vehicle) {
    const maxCheck = Math.min(vehicle.route.length, vehicle.distance + ROUNDABOUT_CONTINUOUS_CLEARANCE_DISTANCE);
    const checks = [
      vehicle.distance,
      Math.min(vehicle.route.length, vehicle.distance + 0.9),
      Math.min(vehicle.route.length, vehicle.distance + 1.8),
      Math.min(vehicle.route.length, vehicle.distance + 3.6),
      maxCheck,
    ];
    return checks.every((distance) => (
      !hasActualBodyContact(vehicle, distance, null, vehicles())
      && !findGlobalProximityBlocker(vehicle, distance, vehicles(), runtimeVehicles())
    ));
  }

  function canExitContinuousReverse(vehicle) {
    if (!vehicle.continuousReverse) return true;
    const requester = vehicle.spaceRequestFrom;
    const requesterStillNeedsSpace = requester?.mesh?.visible
      && requester.route?.mode === 'roundabout'
      && !isYieldTargetClear(requester, vehicle, vehicles());
    return !requesterStillNeedsSpace
      && !vehicle.reverseBlockedBy
      && !hasActualBodyContact(vehicle, vehicle.distance, null, vehicles())
      && hasStableForwardClearance(vehicle);
  }

  function hasEnoughSpaceToStopReversing(vehicle, t) {
    if (!vehicle.reverseUntil || t - (vehicle.reverseStartedAt || t) < SPACE_REVERSE_MIN_SECONDS) return false;
    if (vehicle.continuousReverse) return canExitContinuousReverse(vehicle);
    const requester = vehicle.spaceRequestFrom;
    if (requester?.mesh?.visible && requester.route?.mode === 'roundabout') {
      return isYieldTargetClear(requester, vehicle, vehicles());
    }
    const forwardCheck = Math.min(vehicle.route.length, vehicle.distance + Math.max(0.75, (vehicle.speed || 5) * 0.18));
    return !hasActualBodyContact(vehicle, vehicle.distance, null, vehicles())
      && !findGlobalProximityBlocker(vehicle, forwardCheck, vehicles(), runtimeVehicles());
  }

  function stopSpaceReverse(vehicle, keepContinuous = false) {
    vehicle.reverseUntil = 0;
    vehicle.reverseStartedAt = 0;
    vehicle.reverseReason = null;
    vehicle.reverseBlockedBy = null;
    vehicle.reverseBlockedAt = 0;
    vehicle.continuousReverse = keepContinuous;
    vehicle.velocity = 0;
  }

  function resolveSpaceReverse(vehicle, delta, t) {
    if (isBeforeRoundaboutEntry(vehicle)) {
      const hasReverseState = vehicle.reverseUntil
        || vehicle.reverseStartedAt
        || vehicle.reverseReason
        || vehicle.reverseBlockedBy
        || vehicle.continuousReverse;
      if (hasReverseState) stopSpaceReverse(vehicle);
      return false;
    }

    if (vehicle.reverseUntil <= t) {
      if (vehicle.reverseUntil) {
        const shouldKeepReversing = (vehicle.continuousReverse || !hasEnoughSpaceToStopReversing(vehicle, t))
          && vehicle.distance > getReverseLimit(vehicle) + 0.05;
        const reverseReason = vehicle.reverseReason || 'continue';
        const keepContinuous = vehicle.continuousReverse && shouldKeepReversing;
        stopSpaceReverse(vehicle, keepContinuous);
        if (shouldKeepReversing && startSpaceReverse(vehicle, t, reverseReason)) {
          return resolveSpaceReverse(vehicle, delta, t);
        }
        if (shouldKeepReversing) {
          vehicle.velocity = 0;
          vehicle.state = 'SPACE_WAIT_REAR';
          applyVehicleRoutePose(vehicle, delta);
          return true;
        }
      }
      return false;
    }

    if (!vehicle.continuousReverse && hasEnoughSpaceToStopReversing(vehicle, t)) {
      stopSpaceReverse(vehicle);
      clearSpaceRequest(vehicle);
      return false;
    }

    const reverseStep = Math.min((vehicle.speed || 5) * SPACE_REVERSE_SPEED_FACTOR * delta, (vehicle.speed || 5) * delta);
    const reverseDistance = Math.max(getReverseLimit(vehicle), vehicle.distance - reverseStep);
    const rearBlocker = findBodyContactBlocker(vehicle, reverseDistance, vehicles());
    if (rearBlocker) {
      vehicle.reverseBlockedBy = rearBlocker.other;
      vehicle.reverseBlockedAt = t;
      requestVehicleSpace(rearBlocker.other, vehicle, t);
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
    if (isBeforeRoundaboutEntry(vehicle)) {
      clearSpaceRequest(vehicle);
      return false;
    }
    const requesterStillNeedsSpace = requester.route?.mode === 'roundabout' && !isYieldTargetClear(requester, vehicle, vehicles());
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

    if (vehicle.distance <= getReverseLimit(vehicle) + 0.05) {
      clearSpaceRequest(vehicle);
      vehicle.blockedFor = 0;
      return false;
    }

    vehicle.velocity = 0;
    vehicle.state = 'SPACE_WAIT_REAR';
    return true;
  }

  function tryCrawlOutWhenReverseBlocked(vehicle, delta, t, state = 'CLEARING_GRIDLOCK') {
    if (isBeforeRoundaboutEntry(vehicle)) return false;
    if (vehicle.distance > getReverseLimit(vehicle) + 0.05 || vehicle.reverseBlockedBy) return false;
    const crawlDistance = Math.min(vehicle.route.length + 1.5, vehicle.distance + Math.max(0.08, (vehicle.speed || 5) * delta * 0.45));
    if (hasActualBodyContact(vehicle, crawlDistance, null, vehicles())) return false;
    vehicle.distance = crawlDistance;
    vehicle.velocity = 0;
    vehicle.blockedFor = SPACE_REVERSE_DELAY_SECONDS;
    vehicle.state = state;
    applyVehicleRoutePose(vehicle, delta);
    return true;
  }

  function tryReleaseStaleRoundaboutVehicle(vehicle, delta, targetVehicle = null) {
    if (isBeforeRoundaboutEntry(vehicle)) return false;
    if ((vehicle.blockedFor || 0) < ROUNDABOUT_STALE_RELEASE_SECONDS) return false;
    const despawnDistance = vehicle.route.length + 1.5;
    const crawlStep = Math.max(0.08, (vehicle.speed || 5) * delta * ROUNDABOUT_STALE_CRAWL_SPEED_FACTOR);
    const crawlDistance = Math.min(despawnDistance, vehicle.distance + crawlStep);
    const escapeDistance = chooseEscapeDistance(vehicle, delta, targetVehicle);
    const escapeStep = Math.max(crawlStep, (vehicle.speed || 5) * delta * ROUNDABOUT_STALE_ESCAPE_SPEED_FACTOR);
    const nextDistance = escapeDistance > vehicle.distance + 0.02
      ? Math.min(despawnDistance, moveDistanceToward(vehicle.distance, escapeDistance, escapeStep))
      : crawlDistance;

    if (nextDistance <= vehicle.distance + 0.002) return false;
    if (hasActualBodyContact(vehicle, nextDistance, null, vehicles())) return false;

    vehicle.distance = nextDistance;
    vehicle.velocity = 0;
    vehicle.blockedFor = 1.2;
    vehicle.state = 'CLEARING_GRIDLOCK';
    vehicle.enteredIntersection = vehicle.distance >= vehicle.route.entryS;
    vehicle.exitedIntersection = vehicle.distance >= vehicle.route.exitS;
    applyVehicleRoutePose(vehicle, delta);
    return true;
  }

  function trySeparateContactPair(vehicle, delta, t, blocker) {
    if (isBeforeRoundaboutEntry(vehicle)) return false;
    const other = blocker?.other;
    if (!other || (vehicle.bodyContactFor || 0) < ROUNDABOUT_CONTACT_SEPARATE_SECONDS) return false;
    const shouldYield = shouldYieldContact(vehicle, other);
    const step = Math.max(0.16, (vehicle.speed || 5) * delta * 1.2);
    const directions = shouldYield ? [-1, 1] : [1, -1];
    const limitMin = getReverseLimit(vehicle);
    const limitMax = vehicle.route.length + 1.5;
    const distances = [chooseEscapeDistance(vehicle, delta, other)];

    directions.forEach((direction) => {
      [1.2, 2.4, 4.2, 6.4, 8.5].forEach((multiplier) => {
        distances.push(Math.max(limitMin, Math.min(limitMax, vehicle.distance + direction * step * multiplier)));
      });
    });

    let best = null;
    distances.forEach((distance) => {
      if (Math.abs(distance - vehicle.distance) < 0.01) return;
      if (hasAnyBodyOverlap(vehicle, distance, null, vehicles())) return;
      const score = getEscapeScoreAt(vehicle, distance, other, vehicles());
      if (score === -Infinity) return;
      const preferredDirection = shouldYield ? distance < vehicle.distance : distance > vehicle.distance;
      const option = { distance, score: score + (preferredDirection ? 0.6 : 0) };
      if (!best || option.score > best.score) best = option;
    });

    if (!best && (vehicle.bodyContactFor || 0) >= ROUNDABOUT_CONTACT_SEPARATE_SECONDS * 2) {
      const emergencyDistance = findEmergencyContactClearDistance(vehicle, delta, other);
      if (emergencyDistance !== null) best = { distance: emergencyDistance, score: 0 };
    }

    if (!best) return false;
    const separationStep = Math.max(0.055, (vehicle.speed || 5) * delta * ROUNDABOUT_CONTACT_SEPARATION_SPEED_FACTOR);
    vehicle.distance = moveDistanceToward(vehicle.distance, best.distance, separationStep);
    vehicle.velocity = 0;
    vehicle.blockedFor = Math.max(vehicle.blockedFor || 0, SPACE_REVERSE_DELAY_SECONDS);
    vehicle.continuousReverse = vehicle.continuousReverse || shouldYield;
    vehicle.state = 'CLEARING_GRIDLOCK';
    vehicle.enteredIntersection = vehicle.distance >= vehicle.route.entryS;
    vehicle.exitedIntersection = vehicle.distance >= vehicle.route.exitS;
    applyVehicleRoutePose(vehicle, delta);
    if (vehicle.distance <= limitMin + 0.05) requestVehicleSpace(other, vehicle, t);
    return true;
  }

  return {
    requestVehicleSpace,
    clearSpaceRequest,
    getReverseLimit,
    startSpaceReverse,
    resolveSpaceReverse,
    resolveSpaceRequest,
    tryCrawlOutWhenReverseBlocked,
    tryReleaseStaleRoundaboutVehicle,
    trySeparateContactPair,
    forceContactRecovery,
    chooseEscapeDistance,
    findEmergencyContactClearDistance,
  };
}
