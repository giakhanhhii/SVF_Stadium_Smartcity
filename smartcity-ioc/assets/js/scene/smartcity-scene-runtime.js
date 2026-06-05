import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { smartcitySceneData } from '../data/smartcity-scene-data.js';
import { createBuildingMaterials, disposeSceneEnvironment } from './scene-building-materials.js';
import { setupLighting } from './scene-lighting.js';
import { applyCameraPreset, setSceneHint, showSceneLoading, tweenCamera } from './smartcity-camera.js';

let activeScene = null;
let rendererEl = null;
let sceneRefs = null;
let currentPage = 'overview';
let pmrem = null;

const groupKeys = ['traffic', 'security', 'environment', 'utilities', 'reports'];
const layerGroups = new Map();
const emphasisTargets = new Map();
const animatedObjects = [];

function getLayer(name) {
  if (!layerGroups.has(name)) {
    const group = new THREE.Group();
    group.name = `smartcity-layer-${name}`;
    layerGroups.set(name, group);
  }
  return layerGroups.get(name);
}

function makeMaterial(color, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.12,
    ...options,
  });
  material.userData.baseOpacity = material.opacity;
  return material;
}

function addLabel(parent, text, position, color = '#185FA5', scale = [2.8, 0.76, 1]) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 112;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(7, 20, 36, 0.82)';
  ctx.beginPath();
  ctx.roundRect(12, 12, 360, 74, 12);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 192, 50);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.position.set(...position);
  sprite.scale.set(...scale);
  parent.add(sprite);
  return sprite;
}

function addGround(scene) {
  scene.background = new THREE.Color(0xb8dcf2);
  scene.fog = new THREE.Fog(0xb8dcf2, 70, 130);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(86, 86),
    makeMaterial(0x78af63, { roughness: 0.94 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const park = smartcitySceneData.park;
  const parkMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(park.size[0], park.size[1]),
    makeMaterial(0x52a861, { roughness: 0.92 }),
  );
  parkMesh.rotation.x = -Math.PI / 2;
  parkMesh.position.set(park.pos[0], 0.018, park.pos[2]);
  parkMesh.receiveShadow = true;
  scene.add(parkMesh);

  const water = smartcitySceneData.water;
  const waterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(water.size[0], water.size[1]),
    makeMaterial(0x72c8e8, {
      metalness: 0.35,
      roughness: 0.18,
      transparent: true,
      opacity: 0.78,
      emissive: 0x1c7ea5,
      emissiveIntensity: 0.08,
    }),
  );
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(water.pos[0], 0.04, water.pos[2]);
  scene.add(waterMesh);
  animatedObjects.push({ type: 'pulseOpacity', mesh: waterMesh, base: 0.7, amp: 0.12, speed: 1.25 });

  smartcitySceneData.grassPatches.forEach(([x, z, radius = 2.4]) => {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(radius, 18), makeMaterial(0x63b957, { roughness: 0.9 }));
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, 0.032, z);
    scene.add(patch);
  });
}

function addRoad(scene, road) {
  const roadMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(road.size[0], road.size[1]),
    makeMaterial(road.type === 'primary' ? 0x343b42 : 0x46515a, { roughness: 0.95 }),
  );
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.rotation.z = road.rotation || 0;
  roadMesh.position.set(road.pos[0], 0.06, road.pos[2]);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);
}

function addLaneMarking(scene, x, z, w, h, color = 0xffffff) {
  const stripe = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color }),
  );
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(x, 0.083, z);
  scene.add(stripe);
}

