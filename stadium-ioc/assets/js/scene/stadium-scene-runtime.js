import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import {
  domeConfig, floodRingConfig, getRoofStatusLabel, stadiumSceneData,
  parkingMarkers, exteriorSceneViews,
} from '../data/stadium-scene-data.js';
import { getMarkerGroup, setMarkers, pulseMarkers } from './stadium-markers.js';
import { tweenCamera, setSceneHint, showSceneLoading, applyCameraPreset } from './stadium-camera.js';
import { setupStadiumEnvironment, disposeStadiumEnvironment } from './stadium-environment.js';
import { initStadiumCrowd, updateStadiumCrowd, disposeStadiumCrowd } from './stadium-crowd.js';
import { buildStadiumGates, disposeStadiumGates, setStadiumGatesVisible } from './stadium-gates.js';
import {
  buildControlRooms, bindControlRoomPick, setControlRoomsVisible, disposeControlRooms,
} from './stadium-control-rooms.js';
import {
  buildSecurityInterior, enterSecurityInterior, exitSecurityInterior,
  updateSecurityMonitors, bindSecurityMonitorPick, disposeSecurityInterior,
  isSecurityInteriorActive, feedToViewId, setSecurityInteriorVisible, reenterSecurityInterior,
  setMonitorFeedHooks,
  applySecurityRoomView, requestSecurityRoomView, prepareStadiumViewFromRoom,
} from './stadium-security-interior.js';

let activeScene = null;
let stadiumModel = null;
let roofOpenGroup = null;
let roofProgress = 1;
let rendererEl = null;
let currentNavPage = 'overview';
let currentViewId = 'overview';
let sceneRefs = null;
let bloomComposer = null;
let floodlightsGroup = null;
let facadeGlassMesh = null;
let facadeMullionsMesh = null;
let facadeTopFrameMesh = null;
let waveRibbonMesh = null;
let roofClosedCap = null;
let parkingGroup = null;
let controlRoomMode = 'exterior';
let mainScene = null;
let vocEventsBound = false;

function defaultSceneViewForPage(pageId) {
  return pageId === 'facilities' ? 'facilitiesOverview' : pageId;
}

function resolveMarkersForView(viewId) {
  const markerKey = viewId === 'reports' || viewId === 'facilitiesOverview' ? 'overview' : viewId;
  const base = stadiumSceneData.markers[markerKey] || [];
  if (!exteriorSceneViews.has(viewId)) return base;
  const seen = new Set(base.map((m) => m.label));
  const extra = parkingMarkers.filter((m) => !seen.has(m.label));
  return extra.length ? [...base, ...extra] : base;
}

function setParkingVisible(visible = true) {
  if (parkingGroup) parkingGroup.visible = visible;
}

function bindVocEvents() {
  if (vocEventsBound) return;
  vocEventsBound = true;
  document.addEventListener('voc-enter-security-interior', () => {
    if (!sceneRefs) return;
    setMarkers([]);
    enterSecurityInterior(sceneRefs);
  });
  document.addEventListener('voc-exit-security-interior', (e) => {
    if (!sceneRefs) return;
    exitSecurityInterior(sceneRefs).then(() => {
      const restore = e.detail?.restoreView;
      if (restore) applyPageView(restore, sceneRefs.container);
    });
  });
  document.addEventListener('voc-security-screen-open', () => {
    setSecurityInteriorVisible(false);
    if (sceneRefs) prepareStadiumViewFromRoom(sceneRefs);
  });
  document.addEventListener('voc-reenter-security-interior', () => {
    if (sceneRefs) reenterSecurityInterior(sceneRefs);
  });
  document.addEventListener('voc-security-room-view', (e) => {
    if (!sceneRefs) return;
    const d = e.detail;
    const mode = typeof d === 'string' ? d : d.mode;
    const options = typeof d === 'object' && d !== null ? d : {};
    applySecurityRoomView(sceneRefs, mode, options);
  });
}

const MODEL_URL = 'assets/models/pvf-stadium-openroof-v3.glb?v=roof-fit-20260528b';
const GLASS_OPAQUE = 0xe8ecf2;
const GLASS_TRANSPARENT = 0xffffff;

const _viewForward = new THREE.Vector3();
const _viewToCenter = new THREE.Vector3();

