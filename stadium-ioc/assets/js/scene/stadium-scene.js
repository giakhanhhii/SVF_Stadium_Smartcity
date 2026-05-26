import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { domeConfig, getRoofStatusLabel, stadiumSceneData } from '../data/stadium-scene.js';
import { getMarkerGroup, setMarkers, pulseMarkers } from './stadium-markers.js';
import { tweenCamera, setSceneHint, showSceneLoading, applyCameraPreset } from './stadium-camera.js';
import { setupStadiumEnvironment, disposeStadiumEnvironment } from './stadium-environment.js';

let activeScene = null;
let stadiumModel = null;
let roofOpenGroup = null;
let roofProgress = 0;
let rendererEl = null;
let currentPageId = 'security';
let sceneRefs = null;

const MODEL_URL = 'assets/models/pvf-stadium.glb';

function setupRenderer(container) {
  const w = container.clientWidth || 640;
  const h = container.clientHeight || 480;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  container.appendChild(renderer.domElement);
  rendererEl = renderer.domElement;
  return { renderer, w, h };
}

function setupLighting(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xa8cce8, 0x3a4a38, 0.55));
  const sun = new THREE.DirectionalLight(0xfff0d8, 0.85);
  sun.position.set(-90, 140, 70);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.28));

  const ring = new THREE.Group();
  ring.name = 'interior_flood';
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const light = new THREE.PointLight(0xfff6e8, 0.55, 140, 1.6);
    light.position.set(Math.sin(a) * 78, 24, Math.cos(a) * 62);
    ring.add(light);
  }
  scene.add(ring);

  const overhead = new THREE.DirectionalLight(0xfff8f0, 0.45);
  overhead.position.set(0, 90, 20);
  scene.add(overhead);
}

function createScene(container, pageId) {
  showSceneLoading(container, true);
  const { renderer, w, h } = setupRenderer(container);
  const scene = new THREE.Scene();
  setupStadiumEnvironment(scene);
  setupLighting(scene, renderer);

  const camera = new THREE.PerspectiveCamera(42, w / h, 1, 500);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 45;
  controls.maxDistance = 320;
  applyCameraPreset(camera, controls, pageId);

  scene.add(getMarkerGroup());

  const loader = new GLTFLoader();
  loader.load(MODEL_URL, (gltf) => {
    stadiumModel = gltf.scene;
    stadiumModel.traverse((o) => { if (o.isMesh) o.frustumCulled = true; });
    scene.add(stadiumModel);
    roofOpenGroup = stadiumModel.getObjectByName('roof_open');
    setRoofProgress(roofProgress);
    showSceneLoading(container, false);
    applyPageView(pageId, container);
  });

  const clock = new THREE.Clock();
  let frameId;
  function animate() {
    frameId = requestAnimationFrame(animate);
    pulseMarkers(clock.getElapsedTime());
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const ro = new ResizeObserver(() => sceneRefs?.onResize?.());
  ro.observe(container);

  sceneRefs = {
    camera, controls, container, renderer,
    onResize() {
      const host = rendererEl?.parentElement || container;
      const nw = host.clientWidth;
      const nh = host.clientHeight;
      if (!nw || !nh) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    },
    dispose() {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      controls.dispose();
      disposeStadiumEnvironment(scene);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
      rendererEl?.remove();
      rendererEl = null;
      stadiumModel = null;
      roofOpenGroup = null;
      sceneRefs = null;
    },
  };
  return sceneRefs;
}

export function applyPageView(pageId, container) {
  if (!sceneRefs) return;
  currentPageId = pageId;
  const markers = stadiumSceneData.markers[pageId] || [];
  setMarkers(markers);
  tweenCamera(sceneRefs.camera, sceneRefs.controls, pageId).then((hint) => {
    setSceneHint(container || sceneRefs.container, hint);
  });
}

function applyRoofState(progress) {
  if (!roofOpenGroup) return;
  roofOpenGroup.visible = progress > 0.02;
  const slide = (1 - progress) * domeConfig.panelSlide;
  const panelW = roofOpenGroup.getObjectByName('roof_panel_west');
  const panelE = roofOpenGroup.getObjectByName('roof_panel_east');
  const ridgeW = roofOpenGroup.getObjectByName('roof_ridge_west');
  const ridgeE = roofOpenGroup.getObjectByName('roof_ridge_east');
  if (panelW) panelW.position.x = -domeConfig.panelRestX - slide;
  if (panelE) panelE.position.x = domeConfig.panelRestX + slide;
  if (ridgeW) ridgeW.position.x = -domeConfig.panelRestX - 17.2 - slide;
  if (ridgeE) ridgeE.position.x = domeConfig.panelRestX + 17.2 + slide;
}

export function setRoofProgress(p) {
  roofProgress = Math.max(0, Math.min(1, p));
  applyRoofState(roofProgress);
  document.querySelectorAll('[data-roof-status]').forEach((el) => {
    el.textContent = getRoofStatusLabel(roofProgress);
  });
  document.querySelectorAll('[data-roof-pct]').forEach((el) => {
    el.textContent = `${Math.round(roofProgress * 100)}%`;
  });
  document.querySelectorAll('[data-roof-bar]').forEach((el) => {
    el.style.width = `${Math.round(roofProgress * 100)}%`;
  });
}

export function getRoofProgress() {
  return roofProgress;
}

export function initStadiumScene(pageId) {
  const container = document.querySelector(`#page-${pageId} [data-mount="stadium-scene"]`);
  if (!container) return;
  if (activeScene) {
    container.appendChild(rendererEl);
    activeScene.onResize?.();
    applyPageView(pageId, container);
    return;
  }
  try {
    activeScene = createScene(container, pageId);
  } catch (err) {
    console.error('[stadium-scene]', err);
    showSceneLoading(container, false);
    activeScene = null;
  }
}

export function disposeStadiumScene() {
  activeScene?.dispose();
  activeScene = null;
}
