import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setupRenderer, setupLighting } from './scene-lighting.js';
import { setupSceneEnvironment, disposeSceneEnvironment } from './scene-building-materials.js';
import { createEnvironment, disposeEnvironment } from './scene-environment.js';
import { populateCity, addMarker } from './scene-buildings.js';
import { buildingSceneData } from '../data/building-scene.js';

let activeScene = null;

function createScene(container) {
  const { renderer, w, h } = setupRenderer(container);

  const scene = new THREE.Scene();
  setupLighting(scene);
  setupSceneEnvironment(renderer, scene);

  const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 200);
  camera.position.set(12, 16, 20);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2.08;
  controls.minDistance = 10;
  controls.maxDistance = 40;
  controls.target.set(0, 4, -1);

  const { reflector, ripple } = createEnvironment(scene, renderer);
  populateCity(scene);

  const refs = {};
  buildingSceneData.markers.forEach((m) => addMarker(scene, m, refs));

  let frameId;
  const clock = new THREE.Clock();
  function animate() {
    frameId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (refs.incident) {
      refs.incident.scale.setScalar(0.85 + Math.sin(t * 3) * 0.15);
    }
    if (ripple) {
      ripple.material.opacity = 0.14 + Math.sin(t * 1.5) * 0.08;
      ripple.material.emissiveIntensity = 0.06 + Math.sin(t * 2.2) * 0.06;
    }
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
      disposeEnvironment(reflector);
      disposeSceneEnvironment();
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

export function initSecurityBuildingScene() {
  const container = document.querySelector('#page-security [data-mount="building-scene"]');
  if (!container || activeScene) return;
  try {
    activeScene = createScene(container);
  } catch (err) {
    console.error('[security-scene] Không khởi tạo được 3D:', err);
    activeScene = null;
  }
}

export function disposeSecurityBuildingScene() {
  activeScene?.dispose();
  activeScene = null;
}
