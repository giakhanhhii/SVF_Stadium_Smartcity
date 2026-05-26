import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let pmremGen = null;
let envTarget = null;
const facadeCache = new Map();

function windowLit(id, r, c) {
  return ((id.charCodeAt(0) + r * 7 + c * 13) % 10) > 3;
}

export function createFacadeTexture(id) {
  if (facadeCache.has(id)) return facadeCache.get(id);

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const cols = 3;
  const rows = 12;
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;
  const frame = 3;

  ctx.fillStyle = '#5a8cb0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW + frame;
      const y = r * cellH + frame;
      const w = cellW - frame * 2;
      const h = cellH - frame * 2;
      const lit = windowLit(id, r, c);
      const g = ctx.createLinearGradient(x, y, x + w, y + h);

      if (lit) {
        g.addColorStop(0, '#a8e8ff');
        g.addColorStop(0.45, '#d8f6ff');
        g.addColorStop(1, '#78c8f0');
      } else {
        g.addColorStop(0, '#88d0f8');
        g.addColorStop(0.5, '#70c0f0');
        g.addColorStop(1, '#58b0e8');
      }
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = 'rgba(210,245,255,0.55)';
      ctx.fillRect(x + w * 0.08, y + h * 0.05, w * 0.25, h * 0.35);
      ctx.fillStyle = 'rgba(240,252,255,0.28)';
      ctx.fillRect(x + w * 0.55, y + h * 0.4, w * 0.35, h * 0.45);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  facadeCache.set(id, tex);
  return tex;
}

export function createGlassMaterial(b, repeatW, repeatH) {
  const tex = createFacadeTexture(b.id).clone();
  tex.repeat.set(repeatW, repeatH);

  return new THREE.MeshPhysicalMaterial({
    map: tex,
    color: 0xb8ecff,
    metalness: 0.55,
    roughness: 0.04,
    transparent: true,
    opacity: 0.84,
    transmission: 0.1,
    envMapIntensity: 1.6,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    reflectivity: 1,
    emissive: b.incident ? 0xff6666 : 0x3090c8,
    emissiveIntensity: b.incident ? 0.14 : 0.06,
  });
}

export function createBuildingMaterials(b, bw, bh, bd) {
  const topMat = new THREE.MeshStandardMaterial({ color: 0x4a7898, roughness: 0.8, metalness: 0.15 });
  const bottomMat = new THREE.MeshStandardMaterial({ color: 0x3a6888, roughness: 0.95 });

  return [
    createGlassMaterial(b, bd * 0.42, bh * 0.13),
    createGlassMaterial(b, bd * 0.42, bh * 0.13),
    topMat,
    bottomMat,
    createGlassMaterial(b, bw * 0.42, bh * 0.13),
    createGlassMaterial(b, bw * 0.42, bh * 0.13),
  ];
}

export function setupSceneEnvironment(renderer, scene) {
  pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();
  envTarget = pmremGen.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  return envTarget;
}

export function disposeSceneEnvironment() {
  envTarget?.dispose();
  pmremGen?.dispose();
  envTarget = null;
  pmremGen = null;
  facadeCache.forEach((t) => t.dispose());
  facadeCache.clear();
}
