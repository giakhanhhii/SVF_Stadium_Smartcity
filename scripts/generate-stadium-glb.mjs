/**
 * PVF Stadium GLB — reference-accurate: attached dome, wave facade, inner bowl, landscape.
 * Run: npm run generate:stadium
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createCanvas, ImageData } from 'canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'stadium-ioc', 'assets', 'models', 'pvf-stadium-openroof-v4.glb');

const PITCH_L = 105;
const PITCH_W = 68;
const TEX = 1024;

const PITCH_HALF_L = PITCH_L / 2;
const PITCH_HALF_W = PITCH_W / 2;
const TRACK_OUTER = 59.5;
const SEAT_AISLE = 11;
const BOWL_INNER_PAD = 6;
const SEAT_DEPTH = 0.68;

/** Mỗi góc phải nằm ngoài sân + đường chạy + lối đi */
function clearedRadii(a, rx, rz) {
  const m = SEAT_AISLE + SEAT_DEPTH;
  const sinA = Math.max(Math.abs(Math.sin(a)), 0.22);
  const cosA = Math.max(Math.abs(Math.cos(a)), 0.22);
  const needRx = (PITCH_HALF_L + m) / sinA;
  const needRz = (PITCH_HALF_W + m) / cosA;
  const needR = Math.max(
    TRACK_OUTER + m,
    Math.hypot(PITCH_HALF_L + m, PITCH_HALF_W + m),
  );
  const rx2 = Math.max(rx, needRx, needR);
  const rz2 = Math.max(rz, needRz, needR);
  return { rx: rx2, rz: rz2 };
}

/** Scale đồng bộ: khán đài + facade + vòm + quảng trường, giữ sân FIFA cố định */
const BASE_BOWL = { innerRx: 58, innerRz: 42, outerRx: 92, outerRz: 74 };
const BASE_FACADE = { rx: 132, rz: 108 };

/** Hệ số phóng to tổng thể (2 = gấp đôi khán đài + thân + vòm, sân FIFA giữ nguyên) */
const SIZE_MULT = 2;

const STADIUM_SCALE = Math.max(
  (PITCH_HALF_L + SEAT_AISLE + SEAT_DEPTH + 5) / BASE_BOWL.innerRx,
  1.32,
) * SIZE_MULT;

/** Khoảng cách thêm từ mép facade ra ngoại cảnh — tránh chèn vào sân */
const OUTER_PAD = 72;

const BOWL = {
  innerRx: BASE_BOWL.innerRx * STADIUM_SCALE,
  innerRz: BASE_BOWL.innerRz * STADIUM_SCALE,
  outerRx: BASE_BOWL.outerRx * STADIUM_SCALE,
  outerRz: BASE_BOWL.outerRz * STADIUM_SCALE,
};
const FACADE = {
  rx: BASE_FACADE.rx * STADIUM_SCALE,
  rz: BASE_FACADE.rz * STADIUM_SCALE,
};

/** Scale dọc đồng bộ với STADIUM_SCALE — tránh mái tách khỏi thân kính */
const YS = STADIUM_SCALE;

/** Dome: full ellipsoid cap, 360° — chỉ hở lỗ chữ nhật ở đỉnh (mái trượt) */
export const DOME = {
  R: 100 * STADIUM_SCALE,
  sx: 1.42,
  sy: 0.48,
  sz: 1.24,
  phiLen: Math.PI * 0.405,
  rimY: 30 * YS,
  holeHalfX: 82 * STADIUM_SCALE,
  holeHalfZ: 58 * STADIUM_SCALE,
  cutFeather: 8 * STADIUM_SCALE,
  openPhiMax: Math.PI * 0.405 * 0.34,
  panelWidth: 88 * STADIUM_SCALE,
  panelDepth: 120 * STADIUM_SCALE,
  panelThickness: 8.2 * YS,
};
DOME.cy = DOME.rimY - DOME.R * DOME.sy * Math.cos(DOME.phiLen);
DOME.panelOpenY = DOME.cy + DOME.R * DOME.sy * Math.cos(0.145 * Math.PI) - 5.8 * YS;
DOME.panelClosedY = DOME.cy + DOME.R * DOME.sy * Math.cos(0.07 * Math.PI) - 5.4 * YS;
DOME.panelY = DOME.panelOpenY;
DOME.trussOpenY = DOME.panelOpenY + 1.0 * YS;
DOME.trussClosedY = DOME.panelClosedY + 1.0 * YS;
DOME.trussY = DOME.trussOpenY;
DOME.rimRx = DOME.R * DOME.sx * Math.sin(DOME.phiLen);
DOME.rimRz = DOME.R * DOME.sz * Math.sin(DOME.phiLen);
DOME.panelClosedX = Math.max(10 * STADIUM_SCALE, DOME.holeHalfX - DOME.panelWidth * 0.5 + 6 * STADIUM_SCALE);
DOME.panelOpenX = Math.min(
  DOME.holeHalfX + DOME.panelWidth * 0.5 - 20 * STADIUM_SCALE,
  DOME.rimRx - DOME.panelWidth * 0.5 - 28 * STADIUM_SCALE,
);
DOME.ridgeOffset = DOME.panelWidth * 0.46;
DOME.panelOpenTilt = 0;
DOME.panelClosedTilt = 0;
DOME.cutHalfX = DOME.holeHalfX + DOME.cutFeather;
DOME.cutHalfZ = DOME.holeHalfZ + DOME.cutFeather;

const GLASS_BANDS = [
  { y0: 3.6 * YS, y1: 9.0 * YS },
  { y0: 9.8 * YS, y1: 14.8 * YS },
  { y0: 15.6 * YS, y1: 20.6 * YS },
  { y0: 21.4 * YS, y1: 27.0 * YS },
];
const SPANDREL_BANDS = [
  { y0: 9.0 * YS, y1: 9.8 * YS },
  { y0: 14.8 * YS, y1: 15.6 * YS },
  { y0: 20.6 * YS, y1: 21.4 * YS },
  { y0: 27.0 * YS, y1: 30.0 * YS - 0.08 * YS },
];
/** Vành nối liền spandrel → vòm (chồng nhẹ lên đế mái) */
const COLLAR_Y0 = 30.0 * YS - 0.08 * YS;
const ROOF_COLLAR_TOP = DOME.rimY + 0.22 * YS;
const MULLION_SEGS = 80;
const MULLION_W = 0.24;
const MULLION_D = 0.38;

function domePoint(phi, theta) {
  return new THREE.Vector3(
    DOME.R * DOME.sx * Math.sin(phi) * Math.sin(theta),
    DOME.cy + DOME.R * DOME.sy * Math.cos(phi),
    DOME.R * DOME.sz * Math.sin(phi) * Math.cos(theta),
  );
}

function domeYAt(x, z) {
  const nx = x / (DOME.R * DOME.sx);
  const nz = z / (DOME.R * DOME.sz);
  const inside = Math.max(0, 1 - nx * nx - nz * nz);
  return DOME.cy + DOME.R * DOME.sy * Math.sqrt(inside);
}

function inDomeOpening(_phi, x, z) {
  return Math.abs(x) < DOME.cutHalfX && Math.abs(z) < DOME.cutHalfZ;
}