function addRoadNetwork(scene) {
  smartcitySceneData.roads.forEach((road) => addRoad(scene, road));
  const eastWestRoad = smartcitySceneData.roads.find((road) => road.id === 'road-main-ew');
  const northSouthRoad = smartcitySceneData.roads.find((road) => road.id === 'road-main-ns');
  const halfEastWest = (eastWestRoad?.size[0] || 46) / 2;
  const halfNorthSouth = (northSouthRoad?.size[1] || 46) / 2;

  for (let i = -halfNorthSouth + 2; i <= halfNorthSouth - 2; i += 2.2) {
    if (Math.abs(i) > 5) {
      addLaneMarking(scene, -2.2, i, 0.1, 0.9);
      addLaneMarking(scene, 2.2, i, 0.1, 0.9);
    }
  }
  for (let i = -halfEastWest + 2; i <= halfEastWest - 2; i += 2.2) {
    if (Math.abs(i) > 5) {
      addLaneMarking(scene, i, -2.2, 0.9, 0.1);
      addLaneMarking(scene, i, 2.2, 0.9, 0.1);
    }
  }
  addLaneMarking(scene, 0, 0, eastWestRoad?.size[0] || 46, 0.12, 0xffcf4a);
  addLaneMarking(scene, 0, 0, 0.12, northSouthRoad?.size[1] || 46, 0xffcf4a);
  [-4.4, 4.4].forEach((offset) => {
    for (let i = -1.2; i <= 1.2; i += 0.48) {
      addLaneMarking(scene, i, offset, 0.34, 2.5);
      addLaneMarking(scene, offset, i, 2.5, 0.34);
    }
  });
}

function addBuilding(scene, data, muted = false) {
  const [w, h, d] = data.size;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    muted ? makeMaterial(0x9cc5d3, { transparent: true, opacity: 0.64 }) : createBuildingMaterials(data, w, h, d),
  );
  mesh.position.set(data.pos[0], h / 2, data.pos[2]);
  mesh.castShadow = !muted;
  mesh.receiveShadow = true;
  scene.add(mesh);

  if (data.roof) {
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.18, 0.22, d + 0.18),
      makeMaterial(0x56b45a, { roughness: 0.86 }),
    );
    roof.position.set(data.pos[0], h + 0.11, data.pos[2]);
    roof.castShadow = true;
    scene.add(roof);
  }

  if (data.accent && !muted) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, h * 0.54),
      makeMaterial(data.accent, { roughness: 0.62 }),
    );
    panel.position.set(data.pos[0] + w / 2 + 0.03, h * 0.46, data.pos[2]);
    panel.rotation.y = Math.PI / 2;
    scene.add(panel);
  }

  if (data.label) addLabel(scene, data.label, [data.pos[0], h + 1.5, data.pos[2]], '#85B7EB', [1.35, 0.4, 1]);
}

function addCityStructures(scene) {
  smartcitySceneData.buildings.forEach((building) => addBuilding(scene, building, !building.label));
  smartcitySceneData.skybridges.forEach((bridge) => {
    const [w, h, d] = bridge.size;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      makeMaterial(0x70c6e6, { metalness: 0.6, roughness: 0.12, transparent: true, opacity: 0.72 }),
    );
    mesh.position.set(...bridge.pos);
    mesh.castShadow = true;
    scene.add(mesh);
  });
}

function addTree(scene, [x, z], scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 0.7 * scale, 7),
    makeMaterial(0x6b4423, { roughness: 0.82 }),
  );
  trunk.position.set(x, 0.35 * scale, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.55 * scale, 1.35 * scale, 9),
    makeMaterial(0x2f8f49, { roughness: 0.84 }),
  );
  crown.position.set(x, 1.12 * scale, z);
  crown.castShadow = true;
  scene.add(crown);
}

function addBench(scene, bench) {
  const group = new THREE.Group();
  const woodMat = makeMaterial(0x8a5a2b, { roughness: 0.78 });
  const metalMat = makeMaterial(0x475569, { metalness: 0.25, roughness: 0.55 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.42), woodMat);
  seat.position.y = 0.42;
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.36), woodMat);
  back.position.set(0, 0.78, -0.28);
  back.rotation.x = -0.18;
  group.add(back);

  [-0.62, 0.62].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.08), metalMat);
    leg.position.set(x, 0.2, 0.12);
    group.add(leg);
    const backLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.08), metalMat);
    backLeg.position.set(x, 0.36, -0.28);
    group.add(backLeg);
  });

  group.position.set(...bench.pos);
  group.rotation.y = bench.rot || 0;
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(group);
  addLabel(scene, bench.label, [bench.pos[0], 1.45, bench.pos[2]], '#1D9E75', [1.65, 0.42, 1]);
}

