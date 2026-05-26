import * as THREE from 'three';

const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff });
const YELLOW = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

function addDashes(scene, axis, offset, from, to, skipCenter) {
  for (let i = from; i < to; i += 1.6) {
    if (skipCenter && Math.abs(i) < 4.5) continue;
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.9), WHITE);
    dash.rotation.x = -Math.PI / 2;
    if (axis === 'z') dash.position.set(offset, 0.025, i);
    else dash.position.set(i, 0.025, offset);
    scene.add(dash);
  }
}

function addCrosswalk(scene, cx, cz, alongX) {
  for (let i = 0; i < 5; i++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(alongX ? 0.35 : 2.5, alongX ? 2.5 : 0.35), WHITE);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(alongX ? cx + i * 0.45 - 0.9 : cx, 0.026, alongX ? cz : cz + i * 0.45 - 0.9);
    scene.add(stripe);
  }
}

export function createStreet(scene) {
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x5a9a50, roughness: 0.9 }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  const asphaltH = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 9),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.92 }),
  );
  asphaltH.rotation.x = -Math.PI / 2;
  asphaltH.position.y = 0.01;
  asphaltH.receiveShadow = true;
  scene.add(asphaltH);

  const asphaltV = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 44),
    new THREE.MeshStandardMaterial({ color: 0x383838, roughness: 0.92 }),
  );
  asphaltV.rotation.x = -Math.PI / 2;
  asphaltV.position.y = 0.012;
  asphaltV.receiveShadow = true;
  scene.add(asphaltV);

  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xb0b0a8, roughness: 0.95 });
  [[0, -6.2, 44, 1.5], [0, 6.2, 44, 1.5], [-6.2, 0, 1.5, 44], [6.2, 0, 1.5, 44]].forEach(([x, z, w, d]) => {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(w, d), sidewalkMat);
    sw.rotation.x = -Math.PI / 2;
    sw.position.set(x, 0.008, z);
    sw.receiveShadow = true;
    scene.add(sw);
  });

  [-2.2, 2.2].forEach((off) => {
    addDashes(scene, 'z', off, -20, 20, true);
    addDashes(scene, 'x', off, -20, 20, true);
  });

  const centerLineH = new THREE.Mesh(new THREE.PlaneGeometry(44, 0.12), YELLOW);
  centerLineH.rotation.x = -Math.PI / 2;
  centerLineH.position.y = 0.022;
  scene.add(centerLineH);
  const centerLineV = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 44), YELLOW);
  centerLineV.rotation.x = -Math.PI / 2;
  centerLineV.position.y = 0.023;
  scene.add(centerLineV);

  addCrosswalk(scene, -3.8, -4.2, true);
  addCrosswalk(scene, 3.8, -4.2, true);
  addCrosswalk(scene, -4.2, 3.8, false);
  addCrosswalk(scene, -4.2, -3.8, false);

  [[-12, -12], [12, -12], [12, 12], [-12, 12]].forEach(([x, z]) => {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 3),
      new THREE.MeshStandardMaterial({ color: 0xd8dce0, roughness: 0.7 }),
    );
    b.position.set(x, 1.25, z);
    b.castShadow = true;
    b.receiveShadow = true;
    scene.add(b);
  });

  return { asphaltH, asphaltV };
}

export function addTrafficLights(scene, configs) {
  return configs.map(({ x, z, rot }) => {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 }),
    );
    pole.position.y = 1.6;
    pole.castShadow = true;
    group.add(pole);

    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.9, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x222222 }),
    );
    housing.position.y = 3.1;
    group.add(housing);

    const bulbs = [0xff2020, 0xffcc00, 0x20dd50].map((c, i) => {
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x111111, emissiveIntensity: 0.1 }),
      );
      b.position.set(0, 3.35 - i * 0.28, 0.14);
      b.userData.signalColor = c;
      group.add(b);
      return b;
    });

    group.position.set(x, 0, z);
    group.rotation.y = rot;
    scene.add(group);
    return bulbs;
  });
}

export function updateTrafficLights(allBulbs, t) {
  const phase = Math.floor(t / 4) % 3;
  allBulbs.forEach((bulbs) => {
    bulbs.forEach((b, i) => {
      const on = i === phase;
      b.material.emissive.setHex(on ? b.userData.signalColor : 0x111111);
      b.material.emissiveIntensity = on ? 0.9 : 0.05;
    });
  });
}
