import { CROWD_CAPACITY, CROWD_SECTORS } from './stadium-geometry.js';

/** Trạng thái lấp đầy — nguồn dữ liệu cho 3D + HUD */
const state = {
  capacity: CROWD_CAPACITY,
  sectors: Object.fromEntries(
    CROWD_SECTORS.map((s) => [s.id, { label: s.label, capacity: s.capacity, count: 0 }]),
  ),
};

/** Mock: ~87% lấp đầy theo capacity thực từ geometry */
function applyDefaultFill() {
  const defaultCounts = {
    north: 1897,
    south: 2146,
    east: 1962,
    west: 2011,
  };
  const ratio = 0.87;
  CROWD_SECTORS.forEach((sec) => {
    state.sectors[sec.id].count = Math.min(
      sec.capacity,
      defaultCounts[sec.id] ?? Math.round(sec.capacity * ratio),
    );
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
    state.sectors[sec.id].count = Math.round(sec.capacity * ratio);
  });
}

export function setCrowdTotal(total) {
  const ratio = Math.max(0, Math.min(1, total / state.capacity));
  CROWD_SECTORS.forEach((sec) => {
    state.sectors[sec.id].count = Math.round(sec.capacity * ratio);
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
      capacity: sec.capacity,
      fillPercent: Math.round((state.sectors[sec.id].count / sec.capacity) * 100),
    })),
    groups: CROWD_SECTORS.map((sec, i) => ({
      label: state.sectors[sec.id].label,
      value: state.sectors[sec.id].count,
      tone: ['cyan', 'purple', 'blue', 'green'][i],
    })),
  };
}