/** Liền khối 360°, khoét lỗ trung tâm — không hở 4 góc */
function buildDomeShellGeometry() {
  const geos = [];
  const thetaSegs = 72;
  const phiSegs = 28;

  for (let pi = 0; pi < phiSegs; pi++) {
    const phi0 = (pi / phiSegs) * DOME.phiLen;
    const phi1 = ((pi + 1) / phiSegs) * DOME.phiLen;

    for (let ti = 0; ti < thetaSegs; ti++) {
      const t0 = (ti / thetaSegs) * Math.PI * 2;
      const t1 = ((ti + 1) / thetaSegs) * Math.PI * 2;

      const corners = [[phi0, t0], [phi1, t0], [phi1, t1], [phi0, t1]];
      const skip = corners.every(([phi, theta]) => {
        const x = DOME.R * DOME.sx * Math.sin(phi) * Math.sin(theta);
        const z = DOME.R * DOME.sz * Math.sin(phi) * Math.cos(theta);
        return inDomeOpening(phi, x, z);
      });
      if (skip) continue;

      const pts = corners.map(([phi, theta]) => domePoint(phi, theta));
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(12);
      pts.forEach((v, i) => {
        pos[i * 3] = v.x;
        pos[i * 3 + 1] = v.y;
        pos[i * 3 + 2] = v.z;
      });
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      geo.computeVertexNormals();
      geos.push(geo);
    }
  }
  return mergeGeometries(geos, false);
}

function buildOpeningTrimStrip(x0, x1, z0, z1, xSegs = 18, zSegs = 8) {
  const positions = [];
  const indices = [];
  const yLift = 0.42 * YS;

  for (let zi = 0; zi <= zSegs; zi++) {
    const z = z0 + (zi / zSegs) * (z1 - z0);
    for (let xi = 0; xi <= xSegs; xi++) {
      const x = x0 + (xi / xSegs) * (x1 - x0);
      positions.push(x, domeYAt(x, z) + yLift, z);
    }
  }

  const row = xSegs + 1;
  for (let zi = 0; zi < zSegs; zi++) {
    for (let xi = 0; xi < xSegs; xi++) {
      const a = zi * row + xi;
      const b = a + 1;
      const c = a + row + 1;
      const d = a + row;
      indices.push(a, d, c, a, c, b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildRectOpeningTrimGeometry() {
  const trim = DOME.cutFeather * 2.0;
  const hx = DOME.holeHalfX;
  const hz = DOME.holeHalfZ;
  const geos = [
    buildOpeningTrimStrip(-hx - trim, hx + trim, hz, hz + trim, 32, 6),
    buildOpeningTrimStrip(-hx - trim, hx + trim, -hz - trim, -hz, 32, 6),
    buildOpeningTrimStrip(-hx - trim, -hx, -hz, hz, 6, 24),
    buildOpeningTrimStrip(hx, hx + trim, -hz, hz, 6, 24),
  ];
  return mergeGeometries(geos, false);
}

function facadeEllipseAtY(y) {
  const t = Math.min(1, Math.max(0, y / DOME.rimY));
  return {
    rx: FACADE.rx + t * (DOME.rimRx - FACADE.rx),
    rz: FACADE.rz + t * (DOME.rimRz - FACADE.rz),
  };
}

/** Cùng tham số với vành vòm: x=rx·sin(a), z=rz·cos(a) */
function surfacePoint(a, y, rx, rz, outward = 0) {
  const nx = Math.sin(a) / rx;
  const nz = Math.cos(a) / rz;
  const nl = Math.hypot(nx, nz) || 1;
  return new THREE.Vector3(
    rx * Math.sin(a) + (nx / nl) * outward,
    y,
    rz * Math.cos(a) + (nz / nl) * outward,
  );
}

const STAND_INSET = 0.965; // Keep stepped seating inside the enlarged stadium shell.

/** Điểm trên biên hình chữ nhật axis-aligned (chuẩn vuông): giao ray (sin, cos) với biên rx/rz. */
function rectR(a, rx, rz) {
  const s = Math.abs(Math.sin(a));
  const c = Math.abs(Math.cos(a));
  const denom = Math.max(s / rx, c / rz) || 1;
  return 1 / denom;
}

function surfacePointRect(a, y, rx, rz, outward = 0) {
  const r = rectR(a, rx, rz);
  // OUTWARD chỉ để tương thích chữ ký; phần khán đài gọi outward=0.
  const x = Math.sin(a) * r + (outward ? Math.sign(Math.sin(a)) * outward : 0);
  const z = Math.cos(a) * r + (outward ? Math.sign(Math.cos(a)) * outward : 0);
  return new THREE.Vector3(x, y, z);
}

function buildTaperedFacadeRing(y0, y1, rx0, rz0, rx1, rz1, segs = 72) {
  const geos = [];
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2;
    const v = [
      surfacePoint(a0, y0, rx0, rz0),
      surfacePoint(a1, y0, rx0, rz0),
      surfacePoint(a1, y1, rx1, rz1),
      surfacePoint(a0, y1, rx1, rz1),
    ];
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(12);
    v.forEach((vec, i) => { pos[i * 3] = vec.x; pos[i * 3 + 1] = vec.y; pos[i * 3 + 2] = vec.z; });
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    geos.push(geo);
  }
  return mergeGeometries(geos, false);
}

function buildVerticalMullions(y0, y1, rx0, rz0, rx1, rz1, segs = MULLION_SEGS) {
  const geos = [];
  const h = y1 - y0;
  const yMid = (y0 + y1) / 2;
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const rxM = (rx0 + rx1) * 0.5;
    const rzM = (rz0 + rz1) * 0.5;
    const mid = surfacePoint(a, yMid, rxM, rzM, MULLION_D * 0.5);
    const geo = new THREE.BoxGeometry(MULLION_W, h, MULLION_D);
    geo.translate(mid.x, yMid, mid.z);
    geo.rotateY(-a);
    geos.push(geo);
  }
  return mergeGeometries(geos, false);
}

function buildHorizontalMullionRing(y, rx, rz, segs = MULLION_SEGS, ht = 0.22) {
  const geos = [];
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2;
    const p0 = surfacePoint(a0, y, rx, rz, MULLION_D * 0.5);
    const p1 = surfacePoint(a1, y, rx, rz, MULLION_D * 0.5);
    const arc = p0.distanceTo(p1);
    const aMid = (a0 + a1) / 2;
    const mid = surfacePoint(aMid, y, rx, rz, MULLION_D * 0.5);
    const geo = new THREE.BoxGeometry(Math.max(arc, 0.8), ht, MULLION_D);
    geo.translate(mid.x, y, mid.z);
    geo.rotateY(-aMid);
    geos.push(geo);
  }
  return mergeGeometries(geos, false);
}

globalThis.ImageData = ImageData;
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
};
globalThis.document = {
  createElement(tag) {
    if (tag === 'canvas') {
      const c = createCanvas(TEX, TEX);
      c.convertToBlob = ({ type = 'image/png' } = {}) =>
        Promise.resolve(new Blob([c.toBuffer(type === 'image/jpeg' ? 'image/jpeg' : 'image/png', { quality: 0.88 })], { type }));
      return c;
    }
    return {};
  },
  createElementNS(_ns, tag) {
    return this.createElement(tag);
  },
};

