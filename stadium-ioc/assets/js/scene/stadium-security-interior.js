import * as THREE from 'three';
import { getRoomById } from '../data/control-rooms.js';
import { stadiumSceneData } from '../data/stadium-scene-data.js';
import { tweenCameraVectors, setSceneHint } from './stadium-camera.js';

const RT_SIZE = 512;
const ACCENT = 0x97c459;
const SECURITY_ROOM_ANCHOR = { x: 0, z: 840, rotY: Math.PI };

let interiorGroup = null;
let monitorMeshes = [];
let feedCams = [];
let feedIds = [];
let feedTargets = [];
let active = false;
let savedControls = null;
let beforeFeedRender = null;
let afterFeedsRender = null;
let lastMonitorFeedRender = 0;
const MONITOR_FEED_INTERVAL_MS = 100;

export function setMonitorFeedHooks({ beforeFeedRender: hook, afterFeedsRender: afterHook }) {
  beforeFeedRender = hook;
  afterFeedsRender = afterHook;
}

function applyPreset(cam, key) {
  const p = stadiumSceneData.cameraPresets[key];
  if (!p) return;
  cam.position.set(...p.pos);
  cam.lookAt(...p.target);
  if (p.fov) cam.fov = p.fov;
  cam.updateProjectionMatrix();
}

function monitorLabelTex(text) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 48;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a1810';
  ctx.fillRect(0, 0, 256, 48);
  ctx.fillStyle = '#97c459';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeMonitor(feedId, label, x) {
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(32, 20, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x0a1018, metalness: 0.6, roughness: 0.35 }),
  );
  bezel.position.set(x, 22, 6);

  const rt = new THREE.WebGLRenderTarget(RT_SIZE, Math.round(RT_SIZE * (16 / 28)), {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  rt.texture.flipY = false;

  const screenMat = new THREE.MeshBasicMaterial({ map: rt.texture });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 16),
    screenMat,
  );
  screen.position.set(0, 0, -0.85);
  screen.rotation.y = Math.PI;
  screen.userData = { feedId, isMonitor: true };
  bezel.add(screen);

  const namePlate = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 4),
    new THREE.MeshBasicMaterial({ map: monitorLabelTex(label), transparent: true }),
  );
  namePlate.position.set(0, -12, -0.9);
  namePlate.rotation.y = Math.PI;
  bezel.add(namePlate);

  // Match monitor plane ratio (28:16) to avoid stretched feeds.
  const cam = new THREE.PerspectiveCamera(42, 28 / 16, 1, 1400);
  applyPreset(cam, feedId === 'interior' ? 'security' : 'exteriorLive');

  monitorMeshes.push(screen);
  feedCams.push(cam);
  feedIds.push(feedId);
  feedTargets.push(rt);
  bezel.userData = { feedId, label, isMonitor: true };
  return bezel;
}

function buildRoomShell() {
  const g = new THREE.Group();
  g.name = 'security_interior';

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0c1420, roughness: 0.92 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(130, 0.8, 90), wallMat);
  floor.position.y = 0.4;
  g.add(floor);

  const ceil = new THREE.Mesh(new THREE.BoxGeometry(130, 0.6, 90), wallMat);
  ceil.position.y = 38;
  g.add(ceil);

  [[0, 19, -44, 130, 38, 1], [-64, 19, 0, 1, 38, 90], [64, 19, 0, 1, 38, 90]].forEach(([x, y, z, w, h, d]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    m.position.set(x, y, z);
    g.add(m);
  });

  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(90, 5, 28),
    new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: 0.7 }),
  );
  desk.position.set(0, 8, -18);
  g.add(desk);

  g.add(makeMonitor('interior', 'Trong sân', -15.5));
  g.add(makeMonitor('exterior', 'Ngoài sân', 15.5));

  /* Tường lưng — đặt SAU màn hình (+Z), không che mặt màn */
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(72, 28, 1),
    new THREE.MeshStandardMaterial({ color: 0x0c1420, roughness: 0.95 }),
  );
  wall.position.set(0, 22, 8.2);
  g.add(wall);

  const light = new THREE.PointLight(0xfff6e8, 1.2, 120);
  light.position.set(0, 32, -10);
  g.add(light);
  const l2 = new THREE.PointLight(ACCENT, 0.35, 80);
  l2.position.set(-30, 28, 0);
  g.add(l2);
  const l3 = new THREE.PointLight(ACCENT, 0.35, 80);
  l3.position.set(30, 28, 0);
  g.add(l3);

  return g;
}

