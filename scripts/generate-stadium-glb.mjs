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
const OUT = path.join(__dirname, '..', 'stadium-ioc', 'assets', 'models', 'pvf-stadium.glb');

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
const BASE_FACADE = { rx: 104, rz: 84 };

const STADIUM_SCALE = Math.max(
  (PITCH_HALF_L + SEAT_AISLE + SEAT_DEPTH + 5) / BASE_BOWL.innerRx,
  1.32,
);

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

/** Dome: full ellipsoid cap, 360° — chỉ hở lỗ chữ nhật ở đỉnh (mái trượt) */
export const DOME = {
  R: 100 * STADIUM_SCALE,
  sx: 1.08,
  sy: 0.48,
  sz: 0.94,
  phiLen: Math.PI * 0.405,
  rimY: 30,
  holeHalfX: 18 * STADIUM_SCALE,
  holeHalfZ: 26 * STADIUM_SCALE,
  openPhiMax: Math.PI * 0.405 * 0.32,
  panelRestX: 17 * STADIUM_SCALE,
  panelSlide: 32 * STADIUM_SCALE,
};
DOME.cy = DOME.rimY - DOME.R * DOME.sy * Math.cos(DOME.phiLen);
DOME.panelY = DOME.cy + DOME.R * DOME.sy * Math.cos(0.06 * Math.PI);
DOME.trussY = DOME.cy + DOME.R * DOME.sy * Math.cos(0.17 * Math.PI);
DOME.rimRx = DOME.R * DOME.sx * Math.sin(DOME.phiLen);
DOME.rimRz = DOME.R * DOME.sz * Math.sin(DOME.phiLen);

const GLASS_BANDS = [
  { y0: 3.6, y1: 9.0 },
  { y0: 9.8, y1: 14.8 },
  { y0: 15.6, y1: 20.6 },
  { y0: 21.4, y1: 27.0 },
];
const SPANDREL_BANDS = [
  { y0: 9.0, y1: 9.8 },
  { y0: 14.8, y1: 15.6 },
  { y0: 20.6, y1: 21.4 },
  { y0: 27.0, y1: 29.75 },
];
const COLLAR_Y0 = 29.75;
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