function addLandscape(scene) {
  smartcitySceneData.trees.forEach((tree, i) => addTree(scene, tree, i < 3 ? 0.72 : 1));
  smartcitySceneData.parkBenches?.forEach((bench) => addBench(scene, bench));

  const parking = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), makeMaterial(0x55606b, { roughness: 0.92 }));
  parking.rotation.x = -Math.PI / 2;
  parking.position.set(13, 0.065, 13);
  scene.add(parking);
  addLabel(scene, 'Bãi đỗ xe', [13, 1.1, 13], '#185FA5', [1.6, 0.45, 1]);
}

function addWheel(group, x, y, z) {
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.14, 10),
    makeMaterial(0x16191d, { roughness: 0.6 }),
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  group.add(wheel);
}

function createVehicle(vehicle) {
  const group = new THREE.Group();
  const mat = makeMaterial(vehicle.color, { metalness: 0.35, roughness: 0.48 });
  const isBus = vehicle.type === 'bus';
  const isMoto = vehicle.type === 'moto';
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(isMoto ? 0.36 : isBus ? 2.1 : 1.7, isMoto ? 0.42 : 0.58, isMoto ? 1.5 : isBus ? 5.2 : 3.5),
    mat,
  );
  body.position.y = isMoto ? 0.42 : 0.5;
  body.castShadow = true;
  group.add(body);

  if (!isMoto) {
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(isBus ? 1.85 : 1.45, 0.45, isBus ? 3.8 : 1.55),
      makeMaterial(0xcfeeff, { metalness: 0.15, roughness: 0.22, transparent: true, opacity: 0.85 }),
    );
    cabin.position.set(0, 0.9, isBus ? -0.2 : -0.15);
    group.add(cabin);
  }

  if (isMoto) {
    addWheel(group, 0, 0.22, 0.45);
    addWheel(group, 0, 0.22, -0.45);
  } else {
    const wx = isBus ? 0.95 : 0.75;
    const wz = isBus ? 1.95 : 1.2;
    [[-wx, 0.22, wz], [wx, 0.22, wz], [-wx, 0.22, -wz], [wx, 0.22, -wz]].forEach(([x, y, z]) => addWheel(group, x, y, z));
  }

  group.position.set(vehicle.x, 0, vehicle.z);
  group.rotation.y = vehicle.rot;
  getLayer('traffic').add(group);
  animatedObjects.push({ type: 'vehicle', mesh: group, ...vehicle, pos: vehicle.axis === 'z' ? vehicle.z : vehicle.x });
}

function addTrafficLight(light) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.3, 8), makeMaterial(0x424852, { metalness: 0.45 }));
  pole.position.y = 1.65;
  group.add(pole);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.92, 0.28), makeMaterial(0x202329));
  housing.position.y = 3.1;
  group.add(housing);
  const bulbs = [0xff2828, 0xffcc33, 0x25dd62].map((color, i) => {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x111111, emissiveIntensity: 0.08 }),
    );
    bulb.position.set(0, 3.35 - i * 0.28, 0.15);
    bulb.userData.signalColor = color;
    group.add(bulb);
    return bulb;
  });
  group.position.set(light.x, 0, light.z);
  group.rotation.y = light.rot;
  getLayer('traffic').add(group);
  getLayer('security').add(addCoverageCone([light.x, 2.9, light.z], light.rot + Math.PI));
  animatedObjects.push({ type: 'trafficLight', bulbs });
}