function makeDataTexture(size, pixelFn, repeat = 4) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const [r, g, b, a = 255] = pixelFn(x, y, size);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeSignTexture() {
  const c = createCanvas(1024, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(30,32,40,0.15)';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 78px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PVF STADIUM', 512, 128);
  const data = ctx.getImageData(0, 0, 1024, 256).data;
  const tex = new THREE.DataTexture(data, 1024, 256);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeLedTexture() {
  const c = createCanvas(512, 192);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 512, 192);
  g.addColorStop(0, '#c41e1e');
  g.addColorStop(0.5, '#e85a20');
  g.addColorStop(1, '#b01010');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 192);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PVF', 256, 80);
  ctx.font = '24px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText('STADIUM', 256, 120);
  const data = ctx.getImageData(0, 0, 512, 192).data;
  const tex = new THREE.DataTexture(data, 512, 192);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const texGrass = makeDataTexture(TEX, (x, y, s) => {
  const stripe = Math.sin((y / s) * Math.PI * 40) > 0;
  return stripe ? [45, 138, 58] : [36, 122, 48];
});
const texSeatGray = makeDataTexture(TEX, (x, y, s) => {
  const row = Math.floor((y / s) * 40);
  return row % 2 ? [118, 122, 128] : [100, 104, 110];
}, 8);
const texCrowdDeck = makeDataTexture(TEX, (x, y, s) => {
  const cell = 10;
  const cx = Math.floor(x / cell);
  const cy = Math.floor(y / cell);
  const h = ((cx * 17 + cy * 31) % 100) / 100;
  const palette = [
    [32, 58, 110], [170, 38, 38], [228, 228, 232], [28, 28, 34],
    [36, 110, 52], [210, 160, 24], [120, 36, 98], [180, 90, 40],
  ];
  const c = palette[(cx + cy * 3) % palette.length];
  const n = (Math.sin(x * 0.08) + Math.sin(y * 0.06)) * 4;
  return [c[0] + n * h, c[1] + n * h * 0.5, c[2] + n * h * 0.3];
}, 4);
const texPtfe = makeDataTexture(TEX, (x, y) => {
  const n = Math.sin(x * 0.015) * 3 + Math.sin(y * 0.012) * 3;
  return [242 + n, 244 + n, 248 + n];
}, 2);
const texConcrete = makeDataTexture(TEX, (x, y) => {
  const n = Math.sin(x * 0.04) * Math.sin(y * 0.035) * 10;
  return [154 + n, 156 + n, 160 + n];
}, 3);
const texPlaza = makeDataTexture(TEX, (x, y, s) => {
  const gx = x % (s / 14) < 2;
  const gy = y % (s / 14) < 2;
  const n = Math.sin(x * 0.02) * 3;
  return gx || gy ? [138 + n, 140 + n, 144 + n] : [172 + n, 174 + n, 178 + n];
}, 6);
const texAsphalt = makeDataTexture(TEX, (x, y) => {
  if (y % 85 < 4) return [235, 235, 230];
  const n = Math.sin(x * 0.025) * 5;
  return [52 + n, 54 + n, 58 + n];
}, 2);
const texSign = makeSignTexture();
const texLed = makeLedTexture();
const texGlassCurtain = makeDataTexture(TEX, (x, y, s) => {
  const colW = s / 16;
  const rowH = s / 6;
  const fx = x % colW;
  const fy = y % rowH;
  const frame = fx < 4 || fx > colW - 4 || fy < 4 || fy > rowH - 4;
  if (frame) return [16, 18, 22];
  const pane = (Math.floor(x / colW) + Math.floor(y / rowH)) % 2;
  return pane ? [24, 38, 62] : [34, 52, 78];
}, 2);
const texDark = makeDataTexture(TEX, (x, y) => {
  const n = Math.sin(x * 0.02) * 4;
  return [32 + n, 34 + n, 38 + n];
}, 2);
const texLawn = makeDataTexture(TEX, (x, y) => {
  const n = Math.sin(x * 0.03) * Math.sin(y * 0.025) * 8;
  return [52 + n, 130 + n, 56 + n];
}, 3);

const MAT = {
  grass: new THREE.MeshStandardMaterial({
    map: texGrass,
    roughness: 0.88,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }),
  seatGray: new THREE.MeshStandardMaterial({
    map: texSeatGray,
    roughness: 0.82,
    metalness: 0.02,
    color: 0x788088,
    transparent: false,
    opacity: 1,
    side: THREE.DoubleSide,
  }),
  seatDeck: new THREE.MeshStandardMaterial({
    map: texCrowdDeck,
    roughness: 0.88,
    metalness: 0.01,
    color: 0xffffff,
    transparent: false,
    side: THREE.DoubleSide,
  }),
  crowd: new THREE.MeshBasicMaterial({ vertexColors: true }),
  ribbon: new THREE.MeshStandardMaterial({
    color: 0x1a4fa8,
    emissive: 0x2266cc,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  }),
  floodLight: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff4e0,
    emissiveIntensity: 1.1,
    roughness: 0.12,
    metalness: 0.08,
  }),
  floodGlow: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.55,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85,
  }),
  floodHousing: new THREE.MeshStandardMaterial({
    color: 0x14161c,
    roughness: 0.55,
    metalness: 0.42,
  }),
  bowlInner: new THREE.MeshStandardMaterial({
    map: texDark,
    roughness: 0.9,
    metalness: 0.04,
    color: 0x1e2228,
    transparent: false,
    side: THREE.DoubleSide,
  }),
  ptfe: new THREE.MeshStandardMaterial({ map: texPtfe, roughness: 0.38, metalness: 0.04, color: 0xf4f6fa }),
  ptfePanel: new THREE.MeshStandardMaterial({
    map: texPtfe,
    roughness: 0.42,
    metalness: 0.03,
    color: 0xf4f6fa,
    side: THREE.DoubleSide,
  }),
  dark: new THREE.MeshStandardMaterial({ map: texDark, roughness: 0.82, metalness: 0.08, color: 0x2a2e36 }),
  concrete: new THREE.MeshStandardMaterial({
    map: texConcrete,
    roughness: 0.92,
    metalness: 0.02,
    transparent: false,
    side: THREE.DoubleSide,
  }),
  plaza: new THREE.MeshStandardMaterial({ map: texPlaza, roughness: 0.88, metalness: 0.02 }),
  asphalt: new THREE.MeshStandardMaterial({ map: texAsphalt, roughness: 0.96, metalness: 0.01 }),
  sign: new THREE.MeshStandardMaterial({ map: texSign, roughness: 0.45, metalness: 0.12, transparent: true }),
  led: new THREE.MeshStandardMaterial({ map: texLed, roughness: 0.3, metalness: 0.1, emissive: 0x661010, emissiveIntensity: 0.25 }),
  glass: new THREE.MeshStandardMaterial({
    map: texGlassCurtain,
    roughness: 0.06,
    metalness: 0.74,
    transparent: true,
    opacity: 0.78,
  }),
  frame: new THREE.MeshStandardMaterial({ color: 0x12141a, roughness: 0.48, metalness: 0.42 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xc8ccd4, roughness: 0.32, metalness: 0.78 }),
  line: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  lawn: new THREE.MeshStandardMaterial({ map: texLawn, roughness: 0.9, metalness: 0 }),
  palm: new THREE.MeshStandardMaterial({ color: 0x3d6b32, roughness: 0.85 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x6b5038, roughness: 0.92 }),
  car: new THREE.MeshStandardMaterial({ color: 0xd8dce4, roughness: 0.35, metalness: 0.55 }),
};

function ellipseR(a, rx, rz) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return (rx * rz) / Math.sqrt((rz * c) ** 2 + (rx * s) ** 2);
}

