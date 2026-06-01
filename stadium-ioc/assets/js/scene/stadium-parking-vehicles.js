import * as THREE from 'three';
import { parkingVehicleLots } from '../data/stadium-parking-vehicles-data.js';

const PARK_RADIUS = 505;
const LOT_W = 156;
const LOT_D = 116;
const VEHICLE_RENDER_RATIO = 0.42;

let parkingVehicles = null;

const palette = {
  white: 0xe8edf4,
  silver: 0x9da8b3,
  blue: 0x185fa5,
  red: 0xa32d2d,
  dark: 0x1c2430,
  yellow: 0xba7517,
};

function addCar(parent, x, z, rot, color) {
  const car = new THREE.Group();
  car.position.set(x, 0.82, z);
  car.rotation.y = rot;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 1.06, 2.55),
    new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.28 }),
  );
  body.position.y = 0.45;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 0.78, 1.92),
    new THREE.MeshStandardMaterial({ color: 0x263442, roughness: 0.2, metalness: 0.12 }),
  );
  cabin.position.set(-0.15, 1.08, 0);
  car.add(cabin);

  parent.add(car);
}

function addMotorbike(parent, x, z, rot, color) {
  const bike = new THREE.Group();
  bike.position.set(x, 0.78, z);
  bike.rotation.y = rot;

  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.7 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.9, 1.75), mat);
  body.position.y = 0.64;
  bike.add(body);

  const frontFairing = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.18, 1.95), mat);
  frontFairing.position.set(1.95, 1.02, 0);
  bike.add(frontFairing);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.42, 1.2), dark);
  seat.position.set(-0.45, 1.22, 0);
  bike.add(seat);

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.26, 2.85), dark);
  handle.position.set(2.35, 1.68, 0);
  bike.add(handle);

  parent.add(bike);
}

function lotToWorld(lot, lx, lz) {
  const cx = Math.sin(lot.angle) * PARK_RADIUS;
  const cz = Math.cos(lot.angle) * PARK_RADIUS;
  const rot = -lot.angle + Math.PI / 2;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return {
    x: cx + lx * cos + lz * sin,
    z: cz - lx * sin + lz * cos,
    rot,
  };
}

function seededShuffle(items, seed = 1) {
  let state = seed >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function fillCars(root, lot) {
  const colors = [palette.white, palette.silver, palette.blue, palette.red, palette.dark, palette.yellow];
  const cols = 20;
  const maxRows = 8;
  const slots = [];
  const startX = -LOT_W * 0.45;
  const startZ = -LOT_D * 0.46;
  const gapX = (LOT_W * 0.9) / Math.max(cols - 1, 1);
  const gapZ = (LOT_D * 0.47) / Math.max(maxRows - 1, 1);

  for (let row = 0; row < maxRows; row++) {
    for (let col = 0; col < cols; col++) {
      slots.push({ row, col });
    }
  }

  const renderCars = Math.max(8, Math.round(lot.cars * VEHICLE_RENDER_RATIO));
  seededShuffle(slots, lot.seed).slice(0, renderCars).forEach(({ row, col }, i) => {
    const lx = startX + col * gapX + ((row % 2) * 1.4);
    const lz = startZ + row * gapZ;
    const p = lotToWorld(lot, lx, lz);
    addCar(root, p.x, p.z, p.rot, colors[(i + row) % colors.length]);
  });
}

function fillMotorbikes(root, lot) {
  const colors = [palette.dark, palette.blue, palette.red, palette.white, palette.yellow];
  const cols = 18;
  const maxRows = 17;
  const slots = [];
  const startX = -LOT_W * 0.45;
  const startZ = LOT_D * 0.03;
  const gapX = (LOT_W * 0.9) / Math.max(cols - 1, 1);
  const gapZ = (LOT_D * 0.45) / Math.max(maxRows - 1, 1);

  for (let row = 0; row < maxRows; row++) {
    for (let col = 0; col < cols; col++) {
      slots.push({ row, col });
    }
  }

  const renderMotorbikes = Math.max(12, Math.round(lot.motorbikes * VEHICLE_RENDER_RATIO));
  seededShuffle(slots, lot.seed + 101).slice(0, renderMotorbikes).forEach(({ row, col }, i) => {
    const lx = startX + col * gapX + ((row % 2) * 1.2);
    const lz = startZ + row * gapZ;
    const p = lotToWorld(lot, lx, lz);
    addMotorbike(root, p.x, p.z, p.rot, colors[(i + col) % colors.length]);
  });
}

export function buildParkingVehicles(scene) {
  disposeParkingVehicles();
  parkingVehicles = new THREE.Group();
  parkingVehicles.name = 'parking_vehicles_runtime';
  parkingVehicleLots.forEach((lot) => {
    fillCars(parkingVehicles, lot);
    fillMotorbikes(parkingVehicles, lot);
  });
  scene.add(parkingVehicles);
  return parkingVehicles;
}

export function setParkingVehiclesVisible(visible = true) {
  if (parkingVehicles) parkingVehicles.visible = visible;
}

export function disposeParkingVehicles() {
  if (!parkingVehicles) return;
  parkingVehicles.traverse((obj) => {
    obj.geometry?.dispose();
    if (obj.material) {
      (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
    }
  });
  parkingVehicles.parent?.remove(parkingVehicles);
  parkingVehicles = null;
}