function addCoverageCone(pos, rotation = 0, radius = 2.35) {
  const spread = Math.PI / 5.4;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  for (let i = 0; i <= 18; i++) {
    const angle = -spread + (spread * 2 * i) / 18;
    shape.lineTo(Math.sin(angle) * radius, Math.cos(angle) * radius);
  }
  shape.lineTo(0, 0);

  const material = new THREE.MeshBasicMaterial({
    color: 0x85b7eb,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  material.userData.baseOpacity = material.opacity;

  const fan = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  fan.position.set(pos[0], Math.min(Math.max(pos[1] * 0.18, 0.75), 2.35), pos[2]);
  fan.rotation.set(-Math.PI / 2, 0, rotation);
  fan.renderOrder = 2;
  return fan;
}

function addCamera(cam) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.7, 7), makeMaterial(0x6b7280, { metalness: 0.4 }));
  pole.position.y = 0.35;
  group.add(pole);
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.14, 0.18),
    makeMaterial(0x378add, { emissive: 0x185fa5, emissiveIntensity: 0.28 }),
  );
  body.position.y = 0.78;
  group.add(body);
  group.position.set(...cam.pos);
  group.rotation.y = cam.rot || 0;
  getLayer('security').add(group);
  getLayer('security').add(addCoverageCone(cam.pos, cam.rot || 0));
}

function addTrafficLayer() {
  smartcitySceneData.vehicles.forEach(createVehicle);
  smartcitySceneData.trafficLights.forEach(addTrafficLight);
  smartcitySceneData.densityMarkers.forEach((marker) => addStatusMarker(marker, 'traffic'));
}

function addSecurityLayer() {
  smartcitySceneData.cameras.forEach(addCamera);
  const unit = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.25, 16), makeMaterial(0x1d9e75));
  base.position.y = 0.14;
  unit.add(base);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), makeMaterial(0xffffff));
  mast.position.y = 0.84;
  unit.add(mast);
  unit.position.set(2, 0, 3);
  getLayer('security').add(unit);
  addLabel(getLayer('security'), 'Đội xử lý', [2, 2.1, 3], '#1D9E75', [1.7, 0.45, 1]);
}

function addEnvironmentLayer() {
  smartcitySceneData.sensors.forEach((sensor) => {
    const station = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 8), makeMaterial(0x46616f));
    pole.position.y = 0.9;
    station.add(pole);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), makeMaterial(0x1d9e75, { emissive: 0x1d9e75, emissiveIntensity: 0.22 }));
    head.position.y = 1.9;
    station.add(head);
    station.position.set(sensor.pos[0], 0, sensor.pos[2]);
    getLayer('environment').add(station);
    addLabel(getLayer('environment'), `${sensor.label}: ${sensor.value}`, [sensor.pos[0], 2.9, sensor.pos[2]], '#1D9E75', [2.5, 0.62, 1]);
  });
}

function addUtilitiesLayer() {
  const colors = { power: 0xef9f27, water: 0x2d9cdb, lighting: 0xffdd58, iot: 0x85b7eb };
  smartcitySceneData.utilities.forEach((utility) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.1, 1.15), makeMaterial(colors[utility.type] || 0x85b7eb));
    body.position.y = 0.55;
    group.add(body);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.15, 8), makeMaterial(0xffffff));
    antenna.position.y = 1.68;
    group.add(antenna);
    const statusColor = utility.status === 'warning' ? 0xef9f27 : 0x1d9e75;
    const status = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 10),
      new THREE.MeshBasicMaterial({ color: statusColor }),
    );
    status.position.set(0.48, 1.24, 0.48);
    group.add(status);
    group.position.set(...utility.pos);
    getLayer('utilities').add(group);
    addLabel(getLayer('utilities'), utility.label, [utility.pos[0], 2.65, utility.pos[2]], utility.status === 'warning' ? '#EF9F27' : '#1D9E75', [2, 0.5, 1]);
  });
}

function addStatusMarker(marker, layerName = marker.group) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.04, 8, 28),
    new THREE.MeshBasicMaterial({ color: marker.color }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), new THREE.MeshBasicMaterial({ color: marker.color }));
  core.position.y = 0.18;
  group.add(core);
  group.position.set(...marker.pos);
  getLayer(layerName).add(group);
  addLabel(getLayer(layerName), marker.label, [marker.pos[0], marker.pos[1] + 1.35, marker.pos[2]], marker.color, [1.9, 0.5, 1]);
  animatedObjects.push({ type: 'pulseScale', mesh: group, base: 1, amp: 0.18, speed: 2.4 });
}

