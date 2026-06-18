import { getRouteSpawnS } from './traffic-lanes.js';
import {
  distanceBetweenRouteSamples,
  getVehicleFootprintBox,
  getVehicleFootprintGap,
  getVehicleRouteSample,
  vehicleFootprintsOverlap,
} from './traffic-occupancy.js';

export function createTrafficSpawner({
  getVehicles,
  getRuntime,
  getVehicleLengthAllowance,
  refreshVehicleModelForSpawn,
  resetVehicleModelOpacity,
  setVehiclePoseFromLane,
  syncVehicleLaneState,
  constants,
}) {
  const {
    ROUNDABOUT_MAX_SMOOTH_VEHICLES,
    ROUNDABOUT_MAX_ACTIVE_PER_APPROACH,
    ROUNDABOUT_MIN_SPAWN_INTERVAL_SECONDS,
  } = constants;

  const vehicles = () => getVehicles?.() || [];
  const runtime = () => getRuntime?.() || null;

  function canSpawnVehicle(vehicle, t) {
    if (!vehicle.route || t < vehicle.respawnAt) return false;
    const roundabout = runtime()?.roundabout;
    const activeVehicles = runtime()?.vehicles.filter((other) => other.mesh.visible) || [];
    const spawnInterval = vehicle.route.mode === 'roundabout'
      ? Math.max(roundabout?.spawnIntervalSeconds || ROUNDABOUT_MIN_SPAWN_INTERVAL_SECONDS, ROUNDABOUT_MIN_SPAWN_INTERVAL_SECONDS)
      : 0.85;
    const approachInterval = vehicle.route.mode === 'roundabout'
      ? Math.max(roundabout?.spawnApproachIntervalSeconds || spawnInterval, spawnInterval)
      : spawnInterval;
    if (vehicle.route.mode === 'roundabout') {
      const maxActiveVehicles = Math.min(roundabout?.maxActiveVehicles || ROUNDABOUT_MAX_SMOOTH_VEHICLES, ROUNDABOUT_MAX_SMOOTH_VEHICLES);
      if (activeVehicles.length >= maxActiveVehicles) return false;
    }
    if (t - (runtime()?.lastSpawnAt ?? -Infinity) < spawnInterval) return false;
    if (t - (runtime()?.lastSpawnAtByLane?.get(vehicle.route.id) ?? -Infinity) < spawnInterval) return false;
    if (t - (runtime()?.lastSpawnAtByApproach?.get(vehicle.route.approach) ?? -Infinity) < approachInterval) return false;
    if (vehicle.route.mode === 'roundabout') {
      const maxActivePerApproach = Math.min(roundabout?.maxActivePerApproach || ROUNDABOUT_MAX_ACTIVE_PER_APPROACH, ROUNDABOUT_MAX_ACTIVE_PER_APPROACH);
      const sameApproachActive = activeVehicles.filter((other) => other.route?.approach === vehicle.route.approach && other.distance < other.route.entryS + 3).length;
      if (sameApproachActive >= maxActivePerApproach) return false;
      const sameApproachQueue = activeVehicles.some((other) => (
        other.route?.approach === vehicle.route.approach
        && other.distance < other.route.entryS
        && other.distance > other.route.stopLineS - 3
      ));
      if (sameApproachQueue) return false;
    }
    const spawnS = getRouteSpawnS(vehicle.route);
    const spawnSample = getVehicleRouteSample(vehicle, spawnS);
    const spawnBox = getVehicleFootprintBox(vehicle, spawnSample, 0.22);
    const spawnClearance = Math.max(
      vehicle.route.safeGap + getVehicleLengthAllowance(vehicle),
      vehicle.route.mode === 'roundabout' ? (roundabout?.spawnClearance || 14) : 7.2,
    );
    return !vehicles().some((other) => {
      if (other === vehicle || other.type !== 'vehicle' || !other.mesh.visible) return false;
      if (other.route === vehicle.route && other.distance >= spawnS && other.distance - spawnS < spawnClearance) return true;
      if (!other.route) return false;
      const minGap = getVehicleFootprintGap(vehicle, other);
      const otherSample = getVehicleRouteSample(other, other.distance);
      const otherBox = getVehicleFootprintBox(other, otherSample, 0.22);
      return vehicleFootprintsOverlap(spawnBox, otherBox)
        || distanceBetweenRouteSamples(vehicle, spawnS, other, other.distance) < minGap;
    });
  }

  function resetVehicleOnRoute(vehicle, t = 0) {
    const spawnS = getRouteSpawnS(vehicle.route);
    refreshVehicleModelForSpawn(vehicle);
    vehicle.distance = spawnS;
    vehicle.s = spawnS;
    vehicle.velocity = vehicle.speed || 0;
    vehicle.displayHeading = null;
    vehicle.blockedFor = 0;
    vehicle.spaceRequestFrom = null;
    vehicle.spaceRequestUntil = 0;
    vehicle.reverseUntil = 0;
    vehicle.reverseStartedAt = 0;
    vehicle.reverseRequestedAt = 0;
    vehicle.reverseReason = null;
    vehicle.reverseBlockedBy = null;
    vehicle.reverseBlockedAt = 0;
    vehicle.continuousReverse = false;
    vehicle.bodyContactFor = 0;
    vehicle.entryClearUntil = 0;
    vehicle.contactBackoffUntil = 0;
    vehicle.contactBackoffForVehicle = null;
    vehicle.contactBackoffTargetS = null;
    vehicle.contactBackoffStartedAt = 0;
    vehicle.contactBackoffStartS = null;
    vehicle.contactBackoffElapsed = 0;
    vehicle.contactBackoffDuration = 0;
    vehicle.contactBackoffSpeed = 0;
    vehicle.maxForwardDistance = spawnS;
    vehicle.lastForwardProgressAt = t;
    vehicle.state = vehicle.route.mode === 'roundabout' ? 'APPROACHING' : 'queued';
    vehicle.enteredIntersection = false;
    vehicle.exitedIntersection = false;
    resetVehicleModelOpacity(vehicle.mesh);
    vehicle.mesh.visible = true;
    setVehiclePoseFromLane(vehicle, { s: spawnS, velocity: vehicle.speed || 0 });
    syncVehicleLaneState(vehicle);
    if (runtime()) {
      runtime().lastSpawnAt = t;
      runtime().lastSpawnAtByLane.set(vehicle.route.id, t);
      runtime().lastSpawnAtByApproach?.set(vehicle.route.approach, t);
    }
    if (runtime()?.debug) console.info('[traffic-debug] spawn', vehicle.id, vehicle.routeId);
  }

  function despawnVehicle(vehicle, t, state = 'despawned') {
    vehicle.mesh.visible = false;
    vehicle.velocity = 0;
    vehicle.displayHeading = null;
    vehicle.blockedFor = 0;
    vehicle.spaceRequestFrom = null;
    vehicle.spaceRequestUntil = 0;
    vehicle.reverseUntil = 0;
    vehicle.reverseStartedAt = 0;
    vehicle.reverseRequestedAt = 0;
    vehicle.reverseReason = null;
    vehicle.reverseBlockedBy = null;
    vehicle.reverseBlockedAt = 0;
    vehicle.continuousReverse = false;
    vehicle.bodyContactFor = 0;
    vehicle.entryClearUntil = 0;
    vehicle.contactBackoffUntil = 0;
    vehicle.contactBackoffForVehicle = null;
    vehicle.contactBackoffTargetS = null;
    vehicle.contactBackoffStartedAt = 0;
    vehicle.contactBackoffStartS = null;
    vehicle.contactBackoffElapsed = 0;
    vehicle.contactBackoffDuration = 0;
    vehicle.contactBackoffSpeed = 0;
    vehicle.maxForwardDistance = vehicle.distance;
    vehicle.lastForwardProgressAt = t;
    vehicle.state = state;
    vehicle.respawnAt = vehicle.route?.mode === 'roundabout'
      ? t + 1.5 + Math.random() * 2
      : t + 4 + Math.random() * 8;
    syncVehicleLaneState(vehicle);
    if (vehicle.label) vehicle.label.visible = false;
    if (runtime()?.debug) console.info('[traffic-debug] despawn', vehicle.id, vehicle.routeId);
  }

  return {
    canSpawnVehicle,
    resetVehicleOnRoute,
    despawnVehicle,
  };
}