function tierAt(f) {
  let rx = BOWL.innerRx + BOWL_INNER_PAD + f * (BOWL.outerRx - BOWL.innerRx - BOWL_INNER_PAD) + (f > 0.55 ? (f - 0.55) * 10 * STADIUM_SCALE : 0);
  let rz = BOWL.innerRz + BOWL_INNER_PAD + f * (BOWL.outerRz - BOWL.innerRz - BOWL_INNER_PAD) + (f > 0.55 ? (f - 0.55) * 7 * STADIUM_SCALE : 0);
  rx = Math.max(rx, PITCH_HALF_L + SEAT_AISLE + SEAT_DEPTH);
  rz = Math.max(rz, PITCH_HALF_W + SEAT_AISLE + SEAT_DEPTH);
  const y = (1.5 + Math.pow(f, 0.88) * 24 + Math.pow(Math.max(0, f - 0.5), 2) * 8) * YS;
  return { rx, rz, y };
}

function quadGeo(v) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(12);
  v.forEach((vec, i) => { pos[i * 3] = vec.x; pos[i * 3 + 1] = vec.y; pos[i * 3 + 2] = vec.z; });
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.computeVertexNormals();
  return geo;
}

function crAt(a, rx, rz) {
  return clearedRadii(a, rx, rz);
}

const CROWD_SHIRTS = [
  [0.12, 0.24, 0.55], [0.82, 0.16, 0.16], [0.92, 0.92, 0.94], [0.12, 0.12, 0.14],
  [0.16, 0.48, 0.28], [0.92, 0.68, 0.12], [0.48, 0.14, 0.42], [0.72, 0.38, 0.18],
];
const SKIN = [0.82, 0.68, 0.52];

function pushColoredBox(positions, colors, w, h, d, px, py, pz, rotY, rgb) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.rotateY(rotY);
  geo.translate(px, py, pz);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    colors.push(rgb[0], rgb[1], rgb[2]);
  }
  geo.dispose();
}

