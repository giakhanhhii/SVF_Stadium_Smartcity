import * as THREE from 'three';
import { smartcitySceneData } from '../data/smartcity-scene-data.js';
import { trafficSceneData } from '../data/traffic-scene.js';
import { createBuildingMaterials } from './scene-building-materials.js';

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

function addMesh(group, geometry, material, name) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  group.add(mesh);
  return mesh;
}

function addGround(group) {
  const ground = addMesh(
    group,
    new THREE.PlaneGeometry(132, 132),
    makeMaterial(0x78af63, { roughness: 0.94 }),
    'terrain-ground',
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  const park = smartcitySceneData.park;
  const parkMesh = addMesh(
    group,
    new THREE.PlaneGeometry(park.size[0], park.size[1]),
    makeMaterial(0x52a861, { roughness: 0.92 }),
    'terrain-park',
  );
  parkMesh.rotation.x = -Math.PI / 2;
  parkMesh.position.set(park.pos[0], 0.018, park.pos[2]);
  parkMesh.receiveShadow = true;

  const water = smartcitySceneData.water;
  const waterMesh = addMesh(
    group,
    new THREE.PlaneGeometry(water.size[0], water.size[1]),
    makeMaterial(0x72c8e8, {
      metalness: 0.35,
      roughness: 0.18,
      transparent: true,
      opacity: 0.78,
      emissive: 0x1c7ea5,
      emissiveIntensity: 0.08,
    }),
    'terrain-water',
  );
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(water.pos[0], 0.04, water.pos[2]);

  smartcitySceneData.grassPatches.forEach(([x, z, radius = 2.4], index) => {
    const patch = addMesh(
      group,
      new THREE.CircleGeometry(radius, 18),
      makeMaterial(0x63b957, { roughness: 0.9 }),
      `terrain-grass-${index + 1}`,
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, 0.032, z);
  });
}

function addLaneMarking(group, x, z, w, h, color = 0xffffff, name = 'road-marking') {
  const stripe = addMesh(
    group,
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color }),
    name,
  );
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(x, 0.083, z);
}

function addCrosswalkBars(group, axis, side, roadWidth, intersectionHalfSize) {
  const barCount = 16;
  const barWidth = 0.34;
  const barGap = axis === 'z' ? 0.42 : 0.48;
  const barSpan = Math.min(roadWidth * 0.72, 6.2);
  const start = intersectionHalfSize + 0.65;
  const fixed = side * (intersectionHalfSize + 4.2 + barSpan / 2);

  for (let i = 0; i < barCount; i += 1) {
    const offset = -((barCount - 1) * (barWidth + barGap)) / 2 + i * (barWidth + barGap);
    if (axis === 'z') addLaneMarking(group, offset, fixed, barWidth, barSpan, 0xffffff, `road-crosswalk-${axis}-${side}-${i + 1}`);
    else addLaneMarking(group, fixed, offset, barSpan, barWidth, 0xffffff, `road-crosswalk-${axis}-${side}-${i + 1}`);
  }
}

function addLaneArrow(group, x, z, rotation, kind, index) {
  const arrow = new THREE.Group();
  arrow.name = `road-arrow-${kind}-${index}`;
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const shaft = addMesh(arrow, new THREE.PlaneGeometry(0.34, 1.35), mat, 'shaft');
  shaft.rotation.x = -Math.PI / 2;

  const headShape = new THREE.Shape();
  headShape.moveTo(0, 0.52);
  headShape.lineTo(-0.45, -0.18);
  headShape.lineTo(0.45, -0.18);
  headShape.closePath();
  const head = addMesh(arrow, new THREE.ShapeGeometry(headShape), mat, 'head');
  head.rotation.x = -Math.PI / 2;
  head.position.z = 0.86;

  if (kind === 'left' || kind === 'right') {
    const bend = addMesh(arrow, new THREE.PlaneGeometry(0.34, 0.95), mat, 'bend');
    bend.rotation.x = -Math.PI / 2;
    bend.rotation.z = Math.PI / 2;
    bend.position.set(kind === 'left' ? -0.38 : 0.38, 0, 0.55);
  }

  arrow.position.set(x, 0.09, z);
  arrow.rotation.y = rotation;
  group.add(arrow);
}

