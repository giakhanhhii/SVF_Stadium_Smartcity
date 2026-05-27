import * as THREE from 'three';
import { CONTROL_ROOMS } from '../data/control-rooms.js';

let roomGroup = null;
let boundEl = null;
let boundCam = null;
let onPick = null;
let pointerState = null;

const DEFAULT_BUILDING = { height: 22, width: 148, depth: 108 };
const PICK_MOVE_TOLERANCE = 8;
const PICK_MAX_DURATION_MS = 450;

function matBody(accent) {
  return new THREE.MeshStandardMaterial({
    color: 0x141e2a,
    roughness: 0.55,
    metalness: 0.35,
    emissive: accent,
    emissiveIntensity: 0.12,
  });
}

function addClickable(mesh, roomId) {
  mesh.userData.roomId = roomId;
}

function defaultRoomMesh(room, accent, spec) {
  const g = new THREE.Group();
  const { height, width, depth } = spec;
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), matBody(accent));
  body.position.y = height / 2;
  addClickable(body, room.id);
  g.add(body);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(width - 16, height * 0.55, 4),
    new THREE.MeshStandardMaterial({
      color: accent, transparent: true, opacity: 0.35, emissive: accent, emissiveIntensity: 0.25,
    }),
  );
  glass.position.set(0, height * 0.55, depth / 2 + 2);
  addClickable(glass, room.id);
  g.add(glass);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + 8, 3, depth + 8),
    new THREE.MeshStandardMaterial({ color: 0x0a1018, metalness: 0.5, roughness: 0.4 }),
  );
  roof.position.y = height + 1.5;
  addClickable(roof, room.id);
  g.add(roof);
  return g;
}

function towerRoomMesh(room, accent, spec) {
  const g = defaultRoomMesh(room, accent, spec);
  const { height, width, depth } = spec;

  for (let f = 1; f < 3; f++) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(width + 2, 1.2, depth + 2),
      new THREE.MeshStandardMaterial({ color: 0x0c1620, emissive: accent, emissiveIntensity: 0.08 }),
    );
    band.position.y = (height / 3) * f;
    addClickable(band, room.id);
    g.add(band);
  }

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(36, 8, 2),
    new THREE.MeshStandardMaterial({ color: 0x0a1810, emissive: accent, emissiveIntensity: 0.55 }),
  );
  sign.position.set(0, height * 0.78, depth / 2 + 3);
  addClickable(sign, room.id);
  g.add(sign);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 2.4, 18, 8),
    new THREE.MeshStandardMaterial({ color: 0x8898a8, metalness: 0.7, roughness: 0.3 }),
  );
  mast.position.set(width * 0.28, height + 12, -depth * 0.2);
  addClickable(mast, room.id);
  g.add(mast);

  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(5, 12, 8, 0, Math.PI * 2, 0, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x97c459, emissive: 0x97c459, emissiveIntensity: 0.2, metalness: 0.6 }),
  );
  dish.position.set(width * 0.28, height + 20, -depth * 0.2);
  dish.rotation.x = -0.4;
  addClickable(dish, room.id);
  g.add(dish);

  return g;
}

function roomMesh(room) {
  const g = new THREE.Group();
  g.name = `voc_room_${room.id}`;
  g.userData.roomId = room.id;
  g.position.set(room.pos[0], 0, room.pos[1]);

  const spec = { ...DEFAULT_BUILDING, ...room.building };
  const accent = new THREE.Color(room.accent);
  const body = room.building?.profile === 'tower'
    ? towerRoomMesh(room, accent, spec)
    : defaultRoomMesh(room, accent, spec);
  g.add(body);
  return g;
}

function pickRoom(ev) {
  if (!onPick || !roomGroup?.visible || !boundEl || !boundCam) return;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const r = boundEl.getBoundingClientRect();
  ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(ndc, boundCam);
  const hits = ray.intersectObjects(roomGroup.children, true);
  const id = hits[0]?.object?.userData?.roomId;
  if (id) onPick(id);
}

function resetPointerState() {
  pointerState = null;
}

function handlePointerDown(ev) {
  if (ev.button !== 0 || !ev.isTrusted) {
    resetPointerState();
    return;
  }

  pointerState = {
    pointerId: ev.pointerId,
    startX: ev.clientX,
    startY: ev.clientY,
    startAt: performance.now(),
    moved: false,
  };
}

function handlePointerMove(ev) {
  if (!pointerState || ev.pointerId !== pointerState.pointerId) return;
  const dx = ev.clientX - pointerState.startX;
  const dy = ev.clientY - pointerState.startY;
  if (Math.hypot(dx, dy) > PICK_MOVE_TOLERANCE) pointerState.moved = true;
}

function handlePointerUp(ev) {
  if (!pointerState || ev.pointerId !== pointerState.pointerId) return resetPointerState();

  const duration = performance.now() - pointerState.startAt;
  const dx = ev.clientX - pointerState.startX;
  const dy = ev.clientY - pointerState.startY;
  const moved = pointerState.moved || Math.hypot(dx, dy) > PICK_MOVE_TOLERANCE;

  if (
    ev.button === 0
    && ev.isTrusted
    && !moved
    && duration <= PICK_MAX_DURATION_MS
  ) {
    pickRoom(ev);
  }

  resetPointerState();
}

export function buildControlRooms(scene) {
  disposeControlRooms();
  roomGroup = new THREE.Group();
  roomGroup.name = 'voc_control_rooms';
  CONTROL_ROOMS.forEach((room) => roomGroup.add(roomMesh(room)));
  scene.add(roomGroup);
  return roomGroup;
}

export function setControlRoomsVisible(v) {
  if (roomGroup) roomGroup.visible = v;
}

export function bindControlRoomPick(rendererEl, camera, pickCb) {
  unbindControlRoomPick();
  if (!rendererEl || !roomGroup) return;
  boundEl = rendererEl;
  boundCam = camera;
  onPick = pickCb;
  boundEl.addEventListener('pointerdown', handlePointerDown);
  boundEl.addEventListener('pointermove', handlePointerMove);
  boundEl.addEventListener('pointerup', handlePointerUp);
  boundEl.addEventListener('pointercancel', resetPointerState);
  boundEl.addEventListener('pointerleave', resetPointerState);
}

export function unbindControlRoomPick() {
  if (boundEl) {
    boundEl.removeEventListener('pointerdown', handlePointerDown);
    boundEl.removeEventListener('pointermove', handlePointerMove);
    boundEl.removeEventListener('pointerup', handlePointerUp);
    boundEl.removeEventListener('pointercancel', resetPointerState);
    boundEl.removeEventListener('pointerleave', resetPointerState);
  }
  boundEl = null;
  boundCam = null;
  onPick = null;
  resetPointerState();
}

export function disposeControlRooms() {
  unbindControlRoomPick();
  roomGroup?.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
  });
  roomGroup?.removeFromParent?.();
  roomGroup = null;
}
