import * as THREE from 'three';

function makeMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.05, ...options });
}

function addWheel(group, x, y, z) {
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.14, 10),
    makeMaterial(0x16191d, { roughness: 0.6 }),
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  group.add(wheel);
  return wheel;
}

function addMotoWheel(group, z) {
  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.07, 8, 20),
    makeMaterial(0x101317, { roughness: 0.72 }),
  );
  tire.rotation.y = Math.PI / 2;
  tire.position.set(0, 0.28, z);
  tire.castShadow = true;
  group.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.055, 14),
    makeMaterial(0xc8d1d6, { metalness: 0.42, roughness: 0.34 }),
  );
  rim.rotation.z = Math.PI / 2;
  rim.position.set(0, 0.28, z);
  rim.castShadow = true;
  group.add(rim);
}

function createScooterModel(group, color) {
  const paint = makeMaterial(color, { metalness: 0.28, roughness: 0.42 });
  const dark = makeMaterial(0x111418, { roughness: 0.76 });
  const metal = makeMaterial(0xd7e0e5, { metalness: 0.55, roughness: 0.26 });
  const glass = makeMaterial(0xd9f4ff, { metalness: 0.12, roughness: 0.16, emissive: 0x85b7eb, emissiveIntensity: 0.16 });

  addMotoWheel(group, 0.58);
  addMotoWheel(group, -0.58);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.86), dark);
  floor.position.set(0, 0.42, -0.08);
  floor.castShadow = true;
  group.add(floor);

  const frontFairing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.72, 0.28), paint);
  frontFairing.position.set(0, 0.82, 0.43);
  frontFairing.rotation.x = -0.22;
  frontFairing.castShadow = true;
  group.add(frontFairing);

  const frontFender = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.42), paint);
  frontFender.position.set(0, 0.54, 0.62);
  frontFender.rotation.x = -0.18;
  frontFender.castShadow = true;
  group.add(frontFender);

  const rearBody = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.58), paint);
  rearBody.position.set(0, 0.68, -0.43);
  rearBody.rotation.x = 0.08;
  rearBody.castShadow = true;
  group.add(rearBody);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.62), dark);
  seat.position.set(0, 0.96, -0.34);
  seat.rotation.x = 0.05;
  seat.castShadow = true;
  group.add(seat);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.25), paint);
  head.position.set(0, 1.2, 0.62);
  head.rotation.x = -0.08;
  head.castShadow = true;
  group.add(head);

  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.035), glass);
  lamp.position.set(0, 1.2, 0.755);
  group.add(lamp);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.84, 8), metal);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 1.28, 0.62);
  handlebar.castShadow = true;
  group.add(handlebar);

  [-1, 1].forEach((side) => {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8), dark);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(side * 0.49, 1.28, 0.62);
    group.add(grip);

    const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.32, 6), metal);
    mirrorStem.rotation.z = side * 0.46;
    mirrorStem.position.set(side * 0.31, 1.43, 0.58);
    group.add(mirrorStem);

    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.035), dark);
    mirror.position.set(side * 0.42, 1.56, 0.57);
    mirror.rotation.y = side * 0.16;
    group.add(mirror);
  });

  const tailLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.07, 0.035),
    makeMaterial(0xe24b4a, { emissive: 0xe24b4a, emissiveIntensity: 0.18, roughness: 0.36 }),
  );
  tailLight.position.set(0, 0.82, -0.745);
  group.add(tailLight);
}

function addLimbBetween(group, from, to, radius, material) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const limb = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material);
  limb.position.copy(midpoint);
  limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  limb.castShadow = true;
  group.add(limb);
  return limb;
}

function createMotoRider(group, color) {
  const jacket = makeMaterial(0x26384a, { roughness: 0.68 });
  const pants = makeMaterial(0x171b21, { roughness: 0.78 });
  const skin = makeMaterial(0xd6a56f, { roughness: 0.54 });
  const helmet = makeMaterial(color, { metalness: 0.18, roughness: 0.36 });
  const visor = makeMaterial(0x22313f, { metalness: 0.2, roughness: 0.18 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.26), jacket);
  torso.position.set(0, 1.24, -0.12);
  torso.rotation.x = -0.52;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), skin);
  head.position.set(0, 1.58, 0.04);
  head.castShadow = true;
  group.add(head);

  const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), helmet);
  helmetShell.position.set(0, 1.62, 0.04);
  helmetShell.scale.set(1, 0.86, 1.08);
  helmetShell.castShadow = true;
  group.add(helmetShell);

  const helmetVisor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.055, 0.035), visor);
  helmetVisor.position.set(0, 1.63, 0.215);
  group.add(helmetVisor);

  [-1, 1].forEach((side) => {
    const shoulder = [side * 0.17, 1.37, -0.02];
    const grip = [side * 0.49, 1.28, 0.62];
    addLimbBetween(group, shoulder, grip, 0.035, jacket);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), skin);
    hand.position.set(...grip);
    hand.castShadow = true;
    group.add(hand);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.46, 8), pants);
    thigh.rotation.z = side * 0.25;
    thigh.rotation.x = Math.PI / 2.1;
    thigh.position.set(side * 0.12, 0.94, -0.16);
    thigh.castShadow = true;
    group.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.048, 0.42, 8), pants);
    shin.rotation.z = side * 0.18;
    shin.rotation.x = Math.PI / 2.7;
    shin.position.set(side * 0.16, 0.72, 0.14);
    shin.castShadow = true;
    group.add(shin);
  });
}

export function addProceduralVehicleModel(group, vehicle) {
  const mat = makeMaterial(vehicle.color, { metalness: 0.35, roughness: 0.48 });
  const isBus = vehicle.type === 'bus';
  const isMoto = vehicle.type === 'moto';

  if (isMoto) {
    createScooterModel(group, vehicle.color);
    createMotoRider(group, vehicle.color);
    return;
  }

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(isBus ? 2.1 : 1.7, 0.58, isBus ? 5.2 : 3.5),
    mat,
  );
  body.position.y = 0.5;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(isBus ? 1.85 : 1.45, 0.45, isBus ? 3.8 : 1.55),
    makeMaterial(0xcfeeff, { metalness: 0.15, roughness: 0.22, transparent: true, opacity: 0.85 }),
  );
  cabin.position.set(0, 0.9, isBus ? -0.2 : -0.15);
  group.add(cabin);

  const wx = isBus ? 0.95 : 0.75;
  const wz = isBus ? 1.95 : 1.2;
  [[-wx, 0.22, wz], [wx, 0.22, wz], [-wx, 0.22, -wz], [wx, 0.22, -wz]].forEach(([x, y, z]) => addWheel(group, x, y, z));
}
