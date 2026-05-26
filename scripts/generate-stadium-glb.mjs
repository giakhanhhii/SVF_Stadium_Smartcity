/**
 * PVF Stadium GLB — bowl seating (US mega-stadium style), PTFE dome, optimized meshes.
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

/** Dome sits on bowl rim — single spherical cap (PVF reference) */
const DOME = {
  R: 94,
  sx: 1.06,
  sy: 0.47,
  sz: 0.93,
  phiLen: Math.PI * 0.405,
  rimY: 35,
};
DOME.cy = DOME.rimY - DOME.R * DOME.sy * Math.cos(DOME.phiLen);
DOME.panelY = DOME.cy + DOME.R * DOME.sy * Math.cos(0.08 * Math.PI);
DOME.trussY = DOME.cy + DOME.R * DOME.sy * Math.cos(0.22 * Math.PI);

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
  ctx.fillStyle = '#1e2028';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PVF STADIUM', 512, 128);
  const data = ctx.getImageData(0, 0, 1024, 256).data;
  const tex = new THREE.DataTexture(data, 1024, 256);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const texGrass = makeDataTexture(TEX, (x, y, s) => {
  const stripe = Math.sin((y / s) * Math.PI * 40) > 0;
  return stripe ? [45, 138, 58] : [36, 122, 48];
});

const texSeat = makeDataTexture(TEX, (x, y, s) => {
  const row = Math.floor((y / s) * 48);
  const col = Math.floor((x / s) * 32);
  return (row + col) % 2 ? [26, 40, 72] : [18, 30, 58];
}, 6);

const texPtfe = makeDataTexture(TEX, (x, y) => {
  const n = Math.sin(x * 0.015) * 3 + Math.sin(y * 0.012) * 3;
  return [242 + n, 244 + n, 248 + n];
}, 2);

const texConcrete = makeDataTexture(TEX, (x, y) => {
  const n = Math.sin(x * 0.04) * Math.sin(y * 0.035) * 10;
  return [154 + n, 156 + n, 160 + n];
}, 3);

const texAsphalt = makeDataTexture(TEX, (x, y) => {
  if (y % 85 < 3) return [230, 230, 225];
  const n = Math.sin(x * 0.025) * 5;
  return [58 + n, 60 + n, 64 + n];
}, 2);

const texSign = makeSignTexture();

const texGlass = makeDataTexture(TEX, (x, y, s) => {
  const pane = Math.floor(x / (s / 16)) % 2;
  return pane ? [30, 45, 72] : [22, 32, 52];
}, 2);

const texVip = makeDataTexture(TEX, (x, y, s) => {
  return Math.floor(x / (s / 12)) % 2 ? [180, 145, 58] : [48, 44, 38];
}, 2);

const texDark = makeDataTexture(TEX, (x, y) => {
  const n = Math.sin(x * 0.02) * 4;
  return [32 + n, 34 + n, 38 + n];
}, 2);

const MAT = {
  grass: new THREE.MeshStandardMaterial({ map: texGrass, roughness: 0.88, metalness: 0 }),
  seat: new THREE.MeshStandardMaterial({ map: texSeat, roughness: 0.72, metalness: 0.04, color: 0x6688bb }),
  ptfe: new THREE.MeshStandardMaterial({ map: texPtfe, roughness: 0.38, metalness: 0.04, color: 0xf4f6fa }),
  dark: new THREE.MeshStandardMaterial({ map: texDark, roughness: 0.82, metalness: 0.08, color: 0x2a2e36 }),
  concrete: new THREE.MeshStandardMaterial({ map: texConcrete, roughness: 0.92, metalness: 0.02 }),
  asphalt: new THREE.MeshStandardMaterial({ map: texAsphalt, roughness: 0.96, metalness: 0.01 }),
  sign: new THREE.MeshStandardMaterial({ map: texSign, roughness: 0.55, metalness: 0.1 }),
  glass: new THREE.MeshStandardMaterial({ map: texGlass, roughness: 0.12, metalness: 0.55, transparent: true, opacity: 0.72 }),
  vip: new THREE.MeshStandardMaterial({ map: texVip, roughness: 0.35, metalness: 0.25 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xc8ccd4, roughness: 0.32, metalness: 0.78 }),
  line: new THREE.MeshBasicMaterial({ color: 0xffffff }),
};