/** Camera nhìn vào lòng sân — nới vùng so với check cũ để orbit/cúi không tắt đèn & khán giả */
function isCameraViewingInterior(camera, controls) {
  const { x, y, z } = camera.position;
  const { rx, rz } = floodRingConfig;
  const bowlT = (x / rx) ** 2 + (z / rz) ** 2;
  const nearStadium = bowlT < 3.5;
  const inExpandedBowl = bowlT < 2.2;
  const underRoofLine = y < domeConfig.rimY + 55;

  camera.getWorldDirection(_viewForward);
  _viewToCenter.set(-x, 10 - y, -z);
  if (_viewToCenter.lengthSq() > 0.25) _viewToCenter.normalize();
  const lookingIn = _viewForward.dot(_viewToCenter) > -0.12;

  const targetDist = Math.hypot(x - controls.target.x, z - controls.target.z);
  const focusInBowl = targetDist < Math.max(rx, rz) * 1.05;

  return nearStadium && underRoofLine && (inExpandedBowl || lookingIn || focusInBowl);
}

const _feedTarget = new THREE.Vector3();
const feedRenderState = { roof: null, markersVisible: true };

function prepareMonitorFeed(feedId, camera) {
  const presetKey = feedId === 'interior' ? 'security' : 'exteriorLive';
  const preset = stadiumSceneData.cameraPresets[presetKey];
  if (!preset) return;
  camera.position.set(...preset.pos);
  _feedTarget.set(...preset.target);
  camera.lookAt(_feedTarget);
  camera.fov = preset.fov ?? 42;
  camera.updateProjectionMatrix();

  if (feedId === 'interior' && feedRenderState.roof === null) {
    feedRenderState.roof = roofProgress;
    feedRenderState.markersVisible = getMarkerGroup().visible;
    setRoofProgress(1);
  }

  const fakeControls = { target: _feedTarget };
  updateShellVisibility(camera, fakeControls);
  updateStadiumCrowd(camera, isCameraViewingInterior(camera, fakeControls));
  getMarkerGroup().visible = false;
  setControlRoomsVisible(false);
}

function restoreAfterMonitorFeeds() {
  if (feedRenderState.roof !== null) {
    setRoofProgress(feedRenderState.roof);
    feedRenderState.roof = null;
  }
  getMarkerGroup().visible = feedRenderState.markersVisible;
}

function updateControlRoomVisibility() {
  const show = currentNavPage === 'overview'
    && controlRoomMode === 'exterior'
    && currentViewId === 'overview';
  setControlRoomsVisible(show);
  setStadiumGatesVisible(true);
  setParkingVisible(true);
  if (show) {
    document.dispatchEvent(new CustomEvent('voc-room-hint', { detail: true }));
  }
}

function stabilizePitchSurface(model) {
  const pitch = model.getObjectByName('pitch_surface');
  if (!pitch) return;
  pitch.position.y = Math.max(pitch.position.y, 0.42);
  pitch.renderOrder = 8;
  if (pitch.material) {
    pitch.material.depthTest = true;
    pitch.material.depthWrite = true;
    pitch.material.polygonOffset = true;
    pitch.material.polygonOffsetFactor = -8;
    pitch.material.polygonOffsetUnits = -8;
    pitch.material.needsUpdate = true;
  }
}

export function setControlRoomMode(mode) {
  controlRoomMode = mode;
  updateControlRoomVisibility();
}

/** Kính trong suốt chỉ khi camera thực sự ở trong bowl hẹp */
function isCameraInsideShell(camera) {
  const { x, y, z } = camera.position;
  const { rx, rz } = floodRingConfig;
  return (x / (rx * 0.92)) ** 2 + (z / (rz * 0.92)) ** 2 < 1.08 && y < domeConfig.rimY + 24;
}

function updateShellVisibility(camera, controls) {
  const viewingInterior = isCameraViewingInterior(camera, controls);
  const insideShell = isCameraInsideShell(camera);
  const roofOpen = roofProgress > 0.02;

  if (facadeGlassMesh?.material) {
    const m = facadeGlassMesh.material;
    if (insideShell || viewingInterior) {
      m.transparent = true;
      m.opacity = insideShell ? 0.72 : 0.38;
      m.depthWrite = false;
      m.side = THREE.DoubleSide;
      m.color.setHex(GLASS_TRANSPARENT);
    } else {
      m.transparent = false;
      m.opacity = 1;
      m.depthWrite = true;
      m.side = THREE.FrontSide;
      m.color.setHex(GLASS_OPAQUE);
    }
  }

  if (roofClosedCap) roofClosedCap.visible = false;
  if (floodlightsGroup) floodlightsGroup.visible = false;
}

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
}