function addIncidents() {
  smartcitySceneData.incidents.forEach((incident) => addStatusMarker(incident));
}

function addReportsLayer() {
  smartcitySceneData.reportBars.forEach((bar) => {
    const group = new THREE.Group();
    const column = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, bar.height, 1.4),
      makeMaterial(bar.color, { emissive: bar.color, emissiveIntensity: 0.08 }),
    );
    column.position.y = bar.height / 2;
    group.add(column);
    group.position.set(...bar.pos);
    getLayer('reports').add(group);
    addLabel(getLayer('reports'), bar.label, [bar.pos[0], bar.height + 1.2, bar.pos[2]], bar.color, [1.65, 0.44, 1]);
  });
}

function buildCity(scene) {
  addGround(scene);
  addRoadNetwork(scene);
  addCityStructures(scene);
  addLandscape(scene);
  addTrafficLayer(scene);
  addSecurityLayer(scene);
  addEnvironmentLayer(scene);
  addUtilitiesLayer(scene);
  addIncidents(scene);
  addReportsLayer(scene);

  groupKeys.forEach((key) => {
    const group = getLayer(key);
    scene.add(group);
    emphasisTargets.set(group, { targetOpacity: 0.62, targetScale: 1 });
  });
}

function setupRenderer(container) {
  const w = container.clientWidth || 640;
  const h = container.clientHeight || 480;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.45));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);
  rendererEl = renderer.domElement;
  return { renderer, w, h };
}

function setupEnvironment(scene, renderer) {
  pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
}

function setGroupEmphasis(groupName, emphasized) {
  const group = getLayer(groupName);
  const target = emphasisTargets.get(group);
  if (!target) return;
  target.targetOpacity = emphasized ? 1 : 0.48;
  target.targetScale = emphasized ? 1.035 : 1;
}

function setReportOverlaysVisible(visible) {
  const group = getLayer('reports');
  group.visible = visible;
}

function applyLayerFocus(pageId) {
  const focused = groupKeys.includes(pageId) ? pageId : null;
  setGroupEmphasis('traffic', pageId === 'traffic' || pageId === 'security');
  setGroupEmphasis('security', pageId === 'security' || pageId === 'traffic');
  setGroupEmphasis('environment', pageId === 'environment');
  setGroupEmphasis('utilities', pageId === 'utilities');
  setGroupEmphasis('reports', pageId === 'reports');
  setReportOverlaysVisible(pageId === 'reports');

  if (!focused && pageId === 'overview') {
    groupKeys.forEach((key) => setGroupEmphasis(key, key !== 'reports'));
    setReportOverlaysVisible(false);
  }
}

function updateGroupMaterials(delta) {
  emphasisTargets.forEach((target, group) => {
    group.scale.lerp(new THREE.Vector3(target.targetScale, target.targetScale, target.targetScale), Math.min(1, delta * 5));
    group.traverse((obj) => {
      if (!obj.material || obj.isSprite) return;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((material) => {
        if (material.opacity === undefined) return;
        const baseOpacity = material.userData.baseOpacity ?? 1;
        const desiredOpacity = baseOpacity * target.targetOpacity;
        if (material.transparent || desiredOpacity < 1) material.transparent = true;
        material.opacity += (desiredOpacity - material.opacity) * Math.min(1, delta * 4);
      });
    });
  });
}

