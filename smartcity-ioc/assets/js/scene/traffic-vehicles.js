import * as THREE from 'three';
import { trafficSceneData } from '../data/traffic-scene.js';

function addWheel(group, x, y, z) {
  const w = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.14, 10),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
  );
  w.rotation.z = Math.PI / 2;
  w.position.set(x, y, z);
  w.castShadow = true;
  group.add(w);
}

export function createCar(color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 3.6), mat);
  body.position.y = 0.48;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 1.7), mat);
  cabin.position.set(0, 0.88, -0.2);
  cabin.castShadow = true;
  group.add(cabin);

  [[-0.75, 0.22, 1.2], [0.75, 0.22, 1.2], [-0.75, 0.22, -1.2], [0.75, 0.22, -1.2]].forEach(([x, y, z]) => addWheel(group, x, y, z));
  return group;
}

export function createMoto(color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 1.5), mat);
  body.position.y = 0.42;
  body.castShadow = true;
  group.add(body);
  addWheel(group, 0, 0.22, 0.45);
  addWheel(group, 0, 0.22, -0.45);
  return group;
}

export function populateVehicles(scene) {
  return trafficSceneData.vehicles.map((v) => {
    const mesh = v.type === 'car' ? createCar(v.color) : createMoto(v.color);
    mesh.position.set(v.x, 0, v.z);
    mesh.rotation.y = v.rot;
    scene.add(mesh);
    return { mesh, ...v, pos: v.axis === 'z' ? v.z : v.x };
  });
}

export function updateVehicles(movers) {
  movers.forEach((m) => {
    const dir = m.axis === 'z'
      ? (m.rot === 0 ? 1 : -1)
      : (m.rot === Math.PI / 2 ? 1 : -1);
    m.pos += m.speed * dir;
    if (m.pos > m.max) m.pos = m.min;
    if (m.pos < m.min) m.pos = m.max;
    if (m.axis === 'z') m.mesh.position.z = m.pos;
    else m.mesh.position.x = m.pos;
  });
}