function addRoundabout(group, layout) {
  const roundabout = trafficSceneData.roundabout;
  if (!roundabout?.enabled) return;

  const island = addMesh(
    group,
    new THREE.CircleGeometry(roundabout.islandRadius, 48),
    makeMaterial(0x54a85f, { roughness: 0.9 }),
    'road-roundabout-island',
  );
  island.rotation.x = -Math.PI / 2;
  island.position.y = 0.11;
  island.receiveShadow = true;

  const curb = addMesh(
    group,
    new THREE.RingGeometry(roundabout.islandRadius, roundabout.islandRadius + 0.22, 56),
    new THREE.MeshBasicMaterial({ color: 0xe8ecef, side: THREE.DoubleSide }),
    'road-roundabout-curb',
  );
  curb.rotation.x = -Math.PI / 2;
  curb.position.y = 0.125;

  const guide = addMesh(
    group,
    new THREE.RingGeometry(
      roundabout.laneRadius + roundabout.laneHalfWidth,
      roundabout.laneRadius + roundabout.laneHalfWidth + 0.08,
      64,
    ),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    'road-roundabout-guide',
  );
  guide.rotation.x = -Math.PI / 2;
  guide.position.y = 0.12;

  [
    [0, -layout.stopOffset + 1.1, 0],
    [layout.stopOffset - 1.1, 0, Math.PI / 2],
    [0, layout.stopOffset - 1.1, Math.PI],
    [-layout.stopOffset + 1.1, 0, -Math.PI / 2],
  ].forEach(([x, z, rot], index) => {
    const line = addMesh(
      group,
      new THREE.PlaneGeometry(2.8, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
      `road-yield-${index + 1}`,
    );
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = rot;
    line.position.set(x, 0.13, z);
  });

  [
    [roundabout.laneRadius, 0, Math.PI],
    [0, roundabout.laneRadius, -Math.PI / 2],
    [-roundabout.laneRadius, 0, 0],
    [0, -roundabout.laneRadius, Math.PI / 2],
  ].forEach(([x, z, rot], index) => addLaneArrow(group, x, z, rot, 'straight', `roundabout-${index + 1}`));
}

function addRoadNetwork(group) {
  smartcitySceneData.roads.forEach((road) => {
    const roadMesh = addMesh(
      group,
      new THREE.PlaneGeometry(road.size[0], road.size[1]),
      makeMaterial(road.type === 'primary' ? 0x343b42 : 0x46515a, { roughness: 0.95 }),
      road.id,
    );
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.rotation.z = road.rotation || 0;
    roadMesh.position.set(road.pos[0], 0.06, road.pos[2]);
    roadMesh.receiveShadow = true;
  });

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

  [-0.18, 0.18].forEach((offset, index) => {
    addLaneMarking(group, 0, offset, eastWestRoad?.size[0] || 72, 0.08, 0xffcf4a, `road-center-ew-${index + 1}`);
    addLaneMarking(group, offset, 0, 0.08, northSouthRoad?.size[1] || 72, 0xffcf4a, `road-center-ns-${index + 1}`);
  });

  let markingIndex = 0;
  for (let z = -halfNorthSouth + 2; z <= halfNorthSouth - 2; z += 2.2) {
    if (Math.abs(z) > noMarkingZone) {
      addLaneMarking(group, -laneWidth, z, 0.1, 0.95, 0xffffff, `road-dash-ns-${markingIndex += 1}`);
      addLaneMarking(group, laneWidth, z, 0.1, 0.95, 0xffffff, `road-dash-ns-${markingIndex += 1}`);
    }
  }
  for (let x = -halfEastWest + 2; x <= halfEastWest - 2; x += 2.2) {
    if (Math.abs(x) > noMarkingZone) {
      addLaneMarking(group, x, -laneWidth, 0.95, 0.1, 0xffffff, `road-dash-ew-${markingIndex += 1}`);
      addLaneMarking(group, x, laneWidth, 0.95, 0.1, 0xffffff, `road-dash-ew-${markingIndex += 1}`);
    }
  }

  addLaneMarking(group, 0, -stop, roadHalf * 2, 0.18, 0xffffff, 'road-stop-north');
  addLaneMarking(group, 0, stop, roadHalf * 2, 0.18, 0xffffff, 'road-stop-south');
  addLaneMarking(group, -stop, 0, 0.18, roadHalf * 2, 0xffffff, 'road-stop-west');
  addLaneMarking(group, stop, 0, 0.18, roadHalf * 2, 0xffffff, 'road-stop-east');

  const eastWestWidth = eastWestRoad?.size[1] || 8.8;
  const northSouthWidth = northSouthRoad?.size[0] || 8.8;
  addCrosswalkBars(group, 'z', -1, northSouthWidth, eastWestWidth / 2);
  addCrosswalkBars(group, 'z', 1, northSouthWidth, eastWestWidth / 2);
  addCrosswalkBars(group, 'x', -1, eastWestWidth, northSouthWidth / 2);
  addCrosswalkBars(group, 'x', 1, eastWestWidth, northSouthWidth / 2);

  [
    [-inner, -13.8, 0, 'left'],
    [-outer, -13.8, 0, 'right'],
    [inner, 16, Math.PI, 'left'],
    [outer, 16, Math.PI, 'right'],
    [-16, inner, Math.PI / 2, 'left'],
    [-16, outer, Math.PI / 2, 'right'],
    [16, -inner, -Math.PI / 2, 'left'],
    [16, -outer, -Math.PI / 2, 'right'],
  ].forEach(([x, z, rot, kind], index) => addLaneArrow(group, x, z, rot, kind, index + 1));

  addRoundabout(group, layout);
}

function addBuildings(group) {
  smartcitySceneData.buildings.forEach((data) => {
    const [w, h, d] = data.size;
    const building = addMesh(
      group,
      new THREE.BoxGeometry(w, h, d),
      data.label
        ? createBuildingMaterials(data, w, h, d)
        : makeMaterial(0x9cc5d3, { transparent: true, opacity: 0.64 }),
      `building-${data.id}`,
    );
    building.position.set(data.pos[0], h / 2, data.pos[2]);
    building.castShadow = Boolean(data.label);
    building.receiveShadow = true;

    if (data.roof) {
      const roof = addMesh(
        group,
        new THREE.BoxGeometry(w + 0.18, 0.22, d + 0.18),
        makeMaterial(0x56b45a, { roughness: 0.86 }),
        `building-${data.id}-roof`,
      );
      roof.position.set(data.pos[0], h + 0.11, data.pos[2]);
      roof.castShadow = true;
    }

    if (data.accent && data.label) {
      const panel = addMesh(
        group,
        new THREE.PlaneGeometry(0.85, h * 0.54),
        makeMaterial(data.accent, { roughness: 0.62 }),
        `building-${data.id}-accent`,
      );
      panel.position.set(data.pos[0] + w / 2 + 0.03, h * 0.46, data.pos[2]);
      panel.rotation.y = Math.PI / 2;
    }
  });

  smartcitySceneData.skybridges.forEach((bridge, index) => {
    const [w, h, d] = bridge.size;
    const mesh = addMesh(
      group,
      new THREE.BoxGeometry(w, h, d),
      makeMaterial(0x70c6e6, { metalness: 0.6, roughness: 0.12, transparent: true, opacity: 0.72 }),
      `building-skybridge-${index + 1}`,
    );
    mesh.position.set(...bridge.pos);
    mesh.castShadow = true;
  });
}

function addTree(group, [x, z], scale, index) {
  const tree = new THREE.Group();
  tree.name = `landscape-tree-${index + 1}`;
  const trunk = addMesh(
    tree,
    new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 0.7 * scale, 7),
    makeMaterial(0x6b4423, { roughness: 0.82 }),
    'trunk',
  );
  trunk.position.y = 0.35 * scale;
  trunk.castShadow = true;

  const crown = addMesh(
    tree,
    new THREE.ConeGeometry(0.55 * scale, 1.35 * scale, 9),
    makeMaterial(0x2f8f49, { roughness: 0.84 }),
    'crown',
  );
  crown.position.y = 1.12 * scale;
  crown.castShadow = true;
  tree.position.set(x, 0, z);
  group.add(tree);
}