/** Người ngồi — rải đều dọc cung, một ghế/vị trí (không xếp cột dọc) */
function buildCrowdLayer(a0, a1, tiers = 24) {
  const positions = [];
  const colors = [];
  const seatH = 0.28;
  const seatSpacing = 0.95;
  // Thu bước để tránh hở nhỏ giữa các tầng treads/risers.
  const TIER_F1_OFFSET = 1.85;

  for (let t = 0; t < tiers; t++) {
    const f0 = (t + 1.0) / tiers;
    const f1 = (t + TIER_F1_OFFSET) / tiers;
    const r0 = tierAt(Math.min(f0, 0.98));
    const r1 = tierAt(Math.min(f1, 1));
    const yTop = r1.y + seatH;
    const uSeat = 0.42;
    const rx = (r0.rx + uSeat * (r1.rx - r0.rx)) * STAND_INSET;
    const rz = (r0.rz + uSeat * (r1.rz - r0.rz)) * STAND_INSET;
    const midR = (rectR(a0, rx, rz) + rectR(a1, rx, rz)) * 0.5;
    const arcLen = Math.abs(a1 - a0) * midR;
    const seatsAlong = Math.max(16, Math.min(96, Math.round(arcLen / seatSpacing)));

    for (let si = 0; si < seatsAlong; si++) {
      if ((t * 17 + si * 31) % 11 === 0) continue;

      const ang = a0 + ((si + 0.5) / seatsAlong) * (a1 - a0);
      const pt = surfacePointRect(ang, yTop + 0.12, rx, rz, 0);
      const shirt = CROWD_SHIRTS[(t * 7 + si) % CROWD_SHIRTS.length];
      pushColoredBox(positions, colors, 1.05, 1.1, 0.82, pt.x, yTop + 0.72, pt.z, -ang, shirt);
      pushColoredBox(positions, colors, 0.44, 0.44, 0.38, pt.x, yTop + 1.38, pt.z, -ang, SKIN);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Khán đài liền khối — mặt bậc + vách kín, không nhìn xuyên thấu */
function buildSolidBowlSector(a0, a1, tiers = 24, arcSeg = 28) {
  const treadGeos = [];
  const riserGeos = [];
  const innerGeos = [];
  const ribbonGeos = [];
  const seatH = 0.28;
  // Thu bước để tránh hở nhỏ giữa các tầng treads/risers.
  const TIER_F1_OFFSET = 1.85;

  for (let t = 0; t < tiers; t++) {
    const f0 = (t + 1.0) / tiers;
    const f1 = (t + TIER_F1_OFFSET) / tiers;
    const r0 = tierAt(Math.min(f0, 0.98));
    const r1 = tierAt(Math.min(f1, 1));

    for (let s = 0; s < arcSeg; s++) {
      const u0 = s / arcSeg;
      const u1 = (s + 1) / arcSeg;
      const ang0 = a0 + u0 * (a1 - a0);
      const ang1 = a0 + u1 * (a1 - a0);

      const yTop = r1.y + seatH;

      treadGeos.push(quadGeo([
        surfacePointRect(ang0, yTop, r0.rx * STAND_INSET, r0.rz * STAND_INSET),
        surfacePointRect(ang1, yTop, r0.rx * STAND_INSET, r0.rz * STAND_INSET),
        surfacePointRect(ang1, yTop, r1.rx * STAND_INSET, r1.rz * STAND_INSET),
        surfacePointRect(ang0, yTop, r1.rx * STAND_INSET, r1.rz * STAND_INSET),
      ]));

      ribbonGeos.push(quadGeo([
        surfacePointRect(ang0, yTop + 0.1, r0.rx * STAND_INSET, r0.rz * STAND_INSET, 0),
        surfacePointRect(ang1, yTop + 0.1, r0.rx * STAND_INSET, r0.rz * STAND_INSET, 0),
        surfacePointRect(ang1, yTop + 0.38, r1.rx * STAND_INSET, r1.rz * STAND_INSET, 0),
        surfacePointRect(ang0, yTop + 0.38, r1.rx * STAND_INSET, r1.rz * STAND_INSET, 0),
      ]));

      riserGeos.push(quadGeo([
        surfacePointRect(ang0, r0.y, r0.rx * STAND_INSET, r0.rz * STAND_INSET),
        surfacePointRect(ang1, r0.y, r0.rx * STAND_INSET, r0.rz * STAND_INSET),
        surfacePointRect(ang1, yTop, r1.rx * STAND_INSET, r1.rz * STAND_INSET),
        surfacePointRect(ang0, yTop, r1.rx * STAND_INSET, r1.rz * STAND_INSET),
      ]));

      if (t === 0 && r0.y > 0.5) {
        innerGeos.push(quadGeo([
          surfacePointRect(ang0, 0.12, r0.rx * STAND_INSET, r0.rz * STAND_INSET),
          surfacePointRect(ang1, 0.12, r0.rx * STAND_INSET, r0.rz * STAND_INSET),
          surfacePointRect(ang1, r0.y - 0.08, r0.rx * STAND_INSET, r0.rz * STAND_INSET),
          surfacePointRect(ang0, r0.y - 0.08, r0.rx * STAND_INSET, r0.rz * STAND_INSET),
        ]));
      }
    }
  }

  return {
    treads: mergeGeometries(treadGeos, false),
    risers: mergeGeometries(riserGeos, false),
    innerWall: mergeGeometries(innerGeos, false),
    ribbons: mergeGeometries(ribbonGeos, false),
  };
}

function buildFacadeRing(y0, y1, rx, rz, segs = 64) {
  return buildTaperedFacadeRing(y0, y1, rx, rz, rx, rz, segs);
}

function createStands(group) {
  const seamOverlap = 0.02;
  const bowl = buildSolidBowlSector(0, Math.PI * 2 + seamOverlap, 24, 120);

  const g = new THREE.Group();
  g.name = 'stands';

  const treads = new THREE.Mesh(bowl.treads, MAT.seatDeck);
  treads.name = 'stand_seats';
  g.add(treads);

  const risers = new THREE.Mesh(bowl.risers, MAT.concrete);
  risers.name = 'stand_risers';
  g.add(risers);

  const ribbons = new THREE.Mesh(bowl.ribbons, MAT.ribbon);
  ribbons.name = 'stand_ribbon';
  g.add(ribbons);

  const inner = new THREE.Mesh(bowl.innerWall, MAT.bowlInner);
  inner.name = 'stand_inner_wall';
  g.add(inner);

  const labels = [
    ['stand_north', -Math.PI * 0.5],
    ['stand_south', Math.PI * 0.5],
    ['stand_east', 0],
    ['stand_west', Math.PI],
  ];
  labels.forEach(([name]) => {
    const marker = new THREE.Group();
    marker.name = name;
    g.add(marker);
  });

  group.add(g);
}

/** Dải đèn pha — vòng ellipse khớp khán đài, lõm vào trong, chỉ thấy từ trong sân */
function createFloodlights(group) {
  const g = new THREE.Group();
  g.name = 'floodlights';

  const rim = tierAt(0.94);
  const yLight = tierAt(1).y + 0.55 + 0.55;
  const rx = rim.rx;
  const rz = rim.rz;
  const panelIn = -0.35;
  const housingIn = -1.75;
  const segs = 128;

  const panelGeos = [];
  const glowStripGeos = [];
  const housingGeos = [];

  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2;

    panelGeos.push(quadGeo([
      surfacePoint(a0, yLight + 0.2, rx, rz, panelIn),
      surfacePoint(a1, yLight + 0.2, rx, rz, panelIn),
      surfacePoint(a1, yLight - 0.14, rx, rz, panelIn),
      surfacePoint(a0, yLight - 0.14, rx, rz, panelIn),
    ]));

    glowStripGeos.push(quadGeo([
      surfacePoint(a0, yLight - 0.02, rx, rz, panelIn + 0.04),
      surfacePoint(a1, yLight - 0.02, rx, rz, panelIn + 0.04),
      surfacePoint(a1, yLight - 0.24, rx, rz, panelIn + 0.04),
      surfacePoint(a0, yLight - 0.24, rx, rz, panelIn + 0.04),
    ]));

    housingGeos.push(quadGeo([
      surfacePoint(a0, yLight + 0.58, rx, rz, housingIn),
      surfacePoint(a1, yLight + 0.58, rx, rz, housingIn),
      surfacePoint(a1, yLight + 0.12, rx, rz, housingIn),
      surfacePoint(a0, yLight + 0.12, rx, rz, housingIn),
    ]));
  }

  const housing = new THREE.Mesh(mergeGeometries(housingGeos, false), MAT.floodHousing);
  housing.name = 'flood_housing';
  g.add(housing);

  const panelsMesh = new THREE.Mesh(mergeGeometries(panelGeos, false), MAT.floodLight);
  panelsMesh.name = 'flood_panels';
  g.add(panelsMesh);

  const glowStrip = new THREE.Mesh(mergeGeometries(glowStripGeos, false), MAT.floodGlow);
  glowStrip.name = 'flood_glow_strip';
  g.add(glowStrip);

  group.add(g);
}

function createPitch(group) {
  const g = new THREE.Group();
  g.name = 'pitch';

  const pitchL = BOWL.innerRx * 2.24;
  // Cho cỏ “fill” sát mép khán đài trong: tăng margin để không còn mảng nền trắng
  const pitchW = BOWL.innerRz * 2.24;
  const scale = Math.min(pitchL / PITCH_L, pitchW / PITCH_W);
  const lineW = 0.74 * scale;
  const lineY = 0.68;
  const goalDepth = 2.4 * scale;
  const goalWidth = 7.32 * scale;
  const goalHeight = 2.44 * scale;
  const postW = 0.18 * scale;

  const surf = new THREE.Mesh(new THREE.PlaneGeometry(pitchL, pitchW, 1, 1), MAT.grass);
  surf.rotation.x = -Math.PI / 2;
  surf.position.y = 0.42;
  surf.renderOrder = 8;
  surf.name = 'pitch_surface';
  g.add(surf);

  const addLine = (name, x, z, w, d) => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.line);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, lineY, z);
    line.renderOrder = 10;
    line.name = name;
    g.add(line);
    return line;
  };

  const addCircle = (name, radius, x = 0, z = 0, start = 0, end = Math.PI * 2) => {
    const pts = [];
    const steps = Math.max(24, Math.ceil((Math.abs(end - start) / (Math.PI * 2)) * 96));
    for (let i = 0; i <= steps; i++) {
      const a = start + ((end - start) * i) / steps;
      pts.push(new THREE.Vector3(x + Math.cos(a) * radius, lineY, z + Math.sin(a) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, steps, lineW * 0.55, 6, false), MAT.line);
    tube.renderOrder = 10;
    tube.name = name;
    g.add(tube);
    return tube;
  };

  const addGoal = (name, side) => {
    const goal = new THREE.Group();
    goal.name = name;
    const x = side * (pitchL / 2 - 1.35 * scale);
    const backX = x - side * goalDepth;
    const railX = (x + backX) / 2;
    const postGeo = new THREE.BoxGeometry(postW, goalHeight, postW);
    const barGeo = new THREE.BoxGeometry(postW, postW, goalWidth + postW);
    const depthGeo = new THREE.BoxGeometry(goalDepth, postW * 0.72, postW * 0.72);
    [-1, 1].forEach((zSign) => {
      const post = new THREE.Mesh(postGeo, MAT.line);
      post.position.set(x, goalHeight / 2 + lineY, zSign * goalWidth / 2);
      goal.add(post);

      const rearPost = new THREE.Mesh(postGeo, MAT.line);
      rearPost.position.set(backX, goalHeight / 2 + lineY, zSign * goalWidth / 2);
      goal.add(rearPost);

      const sideRail = new THREE.Mesh(depthGeo, MAT.line);
      sideRail.position.set(railX, goalHeight + lineY, zSign * goalWidth / 2);
      goal.add(sideRail);

      const groundRail = new THREE.Mesh(depthGeo, MAT.line);
      groundRail.position.set(railX, lineY + postW * 0.35, zSign * goalWidth / 2);
      goal.add(groundRail);
    });

    const crossbar = new THREE.Mesh(barGeo, MAT.line);
    crossbar.position.set(x, goalHeight + lineY, 0);
    goal.add(crossbar);

    const backBar = new THREE.Mesh(barGeo, MAT.line);
    backBar.position.set(backX, goalHeight + lineY, 0);
    goal.add(backBar);

    const bottomBar = new THREE.Mesh(barGeo, MAT.line);
    bottomBar.position.set(backX, lineY + postW * 0.35, 0);
    goal.add(bottomBar);

    const netMat = new THREE.MeshBasicMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0.32, side: THREE.DoubleSide });

    const backNet = new THREE.Mesh(new THREE.PlaneGeometry(goalWidth, goalHeight), netMat);
    backNet.rotation.y = Math.PI / 2;
    backNet.position.set(backX, goalHeight / 2 + lineY, 0);
    backNet.renderOrder = 9;
    goal.add(backNet);

    [-1, 1].forEach((zSign) => {
      const sideNet = new THREE.Mesh(new THREE.PlaneGeometry(goalDepth, goalHeight), netMat);
      sideNet.position.set(railX, goalHeight / 2 + lineY, zSign * goalWidth / 2);
      sideNet.renderOrder = 9;
      goal.add(sideNet);
    });

    const topNet = new THREE.Mesh(new THREE.PlaneGeometry(goalDepth, goalWidth), netMat);
    topNet.rotation.x = -Math.PI / 2;
    topNet.position.set(railX, goalHeight + lineY, 0);
    topNet.renderOrder = 9;
    goal.add(topNet);

    g.add(goal);
  };

  const fieldL = pitchL * 0.88;
  const fieldW = pitchW * 0.78;
  const halfL = fieldL / 2;
  const halfW = fieldW / 2;
  addLine('pitch_line_north', 0, -halfW + lineW / 2, pitchL, lineW);
  addLine('pitch_line_south', 0, halfW - lineW / 2, pitchL, lineW);
  addLine('pitch_line_west', -halfL + lineW / 2, 0, lineW, pitchW);
  addLine('pitch_line_east', halfL - lineW / 2, 0, lineW, pitchW);
  addLine('pitch_halfway_line', 0, 0, lineW, pitchW);
  addCircle('pitch_center_circle', 9.15 * scale);
  addCircle('pitch_center_spot', lineW * 1.8);

  const penaltyD = 16.5 * scale;
  const penaltyW = 40.3 * scale;
  const boxD = 5.5 * scale;
  const boxW = 18.32 * scale;
  [-1, 1].forEach((side) => {
    const penX = side * (halfL - penaltyD / 2);
    const boxX = side * (halfL - boxD / 2);
    addLine(`pitch_penalty_back_${side}`, side * (halfL - penaltyD), 0, lineW, penaltyW);
    addLine(`pitch_penalty_top_${side}`, penX, -penaltyW / 2, penaltyD, lineW);
    addLine(`pitch_penalty_bottom_${side}`, penX, penaltyW / 2, penaltyD, lineW);
    addLine(`pitch_goalbox_back_${side}`, side * (halfL - boxD), 0, lineW, boxW);
    addLine(`pitch_goalbox_top_${side}`, boxX, -boxW / 2, boxD, lineW);
    addLine(`pitch_goalbox_bottom_${side}`, boxX, boxW / 2, boxD, lineW);
    addCircle(`pitch_penalty_spot_${side}`, lineW * 1.4, side * (halfL - 11 * scale), 0);
    addCircle(
      `pitch_penalty_arc_${side}`,
      9.15 * scale,
      side * (halfL - 11 * scale),
      0,
      side > 0 ? Math.PI * 0.72 : -Math.PI * 0.28,
      side > 0 ? Math.PI * 1.28 : Math.PI * 0.28,
    );
    addGoal(`football_goal_${side > 0 ? 'east' : 'west'}`, side);
  });

  const cornerR = 1.6 * scale;
  addCircle('pitch_corner_ne', cornerR, halfL, -halfW, Math.PI * 0.5, Math.PI);
  addCircle('pitch_corner_se', cornerR, halfL, halfW, Math.PI, Math.PI * 1.5);
  addCircle('pitch_corner_sw', cornerR, -halfL, halfW, Math.PI * 1.5, Math.PI * 2);
  addCircle('pitch_corner_nw', cornerR, -halfL, -halfW, 0, Math.PI * 0.5);

  group.add(g);
}