function addMesh(parent, geo, mat, name) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  parent.add(m);
  return m;
}

/** Elliptical radius at angle a (radians) */
function ellipseR(a, rx, rz) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return (rx * rz) / Math.sqrt((rz * c) ** 2 + (rx * s) ** 2);
}

const BOWL = { innerRx: 54, innerRz: 36, outerRx: 92, outerRz: 72 };

function tierAt(f) {
  const rx = BOWL.innerRx + f * (BOWL.outerRx - BOWL.innerRx) + (f > 0.55 ? (f - 0.55) * 12 : 0);
  const rz = BOWL.innerRz + f * (BOWL.outerRz - BOWL.innerRz) + (f > 0.55 ? (f - 0.55) * 9 : 0);
  const y = 1.2 + Math.pow(f, 0.9) * 26 + Math.pow(Math.max(0, f - 0.5), 2) * 14;
  return { rx, rz, y };
}

/** Individual seat boxes arranged in elliptical rings — readable from inside the bowl */
function buildSeatSector(a0, a1, tiers = 18) {
  const geos = [];
  const seatW = 0.78;
  const seatH = 0.4;
  const seatD = 0.72;
  const pitch = 0.92;

  for (let t = 0; t < tiers; t++) {
    const f = (t + 0.55) / tiers;
    const { rx, rz, y } = tierAt(f);
    const rMid = (ellipseR(a0, rx, rz) + ellipseR(a1, rx, rz)) * 0.5;
    const count = Math.max(5, Math.round((Math.abs(a1 - a0) * rMid) / pitch));

    for (let i = 0; i < count; i++) {
      const ang = a0 + ((i + 0.5) / count) * (a1 - a0);
      const r = ellipseR(ang, rx, rz);
      const geo = new THREE.BoxGeometry(seatW, seatH, seatD);
      geo.rotateY(-ang);
      geo.translate(Math.sin(ang) * r, y + seatH / 2, Math.cos(ang) * r);
      geos.push(geo);
    }
  }
  return mergeGeometries(geos, false);
}

/** Concrete riser steps between seat rows */
function buildRiserSector(a0, a1, tiers = 18, arcSeg = 48) {
  const geos = [];
  for (let t = 0; t < tiers; t++) {
    const f0 = t / tiers;
    const f1 = (t + 1) / tiers;
    const r0 = tierAt(f0);
    const r1 = tierAt(f1);
    for (let s = 0; s < arcSeg; s++) {
      const u0 = s / arcSeg;
      const u1 = (s + 1) / arcSeg;
      const ang0 = a0 + u0 * (a1 - a0);
      const ang1 = a0 + u1 * (a1 - a0);
      const p = (ang, y, rx, rz) => {
        const rad = ellipseR(ang, rx, rz);
        return new THREE.Vector3(Math.sin(ang) * rad, y, Math.cos(ang) * rad);
      };
      const v = [
        p(ang0, r0.y, r0.rx, r0.rz), p(ang1, r0.y, r0.rx, r0.rz),
        p(ang1, r1.y, r1.rx, r1.rz), p(ang0, r1.y, r1.rx, r1.rz),
      ];
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(12);
      v.forEach((vec, i) => { pos[i * 3] = vec.x; pos[i * 3 + 1] = vec.y; pos[i * 3 + 2] = vec.z; });
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      geo.computeVertexNormals();
      geos.push(geo);
    }
  }
  return mergeGeometries(geos, false);
}

