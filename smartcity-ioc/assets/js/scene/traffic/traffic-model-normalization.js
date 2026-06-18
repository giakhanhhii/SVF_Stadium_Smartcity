import * as THREE from 'three';
import { smartcitySceneData } from '../../data/smartcity-scene-data.js';

const FRONT_LIGHT_PATTERN = /(headlight|headlamp|front-head|front-lamp|scooter-front-headlamp)/;
const REAR_LIGHT_PATTERN = /(taillight|tail-light|rear-light|brake-light)/;

function vehicleTypeForId(vehicleId) {
  return smartcitySceneData.vehicles.find((vehicle) => vehicle.id === vehicleId)?.type || 'car';
}

export function inferVehicleTemplateType(vehicleId, object) {
  const taggedType = object.userData?.smartcity_vehicle_type || object.userData?.vehicleType;
  if (taggedType === 'moto' || taggedType === 'bus' || taggedType === 'car') return taggedType;
  const combinedName = [];
  object.traverse((child) => combinedName.push(child.name || ''));
  const names = combinedName.join(' ').toLowerCase();
  if (names.includes('scooter') || names.includes('moto') || names.includes('rider')) return 'moto';
  if (names.includes('bus') || vehicleId === 'veh-12') return 'bus';
  return vehicleTypeForId(vehicleId);
}

function getObjectLocalCenter(root, object) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return null;
  const center = box.getCenter(new THREE.Vector3());
  root.worldToLocal(center);
  return center;
}

export function inferWhiteFrontAssetRotation(root) {
  root.updateWorldMatrix(true, true);
  const headlightCenters = [];
  const taillightCenters = [];

  root.traverse((object) => {
    if (!object.isMesh) return;
    const name = (object.name || '').toLowerCase();
    const center = getObjectLocalCenter(root, object);
    if (!center) return;

    if (FRONT_LIGHT_PATTERN.test(name)) {
      headlightCenters.push(center);
      return;
    }

    if (REAR_LIGHT_PATTERN.test(name)) {
      taillightCenters.push(center);
    }
  });

  if (!headlightCenters.length || !taillightCenters.length) return null;

  const averagePoint = (points) => points
    .reduce((sum, point) => sum.add(point), new THREE.Vector3())
    .multiplyScalar(1 / points.length);
  const frontVector = averagePoint(headlightCenters).sub(averagePoint(taillightCenters)).setY(0);
  if (frontVector.lengthSq() < 0.0001) return null;
  return -Math.atan2(frontVector.x, frontVector.z);
}

function getAverageLightCenter(root, pattern) {
  const points = [];
  root.updateWorldMatrix(true, true);
  root.traverse((object) => {
    if (!object.isMesh) return;
    const name = (object.name || '').toLowerCase();
    if (!pattern.test(name)) return;
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    root.worldToLocal(center);
    points.push(center);
  });
  if (!points.length) return null;
  return points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / points.length);
}

export function ensureWhiteLightsFaceForward(wrapper, clone) {
  const white = getAverageLightCenter(wrapper, FRONT_LIGHT_PATTERN);
  const red = getAverageLightCenter(wrapper, REAR_LIGHT_PATTERN);
  if (!white || !red) return false;
  const frontVector = white.clone().sub(red).setY(0);
  if (frontVector.lengthSq() < 0.0001) return false;
  const forwardAlignment = frontVector.clone().normalize().dot(new THREE.Vector3(0, 0, 1));
  if (forwardAlignment >= 0.985) {
    wrapper.userData.whiteLightsForward = true;
    wrapper.userData.laneFrontHeadingOffset = 0;
    return true;
  }
  clone.rotation.y += -Math.atan2(frontVector.x, frontVector.z);
  clone.updateWorldMatrix(true, true);
  wrapper.updateWorldMatrix(true, true);
  const correctedWhite = getAverageLightCenter(wrapper, FRONT_LIGHT_PATTERN);
  const correctedRed = getAverageLightCenter(wrapper, REAR_LIGHT_PATTERN);
  const correctedFront = correctedWhite && correctedRed ? correctedWhite.clone().sub(correctedRed).setY(0) : null;
  const correctedAlignment = correctedFront && correctedFront.lengthSq() >= 0.0001
    ? correctedFront.normalize().dot(new THREE.Vector3(0, 0, 1))
    : -1;
  wrapper.userData.whiteLightsForward = correctedAlignment >= 0.985;
  wrapper.userData.whiteLightForwardCorrection = wrapper.userData.whiteLightsForward ? 'align-front-vector' : 'failed';
  wrapper.userData.laneFrontHeadingOffset = 0;
  return wrapper.userData.whiteLightsForward;
}

export function resetVehicleModelOpacity(root) {
  root?.traverse?.((object) => {
    if (!object.material || object.isSprite) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!material || material.userData.lockOpacity) return;
      const baseOpacity = material.userData.baseOpacity ?? material.opacity ?? 1;
      material.userData.baseOpacity = baseOpacity;
      material.opacity = baseOpacity;
      material.transparent = baseOpacity < 1;
      material.depthWrite = baseOpacity >= 1;
      material.needsUpdate = true;
    });
  });
}
