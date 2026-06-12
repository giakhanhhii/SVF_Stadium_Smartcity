import * as THREE from 'three';
import { getGateState, subscribeGateState } from '../data/security-gates-state.js';

let gateGroup = null;
let gateObjects = new Map();
let unsubscribe = null;

const GATE_RING_RADIUS = 620;
const WALL_RADIUS = 590;
const GATE_TO_WALL = GATE_RING_RADIUS - WALL_RADIUS;
const WALL_HEIGHT = 38;
const WALL_THICKNESS = 12;
const GATE_FRAME_DEPTH = 5;
const GATE_OPENING_ANGLE = 0.105;
const GATE_RING_START = Math.PI * 0.125;
const GATE_IDS = [
  ['A1', 0x97c459],
  ['A2', 0x97c459],
  ['A3', 0x97c459],
  ['A4', 0x97c459],
  ['B1', 0x1d9e75],
  ['B2', 0xe24b4a],
  ['B3', 0x1d9e75],
  ['B4', 0x1d9e75],
];

const GATE_LAYOUT = GATE_IDS.map(([id, tone], i) => {
  const a = GATE_RING_START + (i / GATE_IDS.length) * Math.PI * 2;
  return {
    id,
    tone,
    x: Math.sin(a) * GATE_RING_RADIUS,
    z: Math.cos(a) * GATE_RING_RADIUS,
    rotY: a + Math.PI,
    angle: a,
  };
});

function labelTexture(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#07101a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#173040';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  ctx.fillStyle = `#${new THREE.Color(color).getHexString()}`;
  ctx.font = '700 30px Roboto, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGate(gate) {
  const root = new THREE.Group();
  root.name = `stadium_gate_${gate.id}`;
  root.position.set(gate.x, 0, gate.z);
  root.rotation.y = gate.rotY;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a2632, metalness: 0.55, roughness: 0.4 });
  const accentMat = new THREE.MeshStandardMaterial({ color: gate.tone, emissive: gate.tone, emissiveIntensity: 0.18 });
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0xe7edf2, roughness: 0.42, metalness: 0.15 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x263544, roughness: 0.8, metalness: 0.18 });
  const gateHeight = 20;
  const wallHeight = gateHeight * 1.5;
  const sideWallDepth = 6;
  /** +Z local = vào trong sân; mép tường hông trùng mép ngoài cột, không nhô ra phía trước cổng */
  const sideWallZ = -GATE_FRAME_DEPTH * 0.5 + sideWallDepth * 0.5;

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(18, wallHeight, sideWallDepth), wallMat);
  leftWall.position.set(-29, wallHeight / 2, sideWallZ);
  root.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(18, wallHeight, sideWallDepth), wallMat);
  rightWall.position.set(29, wallHeight / 2, sideWallZ);
  root.add(rightWall);

  const leftCol = new THREE.Mesh(new THREE.BoxGeometry(5, gateHeight, 5), frameMat);
  leftCol.position.set(-16, gateHeight / 2, 0);
  root.add(leftCol);

  const rightCol = new THREE.Mesh(new THREE.BoxGeometry(5, gateHeight, 5), frameMat);
  rightCol.position.set(16, gateHeight / 2, 0);
  root.add(rightCol);

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(40, 4, 5), frameMat);
  lintel.position.set(0, gateHeight, 0);
  root.add(lintel);

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(19, 9),
    new THREE.MeshBasicMaterial({ map: labelTexture(gate.id, gate.tone), transparent: true }),
  );
  label.position.set(0, gateHeight - 4, 3.2);
  root.add(label);

  const barrierPivot = new THREE.Group();
  barrierPivot.position.set(0, 4.5, 1.2);
  root.add(barrierPivot);

  const barrier = new THREE.Mesh(new THREE.BoxGeometry(28, 1.6, 2.6), barrierMat);
  barrier.position.set(0, 0, 0);
  barrierPivot.add(barrier);

  const lamp = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2, 2), accentMat);
  lamp.position.set(0, 8.5, 2.8);
  root.add(lamp);

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(78, 0.4, 18),
    new THREE.MeshStandardMaterial({ color: 0x0c1520, roughness: 0.92 }),
  );
  pad.position.set(0, 0.2, 0);
  root.add(pad);

  const wingMat = new THREE.MeshStandardMaterial({ color: 0xb9c6d2, roughness: 0.9, metalness: 0.08 });
  /** Cánh tường: từ mặt cổng (z=0) kéo vào trong tới hàng rào — không đẩy ra phía ngoài */
  const wingLen = GATE_TO_WALL;
  const wingZ = wingLen * 0.5;
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(7, WALL_HEIGHT, wingLen), wingMat);
  leftWing.position.set(-29, WALL_HEIGHT / 2, wingZ);
  root.add(leftWing);

  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(7, WALL_HEIGHT, wingLen), wingMat);
  rightWing.position.set(29, WALL_HEIGHT / 2, wingZ);
  root.add(rightWing);

  gateObjects.set(gate.id, { root, barrierPivot, lamp, accentMat });
  return root;
}

