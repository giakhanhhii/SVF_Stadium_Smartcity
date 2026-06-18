import { trafficSceneData } from '../../data/traffic-scene.js';

const LANE_TANGENT_SAMPLE_DISTANCE = 0.85;

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

function sampleCubic(a, b, c, d, steps = 18) {
  const points = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const mt = 1 - t;
    points.push([
      mt * mt * mt * a[0]
        + 3 * mt * mt * t * b[0]
        + 3 * mt * t * t * c[0]
        + t * t * t * d[0],
      mt * mt * mt * a[1]
        + 3 * mt * mt * t * b[1]
        + 3 * mt * t * t * c[1]
        + t * t * t * d[1],
    ]);
  }
  return points;
}

function add2(point, vector, scale) {
  return [point[0] + vector[0] * scale, point[1] + vector[1] * scale];
}

export function normalizeAngle(angle) {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

export function ccwAngleDistance(from, to) {
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

function resamplePolyline(points, spacing = 0.55) {
  if (points.length < 2) return points;
  const resampled = [points[0]];
  let segmentIndex = 1;
  let previous = points[0];
  let current = points[1];
  let segmentLength = Math.hypot(current[0] - previous[0], current[1] - previous[1]);
  let distanceIntoSegment = 0;
  let nextDistance = spacing;
  let traveled = 0;

  while (segmentIndex < points.length) {
    const remaining = segmentLength - distanceIntoSegment;
    if (traveled + remaining >= nextDistance) {
      const needed = nextDistance - traveled;
      const t = (distanceIntoSegment + needed) / Math.max(0.001, segmentLength);
      resampled.push([
        previous[0] + (current[0] - previous[0]) * t,
        previous[1] + (current[1] - previous[1]) * t,
      ]);
      distanceIntoSegment += needed;
      nextDistance += spacing;
    } else {
      traveled += remaining;
      segmentIndex += 1;
      previous = current;
      current = points[segmentIndex];
      distanceIntoSegment = 0;
      if (!current) break;
      segmentLength = Math.hypot(current[0] - previous[0], current[1] - previous[1]);
    }
  }

  const last = points[points.length - 1];
  const tail = resampled[resampled.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > 0.01) resampled.push(last);
  return resampled;
}

function circleTangent(angle) {
  return [-Math.sin(angle), Math.cos(angle)];
}

function buildLaneBase(points) {
  const samples = points.map(([x, z]) => ({ x, z }));
  const lengths = [0];
  for (let i = 1; i < samples.length; i += 1) {
    lengths[i] = lengths[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z);
  }
  return { points: samples, lengths, length: lengths[lengths.length - 1] };
}

function findLaneDistance(lane, predicate) {
  for (let i = 0; i < lane.points.length; i += 1) {
    if (predicate(lane.points[i])) return lane.lengths[i];
  }
  return null;
}

function attachLaneDerivedFields(lane) {
  lane.spawnS = lane.spawnS ?? 0;
  lane.stopLineS = lane.stopLineS ?? lane.stopS ?? lane.entryS ?? 0;
  lane.conflictZone = lane.conflictZone ?? { entryS: lane.entryS, exitS: lane.exitS };
  lane.spawnPoint = getRouteSample(lane, lane.spawnS);
  lane.stopLine = getRouteSample(lane, lane.stopLineS);
  lane.direction = {
    from: { ...lane.points[0] },
    to: { ...lane.points[lane.points.length - 1] },
    heading: getLaneTangentHeading(lane, lane.spawnS, 0),
  };
  return lane;
}

function makeSignalLane(id, approach, turn, movement, points, layout) {
  const lane = {
    ...buildLaneBase(points),
    id,
    laneId: id,
    approach,
    turn,
    movement,
    signalGroup: movement,
    mode: 'signal',
    safeGap: turn === 'straight' ? 4.6 : 5.2,
    turnSlowdown: turn === 'straight' ? 1 : 0.62,
  };
  lane.stopS = findLaneDistance(lane, (p) => (
    (approach === 'N' && p.z >= -layout.stopOffset)
    || (approach === 'S' && p.z <= layout.stopOffset)
    || (approach === 'W' && p.x >= -layout.stopOffset)
    || (approach === 'E' && p.x <= layout.stopOffset)
  ));
  lane.entryS = findLaneDistance(lane, (p) => Math.abs(p.x) <= layout.intersectionHalf && Math.abs(p.z) <= layout.intersectionHalf);
  lane.exitS = findLaneDistance(lane, (p) => lane.entryS !== null && lane.lengths[lane.points.indexOf(p)] > lane.entryS && (Math.abs(p.x) > layout.intersectionHalf || Math.abs(p.z) > layout.intersectionHalf));
  if (lane.stopS === null) lane.stopS = Math.max(0, lane.entryS - 3);
  if (lane.entryS === null) lane.entryS = lane.stopS + 3;
  if (lane.exitS === null) lane.exitS = lane.entryS + 14;
  return attachLaneDerivedFields(lane);
}

function makeRoundaboutLane(id, approach, turn, points, meta) {
  const lane = {
    ...buildLaneBase(points),
    id,
    laneId: id,
    approach,
    turn,
    mode: 'roundabout',
    signalGroup: `ROUNDABOUT_${approach}`,
    stopS: Math.max(0, meta.entryS - 3.4),
    stopLineS: Math.max(0, meta.entryS - 3.4),
    entryS: meta.entryS,
    exitS: meta.exitS,
    exitPoint: meta.exitPoint,
    entryPoint: meta.entryPoint,
    entryAngle: meta.entryAngle,
    exitAngle: meta.exitAngle,
    safeGap: trafficSceneData.roundabout?.circulatingSafeGap || 5.8,
    turnSlowdown: 0.68,
    conflictZone: { entryS: meta.entryS, exitS: meta.exitS },
  };
  return attachLaneDerivedFields(lane);
}

export function buildTrafficRoutes(layout) {
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
    const built = makeSignalLane(route[0], route[1], route[2], route[3], route[4], layout);
    return [built.id, built];
  }));
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
  const approachDefs = {
    N: { start: [-outer, -limit], anchor: [-outer, -13], entry: [0, -radius], approachDir: [0, 1] },
    E: { start: [limit, -outer], anchor: [13, -outer], entry: [radius, 0], approachDir: [-1, 0] },
    S: { start: [outer, limit], anchor: [outer, 13], entry: [0, radius], approachDir: [0, -1] },
    W: { start: [-limit, outer], anchor: [-13, outer], entry: [-radius, 0], approachDir: [1, 0] },
  };
  const exitDefs = {
    N: { exit: [0, -radius], anchor: [outer, -13], end: [outer, -limit], exitDir: [0, -1] },
    E: { exit: [radius, 0], anchor: [13, outer], end: [limit, outer], exitDir: [1, 0] },
    S: { exit: [0, radius], anchor: [-outer, 13], end: [-outer, limit], exitDir: [0, 1] },
    W: { exit: [-radius, 0], anchor: [-13, -outer], end: [-limit, -outer], exitDir: [-1, 0] },
  };
  const starts = Object.fromEntries(Object.entries(approachDefs).map(([approach, def]) => {
    const entryAngle = entryAngles[approach];
    const tangent = circleTangent(entryAngle);
    const curve = sampleCubic(
      def.anchor,
      add2(def.anchor, def.approachDir, 5.6),
      add2(def.entry, tangent, -4.8),
      def.entry,
      22,
    );
    return [approach, [def.start, def.anchor, ...curve]];
  }));
  const exits = Object.fromEntries(Object.entries(exitDefs).map(([approach, def]) => {
    const exitAngle = entryAngles[approach];
    const tangent = circleTangent(exitAngle);
    const curve = sampleCubic(
      def.exit,
      add2(def.exit, tangent, 4.8),
      add2(def.anchor, def.exitDir, -5.6),
      def.anchor,
      22,
    );
    return [approach, [def.exit, ...curve, def.end]];
  }));
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
    const arcPoints = sampleArc(radius, entryAngle, exitAngle, turn === 'right' ? 18 : turn === 'straight' ? 28 : 40);
    const exitPoints = exits[exitApproach].slice(1);
    const points = resamplePolyline([...approachPoints, ...arcPoints, ...exitPoints]);
    const entryS = approachPoints.reduce((sum, point, index) => {
      if (index === 0) return 0;
      const prev = approachPoints[index - 1];
      return sum + Math.hypot(point[0] - prev[0], point[1] - prev[1]);
    }, 0);
    const arcLength = ccwAngleDistance(entryAngle, exitAngle) * radius;
    const built = makeRoundaboutLane(id, approach, turn, points, {
      entryS,
      exitS: entryS + arcLength,
      entryPoint: approachPoints[approachPoints.length - 1],
      exitPoint: exits[exitApproach][0],
      entryAngle,
      exitAngle,
    });
    return [built.id, built];
  }));
}