function createBuildingBody(group) {
  const g = new THREE.Group();
  g.name = 'building';

  const baseE = facadeEllipseAtY(0.3 * YS);
  const base = new THREE.Mesh(buildFacadeRing(0.3 * YS, 3.4 * YS, baseE.rx, baseE.rz), MAT.dark);
  base.name = 'building_base';
  g.add(base);

  group.add(g);
}

function createGlassCurtainWall(group) {
  const g = new THREE.Group();
  g.name = 'glass_curtain';

  const glassGeos = [];
  const frameGeos = [];
  const spandrelGeos = [];

  GLASS_BANDS.forEach(({ y0, y1 }, idx) => {
    const e0 = facadeEllipseAtY(y0);
    const e1 = facadeEllipseAtY(y1);
    glassGeos.push(buildTaperedFacadeRing(y0, y1, e0.rx, e0.rz, e1.rx, e1.rz, MULLION_SEGS));
    frameGeos.push(buildVerticalMullions(y0, y1, e0.rx, e0.rz, e1.rx, e1.rz));
    frameGeos.push(buildHorizontalMullionRing(y0, e0.rx, e0.rz));
    frameGeos.push(buildHorizontalMullionRing(y1, e1.rx, e1.rz));
    if (idx === GLASS_BANDS.length - 1) {
      const midY = (y0 + y1) * 0.5;
      const em = facadeEllipseAtY(midY);
      frameGeos.push(buildHorizontalMullionRing(midY, em.rx, em.rz, MULLION_SEGS, 0.18));
    }
  });

  SPANDREL_BANDS.forEach(({ y0, y1 }) => {
    const e0 = facadeEllipseAtY(y0);
    const e1 = facadeEllipseAtY(y1);
    spandrelGeos.push(buildTaperedFacadeRing(y0, y1, e0.rx, e0.rz, e1.rx, e1.rz, 72));
  });

  g.add(new THREE.Mesh(mergeGeometries(glassGeos, false), MAT.glass));
  g.children[g.children.length - 1].name = 'facade_glass';

  g.add(new THREE.Mesh(mergeGeometries(frameGeos, false), MAT.frame));
  g.children[g.children.length - 1].name = 'facade_mullions';

  g.add(new THREE.Mesh(mergeGeometries(spandrelGeos, false), MAT.ptfe));
  g.children[g.children.length - 1].name = 'facade_spandrels';

  const eCollar = facadeEllipseAtY(COLLAR_Y0);
  const topFrame = new THREE.Mesh(
    buildHorizontalMullionRing(COLLAR_Y0, eCollar.rx, eCollar.rz, MULLION_SEGS, 0.28 * YS),
    MAT.frame,
  );
  topFrame.name = 'facade_top_frame';
  g.add(topFrame);

  group.add(g);
}

function createWaveFacade(group) {
  const g = new THREE.Group();
  g.name = 'wave_facade';

  /** Dải vải trắng mỏng bám sát mặt tiền — không tạo khối tách rời mái */
  const ribbonGeos = [];
  const steps = 18;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const a = Math.PI * 0.32 + t * Math.PI * 0.36;
    const bandY = (22 - t * 8) * YS;
    const e = facadeEllipseAtY(bandY);
    const p = surfacePoint(a, bandY, e.rx, e.rz, 0.35);
    const w = 4.5 + t * 5;
    const h = 1.1 - t * 0.35;
    const geo = new THREE.BoxGeometry(w, Math.max(h, 0.55), 0.85);
    geo.translate(p.x, bandY + h / 2, p.z);
    geo.rotateY(-a);
    ribbonGeos.push(geo);
  }
  const wave = new THREE.Mesh(mergeGeometries(ribbonGeos, false), MAT.ptfe);
  wave.name = 'wave_ribbon_south';
  g.add(wave);

  group.add(g);
}

