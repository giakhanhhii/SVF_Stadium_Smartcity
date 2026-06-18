import * as THREE from 'three';
import { smartcitySceneData } from '../data/smartcity-scene-data.js';
import { trafficSceneData } from '../data/traffic-scene.js';
import { createBuildingMaterials } from './scene-building-materials.js';

function makeMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.05, ...options });
}

function addGround(scene, animatedObjects) {
  scene.background = new THREE.Color(0xb8dcf2);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(132, 132),
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

function addCrosswalkBars(scene, axis, side, roadWidth, intersectionHalfSize) {
  const barCount = 16;
  const barWidth = 0.34;
  const barGap = 0.42;
  const barSpan = Math.min(roadWidth * 0.72, 6.2);
  const start = intersectionHalfSize + 0.65;
  const verticalRoadStart = intersectionHalfSize + 4.2;

  if (axis === 'z') {
    const z = side * (verticalRoadStart + barSpan / 2);
    const startX = -((barCount - 1) * (barWidth + barGap)) / 2;
    for (let i = 0; i < barCount; i += 1) {
      const x = startX + i * (barWidth + barGap);
      addLaneMarking(scene, x, z, barWidth, barSpan);
    }
    return;
  }

  for (let i = 0; i < barCount; i += 1) {
    const offset = side * (start + i * (barWidth + barGap));
    addLaneMarking(scene, offset, 0, barSpan, barWidth);
  }
}

function addSideCrosswalkBars(scene, side, roadWidth, intersectionHalfSize) {
  const barCount = 16;
  const barWidth = 0.34;
  const barGap = 0.48;
  const barSpan = Math.min(roadWidth * 0.72, 6.2);
  const x = side * (intersectionHalfSize + 4.2 + barSpan / 2);
  const start = -((barCount - 1) * (barWidth + barGap)) / 2;

  for (let i = 0; i < barCount; i += 1) {
    const z = start + i * (barWidth + barGap);
    addLaneMarking(scene, x, z, barSpan, barWidth);
  }
}

function addLaneArrow(scene, x, z, rotation, kind) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.35), mat);
  shaft.rotation.x = -Math.PI / 2;
  group.add(shaft);

  const headShape = new THREE.Shape();
  headShape.moveTo(0, 0.52);
  headShape.lineTo(-0.45, -0.18);
  headShape.lineTo(0.45, -0.18);
  headShape.lineTo(0, 0.52);
  const head = new THREE.Mesh(new THREE.ShapeGeometry(headShape), mat);
  head.rotation.x = -Math.PI / 2;
  head.position.z = 0.86;
  group.add(head);

  if (kind === 'left') {
    const bend = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.95), mat);
    bend.rotation.x = -Math.PI / 2;
    bend.rotation.z = Math.PI / 2;
    bend.position.set(-0.38, 0, 0.55);
    group.add(bend);
  } else if (kind === 'right') {
    const bend = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.95), mat);
    bend.rotation.x = -Math.PI / 2;
    bend.rotation.z = Math.PI / 2;
    bend.position.set(0.38, 0, 0.55);
    group.add(bend);
  }

  group.position.set(x, 0.09, z);
  group.rotation.y = rotation;
  scene.add(group);
}

function addRoundabout(scene, layout) {
  const roundabout = trafficSceneData.roundabout;
  if (!roundabout?.enabled) return;

  const island = new THREE.Mesh(
    new THREE.CircleGeometry(roundabout.islandRadius, 48),
    makeMaterial(0x54a85f, { roughness: 0.9 }),
  );
  island.rotation.x = -Math.PI / 2;
  island.position.y = 0.11;
  island.receiveShadow = true;
  scene.add(island);

  const curb = new THREE.Mesh(
    new THREE.RingGeometry(roundabout.islandRadius, roundabout.islandRadius + 0.22, 56),
    new THREE.MeshBasicMaterial({ color: 0xe8ecef, side: THREE.DoubleSide }),
  );
  curb.rotation.x = -Math.PI / 2;
  curb.position.y = 0.125;
  scene.add(curb);

  const outerGuide = new THREE.Mesh(
    new THREE.RingGeometry(roundabout.laneRadius + roundabout.laneHalfWidth, roundabout.laneRadius + roundabout.laneHalfWidth + 0.08, 64),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
  );
  outerGuide.rotation.x = -Math.PI / 2;
  outerGuide.position.y = 0.12;
  scene.add(outerGuide);

  const yieldMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  [
    [0, -layout.stopOffset + 1.1, 0, 2.8, 0.14],
    [layout.stopOffset - 1.1, 0, Math.PI / 2, 2.8, 0.14],
    [0, layout.stopOffset - 1.1, Math.PI, 2.8, 0.14],
    [-layout.stopOffset + 1.1, 0, -Math.PI / 2, 2.8, 0.14],
  ].forEach(([x, z, rot, w, h]) => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(w, h), yieldMat);
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = rot;
    line.position.set(x, 0.13, z);
    scene.add(line);
  });

  [
    [roundabout.laneRadius, 0, Math.PI],
    [0, roundabout.laneRadius, -Math.PI / 2],
    [-roundabout.laneRadius, 0, 0],
    [0, -roundabout.laneRadius, Math.PI / 2],
  ].forEach(([x, z, rot]) => addLaneArrow(scene, x, z, rot, 'straight'));
}