export function getRouteSample(route, distance) {
  if (distance < 0 && route.points.length > 1) {
    const prev = route.points[0];
    const next = route.points[1];
    const heading = Math.atan2(next.x - prev.x, next.z - prev.z);
    return {
      x: prev.x + Math.sin(heading) * distance,
      z: prev.z + Math.cos(heading) * distance,
      heading,
    };
  }
  if (distance > route.length && route.points.length > 1) {
    const prev = route.points[route.points.length - 2];
    const next = route.points[route.points.length - 1];
    const heading = Math.atan2(next.x - prev.x, next.z - prev.z);
    const overshoot = distance - route.length;
    return {
      x: next.x + Math.sin(heading) * overshoot,
      z: next.z + Math.cos(heading) * overshoot,
      heading,
    };
  }
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

export function getLaneTangentHeading(route, distance, velocity = 0) {
  const current = getRouteSample(route, distance);
  const sampleDistance = Math.max(0.45, Math.min(1.1, LANE_TANGENT_SAMPLE_DISTANCE + Math.max(0, velocity) * 0.035));
  const backDistance = Math.max(0, distance - sampleDistance);
  const frontDistance = Math.min(route.length, distance + sampleDistance);
  const back = getRouteSample(route, backDistance);
  const front = getRouteSample(route, frontDistance);
  const dx = front.x - back.x;
  const dz = front.z - back.z;
  if (Math.hypot(dx, dz) < 0.001) return current.heading;
  return Math.atan2(dx, dz);
}

export function getRouteSpawnS(route) {
  return route?.spawnS ?? 0;
}

export function getRouteStopLineS(route) {
  return route?.stopLineS ?? route?.stopS ?? 0;
}

export const getVehiclePoseHeading = getLaneTangentHeading;
