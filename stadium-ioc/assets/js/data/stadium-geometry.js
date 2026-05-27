/** Khớp scripts/generate-stadium-glb.mjs — SIZE_MULT=2 */
export const SIZE_MULT = 2;
export const STADIUM_SCALE = Math.max(
  (105 / 2 + 11 + 0.68 + 5) / 58,
  1.32,
) * SIZE_MULT;
export const YS = STADIUM_SCALE;
export const BOWL = {
  innerRx: 58 * STADIUM_SCALE,
  innerRz: 42 * STADIUM_SCALE,
  outerRx: 92 * STADIUM_SCALE,
  outerRz: 74 * STADIUM_SCALE,
};
export const BOWL_INNER_PAD = 6;
export const PITCH_HALF_L = 105 / 2;
export const PITCH_HALF_W = 68 / 2;
export const SEAT_AISLE = 11;
export const SEAT_DEPTH = 0.68;
export const SEAT_H = 0.28;
export const U_SEAT = 0.42;
export const SEAT_SPACING = 0.95;
export const CROWD_TIERS = 24;
export const STAND_INSET = 0.965;
export const TIER_F1_OFFSET = 1.85;

export const CROWD_SECTORS = [
  { id: 'north', label: 'Khán đài A', a0: -Math.PI * 0.78, a1: -Math.PI * 0.22 },
  { id: 'south', label: 'Khán đài B', a0: Math.PI * 0.22, a1: Math.PI * 0.78 },
  { id: 'east', label: 'Khán đài C', a0: -Math.PI * 0.22, a1: Math.PI * 0.22 },
  { id: 'west', label: 'Khán đài D', a0: Math.PI * 0.78, a1: Math.PI * 1.22 },
];

export function tierAt(f) {
  let rx = BOWL.innerRx + BOWL_INNER_PAD + f * (BOWL.outerRx - BOWL.innerRx - BOWL_INNER_PAD)
    + (f > 0.55 ? (f - 0.55) * 10 * STADIUM_SCALE : 0);
  let rz = BOWL.innerRz + BOWL_INNER_PAD + f * (BOWL.outerRz - BOWL.innerRz - BOWL_INNER_PAD)
    + (f > 0.55 ? (f - 0.55) * 7 * STADIUM_SCALE : 0);
  rx = Math.max(rx, PITCH_HALF_L + SEAT_AISLE + SEAT_DEPTH);
  rz = Math.max(rz, PITCH_HALF_W + SEAT_AISLE + SEAT_DEPTH);
  const y = (1.5 + f ** 0.88 * 24 + Math.max(0, f - 0.5) ** 2 * 8) * YS;
  return { rx, rz, y };
}

export function ellipseR(a, rx, rz) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return (rx * rz) / Math.sqrt((rz * c) ** 2 + (rx * s) ** 2);
}

export function rectR(a, rx, rz) {
  const s = Math.abs(Math.sin(a));
  const c = Math.abs(Math.cos(a));
  const denom = Math.max(s / rx, c / rz) || 1;
  return 1 / denom;
}

export function surfacePoint(a, y, rx, rz, outward = 0) {
  const nx = Math.sin(a) / rx;
  const nz = Math.cos(a) / rz;
  const nl = Math.hypot(nx, nz) || 1;
  return {
    x: rx * Math.sin(a) + (nx / nl) * outward,
    y,
    z: rz * Math.cos(a) + (nz / nl) * outward,
  };
}

export function surfacePointRect(a, y, rx, rz, outward = 0) {
  const r = rectR(a, rx, rz);
  const x = Math.sin(a) * r + (outward ? Math.sign(Math.sin(a)) * outward : 0);
  const z = Math.cos(a) * r + (outward ? Math.sign(Math.cos(a)) * outward : 0);
  return { x, y, z };
}

/** Vị trí ghế — cùng công thức buildCrowdLayer / buildSolidBowlSector trong generator */
export function buildSeatMap() {
  const seats = [];
  let globalIndex = 0;

  for (const sector of CROWD_SECTORS) {
    for (let t = 0; t < CROWD_TIERS; t++) {
      const f0 = (t + 1.0) / CROWD_TIERS;
      const f1 = (t + TIER_F1_OFFSET) / CROWD_TIERS;
      const r0 = tierAt(Math.min(f0, 0.98));
      const r1 = tierAt(Math.min(f1, 1));
      const yTop = r1.y + SEAT_H;
      const rx = (r0.rx + U_SEAT * (r1.rx - r0.rx)) * STAND_INSET;
      const rz = (r0.rz + U_SEAT * (r1.rz - r0.rz)) * STAND_INSET;
      const midR = (rectR(sector.a0, rx, rz) + rectR(sector.a1, rx, rz)) * 0.5;
      const arcLen = Math.abs(sector.a1 - sector.a0) * midR;
      const seatsAlong = Math.max(16, Math.min(96, Math.round(arcLen / SEAT_SPACING)));

      for (let si = 0; si < seatsAlong; si++) {
        const ang = sector.a0 + ((si + 0.5) / seatsAlong) * (sector.a1 - sector.a0);
        const pt = surfacePointRect(ang, yTop, rx, rz, 0);
        seats.push({
          index: globalIndex++,
          sector: sector.id,
          sectorLabel: sector.label,
          x: pt.x,
          y: yTop + 0.29,
          z: pt.z,
          rotY: Math.PI + ang,
        });
      }
    }
  }

  return seats;
}

const _SEAT_CACHE = buildSeatMap();
export const CROWD_CAPACITY = _SEAT_CACHE.length;

/** Trả bản cache — tránh lệch giữa capacity và tọa độ */
export function getSeatMap() {
  return _SEAT_CACHE;
}

export function getSectorCapacities() {
  const caps = Object.fromEntries(CROWD_SECTORS.map((s) => [s.id, 0]));
  _SEAT_CACHE.forEach((s) => { caps[s.sector] += 1; });
  return caps;
}

// Gán capacity thực cho HUD
CROWD_SECTORS.forEach((s) => {
  s.capacity = getSectorCapacities()[s.id];
});