function addRoadNetwork(scene) {
  smartcitySceneData.roads.forEach((road) => addRoad(scene, road));
  const eastWestRoad = smartcitySceneData.roads.find((road) => road.id === 'road-main-ew');
  const northSouthRoad = smartcitySceneData.roads.find((road) => road.id === 'road-main-ns');
  const halfEastWest = (eastWestRoad?.size[0] || 46) / 2;
  const halfNorthSouth = (northSouthRoad?.size[1] || 46) / 2;

  const layout = smartcitySceneData.roadLayout || {};
  const laneWidth = layout.laneWidth || 3.5;
  const roadHalf = laneWidth * 2;
  const stop = layout.stopOffset || 10.1;
  const noMarkingZone = roadHalf + 1.2;
  const inner = laneWidth * 0.5;
  const outer = laneWidth * 1.5;

  [-0.18, 0.18].forEach((offset) => {
    addLaneMarking(scene, 0, offset, eastWestRoad?.size[0] || 72, 0.08, 0xffcf4a);
    addLaneMarking(scene, offset, 0, 0.08, northSouthRoad?.size[1] || 72, 0xffcf4a);
  });

  for (let z = -halfNorthSouth + 2; z <= halfNorthSouth - 2; z += 2.2) {
    if (Math.abs(z) > noMarkingZone) {
      addLaneMarking(scene, -laneWidth, z, 0.1, 0.95);
      addLaneMarking(scene, laneWidth, z, 0.1, 0.95);
    }
  }
  for (let x = -halfEastWest + 2; x <= halfEastWest - 2; x += 2.2) {
    if (Math.abs(x) > noMarkingZone) {
      addLaneMarking(scene, x, -laneWidth, 0.95, 0.1);
      addLaneMarking(scene, x, laneWidth, 0.95, 0.1);
    }
  }

  addLaneMarking(scene, 0, -stop, roadHalf * 2, 0.18);
  addLaneMarking(scene, 0, stop, roadHalf * 2, 0.18);
  addLaneMarking(scene, -stop, 0, 0.18, roadHalf * 2);
  addLaneMarking(scene, stop, 0, 0.18, roadHalf * 2);

  const eastWestWidth = eastWestRoad?.size[1] || 8.8;
  const northSouthWidth = northSouthRoad?.size[0] || 8.8;
  addCrosswalkBars(scene, 'z', -1, northSouthWidth, eastWestWidth / 2);
  addCrosswalkBars(scene, 'z', 1, northSouthWidth, eastWestWidth / 2);
  addSideCrosswalkBars(scene, -1, eastWestWidth, northSouthWidth / 2);
  addSideCrosswalkBars(scene, 1, eastWestWidth, northSouthWidth / 2);

  addLaneArrow(scene, -inner, -16, 0, 'left');
  addLaneArrow(scene, -outer, -16, 0, 'right');
  addLaneArrow(scene, inner, 16, Math.PI, 'left');
  addLaneArrow(scene, outer, 16, Math.PI, 'right');
  addLaneArrow(scene, -16, inner, Math.PI / 2, 'left');
  addLaneArrow(scene, -16, outer, Math.PI / 2, 'right');
  addLaneArrow(scene, 16, -inner, -Math.PI / 2, 'left');
  addLaneArrow(scene, 16, -outer, -Math.PI / 2, 'right');
  addRoundabout(scene, layout);
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

  // Building labels were visually floating above the skyline; keep buildings clean.
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
}

function addLandscape(scene) {
  smartcitySceneData.trees.forEach((tree, i) => addTree(scene, tree, i < 3 ? 0.72 : 1));
  smartcitySceneData.parkBenches?.forEach((bench) => addBench(scene, bench));

  const parking = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), makeMaterial(0x55606b, { roughness: 0.92 }));
  parking.rotation.x = -Math.PI / 2;
  parking.position.set(13, 0.065, 13);
  scene.add(parking);
}

export function addProceduralCityFallback(scene, animatedObjects) {
  addGround(scene, animatedObjects);
  addRoadNetwork(scene);
  addCityStructures(scene);
  addLandscape(scene);
}