function buildWallSectorGeometry(innerR, outerR, height, startA, span) {
  const segs = Math.max(12, Math.ceil(span / 0.035));
  const positions = [];
  const indices = [];

  const addVertex = (a, r, y) => {
    positions.push(Math.sin(a) * r, y, Math.cos(a) * r);
    return (positions.length / 3) - 1;
  };
  const addQuad = (a, b, c, d) => {
    indices.push(a, b, c, a, c, d);
  };

  for (let i = 0; i < segs; i++) {
    const a0 = startA + (i / segs) * span;
    const a1 = startA + ((i + 1) / segs) * span;

    const ob0 = addVertex(a0, outerR, 0);
    const ob1 = addVertex(a1, outerR, 0);
    const ot1 = addVertex(a1, outerR, height);
    const ot0 = addVertex(a0, outerR, height);
    addQuad(ob0, ob1, ot1, ot0);

    const ib0 = addVertex(a0, innerR, 0);
    const it0 = addVertex(a0, innerR, height);
    const it1 = addVertex(a1, innerR, height);
    const ib1 = addVertex(a1, innerR, 0);
    addQuad(ib0, it0, it1, ib1);

    const topInner0 = addVertex(a0, innerR, height);
    const topOuter0 = addVertex(a0, outerR, height);
    const topOuter1 = addVertex(a1, outerR, height);
    const topInner1 = addVertex(a1, innerR, height);
    addQuad(topInner0, topOuter0, topOuter1, topInner1);

    const botInner0 = addVertex(a0, innerR, 0);
    const botInner1 = addVertex(a1, innerR, 0);
    const botOuter1 = addVertex(a1, outerR, 0);
    const botOuter0 = addVertex(a0, outerR, 0);
    addQuad(botInner0, botInner1, botOuter1, botOuter0);
  }

  const addEndCap = (a) => {
    const ib = addVertex(a, innerR, 0);
    const ob = addVertex(a, outerR, 0);
    const ot = addVertex(a, outerR, height);
    const it = addVertex(a, innerR, height);
    addQuad(ib, ob, ot, it);
  };
  addEndCap(startA);
  addEndCap(startA + span);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function addPerimeterWalls() {
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x8f9ba5,
    roughness: 0.86,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const sortedAngles = GATE_LAYOUT.map((gate) => gate.angle).sort((a, b) => a - b);
  sortedAngles.forEach((angle, idx) => {
    const next = sortedAngles[(idx + 1) % sortedAngles.length];
    const end = next > angle ? next : next + Math.PI * 2;
    const startA = angle + GATE_OPENING_ANGLE * 0.5;
    const endA = end - GATE_OPENING_ANGLE * 0.5;
    const span = endA - startA;
    if (span <= 0.04) return;

    const wall = new THREE.Mesh(
      buildWallSectorGeometry(
        WALL_RADIUS - WALL_THICKNESS * 0.5,
        WALL_RADIUS + WALL_THICKNESS * 0.5,
        WALL_HEIGHT,
        startA,
        span,
      ),
      wallMat,
    );
    gateGroup.add(wall);
  });
}

function applyGateVisual(state) {
  state.forEach((gate) => {
    const refs = gateObjects.get(gate.id);
    if (!refs) return;
    refs.barrierPivot.rotation.x = gate.open ? -1.35 : 0;
    refs.lamp.material.emissiveIntensity = gate.open ? 0.22 : 0.35;
    refs.lamp.material.color.setHex(gate.open ? 0x97c459 : 0xe24b4a);
    refs.lamp.material.emissive.setHex(gate.open ? 0x97c459 : 0xe24b4a);
  });
}

export function buildStadiumGates(scene) {
  disposeStadiumGates();
  gateGroup = new THREE.Group();
  gateGroup.name = 'stadium_gates';
  addPerimeterWalls();
  GATE_LAYOUT.forEach((gate) => gateGroup.add(createGate(gate)));
  scene.add(gateGroup);
  applyGateVisual(getGateState());
  unsubscribe = subscribeGateState((state) => applyGateVisual(state));
  return gateGroup;
}

export function setStadiumGatesVisible(visible) {
  if (gateGroup) gateGroup.visible = visible;
}

export function disposeStadiumGates() {
  unsubscribe?.();
  unsubscribe = null;
  gateGroup?.traverse((obj) => {
    obj.geometry?.dispose?.();
    if (obj.material) {
      (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((mat) => {
        mat.map?.dispose?.();
        mat.dispose?.();
      });
    }
  });
  gateGroup?.removeFromParent?.();
  gateGroup = null;
  gateObjects = new Map();
}