/** Điểm local → world theo transform phòng (tránh sai ma trận xoay) */
function localToWorld(room, lx, ly, lz) {
  const bx = SECURITY_ROOM_ANCHOR.x;
  const bz = SECURITY_ROOM_ANCHOR.z;
  const rotY = SECURITY_ROOM_ANCHOR.rotY;
  const cos = Math.cos(rotY);
  const sin = Math.sin(rotY);
  return new THREE.Vector3(
    bx + lx * cos + lz * sin,
    ly,
    bz - lx * sin + lz * cos,
  );
}

const ROOM_VIEWS = {
  dual: { pos: [0, 21, -38], target: [0, 22, 6], fov: 74 },
  interior: { pos: [0, 21, -38], target: [0, 22, 6], fov: 74 },
  exterior: { pos: [0, 21, -38], target: [0, 22, 6], fov: 74 },
};

/** Góc nhìn xa — thấy cả 2 màn hình cạnh nhau */
function worldCameraPose(room, mode = 'dual') {
  const v = ROOM_VIEWS[mode] || ROOM_VIEWS.dual;
  return {
    pos: localToWorld(room, ...v.pos),
    target: localToWorld(room, ...v.target),
    fov: v.fov,
  };
}

function ensureSecurityRoomControls(refs) {
  refs.controls.minDistance = 26;
  refs.controls.maxDistance = 52;
  refs.controls.minPolarAngle = Math.PI / 5;
  refs.controls.maxPolarAngle = Math.PI / 2.05;
  refs.controls.minAzimuthAngle = -Infinity;
  refs.controls.maxAzimuthAngle = Infinity;
  refs.controls.enablePan = false;
  refs.controls.enableRotate = true;
}

function notifySecurityViewChanged(mode) {
  document.dispatchEvent(new CustomEvent('voc-security-view-changed', { detail: mode }));
}

export function applySecurityRoomView(refs, mode = 'dual', options = {}) {
  if (!active || !refs) return Promise.resolve();
  ensureSecurityRoomControls(refs);
  notifySecurityViewChanged(mode);
  if (options.animate === false) return Promise.resolve();

  const room = getRoomById('security');
  const { pos, target, fov } = worldCameraPose(room, mode);
  refs.camera.fov = fov;
  refs.camera.updateProjectionMatrix();
  return tweenCameraVectors(refs.camera, refs.controls, pos, target, 800).then((completed) => {
    if (!completed) return;
    refs.camera.position.copy(pos);
    refs.controls.target.copy(target);
    refs.controls.update();
  });
}

export function buildSecurityInterior(scene) {
  disposeSecurityInterior();
  const room = getRoomById('security');
  if (!room) return null;

  interiorGroup = buildRoomShell();
  interiorGroup.position.set(SECURITY_ROOM_ANCHOR.x, 0, SECURITY_ROOM_ANCHOR.z);
  interiorGroup.rotation.y = SECURITY_ROOM_ANCHOR.rotY;
  interiorGroup.visible = false;
  scene.add(interiorGroup);
  return interiorGroup;
}

export function isSecurityInteriorActive() {
  return active;
}

export function prepareStadiumViewFromRoom(refs) {
  if (!refs || !savedControls) return;
  refs.controls.minDistance = savedControls.minDistance;
  refs.controls.maxDistance = savedControls.maxDistance;
  refs.controls.minPolarAngle = savedControls.minPolarAngle ?? 0;
  refs.controls.maxPolarAngle = savedControls.maxPolarAngle ?? Math.PI / 2.05;
  refs.controls.minAzimuthAngle = savedControls.minAzimuthAngle ?? -Infinity;
  refs.controls.maxAzimuthAngle = savedControls.maxAzimuthAngle ?? Infinity;
  refs.controls.enablePan = savedControls.enablePan ?? false;
  refs.controls.enableRotate = true;
}

export function enterSecurityInterior(refs) {
  if (!interiorGroup || !refs) return Promise.resolve();
  const room = getRoomById('security');
  const { pos, target, fov } = worldCameraPose(room, 'dual');
  active = true;
  interiorGroup.visible = true;

  savedControls = {
    minDistance: refs.controls.minDistance,
    maxDistance: refs.controls.maxDistance,
    minPolarAngle: refs.controls.minPolarAngle,
    maxPolarAngle: refs.controls.maxPolarAngle,
    minAzimuthAngle: refs.controls.minAzimuthAngle,
    maxAzimuthAngle: refs.controls.maxAzimuthAngle,
    enablePan: refs.controls.enablePan,
    enableRotate: refs.controls.enableRotate,
  };
  ensureSecurityRoomControls(refs);
  refs.camera.fov = fov;
  refs.camera.updateProjectionMatrix();

  setSceneHint(refs.container, 'Kéo chuột xoay · Cuộn zoom · Nhấn màn hình để giám sát');
  return tweenCameraVectors(refs.camera, refs.controls, pos, target, 1400).then((completed) => {
    if (!completed) return;
    refs.camera.position.copy(pos);
    refs.controls.target.copy(target);
    refs.controls.update();
  });
}

