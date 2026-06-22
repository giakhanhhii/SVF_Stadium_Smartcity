/**
 * Camera 2D thời gian thực cho nút giao A4.
 * KHÔNG mô phỏng random: đọc trực tiếp các xe đang chạy trong model 3D
 * (window.__smartcityTrafficRuntime) rồi chiếu xuống góc nhìn top-down,
 * đếm số ô tô / xe máy đang lưu thông theo thời gian thực.
 */

let canvas = null;
let ctx = null;
let rafId = 0;
let layout = null;
let countEls = null;
let statusEl = null;
let lastCounts = { total: -1, car: -1, moto: -1 };
let resizeObserver = null;
let lastTs = 0;
// vehicle -> { rx, rz, h, px, pz }  (rendered pos/heading + last true pos)
const renderState = new WeakMap();

// Tốc độ nội suy (cao = bám sát hơn, thấp = mượt hơn). Độc lập framerate.
const POS_RATE = 16;
const HEADING_RATE = 11;
// Nhảy quãng dài (respawn) thì snap thay vì trượt ngang màn hình.
const SNAP_DIST_SQ = 64; // (8 đơn vị thế giới)^2

function getRuntime() {
  return (typeof window !== 'undefined' && window.__smartcityTrafficRuntime) || null;
}

function computeLayout() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(rect.width, 200);
  const h = Math.max(rect.height, 160);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const rt = getRuntime();
  const lay = rt?.layout || {};
  const mapLimit = lay.mapLimit || 36;
  const halfExtent = mapLimit + 4;
  const scale = (Math.min(w, h) * 0.96) / (2 * halfExtent);

  layout = {
    w,
    h,
    cx: w / 2,
    cy: h / 2,
    scale,
    halfExtent,
    roadHalf: ((lay.laneCountPerRoad || 4) * (lay.laneWidth || 3.5)) / 2,
    roundabout: rt?.roundabout || null,
  };
}

function toX(wx) { return layout.cx + wx * layout.scale; }
function toY(wz) { return layout.cy + wz * layout.scale; }

function drawBackground() {
  const { w, h } = layout;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#04263c');
  bg.addColorStop(1, '#031019');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
}

function drawCity() {
  const half = layout.roadHalf;
  const ext = layout.halfExtent;
  // 4 góc phần tư là các khối đô thị.
  const quads = [
    [-ext, -ext, -half, -half],
    [half, -ext, ext, -half],
    [-ext, half, -half, ext],
    [half, half, ext, ext],
  ];
  ctx.fillStyle = 'rgba(10, 52, 78, 0.5)';
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.14)';
  ctx.lineWidth = 1;
  quads.forEach(([x0, z0, x1, z1]) => {
    const cols = 2;
    const rows = 2;
    const bw = (x1 - x0);
    const bh = (z1 - z0);
    const gx = bw * 0.16;
    const gz = bh * 0.16;
    const cw = (bw - gx) / cols;
    const ch = (bh - gz) / rows;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const px = toX(x0 + c * (cw + gx));
        const pz = toY(z0 + r * (ch + gz));
        roundRect(px, pz, cw * layout.scale * 0.86, ch * layout.scale * 0.86, 4);
        ctx.fill();
        ctx.stroke();
      }
    }
  });
}

function drawRoads() {
  const { cx, cy, w, h, scale } = layout;
  const halfPx = layout.roadHalf * scale;
  ctx.fillStyle = 'rgba(14, 26, 38, 0.96)';
  ctx.fillRect(0, cy - halfPx, w, halfPx * 2);
  ctx.fillRect(cx - halfPx, 0, halfPx * 2, h);

  // Vạch tim đường.
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.26)';
  ctx.lineWidth = Math.max(1, scale * 0.18);
  ctx.setLineDash([scale * 1.6, scale * 1.2]);
  line(0, cy, cx - halfPx, cy); line(cx + halfPx, cy, w, cy);
  line(cx, 0, cx, cy - halfPx); line(cx, cy + halfPx, cx, h);
  ctx.setLineDash([]);
}