/** Vertical facade ring — dark base like PVF render */
function buildFacadeWall(y0, y1, rx, rz, segs = 72) {
  const geos = [];
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2;
    const p = (a, y) => {
      const r = ellipseR(a, rx, rz);
      return new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
    };
    const v = [p(a0, y0), p(a1, y0), p(a1, y1), p(a0, y1)];
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

function createStands(group) {
  const gap = 0.06;
  const sectors = [
    ['stand_north', -Math.PI * 0.78 + gap, -Math.PI * 0.22 - gap],
    ['stand_south', Math.PI * 0.22 + gap, Math.PI * 0.78 - gap],
    ['stand_east', -Math.PI * 0.22 + gap, Math.PI * 0.22 - gap],
    ['stand_west', Math.PI * 0.78 + gap, Math.PI * 1.22 - gap],
  ];
  sectors.forEach(([name, a0, a1]) => {
    const g = new THREE.Group();
    g.name = name;
    const risers = new THREE.Mesh(buildRiserSector(a0, a1), MAT.concrete);
    risers.name = `${name}_risers`;
    g.add(risers);
    const seats = new THREE.Mesh(buildSeatSector(a0, a1), MAT.seat);
    seats.name = `${name}_seats`;
    g.add(seats);
    group.add(g);
  });
}

function pitchLine(w, d, x, z, rotY = 0) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  if (rotY) g.rotateY(rotY);
  g.translate(x, 0.03, z);
  return g;
}

function createPitch(group) {
  const g = new THREE.Group();
  g.name = 'pitch';
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(PITCH_L, PITCH_W, 32, 20), MAT.grass);
  surf.rotation.x = -Math.PI / 2;
  surf.name = 'pitch_surface';
  g.add(surf);

  const lw = 0.11;
  const lineGeos = [
    pitchLine(PITCH_L, lw, 0, 0),
    pitchLine(lw, PITCH_W, -PITCH_L / 2, 0),
    pitchLine(lw, PITCH_W, PITCH_L / 2, 0),
    pitchLine(40.32, lw, -PITCH_L / 2 + 16.5, 0),
    pitchLine(40.32, lw, PITCH_L / 2 - 16.5, 0),
    pitchLine(18.32, lw, -PITCH_L / 2 + 5.5, 0),
    pitchLine(18.32, lw, PITCH_L / 2 - 5.5, 0),
  ];
  const lines = new THREE.Mesh(mergeGeometries(lineGeos, false), MAT.line);
  lines.name = 'pitch_lines';
  g.add(lines);

  const circle = new THREE.Mesh(new THREE.RingGeometry(9.15, 9.15 + lw, 40), MAT.line);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.03;
  circle.name = 'pitch_circle';
  g.add(circle);

  [-1, 1].forEach((s, i) => {
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.25, 16), MAT.line);
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(s * (PITCH_L / 2 - 11), 0.03, 0);
    spot.name = `pitch_penalty_${i}`;
    g.add(spot);
  });
  group.add(g);
}

function createFacade(group) {
  const g = new THREE.Group();
  g.name = 'facade';

  const wall = new THREE.Mesh(buildFacadeWall(0.4, 17, 106, 86), MAT.dark);
  wall.name = 'facade_wall';
  g.add(wall);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(52, 11), MAT.sign);
  sign.position.set(0, 9.5, ellipseR(Math.PI / 2, 106, 86) + 0.4);
  sign.rotation.y = Math.PI;
  sign.name = 'facade_sign';
  g.add(sign);

  const glass = new THREE.Mesh(buildFacadeWall(14, 17.5, 102, 82), MAT.glass);
  glass.name = 'facade_glass';
  g.add(glass);

  const ribbonGeos = [];
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2;
    const r = ellipseR(a, 104, 84);
    const waveH = 4 + Math.sin(a * 6) * 2.2;
    const geo = new THREE.BoxGeometry(11, waveH, 1.4);
    geo.translate(Math.sin(a) * r, 22 + Math.sin(a * 4) * 1.5, Math.cos(a) * r);
    geo.rotateY(-a);
    ribbonGeos.push(geo);
  }
  const ribbon = new THREE.Mesh(mergeGeometries(ribbonGeos, false), MAT.ptfe);
  ribbon.name = 'facade_ribbon';
  g.add(ribbon);

  const led = new THREE.Mesh(new THREE.BoxGeometry(24, 9, 0.5), new THREE.MeshStandardMaterial({
    color: 0xe24b4a, emissive: 0x991515, emissiveIntensity: 0.4, roughness: 0.35,
  }));
  led.position.set(ellipseR(0, 104, 84), 20, 0.5);
  led.name = 'led_screen';
  g.add(led);

  group.add(g);
}