export function exitSecurityInterior(refs) {
  if (!active || !refs) return Promise.resolve();
  active = false;
  if (interiorGroup) interiorGroup.visible = false;
  if (savedControls) {
    Object.assign(refs.controls, savedControls);
    refs.controls.minPolarAngle = savedControls.minPolarAngle ?? 0;
    refs.controls.minAzimuthAngle = savedControls.minAzimuthAngle ?? -Infinity;
    refs.controls.maxAzimuthAngle = savedControls.maxAzimuthAngle ?? Infinity;
    savedControls = null;
  }
  refs.camera.fov = 42;
  refs.camera.updateProjectionMatrix();
  return tweenCameraVectors(
    refs.camera,
    refs.controls,
    new THREE.Vector3(...stadiumSceneData.cameraPresets.overview.pos),
    new THREE.Vector3(...stadiumSceneData.cameraPresets.overview.target),
    1200,
  ).then((completed) => {
    if (!completed) return;
    setSceneHint(refs.container, stadiumSceneData.cameraPresets.overview.hint);
  });
}

export function updateSecurityMonitors(renderer, scene) {
  if (!active || !interiorGroup?.visible) return;
  const now = performance.now();
  if (now - lastMonitorFeedRender < MONITOR_FEED_INTERVAL_MS) return;
  lastMonitorFeedRender = now;

  const prevBg = scene.background;
  const prevRoomVis = interiorGroup.visible;
  interiorGroup.visible = false;

  feedCams.forEach((cam, i) => {
    beforeFeedRender?.(feedIds[i], cam);
    renderer.setRenderTarget(feedTargets[i]);
    renderer.clear();
    renderer.render(scene, cam);
  });

  renderer.setRenderTarget(null);
  scene.background = prevBg;
  interiorGroup.visible = prevRoomVis;
  afterFeedsRender?.();
}

let pickEl = null;
let pickHandler = null;

function pickMonitorFeed(ev, camera) {
  if (!active || !interiorGroup || !pickEl) return null;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const r = pickEl.getBoundingClientRect();
  ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(interiorGroup.children, true);
  let feedId = hits[0]?.object?.userData?.feedId;
  if (!feedId && hits[0]?.object?.parent?.userData?.feedId) {
    feedId = hits[0].object.parent.userData.feedId;
  }
  return feedId || null;
}

export function bindSecurityMonitorPick(rendererEl, camera, cb) {
  unbindSecurityMonitorPick();
  if (!rendererEl || !interiorGroup) return;
  pickEl = rendererEl;
  pickHandler = (ev) => {
    const feedId = pickMonitorFeed(ev, camera);
    if (feedId) cb(feedId);
  };
  pickEl.addEventListener('click', pickHandler);
}

export function unbindSecurityMonitorPick() {
  if (pickEl && pickHandler) pickEl.removeEventListener('click', pickHandler);
  pickEl = null;
  pickHandler = null;
}

export function disposeSecurityInterior() {
  unbindSecurityMonitorPick();
  active = false;
  lastMonitorFeedRender = 0;
  monitorMeshes = [];
  feedCams = [];
  feedIds = [];
  const targets = [...feedTargets];
  feedTargets = [];
  targets.forEach((rt) => rt.dispose());
  interiorGroup?.traverse((o) => {
    o.geometry?.dispose();
    if (o.material && !feedTargets.some((rt) => rt.texture === o.material.map)) {
      o.material.dispose?.();
    }
  });
  interiorGroup?.removeFromParent?.();
  interiorGroup = null;
}

export function setSecurityInteriorVisible(v) {
  if (interiorGroup) interiorGroup.visible = v && active;
}

export function reenterSecurityInterior(refs) {
  if (!active || !refs) return Promise.resolve();
  interiorGroup.visible = true;
  return applySecurityRoomView(refs, 'dual');
}

export function requestSecurityRoomView(mode, options = {}) {
  document.dispatchEvent(new CustomEvent('voc-security-room-view', {
    detail: { mode, ...options },
  }));
}

export function feedToViewId(feedId) {
  return feedId === 'interior' ? 'security' : 'exteriorLive';
}
