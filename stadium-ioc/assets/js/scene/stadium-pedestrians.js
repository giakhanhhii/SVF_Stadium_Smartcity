import * as THREE from 'three';

const COUNT = 72;
const WALK_RADIUS_MIN = 390;
const WALK_RADIUS_MAX = 548;
const COLORS = [0x185fa5, 0xa32d2d, 0x0f6e56, 0xba7517, 0xe8edf4, 0x252a34];

let pedestrianRoot = null;
const walkers = [];

function makePerson(color) {
  const person = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.04 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xd8b184, roughness: 0.72 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x12151c, roughness: 0.74 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.05, 3, 8), bodyMat);
  body.position.y = 1.08;
  person.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), headMat);
  head.position.y = 1.95;
  person.add(head);

  [-0.16, 0.16].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.16), darkMat);
    leg.position.set(x, 0.36, 0);
    person.add(leg);
  });

  person.scale.setScalar(1.35);
  return person;
}

function pointAt(radius, angle) {
  return {
    x: Math.sin(angle) * radius,
    z: Math.cos(angle) * radius,
  };
}

export function buildPedestrians(scene) {
  disposePedestrians();
  pedestrianRoot = new THREE.Group();
  pedestrianRoot.name = 'stadium_pedestrians_runtime';
  walkers.length = 0;

  for (let i = 0; i < COUNT; i++) {
    const radius = WALK_RADIUS_MIN + ((i * 37) % 100) / 100 * (WALK_RADIUS_MAX - WALK_RADIUS_MIN);
    const angle = (i / COUNT) * Math.PI * 2 + ((i * 19) % 13) * 0.035;
    const speed = 0.018 + ((i * 7) % 11) * 0.0022;
    const direction = i % 3 === 0 ? -1 : 1;
    const person = makePerson(COLORS[i % COLORS.length]);
    const p = pointAt(radius, angle);
    person.position.set(p.x, 0.1, p.z);
    person.rotation.y = Math.PI - angle + (direction < 0 ? Math.PI : 0);
    pedestrianRoot.add(person);
    walkers.push({ person, radius, angle, speed, direction, phase: i * 0.73 });
  }

  scene.add(pedestrianRoot);
  return pedestrianRoot;
}

export function updatePedestrians(elapsed) {
  if (!pedestrianRoot?.visible) return;
  walkers.forEach((w) => {
    const a = w.angle + elapsed * w.speed * w.direction;
    const p = pointAt(w.radius, a);
    w.person.position.x = p.x;
    w.person.position.z = p.z;
    w.person.position.y = 0.1 + Math.abs(Math.sin(elapsed * 3.2 + w.phase)) * 0.08;
    w.person.rotation.y = Math.PI - a + (w.direction < 0 ? Math.PI : 0);
  });
}

export function setPedestriansVisible(visible = true) {
  if (pedestrianRoot) pedestrianRoot.visible = visible;
}

export function disposePedestrians() {
  if (!pedestrianRoot) return;
  pedestrianRoot.traverse((obj) => {
    obj.geometry?.dispose();
    if (obj.material) {
      (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
    }
  });
  pedestrianRoot.parent?.remove(pedestrianRoot);
  pedestrianRoot = null;
  walkers.length = 0;
}
