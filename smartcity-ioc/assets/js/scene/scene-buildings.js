import * as THREE from 'three';
import { buildingSceneData } from '../data/building-scene.js';
import { createBuildingMaterials } from './scene-building-materials.js';

function addLabel(scene, text, x, y, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(24, 72, 130, 0.88)';
  ctx.beginPath();
  ctx.roundRect(6, 6, 116, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 23);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(x, y, z);
  sprite.scale.set(1.4, 0.5, 1);
  scene.add(sprite);
}

function addAccentPanel(scene, b, bw, bh) {
  if (!b.accent) return;
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, bh * 0.55),
    new THREE.MeshStandardMaterial({ color: b.accent, roughness: 0.6 }),
  );
  panel.position.set(b.pos[0] + bw / 2 + 0.02, bh * 0.45, b.pos[2]);
  panel.rotation.y = Math.PI / 2;
  scene.add(panel);
}

export function addBuilding(scene, b) {
  const [bw, bh, bd] = b.size;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(bw, bh, bd),
    createBuildingMaterials(b, bw, bh, bd),
  );
  mesh.position.set(b.pos[0], bh / 2, b.pos[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  if (b.roof) {
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(bw + 0.15, 0.22, bd + 0.15),
      new THREE.MeshStandardMaterial({ color: 0x52b854, roughness: 0.85 }),
    );
    roof.position.set(b.pos[0], bh + 0.11, b.pos[2]);
    roof.castShadow = true;
    scene.add(roof);
  }

  addAccentPanel(scene, b, bw, bh);

  if (b.label) {
    addLabel(scene, b.label, b.pos[0], bh + 1.8, b.pos[2]);
  }
}

export function addSkybridge(scene, br) {
  const [sw, sh, sd] = br.size;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sw, sh, sd),
    new THREE.MeshPhysicalMaterial({
      color: 0x6ec8e8,
      metalness: 0.75,
      roughness: 0.08,
      transparent: true,
      opacity: 0.78,
      envMapIntensity: 1.3,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
  );
  mesh.position.set(br.pos[0], br.pos[1], br.pos[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

export function addCameraPin(scene, cam) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.4 }),
  );
  pole.position.y = 0.25;
  pole.castShadow = true;
  group.add(pole);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.12, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x378add, emissive: 0x185fa5, emissiveIntensity: 0.3 }),
  );
  body.position.y = 0.55;
  group.add(body);

  group.position.set(...cam.pos);
  scene.add(group);
}

export function addTree(scene, [x, z], scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 0.7 * scale, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b4423 }),
  );
  trunk.position.set(x, 0.35 * scale, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const top = new THREE.Mesh(
    new THREE.ConeGeometry(0.55 * scale, 1.4 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x3d9e4a, roughness: 0.82 }),
  );
  top.position.set(x, 1.15 * scale, z);
  top.castShadow = true;
  scene.add(top);
}

export function addMarker(scene, m, refs) {
  if (m.type === 'incident') {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshBasicMaterial({ color: m.color }),
    );
    sphere.position.set(...m.pos);
    scene.add(sphere);
    refs.incident = sphere;
    return;
  }
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 12),
    new THREE.MeshBasicMaterial({ color: m.color }),
  );
  sphere.position.set(...m.pos);
  scene.add(sphere);
}

export function populateCity(scene) {
  buildingSceneData.buildings.forEach((b) => addBuilding(scene, b));
  buildingSceneData.skybridges.forEach((br) => addSkybridge(scene, br));
  buildingSceneData.cameras.forEach((c) => addCameraPin(scene, c));
  buildingSceneData.trees.forEach((t, i) => addTree(scene, t, i < 3 ? 0.7 : 1));
}