function drawRoundabout() {
  const ra = layout.roundabout;
  if (!ra || !ra.enabled) return;
  const { cx, cy, scale } = layout;
  // Vòng xuyến.
  ctx.beginPath();
  ctx.arc(cx, cy, (ra.laneRadius + ra.laneHalfWidth) * scale, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.22)';
  ctx.lineWidth = Math.max(1, scale * 0.2);
  ctx.stroke();
  // Đảo trung tâm.
  ctx.beginPath();
  ctx.arc(cx, cy, ra.islandRadius * scale, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(13, 158, 117, 0.32)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(94, 224, 176, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

// Cập nhật vị trí/hướng đã làm mượt cho 1 xe theo dt, trả về { x, z, h } (đơn vị thế giới).
function updateRenderState(veh, dt) {
  const x = veh.mesh.position.x;
  const z = veh.mesh.position.z;
  let st = renderState.get(veh);
  if (!st) {
    st = { rx: x, rz: z, px: x, pz: z, h: Math.atan2(Math.cos(veh.mesh.rotation.y), Math.sin(veh.mesh.rotation.y)) };
    renderState.set(veh, st);
  }

  // Hướng mục tiêu suy ra từ dịch chuyển thực (bỏ qua khi gần như đứng yên).
  const tdx = x - st.px;
  const tdz = z - st.pz;
  let targetH = st.h;
  if (tdx * tdx + tdz * tdz > 0.0004) targetH = Math.atan2(tdz, tdx);
  st.px = x;
  st.pz = z;

  const jumpSq = (x - st.rx) * (x - st.rx) + (z - st.rz) * (z - st.rz);
  if (jumpSq > SNAP_DIST_SQ) {
    // Respawn / đổi làn xa: snap ngay, không trượt.
    st.rx = x;
    st.rz = z;
    st.h = targetH;
  } else {
    const posK = 1 - Math.exp(-dt * POS_RATE);
    st.rx += (x - st.rx) * posK;
    st.rz += (z - st.rz) * posK;
    st.h = lerpAngle(st.h, targetH, 1 - Math.exp(-dt * HEADING_RATE));
  }
  return st;
}

function drawVehicle(veh, dt) {
  const isMoto = veh.vehicleKind === 'moto';
  const st = updateRenderState(veh, dt);
  const px = toX(st.rx);
  const pz = toY(st.rz);
  const h = st.h;
  // Kích thước xe (đơn vị thế giới ~ mét) chiếu sang pixel.
  const len = (isMoto ? 2.0 : 4.4) * layout.scale;
  const wid = (isMoto ? 0.95 : 2.0) * layout.scale;
  const color = veh.color || (isMoto ? '#69c7e8' : '#23c8ee');

  ctx.save();
  ctx.translate(px, pz);
  ctx.rotate(h);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = len * 0.2;
  ctx.fillStyle = color;
  roundRect(-len / 2, -wid / 2, len, wid, Math.min(wid * 0.42, len * 0.2));
  ctx.fill();
  ctx.shadowBlur = 0;
  if (!isMoto) {
    ctx.fillStyle = 'rgba(8, 22, 34, 0.5)';
    roundRect(len * 0.04, -wid * 0.34, len * 0.26, wid * 0.68, wid * 0.2);
    ctx.fill();
  }
  // Đèn pha.
  ctx.fillStyle = 'rgba(255, 246, 214, 0.95)';
  ctx.fillRect(len * 0.42, -wid * 0.36, len * 0.07, wid * 0.24);
  ctx.fillRect(len * 0.42, wid * 0.12, len * 0.07, wid * 0.24);
  ctx.restore();
}

function line(x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function roundRect(x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function setCounts(car, moto) {
  const total = car + moto;
  if (!countEls) return;
  if (total !== lastCounts.total) countEls.total.textContent = String(total);
  if (car !== lastCounts.car) countEls.car.textContent = String(car);
  if (moto !== lastCounts.moto) countEls.moto.textContent = String(moto);
  lastCounts = { total, car, moto };
}

function frame(ts) {
  if (!ctx) return;
  const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.1) : 0.016;
  lastTs = ts;
  const rt = getRuntime();
  drawBackground();
  drawCity();
  drawRoads();
  drawRoundabout();

  let car = 0;
  let moto = 0;
  if (rt && Array.isArray(rt.vehicles)) {
    rt.vehicles.forEach((veh) => {
      if (!veh.mesh || !veh.mesh.visible) return;
      drawVehicle(veh, dt);
      if (veh.vehicleKind === 'moto') moto += 1; else car += 1;
    });
  }
  setCounts(car, moto);

  if (statusEl) {
    if (!rt) {
      statusEl.textContent = 'Đang kết nối luồng giao thông 3D…';
      statusEl.hidden = false;
    } else if (car + moto === 0) {
      statusEl.textContent = 'Chưa có phương tiện trong khung hình';
      statusEl.hidden = false;
    } else {
      statusEl.hidden = true;
    }
  }

  rafId = requestAnimationFrame(frame);
}

export function openTrafficLiveMap(modal) {
  canvas = modal.querySelector('[data-traffic-live-canvas]');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  countEls = {
    total: modal.querySelector('[data-live-total]'),
    car: modal.querySelector('[data-live-car]'),
    moto: modal.querySelector('[data-live-moto]'),
  };
  statusEl = modal.querySelector('[data-traffic-live-status]');
  lastCounts = { total: -1, car: -1, moto: -1 };
  lastTs = 0;
  computeLayout();
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => { if (ctx) computeLayout(); });
    resizeObserver.observe(canvas);
  }
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(frame);
}

export function closeTrafficLiveMap() {
  cancelAnimationFrame(rafId);
  rafId = 0;
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  ctx = null;
  canvas = null;
}