function inDomeOpening(phi, x, z) {
  return phi < DOME.openPhiMax && Math.abs(x) < DOME.holeHalfX && Math.abs(z) < DOME.holeHalfZ;
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
  crowd: new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.82,
    metalness: 0.02,
  }),
  ribbon: new THREE.MeshStandardMaterial({
    color: 0x1a4fa8,
    emissive: 0x2266cc,
    emissiveIntensity: 0.45,
    roughness: 0.35,
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
  const rx = BOWL.innerRx + BOWL_INNER_PAD + f * (BOWL.outerRx - BOWL.innerRx - BOWL_INNER_PAD) + (f > 0.55 ? (f - 0.55) * 10 * STADIUM_SCALE : 0);
  const rz = BOWL.innerRz + BOWL_INNER_PAD + f * (BOWL.outerRz - BOWL.innerRz - BOWL_INNER_PAD) + (f > 0.55 ? (f - 0.55) * 7 * STADIUM_SCALE : 0);
  const y = 1.5 + Math.pow(f, 0.88) * 24 + Math.pow(Math.max(0, f - 0.5), 2) * 8;
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

/** Người ngồi đơn giản — thân + đầu, vertex color */
function buildCrowdLayer(a0, a1, tiers = 12) {
  const positions = [];
  const colors = [];
  const seatH = 0.55;

  for (let t = 0; t < tiers; t++) {
    const f0 = (t + 1.0) / tiers;
    const f1 = (t + 1.65) / tiers;
    const r0 = tierAt(Math.min(f0, 0.98));
    const r1 = tierAt(Math.min(f1, 1));
    const ySit = r1.y + seatH + 0.08;
    const midR = (ellipseR(a0, r1.rx, r1.rz) + ellipseR(a1, r1.rx, r1.rz)) * 0.5;
    const seatsAlong = Math.max(4, Math.min(18, Math.floor((Math.abs(a1 - a0) * midR) / 0.78)));

    for (let si = 0; si < seatsAlong; si++) {
      const ang = a0 + ((si + 0.5) / seatsAlong) * (a1 - a0);
      for (let row = 0; row < 2; row++) {
        const u = 0.22 + row * 0.52;
        const rx = r0.rx + u * (r1.rx - r0.rx);
        const rz = r0.rz + u * (r1.rz - r0.rz);
        const cr = crAt(ang, rx, rz);
        const pt = surfacePoint(ang, ySit, cr.rx, cr.rz, 0);
        const shirt = CROWD_SHIRTS[(t * 5 + si + row * 3) % CROWD_SHIRTS.length];
        pushColoredBox(positions, colors, 0.46, 0.48, 0.36, pt.x, ySit + 0.24, pt.z, -ang, shirt);
        pushColoredBox(positions, colors, 0.22, 0.22, 0.2, pt.x, ySit + 0.58, pt.z, -ang, SKIN);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Khán đài liền khối — mặt bậc + vách kín, không nhìn xuyên thấu */
function buildSolidBowlSector(a0, a1, tiers = 12, arcSeg = 28) {
  const treadGeos = [];
  const riserGeos = [];
  const innerGeos = [];
  const ribbonGeos = [];
  const seatH = 0.55;

  for (let t = 0; t < tiers; t++) {
    const f0 = (t + 1.0) / tiers;
    const f1 = (t + 1.65) / tiers;
    const r0 = tierAt(Math.min(f0, 0.98));
    const r1 = tierAt(Math.min(f1, 1));

    for (let s = 0; s < arcSeg; s++) {
      const u0 = s / arcSeg;
      const u1 = (s + 1) / arcSeg;
      const ang0 = a0 + u0 * (a1 - a0);
      const ang1 = a0 + u1 * (a1 - a0);

      const c00 = crAt(ang0, r0.rx, r0.rz);
      const c01 = crAt(ang1, r0.rx, r0.rz);
      const c10 = crAt(ang0, r1.rx, r1.rz);
      const c11 = crAt(ang1, r1.rx, r1.rz);
      const yTop = r1.y + seatH;

      treadGeos.push(quadGeo([
        surfacePoint(ang0, yTop, c00.rx, c00.rz),
        surfacePoint(ang1, yTop, c01.rx, c01.rz),
        surfacePoint(ang1, yTop, c11.rx, c11.rz),
        surfacePoint(ang0, yTop, c10.rx, c10.rz),
      ]));

      ribbonGeos.push(quadGeo([
        surfacePoint(ang0, yTop + 0.1, c00.rx, c00.rz, -0.12),
        surfacePoint(ang1, yTop + 0.1, c01.rx, c01.rz, -0.12),
        surfacePoint(ang1, yTop + 0.38, c01.rx, c01.rz, -0.12),
        surfacePoint(ang0, yTop + 0.38, c00.rx, c00.rz, -0.12),
      ]));

      riserGeos.push(quadGeo([
        surfacePoint(ang0, r0.y, c00.rx, c00.rz),
        surfacePoint(ang1, r0.y, c01.rx, c01.rz),
        surfacePoint(ang1, yTop, c01.rx, c01.rz),
        surfacePoint(ang0, yTop, c00.rx, c00.rz),
      ]));

      if (t === 0) {
        innerGeos.push(quadGeo([
          surfacePoint(ang0, 0.2, c00.rx, c00.rz),
          surfacePoint(ang1, 0.2, c01.rx, c01.rz),
          surfacePoint(ang1, yTop, c01.rx, c01.rz),
          surfacePoint(ang0, yTop, c00.rx, c00.rz),
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
  const gap = 0.05;
  const sectors = [
    ['stand_north', -Math.PI * 0.78 + gap, -Math.PI * 0.22 - gap],
    ['stand_south', Math.PI * 0.22 + gap, Math.PI * 0.78 - gap],
    ['stand_east', -Math.PI * 0.22 + gap, Math.PI * 0.22 - gap],
    ['stand_west', Math.PI * 0.78 + gap, Math.PI * 1.22 - gap],
  ];
  sectors.forEach(([name, a0, a1]) => {
    const g = new THREE.Group();
    g.name = name;
    const bowl = buildSolidBowlSector(a0, a1);
    const treads = new THREE.Mesh(bowl.treads, MAT.seatDeck);
    treads.name = `${name}_seats`;
    g.add(treads);
    const risers = new THREE.Mesh(bowl.risers, MAT.concrete);
    risers.name = `${name}_risers`;
    g.add(risers);
    const inner = new THREE.Mesh(bowl.innerWall, MAT.bowlInner);
    inner.name = `${name}_inner_wall`;
    g.add(inner);
    const ribbons = new THREE.Mesh(bowl.ribbons, MAT.ribbon);
    ribbons.name = `${name}_ribbon`;
    g.add(ribbons);
    const crowd = new THREE.Mesh(buildCrowdLayer(a0, a1), MAT.crowd);
    crowd.name = `${name}_crowd`;
    g.add(crowd);
    group.add(g);
  });
}

function createPitch(group) {
  const g = new THREE.Group();
  g.name = 'pitch';

  const track = new THREE.Mesh(new THREE.RingGeometry(56, 59.5, 48), MAT.concrete);
  track.rotation.x = -Math.PI / 2;
  track.position.y = 0.05;
  track.name = 'pitch_track';
  g.add(track);

  const tech = new THREE.Mesh(new THREE.PlaneGeometry(PITCH_L + 6, PITCH_W + 6), MAT.dark);
  tech.rotation.x = -Math.PI / 2;
  tech.position.y = 0.04;
  tech.name = 'pitch_tech_area';
  g.add(tech);

  const surf = new THREE.Mesh(new THREE.PlaneGeometry(PITCH_L, PITCH_W, 32, 20), MAT.grass);
  surf.rotation.x = -Math.PI / 2;
  surf.position.y = 0.08;
  surf.name = 'pitch_surface';
  g.add(surf);

  const lw = 0.11;
  const pitchLine = (w, d, x, z) => {
    const geo = new THREE.PlaneGeometry(w, d);
    geo.rotateX(-Math.PI / 2);
    geo.translate(x, 0.09, z);
    return geo;
  };
  const lineGeos = [
    pitchLine(PITCH_L, lw, 0, 0),
    pitchLine(lw, PITCH_W, -PITCH_L / 2, 0),
    pitchLine(lw, PITCH_W, PITCH_L / 2, 0),
    pitchLine(40.32, lw, -PITCH_L / 2 + 16.5, 0),
    pitchLine(40.32, lw, PITCH_L / 2 - 16.5, 0),
    pitchLine(18.32, lw, -PITCH_L / 2 + 5.5, 0),
    pitchLine(18.32, lw, PITCH_L / 2 - 5.5, 0),
  ];
  g.add(new THREE.Mesh(mergeGeometries(lineGeos, false), MAT.line));

  const circle = new THREE.Mesh(new THREE.RingGeometry(9.15, 9.15 + lw, 40), MAT.line);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.09;
  g.add(circle);

  group.add(g);
}

function createBuildingBody(group) {
  const g = new THREE.Group();
  g.name = 'building';

  const baseE = facadeEllipseAtY(0.3);
  const base = new THREE.Mesh(buildFacadeRing(0.3, 3.4, baseE.rx, baseE.rz), MAT.dark);
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

  group.add(g);
}

function createWaveFacade(group) {
  const g = new THREE.Group();
  g.name = 'wave_facade';

  const geos = [];
  const steps = 28;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const a = Math.PI * 0.28 + t * Math.PI * 0.44;
    const r = ellipseR(a, FACADE.rx + 2 - t * 6, FACADE.rz + 1 - t * 4);
    const y = 26 - t * 24;
    const w = 7 + t * 16;
    const h = 3.8 - t * 1.5;
    const d = 2 + t * 3.5;
    const geo = new THREE.BoxGeometry(w, Math.max(h, 0.8), d);
    geo.translate(Math.sin(a) * (r + t * 4), y + h / 2, Math.cos(a) * r);
    geo.rotateY(-a);
    geos.push(geo);
  }
  const wave = new THREE.Mesh(mergeGeometries(geos, false), MAT.ptfe);
  wave.name = 'wave_ramp';
  g.add(wave);

  const ribbonGeos = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    if (a > Math.PI * 0.22 && a < Math.PI * 0.78) continue;
    const e = facadeEllipseAtY(22);
    const p = surfacePoint(a, 22, e.rx - 0.8, e.rz - 0.8, 0);
    const waveH = 3.5 + Math.sin(a * 5) * 2;
    const geo = new THREE.BoxGeometry(10, waveH, 1.2);
    geo.translate(p.x, 22 + Math.sin(a * 3) * 1.2, p.z);
    geo.rotateY(-a);
    ribbonGeos.push(geo);
  }
  if (ribbonGeos.length) {
    const ribbon = new THREE.Mesh(mergeGeometries(ribbonGeos, false), MAT.ptfe);
    ribbon.name = 'wave_ribbon';
    g.add(ribbon);
  }

  group.add(g);
}

function createFacade(group) {
  const g = new THREE.Group();
  g.name = 'facade';

  const signE = facadeEllipseAtY(11);
  const signP = surfacePoint(0, 11, signE.rx, signE.rz, 0.55);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(54, 12), MAT.sign);
  sign.position.copy(signP);
  sign.rotation.y = Math.PI;
  sign.name = 'facade_sign';
  g.add(sign);

  const ledE = facadeEllipseAtY(19);
  const ledP = surfacePoint(Math.PI / 2, 19, ledE.rx, ledE.rz, 0.55);
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

  const e0 = facadeEllipseAtY(COLLAR_Y0);
  const collar = new THREE.Mesh(
    buildTaperedFacadeRing(COLLAR_Y0, DOME.rimY + 0.04, e0.rx, e0.rz, DOME.rimRx, DOME.rimRz, 80),
    MAT.ptfe,
  );
  collar.name = 'roof_collar';
  g.add(collar);

  group.add(g);
}

function createRoofOpen(group) {
  const g = new THREE.Group();
  g.name = 'roof_open';

  const panelGeo = new THREE.BoxGeometry(34, 0.85, 52);
  const panelL = new THREE.Mesh(panelGeo, MAT.ptfe);
  panelL.position.set(-DOME.panelRestX, DOME.panelY, 0);
  panelL.name = 'roof_panel_west';
  g.add(panelL);

  const panelR = new THREE.Mesh(panelGeo.clone(), MAT.ptfe);
  panelR.position.set(DOME.panelRestX, DOME.panelY, 0);
  panelR.name = 'roof_panel_east';
  g.add(panelR);

  const ridgeGeo = new THREE.BoxGeometry(1.1, 0.32, 52);
  const ridgeL = new THREE.Mesh(ridgeGeo, MAT.ptfe);
  ridgeL.position.set(-DOME.panelRestX - 17.2, DOME.panelY + 0.55, 0);
  ridgeL.name = 'roof_ridge_west';
  g.add(ridgeL);

  const ridgeR = new THREE.Mesh(ridgeGeo.clone(), MAT.ptfe);
  ridgeR.position.set(DOME.panelRestX + 17.2, DOME.panelY + 0.55, 0);
  ridgeR.name = 'roof_ridge_east';
  g.add(ridgeR);

  const trussGeos = [];
  for (let z = -24; z <= 24; z += 4.5) {
    const geo = new THREE.BoxGeometry(52, 1.2, 0.65);
    geo.translate(0, DOME.trussY, z);
    trussGeos.push(geo);
  }
  for (let x = -24; x <= 24; x += 5.5) {
    const geo = new THREE.BoxGeometry(0.65, 1.2, 48);
    geo.translate(x, DOME.trussY, 0);
    trussGeos.push(geo);
  }
  for (let i = -3; i <= 3; i++) {
    const geo = new THREE.BoxGeometry(0.55, 1.2, 52);
    geo.rotateY(0.35 * i);
    geo.translate(i * 4, DOME.trussY, 0);
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

  const plazaInner = TRACK_OUTER + 8;
  const plazaOuter = FACADE.rx + 34;
  const plaza = new THREE.Mesh(new THREE.RingGeometry(plazaInner, plazaOuter, 64), MAT.plaza);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.012;
  plaza.name = 'plaza_main';
  g.add(plaza);

  const lawnGeos = [];
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2;
    const a1 = ((i + 1) / 8) * Math.PI * 2;
    for (let s = 0; s < 12; s++) {
      const u0 = s / 12;
      const u1 = (s + 1) / 12;
      const ang0 = a0 + u0 * (a1 - a0);
      const ang1 = a0 + u1 * (a1 - a0);
      const r0 = 118 * STADIUM_SCALE + Math.sin(ang0 * 3) * 6 * STADIUM_SCALE;
      const r1 = 118 * STADIUM_SCALE + Math.sin(ang1 * 3) * 6 * STADIUM_SCALE;
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

  const roadGeos = [];
  for (let i = 0; i < 64; i++) {
    const a0 = (i / 64) * Math.PI * 2;
    const a1 = ((i + 1) / 64) * Math.PI * 2;
    const p = (a, r) => {
      const rad = r;
      return new THREE.Vector3(Math.sin(a) * rad, 0.025, Math.cos(a) * rad);
    };
    const v = [p(a0, 148 * STADIUM_SCALE), p(a1, 148 * STADIUM_SCALE), p(a1, 162 * STADIUM_SCALE), p(a0, 162 * STADIUM_SCALE)];
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

  const palmSpots = [
    [155, 40], [165, -30], [-155, 50], [-160, -45], [120, 130], [-130, 120],
    [130, -120], [-125, -130], [175, 0], [-175, 10],
  ].map(([x, z]) => [x * STADIUM_SCALE, z * STADIUM_SCALE]);
  palmSpots.forEach(([x, z], i) => createPalm(g, x, z, 0.85 + (i % 4) * 0.08));

  [[155, 55, 0.3], [160, -55, -0.2], [-158, 60, 2.5], [150, -70, 1.1]]
    .map(([x, z, r]) => [x * STADIUM_SCALE, z * STADIUM_SCALE, r])
    .forEach(([x, z, r]) => createCar(g, x, z, r));

  group.add(g);
}

function createParking(group) {
  const g = new THREE.Group();
  g.name = 'parking';
  const lots = [[-175, -115, 70, 55], [175, -115, 70, 55], [-175, 115, 70, 55], [175, 115, 70, 55]];
  const geos = lots.map(([x, z, w, d]) => {
    const geo = new THREE.PlaneGeometry(w * STADIUM_SCALE, d * STADIUM_SCALE);
    geo.rotateX(-Math.PI / 2);
    geo.translate(x * STADIUM_SCALE, 0.02, z * STADIUM_SCALE);
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
  createBuildingBody(scene);
  createGlassCurtainWall(scene);
  createWaveFacade(scene);
  createFacade(scene);
  createRoof(scene);
  createRoofOpen(scene);

  const { tris, meshes } = countTris(scene);
  console.log(`Meshes: ${meshes} · Triangles: ~${tris.toLocaleString()}`);
  console.log(`STADIUM_SCALE=${STADIUM_SCALE.toFixed(3)} · BOWL inner=${BOWL.innerRx.toFixed(1)}×${BOWL.innerRz.toFixed(1)}`);
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