function createFacade(group) {
  const g = new THREE.Group();
  g.name = 'facade';

  const signE = facadeEllipseAtY(11 * YS);
  const signP = surfacePoint(0, 11 * YS, signE.rx, signE.rz, 0.55);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(54 * STADIUM_SCALE, 12 * YS), MAT.sign);
  sign.position.copy(signP);
  sign.rotation.y = Math.PI;
  sign.name = 'facade_sign';
  g.add(sign);

  const ledE = facadeEllipseAtY(19 * YS);
  const ledP = surfacePoint(Math.PI / 2, 19 * YS, ledE.rx, ledE.rz, 0.55);
  const led = new THREE.Mesh(new THREE.PlaneGeometry(28, 10), MAT.led);
  led.position.copy(ledP);
  led.rotation.y = -Math.PI / 2;
  led.name = 'led_screen';
  g.add(led);

  group.add(g);
}

function createRoof(group) {
  const g = new THREE.Group();
  g.name = 'roof';

  const dome = new THREE.Mesh(buildDomeShellGeometry(), MAT.ptfe);
  dome.name = 'roof_dome';
  g.add(dome);

  const openingTrim = new THREE.Mesh(buildRectOpeningTrimGeometry(), MAT.ptfe);
  openingTrim.name = 'roof_rect_opening_trim';
  g.add(openingTrim);

  const e0 = facadeEllipseAtY(COLLAR_Y0);
  const collar = new THREE.Mesh(
    buildTaperedFacadeRing(COLLAR_Y0, ROOF_COLLAR_TOP, e0.rx, e0.rz, DOME.rimRx, DOME.rimRz, 80),
    MAT.ptfe,
  );
  collar.name = 'roof_collar';
  g.add(collar);

  /** Vành khung đen liền mái — nối kính với đế vòm */
  const rimFrame = new THREE.Mesh(
    buildTaperedFacadeRing(DOME.rimY - 0.06 * YS, DOME.rimY + 0.14 * YS, DOME.rimRx, DOME.rimRz, DOME.rimRx, DOME.rimRz, 80),
    MAT.frame,
  );
  rimFrame.name = 'roof_rim_frame';
  g.add(rimFrame);

  const cap = new THREE.Group();
  cap.name = 'roof_closed_cap';
  cap.visible = false;
  g.add(cap);

  group.add(g);
}

function panelDomeYAt(x, z) {
  return Math.max(domeYAt(x, z), DOME.rimY + 0.65 * YS);
}

function buildRoofPanelGeometry(width, depth, thickness, centerX, anchorY) {
  const xSegs = 38;
  const zSegs = 34;
  const positions = [];
  const indices = [];
  const gridVerts = (xSegs + 1) * (zSegs + 1);
  const bottomClearance = 0.55 * YS;
  const edgeDown = 0.35 * YS;

  const panelY = (x, z, layer) => {
    const xNorm = Math.abs(x) / (width * 0.5);
    const zNorm = Math.abs(z) / (depth * 0.5);
    const globalX = centerX + x;
    const crown = (1 - Math.min(1, xNorm ** 1.7)) * 1.05 * YS
      + (1 - Math.min(1, zNorm ** 1.9)) * 0.45 * YS;
    const edgeSeat = Math.max(xNorm, zNorm) ** 2.4 * edgeDown;
    return panelDomeYAt(globalX, z) + bottomClearance + crown - edgeSeat + layer * thickness - anchorY;
  };

  for (let layer = 0; layer <= 1; layer++) {
    for (let zi = 0; zi <= zSegs; zi++) {
      const z = -depth * 0.5 + (zi / zSegs) * depth;
      for (let xi = 0; xi <= xSegs; xi++) {
        const x = -width * 0.5 + (xi / xSegs) * width;
        positions.push(x, panelY(x, z, layer), z);
      }
    }
  }

  const v = (layer, xi, zi) => layer * gridVerts + zi * (xSegs + 1) + xi;
  const addBoundaryVertex = (layer, xi, zi) => {
    const idx = v(layer, xi, zi) * 3;
    positions.push(positions[idx], positions[idx + 1], positions[idx + 2]);
    return positions.length / 3 - 1;
  };
  const addSideQuad = (a, b, c, d) => {
    const i0 = addBoundaryVertex(...a);
    const i1 = addBoundaryVertex(...b);
    const i2 = addBoundaryVertex(...c);
    const i3 = addBoundaryVertex(...d);
    indices.push(i0, i1, i2, i0, i2, i3);
  };

  for (let zi = 0; zi < zSegs; zi++) {
    for (let xi = 0; xi < xSegs; xi++) {
      indices.push(v(1, xi, zi), v(1, xi + 1, zi), v(1, xi + 1, zi + 1), v(1, xi, zi), v(1, xi + 1, zi + 1), v(1, xi, zi + 1));
      indices.push(v(0, xi, zi), v(0, xi + 1, zi + 1), v(0, xi + 1, zi), v(0, xi, zi), v(0, xi, zi + 1), v(0, xi + 1, zi + 1));
    }
  }

  for (let xi = 0; xi < xSegs; xi++) {
    addSideQuad([0, xi, 0], [0, xi + 1, 0], [1, xi + 1, 0], [1, xi, 0]);
    addSideQuad([0, xi, zSegs], [1, xi, zSegs], [1, xi + 1, zSegs], [0, xi + 1, zSegs]);
  }

  for (let zi = 0; zi < zSegs; zi++) {
    addSideQuad([0, 0, zi], [1, 0, zi], [1, 0, zi + 1], [0, 0, zi + 1]);
    addSideQuad([0, xSegs, zi], [0, xSegs, zi + 1], [1, xSegs, zi + 1], [1, xSegs, zi]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createRoofOpen(group) {
  const g = new THREE.Group();
  g.name = 'roof_open';

  const panelGeoL = buildRoofPanelGeometry(DOME.panelWidth, DOME.panelDepth, DOME.panelThickness, -DOME.panelOpenX, DOME.panelOpenY);
  const panelL = new THREE.Mesh(panelGeoL, MAT.ptfePanel);
  panelL.position.set(-DOME.panelOpenX, DOME.panelOpenY, 0);
  panelL.rotation.z = 0;
  panelL.name = 'roof_panel_west';
  g.add(panelL);

  const panelGeoR = buildRoofPanelGeometry(DOME.panelWidth, DOME.panelDepth, DOME.panelThickness, DOME.panelOpenX, DOME.panelOpenY);
  const panelR = new THREE.Mesh(panelGeoR, MAT.ptfePanel);
  panelR.position.set(DOME.panelOpenX, DOME.panelOpenY, 0);
  panelR.rotation.z = 0;
  panelR.name = 'roof_panel_east';
  g.add(panelR);

  const trussGeos = [];
  for (let z = -DOME.panelDepth * 0.46; z <= DOME.panelDepth * 0.46; z += 6) {
    const geo = new THREE.BoxGeometry(DOME.holeHalfX * 2.16, 1.1, 0.75);
    geo.translate(0, DOME.trussY, z);
    trussGeos.push(geo);
  }
  for (let x = -DOME.holeHalfX * 0.96; x <= DOME.holeHalfX * 0.96; x += 8) {
    const geo = new THREE.BoxGeometry(0.75, 1.1, DOME.panelDepth * 0.94);
    geo.translate(x, DOME.trussY, 0);
    trussGeos.push(geo);
  }
  for (let i = -4; i <= 4; i++) {
    const geo = new THREE.BoxGeometry(0.55, 1.1, DOME.panelDepth * 1.02);
    geo.rotateY(0.18 * i);
    geo.translate(i * 8, DOME.trussY, 0);
    trussGeos.push(geo);
  }
  const truss = new THREE.Mesh(mergeGeometries(trussGeos, false), MAT.steel);
  truss.name = 'roof_truss';
  g.add(truss);

  group.add(g);
}

function createPalm(parent, x, z, scale = 1) {
  const g = new THREE.Group();
  g.name = 'palm';
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.45 * scale, 7 * scale, 6), MAT.trunk);
  trunk.position.set(x, 3.5 * scale, z);
  g.add(trunk);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.BoxGeometry(0.15 * scale, 0.08 * scale, 4.5 * scale), MAT.palm);
    frond.position.set(x + Math.sin(a) * 0.3, 7 * scale, z + Math.cos(a) * 0.3);
    frond.rotation.set(-0.6, a, 0);
    g.add(frond);
  }
  parent.add(g);
}

