/**
 * Camera 2D thời gian thực cho nút giao A4.
 * KHÔNG mô phỏng random: đọc trực tiếp các xe đang chạy trong model 3D
 * (window.__smartcityTrafficRuntime) rồi chiếu xuống góc nhìn top-down,
 * đếm số ô tô / xe máy đang lưu thông theo thời gian thực.
 *
 * Lớp AI giám sát: phân tích quỹ đạo THẬT của xe để phát hiện
 *  - va chạm / nguy cơ va chạm (khoảng cách + tốc độ tiếp cận),
 *  - đi ngược chiều trong vòng xuyến (chiều xoay ngược số đông),
 * rồi nháy đỏ xe vi phạm kèm bong bóng trạng thái bám theo xe.
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
// vehicle -> { rx, rz, h, px, pz, vx, vz, wrongFor }  (pos/hướng đã mượt + vận tốc thật)
const renderState = new WeakMap();
// vehicle -> { type, label, until }  (cảnh báo đang hoạt động, until = mốc ts ms)
const alertState = new WeakMap();

// Tốc độ nội suy (cao = bám sát hơn, thấp = mượt hơn). Độc lập framerate.
const POS_RATE = 16;
const HEADING_RATE = 11;
// Nhảy quãng dài (respawn) thì snap thay vì trượt ngang màn hình.
const SNAP_DIST_SQ = 64; // (8 đơn vị thế giới)^2

// Ngưỡng phát hiện (đơn vị thế giới ~ mét).
const COLLISION_DIST = 3.9;   // tâm xe quá sát = đã va chạm
const WARN_DIST = 6.6;        // trong khoảng này + đang lao vào nhau = nguy cơ
const MIN_CLOSING_SPEED = 1.6; // m/s: lọc xe bám đuôi giữ khoảng cách đều
const ALERT_HOLD_MS = 1600;   // giữ nháy đỏ + bong bóng tối thiểu
const WRONGWAY_NEEDED = 0.7;  // giây giữ chiều ngược liên tục mới báo

// Độ ưu tiên cảnh báo (cao đè thấp). Vượt đèn đỏ ưu tiên cao nhất, giữ tới khi xe despawn.
const ALERT_PRIORITY = { redlight: 4, collision: 3, imminent: 2, wrongway: 1 };
const ALERT_LABEL = {
  redlight: 'Vượt đèn đỏ',
  collision: 'Đã va chạm',
  imminent: 'Nguy cơ va chạm',
  wrongway: 'Đi ngược chiều',
};

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
    st = { rx: x, rz: z, px: x, pz: z, vx: 0, vz: 0, wrongFor: 0, h: Math.atan2(Math.cos(veh.mesh.rotation.y), Math.sin(veh.mesh.rotation.y)) };
    renderState.set(veh, st);
  }

  // Hướng mục tiêu + vận tốc THẬT suy ra từ dịch chuyển (bỏ qua khi gần như đứng yên).
  const tdx = x - st.px;
  const tdz = z - st.pz;
  let targetH = st.h;
  if (tdx * tdx + tdz * tdz > 0.0004) targetH = Math.atan2(tdz, tdx);
  if (dt > 0) {
    const velK = 1 - Math.exp(-dt * 8);
    st.vx += (tdx / dt - st.vx) * velK;
    st.vz += (tdz / dt - st.vz) * velK;
  }
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

function vehicleLenWorld(veh) { return veh.vehicleKind === 'moto' ? 2.0 : 4.4; }

function setAlert(veh, type, ts) {
  const prev = alertState.get(veh);
  // Giữ cảnh báo ưu tiên cao hơn nếu đang còn hiệu lực.
  if (prev && prev.until > ts && ALERT_PRIORITY[prev.type] > ALERT_PRIORITY[type]) {
    prev.until = ts + ALERT_HOLD_MS;
    return;
  }
  alertState.set(veh, { type, label: ALERT_LABEL[type], until: ts + ALERT_HOLD_MS });
}

function getActiveAlert(veh, ts) {
  const a = alertState.get(veh);
  return a && a.until > ts ? a : null;
}

// Phân tích quỹ đạo thật để gắn cảnh báo cho xe vi phạm.
function detectAlerts(actors, ts, dt) {
  // 0) Vượt đèn đỏ: cờ do runtime 3D gắn (xe runsRedLight cán vạch lúc đèn không xanh).
  // Refresh mỗi frame nên bong bóng giữ tới khi xe despawn (lúc đó xe rời actors).
  actors.forEach((a) => {
    if (a.veh.redLightViolation) setAlert(a.veh, 'redlight', ts);
  });

  // 1) Va chạm / nguy cơ va chạm theo từng cặp.
  for (let i = 0; i < actors.length; i += 1) {
    for (let j = i + 1; j < actors.length; j += 1) {
      const A = actors[i];
      const B = actors[j];
      const dx = B.veh.mesh.position.x - A.veh.mesh.position.x;
      const dz = B.veh.mesh.position.z - A.veh.mesh.position.z;
      const d = Math.hypot(dx, dz);
      const touch = (vehicleLenWorld(A.veh) + vehicleLenWorld(B.veh)) / 2;
      if (d < Math.max(COLLISION_DIST, touch * 0.9)) {
        setAlert(A.veh, 'collision', ts);
        setAlert(B.veh, 'collision', ts);
      } else if (d < WARN_DIST) {
        // Tốc độ tiếp cận = -d(distance)/dt theo vận tốc tương đối.
        const rvx = B.st.vx - A.st.vx;
        const rvz = B.st.vz - A.st.vz;
        const closing = -(dx * rvx + dz * rvz) / Math.max(d, 0.001);
        if (closing > MIN_CLOSING_SPEED) {
          setAlert(A.veh, 'imminent', ts);
          setAlert(B.veh, 'imminent', ts);
        }
      }
    }
  }

  // 2) Đi ngược chiều trong vòng xuyến: so chiều xoay với số đông.
  const ra = layout.roundabout;
  if (ra && ra.enabled) {
    const ringMax = (ra.laneRadius + ra.laneHalfWidth + 1.5);
    const onRing = actors.filter((a) => {
      const r = Math.hypot(a.veh.mesh.position.x, a.veh.mesh.position.z);
      const spd = Math.hypot(a.st.vx, a.st.vz);
      return r > ra.islandRadius && r < ringMax && spd > 1.2;
    });
    if (onRing.length >= 2) {
      // Mômen quay quanh tâm: x*vz - z*vx (dấu = chiều xoay).
      let net = 0;
      onRing.forEach((a) => {
        net += a.veh.mesh.position.x * a.st.vz - a.veh.mesh.position.z * a.st.vx;
      });
      const major = Math.sign(net) || 1;
      onRing.forEach((a) => {
        const spin = a.veh.mesh.position.x * a.st.vz - a.veh.mesh.position.z * a.st.vx;
        const against = Math.sign(spin) === -major && Math.abs(spin) > 3;
        a.st.wrongFor = against ? a.st.wrongFor + dt : 0;
        if (a.st.wrongFor > WRONGWAY_NEEDED) setAlert(a.veh, 'wrongway', ts);
      });
    }
  }
}

function drawVehicle(veh, st, ts) {
  const isMoto = veh.vehicleKind === 'moto';
  const px = toX(st.rx);
  const pz = toY(st.rz);
  const h = st.h;
  // Kích thước xe (đơn vị thế giới ~ mét) chiếu sang pixel.
  const len = vehicleLenWorld(veh) * layout.scale;
  const wid = (isMoto ? 0.95 : 2.0) * layout.scale;
  const alert = getActiveAlert(veh, ts);
  // Nháy đỏ khi có cảnh báo.
  const flash = alert ? 0.55 + 0.45 * Math.sin(ts / 110) : 0;
  const color = alert ? '#ff3b3b' : (veh.color || (isMoto ? '#69c7e8' : '#23c8ee'));

  ctx.save();
  ctx.translate(px, pz);
  ctx.rotate(h);
  if (alert) {
    ctx.shadowColor = `rgba(255, 60, 60, ${0.5 + 0.5 * flash})`;
    ctx.shadowBlur = len * (0.6 + 0.5 * flash);
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = len * 0.2;
  }
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

// Bong bóng trạng thái bám theo xe đang nháy đỏ.
function drawAlertBubble(veh, st, ts) {
  const alert = getActiveAlert(veh, ts);
  if (!alert) return;
  const px = toX(st.rx);
  const carPz = toY(st.rz);
  const lenPx = vehicleLenWorld(veh) * layout.scale;

  const text = alert.label;
  ctx.font = '700 11px "Segoe UI", system-ui, sans-serif';
  const padX = 8;
  const dotW = 12;
  const tw = ctx.measureText(text).width;
  const bw = tw + padX * 2 + dotW;
  const bh = 20;
  let bx = px - bw / 2;
  let by = carPz - lenPx / 2 - 12 - bh;
  // Giữ trong khung.
  bx = Math.max(4, Math.min(bx, layout.w - bw - 4));
  by = Math.max(4, by);

  const blink = 0.6 + 0.4 * Math.sin(ts / 110);

  // Đuôi bong bóng trỏ xuống xe.
  ctx.beginPath();
  ctx.moveTo(px - 5, by + bh);
  ctx.lineTo(px + 5, by + bh);
  ctx.lineTo(px, by + bh + 6);
  ctx.closePath();
  ctx.fillStyle = 'rgba(46, 8, 10, 0.94)';
  ctx.fill();

  ctx.shadowColor = `rgba(255, 60, 60, ${0.5 * blink})`;
  ctx.shadowBlur = 10;
  roundRect(bx, by, bw, bh, 5);
  ctx.fillStyle = 'rgba(46, 8, 10, 0.94)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = `rgba(255, 90, 90, ${0.7 + 0.3 * blink})`;
  ctx.stroke();

  // Chấm cảnh báo nhấp nháy.
  ctx.beginPath();
  ctx.arc(bx + padX + 2, by + bh / 2, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, ${Math.round(60 + 80 * blink)}, 60, 1)`;
  ctx.fill();

  ctx.fillStyle = '#ffe3e3';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, bx + padX + dotW, by + bh / 2 + 0.5);
  ctx.textBaseline = 'alphabetic';
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
  const actors = [];
  if (rt && Array.isArray(rt.vehicles)) {
    rt.vehicles.forEach((veh) => {
      if (!veh.mesh || !veh.mesh.visible) return;
      const st = updateRenderState(veh, dt);
      actors.push({ veh, st });
      if (veh.vehicleKind === 'moto') moto += 1; else car += 1;
    });
  }

  detectAlerts(actors, ts, dt);
  actors.forEach((a) => drawVehicle(a.veh, a.st, ts));
  actors.forEach((a) => drawAlertBubble(a.veh, a.st, ts));
  setCounts(car, moto);

  if (statusEl) {
    const alertCount = actors.filter((a) => getActiveAlert(a.veh, ts)).length;
    if (!rt) {
      statusEl.textContent = 'Đang kết nối luồng giao thông 3D…';
      statusEl.dataset.tone = 'info';
      statusEl.hidden = false;
    } else if (alertCount > 0) {
      statusEl.textContent = `⚠ Phát hiện ${alertCount} xe cảnh báo`;
      statusEl.dataset.tone = 'alert';
      statusEl.hidden = false;
    } else if (car + moto === 0) {
      statusEl.textContent = 'Chưa có phương tiện trong khung hình';
      statusEl.dataset.tone = 'info';
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
  if (statusEl) delete statusEl.dataset.tone;
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
