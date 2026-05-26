import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setupRenderer, setupLighting } from './scene-lighting.js';
import { createStreet, addTrafficLights, updateTrafficLights } from './traffic-street.js';
import { populateVehicles, updateVehicles } from './traffic-vehicles.js';
import { trafficSceneData } from '../data/traffic-scene.js';

let activeScene = null;

function createScene(container) {
  const { renderer, w, h } = setupRenderer(container);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc8e0f0);
  scene.fog = new THREE.Fog(0xc8e0f0, 40, 80);
  setupLighting(scene);

  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 150);
  camera.position.set(10, 14, 16);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2.15;
  controls.minDistance = 8;
  controls.maxDistance = 35;
  controls.target.set(0, 0, 0);

  createStreet(scene);
  const lightBulbs = addTrafficLights(scene, trafficSceneData.trafficLights);
  const movers = populateVehicles(scene);

  let frameId;
  const clock = new THREE.Clock();
  function animate() {
    frameId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    updateTrafficLights(lightBulbs, t);
    updateVehicles(movers);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const ro = new ResizeObserver(() => {
    const nw = container.clientWidth;
    const nh = container.clientHeight;
    if (!nw || !nh) return;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });
  ro.observe(container);

  return {
    dispose() {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      controls.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export function initTrafficRoadScene() {
  const container = document.querySelector('#page-traffic [data-mount="traffic-scene"]');
  if (!container || activeScene) return;
  try {
    activeScene = createScene(container);
  } catch (err) {
    console.error('[traffic-scene] Không khởi tạo được 3D:', err);
    activeScene = null;
  }
}

export function disposeTrafficRoadScene() {
  activeScene?.dispose();
  activeScene = null;
}