function createRoof(group) {
  const g = new THREE.Group();
  g.name = 'roof';

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(DOME.R, 64, 32, 0, Math.PI * 2, 0, DOME.phiLen),
    MAT.ptfe,
  );
  dome.scale.set(DOME.sx, DOME.sy, DOME.sz);
  dome.position.y = DOME.cy;
  dome.name = 'roof_dome';
  g.add(dome);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(88, 1.4, 8, 72),
    MAT.ptfe,
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = DOME.rimY;
  rim.scale.set(1.05, 1, 0.9);
  rim.name = 'roof_rim';
  g.add(rim);

  group.add(g);
}

function createRoofOpen(group) {
  const g = new THREE.Group();
  g.name = 'roof_open';

  const panelGeo = new THREE.BoxGeometry(34, 0.9, 50);
  const panelL = new THREE.Mesh(panelGeo, MAT.ptfe);
  panelL.position.set(-17, DOME.panelY, 0);
  panelL.name = 'roof_panel_west';
  g.add(panelL);

  const panelR = new THREE.Mesh(panelGeo.clone(), MAT.ptfe);
  panelR.position.set(17, DOME.panelY, 0);
  panelR.name = 'roof_panel_east';
  g.add(panelR);

  const trussGeos = [];
  for (let z = -22; z <= 22; z += 5.5) {
    const geo = new THREE.BoxGeometry(50, 1.4, 0.8);
    geo.translate(0, DOME.trussY, z);
    trussGeos.push(geo);
  }
  for (let x = -22; x <= 22; x += 7) {
    const geo = new THREE.BoxGeometry(0.8, 1.4, 46);
    geo.translate(x, DOME.trussY, 0);
    trussGeos.push(geo);
  }
  const truss = new THREE.Mesh(mergeGeometries(trussGeos, false), MAT.steel);
  truss.name = 'roof_truss';
  g.add(truss);

  group.add(g);
}

function createVipZone(group) {
  const g = new THREE.Group();
  g.name = 'vip_zone';
  const suite = new THREE.Mesh(new THREE.BoxGeometry(32, 7, 14), MAT.vip);
  suite.position.set(0, 8, -ellipseR(-Math.PI / 2, 58, 40) + 6);
  suite.name = 'vip_suite';
  g.add(suite);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(30, 5, 0.4), MAT.glass);
  glass.position.set(0, 10, -ellipseR(-Math.PI / 2, 58, 40) - 2);
  glass.name = 'vip_glass';
  g.add(glass);
  group.add(g);
}

function createPlaza(group) {
  const g = new THREE.Group();
  g.name = 'plaza';
  const ring = new THREE.Mesh(new THREE.RingGeometry(105, 135, 48), MAT.concrete);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  ring.name = 'plaza_ring';
  g.add(ring);

  const rampGeos = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const geo = new THREE.BoxGeometry(16, 0.35, 24);
    const r = 118;
    geo.translate(Math.sin(a) * r, 0.15, Math.cos(a) * r * 0.85);
    geo.rotateY(-a);
    rampGeos.push(geo);
  }
  const ramps = new THREE.Mesh(mergeGeometries(rampGeos, false), MAT.concrete);
  ramps.name = 'plaza_ramps';
  g.add(ramps);
  group.add(g);
}

function createParking(group) {
  const g = new THREE.Group();
  g.name = 'parking';
  const lots = [[-145, -95, 80, 60], [145, -95, 80, 60], [-145, 95, 80, 60], [145, 95, 80, 60]];
  const geos = lots.map(([x, z, w, d]) => {
    const geo = new THREE.PlaneGeometry(w, d, 1, 1);
    geo.rotateX(-Math.PI / 2);
    geo.translate(x, 0.02, z);
    return geo;
  });
  const lot = new THREE.Mesh(mergeGeometries(geos, false), MAT.asphalt);
  lot.name = 'parking_lots';
  g.add(lot);
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

  createPitch(scene);
  createPlaza(scene);
  createStands(scene);
  createFacade(scene);
  createRoof(scene);
  createRoofOpen(scene);
  createVipZone(scene);
  createParking(scene);

  const { tris, meshes } = countTris(scene);
  console.log(`Meshes: ${meshes} · Triangles: ~${tris.toLocaleString()}`);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const buffer = await exportGlb(scene);
  fs.writeFileSync(OUT, buffer);
  console.log(`Written ${OUT} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
