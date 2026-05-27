import * as THREE from 'three';
import { getSeatMap } from '../data/stadium-geometry.js';
import { getCrowdFillRatio, isSeatOccupied, setFillPercent } from '../data/crowd-state.js';

const MAX_INSTANCES = 12000;
const NEAR_DIST = 380;
const SHIRT_COLORS = [
  0x1f3d8f, 0xc62828, 0xeceff1, 0x1b1b1f,
  0x2e7d4a, 0xe6a817, 0x6a1b9a, 0xb85c1a,
];

const _matrix = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _color = new THREE.Color();

let crowdRoot = null;
let instancedMesh = null;
let seatDeckMesh = null;
let seatDeckBaseColor = null;
let occupiedSeats = [];
let lastFillKey = '';
let lastMode = '';

export function initStadiumCrowd(model, scene) {
  disposeStadiumCrowd();

  const allSeats = getSeatMap();
  occupiedSeats = allSeats;

  const oldCrowd = model.getObjectByName('stand_crowd');
  if (oldCrowd) oldCrowd.visible = false;

  seatDeckMesh = model.getObjectByName('stand_seats');
  if (seatDeckMesh?.material) {
    seatDeckBaseColor = seatDeckMesh.material.color.clone();
  }

  const geo = new THREE.BoxGeometry(0.52, 0.58, 0.38);
  const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
  instancedMesh = new THREE.InstancedMesh(geo, mat, MAX_INSTANCES);
  instancedMesh.name = 'crowd_instances';
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.count = 0;
  instancedMesh.frustumCulled = false;
  instancedMesh.renderOrder = 2;

  crowdRoot = new THREE.Group();
  crowdRoot.name = 'crowd_system';
  crowdRoot.add(instancedMesh);
  crowdRoot.visible = false;
  scene.add(crowdRoot);

  refreshCrowdInstances();
  applyDensityTint(getCrowdFillRatio());
}

function refreshCrowdInstances() {
  if (!instancedMesh) return;

  const fillKey = getCrowdFillRatio().toFixed(4);
  if (fillKey === lastFillKey) return;
  lastFillKey = fillKey;

  const occupied = occupiedSeats.filter((s) => isSeatOccupied(s.index, s.sector));
  const step = Math.max(1, Math.ceil(occupied.length / MAX_INSTANCES));
  let n = 0;

  for (let i = 0; i < occupied.length && n < MAX_INSTANCES; i += step) {
    const s = occupied[i];
    _pos.set(s.x, s.y, s.z);
    _quat.setFromEuler(new THREE.Euler(0, s.rotY, 0));
    _matrix.compose(_pos, _quat, _scale);
    instancedMesh.setMatrixAt(n, _matrix);
    _color.setHex(SHIRT_COLORS[s.index % SHIRT_COLORS.length]);
    instancedMesh.setColorAt(n, _color);
    n++;
  }

  instancedMesh.count = n;
  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
}

function applyDensityTint(fillRatio) {
  if (!seatDeckMesh?.material || !seatDeckBaseColor) return;
  const empty = new THREE.Color(0x4a5058);
  const full = seatDeckBaseColor.clone();
  seatDeckMesh.material.color.copy(empty).lerp(full, Math.min(1, fillRatio * 1.05));
  seatDeckMesh.material.emissive?.setHex(0x000000);
  if (fillRatio > 0.5 && seatDeckMesh.material.emissive) {
    seatDeckMesh.material.emissive.setHex(0x1a2840);
    seatDeckMesh.material.emissiveIntensity = (fillRatio - 0.5) * 0.35;
  }
}

export function updateStadiumCrowd(camera, viewingInterior) {
  if (!crowdRoot || !instancedMesh) return;

  refreshCrowdInstances();
  const fillRatio = getCrowdFillRatio();
  applyDensityTint(fillRatio);
  crowdRoot.visible = false;
  instancedMesh.visible = false;
  lastMode = 'off';
}

export function disposeStadiumCrowd() {
  if (instancedMesh) {
    instancedMesh.geometry.dispose();
    instancedMesh.material.dispose();
  }
  crowdRoot?.removeFromParent();
  instancedMesh = null;
  crowdRoot = null;
  seatDeckMesh = null;
  seatDeckBaseColor = null;
  occupiedSeats = [];
  lastFillKey = '';
  lastMode = '';
}

export function setCrowdFillPercent(percent) {
  setFillPercent(percent);
  lastFillKey = '';
  refreshCrowdInstances();
  applyDensityTint(getCrowdFillRatio());
}
