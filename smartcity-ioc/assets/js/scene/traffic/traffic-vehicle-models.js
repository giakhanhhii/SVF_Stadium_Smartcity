import * as THREE from 'three';
import {
  ensureWhiteLightsFaceForward,
  inferVehicleTemplateType,
  inferWhiteFrontAssetRotation,
  resetVehicleModelOpacity,
} from './traffic-model-normalization.js?v=roundabout-flow-20260618h';

const VEHICLE_MODEL_ASSET = new URL('../../../models/smartcity/vehicles.glb', import.meta.url).href;

export const VEHICLE_MODEL_RELOAD_INTERVAL_SECONDS = 5;

const vehicleModelTemplates = new Map();
const vehicleModelTemplatePools = new Map();

export { resetVehicleModelOpacity };

function vehicleAssetUrl(cacheKey = null) {
  if (!cacheKey) return VEHICLE_MODEL_ASSET;
  const url = new URL(VEHICLE_MODEL_ASSET);
  url.searchParams.set('v', String(cacheKey));
  return url.href;
}

function vehicleTemplateIdFor(object) {
  const match = object.name.match(/^vehicle-(veh-\d+)-root$/);
  const isRoot = object.userData?.smartcity_group_type === 'vehicle' || Boolean(match);
  if (!isRoot) return null;
  return object.userData?.smartcity_vehicle_id || match?.[1] || null;
}

function addVehicleTemplateToPool(templatePools, templateType, vehicleId, object) {
  const type = templateType || 'car';
  if (!templatePools.has(type)) templatePools.set(type, []);
  templatePools.get(type).push({ id: vehicleId, object, type });
}

function registerVehicleModelTemplates(root, target = vehicleModelTemplates, templatePools = vehicleModelTemplatePools) {
  root.traverse((object) => {
    const vehicleId = vehicleTemplateIdFor(object);
    if (!vehicleId) return;
    const whiteFrontRotation = inferWhiteFrontAssetRotation(object);
    if (whiteFrontRotation === null) return;
    object.visible = true;
    object.userData.smartcity_vehicle_type = inferVehicleTemplateType(vehicleId, object);
    object.userData.whiteFrontAssetRotation = whiteFrontRotation;
    target.set(vehicleId, object);
    addVehicleTemplateToPool(templatePools, object.userData.smartcity_vehicle_type, vehicleId, object);
  });
}

export async function loadVehicleModelTemplates(loader, cacheKey = null, debug = false) {
  try {
    const gltf = await loader.loadAsync(vehicleAssetUrl(cacheKey));
    const nextTemplates = new Map();
    const nextTemplatePools = new Map();
    registerVehicleModelTemplates(gltf.scene, nextTemplates, nextTemplatePools);
    if (!nextTemplates.size) throw new Error('vehicles.glb khong co root vehicle hop le.');
    vehicleModelTemplates.clear();
    vehicleModelTemplatePools.clear();
    nextTemplates.forEach((template, vehicleId) => vehicleModelTemplates.set(vehicleId, template));
    nextTemplatePools.forEach((templates, type) => vehicleModelTemplatePools.set(type, templates));
    if (debug) {
      const poolSummary = [...vehicleModelTemplatePools.entries()].map(([type, templates]) => `${type}:${templates.map((template) => template.id).join('/')}`).join(', ');
      console.info('[traffic-debug] vehicle model templates', [...vehicleModelTemplates.keys()].join(', '), poolSummary);
    }
    return true;
  } catch (error) {
    console.warn('[smartcity-scene] Khong tai duoc vehicles.glb, bo qua xe khong co model Blender.', error);
    return false;
  }
}

function pickVehicleTemplate(vehicle) {
  const exact = vehicleModelTemplates.get(vehicle.id);
  if (exact) return { id: vehicle.id, object: exact, type: exact.userData?.smartcity_vehicle_type || vehicle.type || vehicle.vehicleKind || 'car' };
  return null;
}

function centerVehicleModelOnRoute(wrapper, clone) {
  wrapper.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(clone);
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  wrapper.worldToLocal(center);
  clone.position.x -= center.x;
  clone.position.z -= center.z;
  wrapper.updateWorldMatrix(true, true);
}

export function cloneVehicleModel(vehicle) {
  const template = pickVehicleTemplate(vehicle);
  if (!template?.object) return null;
  const wrapper = new THREE.Group();
  wrapper.name = `${vehicle.id}-moving-model`;
  wrapper.userData.vehicleModelSource = 'glb';
  wrapper.userData.templateVehicleId = template.id;
  wrapper.userData.templateVehicleType = template.type;
  wrapper.userData.templateRouteId = template.object.userData?.smartcity_vehicle_route_id || null;
  wrapper.userData.runtimeRouteId = vehicle.routeId || vehicle.route?.id || null;
  wrapper.userData.templateRouteMismatch = Boolean(
    wrapper.userData.templateRouteId
    && wrapper.userData.runtimeRouteId
    && wrapper.userData.templateRouteId !== wrapper.userData.runtimeRouteId,
  );

  const clone = template.object.clone(true);
  clone.name = `${vehicle.id}-moving-model-asset`;
  clone.position.set(0, 0, 0);
  const whiteFrontRotation = template.object.userData?.whiteFrontAssetRotation;
  if (typeof whiteFrontRotation !== 'number') return null;
  clone.rotation.set(0, whiteFrontRotation, 0);
  clone.scale.copy(template.object.scale);
  clone.traverse((object) => {
    object.visible = true;
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    if (object.material) {
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone();
    }
  });
  wrapper.add(clone);
  if (!ensureWhiteLightsFaceForward(wrapper, clone)) return null;
  centerVehicleModelOnRoute(wrapper, clone);
  resetVehicleModelOpacity(wrapper);
  return wrapper;
}

export async function readVehicleModelAssetSignature() {
  const head = await fetch(VEHICLE_MODEL_ASSET, { method: 'HEAD', cache: 'no-store' });
  if (!head.ok) throw new Error(`vehicles.glb HEAD ${head.status}`);
  const headerSignature = [
    head.headers.get('last-modified') || '',
    head.headers.get('etag') || '',
    head.headers.get('content-length') || '',
  ].join('|');
  if (headerSignature.replaceAll('|', '')) return `head:${headerSignature}`;

  const response = await fetch(vehicleAssetUrl(Date.now()), { cache: 'no-store' });
  if (!response.ok) throw new Error(`vehicles.glb GET ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    const hash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
    return `body:${bytes.byteLength}:${hash}`;
  }

  let hash = 2166136261;
  bytes.forEach((value) => {
    hash ^= value;
    hash = Math.imul(hash, 16777619);
  });
  return `body:${bytes.byteLength}:${hash >>> 0}`;
}
