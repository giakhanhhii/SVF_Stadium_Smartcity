import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { buildingSceneData } from '../data/building-scene.js';

function addSkyline(scene) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x6ab8d8,
    transparent: true,
    opacity: 0.62,
    metalness: 0.65,
    roughness: 0.12,
    envMapIntensity: 1.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.08,
  });
  for (let i = 0; i < 20; i++) {
    const bh = 6 + Math.random() * 16;
    const bw = 2 + Math.random() * 3;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bw), mat);
    const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 34 + Math.random() * 10;
    mesh.position.set(Math.cos(angle) * dist, bh / 2, Math.sin(angle) * dist);
    scene.add(mesh);
  }
}

export function createEnvironment(scene, renderer) {
  scene.background = new THREE.Color(0xb8daf0);
  scene.fog = new THREE.Fog(0xc8e4f8, 55, 95);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x6aaa58, roughness: 0.88 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  buildingSceneData.grassPatches.forEach(([x, z]) => {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(2.2 + Math.random() * 0.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x5cb850, roughness: 0.9 }),
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, 0.02, z);
    patch.receiveShadow = true;
    scene.add(patch);
  });

  const { water, island } = buildingSceneData;
  const [ww, wh] = water.size;
  const waterGeo = new THREE.PlaneGeometry(ww, wh);
  const px = renderer.getPixelRatio();
  const rw = Math.floor(renderer.domElement.width * px);
  const rh = Math.floor(renderer.domElement.height * px);

  const reflector = new Reflector(waterGeo, {
    clipBias: 0.003,
    textureWidth: Math.max(rw, 512),
    textureHeight: Math.max(rh, 512),
    color: 0xa8d4e8,
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.set(water.pos[0], 0.04, water.pos[2]);
  scene.add(reflector);

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

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 4),
    new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.95 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.015, 11);
  road.receiveShadow = true;
  scene.add(road);

  addSkyline(scene);

  return { reflector, ripple };
}

export function disposeEnvironment(reflector) {
  if (reflector?.getRenderTarget) {
    reflector.getRenderTarget()?.dispose();
  }
}
