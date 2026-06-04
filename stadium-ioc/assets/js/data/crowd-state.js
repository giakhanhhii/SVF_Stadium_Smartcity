import { CROWD_CAPACITY, CROWD_SECTORS } from './stadium-geometry.js';

export const STADIUM_DISPLAY_CAPACITY = 60000;
export const DEFAULT_FILL_PERCENT = 87;

function scaledSectorCapacities() {
  const geomTotal = CROWD_CAPACITY || CROWD_SECTORS.length;
  let remaining = STADIUM_DISPLAY_CAPACITY;
  return CROWD_SECTORS.map((sec, index) => {
    if (index === CROWD_SECTORS.length - 1) {
      return { id: sec.id, capacity: remaining };
    }
    const capacity = Math.round((sec.capacity / geomTotal) * STADIUM_DISPLAY_CAPACITY);
    remaining -= capacity;
    return { id: sec.id, capacity };
  });
}

const DISPLAY_SECTOR_CAPACITY = Object.fromEntries(
  scaledSectorCapacities().map((sec) => [sec.id, sec.capacity]),
);

/** Trạng thái lấp đầy — nguồn dữ liệu cho 3D + HUD */
const state = {
  capacity: STADIUM_DISPLAY_CAPACITY,
  sectors: Object.fromEntries(
    CROWD_SECTORS.map((s) => [s.id, { label: s.label, capacity: DISPLAY_SECTOR_CAPACITY[s.id], count: 0 }]),
  ),
};

/** Mock: ~87% lấp đầy theo capacity thực từ geometry */
function applyDefaultFill() {
  const ratio = DEFAULT_FILL_PERCENT / 100;
  CROWD_SECTORS.forEach((sec) => {
    state.sectors[sec.id].count = Math.round(state.sectors[sec.id].capacity * ratio);
  });
}
applyDefaultFill();

function sectorFillRatio(id) {
  const s = state.sectors[id];
  return s ? s.count / s.capacity : 0;
}

export function getCrowdTotal() {
  return Object.values(state.sectors).reduce((sum, s) => sum + s.count, 0);
}

export function getCrowdFillPercent() {
  return Math.round((getCrowdTotal() / state.capacity) * 100);
}

export function getCrowdFillRatio() {
  return getCrowdTotal() / state.capacity;
}

export function isSeatOccupied(seatIndex, sectorId) {
  const ratio = sectorFillRatio(sectorId);
  const h = ((seatIndex * 2654435761) >>> 0) / 4294967296;
  return h < ratio;
}

export function setSectorCount(sectorId, count) {
  const s = state.sectors[sectorId];
  if (!s) return;
  s.count = Math.max(0, Math.min(s.capacity, Math.round(count)));
}

export function setFillPercent(percent) {
  const ratio = Math.max(0, Math.min(100, percent)) / 100;
  CROWD_SECTORS.forEach((sec) => {
    state.sectors[sec.id].count = Math.round(state.sectors[sec.id].capacity * ratio);
  });
}

export function setCrowdTotal(total) {
  const ratio = Math.max(0, Math.min(1, total / state.capacity));
  CROWD_SECTORS.forEach((sec) => {
    state.sectors[sec.id].count = Math.round(state.sectors[sec.id].capacity * ratio);
  });
}

export function getCrowdSnapshot() {
  const total = getCrowdTotal();
  const fillPercent = getCrowdFillPercent();
  return {
    capacity: state.capacity,
    total,
    fillPercent,
    fillRatio: total / state.capacity,
    totalFormatted: total.toLocaleString('vi-VN'),
    capacityFormatted: state.capacity.toLocaleString('vi-VN'),
    sectors: CROWD_SECTORS.map((sec) => ({
      id: sec.id,
      label: state.sectors[sec.id].label,
      count: state.sectors[sec.id].count,
      capacity: state.sectors[sec.id].capacity,
      fillPercent: Math.round((state.sectors[sec.id].count / state.sectors[sec.id].capacity) * 100),
    })),
    groups: CROWD_SECTORS.map((sec, i) => ({
      label: state.sectors[sec.id].label,
      value: state.sectors[sec.id].count,
      tone: ['cyan', 'purple', 'blue', 'green'][i],
    })),
  };
}