function createScene(container, navPageId) {
  showSceneLoading(container, true);
  const { renderer, w, h } = setupRenderer(container);
  const scene = new THREE.Scene();
  mainScene = scene;
  setupStadiumEnvironment(scene);
  setupLighting(scene, renderer);

  const camera = new THREE.PerspectiveCamera(42, w / h, 1, 1400);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 90;
  controls.maxDistance = 680;
  applyCameraPreset(camera, controls, defaultSceneViewForPage(navPageId));

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomComposer = composer;

  scene.add(getMarkerGroup());

  const loader = new GLTFLoader();
  loader.load(MODEL_URL, (gltf) => {
    stadiumModel = gltf.scene;
    stadiumModel.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        o.geometry?.computeBoundingSphere();
      }
    });
    scene.add(stadiumModel);
    floodlightsGroup = stadiumModel.getObjectByName('floodlights');
    if (floodlightsGroup) {
      floodlightsGroup.visible = false;
      floodlightsGroup.traverse((o) => { o.visible = false; });
    }
    stabilizePitchSurface(stadiumModel);
    facadeGlassMesh = stadiumModel.getObjectByName('facade_glass');
    facadeMullionsMesh = stadiumModel.getObjectByName('facade_mullions');
    facadeTopFrameMesh = stadiumModel.getObjectByName('facade_top_frame');
    waveRibbonMesh = stadiumModel.getObjectByName('wave_ribbon_south');
    if (facadeMullionsMesh) facadeMullionsMesh.visible = false;
    if (facadeTopFrameMesh) facadeTopFrameMesh.visible = false;
    if (waveRibbonMesh) waveRibbonMesh.visible = false;
    roofClosedCap = stadiumModel.getObjectByName('roof_closed_cap');
    parkingGroup = stadiumModel.getObjectByName('parking');
    initStadiumCrowd(stadiumModel, scene);
    roofOpenGroup = stadiumModel.getObjectByName('roof_open');
    setRoofProgress(roofProgress);
    buildStadiumGates(scene);
    buildControlRooms(scene);
    buildSecurityInterior(scene);
    setMonitorFeedHooks({ beforeFeedRender: prepareMonitorFeed, afterFeedsRender: restoreAfterMonitorFeeds });
    bindControlRoomPick(rendererEl, camera, (roomId) => {
      document.dispatchEvent(new CustomEvent('voc-room-pick', { detail: roomId }));
    });
    bindSecurityMonitorPick(rendererEl, camera, (feedId) => {
      document.dispatchEvent(new CustomEvent('voc-open-stadium-screen', { detail: feedToViewId(feedId) }));
    });
    bindVocEvents();
    showSceneLoading(sceneRefs?.container || container, false);
    applyPageView(defaultSceneViewForPage(currentNavPage), sceneRefs?.container || container);
  });

  const clock = new THREE.Clock();
  let frameId;
  function animate() {
    frameId = requestAnimationFrame(animate);
    pulseMarkers(clock.getElapsedTime());
    controls.update();
    updateShellVisibility(camera, controls);
    updateStadiumCrowd(camera, isCameraViewingInterior(camera, controls));
    if (isSecurityInteriorActive()) {
      updateSecurityMonitors(renderer, scene);
      updateShellVisibility(camera, controls);
      updateStadiumCrowd(camera, isCameraViewingInterior(camera, controls));
    }
    composer.render();
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
      composer.setSize(nw, nh);
    },
    dispose() {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      controls.dispose();
      bloomComposer?.dispose();
      bloomComposer = null;
      floodlightsGroup = null;
      facadeGlassMesh = null;
      facadeMullionsMesh = null;
      facadeTopFrameMesh = null;
      waveRibbonMesh = null;
      roofClosedCap = null;
      parkingGroup = null;
      disposeControlRooms();
      disposeStadiumGates();
      disposeSecurityInterior();
      mainScene = null;
      disposeStadiumCrowd();
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

export function applyPageView(viewId, container) {
  if (!sceneRefs) return;
  currentViewId = viewId;
  setMarkers(resolveMarkersForView(viewId));
  const camKey = stadiumSceneData.cameraPresets[viewId] ? viewId : 'overview';
  tweenCamera(sceneRefs.camera, sceneRefs.controls, camKey).then((hint) => {
    if (hint && currentViewId === viewId) setSceneHint(container || sceneRefs.container, hint);
  });
  updateControlRoomVisibility();
}

export function refreshControlRoomVisibility() {
  updateControlRoomVisibility();
}

function applyRoofState(progress) {
  if (roofOpenGroup) roofOpenGroup.visible = true;
  if (roofClosedCap) roofClosedCap.visible = false;
  if (!roofOpenGroup) return;
  const closedX = domeConfig.panelClosedX ?? domeConfig.panelOpenX ?? 0;
  const openX = domeConfig.panelOpenX ?? closedX;
  const panelX = closedX + (openX - closedX) * progress;
  const closeBlend = 1 - progress;
  const liftT = 1 - ((1 - closeBlend) ** 1.4);
  const panelOpenY = domeConfig.panelOpenY ?? domeConfig.panelY ?? 0;
  const panelClosedY = domeConfig.panelClosedY ?? panelOpenY;
  const panelY = panelOpenY + (panelClosedY - panelOpenY) * liftT;
  const trussOpenY = domeConfig.trussOpenY ?? panelOpenY;
  const trussClosedY = domeConfig.trussClosedY ?? trussOpenY;
  const trussY = trussOpenY + (trussClosedY - trussOpenY) * liftT;
  const panelOpenTilt = domeConfig.panelOpenTilt ?? 0;
  const panelClosedTilt = domeConfig.panelClosedTilt ?? 0;
  const panelTilt = panelOpenTilt + (panelClosedTilt - panelOpenTilt) * liftT;
  const panelW = roofOpenGroup.getObjectByName('roof_panel_west');
  const panelE = roofOpenGroup.getObjectByName('roof_panel_east');
  const ridgeW = roofOpenGroup.getObjectByName('roof_ridge_west');
  const ridgeE = roofOpenGroup.getObjectByName('roof_ridge_east');
  const truss = roofOpenGroup.getObjectByName('roof_truss');
  if (panelW) panelW.position.x = -panelX;
  if (panelE) panelE.position.x = panelX;
  [panelW, panelE].filter(Boolean).forEach((panel) => {
    panel.renderOrder = 4;
    if (panel.material) {
      panel.material.transparent = false;
      panel.material.opacity = 1;
      panel.material.depthWrite = true;
      panel.material.side = THREE.DoubleSide;
      panel.material.needsUpdate = true;
    }
  });
  if (panelW) panelW.position.y = panelY;
  if (panelE) panelE.position.y = panelY;
  if (panelW) panelW.rotation.z = panelTilt;
  if (panelE) panelE.rotation.z = -panelTilt;
  if (ridgeW) ridgeW.position.x = -panelX - domeConfig.ridgeOffset;
  if (ridgeE) ridgeE.position.x = panelX + domeConfig.ridgeOffset;
  if (ridgeW) ridgeW.position.y = panelY + 1.2;
  if (ridgeE) ridgeE.position.y = panelY + 1.2;
  if (ridgeW) ridgeW.rotation.z = panelTilt * 0.92;
  if (ridgeE) ridgeE.rotation.z = -panelTilt * 0.92;
  if (truss) {
    truss.visible = false;
    truss.position.y = trussY - (domeConfig.trussOpenY ?? 0);
  }
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

export function initStadiumScene(navPageId) {
  currentNavPage = navPageId;
  const container = document.querySelector(`#page-${navPageId} [data-mount="stadium-scene"]`);
  if (!container) return;
  if (navPageId === 'overview') {
    document.dispatchEvent(new CustomEvent('voc-room-init'));
  }
  if (activeScene) {
    container.appendChild(rendererEl);
    activeScene.onResize?.();
    if (navPageId !== 'security') applyPageView(defaultSceneViewForPage(navPageId), container);
    updateControlRoomVisibility();
    return;
  }
  try {
    activeScene = createScene(container, navPageId);
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