function updateAnimations(clock, delta) {
  const t = clock.getElapsedTime();
  animatedObjects.forEach((item) => {
    if (item.type === 'trafficLight') {
      const phase = Math.floor(t / 4) % 3;
      item.bulbs.forEach((bulb, i) => {
        const on = i === phase;
        bulb.material.emissive.setHex(on ? bulb.userData.signalColor : 0x111111);
        bulb.material.emissiveIntensity = on ? 0.95 : 0.06;
      });
      return;
    }

    if (item.type === 'vehicle') {
      const phase = Math.floor(t / 4) % 3;
      const redForNorthSouth = phase === 0;
      const approachingCenter = Math.abs(item.pos) < (item.stopRange || 0);
      const shouldStop = approachingCenter && ((item.axis === 'z' && redForNorthSouth) || (item.axis === 'x' && !redForNorthSouth));
      if (!shouldStop) {
        const dir = item.axis === 'z'
          ? (item.rot === 0 ? 1 : -1)
          : (item.rot === Math.PI / 2 ? 1 : -1);
        item.pos += item.speed * dir * delta * 62;
        if (item.pos > item.max) item.pos = item.min;
        if (item.pos < item.min) item.pos = item.max;
        if (item.axis === 'z') item.mesh.position.z = item.pos;
        else item.mesh.position.x = item.pos;
      }
      return;
    }

    if (item.type === 'pulseScale') {
      item.mesh.scale.setScalar(item.base + Math.sin(t * item.speed) * item.amp);
      return;
    }

    if (item.type === 'pulseOpacity') {
      item.mesh.material.opacity = item.base + Math.sin(t * item.speed) * item.amp;
    }
  });
}

function createScene(container, pageId) {
  showSceneLoading(container, true);
  const { renderer, w, h } = setupRenderer(container);
  const scene = new THREE.Scene();
  setupEnvironment(scene, renderer);
  setupLighting(scene, renderer);

  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 220);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2.08;
  controls.minDistance = 8;
  controls.maxDistance = 74;
  applyCameraPreset(camera, controls, pageId);

  buildCity(scene);
  applyLayerFocus(pageId);
  showSceneLoading(container, false);
  setSceneHint(container, smartcitySceneData.cameraPresets[pageId]?.hint || smartcitySceneData.cameraPresets.overview.hint);

  const clock = new THREE.Clock();
  let frameId;
  function animate() {
    frameId = requestAnimationFrame(animate);
    const delta = Math.min(0.05, clock.getDelta());
    updateAnimations(clock, delta);
    updateGroupMaterials(delta);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const ro = new ResizeObserver(() => sceneRefs?.onResize?.());
  ro.observe(container);

  sceneRefs = {
    camera,
    controls,
    container,
    renderer,
    onResize() {
      const host = rendererEl?.parentElement || container;
      const nw = host.clientWidth || 640;
      const nh = host.clientHeight || 480;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    },
    dispose() {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      controls.dispose();
      disposeSceneEnvironment();
      pmrem?.dispose();
      pmrem = null;
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((material) => {
            material.map?.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
      rendererEl?.remove();
      rendererEl = null;
      sceneRefs = null;
      layerGroups.clear();
      emphasisTargets.clear();
      animatedObjects.length = 0;
    },
  };

  return sceneRefs;
}

export function applyPageView(pageId, container = sceneRefs?.container) {
  if (!sceneRefs) return;
  currentPage = pageId;
  applyLayerFocus(pageId);
  tweenCamera(sceneRefs.camera, sceneRefs.controls, pageId).then((hint) => {
    if (hint && currentPage === pageId) setSceneHint(container || sceneRefs.container, hint);
  });
}

export function initSmartcityScene(pageId) {
  currentPage = pageId;
  const container = document.querySelector(`#page-${pageId} [data-mount="smartcity-scene"]`);
  if (!container) return;

  if (activeScene) {
    container.appendChild(rendererEl);
    activeScene.container = container;
    activeScene.onResize?.();
    applyPageView(pageId, container);
    return;
  }

  try {
    activeScene = createScene(container, pageId);
  } catch (err) {
    console.error('[smartcity-scene] Không khởi tạo được mô hình 3D:', err);
    showSceneLoading(container, false);
    activeScene = null;
  }
}

export function disposeSmartcityScene() {
  activeScene?.dispose();
  activeScene = null;
}