function addBench(group, bench) {
  const benchGroup = new THREE.Group();
  benchGroup.name = `landscape-${bench.id}`;
  const wood = makeMaterial(0x8a5a2b, { roughness: 0.78 });
  const metal = makeMaterial(0x475569, { metalness: 0.25, roughness: 0.55 });

  const seat = addMesh(benchGroup, new THREE.BoxGeometry(1.7, 0.14, 0.42), wood, 'seat');
  seat.position.y = 0.42;
  const back = addMesh(benchGroup, new THREE.BoxGeometry(1.7, 0.12, 0.36), wood, 'back');
  back.position.set(0, 0.78, -0.28);
  back.rotation.x = -0.18;

  [-0.62, 0.62].forEach((x, index) => {
    const leg = addMesh(benchGroup, new THREE.BoxGeometry(0.08, 0.38, 0.08), metal, `leg-${index + 1}`);
    leg.position.set(x, 0.2, 0.12);
    const backLeg = addMesh(benchGroup, new THREE.BoxGeometry(0.08, 0.62, 0.08), metal, `back-leg-${index + 1}`);
    backLeg.position.set(x, 0.36, -0.28);
  });

  benchGroup.position.set(...bench.pos);
  benchGroup.rotation.y = bench.rot || 0;
  benchGroup.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  group.add(benchGroup);
}

function addLandscape(group) {
  smartcitySceneData.trees.forEach((tree, index) => addTree(group, tree, index < 3 ? 0.72 : 1, index));
  smartcitySceneData.parkBenches?.forEach((bench) => addBench(group, bench));

  const parking = addMesh(
    group,
    new THREE.PlaneGeometry(8, 5),
    makeMaterial(0x55606b, { roughness: 0.92 }),
    'landscape-parking',
  );
  parking.rotation.x = -Math.PI / 2;
  parking.position.set(13, 0.065, 13);
}

export function buildSmartcityStaticGroups() {
  const groups = {
    terrain: new THREE.Group(),
    roads: new THREE.Group(),
    buildings: new THREE.Group(),
    landscape: new THREE.Group(),
  };

  Object.entries(groups).forEach(([name, group]) => {
    group.name = `smartcity-static-${name}`;
  });

  addGround(groups.terrain);
  addRoadNetwork(groups.roads);
  addBuildings(groups.buildings);
  addLandscape(groups.landscape);
  return groups;
}