function createCar(parent, x, z, rot = 0) {
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.4, 2), MAT.car);
  body.position.set(x, 0.75, z);
  body.rotation.y = rot;
  body.name = 'car';
  parent.add(body);
}

function createLandscape(group) {
  const g = new THREE.Group();
  g.name = 'landscape';

  const facadeR = Math.max(FACADE.rx, FACADE.rz);
  const plazaInner = TRACK_OUTER + 10;
  const plazaOuter = facadeR + 42;
  const plaza = new THREE.Mesh(new THREE.RingGeometry(plazaInner, plazaOuter, 64), MAT.plaza);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.012;
  plaza.name = 'plaza_main';
  g.add(plaza);

  const lawnGeos = [];
  const lawnBase = facadeR + OUTER_PAD;
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2;
    const a1 = ((i + 1) / 8) * Math.PI * 2;
    for (let s = 0; s < 12; s++) {
      const u0 = s / 12;
      const u1 = (s + 1) / 12;
      const ang0 = a0 + u0 * (a1 - a0);
      const ang1 = a0 + u1 * (a1 - a0);
      const r0 = lawnBase + Math.sin(ang0 * 3) * 8;
      const r1 = lawnBase + Math.sin(ang1 * 3) * 8;
      const p = (ang, r) => new THREE.Vector3(Math.sin(ang) * r, 0.04, Math.cos(ang) * r);
      const v = [p(ang0, r0), p(ang1, r0), p(ang1, r1), p(ang0, r1)];
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(12);
      v.forEach((vec, j) => { pos[j * 3] = vec.x; pos[j * 3 + 1] = vec.y; pos[j * 3 + 2] = vec.z; });
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      geo.computeVertexNormals();
      lawnGeos.push(geo);
    }
  }
  const lawns = new THREE.Mesh(mergeGeometries(lawnGeos, false), MAT.lawn);
  lawns.name = 'landscape_lawns';
  g.add(lawns);

  const roadIn = facadeR + OUTER_PAD + 48;
  const roadOut = facadeR + OUTER_PAD + 68;
  const roadGeos = [];
  for (let i = 0; i < 64; i++) {
    const a0 = (i / 64) * Math.PI * 2;
    const a1 = ((i + 1) / 64) * Math.PI * 2;
    const p = (a, r) => new THREE.Vector3(Math.sin(a) * r, 0.025, Math.cos(a) * r);
    const v = [p(a0, roadIn), p(a1, roadIn), p(a1, roadOut), p(a0, roadOut)];
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(12);
    v.forEach((vec, j) => { pos[j * 3] = vec.x; pos[j * 3 + 1] = vec.y; pos[j * 3 + 2] = vec.z; });
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    roadGeos.push(geo);
  }
  const road = new THREE.Mesh(mergeGeometries(roadGeos, false), MAT.asphalt);
  road.name = 'landscape_road';
  g.add(road);

  const parkDist = facadeR + OUTER_PAD + 115;
  const palmSpots = [
    [1, 0.25], [1, -0.2], [-1, 0.28], [-1, -0.22], [0.72, 0.82], [-0.75, 0.78],
    [0.7, -0.85], [-0.72, -0.8], [1.12, 0], [-1.1, 0.05],
  ].map(([ux, uz]) => [ux * parkDist, uz * parkDist]);
  palmSpots.forEach(([x, z], i) => createPalm(g, x, z, 0.85 + (i % 4) * 0.08));

  [[0.92, 0.35, 0.3], [0.95, -0.38, -0.2], [-0.9, 0.4, 2.5], [0.88, -0.45, 1.1]]
    .map(([ux, uz, r]) => [ux * parkDist, uz * parkDist, r])
    .forEach(([x, z, r]) => createCar(g, x, z, r));

  group.add(g);
}

/** Bãi đỗ: xoay theo hướng tâm sân, mép trong nằm ngoài quảng trường gạch (plaza) */
function createParking(group) {
  const g = new THREE.Group();
  g.name = 'parking';
  const facadeR = Math.max(FACADE.rx, FACADE.rz);
  const plazaOuter = facadeR + 42;
  const lotW = 78 * SIZE_MULT;
  const lotD = 58 * SIZE_MULT;
  const plazaGap = 14 * STADIUM_SCALE;
  const parkRadius = plazaOuter + lotW / 2 + plazaGap;

  const lotAngles = [
    (5 * Math.PI) / 4,
    (7 * Math.PI) / 4,
    (3 * Math.PI) / 4,
    Math.PI / 4,
  ];

  const geos = lotAngles.map((angle) => {
    const cx = Math.sin(angle) * parkRadius;
    const cz = Math.cos(angle) * parkRadius;
    const geo = new THREE.PlaneGeometry(lotW, lotD);
    geo.rotateX(-Math.PI / 2);
    geo.rotateY(-angle + Math.PI / 2);
    geo.translate(cx, 0.025, cz);
    return geo;
  });

  g.add(new THREE.Mesh(mergeGeometries(geos, false), MAT.asphalt));
  group.add(g);
}

function countTris(object) {
  let tris = 0;
  let meshes = 0;
  object.traverse((o) => {
    if (o.isMesh && o.geometry) {
      meshes++;
      const idx = o.geometry.index;
      tris += idx ? idx.count / 3 : o.geometry.attributes.position.count / 3;
    }
  });
  return { tris: Math.floor(tris), meshes };
}

async function exportGlb(scene) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(Buffer.from(result));
        else reject(new Error('Expected binary GLB'));
      },
      reject,
      { binary: true, embedImages: true, onlyVisible: true },
    );
  });
}

async function main() {
  const scene = new THREE.Scene();
  scene.name = 'PVF_Stadium';

  createLandscape(scene);
  createParking(scene);
  createPitch(scene);
  createStands(scene);
  createFloodlights(scene);
  createBuildingBody(scene);
  createGlassCurtainWall(scene);
  createWaveFacade(scene);
  createFacade(scene);
  createRoof(scene);
  createRoofOpen(scene);

  const { tris, meshes } = countTris(scene);
  console.log(`Meshes: ${meshes} · Triangles: ~${tris.toLocaleString()}`);
  console.log(`STADIUM_SCALE=${STADIUM_SCALE.toFixed(3)} (×${SIZE_MULT}) · FACADE R≈${FACADE.rx.toFixed(0)}`);
  console.log(`DOME panelY=${DOME.panelY.toFixed(1)} trussY=${DOME.trussY.toFixed(1)} rimY=${DOME.rimY}`);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const buffer = await exportGlb(scene);
  fs.writeFileSync(OUT, buffer);
  console.log(`Written ${OUT} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
