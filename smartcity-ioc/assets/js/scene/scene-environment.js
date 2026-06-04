import * as THREE from 'three';
import { buildingSceneData } from '../data/building-scene.js';

function addSkyline(scene) {
  const buildings = buildingSceneData.skyline;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshLambertMaterial({
    color: 0x78bdd7,
    transparent: true,
    opacity: 0.68,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, buildings.length);
  mesh.receiveShadow = false;
  mesh.castShadow = false;

  const matrix = new THREE.Matrix4();
  buildings.forEach((b, i) => {
    matrix.compose(
      new THREE.Vector3(b.pos[0], b.size[1] / 2, b.pos[2]),
      new THREE.Quaternion(),
      new THREE.Vector3(b.size[0], b.size[1], b.size[2]),
    );
    mesh.setMatrixAt(i, matrix);
  });
  scene.add(mesh);
}

function addGrassPatches(scene) {
  const patches = buildingSceneData.grassPatches;
  const geo = new THREE.CircleGeometry(1, 12);
  const mat = new THREE.MeshStandardMaterial({ color: 0x5cb850, roughness: 0.9 });
  const mesh = new THREE.InstancedMesh(geo, mat, patches.length);
  mesh.receiveShadow = true;

  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  patches.forEach(([x, z, radius = 2.4], i) => {
    matrix.compose(
      new THREE.Vector3(x, 0.02, z),
      rotation,
      new THREE.Vector3(radius, radius, radius),
    );
    mesh.setMatrixAt(i, matrix);
  });
  scene.add(mesh);
}

function addSurroundingBuildings(scene) {
  const buildings = buildingSceneData.surroundingBuildings;
  if (!buildings?.length) return;

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshLambertMaterial({
    color: 0x7fb6c9,
    transparent: true,
    opacity: 0.78,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, buildings.length);
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  const matrix = new THREE.Matrix4();
  buildings.forEach((b, i) => {
    matrix.compose(
      new THREE.Vector3(b.pos[0], b.size[1] / 2, b.pos[2]),
      new THREE.Quaternion(),
      new THREE.Vector3(b.size[0], b.size[1], b.size[2]),
    );
    mesh.setMatrixAt(i, matrix);
  });
  scene.add(mesh);
}

function addPath(scene, data) {
  if (!data) return;
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(data.size[0], data.size[1]),
    new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.95 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.rotation.z = data.rotation || 0;
  road.position.set(data.pos[0], 0.015, data.pos[2]);
  road.receiveShadow = true;
  scene.add(road);
}

function addPaths(scene) {
  for (const path of buildingSceneData.paths) {
    addPath(scene, path);
  }
}

export function createEnvironment(scene) {
  scene.background = new THREE.Color(0xb8daf0);
  scene.fog = new THREE.Fog(0xc8e4f8, 72, 125);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(92, 92),
    new THREE.MeshStandardMaterial({ color: 0x8fcc73, roughness: 0.9 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  addGrassPatches(scene);

  const { water, island } = buildingSceneData;
  const [ww, wh] = water.size;
  const waterGeo = new THREE.PlaneGeometry(ww, wh);

  const waterBase = new THREE.Mesh(
    waterGeo,
    new THREE.MeshStandardMaterial({
      color: 0x8dd3ec,
      metalness: 0.35,
      roughness: 0.22,
      transparent: true,
      opacity: 0.74,
    }),
  );
  waterBase.rotation.x = -Math.PI / 2;
  waterBase.position.set(water.pos[0], 0.04, water.pos[2]);
  waterBase.receiveShadow = true;
  scene.add(waterBase);

  const ripple = new THREE.Mesh(
    waterGeo.clone(),
    new THREE.MeshStandardMaterial({
      color: 0x6ec8e8,
      emissive: 0xffffff,
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 0.22,
      metalness: 0.7,
      roughness: 0.08,
    }),
  );
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(water.pos[0], 0.07, water.pos[2]);
  scene.add(ripple);

  const islandGeo = new THREE.CylinderGeometry(island.radius, island.radius * 1.1, 0.35, 16);
  const islandMesh = new THREE.Mesh(
    islandGeo,
    new THREE.MeshStandardMaterial({ color: 0x52b854, roughness: 0.88 }),
  );
  islandMesh.position.set(island.pos[0], 0.18, island.pos[2]);
  islandMesh.castShadow = true;
  islandMesh.receiveShadow = true;
  scene.add(islandMesh);

  addPaths(scene);
  addSurroundingBuildings(scene);

  addSkyline(scene);

  return { reflector: null, ripple };
}

export function disposeEnvironment(reflector) {
  if (reflector?.getRenderTarget) {
    reflector.getRenderTarget()?.dispose();
  }
}
